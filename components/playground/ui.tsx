"use client"

import { useId, useMemo, useState } from "react"
import { motion } from "motion/react"
import { ChevronDown, RotateCcw } from "lucide-react"
import { highlight } from "sugar-high"
import { CopyButton } from "@/components/docs/copy-button"
import { cn } from "@/lib/utils"

export function Panel({ id, index, title, description, children }: {
  id: string
  index: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 space-y-5">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11.5px] text-muted-foreground">{index}</span>
        <div>
          <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-[14px] leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border bg-panel">{children}</div>
    </section>
  )
}

/** Two-column body: preview on the left, controls on the right (stacked on small screens). */
export function PanelBody({ preview, controls }: { preview: React.ReactNode; controls: React.ReactNode }) {
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0 p-3">{preview}</div>
      <div className="space-y-4 border-t p-5 lg:border-l lg:border-t-0">{controls}</div>
    </div>
  )
}

export function Stage({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative grid min-h-64 place-items-center overflow-hidden rounded-2xl border bg-inset p-6", className)}>
      {children}
    </div>
  )
}

export function Label({ children, hint, htmlFor }: { children: React.ReactNode; hint?: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="font-mono text-[11.5px] text-muted-foreground">
        {children}
      </label>
      {hint}
    </div>
  )
}

/** Range slider with a solid fill bar (no gradient track). */
export function Slider({ label, value, min, max, step, unit, onChange, format }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  const id = useId()
  const fill = (Math.min(Math.max(value, min), max) - min) / (max - min)
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        hint={
          <span className="font-mono text-[11.5px] tabular-nums text-foreground">
            {format ? format(value) : value}
            {unit && <span className="ml-0.5 text-muted-foreground">{unit}</span>}
          </span>
        }
      >
        {label}
      </Label>
      <div className="relative h-[18px]">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-foreground/15">
          <div
            className="h-full w-full origin-left rounded-full bg-foreground"
            style={{ transform: `scaleX(${fill})` }}
          />
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent outline-none",
            "[&::-webkit-slider-runnable-track]:h-[18px] [&::-webkit-slider-runnable-track]:bg-transparent",
            "[&::-webkit-slider-thumb]:mt-0.5 [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_var(--panel)] [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-110",
            "[&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:shadow-[0_0_0_4px_var(--panel)]",
            "focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-brand/60"
          )}
        />
      </div>
    </div>
  )
}

export function Segmented<T extends string>({ label, options, value, onChange, format }: {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  format?: (v: T) => string
}) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <span className="font-mono text-[11.5px] text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-foreground/[0.05] p-0.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={cn(
              "relative flex-1 rounded-md px-1.5 py-1 text-[11.5px] transition-colors",
              value === o ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {value === o && (
              <motion.span
                layoutId={`pg-seg-${id}`}
                className="absolute inset-0 rounded-md bg-panel shadow-sm ring-1 ring-border"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{format ? format(o) : o}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function Select<T extends string>({ label, options, value, onChange }: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-8 w-full cursor-pointer appearance-none rounded-lg border bg-foreground/[0.03] pl-2.5 pr-8 font-mono text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-popover">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}

export function ActionButton({ onClick, label, children, icon = true }: {
  onClick: () => void
  label: string
  children: React.ReactNode
  icon?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-panel px-3 text-[12.5px] font-medium text-foreground shadow-sm transition-colors hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {icon && <RotateCcw className="size-3.5 text-muted-foreground" />}
      {children}
    </button>
  )
}

export function ReducedMotionNote() {
  return (
    <p className="rounded-lg border border-dashed px-3 py-2 text-[12px] leading-5 text-muted-foreground">
      Reduced motion is on, so previews show their end state. Generated code still works.
    </p>
  )
}

/** Tabbed code output with syntax highlighting and an always-visible copy button. */
export function CodeTabs({ tabs }: { tabs: { label: string; code: string }[] }) {
  const [active, setActive] = useState(0)
  const id = useId()
  const current = tabs[Math.min(active, tabs.length - 1)]
  const html = useMemo(() => highlight(current.code.trimEnd()), [current.code])

  return (
    <div className="border-t">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <div role="tablist" aria-label="Generated code" className="flex gap-1">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel`}
              onClick={() => setActive(i)}
              className={cn(
                "relative rounded-md px-2.5 py-1 font-mono text-[11.5px] transition-colors",
                i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {i === active && (
                <motion.span
                  layoutId={`pg-tab-${id}`}
                  className="absolute inset-0 rounded-md bg-foreground/[0.06]"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        <CopyButton value={current.code} />
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className="m-3 mt-2 rounded-2xl border bg-inset"
      >
        <pre className="mc-scroll max-h-80 overflow-auto py-4 pr-4 font-mono text-[12.5px] leading-[1.6]">
          <code className="code-lines block w-max min-w-full" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  )
}
