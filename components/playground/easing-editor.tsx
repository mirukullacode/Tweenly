"use client"

import { useRef, useState } from "react"
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react"
import { Play } from "lucide-react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"
import { EASE_PRESETS, bezierString, fmt, nearestGsapEase, solveBezier, type Bezier } from "./easing"
import { ActionButton, CodeTabs, PanelBody, ReducedMotionNote, Slider, Stage } from "./ui"

// Plot geometry in viewBox units: x 0..1 maps to 50..250, y 0..1 maps to 300..100
const VB_W = 300
const VB_H = 400
const X0 = 50
const SPAN = 200
const Y0 = 300
const Y_MIN = -0.5
const Y_MAX = 1.5

const sx = (x: number) => X0 + x * SPAN
const sy = (y: number) => Y0 - y * SPAN
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const round = (v: number) => Math.round(v * 100) / 100

const sameCurve = (a: Bezier, b: Bezier) => a.every((v, i) => Math.abs(v - b[i]) < 0.001)

export function EasingEditor() {
  const reduced = useReducedMotion()
  const [bez, setBez] = useState<Bezier>([0.22, 1, 0.36, 1])
  const [duration, setDuration] = useState(1)
  const [dragging, setDragging] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const controls = useRef<AnimationPlaybackControls | null>(null)

  // Playback: `time` runs linearly, `progress` follows the curve
  const time = useMotionValue(1)
  const progress = useMotionValue(1)
  const dotX = useTransform(progress, (p) => `${p * 100}%`)
  const linearX = useTransform(time, (t) => `${t * 100}%`)
  const headX = useTransform(time, (t) => sx(t))
  const headY = useTransform(progress, (p) => sy(p))

  const play = (curve: Bezier = bez, d: number = duration) => {
    controls.current?.stop()
    if (reduced) {
      time.set(1)
      progress.set(1)
      return
    }
    time.set(0)
    progress.set(0)
    controls.current = animate(time, 1, {
      duration: d,
      ease: "linear",
      onUpdate: (t) => progress.set(solveBezier(curve, t)),
    })
  }

  const setHandle = (i: 0 | 1, x: number, y: number) => {
    setBez((b) => {
      const next = [...b] as Bezier
      next[i * 2] = round(clamp(x, 0, 1))
      next[i * 2 + 1] = round(clamp(y, Y_MIN, Y_MAX))
      return next
    })
  }

  const pointToCurve = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return null
    const px = ((clientX - rect.left) / rect.width) * VB_W
    const py = ((clientY - rect.top) / rect.height) * VB_H
    return { x: (px - X0) / SPAN, y: (Y0 - py) / SPAN }
  }

  const onKey = (i: 0 | 1) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.01
    const x = bez[i * 2]
    const y = bez[i * 2 + 1]
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }
    if (moves[e.key]) {
      e.preventDefault()
      setHandle(i, x + moves[e.key][0], y + moves[e.key][1])
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      play()
    }
  }

  const choose = (b: Bezier) => {
    setBez(b)
    play(b)
  }

  const [x1, y1, x2, y2] = bez
  const curvePath = `M${sx(0)},${sy(0)} C${sx(x1)},${sy(y1)} ${sx(x2)},${sy(y2)} ${sx(1)},${sy(1)}`
  const near = nearestGsapEase(bez)
  const exact = near.deviation < 0.005
  const str = bezierString(bez)

  const handles = [
    { i: 0 as const, x: x1, y: y1, ax: 0, ay: 0 },
    { i: 1 as const, x: x2, y: y2, ax: 1, ay: 1 },
  ]

  return (
    <>
      <PanelBody
        preview={
          <Stage className="place-items-stretch p-4 sm:p-6">
            <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="mx-auto w-full max-w-60 touch-none select-none overflow-visible"
                aria-label={`Cubic bezier curve editor: cubic-bezier(${str})`}
                role="group"
              >
                {/* unit square + grid */}
                <rect x={X0} y={sy(1)} width={SPAN} height={SPAN} className="fill-none stroke-border" strokeWidth={1} />
                {[0.25, 0.5, 0.75].map((g) => (
                  <g key={g} className="stroke-border" strokeWidth={1} strokeDasharray="2 4">
                    <line x1={sx(g)} x2={sx(g)} y1={sy(0)} y2={sy(1)} />
                    <line x1={sx(0)} x2={sx(1)} y1={sy(g)} y2={sy(g)} />
                  </g>
                ))}
                <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} className="stroke-muted-foreground/30" strokeWidth={1} strokeDasharray="4 4" />
                <text x={sx(0)} y={sy(0) + 22} className="fill-muted-foreground font-mono text-[13px]">time</text>
                <text x={sx(0) - 8} y={sy(1) - 10} className="fill-muted-foreground font-mono text-[13px]">progress</text>

                {/* handle arms */}
                {handles.map((h) => (
                  <line key={h.i} x1={sx(h.ax)} y1={sy(h.ay)} x2={sx(h.x)} y2={sy(h.y)} className="stroke-muted-foreground/60" strokeWidth={1.5} />
                ))}

                <path d={curvePath} className="fill-none stroke-foreground" strokeWidth={3} strokeLinecap="round" />

                {/* playhead on the curve */}
                <motion.circle cx={headX} cy={headY} r={5} className="fill-brand" />

                <circle cx={sx(0)} cy={sy(0)} r={4} className="fill-foreground" />
                <circle cx={sx(1)} cy={sy(1)} r={4} className="fill-foreground" />

                {handles.map((h) => (
                  <g
                    key={h.i}
                    role="slider"
                    tabIndex={0}
                    aria-label={`Control point ${h.i + 1}. Arrow keys move it, Shift for bigger steps, Enter plays.`}
                    aria-valuemin={Y_MIN}
                    aria-valuemax={Y_MAX}
                    aria-valuenow={h.y}
                    aria-valuetext={`x ${fmt(h.x)}, y ${fmt(h.y)}`}
                    className="group cursor-grab outline-none active:cursor-grabbing"
                    onKeyDown={onKey(h.i)}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId)
                      setDragging(h.i)
                    }}
                    onPointerMove={(e) => {
                      if (dragging !== h.i) return
                      const p = pointToCurve(e.clientX, e.clientY)
                      if (p) setHandle(h.i, p.x, p.y)
                    }}
                    onPointerUp={() => {
                      if (dragging === h.i) {
                        setDragging(null)
                        play()
                      }
                    }}
                    onPointerCancel={() => setDragging(null)}
                  >
                    <circle cx={sx(h.x)} cy={sy(h.y)} r={18} className="fill-transparent" />
                    <circle
                      cx={sx(h.x)}
                      cy={sy(h.y)}
                      r={8}
                      className={cn(
                        "fill-panel stroke-brand transition-[stroke-width] group-focus-visible:stroke-[5]",
                        dragging === h.i && "stroke-[5]"
                      )}
                      strokeWidth={3}
                    />
                  </g>
                ))}
              </svg>

              <div className="min-w-0 space-y-5">
                {[
                  { label: "curve", x: dotX, cls: "bg-brand" },
                  { label: "linear", x: linearX, cls: "bg-foreground/25" },
                ].map((t) => (
                  <div key={t.label} className="space-y-1.5">
                    <span className="font-mono text-[11.5px] text-muted-foreground">{t.label}</span>
                    <div className="relative h-8 rounded-full border bg-panel">
                      <div className="absolute inset-y-0 left-1 right-7">
                        <motion.div style={{ x: t.x }} className="absolute inset-y-0 left-0 grid w-full items-center">
                          <span className={cn("size-6 rounded-full", t.cls)} />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-2">
                  <ActionButton onClick={() => play()} label="Play easing preview" icon={false}>
                    <Play className="size-3.5 text-muted-foreground" />
                    Play
                  </ActionButton>
                  <code className="rounded-md border bg-panel px-2 py-1 font-mono text-[11.5px]">cubic-bezier({str})</code>
                </div>
                <p className="text-[12.5px] leading-5 text-muted-foreground">
                  Drag the orange handles, or focus one and use the arrow keys. The orange dot on the curve traces progress over time.
                </p>
              </div>
            </div>
          </Stage>
        }
        controls={
          <>
            <div className="space-y-1.5">
              <span className="font-mono text-[11.5px] text-muted-foreground">presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                {EASE_PRESETS.map((p) => {
                  const active = sameCurve(p.bezier, bez)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => choose(p.bezier)}
                      className={cn(
                        "truncate rounded-lg border px-2 py-1.5 text-left text-[12px] transition-colors",
                        active ? "border-brand/50 bg-brand/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <Slider label="duration" value={duration} min={0.2} max={3} step={0.1} unit="s" onChange={setDuration} />
            <div className="grid grid-cols-4 gap-1.5">
              {(["x1", "y1", "x2", "y2"] as const).map((k, i) => (
                <div key={k} className="rounded-lg border bg-foreground/[0.03] px-2 py-1.5">
                  <div className="font-mono text-[10px] text-muted-foreground">{k}</div>
                  <div className="font-mono text-[12px] tabular-nums">{fmt(bez[i])}</div>
                </div>
              ))}
            </div>
            <p className="text-[12px] leading-5 text-muted-foreground">
              Nearest GSAP ease: <span className="font-mono text-foreground">{near.name}</span>{" "}
              {exact ? "(matches)" : `(off by up to ${fmt(near.deviation * 100, 1)}%)`}
            </p>
            {reduced && <ReducedMotionNote />}
          </>
        }
      />
      <CodeTabs
        tabs={[
          {
            label: "CSS",
            code: `.box {
  transition: transform ${fmt(duration)}s cubic-bezier(${str});
}

/* or */
.box {
  animation: slide ${fmt(duration)}s cubic-bezier(${str}) both;
}
`,
          },
          {
            label: "Motion",
            code: `import { motion } from "motion/react"

<motion.div
  animate={{ x: 240 }}
  transition={{ duration: ${fmt(duration)}, ease: [${str}] }}
/>
`,
          },
          {
            label: "GSAP",
            code: `import gsap from "gsap"

// GSAP has no cubic-bezier ease built in. "${near.name}" is the
// nearest named ease${exact ? " and matches this curve" : `, off by up to ${fmt(near.deviation * 100, 1)}% of the distance`}.
gsap.to(".box", { x: 240, duration: ${fmt(duration)}, ease: "${near.name}" })

// For an exact match, use the CustomEase plugin:
// gsap.registerPlugin(CustomEase)
// CustomEase.create("custom", "M0,0 C${fmt(x1)},${fmt(y1)} ${fmt(x2)},${fmt(y2)} 1,1")
`,
          },
        ]}
      />
    </>
  )
}
