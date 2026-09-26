"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChartLine } from "@/registry/new-york/chart-line/chart-line"
import { ChartDots } from "@/registry/new-york/chart-dots/chart-dots"
import { ChartKpi } from "@/registry/new-york/chart-kpi/chart-kpi"
import { ChartRadial } from "@/registry/new-york/chart-radial/chart-radial"
import { OtpInput } from "@/registry/new-york/otp-input/otp-input"
import { SegmentedControl } from "@/registry/new-york/segmented-control/segmented-control"
import { ElasticSwitch } from "@/registry/new-york/elastic-switch/elastic-switch"
import { NumberStepper } from "@/registry/new-york/number-stepper/number-stepper"
import { LikeButton } from "@/registry/new-york/like-button/like-button"
import { Rating } from "@/registry/new-york/rating/rating"
import { ShineButton } from "@/registry/new-york/shine-button/shine-button"
import { HoldButton } from "@/registry/new-york/hold-button/hold-button"
import { SlideButton } from "@/registry/new-york/slide-button/slide-button"

const verify = (code: string) => new Promise<boolean>((r) => setTimeout(() => r(code === "123456"), 900))

function Tile({ href, label, className, children }: {
  href: string
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("group relative flex min-h-80 flex-col overflow-hidden rounded-3xl border bg-card/40", className)}>
      <div className="grid flex-1 place-items-center p-6">{children}</div>
      <Link
        href={href}
        className="flex items-center justify-between border-t px-5 py-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="font-medium text-foreground">{label}</span>
        <ArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}

const REVENUE = [
  { month: "Jan", revenue: 18600, expenses: 12400 },
  { month: "Feb", revenue: 21400, expenses: 13100 },
  { month: "Mar", revenue: 19800, expenses: 12900 },
  { month: "Apr", revenue: 24300, expenses: 14200 },
  { month: "May", revenue: 27900, expenses: 15100 },
  { month: "Jun", revenue: 26100, expenses: 15800 },
  { month: "Jul", revenue: 31200, expenses: 16400 },
  { month: "Aug", revenue: 34800, expenses: 17000 },
]

const BROWSERS = [
  { browser: "Chrome", visitors: 275 },
  { browser: "Safari", visitors: 200 },
  { browser: "Firefox", visitors: 187 },
  { browser: "Edge", visitors: 173 },
  { browser: "Other", visitors: 90 },
]

const DAILY = [
  4210, 3980, 4420, 4610, 4390, 5020, 5310, 4880, 5140, 5470, 5290, 5820, 6010, 6240,
].map((revenue, i) => ({ date: `Jun ${String(i + 1).padStart(2, "0")}`, revenue, previous: Math.round(revenue * 0.86) }))

export function Bento() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <Tile href="/docs/components/chart-line" label="Chart Line">
        <ChartLine
          data={REVENUE}
          index="month"
          series={[
            { key: "revenue", label: "Revenue" },
            { key: "expenses", label: "Expenses" },
          ]}
          title="Revenue"
          description="Jan – Aug 2025"
          valueFormat="currency"
          surface="light"
          height={150}
          showYAxis={false}
        />
      </Tile>

      <Tile href="/docs/components/otp-input" label="OTP Input" className="lg:col-span-2">
        <div className="flex flex-col items-center gap-5 text-center">
          <div>
            <p className="text-lg font-semibold tracking-tight">Check your inbox</p>
            <p className="mt-1 text-sm text-muted-foreground">Try 123456, anything else shakes.</p>
          </div>
          <OtpInput verify={verify} />
        </div>
      </Tile>

      <Tile href="/docs/components/segmented-control" label="Controls" className="lg:col-span-2">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <SegmentedControl
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
            defaultValue="week"
          />
          <div className="flex items-center gap-6">
            <ElasticSwitch defaultChecked icons />
            <NumberStepper defaultValue={3} />
            <LikeButton />
          </div>
          <Rating defaultValue={3.5} />
        </div>
      </Tile>

      <Tile href="/docs/components/chart-kpi" label="Chart KPI">
        <ChartKpi
          data={DAILY}
          index="date"
          valueKey="revenue"
          compareKey="previous"
          title="Revenue"
          description="Last 14 days"
          valueFormat="currency"
          goal={80000}
        />
      </Tile>

      <Tile href="/docs/components/chart-radial" label="Chart Radial">
        <ChartRadial data={BROWSERS} nameKey="browser" valueKey="visitors" title="Traffic" description="By browser" size={170} />
      </Tile>

      <Tile href="/docs/components/chart-dots" label="Chart Dots">
        <ChartDots value={41} total={50} caption="Seats filled" display="fraction" />
      </Tile>

      <Tile href="/docs/components/hold-button" label="Buttons" className="md:col-span-2 lg:col-span-1">
        <div className="flex flex-col items-center gap-4">
          <ShineButton>Shine on</ShineButton>
          <HoldButton />
          <SlideButton width={250} />
        </div>
      </Tile>
    </div>
  )
}
