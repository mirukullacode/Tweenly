"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Transition,
} from "motion/react"
import { List, Plane } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TocItem {
  /** Id of the heading element this entry points to. */
  id: string
  title: string
  /** Nesting depth. Default: 1 */
  level?: 1 | 2 | 3
}

export type TocVariant = "trail" | "rail" | "spotlight"

export interface TableOfContentsProps {
  /** Headings to list, in document order. */
  items: TocItem[]
  /** Visual style. Default: "trail" */
  variant?: TocVariant
  /** Header label. Default: "On This Page" */
  title?: string
  /** Controlled active heading id. When omitted, the active heading is tracked from scroll. */
  activeId?: string
  /** Scroll container whose headings are observed. Default: window / document */
  container?: HTMLElement | null
  /** Distance in px from the top of the viewport or container at which a heading becomes active. Default: 96 */
  offset?: number
  /** Color of the active marker, line and glow (any CSS color). Default: "currentColor" */
  accentColor?: string
  /** Called with the heading id when an entry is clicked. */
  onNavigate?: (id: string) => void
  /** Smoothly scroll to the heading on click. When false, jumps instantly. Default: true */
  smoothScroll?: boolean
  className?: string
}

type Row = { top: number; height: number }
type Point = { x: number; y: number }

interface VariantProps {
  items: TocItem[]
  index: number
  title: string
  accentColor: string
  reduced: boolean
  onSelect: (id: string) => void
}

// Inline `color: currentColor` would override the theme class, so skip it
const tint = (c: string) => (c === "currentColor" ? undefined : c)
const pad = (n: number) => String(n).padStart(2, "0")

function findHeading(id: string, container?: HTMLElement | null) {
  return container ? container.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : document.getElementById(id)
}

function useActiveHeading(ids: string[], container: HTMLElement | null | undefined, offset: number, enabled: boolean) {
  const [active, setActive] = useState<string>()
  const lock = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const key = ids.join("|")

  useEffect(() => {
    if (!enabled || !key) return
    const list = key.split("|")
    let frame = 0

    const compute = () => {
      frame = 0
      if (lock.current) return
      const top = container ? container.getBoundingClientRect().top : 0
      let current = list[0]
      for (const id of list) {
        const el = findHeading(id, container)
        if (el && el.getBoundingClientRect().top - top <= offset + 1) current = id
      }
      // The last headings may never reach the offset line, so the end of the scroll selects the last one
      const scrolled = container ? container.scrollTop : window.scrollY
      const atEnd = container
        ? container.scrollTop + container.clientHeight >= container.scrollHeight - 2
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (scrolled > 0 && atEnd) current = list[list.length - 1]
      setActive(current)
    }

    const onScroll = () => {
      if (lock.current) {
        clearTimeout(timer.current)
        timer.current = setTimeout(release, 140)
      }
      if (!frame) frame = requestAnimationFrame(compute)
    }
    const release = () => {
      lock.current = false
      onScroll()
    }

    const target: HTMLElement | Window = container ?? window
    target.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    frame = requestAnimationFrame(compute)
    return () => {
      target.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(frame)
      clearTimeout(timer.current)
      lock.current = false
    }
  }, [key, container, offset, enabled])

  // Pin the clicked entry while the page scrolls past the headings in between
  const jump = (id: string) => {
    lock.current = true
    setActive(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      lock.current = false
    }, 160)
  }

  return [active, jump] as const
}

function useRows(listRef: React.RefObject<HTMLElement | null>, items: TocItem[]) {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const els = Array.from(list.querySelectorAll<HTMLElement>("[data-toc-row]"))
    const ro = new ResizeObserver(() => setRows(els.map((el) => ({ top: el.offsetTop, height: el.offsetHeight }))))
    ro.observe(list)
    els.forEach((el) => ro.observe(el))
    return () => ro.disconnect()
  }, [listRef, items])

  return rows
}

export function TableOfContents({
  items,
  variant = "trail",
  title = "On This Page",
  activeId,
  container,
  offset = 96,
  accentColor = "currentColor",
  onNavigate,
  smoothScroll = true,
  className,
}: TableOfContentsProps) {
  const reduced = !!useReducedMotion()
  const controlled = activeId !== undefined
  const [tracked, jump] = useActiveHeading(
    items.map((i) => i.id),
    container,
    offset,
    !controlled
  )
  const current = controlled ? activeId : tracked
  const index = Math.max(0, items.findIndex((i) => i.id === current))

  const onSelect = (id: string) => {
    onNavigate?.(id)
    const el = findHeading(id, container)
    if (!el) return
    if (!controlled) jump(id)
    const behavior: ScrollBehavior = smoothScroll && !reduced ? "smooth" : "auto"
    if (container) {
      const delta = el.getBoundingClientRect().top - container.getBoundingClientRect().top
      container.scrollTo({ top: container.scrollTop + delta - offset + 1, behavior })
    } else {
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - offset + 1, behavior })
    }
  }

  const shared: VariantProps = { items, index, title, accentColor, reduced, onSelect }

  return (
    <nav aria-label={title} className={cn("w-full text-sm", className)}>
      {variant === "rail" ? <Rail {...shared} /> : variant === "spotlight" ? <Spotlight {...shared} /> : <Trail {...shared} />}
    </nav>
  )
}

function Header({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 font-medium text-foreground">
      <List className="size-4 text-muted-foreground" aria-hidden />
      {title}
    </div>
  )
}

// ---------------------------------------------------------------- trail

const DOT_X = 5
const STEP = 14
const dotX = (level = 1) => DOT_X + (level - 1) * STEP

function buildPath(dots: Point[]) {
  const pts: Point[] = [dots[0]]
  const stops = [0]
  let total = 0
  const push = (p: Point) => {
    const q = pts[pts.length - 1]
    total += Math.hypot(p.x - q.x, p.y - q.y)
    pts.push(p)
  }
  for (let i = 1; i < dots.length; i++) {
    const a = dots[i - 1]
    const b = dots[i]
    // Jog diagonally halfway between two dots when the indentation changes
    if (a.x !== b.x) {
      const mid = (a.y + b.y) / 2
      const h = Math.min(Math.abs(b.x - a.x), (b.y - a.y) * 0.6) / 2
      push({ x: a.x, y: mid - h })
      push({ x: b.x, y: mid + h })
    }
    push(b)
    stops.push(total)
  }
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ")
  return { d, pts, stops, dots }
}

function pointAt(pts: Point[], length: number) {
  let walked = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (!seg) continue
    if (walked + seg >= length || i === pts.length - 1) {
      const t = Math.min(1, Math.max(0, (length - walked) / seg))
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI }
    }
    walked += seg
  }
  return { ...pts[0], angle: 90 }
}

function Trail({ items, index, title, accentColor, reduced, onSelect }: VariantProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const rows = useRows(listRef, items)
  const geo = useMemo(
    () =>
      rows.length && rows.length === items.length
        ? buildPath(rows.map((r, i) => ({ x: dotX(items[i].level), y: r.top + Math.min(r.height / 2, 16) })))
        : null,
    [rows, items]
  )

  const progress = useMotionValue(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const heading = useMotionValue(135)
  const rotate = useSpring(heading, { stiffness: 260, damping: 26 })
  const dash = useTransform(progress, (l) => `${l} 100000`)
  const dir = useRef(1)
  const placed = useRef(false)

  // The plane sits on the path at `progress` and faces its direction of travel
  useEffect(() => {
    if (!geo) return
    const sync = (l: number) => {
      const p = pointAt(geo.pts, l)
      x.set(p.x)
      y.set(p.y)
      heading.set(p.angle + 45 + (dir.current < 0 ? 180 : 0))
    }
    sync(progress.get())
    return progress.on("change", sync)
  }, [geo, progress, x, y, heading])

  useEffect(() => {
    if (!geo) return
    const target = geo.stops[index] ?? 0
    if (!placed.current || reduced) {
      placed.current = true
      progress.jump(target)
      heading.jump(pointAt(geo.pts, target).angle + 45)
      rotate.jump(heading.get())
      return
    }
    const distance = Math.abs(target - progress.get())
    dir.current = target >= progress.get() ? 1 : -1
    const controls = animate(progress, target, {
      duration: Math.min(1.1, 0.35 + distance / 500),
      ease: [0.65, 0, 0.35, 1],
    })
    controls.then(() => {
      dir.current = 1
      heading.set(pointAt(geo.pts, target).angle + 45)
    })
    return () => controls.stop()
  }, [geo, index, reduced, progress, heading, rotate])

  return (
    <div>
      <Header title={title} />
      <ul ref={listRef} className="relative">
        {geo && (
          <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible text-foreground">
            <path
              d={geo.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.25}
              strokeDasharray="3 4"
              className="text-muted-foreground opacity-40"
            />
            <motion.path
              d={geo.d}
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ strokeDasharray: dash }}
            />
            {geo.dots.map((p, i) =>
              i === index ? null : (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={i < index ? 2.5 : 2.25}
                  strokeWidth={1.25}
                  className={cn("transition-colors duration-300", i < index ? "" : "fill-background text-muted-foreground")}
                  fill={i < index ? accentColor : undefined}
                  stroke={i < index ? accentColor : "currentColor"}
                />
              )
            )}
          </svg>
        )}
        {geo && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 -ml-2.5 -mt-2.5 grid size-5 place-items-center rounded-full bg-background text-foreground"
            style={{ x, y, rotate, color: tint(accentColor) }}
          >
            <Plane className="size-3.5" fill="currentColor" strokeWidth={1.25} />
          </motion.div>
        )}
        {items.map((item, i) => (
          <li key={item.id} data-toc-row>
            <a
              href={`#${item.id}`}
              aria-current={i === index ? "location" : undefined}
              onClick={(e) => {
                e.preventDefault()
                onSelect(item.id)
              }}
              className={cn(
                "block py-1.5 pr-2 leading-5 transition-colors duration-300",
                i === index
                  ? "font-semibold text-foreground"
                  : i < index
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/60 hover:text-foreground"
              )}
              style={{ paddingLeft: dotX(item.level) + 15 }}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------- rail

function Rail({ items, index, title, accentColor, reduced, onSelect }: VariantProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const rows = useRows(listRef, items)
  const [hover, setHover] = useState<number | null>(null)
  const pill = useId()
  const row = rows[index]
  const spring: Transition = reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }

  return (
    <div>
      <Header title={title} />
      <ul ref={listRef} className="relative" onPointerLeave={() => setHover(null)}>
        <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-border" />
        {row && (
          <motion.span
            aria-hidden
            className="absolute left-[-0.5px] w-0.5 rounded-full bg-foreground"
            style={{ backgroundColor: tint(accentColor) }}
            initial={false}
            animate={{ top: row.top, height: row.height }}
            transition={spring}
          />
        )}
        {items.map((item, i) => (
          <li key={item.id} data-toc-row className="relative">
            <AnimatePresence>
              {hover === i && (
                <motion.span
                  layoutId={pill}
                  aria-hidden
                  className="absolute inset-y-0.5 left-2 right-0 rounded-md bg-muted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </AnimatePresence>
            <a
              href={`#${item.id}`}
              aria-current={i === index ? "location" : undefined}
              onPointerEnter={() => setHover(i)}
              onClick={(e) => {
                e.preventDefault()
                onSelect(item.id)
              }}
              className={cn(
                "relative block py-1.5 pr-2 leading-5 transition-colors duration-200",
                i === index ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              style={{ paddingLeft: 16 + ((item.level ?? 1) - 1) * 12 }}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------- spotlight

const IDLE_DASH = { 1: 12, 2: 8, 3: 5 } as const

function Spotlight({ items, index, title, accentColor, reduced, onSelect }: VariantProps) {
  const t: Transition = reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span>{title}</span>
        <span className="flex items-center font-mono tabular-nums tracking-normal">
          <span className="relative inline-flex h-4 overflow-hidden text-foreground">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={index}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={t}
                className="leading-4"
              >
                {pad(index + 1)}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="px-1 opacity-50">/</span>
          {pad(items.length)}
        </span>
      </div>
      <ul className="flex flex-col">
        {items.map((item, i) => {
          const active = i === index
          const level = item.level ?? 1
          const width = active ? 24 : IDLE_DASH[level]
          return (
            <li key={item.id}>
              <motion.a
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  onSelect(item.id)
                }}
                initial={false}
                animate={active ? "active" : "idle"}
                whileHover="hover"
                className="flex items-center gap-3 py-1.5 leading-5 outline-none focus-visible:underline"
              >
                <span aria-hidden className="relative flex h-2 w-6 shrink-0 items-center text-foreground" style={{ color: tint(accentColor) }}>
                  <motion.span
                    className="absolute left-0 h-1.5 rounded-full bg-current blur-[5px]"
                    initial={false}
                    animate={{ width, opacity: active ? 0.7 : 0 }}
                    transition={t}
                  />
                  <motion.span
                    className="absolute left-0 h-0.5 rounded-full bg-current"
                    initial={false}
                    animate={{ width, opacity: active ? 1 : 0.35 }}
                    transition={t}
                  />
                </span>
                <motion.span
                  className={cn("min-w-0", active ? "font-medium text-foreground" : "text-muted-foreground")}
                  style={{ marginLeft: (level - 1) * 10 }}
                  variants={{
                    idle: { opacity: 0.5, filter: "blur(0.6px)", x: 0 },
                    active: { opacity: 1, filter: "blur(0px)", x: 2 },
                    hover: active ? { opacity: 1, filter: "blur(0px)", x: 2 } : { opacity: 0.9, filter: "blur(0px)", x: 1 },
                  }}
                  transition={t}
                >
                  {item.title}
                </motion.span>
              </motion.a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
