"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check, Heart, Loader2 } from "lucide-react"
import { track } from "@/lib/analytics"
import { monthlyTiers, oneTime } from "@/lib/sponsor"
import { cn } from "@/lib/utils"

type Mode = "monthly" | "one-time"
const EASE = [0.22, 1, 0.36, 1] as const

async function startCheckout(tier: string, amount?: number) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, amount }),
  })
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !data.url) throw new Error(data.error ?? "Couldn't start checkout.")
  window.location.href = data.url
}

export function SponsorPlans() {
  const [mode, setMode] = useState<Mode>("monthly")
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [amount, setAmount] = useState(15)
  const [custom, setCustom] = useState("")

  const checkout = async (tier: string, dollars?: number) => {
    setPending(tier)
    setError("")
    track("sponsor_checkout", { tier, amount: dollars ?? monthlyTiers.find((t) => t.id === tier)?.price ?? 0 })
    try {
      await startCheckout(tier, dollars)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout.")
      setPending(null)
    }
  }

  const customValue = Number(custom)
  const chosen = custom ? customValue : amount
  const validOneTime = Number.isInteger(chosen) && chosen >= oneTime.min && chosen <= oneTime.max

  return (
    <div>
      <div className="mx-auto flex w-fit rounded-full border bg-inset p-1">
        {(["monthly", "one-time"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m)
              setError("")
            }}
            className={cn(
              "relative rounded-full px-5 py-1.5 text-[13px] font-medium transition-colors",
              mode === m ? "text-background" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode === m && (
              <motion.span
                layoutId="sponsor-mode"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-full bg-foreground"
              />
            )}
            <span className="relative">{m === "monthly" ? "Monthly" : "One-time"}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mode === "monthly" ? (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: EASE }}
            className="mt-8 grid gap-3 md:grid-cols-3"
          >
            {monthlyTiers.map((tier, i) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.06 }}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-inset p-5",
                  tier.featured && "border-brand/40 shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand)_25%,transparent),0_20px_50px_-20px_color-mix(in_oklab,var(--brand)_45%,transparent)]"
                )}
              >
                {tier.featured && (
                  <span className="absolute -top-2.5 left-5 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-medium text-white">
                    Most popular
                  </span>
                )}
                <p className="text-[14px] font-semibold">{tier.name}</p>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">${tier.price}</span>
                  <span className="text-[13px] text-muted-foreground">/ month</span>
                </p>
                <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{tier.description}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex gap-2 text-[13px]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-brand" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => checkout(tier.id)}
                  className={cn(
                    "mt-5 flex h-10 items-center justify-center gap-2 rounded-full text-[13px] font-medium transition-opacity disabled:opacity-60",
                    tier.featured ? "bg-brand text-white hover:opacity-90" : "bg-foreground text-background hover:opacity-90"
                  )}
                >
                  {pending === tier.id ? <Loader2 className="size-4 animate-spin" /> : <>Sponsor ${tier.price}/mo</>}
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="one-time"
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: EASE }}
            className="mx-auto mt-8 max-w-md rounded-2xl border bg-inset p-6"
          >
            <p className="text-[14px] font-semibold">Make a one-time contribution</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Any amount helps cover hosting and time for new components.</p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {oneTime.presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setAmount(p)
                    setCustom("")
                  }}
                  className={cn(
                    "relative h-11 rounded-xl border text-[14px] font-medium tabular-nums transition-colors",
                    !custom && amount === p ? "border-transparent text-background" : "bg-panel hover:border-foreground/20"
                  )}
                >
                  {!custom && amount === p && (
                    <motion.span
                      layoutId="sponsor-amount"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      className="absolute inset-0 rounded-xl bg-foreground"
                    />
                  )}
                  <span className="relative">${p}</span>
                </button>
              ))}
              <label
                className={cn(
                  "flex h-11 items-center rounded-xl border bg-panel px-2.5 text-[14px] transition-colors focus-within:border-brand/50",
                  custom && "border-brand/50"
                )}
              >
                <span className="text-muted-foreground">$</span>
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="Other"
                  aria-label="Custom amount in dollars"
                  className="w-full min-w-0 bg-transparent pl-0.5 tabular-nums outline-none placeholder:text-muted-foreground/60"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={pending !== null || !validOneTime}
              onClick={() => checkout("one-time", chosen)}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending === "one-time" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Heart className="size-4 fill-current" />
                  {validOneTime ? `Sponsor $${chosen}` : `Enter $${oneTime.min} to $${oneTime.max}`}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p aria-live="polite" className="mt-4 min-h-5 text-center text-[13px] text-red-500">
        {error}
      </p>
    </div>
  )
}
