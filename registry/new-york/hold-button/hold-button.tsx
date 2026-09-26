"use client"

import { useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControlsWithThen,
} from "motion/react"
import { cn } from "@/lib/utils"

export interface HoldButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> {
  /** Seconds the button must be held to confirm. Default: 1.2 */
  holdDuration?: number
  /** Idle label. Default: "Hold to delete" */
  label?: string
  /** Label shown once confirmed. Default: "Deleted" */
  confirmedLabel?: string
  /** Color of the fill that sweeps across while holding. Default: "#ef4444" */
  fillColor?: string
  /** Return to idle this many ms after confirming (0 = stay confirmed). Default: 1800 */
  resetAfter?: number
  /** Called once the hold completes. */
  onConfirm?: () => void
}

const Check = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <motion.path
      d="M3 8.5 6.5 12 13 4.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
    />
  </svg>
)

export function HoldButton({
  holdDuration = 1.2,
  label = "Hold to delete",
  confirmedLabel = "Deleted",
  fillColor = "#ef4444",
  resetAfter = 1800,
  onConfirm,
  className,
  disabled,
  onPointerDown,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: HoldButtonProps) {
  const reduced = useReducedMotion()
  const [confirmed, setConfirmed] = useState(false)
  const progress = useMotionValue(0)
  const clipPath = useTransform(progress, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`)
  const controls = useRef<AnimationPlaybackControlsWithThen>(undefined)
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(
    () => () => {
      controls.current?.stop()
      clearTimeout(resetTimer.current)
    },
    []
  )

  const complete = () => {
    setConfirmed(true)
    onConfirm?.()
    if (resetAfter > 0) {
      resetTimer.current = setTimeout(() => {
        setConfirmed(false)
        controls.current = animate(progress, 0, { duration: reduced ? 0 : 0.4, ease: [0.4, 0, 0.2, 1] })
      }, resetAfter)
    }
  }

  const start = () => {
    if (confirmed || disabled) return
    controls.current?.stop()
    const remaining = holdDuration * (1 - progress.get())
    const hold = animate(progress, 1, { duration: remaining, ease: "linear" })
    controls.current = hold
    hold.then(() => {
      if (controls.current === hold && progress.get() >= 1) complete()
    })
  }

  const cancel = () => {
    if (confirmed || progress.get() >= 1) return
    controls.current?.stop()
    controls.current = reduced
      ? animate(progress, 0, { duration: 0 })
      : animate(progress, 0, { type: "spring", stiffness: 260, damping: 30 })
  }

  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      aria-live="polite"
      onPointerDown={(e) => {
        onPointerDown?.(e)
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        start()
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.key !== " " && e.key !== "Enter") return
        e.preventDefault()
        if (!e.repeat) start()
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e)
        if (e.key === " " || e.key === "Enter") cancel()
      }}
      onBlur={(e) => {
        onBlur?.(e)
        cancel()
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "relative inline-flex h-11 min-w-48 touch-none select-none items-center justify-center overflow-hidden rounded-full border bg-background px-6 text-sm font-medium text-foreground outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 origin-left"
        style={{ scaleX: progress, background: fillColor }}
      />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={confirmed ? "done" : "idle"}
          className="relative flex items-center gap-2"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
        >
          {confirmed ? (
            <span className="flex items-center gap-2 text-white">
              <Check />
              {confirmedLabel}
            </span>
          ) : (
            label
          )}
        </motion.span>
      </AnimatePresence>
      {/* white copy of the label, revealed by the fill so it stays legible */}
      {!confirmed && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-white"
          style={{ clipPath }}
        >
          {label}
        </motion.span>
      )}
    </button>
  )
}
