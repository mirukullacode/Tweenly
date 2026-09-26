"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react"

export type CursorVariant = "ring" | "dot" | "blend" | "crosshair" | "sparkle" | "sunflower" | "rose"

export interface CursorProps {
  /** Cursor style. Default: "ring" */
  variant?: CursorVariant
  /** Main color (any CSS color). Default: foreground (gold for sparkle) */
  color?: string
  /** Size multiplier. Default: 1 */
  size?: number
  /** Follow spring stiffness. Higher = tighter. Default: 400 */
  stiffness?: number
  /** Follow spring damping. Default: 32 */
  damping?: number
  /** Drop particles behind the cursor (sparkle, sunflower, rose). Default: true */
  trail?: boolean
  /** Elements that trigger the hover state. */
  hoverSelector?: string
  /** Limit the cursor to this element. Defaults to the whole page. */
  container?: HTMLElement | null
}

const DEFAULT_HOVER = "a, button, [role=button], input, select, textarea, label, [data-cursor-hover]"
const STYLE_ID = "mc-cursor-style"

const noop = () => () => {}
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false)
}

function useFinePointer() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(pointer: fine)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => false
  )
}

/** Resolve any CSS color (including var()) to something canvas understands. */
function resolveColor(color: string) {
  const probe = document.createElement("span")
  probe.style.color = color
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}

// ------------------------------------------------------------------ particles

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  rot: number
  vr: number
  color: string
  kind: "star" | "petal"
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const d = i % 2 ? r * 0.28 : r
    ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d)
  }
  ctx.closePath()
  ctx.fill()
}

function drawPetal(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.bezierCurveTo(r * 0.8, -r * 0.6, r * 0.6, r * 0.7, 0, r)
  ctx.bezierCurveTo(-r * 0.6, r * 0.7, -r * 0.8, -r * 0.6, 0, -r)
  ctx.fill()
}

// ------------------------------------------------------------------ shapes

function Sunflower() {
  const seeds = Array.from({ length: 34 }, (_, i) => {
    const a = i * 2.39996 // golden angle
    const r = 1.9 * Math.sqrt(i)
    return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={1.3} fill="#8A5A2B" />
  })
  return (
    <svg viewBox="-50 -50 100 100" className="size-full overflow-visible drop-shadow-[0_2px_4px_rgb(0_0_0/0.35)]">
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse key={`a${i}`} cx={0} cy={-30} rx={7.5} ry={17} fill="#F4A900" transform={`rotate(${i * 22.5})`} />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse key={`b${i}`} cx={0} cy={-27} rx={6.5} ry={15} fill="#FFCB2E" transform={`rotate(${i * 22.5 + 11.25})`} />
      ))}
      <circle r={17} fill="#5A3312" />
      <circle r={13} fill="#3D210A" />
      {seeds}
    </svg>
  )
}

const ROSE_PETAL = "M0 0 C -19 -8 -21 -33 0 -37 C 21 -33 19 -8 0 0 Z"

function Rose() {
  return (
    <svg viewBox="-50 -50 100 100" className="size-full overflow-visible drop-shadow-[0_2px_4px_rgb(0_0_0/0.35)]">
      <path d="M-6 16 C -30 22 -40 38 -40 38 C -22 42 -8 32 -6 16 Z" fill="#2F7D3A" />
      <path d="M6 16 C 30 22 40 38 40 38 C 22 42 8 32 6 16 Z" fill="#3E9A4A" />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={`o${i}`} d={ROSE_PETAL} fill="#9E0F2A" transform={`rotate(${i * 72})`} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <path key={`m${i}`} d={ROSE_PETAL} fill="#C81D3A" transform={`rotate(${i * 72 + 36}) scale(0.72)`} />
      ))}
      <circle r={12} fill="#E03A54" />
      <path
        d="M0 0 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -10 0 a8 8 0 1 1 16 0"
        fill="none"
        stroke="#8E0E24"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ------------------------------------------------------------------ component

export function Cursor({
  variant = "ring",
  color,
  size = 1,
  stiffness = 400,
  damping = 32,
  trail = true,
  hoverSelector = DEFAULT_HOVER,
  container,
}: CursorProps) {
  const mounted = useMounted()
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  const [visible, setVisible] = useState(false)
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Raw pointer and a sprung follower
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const spring = reduced ? { stiffness: 2000, damping: 100 } : { stiffness, damping, mass: 0.5 }
  const sx = useSpring(x, spring)
  const sy = useSpring(y, spring)

  // Flower motion: sunflower rolls with horizontal travel, rose tilts with speed
  const roll = useTransform(sx, (v) => v * 0.6)
  const vx = useVelocity(sx)
  const tilt = useSpring(useTransform(vx, [-2500, 0, 2500], [-40, 0, 40], { clamp: true }), {
    stiffness: 200,
    damping: 18,
  })

  const accent = color ?? (variant === "sparkle" ? "#FFD76A" : "var(--foreground)")
  const particles = trail && !reduced && (variant === "sparkle" || variant === "sunflower" || variant === "rose")

  useEffect(() => {
    if (!mounted || !fine) return
    const scope: HTMLElement = container ?? document.documentElement

    // Hide the native cursor inside the scope
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style")
      style.id = STYLE_ID
      style.textContent = "[data-mc-cursor],[data-mc-cursor] *{cursor:none!important}"
      document.head.appendChild(style)
    }
    scope.setAttribute("data-mc-cursor", "")

    // Particle system
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const list: Particle[] = []
    let raf = 0
    let last: { x: number; y: number } | null = null
    const petalColors =
      variant === "rose" ? ["#9E0F2A", "#C81D3A", "#E03A54"] : ["#F4A900", "#FFCB2E", "#FFD95E"]
    const starColor = resolveColor(accent)

    const resize = () => {
      if (!canvas || !ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const loop = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i]
        p.life++
        if (p.life >= p.max) {
          list.splice(i, 1)
          continue
        }
        if (p.kind === "petal") {
          p.vy += 0.06 // gravity
          p.vx += Math.sin(p.life / 9) * 0.05 // flutter
        } else {
          p.vx *= 0.94
          p.vy *= 0.94
        }
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        const t = p.life / p.max
        ctx.save()
        ctx.globalAlpha = p.kind === "star" ? 1 - t : Math.min(1, (1 - t) * 1.6)
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        if (p.kind === "star") drawStar(ctx, p.size * (1 - t * 0.6))
        else drawPetal(ctx, p.size)
        ctx.restore()
      }
      raf = list.length ? requestAnimationFrame(loop) : 0
    }

    const spawn = (px: number, py: number) => {
      if (!particles || !last) return
      const dist = Math.hypot(px - last.x, py - last.y)
      const every = variant === "sparkle" ? 14 : 38
      if (dist < every) return
      last = { x: px, y: py }
      const petal = variant !== "sparkle"
      list.push({
        x: px + (Math.random() - 0.5) * 10 * size,
        y: py + (Math.random() - 0.5) * 10 * size,
        vx: (Math.random() - 0.5) * (petal ? 1.2 : 1.6),
        vy: petal ? -Math.random() * 1.2 : (Math.random() - 0.5) * 1.6,
        life: 0,
        max: petal ? 90 + Math.random() * 40 : 36 + Math.random() * 20,
        size: (petal ? 4 + Math.random() * 3 : 3 + Math.random() * 4) * size,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * (petal ? 0.12 : 0.2),
        color: petal ? petalColors[Math.floor(Math.random() * petalColors.length)] : starColor,
        kind: petal ? "petal" : "star",
      })
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return
      x.set(e.clientX)
      y.set(e.clientY)
      if (variant === "crosshair") setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) })
      setVisible(true)
      setHover(!!(e.target as Element | null)?.closest?.(hoverSelector))
      if (!last) last = { x: e.clientX, y: e.clientY }
      spawn(e.clientX, e.clientY)
    }
    const onLeave = () => {
      setVisible(false)
      last = null
    }
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)

    resize()
    window.addEventListener("resize", resize)
    const target: HTMLElement | Window = container ?? window
    target.addEventListener("pointermove", onMove as EventListener)
    target.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", onUp)
    if (container) container.addEventListener("pointerleave", onLeave)
    else document.documentElement.addEventListener("mouseleave", onLeave)

    return () => {
      cancelAnimationFrame(raf)
      scope.removeAttribute("data-mc-cursor")
      window.removeEventListener("resize", resize)
      target.removeEventListener("pointermove", onMove as EventListener)
      target.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      if (container) container.removeEventListener("pointerleave", onLeave)
      else document.documentElement.removeEventListener("mouseleave", onLeave)
    }
  }, [mounted, fine, container, variant, hoverSelector, particles, accent, size, x, y])

  if (!mounted || !fine) return null

  const scale = pressed ? 0.8 : 1
  const fade = { opacity: visible ? 1 : 0, transition: "opacity 150ms" }

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]" style={fade}>
      {particles && <canvas ref={canvasRef} className="absolute inset-0 size-full" />}
      <Shape
        variant={variant}
        x={x}
        y={y}
        sx={sx}
        sy={sy}
        roll={roll}
        tilt={tilt}
        color={accent}
        size={size}
        hover={hover}
        scale={scale}
        coords={coords}
      />
    </div>,
    document.body
  )
}

function Shape({ variant, x, y, sx, sy, roll, tilt, color, size, hover, scale, coords }: {
  variant: CursorVariant
  x: MotionValue<number>
  y: MotionValue<number>
  sx: MotionValue<number>
  sy: MotionValue<number>
  roll: MotionValue<number>
  tilt: MotionValue<number>
  color: string
  size: number
  hover: boolean
  scale: number
  coords: { x: number; y: number }
}) {
  const spring = { type: "spring", stiffness: 500, damping: 30 } as const
  const center = "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"

  switch (variant) {
    case "ring":
      return (
        <>
          <motion.div
            className={`${center} rounded-full border-[1.5px]`}
            style={{ x: sx, y: sy, width: 34 * size, height: 34 * size, borderColor: color }}
            animate={{ scale: (hover ? 1.6 : 1) * scale, opacity: hover ? 0.6 : 1 }}
            transition={spring}
          />
          <motion.div
            className={`${center} rounded-full`}
            style={{ x, y, width: 6 * size, height: 6 * size, background: color }}
            animate={{ scale: hover ? 0 : 1 }}
            transition={spring}
          />
        </>
      )

    case "dot":
      return (
        <motion.div
          className={`${center} rounded-full`}
          style={{ x: sx, y: sy, width: 12 * size, height: 12 * size, background: color }}
          animate={{ scale: (hover ? 3.2 : 1) * scale, opacity: hover ? 0.35 : 1 }}
          transition={spring}
        />
      )

    case "blend":
      return (
        <motion.div
          className={`${center} rounded-full bg-white mix-blend-difference`}
          style={{ x: sx, y: sy, width: 30 * size, height: 30 * size }}
          animate={{ scale: (hover ? 2.6 : 1) * scale }}
          transition={spring}
        />
      )

    case "crosshair":
      return (
        <motion.div className={center} style={{ x: sx, y: sy }}>
          <motion.div
            className="relative"
            style={{ width: 30 * size, height: 30 * size }}
            animate={{ rotate: hover ? 45 : 0, scale }}
            transition={spring}
          >
            <span className="absolute left-0 top-1/2 h-px w-[38%] -translate-y-1/2" style={{ background: color }} />
            <span className="absolute right-0 top-1/2 h-px w-[38%] -translate-y-1/2" style={{ background: color }} />
            <span className="absolute left-1/2 top-0 h-[38%] w-px -translate-x-1/2" style={{ background: color }} />
            <span className="absolute bottom-0 left-1/2 h-[38%] w-px -translate-x-1/2" style={{ background: color }} />
          </motion.div>
          <span
            className="absolute left-full top-full ml-1 mt-1 whitespace-nowrap font-mono text-[10px] tabular-nums opacity-70"
            style={{ color }}
          >
            {coords.x}, {coords.y}
          </span>
        </motion.div>
      )

    case "sparkle":
      return (
        <motion.div className={center} style={{ x: sx, y: sy, width: 22 * size, height: 22 * size }}>
          <motion.svg
            viewBox="-10 -10 20 20"
            className="size-full"
            animate={{ rotate: 360, scale: (hover ? 1.5 : 1) * scale }}
            transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, scale: spring }}
          >
            <path d="M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4 Z" fill={color} />
          </motion.svg>
        </motion.div>
      )

    case "sunflower":
      return (
        <motion.div className={center} style={{ x: sx, y: sy, width: 40 * size, height: 40 * size, rotate: roll }}>
          <motion.div className="size-full" animate={{ scale: (hover ? 1.35 : 1) * scale }} transition={spring}>
            <Sunflower />
          </motion.div>
        </motion.div>
      )

    case "rose":
      return (
        <motion.div className={center} style={{ x: sx, y: sy, width: 40 * size, height: 40 * size, rotate: tilt }}>
          <motion.div className="size-full" animate={{ scale: (hover ? 1.35 : 1) * scale }} transition={spring}>
            <Rose />
          </motion.div>
        </motion.div>
      )
  }
}
