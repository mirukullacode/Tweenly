"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { Shuffle } from "lucide-react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { fmt, mulberry32 } from "./easing"
import { ActionButton, CodeTabs, PanelBody, ReducedMotionNote, Segmented, Slider, Stage } from "./ui"

const ORIGINS = ["center", "edges", "start", "end", "random"] as const
type Origin = (typeof ORIGINS)[number]

const EFFECTS = ["scale", "lift", "fade"] as const
type Effect = (typeof EFFECTS)[number]

const FROM: Record<Effect, { opacity: number; scale?: number; y?: number }> = {
  scale: { opacity: 0, scale: 0 },
  lift: { opacity: 0, y: 16 },
  fade: { opacity: 0 },
}

const DURATION = 0.5

/** Delay in "steps" (multiply by `each`) for every cell, mirroring GSAP's grid stagger. */
function stepsFor(origin: Origin, cols: number, rows: number, seed: number) {
  const n = cols * rows
  const cx = (cols - 1) / 2
  const cy = (rows - 1) / 2
  const dist = (i: number, ox: number, oy: number) => Math.hypot((i % cols) - ox, Math.floor(i / cols) - oy)
  const idx = Array.from({ length: n }, (_, i) => i)
  const fromCenter = idx.map((i) => dist(i, cx, cy))
  const maxCenter = Math.max(...fromCenter)

  switch (origin) {
    case "center":
      return fromCenter
    case "edges":
      return fromCenter.map((d) => maxCenter - d)
    case "start":
      return idx.map((i) => dist(i, 0, 0))
    case "end":
      return idx.map((i) => dist(i, cols - 1, rows - 1))
    case "random": {
      const rand = mulberry32(seed)
      const order = idx.map((i) => ({ i, r: rand() })).sort((a, b) => a.r - b.r)
      const span = Math.hypot(cols - 1, rows - 1)
      const out = new Array<number>(n)
      order.forEach(({ i }, rank) => (out[i] = (rank / Math.max(1, n - 1)) * span))
      return out
    }
  }
}

const MOTION_HELPERS: Record<Origin, string> = {
  center: `const steps = (x: number, y: number) => Math.hypot(x - (cols - 1) / 2, y - (rows - 1) / 2)`,
  edges: `const maxD = Math.hypot((cols - 1) / 2, (rows - 1) / 2)
const steps = (x: number, y: number) => maxD - Math.hypot(x - (cols - 1) / 2, y - (rows - 1) / 2)`,
  start: `const steps = (x: number, y: number) => Math.hypot(x, y)`,
  end: `const steps = (x: number, y: number) => Math.hypot(x - (cols - 1), y - (rows - 1))`,
  random: `// Seeded shuffle so the order is stable between renders (no Math.random in render)
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(SEED)
const rank = Array.from({ length: cols * rows }, (_, i) => ({ i, r: rand() }))
  .sort((a, b) => a.r - b.r)
  .reduce<number[]>((acc, { i }, k) => ((acc[i] = k), acc), [])
const span = Math.hypot(cols - 1, rows - 1)
const steps = (x: number, y: number) => (rank[y * cols + x] / (cols * rows - 1)) * span`,
}

export function StaggerGrid() {
  const reduced = useReducedMotion()
  const [origin, setOrigin] = useState<Origin>("center")
  const [effect, setEffect] = useState<Effect>("scale")
  const [size, setSize] = useState(7)
  const [each, setEach] = useState(0.06)
  const [seed, setSeed] = useState(7)
  const [run, setRun] = useState(0)

  const cols = size
  const rows = size
  const steps = useMemo(() => stepsFor(origin, cols, rows, seed), [origin, cols, rows, seed])
  const from = FROM[effect]

  const fromLiteral = Object.entries(from)
    .map(([k, v]) => `${k}: ${fmt(v)}`)
    .join(", ")
  const toLiteral = Object.keys(from)
    .map((k) => `${k}: ${k === "y" ? 0 : 1}`)
    .join(", ")

  const motionCode = `import { motion } from "motion/react"

const cols = ${cols}
const rows = ${rows}
${origin === "random" ? `const SEED = ${seed}\n` : ""}${MOTION_HELPERS[origin]}

export function Grid() {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: \`repeat(\${cols}, 1fr)\` }}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <motion.div
          key={i}
          className="aspect-square rounded-md bg-[#ff4d12]"
          initial={{ ${fromLiteral} }}
          animate={{ ${toLiteral} }}
          transition={{
            duration: ${DURATION},
            delay: steps(i % cols, Math.floor(i / cols)) * ${fmt(each)},
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  )
}
`

  const gsapCode = `import gsap from "gsap"

// GSAP's grid stagger does the distance maths for you
gsap.from(".cell", {
  ${fromLiteral},
  duration: ${DURATION},
  ease: "power4.out", // nearest named ease to tweenly's enter curve
  stagger: {
    each: ${fmt(each)},
    from: "${origin}",
    grid: [${rows}, ${cols}],
  },
})
`

  return (
    <>
      <PanelBody
        preview={
          <Stage className="min-h-80">
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              {origin === "random" && (
                <ActionButton onClick={() => setSeed((s) => s + 1)} label="Shuffle random order" icon={false}>
                  <Shuffle className="size-3.5 text-muted-foreground" />
                  Shuffle
                </ActionButton>
              )}
              <ActionButton onClick={() => setRun((r) => r + 1)} label="Replay stagger">
                Replay
              </ActionButton>
            </div>
            <div
              key={`${run}-${origin}-${effect}-${size}-${each}-${seed}`}
              className="mt-10 grid w-full max-w-72 gap-1.5 sm:mt-6 sm:gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  className="aspect-square rounded-md bg-brand"
                  initial={reduced ? false : from}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: DURATION, delay: s * each, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
          </Stage>
        }
        controls={
          <>
            <Segmented label="from" options={ORIGINS} value={origin} onChange={setOrigin} />
            <Segmented label="effect" options={EFFECTS} value={effect} onChange={setEffect} />
            <Slider label="grid" value={size} min={3} max={11} step={1} format={(v) => `${v} × ${v}`} onChange={setSize} />
            <Slider label="each" value={each} min={0.01} max={0.2} step={0.01} unit="s" onChange={setEach} />
            {reduced && <ReducedMotionNote />}
          </>
        }
      />
      <CodeTabs
        tabs={[
          { label: "Motion", code: motionCode },
          { label: "GSAP", code: gsapCode },
        ]}
      />
    </>
  )
}
