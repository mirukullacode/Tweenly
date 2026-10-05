"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { cn } from "@/lib/utils"

export interface PreloaderQuote {
  text: string
  author?: string
}

export interface PreloaderProps {
  /** Page content, rendered underneath and revealed when loading finishes. */
  children?: React.ReactNode
  /** Quotes that cycle while loading. */
  quotes?: PreloaderQuote[]
  /** Length of the simulated load, in seconds. Default: 3 */
  duration?: number
  /** Controlled progress, 0 to 100. When set, the counter follows it instead of simulating. */
  progress?: number
  /** How the loader leaves. Default: "curtain" */
  exit?: "curtain" | "split" | "fade"
  /** Overlay background (any CSS color). Inverts the theme by default. Default: "var(--foreground)" */
  background?: string
  /** Text color. Default: "var(--background)" */
  color?: string
  /** Accent used for the progress line. Default: "#ff6a2b" */
  accent?: string
  /** Show the big percentage counter. Default: true */
  showCounter?: boolean
  /** Prevent page scrolling while loading. Default: true */
  lockScroll?: boolean
  /** "fixed" covers the viewport; "absolute" covers the nearest positioned parent. Default: "fixed" */
  position?: "fixed" | "absolute"
  /** Called once the exit animation has finished. */
  onComplete?: () => void
  className?: string
}

const DEFAULT_QUOTES: PreloaderQuote[] = [
  { text: "Motion is the language of change.", author: "—" },
  { text: "Good design is as little design as possible.", author: "Dieter Rams" },
  { text: "Details are not the details. They make the design.", author: "Charles Eames" },
]

// Uneven pacing reads as "real" loading rather than a linear timer
const LOAD_EASE = [0.65, 0.05, 0.36, 1] as const

export function Preloader({
  children,
  quotes = DEFAULT_QUOTES,
  duration = 3,
  progress,
  exit = "curtain",
  background = "var(--foreground)",
  color = "var(--background)",
  accent = "#ff6a2b",
  showCounter = true,
  lockScroll = true,
  position = "fixed",
  onComplete,
  className,
}: PreloaderProps) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading")
  const [quote, setQuote] = useState(0)
  const value = useMotionValue(0)
  const rounded = useTransform(value, (v) => Math.floor(v).toString().padStart(2, "0"))
  const lineScale = useTransform(value, (v) => v / 100)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Simulated progress
  useEffect(() => {
    if (progress !== undefined) return
    const controls = animate(value, 100, {
      duration: reduced ? 0.4 : duration,
      ease: LOAD_EASE,
      onComplete: () => setTimeout(() => setPhase("leaving"), reduced ? 0 : 350),
    })
    return () => controls.stop()
  }, [progress, duration, reduced, value])

  // Controlled progress
  useEffect(() => {
    if (progress === undefined) return
    const target = Math.min(Math.max(progress, 0), 100)
    const controls = animate(value, target, {
      duration: 0.5,
      ease: "easeOut",
      onComplete: () => target >= 100 && setTimeout(() => setPhase("leaving"), 350),
    })
    return () => controls.stop()
  }, [progress, value])

  // Cycle quotes evenly across the load
  useEffect(() => {
    if (phase !== "loading" || quotes.length < 2 || progress !== undefined) return
    const every = (duration * 1000) / quotes.length
    const id = setInterval(() => setQuote((q) => Math.min(q + 1, quotes.length - 1)), every)
    return () => clearInterval(id)
  }, [phase, quotes.length, duration, progress])

  useEffect(() => {
    if (!lockScroll || position !== "fixed" || phase === "done") return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [lockScroll, position, phase])

  const finish = () => {
    setPhase("done")
    onCompleteRef.current?.()
  }

  const exitAnim =
    reduced || exit === "fade"
      ? { opacity: 0 }
      : exit === "split"
        ? { clipPath: "inset(50% 0% 50% 0%)" }
        : { clipPath: "inset(0% 0% 100% 0%)" }

  const current = quotes[quote]

  return (
    <>
      {children}
      {phase !== "done" && (
        <motion.div
          role="progressbar"
          aria-label="Loading"
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn(
            "inset-0 z-[9998] flex flex-col justify-between overflow-hidden p-6 [container-type:size] sm:p-10",
            position,
            className
          )}
          style={{ background, color, clipPath: "inset(0% 0% 0% 0%)" }}
          animate={phase === "leaving" ? exitAnim : undefined}
          transition={{ duration: reduced ? 0.3 : 0.9, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={() => phase === "leaving" && finish()}
        >
          {/* quote */}
          <div className="mx-auto mt-[18cqh] w-full max-w-xl text-center">
            <AnimatePresence mode="wait">
              {current && (
                <motion.figure
                  key={quote}
                  initial="hidden"
                  animate={phase === "leaving" ? "exit" : "visible"}
                  exit="exit"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: reduced ? 0 : 0.045 } },
                    exit: { opacity: 0, y: -12, filter: "blur(6px)", transition: { duration: 0.35 } },
                  }}
                >
                  <blockquote className="text-balance text-xl font-medium leading-snug tracking-tight sm:text-2xl">
                    {current.text.split(" ").map((word, i) => (
                      <motion.span
                        key={i}
                        className="mr-[0.25em] inline-block"
                        variants={{
                          hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
                          visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </blockquote>
                  {current.author && (
                    <motion.figcaption
                      className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] opacity-50"
                      variants={{ hidden: { opacity: 0 }, visible: { opacity: 0.5, transition: { delay: 0.3 } } }}
                    >
                      {current.author}
                    </motion.figcaption>
                  )}
                </motion.figure>
              )}
            </AnimatePresence>
          </div>

          {/* counter + progress line */}
          <div>
            {showCounter && (
              <motion.div
                className="flex items-end justify-between"
                animate={phase === "leaving" && !reduced ? { y: -40, opacity: 0 } : undefined}
                transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-50">Loading</span>
                <span className="flex items-start font-semibold leading-[0.8] tracking-[-0.06em] tabular-nums">
                  <motion.span className="text-[clamp(4rem,22cqw,15rem)]">{rounded}</motion.span>
                  <span className="mt-[0.3em] text-[clamp(1.25rem,3.5cqw,2.5rem)] opacity-60">%</span>
                </span>
              </motion.div>
            )}
            <div className="mt-6 h-px w-full overflow-hidden" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)` }}>
              <motion.div className="h-full origin-left" style={{ scaleX: lineScale, background: accent }} />
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}
