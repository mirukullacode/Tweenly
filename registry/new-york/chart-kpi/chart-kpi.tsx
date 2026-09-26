"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { animate as animateValue, motion } from "motion/react"
import { cn } from "@/lib/utils"
import {
  CHART_ACCENT,
  ChartCard,
  ChartTooltip,
  chartTheme,
  createFormatter,
  linePath,
  toNumber,
  useChartReveal,
  type ChartBaseProps,
  type ChartCurve,
  type ChartDatum,
  type ChartTheme,
  type Point,
  type TooltipRow,
} from "@/registry/new-york/lib/chart-kit"

export interface ChartKpiProps extends ChartBaseProps {
  /** Rows of data, oldest first. */
  data: ChartDatum[]
  /** Key holding each row's label, e.g. "date". */
  index: string
  /** Key holding the metric. */
  valueKey: string
  /** Key holding the previous period, drawn as a dashed line and used for the delta. */
  compareKey?: string
  /** How rows combine into the headline figure. Default: "sum" */
  aggregate?: "sum" | "last" | "average"
  /** Change in percent. "auto" compares with compareKey, or first to last row. Default: "auto" */
  delta?: number | "auto"
  /** Target for the headline; shows a thin progress bar. */
  goal?: number
  /** Sparkline style. Default: "area" */
  sparkline?: "area" | "line" | "bars"
  /** Line interpolation. Default: "smooth" */
  curve?: ChartCurve
  /** Sparkline height in px. Default: 64 */
  sparkHeight?: number
  /** Scrub the sparkline to see each row. Default: true */
  showTooltip?: boolean
  /** Sparkline under the number, or beside it. Default: "stacked" */
  layout?: "stacked" | "inline"
  /** "semantic" paints rises green and falls red. Default: "accent" */
  trendColor?: "accent" | "semantic"
}

const UP = "#22c55e"
const DOWN = "#ef4444"
const EASE = [0.22, 1, 0.36, 1] as const

function combine(values: number[], mode: "sum" | "last" | "average") {
  if (!values.length) return 0
  if (mode === "last") return values[values.length - 1]
  const sum = values.reduce((a, b) => a + b, 0)
  return mode === "average" ? sum / values.length : sum
}

function useWidth() {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!node) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(node)
    return () => ro.disconnect()
  }, [node])
  return [setNode, width] as const
}

function useCountUp(
  target: number,
  format: (n: number) => string,
  { shown, still, duration, delay }: { shown: boolean; still: boolean; duration: number; delay: number }
) {
  const ref = useRef<HTMLSpanElement>(null)
  const current = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (still) {
      current.current = target
      el.textContent = format(target)
      return
    }
    el.textContent = format(current.current)
    if (!shown) return
    const controls = animateValue(current.current, target, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => {
        current.current = v
        el.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [target, format, shown, still, duration, delay])
  return ref
}

function TrendGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 11.5 6 7.5l2.5 2.5L14 4.5M10 4.5h4v4" />
    </svg>
  )
}

export function ChartKpi({
  data,
  index,
  valueKey,
  compareKey,
  aggregate = "sum",
  delta = "auto",
  goal,
  sparkline = "area",
  curve = "smooth",
  sparkHeight = 64,
  showTooltip = true,
  layout = "stacked",
  trendColor = "accent",
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
}: ChartKpiProps) {
  const theme = chartTheme(surface, accent)
  const { ref, shown, still } = useChartReveal(once, animate)
  const format = useMemo(() => createFormatter(valueFormat, { currency, decimals }), [valueFormat, currency, decimals])

  const values = data.map((d) => toNumber(d[valueKey]))
  const compare = compareKey ? data.map((d) => toNumber(d[compareKey])) : undefined
  const labels = data.map((d) => String(d[index] ?? ""))
  const headline = combine(values, aggregate)
  const previous = compare ? combine(compare, aggregate) : undefined

  let change: number
  if (typeof delta === "number") change = delta
  else if (previous !== undefined) change = previous ? ((headline - previous) / Math.abs(previous)) * 100 : 0
  else change = values.length > 1 && values[0] ? ((values[values.length - 1] - values[0]) / Math.abs(values[0])) * 100 : 0

  const up = change >= 0
  const base = palette?.[0] ?? accent
  const color = trendColor === "semantic" ? (up ? UP : DOWN) : base
  const pillColor = trendColor === "semantic" ? color : up ? base : theme.muted

  const countRef = useCountUp(headline, format, { shown, still, duration, delay })
  const [sparkRef, width] = useWidth()
  const reveal = (d: number) => (still ? { duration: 0 } : { duration, delay: delay + d, ease: EASE })
  const goalShare = goal ? Math.max(0, headline / goal) : 0

  const figure = (
    <div className="min-w-0">
      <span ref={countRef} className="block text-[2.6rem] font-semibold leading-none tracking-tight tabular-nums">
        {format(still ? headline : 0)}
      </span>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
        <motion.span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
          style={{ color: pillColor, background: `color-mix(in oklab, ${pillColor} 15%, transparent)` }}
          initial={still ? false : { opacity: 0, scale: 0.6, y: 4 }}
          animate={shown ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.6, y: 4 }}
          transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 22, delay: delay + duration * 0.55 }}
        >
          <svg viewBox="0 0 10 10" className={cn("size-2.5", !up && "rotate-180")} fill="currentColor">
            <path d="M5 1.5 9 7.5H1z" />
          </svg>
          {Math.abs(change).toFixed(1)}%
        </motion.span>
        {previous !== undefined && (
          <span style={{ color: theme.muted }}>
            vs <span className="tabular-nums">{format(previous)}</span> prior
          </span>
        )}
      </div>
    </div>
  )

  const spark = (
    <div className="min-w-0">
      <div ref={sparkRef} className="relative w-full" style={{ height: sparkHeight }}>
        {width > 0 && values.length > 0 && (
          <Sparkline
            values={values}
            compare={compare}
            labels={labels}
            valueLabel={valueKey}
            compareLabel={compareKey}
            width={width}
            height={sparkHeight}
            mode={sparkline}
            curve={curve}
            color={color}
            theme={theme}
            shown={shown}
            still={still}
            duration={duration}
            delay={delay}
            showTooltip={showTooltip}
            format={format}
          />
        )}
      </div>
      {layout === "stacked" && labels.length > 1 && (
        <div className="mt-2 flex justify-between text-[11px]" style={{ color: theme.muted }}>
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  )

  return (
    <ChartCard
      theme={theme}
      title={title}
      description={description}
      titleSize={titleSize}
      icon={icon === undefined ? <TrendGlyph /> : icon}
      radius={radius}
      bare={bare}
      className={className}
    >
      <div ref={ref}>
        {layout === "inline" ? (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-6">
            {figure}
            {spark}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {figure}
            {spark}
          </div>
        )}

        {goal ? (
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between text-[12px]" style={{ color: theme.muted }}>
              <span>
                <span className="font-medium tabular-nums" style={{ color: theme.fg }}>
                  {Math.round(goalShare * 100)}%
                </span>{" "}
                of goal
              </span>
              <span className="tabular-nums">{format(goal)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: theme.track }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={still ? false : { width: "0%" }}
                animate={{ width: shown ? `${Math.min(1, goalShare) * 100}%` : "0%" }}
                transition={reveal(0.1)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </ChartCard>
  )
}

function Sparkline({
  values,
  compare,
  labels,
  valueLabel,
  compareLabel,
  width: w,
  height: h,
  mode,
  curve,
  color,
  theme,
  shown,
  still,
  duration,
  delay,
  showTooltip,
  format,
}: {
  values: number[]
  compare?: number[]
  labels: string[]
  valueLabel: string
  compareLabel?: string
  width: number
  height: number
  mode: "area" | "line" | "bars"
  curve: ChartCurve
  color: string
  theme: ChartTheme
  shown: boolean
  still: boolean
  duration: number
  delay: number
  showTooltip: boolean
  format: (n: number) => string
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const [hover, setHover] = useState<number | null>(null)
  const n = values.length
  const all = compare ? values.concat(compare) : values
  const bars = mode === "bars"

  let lo = Math.min(...all)
  let hi = Math.max(...all)
  if (bars) lo = Math.min(0, lo)
  else {
    const span = hi - lo || Math.abs(hi) || 1
    lo -= span * 0.12
    hi += span * 0.08
  }
  if (hi === lo) hi = lo + 1

  const padX = bars ? 0 : 4
  const top = 5
  const slot = w / n
  const x = (i: number) => (bars ? slot * (i + 0.5) : n > 1 ? padX + (i / (n - 1)) * (w - padX * 2) : w / 2)
  const y = (v: number) => top + (1 - (v - lo) / (hi - lo)) * (h - top - (bars ? 0 : 2))
  const pts: Point[] = values.map((v, i) => [x(i), y(v)])
  const line = linePath(pts, curve)
  const area = `${line}L${pts[n - 1][0]},${h}L${pts[0][0]},${h}Z`
  const ghost = compare ? linePath(compare.map((v, i) => [x(i), y(v)] as Point), curve) : ""
  const t = (d: number) => (still ? { duration: 0 } : { duration: duration * 0.9, delay: delay + d, ease: EASE })

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left
    const i = bars ? Math.floor(px / slot) : Math.round(((px - padX) / Math.max(1, w - padX * 2)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const rows: TooltipRow[] = []
  if (hover !== null) {
    rows.push({ label: valueLabel, value: format(values[hover]), color })
    if (compare && compareLabel) rows.push({ label: compareLabel, value: format(compare[hover]), color: theme.muted, texture: "muted" })
  }

  return (
    <div
      className="absolute inset-0"
      onPointerMove={showTooltip ? onMove : undefined}
      onPointerLeave={showTooltip ? () => setHover(null) : undefined}
    >
      <svg width={w} height={h} className="block overflow-visible">
        <defs>
          <pattern id={`${id}-dots`} width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={color} />
          </pattern>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.05" />
          </linearGradient>
          <mask id={`${id}-mask`}>
            <rect width={w} height={h} fill={`url(#${id}-fade)`} />
          </mask>
          <clipPath id={`${id}-reveal`}>
            <motion.rect
              x={-8}
              y={-8}
              height={h + 16}
              initial={still ? false : { width: 0 }}
              animate={{ width: shown ? w + 16 : 0 }}
              transition={t(0)}
            />
          </clipPath>
        </defs>

        {bars ? (
          values.map((v, i) => {
            const bw = Math.max(2, slot * 0.62)
            const bx = x(i) - bw / 2
            const by = y(Math.max(v, lo))
            const bh = Math.max(1.5, y(lo) - by)
            const active = hover === null ? i === n - 1 : hover === i
            const stagger = (i / n) * duration * 0.5
            return (
              <g key={i}>
                {compare && (
                  <rect x={bx} y={y(Math.max(compare[i], lo))} width={bw} height={Math.max(1.5, y(lo) - y(Math.max(compare[i], lo)))} rx={Math.min(3, bw / 2)} fill={theme.subtle} opacity={0.45} />
                )}
                <motion.rect
                  x={bx}
                  width={bw}
                  rx={Math.min(3, bw / 2)}
                  fill={active ? color : `color-mix(in oklab, ${color} 42%, ${theme.track})`}
                  initial={still ? false : { y: h, height: 0 }}
                  animate={shown ? { y: by, height: bh } : { y: h, height: 0 }}
                  transition={still ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26, delay: delay + stagger }}
                />
              </g>
            )
          })
        ) : (
          <g clipPath={`url(#${id}-reveal)`}>
            {mode === "area" && (
              <g mask={`url(#${id}-mask)`}>
                <path d={area} fill={color} opacity={0.1} />
                <path d={area} fill={`url(#${id}-dots)`} opacity={0.85} />
              </g>
            )}
            {ghost && <path d={ghost} fill="none" stroke={theme.muted} strokeWidth={1.5} strokeDasharray="3 4" strokeLinecap="round" opacity={0.7} />}
            <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {!bars && hover !== null && (
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1={0} y2={h} stroke={theme.muted} strokeOpacity={0.4} strokeDasharray="2 3" />
        )}
        {!bars && (
          <motion.circle
            cx={pts[hover ?? n - 1][0]}
            cy={pts[hover ?? n - 1][1]}
            r={3.5}
            fill={color}
            stroke={theme.bg}
            strokeWidth={2}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={still ? false : { scale: 0 }}
            animate={{ scale: shown ? 1 : 0 }}
            transition={still ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 20, delay: hover === null ? delay + duration * 0.85 : 0 }}
          />
        )}
      </svg>
      {showTooltip && (
        <ChartTooltip
          open={hover !== null}
          x={hover === null ? 0 : pts[hover][0]}
          y={hover === null ? 0 : pts[hover][1]}
          width={w}
          title={hover === null ? undefined : labels[hover]}
          rows={rows}
          theme={theme}
        />
      )}
    </div>
  )
}
