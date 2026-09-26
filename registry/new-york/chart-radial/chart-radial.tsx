"use client"

import { useEffect, useId, useRef, useState } from "react"
import { animate, AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from "motion/react"
import { cn } from "@/lib/utils"
import {
  ChartCard,
  ChartPattern,
  ChartTooltip,
  chartTheme,
  createFormatter,
  polar,
  textureFill,
  toNumber,
  useChartReveal,
  type ChartBaseProps,
  type ChartDatum,
  type ChartTexture,
  type ChartTheme,
} from "@/registry/new-york/lib/chart-kit"

export interface ChartRadialProps extends ChartBaseProps {
  /** Rows to plot, one slice per row. */
  data: ChartDatum[]
  /** Key holding each slice's name, e.g. "browser". */
  nameKey: string
  /** Key holding each slice's value, e.g. "visitors". */
  valueKey: string
  /** Optional key holding a CSS color per row. */
  colorKey?: string
  /** Fill styles cycled per slice. Default: ["solid", "hatch", "solid", "muted", "hatch", "muted"] */
  textures?: ChartTexture[]
  /** Hole size as a fraction of the radius; 0 draws a pie. Default: 0.62 */
  innerRadius?: number
  /** Gap between slices in degrees. Default: 1.5 */
  padAngle?: number
  /** Rounding of slice corners in px. Default: 4 */
  cornerRadius?: number
  /** Angle where the first slice starts, in degrees (0 = 12 o'clock). Default: 0 */
  startAngle?: number
  /** Angle where the last slice ends; use -90 / 90 for a gauge. Default: 360 */
  endAngle?: number
  /** Text drawn on each slice; hidden on slices too small to fit it. Default: "percent" */
  showLabels?: "none" | "percent" | "value" | "name"
  /** Content of the hole: the total, the active slice, or nothing. Default: "total" */
  center?: "total" | "active" | "none"
  /** Caption under the total in the hole. Default: "Total" */
  centerLabel?: string
  /** Index (after sorting) of a slice pushed outward. Default: undefined */
  highlight?: number
  /** What hovering a slice does. Default: "explode" */
  hoverEffect?: "explode" | "dim" | "none"
  /** Show the legend with values and shares; click a row to toggle its slice. Default: true */
  showLegend?: boolean
  /** Show a tooltip next to the pointer. Default: false */
  showTooltip?: boolean
  /** Chart diameter in px. Default: 220 */
  size?: number
  /** Slice order. Default: "none" */
  sortBy?: "none" | "value"
}

const DEFAULT_TEXTURES: ChartTexture[] = ["solid", "hatch", "solid", "muted", "hatch", "muted"]
const EXPLODE = 7
const REFLOW = { duration: 0.6, ease: [0.32, 0.72, 0, 1] as const }

interface Slice {
  id: string
  name: string
  value: number
  share: number
  color: string
  texture: ChartTexture
  a0: number
  a1: number
  hidden: boolean
  pattern: string
}

/** Annular sector with rounded corners (quadratic corner approximation). */
function slicePath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, cr: number) {
  const sweep = a1 - a0
  if (sweep <= 0.05) return ""
  if (sweep >= 359.95) {
    const ring = (r: number, dir: 0 | 1) =>
      `M${cx},${cy - r}A${r},${r} 0 1 ${dir} ${cx},${cy + r}A${r},${r} 0 1 ${dir} ${cx},${cy - r}Z`
    return ring(r1, 1) + (r0 > 0 ? ring(r0, 0) : "")
  }
  const rad = (sweep * Math.PI) / 180
  const deg = 180 / Math.PI
  const band = (r1 - r0) / 2
  const cOut = Math.max(0, Math.min(cr, band, (rad * r1) / 2.2))
  const cIn = r0 > 0 ? Math.max(0, Math.min(cr, band, (rad * r0) / 2.2)) : 0
  const dOut = (cOut / r1) * deg
  const dIn = r0 > 0 ? (cIn / r0) * deg : 0
  const p = (r: number, a: number) => polar(cx, cy, r, a).join(",")
  let d = `M${p(r1 - cOut, a0)}Q${p(r1, a0)} ${p(r1, a0 + dOut)}`
  d += `A${r1},${r1} 0 ${sweep - 2 * dOut > 180 ? 1 : 0} 1 ${p(r1, a1 - dOut)}`
  d += `Q${p(r1, a1)} ${p(r1 - cOut, a1)}`
  if (r0 > 0) {
    d += `L${p(r0 + cIn, a1)}Q${p(r0, a1)} ${p(r0, a1 - dIn)}`
    d += `A${r0},${r0} 0 ${sweep - 2 * dIn > 180 ? 1 : 0} 0 ${p(r0, a0 + dIn)}`
    d += `Q${p(r0, a0)} ${p(r0 + cIn, a0)}`
  } else {
    d += `L${cx},${cy}`
  }
  return `${d}Z`
}

const pctText = (share: number) => {
  const v = share * 100
  return `${v > 0 && v < 1 ? v.toFixed(1) : Math.round(v)}%`
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function PieGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 2.5V8h5.5" />
    </svg>
  )
}

export function ChartRadial({
  data,
  nameKey,
  valueKey,
  colorKey,
  textures = DEFAULT_TEXTURES,
  innerRadius = 0.62,
  padAngle = 1.5,
  cornerRadius = 4,
  startAngle = 0,
  endAngle = 360,
  showLabels = "percent",
  center = "total",
  centerLabel = "Total",
  highlight,
  hoverEffect = "explode",
  showLegend = true,
  showTooltip = false,
  size = 220,
  sortBy = "none",
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
}: ChartRadialProps) {
  const theme = chartTheme(surface, accent)
  const fmt = createFormatter(valueFormat, { currency, decimals })
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const { ref, shown, still } = useChartReveal(once, animateProp)
  const boxRef = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<string | null>(null)
  const [tip, setTip] = useState({ x: 0, y: 0, w: 1 })

  const span = endAngle > startAngle ? Math.min(360, endAngle - startAngle) : 360
  const full = span >= 359.9
  const R = size / 2 - EXPLODE - 1
  const r0 = R * Math.min(0.95, Math.max(0, innerRadius))
  const cx = 0
  const cy = 0

  const derived = [
    theme.accent,
    theme.accent,
    `color-mix(in oklab, ${theme.accent} 72%, #000)`,
    theme.muted,
    `color-mix(in oklab, ${theme.accent} 72%, #000)`,
    theme.muted,
  ]
  const rows = data.map((row, i) => ({
    name: String(row[nameKey] ?? `Item ${i + 1}`),
    value: Math.max(0, toNumber(row[valueKey])),
    color:
      (colorKey && typeof row[colorKey] === "string" && (row[colorKey] as string)) ||
      palette?.[i % palette.length] ||
      derived[i % derived.length],
    texture: textures.length ? textures[i % textures.length] : "solid",
  }))
  if (sortBy === "value") rows.sort((a, b) => b.value - a.value)

  const seen = new Map<string, number>()
  const ids = rows.map((r) => {
    const n = seen.get(r.name) ?? 0
    seen.set(r.name, n + 1)
    return n ? `${r.name}-${n}` : r.name
  })
  const total = rows.reduce((sum, r, i) => sum + (hidden.has(ids[i]) ? 0 : r.value), 0)
  const slices: Slice[] = []
  let cursor = startAngle
  for (let i = 0; i < rows.length; i++) {
    const off = hidden.has(ids[i])
    const share = off || !total ? 0 : rows[i].value / total
    const a0 = cursor
    cursor += share * span
    slices.push({ ...rows[i], id: ids[i], share, a0, a1: cursor, hidden: off, pattern: `${uid}-s${i}` })
  }
  const visibleCount = slices.filter((s) => !s.hidden && s.value > 0).length
  const padHalf = visibleCount > 1 ? Math.max(0, padAngle) / 2 : 0

  const activeSlice = slices.find((s) => s.id === active && !s.hidden)
  const featured =
    activeSlice ??
    (highlight !== undefined && slices[highlight] && !slices[highlight].hidden
      ? slices[highlight]
      : slices.reduce<Slice | undefined>((best, s) => (!best || s.share > best.share ? s : best), undefined))

  const progress = useMotionValue(still ? 1 : 0)
  const totalMv = useMotionValue(still ? total : 0)

  useEffect(() => {
    if (still) {
      progress.set(1)
      return
    }
    if (!shown) {
      progress.set(0)
      return
    }
    const c = animate(progress, 1, { duration, delay, ease: [0.65, 0, 0.35, 1] })
    return () => c.stop()
  }, [shown, still, duration, delay, progress])

  useEffect(() => {
    if (still) {
      totalMv.set(total)
      return
    }
    if (!shown) {
      totalMv.set(0)
      return
    }
    const intro = progress.get() < 1
    const c = animate(totalMv, total, intro ? { duration, delay, ease: [0.16, 1, 0.3, 1] } : REFLOW)
    return () => c.stop()
  }, [shown, still, total, duration, delay, totalMv, progress])

  const totalText = useTransform(totalMv, (v) => fmt(Number.isInteger(total) ? Math.round(v) : v))

  const toggle = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (visibleCount > 1) next.add(id)
      return next
    })

  const track = (e: React.PointerEvent) => {
    const box = boxRef.current?.getBoundingClientRect()
    if (box) setTip({ x: e.clientX - box.left, y: e.clientY - box.top, w: box.width })
  }

  // Bounds of the drawn arc range, so gauges don't waste space
  const m = EXPLODE + 1
  let minX = -(R + m)
  let maxX = R + m
  let minY = -(R + m)
  let maxY = R + m
  if (!full) {
    const pts: [number, number][] = [[cx, cy + 6]]
    for (let a = startAngle; a <= startAngle + span + 0.001; a += Math.min(2, span)) {
      pts.push(polar(cx, cy, R + m, a), polar(cx, cy, Math.max(r0, 1), a))
    }
    minX = Math.min(...pts.map((p) => p[0]))
    maxX = Math.max(...pts.map((p) => p[0]))
    minY = Math.min(...pts.map((p) => p[1]))
    maxY = Math.max(...pts.map((p) => p[1]))
  }
  const vw = maxX - minX
  const vh = maxY - minY

  const holeOk = r0 >= 34 && center !== "none"
  const big = Math.min(34, Math.max(14, r0 * 0.36))
  const small = Math.min(12.5, Math.max(10, r0 * 0.14))
  const bigY = full ? cy + big * 0.3 - small * 0.55 : cy - small - 8
  const smallY = full ? bigY + small + 6 : cy - 2
  const centerKey =
    center === "active" ? (featured?.id ?? "none") : activeSlice ? activeSlice.id : "__total"

  const tipSlice = showTooltip ? activeSlice : undefined

  return (
    <ChartCard
      theme={theme}
      title={title}
      description={description}
      titleSize={titleSize}
      icon={icon === undefined ? <PieGlyph /> : icon}
      radius={radius}
      bare={bare}
      className={className}
    >
      <div ref={ref} className="flex w-full flex-col items-center gap-6">
        <div ref={boxRef} className="relative flex w-full justify-center">
          <svg
            viewBox={`${minX} ${minY} ${vw} ${vh}`}
            width={vw}
            className="h-auto max-w-full overflow-visible"
            role="img"
            aria-label={title ?? "Radial chart"}
            onPointerLeave={() => setActive(null)}
          >
            <defs>
              {slices.map((s) => (
                <ChartPattern key={s.pattern} id={s.pattern} color={s.color} texture={s.texture} theme={theme} />
              ))}
            </defs>
            {!full && (
              <path
                d={slicePath(cx, cy, r0, R, startAngle, startAngle + span, cornerRadius)}
                fill={theme.track}
                opacity={0.6}
              />
            )}
            {slices.map((s, i) => {
              const exploded =
                (i === highlight && !s.hidden) || (hoverEffect === "explode" && active === s.id && !s.hidden)
              const dimmed = hoverEffect === "dim" && active !== null && active !== s.id
              return (
                <SliceShape
                  key={`${s.id}-${i}`}
                  slice={s}
                  theme={theme}
                  progress={progress}
                  origin={startAngle}
                  span={span}
                  r0={r0}
                  r1={R}
                  padHalf={padHalf}
                  cornerRadius={cornerRadius}
                  exploded={exploded}
                  dimmed={dimmed}
                  label={
                    showLabels === "none"
                      ? ""
                      : showLabels === "value"
                        ? fmt(s.value)
                        : showLabels === "name"
                          ? s.name
                          : pctText(s.share)
                  }
                  still={still}
                  onEnter={() => setActive(s.id)}
                  onMove={track}
                />
              )
            })}
            {holeOk && (
              <AnimatePresence initial={false}>
                <motion.g
                  key={centerKey}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="pointer-events-none"
                >
                  {center === "total" && !activeSlice ? (
                    <>
                      <motion.text
                        x={cx}
                        y={bigY}
                        textAnchor="middle"
                        fill={theme.fg}
                        fontSize={big}
                        fontWeight={700}
                        letterSpacing="-0.03em"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {totalText}
                      </motion.text>
                      <text x={cx} y={smallY} textAnchor="middle" fill={theme.muted} fontSize={small} fontWeight={500}>
                        {centerLabel}
                      </text>
                    </>
                  ) : (
                    (() => {
                      const s = center === "total" ? activeSlice : featured
                      if (!s) return null
                      return (
                        <>
                          <text
                            x={cx}
                            y={bigY}
                            textAnchor="middle"
                            fill={theme.fg}
                            fontSize={big}
                            fontWeight={700}
                            letterSpacing="-0.03em"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {center === "total" ? fmt(s.value) : pctText(s.share)}
                          </text>
                          <text x={cx} y={smallY} textAnchor="middle" fill={theme.muted} fontSize={small} fontWeight={500}>
                            {s.name.length > 16 ? `${s.name.slice(0, 15)}…` : s.name}
                          </text>
                        </>
                      )
                    })()
                  )}
                </motion.g>
              </AnimatePresence>
            )}
          </svg>
          <ChartTooltip
            open={!!tipSlice}
            x={tip.x}
            y={tip.y}
            width={tip.w}
            theme={theme}
            rows={
              tipSlice
                ? [
                    {
                      label: tipSlice.name,
                      value: `${fmt(tipSlice.value)} · ${pctText(tipSlice.share)}`,
                      color: tipSlice.color,
                      texture: tipSlice.texture,
                    },
                  ]
                : []
            }
          />
        </div>

        {showLegend && (
          <motion.ul
            className="w-full divide-y text-[13px]"
            style={{ borderColor: theme.border }}
            initial={still ? false : { opacity: 0, y: 6 }}
            animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.5, delay: still ? 0 : delay + duration * 0.6, ease: [0.16, 1, 0.3, 1] }}
            onPointerLeave={() => setActive(null)}
          >
            {slices.map((s, i) => (
              <li key={`${s.id}-${i}`} style={{ borderColor: theme.border }}>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  onPointerEnter={() => setActive(s.id)}
                  aria-pressed={!s.hidden}
                  className={cn(
                    "flex w-full items-center gap-2.5 py-2 text-left transition-opacity",
                    s.hidden && "opacity-35",
                    active !== null && active !== s.id && !s.hidden && "opacity-60"
                  )}
                >
                  <svg width="10" height="10" className="shrink-0 overflow-visible">
                    <rect width="10" height="10" rx="3" fill={textureFill(s.pattern, s.texture, s.color)} />
                    {s.texture !== "solid" && (
                      <rect
                        width="10"
                        height="10"
                        rx="3"
                        fill="none"
                        stroke={s.texture === "muted" ? theme.muted : s.color}
                        strokeOpacity="0.6"
                      />
                    )}
                  </svg>
                  <span className={cn("truncate", s.hidden && "line-through")} style={{ color: theme.muted }}>
                    {s.name}
                  </span>
                  <span className="ml-auto font-medium tabular-nums">{fmt(s.value)}</span>
                  <span className="w-11 text-right tabular-nums" style={{ color: theme.muted }}>
                    {s.hidden ? "–" : pctText(s.share)}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </ChartCard>
  )
}

function SliceShape({
  slice,
  theme,
  progress,
  origin,
  span,
  r0,
  r1,
  padHalf,
  cornerRadius,
  exploded,
  dimmed,
  label,
  still,
  onEnter,
  onMove,
}: {
  slice: Slice
  theme: ChartTheme
  progress: MotionValue<number>
  origin: number
  span: number
  r0: number
  r1: number
  padHalf: number
  cornerRadius: number
  exploded: boolean
  dimmed: boolean
  label: string
  still: boolean
  onEnter: () => void
  onMove: (e: React.PointerEvent) => void
}) {
  const start = useMotionValue(slice.a0)
  const end = useMotionValue(slice.a1)

  useEffect(() => {
    if (still) {
      start.set(slice.a0)
      end.set(slice.a1)
      return
    }
    const a = animate(start, slice.a0, REFLOW)
    const b = animate(end, slice.a1, REFLOW)
    return () => {
      a.stop()
      b.stop()
    }
  }, [slice.a0, slice.a1, still, start, end])

  const d = useTransform([start, end, progress], ([s, e, p]: number[]) => {
    const to = Math.min(e - padHalf, origin + p * span)
    return slicePath(0, 0, r0, r1, s + padHalf, to, cornerRadius)
  })

  const rl = r0 > 0 ? (r0 + r1) / 2 : r1 * 0.64
  const labelArc = label.length * 6.4 + 10
  const minSpan = (labelArc / rl) * (180 / Math.PI)
  const fits = r1 - r0 >= 16 && !!label
  const lx = useTransform([start, end], ([s, e]: number[]) => polar(0, 0, rl, (s + e) / 2)[0])
  const ly = useTransform([start, end], ([s, e]: number[]) => polar(0, 0, rl, (s + e) / 2)[1])
  const labelOpacity = useTransform([start, end, progress], ([s, e, p]: number[]) => {
    const w = e - s
    const sweep = origin + p * span
    const reveal = clamp01((sweep - (e - w * 0.3)) / (w * 0.3 + 0.001))
    return reveal * clamp01((w - minSpan) / 6)
  })

  const mid = (slice.a0 + slice.a1) / 2
  const [ox, oy] = exploded ? polar(0, 0, EXPLODE, mid) : [0, 0]
  const fill = textureFill(slice.pattern, slice.texture, slice.color)

  return (
    <motion.g
      initial={false}
      animate={{ x: ox, y: oy, opacity: dimmed ? 0.3 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      <motion.path
        d={d}
        fill={fill}
        fillRule="evenodd"
        stroke={slice.texture === "solid" ? "none" : slice.texture === "muted" ? theme.muted : slice.color}
        strokeOpacity={slice.texture === "solid" ? 0 : 0.35}
        strokeWidth={1}
        className="cursor-pointer outline-none"
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        aria-label={`${slice.name}: ${slice.value}`}
      />
      {fits && (
        <motion.text
          x={lx}
          y={ly}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11.5}
          fontWeight={700}
          fill={slice.texture === "solid" ? "#fff" : theme.fg}
          style={{ opacity: labelOpacity, fontVariantNumeric: "tabular-nums" }}
          className="pointer-events-none select-none"
        >
          {label}
        </motion.text>
      )}
    </motion.g>
  )
}
