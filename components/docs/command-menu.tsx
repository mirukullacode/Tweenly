"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, CornerDownLeft, Search, X } from "lucide-react"
import { latestRelease } from "@/lib/changelog"
import { search, searchItems, type SearchItem } from "@/lib/search"
import { cn } from "@/lib/utils"
import { CategoryIcon } from "./category-icon"

const OPEN_EVENT = "tweenly:search"
const RECENT_KEY = "tweenly:recent"
const EASE = [0.22, 1, 0.36, 1] as const

export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

const byId = new Map(searchItems.map((i) => [i.id, i]))
const newIds = new Set(latestRelease.added ?? [])

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[]
  } catch {
    return []
  }
}

type Section = { label: string; items: SearchItem[] }

function defaultSections(recent: string[]): Section[] {
  const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((i): i is SearchItem => !!i)
  const sections: Section[] = []
  const recentItems = pick(recent).slice(0, 4)
  if (recentItems.length) sections.push({ label: "Recent", items: recentItems })
  sections.push({ label: `New in v${latestRelease.version}`, items: pick(latestRelease.added ?? []) })
  sections.push({ label: "Getting started", items: searchItems.filter((i) => i.group === "Getting started") })
  return sections
}

function groupResults(results: SearchItem[]): Section[] {
  const map = new Map<string, SearchItem[]>()
  for (const r of results) map.set(r.group, [...(map.get(r.group) ?? []), r])
  return [...map].map(([label, items]) => ({ label, items }))
}

/** ⌘K / Ctrl+K / "/" command palette for jumping to any component or docs page. Mount once. */
export function CommandMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const show = () => {
    returnFocus.current = document.activeElement as HTMLElement | null
    setRecent(readRecent())
    setQuery("")
    setActive(0)
    setOpen(true)
  }
  const hide = () => {
    setOpen(false)
    returnFocus.current?.focus?.()
  }

  // Remember visited component pages for the "Recent" section
  useEffect(() => {
    const slug = pathname.startsWith("/docs/components/") ? pathname.split("/").pop() : null
    if (!slug) return
    const next = [slug, ...readRecent().filter((s) => s !== slug)].slice(0, 6)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (open) hide()
        else show()
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault()
        show()
      }
    }
    const onOpen = () => show()
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  })

  // Lock page scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const sections = useMemo(() => {
    const results = search(query)
    return query.trim() ? groupResults(results) : defaultSections(recent)
  }, [query, recent])
  const flat = sections.flatMap((s) => s.items)
  const activeIndex = Math.min(active, flat.length - 1)
  const current = flat[activeIndex]

  const go = (item: SearchItem | undefined) => {
    if (!item) return
    setOpen(false)
    router.push(item.href)
  }

  const move = (delta: number) => {
    if (!flat.length) return
    const next = (active + delta + flat.length) % flat.length
    setActive(next)
    listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      move(1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      move(-1)
    } else if (e.key === "Enter") {
      e.preventDefault()
      go(current)
    } else if (e.key === "Escape") {
      e.preventDefault()
      hide()
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog
      e.preventDefault()
      move(e.shiftKey ? -1 : 1)
    }
  }

  let index = -1

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 pt-[12vh] sm:p-6 sm:pt-[14vh]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={hide}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search components"
            initial={{ opacity: 0, y: -12, scale: 0.97, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.28, ease: EASE }}
            onAnimationStart={() => inputRef.current?.focus()}
            className="relative flex max-h-[min(34rem,76vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border bg-panel/95 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                  listRef.current?.scrollTo({ top: 0 })
                }}
                onKeyDown={onKeyDown}
                placeholder="Search components, props, categories…"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-list"
                aria-activedescendant={current ? `cmd-option-${activeIndex}` : undefined}
                aria-autocomplete="list"
                spellCheck={false}
                className="h-14 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/60"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("")
                    setActive(0)
                    inputRef.current?.focus()
                  }}
                  className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="rounded-md border bg-inset px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">esc</kbd>
              )}
            </div>

            <div ref={listRef} id="command-list" role="listbox" className="mc-scroll flex-1 overflow-y-auto p-2">
              {flat.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-[14px] font-medium">No results for &ldquo;{query}&rdquo;</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">Try a category like &ldquo;charts&rdquo; or a prop like &ldquo;stagger&rdquo;.</p>
                </div>
              ) : (
                sections.map((section) => (
                  <div key={section.label} className="mb-1 last:mb-0">
                    <p className="px-3 pb-1.5 pt-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                      {section.label}
                    </p>
                    {section.items.map((item) => {
                      index += 1
                      const i = index
                      const isActive = i === activeIndex
                      return (
                        <button
                          key={`${section.label}-${item.id}`}
                          id={`cmd-option-${i}`}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          data-index={i}
                          onMouseMove={() => active !== i && setActive(i)}
                          onClick={() => go(item)}
                          className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                        >
                          {isActive && (
                            <motion.span
                              layoutId="cmd-active"
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                              className="absolute inset-0 rounded-xl bg-accent"
                            />
                          )}
                          <span
                            className={cn(
                              "relative grid size-8 shrink-0 place-items-center rounded-lg border bg-inset transition-colors",
                              isActive ? "text-brand" : "text-muted-foreground"
                            )}
                          >
                            <CategoryIcon group={item.group} className="size-4" />
                          </span>
                          <span className="relative min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-[13.5px] font-medium">
                              {item.title}
                              {newIds.has(item.id) && (
                                <span className="rounded-full bg-brand/12 px-1.5 py-px text-[10px] font-medium text-brand">New</span>
                              )}
                            </span>
                            {item.description && (
                              <span className="block truncate text-[12.5px] text-muted-foreground">{item.description}</span>
                            )}
                          </span>
                          <ArrowRight
                            className={cn(
                              "relative size-3.5 shrink-0 text-muted-foreground transition-all duration-200",
                              isActive ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"
                            )}
                          />
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t bg-inset/60 px-4 py-2.5 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-panel px-1 font-mono">↑</kbd>
                  <kbd className="rounded border bg-panel px-1 font-mono">↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="grid h-4 place-items-center rounded border bg-panel px-1">
                    <CornerDownLeft className="size-2.5" />
                  </kbd>
                  open
                </span>
              </span>
              <span>{flat.length} {query ? (flat.length === 1 ? "result" : "results") : "suggestions"}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Button that looks like a search field and opens the palette. */
export function SearchTrigger({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [mac, setMac] = useState(true)
  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
    // Resolve on a microtask so the effect body never sets state synchronously
    Promise.resolve().then(() => setMac(isMac))
  }, [])

  if (compact) {
    return (
      <button
        type="button"
        aria-label="Search components"
        onClick={openCommandMenu}
        className={cn(
          "grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          className
        )}
      >
        <Search className="size-4" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openCommandMenu}
      data-tour="search"
      className={cn(
        "group flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-xl border bg-panel/60 pl-3 pr-1.5 text-[13px] text-muted-foreground transition-colors hover:border-foreground/15 hover:text-foreground",
        className
      )}
    >
      <Search className="size-3.5" />
      <span className="min-w-0 flex-1 truncate text-left">Search…</span>
      <kbd className="flex items-center gap-0.5 rounded-md border bg-inset px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
        {mac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  )
}
