"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Code2,
  GripVertical,
  Maximize2,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react"
import {
  getComponent,
  initialValues,
  registryItem,
  registryUrl,
  usageCode,
  type Control,
  type PropDoc,
  type PropValue,
} from "@/lib/docs"
import { cn } from "@/lib/utils"
import { track } from "@/lib/analytics"
import { announceInstall } from "@/components/site/star-prompt"
import { CodeBlock } from "./code-block"
import { DocsPanel } from "./docs-panel"
import { LibraryBadges } from "./library-badges"
import type { ComponentGuide } from "@/lib/guides/types"
import { CopyButton } from "./copy-button"
import { PropControl } from "./controls"
import { demos } from "./demos"
import { ThemeToggle } from "./theme-toggle"

type Tab = "usage" | "docs" | "source" | "api"

function IconButton({ label, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export function Playground({ slug, source, guide }: { slug: string; source: string; guide?: ComponentGuide }) {
  const doc = getComponent(slug)!
  const Demo = demos[slug]

  const [values, setValues] = useState<Record<string, PropValue>>(() => initialValues(doc))
  const [run, setRun] = useState(0)
  const [tab, setTab] = useState<Tab>("usage")
  const [codeOpen, setCodeOpen] = useState(true)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [width, setWidth] = useState(460)

  const controls = doc.props.filter((p): p is PropDoc & { control: Control } => !!p.control)
  const code = useMemo(() => usageCode(doc, values), [doc, values])
  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues(doc))

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen])

  // Drag the panel's left edge to resize it
  const startResize = (e: React.PointerEvent) => {
    const startX = e.clientX
    const startW = width
    const move = (ev: PointerEvent) =>
      setWidth(Math.min(Math.max(startW + (startX - ev.clientX), 360), Math.min(820, window.innerWidth * 0.55)))
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      document.body.style.cursor = ""
    }
    document.body.style.cursor = "col-resize"
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  return (
    <div className="flex flex-1 flex-col gap-2 sm:gap-3 lg:min-h-0 lg:flex-row">
      {/* ---------------------------------------------------------- stage */}
      <section
        className={cn(
          "relative flex min-w-0 flex-col gap-2 lg:block lg:flex-1",
          fullscreen && "fixed inset-2 z-50 flex-1 lg:block"
        )}
      >
        <div
          className={cn(
            "relative isolate h-[62svh] overflow-hidden rounded-3xl border bg-stage lg:absolute lg:inset-0 lg:h-auto",
            fullscreen && "h-auto flex-1"
          )}
          data-tour="stage"
        >
          <div className="mc-dots pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_75%)]" />

          <div
            key={`${run}-${JSON.stringify(values)}`}
            className="absolute inset-0 grid place-items-center overflow-hidden lg:pr-[var(--controls-w)]"
            style={{ "--controls-w": controlsOpen && controls.length ? "17rem" : "0px" } as React.CSSProperties}
          >
            {Demo ? <Demo values={values} /> : null}
          </div>

          {/* dock */}
          <div data-tour="dock" className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full border bg-panel/85 p-1 shadow-lg shadow-black/10 backdrop-blur-xl">
            <GripVertical className="mx-1 size-3.5 text-muted-foreground/50" />
            <IconButton label="Replay" onClick={() => setRun((r) => r + 1)}>
              <RotateCcw className="size-3.5" />
            </IconButton>
            {controls.length > 0 && (
              <IconButton
                label="Toggle controls"
                onClick={() => setControlsOpen((o) => !o)}
                className={cn("max-lg:hidden", controlsOpen && "bg-accent text-foreground")}
              >
                <SlidersHorizontal className="size-3.5" />
              </IconButton>
            )}
            <IconButton label={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={() => setFullscreen((f) => !f)}>
              {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </IconButton>
            {!codeOpen && (
              <IconButton label="Show code" onClick={() => setCodeOpen(true)} className="max-lg:hidden">
                <Code2 className="size-3.5" />
              </IconButton>
            )}
          </div>
        </div>

        {/* controls */}
        <AnimatePresence initial={false}>
          {controlsOpen && controls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 16, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              data-tour="controls"
              className="z-20 flex flex-col overflow-hidden rounded-3xl border bg-panel lg:absolute lg:bottom-3 lg:right-3 lg:top-3 lg:w-64 lg:rounded-2xl lg:bg-panel/85 lg:shadow-xl lg:shadow-black/10 lg:backdrop-blur-xl"
            >
              <div className="flex h-11 shrink-0 items-center justify-between border-b pl-4 pr-1.5">
                <span className="text-[13px] font-medium">Controls</span>
                <button
                  type="button"
                  onClick={() => setValues(initialValues(doc))}
                  disabled={!dirty}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <RotateCcw className="size-3" /> Reset
                </button>
              </div>
              <div className="mc-scroll grid flex-1 content-start gap-4 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-1">
                {controls.map((p) => (
                  <PropControl
                    key={p.name}
                    prop={p}
                    value={values[p.name]}
                    onChange={(v) => setValues((s) => ({ ...s, [p.name]: v }))}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ---------------------------------------------------------- code panel */}
      {codeOpen && (
        <aside
          className="relative flex min-w-0 flex-col rounded-3xl border bg-panel lg:w-[var(--panel-w)] lg:shrink-0"
          style={{ "--panel-w": `${width}px` } as React.CSSProperties}
        >
          <div
            onPointerDown={startResize}
            className="group absolute -left-3 top-0 z-10 hidden h-full w-3 cursor-col-resize lg:block"
          >
            <div className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/10 transition-colors group-hover:bg-foreground/30" />
          </div>

          <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold tracking-tight">{doc.name}</h1>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">{doc.description}</p>
              <LibraryBadges doc={doc} className="mt-2" />
            </div>
            <div className="flex shrink-0 items-center gap-0.5 rounded-full border bg-inset p-1">
              <IconButton label="Fullscreen preview" onClick={() => setFullscreen(true)}>
                <Maximize2 className="size-3.5" />
              </IconButton>
              <IconButton label="Close code panel" onClick={() => setCodeOpen(false)} className="max-lg:hidden">
                <X className="size-3.5" />
              </IconButton>
              <ThemeToggle />
            </div>
          </header>

          <InstallBar slug={slug} />

          <div className="flex gap-1 border-b px-4">
            {(["usage", "docs", "source", "api"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "relative px-2.5 pb-2.5 pt-1 text-[13px] capitalize transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "api" ? "API" : t}
                {tab === t && (
                  <motion.span layoutId="code-tab" className="absolute inset-x-2 -bottom-px h-px bg-foreground" />
                )}
              </button>
            ))}
          </div>

          <div data-tour="code" className="flex min-h-0 flex-1 flex-col p-3">
            {tab === "usage" && (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <CodeBlock
                  code={code}
                  onCopy={() => track("copy_code", { slug, tab: "usage" })}
                  className="max-lg:max-h-[60vh] lg:flex-1"
                />
                <p className="px-1 text-[12px] text-muted-foreground">
                  Updates live as you change the controls. Only non-default props are included.
                </p>
              </div>
            )}
            {tab === "source" && (
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <p className="px-1 font-mono text-[11.5px] text-muted-foreground">
                  components/{doc.file.split("/").pop()}
                </p>
                <CodeBlock
                  code={source}
                  onCopy={() => track("copy_code", { slug, tab: "source" })}
                  className="max-lg:max-h-[70vh] lg:flex-1"
                />
              </div>
            )}
            {tab === "docs" && <DocsPanel doc={doc} guide={guide} />}
            {tab === "api" && <ApiTable props={doc.props} dependencies={doc.dependencies} />}
          </div>
        </aside>
      )}
    </div>
  )
}

const PMS = {
  pnpm: "pnpm dlx shadcn@latest add",
  npm: "npx shadcn@latest add",
  yarn: "yarn dlx shadcn@latest add",
  bun: "bunx --bun shadcn@latest add",
} as const

type PM = keyof typeof PMS

function InstallBar({ slug }: { slug: string }) {
  const [pm, setPm] = useState<PM>("pnpm")
  const command = `${PMS[pm]} ${registryItem(slug)}`

  return (
    <div data-tour="install" className="mx-3 mb-3 overflow-hidden rounded-2xl border bg-inset">
      <div className="flex items-center justify-between border-b px-3">
        <div className="flex">
          {(Object.keys(PMS) as PM[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setPm(k)}
              className={cn(
                "relative px-2 py-2 font-mono text-[11.5px] transition-colors",
                pm === k ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {k}
              {pm === k && <motion.span layoutId="pm-tab" className="absolute inset-x-1.5 -bottom-px h-px bg-brand" />}
            </button>
          ))}
        </div>
        <a
          href={`https://v0.dev/chat/api/open?url=${encodeURIComponent(registryUrl(slug))}`}
          target="_blank"
          rel="noreferrer"
          data-tour="v0"
          onClick={() => track("open_v0", { slug })}
          title="Open this component in v0"
          className="-mr-1 flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Open in <span className="font-semibold tracking-tight text-foreground">v0</span>
        </a>
      </div>
      <div className="flex items-center gap-2 py-1.5 pl-3 pr-1.5">
        <code className="mc-scroll flex-1 overflow-x-auto whitespace-nowrap py-1 font-mono text-[12px]">
          <span className="select-none text-muted-foreground">$ </span>
          {command}
        </code>
        <CopyButton
          value={command}
          onCopy={() => {
            track("copy_install", { slug, pm })
            announceInstall()
          }}
          className="shrink-0"
        />
      </div>
    </div>
  )
}

function ApiTable({ props, dependencies }: { props: PropDoc[]; dependencies: string[] }) {
  return (
    <div className="mc-scroll -mx-3 -mb-3 flex-1 overflow-y-auto px-3 pb-3">
      <div className="divide-y rounded-2xl border bg-inset">
        {props.map((p) => (
          <div key={p.name} className="space-y-1.5 px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <code className="font-mono text-[12.5px] font-medium text-foreground">
                {p.name}
                {p.required && <span className="text-brand">*</span>}
              </code>
              <code className="font-mono text-[11.5px] text-[var(--sh-string)]">{p.type}</code>
              {p.default !== undefined && (
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                  = {typeof p.default === "string" ? JSON.stringify(p.default) : String(p.default)}
                </span>
              )}
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">{p.description}</p>
          </div>
        ))}
      </div>
      <p className="mb-2 mt-5 px-1 text-[12px] font-medium">Dependencies</p>
      <div className="flex flex-wrap gap-1.5 px-1">
        {dependencies.map((d) => (
          <code key={d} className="rounded-md border bg-inset px-2 py-1 font-mono text-[11.5px]">
            {d}
          </code>
        ))}
      </div>
    </div>
  )
}
