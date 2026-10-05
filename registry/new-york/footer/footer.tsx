"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { ArrowRight, ArrowUp, ArrowUpRight, Check, Globe, LoaderCircle, Mail } from "lucide-react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export type FooterVariant = "sticky-reveal" | "big-type" | "columns" | "curtain"

export interface FooterLink {
  label: string
  href: string
  /** Small pill next to the label, e.g. "New" or "Hiring". */
  badge?: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface FooterSocial {
  /** Used as the accessible name and to pick a built-in icon (GitHub, X, LinkedIn, Dribbble, YouTube, Instagram, Email). */
  label: string
  href: string
  /** Custom icon. Defaults to a built-in icon chosen by label. */
  icon?: ReactNode
}

export interface FooterProps {
  /** Layout and motion style. Default: "sticky-reveal" */
  variant?: FooterVariant
  /** Brand name, used for the wordmark and the default copyright. Default: "Motion" */
  brand?: string
  /** Mark shown before the brand name. Default: an accent dot */
  logo?: ReactNode
  /** Short line under the brand (the eyebrow in the curtain variant). Default: "Interfaces that feel quietly alive." */
  description?: string
  /** Link groups. Default: Product / Company / Resources */
  columns?: FooterColumn[]
  /** Social links. Default: GitHub, X, LinkedIn */
  socials?: FooterSocial[]
  /** Show the newsletter form (columns and big-type). Default: true */
  newsletter?: boolean
  /** Called with the email when the newsletter form is submitted. Throw or reject to show an error. */
  onSubscribe?: (email: string) => Promise<void> | void
  /** Call-to-action, used by the magnetic button in the curtain variant. Default: { label: "Start a project", href: "#" } */
  cta?: { label: string; href: string }
  /** Scrolling text in the curtain variant. Default: "Let's work together" */
  marqueeText?: string
  /** Copyright line. Default: "© {year} {brand}. All rights reserved." */
  copyright?: string
  /** Links in the bottom bar. Default: Privacy / Terms / Cookies */
  legal?: FooterLink[]
  /** Footer background (any CSS color). Follows the theme by default. Default: "var(--background)" */
  background?: string
  /** Main text color. Default: "var(--foreground)" */
  color?: string
  /** Accent for badges, focus rings, the CTA and hovers. Default: "#ff4d12" */
  accent?: string
  /** Secondary text color for links and captions. Default: "var(--muted-foreground)" */
  muted?: string
  /** Corner radius of inputs and buttons in px; the curtain panel starts at twice this. Default: 12 */
  radius?: number
  /** Height of the sticky-reveal footer (any CSS length), capped at the scroller height. Default: "70vh" */
  height?: string
  /** Wordmark size relative to the width-filling size (1 = edge to edge). Default: 1 */
  wordmarkSize?: number
  /** Show the giant wordmark (sticky-reveal and big-type). Default: true */
  showWordmark?: boolean
  /** Run scroll and entrance animations. When false (or with reduced motion) the final state renders. Default: true */
  animate?: boolean
  /** Scroll container to track instead of the window. Default: null (window) */
  scroller?: HTMLElement | null
  /** Additional classes for the root <footer>. */
  className?: string
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const YEAR = new Date().getFullYear()
const PAD_X = "px-[clamp(1.25rem,5cqw,4rem)]"
const DISPLAY = "font-[family-name:var(--font-display)]"
const FOCUS =
  "rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--fc-accent)"

export const FOOTER_DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Changelog", href: "#", badge: "New" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#", badge: "Hiring" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
]

export const FOOTER_DEFAULT_SOCIALS: FooterSocial[] = [
  { label: "GitHub", href: "#" },
  { label: "X", href: "#" },
  { label: "LinkedIn", href: "#" },
]

const DEFAULT_LEGAL: FooterLink[] = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Cookies", href: "#" },
]

/* ----------------------------------------------------------------------------
 * Icons (lucide ships no brand marks, so these are minimal inline SVGs)
 * ------------------------------------------------------------------------- */

function BrandSvg({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d={d} />
    </svg>
  )
}

const BRAND_PATHS: [RegExp, string][] = [
  [
    /github/,
    "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z",
  ],
  [
    /^x$|twitter|x\.com/,
    "M17.75 2.5h3.07l-6.7 7.66L22 21.5h-6.17l-4.84-6.32-5.53 6.32H2.38l7.17-8.2L2 2.5h6.33l4.37 5.78 5.05-5.78Zm-1.08 17.15h1.7L7.4 4.24H5.58l11.09 15.41Z",
  ],
  [
    /linkedin/,
    "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.73v20.54C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
  ],
  [
    /dribbble/,
    "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm7.93 5.53a10.2 10.2 0 0 1 2.3 6.37c-.34-.07-3.7-.75-7.08-.33-.08-.17-.15-.35-.22-.52-.2-.48-.43-.96-.66-1.43 3.73-1.52 5.43-3.7 5.66-4.09ZM12 1.77c2.6 0 4.97.97 6.77 2.57-.19.27-1.72 2.32-5.33 3.67A54.4 54.4 0 0 0 9.64 2.05 10.3 10.3 0 0 1 12 1.77Zm-4.3.95c.27.36 2.02 2.8 3.66 5.7A38.3 38.3 0 0 1 2.1 9.64a10.28 10.28 0 0 1 5.6-6.92ZM1.76 12.02v-.33c.35.01 4.44.06 8.66-1.2.24.47.47.95.68 1.43l-.33.1c-4.36 1.4-6.68 5.25-6.87 5.57a10.2 10.2 0 0 1-2.14-5.57Zm10.24 10.2c-2.35 0-4.52-.8-6.25-2.14.15-.31 1.87-3.63 6.65-5.3l.06-.02a42.4 42.4 0 0 1 2.18 7.76c-.82.35-1.72.55-2.64.55v-.85Zm4.43-1.51a44.4 44.4 0 0 0-1.99-7.28c3.17-.5 5.94.33 6.28.44a10.23 10.23 0 0 1-4.29 6.84Z",
  ],
  [
    /youtube/,
    "M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z",
  ],
  [
    /instagram/,
    "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z",
  ],
]

function socialIcon(label: string): ReactNode {
  const key = label.trim().toLowerCase()
  const match = BRAND_PATHS.find(([re]) => re.test(key))
  if (match) return <BrandSvg d={match[1]} />
  if (/mail|email|newsletter/.test(key)) return <Mail className="size-4" aria-hidden="true" />
  return <Globe className="size-4" aria-hidden="true" />
}

const isExternal = (href: string) => /^https?:\/\//.test(href)
const linkTarget = (href: string) =>
  isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {}

/* ----------------------------------------------------------------------------
 * Building blocks
 * ------------------------------------------------------------------------- */

function FooterAnchor({ link, className }: { link: FooterLink; className?: string }) {
  return (
    <a
      href={link.href}
      {...linkTarget(link.href)}
      className={cn(
        "group/link inline-flex items-center gap-1.5 text-(--fc-muted) transition-colors duration-300 hover:text-(--fc-fg)",
        FOCUS,
        className
      )}
    >
      <span className="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:after:origin-left group-hover/link:after:scale-x-100">
        {link.label}
      </span>
      {link.badge && (
        <span
          className="rounded-full px-1.5 py-px text-[10px] font-medium leading-4 text-(--fc-accent)"
          style={{ background: "color-mix(in oklab, var(--fc-accent) 16%, transparent)" }}
        >
          {link.badge}
        </span>
      )}
      <ArrowUpRight
        aria-hidden="true"
        className="size-3 -translate-x-1 translate-y-1 opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:translate-x-0 group-hover/link:translate-y-0 group-hover/link:opacity-100"
      />
    </a>
  )
}

function LinkColumn({ column, index }: { column: FooterColumn; index: number }) {
  const id = useId()
  return (
    <nav aria-labelledby={id} data-fc-reveal className="min-w-0">
      <p id={id} className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-(--fc-fg)">
        <span className="mr-2 font-mono text-(--fc-muted) opacity-60">{String(index + 1).padStart(2, "0")}</span>
        {column.title}
      </p>
      <ul className="space-y-2.5 text-sm">
        {column.links.map((link) => (
          <li key={link.label + link.href}>
            <FooterAnchor link={link} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function LinkColumns({ columns, className }: { columns: FooterColumn[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-10 @xl:grid-cols-[repeat(var(--fc-cols),minmax(0,1fr))]",
        className
      )}
      style={{ "--fc-cols": Math.max(columns.length, 1) } as CSSProperties}
    >
      {columns.map((column, i) => (
        <LinkColumn key={column.title} column={column} index={i} />
      ))}
    </div>
  )
}

function Brand({ brand, logo }: { brand: string; logo?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-(--fc-fg)">
      {logo ?? <span aria-hidden="true" className="size-2.5 rounded-full bg-(--fc-accent)" />}
      <span className={cn(DISPLAY, "text-2xl font-semibold uppercase leading-none tracking-wide")}>{brand}</span>
    </div>
  )
}

function Socials({ socials, className }: { socials: FooterSocial[]; className?: string }) {
  if (!socials.length) return null
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {socials.map((s) => (
        <li key={s.label + s.href}>
          <a
            href={s.href}
            aria-label={s.label}
            {...linkTarget(s.href)}
            className="group/social relative grid size-10 place-items-center overflow-hidden rounded-full border border-(--fc-border) text-(--fc-fg) outline-none transition-colors duration-300 before:absolute before:inset-0 before:scale-0 before:rounded-full before:bg-(--fc-fg) before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-(--fc-bg) hover:before:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fc-accent)"
          >
            <span className="relative transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/social:-rotate-8 group-hover/social:scale-110">
              {s.icon ?? socialIcon(s.label)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

type SubscribeStatus = "idle" | "loading" | "success" | "error"

function Newsletter({ onSubscribe, radius }: { onSubscribe?: FooterProps["onSubscribe"]; radius: number }) {
  const id = useId()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<SubscribeStatus>("idle")
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === "loading") return
    window.clearTimeout(timer.current)
    if (!EMAIL.test(email.trim())) {
      setStatus("error")
      return
    }
    setStatus("loading")
    try {
      await onSubscribe?.(email.trim())
      setStatus("success")
      setEmail("")
      timer.current = window.setTimeout(() => setStatus("idle"), 3200)
    } catch {
      setStatus("error")
    }
  }

  const message =
    status === "success"
      ? "Thanks, you're on the list."
      : status === "error"
        ? "Please enter a valid email address."
        : "One short email a month. No spam."

  return (
    <form onSubmit={submit} noValidate className="w-full max-w-sm">
      <label htmlFor={id} className="mb-3 block text-sm font-medium text-(--fc-fg)">
        Stay in the loop
      </label>
      <div
        className={cn(
          "flex items-center gap-1 border bg-(--fc-fg)/[0.03] p-1 transition-colors duration-300 focus-within:border-(--fc-muted)",
          status === "error" ? "border-(--fc-accent)" : "border-(--fc-border)"
        )}
        style={{ borderRadius: radius + 4 }}
      >
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          aria-invalid={status === "error"}
          aria-describedby={`${id}-msg`}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === "error") setStatus("idle")
          }}
          className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm text-(--fc-fg) outline-none placeholder:text-(--fc-muted)/70"
        />
        <button
          type="submit"
          aria-label={status === "success" ? "Subscribed" : "Subscribe"}
          disabled={status === "loading"}
          className="relative grid h-9 w-11 shrink-0 place-items-center overflow-hidden bg-(--fc-fg) text-(--fc-bg) outline-none transition-transform duration-300 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fc-accent) disabled:cursor-wait"
          style={{
            borderRadius: radius,
            background: status === "success" ? "var(--fc-accent)" : undefined,
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={status === "error" ? "idle" : status}
              initial={{ y: 14, opacity: 0, filter: "blur(2px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -14, opacity: 0, filter: "blur(2px)" }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="grid place-items-center"
            >
              {status === "loading" ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : status === "success" ? (
                <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <ArrowRight className="size-4" aria-hidden="true" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <p
        id={`${id}-msg`}
        aria-live="polite"
        className={cn(
          "mt-2.5 text-xs transition-colors duration-300",
          status === "error" || status === "success" ? "text-(--fc-fg)" : "text-(--fc-muted)"
        )}
      >
        {message}
      </p>
    </form>
  )
}

function BackToTop({ scroller, reduced }: { scroller?: HTMLElement | null; reduced: boolean }) {
  return (
    <button
      type="button"
      onClick={() => (scroller ?? window).scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
      className={cn("group/top inline-flex items-center gap-2 text-(--fc-muted) transition-colors hover:text-(--fc-fg)", FOCUS)}
    >
      Back to top
      <span className="relative grid size-7 place-items-center overflow-hidden rounded-full border border-(--fc-border)">
        <ArrowUp
          aria-hidden="true"
          className="size-3.5 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover/top:-translate-y-7"
        />
        <ArrowUp
          aria-hidden="true"
          className="absolute size-3.5 translate-y-7 text-(--fc-accent) transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover/top:translate-y-0"
        />
      </span>
    </button>
  )
}

function BottomBar({
  copyright,
  legal,
  scroller,
  reduced,
  className,
}: {
  copyright: string
  legal: FooterLink[]
  scroller?: HTMLElement | null
  reduced: boolean
  className?: string
}) {
  return (
    <div
      data-fc-reveal
      className={cn(
        "flex flex-col gap-4 border-t border-(--fc-border) pt-5 text-xs text-(--fc-muted) @2xl:flex-row @2xl:items-center @2xl:justify-between",
        className
      )}
    >
      <p>{copyright}</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {legal.length > 0 && (
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((l) => (
              <li key={l.label + l.href}>
                <FooterAnchor link={l} />
              </li>
            ))}
          </ul>
        )}
        <BackToTop scroller={scroller} reduced={reduced} />
      </div>
    </div>
  )
}

/** Giant display wordmark, auto-fitted to its container width. Letters are split for animation. */
function Wordmark({
  text,
  scale,
  interactive = false,
  className,
}: {
  text: string
  scale: number
  interactive?: boolean
  className?: string
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const chars = Array.from(text)

  useEffect(() => {
    const box = boxRef.current
    const el = textRef.current
    if (!box || !el) return
    let lastWidth = -1
    let frame = 0

    const fit = (force = false) => {
      const available = box.clientWidth
      if (!available || (!force && available === lastWidth)) return
      lastWidth = available
      el.style.fontSize = "100px"
      const natural = el.offsetWidth // layout width, unaffected by letter transforms
      if (natural > 0) el.style.fontSize = `${((100 * available) / natural) * scale * 0.995}px`
    }

    fit(true)
    // Defer to the next frame so the height change doesn't re-enter the observer
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => fit())
    })
    ro.observe(box)
    let alive = true
    document.fonts?.ready.then(() => {
      if (!alive) return
      fit(true)
      ScrollTrigger.refresh()
    })
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [text, scale])

  return (
    <div
      ref={boxRef}
      className={cn(
        DISPLAY,
        "w-full select-none overflow-hidden pt-[0.1em] font-bold uppercase leading-[0.8] tracking-[-0.01em] text-(--fc-fg)",
        className
      )}
    >
      <span className="sr-only">{text}</span>
      <span
        ref={textRef}
        aria-hidden="true"
        className="inline-block whitespace-nowrap"
        // Estimate before measuring, so the first paint is already close
        style={{ fontSize: `${(100 / Math.max(chars.length * 0.5, 1)) * scale}cqw` }}
      >
        {chars.map((c, i) => (
          <span key={i} data-fc-letter className="inline-block origin-bottom-left will-change-transform">
            <span
              className={cn(
                "inline-block",
                interactive &&
                  "transition-[transform,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[0.08em] hover:text-(--fc-accent)"
              )}
            >
              {c === " " ? " " : c}
            </span>
          </span>
        ))}
      </span>
    </div>
  )
}

function MagneticCta({ cta, reduced }: { cta: { label: string; href: string }; reduced: boolean }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 420, damping: 32, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 420, damping: 32, mass: 0.6 })
  const lx = useTransform(sx, (v) => v * 0.45)
  const ly = useTransform(sy, (v) => v * 0.45)

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.35)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div onPointerMove={onMove} onPointerLeave={reset} className="-m-8 grid place-items-center p-8">
      <motion.a
        href={cta.href}
        {...linkTarget(cta.href)}
        style={{ x: sx, y: sy }}
        className="group/cta relative grid size-[clamp(8rem,20cqw,12rem)] place-items-center overflow-hidden rounded-full bg-(--fc-accent) text-center text-sm font-medium text-white outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--fc-fg)"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 translate-y-full rounded-[inherit] bg-(--fc-fg) transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover/cta:translate-y-0"
        />
        <motion.span
          style={{ x: lx, y: ly }}
          className="relative flex flex-col items-center gap-1.5 px-4 transition-colors duration-500 group-hover/cta:text-(--fc-bg)"
        >
          <ArrowUpRight
            aria-hidden="true"
            className="size-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:rotate-45"
          />
          {cta.label}
        </motion.span>
      </motion.a>
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Footer
 * ------------------------------------------------------------------------- */

export function Footer({
  variant = "sticky-reveal",
  brand = "Motion",
  logo,
  description = "Interfaces that feel quietly alive.",
  columns = FOOTER_DEFAULT_COLUMNS,
  socials = FOOTER_DEFAULT_SOCIALS,
  newsletter = true,
  onSubscribe,
  cta = { label: "Start a project", href: "#" },
  marqueeText = "Let's work together",
  copyright,
  legal = DEFAULT_LEGAL,
  background = "var(--background)",
  color = "var(--foreground)",
  accent = "#ff4d12",
  muted = "var(--muted-foreground)",
  radius = 12,
  height = "70vh",
  wordmarkSize = 1,
  showWordmark = true,
  animate = true,
  scroller = null,
  className,
}: FooterProps) {
  const rootRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const motionOn = animate && !reduced
  const copy = copyright ?? `© ${YEAR} ${brand}. All rights reserved.`
  const panelRadius = radius * 2

  const vars = {
    "--fc-bg": background,
    "--fc-fg": color,
    "--fc-muted": muted,
    "--fc-accent": accent,
    "--fc-border": `color-mix(in oklab, ${color} 9%, transparent)`,
  } as CSSProperties

  // Sticky reveal needs the visible height of the scroller (falls back to the viewport)
  useEffect(() => {
    const root = rootRef.current
    if (!root || !scroller) return
    const set = () => root.style.setProperty("--fc-vh", `${scroller.clientHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(scroller)
    return () => {
      ro.disconnect()
      root.style.removeProperty("--fc-vh")
    }
  }, [scroller])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !motionOn) return
      const sc = scroller ?? undefined
      const letters = gsap.utils.toArray<HTMLElement>("[data-fc-letter]", root)
      const reveals = gsap.utils.toArray<HTMLElement>("[data-fc-reveal]", root)

      const staggerIn = (trigger: Element) =>
        reveals.length &&
        gsap.fromTo(
          reveals,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "expo.out",
            stagger: 0.07,
            scrollTrigger: { trigger, scroller: sc, start: "top 88%", toggleActions: "play none none reverse" },
          }
        )

      if (variant === "sticky-reveal") {
        const wrap = root.querySelector("[data-fc-wrap]")
        const content = root.querySelector("[data-fc-content]")
        if (!wrap || !content) return
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            scroller: sc,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
        tl.fromTo(
          content,
          { yPercent: -22, scale: 0.94, opacity: 0.25 },
          { yPercent: 0, scale: 1, opacity: 1, ease: "power2.out", duration: 1 },
          0
        )
        if (letters.length) {
          tl.fromTo(
            letters,
            { yPercent: 110 },
            { yPercent: 0, ease: "power3.out", duration: 0.55, stagger: { amount: 0.3 } },
            0.1
          )
        }
      }

      if (variant === "big-type") {
        staggerIn(root)
        const mark = letters[0]?.closest("[data-fc-mark]")
        if (mark) {
          gsap.fromTo(
            letters,
            { yPercent: 115, skewY: 10 },
            {
              yPercent: 0,
              skewY: 0,
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.045,
              scrollTrigger: { trigger: mark, scroller: sc, start: "top 96%", toggleActions: "play none none reverse" },
            }
          )
        }
      }

      if (variant === "columns") staggerIn(root)

      if (variant === "curtain") {
        const panel = root.querySelector("[data-fc-panel]")
        const inner = root.querySelector("[data-fc-inner]")
        const track = root.querySelector("[data-fc-track]")
        if (panel) {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: root,
                scroller: sc,
                start: "top bottom",
                end: "bottom bottom",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            })
            .fromTo(
              panel,
              { clipPath: `inset(7% 6% 0% 6% round ${panelRadius}px)` },
              { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.out", duration: 1 },
              0
            )
            .fromTo(inner, { y: 90, opacity: 0.4 }, { y: 0, opacity: 1, ease: "power2.out", duration: 1 }, 0)
        }
        if (track) gsap.to(track, { xPercent: -50, duration: 26, ease: "none", repeat: -1 })
      }

      const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 120)
      return () => window.clearTimeout(refresh)
    },
    {
      scope: rootRef,
      dependencies: [variant, motionOn, scroller, height, brand, showWordmark, wordmarkSize, panelRadius, marqueeText, columns.length],
      revertOnUpdate: true,
    }
  )

  const footerClass = cn("@container relative w-full text-(--fc-fg)", className)

  /* ---------------------------------- sticky reveal ---------------------------------- */
  if (variant === "sticky-reveal") {
    const h = `min(${height}, var(--fc-vh, 100dvh))`
    return (
      <footer ref={rootRef} className={footerClass} style={vars}>
        <div
          data-fc-wrap
          className="relative"
          style={{ height: h, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
        >
          <div className="relative" style={{ height: `calc(var(--fc-vh, 100dvh) + ${h})`, top: "calc(-1 * var(--fc-vh, 100dvh))" }}>
            <div
              className="sticky overflow-hidden bg-(--fc-bg)"
              style={{ height: h, top: `calc(var(--fc-vh, 100dvh) - ${h})` }}
            >
              <div
                data-fc-content
                className={cn(PAD_X, "flex h-full origin-bottom flex-col justify-between gap-8 pb-5 pt-[clamp(2rem,6cqw,4.5rem)]")}
              >
                <div className="grid gap-10 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                  <div className="flex flex-col items-start gap-5">
                    <Brand brand={brand} logo={logo} />
                    {description && (
                      <p className="max-w-xs text-balance text-sm leading-relaxed text-(--fc-muted)">{description}</p>
                    )}
                    <Socials socials={socials} />
                  </div>
                  <LinkColumns columns={columns} />
                </div>
                <div className="flex flex-col gap-4">
                  {showWordmark && <Wordmark text={brand} scale={wordmarkSize} />}
                  <BottomBar copyright={copy} legal={legal} scroller={scroller} reduced={reduced} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  /* ------------------------------------ big type ------------------------------------- */
  if (variant === "big-type") {
    return (
      <footer ref={rootRef} className={cn(footerClass, "overflow-clip bg-(--fc-bg)")} style={vars}>
        <div className={cn(PAD_X, "pt-[clamp(3rem,8cqw,6rem)]")}>
          <div className="grid gap-12 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <div data-fc-reveal className="flex flex-col items-start gap-6">
              <p className="max-w-sm text-balance text-[clamp(1.25rem,2.6cqw,1.75rem)] font-medium leading-snug tracking-tight">
                {description}
              </p>
              {newsletter && <Newsletter onSubscribe={onSubscribe} radius={radius} />}
            </div>
            <LinkColumns columns={columns} />
          </div>
          <div
            data-fc-reveal
            className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-(--fc-border) pt-5"
          >
            <Brand brand={brand} logo={logo} />
            <Socials socials={socials} />
          </div>
        </div>
        {showWordmark && (
          <div data-fc-mark className={cn(PAD_X, "mt-6")}>
            <Wordmark text={brand} scale={wordmarkSize} interactive />
          </div>
        )}
        <div className={cn(PAD_X, "pb-5 pt-4")}>
          <BottomBar copyright={copy} legal={legal} scroller={scroller} reduced={reduced} />
        </div>
      </footer>
    )
  }

  /* ------------------------------------ columns -------------------------------------- */
  if (variant === "columns") {
    return (
      <footer ref={rootRef} className={cn(footerClass, "border-t border-(--fc-border) bg-(--fc-bg)")} style={vars}>
        <div className={cn(PAD_X, "pb-5 pt-[clamp(3rem,7cqw,5.5rem)]")}>
          <div className="grid gap-12 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] @3xl:gap-16">
            <div data-fc-reveal className="flex flex-col items-start gap-5">
              <Brand brand={brand} logo={logo} />
              {description && (
                <p className="max-w-xs text-balance text-sm leading-relaxed text-(--fc-muted)">{description}</p>
              )}
              <Socials socials={socials} />
              {newsletter && (
                <div className="mt-4 w-full">
                  <Newsletter onSubscribe={onSubscribe} radius={radius} />
                </div>
              )}
            </div>
            <LinkColumns columns={columns} />
          </div>
          <BottomBar copyright={copy} legal={legal} scroller={scroller} reduced={reduced} className="mt-16" />
        </div>
      </footer>
    )
  }

  /* ------------------------------------ curtain -------------------------------------- */
  const phrase = marqueeText
  return (
    <footer ref={rootRef} className={footerClass} style={vars}>
      <div
        data-fc-panel
        className="overflow-hidden bg-(--fc-bg)"
      >
        <div data-fc-inner className="pb-5 pt-[clamp(3rem,8cqw,6rem)]">
          <p className={cn(PAD_X, "flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-(--fc-muted)")}>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-(--fc-accent)" />
            {description}
          </p>

          <div className="relative mt-6 overflow-hidden">
            <p className="sr-only">{phrase}</p>
            <div
              data-fc-track
              aria-hidden="true"
              className={cn(
                DISPLAY,
                "flex w-max whitespace-nowrap text-[clamp(3.5rem,13cqw,11rem)] font-bold uppercase leading-[0.95] tracking-[-0.01em]"
              )}
            >
              {Array.from({ length: 2 }, (_, half) => (
                <span key={half} className="flex">
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} className="flex items-center">
                      <span className="px-[0.18em]">{phrase}</span>
                      <span className="text-(--fc-accent)">·</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>

          <div
            className={cn(
              PAD_X,
              "mt-[clamp(2.5rem,6cqw,4.5rem)] grid items-center gap-12 @3xl:grid-cols-[auto_minmax(0,1fr)] @3xl:gap-20"
            )}
          >
            <div className="flex justify-center @3xl:justify-start">
              <MagneticCta cta={cta} reduced={reduced} />
            </div>
            <div className="grid gap-10">
              <LinkColumns columns={columns} />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Brand brand={brand} logo={logo} />
                <Socials socials={socials} />
              </div>
            </div>
          </div>

          <div className={cn(PAD_X, "mt-12")}>
            <BottomBar copyright={copy} legal={legal} scroller={scroller} reduced={reduced} />
          </div>
        </div>
      </div>
    </footer>
  )
}
