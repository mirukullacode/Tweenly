"use client"

import { useRef } from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"
import { cn } from "@/lib/utils"

export interface TiltCardProps {
  children: React.ReactNode
  /** Maximum rotation in degrees. Default: 12 */
  maxTilt?: number
  /** CSS perspective in px. Lower = more dramatic. Default: 900 */
  perspective?: number
  /** Scale while hovered. Default: 1.03 */
  scale?: number
  /** Show a light glare that follows the cursor. Default: true */
  glare?: boolean
  /** Glare opacity, 0 to 1. Default: 0.25 */
  glareOpacity?: number
  /** Invert the tilt direction. Default: false */
  reverse?: boolean
  className?: string
}

export function TiltCard({
  children,
  maxTilt = 12,
  perspective = 900,
  scale = 1.03,
  glare = true,
  glareOpacity = 0.25,
  reverse = false,
  className,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // Pointer position, normalised to 0..1 within the card
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const hover = useMotionValue(0)

  const spring = { stiffness: 220, damping: 20 }
  const dir = reverse ? -1 : 1
  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt * dir, -maxTilt * dir]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt * dir, maxTilt * dir]), spring)
  const s = useSpring(useTransform(hover, [0, 1], [1, scale]), spring)

  // Solid sheen band (a third of the width) that tracks the cursor horizontally
  const glareX = useTransform(px, (v) => `${v * 333 - 50}%`)
  const glareAlpha = useSpring(hover, spring)

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
    hover.set(1)
  }

  const reset = () => {
    px.set(0.5)
    py.set(0.5)
    hover.set(0)
  }

  return (
    <div style={{ perspective }} className="inline-block">
      <motion.div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        style={{ rotateX, rotateY, scale: s, transformStyle: "preserve-3d" }}
        className={cn("relative overflow-hidden rounded-2xl will-change-transform", className)}
      >
        {children}
        {glare && (
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: glareAlpha }}>
            <motion.div
              className="absolute -inset-y-1/4 left-0 w-1/3"
              style={{ x: glareX, skewX: -20, backgroundColor: `rgba(255,255,255,${glareOpacity})` }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
