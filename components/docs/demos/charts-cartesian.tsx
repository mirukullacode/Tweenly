"use client"

import { as, type DemoMap } from "@/components/docs/demo-utils"
import { ChartLine, type ChartLineProps } from "@/registry/new-york/chart-line/chart-line"
import { ChartBar, type ChartBarProps } from "@/registry/new-york/chart-bar/chart-bar"

const LINE_SERIES = [
  { key: "revenue", label: "Revenue" },
  { key: "expenses", label: "Expenses" },
]

const BAR_SERIES = [
  { key: "desktop", label: "Desktop" },
  { key: "mobile", label: "Mobile" },
]

export const chartsCartesianDemos: DemoMap = {
  "chart-line": ({ values }) => (
    <div className="w-full max-w-130">
      <ChartLine {...as<Omit<ChartLineProps, "index" | "series">>(values)} index="month" series={LINE_SERIES} />
    </div>
  ),
  "chart-bar": ({ values }) => (
    <div className="w-full max-w-130">
      <ChartBar {...as<Omit<ChartBarProps, "index" | "series">>(values)} index="month" series={BAR_SERIES} />
    </div>
  ),
}
