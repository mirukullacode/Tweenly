"use client"

import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion, type Transition } from "motion/react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type AiThinkingVariant = "shimmer" | "dots" | "orb" | "steps" | "stream"
export type AiThinkingSize = "sm" | "md" | "lg"

export interface AiThinkingProps {
  /** Visual style. Default: "shimmer" */
  variant?: AiThinkingVariant
  /** Text shown by shimmer, dots and orb, and the steps header while running. Default: "Thinking…" for shimmer and steps, none for dots and orb */
  label?: string
  /** Reasoning trace for the steps variant. Default: ["Reading the question", "Searching sources", "Comparing results", "Writing the answer"] */
  steps?: string[]
  /** Controlled index of the active step. Values at or past the end mark every step done. Default: undefined */
  activeStep?: number
  /** Advance steps on a timer when `activeStep` is undefined. Default: true */
  auto?: boolean
  /** Text revealed by the stream variant. Default: a short sample answer */
  text?: string
  /** Stream speed in characters per second. Default: 60 */
  speed?: number
  /** Cycle length in ms for shimmer, dots and orb; time per step for auto steps. Default: 1400 */
  duration?: number
  /** Highlight color for dots, orb, spinner and checks (any CSS color). Default: "#ff4d12" */
  accent?: string
  /** Overall scale. Default: "md" */
  size?: AiThinkingSize
  /** Called once the stream finishes or every step is done. */
  onComplete?: () => void
  /** Additional classes for the root element. Default: undefined */
  className?: string
}

const DEFAULT_STEPS = ["Reading the question", "Searching sources", "Comparing results", "Writing the answer"]
const DEFAULT_TEXT =
  "Motion should explain, not decorate. Start with one clear transition per interaction, keep durations under 400ms, and let springs carry the weight so every change feels physical."

const ease = [0.22, 1, 0.36, 1] as const
const inOut = [0.76, 0, 0.24, 1] as const
const spring: Transition = { type: "spring", stiffness: 450, damping: 34 }

const TEXT = { sm: "text-xs", md: "text-sm", lg: "text-base" } as const
const DOT = { sm: 5, md: 7, lg: 9 } as const
const ORB = { sm: 14, md: 20, lg: 28 } as const

function Spinner({ accent, px }: { accent: string; px: number }) {
  return (
    <motion.svg
      viewBox="0 0 16 16"
      width={px}
      height={px}
      fill="none"
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity={0.18} strokeWidth={2} />
      <path d="M8 2a6 6 0 0 1 6 6" stroke={accent} strokeWidth={2} strokeLinecap="round" />
    </motion.svg>
  )
}

function DrawnCheck({ accent, px, instant }: { accent: string; px: number; instant: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width={px} height={px} fill="none" aria-hidden>
      <motion.circle
        cx="8"
        cy="8"
        r="7"
        fill={accent}
        initial={{ scale: instant ? 1 : 0.4, opacity: instant ? 1 : 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={instant ? { duration: 0 } : spring}
        style={{ transformOrigin: "8px 8px" }}
      />
      <motion.path
        d="M4.8 8.3 7 10.4l4.2-4.6"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: instant ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={instant ? { duration: 0 } : { duration: 0.32, ease, delay: 0.08 }}
      />
    </svg>
  )
}

export function AiThinking({
  variant = "shimmer",
  label,
  steps = DEFAULT_STEPS,
  activeStep,
  auto = true,
  text = DEFAULT_TEXT,
  speed = 60,
  duration = 1400,
  accent = "#ff4d12",
  size = "md",
  onComplete,
  className,
}: AiThinkingProps) {
  const reduced = useReducedMotion()
  const cycle = Math.max(200, duration) / 1000

  if (variant === "steps") {
    return (
      <Steps
        label={label ?? "Thinking…"}
        steps={steps}
        activeStep={activeStep}
        auto={auto}
        duration={Math.max(200, duration)}
        accent={accent}
        size={size}
        reduced={reduced}
        onComplete={onComplete}
        className={className}
      />
    )
  }

  if (variant === "stream") {
    return <Stream text={text} speed={speed} size={size} reduced={reduced} onComplete={onComplete} className={className} />
  }

  if (variant === "dots" || variant === "orb") {
    const d = DOT[size]
    const o = ORB[size]
    return (
      <div role="status" aria-live="polite" className={cn("inline-flex items-center gap-2.5 text-muted-foreground", TEXT[size], className)}>
        {variant === "dots" ? (
          <span className="inline-flex items-end" style={{ gap: d * 0.7, height: d * 2.6 }} aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block rounded-full"
                style={{ width: d, height: d, backgroundColor: accent }}
                animate={reduced ? { opacity: [0.4, 1, 0.4] } : { y: [0, -d * 1.2, 0, 0], opacity: [0.55, 1, 0.55, 0.55] }}
                transition={{ duration: cycle * 0.75, times: reduced ? undefined : [0, 0.28, 0.6, 1], repeat: Infinity, delay: i * cycle * 0.12, ease: [0.34, 1.4, 0.64, 1] }}
              />
            ))}
          </span>
        ) : (
          <span className="relative inline-grid place-items-center" style={{ width: o * 1.9, height: o * 1.9 }} aria-hidden>
            <motion.span
              className="absolute rounded-full"
              style={{ width: o, height: o, backgroundColor: accent }}
              animate={reduced ? { opacity: 0.2 } : { scale: [1, 1.9], opacity: [0.35, 0] }}
              transition={{ duration: cycle, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute rounded-full blur-[6px]"
              style={{ width: o, height: o, backgroundColor: accent }}
              animate={reduced ? { opacity: 0.5 } : { opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: cycle, repeat: Infinity, ease: inOut }}
            />
            <motion.span
              className="absolute rounded-full"
              style={{ width: o * 0.62, height: o * 0.62, backgroundColor: accent }}
              animate={reduced ? undefined : { scale: [1, 1.12, 1] }}
              transition={{ duration: cycle, repeat: Infinity, ease: inOut }}
            />
            <motion.span
              className="absolute inset-0"
              animate={reduced ? undefined : { rotate: 360 }}
              transition={{ duration: cycle * 1.6, repeat: Infinity, ease: "linear" }}
            >
              <span
                className="absolute left-1/2 top-0 block -translate-x-1/2 rounded-full bg-foreground"
                style={{ width: Math.max(3, o * 0.18), height: Math.max(3, o * 0.18) }}
              />
            </motion.span>
          </span>
        )}
        {label ? <span>{label}</span> : <span className="sr-only">Thinking</span>}
      </div>
    )
  }

  // Shimmer: a light sweep across glyphs
  const content = label ?? "Thinking…"
  const glyphs = Array.from(content)
  const stagger = (cycle * 0.5) / Math.max(1, glyphs.length)
  return (
    <span role="status" aria-live="polite" aria-label={content} className={cn("inline-flex font-medium text-foreground", TEXT[size], className)}>
      {glyphs.map((g, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="whitespace-pre"
          initial={{ opacity: 0.35 }}
          animate={reduced ? { opacity: 0.6 } : { opacity: [0.35, 1, 0.35, 0.35] }}
          transition={reduced ? { duration: 0 } : { duration: cycle, times: [0, 0.18, 0.4, 1], repeat: Infinity, delay: i * stagger, ease: "linear" }}
        >
          {g}
        </motion.span>
      ))}
    </span>
  )
}

function Steps({
  label,
  steps,
  activeStep,
  auto,
  duration,
  accent,
  size,
  reduced,
  onComplete,
  className,
}: {
  label: string
  steps: string[]
  activeStep?: number
  auto: boolean
  duration: number
  accent: string
  size: AiThinkingSize
  reduced: boolean
  onComplete?: () => void
  className?: string
}) {
  const id = useId()
  const key = steps.join("\u0000")
  const [inner, setInner] = useState(0)
  const [open, setOpen] = useState(true)
  const [secs, setSecs] = useState<number | null>(null)
  const [prevKey, setPrevKey] = useState(key)
  if (prevKey !== key) {
    setPrevKey(key)
    setInner(0)
    setOpen(true)
    setSecs(null)
  }

  const controlled = activeStep !== undefined
  const current = Math.max(0, Math.min(steps.length, controlled ? activeStep : inner))
  const done = current >= steps.length

  // Auto advance
  useEffect(() => {
    if (controlled || !auto || done) return
    const t = setTimeout(() => setInner((v) => v + 1), duration)
    return () => clearTimeout(t)
  }, [controlled, auto, done, current, duration])

  // Measure thinking time; collapse shortly after completion
  const startRef = useRef(0)
  const completeRef = useRef(onComplete)
  useEffect(() => {
    completeRef.current = onComplete
  })
  useEffect(() => {
    if (!done) startRef.current = Date.now()
  }, [done, key])
  useEffect(() => {
    if (!done) return
    const fallback = (steps.length * duration) / 1000
    const t = setTimeout(() => {
      setSecs(Math.max(1, Math.round(startRef.current ? (Date.now() - startRef.current) / 1000 : fallback)))
      setOpen(false)
      completeRef.current?.()
    }, 600)
    return () => clearTimeout(t)
  }, [done, key, steps.length, duration])

  const fs = TEXT[size]
  const icon = size === "sm" ? 14 : size === "lg" ? 18 : 16
  const visible = steps.slice(0, Math.min(steps.length, current + 1))
  const t = (tr: Transition): Transition => (reduced ? { duration: 0 } : tr)

  return (
    <div className={cn("w-full max-w-sm", fs, className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="group inline-flex items-center gap-1.5 rounded-md py-1 font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span role="status" aria-live="polite" className="relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={done && secs !== null ? "done" : "run"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={t({ duration: 0.3, ease })}
              className="inline-block"
            >
              {done && secs !== null ? `Thought for ${secs}s` : label}
            </motion.span>
          </AnimatePresence>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={t(spring)} className="inline-grid">
          <ChevronDown className="size-3.5" aria-hidden />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={t({ duration: 0.4, ease: inOut })}
            className="overflow-hidden"
          >
            <ol className="relative mt-1.5 pl-0.5">
              <AnimatePresence initial={false}>
                {visible.map((s, i) => {
                  const isDone = i < current
                  const last = i === visible.length - 1
                  return (
                    <motion.li
                      key={`${i}-${s}`}
                      initial={{ opacity: 0, height: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={t({ duration: 0.45, ease })}
                      className="relative flex gap-3 overflow-hidden"
                    >
                      <span className="relative flex flex-col items-center pt-0.5">
                        <span className="grid place-items-center text-foreground" style={{ width: icon, height: icon }}>
                          {isDone ? <DrawnCheck accent={accent} px={icon} instant={reduced} /> : <Spinner accent={accent} px={icon} />}
                        </span>
                        {!last && <span aria-hidden className="mt-1 w-px flex-1 bg-border" />}
                      </span>
                      <span className={cn("pb-3 leading-5 transition-colors duration-300", isDone ? "text-muted-foreground" : "text-foreground")}>
                        {s}
                      </span>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Stream({
  text,
  speed,
  size,
  reduced,
  onComplete,
  className,
}: {
  text: string
  speed: number
  size: AiThinkingSize
  reduced: boolean
  onComplete?: () => void
  className?: string
}) {
  const [count, setCount] = useState(0)
  const [prevText, setPrevText] = useState(text)
  if (prevText !== text) {
    setPrevText(text)
    setCount(0)
  }
  const total = text.length
  const shown = reduced ? total : Math.min(count, total)
  const finished = shown >= total

  useEffect(() => {
    if (reduced || count >= total) return
    const cps = Math.max(1, speed)
    // Tokens arrive in uneven bursts, like a real model
    const burst = 2 + ((count * 7) % 5)
    const t = setTimeout(() => setCount((c) => Math.min(total, c + burst)), (burst / cps) * 1000)
    return () => clearTimeout(t)
  }, [count, total, speed, reduced])

  const completeRef = useRef(onComplete)
  useEffect(() => {
    completeRef.current = onComplete
  })
  useEffect(() => {
    if (!finished || !total) return
    const t = setTimeout(() => completeRef.current?.(), 0)
    return () => clearTimeout(t)
  }, [finished, total, text])

  // Split the revealed text into word tokens so each fades in once
  const visible = text.slice(0, shown)
  const tokens = visible.match(/\S+\s*|\s+/g) ?? []

  return (
    <p className={cn("leading-relaxed text-foreground", TEXT[size], className)} aria-live="polite" aria-busy={!finished}>
      {tokens.map((tok, i) => (
        <motion.span
          key={i}
          initial={reduced ? false : { opacity: 0, filter: "blur(3px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.35, ease }}
          className="whitespace-pre-wrap"
        >
          {tok}
        </motion.span>
      ))}
      <AnimatePresence>
        {!finished && (
          <motion.span
            key="caret"
            aria-hidden
            className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] rounded-full bg-foreground"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, times: [0, 0.5, 0.6, 1], repeat: Infinity, ease: "linear" }}
          />
        )}
      </AnimatePresence>
    </p>
  )
}
