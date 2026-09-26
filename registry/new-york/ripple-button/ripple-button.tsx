"use client"

import { useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

export interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  /** Ripple color (any CSS color). Default: "currentColor" */
  rippleColor?: string
  /** Seconds each ripple takes to expand and fade. Default: 0.6 */
  duration?: number
  /** Visual style. Default: "solid" */
  variant?: "solid" | "outline" | "ghost"
}

const variants = {
  solid: "bg-foreground text-background",
  outline: "border bg-background text-foreground hover:bg-accent",
  ghost: "text-foreground hover:bg-accent",
}

export function RippleButton({
  children,
  rippleColor = "currentColor",
  duration = 0.6,
  variant = "solid",
  className,
  type = "button",
  onPointerDown,
  onKeyDown,
  ...props
}: RippleButtonProps) {
  const reduced = useReducedMotion()
  const [ripples, setRipples] = useState<Ripple[]>([])
  const nextId = useRef(0)

  const spawn = (el: HTMLElement, clientX?: number, clientY?: number) => {
    const rect = el.getBoundingClientRect()
    const x = clientX === undefined ? rect.width / 2 : clientX - rect.left
    const y = clientY === undefined ? rect.height / 2 : clientY - rect.top
    // Radius that reaches the farthest corner from the press point
    const size = 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y))
    const id = nextId.current++
    setRipples((r) => [...r, { id, x, y, size }])
  }

  const remove = (id: number) => setRipples((r) => r.filter((ripple) => ripple.id !== id))

  return (
    <button
      type={type}
      {...props}
      onPointerDown={(e) => {
        onPointerDown?.(e)
        if (e.button === 0) spawn(e.currentTarget, e.clientX, e.clientY)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) spawn(e.currentTarget)
      }}
      className={cn(
        "relative isolate inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full px-6 text-sm font-medium outline-none transition-[transform,background-color] duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="absolute rounded-full"
            style={{
              left: r.x - r.size / 2,
              top: r.y - r.size / 2,
              width: r.size,
              height: r.size,
              background: rippleColor,
            }}
            initial={reduced ? { opacity: 0.2, scale: 1 } : { opacity: 0.3, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            transition={{
              scale: { duration, ease: [0.2, 0.7, 0.3, 1] },
              opacity: { duration: reduced ? 0.3 : duration * 1.1, ease: "easeOut" },
            }}
            onAnimationComplete={() => remove(r.id)}
          />
        ))}
    </span>
      {children}
    </button>
  )
}
