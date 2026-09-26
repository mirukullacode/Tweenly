import { classNameProp, num, type ComponentDoc, type PropDoc } from "@/lib/docs-types"

const surfaceSelect = { type: "select", options: ["dark", "light"] } as const
const formatSelect = { type: "select", options: ["number", "compact", "percent", "currency"] } as const

/** Shared ChartBaseProps, with per-chart demo values and defaults. */
function baseProps(overrides: Partial<Record<string, Partial<PropDoc>>> = {}): PropDoc[] {
  const props: PropDoc[] = [
    { name: "title", type: "string", description: "Card heading.", control: { type: "text" } },
    { name: "description", type: "string", description: "Small line under the heading.", control: { type: "text" } },
    { name: "titleSize", type: `"hero" | "default"`, default: "default", description: "\"hero\" is a huge bold heading; \"default\" is a compact dashboard header.", control: { type: "select", options: ["default", "hero"] } },
    { name: "surface", type: `"dark" | "light"`, default: "dark", description: "Card surface.", control: surfaceSelect },
    { name: "accent", type: "string", default: "#FF4D12", description: "Main accent color.", control: { type: "color" } },
    { name: "palette", type: "string[]", description: "Colors in order; the first overrides the accent for the fill." },
    { name: "icon", type: "ReactNode", description: "Content of the round badge in the top-right corner. Pass null to hide it." },
    { name: "radius", type: "number", default: 28, description: "Card corner radius in px.", control: num(0, 40, 1, "px") },
    { name: "bare", type: "boolean", default: false, description: "Render only the chart, without the card.", control: { type: "boolean" } },
    { name: "animate", type: "boolean", default: true, description: "Play the entrance animation.", control: { type: "boolean" } },
    { name: "duration", type: "number", default: 1.2, description: "Entrance duration in seconds.", control: num(0.2, 4, 0.1, "s") },
    { name: "delay", type: "number", default: 0, description: "Delay before the entrance starts, in seconds.", control: num(0, 2, 0.1, "s") },
    { name: "once", type: "boolean", default: true, description: "Animate only the first time the chart enters view." },
    { name: "valueFormat", type: `"number" | "compact" | "percent" | "currency" | ((value: number) => string)`, default: "number", description: "How values are formatted in labels and tooltips.", control: formatSelect },
    { name: "currency", type: "string", default: "USD", description: "Currency code used when valueFormat is \"currency\".", control: { type: "text" } },
    { name: "decimals", type: "number", description: "Fraction digits for formatted values. Defaults to auto.", control: num(0, 4, 1) },
    classNameProp,
  ]
  return props.map((p) => (overrides[p.name] ? { ...p, ...overrides[p.name] } : p))
}

const kpiData = [
  { date: "Jun 01", revenue: 4210, previous: 3890 },
  { date: "Jun 02", revenue: 3980, previous: 4020 },
  { date: "Jun 03", revenue: 4630, previous: 3710 },
  { date: "Jun 04", revenue: 4890, previous: 3950 },
  { date: "Jun 05", revenue: 4420, previous: 4180 },
  { date: "Jun 06", revenue: 3610, previous: 3320 },
  { date: "Jun 07", revenue: 3340, previous: 3050 },
  { date: "Jun 08", revenue: 4750, previous: 3980 },
  { date: "Jun 09", revenue: 5120, previous: 4110 },
  { date: "Jun 10", revenue: 5380, previous: 4270 },
  { date: "Jun 11", revenue: 4960, previous: 4390 },
  { date: "Jun 12", revenue: 5570, previous: 4210 },
  { date: "Jun 13", revenue: 4280, previous: 3760 },
  { date: "Jun 14", revenue: 5840, previous: 3940 },
]

// Deterministic sample activity: 20 weeks ending Jun 29, 2025
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const heatmapData = (() => {
  const rand = seeded(7)
  const end = Date.UTC(2025, 5, 29)
  const rows: { date: string; count: number }[] = []
  for (let i = 139; i >= 0; i--) {
    const d = new Date(end - i * 86_400_000)
    const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6
    const r = rand()
    const busy = 1 + (139 - i) / 140
    const count = r < (weekend ? 0.55 : 0.18) ? 0 : Math.round(rand() * (weekend ? 4 : 11) * busy)
    rows.push({ date: d.toISOString().slice(0, 10), count })
  }
  return rows
})()

export const chartsStatsDocs: ComponentDoc[] = [
  {
    slug: "chart-kpi",
    name: "Chart KPI",
    exportName: "ChartKpi",
    description: "Stat card with a count-up headline, delta pill, halftone sparkline with scrubbing, and an optional goal bar.",
    category: "Charts",
    file: "registry/new-york/chart-kpi/chart-kpi.tsx",
    dependencies: ["motion"],
    staticProps: [`index="date"`, `valueKey="revenue"`, `compareKey="previous"`],
    isNew: true,
    props: [
      { name: "data", type: "ChartDatum[]", required: true, description: "Rows of data, oldest first.", control: { type: "data" }, demo: kpiData },
      { name: "index", type: "string", required: true, description: "Key holding each row's label, e.g. \"date\"." },
      { name: "valueKey", type: "string", required: true, description: "Key holding the metric." },
      { name: "compareKey", type: "string", description: "Key holding the previous period, drawn as a dashed line and used for the delta." },
      { name: "aggregate", type: `"sum" | "last" | "average"`, default: "sum", description: "How rows combine into the headline figure.", control: { type: "select", options: ["sum", "last", "average"] } },
      { name: "delta", type: `number | "auto"`, default: "auto", description: "Change in percent. \"auto\" compares with compareKey, or the first row with the last." },
      { name: "goal", type: "number", demo: 70000, description: "Target for the headline; shows a thin progress bar.", control: num(0, 200000, 1000) },
      { name: "sparkline", type: `"area" | "line" | "bars"`, default: "area", description: "Sparkline style. \"area\" uses a halftone dot fill.", control: { type: "select", options: ["area", "line", "bars"] } },
      { name: "curve", type: `"smooth" | "linear" | "step"`, default: "smooth", description: "Line interpolation.", control: { type: "select", options: ["smooth", "linear", "step"] } },
      { name: "sparkHeight", type: "number", default: 64, demo: 72, description: "Sparkline height in px.", control: num(32, 160, 4, "px") },
      { name: "showTooltip", type: "boolean", default: true, description: "Scrub the sparkline to see each row.", control: { type: "boolean" } },
      { name: "layout", type: `"stacked" | "inline"`, default: "stacked", description: "Sparkline under the number, or beside it.", control: { type: "select", options: ["stacked", "inline"] } },
      { name: "trendColor", type: `"accent" | "semantic"`, default: "accent", description: "\"semantic\" paints rises green and falls red.", control: { type: "select", options: ["accent", "semantic"] } },
      ...baseProps({
        title: { demo: "Revenue" },
        description: { demo: "Last 14 days" },
        valueFormat: { demo: "currency" },
      }),
    ],
  },
  {
    slug: "chart-heatmap",
    name: "Chart Heatmap",
    exportName: "ChartHeatmap",
    description: "GitHub-style contribution calendar with hatched empty days, a diagonal reveal wave, and hover tooltips.",
    category: "Charts",
    file: "registry/new-york/chart-heatmap/chart-heatmap.tsx",
    dependencies: ["motion"],
    staticProps: [`dateKey="date"`, `valueKey="count"`],
    isNew: true,
    props: [
      { name: "data", type: "ChartDatum[]", required: true, description: "Rows like { date: \"2025-06-01\", count: 4 }. Missing days count as zero; dates are read as UTC.", control: { type: "data" }, demo: heatmapData },
      { name: "dateKey", type: "string", default: "date", description: "Key holding an ISO date (YYYY-MM-DD) or a timestamp." },
      { name: "valueKey", type: "string", default: "count", description: "Key holding the value for that day." },
      { name: "weeks", type: "number", default: 20, description: "Weeks shown, ending at the latest date.", control: num(4, 53, 1) },
      { name: "levels", type: "number", default: 5, description: "Color steps, including the empty step.", control: num(2, 9, 1) },
      { name: "cellSize", type: "number", default: 12, demo: 14, description: "Cell size in px.", control: num(6, 24, 1, "px") },
      { name: "cellGap", type: "number", default: 3, description: "Space between cells in px.", control: num(0, 8, 1, "px") },
      { name: "cellRadius", type: "number", default: 3, description: "Cell corner radius in px.", control: num(0, 12, 1, "px") },
      { name: "weekStart", type: "0 | 1", default: 0, description: "First day of the week: 0 = Sunday, 1 = Monday.", control: num(0, 1, 1) },
      { name: "showMonthLabels", type: "boolean", default: true, description: "Show month names above the grid.", control: { type: "boolean" } },
      { name: "showDayLabels", type: "boolean", default: true, description: "Show Mon / Wed / Fri beside the grid.", control: { type: "boolean" } },
      { name: "emptyTexture", type: `"solid" | "hatch"`, default: "hatch", description: "Fill of days with no activity.", control: { type: "select", options: ["hatch", "solid"] } },
      { name: "scale", type: `"linear" | "quantile"`, default: "linear", description: "\"quantile\" spreads colors evenly across your data; \"linear\" scales to the busiest day.", control: { type: "select", options: ["linear", "quantile"] } },
      { name: "showTooltip", type: "boolean", default: true, description: "Show a tooltip on hover.", control: { type: "boolean" } },
      { name: "showLegend", type: "boolean", default: true, description: "Show the Less / More key.", control: { type: "boolean" } },
      { name: "showTotal", type: "boolean", default: true, description: "Show the total for the range as the headline.", control: { type: "boolean" } },
      { name: "unit", type: "string", default: "contributions", description: "Word used in the tooltip.", control: { type: "text" } },
      ...baseProps({
        title: { demo: "Contributions" },
        description: { demo: "Last 20 weeks" },
      }),
    ],
  },
  {
    slug: "chart-progress",
    name: "Chart Progress",
    exportName: "ChartProgress",
    description: "Progress toward a real target: a wavy, grainy fill over a hatched remainder, with a thermometer marker, quota line and stacked segments.",
    category: "Charts",
    file: "registry/new-york/chart-progress/chart-progress.tsx",
    dependencies: ["motion"],
    isNew: true,
    props: [
      { name: "value", type: "number", required: true, demo: 68400, description: "Current amount, in the same unit as max. Ignored when segments are given.", control: num(0, 150000, 100) },
      { name: "max", type: "number", default: 100, demo: 100000, description: "Amount that fills the bar.", control: num(1, 200000, 100) },
      { name: "target", type: "number", demo: 80000, description: "Marker for a goal or quota, in the same unit as value.", control: num(0, 200000, 100) },
      { name: "targetLabel", type: "string", default: "Target", demo: "Quota", description: "Label of the target marker.", control: { type: "text" } },
      { name: "label", type: "string", default: "Progress", demo: "Closed won", description: "Caption above the bar.", control: { type: "text" } },
      { name: "showPercent", type: "boolean", default: true, description: "Show the share of max as a big percentage.", control: { type: "boolean" } },
      { name: "segments", type: "{ label: string; value: number }[]", description: "Split the fill into stacked, textured parts with a legend; their sum becomes the value." },
      { name: "thickness", type: "number", default: 40, description: "Bar thickness in px.", control: num(8, 72, 1, "px") },
      { name: "length", type: "number", default: 220, description: "Bar length in px when vertical.", control: num(120, 400, 10, "px") },
      { name: "texture", type: `"wave" | "solid" | "grain"`, default: "wave", description: "Look of the fill.", control: { type: "select", options: ["wave", "grain", "solid"] } },
      { name: "remainder", type: `"hatch" | "track" | "none"`, default: "hatch", description: "Look of the unfilled part.", control: { type: "select", options: ["hatch", "track", "none"] } },
      { name: "showMarker", type: "boolean", default: true, description: "Show the thermometer marker at the end of the fill.", control: { type: "boolean" } },
      { name: "orientation", type: `"horizontal" | "vertical"`, default: "horizontal", description: "Bar direction.", control: { type: "select", options: ["horizontal", "vertical"] } },
      ...baseProps({
        title: { demo: "Sales quota" },
        description: { demo: "Q3 · 23 days left" },
        titleSize: { demo: "hero" },
        duration: { default: 1.4 },
        valueFormat: { demo: "currency" },
      }),
    ],
  },
  {
    slug: "chart-dots",
    name: "Chart Dots",
    exportName: "ChartDots",
    description: "Dot matrix of filled versus hatched units with a partial last dot, spring wave in fill order, and a huge count-up figure.",
    category: "Charts",
    file: "registry/new-york/chart-dots/chart-dots.tsx",
    dependencies: ["motion"],
    isNew: true,
    props: [
      { name: "value", type: "number", required: true, demo: 41, description: "Filled amount, e.g. 41 seats.", control: num(0, 500, 1) },
      { name: "total", type: "number", default: 100, demo: 50, description: "Amount that fills every dot, e.g. 50 seats.", control: num(1, 500, 1) },
      { name: "columns", type: "number", default: 6, description: "Dots per row.", control: num(1, 16, 1) },
      { name: "rows", type: "number", default: 4, description: "Number of rows.", control: num(1, 12, 1) },
      { name: "partial", type: "boolean", default: true, description: "Show a fractional share as a partly filled dot.", control: { type: "boolean" } },
      { name: "caption", type: "string", default: "Pattern Hero", demo: "Seats filled", description: "Text under the headline figure.", control: { type: "text" } },
      { name: "display", type: `"percent" | "value" | "fraction"`, default: "percent", description: "Headline as a percentage, the raw value, or \"value/total\".", control: { type: "select", options: ["percent", "value", "fraction"] } },
      { name: "shape", type: `"circle" | "square" | "rounded"`, default: "circle", description: "Dot shape.", control: { type: "select", options: ["circle", "rounded", "square"] } },
      { name: "emptyTexture", type: `"hatch" | "track"`, default: "hatch", description: "Fill of empty dots.", control: { type: "select", options: ["hatch", "track"] } },
      { name: "order", type: `"row" | "column" | "spiral"`, default: "row", description: "Order in which dots fill.", control: { type: "select", options: ["row", "column", "spiral"] } },
      { name: "gap", type: "number", default: 10, description: "Space between dots in px.", control: num(0, 32, 1, "px") },
      ...baseProps(),
    ],
  },
]
