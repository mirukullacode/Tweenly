"use client"

import { as, type DemoMap } from "@/components/docs/demo-utils"
import { ChartRadial, type ChartRadialProps } from "@/registry/new-york/chart-radial/chart-radial"
import { ChartRings, type ChartRingsProps } from "@/registry/new-york/chart-rings/chart-rings"
import { ChartRadar, type ChartRadarProps } from "@/registry/new-york/chart-radar/chart-radar"

const RADAR_SERIES: ChartRadarProps["series"] = [
  { key: "team", label: "Team" },
  { key: "benchmark", label: "Benchmark" },
]

export const chartsPolarDemos: DemoMap = {
  "chart-radial": ({ values }) => (
    <ChartRadial
      {...as<ChartRadialProps>(values)}
      nameKey="browser"
      valueKey="visitors"
      className="w-full max-w-[460px]"
    />
  ),

  "chart-rings": ({ values }) => (
    <ChartRings
      {...as<ChartRingsProps>(values)}
      nameKey="goal"
      valueKey="value"
      maxKey="target"
      className="w-full max-w-[460px]"
    />
  ),

  "chart-radar": ({ values }) => (
    <ChartRadar
      {...as<ChartRadarProps>(values)}
      index="metric"
      series={RADAR_SERIES}
      className="w-full max-w-[460px]"
    />
  ),
}
