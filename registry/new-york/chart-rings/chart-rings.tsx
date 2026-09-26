"use client"

import { useEffect, useId, useState } from "react"
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import {
  ChartCard,
  ChartPattern,
  chartTheme,
  createFormatter,
  polar,
  toNumber,
  useChartReveal,
  type ChartBaseProps,
  type ChartDatum,
  type ChartTheme,
} from "@/registry/new-york/lib/chart-kit"

export interface ChartRingsProps extends ChartBaseProps {
  /** Rows to plot, one ring per row, outermost first. */
  data: ChartDatum[]
  /** Key holding each ring's name, e.g. "goal". */
  nameKey: string
  /** Key holding each ring's current value, e.g. "value". */
  valueKey: string
  /** Optional key holding a per-row goal; falls back to `max`. */
  maxKey?: string
  /** Goal used when a row has no `maxKey` value. Default: 100 */
  max?: number
  /** Optional key holding a CSS color per row. */
  colorKey?: string
  /** Ring thickness in px. Default: 14 */
  thickness?: number
  /** Space between rings in px. Default: 6 */
  gap?: number
  /** Style of the unfilled track. Default: "hatch" */
  trackTexture?: "solid" | "hatch" | "none"
  /** Round the ends of each ring. Default: true */
  roundedCaps?: boolean
  /** Angle where rings start filling, in degrees (0 = 12 o'clock). Default: 0 */
  startAngle?: number
  /** What the list next to the rings shows. Default: "percent" */
  showValues?: "percent" | "value" | "none"
  /** List beside the rings or stacked under them. Default: "side" */
  layout?: "side" | "stacked"
  /** Chart diameter in px. Default: 200 */
  size?: number
}

interface Ring {
  name: string
  value: number
  goal: number
  ratio: number
  color: string
  r: number
}

const STAGGER = 0.12

function arc(r: number, a0: number, a1: number) {
  if (a1 - a0 >= 359.99) {
    const [x0, y0] = polar(0, 0, r, a0)
    const [x1, y1] = polar(0, 0, r, a0 + 180)
    return `M${x0},${y0}A${r},${r} 0 1 1 ${x1},${y1}A${r},${r} 0 1 1 ${x0},${y0}`
  }
  const [x0, y0] = polar(0, 0, r, a0)
  const [x1, y1] = polar(0, 0, r, a1)
  return `M${x0},${y0}A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`
}

function RingsGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M8 2.5a5.5 5.5 0 1 1-5.5 5.5" />
      <path d="M8 5.5A2.5 2.5 0 1 1 5.5 8" />
    </svg>
  )
}

export function ChartRings({
  data,
  nameKey,
  valueKey,
  maxKey,
  max = 100,
  colorKey,
  thickness = 14,
  gap = 6,
  trackTexture = "hatch",
  roundedCaps = true,
  startAngle = 0,
  showValues = "percent",
  layout = "side",
  size = 200,
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
}: ChartRingsProps) {
  const theme = chartTheme(surface, accent)
  const fmt = createFormatter(valueFormat, { currency, decimals })
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const { ref, shown, still } = useChartReveal(once, animateProp)
  const [active, setActive] = useState<number | null>(null)

  const derived = [
    theme.accent,
    `color-mix(in oklab, ${theme.accent} 58%, #fff)`,
    `color-mix(in oklab, ${theme.accent} 62%, #000)`,
    `color-mix(in oklab, ${theme.accent} 32%, #fff)`,
    `color-mix(in oklab, ${theme.accent} 38%, #000)`,
  ]
  const t = Math.max(2, thickness)
  const R = size / 2 - 3
  const rings: Ring[] = []
  data.forEach((row, i) => {
    const r = R - t / 2 - i * (t + Math.max(0, gap))
    if (r < t / 2 + 1) return
    const value = Math.max(0, toNumber(row[valueKey]))
    const goal = (maxKey && toNumber(row[maxKey])) || max || 1
    rings.push({
      name: String(row[nameKey] ?? `Ring ${i + 1}`),
      value,
      goal,
      ratio: Math.min(value / goal, 1.995),
      color:
        (colorKey && typeof row[colorKey] === "string" && (row[colorKey] as string)) ||
        palette?.[i % palette.length] ||
        derived[i % derived.length],
      r,
    })
  })
  const hole = rings.length ? rings[rings.length - 1].r - t / 2 : 0
  const trackId = `${uid}-track`
  const shadowId = `${uid}-shadow`
  const focus = active !== null ? rings[active] : undefined

  const chart = (
    <svg
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      width={size}
      className="h-auto max-w-full shrink-0 overflow-visible"
      role="img"
      aria-label={title ?? "Progress rings"}
      onPointerLeave={() => setActive(null)}
    >
      <defs>
        <ChartPattern id={trackId} color={theme.muted} texture="muted" theme={theme} />
        <filter id={shadowId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={Math.max(1.5, t / 7)} />
        </filter>
      </defs>
      {rings.map((ring, i) => (
        <RingArc
          key={`${ring.name}-${i}`}
          ring={ring}
          index={i}
          theme={theme}
          thickness={t}
          track={trackTexture === "none" ? "none" : trackTexture === "solid" ? theme.track : `url(#${trackId})`}
          roundedCaps={roundedCaps}
          startAngle={startAngle}
          shadowId={shadowId}
          shown={shown}
          still={still}
          duration={duration}
          delay={delay}
          dimmed={active !== null && active !== i}
          onEnter={() => setActive(i)}
        />
      ))}
      {hole > 26 && (
        <AnimatePresence>
          {focus && (
            <motion.g
              key={active}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none"
            >
              <text
                y={Math.min(22, hole * 0.5) * 0.35}
                textAnchor="middle"
                fontSize={Math.min(22, hole * 0.5)}
                fontWeight={700}
                letterSpacing="-0.03em"
                fill={theme.fg}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {Math.round((focus.value / focus.goal) * 100)}%
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      )}
    </svg>
  )

  return (
    <ChartCard
      theme={theme}
      title={title}
      description={description}
      titleSize={titleSize}
      icon={icon === undefined ? <RingsGlyph /> : icon}
      radius={radius}
      bare={bare}
      className={className}
    >
      <div
        ref={ref}
        className={cn(
          "flex w-full items-center",
          layout === "side" ? "flex-row flex-wrap justify-center gap-x-8 gap-y-6" : "flex-col gap-7"
        )}
      >
        {chart}
        {showValues !== "none" && (
          <ul
            className={cn(
              layout === "side" ? "flex min-w-36 flex-1 flex-col gap-4" : "grid w-full gap-4",
            )}
            style={
              layout === "stacked"
                ? { gridTemplateColumns: `repeat(${Math.min(Math.max(rings.length, 1), 3)}, minmax(0, 1fr))` }
                : undefined
            }
            onPointerLeave={() => setActive(null)}
          >
            {rings.map((ring, i) => (
              <RingValue
                key={`${ring.name}-${i}`}
                ring={ring}
                index={i}
                theme={theme}
                mode={showValues}
                fmt={fmt}
                shown={shown}
                still={still}
                duration={duration}
                delay={delay}
                dimmed={active !== null && active !== i}
                centered={layout === "stacked"}
                onEnter={() => setActive(i)}
              />
            ))}
          </ul>
        )}
      </div>
    </ChartCard>
  )
}

function RingArc({
  ring,
  index,
  theme,
  thickness,
  track,
  roundedCaps,
  startAngle,
  shadowId,
  shown,
  still,
  duration,
  delay,
  dimmed,
  onEnter,
}: {
  ring: Ring
  index: number
  theme: ChartTheme
  thickness: number
  track: string
  roundedCaps: boolean
  startAngle: number
  shadowId: string
  shown: boolean
  still: boolean
  duration: number
  delay: number
  dimmed: boolean
  onEnter: () => void
}) {
  const p = useMotionValue(still ? ring.ratio : 0)

  useEffect(() => {
    if (still) {
      p.set(ring.ratio)
      return
    }
    if (!shown) {
      p.set(0)
      return
    }
    const c = animate(p, ring.ratio, {
      type: "spring",
      duration: Math.max(0.3, duration),
      bounce: 0.28,
      delay: delay + index * STAGGER,
    })
    return () => c.stop()
  }, [p, ring.ratio, shown, still, duration, delay, index])

  const { r } = ring
  const lap1 = useTransform(p, (v) => (v <= 0.002 ? "" : arc(r, startAngle, startAngle + Math.min(v, 1) * 360)))
  const lap2 = useTransform(p, (v) => (v <= 1.002 ? "" : arc(r, startAngle, startAngle + (v - 1) * 360)))
  const nudge = ((thickness * 0.18) / r) * (180 / Math.PI)
  const sx = useTransform(p, (v) => polar(0, 0, r, startAngle + (v - 1) * 360 + nudge)[0])
  const sy = useTransform(p, (v) => polar(0, 0, r, startAngle + (v - 1) * 360 + nudge)[1])
  const shadowOpacity = useTransform(p, [1, 1.04], [0, 0.55])
  const cap = roundedCaps ? "round" : "butt"

  return (
    <motion.g
      initial={false}
      animate={{ opacity: dimmed ? 0.3 : 1 }}
      transition={{ duration: 0.2 }}
      onPointerEnter={onEnter}
      className="cursor-pointer"
    >
      <circle r={r} fill="none" stroke={track === "none" ? "transparent" : track} strokeWidth={thickness} />
      <motion.path d={lap1} fill="none" stroke={ring.color} strokeWidth={thickness} strokeLinecap={cap} />
      <motion.circle
        cx={sx}
        cy={sy}
        r={thickness / 2}
        fill={theme.surface === "dark" ? "#000" : "#3a1a0a"}
        filter={`url(#${shadowId})`}
        style={{ opacity: shadowOpacity }}
      />
      <motion.path d={lap2} fill="none" stroke={ring.color} strokeWidth={thickness} strokeLinecap={cap} />
    </motion.g>
  )
}

function RingValue({
  ring,
  index,
  theme,
  mode,
  fmt,
  shown,
  still,
  duration,
  delay,
  dimmed,
  centered,
  onEnter,
}: {
  ring: Ring
  index: number
  theme: ChartTheme
  mode: "percent" | "value"
  fmt: (v: number) => string
  shown: boolean
  still: boolean
  duration: number
  delay: number
  dimmed: boolean
  centered: boolean
  onEnter: () => void
}) {
  const count = useMotionValue(still ? 1 : 0)

  useEffect(() => {
    if (still) {
      count.set(1)
      return
    }
    if (!shown) {
      count.set(0)
      return
    }
    const c = animate(count, 1, {
      duration: Math.max(0.3, duration),
      delay: delay + index * STAGGER,
      ease: [0.16, 1, 0.3, 1],
    })
    return () => c.stop()
  }, [count, shown, still, duration, delay, index])

  const whole = Number.isInteger(ring.value)
  const main = useTransform(count, (k) =>
    mode === "percent"
      ? `${Math.round(((ring.value * k) / ring.goal) * 100)}%`
      : fmt(whole ? Math.round(ring.value * k) : ring.value * k)
  )

  return (
    <motion.li
      initial={false}
      animate={{ opacity: dimmed ? 0.4 : 1 }}
      transition={{ duration: 0.2 }}
      onPointerEnter={onEnter}
      className={cn("min-w-0", centered && "text-center")}
    >
      <div className={cn("flex items-center gap-2 text-[12.5px]", centered && "justify-center")} style={{ color: theme.muted }}>
        <span className="h-2.5 w-1 shrink-0 rounded-full" style={{ background: ring.color }} />
        <span className="truncate">{ring.name}</span>
      </div>
      <div className={cn("mt-1 flex items-baseline gap-1.5", centered && "justify-center")}>
        <motion.span className="text-[22px] font-semibold leading-none tracking-tight tabular-nums">{main}</motion.span>
        <span className="truncate text-[12px] tabular-nums" style={{ color: theme.muted }}>
          {mode === "percent" ? `${fmt(ring.value)} / ${fmt(ring.goal)}` : `/ ${fmt(ring.goal)}`}
        </span>
      </div>
    </motion.li>
  )
}
