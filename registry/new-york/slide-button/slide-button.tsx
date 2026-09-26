"use client"

import { useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react"
import { cn } from "@/lib/utils"

export interface SlideButtonProps {
  /** Text shown on the track. Default: "Slide to confirm" */
  label?: string
  /** Text shown once completed. Default: "Confirmed" */
  completeLabel?: string
  /** Fraction of the track the knob must pass to complete, 0 to 1. Default: 0.9 */
  threshold?: number
  /** Track width in px. Default: 280 */
  width?: number
  /** Color of the knob and the trailing fill. Default: "var(--foreground)" */
  accentColor?: string
  /** Return to the start this many ms after completing (0 = stay complete). Default: 2000 */
  resetAfter?: number
  /** Called when the knob reaches the end. */
  onComplete?: () => void
  /** Disable interaction. Default: false */
  disabled?: boolean
  className?: string
}

const KNOB = 44
const PAD = 4

const Check = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <motion.path
      d="M3 8.5 6.5 12 13 4.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
    />
  </svg>
)

const Chevrons = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="m4 4 4 4-4 4M9 4l4 4-4 4" />
  </svg>
)

export function SlideButton({
  label = "Slide to confirm",
  completeLabel = "Confirmed",
  threshold = 0.9,
  width = 280,
  accentColor = "var(--foreground)",
  resetAfter = 2000,
  onComplete,
  disabled = false,
  className,
}: SlideButtonProps) {
  const reduced = useReducedMotion()
  const [done, setDone] = useState(false)
  const [percent, setPercent] = useState(0)
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const max = Math.max(width - KNOB - PAD * 2, 1)
  const x = useMotionValue(0)
  const fill = useTransform(x, (v) => v + KNOB + PAD * 2)
  const labelOpacity = useTransform(x, [0, max * 0.6], [1, 0])
  const labelX = useTransform(x, [0, max], [0, 24])

  useMotionValueEvent(x, "change", (v) => setPercent(Math.round((v / max) * 100)))
  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36 }

  const complete = () => {
    setDone(true)
    animate(x, max, spring)
    onComplete?.()
    if (resetAfter > 0) {
      resetTimer.current = setTimeout(() => {
        setDone(false)
        animate(x, 0, spring)
      }, resetAfter)
    }
  }

  const settle = () => {
    if (x.get() >= max * threshold) complete()
    else animate(x, 0, spring)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (done || disabled) return
    const step = max * 0.1
    let target: number | null = null
    if (e.key === "ArrowRight" || e.key === "ArrowUp") target = Math.min(x.get() + step, max)
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") target = Math.max(x.get() - step, 0)
    else if (e.key === "Home") target = 0
    else if (e.key === "End" || e.key === "Enter") target = max
    if (target === null) return
    e.preventDefault()
    if (target >= max * threshold) complete()
    else animate(x, target, spring)
  }

  return (
    <div
      className={cn(
        "relative flex h-[52px] select-none items-center overflow-hidden rounded-full border bg-muted",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      style={{ width, padding: PAD }}
    >
      {/* trailing fill */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 rounded-full opacity-15"
        style={{ width: fill, background: accentColor }}
      />

      <AnimatePresence mode="popLayout" initial={false}>
        {done ? (
          <motion.span
            key="done"
            className="pointer-events-none absolute inset-0 flex items-center justify-center pr-12 text-sm font-medium text-foreground"
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {completeLabel}
          </motion.span>
        ) : (
          <motion.span
            key="label"
            className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-sm font-medium"
            style={{ opacity: labelOpacity, x: labelX }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--muted-foreground) 0%, var(--muted-foreground) 40%, var(--foreground) 50%, var(--muted-foreground) 60%, var(--muted-foreground) 100%)",
                backgroundSize: "250% 100%",
              }}
              initial={{ backgroundPosition: "100% 0" }}
              animate={reduced ? undefined : { backgroundPosition: "-50% 0" }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            >
              {label}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>

      <motion.div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={done ? completeLabel : `${percent}%`}
        aria-disabled={disabled || undefined}
        drag={done || disabled ? false : "x"}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragEnd={settle}
        onKeyDown={onKeyDown}
        whileTap={done ? undefined : { scale: 0.94 }}
        className="relative z-10 grid cursor-grab touch-none place-items-center rounded-full text-background shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted active:cursor-grabbing"
        style={{ x, width: KNOB, height: KNOB, background: accentColor }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={done ? "check" : "arrow"}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {done ? <Check /> : <Chevrons />}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
