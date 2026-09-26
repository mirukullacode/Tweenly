"use client"

import { FillButton } from "@/registry/new-york/fill-button/fill-button"

const DIRECTIONS = ["up", "down", "left", "right"] as const

export function FillButtonDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl border bg-muted p-12">
      {DIRECTIONS.map((d) => (
        <FillButton key={d} direction={d}>
          Fill {d}
        </FillButton>
      ))}
      <FillButton duration={0.9} ease="elastic.out(1, 0.6)">
        Elastic
      </FillButton>
    </div>
  )
}