"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface ArcStep {
  title: string
  description: string
  /** Solid background color of the whole section while this step is active. */
  color: string
  /** Text color on this step. Defaults to black or white, whichever contrasts best with `color`. */
  foreground?: string
  icon?: ReactNode
}

/** Solid, tasteful step colors with matching ink. */
export const ARC_STEPS_PALETTE = [
  { color: "#0a0a0a", foreground: "#ededed" },
  { color: "#ff4d12", foreground: "#0a0a0a" },
  { color: "#f5f0e8", foreground: "#0a0a0a" },
  { color: "#1f3a2e", foreground: "#f5f0e8" },
  { color: "#2b2bd9", foreground: "#ffffff" },
] as const

export type ArcStepsPosition = "bottom" | "top" | "left" | "right"

export interface ArcStepsProps {
  /** Steps in order: { title, description, color, foreground?, icon? }. */
  steps: ArcStep[]
  /** Edge the half circle hugs. Bottom reads like a horizon, left/right put the content beside the arc. Default: "bottom" */
  position?: ArcStepsPosition
  /** Text alignment of the step content. Default: "center" */
  align?: "start" | "center" | "end"
  /** Arc radius as a % of the section's shorter side (clamped so it always fits). Default: 70 */
  arcSize?: number
  /** Arc stroke width in px. Default: 1.5 */
  strokeWidth?: number
  /** Diameter of the travelling marker in px. Default: 16 */
  markerSize?: number
  /** Show step numbers next to each point on the arc. Default: true */
  showNumbers?: boolean
  /** Snap the scroll to the nearest step when scrolling stops. Default: false */
  snap?: boolean
  /** Section heights of scroll reserved per step. Default: 1 */
  scrollLength?: number
  /** Duration of the background color change in seconds. Default: 0.8 */
  colorTransition?: number
  /** Small heading shown in the corner. Default: "How it works" */
  title?: string
  /** Scroll container to track instead of the window. Default: window */
  scroller?: HTMLElement | null
  /** Called with the step index whenever the active step changes. */
  onStepChange?: (index: number) => void
  /** Height of the pinned section (any CSS length). Default: "100vh" */
  height?: string
  /** Additional classes for the section. */
  className?: string
}

const GEOMETRY: Record<
  ArcStepsPosition,
  { a0: number; da: number; viewBox: string; origin: { left: string; top: string } }
> = {
  bottom: { a0: 180, da: 180, viewBox: "-100 -100 200 100", origin: { left: "50%", top: "100%" } },
  top: { a0: 180, da: -180, viewBox: "-100 0 200 100", origin: { left: "50%", top: "0%" } },
  left: { a0: -90, da: 180, viewBox: "0 -100 100 200", origin: { left: "0%", top: "50%" } },
  right: { a0: -90, da: -180, viewBox: "-100 -100 100 200", origin: { left: "100%", top: "50%" } },
}

const round = (v: number) => Math.round(v * 1000) / 1000

function pointAt(deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: round(100 * Math.cos(a)), y: round(100 * Math.sin(a)) }
}

/** Black or white ink, whichever reads better on a hex color. */
function readableOn(color: string) {
  const hex = color.trim().replace(/^#/, "")
  const full = hex.length === 3 || hex.length === 4 ? hex.slice(0, 3).split("").map((c) => c + c).join("") : hex.slice(0, 6)
  if (!/^[0-9a-f]{6}$/i.test(full)) return "#ededed"
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#0a0a0a" : "#ededed"
}

const ink = (step: ArcStep) => step.foreground ?? readableOn(step.color)
const pad = (n: number) => String(n).padStart(2, "0")

function StepBody({ step, index, align }: { step: ArcStep; index: number; align: "start" | "center" | "end" }) {
  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] opacity-70",
          align === "center" && "justify-center",
          align === "end" && "justify-end"
        )}
      >
        {step.icon && <span className="inline-flex size-4 items-center justify-center [&_svg]:size-4">{step.icon}</span>}
        <span>Step {pad(index + 1)}</span>
      </div>
      <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.875rem,7.5cqmin,4.75rem)] font-semibold leading-[0.95] tracking-[-0.02em]">
        {step.title}
      </h3>
      <p
        className={cn(
          "mt-3 max-w-[40ch] text-[clamp(0.875rem,2.2cqmin,1.125rem)] leading-relaxed opacity-75",
          align === "center" && "mx-auto",
          align === "end" && "ml-auto"
        )}
      >
        {step.description}
      </p>
    </>
  )
}

/**
 * Pinned "How it works" section. A marker travels along a half circle from step
 * to step as you scroll, the passed arc draws in, and the whole section flips to
 * each step's solid color.
 */
export function ArcSteps({
  steps,
  position = "bottom",
  align = "center",
  arcSize = 70,
  strokeWidth = 1.5,
  markerSize = 16,
  showNumbers = true,
  snap = false,
  scrollLength = 1,
  colorTransition = 0.8,
  title = "How it works",
  scroller,
  onStepChange,
  height = "100vh",
  className,
}: ArcStepsProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const armRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<SVGPathElement>(null)
  const activeRef = useRef(0)
  const prevRef = useRef(0)
  const onStepChangeRef = useRef(onStepChange)
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  const n = steps.length

  useEffect(() => {
    onStepChangeRef.current = onStepChange
  }, [onStepChange])

  const geo = GEOMETRY[position]

  // The fill path can't use non-scaling-stroke: browsers then measure dashes in
  // screen pixels and the 0..1 pathLength pattern repeats along the arc. Instead,
  // keep its width in arc units (radius 100) and rescale it to match on resize.
  useEffect(() => {
    const fill = fillRef.current
    const box = fill?.ownerSVGElement?.parentElement
    if (!fill || !box) return
    const sync = () => {
      const r = Math.max(box.clientWidth, box.clientHeight) / 2
      if (r > 0) fill.setAttribute("stroke-width", String((strokeWidth * 100) / r))
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(box)
    return () => ro.disconnect()
  }, [strokeWidth, position])
  const angleAt = (i: number) => geo.a0 + (n > 1 ? i / (n - 1) : 0) * geo.da
  const start = pointAt(geo.a0)
  const end = pointAt(geo.a0 + geo.da)
  const arcPath = `M ${start.x} ${start.y} A 100 100 0 0 ${geo.da > 0 ? 1 : 0} ${end.x} ${end.y}`
  const horizontal = position === "bottom" || position === "top"

  // Scroll-linked pin: marker rotation + arc draw-in, with a short dwell on every point
  useGSAP(
    () => {
      const section = sectionRef.current
      const arm = armRef.current
      const fill = fillRef.current
      if (reduced || !section || !arm || !fill || n === 0) return

      const MOVE = 0.6
      gsap.set(arm, { rotation: angleAt(0) })
      // Tween the SVG attribute: CSSPlugin rounds px values, which would snap 0.33 to 0
      gsap.set(fill, { attr: { "stroke-dashoffset": 1 } })

      const tl = gsap.timeline({
        defaults: { ease: "power4.inOut", duration: MOVE },
        scrollTrigger: {
          trigger: section,
          scroller: scroller ?? undefined,
          start: "top top",
          end: () => `+=${section.offsetHeight * scrollLength * n}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          snap:
            snap && n > 1
              ? { snapTo: "labelsDirectional", duration: { min: 0.2, max: 0.7 }, delay: 0.05, ease: "power4.inOut" }
              : undefined,
        },
        onUpdate: () => {
          const next = Math.min(n - 1, Math.max(0, Math.floor(tl.time() + 1e-4)))
          if (next === activeRef.current) return
          activeRef.current = next
          setActive(next)
          onStepChangeRef.current?.(next)
        },
      })

      // Each step owns one unit of the timeline; moves are centered on the boundaries
      for (let i = 0; i < n; i++) {
        tl.addLabel(`step-${i}`, i + 0.5)
        if (i === 0) continue
        tl.to(arm, { rotation: angleAt(i) }, i - MOVE / 2)
        tl.to(fill, { attr: { "stroke-dashoffset": 1 - i / (n - 1) } }, i - MOVE / 2)
      }
      tl.set({}, {}, n)

      const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 100)
      return () => window.clearTimeout(refreshTimer)
    },
    {
      scope: sectionRef,
      dependencies: [n, position, scrollLength, snap, scroller, reduced],
      revertOnUpdate: true,
    }
  )

  // A pin adds spacing that moves everything below it. Re-sort and refresh all
  // triggers after this section (re)builds, so later pinned sections recompute
  // their start instead of pinning too early and overlapping this one.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
    })
    return () => cancelAnimationFrame(id)
  }, [n, position, scrollLength, snap, scroller, reduced])

  // Solid background flip + content crossfade on every step change
  useGSAP(
    () => {
      const section = sectionRef.current
      const step = steps[active]
      if (reduced || !section || !step) return

      gsap.to(section, {
        backgroundColor: step.color,
        color: ink(step),
        duration: colorTransition,
        ease: "power4.inOut",
        overwrite: "auto",
      })

      const dir = active >= prevRef.current ? 1 : -1
      const changed = active !== prevRef.current
      prevRef.current = active
      if (!changed) return

      gsap.utils.toArray<HTMLElement>("[data-arc-content]", section).forEach((el, i) => {
        if (i === active) {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 28 * dir },
            { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.12, ease: "expo.out", overwrite: true }
          )
        } else if (el.style.visibility !== "hidden") {
          gsap.to(el, { autoAlpha: 0, y: -20 * dir, duration: 0.35, ease: "power2.in", overwrite: true })
        }
      })
    },
    { scope: sectionRef, dependencies: [active, steps, colorTransition, reduced] }
  )

  if (n === 0) return null

  if (reduced) {
    return (
      <section aria-label={title} className={cn("w-full [container-type:inline-size]", className)}>
        {steps.map((step, i) => (
          <div
            key={i}
            className="px-[clamp(1.25rem,6cqw,4rem)] py-[clamp(3rem,10cqw,6rem)]"
            style={{ backgroundColor: step.color, color: ink(step) }}
          >
            {i === 0 && title && <p className="mb-10 text-sm font-medium opacity-70">{title}</p>}
            <div className={cn("mx-auto max-w-3xl", align === "center" && "text-center", align === "end" && "text-right")}>
              <StepBody step={step} index={i} align={align} />
            </div>
          </div>
        ))}
      </section>
    )
  }

  const first = steps[0]
  const edge = "clamp(20px, 7cqmin, 64px)"
  const gap = "clamp(24px, 6cqw, 80px)"
  const rawRadius = horizontal ? `min(${arcSize}cqmin, calc(50cqw - var(--edge) - 28px))` : `min(${arcSize}cqmin, calc(50cqh - var(--edge) - 28px), 42cqw)`

  const arcBox: CSSProperties = {
    bottom: { left: "calc(50% - var(--r))", bottom: "var(--edge)", width: "calc(2 * var(--r))", height: "var(--r)" },
    top: { left: "calc(50% - var(--r))", top: "var(--edge)", width: "calc(2 * var(--r))", height: "var(--r)" },
    left: { top: "calc(50% - var(--r))", left: "var(--edge)", width: "var(--r)", height: "calc(2 * var(--r))" },
    right: { top: "calc(50% - var(--r))", right: "var(--edge)", width: "var(--r)", height: "calc(2 * var(--r))" },
  }[position]

  const contentWidth = "min(calc(var(--r) * 1.4), 88cqw)"
  const contentBox: CSSProperties = {
    bottom: { left: `calc(50% - ${contentWidth} / 2)`, width: contentWidth, bottom: "calc(var(--edge) + var(--r) * 0.16)" },
    top: { left: `calc(50% - ${contentWidth} / 2)`, width: contentWidth, top: "calc(var(--edge) + var(--r) * 0.16)" },
    left: { left: `calc(var(--edge) + var(--r) + var(--gap))`, right: "var(--edge)", top: 0, bottom: 0 },
    right: { right: `calc(var(--edge) + var(--r) + var(--gap))`, left: "var(--edge)", top: 0, bottom: 0 },
  }[position]

  const headerBox: CSSProperties = {
    bottom: { top: "var(--edge)", left: "var(--edge)", right: "var(--edge)" },
    top: { bottom: "var(--edge)", left: "var(--edge)", right: "var(--edge)" },
    left: { top: "var(--edge)", left: "calc(var(--edge) + var(--r) + var(--gap))", right: "var(--edge)" },
    right: { top: "var(--edge)", left: "var(--edge)", right: "calc(var(--edge) + var(--r) + var(--gap))" },
  }[position]

  return (
    <section
      ref={sectionRef}
      aria-label={title}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height, backgroundColor: first.color, color: ink(first) }}
    >
      <div
        className="absolute inset-0 [container-type:size]"
        style={{ "--r": rawRadius, "--edge": edge, "--gap": gap } as CSSProperties}
      >
        {/* Header */}
        <div className="absolute z-10 flex items-center justify-between gap-4 text-sm" style={headerBox}>
          <p className="font-medium opacity-80">{title}</p>
          <p className="font-mono text-xs tabular-nums opacity-60">
            {pad(active + 1)} / {pad(n)}
          </p>
        </div>

        {/* Arc */}
        <div aria-hidden className="pointer-events-none absolute" style={arcBox}>
          <svg viewBox={geo.viewBox} className="absolute inset-0 size-full overflow-visible" fill="none">
            <path
              d={arcPath}
              stroke="currentColor"
              strokeOpacity={0.22}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
            <path
              ref={fillRef}
              d={arcPath}
              pathLength={1}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="1 1"
              strokeDashoffset={1}
            />
          </svg>

          {steps.map((step, i) => {
            const deg = angleAt(i)
            const passed = i <= active
            const dot = Math.max(6, Math.round(markerSize * 0.5))
            return (
              <div
                key={i}
                className="absolute size-0"
                style={{ ...geo.origin, transform: `rotate(${deg}deg)` }}
              >
                <span
                  className="absolute rounded-full border border-current"
                  style={{ left: "var(--r)", top: 0, width: dot, height: dot, margin: -dot / 2, backgroundColor: "transparent" }}
                >
                  <span
                    className="absolute inset-0 rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `scale(${passed ? 1 : 0})` }}
                  />
                </span>
                {showNumbers && (
                  <div
                    className="absolute size-0"
                    style={{ left: `calc(var(--r) + ${Math.round(markerSize / 2 + 18)}px)`, top: 0, transform: `rotate(${-deg}deg)` }}
                  >
                    <span
                      className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[11px] tabular-nums transition-opacity duration-500",
                        i === active ? "opacity-100" : "opacity-45"
                      )}
                    >
                      {pad(i + 1)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Marker: an arm rotating around the circle's center keeps it exactly on the curve */}
          <div
            ref={armRef}
            className="absolute size-0 will-change-transform"
            style={{ ...geo.origin, transform: `rotate(${angleAt(0)}deg)` }}
          >
            <span
              className="absolute rounded-full bg-current"
              style={{
                left: "var(--r)",
                top: 0,
                width: markerSize,
                height: markerSize,
                margin: -markerSize / 2,
                boxShadow: `0 0 0 ${Math.round(markerSize / 2.5)}px color-mix(in srgb, currentColor 16%, transparent)`,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div
          aria-live="polite"
          className={cn(
            "absolute z-10 grid",
            !horizontal && "content-center",
            align === "start" && "text-left",
            align === "center" && "text-center",
            align === "end" && "text-right"
          )}
          style={contentBox}
        >
          {steps.map((step, i) => (
            <div
              key={i}
              data-arc-content
              className={cn("col-start-1 row-start-1", position === "bottom" ? "self-end" : position === "top" ? "self-start" : "self-center")}
              style={i === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
            >
              <StepBody step={step} index={i} align={align} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
