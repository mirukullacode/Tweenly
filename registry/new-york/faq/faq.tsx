"use client"

import {
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { AnimatePresence, motion, useInView, type Transition } from "motion/react"
import { ArrowRight, ChevronDown, Plus, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type FaqVariant = "minimal" | "cards" | "numbered" | "split"
export type FaqIcon = "plus" | "chevron" | "arrow"

export interface FaqItem {
  /** The question shown on the trigger. */
  question: string
  /** The answer. Plain strings get the richest reveal animations. */
  answer: ReactNode
  /** Stable id. Default: the item index */
  id?: string
}

export interface FaqProps {
  /** Questions and answers. */
  items: FaqItem[]
  /** Visual style. Default: "minimal" */
  variant?: FaqVariant
  /** Allow one or many items open at once. The split variant is always single. Default: "single" */
  type?: "single" | "multiple"
  /** Index or indices open initially when uncontrolled. Default: undefined (split opens the first item) */
  defaultOpen?: number | number[]
  /** Controlled open indices. */
  value?: number[]
  /** Called with the new open indices whenever an item toggles. */
  onValueChange?: (value: number[]) => void
  /** Trigger icon. Default: "plus" */
  icon?: FaqIcon
  /** Accent color for highlights, rings and indicators (any CSS color). Default: "#ff4d12" */
  accent?: string
  /** Optional section heading. */
  title?: string
  /** Optional text under the heading. */
  description?: string
  /** Show a filter input. Non-matching items collapse out and matches highlight. Default: false */
  searchable?: boolean
  /** Placeholder for the filter input. Default: "Search questions" */
  searchPlaceholder?: string
  /** Delay between items when the list scrolls into view, in seconds. 0 disables the entrance. Default: 0.06 */
  stagger?: number
  /** Open and close duration in seconds. Default: 0.45 */
  duration?: number
  /** Corner radius of cards, panels and the search field in px. Default: 16 */
  radius?: number
  className?: string
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const
const SPRING: Transition = { type: "spring", stiffness: 450, damping: 34 }
const INSTANT: Transition = { duration: 0 }

const toList = (v: number | number[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v])

const textOf = (node: ReactNode): string =>
  typeof node === "string" || typeof node === "number" ? String(node) : ""

function Highlight({ text, query, reduced }: { text: string; query: string; reduced: boolean }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  const parts: ReactNode[] = []
  let from = 0
  let hit = lower.indexOf(needle)
  while (hit !== -1) {
    if (hit > from) parts.push(text.slice(from, hit))
    parts.push(
      <motion.mark
        key={hit}
        className="rounded-[3px] bg-no-repeat px-px text-inherit"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklab, var(--faq-accent) 28%, transparent), color-mix(in oklab, var(--faq-accent) 28%, transparent))",
          backgroundColor: "transparent",
        }}
        initial={{ backgroundSize: reduced ? "100% 100%" : "0% 100%" }}
        animate={{ backgroundSize: "100% 100%" }}
        transition={reduced ? INSTANT : { duration: 0.35, ease: EASE_OUT }}
      >
        {text.slice(hit, hit + needle.length)}
      </motion.mark>
    )
    from = hit + needle.length
    hit = lower.indexOf(needle, from)
  }
  if (from < text.length) parts.push(text.slice(from))
  return <>{parts}</>
}

function TriggerIcon({ icon, open, reduced, className }: { icon: FaqIcon; open: boolean; reduced: boolean; className?: string }) {
  const Glyph = icon === "chevron" ? ChevronDown : icon === "arrow" ? ArrowRight : Plus
  const rotate = !open ? 0 : icon === "plus" ? 135 : icon === "chevron" ? 180 : 90
  return (
    <motion.span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      animate={{ rotate }}
      transition={reduced ? INSTANT : SPRING}
    >
      <Glyph className="size-4" strokeWidth={1.75} />
    </motion.span>
  )
}

function Words({ text, reduced, duration }: { text: string; reduced: boolean; duration: number }) {
  const words = text.split(/(\s+)/)
  const step = Math.min(0.03, 0.9 / Math.max(words.length, 1))
  return (
    <>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? (
          w
        ) : (
          <motion.span
            key={i}
            className="inline-block"
            initial={reduced ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={reduced ? INSTANT : { duration: duration * 0.8, delay: 0.06 + (i / 2) * step, ease: EASE_OUT }}
          >
            {w}
          </motion.span>
        )
      )}
    </>
  )
}

function Collapse({
  open,
  id,
  labelledBy,
  duration,
  reduced,
  children,
}: {
  open: boolean
  id: string
  labelledBy: string
  duration: number
  reduced: boolean
  children: ReactNode
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={id}
          role="region"
          aria-labelledby={labelledBy}
          className="overflow-hidden"
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={reduced ? INSTANT : { duration, ease: EASE_IN_OUT }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End"]
  if (!keys.includes(e.key)) return
  const root = e.currentTarget.closest("[data-faq-root]")
  if (!root) return
  const triggers = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-faq-trigger]"))
  const i = triggers.indexOf(e.currentTarget)
  if (i === -1 || triggers.length === 0) return
  e.preventDefault()
  const n = triggers.length
  const next =
    e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowUp" ? (i - 1 + n) % n : e.key === "Home" ? 0 : n - 1
  triggers[next]?.focus()
}

export function Faq({
  items,
  variant = "minimal",
  type = "single",
  defaultOpen,
  value,
  onValueChange,
  icon = "plus",
  accent = "#ff4d12",
  title,
  description,
  searchable = false,
  searchPlaceholder = "Search questions",
  stagger = 0.06,
  duration = 0.45,
  radius = 16,
  className,
}: FaqProps) {
  const uid = useId()
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { once: true, amount: 0.15 })

  const [inner, setInner] = useState<number[]>(() => toList(defaultOpen))
  const [query, setQuery] = useState("")
  const open = value ?? inner
  const isSplit = variant === "split"

  const setOpen = (next: number[]) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }

  const toggle = (index: number) => {
    const isOpen = open.includes(index)
    if (isSplit) {
      if (!isOpen) setOpen([index])
      return
    }
    if (type === "single") setOpen(isOpen ? [] : [index])
    else setOpen(isOpen ? open.filter((i) => i !== index) : [...open, index])
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .map((item, index) => ({ item, index, key: item.id ?? String(index) }))
      .filter(({ item }) => !q || item.question.toLowerCase().includes(q) || textOf(item.answer).toLowerCase().includes(q))
  }, [items, query])

  const splitActive = isSplit
    ? (visible.find((v) => open.includes(v.index)) ?? visible[0])?.index
    : undefined

  const ids = (index: number) => ({ trigger: `${uid}-t-${index}`, panel: `${uid}-p-${index}` })
  const anyOpen = !isSplit && visible.some((v) => open.includes(v.index))
  const enter = (i: number) =>
    stagger > 0 && !reduced
      ? {
          initial: { opacity: 0, y: 14 },
          animate: inView ? { opacity: 1, y: 0 } : undefined,
          transition: { duration: 0.6, delay: i * stagger, ease: EASE_OUT },
        }
      : { initial: false as const }

  const style = { "--faq-accent": accent, "--faq-radius": `${radius}px` } as CSSProperties
  const answerText = (answer: ReactNode) => (typeof answer === "string" ? answer : null)

  const header = (title || description) && (
    <motion.div className="mb-8 space-y-2" {...enter(0)}>
      {title && <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>}
      {description && <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </motion.div>
  )

  const search = searchable && (
    <motion.div className="relative mb-6" {...enter(title || description ? 1 : 0)}>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="h-11 w-full border bg-foreground/[0.03] pr-10 pl-10 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-[color:var(--faq-accent)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--faq-accent)_18%,transparent)] [&::-webkit-search-cancel-button]:hidden"
        style={{ borderRadius: "var(--faq-radius)" }}
      />
      <AnimatePresence>
        {query && (
          <motion.button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={reduced ? INSTANT : SPRING}
          >
            <X className="size-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )

  const empty = (
    <AnimatePresence>
      {visible.length === 0 && (
        <motion.p
          className="py-10 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={reduced ? INSTANT : { duration: 0.3, ease: EASE_OUT }}
        >
          No questions match &ldquo;{query}&rdquo;.
        </motion.p>
      )}
    </AnimatePresence>
  )

  const presence = reduced ? INSTANT : { duration: duration * 0.8, ease: EASE_IN_OUT }
  const baseOffset = (title || description ? 1 : 0) + (searchable ? 1 : 0)

  // ---------------------------------------------------------------- split
  if (isSplit) {
    const active = visible.find((v) => v.index === splitActive)
    const activeIds = active ? ids(active.index) : null
    return (
      <div ref={rootRef} data-faq-root="" style={style} className={cn("w-full", className)}>
        {header}
        {search}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:gap-6">
          <div className="relative flex flex-col gap-1">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map(({ item, index, key }, i) => {
                const isActive = index === splitActive
                const { trigger, panel } = ids(index)
                return (
                  <motion.div
                    key={key}
                    layout={!reduced}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={presence}
                  >
                    <motion.div {...enter(baseOffset + i)}>
                      <button
                        id={trigger}
                        type="button"
                        data-faq-trigger=""
                        aria-expanded={isActive}
                        aria-controls={panel}
                        onClick={() => toggle(index)}
                        onKeyDown={onTriggerKeyDown}
                        className={cn(
                          "relative flex w-full items-center gap-3 px-4 py-3 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--faq-accent)]",
                          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                        style={{ borderRadius: "calc(var(--faq-radius) * 0.75)" }}
                      >
                        {isActive && (
                          <motion.span
                            layoutId={`${uid}-split-indicator`}
                            aria-hidden="true"
                            className="absolute inset-0 bg-foreground/[0.05]"
                            style={{ borderRadius: "calc(var(--faq-radius) * 0.75)" }}
                            transition={reduced ? INSTANT : SPRING}
                          >
                            <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[color:var(--faq-accent)]" />
                          </motion.span>
                        )}
                        <span className="relative flex-1 font-medium">
                          <Highlight text={item.question} query={query} reduced={reduced} />
                        </span>
                        <TriggerIcon
                          icon={icon}
                          open={false}
                          reduced={reduced}
                          className={cn(
                            "relative transition-[opacity,transform] duration-300",
                            isActive ? "translate-x-0 text-[color:var(--faq-accent)] opacity-100" : "-translate-x-1 opacity-0"
                          )}
                        />
                      </button>
                    </motion.div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {empty}
          </div>
          <motion.div {...enter(baseOffset + 1)}>
          <motion.div
            layout={!reduced}
            className="relative min-h-40 overflow-hidden border bg-card"
            style={{ borderRadius: "var(--faq-radius)" }}
            transition={reduced ? INSTANT : SPRING}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {active && activeIds && (
                <motion.div
                  key={active.key}
                  id={activeIds.panel}
                  role="region"
                  aria-labelledby={activeIds.trigger}
                  className="p-6 sm:p-8"
                  initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduced ? { opacity: 0, transition: INSTANT } : { opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={reduced ? INSTANT : { duration, ease: EASE_OUT }}
                >
                  <p className="mb-3 font-[family-name:var(--font-display)] text-sm font-medium tracking-[0.2em] text-[color:var(--faq-accent)] uppercase">
                    {String(active.index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                  </p>
                  <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground">{active.item.question}</h3>
                  <div className="text-sm leading-relaxed text-muted-foreground">{active.item.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------- stacked variants
  return (
    <div ref={rootRef} data-faq-root="" style={style} className={cn("w-full", className)}>
      {header}
      {search}
      <div className={cn("flex flex-col", variant === "minimal" && "border-t")}>
        <AnimatePresence initial={false}>
          {visible.map(({ item, index, key }, i) => {
            const isOpen = open.includes(index)
            const { trigger, panel } = ids(index)
            const text = answerText(item.answer)
            const question = <Highlight text={item.question} query={query} reduced={reduced} />

            let body: ReactNode
            if (variant === "cards") {
              body = (
                <motion.div
                  className="border bg-card transition-[box-shadow,border-color] duration-300"
                  style={{
                    borderRadius: "var(--faq-radius)",
                    borderColor: isOpen ? "var(--faq-accent)" : undefined,
                    boxShadow: isOpen
                      ? "0 0 0 1px var(--faq-accent), 0 18px 40px -20px color-mix(in oklab, var(--faq-accent) 55%, transparent)"
                      : "0 0 0 0px transparent, 0 0 0 0 transparent",
                  }}
                  animate={{
                    y: isOpen && !reduced ? -2 : 0,
                    opacity: anyOpen && !isOpen ? 0.62 : 1,
                  }}
                  whileHover={anyOpen && !isOpen ? { opacity: 0.9 } : undefined}
                  transition={reduced ? INSTANT : SPRING}
                >
                  <h3>
                    <button
                      id={trigger}
                      type="button"
                      data-faq-trigger=""
                      aria-expanded={isOpen}
                      aria-controls={panel}
                      onClick={() => toggle(index)}
                      onKeyDown={onTriggerKeyDown}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left text-[15px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--faq-accent)]"
                      style={{ borderRadius: "var(--faq-radius)" }}
                    >
                      <span className="flex-1">{question}</span>
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-300",
                          isOpen ? "bg-[color:var(--faq-accent)] text-white" : "bg-foreground/[0.05] text-muted-foreground"
                        )}
                      >
                        <TriggerIcon icon={icon} open={isOpen} reduced={reduced} />
                      </span>
                    </button>
                  </h3>
                  <Collapse open={isOpen} id={panel} labelledBy={trigger} duration={duration} reduced={reduced}>
                    <motion.div
                      className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground"
                      initial={reduced ? false : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={reduced ? INSTANT : { duration, ease: EASE_OUT, delay: 0.05 }}
                    >
                      {item.answer}
                    </motion.div>
                  </Collapse>
                </motion.div>
              )
            } else if (variant === "numbered") {
              body = (
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 border-b py-5 sm:grid-cols-[6rem_minmax(0,1fr)]">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "font-[family-name:var(--font-display)] text-5xl leading-none font-semibold tabular-nums transition-colors duration-300 sm:text-6xl",
                      isOpen ? "text-[color:var(--faq-accent)]" : "text-foreground/20"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3>
                      <button
                        id={trigger}
                        type="button"
                        data-faq-trigger=""
                        aria-expanded={isOpen}
                        aria-controls={panel}
                        onClick={() => toggle(index)}
                        onKeyDown={onTriggerKeyDown}
                        className="group flex w-full items-start gap-4 rounded-md pt-1.5 text-left text-lg font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--faq-accent)] sm:pt-2.5"
                      >
                        <span className="flex-1 transition-transform duration-300 group-hover:translate-x-0.5">{question}</span>
                        <TriggerIcon
                          icon={icon}
                          open={isOpen}
                          reduced={reduced}
                          className={cn("mt-1 transition-colors", isOpen ? "text-[color:var(--faq-accent)]" : "text-muted-foreground")}
                        />
                      </button>
                    </h3>
                    <Collapse open={isOpen} id={panel} labelledBy={trigger} duration={duration} reduced={reduced}>
                      <div className="pt-3 pr-8 text-sm leading-relaxed text-muted-foreground">
                        {text !== null ? <Words text={text} reduced={reduced} duration={duration} /> : item.answer}
                      </div>
                    </Collapse>
                  </div>
                </div>
              )
            } else {
              body = (
                <div className="border-b">
                  <h3>
                    <button
                      id={trigger}
                      type="button"
                      data-faq-trigger=""
                      aria-expanded={isOpen}
                      aria-controls={panel}
                      onClick={() => toggle(index)}
                      onKeyDown={onTriggerKeyDown}
                      className="group flex w-full items-center gap-4 py-5 text-left text-[15px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--faq-accent)]"
                    >
                      <span className="flex-1">{question}</span>
                      <TriggerIcon
                        icon={icon}
                        open={isOpen}
                        reduced={reduced}
                        className={cn(
                          "transition-colors",
                          isOpen ? "text-[color:var(--faq-accent)]" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                    </button>
                  </h3>
                  <Collapse open={isOpen} id={panel} labelledBy={trigger} duration={duration} reduced={reduced}>
                    <motion.div
                      className="pr-10 pb-5 text-sm leading-relaxed text-muted-foreground"
                      initial={reduced ? false : { opacity: 0, filter: "blur(6px)", y: 6 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                      exit={{ opacity: 0, filter: "blur(4px)" }}
                      transition={reduced ? INSTANT : { duration, ease: EASE_OUT, delay: 0.06 }}
                    >
                      {item.answer}
                    </motion.div>
                  </Collapse>
                </div>
              )
            }

            return (
              <motion.div
                key={key}
                layout={reduced ? false : "position"}
                className={variant === "cards" ? "overflow-clip [overflow-clip-margin:28px]" : "overflow-hidden"}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={presence}
              >
                <motion.div className={variant === "cards" ? "pb-3" : undefined} {...enter(baseOffset + i)}>
                  {body}
                </motion.div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {empty}
      </div>
    </div>
  )
}
