"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { AnimatePresence, animate as animateValue, motion } from "motion/react"
import {
  CHART_ACCENT,
  ChartCard,
  chartTheme,
  createFormatter,
  toNumber,
  useChartReveal,
  type ChartBaseProps,
  type ChartDatum,
} from "@/registry/new-york/lib/chart-kit"

export interface ChartHeatmapProps extends ChartBaseProps {
  /** Rows like { date: "2025-06-01", count: 4 }. Missing days count as zero. */
  data: ChartDatum[]
  /** Key holding an ISO date (YYYY-MM-DD) or a timestamp. Default: "date" */
  dateKey?: string
  /** Key holding the value for that day. Default: "count" */
  valueKey?: string
  /** Weeks shown, ending at the latest date. Default: 20 */
  weeks?: number
  /** Color steps, including the empty step. Default: 5 */
  levels?: number
  /** Cell size in px. Default: 12 */
  cellSize?: number
  /** Space between cells in px. Default: 3 */
  cellGap?: number
  /** Cell corner radius in px. Default: 3 */
  cellRadius?: number
  /** First day of the week: 0 = Sunday, 1 = Monday. Default: 0 */
  weekStart?: 0 | 1
  /** Show month names above the grid. Default: true */
  showMonthLabels?: boolean
  /** Show Mon / Wed / Fri beside the grid. Default: true */
  showDayLabels?: boolean
  /** Fill of days with no activity. Default: "hatch" */
  emptyTexture?: "solid" | "hatch"
  /** "quantile" spreads colors evenly across your data; "linear" scales to the busiest day. Default: "linear" */
  scale?: "linear" | "quantile"
  /** Show a tooltip on hover. Default: true */
  showTooltip?: boolean
  /** Show the Less / More key. Default: true */
  showLegend?: boolean
  /** Show the total for the range as the headline. Default: true */
  showTotal?: boolean
  /** Word used in the tooltip. Default: "contributions" */
  unit?: string
}

const DAY = 86_400_000
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function dayNumber(v: string | number | undefined) {
  if (typeof v === "number") return Math.floor(v / DAY)
  if (!v) return null
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v)
  const ms = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : Date.parse(v)
  return Number.isNaN(ms) ? null : Math.floor(ms / DAY)
}

const dow = (day: number) => (((day + 4) % 7) + 7) % 7

function dateLabel(day: number) {
  const d = new Date(day * DAY)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
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
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        current.current = v
        el.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [target, format, shown, still, duration, delay])
  return ref
}

function GridGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <rect x="2" y="2" width="5" height="5" rx="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" fillOpacity="0.4" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" fillOpacity="0.4" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" />
    </svg>
  )
}

interface Cell {
  day: number
  col: number
  row: number
  value: number
  level: number
}

export function ChartHeatmap({
  data,
  dateKey = "date",
  valueKey = "count",
  weeks = 20,
  levels = 5,
  cellSize = 12,
  cellGap = 3,
  cellRadius = 3,
  weekStart = 0,
  showMonthLabels = true,
  showDayLabels = true,
  emptyTexture = "hatch",
  scale = "linear",
  showTooltip = true,
  showLegend = true,
  showTotal = true,
  unit = "contributions",
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
}: ChartHeatmapProps) {
  const theme = chartTheme(surface, accent)
  const color = palette?.[0] ?? accent
  const { ref, shown, still } = useChartReveal(once, animate)
  const format = useMemo(() => createFormatter(valueFormat, { currency, decimals }), [valueFormat, currency, decimals])
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const [hover, setHover] = useState<{ cell: Cell; x: number; y: number } | null>(null)

  const cols = Math.max(1, Math.round(weeks))
  const steps = Math.max(2, Math.round(levels))

  const { cells, total, months } = useMemo(() => {
    const byDay = new Map<number, number>()
    let end = -Infinity
    for (const row of data) {
      const day = dayNumber(row[dateKey])
      if (day === null) continue
      byDay.set(day, (byDay.get(day) ?? 0) + toNumber(row[valueKey]))
      end = Math.max(end, day)
    }
    if (!Number.isFinite(end)) end = Math.floor(Date.UTC(2025, 0, 1) / DAY)
    const rowOf = (day: number) => (dow(day) - weekStart + 7) % 7
    const start = end - rowOf(end) - (cols - 1) * 7

    const list: Omit<Cell, "level">[] = []
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < 7; row++) {
        const day = start + col * 7 + row
        if (day > end) break
        list.push({ day, col, row, value: byDay.get(day) ?? 0 })
      }
    }

    const active = list.map((c) => c.value).filter((v) => v > 0).sort((a, b) => a - b)
    const max = active[active.length - 1] ?? 0
    const levelOf = (v: number) => {
      if (v <= 0 || !max) return 0
      if (steps === 2) return 1
      if (scale === "quantile") {
        let below = 0
        while (below < active.length && active[below] < v) below++
        return Math.min(steps - 1, 1 + Math.floor((below / active.length) * (steps - 1)))
      }
      return Math.max(1, Math.min(steps - 1, Math.ceil((v / max) * (steps - 1))))
    }

    const labels: { col: number; text: string }[] = []
    let last = -1
    for (let col = 0; col < cols; col++) {
      const month = new Date((start + col * 7) * DAY).getUTCMonth()
      if (month !== last) {
        if (col > 0 || new Date(start * DAY).getUTCDate() <= 7) labels.push({ col, text: MONTHS[month] })
        last = month
      }
    }
    const spaced = labels.filter((l, i) => {
      const next = labels[i + 1]
      return (!next || next.col - l.col >= 3) && l.col <= cols - 2
    })

    return {
      cells: list.map((c) => ({ ...c, level: levelOf(c.value) })),
      total: list.reduce((a, c) => a + c.value, 0),
      months: spaced,
    }
  }, [data, dateKey, valueKey, cols, steps, scale, weekStart])

  const countRef = useCountUp(total, format, { shown, still, duration, delay })

  const step = cellSize + cellGap
  const left = showDayLabels ? 30 : 0
  const topPad = showMonthLabels ? 18 : 0
  const gridW = cols * step - cellGap
  const gridH = 7 * step - cellGap
  const width = left + gridW
  const height = topPad + gridH

  const fillOf = (level: number) => {
    if (level === 0) return emptyTexture === "hatch" ? `url(#${id}-hatch)` : theme.track
    const share = steps === 2 ? 100 : Math.round(28 + (72 * (level - 1)) / (steps - 2))
    return share >= 100 ? color : `color-mix(in oklab, ${color} ${share}%, ${theme.track})`
  }
  const wave = (duration * 0.75) / (cols + 3)

  const onEnter = (cell: Cell, e: React.PointerEvent<SVGRectElement>) => {
    const box = ref.current?.getBoundingClientRect()
    const r = e.currentTarget.getBoundingClientRect()
    if (!box) return
    const x = r.left + r.width / 2 - box.left
    setHover({ cell, x: Math.max(96, Math.min(box.width - 96, x)), y: r.top - box.top })
  }

  const dayRows = [1, 3, 5].map((d) => ({ row: (d - weekStart + 7) % 7, text: DAY_NAMES[d] }))

  return (
    <ChartCard
      theme={theme}
      title={title}
      description={description}
      titleSize={titleSize}
      value={
        showTotal && !bare ? (
          <span ref={countRef}>{format(still ? total : 0)}</span>
        ) : undefined
      }
      icon={icon === undefined ? <GridGlyph /> : icon}
      radius={radius}
      bare={bare}
      className={className}
    >
      <div ref={ref} className="relative">
        <div className="-m-1.5 overflow-x-auto p-1.5 [scrollbar-width:none]">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block overflow-visible"
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <pattern id={`${id}-hatch`} width="3.5" height="3.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="3.5" height="3.5" fill={theme.track} />
                <line x1="0" y1="0" x2="0" y2="3.5" stroke={theme.subtle} strokeWidth="1.2" />
              </pattern>
            </defs>

            {showMonthLabels &&
              months.map((m) => (
                <text key={m.col} x={left + m.col * step} y={10} fontSize={10.5} fill={theme.muted}>
                  {m.text}
                </text>
              ))}
            {showDayLabels &&
              dayRows.map((d) => (
                <text key={d.text} x={0} y={topPad + d.row * step + cellSize / 2} dominantBaseline="central" fontSize={10.5} fill={theme.muted}>
                  {d.text}
                </text>
              ))}

            {cells.map((c) => (
              <motion.rect
                key={c.day}
                x={left + c.col * step}
                y={topPad + c.row * step}
                width={cellSize}
                height={cellSize}
                rx={Math.min(cellRadius, cellSize / 2)}
                fill={fillOf(c.level)}
                stroke={hover?.cell.day === c.day ? theme.fg : "none"}
                strokeWidth={1.5}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                initial={still ? false : { opacity: 0, scale: 0.3 }}
                animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
                whileHover={still ? undefined : { scale: 1.3, transition: { type: "spring", stiffness: 600, damping: 22 } }}
                transition={
                  still
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 380, damping: 24, delay: delay + (c.col + c.row * 0.6) * wave }
                }
                onPointerEnter={showTooltip ? (e) => onEnter(c, e) : undefined}
              />
            ))}
          </svg>
        </div>

        {showLegend && (
          <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px]" style={{ color: theme.muted }}>
            <span className="mr-0.5">Less</span>
            {Array.from({ length: steps }, (_, level) => (
              <svg key={level} width={cellSize} height={cellSize} className="block">
                <rect width={cellSize} height={cellSize} rx={Math.min(cellRadius, cellSize / 2)} fill={fillOf(level)} />
              </svg>
            ))}
            <span className="ml-0.5">More</span>
          </div>
        )}

        <AnimatePresence>
          {showTooltip && hover && (
            <motion.div
              key="tip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, left: hover.x, top: hover.y }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ type: "spring", stiffness: 520, damping: 38, opacity: { duration: 0.12 } }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[12px] shadow-xl"
              style={{ background: theme.tooltipBg, borderColor: theme.border, color: theme.muted }}
            >
              <span className="font-semibold tabular-nums" style={{ color: theme.fg }}>
                {hover.cell.value ? format(hover.cell.value) : "No"} {unit}
              </span>{" "}
              on {dateLabel(hover.cell.day)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ChartCard>
  )
}
