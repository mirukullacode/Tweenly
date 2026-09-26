import { classNameProp, num, type ComponentDoc, type PropDoc } from "@/lib/docs-types"

const revenue = [
  { month: "Jan", revenue: 18600, expenses: 12400 },
  { month: "Feb", revenue: 21400, expenses: 13100 },
  { month: "Mar", revenue: 19800, expenses: 12900 },
  { month: "Apr", revenue: 24300, expenses: 14200 },
  { month: "May", revenue: 26900, expenses: 15600 },
  { month: "Jun", revenue: 25100, expenses: 15100 },
  { month: "Jul", revenue: 28700, expenses: 16300 },
  { month: "Aug", revenue: 31200, expenses: 17000 },
  { month: "Sep", revenue: 29400, expenses: 16800 },
  { month: "Oct", revenue: 33800, expenses: 18200 },
  { month: "Nov", revenue: 36100, expenses: 19400 },
  { month: "Dec", revenue: 39500, expenses: 20600 },
]

const visitors = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
]

const bool = { type: "boolean" } as const
const text = { type: "text" } as const

/** ChartBaseProps shared by every chart. */
function baseProps(demo: { title: string; description: string; valueFormat: string }): PropDoc[] {
  return [
    { name: "title", type: "string", demo: demo.title, description: "Card heading.", control: text },
    { name: "description", type: "string", demo: demo.description, description: "Small line under the heading.", control: text },
    { name: "titleSize", type: `"hero" | "default"`, default: "default", description: `"hero" is a huge bold heading; "default" is a compact dashboard header.`, control: { type: "select", options: ["default", "hero"] } },
    { name: "surface", type: `"dark" | "light"`, default: "dark", description: "Card surface.", control: { type: "select", options: ["dark", "light"] } },
    { name: "accent", type: "string", default: "#FF4D12", description: "Main accent color; the series palette is derived from it.", control: { type: "color" } },
    { name: "palette", type: "string[]", description: "Series colors in order; overrides the accent-derived palette." },
    { name: "icon", type: "ReactNode", description: "Content of the round badge in the top-right corner. Pass null to hide it." },
    { name: "radius", type: "number", default: 28, description: "Card corner radius in px.", control: num(0, 40, 1, "px") },
    { name: "bare", type: "boolean", default: false, description: "Render only the chart, without the card.", control: bool },
    { name: "valueFormat", type: `"number" | "compact" | "percent" | "currency" | ((value: number) => string)`, default: "number", demo: demo.valueFormat, description: "How values are formatted in the headline, labels and tooltip. Axis labels use a compact variant.", control: { type: "select", options: ["number", "compact", "percent", "currency"] } },
    { name: "currency", type: "string", default: "USD", description: `Currency code used when valueFormat is "currency".`, control: text },
    { name: "decimals", type: "number", description: "Fraction digits for formatted values. Defaults to auto." },
    { name: "animate", type: "boolean", default: true, description: "Play the entrance animation. Reduced motion always disables it.", control: bool },
    { name: "duration", type: "number", default: 1.2, description: "Entrance duration in seconds.", control: num(0.2, 4, 0.1, "s") },
    { name: "delay", type: "number", default: 0, description: "Delay before the entrance starts, in seconds.", control: num(0, 2, 0.1, "s") },
    { name: "once", type: "boolean", default: true, description: "Animate only the first time the chart enters view.", control: bool },
    classNameProp,
  ]
}

const headlineProps = (total: string): PropDoc[] => [
  { name: "total", type: `"sum" | "last" | "none"`, default: total, description: "Headline figure computed from the first series.", control: { type: "select", options: ["sum", "last", "none"] } },
  { name: "delta", type: `number | "auto"`, default: "auto", description: `Change pill next to the headline, in percent. "auto" compares the first and last value of the first series.` },
]

export const chartsCartesianDocs: ComponentDoc[] = [
  {
    slug: "chart-line",
    name: "Chart Line",
    exportName: "ChartLine",
    description: "Multi-series line and area chart from plain row data, with draw-in lines, halftone fills, a snapping crosshair tooltip and a toggleable legend.",
    category: "Charts",
    file: "registry/new-york/chart-line/chart-line.tsx",
    dependencies: ["motion"],
    isNew: true,
    staticProps: [
      `index="month"`,
      `series={[{ key: "revenue", label: "Revenue" }, { key: "expenses", label: "Expenses" }]}`,
    ],
    props: [
      { name: "data", type: "ChartDatum[]", required: true, control: { type: "data" }, demo: revenue, description: "Rows of data. Each row holds the index value and one number per series." },
      { name: "index", type: "string", required: true, description: "Key in each row used for the x-axis labels." },
      { name: "series", type: "ChartSeries[]", required: true, description: "Keys to plot: { key, label?, color?, texture? }. One line per series." },
      { name: "curve", type: `"smooth" | "linear" | "step"`, default: "smooth", description: "Line interpolation. Smooth is monotone, so it never overshoots the data.", control: { type: "select", options: ["smooth", "linear", "step"] } },
      { name: "fill", type: `"none" | "gradient" | "dots" | "hatch"`, default: "dots", description: "Area under each line.", control: { type: "select", options: ["dots", "gradient", "hatch", "none"] } },
      { name: "strokeWidth", type: "number", default: 2.5, description: "Line thickness in px.", control: num(1, 6, 0.5, "px") },
      { name: "showPoints", type: `"none" | "hover" | "all" | "last"`, default: "last", description: `Which points get a marker. "last" pulses at the end of the first series.`, control: { type: "select", options: ["last", "all", "hover", "none"] } },
      { name: "showTooltip", type: "boolean", default: true, description: "Crosshair and tooltip on hover. Arrow keys move it when the chart is focused.", control: bool },
      { name: "showLegend", type: "boolean", demo: true, description: "Toggleable legend. Defaults to true when there is more than one series.", control: bool },
      { name: "showGrid", type: "boolean", default: true, description: "Horizontal grid lines at each y tick.", control: bool },
      { name: "showXAxis", type: "boolean", default: true, description: "Index labels under the plot.", control: bool },
      { name: "showYAxis", type: "boolean", default: true, description: "Value labels left of the plot.", control: bool },
      { name: "yTicks", type: "number", default: 4, description: "Approximate number of y-axis ticks.", control: num(2, 8, 1) },
      { name: "yMin", type: "number", description: "Lower bound of the y domain. Defaults to 0, or a nice minimum for negative data." },
      { name: "yMax", type: "number", description: "Upper bound of the y domain. Defaults to a nice maximum above the data." },
      { name: "xLabelEvery", type: "number", description: "Show every nth x label. Defaults to auto-thinning based on width." },
      { name: "height", type: "number", default: 220, description: "Plot height in px, excluding the x-axis.", control: num(120, 400, 10, "px") },
      ...headlineProps("last"),
      ...baseProps({ title: "Revenue", description: "Jan – Dec 2025", valueFormat: "currency" }),
    ],
  },
  {
    slug: "chart-bar",
    name: "Chart Bar",
    exportName: "ChartBar",
    description: "Grouped or stacked bar chart, vertical or horizontal, with springy staggered growth, textured series, hover highlight and a toggleable legend.",
    category: "Charts",
    file: "registry/new-york/chart-bar/chart-bar.tsx",
    dependencies: ["motion"],
    isNew: true,
    staticProps: [
      `index="month"`,
      `series={[{ key: "desktop", label: "Desktop" }, { key: "mobile", label: "Mobile" }]}`,
    ],
    props: [
      { name: "data", type: "ChartDatum[]", required: true, control: { type: "data" }, demo: visitors, description: "Rows of data. Each row holds the index value and one number per series. Negative values grow down from a zero line." },
      { name: "index", type: "string", required: true, description: "Key in each row used for the category labels." },
      { name: "series", type: "ChartSeries[]", required: true, description: "Keys to plot: { key, label?, color?, texture? }. Textures default to solid, hatch, muted." },
      { name: "layout", type: `"vertical" | "horizontal"`, default: "vertical", description: `"vertical" draws columns, "horizontal" draws rows.`, control: { type: "select", options: ["vertical", "horizontal"] } },
      { name: "stacked", type: "boolean", default: false, description: "Stack series instead of grouping them side by side.", control: bool },
      { name: "barRadius", type: "number", default: 6, description: "Bar corner radius in px.", control: num(0, 16, 1, "px") },
      { name: "barGap", type: "number", default: 4, description: "Gap between bars in a group, or between segments in a stack, in px.", control: num(0, 12, 1, "px") },
      { name: "categoryGap", type: "number", default: 0.3, description: "Share of each category slot left empty.", control: num(0, 0.8, 0.05) },
      { name: "showValues", type: "boolean", default: false, description: "Value labels at the end of each bar (each stack when stacked).", control: bool },
      { name: "highlight", type: `"hover" | "none"`, default: "hover", description: `"hover" dims the other categories while one is hovered.`, control: { type: "select", options: ["hover", "none"] } },
      { name: "showTooltip", type: "boolean", default: true, description: "Tooltip on hover. Arrow keys move it when the chart is focused.", control: bool },
      { name: "showLegend", type: "boolean", demo: true, description: "Toggleable legend. Defaults to true when there is more than one series.", control: bool },
      { name: "showGrid", type: "boolean", default: true, description: "Grid lines at each value tick.", control: bool },
      { name: "showXAxis", type: "boolean", default: true, description: "Bottom axis labels (categories when vertical, values when horizontal).", control: bool },
      { name: "showYAxis", type: "boolean", default: true, description: "Left axis labels (values when vertical, categories when horizontal).", control: bool },
      { name: "yTicks", type: "number", default: 4, description: "Approximate number of value-axis ticks.", control: num(2, 8, 1) },
      { name: "height", type: "number", default: 220, description: "Plot height in px, excluding the bottom axis.", control: num(120, 400, 10, "px") },
      ...headlineProps("sum"),
      ...baseProps({ title: "Visitors", description: "January – June 2025", valueFormat: "number" }),
    ],
  },
]
