"use client"

import { useMemo, useRef, useState } from "react"
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react"
import { Play } from "lucide-react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"
import { fmt } from "./easing"
import { ActionButton, CodeTabs, PanelBody, ReducedMotionNote, Slider, Stage } from "./ui"

type Spring = { stiffness: number; damping: number; mass: number }

const PRESETS: { label: string; spring: Spring }[] = [
  { label: "tweenly", spring: { stiffness: 450, damping: 34, mass: 1 } },
  { label: "gentle", spring: { stiffness: 120, damping: 14, mass: 1 } },
  { label: "wobbly", spring: { stiffness: 180, damping: 8, mass: 1 } },
  { label: "stiff", spring: { stiffness: 700, damping: 40, mass: 1 } },
  { label: "heavy", spring: { stiffness: 200, damping: 30, mass: 4 } },
  { label: "molasses", spring: { stiffness: 60, damping: 28, mass: 1 } },
]

const MAX_T = 6
const DT = 1 / 1000
const SAMPLE_EVERY = 8 // keep one point every 8ms
const REST = 0.005 // within 0.5% of the target counts as settled

/** Semi-implicit Euler integration of a unit spring from 0 to 1. */
function simulate({ stiffness, damping, mass }: Spring) {
  let x = 1
  let v = 0
  const points: number[] = [0]
  let settle = 0
  const steps = Math.round(MAX_T / DT)
  for (let i = 1; i <= steps; i++) {
    const a = (-stiffness * x - damping * v) / mass
    v += a * DT
    x += v * DT
    if (Math.abs(x) > REST) settle = i * DT
    if (i % SAMPLE_EVERY === 0) points.push(1 - x)
  }
  const step = SAMPLE_EVERY * DT
  return { points, step, settle, settled: settle < MAX_T - step }
}

// Graph geometry
const W = 400
const H = 200
const PAD = 16

export function SpringExplorer() {
  const reduced = useReducedMotion()
  const [spring, setSpring] = useState<Spring>(PRESETS[0].spring)
  const { stiffness, damping, mass } = spring

  // Only recomputed when an input changes; no animation loop involved
  const sim = useMemo(() => simulate(spring), [spring])
  const view = useMemo(() => {
    const span = Math.min(MAX_T, Math.max(0.5, sim.settle * 1.25))
    const count = Math.min(sim.points.length, Math.ceil(span / sim.step) + 1)
    const pts = sim.points.slice(0, count)
    const lo = Math.min(0, ...pts)
    const hi = Math.max(1, ...pts)
    const px = (t: number) => PAD + (t / span) * (W - PAD * 2)
    const py = (p: number) => H - PAD - ((p - lo) / (hi - lo)) * (H - PAD * 2)
    const d = pts.map((p, i) => `${i ? "L" : "M"}${px(i * sim.step).toFixed(1)},${py(p).toFixed(1)}`).join(" ")
    return { span, px, py, d, pts }
  }, [sim])

  const ratio = damping / (2 * Math.sqrt(stiffness * mass))
  const regime = ratio < 0.999 ? "underdamped, will overshoot" : ratio <= 1.001 ? "critically damped" : "overdamped, no overshoot"

  // Playback replays the simulated curve so the ball and the graph playhead agree
  const time = useMotionValue(0)
  const value = useMotionValue(1)
  const headX = useMotionValue(0)
  const headY = useMotionValue(0)
  const [playing, setPlaying] = useState(false)
  const controls = useRef<AnimationPlaybackControls | null>(null)
  const ballX = useTransform(value, (p) => `${p * 100}%`)
  const { px, py } = view

  const stop = () => {
    controls.current?.stop()
    setPlaying(false)
    value.set(1)
  }

  const update = (next: Spring) => {
    stop()
    setSpring(next)
  }

  const play = () => {
    stop()
    if (reduced) return
    const { points, step } = sim
    const { span } = view
    const at = (t: number) => points[Math.min(points.length - 1, Math.round(t / step))]
    time.set(0)
    value.set(0)
    headX.set(px(0))
    headY.set(py(0))
    setPlaying(true)
    controls.current = animate(time, span, {
      duration: span,
      ease: "linear",
      onUpdate: (t) => {
        const p = at(t)
        value.set(p)
        headX.set(px(t))
        headY.set(py(p))
      },
      onComplete: () => setPlaying(false),
    })
  }

  const settleLabel = sim.settled ? `${fmt(sim.settle, 2)}s` : `> ${MAX_T}s`

  // CSS linear() approximation sampled over the settle time
  const cssDuration = sim.settled ? Math.max(0.1, sim.settle) : MAX_T
  const linearStops = Array.from({ length: 33 }, (_, i) => {
    const t = (i / 32) * cssDuration
    const p = sim.points[Math.min(sim.points.length - 1, Math.round(t / sim.step))]
    return fmt(i === 32 ? 1 : p, 3)
  })

  return (
    <>
      <PanelBody
        preview={
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_14rem]">
            <Stage className="min-h-0 place-items-stretch p-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono text-[11.5px] text-muted-foreground">
                    settles in <span className="text-foreground">{settleLabel}</span>
                    <span className="mx-1.5">·</span>
                    ζ {fmt(ratio, 2)} <span className="hidden sm:inline">({regime})</span>
                  </div>
                  <ActionButton onClick={play} label="Play spring" icon={false}>
                    <Play className="size-3.5 text-muted-foreground" />
                    Play
                  </ActionButton>
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Spring response graph, settles in ${settleLabel}`}>
                  <line x1={PAD} x2={W - PAD} y1={py(1)} y2={py(1)} className="stroke-border" strokeDasharray="3 4" />
                  <line x1={PAD} x2={W - PAD} y1={py(0)} y2={py(0)} className="stroke-border" />
                  {sim.settled && (
                    <g>
                      <line x1={px(sim.settle)} x2={px(sim.settle)} y1={PAD} y2={H - PAD} className="stroke-brand/50" strokeDasharray="3 4" />
                      <text x={px(sim.settle) - 4} y={PAD + 8} textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">
                        settled
                      </text>
                    </g>
                  )}
                  <path d={view.d} className="fill-none stroke-foreground" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                  {playing ? (
                    <motion.circle cx={headX} cy={headY} r={5} className="fill-brand" />
                  ) : (
                    <circle cx={px(view.span)} cy={py(view.pts[view.pts.length - 1])} r={5} className="fill-brand" />
                  )}
                  <text x={W - PAD} y={H - 2} textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">
                    {fmt(view.span, 2)}s
                  </text>
                </svg>
                <div className="relative h-8 rounded-full border bg-panel">
                  <div className="absolute inset-y-0 left-1 right-7">
                    <motion.div style={{ x: ballX }} className="absolute inset-y-0 left-0 grid w-full items-center">
                      <span className="size-6 rounded-full bg-brand" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </Stage>
            <Stage className="min-h-56 touch-none">
              <span className="pointer-events-none absolute left-3 top-3 font-mono text-[11.5px] text-muted-foreground">drag me</span>
              <span className="pointer-events-none absolute size-16 rounded-full border border-dashed" />
              <motion.button
                type="button"
                aria-label="Draggable ball that springs back with the current spring"
                drag
                dragSnapToOrigin
                // Inertia's boundary spring has no mass, so divide it out: same dynamics as k, c, m
                dragTransition={
                  reduced
                    ? { bounceStiffness: 100000, bounceDamping: 10000 }
                    : { bounceStiffness: stiffness / mass, bounceDamping: damping / mass }
                }
                whileDrag={{ scale: 1.08 }}
                className="relative size-14 cursor-grab rounded-full bg-brand shadow-sm active:cursor-grabbing"
              />
            </Stage>
          </div>
        }
        controls={
          <>
            <div className="space-y-1.5">
              <span className="font-mono text-[11.5px] text-muted-foreground">presets</span>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESETS.map((p) => {
                  const active = p.spring.stiffness === stiffness && p.spring.damping === damping && p.spring.mass === mass
                  return (
                    <button
                      key={p.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update(p.spring)}
                      className={cn(
                        "truncate rounded-lg border px-2 py-1.5 text-[12px] transition-colors",
                        active ? "border-brand/50 bg-brand/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <Slider label="stiffness" value={stiffness} min={10} max={1000} step={5} onChange={(v) => update({ ...spring, stiffness: v })} />
            <Slider label="damping" value={damping} min={1} max={100} step={1} onChange={(v) => update({ ...spring, damping: v })} />
            <Slider label="mass" value={mass} min={0.1} max={10} step={0.1} onChange={(v) => update({ ...spring, mass: v })} />
            {reduced && <ReducedMotionNote />}
          </>
        }
      />
      <CodeTabs
        tabs={[
          {
            label: "Motion",
            code: `import { motion } from "motion/react"

const spring = {
  type: "spring",
  stiffness: ${fmt(stiffness)},
  damping: ${fmt(damping)},
  mass: ${fmt(mass)},
} as const

// settles in about ${settleLabel}
<motion.div animate={{ x: 240 }} transition={spring} />
`,
          },
          {
            label: "CSS linear()",
            code: `/* Spring sampled into a CSS linear() easing (approximation) */
.box {
  transition: transform ${fmt(cssDuration, 2)}s linear(
    ${linearStops.join(", ")}
  );
}
`,
          },
        ]}
      />
    </>
  )
}
