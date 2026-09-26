"use client"

import { useRef } from "react"
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react"
import { cn } from "@/lib/utils"

export interface MagneticProps {
  children: React.ReactNode
  /** How far the element follows the cursor, 0 to 1. Default: 0.35 */
  strength?: number
  /** Extra hit area around the element, in px. Default: 40 */
  range?: number
  /** Spring stiffness. Higher = snappier. Default: 180 */
  stiffness?: number
  /** Spring damping. Higher = less wobble. Default: 14 */
  damping?: number
  className?: string
}

export function Magnetic({
  children,
  strength = 0.35,
  range = 40,
  stiffness = 180,
  damping = 14,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const spring = { stiffness, damping, mass: 0.2 }
  const x = useSpring(useMotionValue(0), spring)
  const y = useSpring(useMotionValue(0), spring)

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    // The outer padding widens the area that "catches" the cursor
    <div
      className={cn("inline-block", className)}
      style={{ padding: range, margin: -range }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      <motion.div ref={ref} style={{ x, y }} className="inline-block">
        {children}
      </motion.div>
    </div>
  )
}
