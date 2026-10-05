"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { animate as animateValue, motion, useMotionValue, useTransform, type MotionValue } from "motion/react"
import { cn } from "@/lib/utils"
import {
  CHART_ACCENT,
  ChartCard,
  ChartLegend,
  ChartPattern,
  chartTheme,
  createFormatter,
  resolveSeries,
  textureFill,
  useChartReveal,
  type ChartBaseProps,
  type ResolvedSeries,
} from "@/registry/new-york/lib/chart-kit"

export interface ChartProgressSegment {
  label: string
  value: number
}

export interface ChartProgressProps extends ChartBaseProps {
  /** Current amount, in the same unit as max. Ignored when segments are given. */
  value: number
  /** Amount that fills the bar. Default: 100 */
  max?: number
  /** Marker for a goal or quota, in the same unit as value. */
  target?: number
  /** Label of the target marker. Default: "Target" */
  targetLabel?: string
  /** Caption above the bar. Default: "Progress" */
  label?: string
  /** Show the share of max as a big percentage. Default: true */
  showPercent?: boolean
  /** Split the fill into stacked parts; their sum becomes the value. */
  segments?: ChartProgressSegment[]
  /** Bar thickness in px. Default: 40 */
  thickness?: number
  /** Bar length in px when vertical. Default: 220 */
  length?: number
  /** Look of the fill. Default: "wave" */
  texture?: "wave" | "solid" | "grain"
  /** Look of the unfilled part. Default: "hatch" */
  remainder?: "hatch" | "track" | "none"
  /** Show the thermometer marker at the end of the fill. Default: true */
  showMarker?: boolean
  /** Bar direction. Default: "horizontal" */
  orientation?: "horizontal" | "vertical"
}

const EASE = [0.22, 1, 0.36, 1] as const
const PAD_START = 12
const PAD_END = 18

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

function wave(length: number, y: number, amp: number) {
  let d = `M -48 ${y}`
  for (let x = -48; x < length + 48; x += 24) d += ` q 6 ${-amp} 12 0 t 12 0`
  return d
}

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  )
}

export function ChartProgress({
  value,
  max = 100,
  target,
  targetLabel = "Target",
  label = "Progress",
  showPercent = true,
  segments,
  thickness = 40,
  length = 220,
  texture = "wave",
  remainder = "hatch",
  showMarker = true,
  orientation = "horizontal",
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
  duration = 1.4,
  delay = 0,
  once = true,
  valueFormat = "number",
  currency,
  decimals,
  className,
}: ChartProgressProps) {
  const theme = chartTheme(surface, accent)
  const { ref, shown, still } = useChartReveal(once, animate)
  const format = useMemo(() => createFormatter(valueFormat, { currency, decimals }), [valueFormat, currency, decimals])
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const vertical = orientation === "vertical"

  const parts = segments?.length ? segments : undefined
  const total = parts ? parts.reduce((a, s) => a + Math.max(0, s.value), 0) : value
  const cap = max > 0 ? max : 1
  const amount = Math.max(0, Math.min(total, cap))
  const series = parts
    ? resolveSeries(parts.map((s, i) => ({ key: `s${i}`, label: s.label })), theme, palette)
    : []

  const progress = useMotionValue(still ? amount : 0)
  const valueRef = useRef<HTMLSpanElement>(null)
  const percentRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const write = (v: number) => {
      const shownValue = (v / Math.max(amount, 1e-9)) * total
      if (valueRef.current) valueRef.current.textContent = format(amount === total ? v : shownValue)
      if (percentRef.current) percentRef.current.textContent = `${Math.round((v / cap) * 100)}%`
    }
    const unsubscribe = progress.on("change", write)
    if (still) {
      progress.set(amount)
      write(amount)
      return unsubscribe
    }
    write(progress.get())
    if (!shown) return unsubscribe
    const controls = animateValue(progress, amount, { duration, delay, ease: EASE })
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [progress, amount, total, cap, format, shown, still, duration, delay])

  const [measureRef, measured] = useWidth()
  const L = vertical ? length : measured
  const T = thickness
  const cross = PAD_START + T + PAD_END
  const svgW = vertical ? cross : L
  const svgH = vertical ? L : cross
  const initial = still ? amount : 0

  const head = (
    <div className={cn("flex gap-3", vertical ? "flex-col" : "items-end justify-between")}>
      <div className="min-w-0">
        <p className="text-[13px] font-medium" style={{ color: theme.muted }}>
          {label}
        </p>
        <p className="mt-1 text-[13px] tabular-nums" style={{ color: theme.muted }}>
          {showPercent && (
            <span ref={valueRef} className="font-semibold" style={{ color: theme.fg }}>
              {format(initial)}
            </span>
          )}{" "}
          of {format(max)}
        </p>
      </div>
      <span
        ref={showPercent ? percentRef : valueRef}
        className="text-[2.1rem] font-bold leading-[0.9] tracking-tight tabular-nums"
      >
        {showPercent ? `${Math.round((initial / cap) * 100)}%` : format(initial)}
      </span>
    </div>
  )

  const bar = L > 0 && (
    <BarSvg
      id={id}
      L={L}
      T={T}
      width={svgW}
      height={svgH}
      vertical={vertical}
      progress={progress}
      cap={cap}
      target={target}
      parts={parts}
      series={series}
      texture={texture}
      remainder={remainder}
      showMarker={showMarker}
      theme={theme}
      color={palette?.[0] ?? accent}
      still={still}
    />
  )

  const targetPos = target !== undefined ? Math.max(0, Math.min(1, target / cap)) : null
  const targetTag =
    targetPos !== null && L > 0 ? (
      <span
        className="pointer-events-none absolute whitespace-nowrap text-[11px] tabular-nums"
        style={{
          color: theme.muted,
          ...(vertical
            ? { left: svgW + 6, top: L - targetPos * L, transform: "translateY(-50%)" }
            : {
                top: 0,
                left: Math.max(0, Math.min(L, targetPos * L)),
                transform: `translateX(${targetPos > 0.85 ? "-100%" : targetPos < 0.15 ? "0" : "-50%"})`,
              }),
        }}
      >
        {targetLabel} <span style={{ color: theme.fg }}>{format(target!)}</span>
      </span>
    ) : null

  return (
    <ChartCard
      theme={theme}
      title={title}
      description={description}
      titleSize={titleSize}
      icon={icon === undefined ? <ArrowGlyph /> : icon}
      radius={radius}
      bare={bare}
      className={className}
    >
      <div ref={ref} className={cn("flex", vertical ? "items-end gap-6" : "flex-col gap-2")}>
        {vertical ? (
          <>
            <div className="relative shrink-0" style={{ width: svgW + (targetTag ? 64 : 0), height: L }}>
              {bar}
              {targetTag}
            </div>
            <div className="min-w-0 pb-1">{head}</div>
          </>
        ) : (
          <>
            {head}
            <div ref={measureRef} className="relative w-full" style={{ paddingTop: targetTag ? 16 : 0 }}>
              {targetTag}
              {bar}
            </div>
          </>
        )}
      </div>
      {parts && (
        <div className="mt-4">
          <ChartLegend series={series} theme={theme} patternPrefix={id} />
        </div>
      )}
    </ChartCard>
  )
}

function BarSvg({
  id,
  L,
  T,
  width,
  height,
  vertical,
  progress,
  cap,
  target,
  parts,
  series,
  texture,
  remainder,
  showMarker,
  theme,
  color,
  still,
}: {
  id: string
  L: number
  T: number
  width: number
  height: number
  vertical: boolean
  progress: MotionValue<number>
  cap: number
  target?: number
  parts?: ChartProgressSegment[]
  series: ResolvedSeries[]
  texture: "wave" | "solid" | "grain"
  remainder: "hatch" | "track" | "none"
  showMarker: boolean
  theme: ReturnType<typeof chartTheme>
  color: string
  still: boolean
}) {
  const fillLen = useTransform(progress, (v) => Math.max(0, (v / cap) * L))
  const markerX = useTransform(fillLen, (x) => Math.min(L - 2, Math.max(2, x + 5)))
  const markerOpacity = useTransform(fillLen, [0, 6], [0, 1])
  const y0 = PAD_START
  const r = T / 2
  const pos = (v: number) => Math.max(0, Math.min(L, (v / cap) * L))
  const starts = (parts ?? []).map((_, i, all) => all.slice(0, i).reduce((a, s) => a + Math.max(0, s.value), 0))

  return (
    <svg width={width} height={height} className="block overflow-visible">
      <defs>
        <pattern id={`${id}-rest`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill={theme.track} />
          <line x1="0" y1="0" x2="0" y2="6" stroke={theme.subtle} strokeWidth="2" />
        </pattern>
        <pattern id={`${id}-grain`} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#fff" fillOpacity="0.3" />
          <circle cx="3" cy="3" r="0.6" fill="#000" fillOpacity="0.16" />
        </pattern>
        <clipPath id={`${id}-fill`}>
          <motion.rect x="0" y={y0} height={T} rx={r} width={fillLen} />
        </clipPath>
        {series.map((s) => (
          <ChartPattern key={s.key} id={`${id}-${s.key}`} color={s.color} texture={s.texture} theme={theme} />
        ))}
      </defs>

      <g transform={vertical ? `translate(0 ${L}) rotate(-90)` : undefined}>
        {remainder !== "none" && (
          <rect x="0" y={y0} width={L} height={T} rx={r} fill={remainder === "hatch" ? `url(#${id}-rest)` : theme.track} />
        )}

        <g clipPath={`url(#${id}-fill)`}>
          {parts ? (
            <g>
              {parts.map((s, i) => (
                <SegmentRect
                  key={i}
                  fillLen={fillLen}
                  start={pos(starts[i])}
                  end={pos(starts[i] + Math.max(0, s.value))}
                  y={y0}
                  T={T}
                  fill={textureFill(`${id}-${series[i].key}`, series[i].texture, series[i].color)}
                  bg={series[i].texture === "solid" ? undefined : theme.bg}
                  divider={i > 0 ? theme.bg : undefined}
                />
              ))}
            </g>
          ) : (
            <rect x="0" y={y0} width={L} height={T} fill={color} />
          )}
          {texture === "wave" && (
            <>
              <motion.path
                d={wave(L, y0 + T * 0.68, T * 0.16)}
                fill="none"
                stroke="#000"
                strokeOpacity="0.16"
                strokeWidth="3"
                animate={still ? undefined : { x: [0, -24] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
              />
              <motion.path
                d={wave(L, y0 + T * 0.36, T * 0.16)}
                fill="none"
                stroke="#fff"
                strokeOpacity="0.14"
                strokeWidth="2"
                animate={still ? undefined : { x: [-24, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
              />
            </>
          )}
          {texture !== "solid" && <rect x="0" y={y0} width={L} height={T} fill={`url(#${id}-grain)`} />}
        </g>

        {target !== undefined && (
          <line
            x1={pos(target)}
            x2={pos(target)}
            y1={y0 - 6}
            y2={y0 + T + 4}
            stroke={theme.fg}
            strokeOpacity="0.7"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {showMarker && (
          <motion.g style={{ x: markerX, opacity: markerOpacity }}>
            <line x1="0" x2="0" y1={y0 - 8} y2={y0 + T + 8} stroke={theme.fg} strokeWidth="3" strokeLinecap="round" />
            <circle cx="0" cy={y0 + T + 11} r="5.5" fill={theme.fg} />
            <circle cx="0" cy={y0 + T + 11} r="2.2" fill={color} />
          </motion.g>
        )}
      </g>
    </svg>
  )
}

function SegmentRect({
  fillLen,
  start,
  end,
  y,
  T,
  fill,
  bg,
  divider,
}: {
  fillLen: MotionValue<number>
  start: number
  end: number
  y: number
  T: number
  fill: string
  bg?: string
  divider?: string
}) {
  const width = useTransform(fillLen, (x) => Math.max(0, Math.min(end, x) - start))
  return (
    <g>
      {bg && <motion.rect x={start} y={y} height={T} width={width} fill={bg} />}
      <motion.rect x={start} y={y} height={T} width={width} fill={fill} />
      {divider && <rect x={start - 1} y={y} width={2} height={T} fill={divider} />}
    </g>
  )
}
