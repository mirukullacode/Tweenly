"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion, useInView } from "motion/react"
import {
  Check,
  CircleDashed,
  Code2,
  FileCode2,
  Folder,
  GitPullRequest,
  Rocket,
  ShieldCheck,
  Sparkles,
  TestTube2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"
import { ACCENT, CycleProgress, ENTER, SPRING, WindowFrame } from "./shared"

interface Tab {
  id: string
  label: string
  description: string
  icon: LucideIcon
  file: string
}

const TABS: Tab[] = [
  { id: "generate", label: "Code Generation", description: "Describe it, Forge writes it.", icon: Code2, file: "app/api/login/route.ts" },
  { id: "review", label: "Smart Review", description: "Every PR, reviewed in seconds.", icon: GitPullRequest, file: "pull/482 · feat: rate limiting" },
  { id: "test", label: "Auto Testing", description: "Tests written and run for you.", icon: TestTube2, file: "forge test --watch" },
  { id: "deploy", label: "Deploy Ready", description: "Green checks, straight to prod.", icon: Rocket, file: "deployments/production" },
]

const DURATION = 6

export function FeatureTabs() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.35 })
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const playing = inView && !reduced
  const tab = TABS[active]

  return (
    <div ref={ref} className="relative">
      <div role="tablist" aria-label="Forge features" className="grid grid-cols-2 gap-1 md:grid-cols-4">
        {TABS.map((t, i) => {
          const selected = i === active
          const Icon = t.icon
          return (
            <button
              key={t.id}
              role="tab"
              id={`forge-tab-${t.id}`}
              aria-selected={selected}
              aria-controls="forge-tab-panel"
              onClick={() => setActive(i)}
              className={cn(
                "group relative isolate flex flex-col items-start gap-1 rounded-xl px-3 pb-4 pt-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:px-4",
                selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {selected && (
                <motion.span
                  layoutId="forge-tab-bg"
                  className="absolute inset-0 -z-10 rounded-xl border bg-card/80"
                  transition={reduced ? { duration: 0 } : SPRING}
                />
              )}
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="size-4" style={selected ? { color: ACCENT } : undefined} />
                {t.label}
              </span>
              <span className="hidden text-xs text-muted-foreground md:block">{t.description}</span>
              <span className="absolute inset-x-3 bottom-1.5 h-px rounded-full bg-foreground/10 sm:inset-x-4">
                {selected && (
                  <motion.span layoutId="forge-tab-underline" className="absolute inset-0 overflow-hidden rounded-full bg-foreground/25" transition={reduced ? { duration: 0 } : SPRING}>
                    <CycleProgress
                      key={active}
                      playing={playing}
                      duration={DURATION}
                      onDone={() => setActive((a) => (a + 1) % TABS.length)}
                    />
                  </motion.span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="relative mt-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 opacity-60 blur-3xl"
          style={{ background: `radial-gradient(50% 50% at 50% 30%, ${ACCENT}26, transparent 70%)` }}
        />
        <WindowFrame
          title={tab.file}
          right={
            <span className="hidden items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Agent online
            </span>
          }
          className="shadow-2xl shadow-black/10 dark:shadow-black/50"
        >
          <div className="flex h-[400px] sm:h-[440px]">
            <FileTree active={active} />
            <div id="forge-tab-panel" role="tabpanel" aria-labelledby={`forge-tab-${tab.id}`} className="relative min-w-0 flex-1">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={tab.id}
                  className="absolute inset-0 p-4 sm:p-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: reduced ? 0 : 0.45, ease: ENTER }}
                >
                  {active === 0 && <GeneratePanel reduced={reduced} />}
                  {active === 1 && <ReviewPanel reduced={reduced} />}
                  {active === 2 && <TestPanel reduced={reduced} />}
                  {active === 3 && <DeployPanel reduced={reduced} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </WindowFrame>
      </div>
    </div>
  )
}

const TREE = [
  { name: "app", dir: true, depth: 0 },
  { name: "api", dir: true, depth: 1 },
  { name: "login", dir: true, depth: 2 },
  { name: "route.ts", dir: false, depth: 3 },
  { name: "route.test.ts", dir: false, depth: 3 },
  { name: "lib", dir: true, depth: 0 },
  { name: "rate-limit.ts", dir: false, depth: 1 },
  { name: "utils.ts", dir: false, depth: 1 },
  { name: "forge.config.ts", dir: false, depth: 0 },
]

function FileTree({ active }: { active: number }) {
  const highlight = ["route.ts", "rate-limit.ts", "route.test.ts", "forge.config.ts"][active]
  return (
    <div className="hidden w-52 shrink-0 flex-col gap-0.5 border-r bg-background/40 p-3 lg:flex">
      <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Explorer</p>
      {TREE.map((f) => {
        const on = f.name === highlight
        const Icon = f.dir ? Folder : FileCode2
        return (
          <div
            key={f.name}
            className={cn(
              "relative isolate flex items-center gap-2 rounded-md py-1 pr-2 font-mono text-xs",
              on ? "text-foreground" : "text-muted-foreground"
            )}
            style={{ paddingLeft: 8 + f.depth * 12 }}
          >
            {on && <motion.span layoutId="forge-tree-active" className="absolute inset-0 -z-10 rounded-md bg-foreground/[0.06]" transition={SPRING} />}
            <Icon className="size-3.5 shrink-0 opacity-70" />
            <span className="truncate">{f.name}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------------- panels */

function stagger(reduced: boolean, i: number, base = 0.25, step = 0.09) {
  return { duration: reduced ? 0 : 0.4, delay: reduced ? 0 : base + i * step, ease: ENTER }
}

const CODE: { indent: number; tokens: [string, string][] }[] = [
  { indent: 0, tokens: [["text-violet-500", "import"], ["", " { rateLimit } "], ["text-violet-500", "from"], ["text-emerald-600 dark:text-emerald-400", ' "@/lib/rate-limit"']] },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [["text-violet-500", "const"], ["", " limiter = "], ["text-sky-600 dark:text-sky-400", "rateLimit"], ["", "({ window: "], ["text-amber-600 dark:text-amber-400", "60"], ["", ", max: "], ["text-amber-600 dark:text-amber-400", "5"], ["", " })"]] },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [["text-violet-500", "export async function"], ["text-sky-600 dark:text-sky-400", " POST"], ["", "(req: Request) {"]] },
  { indent: 1, tokens: [["text-violet-500", "const"], ["", " ip = req.headers."], ["text-sky-600 dark:text-sky-400", "get"], ["", "("], ["text-emerald-600 dark:text-emerald-400", '"x-forwarded-for"'], ["", ")"]] },
  { indent: 1, tokens: [["text-violet-500", "if"], ["", " (!(await limiter."], ["text-sky-600 dark:text-sky-400", "check"], ["", "(ip))) {"]] },
  { indent: 2, tokens: [["text-violet-500", "return"], ["", " Response."], ["text-sky-600 dark:text-sky-400", "json"], ["", "({ error: "], ["text-emerald-600 dark:text-emerald-400", '"Too many attempts"'], ["", " }, { status: "], ["text-amber-600 dark:text-amber-400", "429"], ["", " })"]] },
  { indent: 1, tokens: [["", "}"]] },
  { indent: 1, tokens: [["text-violet-500", "return"], ["text-sky-600 dark:text-sky-400", " signIn"], ["", "(req)"]] },
  { indent: 0, tokens: [["", "}"]] },
]

function GeneratePanel({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 text-sm">
        <Sparkles className="size-4 shrink-0" style={{ color: ACCENT }} />
        <span className="truncate">Add rate limiting to the login endpoint</span>
        <span className="ml-auto hidden shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">⌘ K</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-background/40 p-3 font-mono text-[11px] leading-6 sm:p-4 sm:text-[12.5px]">
        {CODE.map((line, i) => (
          <motion.div
            key={i}
            className="flex whitespace-pre"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={stagger(reduced, i, 0.2, 0.12)}
          >
            <span className="mr-4 w-5 shrink-0 select-none text-right text-muted-foreground/50">{i + 1}</span>
            <span className="truncate" style={{ paddingLeft: line.indent * 16 }}>
              {line.tokens.map(([cls, text], j) => (
                <span key={j} className={cls}>
                  {text}
                </span>
              ))}
              {i === CODE.length - 1 && (
                <motion.span
                  aria-hidden
                  className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5"
                  style={{ backgroundColor: ACCENT }}
                  animate={reduced ? undefined : { opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const FINDINGS = [
  { level: "warn", line: "L14", title: "IP header can be spoofed", body: "Prefer the platform-provided client IP over x-forwarded-for." },
  { level: "ok", line: "L6", title: "Limiter is shared across requests", body: "Module scope keeps a single instance per region." },
  { level: "warn", line: "L22", title: "Missing Retry-After header", body: "Clients should know when they can try again." },
  { level: "ok", line: "L31", title: "Tests cover the 429 path", body: "route.test.ts asserts status and error body." },
]

function ReviewPanel({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <GitPullRequest className="size-3.5" /> Open
        </span>
        <span className="font-medium">feat: rate limit login attempts</span>
        <span className="text-xs text-muted-foreground">+48 −6 · 3 files</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        {FINDINGS.map((f, i) => (
          <motion.div
            key={f.title}
            className="flex gap-3 rounded-xl border bg-background/50 p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={stagger(reduced, i, 0.2, 0.18)}
          >
            {f.level === "warn" ? (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
            ) : (
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            )}
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="truncate">{f.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{f.line}</span>
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{f.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={stagger(reduced, 5, 0.2, 0.18)}
      >
        <span className="text-muted-foreground">Forge suggested 2 fixes</span>
        <span className="font-medium" style={{ color: ACCENT }}>
          Apply all
        </span>
      </motion.div>
    </div>
  )
}

const TESTS = [
  "returns 200 for valid credentials",
  "rejects invalid password",
  "returns 429 after 5 attempts",
  "resets window after 60 seconds",
  "sets Retry-After header",
  "isolates limits per IP",
]

function TestPanel({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">route.test.ts</span>
        <motion.span
          className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={stagger(reduced, TESTS.length, 0.4, 0.35)}
        >
          {TESTS.length} passed
        </motion.span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col divide-y overflow-hidden rounded-xl border bg-background/50">
        {TESTS.map((t, i) => (
          <div key={t} className="flex items-center gap-3 px-3 py-2.5 font-mono text-xs">
            <span className="relative size-4 shrink-0">
              <motion.span
                className="absolute inset-0 grid place-items-center text-muted-foreground"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={stagger(reduced, i, 0.4, 0.35)}
              >
                <CircleDashed className="size-4 animate-spin [animation-duration:2s]" />
              </motion.span>
              <motion.span
                className="absolute inset-0 grid place-items-center rounded-full bg-emerald-500 text-white"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={stagger(reduced, i, 0.4, 0.35)}
              >
                <Check className="size-3" strokeWidth={3} />
              </motion.span>
            </span>
            <span className="truncate">{t}</span>
            <span className="ml-auto shrink-0 text-muted-foreground">{12 + ((i * 7) % 30)}ms</span>
          </div>
        ))}
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <motion.span
          className="absolute inset-0 origin-left rounded-full bg-emerald-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduced ? 0 : 0.4 + TESTS.length * 0.35, ease: "linear" }}
        />
      </div>
    </div>
  )
}

const PIPELINE = ["Build", "Test", "Preview", "Production"]

function DeployPanel({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="grid grid-cols-4 gap-2">
        {PIPELINE.map((p, i) => (
          <div key={p} className="flex flex-col gap-2">
            <div className="relative h-1 overflow-hidden rounded-full bg-foreground/10">
              <motion.span
                className="absolute inset-0 origin-left"
                style={{ backgroundColor: ACCENT }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.2 + i * 0.6, ease: "linear" }}
              />
            </div>
            <span className="text-xs text-muted-foreground sm:text-sm">{p}</span>
          </div>
        ))}
      </div>
      <motion.div
        className="flex flex-col gap-4 rounded-2xl border bg-background/50 p-4 sm:flex-row sm:items-center sm:p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={stagger(reduced, 0, 2.6)}
      >
        <div className="grid size-12 shrink-0 place-items-center rounded-xl border bg-card">
          <Rocket className="size-5" style={{ color: ACCENT }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Deployed to production</p>
          <p className="truncate font-mono text-xs text-muted-foreground">https://app.northwind.dev · 41s</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Ready
        </span>
      </motion.div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Bundle", "212 kB", "−8%"],
          ["LCP", "1.1s", "−0.3s"],
          ["Errors", "0", "stable"],
        ].map(([k, v, d], i) => (
          <motion.div
            key={k}
            className="rounded-xl border bg-background/40 p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={stagger(reduced, i, 2.9)}
          >
            <p className="text-[11px] text-muted-foreground">{k}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{v}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{d}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
