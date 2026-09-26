"use client"

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /** Spotlight radius in px. Default: 280 */
  size?: number
  /** Spotlight color (any CSS color). Default: 10% foreground */
  color?: string
  /** Also light up the card border. Default: true */
  border?: boolean
  /** Border highlight color. Default: 50% foreground */
  borderColor?: string
}

export function SpotlightCard({
  children,
  size = 280,
  color = "color-mix(in oklab, var(--foreground) 10%, transparent)",
  border = true,
  borderColor = "color-mix(in oklab, var(--foreground) 50%, transparent)",
  className,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  ...props
}: SpotlightCardProps) {
  const x = useMotionValue(-size)
  const y = useMotionValue(-size)
  const opacity = useSpring(0, { stiffness: 200, damping: 30 })

  const fill = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 70%)`
  const ring = useMotionTemplate`radial-gradient(${size * 0.8}px circle at ${x}px ${y}px, ${borderColor}, transparent 70%)`

  return (
    <div
      {...props}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card text-card-foreground",
        className
      )}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        x.set(e.clientX - rect.left)
        y.set(e.clientY - rect.top)
        onPointerMove?.(e)
      }}
      onPointerEnter={(e) => {
        opacity.set(1)
        onPointerEnter?.(e)
      }}
      onPointerLeave={(e) => {
        opacity.set(0)
        onPointerLeave?.(e)
      }}
    >
      {border && (
        // Masked to a 1px ring so only the border lights up
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] p-px"
          style={{
            background: ring,
            opacity,
            WebkitMask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
            mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
          }}
        />
      )}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: fill, opacity }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}
