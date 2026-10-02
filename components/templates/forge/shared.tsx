"use client"

import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { FadeIn } from "@/registry/new-york/fade-in/fade-in"
import { cn } from "@/lib/utils"

export const ACCENT = "#ff4d12"
export const ENTER = [0.22, 1, 0.36, 1] as const
export const IN_OUT = [0.76, 0, 0.24, 1] as const
export const SPRING = { type: "spring", stiffness: 450, damping: 34 } as const

/** The Forge brand mark: an anvil-like chevron stack drawn in SVG. */
export function ForgeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", className)}>
      <rect width="24" height="24" rx="7" fill={ACCENT} />
      <path d="M7 8.5h10M7 12h7M7 15.5h4" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function ForgeWordmark({ className }: { className?: string }) {
  return (
    <a
      href="#top"
      aria-label="Forge home"
      className={cn(
        "flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <ForgeMark />
      Forge
    </a>
  )
}

/** Eyebrow badge with a small accent dot. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn("h-6 gap-1.5 bg-background/60 px-2.5 text-muted-foreground backdrop-blur", className)}>
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
      {children}
    </Badge>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}) {
  return (
    <FadeIn className={cn("mx-auto flex max-w-2xl flex-col items-center text-center", className)} distance={16}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{title}</h2>
      {description && (
        <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </FadeIn>
  )
}

/** A thin progress fill that runs once per mount and reports completion. */
export function CycleProgress({
  playing,
  duration,
  onDone,
  className,
}: {
  playing: boolean
  duration: number
  onDone: () => void
  className?: string
}) {
  return (
    <motion.span
      aria-hidden
      className={cn("absolute inset-0 origin-left", className)}
      style={{ backgroundColor: ACCENT }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: playing ? 1 : 0 }}
      transition={playing ? { duration, ease: "linear" } : { duration: 0 }}
      onAnimationComplete={() => {
        if (playing) onDone()
      }}
    />
  )
}

/** Window chrome used by the mock product panels. */
export function WindowFrame({
  title,
  right,
  children,
  className,
}: {
  title: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card", className)}>
      <div className="flex h-10 shrink-0 items-center gap-3 border-b px-4">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{title}</div>
        {right}
      </div>
      {children}
    </div>
  )
}
