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
  niceTicks,
  resolveSeries,
  textureFill,
  toNumber,
  useChartReveal,
  type ChartBaseProps,
  type ChartDatum,
  type ChartSeries,
  type ValueFormat,
} from "@/registry/new-york/lib/chart-kit"

export interface ChartBarProps extends ChartBaseProps {
  /** Rows of data, e.g. `{ month: "Jan", desktop: 186, mobile: 80 }`. */
  data: ChartDatum[]
  /** Key in each row used for the category labels. */
  index: string
  /** Numeric keys to plot, one bar (or stack segment) each. */
  series: ChartSeries[]
  /** "vertical" draws columns, "horizontal" draws rows. Default: "vertical" */
  layout?: "vertical" | "horizontal"
  /** Stack series on top of each other instead of grouping them side by side. Default: false */
  stacked?: boolean
  /** Bar corner radius in px. Default: 6 */
  barRadius?: number
  /** Gap between bars in a group (or segments in a stack) in px. Default: 4 */
  barGap?: number
  /** Share of each category slot left empty, 0 – 0.8. Default: 0.3 */
  categoryGap?: number
  /** Grid lines at each value tick. Default: true */
  showGrid?: boolean
  /** Bottom axis labels (categories when vertical, values when horizontal). Default: true */
  showXAxis?: boolean
  /** Left axis labels (values when vertical, categories when horizontal). Default: true */
  showYAxis?: boolean
  /** Approximate number of value-axis ticks. Default: 4 */
  yTicks?: number
  /** Value labels at the end of each bar (each stack when stacked). Default: false */
  showValues?: boolean
  /** "hover" dims the other categories while one is hovered. Default: "hover" */
  highlight?: "hover" | "none"
  /** Tooltip on hover / arrow keys. Default: true */
  showTooltip?: boolean
  /** Toggleable legend. Default: true when there is more than one series */
  showLegend?: boolean
  /** Plot height in px, excluding the bottom axis. Default: 220 */
  height?: number
  /** Headline figure from the first series. Default: "sum" */
  total?: "sum" | "last" | "none"
  /** Change pill next to the headline, in percent. "auto" compares the first and last value of the first series. Default: "auto" */
  delta?: number | "auto"
}

interface Bar {
  key: string
  si: number
  ci: number
  on: boolean
  x: number
  y: number
  w: number
  h: number
  start: { x: number; y: number; w: number; h: number }
}

export function ChartBar({
  data,
  index,
  series,
  layout = "vertical",
  stacked = false,
  barRadius = 6,
  barGap = 4,
  categoryGap = 0.3,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  yTicks = 4,
  showValues = false,
  highlight = "hover",
  showTooltip = true,
  showLegend,
  height = 220,
  total = "sum",
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
}: ChartBarProps) {
  const theme = chartTheme(surface, accent)
  const resolved = resolveSeries(series, theme, palette)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const { ref, shown, still } = useChartReveal(once, animated)
  const width = useWidth(ref)
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<number | null>(null)
  const [settled, setSettled] = useState(false)

  const fmt = useMemo(() => createFormatter(valueFormat, { currency, decimals }), [valueFormat, currency, decimals])
  const axisFmt = useMemo(() => axisFormatter(valueFormat, currency, decimals), [valueFormat, currency, decimals])

  const horizontal = layout === "horizontal"
  const n = data.length
  const visible = resolved.filter((s) => !hidden.has(s.key))
  const catStagger = n > 1 ? (duration * 0.45) / (n - 1) : 0
  const segDur = stacked ? duration * 0.55 : duration * 0.8
  const entranceEnd = delay + (n - 1) * catStagger + segDur * (stacked ? visible.length : 1.3)

  useEffect(() => {
    if (!shown || still) return
    const id = setTimeout(() => setSettled(true), entranceEnd * 1000 + 100)
    return () => clearTimeout(id)
  }, [shown, still, entranceEnd])

  let lo = 0
  let hi = 0
  for (const row of data) {
    let pos = 0
    let neg = 0
    for (const s of visible) {
      const v = toNumber(row[s.key])
      if (stacked) {
        if (v >= 0) pos += v
        else neg += v
      } else {
        hi = Math.max(hi, v)
        lo = Math.min(lo, v)
      }
    }
    if (stacked) {
      hi = Math.max(hi, pos)
      lo = Math.min(lo, neg)
    }
  }
  if (hi === lo) hi = lo + 1
  const ticks = niceTicks(lo, hi, yTicks)
  const dLo = ticks[0]
  const dHi = ticks[ticks.length - 1]

  const cats = data.map((d) => String(d[index] ?? ""))
  const longestCat = Math.max(...cats.map((c) => c.length), 1)
  const longestTick = Math.max(...ticks.map((t) => axisFmt(t).length), 1)
  const valueLabelW = showValues ? longestTick * 6 + 10 : 0

  const padT = showValues && !horizontal ? 18 : 8
  const padR = horizontal ? Math.max(valueLabelW, 12) : 4
  const padL = showYAxis ? (horizontal ? longestCat : longestTick) * 6.4 + 14 : horizontal ? 2 : 4
  const svgH = height + (showXAxis ? 26 : 0) + (showValues && !horizontal && dLo < 0 ? 14 : 0)
  const plotW = Math.max(width - padL - padR, 1)
  const plotH = Math.max(height - padT, 1)

  const valueAt = (v: number) =>
    horizontal ? padL + ((v - dLo) / (dHi - dLo)) * plotW : height - ((v - dLo) / (dHi - dLo)) * plotH
  const zero = valueAt(Math.min(Math.max(0, dLo), dHi))
  const bandLen = horizontal ? plotH : plotW
  const bandOrigin = horizontal ? padT : padL
  const step = bandLen / Math.max(n, 1)
  const inner = step * (1 - Math.min(Math.max(categoryGap, 0), 0.8))
  const bandStart = (i: number) => bandOrigin + i * step + (step - inner) / 2

  const k = Math.max(visible.length, 1)
  const barW = stacked ? inner : Math.max((inner - barGap * (k - 1)) / k, 1)

  const rect = (pos: number, size: number, a: number, b: number) => {
    const v0 = Math.min(a, b)
    const len = Math.abs(a - b)
    return horizontal ? { x: v0, y: pos, w: len, h: size } : { x: pos, y: v0, w: size, h: len }
  }

  const bars: Bar[] = []
  data.forEach((row, ci) => {
    let slot = 0
    let pos = 0
    let neg = 0
    resolved.forEach((s, si) => {
      const on = !hidden.has(s.key)
      const v = on ? toNumber(row[s.key]) : 0
      let p: number
      let size: number
      let a: number
      let b: number
      if (stacked) {
        p = bandStart(ci)
        size = inner
        const from = v >= 0 ? pos : neg
        const to = from + v
        if (v >= 0) pos = to
        else neg = to
        a = valueAt(from)
        b = valueAt(to)
        const dir = Math.sign(b - a)
        const trim = Math.min(barGap / 2, Math.abs(b - a) / 2)
        if (from !== 0) a += dir * trim
        b -= dir * trim
      } else {
        p = bandStart(ci) + slot * (barW + barGap) - (on ? 0 : barGap / 2)
        size = on ? barW : 0
        a = zero
        b = valueAt(v)
      }
      if (on) slot++
      bars.push({ key: `${s.key}-${ci}`, si, ci, on, ...rect(p, size, a, b), start: rect(p, size, a, a) })
    })
  })

  const firstVals = series[0] ? data.map((d) => toNumber(d[series[0].key])) : []
  const first = firstVals[0] ?? 0
  const last = firstVals[firstVals.length - 1] ?? 0
  const headline =
    total === "none" || !firstVals.length ? undefined : total === "sum" ? firstVals.reduce((x, y) => x + y, 0) : last
  const deltaValue =
    delta === "auto" ? (firstVals.length > 1 && first !== 0 ? ((last - first) / Math.abs(first)) * 100 : undefined) : delta

  const legend = showLegend ?? series.length > 1
  const tracking = n > 0 && (showTooltip || highlight === "hover")
  const activeIdx = active !== null && active < n ? active : null
  const quick = still || settled

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!tracking) return
    const fwd = horizontal ? "ArrowDown" : "ArrowRight"
    const back = horizontal ? "ArrowUp" : "ArrowLeft"
    const moves: Record<string, (a: number | null) => number | null> = {
      [fwd]: (a) => (a === null ? 0 : Math.min(n - 1, a + 1)),
      [back]: (a) => (a === null ? n - 1 : Math.max(0, a - 1)),
      Home: () => 0,
      End: () => n - 1,
      Escape: () => null,
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    setActive(move)
  }

  const growth = (b: Bar) =>
    still
      ? { duration: 0 }
      : quick
        ? { type: "spring" as const, duration: 0.6, bounce: 0.15 }
        : {
            type: "spring" as const,
            duration: segDur,
            bounce: stacked ? 0.15 : 0.3,
            delay: delay + b.ci * catStagger + (stacked ? visible.filter((s) => resolved.indexOf(s) < b.si).length * segDur * 0.7 : b.si * 0.06),
          }

  const labelFor = (ci: number) => {
    const group = bars.filter((b) => b.ci === ci && b.on)
    if (!group.length) return null
    const row = data[ci]
    if (stacked) {
      const sum = visible.reduce((acc, s) => acc + toNumber(row[s.key]), 0)
      const ends = group.map((b) => (horizontal ? b.x + b.w : b.y))
      const end = horizontal ? Math.max(...ends) : Math.min(...ends)
      const c = bandStart(ci) + inner / 2
      return [{ key: `t-${ci}`, text: axisFmt(sum), x: horizontal ? end + 6 : c, y: horizontal ? c : end - 6, neg: false, delay: entranceEnd }]
    }
    return group.map((b) => {
      const v = toNumber(row[resolved[b.si].key])
      const neg = v < 0
      return horizontal
        ? { key: b.key, text: axisFmt(v), x: neg ? b.x - 6 : b.x + b.w + 6, y: b.y + b.h / 2, neg, delay: delay + b.ci * catStagger + segDur * 0.6 }
        : { key: b.key, text: axisFmt(v), x: b.x + b.w / 2, y: neg ? b.y + b.h + 13 : b.y - 6, neg, delay: delay + b.ci * catStagger + segDur * 0.6 }
    })
  }

  const activeBars = activeIdx === null ? [] : bars.filter((b) => b.ci === activeIdx && b.on)
  const bandCenter = activeIdx === null ? 0 : bandStart(activeIdx) + inner / 2
  let tipX = 0
  let tipY = 0
  if (activeIdx !== null) {
    if (horizontal) {
      tipX = activeBars.length ? Math.max(...activeBars.map((b) => b.x + b.w)) : zero
      tipY = bandCenter
    } else {
      const flip = bandCenter > width * 0.6
      tipX = flip ? bandStart(activeIdx) : bandStart(activeIdx) + inner
      const top = activeBars.length ? Math.min(...activeBars.map((b) => b.y)) : zero
      tipY = Math.min(Math.max(top + 24, 40), height - 40)
    }
  }

  const catEvery = horizontal
    ? Math.max(1, Math.ceil((n * 16) / plotH))
    : Math.max(1, Math.ceil((n * (longestCat * 6.6 + 12)) / plotW))
  const fade = (d: number) => (still ? { duration: 0 } : { duration: 0.5, delay: quick ? 0 : d })
  const morph = still ? { duration: 0 } : { type: "spring" as const, duration: 0.6, bounce: 0.1 }

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
      icon={icon === undefined ? <BarsGlyph /> : icon}
      radius={radius}
      bare={bare}
      className={className}
    >
      <div
        ref={ref}
        tabIndex={tracking ? 0 : undefined}
        role="group"
        aria-label={title ? `${title} chart` : "Bar chart"}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className="relative w-full touch-pan-y select-none rounded-md outline-offset-4 focus-visible:outline-2"
        style={{ height: svgH, outlineColor: theme.accent }}
      >
        {width > 0 && n > 0 && (
          <svg width={width} height={svgH} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
            <defs>
              {resolved.map((s) => (
                <ChartPattern key={s.key} id={`${uid}-p-${s.key}`} color={s.color} texture={s.texture} theme={theme} />
              ))}
            </defs>

            {tracking && (
              <motion.rect
                rx={Math.min(barRadius + 4, 12)}
                fill={theme.fg}
                pointerEvents="none"
                initial={false}
                animate={
                  horizontal
                    ? { x: padL - 4, width: plotW + 8, y: bandStart(activeIdx ?? 0) - 5, height: inner + 10, opacity: activeIdx === null ? 0 : 0.045 }
                    : { y: padT - 6, height: height - padT + 6, x: bandStart(activeIdx ?? 0) - 5, width: inner + 10, opacity: activeIdx === null ? 0 : 0.045 }
                }
                transition={still ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 45, opacity: { duration: 0.15 } }}
              />
            )}

            {showGrid &&
              ticks.map((v) => {
                const p = valueAt(v)
                const isZero = v === 0 && dLo < 0
                return (
                  <motion.line
                    key={v}
                    stroke={isZero ? theme.subtle : theme.grid}
                    strokeDasharray={isZero ? undefined : "3 4"}
                    initial={still ? false : horizontal ? { opacity: 0, x1: p, x2: p, y1: padT, y2: height } : { opacity: 0, y1: p, y2: p, x1: padL, x2: width - padR }}
                    animate={{ opacity: shown ? 1 : 0, ...(horizontal ? { x1: p, x2: p, y1: padT, y2: height } : { y1: p, y2: p, x1: padL, x2: width - padR }) }}
                    transition={{ ...morph, opacity: fade(delay) }}
                  />
                )
              })}

            {(horizontal ? showXAxis : showYAxis) &&
              ticks.map((v) => {
                const p = valueAt(v)
                return (
                  <motion.text
                    key={v}
                    fontSize={11}
                    fill={theme.muted}
                    className="tabular-nums"
                    textAnchor={horizontal ? "middle" : "end"}
                    dominantBaseline={horizontal ? "auto" : "middle"}
                    initial={still ? false : horizontal ? { opacity: 0, x: p, y: height + 19 } : { opacity: 0, x: padL - 10, y: p }}
                    animate={{ opacity: shown ? 1 : 0, ...(horizontal ? { x: p, y: height + 19 } : { x: padL - 10, y: p }) }}
                    transition={{ ...morph, opacity: fade(delay + 0.1) }}
                  >
                    {axisFmt(v)}
                  </motion.text>
                )
              })}

            {(horizontal ? showYAxis : showXAxis) &&
              cats.map((c, i) => {
                if (i % catEvery !== 0) return null
                const center = bandStart(i) + inner / 2
                return (
                  <motion.text
                    key={i}
                    fontSize={11}
                    fill={activeIdx === i ? theme.fg : theme.muted}
                    textAnchor={horizontal ? "end" : "middle"}
                    dominantBaseline={horizontal ? "middle" : "auto"}
                    initial={still ? false : { opacity: 0, x: horizontal ? padL - 10 : center, y: horizontal ? center : height + 19 }}
                    animate={{ opacity: shown ? 1 : 0, x: horizontal ? padL - 10 : center, y: horizontal ? center : height + 19 }}
                    transition={{ ...morph, opacity: fade(delay + i * catStagger) }}
                  >
                    {c}
                  </motion.text>
                )
              })}

            {bars.map((b) => {
              const s = resolved[b.si]
              const dim = highlight === "hover" && activeIdx !== null && activeIdx !== b.ci
              const target = shown ? b : b.start
              const grow = growth(b)
              const growDelay = "delay" in grow ? grow.delay : 0
              return (
                <motion.rect
                  key={b.key}
                  rx={barRadius}
                  fill={textureFill(`${uid}-p-${s.key}`, s.texture, s.color)}
                  stroke={s.texture === "solid" ? undefined : s.texture === "muted" ? theme.muted : s.color}
                  strokeOpacity={0.55}
                  strokeWidth={s.texture === "solid" ? 0 : 1}
                  pointerEvents="none"
                  initial={still ? false : { x: b.start.x, y: b.start.y, width: b.start.w, height: b.start.h, opacity: 0 }}
                  animate={{
                    x: target.x,
                    y: target.y,
                    width: target.w,
                    height: target.h,
                    opacity: !b.on || !shown ? 0 : dim ? 0.3 : 1,
                  }}
                  transition={{
                    ...grow,
                    opacity: still ? { duration: 0 } : { duration: 0.2, delay: quick || !b.on ? 0 : growDelay },
                  }}
                />
              )
            })}

            {showValues &&
              data.map((_, ci) =>
                labelFor(ci)?.map((l) => (
                  <motion.text
                    key={l.key}
                    fontSize={10.5}
                    fontWeight={500}
                    fill={theme.muted}
                    className="tabular-nums"
                    pointerEvents="none"
                    textAnchor={horizontal ? (l.neg ? "end" : "start") : "middle"}
                    dominantBaseline={horizontal ? "middle" : "auto"}
                    initial={still ? false : { opacity: 0, x: l.x, y: l.y }}
                    animate={{ opacity: shown ? (highlight === "hover" && activeIdx !== null && activeIdx !== ci ? 0.35 : 1) : 0, x: l.x, y: l.y }}
                    transition={{ ...morph, opacity: still ? { duration: 0 } : { duration: 0.3, delay: quick ? 0 : l.delay } }}
                  >
                    {l.text}
                  </motion.text>
                ))
              )}

            {tracking &&
              data.map((_, i) => (
                <rect
                  key={i}
                  fill="transparent"
                  onPointerEnter={() => setActive(i)}
                  {...(horizontal
                    ? { x: padL, width: plotW + padR, y: bandOrigin + i * step, height: step }
                    : { y: 0, height: svgH, x: bandOrigin + i * step, width: step })}
                />
              ))}
          </svg>
        )}

        <ChartTooltip
          open={showTooltip && activeIdx !== null && visible.length > 0}
          x={tipX}
          y={tipY}
          width={width}
          title={activeIdx === null ? undefined : cats[activeIdx]}
          rows={
            activeIdx === null
              ? []
              : visible.map((s) => ({ label: s.label, value: fmt(toNumber(data[activeIdx]?.[s.key])), color: s.color, texture: s.texture }))
          }
          theme={theme}
        />
      </div>

      {legend && (
        <div className="mt-4">
          <ChartLegend series={resolved} theme={theme} hidden={hidden} onToggle={toggle} patternPrefix={`${uid}-p`} />
        </div>
      )}
    </ChartCard>
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

function BarsGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M3 13V8M8 13V3M13 13V6" />
    </svg>
  )
}
