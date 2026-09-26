"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface NumberStepperProps {
  /** Controlled value. */
  value?: number
  /** Initial value when uncontrolled. Default: min */
  defaultValue?: number
  /** Called with the new value on every change. */
  onValueChange?: (value: number) => void
  /** Lowest allowed value. Default: 0 */
  min?: number
  /** Highest allowed value. Default: 99 */
  max?: number
  /** Amount added or removed per step. Default: 1 */
  step?: number
  /** Text shown before the value, e.g. "$". */
  prefix?: string
  /** Text shown after the value, e.g. "kg". */
  suffix?: string
  /** Control size. Default: "md" */
  size?: "sm" | "md" | "lg"
  /** Accessible label for the value. Default: "Quantity" */
  "aria-label"?: string
  className?: string
}

const sizes = {
  sm: { root: "h-9 gap-1 p-1 text-sm", button: "size-7", value: "min-w-10" },
  md: { root: "h-11 gap-1.5 p-1 text-base", button: "size-9", value: "min-w-12" },
  lg: { root: "h-14 gap-2 p-1.5 text-xl", button: "size-11", value: "min-w-16" },
}

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length

const Minus = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M3.5 8h9" />
  </svg>
)

const Plus = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M3.5 8h9M8 3.5v9" />
  </svg>
)

export function NumberStepper({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  prefix,
  suffix,
  size = "md",
  "aria-label": ariaLabel = "Quantity",
  className,
}: NumberStepperProps) {
  const reduced = useReducedMotion()
  const [internal, setInternal] = useState(defaultValue ?? min)
  const current = value ?? internal
  const [prev, setPrev] = useState(current)
  const [dir, setDir] = useState(1)
  if (current !== prev) {
    setPrev(current)
    setDir(current > prev ? 1 : -1)
  }

  const [scope, animate] = useAnimate<HTMLDivElement>()
  const valueRef = useRef(current)
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    valueRef.current = current
  }, [current])

  useEffect(() => () => clearTimeout(holdTimer.current), [])

  const places = Math.max(decimals(step), decimals(min))

  const shake = () => {
    if (reduced || !scope.current) return
    animate(scope.current, { x: [0, -5, 5, -3, 3, 0] }, { duration: 0.35 })
  }

  const change = (delta: number) => {
    const raw = valueRef.current + delta * step
    const next = Number(Math.min(max, Math.max(min, raw)).toFixed(places))
    if (next === valueRef.current) {
      shake()
      return false
    }
    valueRef.current = next
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
    return true
  }

  const stopHold = () => clearTimeout(holdTimer.current)

  const startHold = (e: React.PointerEvent, delta: number) => {
    if (e.button !== 0) return
    stopHold()
    if (!change(delta)) return
    const repeat = (delay: number) => {
      holdTimer.current = setTimeout(() => {
        if (change(delta)) repeat(Math.max(40, delay * 0.85))
      }, delay)
    }
    repeat(400)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, () => void> = {
      ArrowUp: () => change(1),
      ArrowRight: () => change(1),
      ArrowDown: () => change(-1),
      ArrowLeft: () => change(-1),
      PageUp: () => change(10),
      PageDown: () => change(-10),
      Home: () => change((min - valueRef.current) / step),
      End: () => change((max - valueRef.current) / step),
    }
    if (!map[e.key]) return
    e.preventDefault()
    map[e.key]()
  }

  const text = Math.abs(current).toFixed(places)
  const chars = text.split("")
  const s = sizes[size]

  const button = (delta: number, label: string, icon: React.ReactNode, disabled: boolean) => (
    <motion.button
      type="button"
      aria-label={label}
      aria-disabled={disabled}
      onPointerDown={(e) => startHold(e, delta)}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      onClick={(e) => {
        if (e.detail === 0) change(delta)
      }}
      whileTap={reduced ? undefined : { scale: 0.82 }}
      transition={{ type: "spring", stiffness: 600, damping: 15 }}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-border transition-opacity hover:bg-accent dark:bg-accent dark:hover:bg-accent/70",
        s.button,
        disabled && "opacity-40"
      )}
    >
      {icon}
    </motion.button>
  )

  return (
    <div
      ref={scope}
      className={cn("inline-flex select-none items-center rounded-full border bg-muted", s.root, className)}
    >
      {button(-1, "Decrease", <Minus />, current <= min)}
      <div
        role="spinbutton"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${prefix ?? ""}${current}${suffix ?? ""}`}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-full items-center justify-center rounded-full px-1 font-semibold tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
          s.value
        )}
      >
        {prefix && <span className="mr-0.5 text-muted-foreground">{prefix}</span>}
        {current < 0 && <span>-</span>}
        {chars.map((char, i) => {
          const position = chars.length - i
          return (
            <span key={position} className="relative inline-flex h-[1.25em] overflow-hidden leading-[1.25em]">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.span
                  key={char}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ y: reduced ? 0 : d > 0 ? "100%" : "-100%", opacity: 0 }),
                    center: { y: "0%", opacity: 1 },
                    exit: (d: number) => ({ y: reduced ? 0 : d > 0 ? "-100%" : "100%", opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              </AnimatePresence>
            </span>
          )
        })}
        {suffix && <span className="ml-1 text-[0.8em] font-medium text-muted-foreground">{suffix}</span>}
      </div>
      {button(1, "Increase", <Plus />, current >= max)}
    </div>
  )
}
