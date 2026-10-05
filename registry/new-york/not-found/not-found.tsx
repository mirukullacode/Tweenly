"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react"
import {
  animate as animateValue,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react"
import { ArrowLeft, ArrowUpRight, Hand } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type NotFoundVariant = "eyes" | "spotlight" | "drag" | "orbit" | "scramble"
export type NotFoundDigitFont = "display" | "sans" | "mono"

export interface NotFoundAction {
  /** Button text. */
  label: string
  /** Renders a link when set, otherwise a button. */
  href?: string
  /** Click handler (runs before navigation for links). */
  onClick?: () => void
}

export interface NotFoundProps {
  /** Visual style of the hero. Default: "eyes" */
  variant?: NotFoundVariant
  /** Status code shown as the giant hero. Zeros become the eye / planet. Default: "404" */
  code?: string
  /** Short headline under the code. Default: "Page not found" */
  title?: string
  /** Supporting line. Default: a short sentence that matches the variant */
  description?: string
  /** Requested path. Shown in the scramble log (falls back to the current URL) and as a chip elsewhere when set. Default: undefined */
  path?: string
  /** Primary action. Default: { label: "Back home", href: "/" } */
  primaryAction?: NotFoundAction
  /** Secondary action. Pass null to hide. Default: { label: "Browse docs", href: "/docs" } */
  secondaryAction?: NotFoundAction | null
  /** Accent color (iris, moon, scramble glyphs, accent tile). Default: "#ff4d12" */
  accent?: string
  /** Section background (any CSS color). Default: theme background ("#0a0a0a" for spotlight and orbit) */
  background?: string
  /** Text and digit color (any CSS color). Default: theme foreground ("#ededed" for spotlight and orbit) */
  color?: string
  /** Secondary text color (any CSS color). Default: theme muted foreground ("#8f8f8f" for spotlight and orbit) */
  muted?: string
  /** Typeface of the digits. Default: "display" */
  digitFont?: NotFoundDigitFont
  /** Multiplier for the digit size (sized in container query units). Default: 1 */
  size?: number
  /** Enable animation. Reduced motion always renders static final states. Default: true */
  animate?: boolean
  /** Additional classes for the root section. */
  className?: string
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const
const SPRING = { stiffness: 450, damping: 34 }

const DARK_BG = "#0a0a0a"
const DARK_FG = "#ededed"
const DARK_MUTED = "#8f8f8f"

const DESCRIPTIONS: Record<NotFoundVariant, string> = {
  eyes: "We looked everywhere. This page isn't here.",
  spotlight: "It's a little dark in here, and the page you want isn't.",
  drag: "This page fell apart. Feel free to play with the pieces.",
  orbit: "This page drifted out of orbit. Let's get you back.",
  scramble: "That address didn't resolve to anything we know.",
}

const DEFAULT_PRIMARY: NotFoundAction = { label: "Back home", href: "/" }
const DEFAULT_SECONDARY: NotFoundAction = { label: "Browse docs", href: "/docs" }

const FONTS: Record<NotFoundDigitFont, string> = {
  display: "font-[family-name:var(--font-display)] font-bold",
  sans: "font-sans font-semibold tracking-[-0.06em]",
  mono: "font-mono font-medium tracking-[-0.04em]",
}

const CONTENT =
  "relative z-10 flex w-full flex-col items-center justify-center gap-[clamp(1.25rem,4cqw,2.25rem)] px-6 py-12 text-center"

// ---------------------------------------------------------------------------
// Shared helpers

/** True while the element is on screen and the tab is visible. */
function useActive(ref: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    io.observe(el)
    const onVisibility = () => setVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [ref])
  return inView && visible
}

const noopSubscribe = () => () => {}

function useLocationPath(fallback: string) {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.pathname,
    () => fallback
  )
}

function mulberry32(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const STARS = (() => {
  const rand = mulberry32(404)
  return Array.from({ length: 56 }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 1 + rand() * 1.6,
    opacity: 0.15 + rand() * 0.45,
    duration: 2.4 + rand() * 3.6,
    delay: rand() * -6,
  }))
})()

function hash(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Indices of the zeros, or the middle character when there are none. */
function specialIndices(chars: string[]) {
  const zeros = chars.flatMap((c, i) => (c === "0" ? [i] : []))
  return zeros.length ? zeros : [Math.floor(chars.length / 2)]
}

function enter(reduced: boolean, delay = 0, y = 14) {
  return {
    initial: reduced ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE_OUT, delay },
  } as const
}

// ---------------------------------------------------------------------------
// Copy + actions

function ActionButton({ action, primary, tabIndex }: { action: NotFoundAction; primary?: boolean; tabIndex?: number }) {
  const className = cn(
    "group inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium whitespace-nowrap",
    "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:translate-y-0",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--nf-accent)]",
    !primary && "border [border-color:var(--nf-line)]"
  )
  const style: CSSProperties | undefined = primary ? { background: "var(--nf-fg)", color: "var(--nf-bg)" } : undefined
  const content = (
    <>
      {primary && (
        <ArrowLeft
          aria-hidden="true"
          className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5"
        />
      )}
      {action.label}
      {!primary && (
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 opacity-60 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  )
  if (action.href) {
    return (
      <a href={action.href} onClick={action.onClick} className={className} style={style} tabIndex={tabIndex}>
        {content}
      </a>
    )
  }
  return (
    <button type="button" onClick={action.onClick} className={className} style={style} tabIndex={tabIndex}>
      {content}
    </button>
  )
}

interface CopyProps {
  code: string
  title: string
  description: string
  chip?: string
  primary: NotFoundAction
  secondary: NotFoundAction | null
  reduced: boolean
  delay: number
  titleNode?: ReactNode
  hidden?: boolean
}

function Copy({ code, title, description, chip, primary, secondary, reduced, delay, titleNode, hidden }: CopyProps) {
  return (
    <div
      className={cn("flex flex-col items-center gap-[clamp(1rem,2.6cqw,1.5rem)]", hidden && "invisible")}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <div className="flex max-w-[34rem] flex-col items-center gap-2.5">
        {chip && (
          <motion.code
            {...enter(reduced, delay - 0.08, 8)}
            className="rounded-full border px-2.5 py-0.5 font-mono text-xs text-(--nf-muted) [border-color:var(--nf-line)]"
          >
            {chip}
          </motion.code>
        )}
        <motion.h1
          {...enter(reduced, delay)}
          className="text-[clamp(1.35rem,3.4cqw,2.25rem)] leading-tight font-semibold tracking-tight text-balance"
          aria-label={hidden ? undefined : `${code}: ${title}`}
        >
          {titleNode ?? title}
        </motion.h1>
        <motion.p
          {...enter(reduced, delay + 0.06)}
          className="text-[clamp(0.875rem,1.7cqw,1.0625rem)] leading-relaxed text-pretty text-(--nf-muted)"
        >
          {description}
        </motion.p>
      </div>
      <motion.div {...enter(reduced, delay + 0.12)} className="flex flex-wrap items-center justify-center gap-3">
        <ActionButton action={primary} primary tabIndex={hidden ? -1 : undefined} />
        {secondary && <ActionButton action={secondary} tabIndex={hidden ? -1 : undefined} />}
      </motion.div>
    </div>
  )
}

function Digit({ char, font, className }: { char: string; font: string; className?: string }) {
  return <span className={cn("inline-block leading-[0.8]", font, className)}>{char}</span>
}

// ---------------------------------------------------------------------------
// 1. Eyes

function Eye({ lookX, lookY, blink }: { lookX: MotionValue<number>; lookY: MotionValue<number>; blink: MotionValue<number> }) {
  const x = useTransform(lookX, (v) => `${v * 0.12}em`)
  const y = useTransform(lookY, (v) => `${v * 0.15}em`)
  return (
    <motion.span
      style={{ scaleY: blink }}
      className="relative mx-[0.02em] inline-block h-[0.72em] w-[0.6em] rounded-[50%] border-[0.095em] border-current"
    >
      <span className="absolute inset-0 grid place-items-center overflow-hidden rounded-[50%]">
        <motion.span
          style={{ x, y, background: "var(--nf-accent)" }}
          className="relative grid size-[0.24em] place-items-center rounded-full"
        >
          <span className="size-[0.11em] rounded-full bg-[#0a0a0a]" />
          <span className="absolute top-[0.045em] right-[0.05em] size-[0.045em] rounded-full bg-white/90" />
        </motion.span>
      </span>
    </motion.span>
  )
}

function EyesHero({ chars, font, reduced, active }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const lookX = useMotionValue(0)
  const lookY = useMotionValue(0)
  const sx = useSpring(lookX, { stiffness: 420, damping: 34 })
  const sy = useSpring(lookY, { stiffness: 420, damping: 34 })
  const blink = useMotionValue(1)
  const eyes = specialIndices(chars)

  useEffect(() => {
    if (reduced) {
      lookX.jump(0.35)
      lookY.jump(-0.3)
      sx.jump(0.35)
      sy.jump(-0.3)
      blink.jump(1)
      return
    }
    if (!active) return
    let lastMove = 0
    let glanceTimer = 0
    let blinkTimer = 0
    const onMove = (e: PointerEvent) => {
      const el = heroRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy) || 1
      const reach = Math.min(1, dist / Math.max(r.height, 80))
      lookX.set((dx / dist) * reach)
      lookY.set((dy / dist) * reach)
      lastMove = performance.now()
    }
    const glance = () => {
      if (performance.now() - lastMove > 2500) {
        if (Math.random() < 0.25) {
          lookX.set(0)
          lookY.set(0)
        } else {
          const a = Math.random() * Math.PI * 2
          const m = 0.55 + Math.random() * 0.45
          lookX.set(Math.cos(a) * m)
          lookY.set(Math.sin(a) * m * 0.8)
        }
      }
      glanceTimer = window.setTimeout(glance, 1100 + Math.random() * 1500)
    }
    const doBlink = () => {
      const twice = Math.random() < 0.2
      animateValue(blink, twice ? [1, 0.08, 1, 0.08, 1] : [1, 0.08, 1], {
        duration: twice ? 0.46 : 0.22,
        ease: EASE_IN_OUT,
      })
      blinkTimer = window.setTimeout(doBlink, 2800 + Math.random() * 2800)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    glanceTimer = window.setTimeout(glance, 1600)
    blinkTimer = window.setTimeout(doBlink, 1400)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.clearTimeout(glanceTimer)
      window.clearTimeout(blinkTimer)
      blink.jump(1)
    }
  }, [active, reduced, lookX, lookY, sx, sy, blink])

  return (
    <motion.div
      ref={heroRef}
      aria-hidden="true"
      initial={reduced ? false : { opacity: 0, y: 24, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
      className="flex items-baseline justify-center gap-[0.03em] text-(length:--nf-digit) select-none"
    >
      {chars.map((c, i) =>
        eyes.includes(i) ? <Eye key={i} lookX={sx} lookY={sy} blink={blink} /> : <Digit key={i} char={c} font={font} />
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// 2. Spotlight

const LIGHT_RADIUS = "clamp(110px, 21cqw, 240px)"

function SpotlightScene({ chars, font, reduced, active, rootRef, copy }: HeroProps & { copy: CopyProps }) {
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 400, damping: 38 })
  const y = useSpring(rawY, { stiffness: 400, damping: 38 })
  const light = useMotionValue(0)
  // Alpha mask for the flashlight's edge fading, not a color gradient
  const mask = useMotionTemplate`radial-gradient(circle ${LIGHT_RADIUS} at ${x}px ${y}px, #000 0%, rgba(0,0,0,0.85) 38%, transparent 72%)`

  // Mount: center the light, then flicker it on.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const cx = el.clientWidth / 2
    const cy = el.clientHeight * 0.4
    rawX.jump(cx)
    rawY.jump(cy)
    x.jump(cx)
    y.jump(cy)
    if (reduced) {
      light.jump(1)
      return
    }
    const controls = animateValue(light, [0, 0.9, 0.12, 1, 0.45, 1], {
      duration: 1.1,
      times: [0, 0.14, 0.3, 0.52, 0.68, 1],
      ease: "linear",
      delay: 0.35,
    })
    return () => controls.stop()
  }, [rootRef, reduced, rawX, rawY, x, y, light])

  // Follow the pointer; drift on its own for touch or when the pointer rests.
  useEffect(() => {
    const el = rootRef.current
    if (!el || !active) return
    let lastMove = reduced ? Number.POSITIVE_INFINITY : 0
    const finePointer = window.matchMedia("(pointer: fine)").matches
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      rawX.set(e.clientX - r.left)
      rawY.set(e.clientY - r.top)
      lastMove = performance.now()
    }
    const onLeave = () => {
      if (!reduced) lastMove = performance.now() - 1500
    }
    el.addEventListener("pointermove", onMove, { passive: true })
    el.addEventListener("pointerleave", onLeave)

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const idle = now - lastMove > (finePointer ? 2500 : 1200)
      if (idle && !reduced) {
        const t = (now - start) / 1000
        const w = el.clientWidth
        const h = el.clientHeight
        rawX.set(w / 2 + Math.cos(t * 0.33) * w * 0.26)
        rawY.set(h * 0.4 + Math.sin(t * 0.52) * h * 0.16)
      }
      raf = requestAnimationFrame(tick)
    }
    if (!reduced) raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
    }
  }, [rootRef, active, reduced, rawX, rawY])

  const glowX = useTransform(x, (v) => `calc(${v}px - 50%)`)
  const glowY = useTransform(y, (v) => `calc(${v}px - 50%)`)

  const digits = (lit: boolean) => (
    <div className="relative flex flex-col items-center gap-[clamp(0.75rem,2cqw,1.25rem)]">
      <div
        className="flex items-baseline justify-center gap-[0.03em] text-(length:--nf-digit) select-none"
        style={
          lit
            ? { textShadow: "0 0 0.12em color-mix(in oklab, var(--nf-fg) 35%, transparent)" }
            : { color: "transparent", WebkitTextStroke: "1px color-mix(in oklab, var(--nf-fg) 10%, transparent)" }
        }
      >
        {chars.map((c, i) => (
          <Digit key={i} char={c} font={font} className={lit && c === "0" ? "text-(--nf-accent)" : undefined} />
        ))}
      </div>
      <p className={cn("font-mono text-[clamp(0.7rem,1.4cqw,0.875rem)] text-(--nf-accent)", !lit && "invisible")}>
        You found a secret. Still lost though.
      </p>
    </div>
  )

  return (
    <>
      {/* Flat pool of light on the wall */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-0 rounded-full"
        style={{
          x: glowX,
          y: glowY,
          opacity: light,
          width: `calc(${LIGHT_RADIUS} * 1.5)`,
          height: `calc(${LIGHT_RADIUS} * 1.5)`,
          backgroundColor: "color-mix(in oklab, var(--nf-fg) 5%, transparent)",
        }}
      />
      <div className={CONTENT}>
        <div aria-hidden="true">{digits(false)}</div>
        <Copy {...copy} />
      </div>
      {/* Lit layer: identical layout, only visible inside the flashlight */}
      <motion.div
        aria-hidden="true"
        className={cn(CONTENT, "pointer-events-none absolute inset-0 z-20")}
        style={{ maskImage: mask, WebkitMaskImage: mask, opacity: light }}
      >
        {digits(true)}
        <Copy {...copy} hidden />
        <span className="absolute top-[12%] left-[8%] -rotate-6 font-mono text-xs text-(--nf-muted)">no exit here</span>
        <span className="absolute right-[9%] bottom-[14%] rotate-3 font-mono text-xs text-(--nf-muted)">
          try the buttons &darr;
        </span>
      </motion.div>
    </>
  )
}

// ---------------------------------------------------------------------------
// 3. Drag

const REST_TILT = [-5, 3, -2, 4, -3]

function DragTile({
  char,
  index,
  accent,
  font,
  reduced,
  constraints,
  onGrab,
}: {
  char: string
  index: number
  accent: boolean
  font: string
  reduced: boolean
  constraints: RefObject<HTMLElement | null>
  onGrab: () => void
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const velocity = useVelocity(x)
  const lean = useTransform(velocity, [-1600, 0, 1600], [-28, 0, 28], { clamp: true })
  const spun = useSpring(lean, SPRING)
  const rest = REST_TILT[index % REST_TILT.length]
  const rotate = useTransform(spun, (v) => v + rest)

  return (
    <motion.div
      drag
      dragConstraints={constraints}
      dragElastic={0.55}
      dragSnapToOrigin
      dragTransition={{ bounceStiffness: 450, bounceDamping: 30 }}
      onDragStart={onGrab}
      whileDrag={{ scale: 1.07, zIndex: 30 }}
      whileHover={{ scale: 1.03 }}
      initial={reduced ? false : { y: -420, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        y: { type: "spring", stiffness: 420, damping: 22, mass: 1.1, delay: 0.1 + index * 0.1 },
        opacity: { duration: 0.2, delay: 0.1 + index * 0.1 },
        scale: { type: "spring", ...SPRING },
      }}
      style={{
        x,
        y,
        rotate,
        background: accent ? "var(--nf-accent)" : "color-mix(in oklab, var(--nf-fg) 5%, var(--nf-bg))",
        color: accent ? "var(--nf-bg)" : undefined,
        boxShadow: "0 0.05em 0 0 color-mix(in oklab, var(--nf-fg) 14%, transparent)",
      }}
      className={cn(
        "relative grid h-[1em] w-[0.84em] cursor-grab touch-none place-items-center rounded-[0.16em] select-none active:cursor-grabbing",
        !accent && "border [border-color:var(--nf-line)]"
      )}
    >
      <span className={cn("block -translate-y-[0.02em] text-[0.8em] leading-none", font)}>{char}</span>
    </motion.div>
  )
}

function DragHero({ chars, font, reduced, rootRef }: HeroProps) {
  const [grabbed, setGrabbed] = useState(false)
  const accents = specialIndices(chars)
  return (
    <div className="flex flex-col items-center gap-[clamp(0.75rem,2.4cqw,1.5rem)]">
      <div aria-hidden="true" className="flex items-center justify-center gap-[0.08em] text-[length:calc(var(--nf-digit)*0.8)]">
        {chars.map((c, i) => (
          <DragTile
            key={i}
            char={c}
            index={i}
            accent={accents.includes(i)}
            font={font}
            reduced={reduced}
            constraints={rootRef}
            onGrab={() => setGrabbed(true)}
          />
        ))}
      </div>
      <motion.p
        {...enter(reduced, 0.6 + chars.length * 0.1, 6)}
        className="inline-flex items-center gap-2 font-mono text-xs text-(--nf-muted)"
      >
        <Hand aria-hidden="true" className="size-3.5" />
        {grabbed ? "Nice. They always come back." : "Go on, throw them."}
      </motion.p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. Orbit

const ORBIT_RX = 0.56
const ORBIT_RY = 0.13
const ORBIT_TILT = (-16 * Math.PI) / 180
const COS_T = Math.cos(ORBIT_TILT)
const SIN_T = Math.sin(ORBIT_TILT)

function Planet({ time, phase }: { time: MotionValue<number>; phase: number }) {
  const angle = useTransform(time, (t) => t * 0.85 + 0.7 + phase)
  const mx = useTransform(angle, (a) => Math.cos(a) * ORBIT_RX * COS_T - Math.sin(a) * ORBIT_RY * SIN_T)
  const my = useTransform(angle, (a) => Math.cos(a) * ORBIT_RX * SIN_T + Math.sin(a) * ORBIT_RY * COS_T)
  const depth = useTransform(angle, (a) => Math.sin(a))
  const scale = useTransform(depth, (d) => 0.7 + (d + 1) * 0.22)
  const opacity = useTransform(depth, (d) => 0.5 + (d + 1) * 0.25)
  const zIndex = useTransform(depth, (d) => (d > 0 ? 3 : 0))
  const x = useMotionTemplate`${mx}em`
  const y = useMotionTemplate`${my}em`
  const half =
    "absolute top-1/2 left-1/2 h-[0.26em] w-[1.12em] -translate-x-1/2 -translate-y-1/2 rotate-[-16deg] rounded-[50%] border-[0.012em] border-dashed"

  return (
    <span className="relative isolate mx-[0.02em] inline-block h-[0.72em] w-[0.6em]">
      <span
        className={cn(half, "z-0")}
        style={{ clipPath: "inset(0 0 50% 0)", borderColor: "color-mix(in oklab, var(--nf-fg) 22%, transparent)" }}
      />
      <span
        className="absolute inset-0 z-[1] rounded-[50%] border-[0.095em] border-current"
        style={{ backgroundColor: "color-mix(in oklab, var(--nf-accent) 10%, transparent)" }}
      />
      <span
        className={cn(half, "z-[2]")}
        style={{ clipPath: "inset(50% 0 0 0)", borderColor: "color-mix(in oklab, var(--nf-fg) 30%, transparent)" }}
      />
      <motion.span
        className="absolute top-1/2 left-1/2 -mt-[0.06em] -ml-[0.06em] size-[0.12em] rounded-full"
        style={{
          x,
          y,
          scale,
          opacity,
          zIndex,
          background: "var(--nf-accent)",
          boxShadow: "0 0 0.14em color-mix(in oklab, var(--nf-accent) 70%, transparent)",
        }}
      />
    </span>
  )
}

function FloatingDigit({ char, font, time, phase }: { char: string; font: string; time: MotionValue<number>; phase: number }) {
  const fy = useTransform(time, (t) => Math.sin(t * 0.9 + phase) * 0.035)
  const rotate = useTransform(time, (t) => Math.sin(t * 0.6 + phase) * 2)
  const y = useMotionTemplate`${fy}em`
  return (
    <motion.span style={{ y, rotate }} className="inline-block">
      <Digit char={char} font={font} />
    </motion.span>
  )
}

function OrbitHero({ chars, font, reduced, active }: HeroProps) {
  const time = useMotionValue(0)
  const planets = specialIndices(chars)

  useEffect(() => {
    if (reduced) {
      time.jump(0)
      return
    }
    if (!active) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      time.set(time.get() + Math.min(now - last, 64) / 1000)
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reduced, time])

  return (
    <motion.div
      aria-hidden="true"
      initial={reduced ? false : { opacity: 0, scale: 0.92, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 1, ease: EASE_OUT }}
      className="flex items-baseline justify-center gap-[0.03em] text-(length:--nf-digit) select-none"
    >
      {chars.map((c, i) =>
        planets.includes(i) ? (
          <Planet key={i} time={time} phase={i * 2.1} />
        ) : (
          <FloatingDigit key={i} char={c} font={font} time={time} phase={i * 1.7} />
        )
      )}
    </motion.div>
  )
}

function Stars({ running, reduced }: { running: boolean; reduced: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      {STARS.map((s, i) => (
        <span
          key={i}
          className={cn("absolute rounded-full", !reduced && "animate-pulse")}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            background: "var(--nf-fg)",
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            animationPlayState: running ? "running" : "paused",
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. Scramble

const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@0123456789ABCDEF"
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

/** Decodes `text` into `el` from random glyphs. Returns a cancel function that restores the final text. */
function scramble(el: HTMLElement, text: string, duration: number, stagger: number, colorize: boolean, onDone?: () => void) {
  const chars = Array.from(text)
  const reveal = chars.map((_, i) => i * stagger + duration * (0.45 + Math.random() * 0.55))
  const end = Math.max(0, ...reveal)
  const start = performance.now()
  let lastSwap = 0
  let raf = 0
  const finish = () => {
    el.textContent = text
    if (colorize) el.style.color = ""
  }
  const tick = (now: number) => {
    const t = now - start
    if (t >= end) {
      finish()
      onDone?.()
      return
    }
    if (now - lastSwap > 45) {
      lastSwap = now
      el.textContent = chars.map((c, i) => (c === " " || t >= reveal[i] ? c : randomGlyph())).join("")
      if (colorize) el.style.color = "var(--nf-accent)"
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    finish()
  }
}

function ScrambleDigit({ char, font, index, reduced, active }: { char: string; font: string; index: number; reduced: boolean; active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const cancel = useRef<(() => void) | null>(null)
  const done = useRef(false)

  useEffect(() => {
    if (reduced || !active || done.current || !ref.current) return
    const stop = scramble(ref.current, char, 700 + index * 160, 0, true, () => {
      done.current = true
    })
    cancel.current = stop
    return () => {
      stop()
      cancel.current = null
    }
  }, [active, reduced, char, index])

  const onEnter = () => {
    if (reduced || !ref.current) return
    cancel.current?.()
    cancel.current = scramble(ref.current, char, 420, 0, true)
  }

  return (
    <span onPointerEnter={onEnter} className={cn("relative inline-block leading-[0.8]", font)}>
      <span className="invisible">{char}</span>
      <span ref={ref} className="absolute inset-0 text-center">
        {char}
      </span>
    </span>
  )
}

function ScrambleTitle({ text, reduced, active }: { text: string; reduced: boolean; active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const done = useRef(false)
  useEffect(() => {
    if (reduced || !active || done.current || !ref.current) return
    return scramble(ref.current, text, 500, 28, false, () => {
      done.current = true
    })
  }, [active, reduced, text])
  return (
    <span ref={ref} aria-hidden="true">
      {text}
    </span>
  )
}

function ErrorLog({ code, path, reduced, active }: { code: string; path: string; reduced: boolean; active: boolean }) {
  const [typed, setTyped] = useState(0)
  const progress = useRef(0)
  const ms = 8 + (hash(path) % 38)
  const segments = [
    { text: "GET ", className: "text-(--nf-muted)" },
    { text: path, className: "" },
    { text: " → ", className: "text-(--nf-muted)" },
    { text: code, className: "text-(--nf-accent)" },
    { text: ` · ${ms}ms`, className: "text-(--nf-muted)" },
  ]
  const total = segments.reduce((n, s) => n + s.text.length, 0)

  useEffect(() => {
    if (reduced || !active || progress.current >= total) return
    let timer = 0
    const step = () => {
      progress.current += 1
      const finished = progress.current >= total
      setTyped(finished ? Number.POSITIVE_INFINITY : progress.current)
      if (!finished) timer = window.setTimeout(step, 24 + Math.random() * 30)
    }
    timer = window.setTimeout(step, progress.current === 0 ? 1100 : 200)
    return () => window.clearTimeout(timer)
  }, [active, reduced, total])

  const shown = reduced ? Number.POSITIVE_INFINITY : typed
  let left = shown
  return (
    <p
      className="inline-flex max-w-full items-center gap-2 overflow-hidden rounded-md border px-3 py-1.5 font-mono text-[clamp(0.7rem,1.35cqw,0.85rem)] whitespace-nowrap [border-color:var(--nf-line)]"
      aria-label={`GET ${path} returned ${code}`}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ background: "var(--nf-accent)" }} />
      <span aria-hidden="true" className="min-h-[1lh] truncate">
        {segments.map((s, i) => {
          const part = s.text.slice(0, Math.max(0, left))
          left -= s.text.length
          return part ? (
            <span key={i} className={s.className}>
              {part}
            </span>
          ) : null
        })}
        <span className={cn("ml-0.5 inline-block h-[1.1em] w-[0.5em] translate-y-[0.2em] bg-current opacity-70", !reduced && "animate-pulse")} />
      </span>
    </p>
  )
}

function ScrambleHero({ chars, font, reduced, active, code, path }: HeroProps & { code: string; path: string }) {
  return (
    <div className="flex flex-col items-center gap-[clamp(1rem,2.8cqw,1.75rem)]">
      <motion.div
        aria-hidden="true"
        {...enter(reduced, 0, 10)}
        className="flex items-baseline justify-center gap-[0.03em] text-(length:--nf-digit) select-none"
      >
        {chars.map((c, i) => (
          <ScrambleDigit key={`${i}-${c}`} char={c} font={font} index={i} reduced={reduced} active={active} />
        ))}
      </motion.div>
      <motion.div {...enter(reduced, 0.3, 8)} className="max-w-full">
        <ErrorLog code={code} path={path} reduced={reduced} active={active} />
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface HeroProps {
  chars: string[]
  font: string
  reduced: boolean
  active: boolean
  rootRef: RefObject<HTMLElement | null>
}

export function NotFound({
  variant = "eyes",
  code = "404",
  title = "Page not found",
  description,
  path,
  primaryAction = DEFAULT_PRIMARY,
  secondaryAction = DEFAULT_SECONDARY,
  accent = "#ff4d12",
  background,
  color,
  muted,
  digitFont = "display",
  size = 1,
  animate = true,
  className,
}: NotFoundProps) {
  const rootRef = useRef<HTMLElement>(null)
  const prefersReduced = useReducedMotion()
  const reduced = prefersReduced || !animate
  const active = useActive(rootRef)
  const locationPath = useLocationPath("/this-page")

  const dark = variant === "spotlight" || variant === "orbit"
  const chars = Array.from(code || "404")
  const font = FONTS[digitFont]
  const s = Math.max(0.2, size)

  const style = {
    "--nf-accent": accent,
    "--nf-bg": background ?? (dark ? DARK_BG : "var(--background)"),
    "--nf-fg": color ?? (dark ? DARK_FG : "var(--foreground)"),
    "--nf-muted": muted ?? (dark ? DARK_MUTED : "var(--muted-foreground)"),
    "--nf-line": "color-mix(in oklab, var(--nf-fg) 14%, transparent)",
    "--nf-digit": `min(${24 * s}cqw, ${34 * s}cqh)`,
    background: "var(--nf-bg)",
    color: "var(--nf-fg)",
  } as CSSProperties

  const hero: HeroProps = { chars, font, reduced, active, rootRef }
  const copy: CopyProps = {
    code,
    title,
    description: description ?? DESCRIPTIONS[variant],
    chip: variant === "scramble" ? undefined : path,
    primary: primaryAction,
    secondary: secondaryAction,
    reduced,
    delay: variant === "drag" ? 0.45 : 0.2,
    titleNode: variant === "scramble" ? <ScrambleTitle key={title} text={title} reduced={reduced} active={active} /> : undefined,
  }

  return (
    <section
      ref={rootRef}
      style={style}
      className={cn(
        "relative isolate flex h-full min-h-full w-full flex-col items-center justify-center overflow-hidden [container-type:inline-size]",
        className
      )}
    >
      {variant === "spotlight" ? (
        <SpotlightScene {...hero} copy={copy} />
      ) : (
        <>
          {variant === "orbit" && <Stars running={active} reduced={reduced} />}
          <div className={CONTENT}>
            {variant === "eyes" && <EyesHero {...hero} />}
            {variant === "drag" && <DragHero {...hero} />}
            {variant === "orbit" && <OrbitHero {...hero} />}
            {variant === "scramble" && <ScrambleHero {...hero} code={code} path={path ?? locationPath} />}
            <Copy {...copy} />
          </div>
        </>
      )}
    </section>
  )
}
