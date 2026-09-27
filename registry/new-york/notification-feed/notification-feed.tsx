"use client"

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react"
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type PanInfo, type Transition } from "motion/react"
import { Bell, CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

/* ---------------------------------------------------------------------- types */

export type NotificationTone = "default" | "success" | "warning" | "error" | "info"
export type NotificationFeedVariant = "stack" | "list" | "island" | "cards"
export type NotificationPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
export type NotificationExpand = "hover" | "always" | "click"

export interface NotificationItem {
  /** Unique identifier. */
  id: string
  /** Main line. */
  title: string
  /** Supporting text, clamped to two lines. */
  description?: string
  /** Custom icon. Defaults to an icon matching the tone. */
  icon?: ReactNode
  /** Avatar image URL. Takes precedence over the icon. */
  avatar?: string
  /** Timestamp label, e.g. "2m ago". */
  time?: string
  /** Semantic color. Default: "default" */
  tone?: NotificationTone
  /** Optional inline action button. */
  action?: { label: string; onClick: () => void }
  /** Hides the unread dot in the list variant. Default: false */
  read?: boolean
  /** Group heading in the list variant when `grouped` is on. Defaults to "now" when unread, "earlier" when read. */
  group?: "now" | "earlier"
  /** Per-item auto-dismiss override in ms (0 disables). */
  duration?: number
}

export interface NotificationFeedProps {
  /** Notifications, newest first. */
  items: NotificationItem[]
  /** Called when an item is dismissed by swipe, button or timeout. */
  onDismiss?: (id: string) => void
  /** Layout: Sonner-like stack, inbox list, dynamic island, or timeline cards. Default: "stack" */
  variant?: NotificationFeedVariant
  /** Screen corner for the stack and island variants. Default: "top-center" */
  position?: NotificationPosition
  /** Positioning context for the stack and island variants. Use "absolute" inside a relative container. Default: "fixed" */
  strategy?: "fixed" | "absolute"
  /** When the stack or island opens into a full list. Default: "hover" */
  expand?: NotificationExpand
  /** Maximum number of visible items. Default: 4 */
  max?: number
  /** Auto-dismiss delay in ms, paused while hovered. 0 disables. Default: 5000 */
  duration?: number
  /** Space between expanded items in px. Default: 12 */
  gap?: number
  /** Distance from the container edges in px (stack and island). Default: 24 */
  offset?: number
  /** Width of the feed in px. Default: 360 */
  width?: number
  /** Accent for the progress line, unread dots and focus rings. Default: "#ff4d12" */
  accent?: string
  /** Corner radius of items in px. Default: 16 */
  radius?: number
  /** List variant: split items under "Now" and "Earlier" headings. Default: false */
  grouped?: boolean
  /** Allow dragging items sideways to dismiss them. Default: true */
  swipeToDismiss?: boolean
  /** Shown by the list and cards variants when there are no items. Default: "You're all caught up" */
  emptyState?: ReactNode
  /** Accessible name of the region. Default: "Notifications" */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------- tokens */

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const spring: Transition = { type: "spring", stiffness: 420, damping: 34 }
const layoutSpring: Transition = { type: "spring", stiffness: 500, damping: 40 }
const instant: Transition = { duration: 0 }
const PEEK = 12
const SHRINK = 0.05

const TONES: Record<NotificationTone, { color: string | null; icon: ReactNode }> = {
  default: { color: null, icon: <Bell /> },
  success: { color: "#22c55e", icon: <CircleCheck /> },
  warning: { color: "#f59e0b", icon: <TriangleAlert /> },
  error: { color: "#ef4444", icon: <CircleX /> },
  info: { color: "#3b82f6", icon: <Info /> },
}

/* ---------------------------------------------------------------------- hook */

export type NotifyInput = Omit<NotificationItem, "id"> & { id?: string }

export interface UseNotificationsOptions {
  /** Oldest items beyond this count are dropped. Default: 50 */
  limit?: number
}

/** Local notification store: `notify` prepends, `dismiss` removes, `clear` empties. */
export function useNotifications({ limit = 50 }: UseNotificationsOptions = {}) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const seq = useRef(0)

  const notify = useCallback(
    (input: NotifyInput) => {
      seq.current += 1
      const id = input.id ?? `notification-${seq.current}`
      setItems((prev) => [{ ...input, id }, ...prev.filter((p) => p.id !== id)].slice(0, limit))
      return id
    },
    [limit]
  )
  const dismiss = useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  return useMemo(() => ({ items, notify, dismiss, clear }), [items, notify, dismiss, clear])
}

/* ----------------------------------------------------------------- item body */

function Leading({ item, dark }: { item: NotificationItem; dark?: boolean }) {
  const tone = TONES[item.tone ?? "default"]
  if (item.avatar) {
    return (
      <span className="relative shrink-0">
        <img src={item.avatar} alt="" className="size-9 rounded-full object-cover ring-1 ring-border" draggable={false} />
        {tone.color && (
          <span
            className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2", dark ? "ring-[#0a0a0a]" : "ring-card")}
            style={{ background: tone.color }}
          />
        )}
      </span>
    )
  }
  const color = tone.color
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full [&_svg]:size-[18px]",
        !color && (dark ? "bg-white/10 text-white/80" : "bg-foreground/[0.06] text-foreground/80")
      )}
      style={color ? { background: `color-mix(in oklab, ${color} 16%, transparent)`, color } : undefined}
    >
      {item.icon ?? tone.icon}
    </span>
  )
}

function ItemBody({ item, dark, leading = true, className }: { item: NotificationItem; dark?: boolean; leading?: boolean; className?: string }) {
  const muted = dark ? "text-white/55" : "text-muted-foreground"
  return (
    <div className={cn("flex items-start gap-3 p-3.5 pr-10", className)}>
      {leading && <Leading item={item} dark={dark} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-medium tracking-tight">{item.title}</p>
          {item.time && <span className={cn("ml-auto shrink-0 text-[11px] tabular-nums", muted)}>{item.time}</span>}
        </div>
        {item.description && <p className={cn("mt-0.5 line-clamp-2 text-[13px] leading-snug", muted)}>{item.description}</p>}
        {item.action && (
          <button
            type="button"
            onClick={item.action.onClick}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              "mt-2.5 inline-flex h-7 items-center rounded-full px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--nf-accent)]",
              dark ? "bg-white/10 hover:bg-white/15" : "bg-foreground/[0.06] hover:bg-foreground/[0.1]"
            )}
          >
            {item.action.label}
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- item shell */

interface ShellProps {
  item: NotificationItem
  duration: number
  /** Timer and progress run only while active. */
  active: boolean
  paused: boolean
  swipe: boolean
  reduced: boolean
  onDismiss: (id: string) => void
  children: ReactNode
  className?: string
  style?: CSSProperties
  dark?: boolean
  /** Animated height in px; omit to size to content. */
  height?: number
  onHeight?: (id: string, height: number) => void
  hideContent?: boolean
  inert?: boolean
}

function ItemShell({
  item,
  duration,
  active,
  paused,
  swipe,
  reduced,
  onDismiss,
  children,
  className,
  style,
  dark,
  height,
  onHeight,
  hideContent,
  inert,
}: ShellProps) {
  const x = useMotionValue(0)
  const fade = useTransform(x, [-180, 0, 180], [0, 1, 0])
  const progress = useMotionValue(1)
  const contentRef = useRef<HTMLDivElement>(null)
  const [leaving, setLeaving] = useState(false)
  const id = item.id

  const expire = useEffectEvent(() => onDismiss(id))
  const measure = useEffectEvent((h: number) => onHeight?.(id, h))

  useEffect(() => {
    if (!active || paused || leaving || duration <= 0) return
    const remaining = (progress.get() * duration) / 1000
    const controls = animate(progress, 0, { duration: remaining, ease: "linear", onComplete: () => expire() })
    return () => controls.stop()
  }, [active, paused, leaving, duration, progress])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => measure(Math.round(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onDragEnd = async (_: unknown, info: PanInfo) => {
    const off = info.offset.x
    const v = info.velocity.x
    if (Math.abs(off) > 96 || (Math.abs(v) > 650 && Math.abs(off) > 24)) {
      setLeaving(true)
      const dir = Math.sign(off || v)
      await animate(x, dir * 440, reduced ? instant : { duration: 0.24, ease: EASE_OUT })
      onDismiss(id)
      return
    }
    animate(x, 0, reduced ? instant : spring)
  }

  return (
    <motion.div
      drag={swipe && !inert && !leaving ? "x" : false}
      dragMomentum={false}
      dragDirectionLock
      onDragEnd={onDragEnd}
      initial={false}
      animate={height === undefined ? undefined : { height }}
      transition={reduced ? instant : spring}
      onKeyDown={(e) => {
        if ((e.key === "Delete" || e.key === "Backspace") && e.target === e.currentTarget) onDismiss(id)
      }}
      tabIndex={inert ? -1 : 0}
      aria-hidden={inert || undefined}
      aria-label={item.description ? `${item.title}. ${item.description}` : item.title}
      className={cn(
        "group/item relative touch-pan-y overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[var(--nf-accent)]",
        swipe && "cursor-grab active:cursor-grabbing",
        className
      )}
      style={{ ...style, x, opacity: fade, pointerEvents: inert ? "none" : undefined }}
    >
      <motion.div
        ref={contentRef}
        initial={false}
        animate={{ opacity: hideContent ? 0 : 1 }}
        transition={reduced ? instant : { duration: 0.2 }}
      >
        {children}
      </motion.div>

      <button
        type="button"
        aria-label={`Dismiss ${item.title}`}
        tabIndex={inert ? -1 : 0}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDismiss(id)}
        className={cn(
          "absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full opacity-0 outline-none transition-opacity duration-150",
          "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--nf-accent)] group-focus-within/item:opacity-100 [@media(hover:hover)]:group-hover/item:opacity-100",
          dark ? "bg-white/10 text-white/70 hover:text-white" : "bg-foreground/[0.06] text-muted-foreground hover:text-foreground",
          hideContent && "hidden"
        )}
      >
        <X className="size-3.5" />
      </button>

      {active && duration > 0 && !hideContent && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left"
          style={{ scaleX: progress, background: "var(--nf-accent)" }}
        />
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ variants */

interface ViewProps {
  items: NotificationItem[]
  onDismiss: (id: string) => void
  max: number
  duration: number
  gap: number
  radius: number
  paused: boolean
  expanded: boolean
  swipe: boolean
  reduced: boolean
  emptyState: ReactNode
  grouped: boolean
  vertical: "top" | "bottom"
  horizontal: "left" | "right" | "center"
  areaRef: RefObject<HTMLDivElement | null>
  bind: AreaHandlers
}

interface AreaHandlers {
  onPointerEnter: () => void
  onPointerLeave: () => void
  onFocus: (e: FocusEvent<HTMLElement>) => void
  onBlur: (e: FocusEvent<HTMLElement>) => void
  onClick?: (e: MouseEvent<HTMLElement>) => void
}

const itemDuration = (item: NotificationItem, fallback: number) => item.duration ?? fallback

function StackView({ items, onDismiss, max, duration, gap, radius, paused, expanded, swipe, reduced, vertical, areaRef, bind }: ViewProps) {
  const [heights, setHeights] = useState<Record<string, number>>({})
  const onHeight = useCallback((id: string, h: number) => setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h })), [])

  const s = vertical === "bottom" ? -1 : 1
  const count = Math.min(items.length, max)
  const heightOf = (i: number) => heights[items[i]?.id] ?? 72
  const front = heightOf(0)

  const offsets: number[] = []
  let acc = 0
  for (let i = 0; i < items.length; i++) {
    offsets.push(acc)
    if (i < count) acc += heightOf(i) + gap
  }
  const expandedH = Math.max(0, acc - gap)
  const listH = count === 0 ? 0 : expanded ? expandedH : front + (count - 1) * PEEK

  return (
    <div
      ref={areaRef}
      {...bind}
      className="relative transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ height: listH }}
    >
      <ol className="contents">
        <AnimatePresence initial={false}>
          {items.map((item, i) => {
            const hidden = i >= max
            const depth = Math.min(i, max - 1)
            const collapsedBack = !expanded && i > 0
            const target = hidden
              ? { y: s * (expanded ? offsets[count - 1] ?? 0 : depth * PEEK), scale: 1 - depth * SHRINK, opacity: 0 }
              : expanded
                ? { y: s * offsets[i], scale: 1, opacity: 1 }
                : { y: s * i * PEEK, scale: 1 - i * SHRINK, opacity: 1 }
            return (
              <motion.li
                key={item.id}
                className="absolute inset-x-0"
                style={{ [vertical]: 0, zIndex: items.length - i, transformOrigin: vertical === "bottom" ? "50% 0%" : "50% 100%" }}
                initial={{ y: -s * 56, opacity: 0, scale: 0.96 }}
                animate={target}
                exit={{ opacity: 0, scale: 0.92, transition: reduced ? instant : { duration: 0.2, ease: EASE_OUT } }}
                transition={reduced ? instant : spring}
              >
                <ItemShell
                  item={item}
                  duration={itemDuration(item, duration)}
                  active={!hidden}
                  paused={paused}
                  swipe={swipe}
                  reduced={reduced}
                  onDismiss={onDismiss}
                  onHeight={onHeight}
                  height={collapsedBack ? front : heights[item.id]}
                  hideContent={collapsedBack}
                  inert={hidden}
                  className="bg-card text-card-foreground shadow-lg shadow-black/[0.08] ring-1 ring-border"
                  style={{ borderRadius: radius }}
                >
                  <ItemBody item={item} />
                </ItemShell>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>
    </div>
  )
}

const contentSwap = {
  initial: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
}

function IslandView({ items, onDismiss, max, duration, radius, paused, expanded, swipe, reduced, horizontal, areaRef, bind }: ViewProps) {
  const idle = items.length === 0
  const current = items[0]
  const mode = idle ? "idle" : expanded ? "list" : "single"
  const swapTransition: Transition = reduced ? instant : { duration: 0.32, ease: EASE_OUT, delay: 0.06 }

  return (
    <div className={cn("flex", horizontal === "left" ? "justify-start" : horizontal === "right" ? "justify-end" : "justify-center")}>
      <motion.div
        ref={areaRef}
        {...bind}
        layout
        initial={false}
        animate={{ borderRadius: idle ? 22 : radius + 10 }}
        transition={reduced ? instant : layoutSpring}
        className="relative overflow-hidden bg-[#0a0a0a] text-[#ededed] shadow-2xl shadow-black/30 ring-1 ring-white/10"
        style={{ width: idle ? 124 : "100%" }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {mode === "idle" && (
            <motion.div key="idle" layout="position" {...contentSwap} transition={swapTransition} className="flex h-9 items-center justify-end px-3.5">
              <span className="size-2 rounded-full bg-white/15" />
            </motion.div>
          )}

          {mode === "single" && current && (
            <motion.div key={`single-${current.id}`} layout="position" {...contentSwap} transition={swapTransition} className="relative">
              <ItemShell
                item={current}
                duration={itemDuration(current, duration)}
                active
                paused={paused}
                swipe={swipe}
                reduced={reduced}
                onDismiss={onDismiss}
                dark
              >
                <ItemBody item={current} dark />
              </ItemShell>
              {items.length > 1 && (
                <span className="pointer-events-none absolute bottom-2.5 right-3 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white/70">
                  +{items.length - 1}
                </span>
              )}
            </motion.div>
          )}

          {mode === "list" && (
            <motion.ol key="list" layout="position" {...contentSwap} transition={swapTransition} className="relative flex flex-col p-1.5">
              <AnimatePresence initial={false} mode="popLayout">
                {items.slice(0, max).map((item, i) => (
                  <motion.li
                    key={item.id}
                    layout="position"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.16 } }}
                    transition={reduced ? instant : layoutSpring}
                    className={cn(i > 0 && "border-t border-white/[0.07]")}
                  >
                    <ItemShell
                      item={item}
                      duration={itemDuration(item, duration)}
                      active
                      paused={paused}
                      swipe={swipe}
                      reduced={reduced}
                      onDismiss={onDismiss}
                      dark
                      style={{ borderRadius: radius }}
                    >
                      <ItemBody item={item} dark />
                    </ItemShell>
                  </motion.li>
                ))}
              </AnimatePresence>
              {items.length > max && (
                <li className="px-3.5 pb-1.5 pt-1 text-[11px] text-white/45">+{items.length - max} more</li>
              )}
            </motion.ol>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

type Entry = { kind: "heading"; key: string; label: string } | { kind: "item"; key: string; item: NotificationItem; index: number }

function ListView({ items, onDismiss, max, duration, radius, paused, swipe, reduced, emptyState, grouped, areaRef, bind }: ViewProps) {
  const visible = items.slice(0, max)
  const entries: Entry[] = []
  if (grouped) {
    const groupOf = (n: NotificationItem) => n.group ?? (n.read ? "earlier" : "now")
    for (const g of ["now", "earlier"] as const) {
      const members = visible.filter((n) => groupOf(n) === g)
      if (!members.length) continue
      entries.push({ kind: "heading", key: `heading-${g}`, label: g === "now" ? "Now" : "Earlier" })
      for (const item of members) entries.push({ kind: "item", key: item.id, item, index: visible.indexOf(item) })
    }
  } else {
    visible.forEach((item, index) => entries.push({ kind: "item", key: item.id, item, index }))
  }
  const transition = reduced ? instant : layoutSpring

  return (
    <motion.div
      ref={areaRef}
      {...bind}
      layout
      transition={transition}
      className="relative overflow-hidden bg-card text-card-foreground shadow-sm ring-1 ring-border"
      style={{ borderRadius: radius }}
    >
      <ol className="relative flex flex-col">
        <AnimatePresence initial={false} mode="popLayout">
          {entries.map((entry, i) =>
            entry.kind === "heading" ? (
              <motion.li
                key={entry.key}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={transition}
                className={cn("px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground", i > 0 && "border-t")}
              >
                {entry.label}
              </motion.li>
            ) : (
              <motion.li
                key={entry.key}
                layout="position"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.16 } }}
                transition={transition}
                className={cn("relative", i > 0 && entries[i - 1]?.kind === "item" && "border-t")}
              >
                <ItemShell
                  item={entry.item}
                  duration={itemDuration(entry.item, duration)}
                  active
                  paused={paused}
                  swipe={swipe}
                  reduced={reduced}
                  onDismiss={onDismiss}
                  className="bg-card transition-colors hover:bg-foreground/[0.02]"
                >
                  {!entry.item.read && (
                    <span aria-label="Unread" className="absolute left-1.5 top-[26px] size-1.5 rounded-full" style={{ background: "var(--nf-accent)" }} />
                  )}
                  <ItemBody item={entry.item} className="pl-4" />
                </ItemShell>
              </motion.li>
            )
          )}
          {items.length > max && (
            <motion.li
              key="more"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className="border-t px-4 py-2.5 text-xs text-muted-foreground"
            >
              {items.length - max} more
            </motion.li>
          )}
          {items.length === 0 && (
            <motion.li
              key="empty"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={reduced ? instant : { duration: 0.3, ease: EASE_OUT, delay: 0.15 }}
              className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground"
            >
              <Bell className="size-4" />
              {emptyState}
            </motion.li>
          )}
        </AnimatePresence>
      </ol>
    </motion.div>
  )
}

function CardsView({ items, onDismiss, max, duration, gap, radius, paused, swipe, reduced, emptyState, areaRef, bind }: ViewProps) {
  const visible = items.slice(0, max)
  const transition = reduced ? instant : layoutSpring

  return (
    <motion.div ref={areaRef} {...bind} layout transition={transition} className="relative">
      <motion.span layout transition={transition} aria-hidden className="absolute bottom-5 left-[17px] top-5 w-px bg-border" />
      <ol className="relative flex flex-col" style={{ gap }}>
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((item, i) => (
            <motion.li
              key={item.id}
              layout="position"
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1 - i * 0.12, y: 0, scale: 1 - i * 0.025 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: reduced ? 0 : 0.18 } }}
              transition={reduced ? instant : { ...layoutSpring, opacity: { duration: 0.3 } }}
              className="relative flex items-start gap-3"
              style={{ transformOrigin: "0% 50%", zIndex: visible.length - i }}
            >
              <span className="relative z-10 mt-3.5 shrink-0 rounded-full bg-card ring-4 ring-card">
                <Leading item={item} />
              </span>
              <ItemShell
                item={item}
                duration={itemDuration(item, duration)}
                active
                paused={paused}
                swipe={swipe}
                reduced={reduced}
                onDismiss={onDismiss}
                className="min-w-0 flex-1 bg-card text-card-foreground ring-1 ring-border"
                style={{
                  borderRadius: radius,
                  boxShadow: `0 ${2 + (max - i) * 2}px ${8 + (max - i) * 6}px -6px rgb(0 0 0 / ${0.06 + (max - i) * 0.02})`,
                }}
              >
                <ItemBody item={item} leading={false} />
              </ItemShell>
            </motion.li>
          ))}
          {items.length === 0 && (
            <motion.li
              key="empty"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={reduced ? instant : { duration: 0.3, ease: EASE_OUT, delay: 0.15 }}
              className="flex items-center gap-3 py-2 pl-2.5 text-sm text-muted-foreground"
            >
              <span className="relative z-10 grid size-4 place-items-center rounded-full bg-card ring-4 ring-card">
                <span className="size-2 rounded-full bg-border" />
              </span>
              {emptyState}
            </motion.li>
          )}
        </AnimatePresence>
      </ol>
    </motion.div>
  )
}

/* ------------------------------------------------------------ NotificationFeed */

export function NotificationFeed({
  items,
  onDismiss,
  variant = "stack",
  position = "top-center",
  strategy = "fixed",
  expand = "hover",
  max = 4,
  duration = 5000,
  gap = 12,
  offset = 24,
  width = 360,
  accent = "#ff4d12",
  radius = 16,
  grouped = false,
  swipeToDismiss = true,
  emptyState = "You're all caught up",
  label = "Notifications",
  className,
}: NotificationFeedProps) {
  const reduced = useReducedMotion()
  const areaRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [clicked, setClicked] = useState(false)

  // The area can vanish under the pointer when the last item leaves; start fresh next time
  if (items.length === 0 && (hovered || focused || clicked)) {
    setHovered(false)
    setFocused(false)
    setClicked(false)
  }

  useEffect(() => {
    if (expand !== "click" || !clicked) return
    const onDown = (e: PointerEvent) => {
      if (!areaRef.current?.contains(e.target as Node)) setClicked(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [expand, clicked])

  const dismiss = useCallback((id: string) => onDismiss?.(id), [onDismiss])
  const expanded = expand === "always" || (expand === "hover" ? hovered || focused : clicked)
  const paused = hovered || focused || (expand === "click" && clicked)

  const bind: AreaHandlers = {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    onFocus: (e) => {
      if (e.target.matches(":focus-visible")) setFocused(true)
    },
    onBlur: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
    },
    onClick:
      expand === "click"
        ? (e) => {
            if ((e.target as HTMLElement).closest("button")) return
            setClicked((c) => !c)
          }
        : undefined,
  }

  const vertical = position.startsWith("top") ? "top" : "bottom"
  const horizontal = position.endsWith("left") ? "left" : position.endsWith("right") ? "right" : "center"
  const floating = variant === "stack" || variant === "island"

  const view: ViewProps = {
    items,
    onDismiss: dismiss,
    max: Math.max(1, max),
    duration,
    gap,
    radius,
    paused,
    expanded,
    swipe: swipeToDismiss,
    reduced,
    emptyState,
    grouped,
    vertical,
    horizontal,
    areaRef,
    bind,
  }

  const accentVar = { "--nf-accent": accent } as CSSProperties
  const content =
    variant === "stack" ? (
      <StackView {...view} />
    ) : variant === "island" ? (
      <IslandView {...view} />
    ) : variant === "list" ? (
      <ListView {...view} />
    ) : (
      <CardsView {...view} />
    )

  if (!floating) {
    return (
      <section aria-label={label} aria-live="polite" className={cn("relative w-full", className)} style={{ ...accentVar, maxWidth: width + (variant === "cards" ? 48 : 0) }}>
        {content}
      </section>
    )
  }

  const place: CSSProperties =
    horizontal === "center" ? { left: "50%", transform: "translateX(-50%)" } : { [horizontal]: offset }

  return (
    <section
      aria-label={label}
      aria-live="polite"
      className={cn("pointer-events-none", className)}
      style={{
        ...accentVar,
        ...place,
        position: strategy,
        [vertical]: offset,
        zIndex: strategy === "fixed" ? 100 : 30,
        width: `min(${width}px, calc(100% - ${offset * 2}px))`,
      }}
    >
      <div className="pointer-events-auto">{content}</div>
    </section>
  )
}
