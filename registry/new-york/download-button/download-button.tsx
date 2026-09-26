"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { cn } from "@/lib/utils"

type State = "idle" | "loading" | "done"

export interface DownloadButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> {
  /** File to download. Triggered once the animation completes. */
  href?: string
  /** Suggested file name for `href`. */
  fileName?: string
  /** Run your own download. The progress bar waits for the promise. */
  onDownload?: () => Promise<unknown> | void
  /** Controlled progress, 0 to 100. When set, the bar follows it instead of simulating. */
  progress?: number
  /** Length of the simulated progress, in seconds. Default: 2 */
  duration?: number
  /** Return to idle this many ms after finishing (0 = stay done). Default: 2200 */
  resetAfter?: number
  /** Idle label. Default: "Download" */
  label?: string
  /** Finished label. Default: "Downloaded" */
  doneLabel?: string
  /** Show the percentage while loading. Default: true */
  showPercent?: boolean
  /** Progress fill color (any CSS color). Default: 25% of the background color */
  fillColor?: string
}

const Arrow = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
  </svg>
)

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

export function DownloadButton({
  href,
  fileName,
  onDownload,
  progress,
  duration = 2,
  resetAfter = 2200,
  label = "Download",
  doneLabel = "Downloaded",
  showPercent = true,
  fillColor = "color-mix(in oklab, var(--background) 25%, transparent)",
  className,
  disabled,
  ...props
}: DownloadButtonProps) {
  const reduced = useReducedMotion()
  const [state, setState] = useState<State>("idle")
  const value = useMotionValue(0)
  const width = useTransform(value, (v) => `${v}%`)
  const percent = useTransform(value, (v) => `${Math.round(v)}%`)
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const finish = () => {
    setState("done")
    if (href) {
      const a = document.createElement("a")
      a.href = href
      a.download = fileName ?? ""
      a.click()
    }
    if (resetAfter > 0) {
      resetTimer.current = setTimeout(() => {
        setState("idle")
        value.set(0)
      }, resetAfter)
    }
  }

  // Controlled mode: follow the `progress` prop
  useEffect(() => {
    if (progress === undefined || state !== "loading") return
    const controls = animate(value, Math.min(Math.max(progress, 0), 100), { duration: 0.3 })
    if (progress >= 100) controls.then(() => finish())
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, state])

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const start = async () => {
    if (state !== "idle") return
    setState("loading")
    value.set(0)
    if (progress !== undefined) return // parent drives progress

    const task = Promise.resolve(onDownload?.())
    // Simulated bar eases toward 90% until the task settles, then completes
    const sim = animate(value, 90, { duration: reduced ? 0 : duration, ease: [0.3, 0.8, 0.4, 1] })
    await Promise.all([task, sim.then(() => undefined)]).catch(() => undefined)
    await animate(value, 100, { duration: reduced ? 0 : 0.25 })
    finish()
  }

  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      onClick={start}
      aria-live="polite"
      className={cn(
        "relative inline-flex h-11 min-w-44 items-center justify-center overflow-hidden rounded-full bg-foreground px-5 text-sm font-medium text-background transition-[transform,opacity] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {/* progress fill */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-0 left-0"
        style={{ width, opacity: state === "idle" ? 0 : 1, background: fillColor }}
      />
      <span className="relative flex items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={state}
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
          >
            {state === "idle" && (
              <>
                <Arrow />
                {label}
              </>
            )}
            {state === "loading" && (
              <>
                <motion.span
                  className="size-4 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                {showPercent ? <motion.span className="tabular-nums">{percent}</motion.span> : "Downloading"}
              </>
            )}
            {state === "done" && (
              <>
                <Check />
                {doneLabel}
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  )
}
