"use client"

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

// ---------------------------------------------------------------- types

export type HeroBackgroundVariant = "dots" | "grid" | "particles" | "waves" | "flow" | "pixels"
export type HeroBackgroundInteraction = "repel" | "attract" | "none"
export type HeroBackgroundMask = "none" | "radial" | "fade-bottom" | "fade-edges"

export interface HeroBackgroundProps {
  /** Visual style of the background. Default: "dots" */
  variant?: HeroBackgroundVariant
  /** Primary mark color (any CSS color, including CSS variables). Follows the text color by default. Default: "currentColor" */
  color?: string
  /** Highlight color used near the cursor (any CSS color). Default: "#ff4d12" */
  accent?: string
  /** Background fill behind the marks (any CSS color). Default: "transparent" */
  background?: string
  /** Mark density multiplier. Higher packs dots, lines, cells and particles closer together. Default: 1 */
  density?: number
  /** Mark size in px: dot radius, line width, particle radius, or the gap between pixel cells. Default: 1.5 */
  size?: number
  /** Animation speed multiplier for ambient motion. Default: 1 */
  speed?: number
  /** How marks react to the cursor. "none" only highlights. Default: "repel" */
  interaction?: HeroBackgroundInteraction
  /** Cursor influence radius in px. Default: 160 */
  radius?: number
  /** Strength of the cursor push, pull and highlight. Default: 1 */
  strength?: number
  /** Opacity of the resting marks, 0 to 1. Marks near the cursor brighten towards 1. Default: 0.35 */
  opacity?: number
  /** CSS mask applied to the canvas so foreground content stays readable. Default: "none" */
  mask?: HeroBackgroundMask
  /** Emit a ripple from the pointer on click or tap. Default: true */
  clickRipple?: boolean
  /** React to the pointer at all. Default: true */
  interactive?: boolean
  /** Seed for the deterministic layout and noise. Default: 1 */
  seed?: number
  /** Frame rate cap. Default: 60 */
  fps?: number
  /** Hero content rendered on top of the background. */
  children?: ReactNode
  className?: string
}

// ---------------------------------------------------------------- engine

/** Number of accent-mix levels for marks near the cursor. */
const LEVELS = 6
/** Number of resting alpha steps used for ambient shimmer and fades. */
const FADE = 4
/** Palette size: FADE resting steps followed by LEVELS accent mixes. */
const NB = FADE + LEVELS
const BASE = FADE // palette index of a resting mark at full `opacity`
const TAU = Math.PI * 2
const RIPPLES = 4
const RIPPLE_SPEED = 620 // px per second
const RIPPLE_LIFE = 1.6 // seconds
const RIPPLE_WIDTH = 34

interface Live {
  color: string
  accent: string
  size: number
  speed: number
  sign: number // 1 repel, -1 attract, 0 none
  radius: number
  strength: number
  opacity: number
  clickRipple: boolean
  fps: number
}

interface World {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  /** Animation clock, scaled by `speed`. */
  t: number
  px: number
  py: number
  pvx: number
  pvy: number
  presence: number
  rip: Float32Array
  rippling: boolean
  /** Direction output of rippleAt(). */
  rx: number
  ry: number
  o: Live
  pal: string[]
  hl: string[]
  rng: () => number
  noise: (x: number, y: number) => number
  density: number
  counts: Int32Array
}

interface Scene {
  step(dt: number): void
  draw(): void
}

type SceneFactory = (W: World) => Scene

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seeded 2D value noise in the 0..1 range. */
function makeNoise(rng: () => number) {
  const perm = new Uint8Array(512)
  const vals = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    perm[i] = i
    vals[i] = rng()
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = perm[i]
    perm[i] = perm[j]
    perm[j] = tmp
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i]
  return (x: number, y: number) => {
    const xf0 = Math.floor(x)
    const yf0 = Math.floor(y)
    const xi = xf0 & 255
    const yi = yf0 & 255
    const fx = x - xf0
    const fy = y - yf0
    const u = fx * fx * (3 - 2 * fx)
    const v = fy * fy * (3 - 2 * fy)
    const a = vals[perm[perm[xi] + yi]]
    const b = vals[perm[perm[xi + 1] + yi]]
    const c = vals[perm[perm[xi] + yi + 1]]
    const d = vals[perm[perm[xi + 1] + yi + 1]]
    const top = a + (b - a) * u
    return top + (c + (d - c) * u - top) * v
  }
}

/** Smooth 0..1 cursor influence at a point. */
function influence(W: World, x: number, y: number) {
  if (W.presence < 0.002) return 0
  const R = W.o.radius
  const dx = x - W.px
  const dy = y - W.py
  const d2 = dx * dx + dy * dy
  if (d2 >= R * R) return 0
  const k = 1 - Math.sqrt(d2) / R
  return k * k * (3 - 2 * k) * W.presence
}

/** Ripple intensity at a point; writes the outward direction to W.rx / W.ry. */
function rippleAt(W: World, x: number, y: number) {
  W.rx = 0
  W.ry = 0
  if (!W.rippling) return 0
  let s = 0
  for (let i = 0; i < RIPPLES; i++) {
    const age = W.rip[i * 3 + 2]
    if (age < 0) continue
    const dx = x - W.rip[i * 3]
    const dy = y - W.rip[i * 3 + 1]
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const off = dist - age * RIPPLE_SPEED
    if (off > RIPPLE_WIDTH * 3 || off < -RIPPLE_WIDTH * 3) continue
    const g = Math.exp(-(off * off) / (2 * RIPPLE_WIDTH * RIPPLE_WIDTH)) * (1 - age / RIPPLE_LIFE)
    s += g
    W.rx += (dx / dist) * g
    W.ry += (dy / dist) * g
  }
  return s
}

/** Palette index for an influence value: accent mix when lit, otherwise `rest`. */
function paletteIndex(f: number, rest: number) {
  if (f <= 0.03) return rest
  return BASE + Math.min(LEVELS - 1, 1 + Math.floor(f * (LEVELS - 1)))
}

function resetCounts(W: World) {
  W.counts.fill(0)
}

// ---------------------------------------------------------------- dots

const dots: SceneFactory = (W) => {
  const sp = Math.max(8, 26 / W.density)
  const cols = Math.ceil(W.w / sp) + 1
  const rows = Math.ceil(W.h / sp) + 1
  const n = cols * rows
  const x0 = (W.w - (cols - 1) * sp) / 2
  const y0 = (W.h - (rows - 1) * sp) / 2
  const hx = new Float32Array(n)
  const hy = new Float32Array(n)
  const ox = new Float32Array(n)
  const oy = new Float32Array(n)
  const vx = new Float32Array(n)
  const vy = new Float32Array(n)
  const sc = new Float32Array(n)
  const lv = new Uint8Array(n)
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      hx[j * cols + i] = x0 + i * sp
      hy[j * cols + i] = y0 + j * sp
    }
  }

  return {
    step(dt) {
      const o = W.o
      const push = o.strength * o.radius * 0.22 * o.sign
      const k = 170 * dt
      const damp = Math.exp(-13 * dt)
      const ease = 1 - Math.exp(-dt * 10)
      const ns = 0.006
      for (let i = 0; i < n; i++) {
        const x = hx[i]
        const y = hy[i]
        const f = influence(W, x, y)
        const r = rippleAt(W, x, y)
        let tx = 0
        let ty = 0
        if (f > 0) {
          const dx = x - W.px
          const dy = y - W.py
          const d = Math.sqrt(dx * dx + dy * dy) || 1
          let m = f * push
          if (m < -d * 0.8) m = -d * 0.8
          tx = (dx / d) * m
          ty = (dy / d) * m
        }
        if (r > 0) {
          tx += W.rx * sp * 0.5 * o.strength
          ty += W.ry * sp * 0.5 * o.strength
        }
        vx[i] = (vx[i] + (tx - ox[i]) * k) * damp
        vy[i] = (vy[i] + (ty - oy[i]) * k) * damp
        ox[i] += vx[i] * dt
        oy[i] += vy[i] * dt
        const lit = Math.min(1, (f + r * 0.8) * Math.min(1.4, o.strength))
        sc[i] += (lit * 1.3 - sc[i]) * ease
        const amb = W.noise(x * ns + W.t * 0.12, y * ns - W.t * 0.05)
        lv[i] = paletteIndex(lit, 1 + Math.min(2, Math.floor(amb * 3)))
      }
    },
    draw() {
      const ctx = W.ctx
      const base = W.o.size
      resetCounts(W)
      for (let i = 0; i < n; i++) W.counts[lv[i]]++
      for (let p = 0; p < NB; p++) {
        if (!W.counts[p]) continue
        ctx.fillStyle = W.pal[p]
        ctx.beginPath()
        for (let i = 0; i < n; i++) {
          if (lv[i] !== p) continue
          const r = base * (1 + sc[i])
          const x = hx[i] + ox[i]
          const y = hy[i] + oy[i]
          ctx.moveTo(x + r, y)
          ctx.arc(x, y, r, 0, TAU)
        }
        ctx.fill()
      }
    },
  }
}

// ---------------------------------------------------------------- grid

const grid: SceneFactory = (W) => {
  const sp = Math.max(14, 44 / W.density)
  const cols = Math.ceil(W.w / sp) + 3
  const rows = Math.ceil(W.h / sp) + 3
  const n = cols * rows
  const x0 = (W.w - (cols - 1) * sp) / 2
  const y0 = (W.h - (rows - 1) * sp) / 2
  const ox = new Float32Array(n)
  const oy = new Float32Array(n)
  const vx = new Float32Array(n)
  const vy = new Float32Array(n)
  const nf = new Float32Array(n)
  const segs = new Uint8Array(n * 2) // [h, v] per node

  return {
    step(dt) {
      const o = W.o
      const push = o.strength * o.radius * 0.24 * o.sign
      const k = 150 * dt
      const damp = Math.exp(-12 * dt)
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const idx = j * cols + i
          const x = x0 + i * sp
          const y = y0 + j * sp
          const f = influence(W, x, y)
          const r = rippleAt(W, x, y)
          let tx = 0
          let ty = 0
          if (f > 0) {
            const dx = x - W.px
            const dy = y - W.py
            const d = Math.sqrt(dx * dx + dy * dy) || 1
            let m = f * push
            if (m < -d * 0.85) m = -d * 0.85
            tx = (dx / d) * m
            ty = (dy / d) * m
          }
          if (r > 0) {
            tx += W.rx * sp * 0.35 * o.strength
            ty += W.ry * sp * 0.35 * o.strength
          }
          vx[idx] = (vx[idx] + (tx - ox[idx]) * k) * damp
          vy[idx] = (vy[idx] + (ty - oy[idx]) * k) * damp
          ox[idx] += vx[idx] * dt
          oy[idx] += vy[idx] * dt
          nf[idx] = Math.min(1, (f + r * 0.7) * Math.min(1.4, o.strength))
        }
      }
    },
    draw() {
      const ctx = W.ctx
      // Highlighted cells near the cursor
      if (W.presence > 0.01 || W.rippling) {
        for (let p = 1; p < LEVELS; p++) {
          let any = false
          for (let j = 0; j < rows - 1; j++) {
            for (let i = 0; i < cols - 1; i++) {
              const a = j * cols + i
              const f = (nf[a] + nf[a + 1] + nf[a + cols] + nf[a + cols + 1]) * 0.25
              if (f <= 0.03 || Math.min(LEVELS - 1, 1 + Math.floor(f * (LEVELS - 1))) !== p) continue
              if (!any) {
                ctx.fillStyle = W.hl[p]
                ctx.beginPath()
                any = true
              }
              const b = a + 1
              const c = a + cols + 1
              const d = a + cols
              ctx.moveTo(x0 + i * sp + ox[a], y0 + j * sp + oy[a])
              ctx.lineTo(x0 + (i + 1) * sp + ox[b], y0 + j * sp + oy[b])
              ctx.lineTo(x0 + (i + 1) * sp + ox[c], y0 + (j + 1) * sp + oy[c])
              ctx.lineTo(x0 + i * sp + ox[d], y0 + (j + 1) * sp + oy[d])
              ctx.closePath()
            }
          }
          if (any) ctx.fill()
        }
      }

      // Lines, one path per palette entry
      resetCounts(W)
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const a = j * cols + i
          const ph = i < cols - 1 ? paletteIndex(Math.max(nf[a], nf[a + 1]), BASE) : 255
          const pv = j < rows - 1 ? paletteIndex(Math.max(nf[a], nf[a + cols]), BASE) : 255
          segs[a * 2] = ph
          segs[a * 2 + 1] = pv
          if (ph !== 255) W.counts[ph]++
          if (pv !== 255) W.counts[pv]++
        }
      }
      ctx.lineWidth = Math.max(0.5, W.o.size * 0.66)
      for (let p = 0; p < NB; p++) {
        if (!W.counts[p]) continue
        ctx.strokeStyle = W.pal[p]
        ctx.beginPath()
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const a = j * cols + i
            const ax = x0 + i * sp + ox[a]
            const ay = y0 + j * sp + oy[a]
            if (segs[a * 2] === p) {
              ctx.moveTo(ax, ay)
              ctx.lineTo(x0 + (i + 1) * sp + ox[a + 1], y0 + j * sp + oy[a + 1])
            }
            if (segs[a * 2 + 1] === p) {
              ctx.moveTo(ax, ay)
              ctx.lineTo(x0 + i * sp + ox[a + cols], y0 + (j + 1) * sp + oy[a + cols])
            }
          }
        }
        ctx.stroke()
      }
    },
  }
}

// ---------------------------------------------------------------- particles

const MAX_SEGS = 6000

const particles: SceneFactory = (W) => {
  const sp = Math.max(36, 110 / W.density)
  const n = Math.max(12, Math.min(420, Math.round((W.w * W.h) / (sp * sp))))
  const link = sp * 1.3
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  const vx = new Float32Array(n)
  const vy = new Float32Array(n)
  const bx = new Float32Array(n)
  const by = new Float32Array(n)
  const lv = new Uint8Array(n)
  const seg = new Float32Array(MAX_SEGS * 4)
  const segP = new Uint8Array(MAX_SEGS)
  let segN = 0
  for (let i = 0; i < n; i++) {
    x[i] = W.rng() * W.w
    y[i] = W.rng() * W.h
    const a = W.rng() * TAU
    const s = 6 + W.rng() * 14
    bx[i] = Math.cos(a) * s
    by[i] = Math.sin(a) * s
    vx[i] = bx[i]
    vy[i] = by[i]
  }

  const addSeg = (ax: number, ay: number, cx: number, cy: number, p: number) => {
    if (segN >= MAX_SEGS) return
    const o = segN * 4
    seg[o] = ax
    seg[o + 1] = ay
    seg[o + 2] = cx
    seg[o + 3] = cy
    segP[segN] = p
    segN++
  }

  return {
    step(dt) {
      const o = W.o
      const relax = 1 - Math.exp(-dt * 1.5)
      const accel = o.sign * o.strength * 900 * dt
      const m = 20
      for (let i = 0; i < n; i++) {
        vx[i] += (bx[i] * o.speed - vx[i]) * relax
        vy[i] += (by[i] * o.speed - vy[i]) * relax
        const f = influence(W, x[i], y[i])
        if (f > 0 && accel !== 0) {
          const dx = x[i] - W.px
          const dy = y[i] - W.py
          const d = Math.sqrt(dx * dx + dy * dy) || 1
          vx[i] += (dx / d) * f * accel
          vy[i] += (dy / d) * f * accel
        }
        if (rippleAt(W, x[i], y[i]) > 0) {
          vx[i] += W.rx * o.strength * 500 * dt
          vy[i] += W.ry * o.strength * 500 * dt
        }
        x[i] += vx[i] * dt
        y[i] += vy[i] * dt
        if (x[i] < -m) x[i] += W.w + m * 2
        else if (x[i] > W.w + m) x[i] -= W.w + m * 2
        if (y[i] < -m) y[i] += W.h + m * 2
        else if (y[i] > W.h + m) y[i] -= W.h + m * 2
        lv[i] = paletteIndex(Math.min(1, f * o.strength), BASE)
      }

      // Links between close particles, faded by distance
      segN = 0
      const l2 = link * link
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = x[i] - x[j]
          const dy = y[i] - y[j]
          const d2 = dx * dx + dy * dy
          if (d2 >= l2) continue
          const fade = 1 - Math.sqrt(d2) / link
          const f = influence(W, (x[i] + x[j]) * 0.5, (y[i] + y[j]) * 0.5)
          const rest = Math.min(FADE - 1, Math.floor(fade * fade * FADE))
          addSeg(x[i], y[i], x[j], y[j], f > 0.03 ? paletteIndex(f * fade * o.strength, rest) : rest)
        }
      }
      // Links from the cursor
      if (W.presence > 0.01) {
        const r2 = o.radius * o.radius * 0.64
        for (let i = 0; i < n; i++) {
          const dx = x[i] - W.px
          const dy = y[i] - W.py
          if (dx * dx + dy * dy >= r2) continue
          addSeg(W.px, W.py, x[i], y[i], paletteIndex(influence(W, x[i], y[i]) * Math.min(1, o.strength), 0))
        }
      }
    },
    draw() {
      const ctx = W.ctx
      resetCounts(W)
      for (let s = 0; s < segN; s++) W.counts[segP[s]]++
      ctx.lineWidth = Math.max(0.5, W.o.size * 0.5)
      for (let p = 0; p < NB; p++) {
        if (!W.counts[p]) continue
        ctx.strokeStyle = W.pal[p]
        ctx.beginPath()
        for (let s = 0; s < segN; s++) {
          if (segP[s] !== p) continue
          const o = s * 4
          ctx.moveTo(seg[o], seg[o + 1])
          ctx.lineTo(seg[o + 2], seg[o + 3])
        }
        ctx.stroke()
      }
      resetCounts(W)
      for (let i = 0; i < n; i++) W.counts[lv[i]]++
      const r = W.o.size
      for (let p = 0; p < NB; p++) {
        if (!W.counts[p]) continue
        ctx.fillStyle = W.pal[p]
        ctx.beginPath()
        for (let i = 0; i < n; i++) {
          if (lv[i] !== p) continue
          const rr = p > BASE ? r * 1.6 : r
          ctx.moveTo(x[i] + rr, y[i])
          ctx.arc(x[i], y[i], rr, 0, TAU)
        }
        ctx.fill()
      }
    },
  }
}

// ---------------------------------------------------------------- waves

const waves: SceneFactory = (W) => {
  const sp = Math.max(8, 26 / W.density)
  const lines = Math.max(4, Math.min(80, Math.round(W.h / sp)))
  const stepX = 10
  const pts = Math.ceil(W.w / stepX) + 2
  const gap = W.h / lines
  const f1 = new Float32Array(lines)
  const f2 = new Float32Array(lines)
  const s1 = new Float32Array(lines)
  const s2 = new Float32Array(lines)
  const p1 = new Float32Array(lines)
  const p2 = new Float32Array(lines)
  const amp = new Float32Array(lines)
  const disp = new Float32Array(lines * pts)
  const ys = new Float32Array(lines * pts)
  const pi = new Uint8Array(lines * pts)
  for (let l = 0; l < lines; l++) {
    f1[l] = 0.004 + W.rng() * 0.004
    f2[l] = 0.009 + W.rng() * 0.008
    s1[l] = 0.4 + W.rng() * 0.5
    s2[l] = 0.3 + W.rng() * 0.6
    p1[l] = W.rng() * TAU
    p2[l] = W.rng() * TAU
    amp[l] = gap * (0.5 + W.rng() * 0.6)
  }

  return {
    step(dt) {
      const o = W.o
      const t = W.t
      const ease = 1 - Math.exp(-dt * 8)
      const push = o.sign * o.strength * o.radius * 0.28
      const swell = o.strength * gap * 1.2
      for (let l = 0; l < lines; l++) {
        const base = (l + 0.5) * gap
        // Neighbouring lines share a slow drift so the stack reads as one surface
        const shared = W.noise(l * 0.15, t * 0.1) - 0.5
        for (let k = 0; k < pts; k++) {
          const xx = k * stepX
          const wave =
            Math.sin(xx * f1[l] + t * s1[l] + p1[l]) * 0.6 * amp[l] +
            Math.sin(xx * f2[l] - t * s2[l] + p2[l]) * 0.4 * amp[l] +
            shared * gap * 2
          const yy = base + wave
          const f = influence(W, xx, yy)
          const r = rippleAt(W, xx, yy)
          let target = r * 16 * o.strength * (W.ry >= 0 ? 1 : -1)
          if (f > 0) {
            const dir = yy >= W.py ? 1 : -1
            target += dir * f * push + f * swell * Math.sin(xx * 0.045 - t * 5)
          }
          const i = l * pts + k
          disp[i] += (target - disp[i]) * ease
          ys[i] = yy + disp[i]
          pi[i] = paletteIndex(Math.min(1, (f + r * 0.7) * Math.min(1.4, o.strength)), BASE)
        }
      }
    },
    draw() {
      const ctx = W.ctx
      ctx.lineWidth = Math.max(0.5, W.o.size * 0.7)
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.strokeStyle = W.pal[BASE]
      ctx.beginPath()
      for (let l = 0; l < lines; l++) {
        const row = l * pts
        ctx.moveTo(0, ys[row])
        for (let k = 1; k < pts; k++) ctx.lineTo(k * stepX, ys[row + k])
      }
      ctx.stroke()
      // Accent overlay on lit segments
      resetCounts(W)
      for (let i = 0; i < pi.length; i++) W.counts[pi[i]]++
      ctx.lineWidth = Math.max(0.5, W.o.size)
      for (let p = BASE + 1; p < NB; p++) {
        if (!W.counts[p]) continue
        ctx.strokeStyle = W.pal[p]
        ctx.beginPath()
        for (let l = 0; l < lines; l++) {
          const row = l * pts
          for (let k = 0; k < pts - 1; k++) {
            if (pi[row + k] !== p) continue
            ctx.moveTo(k * stepX, ys[row + k])
            ctx.lineTo((k + 1) * stepX, ys[row + k + 1])
          }
        }
        ctx.stroke()
      }
    },
  }
}

// ---------------------------------------------------------------- flow

const TRAIL = 12

const flow: SceneFactory = (W) => {
  const sp = Math.max(10, 28 / W.density)
  const n = Math.max(50, Math.min(1400, Math.round((W.w * W.h) / (sp * sp))))
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  const age = new Float32Array(n)
  const life = new Float32Array(n)
  const pi = new Uint8Array(n)
  const trail = new Float32Array(n * TRAIL * 2)
  let head = 0
  let filled = 0
  const ns = 0.0022

  const spawn = (i: number, randomAge: boolean) => {
    x[i] = W.rng() * W.w
    y[i] = W.rng() * W.h
    life[i] = 2 + W.rng() * 4
    age[i] = randomAge ? W.rng() * life[i] : 0
    const o = i * TRAIL * 2
    for (let k = 0; k < TRAIL; k++) {
      trail[o + k * 2] = x[i]
      trail[o + k * 2 + 1] = y[i]
    }
  }
  for (let i = 0; i < n; i++) spawn(i, true)

  return {
    step(dt) {
      const o = W.o
      const t = W.t
      const v = 55 * o.speed
      head = (head + 1) % TRAIL
      if (filled < TRAIL) filled++
      const m = 10
      for (let i = 0; i < n; i++) {
        age[i] += dt * Math.max(0.2, o.speed)
        if (age[i] > life[i] || x[i] < -m || x[i] > W.w + m || y[i] < -m || y[i] > W.h + m) {
          spawn(i, false)
        }
        const a = (W.noise(x[i] * ns + t * 0.03, y[i] * ns - t * 0.02) * 2 + W.noise(x[i] * ns * 3, y[i] * ns * 3 + t * 0.05) * 0.5) * TAU
        let dx = Math.cos(a) * v
        let dy = Math.sin(a) * v
        const f = influence(W, x[i], y[i])
        if (f > 0) {
          const cx = x[i] - W.px
          const cy = y[i] - W.py
          const d = Math.sqrt(cx * cx + cy * cy) || 1
          const s = f * o.strength
          // Swirl around the cursor, push or pull radially, and drag along with the pointer
          dx += (-cy / d) * s * 140 + (cx / d) * s * 110 * o.sign + W.pvx * s * 0.5
          dy += (cx / d) * s * 140 + (cy / d) * s * 110 * o.sign + W.pvy * s * 0.5
        }
        if (rippleAt(W, x[i], y[i]) > 0) {
          dx += W.rx * o.strength * 260
          dy += W.ry * o.strength * 260
        }
        x[i] += dx * dt
        y[i] += dy * dt
        const off = (i * TRAIL + head) * 2
        trail[off] = x[i]
        trail[off + 1] = y[i]
        const fadeIn = Math.min(1, age[i] / 0.6, (life[i] - age[i]) / 0.6)
        pi[i] = paletteIndex(Math.min(1, f * o.strength), Math.max(0, Math.min(FADE - 1, Math.floor(fadeIn * FADE))))
      }
    },
    draw() {
      const ctx = W.ctx
      resetCounts(W)
      for (let i = 0; i < n; i++) W.counts[pi[i]]++
      ctx.lineWidth = Math.max(0.5, W.o.size * 0.7)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      const len = filled
      for (let p = 0; p < NB; p++) {
        if (!W.counts[p]) continue
        ctx.strokeStyle = W.pal[p]
        ctx.beginPath()
        for (let i = 0; i < n; i++) {
          if (pi[i] !== p) continue
          const base = i * TRAIL * 2
          let k = (head - len + 1 + TRAIL) % TRAIL
          ctx.moveTo(trail[base + k * 2], trail[base + k * 2 + 1])
          for (let s = 1; s < len; s++) {
            k = (k + 1) % TRAIL
            ctx.lineTo(trail[base + k * 2], trail[base + k * 2 + 1])
          }
        }
        ctx.stroke()
      }
    },
  }
}

// ---------------------------------------------------------------- pixels

const pixels: SceneFactory = (W) => {
  const cs = Math.max(6, 22 / W.density)
  const cols = Math.ceil(W.w / cs)
  const rows = Math.ceil(W.h / cs)
  const n = cols * rows
  const x0 = (W.w - cols * cs) / 2
  const y0 = (W.h - rows * cs) / 2
  const energy = new Float32Array(n)
  const seedV = new Float32Array(n)
  const pi = new Uint8Array(n)
  for (let i = 0; i < n; i++) seedV[i] = W.rng()

  return {
    step(dt) {
      const o = W.o
      const decay = Math.exp(-dt * 2.4 * Math.max(0.2, o.speed))
      for (let i = 0; i < n; i++) energy[i] *= decay
      if (W.presence > 0.01) {
        const R = o.radius
        const c0 = Math.max(0, Math.floor((W.px - R - x0) / cs))
        const c1 = Math.min(cols - 1, Math.ceil((W.px + R - x0) / cs))
        const r0 = Math.max(0, Math.floor((W.py - R - y0) / cs))
        const r1 = Math.min(rows - 1, Math.ceil((W.py + R - y0) / cs))
        for (let j = r0; j <= r1; j++) {
          for (let i = c0; i <= c1; i++) {
            const cx = x0 + (i + 0.5) * cs
            const cy = y0 + (j + 0.5) * cs
            // Ragged edge: jitter the falloff per cell
            const f = influence(W, cx, cy) * (0.55 + W.rng() * 0.45) * Math.min(1.4, o.strength)
            const idx = j * cols + i
            if (f > energy[idx]) energy[idx] = Math.min(1, f)
          }
        }
      }
      if (W.rippling) {
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const r = rippleAt(W, x0 + (i + 0.5) * cs, y0 + (j + 0.5) * cs)
            const idx = j * cols + i
            if (r > energy[idx]) energy[idx] = Math.min(1, r * o.strength)
          }
        }
      }
      const t = W.t
      for (let i = 0; i < n; i++) {
        const e = energy[i]
        if (e > 0.03) {
          // Lit cells flicker slightly as they fade
          const flick = W.rng() < 0.06 ? 0.6 : 1
          pi[i] = paletteIndex(e * flick, 0)
        } else if (seedV[i] > 0.86) {
          const tw = (Math.sin(t * 0.9 + seedV[i] * 60) + 1) * 0.5
          pi[i] = Math.min(FADE - 1, Math.floor(tw * FADE))
        } else {
          pi[i] = 255
        }
      }
    },
    draw() {
      const ctx = W.ctx
      resetCounts(W)
      for (let i = 0; i < n; i++) if (pi[i] !== 255) W.counts[pi[i]]++
      const gap = Math.min(cs * 0.5, Math.max(0, W.o.size))
      const side = cs - gap
      for (let p = 0; p < NB; p++) {
        if (!W.counts[p]) continue
        ctx.fillStyle = W.pal[p]
        ctx.beginPath()
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            if (pi[j * cols + i] !== p) continue
            ctx.rect(x0 + i * cs + gap / 2, y0 + j * cs + gap / 2, side, side)
          }
        }
        ctx.fill()
      }
    },
  }
}

const SCENES: Record<HeroBackgroundVariant, SceneFactory> = { dots, grid, particles, waves, flow, pixels }

// ---------------------------------------------------------------- color

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

function resolveColor(probe: HTMLElement, value: string, scratch: CanvasRenderingContext2D | null): Rgba {
  probe.style.color = ""
  probe.style.color = value
  if (!probe.style.color) probe.style.color = "currentColor"
  const computed = getComputedStyle(probe).color
  if (!scratch) return { r: 128, g: 128, b: 128, a: 1 }
  scratch.clearRect(0, 0, 1, 1)
  scratch.fillStyle = "#808080"
  scratch.fillStyle = computed
  scratch.fillRect(0, 0, 1, 1)
  const d = scratch.getImageData(0, 0, 1, 1).data
  return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }
}

const rgba = (r: number, g: number, b: number, a: number) =>
  `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`

function buildPalette(W: World, c: Rgba, a: Rgba) {
  const op = Math.max(0, Math.min(1, W.o.opacity))
  for (let i = 0; i < FADE; i++) W.pal[i] = rgba(c.r, c.g, c.b, c.a * op * ((i + 1) / FADE))
  for (let k = 0; k < LEVELS; k++) {
    const t = k / (LEVELS - 1)
    const alpha = (c.a + (a.a - c.a) * t) * (op + (1 - op) * t * 0.9)
    W.pal[BASE + k] = rgba(c.r + (a.r - c.r) * t, c.g + (a.g - c.g) * t, c.b + (a.b - c.b) * t, alpha)
    W.hl[k] = rgba(a.r, a.g, a.b, a.a * t * 0.14)
  }
}

// Alpha mask for edge fading, not a color gradient
const MASKS: Record<HeroBackgroundMask, CSSProperties | undefined> = {
  none: undefined,
  radial: {
    maskImage: "radial-gradient(ellipse 70% 65% at 50% 50%, #000 25%, transparent 100%)",
    WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 50% 50%, #000 25%, transparent 100%)",
  },
  "fade-bottom": {
    maskImage: "linear-gradient(to bottom, #000 35%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, #000 35%, transparent 100%)",
  },
  "fade-edges": {
    maskImage:
      "linear-gradient(to right, transparent, #000 18%, #000 82%, transparent), linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)",
    WebkitMaskImage:
      "linear-gradient(to right, transparent, #000 18%, #000 82%, transparent), linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)",
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  },
}

// ---------------------------------------------------------------- component

export function HeroBackground({
  variant = "dots",
  color = "currentColor",
  accent = "#ff4d12",
  background = "transparent",
  density = 1,
  size = 1.5,
  speed = 1,
  interaction = "repel",
  radius = 160,
  strength = 1,
  opacity = 0.35,
  mask = "none",
  clickRipple = true,
  interactive = true,
  seed = 1,
  fps = 60,
  children,
  className,
}: HeroBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const liveRef = useRef<Live | null>(null)
  const versionRef = useRef(0)
  const redrawRef = useRef<(() => void) | null>(null)
  const reduced = useReducedMotion()

  // Live options: applied on the next frame without rebuilding the scene
  useEffect(() => {
    liveRef.current = {
      color,
      accent,
      size: Math.max(0, size),
      speed: Math.max(0, speed),
      sign: interaction === "repel" ? 1 : interaction === "attract" ? -1 : 0,
      radius: Math.max(1, radius),
      strength: Math.max(0, strength),
      opacity,
      clickRipple,
      fps: Math.max(1, fps),
    }
    versionRef.current++
    redrawRef.current?.()
  }, [color, accent, size, speed, interaction, radius, strength, opacity, clickRipple, fps])

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const probe = probeRef.current
    const ctx = canvas?.getContext("2d")
    const live = liveRef.current
    if (!root || !canvas || !probe || !ctx || !live) return

    const scratchCanvas = document.createElement("canvas")
    scratchCanvas.width = scratchCanvas.height = 1
    const scratch = scratchCanvas.getContext("2d", { willReadFrequently: true })
    const rip = new Float32Array(RIPPLES * 3)
    for (let i = 0; i < RIPPLES; i++) rip[i * 3 + 2] = -1

    const W: World = {
      ctx,
      w: 0,
      h: 0,
      t: 0,
      px: 0,
      py: 0,
      pvx: 0,
      pvy: 0,
      presence: 0,
      rip,
      rippling: false,
      rx: 0,
      ry: 0,
      o: live,
      pal: new Array<string>(NB).fill("transparent"),
      hl: new Array<string>(LEVELS).fill("transparent"),
      rng: mulberry32(seed),
      noise: makeNoise(mulberry32(seed ^ 0x9e3779b9)),
      density: Math.max(0.1, density),
      counts: new Int32Array(NB),
    }

    let scene: Scene | null = null
    let raf = 0
    let last = 0
    let seenVersion = -1
    let colorsDirty = true
    let onScreen = true
    let tx = 0
    let ty = 0
    let inside = false
    let nextRipple = 0

    const refreshColors = () => {
      if (liveRef.current) W.o = liveRef.current
      if (!colorsDirty && seenVersion === versionRef.current) return
      seenVersion = versionRef.current
      colorsDirty = false
      buildPalette(W, resolveColor(probe, W.o.color, scratch), resolveColor(probe, W.o.accent, scratch))
    }

    const render = () => {
      ctx.clearRect(0, 0, W.w, W.h)
      scene?.draw()
    }

    const advance = (dt: number) => {
      refreshColors()
      const follow = 1 - Math.exp(-dt * 16)
      if (inside && W.presence < 0.02) {
        W.px = tx
        W.py = ty
      }
      const lpx = W.px
      const lpy = W.py
      W.px += (tx - W.px) * follow
      W.py += (ty - W.py) * follow
      const vEase = 1 - Math.exp(-dt * 10)
      W.pvx += ((W.px - lpx) / dt - W.pvx) * vEase
      W.pvy += ((W.py - lpy) / dt - W.pvy) * vEase
      W.presence += ((inside ? 1 : 0) - W.presence) * (1 - Math.exp(-dt * (inside ? 8 : 4)))
      W.rippling = false
      for (let i = 0; i < RIPPLES; i++) {
        if (rip[i * 3 + 2] < 0) continue
        rip[i * 3 + 2] += dt
        if (rip[i * 3 + 2] > RIPPLE_LIFE) rip[i * 3 + 2] = -1
        else W.rippling = true
      }
      W.t += dt * W.o.speed
      scene?.step(dt)
    }

    const shouldRun = () => !reduced && onScreen && !document.hidden && W.w > 0 && W.h > 0

    const frame = (now: number) => {
      raf = 0
      if (!shouldRun()) return
      raf = requestAnimationFrame(frame)
      const minGap = 1000 / W.o.fps
      if (last && now - last < minGap - 1.5) return
      const dt = last ? Math.min(Math.max((now - last) / 1000, 0.001), 0.05) : 1 / 60
      last = now
      advance(dt)
      render()
    }

    const start = () => {
      if (raf || !shouldRun()) return
      last = 0
      raf = requestAnimationFrame(frame)
    }

    /** Reduced motion: settle and draw a single frame. */
    const renderStatic = () => {
      if (!scene) return
      refreshColors()
      const steps = variant === "flow" ? TRAIL + 4 : 1
      for (let i = 0; i < steps; i++) {
        W.t += 1 / 60
        scene.step(1 / 60)
      }
      render()
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      if (w === W.w && h === W.h && scene) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      W.w = w
      W.h = h
      W.t = 0
      W.rng = mulberry32(seed)
      colorsDirty = true
      scene = w > 0 && h > 0 ? SCENES[variant](W) : null
      if (reduced) renderStatic()
      else {
        refreshColors()
        advance(1 / 60)
        render()
        start()
      }
    }

    redrawRef.current = () => {
      if (reduced) {
        refreshColors()
        render()
      }
    }

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      tx = e.clientX - rect.left
      ty = e.clientY - rect.top
      inside = true
    }
    const onLeave = () => {
      inside = false
    }
    const onDown = (e: PointerEvent) => {
      onMove(e)
      if (!W.o.clickRipple) return
      rip[nextRipple * 3] = tx
      rip[nextRipple * 3 + 1] = ty
      rip[nextRipple * 3 + 2] = 0
      nextRipple = (nextRipple + 1) % RIPPLES
    }

    const markDirty = () => {
      colorsDirty = true
      if (reduced) {
        refreshColors()
        render()
      }
    }

    const ro = new ResizeObserver(resize)
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1]?.isIntersecting ?? true
      if (onScreen) start()
    })
    io.observe(root)
    const onVisibility = () => {
      if (!document.hidden) start()
    }
    document.addEventListener("visibilitychange", onVisibility)
    // Theme switches change the resolved currentColor without a resize
    const mo = new MutationObserver(markDirty)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
    const scheme = window.matchMedia("(prefers-color-scheme: dark)")
    scheme.addEventListener("change", markDirty)

    const listen = interactive && !reduced
    if (listen) {
      root.addEventListener("pointermove", onMove)
      root.addEventListener("pointerdown", onDown)
      root.addEventListener("pointerleave", onLeave)
      root.addEventListener("pointercancel", onLeave)
    }
    resize()

    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      redrawRef.current = null
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      scheme.removeEventListener("change", markDirty)
      document.removeEventListener("visibilitychange", onVisibility)
      if (listen) {
        root.removeEventListener("pointermove", onMove)
        root.removeEventListener("pointerdown", onDown)
        root.removeEventListener("pointerleave", onLeave)
        root.removeEventListener("pointercancel", onLeave)
      }
    }
  }, [variant, density, seed, interactive, reduced])

  return (
    <div
      ref={rootRef}
      data-slot="hero-background"
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={MASKS[mask]}>
        <canvas ref={canvasRef} className="block size-full" />
        <span ref={probeRef} hidden />
      </div>
      {children}
    </div>
  )
}
