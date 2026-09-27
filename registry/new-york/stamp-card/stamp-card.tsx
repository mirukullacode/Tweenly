"use client"

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react"
import {
  AnimatePresence,
  motion,
  useAnimate,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type Transition,
} from "motion/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type StampCardVariant = "classic" | "airmail" | "minimal"

export interface StampCardProps {
  /** Image URL for the artwork. Missing or broken images fall back to a duotone illustration. */
  image?: string
  /** Title printed under the artwork. Default: "" */
  title?: string
  /** Denomination shown in the top-right corner, e.g. "₹25" or "50c". Default: "₹25" */
  value?: string
  /** Country or brand printed in the footer and around the postmark. Default: "India" */
  country?: string
  /** Small caption next to the country. Default: "" */
  caption?: string
  /** Visual style. Default: "classic" */
  variant?: StampCardVariant
  /** Paper color (any CSS color). Defaults to a cream, off-white or accent tint depending on the variant. */
  paper?: string
  /** Postmark ink color (any CSS color). Default: "#0a0a0a" */
  ink?: string
  /** Accent color for frames, text and the fallback artwork (any CSS color). Default: "#ff4d12" */
  accent?: string
  /** Perforation hole diameter in px. Default: 8 */
  perforation?: number
  /** Stamp width in px. The height follows at roughly 5:6, snapped to the perforation grid. Default: 180 */
  size?: number
  /** Controlled postmark state. */
  postmarked?: boolean
  /** Initial postmark state when uncontrolled. Default: false */
  defaultPostmarked?: boolean
  /** Called with the new state when the stamp is clicked. */
  onPostmark?: (postmarked: boolean) => void
  /** Toggle the postmark on click / Enter. Default: true */
  clickToPostmark?: boolean
  /** Text in the middle of the postmark. Default: "PAID" */
  postmarkLabel?: string
  /** Maximum 3D tilt in degrees on hover. 0 disables. Default: 12 */
  tilt?: number
  /** Show a light glare that follows the pointer. Default: true */
  glare?: boolean
  /** Resting rotation in degrees. Default: 0 */
  rotate?: number
  className?: string
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const
const SPRING = { stiffness: 420, damping: 32 }

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

const PAPER: Record<StampCardVariant, string> = {
  classic: "#f3ead6",
  airmail: "#fbf9f4",
  minimal: "",
}

const hash = (s: string) => {
  let h = 7
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

/** Snaps the stamp to a whole number of perforation steps so every edge ends on a hole. */
export function stampDims(size: number, perforation: number) {
  const hole = Math.max(perforation, 2)
  const step = hole * 1.75
  const cols = Math.max(6, Math.round(size / step))
  const width = cols * step
  const rows = Math.max(7, Math.round((width * 1.2) / step))
  return { width, height: rows * step, hole, step }
}

function perforationMask(width: number, height: number, hole: number, step: number) {
  const r = hole / 2
  return `radial-gradient(circle at center, transparent ${r}px, #000 ${r + 0.5}px) ${-step / 2}px ${-step / 2}px / ${step}px ${step}px repeat, linear-gradient(#000 0 0) center / ${width - hole}px ${height - hole}px no-repeat`
}

function Artwork({ accent, paper, seed }: { accent: string; paper: string; seed: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const deep = `color-mix(in oklab, ${accent} 62%, #000)`
  const light = `color-mix(in oklab, ${accent} 22%, ${paper})`
  const mid = `color-mix(in oklab, ${accent} 55%, ${paper})`
  const motif = seed % 3
  const sunX = 30 + (seed % 40)

  return (
    <svg aria-hidden="true" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
      <defs>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: light }} />
          <stop offset="1" style={{ stopColor: mid }} />
        </linearGradient>
        <pattern id={`${uid}h`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <line x1="0" y1="0" x2="0" y2="3" strokeWidth="0.8" style={{ stroke: deep }} />
        </pattern>
      </defs>
      <rect width="100" height="120" fill={`url(#${uid}s)`} />
      {motif === 0 && (
        <>
          <circle cx={sunX} cy="42" r="17" style={{ fill: paper }} opacity="0.9" />
          <path d="M0 82 Q22 60 48 76 T100 66 V120 H0Z" style={{ fill: accent }} />
          <path d="M0 82 Q22 60 48 76 T100 66 V120 H0Z" fill={`url(#${uid}h)`} opacity="0.25" />
          <path d="M0 100 Q30 82 62 96 T100 92 V120 H0Z" style={{ fill: deep }} />
        </>
      )}
      {motif === 1 && (
        <>
          {[40, 31, 22, 13].map((r, i) => (
            <circle key={r} cx="50" cy="58" r={r} style={{ fill: i % 2 ? paper : accent }} opacity={i % 2 ? 0.85 : 1 - i * 0.12} />
          ))}
          <path d="M0 96 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 V120 H0Z" style={{ fill: deep }} />
          <path d="M0 104 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0" fill="none" strokeWidth="1.5" style={{ stroke: paper }} opacity="0.6" />
        </>
      )}
      {motif === 2 && (
        <>
          <circle cx={100 - sunX} cy="34" r="11" style={{ fill: accent }} />
          <path d="M-5 104 L32 46 L54 78 L70 56 L105 104Z" style={{ fill: deep }} />
          <path d="M-5 104 L32 46 L54 78 L70 56 L105 104Z" fill={`url(#${uid}h)`} opacity="0.3" />
          <path d="M32 46 L24 58 L30 56 L36 62 L40 58Z" style={{ fill: paper }} opacity="0.9" />
          <rect y="104" width="100" height="16" style={{ fill: accent }} />
        </>
      )}
    </svg>
  )
}

function Art({ image, alt, accent, paper, seed, duotone }: { image?: string; alt: string; accent: string; paper: string; seed: number; duotone: boolean }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading")
  const loaded = state === "loaded"
  return (
    <>
      <Artwork accent={accent} paper={paper} seed={seed} />
      {image && state !== "error" && (
        <img
          src={image}
          alt={alt}
          draggable={false}
          ref={(el) => {
            if (el?.complete) setState(el.naturalWidth > 0 ? "loaded" : "error")
          }}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className="absolute inset-0 size-full select-none object-cover transition-opacity duration-500"
          style={{ opacity: loaded ? 1 : 0, filter: duotone ? "grayscale(1) contrast(1.15)" : "saturate(0.9) contrast(1.05)" }}
        />
      )}
      {image && loaded && duotone && (
        <>
          <span aria-hidden="true" className="absolute inset-0 mix-blend-lighten" style={{ backgroundColor: `color-mix(in oklab, ${accent} 60%, #000)` }} />
          <span aria-hidden="true" className="absolute inset-0 mix-blend-multiply" style={{ backgroundColor: `color-mix(in oklab, ${accent} 25%, ${paper})` }} />
        </>
      )}
    </>
  )
}

function Postmark({ ink, text, label }: { ink: string; text: string; label: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const ring = `${text} • ${text} • `.toUpperCase()
  return (
    <svg viewBox="0 0 230 120" className="size-full overflow-visible" aria-hidden="true">
      <defs>
        <filter id={`${uid}f`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="1" seed="9" result="m" />
          <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9" result="mask" />
          <feComposite in="d" in2="mask" operator="in" />
        </filter>
        <path id={`${uid}p`} d="M60 60 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" />
      </defs>
      <g filter={`url(#${uid}f)`} fill="none" style={{ stroke: ink }}>
        <circle cx="60" cy="60" r="47" strokeWidth="2.6" />
        <circle cx="60" cy="60" r="28" strokeWidth="1.6" />
        <text fontSize="9.5" fontWeight="700" letterSpacing="1.6" stroke="none" style={{ fill: ink, fontFamily: "ui-monospace, monospace" }}>
          <textPath href={`#${uid}p`} textLength="228" lengthAdjust="spacingAndGlyphs">
            {ring}
          </textPath>
        </text>
        <text x="60" y="64" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="1.5" stroke="none" style={{ fill: ink, fontFamily: "ui-monospace, monospace" }}>
          {label}
        </text>
        {[34, 47, 60, 73, 86].map((y) => (
          <path key={y} d={`M112 ${y} q9 -7 18 0 t18 0 t18 0 t18 0 t18 0 t18 0`} strokeWidth="2.6" strokeLinecap="round" />
        ))}
      </g>
    </svg>
  )
}

export function StampCard({
  image,
  title = "",
  value = "₹25",
  country = "India",
  caption = "",
  variant = "classic",
  paper: paperProp,
  ink = "#0a0a0a",
  accent = "#ff4d12",
  perforation = 8,
  size = 180,
  postmarked: postmarkedProp,
  defaultPostmarked = false,
  onPostmark,
  clickToPostmark = true,
  postmarkLabel = "PAID",
  tilt = 12,
  glare = true,
  rotate = 0,
  className,
}: StampCardProps) {
  const reduced = useReducedMotion()
  const [inner, setInner] = useState(defaultPostmarked)
  const postmarked = postmarkedProp ?? inner

  const paper = paperProp || PAPER[variant] || `color-mix(in oklab, ${accent} 14%, #fff)`
  const { width, height, hole, step } = stampDims(size, perforation)
  const mask = perforationMask(width, height, hole, step)
  const seed = hash(`${title}${country}${value}`)
  const inset = hole / 2 + (variant === "airmail" ? 10 : 6)
  const textColor = variant === "minimal" ? `color-mix(in oklab, ${accent} 72%, #000)` : `color-mix(in oklab, ${accent} 28%, #1c1917)`

  // Pointer tilt
  const tiltRef = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const hover = useMotionValue(0)
  const active = tilt > 0 && !reduced
  const rotateX = useSpring(useTransform(py, [0, 1], [tilt, -tilt]), SPRING)
  const rotateY = useSpring(useTransform(px, [0, 1], [-tilt, tilt]), SPRING)
  const lift = useSpring(hover, SPRING)
  const y = useTransform(lift, [0, 1], [0, -6])
  const shadowY = useTransform(lift, [0, 1], [3, 16])
  const shadowBlur = useTransform(lift, [0, 1], [5, 22])
  const shadowAlpha = useTransform(lift, [0, 1], [0.18, 0.28])
  const shadow = useMotionTemplate`drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha}))`
  const gx = useTransform(px, (v) => `${v * 100}%`)
  const gy = useTransform(py, (v) => `${v * 100}%`)
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)`

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || !tiltRef.current) return
    const rect = tiltRef.current.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
    hover.set(1)
  }

  const reset = () => {
    px.set(0.5)
    py.set(0.5)
    hover.set(0)
  }

  // Press the paper down when the postmark lands
  const [scope, animateScope] = useAnimate<HTMLDivElement>()
  const prevRef = useRef(postmarked)
  useEffect(() => {
    if (postmarked && !prevRef.current && !reduced && scope.current) {
      animateScope(scope.current, { scale: [1, 0.955, 1.01, 1] }, { duration: 0.45, ease: EASE_IN_OUT, times: [0, 0.3, 0.7, 1] })
    }
    prevRef.current = postmarked
  }, [postmarked, reduced, animateScope, scope])

  const toggle = () => {
    if (!clickToPostmark) return
    const next = !postmarked
    if (postmarkedProp === undefined) setInner(next)
    onPostmark?.(next)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggle()
    }
  }

  const stampT: Transition = reduced
    ? { duration: 0 }
    : {
        default: { duration: 0.34, ease: EASE_OUT },
        opacity: { duration: 0.9, times: [0, 0.3, 1], ease: "easeOut" },
      }

  const panel: CSSProperties =
    variant === "classic"
      ? { border: `1px solid color-mix(in oklab, ${accent} 45%, ${paper})`, padding: 5 }
      : variant === "airmail"
        ? { backgroundColor: paper, padding: 6, boxShadow: `inset 0 0 0 1px color-mix(in oklab, #1c1917 12%, transparent)` }
        : { padding: 0 }

  const paperBg =
    variant === "airmail"
      ? `repeating-linear-gradient(-45deg, #d7263d 0 9px, transparent 9px 14px, #1f4fbf 14px 23px, transparent 23px 28px), ${paper}`
      : paper

  return (
    <div className={cn("relative inline-block shrink-0", className)} style={{ perspective: 900, rotate: `${rotate}deg`, width, height }}>
      <motion.div
        ref={tiltRef}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        onClick={toggle}
        onKeyDown={clickToPostmark ? onKeyDown : undefined}
        role={clickToPostmark ? "button" : undefined}
        tabIndex={clickToPostmark ? 0 : undefined}
        aria-pressed={clickToPostmark ? postmarked : undefined}
        aria-label={`${title || country} stamp, ${value}${postmarked ? ", postmarked" : ""}`}
        className={cn("relative size-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4", clickToPostmark && "cursor-pointer")}
        style={{ rotateX: active ? rotateX : 0, rotateY: active ? rotateY : 0, y: reduced ? 0 : y, transformStyle: "preserve-3d" }}
      >
        <div ref={scope} className="size-full">
          <motion.div className="size-full" style={{ filter: shadow }}>
            <div
              className="@container relative size-full select-none overflow-hidden"
              style={{ WebkitMask: mask, mask, background: paperBg } as CSSProperties}
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-multiply" style={{ backgroundImage: NOISE }} />

              <div className="absolute flex flex-col" style={{ inset, ...panel }}>
                <div className="relative flex-1 overflow-hidden" style={{ backgroundColor: paper }}>
                  <Art image={image} alt={title} accent={accent} paper={paper} seed={seed} duotone={variant === "minimal"} />
                  <span
                    className="absolute right-0 top-0 pb-[1.5cqw] pl-[2.5cqw] pr-[2cqw] pt-[1cqw] font-serif text-[11cqw] font-bold leading-none tracking-tight"
                    style={{ backgroundColor: paper, color: textColor, borderBottomLeftRadius: variant === "minimal" ? 6 : 0 }}
                  >
                    {value}
                  </span>
                </div>
                <div className="pt-[3cqw]" style={{ color: textColor }}>
                  {title && <p className="truncate font-serif text-[8cqw] font-semibold italic leading-tight">{title}</p>}
                  <div className="mt-[1cqw] flex items-baseline justify-between gap-2 leading-none">
                    <span className="truncate text-[5.2cqw] font-bold uppercase tracking-[0.18em]">{country}</span>
                    {caption && <span className="shrink-0 text-[4.4cqw] uppercase tracking-wider opacity-70">{caption}</span>}
                  </div>
                </div>
              </div>

              {glare && !reduced && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                  style={{ background: glareBg, opacity: lift }}
                />
              )}
            </div>
          </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {postmarked && (
            <motion.div
              key="postmark"
              aria-hidden="true"
              className="pointer-events-none absolute mix-blend-multiply"
              style={{ left: "34%", top: "50%", width: width * 1.05, height: width * 0.55, transformOrigin: "26% 50%" }}
              initial={{ scale: 1.9, rotate: -30, opacity: 0, filter: "blur(3px)" }}
              animate={{ scale: 1, rotate: -14, opacity: [0, 0.95, 0.8], filter: "blur(0px)" }}
              exit={{ scale: 1.08, opacity: 0, filter: "blur(2px)", transition: { duration: reduced ? 0 : 0.3, ease: EASE_OUT } }}
              transition={stampT}
            >
              <Postmark ink={ink} text={country || "Post"} label={postmarkLabel} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export interface StampSheetProps {
  /** Stamps in the fan, left to right. Each accepts every StampCard prop. */
  stamps: StampCardProps[]
  /** Stamp width in px, applied unless a stamp sets its own `size`. Default: 150 */
  size?: number
  /** Distance between stamp centers when spread on hover, px. Default: size * 0.8 */
  spread?: number
  /** Rotation between neighbouring stamps at rest, degrees. Default: 7 */
  fan?: number
  className?: string
}

/** A fanned stack of stamps that spreads out on hover. */
export function StampSheet({ stamps, size = 150, spread, fan = 7, className }: StampSheetProps) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const gap = spread ?? size * 0.8
  const { width, height } = stampDims(size, 8)
  const center = (stamps.length - 1) / 2
  const transition: Transition = reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }

  return (
    <div
      className={cn("relative", className)}
      style={{ width: width + Math.max(stamps.length - 1, 0) * gap, height: height + 48 }}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {stamps.map((stamp, i) => {
        const o = i - center
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{ marginLeft: -width / 2, marginTop: -height / 2, zIndex: i }}
            initial={false}
            animate={{
              x: open ? o * gap : o * size * 0.26,
              y: open ? Math.abs(o) * 4 : Math.abs(o) * 8,
              rotate: open ? o * fan * 0.35 : o * fan,
            }}
            transition={{ ...transition, delay: reduced ? 0 : Math.abs(o) * 0.02 }}
          >
            <StampCard tilt={8} size={size} {...stamp} />
          </motion.div>
        )
      })}
    </div>
  )
}
