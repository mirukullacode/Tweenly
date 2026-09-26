"use client"

import { motion } from "motion/react"
import type { Transition } from "motion/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type FadeInDirection = "up" | "down" | "left" | "right" | "none"
export type FadeInEase = "smooth" | "snappy" | "linear" | "spring"

export interface FadeInProps {
  children: React.ReactNode
  /** Direction the element travels while appearing. Default: "up" */
  direction?: FadeInDirection
  /** Travel distance in px. Default: 24 */
  distance?: number
  /** Animation length in seconds (lower = faster). Default: 0.6 */
  duration?: number
  /** Delay before starting, in seconds. Default: 0 */
  delay?: number
  /** Easing preset. Default: "smooth" */
  ease?: FadeInEase
  /** Starting scale (1 = no scale). Default: 1 */
  scale?: number
  /** Starting blur in px (0 = no blur). Default: 0 */
  blur?: number
  /** Animate only the first time it enters view. Default: true */
  once?: boolean
  /** How much of the element must be visible, 0 to 1. Default: 0.2 */
  amount?: number
  className?: string
}

const EASINGS: Record<"smooth" | "snappy" | "linear", [number, number, number, number]> = {
  smooth: [0.16, 1, 0.3, 1],
  snappy: [0.4, 0, 0.2, 1],
  linear: [0, 0, 1, 1],
}

function getOffset(direction: FadeInDirection, distance: number) {
  switch (direction) {
    case "up":
      return { x: 0, y: distance }
    case "down":
      return { x: 0, y: -distance }
    case "left":
      return { x: distance, y: 0 }
    case "right":
      return { x: -distance, y: 0 }
    default:
      return { x: 0, y: 0 }
  }
}

export function FadeIn({
  children,
  direction = "up",
  distance = 24,
  duration = 0.6,
  delay = 0,
  ease = "smooth",
  scale = 1,
  blur = 0,
  once = true,
  amount = 0.2,
  className,
}: FadeInProps) {
  const reduced = useReducedMotion()

  // Reduced motion: keep a short opacity fade, drop all movement.
  const offset = reduced ? { x: 0, y: 0 } : getOffset(direction, distance)
  const startScale = reduced ? 1 : scale
  const startBlur = reduced ? 0 : blur

  const hidden = {
    opacity: 0,
    x: offset.x,
    y: offset.y,
    scale: startScale,
    ...(startBlur > 0 ? { filter: `blur(${startBlur}px)` } : {}),
  }

  const visible = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    ...(startBlur > 0 ? { filter: "blur(0px)" } : {}),
  }

  let transition: Transition
  if (reduced) {
    transition = { duration: 0.2 }
  } else if (ease === "spring") {
    transition = { type: "spring", stiffness: 120, damping: 18, delay }
  } else {
    transition = { duration, delay, ease: EASINGS[ease] }
  }

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={visible}
      viewport={{ once, amount }}
      transition={transition}
    >
      {children}
    </motion.div>
  )
}