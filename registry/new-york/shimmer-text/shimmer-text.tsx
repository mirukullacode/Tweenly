"use client"

import { motion, useReducedMotion } from "motion/react"
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

  return (
    <motion.span
      className={cn("inline-block bg-clip-text text-transparent", className)}
      style={{
        backgroundImage: `linear-gradient(90deg, transparent calc(50% - ${spread}px), ${shimmerColor} 50%, transparent calc(50% + ${spread}px)), linear-gradient(${baseColor}, ${baseColor})`,
        backgroundSize: "250% 100%, auto",
        backgroundRepeat: "no-repeat",
      }}
      initial={{ backgroundPosition: "100% center, 0 0" }}
      animate={reduced ? undefined : { backgroundPosition: "0% center, 0 0" }}
      transition={{ duration, repeat: Infinity, repeatDelay, ease: "linear" }}
    >
      {children}
    </motion.span>
  )
}
