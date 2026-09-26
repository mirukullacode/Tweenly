"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface RatingProps {
  /** Controlled rating. */
  value?: number
  /** Initial rating when uncontrolled. Default: 0 */
  defaultValue?: number
  /** Called with the new rating when the user picks one. */
  onValueChange?: (value: number) => void
  /** Number of stars. Default: 5 */
  max?: number
  /** Allow half-star ratings. Default: true */
  allowHalf?: boolean
  /** Star size in px. Default: 28 */
  size?: number
  /** Fill color (any CSS color). Default: "#f59e0b" */
  color?: string
  /** Display only, no interaction. Default: false */
  readOnly?: boolean
  /** Accessible label. Default: "Rating" */
  "aria-label"?: string
  className?: string
}

const STAR = "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
const SPARKS = [0, 60, 120, 180, 240, 300].map((deg) => (deg * Math.PI) / 180)

const Star = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinejoin="round">
    <path d={STAR} />
  </svg>
)

export function Rating({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  allowHalf = true,
  size = 28,
  color = "#f59e0b",
  readOnly = false,
  "aria-label": ariaLabel = "Rating",
  className,
}: RatingProps) {
  const reduced = useReducedMotion()
  const [internal, setInternal] = useState(defaultValue)
  const [hover, setHover] = useState<number | null>(null)
  const [pop, setPop] = useState<{ index: number; n: number } | null>(null)
  const current = value ?? internal
  const shown = readOnly ? current : (hover ?? current)

  const [prev, setPrev] = useState(shown)
  const [from, setFrom] = useState(shown)
  if (shown !== prev) {
    setFrom(prev)
    setPrev(shown)
  }
  const rising = shown >= from

  const unit = allowHalf ? 0.5 : 1

  const commit = (next: number) => {
    const clamped = Math.min(max, Math.max(0, next))
    if (value === undefined) setInternal(clamped)
    onValueChange?.(clamped)
    if (clamped > 0) setPop((p) => ({ index: Math.ceil(clamped) - 1, n: (p?.n ?? 0) + 1 }))
  }

  const valueAt = (e: React.MouseEvent, i: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = (e.clientX - rect.left) / rect.width
    return allowHalf && fraction < 0.5 ? i + 0.5 : i + 1
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = { ArrowRight: unit, ArrowUp: unit, ArrowLeft: -unit, ArrowDown: -unit }[e.key]
    if (delta) commit(current + delta)
    else if (e.key === "Home") commit(0)
    else if (e.key === "End") commit(max)
    else return
    e.preventDefault()
  }

  const interactive = !readOnly
  const gap = Math.round(size * 0.15)

  return (
    <div
      role={interactive ? "slider" : "img"}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel : `${ariaLabel}: ${current} out of ${max}`}
      aria-valuenow={interactive ? current : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? max : undefined}
      aria-valuetext={interactive ? `${current} out of ${max}` : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      onPointerLeave={interactive ? () => setHover(null) : undefined}
      className={cn(
        "inline-flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        className
      )}
      style={{ gap }}
    >
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.min(1, Math.max(0, shown - i))
        const steps = rising ? i - Math.floor(from) : Math.ceil(from) - 1 - i
        const popping = pop?.index === i
        return (
          <motion.span
            key={i}
            className={cn("relative block", interactive && "cursor-pointer")}
            style={{ width: size, height: size }}
            onPointerMove={interactive ? (e) => setHover(valueAt(e, i)) : undefined}
            onClick={interactive ? (e) => commit(valueAt(e, i)) : undefined}
            whileHover={interactive && !reduced ? { scale: 1.1 } : undefined}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <motion.span
              key={popping ? pop.n : "still"}
              className="absolute inset-0"
              initial={popping && !reduced ? { scale: 0.6, rotate: -12 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 520, damping: 12 }}
            >
              <Star className="absolute inset-0 size-full text-muted-foreground/25" />
              <motion.span
                className="absolute inset-y-0 left-0 overflow-hidden"
                initial={false}
                animate={{ width: `${fill * 100}%` }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 600, damping: 45, delay: Math.max(0, steps) * 0.035 }
                }
              >
                <Star className="block max-w-none" style={{ width: size, height: size, color }} />
              </motion.span>
            </motion.span>

            {popping && !reduced && (
              <span key={`spark-${pop.n}`} aria-hidden="true" className="pointer-events-none absolute inset-0">
                {SPARKS.map((angle, s) => (
                  <motion.span
                    key={s}
                    className="absolute left-1/2 top-1/2 size-1 rounded-full"
                    style={{ background: color, marginLeft: -2, marginTop: -2 }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * size * 0.85,
                      y: Math.sin(angle) * size * 0.85,
                      opacity: 0,
                      scale: 0.3,
                    }}
                    transition={{ duration: 0.55, ease: [0.2, 0.8, 0.3, 1] }}
                  />
                ))}
              </span>
            )}
          </motion.span>
        )
      })}
    </div>
  )
}
