"use client"

import { useId, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface SegmentedControlOption {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface SegmentedControlProps {
  /** Options to choose from, in order. */
  options: SegmentedControlOption[]
  /** Controlled selected value. */
  value?: string
  /** Initially selected value when uncontrolled. Default: first option */
  defaultValue?: string
  /** Called with the new value when the selection changes. */
  onValueChange?: (value: string) => void
  /** Control size. Default: "md" */
  size?: "sm" | "md" | "lg"
  /** Pill color (any CSS color). Default: the theme surface color */
  pillColor?: string
  /** Spring stiffness of the sliding pill. Default: 400 */
  stiffness?: number
  /** Spring damping of the sliding pill. Default: 32 */
  damping?: number
  /** Accessible label for the group. */
  "aria-label"?: string
  className?: string
}

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
}

export function SegmentedControl({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  pillColor,
  stiffness = 400,
  damping = 32,
  "aria-label": ariaLabel,
  className,
}: SegmentedControlProps) {
  const reduced = useReducedMotion()
  const id = useId()
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value)
  const selected = value ?? internal
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const select = (next: string) => {
    if (value === undefined) setInternal(next)
    if (next !== selected) onValueChange?.(next)
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    let next: number | undefined
    if (delta) next = (index + delta + options.length) % options.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = options.length - 1
    if (next === undefined) return
    e.preventDefault()
    select(options[next].value)
    refs.current[next]?.focus()
  }

  const activeIndex = options.findIndex((o) => o.value === selected)

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("relative inline-flex items-center rounded-full border bg-muted p-1", className)}
    >
      {options.map((option, i) => {
        const active = option.value === selected
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (activeIndex === -1 && i === 0) ? 0 : -1}
            onClick={() => select(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative inline-flex items-center justify-center rounded-full font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              sizes[size],
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-background shadow-sm ring-1 ring-border dark:bg-accent"
                style={pillColor ? { background: pillColor } : undefined}
                transition={reduced ? { duration: 0 } : { type: "spring", stiffness, damping }}
              />
            )}
            {option.icon && <span className="relative flex [&_svg]:size-[1.1em]">{option.icon}</span>}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
