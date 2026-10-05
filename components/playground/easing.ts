import gsap from "gsap"

export type Bezier = [number, number, number, number]

export type EasePreset = {
  id: string
  label: string
  bezier: Bezier
}

export const EASE_PRESETS: EasePreset[] = [
  { id: "enter", label: "tweenly enter", bezier: [0.22, 1, 0.36, 1] },
  { id: "inOut", label: "tweenly in-out", bezier: [0.76, 0, 0.24, 1] },
  { id: "easeOut", label: "easeOut", bezier: [0, 0, 0.58, 1] },
  { id: "easeInOut", label: "easeInOut", bezier: [0.42, 0, 0.58, 1] },
  { id: "ease", label: "ease", bezier: [0.25, 0.1, 0.25, 1] },
  { id: "linear", label: "linear", bezier: [0, 0, 1, 1] },
  { id: "back", label: "back", bezier: [0.34, 1.56, 0.64, 1] },
  { id: "expo", label: "expo", bezier: [0.16, 1, 0.3, 1] },
]

export const getPreset = (id: string) => EASE_PRESETS.find((p) => p.id === id) ?? EASE_PRESETS[0]

/** Format a number for generated code: trims trailing zeros. */
export const fmt = (n: number, digits = 2) => String(Number(n.toFixed(digits)))

export const bezierString = (b: Bezier) => b.map((n) => fmt(n)).join(", ")

/** Evaluate a CSS-style cubic-bezier: returns progress (y) for a time (x) in 0..1. */
export function solveBezier([x1, y1, x2, y2]: Bezier, x: number) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  // Newton-Raphson, then bisection as a fallback
  let t = x
  for (let i = 0; i < 8; i++) {
    const err = sampleX(t) - x
    if (Math.abs(err) < 1e-6) return sampleY(t)
    const d = slopeX(t)
    if (Math.abs(d) < 1e-6) break
    t -= err / d
  }
  let lo = 0
  let hi = 1
  t = x
  for (let i = 0; i < 30; i++) {
    const v = sampleX(t)
    if (Math.abs(v - x) < 1e-6) break
    if (v < x) lo = t
    else hi = t
    t = (lo + hi) / 2
  }
  return sampleY(t)
}

const GSAP_CANDIDATES = [
  "none",
  ...["power1", "power2", "power3", "power4", "sine", "expo", "circ"].flatMap((n) => [`${n}.in`, `${n}.out`, `${n}.inOut`]),
  "back.in(1.7)",
  "back.out(1.7)",
  "back.inOut(1.7)",
]

const nearestCache = new Map<string, { name: string; deviation: number }>()

/**
 * GSAP has no built-in cubic-bezier ease (without the CustomEase plugin), so we
 * sample the curve and pick the named GSAP ease with the smallest max deviation.
 */
export function nearestGsapEase(b: Bezier) {
  const key = bezierString(b)
  const cached = nearestCache.get(key)
  if (cached) return cached
  const samples = Array.from({ length: 41 }, (_, i) => i / 40)
  const target = samples.map((x) => solveBezier(b, x))
  let best = { name: "none", deviation: Infinity }
  for (const name of GSAP_CANDIDATES) {
    const fn = gsap.parseEase(name)
    let dev = 0
    for (let i = 0; i < samples.length; i++) dev = Math.max(dev, Math.abs(fn(samples[i]) - target[i]))
    if (dev < best.deviation) best = { name, deviation: dev }
  }
  nearestCache.set(key, best)
  return best
}

/** Deterministic PRNG so "random" orders are stable across renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
