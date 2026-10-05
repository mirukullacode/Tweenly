"use client"

import { useEffect } from "react"
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { cn } from "@/lib/utils"

export interface ShimmerTextProps {
  children: string
  /** Seconds for one sweep across the text. Default: 2 */
  duration?: number
  /** Width of the highlight band, in px. Default: 60 */
  spread?: number
  /** Pause between sweeps, in seconds. Default: 0.4 */
  repeatDelay?: number
  /** Base text color (any CSS color). Default: muted foreground */
  baseColor?: string
  /** Highlight color (any CSS color). Default: foreground */
  shimmerColor?: string
  className?: string
}

export function ShimmerText({
  children,
  duration = 2,
  spread = 60,
  repeatDelay = 0.4,
  baseColor = "var(--muted-foreground)",
  shimmerColor = "var(--foreground)",
  className,
}: ShimmerTextProps) {
  const reduced = useReducedMotion()
  // Sweep progress: 0 = band fully off the left edge, 1 = fully off the right edge.
  const progress = useMotionValue(0)
  const band = spread * 2
  // A solid, hard-edged band of the highlight color, revealed through a sliding clip-path.
  const clipPath = useTransform(progress, (v) => {
    const left = `max(0px, calc(${v * 100}% + ${2 * v * spread - band}px))`
    const right = `max(0px, calc(${(1 - v) * 100}% - ${2 * v * spread}px))`
    return `inset(0 ${right} 0 ${left})`
  })

  useEffect(() => {
    if (reduced) {
      progress.set(0)
      return
    }
    progress.set(0)
    const controls = animate(progress, 1, { duration, repeat: Infinity, repeatDelay, ease: "linear" })
    return () => controls.stop()
  }, [reduced, duration, repeatDelay, progress])

  return (
    <span className={cn("relative inline-block", className)} style={{ color: baseColor }}>
      {children}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none"
        style={{ color: shimmerColor, clipPath }}
      >
        {children}
      </motion.span>
    </span>
  )
}
