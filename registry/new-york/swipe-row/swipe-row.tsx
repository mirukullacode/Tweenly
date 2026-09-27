"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
  type PanInfo,
  type Transition,
} from "motion/react"
import { Ellipsis } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type SwipeRowVariant = "reveal" | "full" | "card"
/** Direction the row was dragged. Dragging left reveals `rightActions`. */
export type SwipeDirection = "left" | "right"

export interface SwipeAction {
  /** Stable identifier. */
  id: string
  /** Visible label and accessible name. */
  label: string
  /** Icon shown above the label. */
  icon?: ReactNode
  /** Background color of the action (any CSS color). Default: the row `accent` */
  color?: string
  /** Called when the action runs. */
  onAction?: () => void
  /** Removes the row after the action runs. Default: false */
  destructive?: boolean
}

export interface SwipeRowProps {
  /** Row content. */
  children?: ReactNode
  /** Interaction style: iOS-style reveal, full-swipe commit, or floating cards. Default: "reveal" */
  variant?: SwipeRowVariant
  /** Actions revealed when dragging right, listed from the outer (left) edge inward. `full` and `card` commit the first one. Default: [] */
  leftActions?: SwipeAction[]
  /** Actions revealed when dragging left, listed from the outer (right) edge inward. `full` and `card` commit the first one. Default: [] */
  rightActions?: SwipeAction[]
  /** Drag distance, as a fraction of the row width, that commits a full swipe. Default: 0.4 */
  threshold?: number
  /** Rubber-band resistance past the drag limits (0 = rigid, 1 = free). Default: 0.5 */
  elastic?: number
  /** Vibrate briefly (where supported) when a swipe arms or commits. Default: true */
  haptics?: boolean
  /** Accent used for focus rings and actions without a color. Default: "#ff4d12" */
  accent?: string
  /** Corner radius of the row in px. Default: 14 */
  radius?: number
  /** Disable dragging and actions. Default: false */
  disabled?: boolean
  /** Called after an action runs, with the drag direction it belongs to. */
  onSwipe?: (direction: SwipeDirection, action: SwipeAction) => void
  /** Called once a destructive action has animated the row away. When omitted the row collapses itself. */
  onRemove?: () => void
  className?: string
}

const ACTION_W = 76
const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const
const snap: Transition = { type: "spring", stiffness: 460, damping: 36 }
const pop: Transition = { type: "spring", stiffness: 700, damping: 15, mass: 0.6 }
const layoutSpring: Transition = { type: "spring", stiffness: 500, damping: 40 }
const instant: Transition = { duration: 0 }

function vibrate(enabled: boolean, pattern: number | number[] = 8) {
  if (!enabled || typeof navigator === "undefined") return
  navigator.vibrate?.(pattern)
}

/* --------------------------------------------------------------- reveal buttons */

function RevealButton({
  action,
  index,
  count,
  side,
  open,
  x,
  accent,
  tabbable,
  onPress,
}: {
  action: SwipeAction
  index: number
  count: number
  side: "left" | "right"
  open: number
  x: MotionValue<number>
  accent: string
  tabbable: boolean
  onPress: () => void
}) {
  const sign = side === "right" ? -1 : 1
  // Each button trails the row edge proportionally so they fan out like iOS Mail
  const tx = useTransform(x, (v) => (sign * v > 0 ? v : 0) * ((index + 1) / count))
  const start = open * 0.12 * (count - 1 - index)
  const progress = useTransform(x, [sign * start, sign * (start + open * 0.7)], [0, 1], { clamp: true })
  const scale = useTransform(progress, [0, 1], [0.55, 1])
  const opacity = useTransform(progress, [0, 0.35, 1], [0, 0.4, 1])
  const w = open / count

  return (
    <motion.button
      type="button"
      tabIndex={tabbable ? 0 : -1}
      aria-hidden={!tabbable}
      onClick={onPress}
      className={cn(
        "absolute inset-y-0 flex items-center text-white outline-none focus-visible:brightness-110",
        side === "right" ? "left-full justify-start" : "right-full justify-end"
      )}
      style={{ x: tx, width: open + 480, background: action.color ?? accent, zIndex: count - index }}
    >
      <motion.span
        className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
        style={{ width: w, scale, opacity }}
      >
        {action.icon && <span className="grid size-5 place-items-center [&_svg]:size-[18px]">{action.icon}</span>}
        {action.label}
      </motion.span>
    </motion.button>
  )
}

/* ------------------------------------------------------------ swipe background */

function CommitLayer({
  action,
  dir,
  armed,
  x,
  thresholdPx,
  accent,
  card,
  reduced,
}: {
  action: SwipeAction | undefined
  dir: SwipeDirection | null
  armed: boolean
  x: MotionValue<number>
  thresholdPx: number
  accent: string
  card: boolean
  reduced: boolean
}) {
  const color = action?.color ?? accent
  const tint = useTransform(x, (v) => Math.min(Math.abs(v) / Math.max(thresholdPx, 1), 1) * (card ? 0.22 : 0.16))
  // The icon waits at the edge until the threshold, then rides along with the row
  const iconX = useTransform(x, (v) => (card ? 0 : v < -thresholdPx ? v + thresholdPx : v > thresholdPx ? v - thresholdPx : 0))
  const iconIn = useTransform(x, (v) => Math.min(Math.abs(v) / Math.max(thresholdPx * 0.45, 1), 1))
  const side = dir === "left" ? "right" : "left"

  if (!action || !dir) return null
  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden", card ? "rounded-[inherit]" : "bg-foreground/[0.05]")}>
      <motion.div className="absolute inset-0" style={{ background: color, opacity: tint }} />
      <motion.div
        className="absolute top-1/2 size-[260%] -translate-y-1/2 rounded-full"
        style={{
          background: color,
          [side]: 44,
          translateX: side === "right" ? "50%" : "-50%",
        }}
        initial={false}
        animate={{ scale: armed ? 1 : 0 }}
        transition={reduced ? instant : { type: "spring", stiffness: 420, damping: 38 }}
      />
      <motion.div
        className={cn("absolute inset-y-0 flex items-center", side === "right" ? "right-5" : "left-5")}
        style={{ x: iconX, opacity: iconIn }}
      >
        <motion.div
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium transition-colors duration-150 [&_svg]:size-5",
            card && "rounded-2xl px-3 py-2",
            armed ? "text-white" : "text-muted-foreground"
          )}
          style={card && armed ? { background: color } : undefined}
          initial={false}
          animate={{ scale: armed ? 1.12 : 0.9 }}
          transition={reduced ? instant : pop}
        >
          {action.icon}
          <span>{action.label}</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------- SwipeRow */

export function SwipeRow({
  children,
  variant = "reveal",
  leftActions = [],
  rightActions = [],
  threshold = 0.4,
  elastic = 0.5,
  haptics = true,
  accent = "#ff4d12",
  radius = 14,
  disabled = false,
  onSwipe,
  onRemove,
  className,
}: SwipeRowProps) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const movedRef = useRef(false)
  const armedRef = useRef(false)
  const dirRef = useRef<SwipeDirection | null>(null)
  const [width, setWidth] = useState(0)
  const [openSide, setOpenSide] = useState<"left" | "right" | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [armed, setArmed] = useState(false)
  const [dir, setDir] = useState<SwipeDirection | null>(null)
  const [removed, setRemoved] = useState(false)
  const [busy, setBusy] = useState(false)

  const x = useMotionValue(0)
  const velocity = useVelocity(x)
  const tiltTarget = useTransform(velocity, [-1600, 0, 1600], [-7, 0, 7], { clamp: true })
  const tilt = useSpring(tiltTarget, { stiffness: 400, damping: 30 })

  const rowWidth = width || 360
  const thresholdPx = Math.max(24, Math.min(threshold, 0.95) * rowWidth)
  const openLeft = leftActions.length * ACTION_W
  const openRight = rightActions.length * ACTION_W
  const hasActions = leftActions.length + rightActions.length > 0
  const isCard = variant === "card"
  const spring = reduced ? instant : snap

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Tap outside closes an open row or menu
  useEffect(() => {
    if (!openSide && !menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpenSide(null)
      setMenuOpen(false)
      animate(x, 0, reduced ? instant : snap)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [openSide, menuOpen, reduced, x])

  useMotionValueEvent(x, "change", (v) => {
    const d: SwipeDirection | null = v < -0.5 ? "left" : v > 0.5 ? "right" : null
    if (d !== dirRef.current) {
      dirRef.current = d
      setDir(d)
    }
  })

  const snapTo = (side: "left" | "right" | null) => {
    setOpenSide(side)
    animate(x, side === "right" ? -openRight : side === "left" ? openLeft : 0, spring)
  }

  const setArmedState = (next: boolean) => {
    if (next === armedRef.current) return
    armedRef.current = next
    setArmed(next)
    if (next) vibrate(haptics, 10)
  }

  const run = async (direction: SwipeDirection, action: SwipeAction) => {
    setMenuOpen(false)
    if (action.destructive) {
      setBusy(true)
      vibrate(haptics, [6, 30, 12])
      const off = (direction === "left" ? -1 : 1) * rowWidth * (isCard ? 1.35 : 1.1)
      await animate(x, off, reduced ? instant : { duration: 0.32, ease: EASE_IN_OUT })
      action.onAction?.()
      onSwipe?.(direction, action)
      if (onRemove) onRemove()
      else setRemoved(true)
      return
    }
    vibrate(haptics, 8)
    action.onAction?.()
    onSwipe?.(direction, action)
    setOpenSide(null)
    setArmedState(false)
    animate(x, 0, spring)
  }

  const primary = (d: SwipeDirection | null) => (d === "left" ? rightActions[0] : d === "right" ? leftActions[0] : undefined)

  const onDrag = (_: unknown, info: PanInfo) => {
    if (variant === "reveal") return
    const d: SwipeDirection = info.offset.x < 0 ? "left" : "right"
    setArmedState(!!primary(d) && Math.abs(info.offset.x) >= thresholdPx)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const vx = info.velocity.x
    if (variant === "reveal") {
      const projected = x.get() + vx * 0.18
      if (openRight && projected < -openRight / 2) snapTo("right")
      else if (openLeft && projected > openLeft / 2) snapTo("left")
      else snapTo(null)
      return
    }
    const off = info.offset.x
    const d: SwipeDirection = off < 0 ? "left" : "right"
    const action = primary(d)
    const flung = Math.abs(vx) > 900 && Math.sign(vx) === Math.sign(off) && Math.abs(off) > thresholdPx * 0.4
    if (action && (armedRef.current || flung)) {
      void run(d, action)
      armedRef.current = false
      if (!action.destructive) setArmed(false)
      return
    }
    setArmedState(false)
    animate(x, 0, spring)
  }

  const toggleKeyboard = () => {
    if (variant === "reveal") snapTo(openSide ? null : openRight ? "right" : "left")
    else setMenuOpen((o) => !o)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || busy || e.target !== e.currentTarget) return
    if (e.key === "Escape") {
      if (variant === "reveal") snapTo(null)
      setMenuOpen(false)
    } else if (variant === "reveal" && e.key === "ArrowLeft" && openRight) {
      e.preventDefault()
      snapTo(openSide === "left" ? null : "right")
    } else if (variant === "reveal" && e.key === "ArrowRight" && openLeft) {
      e.preventDefault()
      snapTo(openSide === "right" ? null : "left")
    } else if (variant !== "reveal" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault()
      setMenuOpen(true)
    }
  }

  const constraints =
    variant === "reveal"
      ? { left: -openRight, right: openLeft }
      : variant === "full"
        ? { left: rightActions.length ? -rowWidth : 0, right: leftActions.length ? rowWidth : 0 }
        : { left: 0, right: 0 }

  const menuActions: { action: SwipeAction; direction: SwipeDirection }[] = [
    ...leftActions.map((action) => ({ action, direction: "right" as const })),
    ...rightActions.map((action) => ({ action, direction: "left" as const })),
  ]

  return (
    <motion.div
      ref={rootRef}
      initial={false}
      animate={removed ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
      transition={reduced ? instant : layoutSpring}
      className={cn("relative isolate", isCard ? "overflow-visible" : "overflow-hidden", className)}
      style={{ borderRadius: isCard ? undefined : radius, "--swipe-accent": accent } as React.CSSProperties}
    >
      <div className="relative" style={isCard ? { borderRadius: radius } : undefined}>
        {/* Foreground (draggable) */}
        <motion.div
          drag={disabled || busy || !hasActions ? false : "x"}
          dragConstraints={constraints}
          dragElastic={elastic}
          dragMomentum={false}
          dragDirectionLock
          whileDrag={isCard && !reduced ? { scale: 1.02 } : undefined}
          onPointerDown={() => {
            movedRef.current = false
          }}
          onDragStart={() => {
            movedRef.current = true
            setMenuOpen(false)
          }}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onClickCapture={(e) => {
            if (movedRef.current || openSide) {
              e.preventDefault()
              e.stopPropagation()
            }
            if (!movedRef.current && openSide) snapTo(null)
          }}
          tabIndex={disabled ? -1 : 0}
          role="group"
          aria-roledescription="swipeable row"
          aria-label={hasActions ? "Swipe or press the arrow keys for actions" : undefined}
          onKeyDown={onKeyDown}
          className={cn(
            "group/row relative z-10 cursor-grab touch-pan-y select-none bg-card outline-none active:cursor-grabbing",
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--swipe-accent)]",
            isCard && "shadow-sm ring-1 ring-border",
            disabled && "cursor-default opacity-60"
          )}
          style={{
            x,
            rotate: isCard && !reduced ? tilt : 0,
            borderRadius: isCard ? radius : undefined,
          }}
        >
          {children}

          {hasActions && !disabled && (
            <button
              type="button"
              aria-label="Show actions"
              aria-expanded={variant === "reveal" ? !!openSide : menuOpen}
              onClick={toggleKeyboard}
              className={cn(
                "absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-panel text-muted-foreground opacity-0 shadow-sm ring-1 ring-border outline-none transition-opacity duration-150",
                "hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--swipe-accent)] group-focus-visible/row:opacity-100 [@media(hover:hover)]:group-hover/row:opacity-100",
                (openSide || menuOpen) && "opacity-100"
              )}
            >
              <Ellipsis className="size-4" />
            </button>
          )}

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="menu"
                aria-label="Row actions"
                initial={{ opacity: 0, x: 12, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 8, scale: 0.96, transition: { duration: 0.14 } }}
                transition={reduced ? instant : { duration: 0.28, ease: EASE_OUT }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setMenuOpen(false)
                    rootRef.current?.querySelector<HTMLElement>("[aria-roledescription]")?.focus()
                  }
                }}
                className="absolute right-11 top-1/2 z-20 flex -translate-y-1/2 origin-right items-center gap-1 rounded-full bg-panel p-1 shadow-lg ring-1 ring-border"
              >
                {menuActions.map(({ action, direction }, i) => (
                  <button
                    key={action.id}
                    type="button"
                    role="menuitem"
                    autoFocus={i === 0}
                    onClick={() => void run(direction, action)}
                    className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 [&_svg]:size-3.5"
                    style={{ background: action.color ?? accent }}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Background actions */}
        {variant === "reveal" ? (
          <div className="absolute inset-0 z-0 bg-foreground/[0.05]">
            {rightActions.map((action, i) => (
              <RevealButton
                key={action.id}
                action={action}
                index={i}
                count={rightActions.length}
                side="right"
                open={openRight}
                x={x}
                accent={accent}
                tabbable={openSide === "right"}
                onPress={() => void run("left", action)}
              />
            ))}
            {leftActions.map((action, i) => (
              <RevealButton
                key={action.id}
                action={action}
                index={i}
                count={leftActions.length}
                side="left"
                open={openLeft}
                x={x}
                accent={accent}
                tabbable={openSide === "left"}
                onPress={() => void run("right", action)}
              />
            ))}
          </div>
        ) : (
          <CommitLayer
            action={primary(dir)}
            dir={dir}
            armed={armed}
            x={x}
            thresholdPx={thresholdPx}
            accent={accent}
            card={isCard}
            reduced={reduced}
          />
        )}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ SwipeList */

type RowPassthrough = Omit<SwipeRowProps, "children" | "leftActions" | "rightActions" | "onSwipe" | "onRemove" | "className">

export interface SwipeListProps<T> extends RowPassthrough {
  /** Items to render. Removed items animate out and the rest glide into place. */
  items: T[]
  /** Returns a stable key for an item. */
  getKey: (item: T) => string | number
  /** Renders the content of a row. */
  renderItem: (item: T, index: number) => ReactNode
  /** Actions revealed when dragging right, or a function returning them per item. Default: [] */
  leftActions?: SwipeAction[] | ((item: T) => SwipeAction[])
  /** Actions revealed when dragging left, or a function returning them per item. Default: [] */
  rightActions?: SwipeAction[] | ((item: T) => SwipeAction[])
  /** Called after an action runs on an item. */
  onSwipe?: (direction: SwipeDirection, action: SwipeAction, item: T) => void
  /** Called when a destructive action removes an item. The list hides it immediately either way. */
  onRemove?: (item: T) => void
  /** Shown when every item has been removed. */
  emptyState?: ReactNode
  /** Space between card rows in px (card variant). Default: 8 */
  gap?: number
  /** Classes for each row. */
  rowClassName?: string
  className?: string
}

export function SwipeList<T>({
  items,
  getKey,
  renderItem,
  leftActions = [],
  rightActions = [],
  onSwipe,
  onRemove,
  emptyState,
  gap = 8,
  rowClassName,
  className,
  variant = "reveal",
  radius = 14,
  ...rowProps
}: SwipeListProps<T>) {
  const reduced = useReducedMotion()
  const [hidden, setHidden] = useState<ReadonlySet<string | number>>(() => new Set())
  const [prevItems, setPrevItems] = useState(items)
  if (prevItems !== items) {
    setPrevItems(items)
    setHidden(new Set())
  }

  const visible = items.filter((item) => !hidden.has(getKey(item)))
  const isCard = variant === "card"
  const transition = reduced ? instant : layoutSpring
  const resolve = (a: SwipeAction[] | ((item: T) => SwipeAction[]), item: T) => (typeof a === "function" ? a(item) : a)

  return (
    <div className={cn("relative w-full", className)}>
      <motion.ul
        layout
        transition={transition}
        className={cn("relative flex flex-col", !isCard && visible.length > 0 && "overflow-hidden bg-card shadow-sm ring-1 ring-border")}
        style={{ borderRadius: isCard ? undefined : radius, gap: isCard ? gap : 0 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((item, i) => {
            const key = getKey(item)
            return (
              <motion.li
                key={key}
                layout="position"
                transition={transition}
                exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.18 } }}
                className={cn("relative", !isCard && i > 0 && "border-t")}
              >
                <SwipeRow
                  {...rowProps}
                  variant={variant}
                  radius={isCard ? radius : 0}
                  leftActions={resolve(leftActions, item)}
                  rightActions={resolve(rightActions, item)}
                  onSwipe={(direction, action) => onSwipe?.(direction, action, item)}
                  onRemove={() => {
                    setHidden((prev) => new Set(prev).add(key))
                    onRemove?.(item)
                  }}
                  className={rowClassName}
                >
                  {renderItem(item, i)}
                </SwipeRow>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </motion.ul>

      <AnimatePresence initial={false}>
        {visible.length === 0 && emptyState != null && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={reduced ? instant : { duration: 0.4, ease: EASE_OUT, delay: 0.1 }}
          >
            {emptyState}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
