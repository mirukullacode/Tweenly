"use client"

import { as, type DemoMap } from "@/components/docs/demo-utils"
import { ChartKpi, type ChartKpiProps } from "@/registry/new-york/chart-kpi/chart-kpi"
import { ChartHeatmap, type ChartHeatmapProps } from "@/registry/new-york/chart-heatmap/chart-heatmap"
import { ChartProgress, type ChartProgressProps } from "@/registry/new-york/chart-progress/chart-progress"
import { ChartDots, type ChartDotsProps } from "@/registry/new-york/chart-dots/chart-dots"

export const chartsStatsDemos: DemoMap = {
  "chart-kpi": ({ values }) => (
    <div className="grid w-full place-items-center p-6">
      <ChartKpi
        {...as<Omit<ChartKpiProps, "index" | "valueKey" | "compareKey">>(values)}
        index="date"
        valueKey="revenue"
        compareKey="previous"
        className="w-full max-w-105"
      />
    </div>
  ),

  "chart-heatmap": ({ values }) => (
    <div className="grid w-full place-items-center p-6">
      <ChartHeatmap {...as<ChartHeatmapProps>(values)} dateKey="date" valueKey="count" className="w-full max-w-130" />
    </div>
  ),

  "chart-progress": ({ values }) => (
    <div className="grid w-full place-items-center p-6">
      <ChartProgress
        {...as<ChartProgressProps>(values)}
        className={as<ChartProgressProps>(values).orientation === "vertical" ? "w-auto max-w-105" : "w-full max-w-105"}
      />
    </div>
  ),

  "chart-dots": ({ values }) => (
    <div className="grid w-full place-items-center p-6">
      <ChartDots {...as<ChartDotsProps>(values)} className="w-full max-w-90" />
    </div>
  ),
}
