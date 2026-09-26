"use client"

import { useEffect, useRef } from "react"
import { animate, useInView, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface NumberTickerProps {
  /** Final value. */
  value: number
  /** Starting value. Default: 0 */
  from?: number
  /** Animation length in seconds. Default: 2 */
  duration?: number
  /** Delay before counting starts, in seconds. Default: 0 */
  delay?: number
  /** Number of decimal places. Default: 0 */
  decimals?: number
  /** Text rendered before the number. Default: "" */
  prefix?: string
  /** Text rendered after the number. Default: "" */
  suffix?: string
  /** Group thousands using the locale separator. Default: true */
  separator?: boolean
  /** Count only the first time it enters view. Default: true */
  once?: boolean
  className?: string
}

export function NumberTicker({
  value,
  from = 0,
  duration = 2,
  delay = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = true,
  once = true,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once, amount: 0.5 })
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const format = (n: number) =>
      prefix +
      n.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: separator,
      }) +
      suffix

    if (!inView) {
      el.textContent = format(from)
      return
    }
    if (reduced) {
      el.textContent = format(value)
      return
    }

    const controls = animate(from, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (n) => (el.textContent = format(n)),
    })
    return () => controls.stop()
  }, [inView, reduced, value, from, duration, delay, decimals, prefix, suffix, separator])

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)}>
      {prefix + from.toFixed(decimals) + suffix}
    </span>
  )
}
