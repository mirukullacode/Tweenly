"use client"

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react"
import { animate, motion, useMotionValue, useMotionValueEvent } from "motion/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface TimelineScrollItem {
  year: string | number
  title: string
  description?: string
  tag?: string
}

export interface TimelineScrollProps {
  /** Milestones in order: { year, title, description?, tag? }. */
  items: TimelineScrollItem[]
  /** "scroll" pins the section and moves it sideways with vertical scroll; "drag" is a free horizontal drag/swipe with inertia and no pinning. Default: "scroll" */
  mode?: "scroll" | "drag"
  /** Width of each milestone column (any CSS length). Default: "clamp(240px, 44cqw, 560px)" */
  itemWidth?: string
  /** Font size of the years (any CSS length). Default: "clamp(3.5rem, min(15cqw, 24cqh), 12rem)" */
  yearSize?: string
  /** Color of the active year, its tick and the progress line. Default: "#ff4d12" */
  accent?: string
  /** Fill the baseline in the accent color up to the center. Default: true */
  showProgress?: boolean
  /** Rolling year counter in the top-right corner. Default: true */
  showCounter?: boolean
  /** Vertical placement of the timeline. Default: "center" */
  align?: "top" | "center"
  /** Scroll distance multiplier. Higher = slower horizontal travel. Default: 1 */
  scrollLength?: number
  /** Snap to the nearest milestone when scrolling or dragging stops. Default: false */
  snap?: boolean
  /** Small heading in the top-left corner. Default: "Our journey" */
  title?: string
  /** Scroll container to track instead of the window. Default: window */
  scroller?: HTMLElement | null
  /** Height of the section (any CSS length). Default: "100vh" */
  height?: string
  /** Additional classes for the section. */
  className?: string
}

const EASE_OUT = "cubic-bezier(0.22,1,0.36,1)"
const MINOR_TICKS = [0, 1 / 6, 2 / 6, 4 / 6, 5 / 6]

/** Year counter: digits roll individually when every year is numeric and the same length. */
function RollingYear({ years, active }: { years: string[]; active: number }) {
  const digits = years.length > 0 && years.every((y) => /^\d+$/.test(y) && y.length === years[0].length)
  const row = 1.1

  if (digits) {
    return (
      <span className="inline-flex overflow-hidden tabular-nums" style={{ height: `${row}em`, lineHeight: row }}>
        {years[active].split("").map((d, k) => (
          <span
            key={k}
            className="flex flex-col transition-transform duration-700"
            style={{
              transform: `translateY(-${Number(d) * row}em)`,
              transitionTimingFunction: EASE_OUT,
              transitionDelay: `${k * 45}ms`,
            }}
          >
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n} style={{ height: `${row}em` }}>
                {n}
              </span>
            ))}
          </span>
        ))}
      </span>
    )
  }

  return (
    <span className="inline-flex overflow-hidden" style={{ height: `${row}em`, lineHeight: row }}>
      <span
        className="flex flex-col items-end transition-transform duration-700"
        style={{ transform: `translateY(-${active * row}em)`, transitionTimingFunction: EASE_OUT }}
      >
        {years.map((y, i) => (
          <span key={i} className="whitespace-nowrap" style={{ height: `${row}em` }}>
            {y}
          </span>
        ))}
      </span>
    </span>
  )
}

/**
 * Minimal horizontal timeline of years and milestones. Pins and scrolls sideways
 * with the page (or drags freely); the year at the center lights up in the accent.
 */
export function TimelineScroll({
  items,
  mode = "scroll",
  itemWidth = "clamp(240px, 44cqw, 560px)",
  yearSize = "clamp(3.5rem, min(15cqw, 24cqh), 12rem)",
  accent = "#ff4d12",
  showProgress = true,
  showCounter = true,
  align = "center",
  scrollLength = 1,
  snap = false,
  title = "Our journey",
  scroller,
  height = "100vh",
  className,
}: TimelineScrollProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const [geom, setGeom] = useState({ distance: 0, step: 0 })
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const fill = useMotionValue(0)
  const n = items.length
  const years = items.map((item) => String(item.year))
  const drag = mode === "drag"

  const commit = (next: number) => {
    if (next === activeRef.current) return
    activeRef.current = next
    setActive(next)
  }

  // Drag mode: measure travel distance and column width
  useEffect(() => {
    const stage = stageRef.current
    const track = trackRef.current
    if (!drag || reduced || !stage || !track) return
    const ro = new ResizeObserver(() => {
      const distance = Math.max(track.scrollWidth - stage.clientWidth, 0)
      const step = n > 1 ? distance / (n - 1) : 0
      setGeom({ distance, step })
      const clamped = Math.min(0, Math.max(-distance, x.get()))
      x.set(clamped)
      fill.set(distance > 0 ? -clamped / distance : 0)
    })
    ro.observe(stage)
    ro.observe(track)
    return () => ro.disconnect()
  }, [drag, reduced, n, x, fill])

  useMotionValueEvent(x, "change", (v) => {
    if (!drag) return
    fill.set(geom.distance > 0 ? Math.min(1, Math.max(0, -v / geom.distance)) : 0)
    if (geom.step > 0) commit(Math.min(n - 1, Math.max(0, Math.round(-v / geom.step))))
  })

  // Scroll mode: pin and translate the track with a scrubbed timeline
  useGSAP(
    () => {
      const section = sectionRef.current
      const stage = stageRef.current
      const track = trackRef.current
      if (drag || reduced || !section || !stage || !track || n === 0) return

      const distance = () => Math.max(track.scrollWidth - stage.clientWidth, 0)
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          scroller: scroller ?? undefined,
          start: "top top",
          end: () => `+=${Math.max(distance(), stage.clientHeight) * scrollLength}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          snap:
            snap && n > 1
              ? { snapTo: 1 / (n - 1), duration: { min: 0.2, max: 0.6 }, delay: 0.05, ease: "power4.inOut" }
              : undefined,
        },
        onUpdate: () => commit(Math.round(tl.progress() * Math.max(n - 1, 0))),
      })
      tl.to(track, { x: () => -distance() }, 0)
      if (fillRef.current) tl.fromTo(fillRef.current, { scaleX: 0 }, { scaleX: 1 }, 0)

      const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 100)
      return () => window.clearTimeout(refreshTimer)
    },
    {
      scope: sectionRef,
      dependencies: [drag, reduced, n, itemWidth, yearSize, scrollLength, snap, scroller, showProgress, align],
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
  }, [drag, reduced, n, itemWidth, yearSize, scrollLength, snap, scroller, align])

  const goTo = (index: number) => {
    if (!geom.step) return
    const i = Math.min(n - 1, Math.max(0, index))
    animate(x, -i * geom.step, { duration: 0.8, ease: [0.22, 1, 0.36, 1] })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!drag) return
    if (e.key === "ArrowRight") {
      e.preventDefault()
      goTo(active + 1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      goTo(active - 1)
    } else if (e.key === "Home") {
      e.preventDefault()
      goTo(0)
    } else if (e.key === "End") {
      e.preventDefault()
      goTo(n - 1)
    }
  }

  if (n === 0) return null

  if (reduced) {
    return (
      <section
        aria-label={title}
        className={cn(
          "w-full bg-background px-[clamp(1.25rem,6cqw,4rem)] py-[clamp(3rem,8cqw,6rem)] text-foreground [container-type:inline-size]",
          className
        )}
      >
        {title && <p className="mb-10 text-sm font-medium text-muted-foreground">{title}</p>}
        <ol className="space-y-10 border-l border-border pl-6">
          {items.map((item, i) => (
            <li key={i}>
              {item.tag && <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{item.tag}</p>}
              <p
                className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,10cqw,5rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums"
                style={{ color: accent }}
              >
                {item.year}
              </p>
              <p className="mt-2 text-base font-medium">{item.title}</p>
              {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
            </li>
          ))}
        </ol>
      </section>
    )
  }

  const trackStyle: CSSProperties = {
    gridTemplateRows: "auto auto auto",
    gridAutoColumns: itemWidth,
    paddingInline: `calc(50cqw - (${itemWidth}) / 2)`,
    rowGap: "clamp(10px, 2.6cqh, 24px)",
  }
  const fillInset = `calc((${itemWidth}) / 2)`

  return (
    <section
      ref={sectionRef}
      aria-label={title}
      className={cn("relative w-full overflow-hidden bg-background text-foreground", className)}
      style={{ height }}
    >
      <div
        ref={stageRef}
        tabIndex={drag ? 0 : undefined}
        onKeyDown={onKeyDown}
        aria-roledescription={drag ? "draggable timeline" : undefined}
        className={cn(
          "absolute inset-0 flex flex-col outline-none [container-type:size]",
          align === "center" ? "justify-center" : "justify-start pt-[clamp(72px,16cqh,140px)]",
          drag && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        )}
      >
        {/* Header */}
        <div className="pointer-events-none absolute inset-x-[clamp(20px,5cqw,56px)] top-[clamp(20px,5cqh,48px)] z-10 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {drag ? "Drag" : "Scroll"} to explore
            </p>
          </div>
          {showCounter && (
            <div className="text-right font-[family-name:var(--font-display)] text-[clamp(1.5rem,4.5cqw,3rem)] font-semibold leading-none tracking-[-0.03em]">
              <RollingYear years={years} active={active} />
              <p className="mt-1 font-mono text-[11px] font-normal tracking-[0.16em] text-muted-foreground tabular-nums">
                {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              </p>
            </div>
          )}
        </div>

        {/* Track */}
        <motion.div
          ref={trackRef}
          drag={drag ? "x" : false}
          dragConstraints={{ left: -geom.distance, right: 0 }}
          dragElastic={0.08}
          dragMomentum
          dragTransition={{
            power: 0.35,
            timeConstant: 320,
            bounceStiffness: 260,
            bounceDamping: 36,
            modifyTarget:
              snap && geom.step > 0
                ? (target: number) => Math.min(0, Math.max(-geom.distance, Math.round(target / geom.step) * geom.step))
                : undefined,
          }}
          className={cn("grid w-max grid-flow-col will-change-transform", drag && "cursor-grab select-none active:cursor-grabbing")}
          style={drag ? { ...trackStyle, x } : trackStyle}
        >
          {/* Baseline + progress */}
          <div aria-hidden className="relative h-6" style={{ gridRow: 2, gridColumn: `1 / ${n + 1}` }}>
            <div className="absolute inset-x-0 top-1/2 h-px bg-current opacity-15" />
            {showProgress && (
              <motion.div
                ref={fillRef}
                className="absolute top-1/2 h-px origin-left"
                style={{
                  left: fillInset,
                  right: fillInset,
                  backgroundColor: accent,
                  ...(drag ? { scaleX: fill } : { transform: "scaleX(0)" }),
                }}
              />
            )}
          </div>

          {items.map((item, i) => {
            const isActive = i === active
            return (
              <article
                key={i}
                aria-current={isActive ? "step" : undefined}
                className="grid px-[clamp(8px,1.5cqw,20px)] text-center"
                style={{ gridColumn: i + 1, gridRow: "1 / span 3", gridTemplateRows: "subgrid" }}
              >
                <div className="flex flex-col items-center justify-end">
                  <p
                    className={cn(
                      "mb-2 h-4 font-mono text-[11px] uppercase tracking-[0.16em] transition-opacity duration-500",
                      isActive ? "opacity-100" : "opacity-50"
                    )}
                    style={{ color: isActive ? accent : undefined }}
                  >
                    {item.tag ?? ""}
                  </p>
                  <div
                    className="relative font-[family-name:var(--font-display)] font-semibold leading-[0.85] tracking-[-0.04em] tabular-nums transition-transform duration-700"
                    style={{
                      fontSize: yearSize,
                      transform: `scale(${isActive ? 1.08 : 1})`,
                      transformOrigin: "50% 100%",
                      transitionTimingFunction: EASE_OUT,
                    }}
                  >
                    <span
                      className="block text-muted-foreground transition-opacity duration-500"
                      style={{ opacity: isActive ? 0 : 0.45 }}
                    >
                      {item.year}
                    </span>
                    <span
                      aria-hidden
                      className="absolute inset-0 transition-opacity duration-500"
                      style={{ color: accent, opacity: isActive ? 1 : 0 }}
                    >
                      {item.year}
                    </span>
                  </div>
                </div>

                <div aria-hidden className="relative h-6 [margin-inline:calc(-1*clamp(8px,1.5cqw,20px))]">
                  {MINOR_TICKS.map((at) => (
                    <span
                      key={at}
                      className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-current opacity-25"
                      style={{ left: `${at * 100}%` }}
                    />
                  ))}
                  <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-current opacity-50" />
                  <span
                    className="absolute left-1/2 top-1/2 -ml-1 -mt-1 size-2 rounded-full transition-transform duration-500"
                    style={{ backgroundColor: accent, transform: `scale(${isActive ? 1 : 0})`, transitionTimingFunction: EASE_OUT }}
                  />
                </div>

                <div
                  className={cn("mx-auto max-w-[32ch] transition-opacity duration-500", isActive ? "opacity-100" : "opacity-35")}
                >
                  <h3 className="text-[clamp(0.95rem,2.2cqw,1.25rem)] font-medium tracking-tight">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-[clamp(0.8rem,1.6cqw,0.95rem)] leading-snug text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
