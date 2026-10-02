"use client"

import { useRef } from "react"
import type { ButtonHTMLAttributes } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "../hooks/use-reduced-motion"

gsap.registerPlugin(useGSAP)

export type FillDirection = "up" | "down" | "left" | "right"

export interface FillButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  direction?: FillDirection
  duration?: number
  ease?: string
}

const HIDDEN: Record<FillDirection, string> = {
  up: "inset(100% 0% 0% 0%)",
  down: "inset(0% 0% 100% 0%)",
  left: "inset(0% 0% 0% 100%)",
  right: "inset(0% 100% 0% 0%)",
}

const SHOWN = "inset(0% 0% 0% 0%)"

export function HoverButton({
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
  const rootRef = useRef<HTMLButtonElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)

  const reduced = useReducedMotion()

  // Plain function: tweens are short-lived and overwrite each other, so no GSAP context is needed
  const sweep = (clipPath: string) => {
    if (!fillRef.current) return
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
      ref={rootRef}
      type={type}
      className={`
        relative inline-flex items-center justify-center
        overflow-hidden rounded-full
        border border-foreground
        px-6 py-3
        text-sm font-medium
        text-foreground
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-foreground
        disabled:pointer-events-none
        disabled:opacity-50
        ${className}
      `}
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
      {/* Original content */}
      <span className="relative z-10">
        {children}
      </span>

      {/* Animated fill */}
      <span
        ref={fillRef}
        aria-hidden="true"
        className="
          absolute inset-0
          flex items-center justify-center
          bg-foreground
          text-background
        "
        style={{
          clipPath: HIDDEN[direction],
        }}
      >
        {children}
      </span>
    </button>
  )
}