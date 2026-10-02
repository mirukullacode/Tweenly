"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"
import { ENTER, SPRING } from "./shared"

const SERVERS = [
  { name: "GitHub", desc: "Repos, issues and pull requests", color: "#24292f", installed: true },
  { name: "Linear", desc: "Sync issues and cycles", color: "#5e6ad2" },
  { name: "Figma", desc: "Read frames and design tokens", color: "#f24e1e" },
  { name: "Postgres", desc: "Query schemas safely", color: "#336791" },
  { name: "Slack", desc: "Post updates to channels", color: "#4a154b" },
  { name: "Sentry", desc: "Pull stack traces into context", color: "#362d59" },
  { name: "Stripe", desc: "Inspect customers and events", color: "#635bff" },
  { name: "Notion", desc: "Search specs and docs", color: "#191919" },
]

type Status = "idle" | "loading" | "done"

export function McpServers() {
  const reduced = useReducedMotion()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<Record<string, Status>>(() =>
    Object.fromEntries(SERVERS.map((s) => [s.name, s.installed ? "done" : "idle"]))
  )
  const timers = useRef<number[]>([])

  useEffect(() => {
    const list = timers.current
    return () => list.forEach((id) => window.clearTimeout(id))
  }, [])

  const install = (name: string) => {
    setStatus((s) => ({ ...s, [name]: "loading" }))
    const id = window.setTimeout(() => setStatus((s) => ({ ...s, [name]: "done" })), reduced ? 200 : 1100)
    timers.current.push(id)
  }

  const q = query.trim().toLowerCase()
  const list = SERVERS.filter((s) => !q || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
  const installedCount = Object.values(status).filter((s) => s === "done").length

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search MCP servers..."
          aria-label="Search MCP servers"
          className="h-9 rounded-xl bg-background/60 pl-8"
        />
      </div>
      <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <span>{list.length} servers</span>
        <span className="tabular-nums">{installedCount} installed</span>
      </div>
      <div className="relative h-[264px] overflow-hidden rounded-xl border bg-background/40">
        <ul className="relative flex flex-col divide-y">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.slice(0, 5).map((s) => {
              const st = status[s.name]
              return (
                <motion.li
                  key={s.name}
                  layout={reduced ? false : "position"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: reduced ? 0 : 0.3, ease: ENTER, layout: SPRING }}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{s.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{s.desc}</span>
                  </span>
                  <InstallButton status={st} onClick={() => install(s.name)} name={s.name} reduced={reduced} />
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
        {list.length === 0 && (
          <p className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">No servers match “{query}”</p>
        )}
      </div>
    </div>
  )
}

function InstallButton({
  status,
  onClick,
  name,
  reduced,
}: {
  status: Status
  onClick: () => void
  name: string
  reduced: boolean
}) {
  const label = status === "done" ? "Installed" : status === "loading" ? "Installing" : "Install"
  return (
    <motion.button
      type="button"
      layout={!reduced}
      onClick={onClick}
      disabled={status !== "idle"}
      aria-label={`${label} ${name}`}
      transition={SPRING}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1 overflow-hidden rounded-full border px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        status === "done"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : status === "loading"
            ? "text-muted-foreground"
            : "bg-foreground text-background hover:bg-foreground/85"
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          className="flex items-center gap-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: reduced ? 0 : 0.25, ease: ENTER }}
        >
          {status === "loading" && <Loader2 className="size-3 animate-spin" />}
          {label}
          {status === "done" && <Check className="size-3" strokeWidth={3} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
