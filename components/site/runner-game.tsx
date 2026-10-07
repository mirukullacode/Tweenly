"use client"

import { useEffect, useRef, useState } from "react"
import { LOGO_PATH } from "@/lib/logo"
import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import {
  BIRD,
  CAT,
  CHARACTERS,
  DINO,
  isCharacter,
  spriteCols,
  type CharacterId,
  type Sprite,
} from "@/components/site/runner-sprites"

/*
 * A tiny endless runner in the spirit of Chrome's offline dinosaur. One canvas
 * fills the wrapper, one rAF loop runs only while playing and on screen. All
 * physics live in "design units" (a 200 unit tall playfield) and are scaled to
 * device pixels at draw time, so it reads the same from mobile to desktop.
 */

const BEST_KEY = "tweenly:runner-best"
const CHARACTER_KEY = "tweenly:runner-character"
const BASE_H = 200 // design height the physics are tuned for
const GROUND_BOTTOM = 36 // design units below the ground line (caption lives here)
const RX = 52 // runner x, design units
const CELL = 2 // design units per sprite pixel
const MARK = 36 // drawn size of the tweenly mark
const GRAVITY = 2400 // units/s²
const JUMP = -580 // first jump, peaks ~70 units
const JUMP2 = -500 // double jump, adds ~52 units from wherever it starts
const AIR1 = (2 * -JUMP) / GRAVITY // ~0.48s of airtime for one jump
const AIR2 = 0.82 // worst case airtime for a double jump
const START_SPEED = 360 // units/s
const MAX_SPEED = 860
const LEVELS = [300, 600, 900, 1200]
const NIGHT_EVERY = 700
const NIGHT_MIX = 0.86 // how far night inverts towards the foreground
const BIRD_W = 28
const BIRD_H = 20

type State = "idle" | "running" | "over"
type Kind = "block" | "pillar" | "crate" | "wall" | "spikes" | "bird"
/** alt: altitude of the obstacle's bottom above the ground line. */
type Obstacle = { kind: Kind; x: number; w: number; h: number; alt: number; bob: number; phase: number }
type Pattern =
  | "block"
  | "pillar"
  | "crate"
  | "cluster"
  | "lowBird"
  | "highBird"
  | "bobBird"
  | "wall"
  | "spikes"
  | "spikeCluster"
  | "twoBirds"
type Cloud = { x: number; alt: number; w: number }
type Star = { fx: number; fy: number; s: number }
type RGB = [number, number, number]

export type RunnerGameProps = {
  /** Current global record. A finished run above it (and above 0) triggers `onRecord`. Default: required. */
  record: number
  /** Called once per run when the final score beats `record`. Default: undefined. */
  onRecord?: (score: number, character: string) => void
  /** Extra classes for the wrapper, which fills its container. Default: undefined. */
  className?: string
}

// Small seeded generator so obstacle patterns vary per run without Math.random
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n: number) => String(Math.floor(n)).padStart(5, "0")
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const tierFor = (score: number) => LEVELS.filter((l) => score >= l).length
const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`
const css = (c: RGB) => mix(c, c, 0)
const lerpRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export function RunnerGame({ record, onRecord, className }: RunnerGameProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<State>("idle")
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [character, setCharacter] = useState<CharacterId>("dino")
  const reduced = useReducedMotion()

  // Mutable game world lives in a ref so the loop never re-renders React
  const world = useRef({
    state: "idle" as State,
    character: "dino" as CharacterId,
    reduced: false,
    y: 0,
    vy: 0,
    jumps: 0,
    speed: START_SPEED,
    dist: 0,
    clock: 0,
    nextGap: 0,
    pending: "block" as Pattern,
    obstacles: [] as Obstacle[],
    clouds: [] as Cloud[],
    stars: [] as Star[],
    groundOffset: 0,
    flash: 0,
    tier: 0,
    toast: { text: "", t: 0 },
    night: 0,
    rand: mulberry32(1),
    width: 600,
    height: BASE_H,
    best: 0,
    lastScoreShown: -1,
    endedAt: 0,
  })
  const startRef = useRef<() => void>(() => {})
  const jumpRef = useRef<() => void>(() => {})
  const drawRef = useRef<() => void>(() => {})
  const recordRef = useRef(record)
  const onRecordRef = useRef(onRecord)

  useEffect(() => {
    recordRef.current = record
    onRecordRef.current = onRecord
  }, [record, onRecord])

  useEffect(() => {
    world.current.reduced = reduced
  }, [reduced])

  useEffect(() => {
    const stored = Number(localStorage.getItem(BEST_KEY) ?? 0)
    const char = localStorage.getItem(CHARACTER_KEY)
    queueMicrotask(() => {
      setBest(Number.isFinite(stored) ? stored : 0)
      if (isCharacter(char)) setCharacter(char)
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const W = world.current
    const logo = new Path2D(LOGO_PATH)
    let fg: RGB = [237, 237, 237]
    let bg: RGB = [10, 10, 10]
    let muted: RGB = [138, 138, 138]
    let brand: RGB = [255, 77, 18]
    let raf = 0
    let last = 0
    let visible = true
    let onScreen = true
    let k = 1 // device pixels per design unit
    let scale = 1 // css pixels per design unit
    let nightAttr = false

    // Resolve any CSS color (hex, rgb, oklch...) to RGB through a 1px canvas
    const probe = document.createElement("canvas")
    probe.width = probe.height = 1
    const pctx = probe.getContext("2d", { willReadFrequently: true })
    const toRGB = (c: string, fallback: RGB): RGB => {
      if (!pctx || !c) return fallback
      pctx.clearRect(0, 0, 1, 1)
      pctx.fillStyle = "#000"
      pctx.fillStyle = c
      pctx.fillRect(0, 0, 1, 1)
      const d = pctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2]]
    }

    const readColors = () => {
      const cs = getComputedStyle(wrap)
      fg = toRGB(cs.color, fg)
      bg = toRGB(cs.getPropertyValue("--background").trim(), bg)
      muted = toRGB(cs.getPropertyValue("--muted-foreground").trim(), muted)
      brand = toRGB(cs.getPropertyValue("--brand").trim(), brand)
    }

    const groundY = () => W.height - GROUND_BOTTOM
    const bandTop = () => Math.max(12, groundY() - 152)
    const R = (v: number) => Math.round(v * k)
    const cellPx = () => Math.max(1, Math.round(CELL * k))
    // Drawn size of a sprite in design units (cells are snapped to whole device pixels)
    const dims = (s: Sprite) => ({ w: (spriteCols(s) * cellPx()) / k, h: (s.length * cellPx()) / k })

    const runnerSprite = (): Sprite | null => {
      if (W.character === "mark") return null
      const set = W.character === "cat" ? CAT : DINO
      if (W.state === "idle") return set.idle
      if (W.y < 0) return set.air
      if (W.state === "over") return set.run[0]
      return set.run[Math.floor(W.dist / 22) % 2]
    }
    const runnerDims = () => {
      const s = runnerSprite()
      return s ? dims(s) : { w: MARK, h: MARK }
    }

    // Bottom-aligned pixel sprite: coalesces runs of filled cells into one fillRect
    const drawSprite = (s: Sprite, x: number, bottom: number) => {
      const c = cellPx()
      const ox = R(x)
      const oy = R(bottom) - s.length * c
      for (let row = 0; row < s.length; row++) {
        const line = s[row]
        let start = -1
        for (let col = 0; col <= line.length; col++) {
          const on = col < line.length && line[col] !== "."
          if (on && start < 0) start = col
          if (!on && start >= 0) {
            ctx.fillRect(ox + start * c, oy + row * c, (col - start) * c, c)
            start = -1
          }
        }
      }
    }

    const rect = (x: number, y: number, w: number, h: number, r: number) => {
      const X = R(x)
      const Y = R(y)
      ctx.beginPath()
      ctx.roundRect(X, Y, Math.max(1, R(x + w) - X), Math.max(1, R(y + h) - Y), Math.round(r * k))
      ctx.fill()
    }

    const birdAlt = (o: Obstacle) => o.alt + Math.sin(W.clock * 3.2 + o.phase) * o.bob

    const draw = () => {
      const w = W.width
      const gy = groundY()
      const n = W.night * NIGHT_MIX
      const sky = lerpRGB(bg, fg, n)
      const fgNow = lerpRGB(fg, bg, n)
      const fgC = css(fgNow)
      const mutedC = mix(muted, lerpRGB(fgNow, sky, 0.45), W.night)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Night: the playfield slowly inverts and dim stars come out
      if (W.night > 0.001) {
        ctx.fillStyle = css(sky)
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = fgC
        ctx.globalAlpha = 0.45 * W.night
        const skyH = gy - 70
        for (const s of W.stars) rect(s.fx * w, 10 + s.fy * skyH, s.s, s.s, 0)
        ctx.globalAlpha = 1
      }

      // Clouds: thin outlines that drift slower than the ground
      ctx.strokeStyle = mutedC
      ctx.globalAlpha = 0.35
      ctx.lineWidth = Math.max(1, R(1.5))
      for (const c of W.clouds) {
        ctx.beginPath()
        ctx.roundRect(R(c.x), R(gy - c.alt), R(c.w), R(10), R(5))
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // Ground: one line with scrolling specks
      ctx.fillStyle = mutedC
      ctx.fillRect(0, R(gy), canvas.width, Math.max(1, R(1)))
      ctx.globalAlpha = 0.5
      for (let x = -(W.groundOffset % 46); x < w; x += 46) {
        rect(x, gy + 7, 12, 1.5, 0)
        rect(x + 26, gy + 13, 6, 1.5, 0)
      }
      ctx.globalAlpha = 1

      // Obstacles
      ctx.fillStyle = fgC
      for (const o of W.obstacles) {
        const bottom = gy - (o.kind === "bird" ? birdAlt(o) : o.alt)
        if (o.kind === "bird") {
          drawSprite(BIRD[Math.floor(W.clock * 6 + o.phase) % 2], o.x, bottom)
        } else if (o.kind === "spikes") {
          const teeth = Math.max(2, Math.round(o.w / 8))
          const tw = o.w / teeth
          ctx.beginPath()
          for (let i = 0; i < teeth; i++) {
            ctx.moveTo(R(o.x + i * tw), R(bottom))
            ctx.lineTo(R(o.x + i * tw + tw / 2), R(bottom - o.h))
            ctx.lineTo(R(o.x + (i + 1) * tw), R(bottom))
          }
          ctx.closePath()
          ctx.fill()
          rect(o.x, bottom - 2, o.w, 2, 1)
        } else {
          rect(o.x, bottom - o.h, o.w, o.h, o.kind === "wall" ? 4 : 3)
          if (o.kind === "crate") {
            ctx.fillStyle = css(sky)
            ctx.globalAlpha = W.night > 0.001 ? 1 : 0.9
            rect(o.x + 4, bottom - o.h / 2 - 1, o.w - 8, 2, 1)
            ctx.globalAlpha = 1
            ctx.fillStyle = fgC
          }
        }
      }

      // Runner
      const color = W.state === "over" ? css(brand) : fgC
      ctx.fillStyle = color
      const sprite = runnerSprite()
      const feet = gy + W.y
      if (sprite) {
        drawSprite(sprite, RX, feet)
      } else {
        const bob = W.state === "running" && W.y === 0 ? Math.abs(Math.sin(W.dist / 14)) * 2 : 0
        const tilt = W.state === "running" ? clamp(W.vy / 2400, -0.35, 0.35) : 0
        ctx.save()
        ctx.setTransform(k, 0, 0, k, 0, 0)
        ctx.translate(RX + MARK / 2, feet - MARK / 2 - bob)
        ctx.rotate(tilt)
        ctx.translate(-MARK / 2, -MARK / 2)
        ctx.scale(MARK / 64, MARK / 64)
        ctx.fill(logo)
        ctx.restore()
      }

      // Score, Chrome-style, flashing on every 100
      const top = bandTop()
      ctx.font = `600 ${Math.max(10, R(12))}px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textAlign = "right"
      ctx.textBaseline = "top"
      const shown = W.flash > 0 && Math.floor(W.flash * 8) % 2 === 0 ? "" : pad(W.dist / 10)
      ctx.fillStyle = mutedC
      ctx.fillText(`HI ${pad(W.best)}`, R(w - 16) - ctx.measureText("00000  ").width, R(top))
      ctx.fillStyle = fgC
      ctx.fillText(shown, R(w - 16), R(top))

      // Level toast, fading out
      if (W.toast.t > 0) {
        ctx.globalAlpha = clamp(W.toast.t / 0.5, 0, 1) * 0.9
        ctx.textAlign = "center"
        ctx.font = `600 ${Math.max(10, R(11))}px ui-monospace, SFMono-Regular, Menlo, monospace`
        ctx.fillStyle = css(brand)
        ctx.fillText(W.toast.text.toUpperCase(), R(w / 2), R(top + 26))
        ctx.globalAlpha = 1
      }

      // Let the DOM caption follow the night inversion
      const isNight = W.night > 0.5
      if (isNight !== nightAttr) {
        nightAttr = isNight
        wrap.dataset.night = isNight ? "true" : "false"
      }
    }
    drawRef.current = draw

    const obstacle = (kind: Kind, x: number, w: number, h: number, alt = 0, bob = 0): Obstacle => ({
      kind,
      x,
      w,
      h,
      alt,
      bob,
      phase: W.rand() * Math.PI * 2,
    })

    const airFor = (p: Pattern) => (p === "wall" ? AIR2 : AIR1)

    const pickNext = (): Pattern => {
      const r = W.rand
      const s = W.dist / 10
      const tier = tierFor(s)
      const opts: [Pattern, number][] = [
        ["block", 3],
        ["pillar", 2],
        ["crate", 1.6],
        ["cluster", s > 150 ? 2 : 0.6],
      ]
      if (s >= 180) opts.push(["lowBird", 1.3], ["highBird", 1])
      if (tier >= 1) opts.push(["bobBird", 1.4])
      if (tier >= 2) opts.push(["wall", 1.2])
      if (tier >= 3) opts.push(["spikes", 1.1], ["spikeCluster", 1.3])
      if (tier >= 4) opts.push(["twoBirds", 0.9])
      let roll = r() * opts.reduce((sum, [, wt]) => sum + wt, 0)
      for (const [p, wt] of opts) {
        roll -= wt
        if (roll <= 0) return p
      }
      return "block"
    }

    // Builds one pattern at x and returns its total width
    const build = (p: Pattern, x: number): number => {
      const r = W.rand
      const list = W.obstacles
      const int = (a: number, b: number) => a + Math.round(r() * (b - a))
      switch (p) {
        case "block": {
          const w = int(12, 18)
          list.push(obstacle("block", x, w, int(18, 26)))
          return w
        }
        case "pillar": {
          const w = int(12, 16)
          list.push(obstacle("pillar", x, w, int(36, 46)))
          return w
        }
        case "crate": {
          const w = int(40, 56)
          list.push(obstacle("crate", x, w, int(22, 28)))
          return w
        }
        case "cluster": {
          const count = r() < 0.4 ? 3 : 2
          let cx = x
          for (let i = 0; i < count; i++) {
            const w = int(12, 15)
            list.push(obstacle("block", cx, w, int(18, 30)))
            cx += w + 4
          }
          return cx - 4 - x
        }
        case "lowBird":
          list.push(obstacle("bird", x, BIRD_W, BIRD_H, 2))
          return BIRD_W
        case "highBird":
          list.push(obstacle("bird", x, BIRD_W, BIRD_H, 44))
          return BIRD_W
        case "bobBird":
          list.push(obstacle("bird", x, BIRD_W, BIRD_H, 14, 14))
          return BIRD_W
        case "wall": {
          const w = int(14, 18)
          list.push(obstacle("wall", x, w, int(74, 84)))
          return w
        }
        case "spikes": {
          const w = int(48, 80)
          list.push(obstacle("spikes", x, w, 10))
          return w
        }
        case "spikeCluster": {
          const a = int(12, 14)
          const sw = int(32, 44)
          const b = int(12, 14)
          list.push(obstacle("block", x, a, int(18, 24)))
          list.push(obstacle("spikes", x + a + 4, sw, 10))
          list.push(obstacle("block", x + a + 4 + sw + 4, b, int(18, 24)))
          return a + sw + b + 8
        }
        case "twoBirds": {
          // Far enough apart to land and jump again between them
          const d = W.speed * (AIR1 + 0.2) + 40 + BIRD_W
          list.push(obstacle("bird", x, BIRD_W, BIRD_H, 2))
          list.push(obstacle("bird", x + d, BIRD_W, BIRD_H, 2))
          return d + BIRD_W
        }
      }
    }

    const spawn = () => {
      const r = W.rand
      const current = W.pending
      const groupW = build(current, W.width + 10)
      const next = pickNext()
      W.pending = next
      const fast = tierFor(W.dist / 10) >= 4
      // Fairness: land from this pattern, react, then reach the take-off point of the next
      const minGap = groupW + W.speed * (airFor(current) / 2 + airFor(next) / 2 + (fast ? 0.14 : 0.2)) + 44
      W.nextGap = minGap + 20 + r() * W.speed * (fast ? 0.35 : 0.7)
    }

    const collide = () => {
      const gy = groundY()
      const d = runnerDims()
      const l = RX + d.w * 0.2
      const rr = RX + d.w * 0.82
      const b = gy + W.y - 2
      const t = gy + W.y - d.h * 0.88
      return W.obstacles.some((o) => {
        let ol = o.x + 1
        let or = o.x + o.w - 1
        let ob = gy - o.alt
        let ot = ob - o.h + 2
        if (o.kind === "bird") {
          ob = gy - birdAlt(o) - 5
          ot = ob - BIRD_H + 10
          ol = o.x + 3
          or = o.x + o.w - 3
        } else if (o.kind === "spikes") {
          ot = ob - o.h * 0.7
          ol = o.x + 3
          or = o.x + o.w - 3
        }
        return ol < rr && or > l && ot < b && ob > t
      })
    }

    const end = () => {
      W.state = "over"
      W.endedAt = performance.now()
      const finalScore = Math.floor(W.dist / 10)
      const prev = W.best
      if (finalScore > prev) {
        W.best = finalScore
        localStorage.setItem(BEST_KEY, String(finalScore))
      }
      setState("over")
      setScore(finalScore)
      setBest(Math.max(prev, finalScore))
      track("runner_game", { score: finalScore })
      if (finalScore > 0 && finalScore > recordRef.current) onRecordRef.current?.(finalScore, W.character)
      draw()
    }

    const step = (t: number) => {
      raf = 0
      if (W.state !== "running" || !visible) return
      const dt = Math.min(0.032, (t - (last || t)) / 1000)
      last = t

      W.clock += dt
      W.speed = Math.min(MAX_SPEED, W.speed + 10 * dt)
      const dx = W.speed * dt
      W.dist += dx
      W.groundOffset += dx
      W.flash = Math.max(0, W.flash - dt)
      W.toast.t = Math.max(0, W.toast.t - dt)

      // Jump physics; y is 0 on the ground and negative in the air
      W.vy += GRAVITY * dt
      W.y = Math.min(0, W.y + W.vy * dt)
      if (W.y === 0) {
        W.vy = 0
        W.jumps = 0
      }

      for (const o of W.obstacles) o.x -= o.kind === "bird" ? dx + 30 * dt : dx
      W.obstacles = W.obstacles.filter((o) => o.x + o.w > -10)
      W.nextGap -= dx
      if (W.nextGap <= 0) spawn()
      for (const c of W.clouds) {
        c.x -= dx * 0.15
        if (c.x + c.w < 0) c.x = W.width + W.rand() * 80
      }

      const s = Math.floor(W.dist / 10)
      if (s > 0 && s % 100 === 0 && s !== W.lastScoreShown) {
        W.flash = 0.6
        W.lastScoreShown = s
      }
      const tier = tierFor(s)
      if (tier > W.tier) {
        W.tier = tier
        W.toast = { text: `Level ${tier + 1}`, t: 1.8 }
      }

      // Day and night swap every 700 points
      const target = Math.floor(s / NIGHT_EVERY) % 2 === 1 ? 1 : 0
      if (W.reduced) W.night = target
      else if (W.night !== target) W.night = clamp(W.night + (target ? dt : -dt) / 1.6, 0, 1)

      if (collide()) return end()
      draw()
      raf = requestAnimationFrame(step)
    }

    const run = () => {
      if (!raf && W.state === "running" && visible) {
        last = 0
        raf = requestAnimationFrame(step)
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cw = Math.max(1, wrap.clientWidth)
      const ch = Math.max(1, wrap.clientHeight)
      // Height drives the scale; the width guard keeps narrow phones playable
      scale = clamp(Math.min(ch / BASE_H, cw / 360), 0.8, 2.2)
      k = dpr * scale
      W.width = cw / scale
      W.height = ch / scale
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
      canvas.style.width = `${cw}px`
      canvas.style.height = `${ch}px`
      wrap.style.setProperty("--runner-top", `${Math.round(bandTop() * scale) - 4}px`)
      wrap.style.setProperty("--runner-pill", `${Math.round((groundY() - 100) * scale)}px`)
      if (W.clouds.length === 0) {
        const r = mulberry32(7)
        W.clouds = Array.from({ length: 5 }, (_, i) => ({ x: (W.width / 5) * i + r() * 80, alt: 92 + r() * 40, w: 34 + r() * 30 }))
        W.stars = Array.from({ length: 28 }, () => ({ fx: r(), fy: r(), s: r() < 0.25 ? 2 : 1.2 }))
      }
      draw()
    }

    startRef.current = () => {
      W.state = "running"
      W.y = 0
      W.vy = 0
      W.jumps = 0
      W.speed = START_SPEED
      W.dist = 0
      W.clock = 0
      W.obstacles = []
      W.nextGap = 300
      W.pending = "block"
      W.flash = 0
      W.tier = 0
      W.toast = { text: "", t: 0 }
      W.night = 0
      W.lastScoreShown = -1
      W.rand = mulberry32(Math.floor(performance.now()))
      setState("running")
      run()
    }
    jumpRef.current = () => {
      if (W.state !== "running") {
        // A short grace period so a frantic tap right after crashing doesn't restart
        if (W.state === "over" && performance.now() - W.endedAt < 350) return
        return startRef.current()
      }
      if (W.y === 0 && W.jumps === 0) {
        W.vy = JUMP
        W.jumps = 1
      } else if (W.jumps < 2) {
        W.vy = JUMP2
        W.jumps = 2
      }
    }

    const stored = Number(localStorage.getItem(BEST_KEY) ?? 0)
    W.best = Number.isFinite(stored) ? stored : 0
    const char = localStorage.getItem(CHARACTER_KEY)
    if (isCharacter(char)) W.character = char
    readColors()
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      visible = onScreen && document.visibilityState === "visible"
      run()
    })
    io.observe(wrap)
    const onVisibility = () => {
      visible = onScreen && document.visibilityState === "visible"
      run()
    }
    document.addEventListener("visibilitychange", onVisibility)
    // Re-read colors when the theme changes
    const mo = new MutationObserver(() => {
      readColors()
      draw()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  const pickCharacter = (id: CharacterId) => {
    setCharacter(id)
    world.current.character = id
    localStorage.setItem(CHARACTER_KEY, id)
    drawRef.current()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Only claim keys when the game itself has focus (not the character chips)
    if (e.target !== e.currentTarget) return
    if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") {
      e.preventDefault()
      if (!e.repeat) jumpRef.current()
    }
  }

  return (
    <div
      ref={wrapRef}
      role="application"
      tabIndex={0}
      aria-label="tweenly runner game. Press Space or ArrowUp, or tap, to jump. Press again in the air to double jump."
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        e.currentTarget.focus()
        jumpRef.current()
      }}
      className={cn(
        "group relative h-full min-h-[200px] w-full cursor-pointer select-none overflow-hidden text-foreground outline-none [touch-action:manipulation] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
        className
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      {state !== "running" && (
        <>
          <div
            role="group"
            aria-label="Choose a runner"
            className="absolute left-4 top-[var(--runner-top,12px)] z-10 inline-flex rounded-full bg-background/90 p-0.5 ring-1 ring-border"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {CHARACTERS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={character === c.id}
                onClick={() => pickCharacter(c.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40",
                  character === c.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-[var(--runner-pill,60px)] flex justify-center px-4">
            <p className="rounded-full bg-background/90 px-3.5 py-1.5 text-center text-[12.5px] text-muted-foreground ring-1 ring-border">
              {state === "idle" ? (
                <>
                  Bored? <span className="font-medium text-foreground">Tap or press Space</span> to run, twice to
                  double jump
                </>
              ) : (
                <>
                  Game over · <span className="font-mono text-foreground">{score}</span>
                  {score >= best && score > 0 ? " · New best!" : ""} · tap to retry
                </>
              )}
            </p>
          </div>
        </>
      )}

      <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11.5px] text-muted-foreground transition-colors group-data-[night=true]:text-background/70">
        A nod to Chrome&apos;s offline dinosaur. Best score: <span className="font-mono">{best}</span>
      </p>
    </div>
  )
}
