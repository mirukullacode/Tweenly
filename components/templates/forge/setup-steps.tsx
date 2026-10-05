"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion, useInView } from "motion/react"
import { ArrowUp, Check, Lock, Sparkles } from "lucide-react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"
import { ACCENT, CycleProgress, ENTER, SPRING } from "./shared"

const STEPS = [
  {
    title: "Connect your GitHub",
    body: "Authorize Forge on the repos you choose. Read-only by default, write access only when you approve a change.",
  },
  {
    title: "Choose your integrations",
    body: "Plug in the tools your team already lives in. Forge pulls context from issues, designs and logs automatically.",
  },
  {
    title: "Start building with AI",
    body: "Describe a feature in plain English. Forge plans, writes, tests and opens a pull request for review.",
  },
]

const DURATION = 5.5

export function SetupSteps() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const playing = inView && !reduced

  return (
    <div ref={ref} className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-12">
      <ol className="flex flex-col gap-2">
        {STEPS.map((s, i) => {
          const selected = i === active
          return (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={selected ? "step" : undefined}
                className={cn(
                  "relative isolate flex w-full gap-4 overflow-hidden rounded-2xl p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:p-5",
                  selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="forge-step-bg"
                    className="absolute inset-0 -z-10 rounded-2xl border bg-card"
                    transition={reduced ? { duration: 0 } : SPRING}
                  />
                )}
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border font-mono text-xs transition-colors",
                    selected && "border-transparent text-white"
                  )}
                  style={selected ? { backgroundColor: ACCENT } : undefined}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium">{s.title}</span>
                  <span className="block pt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</span>
                </span>
                {selected && (
                  <span className="absolute inset-x-5 bottom-0 h-px overflow-hidden bg-foreground/10">
                    <CycleProgress
                      key={active}
                      playing={playing}
                      duration={DURATION}
                      onDone={() => setActive((a) => (a + 1) % STEPS.length)}
                    />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      <div className="relative">
        <div className="relative h-[340px] overflow-hidden rounded-3xl border bg-card/80 sm:h-[380px]">
          <div
            aria-hidden
            className="mc-dots absolute inset-0 opacity-70"
          />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={active}
              className="absolute inset-0 grid place-items-center p-5 sm:p-8"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: reduced ? 0 : 0.5, ease: ENTER }}
            >
              {active === 0 && <ConnectIllustration reduced={reduced} />}
              {active === 1 && <IntegrationsIllustration reduced={reduced} />}
              {active === 2 && <BuildIllustration reduced={reduced} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function t(reduced: boolean, delay: number) {
  return { duration: reduced ? 0 : 0.45, delay: reduced ? 0 : delay, ease: ENTER }
}

function ConnectIllustration({ reduced }: { reduced: boolean }) {
  const repos = ["northwind/web", "northwind/api", "northwind/design-system"]
  return (
    <div className="w-full max-w-sm rounded-2xl border bg-background p-4 shadow-xl shadow-black/5 dark:shadow-black/40">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-foreground text-background">
          <Lock className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium">Install Forge on GitHub</p>
          <p className="text-xs text-muted-foreground">Select repositories</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1.5">
        {repos.map((r, i) => (
          <motion.div
            key={r}
            className="flex items-center gap-3 rounded-xl border px-3 py-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={t(reduced, 0.15 + i * 0.12)}
          >
            <span className="font-mono text-xs">{r}</span>
            <motion.span
              className="ml-auto grid size-4 place-items-center rounded-[4px] text-white"
              style={{ backgroundColor: ACCENT }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={reduced ? { duration: 0 } : { ...SPRING, delay: 0.6 + i * 0.2 }}
            >
              <Check className="size-3" strokeWidth={3} />
            </motion.span>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="mt-4 flex h-9 items-center justify-center rounded-xl bg-foreground text-sm font-medium text-background"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t(reduced, 1.3)}
      >
        Install &amp; authorize
      </motion.div>
    </div>
  )
}

const TOOLS = [
  { name: "Linear", color: "#5e6ad2", on: true },
  { name: "Figma", color: "#f24e1e", on: true },
  { name: "Slack", color: "#4a154b", on: false },
  { name: "Sentry", color: "#362d59", on: true },
  { name: "Postgres", color: "#336791", on: false },
  { name: "Notion", color: "#191919", on: true },
]

function IntegrationsIllustration({ reduced }: { reduced: boolean }) {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
      {TOOLS.map((tool, i) => (
        <motion.div
          key={tool.name}
          className={cn(
            "flex flex-col gap-3 rounded-2xl border bg-background p-3 shadow-sm",
            tool.on && "ring-1 ring-[#ff4d12]/40"
          )}
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={t(reduced, 0.1 + i * 0.07)}
        >
          <div className="flex items-center justify-between">
            <span
              className="grid size-8 place-items-center rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: tool.color }}
            >
              {tool.name[0]}
            </span>
            <span
              className={cn("relative h-4 w-7 rounded-full transition-colors", tool.on ? "" : "bg-foreground/15")}
              style={tool.on ? { backgroundColor: ACCENT } : undefined}
            >
              <motion.span
                className="absolute top-0.5 size-3 rounded-full bg-white shadow"
                initial={{ x: 2 }}
                animate={{ x: tool.on ? 14 : 2 }}
                transition={reduced ? { duration: 0 } : { ...SPRING, delay: 0.5 + i * 0.08 }}
              />
            </span>
          </div>
          <span className="text-sm font-medium">{tool.name}</span>
        </motion.div>
      ))}
    </div>
  )
}

function BuildIllustration({ reduced }: { reduced: boolean }) {
  const lines = ["Planning 4 changes across 3 files", "Writing components/BillingCard.tsx", "Adding tests · 12 passing", "Opened pull request #483"]
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <motion.div
        className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t(reduced, 0.1)}
      >
        Add a billing card with plan usage to the dashboard
      </motion.div>
      <motion.div
        className="flex flex-col gap-2 rounded-2xl rounded-bl-md border bg-background p-4 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t(reduced, 0.4)}
      >
        <p className="flex items-center gap-2 text-xs font-medium">
          <Sparkles className="size-3.5" style={{ color: ACCENT }} /> Forge
        </p>
        {lines.map((l, i) => (
          <motion.p
            key={l}
            className="flex items-center gap-2 text-xs text-muted-foreground"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={t(reduced, 0.7 + i * 0.35)}
          >
            <Check className="size-3.5 text-emerald-500" /> {l}
          </motion.p>
        ))}
      </motion.div>
      <motion.div
        className="flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={t(reduced, 0.2)}
      >
        <span className="flex-1 truncate">Ask Forge to build anything...</span>
        <span className="grid size-7 place-items-center rounded-lg text-white" style={{ backgroundColor: ACCENT }}>
          <ArrowUp className="size-4" />
        </span>
      </motion.div>
    </div>
  )
}
