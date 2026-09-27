"use client"

import { useEffect, useEffectEvent, useId, useRef, useState } from "react"
import { AnimatePresence, motion, useAnimate, useInView, type Transition } from "motion/react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Check, PenLine, Plane, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

gsap.registerPlugin(useGSAP)

/* ------------------------------------------------------------------ types */

export type EnvelopeVariant = "classic" | "airmail" | "minimal" | "glass"
export type EnvelopeFlyDirection = "up-right" | "up" | "right"
export type EnvelopeTrigger = "click" | "hover" | "inView" | "manual"
export type EnvelopeField = "name" | "email" | "subject" | "message"

export interface EnvelopeValues {
  name: string
  email: string
  subject: string
  message: string
}

export interface EnvelopeFields {
  /** Show the sender name field (required when shown). Default: true */
  name?: boolean
  /** Show the email field (validated when filled). Default: true */
  email?: boolean
  /** Show the subject field. Default: false */
  subject?: boolean
}

interface EnvelopeLook {
  /** Look of the envelope, letter and seal. Default: "classic" */
  variant?: EnvelopeVariant
  /** Envelope color (any CSS color). Default: per variant (kraft, white, `var(--card)`, frosted white) */
  color?: string
  /** Letter paper color (any CSS color). Default: per variant */
  paper?: string
  /** Letter text color (any CSS color). Default: per variant */
  ink?: string
  /** Wax seal / stamp / dot color (any CSS color). Default: per variant (red wax, red stamp, accent) */
  seal?: string
  /** Accent used for buttons, focus, glow and the minimal seal. Default: "#ff4d12" */
  accent?: string
  /** Initial or monogram on the seal or stamp. Default: "T" (composer: the sender's initial) */
  sealLabel?: string
  /** Animation speed multiplier; 2 plays the choreography twice as slow. Default: 1 */
  duration?: number
  /** Envelope width in px (shrinks to fit its container). Default: 420 */
  width?: number
  /** Envelope corner radius in px. Default: 14 */
  radius?: number
  /** Additional classes for the root element. */
  className?: string
}

export interface EnvelopeComposerProps extends EnvelopeLook {
  /** Which fields to show. The message field is always shown. Default: { name: true, email: true, subject: false } */
  fields?: EnvelopeFields
  /** Placeholder per field. Default: { name: "Your name", email: "you@example.com", subject: "What's it about?", message: "Write your message…" } */
  placeholders?: Partial<Record<EnvelopeField, string>>
  /** Visible label per field. Default: { name: "From", email: "Email", subject: "Subject", message: "Message" } */
  labels?: Partial<Record<EnvelopeField, string>>
  /** Maximum message length, shown as a live counter. Default: 500 */
  messageMaxLength?: number
  /** Send button text. Default: "Send" */
  sendLabel?: string
  /** Button text in the success state. Default: "Write another" */
  againLabel?: string
  /** Success heading, or a function of the sent values. Default: (v) => "Sent. Thanks, {first name}." */
  successTitle?: string | ((values: EnvelopeValues) => string)
  /** Success body, or a function of the sent values. Default: "Your letter is on its way. We'll write back soon." */
  successMessage?: string | ((values: EnvelopeValues) => string)
  /** Shown when `onSend` rejects (an Error's message is used when present). Default: "Couldn't send. Try again." */
  errorMessage?: string
  /** Called with the trimmed values. Return a promise to hold the envelope until it settles; a rejection reopens it. */
  onSend?: (values: EnvelopeValues) => Promise<void> | void
  /** Where the sealed envelope flies off to. Default: "up-right" */
  flyDirection?: EnvelopeFlyDirection
  /** Bring a fresh envelope back automatically after this many ms, or false to wait for "Write another". Default: false */
  resetAfter?: number | false
}

export interface EnvelopeProps extends EnvelopeLook {
  /** Content of the letter, e.g. an invitation or a thank-you note. */
  children?: React.ReactNode
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. Default: false */
  defaultOpen?: boolean
  /** Called when the envelope asks to open or close. */
  onOpenChange?: (open: boolean) => void
  /** What opens the envelope. "manual" only responds to `open`. Default: "click" */
  trigger?: EnvelopeTrigger
  /** Accessible label for the open/close button. Default: "Open envelope" */
  label?: string
  /** Classes for the letter paper. */
  letterClassName?: string
}

/* ---------------------------------------------------------------- palette */

const ACCENT = "#ff4d12"
const ERROR = "#e5484d"
const EASE_OUT = [0.22, 1, 0.36, 1] as const
const spring: Transition = { type: "spring", stiffness: 460, damping: 32 }

/** Flap depth as a fraction of the envelope height; the seal sits on its tip. */
const FLAP = 56
const FOLD = 0.34
const FLAP_CLIP = "polygon(0 0, 100% 0, 50% 100%)"
const FLAP_INNER_CLIP = "polygon(5% 0, 95% 0, 50% 89%)"
const FRONT_CLIP = `polygon(0 0, 50% ${FLAP}%, 100% 0, 100% 100%, 0 100%)`
const STRIPES =
  "repeating-linear-gradient(-45deg, #d62839 0 9px, transparent 9px 15px, #1f4aa8 15px 24px, transparent 24px 30px)"
const CREASE_LINES =
  "linear-gradient(to bottom, transparent 32.6%, rgba(0,0,0,.1) 33.2%, rgba(255,255,255,.45) 33.8%, transparent 34.4%, transparent 65.9%, rgba(0,0,0,.1) 66.5%, rgba(255,255,255,.45) 67.1%, transparent 67.7%)"

const mix = (a: string, pct: number, b: string) => `color-mix(in oklab, ${a} ${pct}%, ${b})`

type SealKind = "wax" | "stamp" | "dot" | "glow"

interface Palette {
  env: string
  back: string
  flap: string
  flapInner: string
  crease: string
  frontInk: string
  paper: string
  ink: string
  muted: string
  seal: string
  accent: string
  texture?: string
  paperTexture?: string
  font: string
  kind: SealKind
  glass: boolean
  stripes: boolean
  outline: boolean
}

type LookInput = Pick<EnvelopeLook, "color" | "paper" | "ink" | "seal"> & { accent: string }

function palette(variant: EnvelopeVariant, o: LookInput): Palette {
  const accent = o.accent || ACCENT
  if (variant === "airmail") {
    const env = o.color || "#fbfaf6"
    const ink = o.ink || "#1f2a44"
    return {
      env,
      back: mix(env, 84, "#1f2a44"),
      flap: env,
      flapInner: mix(env, 78, "#1f2a44"),
      crease: "rgba(31,42,68,0.16)",
      frontInk: mix(ink, 60, "transparent"),
      paper: o.paper || "#ffffff",
      ink,
      muted: mix(ink, 55, "transparent"),
      seal: o.seal || "#c8102e",
      accent,
      paperTexture: "linear-gradient(180deg, rgba(31,42,68,.025), transparent 40%)",
      font: "font-mono",
      kind: "stamp",
      glass: false,
      stripes: true,
      outline: false,
    }
  }
  if (variant === "minimal") {
    const env = o.color || "var(--card)"
    const ink = o.ink || "var(--foreground)"
    return {
      env,
      back: mix(env, 93, "var(--foreground)"),
      flap: env,
      flapInner: mix(env, 90, "var(--foreground)"),
      crease: mix("var(--foreground)", 14, "transparent"),
      frontInk: "var(--muted-foreground)",
      paper: o.paper || "var(--panel)",
      ink,
      muted: mix(ink, 50, "transparent"),
      seal: o.seal || accent,
      accent,
      font: "font-sans",
      kind: "dot",
      glass: false,
      stripes: false,
      outline: true,
    }
  }
  if (variant === "glass") {
    const env = o.color || "rgba(255,255,255,0.16)"
    const ink = o.ink || "#0a0a0a"
    return {
      env,
      back: mix(env, 50, "transparent"),
      flap: mix(env, 80, "rgba(255,255,255,0.3)"),
      flapInner: "rgba(255,255,255,0.08)",
      crease: "rgba(255,255,255,0.45)",
      frontInk: "rgba(255,255,255,0.9)",
      paper: o.paper || "rgba(255,255,255,0.92)",
      ink,
      muted: mix(ink, 50, "transparent"),
      seal: o.seal || accent,
      accent,
      font: "font-sans",
      kind: "glow",
      glass: true,
      stripes: false,
      outline: true,
    }
  }
  const env = o.color || "#d9b68a"
  const ink = o.ink || "#2b2118"
  return {
    env,
    back: mix(env, 72, "#3a220c"),
    flap: env,
    flapInner: mix(env, 70, "#3a220c"),
    crease: mix(env, 62, "#3a220c"),
    frontInk: mix(env, 40, "#2a1808"),
    paper: o.paper || "#fbf6ea",
    ink,
    muted: mix(ink, 55, "transparent"),
    seal: o.seal || "#a51d1d",
    accent,
    texture:
      "radial-gradient(120% 90% at 25% 15%, rgba(255,255,255,.2), transparent 55%), repeating-linear-gradient(115deg, rgba(80,50,15,.045) 0 1px, transparent 1px 4px), repeating-linear-gradient(28deg, rgba(255,255,255,.05) 0 1px, transparent 1px 5px)",
    paperTexture:
      "radial-gradient(110% 70% at 50% 0%, rgba(255,255,255,.7), transparent 70%), repeating-linear-gradient(0deg, rgba(120,90,40,.025) 0 1px, transparent 1px 3px)",
    font: "font-serif",
    kind: "wax",
    glass: false,
    stripes: false,
    outline: false,
  }
}

/* ------------------------------------------------------------------- seal */

const WAX_PATH = (() => {
  const pts: string[] = []
  const n = 60
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = 45 + 2.2 * Math.sin(a * 7 + 0.6) + 1.3 * Math.sin(a * 13 + 2.1) + 0.8 * Math.cos(a * 5)
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`)
  }
  return `M${pts.join(" L")} Z`
})()

const SEAL_WIDTH: Record<SealKind, string> = { wax: "17%", stamp: "16%", dot: "10%", glow: "13%" }

const PERFORATION =
  "radial-gradient(circle at 50% 50%, transparent 2.2px, #000 2.7px) -4px -4px / 8px 8px, linear-gradient(#000 0 0) content-box"

function SealMark({ p, label }: { p: Palette; label: string }) {
  const gid = `wax-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const text = label.slice(0, 3)

  if (p.kind === "wax") {
    const size = text.length > 1 ? 24 : 36
    const common = {
      x: 50,
      y: 51,
      textAnchor: "middle" as const,
      dominantBaseline: "central" as const,
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 700,
      fontSize: size,
    }
    return (
      <svg viewBox="0 0 100 100" className="block h-full w-full overflow-visible drop-shadow-[0_4px_5px_rgba(0,0,0,0.35)]" aria-hidden="true">
        <defs>
          <radialGradient id={gid} cx="36%" cy="30%" r="78%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.32" />
          </radialGradient>
        </defs>
        <path d={WAX_PATH} fill={p.seal} />
        <path d={WAX_PATH} fill={`url(#${gid})`} />
        <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2.6" />
        <circle cx="50.8" cy="50.8" r="31" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        <text {...common} fill="rgba(255,255,255,0.28)" transform="translate(-0.9 -0.9)">{text}</text>
        <text {...common} fill="rgba(0,0,0,0.42)" transform="translate(1 1)">{text}</text>
        <text {...common} fill={p.seal}>{text}</text>
      </svg>
    )
  }

  if (p.kind === "stamp") {
    return (
      <div className="relative h-full w-full">
        <div className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.22)]">
          <div className="h-full w-full bg-white p-[5px]" style={{ mask: PERFORATION, WebkitMask: PERFORATION }}>
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-[6%] rounded-[1px] text-white"
              style={{ background: `linear-gradient(160deg, ${mix(p.seal, 85, "#fff")}, ${p.seal})` }}
            >
              <Plane className="h-auto w-[42%] -rotate-12" strokeWidth={1.75} aria-hidden="true" />
              <span className="font-mono text-[9px] font-bold leading-none tracking-wider">{text}</span>
            </div>
          </div>
        </div>
        <svg
          data-postmark
          viewBox="0 0 140 100"
          className="pointer-events-none absolute -left-[62%] -top-[6%] w-[190%] overflow-visible"
          fill="none"
          stroke="rgba(31,42,68,0.55)"
          aria-hidden="true"
        >
          <circle cx="44" cy="50" r="33" strokeWidth="2.4" />
          <circle cx="44" cy="50" r="25" strokeWidth="1.2" />
          <text x="44" y="46" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fontWeight="700" fill="rgba(31,42,68,0.6)" stroke="none">PAR AVION</text>
          <text x="44" y="58" textAnchor="middle" fontSize="7" fontFamily="ui-monospace, monospace" fill="rgba(31,42,68,0.6)" stroke="none">AIR MAIL</text>
          {[36, 50, 64].map((y) => (
            <path key={y} d={`M80 ${y} q7 -6 14 0 t14 0 t14 0 t14 0`} strokeWidth="2.4" strokeLinecap="round" />
          ))}
        </svg>
      </div>
    )
  }

  if (p.kind === "dot") {
    return (
      <div
        className="grid aspect-square h-full w-full place-items-center rounded-full text-white"
        style={{ background: p.seal, boxShadow: `0 0 0 3px ${p.env}, 0 6px 14px -4px ${mix(p.seal, 60, "transparent")}` }}
      >
        <Check className="h-auto w-[52%]" strokeWidth={3} aria-hidden="true" />
      </div>
    )
  }

  return (
    <div
      className="grid aspect-square h-full w-full place-items-center rounded-full font-semibold text-white"
      style={{
        background: `radial-gradient(circle at 35% 30%, ${mix(p.seal, 70, "#fff")}, ${p.seal} 70%)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,.45), 0 0 26px 6px ${mix(p.seal, 55, "transparent")}`,
      }}
    >
      <span className="text-[15px] leading-none">{text}</span>
    </div>
  )
}

/* --------------------------------------------------------------- envelope */

interface BodyProps {
  p: Palette
  radius: number
  sealLabel: string
  flapOpen: boolean
  sealShown: boolean
  flapRef: React.RefObject<HTMLDivElement | null>
  flapInnerRef: React.RefObject<HTMLDivElement | null>
  sealRef: React.RefObject<HTMLDivElement | null>
  front?: React.ReactNode
  children?: React.ReactNode
}

/** Back, flap, front pocket and seal. Layers: back, open flap (10), letter (20), front (25), closed flap (30), seal (40). */
function EnvelopeBody({ p, radius, sealLabel, flapOpen, sealShown, flapRef, flapInnerRef, sealRef, front, children }: BodyProps) {
  const glassFx = p.glass ? "blur(14px) saturate(1.4)" : undefined
  const line = p.outline ? `1px solid ${p.crease}` : undefined

  return (
    <div className="relative aspect-[16/9] w-full">
      {/* back / inside */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          backgroundColor: p.back,
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.2), transparent 55%)${p.texture ? `, ${p.texture}` : ""}`,
          boxShadow: "0 28px 50px -24px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.08)",
          border: line,
          backdropFilter: glassFx,
          WebkitBackdropFilter: glassFx,
        }}
      />

      {children}

      {/* flap */}
      <div
        ref={flapRef}
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: `${FLAP}%`,
          zIndex: flapOpen ? 10 : 30,
          transformOrigin: "50% 0%",
          transform: flapOpen ? "perspective(900px) rotateX(180deg)" : undefined,
          filter: p.glass ? undefined : "drop-shadow(0 3px 3px rgba(0,0,0,.16))",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            clipPath: FLAP_CLIP,
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            backgroundColor: p.flap,
            backgroundImage: p.stripes ? STRIPES : p.texture,
            backdropFilter: glassFx,
            WebkitBackdropFilter: glassFx,
          }}
        >
          {p.stripes && <div className="absolute inset-0" style={{ clipPath: FLAP_INNER_CLIP, background: p.flap }} />}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,.06), rgba(255,255,255,.08))" }}
          />
          <div ref={flapInnerRef} className="absolute inset-0" style={{ background: p.flapInner, opacity: flapOpen ? 1 : 0 }} />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points="0,0 50,100 100,0" fill="none" stroke={p.crease} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>

      {/* front pocket */}
      <div
        className="absolute inset-0 z-[25]"
        style={{
          clipPath: FRONT_CLIP,
          borderRadius: radius,
          backgroundColor: p.env,
          backgroundImage: p.texture,
          backdropFilter: glassFx,
          WebkitBackdropFilter: glassFx,
          ...(p.stripes
            ? { borderStyle: "solid", borderWidth: "0 6px 6px 6px", borderImage: `${STRIPES} 6` }
            : { border: line }),
        }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={`0,0 50,${FLAP} 100,0`} fill="none" stroke={p.crease} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <polyline points="0,100 50,64 100,100" fill="none" stroke={p.crease} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        {front}
      </div>

      {/* seal */}
      <div
        className="pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
        style={{ top: `${FLAP}%`, width: SEAL_WIDTH[p.kind] }}
      >
        <div ref={sealRef} className={p.kind === "stamp" ? "aspect-[4/5]" : "aspect-square"} style={{ opacity: sealShown ? 1 : 0 }}>
          <SealMark p={p} label={sealLabel} />
        </div>
      </div>
    </div>
  )
}

function GlassGlow({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[10%] -z-10"
      style={{
        background: `radial-gradient(42% 38% at 30% 62%, ${mix(accent, 75, "transparent")}, transparent 70%), radial-gradient(40% 44% at 72% 40%, rgba(109,93,252,.55), transparent 70%), radial-gradient(34% 28% at 55% 88%, rgba(34,211,238,.35), transparent 70%)`,
        filter: "blur(28px)",
      }}
    />
  )
}

const vars = (p: Palette, style: React.CSSProperties) =>
  ({ ...style, "--env-accent": p.accent, "--env-crease": p.crease, "--env-error": ERROR }) as React.CSSProperties

const shadowOf = (p: Palette) =>
  p.outline
    ? `0 0 0 1px ${p.crease}, 0 10px 30px -14px rgba(0,0,0,.35)`
    : "0 1px 2px rgba(0,0,0,.08), 0 12px 28px -12px rgba(0,0,0,.35)"

/* --------------------------------------------------------------- composer */

const EMPTY: EnvelopeValues = { name: "", email: "", subject: "", message: "" }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEFAULT_PLACEHOLDERS: Record<EnvelopeField, string> = {
  name: "Your name",
  email: "you@example.com",
  subject: "What's it about?",
  message: "Write your message…",
}
const DEFAULT_LABELS: Record<EnvelopeField, string> = { name: "From", email: "Email", subject: "Subject", message: "Message" }

const FLY: Record<EnvelopeFlyDirection, { x: number; y: number; r: number }> = {
  "up-right": { x: 1.25, y: -1.5, r: 16 },
  up: { x: 0.04, y: -1.9, r: -5 },
  right: { x: 1.7, y: -0.12, r: 9 },
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? ""

const defaultTitle = (v: EnvelopeValues) => (v.name ? `Sent. Thanks, ${firstName(v.name)}.` : "Sent. Thank you.")
const defaultMessage = "Your letter is on its way. We'll write back soon."

type Phase = "idle" | "sending" | "success"

export function EnvelopeComposer({
  variant = "classic",
  color,
  paper,
  ink,
  seal,
  accent = ACCENT,
  sealLabel,
  fields,
  placeholders,
  labels,
  messageMaxLength = 500,
  sendLabel = "Send",
  againLabel = "Write another",
  successTitle = defaultTitle,
  successMessage = defaultMessage,
  errorMessage = "Couldn't send. Try again.",
  onSend,
  flyDirection = "up-right",
  duration = 1,
  width = 420,
  radius = 14,
  resetAfter = false,
  className,
}: EnvelopeComposerProps) {
  const id = useId()
  const reduced = useReducedMotion()
  const p = palette(variant, { color, paper, ink, seal, accent })
  const show = { name: fields?.name ?? true, email: fields?.email ?? true, subject: fields?.subject ?? false }
  const ph = { ...DEFAULT_PLACEHOLDERS, ...placeholders }
  const lb = { ...DEFAULT_LABELS, ...labels }
  const speed = 1 / Math.max(0.1, duration)

  const rootRef = useRef<HTMLDivElement>(null)
  const flyRef = useRef<HTMLFormElement>(null)
  const letterRef = useRef<HTMLDivElement>(null)
  const creaseRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const flapRef = useRef<HTMLDivElement>(null)
  const flapInnerRef = useRef<HTMLDivElement>(null)
  const sealRef = useRef<HTMLDivElement>(null)
  const againRef = useRef<HTMLButtonElement>(null)
  const fieldRefs = useRef<Partial<Record<EnvelopeField, HTMLInputElement | HTMLTextAreaElement | null>>>({})
  const [paperScope, animatePaper] = useAnimate<HTMLDivElement>()

  const [values, setValues] = useState<EnvelopeValues>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<EnvelopeField, string>>>({})
  const [phase, setPhase] = useState<Phase>("idle")
  const [failure, setFailure] = useState("")
  const [status, setStatus] = useState("")
  const [sent, setSent] = useState<EnvelopeValues>(EMPTY)

  const busy = phase !== "idle"
  const label = (sealLabel || firstName(values.name || sent.name).charAt(0) || "T").toUpperCase()
  const count = values.message.length
  const firstError = (["name", "email", "subject", "message"] as const).find((f) => errors[f])

  const { contextSafe } = useGSAP(
    () => {
      gsap.set(flapRef.current, { rotationX: 180, transformPerspective: 900, transformOrigin: "50% 0%", zIndex: 10 })
      gsap.set(letterRef.current, { transformOrigin: "50% 100%", transformPerspective: 1100 })
      gsap.set(sealRef.current, { opacity: 0 })
    },
    { scope: rootRef }
  )

  /** How far the letter travels to sit folded at the bottom of the pocket. */
  const measure = () => {
    const letter = letterRef.current
    const env = letter?.nextElementSibling as HTMLElement | null
    if (!letter || !env) return { drop: 0, envH: 0, w: 0, h: 0 }
    const overlap = letter.offsetTop + letter.offsetHeight - env.offsetTop
    const envH = env.offsetHeight
    return { drop: envH * 0.94 - overlap, envH, w: flyRef.current?.offsetWidth ?? 0, h: flyRef.current?.offsetHeight ?? 0 }
  }

  const runClose = contextSafe(() => {
    const { drop } = measure()
    const tl = gsap.timeline({ defaults: { ease: "power4.inOut" } }).timeScale(speed)
    tl.to(footerRef.current, { opacity: 0, y: 6, duration: 0.25, ease: "power2.out" }, 0)
      .to(letterRef.current, { scaleY: 0.64, rotationX: 22, duration: 0.36 }, 0.05)
      .to(creaseRef.current, { opacity: 1, duration: 0.25 }, 0.05)
      .to(letterRef.current, { scaleY: FOLD, rotationX: 0, duration: 0.34 }, ">-0.04")
      .to(letterRef.current, { y: drop, duration: 0.55, ease: "power3.in" }, ">-0.06")
      .addLabel("flap", ">-0.08")
      .to(flapRef.current, { rotationX: 0, duration: 0.62 }, "flap")
      .set(flapRef.current, { zIndex: 30 }, "flap+=0.31")
      .set(flapInnerRef.current, { opacity: 0 }, "flap+=0.31")
    return tl
  })

  const runFly = contextSafe((onDone: () => void) => {
    const { w, h } = measure()
    const v = FLY[flyDirection]
    const x = w * v.x
    const y = h * v.y
    const angle = (Math.atan2(y, x) * 180) / Math.PI
    const postmark = sealRef.current?.querySelector("[data-postmark]")
    const tl = gsap.timeline().timeScale(speed)
    tl.fromTo(
      sealRef.current,
      { opacity: 0, scale: 1.9, y: -34, rotation: -14 },
      { opacity: 1, scale: 1, y: 0, rotation: 0, duration: 0.32, ease: "power4.in" }
    )
      .to(sealRef.current, { scaleX: 1.18, scaleY: 0.82, duration: 0.08, ease: "power2.out" })
      .to(sealRef.current, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.45)" })
    if (postmark) {
      tl.fromTo(postmark, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.18, ease: "power4.in" }, "-=0.45")
    }
    tl.to(flyRef.current, { rotation: -5, y: 10, scale: 0.97, duration: 0.32, ease: "power2.inOut" }, "+=0.12")
      .addLabel("fly")
      .to(flyRef.current, { x, y, rotation: v.r, scale: 0.55, opacity: 0, filter: "blur(6px)", duration: 0.75, ease: "power4.in" }, "fly")
      .set(trailRef.current, { xPercent: -100, yPercent: -50, transformOrigin: "100% 50%", rotation: angle }, "fly")
      .fromTo(trailRef.current, { opacity: 0, scaleX: 0 }, { opacity: 0.85, scaleX: 1, duration: 0.4, ease: "power2.out" }, "fly+=0.2")
      .to(trailRef.current, { opacity: 0, duration: 0.3 }, ">-0.05")
      .call(onDone, [], "fly+=0.62")
    return tl
  })

  const runReopen = contextSafe((tl: gsap.core.Timeline) => {
    return new Promise<void>((resolve) => {
      if (tl.progress() === 0) {
        tl.kill()
        resolve()
        return
      }
      tl.eventCallback("onReverseComplete", () => resolve())
      tl.timeScale(speed * 1.5).reverse()
    })
  })

  const runAgain = contextSafe(() => {
    const { drop, envH } = measure()
    const focus = () => fieldRefs.current[show.name ? "name" : "message"]?.focus()
    gsap.killTweensOf([flyRef.current, letterRef.current, flapRef.current, sealRef.current, trailRef.current])
    gsap.set(flapRef.current, { rotationX: 180, zIndex: 10 })
    gsap.set(flapInnerRef.current, { opacity: 1 })
    gsap.set([sealRef.current, trailRef.current], { opacity: 0 })
    if (reduced) {
      gsap.set(letterRef.current, { y: 0, scaleY: 1, rotationX: 0 })
      gsap.set([creaseRef.current], { opacity: 0 })
      gsap.set(footerRef.current, { opacity: 1, y: 0 })
      gsap.set(flyRef.current, { x: 0, y: 0, rotation: 0, scale: 1, clearProps: "filter" })
      gsap.to(flyRef.current, { opacity: 1, duration: 0.25, onComplete: focus })
      return
    }
    gsap.set(letterRef.current, { y: drop, scaleY: FOLD, rotationX: 0 })
    gsap.set(creaseRef.current, { opacity: 1 })
    gsap.set(footerRef.current, { opacity: 0, y: 6 })
    gsap
      .timeline({ onComplete: focus })
      .timeScale(speed)
      .fromTo(
        flyRef.current,
        { x: 0, y: envH * 0.7, rotation: -4, scale: 0.92, opacity: 0, filter: "blur(6px)" },
        { y: 0, rotation: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "expo.out" }
      )
      .set(flyRef.current, { clearProps: "filter" })
      .to(letterRef.current, { y: 0, duration: 0.6, ease: "expo.out" }, 0.35)
      .to(letterRef.current, { scaleY: 1, duration: 0.55, ease: "expo.out" }, 0.6)
      .to(creaseRef.current, { opacity: 0, duration: 0.35 }, 0.7)
      .to(footerRef.current, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }, 0.8)
  })

  const runHide = contextSafe((onDone: () => void) => {
    gsap.to(flyRef.current, { opacity: 0, duration: 0.25, onComplete: onDone })
  })

  const shake = () => {
    if (!paperScope.current || reduced) return
    animatePaper(paperScope.current, { x: [0, -10, 9, -6, 4, -2, 0] }, { duration: 0.5, ease: "easeOut" })
  }

  const validate = (v: EnvelopeValues) => {
    const next: Partial<Record<EnvelopeField, string>> = {}
    if (show.name && !v.name) next.name = "Add your name"
    if (show.email && v.email && !EMAIL_RE.test(v.email)) next.email = "Check the email address"
    if (!v.message) next.message = "Write a message first"
    return next
  }

  const send = async () => {
    if (busy) return
    const snapshot: EnvelopeValues = {
      name: show.name ? values.name.trim() : "",
      email: show.email ? values.email.trim() : "",
      subject: show.subject ? values.subject.trim() : "",
      message: values.message.trim(),
    }
    const invalid = validate(snapshot)
    const firstInvalid = (["name", "email", "subject", "message"] as const).find((f) => invalid[f])
    if (firstInvalid) {
      setErrors(invalid)
      setStatus(invalid[firstInvalid] ?? "")
      shake()
      fieldRefs.current[firstInvalid]?.focus()
      return
    }

    setErrors({})
    setFailure("")
    setPhase("sending")
    setStatus("Sending your message…")

    const finish = () => {
      setSent(snapshot)
      setPhase("success")
      setStatus("Message sent.")
    }
    const fail = (err: unknown) => {
      const text = err instanceof Error && err.message ? err.message : errorMessage
      setPhase("idle")
      setFailure(text)
      setStatus(text)
      shake()
    }

    const request = Promise.resolve().then(() => onSend?.(snapshot))

    if (reduced) {
      try {
        await request
        runHide(finish)
      } catch (err) {
        fail(err)
      }
      return
    }

    const tl = runClose()
    const closed = new Promise<void>((resolve) => {
      tl.eventCallback("onComplete", () => resolve())
    })
    try {
      await Promise.all([request, closed])
    } catch (err) {
      await runReopen(tl)
      gsap.to(footerRef.current, { opacity: 1, y: 0, duration: 0.3 })
      fail(err)
      return
    }
    runFly(finish)
  }

  const again = () => {
    setValues(EMPTY)
    setErrors({})
    setFailure("")
    setStatus("")
    setPhase("idle")
    runAgain()
  }

  const autoReset = useEffectEvent(() => again())
  useEffect(() => {
    if (phase !== "success" || resetAfter === false) return
    const t = setTimeout(autoReset, resetAfter)
    return () => clearTimeout(t)
  }, [phase, resetAfter])

  const update = (field: EnvelopeField) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = e.target.value
    setValues((v) => ({ ...v, [field]: next }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }))
    if (failure) setFailure("")
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      void send()
    } else if (e.target instanceof HTMLInputElement) {
      e.preventDefault()
    }
  }

  const input = (field: Exclude<EnvelopeField, "message">, type = "text", autoComplete?: string) => (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: p.muted }}>
        {lb[field]}
      </span>
      <input
        ref={(el) => {
          fieldRefs.current[field] = el
        }}
        id={`${id}-${field}`}
        type={type}
        value={values[field]}
        onChange={update(field)}
        placeholder={ph[field]}
        autoComplete={autoComplete}
        disabled={busy}
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={errors[field] ? `${id}-error` : undefined}
        className="w-full min-w-0 border-b border-(--env-crease) bg-transparent pb-1 text-sm outline-none transition-colors placeholder:opacity-50 focus:border-(--env-accent) disabled:opacity-100 aria-invalid:border-(--env-error)"
        style={{ color: p.ink, caretColor: p.accent }}
      />
    </label>
  )

  const title = typeof successTitle === "function" ? successTitle(sent) : successTitle
  const body = typeof successMessage === "function" ? successMessage(sent) : successMessage

  return (
    <div ref={rootRef} className={cn("@container relative isolate mx-auto", className)} style={vars(p, { width, maxWidth: "100%" })}>
      {p.glass && <GlassGlow accent={p.accent} />}

      <form
        ref={flyRef}
        noValidate
        aria-label="Write a message"
        inert={phase === "success"}
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        onKeyDown={onKeyDown}
        className="relative isolate"
      >
        {/* letter */}
        <div ref={letterRef} className="relative z-20 mx-auto w-[86%]" style={{ marginBottom: "-9%" }}>
          <div
            ref={paperScope}
            className={cn("relative overflow-hidden px-4 pt-4", p.font)}
            style={{
              backgroundColor: p.paper,
              backgroundImage: p.paperTexture,
              color: p.ink,
              borderRadius: Math.round(radius * 0.6),
              boxShadow: shadowOf(p),
              paddingBottom: "14%",
              backdropFilter: p.glass ? "blur(12px)" : undefined,
            }}
          >
            {(show.name || show.email) && (
              <div className={cn("mb-3 grid gap-3", show.name && show.email && "@[22rem]:grid-cols-2")}>
                {show.name && input("name", "text", "name")}
                {show.email && input("email", "email", "email")}
              </div>
            )}
            {show.subject && <div className="mb-3">{input("subject")}</div>}

            <label htmlFor={`${id}-message`} className="sr-only">
              {lb.message}
            </label>
            <textarea
              ref={(el) => {
                fieldRefs.current.message = el
              }}
              id={`${id}-message`}
              value={values.message}
              onChange={update("message")}
              placeholder={ph.message}
              maxLength={messageMaxLength}
              rows={3}
              disabled={busy}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={`${id}-count${errors.message ? ` ${id}-error` : ""}`}
              className="block w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:opacity-50 disabled:opacity-100"
              style={{
                color: p.ink,
                caretColor: p.accent,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 23px, ${errors.message ? ERROR : p.crease} 23px 24px)`,
                backgroundAttachment: "local",
              }}
            />
            <div className="mt-1.5 flex items-center justify-between gap-3 font-sans text-[11px]">
              <AnimatePresence mode="wait" initial={false}>
                {firstError ? (
                  <motion.span
                    key={firstError}
                    id={`${id}-error`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    style={{ color: ERROR }}
                  >
                    {errors[firstError]}
                  </motion.span>
                ) : (
                  <span />
                )}
              </AnimatePresence>
              <span
                id={`${id}-count`}
                className="tabular-nums transition-colors"
                style={{ color: count > messageMaxLength * 0.9 ? p.accent : p.muted }}
                aria-label={`${count} of ${messageMaxLength} characters`}
              >
                {count}/{messageMaxLength}
              </span>
            </div>
            <div
              ref={creaseRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0"
              style={{ backgroundImage: CREASE_LINES }}
            />
          </div>
        </div>

        <EnvelopeBody
          p={p}
          radius={radius}
          sealLabel={label}
          flapOpen
          sealShown={false}
          flapRef={flapRef}
          flapInnerRef={flapInnerRef}
          sealRef={sealRef}
          front={
            <div ref={footerRef} className="absolute inset-x-[5%] bottom-[9%] flex items-center justify-between gap-2 font-sans">
              <AnimatePresence mode="wait" initial={false}>
                {failure ? (
                  <motion.span
                    key="fail"
                    role="alert"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="min-w-0 truncate rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ color: ERROR, background: mix(ERROR, 12, "transparent") }}
                  >
                    {failure}
                  </motion.span>
                ) : (
                  <motion.span
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hidden items-center gap-1 text-[11px] @[20rem]:flex"
                    style={{ color: p.frontInk }}
                  >
                    <kbd className="rounded border px-1 font-mono text-[10px]" style={{ borderColor: p.crease }}>
                      ⌘/Ctrl
                    </kbd>
                    <kbd className="rounded border px-1 font-mono text-[10px]" style={{ borderColor: p.crease }}>
                      Enter
                    </kbd>
                    <span>to send</span>
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.button
                type="submit"
                disabled={busy}
                whileHover={reduced || busy ? undefined : { scale: 1.04, y: -1 }}
                whileTap={reduced || busy ? undefined : { scale: 0.96 }}
                transition={spring}
                className="ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-(--env-accent)/40 focus-visible:ring-offset-2 disabled:cursor-default"
                style={{ background: p.accent, boxShadow: `0 8px 20px -8px ${mix(p.accent, 80, "transparent")}` }}
              >
                {sendLabel}
                <Send className="size-3.5" aria-hidden="true" />
              </motion.button>
            </div>
          }
        >
          <div
            ref={trailRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34%] w-[130%] rounded-full opacity-0"
            style={{
              background: `linear-gradient(90deg, transparent, ${mix(p.accent, 35, "transparent")} 65%, ${mix(p.env, 70, "transparent")})`,
              filter: "blur(14px)",
            }}
          />
        </EnvelopeBody>
      </form>

      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>

      <AnimatePresence>
        {phase === "success" && (
          <motion.div
            key="done"
            className="absolute inset-0 z-50 grid place-items-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: reduced ? 0.2 : 0.3 }}
            onAnimationComplete={() => againRef.current?.focus({ preventScroll: true })}
          >
            <motion.div
              className="flex max-w-[82%] flex-col items-center gap-3"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: reduced ? 0.2 : 0.6, ease: EASE_OUT }}
            >
              <motion.span
                initial={reduced ? false : { scale: 0.4, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={spring}
                className="grid size-12 place-items-center rounded-full text-white"
                style={{ background: p.accent, boxShadow: `0 12px 30px -8px ${mix(p.accent, 70, "transparent")}` }}
              >
                <Check className="size-6" strokeWidth={2.6} aria-hidden="true" />
              </motion.span>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
              <motion.button
                ref={againRef}
                type="button"
                onClick={again}
                whileHover={reduced ? undefined : { scale: 1.03 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                transition={spring}
                className="mt-2 inline-flex h-9 items-center gap-2 rounded-full border bg-panel px-4 text-[13px] font-medium text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PenLine className="size-3.5" aria-hidden="true" />
                {againLabel}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------ reveal only */

export function Envelope({
  children,
  variant = "classic",
  color,
  paper,
  ink,
  seal,
  accent = ACCENT,
  sealLabel = "T",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger = "click",
  label = "Open envelope",
  duration = 1,
  width = 420,
  radius = 14,
  className,
  letterClassName,
}: EnvelopeProps) {
  const reduced = useReducedMotion()
  const p = palette(variant, { color, paper, ink, seal, accent })
  const speed = 1 / Math.max(0.1, duration)

  const rootRef = useRef<HTMLDivElement>(null)
  const envRef = useRef<HTMLDivElement>(null)
  const letterRef = useRef<HTMLDivElement>(null)
  const creaseRef = useRef<HTMLDivElement>(null)
  const flapRef = useRef<HTMLDivElement>(null)
  const flapInnerRef = useRef<HTMLDivElement>(null)
  const sealRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const [inner, setInner] = useState(defaultOpen)
  const inView = useInView(rootRef, { once: true, amount: 0.6 })
  const isOpen = openProp ?? (trigger === "inView" ? inner || inView : inner)
  const openRef = useRef(isOpen)
  const shownRef = useRef(false)

  const setOpen = (next: boolean) => {
    if (next === isOpen) return
    if (openProp === undefined) setInner(next)
    onOpenChange?.(next)
  }

  const announceInView = useEffectEvent(() => {
    if (openProp === undefined && !inner) onOpenChange?.(true)
  })
  useEffect(() => {
    if (trigger === "inView" && inView) announceInView()
  }, [trigger, inView])

  // Build the open timeline (paused), then park it at the current state.
  useGSAP(
    () => {
      const letter = letterRef.current
      const env = envRef.current
      if (!letter || !env) return
      const envH = env.offsetHeight
      const h = Math.max(1, letter.offsetHeight)
      const closed = Math.min(FOLD, (envH * 0.85) / h)
      // Open: the letter's tucked bottom stays in the pocket (22% deep)
      const rest = -envH * 0.72

      gsap.set(flapRef.current, { rotationX: 0, transformPerspective: 900, transformOrigin: "50% 0%", zIndex: 30 })
      gsap.set(flapInnerRef.current, { opacity: 0 })
      gsap.set(letter, { transformOrigin: "50% 100%", scaleY: closed, y: 0 })
      gsap.set(creaseRef.current, { opacity: 1 })
      gsap.set(sealRef.current, { opacity: 1, scale: 1, y: 0 })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.inOut" } })
      tl.to(sealRef.current, { scale: 1.12, duration: 0.12, ease: "power2.out" })
        .to(sealRef.current, { scale: 0.5, y: -8, opacity: 0, duration: 0.26, ease: "power4.in" })
        .addLabel("flap", "-=0.05")
        .to(flapRef.current, { rotationX: 180, duration: 0.62 }, "flap")
        .set(flapRef.current, { zIndex: 10 }, "flap+=0.31")
        .set(flapInnerRef.current, { opacity: 1 }, "flap+=0.31")
        .to(letter, { y: rest, duration: 0.8, ease: "expo.out" }, "flap+=0.4")
        .to(letter, { scaleY: 1, duration: 0.7, ease: "expo.out" }, "flap+=0.55")
        .to(creaseRef.current, { opacity: 0, duration: 0.45, ease: "power2.out" }, "<0.15")
      // Reserve exactly as much room above as the open letter actually sticks out,
      // measured from the finished pose so the layout never jumps or overflows
      tl.progress(1)
      const protrude = env.getBoundingClientRect().top - letter.getBoundingClientRect().top
      // Assigned directly: gsap would keep the initial % unit and read 178px as 178%
      if (rootRef.current) rootRef.current.style.paddingTop = `${Math.max(12, Math.round(protrude + 12))}px`
      tl.timeScale(speed).progress(openRef.current ? 1 : 0)
      tlRef.current = tl
      return () => {
        tlRef.current = null
      }
    },
    { scope: rootRef, dependencies: [speed, variant], revertOnUpdate: true }
  )

  useGSAP(
    () => {
      openRef.current = isOpen
      const tl = tlRef.current
      if (!tl) return
      if (!shownRef.current || reduced) {
        shownRef.current = true
        tl.pause().progress(isOpen ? 1 : 0)
        return
      }
      tl.timeScale(isOpen ? speed : speed * 1.4)
      if (isOpen) tl.play()
      else tl.reverse()
    },
    { dependencies: [isOpen] }
  )

  const hover = trigger === "hover"
  const interactive = trigger === "click" || trigger === "hover"

  return (
    <div
      ref={rootRef}
      className={cn("@container relative isolate mx-auto", className)}
      style={vars(p, { width, maxWidth: "100%", paddingTop: "36%" })}
      onPointerEnter={hover ? () => setOpen(true) : undefined}
      onPointerLeave={hover ? () => setOpen(false) : undefined}
    >
      {p.glass && <GlassGlow accent={p.accent} />}
      <motion.div
        ref={envRef}
        whileHover={interactive && !isOpen && !reduced ? { y: -4, rotate: -0.6 } : undefined}
        transition={spring}
        className="relative"
      >
        <EnvelopeBody
          p={p}
          radius={radius}
          sealLabel={sealLabel}
          flapOpen={false}
          sealShown
          flapRef={flapRef}
          flapInnerRef={flapInnerRef}
          sealRef={sealRef}
        >
          <div
            ref={letterRef}
            className="absolute inset-x-[5%] bottom-[6%] z-20"
            style={{ transform: "scaleY(0.34)", transformOrigin: "50% 100%" }}
          >
            <div
              className={cn("relative overflow-hidden p-5", p.font, letterClassName)}
              style={{
                paddingBottom: "calc(1.25rem + 14%)",
                backgroundColor: p.paper,
                backgroundImage: p.paperTexture,
                color: p.ink,
                borderRadius: Math.round(radius * 0.6),
                boxShadow: shadowOf(p),
                backdropFilter: p.glass ? "blur(12px)" : undefined,
              }}
              aria-hidden={!isOpen}
              inert={!isOpen}
            >
              {children}
              <div
                ref={creaseRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: CREASE_LINES }}
              />
            </div>
          </div>
          {interactive && (
            <button
              type="button"
              aria-expanded={isOpen}
              aria-label={label}
              onClick={() => setOpen(!isOpen)}
              className="absolute inset-0 z-[35] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-(--env-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{ borderRadius: radius }}
            />
          )}
        </EnvelopeBody>
      </motion.div>
    </div>
  )
}
