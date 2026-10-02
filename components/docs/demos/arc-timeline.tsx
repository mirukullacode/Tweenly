"use client"

import { Code, Palette, RefreshCw, Rocket } from "lucide-react"
import { as, ScrollStage, type DemoMap } from "@/components/docs/demo-utils"
import { SmoothScroll } from "@/registry/new-york/smooth-scroll/smooth-scroll"
import { ArcSteps, type ArcStep, type ArcStepsProps } from "@/registry/new-york/arc-steps/arc-steps"
import {
  TimelineScroll,
  type TimelineScrollItem,
  type TimelineScrollProps,
} from "@/registry/new-york/timeline-scroll/timeline-scroll"

const STEPS: ArcStep[] = [
  { title: "Install", description: "One command adds the component and its dependencies to your project.", color: "#0a0a0a", foreground: "#ededed", icon: <Code /> },
  { title: "Customize", description: "It's your code. Tweak props, colors and timing until it feels like yours.", color: "#ff4d12", foreground: "#0a0a0a", icon: <Palette /> },
  { title: "Ship", description: "Server-rendered, accessible and light. Deploy it with the rest of your app.", color: "#f5f0e8", foreground: "#0a0a0a", icon: <Rocket /> },
  { title: "Iterate", description: "Pull updates when you want them, keep your changes when you don't.", color: "#1f3a2e", foreground: "#f5f0e8", icon: <RefreshCw /> },
]

const MILESTONES: TimelineScrollItem[] = [
  { year: 2019, tag: "Day one", title: "Founded", description: "Two engineers, one spare bedroom, a lot of coffee." },
  { year: 2020, tag: "Traction", title: "First 1,000 users", description: "Grew entirely by word of mouth in eight months." },
  { year: 2021, tag: "Funding", title: "Seed round", description: "$3M led by operators who had built it before." },
  { year: 2022, tag: "Team", title: "25 people", description: "Opened our first office and hired across four time zones." },
  { year: 2023, tag: "Funding", title: "Series A", description: "$18M to scale the platform and the team." },
  { year: 2024, tag: "Product", title: "Platform 2.0", description: "Rebuilt from the ground up, ten times faster." },
  { year: 2025, tag: "Scale", title: "Global launch", description: "Live in 40 countries with local payments." },
  { year: 2026, tag: "Today", title: "1M customers", description: "And we're just getting started." },
]

export const arcTimelineDemos: DemoMap = {
  "arc-steps": ({ values }) => (
    <ScrollStage>
      {(scroller) => (
        <SmoothScroll wrapper={scroller}>
          <ArcSteps {...as<Omit<ArcStepsProps, "steps">>(values)} steps={STEPS} scroller={scroller} height="100cqh" />
        </SmoothScroll>
      )}
    </ScrollStage>
  ),

  "timeline-scroll": ({ values }) => {
    const props = as<Omit<TimelineScrollProps, "items">>(values)
    if (props.mode === "drag") {
      // Drag mode doesn't pin, so it needs no scroll stage
      return (
        <div className="h-full w-full self-stretch justify-self-stretch [container-type:size]">
          <TimelineScroll {...props} items={MILESTONES} height="100cqh" />
        </div>
      )
    }
    return (
      <ScrollStage>
        {(scroller) => (
          <SmoothScroll wrapper={scroller}>
            <TimelineScroll {...props} items={MILESTONES} scroller={scroller} height="100cqh" />
          </SmoothScroll>
        )}
      </ScrollStage>
    )
  },
}
