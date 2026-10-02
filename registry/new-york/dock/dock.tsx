"use client"

import { createContext, useContext, useState } from "react"
import {
  AnimatePresence,
  motion,
  useAnimate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type DockOrientation = "horizontal" | "vertical"
export type DockVariant = "glass" | "solid" | "minimal"
export type DockPosition = "static" | "fixed-bottom" | "fixed-left"

export interface DockSpring {
  /** Default: 450 */
  stiffness?: number
  /** Default: 34 */
  damping?: number
  /** Default: 0.25 */
  mass?: number
}

export interface DockProps {
  children: React.ReactNode
  /** Lay the items out in a row or a column. Default: "horizontal" */
  orientation?: DockOrientation
  /** Resting item size in px. Default: 44 */
  size?: number
  /** Item size in px right under the pointer. Default: 72 */
  magnification?: number
  /** How far from the pointer, in px, items still grow. Default: 140 */
  distance?: number
  /** Spring used for the magnification. Default: { stiffness: 450, damping: 34, mass: 0.25 } */
  spring?: DockSpring
  /** Surface style. Default: "glass" */
  variant?: DockVariant
  /** Where the dock sits. Default: "static" */
  position?: DockPosition
  /** Bounce items when clicked. Default: true */
  bounce?: boolean
  /** Accessible label for the dock. Default: "Dock" */
  label?: string
  className?: string
}

export interface DockItemProps {
  /** Tooltip text and accessible name. */
  label: string
  /** Render the item as a link. */
  href?: string
  /** Click handler. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  /** Show the active indicator dot. Default: false */
  active?: boolean
  /** Count shown in a bubble on the corner. Hidden when 0 or undefined. */
  badge?: number
  /** The icon. SVG children are sized to fit automatically. */
  children: React.ReactNode
  className?: string
}

interface DockContextValue {
  pointer: MotionValue<number>
  horizontal: boolean
  size: number
  magnification: number
  distance: number
  spring: Required<DockSpring>
  bounce: boolean
  reduced: boolean
}

const DockContext = createContext<DockContextValue | null>(null)

function useDock() {
  const ctx = useContext(DockContext)
  if (!ctx) throw new Error("DockItem and DockSeparator must be used inside <Dock>")
  return ctx
}

const ENTER = [0.22, 1, 0.36, 1] as const
const PAD = 8

const surface: Record<DockVariant, string> = {
  glass:
    "border border-border bg-background/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/45",
  solid: "border border-border bg-card shadow-[0_8px_28px_-10px_rgba(0,0,0,0.4)]",
  minimal: "bg-transparent",
}

const placement: Record<DockPosition, string> = {
  static: "relative",
  "fixed-bottom": "fixed bottom-4 left-1/2 z-50 -translate-x-1/2",
  "fixed-left": "fixed left-4 top-1/2 z-50 -translate-y-1/2",
}

export function Dock({
  children,
  orientation = "horizontal",
  size = 44,
  magnification = 72,
  distance = 140,
  spring,
  variant = "glass",
  position = "static",
  bounce = true,
  label = "Dock",
  className,
}: DockProps) {
  const reduced = useReducedMotion()
  const mouseX = useMotionValue(Infinity)
  const mouseY = useMotionValue(Infinity)
  const horizontal = orientation === "horizontal"

  const value: DockContextValue = {
    pointer: horizontal ? mouseX : mouseY,
    horizontal,
    size,
    magnification: Math.max(size, magnification),
    distance,
    spring: { stiffness: 450, damping: 34, mass: 0.25, ...spring },
    bounce,
    reduced,
  }

  const rest = size + PAD * 2

  return (
    <DockContext.Provider value={value}>
      <nav
        aria-label={label}
        onPointerMove={(e) => {
          if (e.pointerType === "touch") return
          mouseX.set(e.clientX)
          mouseY.set(e.clientY)
        }}
        onPointerLeave={() => {
          mouseX.set(Infinity)
          mouseY.set(Infinity)
        }}
        className={cn(
          "flex w-max gap-2 rounded-[22px]",
          horizontal ? "flex-row items-end" : "flex-col items-start",
          surface[variant],
          placement[position],
          className
        )}
        style={horizontal ? { height: rest, padding: `0 ${PAD}px ${PAD}px` } : { width: rest, padding: `${PAD}px 0 ${PAD}px ${PAD}px` }}
      >
        {children}
      </nav>
    </DockContext.Provider>
  )
}

export function DockItem({ label, href, onClick, active = false, badge, children, className }: DockItemProps) {
  const { pointer, horizontal, size, magnification, distance, spring, bounce, reduced } = useDock()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const open = hovered || focused

  const offset = useTransform(pointer, (p) => {
    const el = scope.current
    if (!el || !Number.isFinite(p)) return Infinity
    const r = el.getBoundingClientRect()
    return p - (horizontal ? r.left + r.width / 2 : r.top + r.height / 2)
  })
  const target = useTransform(offset, [-distance, 0, distance], reduced ? [size, size, size] : [size, magnification, size])
  const itemSize = useSpring(target, spring)
  const iconSize = useTransform(itemSize, (v) => v * 0.48)

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    onClick?.(e)
    if (bounce && !reduced && scope.current) {
      const hop = horizontal ? { y: [0, -18, 0, -6, 0] } : { x: [0, 18, 0, 6, 0] }
      animate(scope.current, hop, { duration: 0.7, ease: "easeOut" })
    }
  }

  const shared = {
    "aria-label": label,
    onClick: handleClick,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    className: cn(
      "relative flex size-full items-center justify-center rounded-[28%] border border-border bg-foreground/[0.06] text-foreground outline-none transition-colors hover:bg-foreground/[0.1] focus-visible:ring-2 focus-visible:ring-[#ff4d12] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className
    ),
  }

  const inner = (
    <motion.span aria-hidden="true" className="flex items-center justify-center [&_svg]:size-full" style={{ width: iconSize, height: iconSize }}>
      {children}
    </motion.span>
  )

  return (
    <motion.div
      ref={scope}
      className="relative shrink-0"
      style={{ width: itemSize, height: itemSize }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {href ? (
        <a href={href} aria-current={active ? "page" : undefined} {...shared}>
          {inner}
        </a>
      ) : (
        <button type="button" aria-pressed={active || undefined} {...shared}>
          {inner}
        </button>
      )}

      {badge ? (
        <motion.span
          key={badge}
          initial={reduced ? false : { scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="pointer-events-none absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff4d12] px-1 text-[10px] font-semibold leading-none text-white shadow ring-2 ring-background"
        >
          {badge > 99 ? "99+" : badge}
        </motion.span>
      ) : null}

      <AnimatePresence>
        {active && (
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: ENTER }}
            className={cn(
              "pointer-events-none absolute size-1 rounded-full bg-foreground/70",
              horizontal ? "-bottom-[6px] left-1/2 -ml-0.5" : "-left-[6px] top-1/2 -mt-0.5"
            )}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, ...(horizontal ? { y: 6 } : { x: -6 }) }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, ...(horizontal ? { y: 4 } : { x: -4 }) }}
            transition={reduced ? { duration: 0.12 } : { type: "spring", stiffness: 500, damping: 32 }}
            className={cn(
              "pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md",
              horizontal ? "bottom-full left-1/2 mb-2.5 -translate-x-1/2 origin-bottom" : "left-full top-1/2 ml-3 -translate-y-1/2 origin-left"
            )}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function DockSeparator({ className }: { className?: string }) {
  const { horizontal } = useDock()
  return (
    <div
      role="separator"
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      className={cn("shrink-0 bg-border", horizontal ? "mx-1 w-px self-stretch mt-3" : "my-1 h-px self-stretch mr-3", className)}
    />
  )
}
