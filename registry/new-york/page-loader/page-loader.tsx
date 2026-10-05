"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

gsap.registerPlugin(useGSAP)

export type PageLoaderVariant = "stairs" | "counter" | "words" | "iris" | "blinds"
export type PageLoaderEase = "power4" | "expo" | "circ" | "sine"

export interface PageLoaderProps {
  /** Visual style of the loader and its exit. Default: "stairs" */
  variant?: PageLoaderVariant
  /** Page content, rendered underneath and revealed when loading finishes. */
  children?: React.ReactNode
  /** Length of the simulated load, in seconds. Default: 2.4 */
  duration?: number
  /** Controlled progress, 0 to 100. When set, the loader follows it and exits at 100. */
  progress?: number
  /** Words flashed in sequence by the "words" variant. Default: ["Hello", "Bonjour", "Ciao", "Hola", "Hallo", "Olá", "こんにちは"] */
  words?: string[]
  /** Number of columns ("stairs") or bars ("blinds"). Default: 5 */
  columns?: number
  /** Loader background (any CSS color). Inverts the theme by default. Default: "var(--foreground)" */
  background?: string
  /** Text color. Default: "var(--background)" */
  color?: string
  /** Accent used for progress marks. Default: "#ff4d12" */
  accent?: string
  /** GSAP ease family used for the intro and exit. Default: "power4" */
  ease?: PageLoaderEase
  /** Length of the exit animation, in seconds. Default: 1 */
  exitDuration?: number
  /** Small label shown while loading. Default: "Loading" */
  label?: string
  /** Show the percentage counter. Default: true */
  showCounter?: boolean
  /** Prevent page scrolling while loading (fixed position only). Default: true */
  lockScroll?: boolean
  /** "fixed" covers the viewport; "absolute" covers the nearest positioned parent. Default: "fixed" */
  position?: "fixed" | "absolute"
  /** Called once the exit animation has finished. */
  onComplete?: () => void
  /** Additional classes for the overlay. */
  className?: string
}

const DEFAULT_WORDS = ["Hello", "Bonjour", "Ciao", "Hola", "Hallo", "Olá", "こんにちは"]
const TICKS = 60
// Staged checkpoints read as "real" loading rather than a linear timer: [progress, share of time]
const STAGES: [number, number][] = [
  [22, 0.3],
  [58, 0.3],
  [83, 0.2],
  [100, 0.2],
]

const pad = (v: number) => Math.floor(v).toString().padStart(2, "0")

/** Rectangle with a circular hole, as an even-odd polygon (clip-path can't subtract a circle). */
function holePolygon(w: number, h: number, cx: number, cy: number, r: number, steps = 72) {
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)}px ${(cy + Math.sin(a) * r).toFixed(1)}px`)
  }
  return `polygon(evenodd, 0px 0px, ${w}px 0px, ${w}px ${h}px, 0px ${h}px, 0px 0px, ${pts.join(", ")}, 0px 0px)`
}

/** Overflow mask whose content rises in on intro and out on exit. */
function Mask({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("block overflow-hidden", className)}>
      <span data-pl-rise className="block">
        {children}
      </span>
    </span>
  )
}

export function PageLoader({
  variant = "stairs",
  children,
  duration = 2.4,
  progress,
  words = DEFAULT_WORDS,
  columns = 5,
  background = "var(--foreground)",
  color = "var(--background)",
  accent = "#ff4d12",
  ease = "power4",
  exitDuration = 1,
  label = "Loading",
  showCounter = true,
  lockScroll = true,
  position = "fixed",
  onComplete,
  className,
}: PageLoaderProps) {
  const reduced = useReducedMotion()
  const [done, setDone] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)
  const progressRef = useRef(progress)
  const loadToRef = useRef<((target: number) => void) | null>(null)
  const controlled = progress !== undefined
  const count = Math.max(1, Math.round(columns))
  const wordList = words.length ? words : DEFAULT_WORDS

  // Declared before useGSAP so the latest values are in place when the timeline is built
  useLayoutEffect(() => {
    onCompleteRef.current = onComplete
    progressRef.current = progress
  }, [onComplete, progress])

  useGSAP(
    (_ctx, contextSafe) => {
      const root = rootRef.current
      if (!root || !contextSafe) return
      const q = gsap.utils.selector(root)
      const inOut = `${ease}.inOut`
      const out = `${ease}.out`
      const exitD = reduced ? 0.35 : Math.max(0.2, exitDuration)
      const proxy = { v: 0 }

      const counters = q("[data-pl-count]")
      const lines = q("[data-pl-line]")
      const ticks = q("[data-pl-tick]")
      const strips = q("[data-pl-strip]")
      const digits = [-1, -1, -1]
      let lit = -1

      const render = () => {
        const v = proxy.v
        const text = pad(v)
        for (const el of counters) el.textContent = text
        if (lines.length) gsap.set(lines, { scaleX: v / 100 })
        if (ticks.length) {
          const n = Math.round((v / 100) * TICKS)
          if (n !== lit) {
            gsap.set(ticks, { opacity: (i: number) => (i < n ? 1 : 0) })
            lit = n
          }
        }
        if (strips.length) {
          const f = Math.floor(v)
          const next = [f >= 100 ? 1 : 0, Math.floor(f / 10) % 10, f % 10]
          strips.forEach((strip, i) => {
            if (next[i] === digits[i]) return
            digits[i] = next[i]
            // hundreds strip has two cells, the others ten
            gsap.to(strip, { yPercent: -next[i] * (i === 0 ? 50 : 10), duration: 0.6, ease: "expo.out", overwrite: true })
          })
        }
      }
      render()

      // ---------- exit ----------
      const exit = gsap.timeline({
        paused: true,
        onComplete: () => {
          setDone(true)
          onCompleteRef.current?.()
        },
      })
      const rise = q("[data-pl-rise]")

      if (reduced) {
        exit.to(root, { opacity: 0, duration: exitD, ease: "power1.out" })
      } else if (variant === "stairs") {
        const cols = q("[data-pl-col]")
        exit
          .set(cols, { willChange: "transform" })
          .to(rise, { yPercent: -110, duration: 0.6, ease: "power3.in", stagger: 0.05 })
          .to(cols, { yPercent: -100, duration: exitD, ease: inOut, stagger: exitD * 0.09 }, "-=0.2")
      } else if (variant === "counter") {
        const panel = q("[data-pl-panel]")[0]
        const edge = { l: 100, r: 100 }
        const clip = () => {
          panel.style.clipPath = `polygon(0% 0%, 100% 0%, 100% ${edge.r}%, 0% ${edge.l}%)`
        }
        exit
          .to(rise, { yPercent: -110, duration: 0.55, ease: "power3.in", stagger: 0.06 })
          .to(q("[data-pl-track]"), { scaleX: 0, transformOrigin: "100% 50%", duration: 0.5, ease: "power3.in" }, "<")
          .to(edge, { r: 0, duration: exitD, ease: inOut, onUpdate: clip }, "-=0.15")
          .to(edge, { l: 0, duration: exitD, ease: inOut, onUpdate: clip }, `<${exitD * 0.2}`)
      } else if (variant === "words") {
        const panel = q("[data-pl-panel]")
        exit
          .to(q("[data-pl-content]"), { opacity: 0, y: -24, duration: 0.4, ease: "power2.in" })
          .set(panel, { willChange: "transform" })
          .to(panel, { yPercent: -100, duration: exitD, ease: inOut }, "-=0.05")
          .to(q("[data-pl-curve]"), { scaleY: 0, duration: exitD, ease: inOut }, "<")
      } else if (variant === "iris") {
        const panel = q("[data-pl-panel]")[0]
        const size = { w: 0, h: 0, max: 0 }
        const hole = { r: 0 }
        exit
          .to(q("[data-pl-dial]"), { scale: 0.86, opacity: 0, duration: 0.5, ease: "power3.in" })
          .to(rise, { yPercent: -110, duration: 0.45, ease: "power3.in" }, "<")
          .call(() => {
            size.w = panel.offsetWidth
            size.h = panel.offsetHeight
            size.max = Math.hypot(size.w, size.h) / 2 + 2
          })
          .to(hole, {
            r: () => size.max,
            duration: exitD,
            ease: inOut,
            onUpdate: () => {
              panel.style.clipPath = holePolygon(size.w, size.h, size.w / 2, size.h / 2, hole.r)
            },
          })
      } else {
        const bars = q("[data-pl-bar]")
        exit
          .to(q("[data-pl-track]"), { scaleX: 0, transformOrigin: "100% 50%", duration: 0.5, ease: "power3.in" })
          .to(rise, { yPercent: -110, duration: 0.45, ease: "power3.in", stagger: 0.04 }, "<")
          .set(bars, { willChange: "transform" })
          .to(
            bars,
            {
              scaleY: 0,
              transformOrigin: (i: number) => (i % 2 ? "50% 100%" : "50% 0%"),
              duration: exitD,
              ease: inOut,
              stagger: { each: exitD * 0.08, from: "center" },
            },
            "-=0.15",
          )
      }

      let exiting = false
      const startExit = contextSafe(() => {
        if (exiting) return
        exiting = true
        gsap.delayedCall(reduced ? 0 : 0.3, () => exit.play())
      })

      // ---------- intro ----------
      if (!reduced) {
        gsap.from(rise, { yPercent: 110, duration: 0.9, ease: out, stagger: 0.08, delay: 0.1 })
        gsap.from(q("[data-pl-dial]"), { scale: 0.9, opacity: 0, duration: 1, ease: out })
      }

      // ---------- words ----------
      const wordEls = q("[data-pl-word]")
      if (wordEls.length) {
        gsap.set(wordEls, { opacity: 0, yPercent: 40 })
        const per = Math.max(0.16, (reduced ? 0.4 : duration) / wordEls.length)
        const seq = gsap.timeline({ repeat: controlled ? -1 : 0 })
        wordEls.forEach((el, i) => {
          seq.to(el, { opacity: 1, yPercent: 0, duration: 0.16, ease: "power2.out" }, i * per)
          if (i < wordEls.length - 1 || controlled) {
            seq.to(el, { opacity: 0, yPercent: -40, duration: 0.14, ease: "power2.in" }, (i + 1) * per - 0.14)
          }
        })
      }

      // ---------- load ----------
      if (controlled) {
        loadToRef.current = contextSafe((target: number) => {
          const t = Math.min(Math.max(target, 0), 100)
          gsap.to(proxy, {
            v: t,
            duration: 0.6,
            ease: "power2.out",
            overwrite: true,
            onUpdate: render,
            onComplete: () => {
              if (t >= 100) startExit()
            },
          })
        })
        loadToRef.current(progressRef.current ?? 0)
      } else {
        const total = reduced ? 0.4 : Math.max(0.2, duration)
        const load = gsap.timeline({ onComplete: startExit })
        for (const [v, share] of STAGES) load.to(proxy, { v, duration: total * share, ease: "power2.out", onUpdate: render })
      }

      return () => {
        loadToRef.current = null
      }
    },
    {
      scope: rootRef,
      dependencies: [variant, duration, controlled, count, ease, exitDuration, reduced, wordList.join("|"), showCounter],
      revertOnUpdate: true,
    },
  )

  // Controlled progress updates
  useEffect(() => {
    if (progress !== undefined) loadToRef.current?.(progress)
  }, [progress])

  useEffect(() => {
    if (!lockScroll || position !== "fixed" || done) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [lockScroll, position, done])

  const mono = "font-mono text-[11px] uppercase tracking-[0.2em]"
  const display = "font-[family-name:var(--font-display)] font-semibold tabular-nums"
  const faint = `color-mix(in oklab, ${color} 14%, transparent)`
  const Label = (
    <Mask>
      <span className={cn("flex items-center gap-2 opacity-60", mono)}>
        <span className="size-1.5 rounded-full" style={{ background: accent }} />
        {label}
      </span>
    </Mask>
  )

  let body: React.ReactNode
  if (variant === "stairs") {
    body = (
      <>
        <div className="absolute inset-0 flex">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} data-pl-col className="-mr-px h-full flex-1" style={{ background }} />
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10">
          {Label}
          {showCounter && (
            <Mask className="pb-[0.04em]">
              <span className={cn("flex items-start leading-[0.8]", display)}>
                <span data-pl-count className="text-[clamp(5rem,26cqw,18rem)] tracking-[-0.02em]">
                  00
                </span>
                <span className="mt-[0.2em] text-[clamp(1.25rem,4cqw,3rem)]" style={{ color: accent }}>
                  %
                </span>
              </span>
            </Mask>
          )}
        </div>
      </>
    )
  } else if (variant === "counter") {
    body = (
      <div
        data-pl-panel
        className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10"
        style={{ background, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
      >
        {Label}
        <div className="flex items-end justify-between gap-6">
          <div data-pl-track className="mb-[1.2cqh] h-px w-[28%] overflow-hidden" style={{ background: faint }}>
            <div data-pl-line className="h-full origin-left" style={{ background: accent, transform: "scaleX(0)" }} />
          </div>
          {showCounter && (
            <Mask>
              <div className={cn("flex items-start leading-none", display)} aria-hidden>
                {[2, 10, 10].map((cells, i) => (
                  <span key={i} className="block h-[1em] overflow-hidden text-[clamp(5rem,30cqw,20rem)] tracking-normal">
                    <span data-pl-strip className="flex flex-col">
                      {Array.from({ length: cells }, (_, d) => (
                        <span key={d} className="block h-[1em] w-[0.5em] text-center leading-none">
                          {i === 0 ? (d ? "1" : "") : d}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
                <span className="mt-[0.15em] text-[clamp(1.25rem,5cqw,3.5rem)] leading-none" style={{ color: accent }}>
                  %
                </span>
              </div>
            </Mask>
          )}
        </div>
      </div>
    )
  } else if (variant === "words") {
    body = (
      <div data-pl-panel className="absolute inset-0" style={{ background }}>
        <div data-pl-content className="absolute inset-0 grid place-items-center">
          <p className="flex items-center gap-[0.35em] text-[clamp(2rem,7cqw,4.5rem)] font-medium tracking-tight">
            <span className="size-[0.2em] shrink-0 rounded-full" style={{ background: accent }} />
            <span className="grid">
              {wordList.map((w, i) => (
                <span key={i} data-pl-word className="whitespace-nowrap opacity-0 [grid-area:1/1]">
                  {w}
                </span>
              ))}
            </span>
          </p>
          {showCounter && (
            <span className={cn("absolute bottom-6 right-6 opacity-50 sm:bottom-10 sm:right-10", mono)}>
              <span data-pl-count>00</span>%
            </span>
          )}
        </div>
        <div
          data-pl-curve
          aria-hidden
          className="absolute left-[-25%] top-[calc(100%-1px)] h-[22cqh] w-[150%] origin-top rounded-b-[100%]"
          style={{ background }}
        />
      </div>
    )
  } else if (variant === "iris") {
    body = (
      <div data-pl-panel className="absolute inset-0 grid place-items-center" style={{ background }}>
        <div className="flex flex-col items-center gap-8">
          <div data-pl-dial className="relative size-[min(36cqw,36cqh)] min-h-28 min-w-28">
            <div className="absolute inset-[3.5%] rounded-full border" style={{ borderColor: faint }} />
            {Array.from({ length: TICKS }, (_, i) => (
              <div key={i} className="absolute inset-0" style={{ transform: `rotate(${(i / TICKS) * 360}deg)` }}>
                <div
                  data-pl-tick
                  className="absolute left-1/2 top-0 h-[7%] w-px -translate-x-1/2 opacity-0"
                  style={{ background: accent }}
                />
              </div>
            ))}
            {showCounter && (
              <span
                className={cn(
                  "absolute inset-0 grid place-items-center text-[clamp(2.5rem,10cqmin,5.5rem)] leading-none",
                  display,
                )}
              >
                <span>
                  <span data-pl-count>00</span>
                  <span className="text-[0.4em] opacity-50">%</span>
                </span>
              </span>
            )}
          </div>
          {Label}
        </div>
      </div>
    )
  } else {
    body = (
      <>
        <div className="absolute inset-0 flex flex-col">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} data-pl-bar className="-mb-px w-full flex-1" style={{ background }} />
          ))}
        </div>
        <div className="absolute inset-x-[8%] top-1/2 -translate-y-1/2">
          <div className="mb-4 flex items-end justify-between">
            {Label}
            {showCounter && (
              <Mask>
                <span className={cn("block text-[clamp(1.75rem,6cqw,3.5rem)] leading-none", display)}>
                  <span data-pl-count>00</span>
                  <span className="text-[0.5em] opacity-50">%</span>
                </span>
              </Mask>
            )}
          </div>
          <div data-pl-track className="h-px w-full overflow-hidden" style={{ background: faint }}>
            <div data-pl-line className="h-full origin-left" style={{ background: accent, transform: "scaleX(0)" }} />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {children}
      {!done && (
        <div
          ref={rootRef}
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn("inset-0 z-[9998] overflow-hidden [container-type:size]", position, className)}
          style={{ color }}
        >
          {body}
        </div>
      )}
    </>
  )
}
