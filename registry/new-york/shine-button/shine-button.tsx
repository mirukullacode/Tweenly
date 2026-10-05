"use client"

import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface ShineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  /** Color of the light that runs around the edge. Default: "#ff6a2b" */
  beamColor?: string
  /** Seconds for the beam to complete one lap. Default: 3 */
  duration?: number
  /** Sweep a soft sheen across the face on hover. Default: true */
  sheen?: boolean
  /** Filled or outlined face. Default: "solid" */
  variant?: "solid" | "outline"
}

export function ShineButton({
  children,
  beamColor = "#ff6a2b",
  duration = 3,
  sheen = true,
  variant = "solid",
  className,
  type = "button",
  ...props
}: ShineButtonProps) {
  const reduced = useReducedMotion()
  const solid = variant === "solid"

  return (
    <button
      type={type}
      {...props}
      className={cn(
        "group relative isolate inline-flex h-11 items-center justify-center overflow-hidden rounded-full p-[1.5px] text-sm font-medium outline-none transition-transform active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        solid ? "bg-foreground/80 text-background" : "bg-border text-foreground",
        className
      )}
    >
      {/* rotating beam, masked to the edge by the face below */}
      <motion.span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[max(200%,12rem)]"
        style={{ x: "-50%", y: "-50%" }}
        animate={reduced ? { rotate: 0 } : { rotate: 360 }}
        transition={reduced ? { duration: 0 } : { duration, repeat: Infinity, ease: "linear" }}
      >
        {/* Solid wedge from the centre outward; only the slice crossing the edge is visible. */}
        <span className="absolute bottom-1/2 left-1/2 h-1/2 w-[22%]" style={{ backgroundColor: beamColor }} />
      </motion.span>
      <span
        className={cn(
          "relative flex h-full items-center gap-2 overflow-hidden rounded-full px-6",
          solid ? "bg-foreground" : "bg-background"
        )}
      >
        {sheen && !reduced && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/5 -translate-x-full skew-x-[-20deg] bg-current opacity-0 transition-[translate,opacity] duration-700 ease-out group-hover:translate-x-[600%] group-hover:opacity-15"
          />
        )}
        <span className="relative flex items-center gap-2">{children}</span>
      </span>
    </button>
  )
}
