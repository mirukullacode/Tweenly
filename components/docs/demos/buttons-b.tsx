"use client"

import { CalendarDays, CalendarRange, Clock } from "lucide-react"
import { as, type DemoMap } from "@/components/docs/demo-utils"
import {
  SegmentedControl,
  type SegmentedControlOption,
  type SegmentedControlProps,
} from "@/registry/new-york/segmented-control/segmented-control"
import { NumberStepper, type NumberStepperProps } from "@/registry/new-york/number-stepper/number-stepper"
import { ElasticSwitch, type ElasticSwitchProps } from "@/registry/new-york/elastic-switch/elastic-switch"
import { ExpandInput, type ExpandInputProps } from "@/registry/new-york/expand-input/expand-input"
import { Rating, type RatingProps } from "@/registry/new-york/rating/rating"

const OPTIONS: SegmentedControlOption[] = [
  { value: "day", label: "Day", icon: <Clock /> },
  { value: "week", label: "Week", icon: <CalendarRange /> },
  { value: "month", label: "Month", icon: <CalendarDays /> },
]

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground">{children}</p>
)

export const buttonsBDemos: DemoMap = {
  "segmented-control": ({ values }) => (
    <div className="flex flex-col items-center gap-4">
      <SegmentedControl
        {...as<Omit<SegmentedControlProps, "options">>(values)}
        options={OPTIONS}
        aria-label="Time range"
      />
      <Hint>Click or use the arrow keys</Hint>
    </div>
  ),

  "number-stepper": ({ values }) => (
    <div className="flex flex-col items-center gap-4">
      <NumberStepper {...as<NumberStepperProps>(values)} />
      <Hint>Hold a button to repeat</Hint>
    </div>
  ),

  "elastic-switch": ({ values }) => <ElasticSwitch {...as<ElasticSwitchProps>(values)} />,

  "expand-input": ({ values }) => (
    <div className="flex flex-col items-center gap-4">
      <ExpandInput
        {...as<Omit<ExpandInputProps, "onSubmit">>(values)}
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 900))}
      />
      <Hint>Press Escape to collapse</Hint>
    </div>
  ),

  rating: ({ values }) => (
    <div className="flex flex-col items-center gap-4">
      <Rating {...as<RatingProps>(values)} />
      <Hint>Hover, click, or use the arrow keys</Hint>
    </div>
  ),
}
