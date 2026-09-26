"use client"

import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export type LoaderVariant = "dots" | "bars" | "orbit"

export interface LoaderProps {
  /** Animation style. Default: "dots" */
  variant?: LoaderVariant
  /** Overall size in px. Default: 40 */
  size?: number
  /** Color (any CSS color). Default: "currentColor" */
  color?: string
  /** Seconds per cycle. Lower = faster. Default: 1 */
  speed?: number
  /** Number of dots or bars. Default: 3 for dots, 5 for bars */
  count?: number
  /** Accessible label. Default: "Loading" */
  label?: string
  className?: string
}

export function Loader({
  variant = "dots",
  size = 40,
  color = "currentColor",
  speed = 1,
  count,
  label = "Loading",
  className,
}: LoaderProps) {
  const reduced = useReducedMotion()
  const repeat = reduced ? 0 : Infinity
  const n = count ?? (variant === "bars" ? 5 : 3)

  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
      style={{ width: size, height: size, color }}
    >
      {variant === "dots" && (
        <span className="flex items-center" style={{ gap: size * 0.12 }}>
          {Array.from({ length: n }, (_, i) => (
            <motion.span
              key={i}
              className="rounded-full bg-current"
              style={{ width: size * 0.2, height: size * 0.2 }}
              animate={{ y: [0, -size * 0.22, 0], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: speed, repeat, ease: "easeInOut", delay: (i / n) * speed * 0.5 }}
            />
          ))}
        </span>
      )}

      {variant === "bars" && (
        <span className="flex h-full items-center" style={{ gap: size * 0.08 }}>
          {Array.from({ length: n }, (_, i) => (
            <motion.span
              key={i}
              className="rounded-full bg-current"
              style={{ width: size * 0.1, height: "100%", originY: 0.5 }}
              animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: speed, repeat, ease: "easeInOut", delay: (i / n) * speed * 0.6 }}
            />
          ))}
        </span>
      )}

      {variant === "orbit" && (
        <span className="relative size-full">
          {/* track */}
          <span className="absolute inset-0 rounded-full border-2 border-current opacity-15" />
          {/* sweeping arc */}
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-current"
            animate={{ rotate: 360 }}
            transition={{ duration: speed, repeat, ease: "linear" }}
          />
          {/* two satellites orbiting in opposite directions */}
          {[1, -1].map((dir) => (
            <motion.span
              key={dir}
              className="absolute inset-[22%]"
              animate={{ rotate: dir * 360 }}
              transition={{ duration: speed * 1.6, repeat, ease: "easeInOut" }}
            >
              <span
                className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
                style={{ width: size * 0.14, height: size * 0.14 }}
              />
            </motion.span>
          ))}
        </span>
      )}
    </span>
  )
}
