"use client"

import { useState } from "react"
import type { PropValue } from "@/lib/docs-types"

export type Values = Record<string, PropValue>
export type DemoProps = { values: Values }
export type DemoMap = Record<string, (props: DemoProps) => React.ReactNode>

// Playground values are validated by the control schema in lib/docs.ts
export function as<T>(values: Values) {
  return values as unknown as T
}

/** Scrollable stage so scroll-driven demos run inside the preview panel. */
export function ScrollStage({ children }: { children: (scroller: HTMLElement) => React.ReactNode }) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)

  return (
    <div
      ref={setScroller}
      className="mc-scroll h-full w-full self-stretch justify-self-stretch overflow-y-auto [container-type:size]"
    >
      <div className="grid h-[100cqh] place-items-center text-sm text-muted-foreground">
        <span className="animate-bounce">Scroll inside the preview ↓</span>
      </div>
      {scroller && children(scroller)}
      <div className="grid h-[70cqh] place-items-center text-sm text-muted-foreground">
        Normal scrolling resumes here.
      </div>
    </div>
  )
}
