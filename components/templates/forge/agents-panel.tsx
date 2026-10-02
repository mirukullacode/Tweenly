"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { Brain, Check, Code2, ScanEye, type LucideIcon } from "lucide-react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"
import { ACCENT } from "./shared"

interface Agent {
  name: string
  icon: LucideIcon
  steps: string[]
  /** Tick at which the agent starts working. */
  start: number
  /** Ticks needed to finish. */
  length: number
  tokens: number
}

const AGENTS: Agent[] = [
  { name: "Planner", icon: Brain, steps: ["Reading issue #482", "Mapping affected files", "Drafting plan"], start: 0, length: 34, tokens: 8_420 },
  { name: "Coder", icon: Code2, steps: ["Editing route.ts", "Adding rate-limit.ts", "Writing tests"], start: 10, length: 58, tokens: 21_960 },
  { name: "Reviewer", icon: ScanEye, steps: ["Waiting for diff", "Checking edge cases", "Approving changes"], start: 26, length: 50, tokens: 12_310 },
]

const TICK = 110
const LAST = Math.max(...AGENTS.map((a) => a.start + a.length))
const LOOP_AT = LAST + 30
const fmt = new Intl.NumberFormat("en-US")

export function AgentsPanel() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduced = useReducedMotion()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!inView || reduced) return
    const id = window.setInterval(() => setTick((t) => (t >= LOOP_AT ? 0 : t + 1)), TICK)
    return () => window.clearInterval(id)
  }, [inView, reduced])

  const t = reduced ? LAST : tick
  const done = AGENTS.filter((a) => t >= a.start + a.length).length
  const totalTokens = AGENTS.reduce((sum, a) => sum + Math.round(progressOf(a, t) * a.tokens), 0)

  return (
    <div ref={ref} className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex size-2">
            {done < AGENTS.length && !reduced && (
              <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ backgroundColor: ACCENT }} />
            )}
            <span className="relative size-2 rounded-full" style={{ backgroundColor: done < AGENTS.length ? ACCENT : "#10b981" }} />
          </span>
          {done < AGENTS.length ? `${AGENTS.length - done} agents running` : "All agents finished"}
        </span>
        <span className="font-mono tabular-nums">{fmt.format(totalTokens)} tokens</span>
      </div>
      <div className="flex flex-col gap-2">
        {AGENTS.map((a) => (
          <AgentRow key={a.name} agent={a} t={t} />
        ))}
      </div>
    </div>
  )
}

function progressOf(a: Agent, t: number) {
  return Math.min(1, Math.max(0, (t - a.start) / a.length))
}

function AgentRow({ agent, t }: { agent: Agent; t: number }) {
  const p = progressOf(agent, t)
  const finished = p >= 1
  const step = finished ? "Done" : agent.steps[Math.min(agent.steps.length - 1, Math.floor(p * agent.steps.length))]
  const Icon = agent.icon
  return (
    <div className="rounded-xl border bg-background/50 p-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors duration-500",
            finished ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-card"
          )}
        >
          {finished ? <Check className="size-4" strokeWidth={2.5} /> : <Icon className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium">{agent.name}</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {fmt.format(Math.round(p * agent.tokens))} tok
            </span>
          </div>
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="truncate text-[11px] text-muted-foreground"
          >
            {p === 0 ? "Queued" : step}
          </motion.p>
        </div>
      </div>
      <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-foreground/10">
        <span
          className="absolute inset-0 origin-left rounded-full transition-transform duration-150 ease-linear"
          style={{ transform: `scaleX(${p})`, backgroundColor: finished ? "#10b981" : ACCENT }}
        />
      </div>
    </div>
  )
}
