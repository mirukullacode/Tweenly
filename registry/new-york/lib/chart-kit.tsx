"use client"

import { useRef } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

// ------------------------------------------------------------------ types

export type ChartDatum = Record<string, string | number>
export type ChartSurface = "dark" | "light"
export type ChartTexture = "solid" | "hatch" | "dots" | "muted"
export type ChartCurve = "smooth" | "linear" | "step"
export type ValueFormat = "number" | "compact" | "percent" | "currency" | ((value: number) => string)

export interface ChartSeries {
  /** Key in each data row that holds this series' values. */
  key: string
  /** Name shown in the legend and tooltip. Defaults to the key. */
  label?: string
  /** Series color. Defaults to the accent / palette. */
  color?: string
  /** Fill style. Defaults to solid, hatch, muted, dots in order. */
  texture?: ChartTexture
}

/** Props shared by every chart card. */
export interface ChartBaseProps {
  /** Card heading. */
  title?: string
  /** Small line under the heading. */
  description?: string
  /** "hero" is a huge bold heading; "default" is a compact dashboard header. Default: "default" */
  titleSize?: "hero" | "default"
  /** Card surface. Default: "dark" */
  surface?: ChartSurface
  /** Main accent color. Default: "#FF4D12" */
  accent?: string
  /** Series colors in order; overrides the accent-derived palette. */
  palette?: string[]
  /** Content of the round badge in the top-right corner. Pass null to hide it. */
  icon?: React.ReactNode
  /** Card corner radius in px. Default: 28 */
  radius?: number
  /** Render only the chart, without the card. Default: false */
  bare?: boolean
  /** Play the entrance animation. Default: true */
  animate?: boolean
  /** Entrance duration in seconds. Default: 1.2 */
  duration?: number
  /** Delay before the entrance starts, in seconds. Default: 0 */
  delay?: number
  /** Animate only the first time the chart enters view. Default: true */
  once?: boolean
  /** How values are formatted in labels and tooltips. Default: "number" */
  valueFormat?: ValueFormat
  /** Currency code used when valueFormat is "currency". Default: "USD" */
  currency?: string
  /** Fraction digits for formatted values. Default: auto */
  decimals?: number
  className?: string
}

export const CHART_ACCENT = "#FF4D12"

// ------------------------------------------------------------------ theme

export interface ChartTheme {
  surface: ChartSurface
  bg: string
  fg: string
  muted: string
  subtle: string
  grid: string
  track: string
  border: string
  accent: string
  tooltipBg: string
}

export function chartTheme(surface: ChartSurface = "dark", accent = CHART_ACCENT): ChartTheme {
  return surface === "dark"
    ? {
        surface,
        bg: "#1a1a1a",
        fg: "#fafafa",
        muted: "#8a8a8a",
        subtle: "#3a3a3a",
        grid: "rgb(255 255 255 / 0.07)",
        track: "#262626",
        border: "rgb(255 255 255 / 0.09)",
        accent,
        tooltipBg: "#0f0f0f",
      }
    : {
        surface,
        bg: "#ffffff",
        fg: "#0f0f0f",
        muted: "#737373",
        subtle: "#d4d4d4",
        grid: "rgb(0 0 0 / 0.06)",
        track: "#f0f0f0",
        border: "rgb(0 0 0 / 0.08)",
        accent,
        tooltipBg: "#ffffff",
      }
}

const DEFAULT_TEXTURES: ChartTexture[] = ["solid", "hatch", "muted", "dots"]

export type ResolvedSeries = Required<Pick<ChartSeries, "key" | "label" | "color" | "texture">>

/** Fill in labels, colors and textures for each series. */
export function resolveSeries(series: ChartSeries[], theme: ChartTheme, palette?: string[]): ResolvedSeries[] {
  const derived = [
    theme.accent,
    `color-mix(in oklab, ${theme.accent} 55%, ${theme.fg})`,
    theme.muted,
    theme.fg,
  ]
  return series.map((s, i) => ({
    key: s.key,
    label: s.label ?? s.key,
    texture: s.texture ?? DEFAULT_TEXTURES[i % DEFAULT_TEXTURES.length],
    color: s.color ?? palette?.[i % palette.length] ?? derived[i % derived.length],
  }))
}

// ------------------------------------------------------------------ numbers

export function createFormatter(format: ValueFormat = "number", options: { currency?: string; decimals?: number } = {}) {
  if (typeof format === "function") return format
  const { currency = "USD", decimals } = options
  const digits = decimals === undefined ? {} : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
  const intl =
    format === "compact"
      ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: decimals ?? 1 })
      : format === "currency"
        ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: decimals ?? 0, ...digits })
        : format === "percent"
          ? new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals ?? 1, ...digits })
          : new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals ?? 2, ...digits })
  return (value: number) => (format === "percent" ? `${intl.format(value)}%` : intl.format(value))
}

/** Human-friendly axis ticks covering [min, max]. */
export function niceTicks(min: number, max: number, count = 4) {
  if (min === max) max = min + 1
  const raw = (max - min) / Math.max(count, 1)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)))
  return ticks
}

export const toNumber = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0)

// ------------------------------------------------------------------ geometry

export type Point = [number, number]

/** SVG path through points. "smooth" uses monotone cubic interpolation, so it never overshoots the data. */
export function linePath(points: Point[], curve: ChartCurve = "smooth") {
  if (!points.length) return ""
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`
  if (curve === "linear") return points.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join("")
  if (curve === "step") {
    return points
      .map((p, i) => (i ? `H${(points[i - 1][0] + p[0]) / 2}V${p[1]}H${p[0]}` : `M${p[0]},${p[1]}`))
      .join("")
  }

  const n = points.length
  const dx = points.slice(1).map((p, i) => p[0] - points[i][0])
  const slope = points.slice(1).map((p, i) => (p[1] - points[i][1]) / (dx[i] || 1))
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0]
    if (i === n - 1) return slope[n - 2]
    return slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2
  })
  // Fritsch–Carlson: clamp tangents to keep the curve monotone between points
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = tangent[i + 1] = 0
      continue
    }
    const a = tangent[i] / slope[i]
    const b = tangent[i + 1] / slope[i]
    const h = Math.hypot(a, b)
    if (h > 3) {
      tangent[i] = (3 / h) * a * slope[i]
      tangent[i + 1] = (3 / h) * b * slope[i]
    }
  }
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const h = dx[i] / 3
    d += `C${x0 + h},${y0 + tangent[i] * h} ${x1 - h},${y1 - tangent[i + 1] * h} ${x1},${y1}`
  }
  return d
}

/** Point on a circle; angle in degrees, 0 = 12 o'clock, clockwise. */
export function polar(cx: number, cy: number, r: number, angle: number): Point {
  const a = ((angle - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/** Ring segment from angle a0 to a1 (degrees) between radii r0 and r1. */
export function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const sweep = Math.min(a1 - a0, 359.999)
  const large = sweep > 180 ? 1 : 0
  const [x0, y0] = polar(cx, cy, r1, a0)
  const [x1, y1] = polar(cx, cy, r1, a0 + sweep)
  const [x2, y2] = polar(cx, cy, r0, a0 + sweep)
  const [x3, y3] = polar(cx, cy, r0, a0)
  return `M${x0},${y0}A${r1},${r1} 0 ${large} 1 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${large} 0 ${x3},${y3}Z`
}

// ------------------------------------------------------------------ textures

/** SVG <pattern> for a texture. Render inside <defs>. */
export function ChartPattern({ id, color, texture, theme }: {
  id: string
  color: string
  texture: ChartTexture
  theme: ChartTheme
}) {
  if (texture === "solid") return null
  if (texture === "dots") {
    return (
      <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.9" fill={color} />
      </pattern>
    )
  }
  const stroke = texture === "muted" ? theme.muted : color
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill={stroke} opacity={texture === "muted" ? 0.08 : 0.2} />
      <line x1="0" y1="0" x2="0" y2="6" stroke={stroke} strokeWidth="1.6" opacity={texture === "muted" ? 0.55 : 0.9} />
    </pattern>
  )
}

/** Fill value for a series: its color, or its pattern. */
export const textureFill = (id: string, texture: ChartTexture, color: string) =>
  texture === "solid" ? color : `url(#${id})`

// ------------------------------------------------------------------ hooks

/** True once the chart should play its entrance (in view, or immediately if animation is off). */
export function useChartReveal(once = true, animate = true) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, amount: 0.35 })
  const reduced = useReducedMotion()
  const still = !animate || !!reduced
  return { ref, shown: still || inView, still }
}

// ------------------------------------------------------------------ card

export function ChartCard({
  theme,
  title,
  description,
  titleSize = "default",
  value,
  delta,
  icon,
  radius = 28,
  bare,
  className,
  style,
  children,
  footer,
}: {
  theme: ChartTheme
  title?: string
  description?: string
  titleSize?: "hero" | "default"
  /** Headline figure, e.g. a total. */
  value?: React.ReactNode
  /** Change vs. the previous period, in percent. */
  delta?: number
  icon?: React.ReactNode
  radius?: number
  bare?: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  if (bare) {
    return (
      <div className={cn("relative", className)} style={{ color: theme.fg, ...style }}>
        {children}
      </div>
    )
  }

  const hasHeader = title || description || value !== undefined || icon
  return (
    <div
      className={cn("relative flex w-full flex-col overflow-hidden border p-6", className)}
      style={{
        background: theme.bg,
        color: theme.fg,
        borderColor: theme.border,
        borderRadius: radius,
        boxShadow:
          theme.surface === "dark"
            ? "inset 0 1px 0 rgb(255 255 255 / 0.06), 0 24px 48px -28px rgb(0 0 0 / 0.6)"
            : "inset 0 1px 0 #fff, 0 24px 48px -28px rgb(0 0 0 / 0.25)",
        ...style,
      }}
    >
      {hasHeader && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <p
                className={cn(
                  titleSize === "hero"
                    ? "max-w-[9ch] text-[2.5rem] font-bold leading-[0.9] tracking-tight"
                    : "text-[13px] font-medium"
                )}
                style={titleSize === "hero" ? undefined : { color: theme.muted }}
              >
                {title}
              </p>
            )}
            {value !== undefined && (
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <span className="text-[1.9rem] font-semibold leading-none tracking-tight tabular-nums">{value}</span>
                {delta !== undefined && <DeltaPill delta={delta} theme={theme} />}
              </div>
            )}
            {description && (
              <p className="mt-1.5 text-[12.5px]" style={{ color: theme.muted }}>
                {description}
              </p>
            )}
          </div>
          {icon !== null && icon !== undefined && (
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full border"
              style={{ borderColor: theme.border, background: theme.surface === "dark" ? "#111" : "#f6f6f6" }}
            >
              {icon}
            </span>
          )}
        </div>
      )}
      {children}
      {footer && <div className="mt-5">{footer}</div>}
    </div>
  )
}

export function DeltaPill({ delta, theme }: { delta: number; theme: ChartTheme }) {
  const up = delta >= 0
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{
        color: up ? theme.accent : theme.muted,
        background: up ? `color-mix(in oklab, ${theme.accent} 14%, transparent)` : theme.track,
      }}
    >
      {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
    </span>
  )
}

// ------------------------------------------------------------------ legend

export function ChartLegend({ series, theme, hidden, onToggle, patternPrefix, align = "start" }: {
  series: ResolvedSeries[]
  theme: ChartTheme
  hidden?: Set<string>
  /** When provided, clicking an item toggles that series. */
  onToggle?: (key: string) => void
  /** Pattern id prefix so swatches can show textures. */
  patternPrefix?: string
  align?: "start" | "center" | "end"
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-1.5 text-[12px]",
        align === "center" && "justify-center",
        align === "end" && "justify-end"
      )}
    >
      {series.map((s) => {
        const off = hidden?.has(s.key)
        const Tag = onToggle ? "button" : "span"
        return (
          <Tag
            key={s.key}
            type={onToggle ? "button" : undefined}
            onClick={onToggle ? () => onToggle(s.key) : undefined}
            aria-pressed={onToggle ? !off : undefined}
            className={cn("flex items-center gap-1.5 transition-opacity", off && "opacity-35", onToggle && "hover:opacity-80")}
            style={{ color: theme.muted }}
          >
            <svg width="10" height="10" className="shrink-0 overflow-visible rounded-[3px]">
              <rect
                width="10"
                height="10"
                rx="3"
                fill={patternPrefix ? textureFill(`${patternPrefix}-${s.key}`, s.texture, s.color) : s.color}
              />
              {s.texture !== "solid" && <rect width="10" height="10" rx="3" fill="none" stroke={s.texture === "muted" ? theme.muted : s.color} strokeOpacity="0.6" />}
            </svg>
            {s.label}
          </Tag>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------ tooltip

export interface TooltipRow {
  label: string
  value: string
  color: string
  texture?: ChartTexture
}

/** Floating tooltip positioned inside a relative container. Flips to the left near the right edge. */
export function ChartTooltip({ open, x, y, width, title, rows, theme }: {
  open: boolean
  x: number
  y: number
  /** Container width, used to flip the tooltip. */
  width: number
  title?: string
  rows: TooltipRow[]
  theme: ChartTheme
}) {
  const flip = x > width * 0.6
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1, x: flip ? x - 12 : x + 12, y }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 500, damping: 38, opacity: { duration: 0.12 } }}
          className={cn(
            "pointer-events-none absolute left-0 top-0 z-10 min-w-32 -translate-y-1/2 rounded-xl border px-3 py-2 text-[12px] shadow-xl",
            flip && "-translate-x-full"
          )}
          style={{ background: theme.tooltipBg, borderColor: theme.border, color: theme.fg }}
        >
          {title && (
            <p className="mb-1.5 text-[11px]" style={{ color: theme.muted }}>
              {title}
            </p>
          )}
          <div className="space-y-1">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="size-2 rounded-[2px]" style={{ background: r.texture === "muted" ? theme.muted : r.color }} />
                <span style={{ color: theme.muted }}>{r.label}</span>
                <span className="ml-auto pl-3 font-medium tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
