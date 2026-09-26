"use client"

import { useState } from "react"
import { FadeIn } from "@/registry/new-york/fade-in/fade-in"
import type {
  FadeInDirection,
  FadeInEase,
} from "@/registry/new-york/fade-in/fade-in"

const DIRECTIONS: FadeInDirection[] = ["up", "down", "left", "right", "none"]
const EASES: FadeInEase[] = ["smooth", "snappy", "linear", "spring"]

export function FadeInPlayground() {
  const [direction, setDirection] = useState<FadeInDirection>("up")
  const [ease, setEase] = useState<FadeInEase>("smooth")
  const [duration, setDuration] = useState(0.6)
  const [distance, setDistance] = useState(40)
  const [blur, setBlur] = useState(0)
  const [runId, setRunId] = useState(0)

  return (
    <div className="space-y-6 rounded-xl border p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Direction</span>
          <select
            className="w-full rounded-md border bg-background p-2"
            value={direction}
            onChange={(e) => setDirection(e.target.value as FadeInDirection)}
          >
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Ease</span>
          <select
            className="w-full rounded-md border bg-background p-2"
            value={ease}
            onChange={(e) => setEase(e.target.value as FadeInEase)}
          >
            {EASES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Duration: {duration}s</span>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Distance: {distance}px</span>
          <input
            type="range"
            min={0}
            max={120}
            step={4}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Blur: {blur}px</span>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={blur}
            onChange={(e) => setBlur(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Replay
          </button>
        </div>
      </div>

      <div className="flex h-56 items-center justify-center overflow-hidden rounded-lg bg-muted">
        <FadeIn
          key={`${runId}-${direction}-${ease}-${duration}-${distance}-${blur}`}
          direction={direction}
          ease={ease}
          duration={duration}
          distance={distance}
          blur={blur}
        >
          <div className="rounded-xl border bg-background px-8 py-6 text-xl font-semibold shadow-sm">
            Hello, motioncn
          </div>
        </FadeIn>
      </div>

      <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
        {`<FadeIn direction="${direction}" ease="${ease}" duration={${duration}} distance={${distance}} blur={${blur}}>
  ...
</FadeIn>`}
      </pre>
    </div>
  )
}