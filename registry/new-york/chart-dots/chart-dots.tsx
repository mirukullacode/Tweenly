"use client"

import { useEffect, useMemo, useRef } from "react"
import { animate as animateValue, motion } from "motion/react"
import {
  CHART_ACCENT,
  ChartCard,
  chartTheme,
  createFormatter,
  useChartReveal,
  type ChartBaseProps,
} from "@/registry/new-york/lib/chart-kit"

export interface ChartDotsProps extends ChartBaseProps {
  /** Filled amount, e.g. 41 seats. */
  value: number
  /** Amount that fills every dot, e.g. 50 seats. Default: 100 */
  total?: number
  /** Dots per row. Default: 6 */
  columns?: number
  /** Number of rows. Default: 4 */
  rows?: number
  /** Show a fractional share as a partly filled dot. Default: true */
  partial?: boolean
  /** Text under the headline figure. Default: "Pattern Hero" */
  caption?: string
  /** Headline as a percentage, the raw value, or "value/total". Default: "percent" */
  display?: "percent" | "value" | "fraction"
  /** Dot shape. Default: "circle" */
  shape?: "circle" | "square" | "rounded"
  /** Fill of empty dots. Default: "hatch" */
  emptyTexture?: "hatch" | "track"
  /** Order in which dots fill. Default: "row" */
  order?: "row" | "column" | "spiral"
  /** Space between dots in px. Default: 10 */
  gap?: number
}

const RADIUS = { circle: "50%", square: "3px", rounded: "28%" }

function fillOrder(cols: number, rows: number, order: "row" | "column" | "spiral") {
  const cells: [number, number][] = []
  if (order === "row") {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r])
  } else if (order === "column") {
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) cells.push([c, r])
  } else {
    let top = 0
    let bottom = rows - 1
    let left = 0
    let right = cols - 1
    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) cells.push([c, top])
      for (let r = top + 1; r <= bottom; r++) cells.push([right, r])
      if (top < bottom) for (let c = right - 1; c >= left; c--) cells.push([c, bottom])
      if (left < right) for (let r = bottom - 1; r > top; r--) cells.push([left, r])
      top++
      bottom--
      left++
      right--
    }
  }
  const rank = new Array<number>(cols * rows)
  cells.forEach(([c, r], i) => (rank[r * cols + c] = i))
  return rank
}

function DotsGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <circle cx="5" cy="5" r="1.8" />
      <circle cx="11" cy="5" r="1.8" />
      <circle cx="5" cy="11" r="1.8" />
      <circle cx="11" cy="11" r="1.8" fillOpacity="0.35" />
    </svg>
  )
}

export function ChartDots({
  value,
  total = 100,
  columns = 6,
  rows = 4,
  partial = true,
  caption = "Pattern Hero",
  display = "percent",
  shape = "circle",
  emptyTexture = "hatch",
  order = "row",
  gap = 10,
  title,
  description,
  titleSize,
  surface = "dark",
  accent = CHART_ACCENT,
  palette,
  icon,
  radius,
  bare,
  animate = true,
  duration = 1.2,
  delay = 0,
  once = true,
  valueFormat = "number",
  currency,
  decimals,
  className,
}: ChartDotsProps) {
  const theme = chartTheme(surface, accent)
  const color = palette?.[0] ?? accent
  const { ref, shown, still } = useChartReveal(once, animate)
  const format = useMemo(() => createFormatter(valueFormat, { currency, decimals }), [valueFormat, currency, decimals])

  const cols = Math.max(1, Math.round(columns))
  const rowCount = Math.max(1, Math.round(rows))
  const count = cols * rowCount
  const whole = total > 0 ? total : 1
  const share = Math.max(0, Math.min(1, value / whole))
  const exact = share * count
  const full = partial ? Math.floor(exact + 1e-9) : Math.round(exact)
  const frac = partial ? exact - full : 0
  const rank = useMemo(() => fillOrder(cols, rowCount, order), [cols, rowCount, order])

  const text = useMemo(() => {
    const pct = new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals ?? 0 })
    return (v: number) =>
      display === "value"
        ? format(v)
        : display === "fraction"
          ? `${format(v)}/${format(whole)}`
          : `${pct.format((v / whole) * 100)}%`
  }, [display, format, whole, decimals])

  const countRef = useRef<HTMLSpanElement>(null)
  const current = useRef(0)
  useEffect(() => {
    const el = countRef.current
    if (!el) return
    if (still) {
      current.current = value
      el.textContent = text(value)
      return
    }
    el.textContent = text(current.current)
    if (!shown) return
    const controls = animateValue(current.current, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        current.current = v
        el.textContent = text(v)
      },
    })
    return () => controls.stop()
  }, [value, text, shown, still, duration, delay])

  const hasHeader = !!(title || description)
  const badge = icon === undefined ? <DotsGlyph /> : icon
  const step = (duration * 0.7) / Math.max(1, count)
  const empty =
    emptyTexture === "hatch"
      ? `repeating-linear-gradient(-45deg, ${theme.subtle} 0 1.5px, ${theme.track} 1.5px 5px)`
      : theme.track

  return (
    <ChartCard
      theme={theme}
      title={title}
      description={description}
      titleSize={titleSize}
      icon={hasHeader ? badge : null}
      radius={radius}
      bare={bare}
      className={className}
    >
      <div ref={ref} className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span ref={countRef} className="block text-[3.5rem] font-bold leading-[0.85] tracking-tighter tabular-nums">
              {text(still ? value : 0)}
            </span>
            {caption && (
              <span className="mt-2 block text-sm font-medium tracking-tight" style={{ color: theme.muted }}>
                {caption}
              </span>
            )}
          </div>
          {!hasHeader && !bare && badge !== null && (
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full border"
              style={{ borderColor: theme.border, background: theme.surface === "dark" ? "#111" : "#f6f6f6" }}
            >
              {badge}
            </span>
          )}
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}
          role="img"
          aria-label={`${text(value)}${caption ? ` ${caption}` : ""}`}
        >
          {Array.from({ length: count }, (_, i) => {
            const r = rank[i]
            const on = r < full
            const part = !on && r === full ? frac : 0
            return (
              <motion.div
                key={i}
                className="relative aspect-square overflow-hidden"
                style={{
                  borderRadius: RADIUS[shape],
                  background: on ? color : empty,
                  boxShadow: on ? undefined : `inset 0 0 0 1px ${theme.subtle}`,
                }}
                initial={still ? false : { scale: 0, opacity: 0 }}
                animate={shown ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 18, delay: delay + r * step }}
              >
                {part > 0 && (
                  <motion.div
                    className="absolute inset-y-0 left-0"
                    style={{ background: color }}
                    initial={still ? false : { width: "0%" }}
                    animate={{ width: shown ? `${part * 100}%` : "0%" }}
                    transition={still ? { duration: 0 } : { duration: 0.5, delay: delay + (r + 2) * step, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </ChartCard>
  )
}
