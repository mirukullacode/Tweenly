"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LikeButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "children"> {
  /** Initial state when uncontrolled. Default: false */
  defaultLiked?: boolean
  /** Controlled liked state. */
  liked?: boolean
  /** Called with the next state when toggled. */
  onChange?: (liked: boolean) => void
  /** Like count, excluding the viewer's own like. Default: 128 */
  count?: number
  /** Heart, ring and particle color. Default: "#f43f5e" */
  color?: string
  /** Heart size in px. Default: 22 */
  size?: number
  /** Number of particles in the burst. Default: 8 */
  particles?: number
}

export function LikeButton({
  defaultLiked = false,
  liked: likedProp,
  onChange,
  count = 128,
  color = "#f43f5e",
  size = 22,
  particles = 8,
  className,
  type = "button",
  onClick,
  ...props
}: LikeButtonProps) {
  const reduced = useReducedMotion()
  const [internal, setInternal] = useState(defaultLiked)
  const [burst, setBurst] = useState(0)
  const liked = likedProp ?? internal
  const total = count + (liked ? 1 : 0)

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    const next = !liked
    if (likedProp === undefined) setInternal(next)
    if (next) setBurst((b) => b + 1)
    onChange?.(next)
  }

  const box = size * 2
  const n = Math.max(0, Math.round(particles))
  const dots = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    return { x: Math.cos(angle) * size * 1.15, y: Math.sin(angle) * size * 1.15, big: i % 2 === 0 }
  })

  return (
    <button
      type={type}
      {...props}
      aria-pressed={liked}
      onClick={toggle}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-medium tabular-nums text-muted-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      <span className="relative grid place-items-center" style={{ width: box * 0.7, height: box * 0.7 }}>
        {burst > 0 && liked && !reduced && (
          <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
            <motion.span
              className="absolute rounded-full"
              style={{ width: box, height: box, border: `2px solid ${color}` }}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 1, opacity: 0, borderWidth: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.3, 1] }}
            />
            {dots.map((d, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{ width: d.big ? 5 : 3.5, height: d.big ? 5 : 3.5, background: color }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x: d.x, y: d.y, scale: [0, 1.2, 0], opacity: [1, 1, 0] }}
                transition={{ duration: 0.6, delay: 0.08, ease: [0.2, 0.8, 0.3, 1] }}
              />
            ))}
          </span>
        )}
        <motion.span
          key={liked && !reduced ? `on-${burst}` : "off"}
          className="relative grid place-items-center"
          initial={burst > 0 && liked && !reduced ? { scale: 0.3 } : false}
          animate={{ scale: 1 }}
          whileTap={reduced ? undefined : { scale: 0.85 }}
          transition={{ type: "spring", stiffness: 520, damping: 14 }}
        >
          <Heart
            aria-hidden="true"
            className={cn("transition-colors duration-200", !liked && "group-hover:text-foreground")}
            style={{ width: size, height: size, color: liked ? color : undefined }}
            fill={liked ? color : "transparent"}
            strokeWidth={liked ? 0 : 2}
          />
        </motion.span>
      </span>
      <span className="sr-only">Like</span>
      <RollingNumber value={total} up={liked} reduced={!!reduced} className={liked ? "text-foreground" : undefined} />
    </button>
  )
}

function RollingNumber({
  value,
  up,
  reduced,
  className,
}: {
  value: number
  up: boolean
  reduced: boolean
  className?: string
}) {
  const digits = value.toLocaleString("en-US").split("")
  const offset = reduced ? 0 : 1

  return (
    <span className={cn("inline-flex overflow-hidden transition-colors", className)} aria-live="polite">
      {digits.map((d, i) => {
        const position = digits.length - i
        return (
          <span key={position} className="relative inline-block">
            <AnimatePresence mode="popLayout" initial={false} custom={up}>
              <motion.span
                key={d}
                custom={up}
                className="inline-block"
                variants={{
                  enter: (goingUp: boolean) => ({ y: `${(goingUp ? 1 : -1) * offset * 100}%`, opacity: 0 }),
                  center: { y: "0%", opacity: 1 },
                  exit: (goingUp: boolean) => ({ y: `${(goingUp ? -1 : 1) * offset * 100}%`, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              >
                {d}
              </motion.span>
            </AnimatePresence>
          </span>
        )
      })}
    </span>
  )
}
