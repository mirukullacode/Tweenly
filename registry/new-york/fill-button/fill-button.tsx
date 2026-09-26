"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type FillDirection = "up" | "down" | "left" | "right"

export interface FillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Direction the fill sweeps toward. Default: "up" */
  direction?: FillDirection
  /** Sweep length in seconds. Default: 0.45 */
  duration?: number
  /** Any GSAP ease string, e.g. "power3.out", "elastic.out(1, 0.6)". Default: "power3.out" */
  ease?: string
}

// clip-path insets are: top right bottom left
const HIDDEN: Record<FillDirection, string> = {
  up: "inset(100% 0% 0% 0%)", // rises from the bottom edge
  down: "inset(0% 0% 100% 0%)", // drops from the top edge
  left: "inset(0% 0% 0% 100%)", // sweeps from the right edge
  right: "inset(0% 100% 0% 0%)", // sweeps from the left edge
}
const SHOWN = "inset(0% 0% 0% 0%)"

export function FillButton({
  children,
  direction = "up",
  duration = 0.45,
  ease = "power3.out",
  className = "",
  type = "button",
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: FillButtonProps) {
  const fillRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  // Kill any running sweep when the button unmounts
  useEffect(() => {
    const fill = fillRef.current
    return () => {
      gsap.killTweensOf(fill)
    }
  }, [])

  const sweep = (clipPath: string) => {
    gsap.to(fillRef.current, {
      clipPath,
      duration: reduced ? 0 : duration,
      ease,
      overwrite: true,
    })
  }

  return (
    <button
      {...props}
      type={type}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full border border-foreground px-6 py-3 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-50 ${className}`}
      onMouseEnter={(e) => {
        sweep(SHOWN)
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        sweep(HIDDEN[direction])
        onMouseLeave?.(e)
      }}
      onFocus={(e) => {
        sweep(SHOWN)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        sweep(HIDDEN[direction])
        onBlur?.(e)
      }}
    >
      <span>{children}</span>

      {/* Inverted copy, revealed by the clip-path animation */}
      <span
        ref={fillRef}
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-foreground text-background"
        style={{ clipPath: HIDDEN[direction] }}
      >
        {children}
      </span>
    </button>
  )
}