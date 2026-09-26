"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { animate as animateValue, motion, useMotionValue, useMotionValueEvent } from "motion/react"
import {
  ChartCard,
  ChartLegend,
  ChartPattern,
  ChartTooltip,
  chartTheme,
  createFormatter,
  linePath,
  niceTicks,
  resolveSeries,
  toNumber,
  useChartReveal,
  type ChartBaseProps,
  type ChartCurve,
  type ChartDatum,
  type ChartSeries,
  type Point,
  type ValueFormat,
} from "@/registry/new-york/lib/chart-kit"

export interface ChartLineProps extends ChartBaseProps {
  /** Rows of data, e.g. `{ month: "Jan", revenue: 18600 }`. */
  data: ChartDatum[]
  /** Key in each row used for the x-axis labels. */
  index: string
  /** Numeric keys to plot, one line each. */
  series: ChartSeries[]
  /** Line interpolation. Default: "smooth" */
  curve?: ChartCurve
  /** Area under each line. Default: "dots" */
  fill?: "none" | "gradient" | "dots" | "hatch"
  /** Line thickness in px. Default: 2.5 */
  strokeWidth?: number
  /** Horizontal grid lines at each y tick. Default: true */
  showGrid?: boolean
  /** Index labels under the plot. Default: true */
  showXAxis?: boolean
  /** Value labels left of the plot. Default: true */
  showYAxis?: boolean
  /** Approximate number of y-axis ticks. Default: 4 */
  yTicks?: number
  /** Lower bound of the y domain. Default: 0, or a nice minimum for negative data */
  yMin?: number
  /** Upper bound of the y domain. Default: a nice maximum above the data */
  yMax?: number
  /** Which data points get a marker. "last" pulses at the end of the first series. Default: "last" */
  showPoints?: "none" | "hover" | "all" | "last"
  /** Crosshair and tooltip on hover / arrow keys. Default: true */
  showTooltip?: boolean
  /** Toggleable legend. Default: true when there is more than one series */
  showLegend?: boolean
  /** Plot height in px, excluding the x-axis. Default: 220 */
  height?: number
  /** Show every nth x label. Default: auto, based on the available width */
  xLabelEvery?: number
  /** Headline figure from the first series. Default: "last" */
  total?: "sum" | "last" | "none"
  /** Change pill next to the headline, in percent. "auto" compares the first and last value of the first series. Default: "auto" */
  delta?: number | "auto"
}

const EASE = [0.65, 0, 0.35, 1] as const
const r2 = (v: number) => Math.round(v * 100) / 100

export function ChartLine({
  data,
  index,
  series,
  curve = "smooth",
  fill = "dots",
  strokeWidth = 2.5,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  yTicks = 4,
  yMin,
  yMax,
  showPoints = "last",
  showTooltip = true,
  showLegend,
  height = 220,
  xLabelEvery,
  total = "last",
  delta = "auto",
  title,
  description,
  titleSize,
  surface = "dark",
  accent,
  palette,
  icon,
  radius,
  bare,
  animate: animated = true,
  duration = 1.2,
  delay = 0,
  once = true,
  valueFormat = "number",
  currency = "USD",
  decimals,
  className,
}: ChartLineProps) {
  const theme = chartTheme(surface, accent)
  const resolved = resolveSeries(series, theme, palette)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const { ref, shown, still } = useChartReveal(once, animated)
  const width = useWidth(ref)
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<number | null>(null)

  const fmt = useMemo(() => createFormatter(valueFormat, { currency, decimals }), [valueFormat, currency, decimals])
  const axisFmt = useMemo(() => axisFormatter(valueFormat, currency, decimals), [valueFormat, currency, decimals])

  const n = data.length
  const visible = resolved.filter((s) => !hidden.has(s.key))
  const values = visible.flatMap((s) => data.map((d) => toNumber(d[s.key])))
  const dataMin = values.length ? Math.min(...values) : 0
  const dataMax = values.length ? Math.max(...values) : 1
  const ticks = niceTicks(yMin ?? Math.min(0, dataMin), yMax ?? Math.max(0, dataMax), yTicks)
  const lo = yMin ?? ticks[0]
  const hi = Math.max(yMax ?? ticks[ticks.length - 1], lo + 1e-9)
  const tickValues = ticks.filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9)

  const padT = 10
  const padR = 12
  const padL = showYAxis ? Math.max(...tickValues.map((t) => axisFmt(t).length), 1) * 6.4 + 14 : 6
  const svgH = height + (showXAxis ? 26 : 0)
  const plotW = Math.max(width - padL - padR, 1)
  const xAt = (i: number) => r2(n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW)
  const yAt = (v: number) => r2(padT + (1 - (v - lo) / (hi - lo)) * (height - padT))
  const baseY = yAt(Math.min(Math.max(0, lo), hi))

  const paths = resolved.map((s, si) => {
    const off = hidden.has(s.key)
    const pts: Point[] = data.map((d, i) => [xAt(i), off ? baseY : yAt(toNumber(d[s.key]))])
    const line = linePath(pts, curve)
    const area = pts.length ? `${line}L${pts[pts.length - 1][0]},${baseY}L${pts[0][0]},${baseY}Z` : ""
    return { s, si, off, pts, line, area }
  })

  const labelW = Math.max(...data.map((d) => String(d[index] ?? "").length), 1) * 6.6 + 14
  const every = xLabelEvery ?? Math.max(1, Math.ceil((n * labelW) / Math.max(plotW, 1)))

  const firstVals = series[0] ? data.map((d) => toNumber(d[series[0].key])) : []
  const first = firstVals[0] ?? 0
  const last = firstVals[firstVals.length - 1] ?? 0
  const headline =
    total === "none" || !firstVals.length ? undefined : total === "sum" ? firstVals.reduce((a, b) => a + b, 0) : last
  const deltaValue =
    delta === "auto" ? (firstVals.length > 1 && first !== 0 ? ((last - first) / Math.abs(first)) * 100 : undefined) : delta

  const legend = showLegend ?? series.length > 1
  const tracking = n > 0 && (showTooltip || showPoints === "hover")
  const activeIdx = active !== null && active < n ? active : null
  const marker = paths.find((p) => !p.off)

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!tracking) return
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    setActive(n <= 1 ? 0 : Math.min(n - 1, Math.max(0, Math.round(((x - padL) / plotW) * (n - 1)))))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!tracking) return
    const moves: Record<string, (a: number | null) => number | null> = {
      ArrowRight: (a) => (a === null ? 0 : Math.min(n - 1, a + 1)),
      ArrowLeft: (a) => (a === null ? n - 1 : Math.max(0, a - 1)),
      Home: () => 0,
      End: () => n - 1,
      Escape: () => null,
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    setActive(move)
  }

  const t = (d: number, extra: object = {}) => (still ? { duration: 0 } : { duration: d, ease: EASE, ...extra })
  const morph = still ? { duration: 0 } : { type: "spring" as const, duration: 0.7, bounce: 0.1 }
  const drawEnd = delay + duration + Math.max(visible.length - 1, 0) * 0.15

  const activeYs = activeIdx === null ? [] : paths.filter((p) => !p.off).map((p) => p.pts[activeIdx][1])
  const tooltipY = Math.min(Math.max(activeYs.length ? Math.min(...activeYs) : height / 2, 36), height - 36)

  return (
    <ChartCard
      theme={theme}
      title={title}
      description={description}
      titleSize={titleSize}
      value={
        headline === undefined ? undefined : (
          <Ticker value={headline} format={fmt} shown={shown} still={still} delay={delay} duration={duration} />
        )
      }
      delta={headline === undefined ? undefined : deltaValue}
      icon={icon === undefined ? <TrendGlyph /> : icon}
      radius={radius}
      bare={bare}
      className={className}
    >
      <div
        ref={ref}
        tabIndex={tracking ? 0 : undefined}
        role="group"
        aria-label={title ? `${title} chart` : "Line chart"}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className="relative w-full touch-pan-y select-none rounded-md outline-offset-4 focus-visible:outline-2"
        style={{ height: svgH, outlineColor: theme.accent }}
      >
        {width > 0 && n > 0 && (
          <svg
            width={width}
            height={svgH}
            className="block overflow-visible"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActive(null)}
          >
            <defs>
              <clipPath id={`${uid}-reveal`}>
                <motion.rect
                  x={0}
                  y={-20}
                  height={svgH + 40}
                  initial={still ? false : { width: 0 }}
                  animate={{ width: shown ? width + 20 : 0 }}
                  transition={t(duration * 1.1, { delay })}
                />
              </clipPath>
              <linearGradient id={`${uid}-fade`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={padT} y2={baseY}>
                <stop offset="0" stopColor="#fff" stopOpacity="1" />
                <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
              </linearGradient>
              <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x={0} y={-20} width={width} height={svgH + 40}>
                <rect x={0} y={0} width={width} height={svgH} fill={`url(#${uid}-fade)`} />
              </mask>
              {resolved.map((s, si) => (
                <SeriesFill key={s.key} id={`${uid}-f${si}`} fill={fill} color={s.color} theme={theme} top={padT} bottom={baseY} />
              ))}
            </defs>

            {showGrid &&
              tickValues.map((v) => (
                <motion.line
                  key={v}
                  x1={padL}
                  x2={width - padR + 4}
                  stroke={v === 0 && lo < 0 ? theme.subtle : theme.grid}
                  strokeDasharray={v === 0 && lo < 0 ? undefined : "3 4"}
                  initial={still ? false : { opacity: 0, y1: yAt(v), y2: yAt(v) }}
                  animate={{ opacity: shown ? 1 : 0, y1: yAt(v), y2: yAt(v) }}
                  transition={{ ...morph, opacity: t(0.5, { delay }) }}
                />
              ))}

            {showYAxis &&
              tickValues.map((v) => (
                <motion.text
                  key={v}
                  x={padL - 10}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill={theme.muted}
                  className="tabular-nums"
                  initial={still ? false : { opacity: 0, y: yAt(v) }}
                  animate={{ opacity: shown ? 1 : 0, y: yAt(v) }}
                  transition={{ ...morph, opacity: t(0.5, { delay: delay + 0.1 }) }}
                >
                  {axisFmt(v)}
                </motion.text>
              ))}

            {showXAxis &&
              data.map((d, i) =>
                i % every === 0 ? (
                  <motion.text
                    key={i}
                    x={xAt(i)}
                    y={height + 19}
                    textAnchor="middle"
                    fontSize={11}
                    fill={activeIdx === i ? theme.fg : theme.muted}
                    initial={still ? false : { opacity: 0 }}
                    animate={{ opacity: shown ? 1 : 0 }}
                    transition={t(0.4, { delay: delay + (i / Math.max(n - 1, 1)) * duration * 0.6 })}
                  >
                    {String(d[index] ?? "")}
                  </motion.text>
                ) : null
              )}

            {fill !== "none" && (
              <g clipPath={`url(#${uid}-reveal)`} mask={fill === "gradient" ? undefined : `url(#${uid}-mask)`}>
                {paths.map((p) => (
                  <motion.path
                    key={p.s.key}
                    fill={`url(#${uid}-f${p.si})`}
                    initial={still ? false : { d: p.area, opacity: 0 }}
                    animate={{ d: p.area, opacity: p.off ? 0 : p.si === 0 ? 1 : 0.55 }}
                    transition={{ d: morph, opacity: t(0.4, { delay: shown && p.off ? 0 : delay }) }}
                  />
                ))}
              </g>
            )}

            {paths.map((p) => (
              <motion.path
                key={p.s.key}
                fill="none"
                stroke={p.s.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={still ? false : { d: p.line, pathLength: 0, opacity: 0 }}
                animate={{ d: p.line, pathLength: shown ? 1 : 0, opacity: shown && !p.off ? 1 : 0 }}
                transition={{
                  d: morph,
                  pathLength: t(duration, { delay: delay + p.si * 0.15 }),
                  opacity: t(0.25, { delay: shown && !p.off ? delay + p.si * 0.15 : 0 }),
                }}
              />
            ))}

            {showPoints === "all" &&
              paths.map((p) =>
                p.pts.map(([x, y], i) => (
                  <motion.circle
                    key={`${p.s.key}-${i}`}
                    r={3.5}
                    fill={theme.bg}
                    stroke={p.s.color}
                    strokeWidth={2}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    initial={still ? false : { cx: x, cy: y, scale: 0 }}
                    animate={{ cx: x, cy: y, scale: shown && !p.off ? 1 : 0 }}
                    transition={{
                      cx: morph,
                      cy: morph,
                      scale: still
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 500, damping: 18, delay: shown && !p.off ? delay + p.si * 0.15 + (i / Math.max(n - 1, 1)) * duration : 0 },
                    }}
                  />
                ))
              )}

            {tracking && (
              <motion.g
                pointerEvents="none"
                initial={false}
                animate={{ opacity: activeIdx === null ? 0 : 1, x: activeIdx === null ? 0 : xAt(activeIdx) }}
                transition={{ opacity: { duration: 0.15 }, x: still ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 45 } }}
              >
                <line x1={0} x2={0} y1={padT - 4} y2={height} stroke={theme.fg} strokeOpacity={0.25} strokeDasharray="3 3" />
              </motion.g>
            )}

            {showPoints === "last" && marker && (
              <motion.g
                pointerEvents="none"
                initial={still ? false : { x: marker.pts[n - 1][0], y: marker.pts[n - 1][1], scale: 0 }}
                animate={{ x: marker.pts[n - 1][0], y: marker.pts[n - 1][1], scale: shown ? 1 : 0 }}
                transition={{
                  x: morph,
                  y: morph,
                  scale: still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 16, delay: shown ? delay + duration * 0.95 : 0 },
                }}
              >
                {!still && (
                  <motion.circle
                    r={7}
                    fill={marker.s.color}
                    animate={{ scale: [1, 2.4], opacity: [0.35, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: drawEnd }}
                    style={{ opacity: 0 }}
                  />
                )}
                <circle r={7.5} fill={theme.bg} />
                <circle r={4.5} fill={marker.s.color} />
              </motion.g>
            )}

            {tracking &&
              paths.map((p) => {
                const on = activeIdx !== null && !p.off
                const [x, y] = activeIdx === null ? [0, 0] : p.pts[activeIdx]
                return (
                  <motion.circle
                    key={p.s.key}
                    r={5}
                    fill={p.s.color}
                    stroke={theme.bg}
                    strokeWidth={2.5}
                    pointerEvents="none"
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    initial={false}
                    animate={on ? { cx: x, cy: y, scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
                    transition={still ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 45, opacity: { duration: 0.12 } }}
                  />
                )
              })}
          </svg>
        )}

        <ChartTooltip
          open={showTooltip && activeIdx !== null && visible.length > 0}
          x={activeIdx === null ? 0 : xAt(activeIdx)}
          y={tooltipY}
          width={width}
          title={activeIdx === null ? undefined : String(data[activeIdx]?.[index] ?? "")}
          rows={
            activeIdx === null
              ? []
              : visible.map((s) => ({ label: s.label, value: fmt(toNumber(data[activeIdx]?.[s.key])), color: s.color }))
          }
          theme={theme}
        />
      </div>

      {legend && (
        <div className="mt-4">
          <ChartLegend series={resolved.map((s) => ({ ...s, texture: "solid" }))} theme={theme} hidden={hidden} onToggle={toggle} />
        </div>
      )}
    </ChartCard>
  )
}

function SeriesFill({ id, fill, color, theme, top, bottom }: {
  id: string
  fill: NonNullable<ChartLineProps["fill"]>
  color: string
  theme: ReturnType<typeof chartTheme>
  top: number
  bottom: number
}) {
  if (fill === "gradient") {
    return (
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={top} y2={bottom}>
        <stop offset="0" stopColor={color} stopOpacity="0.32" />
        <stop offset="1" stopColor={color} stopOpacity="0" />
      </linearGradient>
    )
  }
  if (fill === "hatch") return <ChartPattern id={id} color={color} texture="hatch" theme={theme} />
  return (
    <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse">
      <circle cx="1.25" cy="1.25" r="1.1" fill={color} />
      <circle cx="3.75" cy="3.75" r="1.1" fill={color} />
    </pattern>
  )
}

function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

function axisFormatter(format: ValueFormat, currency: string, decimals?: number) {
  if (typeof format === "function") return format
  if (format === "currency") {
    const intl = new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 })
    return (v: number) => intl.format(v)
  }
  return createFormatter(format === "percent" ? "percent" : "compact", { decimals })
}

function Ticker({ value, format, shown, still, delay, duration }: {
  value: number
  format: (v: number) => string
  shown: boolean
  still: boolean
  delay: number
  duration: number
}) {
  const mv = useMotionValue(still ? value : 0)
  const [display, setDisplay] = useState(still ? value : 0)
  useMotionValueEvent(mv, "change", setDisplay)
  useEffect(() => {
    if (!shown) return
    if (still) {
      mv.set(value)
      return
    }
    const controls = animateValue(mv, value, { duration, delay, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [mv, value, shown, still, delay, duration])
  return <span>{format(display)}</span>
}

function TrendGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 11.5 6 7.5l3 3 5-6" />
    </svg>
  )
}
