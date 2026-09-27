"use client"

import { useEffect, useEffectEvent, useRef, type ReactNode, type RefObject } from "react"
import { motion, useAnimate, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------- types

export type ConfettiShape = "square" | "circle" | "strip" | "star"
export type ConfettiPreset = "burst" | "cannons" | "fireworks" | "rain" | "pride" | "stream"

export interface ConfettiOptions {
  /** Effect preset. Default: "burst" */
  preset?: ConfettiPreset
  /** Particles per shot (per cannon, per firework). For rain and streams this is the total over `duration`. Default: preset-specific (burst 90) */
  particleCount?: number
  /** Cone width in degrees. Default: preset-specific (burst 70) */
  spread?: number
  /** Launch direction in degrees, 90 is straight up. Default: 90 */
  angle?: number
  /** Initial speed in px per frame. Default: preset-specific (burst 45) */
  startVelocity?: number
  /** Gravity multiplier. Default: 1 */
  gravity?: number
  /** Constant sideways drift, negative drifts left. Default: 0 */
  drift?: number
  /** Velocity kept each frame, 0 to 1. Lower stops particles faster. Default: 0.9 */
  decay?: number
  /** Particle size multiplier. Default: 1 */
  scalar?: number
  /** Particle lifetime in frames (60 per second). Default: 200 */
  ticks?: number
  /** Launch point as a fraction of the viewport or container, 0 to 1. Default: { x: 0.5, y: 0.6 } */
  origin?: { x?: number; y?: number }
  /** Particle colors. Default: ["#ff4d12", "#ff8a4c", "#ffd2b8", "#ededed", "#8a8a8a", "#0a0a0a"] */
  colors?: string[]
  /** Particle shapes, picked at random. Default: ["square", "circle", "strip"] */
  shapes?: ConfettiShape[]
  /** Render these emoji as particles instead of shapes. */
  emoji?: string[]
  /** Length of timed presets (fireworks, rain, pride, stream) in seconds. Default: preset-specific (2 to 3) */
  duration?: number
  /** z-index of the full-viewport canvas. Default: 100 */
  zIndex?: number
  /** Do nothing when the user prefers reduced motion. Default: true */
  disableForReducedMotion?: boolean
}

export const CONFETTI_COLORS = ["#ff4d12", "#ff8a4c", "#ffd2b8", "#ededed", "#8a8a8a", "#0a0a0a"]
const PRIDE_COLORS = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"]

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  gravity: number
  drift: number
  decay: number
  size: number
  color: string
  shape: ConfettiShape | "emoji" | "rocket"
  emoji: string
  rot: number
  rotSpeed: number
  flip: number
  flipSpeed: number
  wobble: number
  wobbleSpeed: number
  tick: number
  ticks: number
  /** Rockets explode into this shot at their apex. */
  payload: Shot | null
}

interface Shot {
  particleCount: number
  spread: number
  angle: number
  startVelocity: number
  gravity: number
  drift: number
  decay: number
  scalar: number
  ticks: number
  colors: string[]
  shapes: ConfettiShape[]
  emoji: string[]
}

/** Returns false once finished. Runs inside the shared animation frame. */
type Emitter = (dt: number) => boolean

// ---------------------------------------------------------------- engine

const STAR = (() => {
  if (typeof Path2D === "undefined") return null
  const p = new Path2D()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.45
    const a = (Math.PI / 5) * i - Math.PI / 2
    if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else p.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  p.closePath()
  return p
})()

const emojiCache = new Map<string, HTMLCanvasElement>()
function emojiBitmap(char: string) {
  let c = emojiCache.get(char)
  if (!c) {
    c = document.createElement("canvas")
    c.width = c.height = 64
    const ctx = c.getContext("2d")
    if (ctx) {
      ctx.font = "52px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(char, 32, 36)
    }
    emojiCache.set(char, c)
  }
  return c
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

class Engine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private particles: Particle[] = []
  private pool: Particle[] = []
  private emitters: Emitter[] = []
  private raf = 0
  private last = 0
  private dpr = 1
  private resizeObserver: ResizeObserver | null = null
  private idleWaiters: (() => void)[] = []
  width = 0
  height = 0

  constructor(
    private container: HTMLElement | null,
    zIndex: number,
    private onIdle: () => void
  ) {
    const canvas = document.createElement("canvas")
    canvas.setAttribute("aria-hidden", "true")
    Object.assign(canvas.style, {
      position: container ? "absolute" : "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: String(zIndex),
    })
    if (container && getComputedStyle(container).position === "static") container.style.position = "relative"
    ;(container ?? document.body).appendChild(canvas)
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.resize()
    if (container && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.resize)
      this.resizeObserver.observe(container)
    } else {
      window.addEventListener("resize", this.resize)
    }
  }

  private resize = () => {
    const rect = this.container?.getBoundingClientRect()
    this.width = rect ? rect.width : window.innerWidth
    this.height = rect ? rect.height : window.innerHeight
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr))
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr))
  }

  setZIndex(z: number) {
    this.canvas.style.zIndex = String(z)
  }

  whenIdle() {
    return new Promise<void>((resolve) => this.idleWaiters.push(resolve))
  }

  addEmitter(emitter: Emitter) {
    this.emitters.push(emitter)
    this.start()
  }

  /** Spawn a shot at a pixel position. */
  shoot(x: number, y: number, s: Shot) {
    const useEmoji = s.emoji.length > 0
    for (let i = 0; i < s.particleCount; i++) {
      const p = this.pool.pop() ?? ({} as Particle)
      const angle = ((s.angle + rand(-s.spread / 2, s.spread / 2)) * Math.PI) / 180
      const speed = s.startVelocity * rand(0.5, 1.5)
      p.x = x
      p.y = y
      p.vx = Math.cos(angle) * speed
      p.vy = -Math.sin(angle) * speed
      p.gravity = s.gravity
      p.drift = s.drift
      p.decay = s.decay
      p.size = 9 * s.scalar * rand(0.75, 1.25)
      p.color = pick(s.colors) ?? CONFETTI_COLORS[0]
      p.shape = useEmoji ? "emoji" : (pick(s.shapes) ?? "square")
      p.emoji = useEmoji ? (pick(s.emoji) ?? "") : ""
      p.rot = rand(0, Math.PI * 2)
      p.rotSpeed = rand(-0.12, 0.12)
      p.flip = rand(0, Math.PI * 2)
      p.flipSpeed = rand(0.08, 0.2)
      p.wobble = rand(0, Math.PI * 2)
      p.wobbleSpeed = rand(0.04, 0.1)
      p.tick = 0
      p.ticks = s.ticks * rand(0.85, 1.15)
      p.payload = null
      this.particles.push(p)
    }
    this.start()
  }

  /** Launch a rocket from (x, y) that explodes with `payload` near `targetY`. */
  rocket(x: number, y: number, targetY: number, payload: Shot) {
    const p = this.pool.pop() ?? ({} as Particle)
    const g = 0.28
    Object.assign(p, {
      x,
      y,
      vx: rand(-0.8, 0.8),
      vy: -Math.sqrt(2 * g * Math.max(40, y - targetY)),
      gravity: g,
      drift: 0,
      decay: 1,
      size: 3,
      color: pick(payload.colors) ?? CONFETTI_COLORS[0],
      shape: "rocket",
      emoji: "",
      rot: 0,
      rotSpeed: 0,
      flip: 0,
      flipSpeed: 0,
      wobble: 0,
      wobbleSpeed: 0,
      tick: 0,
      ticks: 600,
      payload,
    } satisfies Particle)
    this.particles.push(p)
    this.start()
  }

  private start() {
    if (this.raf) return
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  private frame = (now: number) => {
    const dt = Math.min((now - this.last) / (1000 / 60), 3)
    this.last = now
    const ctx = this.ctx

    for (let i = this.emitters.length - 1; i >= 0; i--) {
      if (!this.emitters[i](dt)) this.emitters.splice(i, 1)
    }

    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    const list = this.particles
    const dpr = this.dpr
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i]
      p.tick += dt

      if (p.shape === "rocket") {
        p.vy += p.gravity * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.vy >= -0.5 && p.payload) {
          this.shoot(p.x, p.y, p.payload)
          this.release(i)
          continue
        }
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.globalAlpha = 1
          ctx.strokeStyle = p.color
          ctx.lineWidth = 2
          ctx.lineCap = "round"
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4)
          ctx.stroke()
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        continue
      }

      const drag = Math.pow(p.decay, dt)
      p.vx *= drag
      p.vy = p.vy * drag + p.gravity * 0.35 * dt
      p.x += (p.vx + p.drift) * dt
      p.y += p.vy * dt
      p.rot += p.rotSpeed * dt
      p.flip += p.flipSpeed * dt
      p.wobble += p.wobbleSpeed * dt

      const life = p.tick / p.ticks
      if (life >= 1 || p.y > this.height + 40 || p.x < -80 || p.x > this.width + 80) {
        this.release(i)
        continue
      }
      if (!ctx) continue

      ctx.globalAlpha = life > 0.7 ? 1 - (life - 0.7) / 0.3 : 1
      const x = p.x + Math.cos(p.wobble) * p.size * 0.6
      const cos = Math.cos(p.rot)
      const sin = Math.sin(p.rot)
      const fy = p.shape === "emoji" ? 1 : Math.cos(p.flip)
      ctx.setTransform(dpr * cos, dpr * sin, -dpr * sin * fy, dpr * cos * fy, dpr * x, dpr * p.y)

      const s = p.size
      if (p.shape === "emoji") {
        ctx.drawImage(emojiBitmap(p.emoji), -s * 1.2, -s * 1.2, s * 2.4, s * 2.4)
        continue
      }
      ctx.fillStyle = p.color
      if (p.shape === "circle") {
        ctx.beginPath()
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.shape === "strip") {
        ctx.fillRect(-s * 0.18, -s * 0.8, s * 0.36, s * 1.6)
      } else if (p.shape === "star" && STAR) {
        ctx.scale(s * 0.7, s * 0.7)
        ctx.fill(STAR)
      } else {
        ctx.fillRect(-s * 0.5, -s * 0.5, s, s)
      }
    }

    if (list.length === 0 && this.emitters.length === 0) {
      this.raf = 0
      this.destroy()
      return
    }
    this.raf = requestAnimationFrame(this.frame)
  }

  private release(i: number) {
    const list = this.particles
    const p = list[i]
    list[i] = list[list.length - 1]
    list.pop()
    p.payload = null
    if (this.pool.length < 1500) this.pool.push(p)
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.particles.length = 0
    this.emitters.length = 0
    this.resizeObserver?.disconnect()
    window.removeEventListener("resize", this.resize)
    this.canvas.remove()
    this.onIdle()
    const waiters = this.idleWaiters
    this.idleWaiters = []
    waiters.forEach((resolve) => resolve())
  }
}

let viewportEngine: Engine | null = null
const containerEngines = new WeakMap<HTMLElement, Engine>()

function getEngine(container: HTMLElement | null, zIndex: number) {
  if (!container) {
    if (!viewportEngine) viewportEngine = new Engine(null, zIndex, () => (viewportEngine = null))
    else viewportEngine.setZIndex(zIndex)
    return viewportEngine
  }
  let engine = containerEngines.get(container)
  if (!engine) {
    engine = new Engine(container, zIndex, () => containerEngines.delete(container))
    containerEngines.set(container, engine)
  }
  return engine
}

// ---------------------------------------------------------------- presets

const PRESET_DEFAULTS: Record<ConfettiPreset, { particleCount: number; spread: number; startVelocity: number; duration: number }> = {
  burst: { particleCount: 90, spread: 70, startVelocity: 45, duration: 0 },
  cannons: { particleCount: 70, spread: 55, startVelocity: 55, duration: 0 },
  fireworks: { particleCount: 70, spread: 360, startVelocity: 26, duration: 2.2 },
  rain: { particleCount: 220, spread: 20, startVelocity: 2, duration: 3 },
  pride: { particleCount: 240, spread: 55, startVelocity: 50, duration: 2.5 },
  stream: { particleCount: 200, spread: 55, startVelocity: 50, duration: 2.5 },
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function run(options: ConfettiOptions, container: HTMLElement | null): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  const { disableForReducedMotion = true, preset = "burst", zIndex = 100 } = options
  if (disableForReducedMotion && prefersReducedMotion()) return Promise.resolve()

  const d = PRESET_DEFAULTS[preset] ?? PRESET_DEFAULTS.burst
  const shot: Shot = {
    particleCount: Math.max(0, Math.round(options.particleCount ?? d.particleCount)),
    spread: options.spread ?? d.spread,
    angle: options.angle ?? 90,
    startVelocity: options.startVelocity ?? d.startVelocity,
    gravity: options.gravity ?? 1,
    drift: options.drift ?? 0,
    decay: Math.min(Math.max(options.decay ?? 0.9, 0), 1),
    scalar: options.scalar ?? 1,
    ticks: options.ticks ?? 200,
    colors: options.colors?.length ? options.colors : preset === "pride" ? PRIDE_COLORS : CONFETTI_COLORS,
    shapes: options.shapes?.length ? options.shapes : ["square", "circle", "strip"],
    emoji: options.emoji ?? [],
  }
  const duration = (options.duration ?? d.duration) * 60 // frames
  const engine = getEngine(container, zIndex)
  const W = engine.width
  const H = engine.height
  const ox = (options.origin?.x ?? 0.5) * W
  const oy = (options.origin?.y ?? 0.6) * H

  /** Emits `total` particles evenly over `duration` frames via `spawn(count)`. */
  const timed = (total: number, spawn: (count: number) => void): Emitter => {
    let elapsed = 0
    let emitted = 0
    return (dt) => {
      elapsed += dt
      const due = Math.min(total, Math.round((elapsed / Math.max(duration, 1)) * total))
      if (due > emitted) spawn(due - emitted)
      emitted = due
      return elapsed < duration && emitted < total
    }
  }

  switch (preset) {
    case "cannons": {
      // particleCount is per cannon
      engine.shoot(0, H, { ...shot, angle: options.angle ?? 60 })
      engine.shoot(W, H, { ...shot, angle: 180 - (options.angle ?? 60) })
      break
    }
    case "fireworks": {
      const rockets = Math.max(3, Math.round(duration / 22))
      const schedule = Array.from({ length: rockets }, (_, i) => (i / rockets) * duration + rand(0, 10))
      let elapsed = 0
      let next = 0
      engine.addEmitter((dt) => {
        elapsed += dt
        while (next < schedule.length && elapsed >= schedule[next]) {
          const x = W * rand(0.2, 0.8)
          engine.rocket(x, H + 4, H * rand(0.18, 0.42), {
            ...shot,
            ticks: Math.min(shot.ticks, 150),
            gravity: shot.gravity * 0.8,
            decay: Math.min(shot.decay, 0.92),
            colors: [pick(shot.colors) ?? CONFETTI_COLORS[0], pick(shot.colors) ?? CONFETTI_COLORS[1], "#ffffff"],
          })
          next++
        }
        return next < schedule.length
      })
      break
    }
    case "rain": {
      const drop: Shot = { ...shot, angle: 270, ticks: Math.max(shot.ticks, 600), particleCount: 1 }
      engine.addEmitter(
        timed(shot.particleCount, (count) => {
          for (let i = 0; i < count; i++) engine.shoot(rand(0, W), -20, { ...drop, drift: shot.drift + rand(-0.4, 0.4) })
        })
      )
      break
    }
    case "pride":
    case "stream": {
      const side: Shot = { ...shot, particleCount: 1 }
      const angle = options.angle ?? 60
      const y = (options.origin?.y ?? 0.65) * H
      engine.addEmitter(
        timed(shot.particleCount, (count) => {
          for (let i = 0; i < count; i++) {
            if (i % 2 === 0) engine.shoot(0, y, { ...side, angle })
            else engine.shoot(W, y, { ...side, angle: 180 - angle })
          }
        })
      )
      break
    }
    default:
      engine.shoot(ox, oy, shot)
  }

  return engine.whenIdle()
}

/**
 * Fire confetti on a shared full-viewport canvas. The canvas is created lazily and
 * removed as soon as the last particle is gone. Resolves when the effect finishes.
 */
export function confetti(options: ConfettiOptions = {}): Promise<void> {
  return run(options, null)
}

/** Stop every viewport effect immediately. */
confetti.reset = () => {
  viewportEngine?.destroy()
}

// ---------------------------------------------------------------- hook

/**
 * Returns a stable `fire(options)`. Pass a ref to confine confetti to that element
 * (origin becomes relative to it); omit it for the full viewport.
 */
export function useConfetti(container?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = container?.current
    return () => {
      if (el) containerEngines.get(el)?.destroy()
    }
  }, [container])

  // Reads the ref at call time, never during render
  return function fire(options: ConfettiOptions = {}) {
    return run(options, container?.current ?? null)
  }
}

// ---------------------------------------------------------------- button

export type ConfettiButtonProps = ConfettiOptions &
  Omit<HTMLMotionProps<"button">, "children" | "color"> & {
    /** Button label. Default: "Celebrate" */
    children?: ReactNode
    /** Button background (any CSS color). Default: "#ff4d12" */
    color?: string
  }

const OPTION_KEYS = [
  "preset",
  "particleCount",
  "spread",
  "angle",
  "startVelocity",
  "gravity",
  "drift",
  "decay",
  "scalar",
  "ticks",
  "origin",
  "colors",
  "shapes",
  "emoji",
  "duration",
  "zIndex",
  "disableForReducedMotion",
] as const satisfies readonly (keyof ConfettiOptions)[]

function splitOptions<T extends ConfettiOptions>(props: T) {
  const options: ConfettiOptions = {}
  const rest: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(props)) {
    if ((OPTION_KEYS as readonly string[]).includes(k)) (options as Record<string, unknown>)[k] = v
    else rest[k] = v
  }
  return { options, rest: rest as Omit<T, keyof ConfettiOptions> }
}

/** A button that bursts confetti from its own position with a springy press. */
export function ConfettiButton(props: ConfettiButtonProps) {
  const { options, rest } = splitOptions(props)
  const { children = "Celebrate", color = "#ff4d12", className, style, onClick, disabled, ...buttonProps } = rest
  const [scope, animate] = useAnimate<HTMLButtonElement>()

  return (
    <motion.button
      ref={scope}
      type="button"
      disabled={disabled}
      {...buttonProps}
      className={cn(
        "relative inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium text-white outline-none select-none",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_10px_24px_-10px_var(--cb-color)] focus-visible:ring-2 focus-visible:ring-[color:var(--cb-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={{ backgroundColor: color, ["--cb-color" as string]: color, ...style }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.92, y: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        const origin = options.origin ?? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
        void confetti({ ...options, origin })
        if (!prefersReducedMotion()) {
          animate(el, { scale: [0.9, 1.08, 1] }, { duration: 0.45, ease: [0.22, 1, 0.36, 1] })
        }
      }}
    >
      {children}
    </motion.button>
  )
}

// ---------------------------------------------------------------- declarative

export interface ConfettiProps extends ConfettiOptions {
  /** When to fire: on mount, when scrolled into view, or when `active` becomes true. Default: "manual" */
  trigger?: "mount" | "inView" | "manual"
  /** Fires every time this flips to true (manual trigger). Default: false */
  active?: boolean
  /** Confine the effect to this element instead of the viewport. */
  container?: RefObject<HTMLElement | null>
}

/** Declarative confetti. Renders an invisible marker and fires based on `trigger`. */
export function Confetti({ trigger = "manual", active = false, container, ...options }: ConfettiProps) {
  const markerRef = useRef<HTMLSpanElement>(null)
  const fire = useConfetti(container)
  const shoot = useEffectEvent(() => {
    void fire(options)
  })

  useEffect(() => {
    if (trigger === "mount") shoot()
  }, [trigger])

  useEffect(() => {
    if (trigger === "manual" && active) shoot()
  }, [trigger, active])

  useEffect(() => {
    const el = markerRef.current
    if (trigger !== "inView" || !el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          shoot()
          io.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [trigger])

  return <span ref={markerRef} aria-hidden="true" className="pointer-events-none block h-px w-px" />
}
