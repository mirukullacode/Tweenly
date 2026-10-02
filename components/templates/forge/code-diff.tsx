"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion, useInView } from "motion/react"
import { Check, Sparkles, Undo2 } from "lucide-react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"
import { ACCENT, ENTER, SPRING, WindowFrame } from "./shared"

type Kind = "ctx" | "del" | "add"

const DIFF: { id: string; kind: Kind; code: string }[] = [
  { id: "a", kind: "ctx", code: "export function formatPrice(" },
  { id: "b", kind: "del", code: "  amount, currency" },
  { id: "c", kind: "add", code: "  amount: number," },
  { id: "d", kind: "add", code: '  currency = "USD"' },
  { id: "e", kind: "ctx", code: ") {" },
  { id: "f", kind: "del", code: '  return currency + amount.toFixed(2)' },
  { id: "g", kind: "add", code: "  return new Intl.NumberFormat(\"en\", {" },
  { id: "h", kind: "add", code: '    style: "currency", currency,' },
  { id: "i", kind: "add", code: "  }).format(amount)" },
  { id: "j", kind: "ctx", code: "}" },
]

const ROW: Record<Kind, string> = {
  ctx: "text-foreground/80",
  del: "bg-red-500/10 text-red-700 dark:text-red-300",
  add: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

export function CodeDiff() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduced = useReducedMotion()
  const [applied, setApplied] = useState(false)
  const rows = applied ? DIFF.filter((l) => l.kind !== "del") : DIFF

  return (
    <div ref={ref} className="h-full">
      <WindowFrame
        title="lib/utils.ts"
        right={
          <span className="font-mono text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400">+5</span>{" "}
            <span className="text-red-600 dark:text-red-400">−2</span>
          </span>
        }
        className="h-full bg-background/60"
      >
        <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-xl border bg-card font-mono text-[11.5px] leading-6 sm:text-[12.5px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {rows.map((line, i) => {
                const kind: Kind = applied ? "ctx" : line.kind
                return (
                  <motion.div
                    key={line.id}
                    layout={reduced ? false : "position"}
                    initial={{ opacity: 0, x: -8 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                    exit={{ opacity: 0, scaleY: 0.4, transition: { duration: reduced ? 0 : 0.25, ease: ENTER } }}
                    transition={{
                      duration: reduced ? 0 : 0.4,
                      delay: reduced || applied ? 0 : 0.15 + i * 0.07,
                      ease: ENTER,
                      layout: SPRING,
                    }}
                    className={cn("flex origin-top whitespace-pre px-3 transition-colors duration-500", ROW[kind])}
                  >
                    <span className="w-4 shrink-0 select-none opacity-60">
                      {kind === "del" ? "−" : kind === "add" ? "+" : " "}
                    </span>
                    <span className="truncate">{line.code}</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <div className="mt-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setApplied(true)}
              disabled={applied}
              className={cn(
                "relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-lg px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                applied ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-foreground text-background hover:bg-foreground/85"
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={applied ? "done" : "apply"}
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: reduced ? 0 : 0.3, ease: ENTER }}
                >
                  {applied ? (
                    <>
                      <Check className="size-3.5" strokeWidth={2.5} /> Applied
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" style={{ color: ACCENT }} /> Apply suggestion
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
            {applied && (
              <motion.button
                type="button"
                onClick={() => setApplied(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Undo2 className="size-3.5" /> Undo
              </motion.button>
            )}
            <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">Typed, locale-aware</span>
          </div>
        </div>
      </WindowFrame>
    </div>
  )
}
