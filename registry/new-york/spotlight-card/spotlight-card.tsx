"use client"

import { motion, useMotionValue, useSpring, type MotionValue } from "motion/react"
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

  // Flat, hard-edged light disc; its visible radius roughly matches the old soft falloff.
  const disc = size * 1.1

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
        // Masked to a 1px ring so only the border lights up.
        // Alpha mask made of solid, hard-edged layers (content-box cut-out), not a color gradient.
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] p-px"
          style={{
            opacity,
            WebkitMask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
            mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
          }}
        >
          <Disc x={x} y={y} diameter={disc} color={borderColor} />
        </motion.div>
      )}
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }}>
        <Disc x={x} y={y} diameter={disc} color={color} />
      </motion.div>
      <div className="relative">{children}</div>
    </div>
  )
}

/** Solid circle centred on the pointer. */
function Disc({ x, y, diameter, color }: { x: MotionValue<number>; y: MotionValue<number>; diameter: number; color: string }) {
  return (
    <motion.div className="absolute top-0 left-0 size-0" style={{ x, y }}>
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: diameter, height: diameter, backgroundColor: color }}
      />
    </motion.div>
  )
}
