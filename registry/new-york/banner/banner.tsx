"use client"

import { Fragment, useState, useSyncExternalStore } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type BannerVariant = "bar" | "pill" | "marquee" | "shimmer"
export type BannerTone = "accent" | "neutral" | "inverted"
export type BannerPosition = "static" | "sticky" | "fixed"

export interface BannerProps {
  /** Visual style. Default: "bar" */
  variant?: BannerVariant
  /** The announcement. */
  message?: React.ReactNode
  /** Marquee variant: messages scrolled in sequence. Falls back to `message`. */
  messages?: React.ReactNode[]
  /** Short label in a badge before the message. Pill variant defaults to "New". */
  badge?: React.ReactNode
  /** Makes the message a link. */
  href?: string
  /** Call to action shown after the message. */
  cta?: { label: string; href: string }
  /** Show a close button. Default: false */
  dismissible?: boolean
  /** Remember dismissal in localStorage under this key. Without it, dismissal lasts until remount. */
  storageKey?: string
  /** Icon shown before the message. */
  icon?: React.ReactNode
  /** Color scheme. Default: "accent" */
  tone?: BannerTone
  /** Accent color for the accent tone and badges (any CSS color). Default: "#ff4d12" */
  accent?: string
  /** Positioning. Fixed pins to the top of the viewport. Default: "static" */
  position?: BannerPosition
  /** Marquee variant: seconds for one full loop. Default: 30 */
  duration?: number
  /** Called after the banner is dismissed. */
  onDismiss?: () => void
  className?: string
}

const ENTER = [0.22, 1, 0.36, 1] as const
const IN_OUT = [0.76, 0, 0.24, 1] as const
const DISMISS_EVENT = "tw-banner-dismiss"

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(DISMISS_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(DISMISS_EVENT, onChange)
  }
}

function readStored(key: string) {
  try {
    return window.localStorage.getItem(key) === "dismissed"
  } catch {
    return false
  }
}

const toneClass: Record<BannerTone, string> = {
  accent: "text-white",
  neutral: "border-b border-border bg-panel text-foreground",
  inverted: "bg-foreground text-background",
}

export function Banner({
  variant = "bar",
  message,
  messages,
  badge,
  href,
  cta,
  dismissible = false,
  storageKey,
  icon,
  tone = "accent",
  accent = "#ff4d12",
  position = "static",
  duration = 30,
  onDismiss,
  className,
}: BannerProps) {
  const reduced = useReducedMotion()
  const [closed, setClosed] = useState(false)
  // Hidden on the server when a storage key is set, so a dismissed banner never flashes
  const stored = useSyncExternalStore(
    subscribe,
    () => (storageKey ? readStored(storageKey) : false),
    () => Boolean(storageKey)
  )
  const visible = !closed && !stored

  const dismiss = () => {
    setClosed(true)
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, "dismissed")
        window.dispatchEvent(new Event(DISMISS_EVENT))
      } catch {
        // Storage unavailable (private mode); dismissal still applies for this session
      }
    }
    onDismiss?.()
  }

  const isPill = variant === "pill"
  const surfaceStyle = tone === "accent" && !isPill ? { backgroundColor: accent } : undefined

  const badgeEl = (label: React.ReactNode) => (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone === "accent" && !isPill ? "bg-white/20 text-white" : "text-white"
      )}
      style={tone === "accent" && !isPill ? undefined : { backgroundColor: accent }}
    >
      {label}
    </span>
  )

  const closeButton = dismissible && (
    <button
      type="button"
      aria-label="Dismiss announcement"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        dismiss()
      }}
      className={cn(
        "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-current",
        isPill && "-mr-1.5 ml-0.5"
      )}
    >
      <X className="size-3.5" aria-hidden="true" />
    </button>
  )

  const ctaEl = cta && (
    <a
      href={cta.href}
      className={cn(
        "group/cta relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-current",
        tone === "neutral" ? "bg-foreground/[0.07] hover:bg-foreground/[0.12]" : "bg-white/15 hover:bg-white/25",
        tone === "inverted" && "bg-background/15 hover:bg-background/25"
      )}
    >
      {cta.label}
      <ArrowRight className="size-3 transition-transform duration-200 group-hover/cta:translate-x-0.5" aria-hidden="true" />
    </a>
  )

  const text = href ? (
    <a href={href} className="outline-none hover:underline hover:underline-offset-4 focus-visible:underline">
      {message}
    </a>
  ) : (
    message
  )

  const positionClass =
    position === "fixed"
      ? isPill
        ? "fixed left-1/2 top-4 z-50 -translate-x-1/2"
        : "fixed inset-x-0 top-0 z-50"
      : position === "sticky"
        ? cn("sticky z-50", isPill ? "top-4" : "top-0")
        : "relative"

  // ---------------------------------------------------------------- pill
  if (isPill) {
    const pillTone =
      tone === "inverted"
        ? "border-transparent bg-foreground text-background"
        : "border-border bg-card text-foreground"
    return (
      <div className={cn("flex justify-center", position !== "fixed" && "w-full", positionClass, className)}>
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              transition={{ duration: reduced ? 0.15 : 0.5, ease: ENTER }}
            >
              <div
                className={cn(
                  "group/pill relative inline-flex max-w-full items-center gap-2.5 rounded-full border py-1 pl-1 pr-3 text-[13px] shadow-sm transition-colors has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-[#ff4d12]/60",
                  pillTone,
                  href && (tone === "inverted" ? "hover:bg-foreground/90" : "hover:bg-foreground/[0.04]")
                )}
                style={tone === "accent" ? { borderColor: `color-mix(in oklab, ${accent} 35%, transparent)` } : undefined}
              >
                {badgeEl(badge ?? "New")}
                {icon && <span className="flex shrink-0 [&_svg]:size-4">{icon}</span>}
                {href ? (
                  // Stretched link: the whole pill is clickable, the close button stays separate
                  <a href={href} className="truncate font-medium outline-none after:absolute after:inset-0 after:rounded-full">
                    {message}
                  </a>
                ) : (
                  <span className="truncate font-medium">{message}</span>
                )}
                <ArrowRight
                  className="size-3.5 shrink-0 opacity-60 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/pill:translate-x-1 group-hover/pill:opacity-100"
                  aria-hidden="true"
                />
                {closeButton}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ---------------------------------------------------------------- bars
  const ticker = messages && messages.length > 0 ? messages : [message]

  const body =
    variant === "marquee" ? (
      <div
        className="group/ticker relative flex min-w-0 flex-1 overflow-hidden"
        // Alpha mask for edge fading, not a color gradient
        style={{ maskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)" }}
      >
        {reduced ? (
          <div className="flex w-full items-center justify-center gap-6 truncate px-4">{ticker[0]}</div>
        ) : (
          <div
            className="flex w-max shrink-0 group-hover/ticker:[animation-play-state:paused]"
            style={{ animation: `tw-banner-ticker ${duration}s linear infinite` }}
          >
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 items-center">
                {/* Repeat so a single copy always spans wide screens */}
                {[0, 1, 2].map((r) =>
                  ticker.map((m, i) => (
                    <Fragment key={`${r}-${i}`}>
                      <span className="whitespace-nowrap px-6" aria-hidden={r > 0 || undefined}>
                        {m}
                      </span>
                      <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-current opacity-40" />
                    </Fragment>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ) : (
      <div className="relative flex min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden">
        {badge && badgeEl(badge)}
        {icon && <span className="flex shrink-0 [&_svg]:size-4">{icon}</span>}
        <span className="truncate font-medium">{text}</span>
        {ctaEl}
        {variant === "shimmer" && !reduced && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[10%]"
            style={{
              // Solid, hard-edged light band swept across the bar
              backgroundColor: "rgba(255,255,255,0.4)",
              mixBlendMode: tone === "neutral" ? "normal" : "overlay",
              animation: "tw-banner-shimmer 3.2s cubic-bezier(0.76, 0, 0.24, 1) infinite",
              opacity: tone === "neutral" ? 0.5 : 1,
            }}
          />
        )}
      </div>
    )

  return (
    <div className={cn(positionClass, className)}>
      <AnimatePresence>
        {visible && (
          <motion.div
            className="overflow-hidden"
            initial={reduced ? { opacity: 0 } : { height: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto" }}
            exit={reduced ? { opacity: 0 } : { height: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.5, ease: IN_OUT }}
          >
            <motion.div
              role="region"
              aria-label="Announcement"
              initial={reduced ? false : { y: "-100%" }}
              animate={{ y: 0 }}
              exit={reduced ? undefined : { y: "-100%" }}
              transition={{ duration: 0.55, ease: ENTER }}
              className={cn("relative flex items-center gap-2 px-4 py-2 text-[13px]", toneClass[tone])}
              style={surfaceStyle}
            >
              {dismissible && <span aria-hidden="true" className="size-6 shrink-0" />}
              {body}
              {variant === "marquee" && ctaEl}
              {dismissible ? closeButton : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes tw-banner-ticker { to { transform: translateX(-50%) } }
        @keyframes tw-banner-shimmer { 0% { transform: translateX(-150%) skewX(-20deg) } 60%, 100% { transform: translateX(1100%) skewX(-20deg) } }
      `}</style>
    </div>
  )
}
