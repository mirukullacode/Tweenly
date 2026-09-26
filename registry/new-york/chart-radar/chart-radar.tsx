"use client"

import { useEffect, useId, useRef, useState } from "react"
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react"
import {
  ChartCard,
  ChartLegend,
  ChartPattern,
  ChartTooltip,
  chartTheme,
  createFormatter,
  polar,
  resolveSeries,
  textureFill,
  toNumber,
  useChartReveal,
  type ChartBaseProps,
  type ChartDatum,
  type ChartSeries,
  type ChartTheme,
  type Point,
  type ResolvedSeries,
} from "@/registry/new-york/lib/chart-kit"

export interface ChartRadarProps extends ChartBaseProps {
  /** Rows to plot, one axis per row. */
  data: ChartDatum[]
  /** Key holding each axis label, e.g. "metric". */
  index: string
  /** Series drawn as polygons, e.g. [{ key: "team" }, { key: "benchmark" }]. */
  series: ChartSeries[]
  /** Value at the outer ring. Default: a nice number above the largest value */
  max?: number
  /** Number of grid rings. Default: 4 */
  levels?: number
  /** Shape of the grid rings. Default: "polygon" */
  gridShape?: "polygon" | "circle"
  /** Opacity of solid polygon fills; textured fills scale with it. Default: 0.25 */
  fillOpacity?: number
  /** Draw a dot at every value. Default: true */
  showPoints?: boolean
  /** Show axis labels around the chart. Default: true */
  showAxisLabels?: boolean
  /** Show the value of each ring on the top axis. Default: false */
  showLevelLabels?: boolean
  /** Hovering an axis highlights it and lists every series' value. Default: true */
  showTooltip?: boolean
  /** Show a legend; click an item to toggle its series. Default: true */
  showLegend?: boolean
  /** Chart height in px; labels get extra room on the sides. Default: 260 */
  size?: number
  /** Polygon edges: straight or a closed smooth curve. Default: "linear" */
  curve?: "linear" | "smooth"
}

function niceMax(value: number, levels: number) {
  if (value <= 0) return levels
  const raw = value / levels
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw * 1.0001) ?? raw
  return step * levels
}

function closedPath(pts: Point[], curve: "linear" | "smooth") {
  if (pts.length < 2) return ""
  if (curve === "linear" || pts.length < 3) return `${pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join("")}Z`
  const n = pts.length
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`
  }
  return `${d}Z`
}

function RadarGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
      <path d="M8 2l5.7 4.1-2.2 6.6h-7L2.3 6.1z" />
      <path d="M8 5.5l2.6 2-1 3H6.4l-1-3z" />
    </svg>
  )
}

export function ChartRadar({
  data,
  index,
  series,
  max,
  levels = 4,
  gridShape = "polygon",
  fillOpacity = 0.25,
  showPoints = true,
  showAxisLabels = true,
  showLevelLabels = false,
  showTooltip = true,
  showLegend = true,
  size = 260,
  curve = "linear",
  title,
  description,
  titleSize,
  surface = "dark",
  accent,
  palette,
  icon,
  radius,
  bare,
  animate: animateProp = true,
  duration = 1.2,
  delay = 0,
  once = true,
  valueFormat = "number",
  currency,
  decimals,
  className,
}: ChartRadarProps) {
  const theme = chartTheme(surface, accent)
  const fmt = createFormatter(valueFormat, { currency, decimals })
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const { ref, shown, still } = useChartReveal(once, animateProp)
  const boxRef = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<number | null>(null)
  const [tip, setTip] = useState({ x: 0, y: 0, w: 1 })

  const resolved = resolveSeries(series, theme, palette)
  const n = data.length
  const lv = Math.max(1, Math.round(levels))
  const dataMax = Math.max(0, ...data.flatMap((row) => resolved.map((s) => toNumber(row[s.key]))))
  const top = max && max > 0 ? max : niceMax(dataMax, lv)
  const labelRoom = showAxisLabels ? 22 : 6
  const R = Math.max(20, size / 2 - labelRoom)
  const sideRoom = showAxisLabels ? 44 : 6
  const vw = size + sideRoom * 2
  const angleOf = (i: number) => (i * 360) / Math.max(n, 1)
  const reveal = still ? 0 : 1

  const ring = (r: number) =>
    gridShape === "circle" || n < 3
      ? `M0,${-r}A${r},${r} 0 1 1 0,${r}A${r},${r} 0 1 1 0,${-r}Z`
      : closedPath(
          data.map((_, i) => polar(0, 0, r, angleOf(i))),
          "linear"
        )

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else if (next.size < resolved.length - 1) next.add(key)
      return next
    })

  const track = (e: React.PointerEvent) => {
    const box = boxRef.current?.getBoundingClientRect()
    if (box) setTip({ x: e.clientX - box.left, y: e.clientY - box.top, w: box.width })
  }

  const activeRow = active !== null ? data[active] : undefined
  const gridT = (i: number) => ({
    duration: still ? 0 : duration * 0.55,
    delay: still ? 0 : delay + i * 0.06,
    ease: [0.65, 0, 0.35, 1] as const,
  })

  return (
    <ChartCard
      theme={theme}
      title={title}
      description={description}
      titleSize={titleSize}
      icon={icon === undefined ? <RadarGlyph /> : icon}
      radius={radius}
      bare={bare}
      className={className}
    >
      <div ref={ref} className="flex w-full flex-col items-center gap-5">
        <div ref={boxRef} className="relative flex w-full justify-center">
          <svg
            viewBox={`${-vw / 2} ${-size / 2} ${vw} ${size}`}
            width={vw}
            className="h-auto max-w-full overflow-visible"
            role="img"
            aria-label={title ?? "Radar chart"}
            onPointerLeave={() => setActive(null)}
          >
            <defs>
              {resolved.map((s) => (
                <ChartPattern key={s.key} id={`${uid}-${s.key}`} color={s.color} texture={s.texture} theme={theme} />
              ))}
            </defs>

            {Array.from({ length: lv }, (_, k) => (
              <motion.path
                key={`${gridShape}-${k}`}
                d={ring((R * (k + 1)) / lv)}
                fill="none"
                stroke={theme.grid}
                strokeWidth={1}
                initial={reveal ? { pathLength: 0, opacity: 0 } : false}
                animate={shown ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={gridT(k)}
              />
            ))}
            {data.map((_, i) => {
              const [x, y] = polar(0, 0, R, angleOf(i))
              const on = active === i
              return (
                <motion.line
                  key={`spoke-${i}`}
                  x1={0}
                  y1={0}
                  x2={x}
                  y2={y}
                  stroke={on ? theme.muted : theme.grid}
                  strokeWidth={1}
                  initial={reveal ? { pathLength: 0 } : false}
                  animate={{ pathLength: shown ? 1 : 0 }}
                  transition={gridT(i * 0.5)}
                />
              )
            })}
            {showLevelLabels &&
              Array.from({ length: lv }, (_, k) => (
                <motion.text
                  key={`lvl-${k}`}
                  x={4}
                  y={-(R * (k + 1)) / lv + 3}
                  fontSize={9}
                  fill={theme.muted}
                  initial={reveal ? { opacity: 0 } : false}
                  animate={{ opacity: shown ? 0.8 : 0 }}
                  transition={{ duration: 0.4, delay: still ? 0 : delay + duration * 0.4 }}
                  className="pointer-events-none select-none"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {fmt(((k + 1) * top) / lv)}
                </motion.text>
              ))}

            {resolved.map((s, si) => (
              <SeriesShape
                key={s.key}
                s={s}
                si={si}
                points={data.map((row, i) =>
                  polar(0, 0, (Math.min(Math.max(toNumber(row[s.key]), 0), top * 1.08) / top) * R, angleOf(i))
                )}
                fill={textureFill(`${uid}-${s.key}`, s.texture, s.color)}
                theme={theme}
                fillOpacity={s.texture === "solid" ? fillOpacity : Math.min(1, fillOpacity * 3.2)}
                curve={curve}
                hidden={hidden.has(s.key)}
                shown={shown}
                still={still}
                duration={duration}
                delay={delay}
                showPoints={showPoints}
                active={active}
              />
            ))}

            {showAxisLabels &&
              data.map((row, i) => {
                const a = angleOf(i)
                const [x, y] = polar(0, 0, R + 12, a)
                const sin = Math.sin((a * Math.PI) / 180)
                const cos = Math.cos((a * Math.PI) / 180)
                const on = active === i
                return (
                  <motion.text
                    key={`label-${i}`}
                    x={x}
                    y={y + (cos < -0.3 ? 8 : cos > 0.3 ? -2 : 3.5)}
                    textAnchor={sin > 0.2 ? "start" : sin < -0.2 ? "end" : "middle"}
                    fontSize={11.5}
                    fontWeight={on ? 600 : 500}
                    fill={on ? theme.fg : theme.muted}
                    initial={reveal ? { opacity: 0 } : false}
                    animate={{ opacity: shown ? 1 : 0 }}
                    transition={{ duration: 0.4, delay: still ? 0 : delay + duration * 0.3 + i * 0.03 }}
                    className="pointer-events-none select-none"
                  >
                    {String(row[index] ?? "")}
                  </motion.text>
                )
              })}

            {n > 0 &&
              data.map((_, i) => {
                const half = 180 / n
                const a = angleOf(i)
                const [x0, y0] = polar(0, 0, R + 24, a - half)
                const [x1, y1] = polar(0, 0, R + 24, a + half)
                const large = n < 2 ? 1 : 0
                const d =
                  n < 2
                    ? `M0,${-(R + 24)}A${R + 24},${R + 24} 0 1 1 0,${R + 24}A${R + 24},${R + 24} 0 1 1 0,${-(R + 24)}Z`
                    : `M0,0L${x0},${y0}A${R + 24},${R + 24} 0 ${large} 1 ${x1},${y1}Z`
                return (
                  <path
                    key={`hit-${i}`}
                    d={d}
                    fill="transparent"
                    onPointerEnter={() => setActive(i)}
                    onPointerMove={track}
                  />
                )
              })}
          </svg>
          <ChartTooltip
            open={showTooltip && !!activeRow}
            x={tip.x}
            y={tip.y}
            width={tip.w}
            theme={theme}
            title={activeRow ? String(activeRow[index] ?? "") : undefined}
            rows={
              activeRow
                ? resolved
                    .filter((s) => !hidden.has(s.key))
                    .map((s) => ({ label: s.label, value: fmt(toNumber(activeRow[s.key])), color: s.color, texture: s.texture }))
                : []
            }
          />
        </div>
        {showLegend && (
          <motion.div
            initial={reveal ? { opacity: 0 } : false}
            animate={{ opacity: shown ? 1 : 0 }}
            transition={{ duration: 0.4, delay: still ? 0 : delay + duration * 0.5 }}
          >
            <ChartLegend series={resolved} theme={theme} hidden={hidden} onToggle={toggle} patternPrefix={uid} align="center" />
          </motion.div>
        )}
      </div>
    </ChartCard>
  )
}

function SeriesShape({
  s,
  si,
  points,
  fill,
  theme,
  fillOpacity,
  curve,
  hidden,
  shown,
  still,
  duration,
  delay,
  showPoints,
  active,
}: {
  s: ResolvedSeries
  si: number
  points: Point[]
  fill: string
  theme: ChartTheme
  fillOpacity: number
  curve: "linear" | "smooth"
  hidden: boolean
  shown: boolean
  still: boolean
  duration: number
  delay: number
  showPoints: boolean
  active: number | null
}) {
  const grow = useMotionValue(still && !hidden ? 1 : 0)
  const played = useRef(false)

  useEffect(() => {
    const target = hidden ? 0 : 1
    if (still) {
      grow.set(target)
      return
    }
    if (!shown) {
      grow.set(0)
      played.current = false
      return
    }
    const wait = played.current ? 0 : delay + duration * 0.35 + si * 0.15
    played.current = true
    const c = animate(grow, target, { type: "spring", stiffness: 140, damping: 15, mass: 0.9, delay: wait })
    return () => c.stop()
  }, [grow, hidden, shown, still, duration, delay, si])

  const d = useTransform(grow, (k) => (k < 0.002 ? "" : closedPath(points.map(([x, y]) => [x * k, y * k] as Point), curve)))
  const stroke = s.texture === "muted" ? theme.muted : s.color

  return (
    <g className="pointer-events-none">
      <motion.path
        d={d}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeDasharray={s.texture === "dots" ? "3 3" : undefined}
      />
      {showPoints &&
        points.map((p, i) => (
          <RadarPoint
            key={i}
            p={p}
            grow={grow}
            color={stroke}
            solid={s.texture === "solid"}
            theme={theme}
            on={!hidden && (shown || still)}
            hot={active === i}
            wait={still ? 0 : delay + duration * 0.35 + si * 0.15 + 0.25 + i * 0.03}
          />
        ))}
    </g>
  )
}

function RadarPoint({
  p,
  grow,
  color,
  solid,
  theme,
  on,
  hot,
  wait,
}: {
  p: Point
  grow: MotionValue<number>
  color: string
  solid: boolean
  theme: ChartTheme
  on: boolean
  hot: boolean
  wait: number
}) {
  const cx = useTransform(grow, (k) => p[0] * k)
  const cy = useTransform(grow, (k) => p[1] * k)

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      fill={solid ? color : theme.bg}
      stroke={color}
      strokeWidth={solid ? 0 : 1.5}
      initial={{ r: 0 }}
      animate={{ r: on ? 3 : 0, scale: hot ? 1.5 : 1 }}
      transition={{
        r: { type: "spring", stiffness: 520, damping: 18, delay: on ? wait : 0 },
        scale: { type: "spring", stiffness: 520, damping: 26 },
      }}
    />
  )
}
