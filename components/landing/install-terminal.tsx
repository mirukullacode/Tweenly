"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { motion, useInView } from "motion/react"
import { Bot, MousePointer2, Package, Terminal } from "lucide-react"
import { CopyButton } from "@/components/docs/copy-button"
import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

type Line =
  | { kind: "cmd"; text: string }
  | { kind: "prompt"; text: string }
  | { kind: "ok"; text: string; note?: string }
  | { kind: "tool"; text: string }
  | { kind: "out"; text: string }
  | { kind: "done"; text: string }
  | { kind: "gap" }

interface Method {
  id: string
  label: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  copy: string
  lines: Line[]
}

const METHODS: Method[] = [
  {
    id: "cli",
    label: "shadcn CLI",
    hint: "One command, zero config",
    icon: Terminal,
    title: "~/my-app — zsh",
    copy: "npx shadcn@latest add @tweenly/text-reveal",
    lines: [
      { kind: "cmd", text: "npx shadcn@latest add @tweenly/text-reveal" },
      { kind: "ok", text: "Checking registry." },
      { kind: "ok", text: "Installing dependencies.", note: "motion" },
      { kind: "ok", text: "Created 1 file:" },
      { kind: "out", text: "  - components/text-reveal.tsx" },
      { kind: "gap" },
      { kind: "cmd", text: "git diff --stat" },
      { kind: "out", text: " components/text-reveal.tsx | 118 +++++++++++" },
      { kind: "out", text: " package.json               |   1 +" },
    ],
  },
  {
    id: "claude",
    label: "Claude Code",
    hint: "Ask for it in plain English",
    icon: Bot,
    title: "~/my-app — claude",
    copy: "npx shadcn@latest mcp init --client claude",
    lines: [
      { kind: "cmd", text: "npx shadcn@latest mcp init --client claude" },
      { kind: "ok", text: "Configured shadcn MCP server in .mcp.json" },
      { kind: "gap" },
      { kind: "prompt", text: "Add a tweenly text reveal to the hero, split by word" },
      { kind: "tool", text: "shadcn · search_items_in_registries(\"text reveal\")" },
      { kind: "out", text: "  ⎿  Found @tweenly/text-reveal" },
      { kind: "tool", text: "Bash(npx shadcn@latest add @tweenly/text-reveal)" },
      { kind: "out", text: "  ⎿  Created components/text-reveal.tsx" },
      { kind: "tool", text: "Update(app/page.tsx)" },
      { kind: "out", text: "  ⎿  <TextReveal text=\"Ship faster\" split=\"word\" />" },
      { kind: "done", text: "Done. The hero headline now reveals word by word." },
    ],
  },
  {
    id: "cursor",
    label: "Cursor & VS Code",
    hint: "Same MCP server, any editor",
    icon: MousePointer2,
    title: "~/my-app — cursor",
    copy: "npx shadcn@latest mcp init --client cursor",
    lines: [
      { kind: "cmd", text: "npx shadcn@latest mcp init --client cursor" },
      { kind: "ok", text: "Configured shadcn MCP server in .cursor/mcp.json" },
      { kind: "gap" },
      { kind: "prompt", text: "Which @tweenly components are buttons?" },
      { kind: "tool", text: "shadcn · list_items_in_registries(\"@tweenly\")" },
      { kind: "out", text: "  ⎿  fill-button  shine-button  ripple-button" },
      { kind: "out", text: "     hold-button  slide-button  like-button" },
      { kind: "prompt", text: "Use hold-button for the delete action" },
      { kind: "tool", text: "shadcn · get_add_command_for_items(\"@tweenly/hold-button\")" },
      { kind: "done", text: "Installed and wired into settings/danger-zone.tsx" },
    ],
  },
  {
    id: "manual",
    label: "Manual",
    hint: "Copy the source, own it",
    icon: Package,
    title: "~/my-app — zsh",
    copy: "npm install motion",
    lines: [
      { kind: "cmd", text: "npm install motion" },
      { kind: "out", text: "added 3 packages in 1.4s" },
      { kind: "gap" },
      { kind: "out", text: "# Paste the Source tab into components/text-reveal.tsx" },
      { kind: "ok", text: "components/text-reveal.tsx" },
      { kind: "ok", text: "cn() from @/lib/utils", note: "already in shadcn projects" },
      { kind: "gap" },
      { kind: "cmd", text: "npm run dev" },
      { kind: "done", text: "Ready on http://localhost:3000" },
    ],
  },
]

const AUTO_MS = 9000

export function InstallTerminal() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const seen = useInView(ref, { amount: 0.4, once: true })
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)
  const method = METHODS[active]

  // Cycle tabs while on screen until the visitor picks one
  useEffect(() => {
    if (!auto || !inView) return
    const id = setTimeout(() => setActive((a) => (a + 1) % METHODS.length), AUTO_MS)
    return () => clearTimeout(id)
  }, [auto, inView, active])

  return (
    <div ref={ref} className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div role="tablist" aria-label="Install method" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {METHODS.map((m, i) => {
          const Icon = m.icon
          const on = i === active
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setActive(i)
                setAuto(false)
                track("install_tab", { method: m.id })
              }}
              className={cn(
                "group relative flex min-w-[200px] shrink-0 items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition-colors lg:min-w-0",
                on ? "bg-card" : "border-transparent hover:bg-card/50"
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl border transition-colors",
                  on ? "border-brand/40 bg-brand/10 text-brand" : "bg-background text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[14px] font-medium", !on && "text-muted-foreground group-hover:text-foreground")}>{m.label}</span>
                <span className="block truncate text-[12.5px] text-muted-foreground">{m.hint}</span>
              </span>
              {on && auto && inView && (
                <motion.span
                  key={`bar-${active}`}
                  className="absolute inset-x-0 bottom-0 h-px origin-left bg-brand"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0c0c0c] text-[#e6e6e6]">
        <div className="flex h-11 items-center gap-2 border-b border-white/[0.07] px-4">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="flex-1 text-center font-mono text-[12px] text-white/40">{method.title}</span>
          <CopyButton
            value={method.copy}
            onCopy={() => track("copy_install_terminal", { method: method.id })}
            className="size-7 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          />
        </div>
        <Screen key={method.id} lines={method.lines} play={seen} />
        <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2.5 font-mono text-[11px] text-white/35">
          <span className="truncate">$ {method.copy}</span>
          <span className="hidden shrink-0 sm:block">@tweenly · shadcn registry</span>
        </div>
      </div>
    </div>
  )
}

function Screen({ lines, play }: { lines: Line[]; play: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = ref.current
      if (!root || !play) return
      const rows = gsap.utils.toArray<HTMLElement>("[data-row]", root)

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        rows.forEach((row) => {
          const typed = row.querySelector<HTMLElement>("[data-type]")
          if (typed) typed.textContent = typed.dataset.type ?? ""
        })
        gsap.set(rows, { autoAlpha: 1 })
        return
      }

      const tl = gsap.timeline({ delay: 0.25 })
      rows.forEach((row) => {
        const typed = row.querySelector<HTMLElement>("[data-type]")
        const spin = row.querySelector<HTMLElement>("[data-spin]")
        tl.set(row, { autoAlpha: 1 })
        if (typed) {
          // Humans don't type at a constant rate
          const full = typed.dataset.type ?? ""
          const state = { n: 0 }
          tl.to(state, {
            n: full.length,
            duration: Math.min(0.028 * full.length + 0.2, 1.6),
            ease: "power1.inOut",
            onUpdate: () => (typed.textContent = full.slice(0, Math.round(state.n))),
          }).to({}, { duration: 0.35 })
        } else if (spin) {
          tl.fromTo(row, { x: -6, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.25, ease: "power2.out" })
            .set(spin, { textContent: "✔", color: "#4ade80" }, "+=0.35")
        } else {
          tl.fromTo(row, { y: 4, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.22, ease: "power2.out" }, "+=0.08")
        }
      })
      tl.set("[data-caret]", { autoAlpha: 1 })
    },
    { scope: ref, dependencies: [play] }
  )

  return (
    <div ref={ref} className="h-[340px] overflow-hidden px-5 py-4 font-mono text-[12.5px] leading-[1.9] sm:text-[13px]">
      {lines.map((line, i) => (
        <div key={i} data-row className="invisible whitespace-pre-wrap break-all opacity-0">
          <Row line={line} />
        </div>
      ))}
      <div data-caret className="invisible flex items-center gap-2 opacity-0">
        <span className="text-[#ff6a2b]">$</span>
        <span className="h-4 w-2 animate-pulse bg-white/70" />
      </div>
    </div>
  )
}

function Row({ line }: { line: Line }) {
  switch (line.kind) {
    case "gap":
      return <span>&nbsp;</span>
    case "cmd":
      return (
        <span>
          <span className="text-[#ff6a2b]">$ </span>
          <span data-type={line.text} />
        </span>
      )
    case "prompt":
      return (
        <span className="-mx-2 block rounded-md bg-white/[0.05] px-2">
          <span className="text-white/40">&gt; </span>
          <span data-type={line.text} className="text-white" />
        </span>
      )
    case "ok":
      return (
        <span>
          <span data-spin className="text-white/40">
            ⠋
          </span>{" "}
          {line.text}
          {line.note && <span className="text-white/35"> {line.note}</span>}
        </span>
      )
    case "tool":
      return (
        <span>
          <span className="text-[#ff6a2b]">● </span>
          <span className="text-white/85">{line.text}</span>
        </span>
      )
    case "done":
      return (
        <span className="text-[#4ade80]">
          <span>✻ </span>
          {line.text}
        </span>
      )
    default:
      return <span className="text-white/45">{line.text}</span>
  }
}
