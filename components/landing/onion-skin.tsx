"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { SegmentedControl } from "@/registry/new-york/segmented-control/segmented-control"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const EASES = [
  { value: "expo.out", label: "Expo" },
  { value: "back.out(2.2)", label: "Back" },
  { value: "elastic.out(1,0.45)", label: "Elastic" },
  { value: "none", label: "Linear" },
]

const FRAMES = 16
const CURVE_STEPS = 64

/**
 * Scroll scrubs one tween from frame 0 to 100 and leaves every in-between frame
 * behind as a ghost, like onion skinning in an animation tool.
 */
export function OnionSkin() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const keyRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const progress = useRef(0)
  const [ease, setEase] = useState(EASES[0].value)

  const easeFn = useMemo(() => gsap.parseEase(ease) as (t: number) => number, [ease])
  const frames = useMemo(() => Array.from({ length: FRAMES }, (_, i) => i / (FRAMES - 1)), [])

  // Curve samples are clamped into the graph so elastic overshoot still fits
  const curve = useMemo(() => {
    const pts = Array.from({ length: CURVE_STEPS + 1 }, (_, i) => {
      const t = i / CURVE_STEPS
      return `${(t * 280).toFixed(2)},${(100 - easeFn(t) * 70 - 15).toFixed(2)}`
    })
    return `M${pts.join(" L")}`
  }, [easeFn])

  const paint = () => {
    const stage = stageRef.current
    const key = keyRef.current
    if (!stage || !key) return
    const p = progress.current
    const e = easeFn(p)
    key.style.setProperty("--e", String(e))
    key.style.setProperty("--p", String(p))
    stage.querySelectorAll<HTMLElement>("[data-ghost]").forEach((ghost) => {
      ghost.dataset.on = String(Number(ghost.dataset.t) <= p + 0.0001)
    })
    dotRef.current?.setAttribute("cx", String(p * 280))
    dotRef.current?.setAttribute("cy", String(100 - e * 70 - 15))
    if (readoutRef.current) readoutRef.current.textContent = `t ${p.toFixed(2)}  ·  x ${e.toFixed(2)}`
  }

  useEffect(paint)

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section) return
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * 1.6}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress.current = self.progress
          paint()
        },
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="relative flex h-dvh flex-col justify-center overflow-hidden px-6 sm:px-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">Frame 00 → 100</p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2.25rem,5.5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
              Everything good
              <br />
              <span className="text-muted-foreground">happens in between.</span>
            </h2>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <p className="max-w-xs text-[14px] leading-relaxed text-muted-foreground md:text-right">
              Scroll to scrub the tween. Every ghost is a frame your users feel but never see.
            </p>
            <SegmentedControl options={EASES} value={ease} onValueChange={setEase} size="sm" aria-label="Easing" />
          </div>
        </div>

        <div
          ref={stageRef}
          className="relative mt-16 h-[clamp(120px,18vh,180px)] [--s:clamp(56px,9vw,120px)]"
        >
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
          {frames.map((t) => {
            const e = easeFn(t)
            return (
              <div
                key={t}
                data-ghost
                data-t={t}
                data-on="false"
                className="absolute top-1/2 size-(--s) -translate-y-1/2 border border-foreground/25 opacity-0 transition-[opacity,left,border-radius,rotate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] data-[on=true]:opacity-100"
                style={{
                  left: `calc(${e} * (100% - var(--s)))`,
                  borderRadius: `${22 + t * 28}%`,
                  rotate: `${e * 180}deg`,
                }}
              />
            )
          })}
          <div
            ref={keyRef}
            className="absolute top-1/2 size-(--s) -translate-y-1/2 shadow-[0_20px_60px_-10px_var(--brand)] will-change-transform"
            style={{
              left: "calc(var(--e, 0) * (100% - var(--s)))",
              rotate: "calc(var(--e, 0) * 180deg)",
              borderRadius: "calc(22% + var(--p, 0) * 28%)",
              background: "color-mix(in oklab, var(--brand) calc(var(--p, 0) * 100%), var(--foreground))",
            }}
          />
        </div>

        <div className="mt-14 flex items-end justify-between gap-6">
          <svg viewBox="0 0 280 100" className="h-20 w-56 overflow-visible">
            <path d="M0,85 L280,85" className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d={curve} fill="none" className="stroke-foreground/60 transition-[d] duration-700" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <circle ref={dotRef} r="2.4" className="fill-brand" cx="0" cy="85" />
          </svg>
          <span ref={readoutRef} className="whitespace-pre font-mono text-[12px] tabular-nums text-muted-foreground" />
        </div>
      </div>
    </section>
  )
}
