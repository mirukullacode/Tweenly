"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { RotateCcw } from "lucide-react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { ACCENT, ENTER, WindowFrame } from "./shared"

const COMMAND = "npx forge clone repo"
const TICK = 45
const TYPE_END = COMMAND.length + 4
// Tick at which each output line appears
const LINES: { at: number; text: string; tone?: "success" }[] = [
  { at: TYPE_END + 6, text: "Cloning repository..." },
  { at: TYPE_END + 14, text: "deltas" },
  { at: TYPE_END + 40, text: "Analyzing codebase..." },
  { at: TYPE_END + 54, text: "Setting up AI agent..." },
  { at: TYPE_END + 68, text: "✓ Repository cloned successfully", tone: "success" },
]
const DELTA_START = TYPE_END + 14
const DELTA_END = TYPE_END + 34
const END = TYPE_END + 68
const LOOP_AT = END + 70
const TOTAL = 1234

export function Terminal() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const reduced = useReducedMotion()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!inView || reduced) return
    const id = window.setInterval(() => setTick((t) => (t >= LOOP_AT ? 0 : t + 1)), TICK)
    return () => window.clearInterval(id)
  }, [inView, reduced])

  const t = reduced ? END : tick
  const typed = COMMAND.slice(0, Math.max(0, t - 2))
  const typing = t < TYPE_END
  const deltaPct = Math.min(1, Math.max(0, (t - DELTA_START) / (DELTA_END - DELTA_START)))
  const deltaCount = Math.round(deltaPct * TOTAL)

  return (
    <div ref={ref} className="h-full">
      <WindowFrame
        title="~/projects · zsh"
        right={
          <button
            type="button"
            onClick={() => setTick(0)}
            aria-label="Replay"
            className="grid size-6 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="size-3.5" />
          </button>
        }
        className="h-full bg-background/60"
      >
        <div className="flex min-h-[220px] flex-1 flex-col gap-1.5 p-4 font-mono text-[12px] leading-relaxed sm:text-[13px]" aria-live="off">
          <p className="break-all">
            <span style={{ color: ACCENT }}>❯</span> <span>{typed}</span>
            {typing && (
              <span aria-hidden className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5 animate-pulse bg-foreground/70" />
            )}
          </p>
          {LINES.map((line) =>
            t >= line.at ? (
              <motion.p
                key={line.text}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.3, ease: ENTER }}
                className={
                  line.tone === "success" ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }
              >
                {line.text === "deltas"
                  ? `Resolving deltas: ${Math.round(deltaPct * 100)}% (${deltaCount}/${TOTAL})${deltaPct >= 1 ? ", done." : ""}`
                  : line.text}
              </motion.p>
            ) : null
          )}
          {t >= END && (
            <p>
              <span style={{ color: ACCENT }}>❯</span>
              <span aria-hidden className="ml-1.5 inline-block h-3.5 w-[7px] translate-y-0.5 animate-pulse bg-foreground/70" />
            </p>
          )}
        </div>
      </WindowFrame>
    </div>
  )
}
