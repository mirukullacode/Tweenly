"use client"

import { motion } from "motion/react"
import { ChevronDown } from "lucide-react"
import type { Control, DataRow, PropDoc, PropValue } from "@/lib/docs"
import { cn } from "@/lib/utils"

function Label({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[11.5px] text-muted-foreground">{children}</span>
      {hint}
    </div>
  )
}

function Segmented({ id, options, value, onChange }: {
  id: string
  options: readonly string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex rounded-lg bg-foreground/[0.05] p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "relative flex-1 rounded-md px-1.5 py-1 text-[11.5px] capitalize transition-colors",
            value === o ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {value === o && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-md bg-panel shadow-sm ring-1 ring-border"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative">{o}</span>
        </button>
      ))}
    </div>
  )
}

function Select({ options, value, onChange }: {
  options: readonly string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full cursor-pointer appearance-none rounded-lg border bg-foreground/[0.03] pl-2.5 pr-8 font-mono text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-popover">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

function NumberControl({ control, value, onChange }: {
  control: Extract<Control, { type: "number" }>
  value: number
  onChange: (v: number) => void
}) {
  const { min, max, step } = control
  const fill = ((Math.min(Math.max(value, min), max) - min) / (max - min)) * 100

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mc-range"
      style={{ "--fill": `${fill}%` } as React.CSSProperties}
    />
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex h-[18px] w-8 shrink-0 items-center rounded-full p-0.5 transition-colors",
        checked ? "justify-end bg-foreground" : "justify-start bg-foreground/15"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 35 }}
        className={cn("size-3.5 rounded-full shadow-sm", checked ? "bg-background" : "bg-panel")}
      />
    </button>
  )
}

const inputCls =
  "h-8 w-full rounded-lg border bg-foreground/[0.03] px-2.5 font-mono text-[12px] outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/50"

function isHex(v: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)
}

function DataTable({ name, rows, onChange }: { name: string; rows: DataRow[]; onChange: (rows: DataRow[]) => void }) {
  const columns = Object.keys(rows[0] ?? {})
  const numeric = new Set(columns.filter((c) => typeof rows[0]?.[c] === "number"))
  const grid = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) 14px` }

  const set = (ri: number, col: string, raw: string) =>
    onChange(rows.map((r, i) => (i === ri ? { ...r, [col]: numeric.has(col) ? Number(raw) || 0 : raw } : r)))

  // Nudge every number by up to ±30% so it's quick to try realistic variations
  const shuffle = () =>
    onChange(
      rows.map((r) => {
        const next = { ...r }
        numeric.forEach((c) => {
          const v = Number(r[c])
          next[c] = Math.max(0, Math.round(v * (0.7 + Math.random() * 0.6)))
        })
        return next
      })
    )

  return (
    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
      <Label
        hint={
          <span className="flex gap-2 text-[11px]">
            <button type="button" onClick={shuffle} className="text-muted-foreground hover:text-foreground">
              Shuffle
            </button>
          </span>
        }
      >
        {name}
      </Label>
      <div className="overflow-hidden rounded-lg border bg-foreground/[0.03]">
        <div className="grid gap-px border-b px-1.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground" style={grid}>
          {columns.map((c) => (
            <span key={c} className={cn("truncate px-1", numeric.has(c) && "text-right")}>
              {c}
            </span>
          ))}
        </div>
        <div className="mc-scroll max-h-56 overflow-y-auto">
          {rows.map((row, ri) => (
            <div key={ri} className="group grid items-center gap-px px-1.5" style={grid}>
              {columns.map((c) => (
                <input
                  key={c}
                  value={String(row[c] ?? "")}
                  onChange={(e) => set(ri, c, e.target.value)}
                  inputMode={numeric.has(c) ? "decimal" : "text"}
                  aria-label={`${c} row ${ri + 1}`}
                  className={cn(
                    "h-7 min-w-0 rounded bg-transparent px-1 font-mono text-[11.5px] outline-none focus:bg-foreground/[0.06]",
                    numeric.has(c) && "text-right tabular-nums"
                  )}
                />
              ))}
              <button
                type="button"
                aria-label={`Remove row ${ri + 1}`}
                onClick={() => rows.length > 1 && onChange(rows.filter((_, i) => i !== ri))}
                className="text-[13px] leading-none text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange([...rows, { ...rows[rows.length - 1] }])}
          className="w-full border-t py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
        >
          + Add row
        </button>
      </div>
    </div>
  )
}

export function PropControl({ prop, value, onChange }: {
  prop: PropDoc & { control: Control }
  value: PropValue | undefined
  onChange: (v: PropValue) => void
}) {
  const { control } = prop

  if (control.type === "data") {
    return <DataTable name={prop.name} rows={Array.isArray(value) ? value : []} onChange={onChange} />
  }

  if (control.type === "boolean") {
    return (
      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="font-mono text-[11.5px] text-muted-foreground">{prop.name}</span>
        <Switch checked={Boolean(value)} onChange={onChange} />
      </label>
    )
  }

  if (control.type === "number") {
    const v = Number(value ?? 0)
    return (
      <div className="space-y-1.5">
        <Label
          hint={
            <span className="flex items-center font-mono text-[11.5px] tabular-nums text-foreground">
              <input
                type="number"
                value={v}
                min={control.min}
                max={control.max}
                step={control.step}
                onChange={(e) => onChange(Number(e.target.value))}
                aria-label={prop.name}
                className="w-16 bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              {control.unit && <span className="ml-0.5 text-muted-foreground">{control.unit}</span>}
            </span>
          }
        >
          {prop.name}
        </Label>
        <NumberControl control={control} value={v} onChange={onChange} />
      </div>
    )
  }

  if (control.type === "select") {
    const v = String(value ?? "")
    const segmented =
      control.options.length <= 5 && control.options.join("").length <= 26
    return (
      <div className="space-y-1.5">
        <Label>{prop.name}</Label>
        {segmented ? (
          <Segmented id={prop.name} options={control.options} value={v} onChange={onChange} />
        ) : (
          <Select options={control.options} value={v} onChange={onChange} />
        )}
      </div>
    )
  }

  if (control.type === "color") {
    const v = String(value ?? "")
    return (
      <div className="space-y-1.5">
        <Label>{prop.name}</Label>
        <div className="flex gap-1.5">
          <label
            className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border"
            style={{ background: v }}
          >
            <input
              type="color"
              value={isHex(v) ? v : "#ffffff"}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label={`${prop.name} picker`}
            />
          </label>
          <input value={v} onChange={(e) => onChange(e.target.value)} className={inputCls} spellCheck={false} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label>{prop.name}</Label>
      <input
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        spellCheck={false}
      />
    </div>
  )
}
