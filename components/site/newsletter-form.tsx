"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check, Loader2 } from "lucide-react"
import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"

type Status = "idle" | "loading" | "done" | "error"

export function NewsletterForm({
  source,
  title = "Get new components in your inbox",
  description = "One short email when new components ship. No spam, unsubscribe anytime.",
  className,
}: {
  /** Where the form lives, for analytics and your mailing list. */
  source: string
  title?: string
  description?: string
  className?: string
}) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "loading") return
    setStatus("loading")
    setMessage("")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.")
      setStatus("done")
      setMessage("You're in. Watch for the next release.")
      setEmail("")
      track("newsletter_subscribe", { from: source })
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Something went wrong.")
    }
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      {title && <p className="text-[14px] font-semibold tracking-tight">{title}</p>}
      {description && <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{description}</p>}
      <form onSubmit={submit} className="mt-3 flex h-11 items-center gap-1 rounded-full border bg-panel/70 p-1 pl-4 transition-shadow focus-within:ring-2 focus-within:ring-brand/40">
        <label htmlFor={`nl-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`nl-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status !== "loading") setStatus("idle")
          }}
          placeholder="you@company.com"
          autoComplete="email"
          className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          disabled={status === "loading"}
          className={cn(
            "relative grid h-9 min-w-9 place-items-center overflow-hidden rounded-full px-3 text-[12.5px] font-medium transition-colors",
            status === "done" ? "bg-emerald-500 text-white" : "bg-foreground text-background hover:opacity-90"
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={status === "loading" ? "l" : status === "done" ? "d" : "i"}
              initial={{ y: 12, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -12, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-1.5"
            >
              {status === "loading" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : status === "done" ? (
                <Check className="size-3.5" />
              ) : (
                <>
                  Subscribe <ArrowRight className="size-3.5" />
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </form>
      <p
        aria-live="polite"
        className={cn(
          "mt-2 min-h-[1.1rem] px-4 text-[12px]",
          status === "error" ? "text-red-500" : "text-muted-foreground"
        )}
      >
        {message}
      </p>
    </div>
  )
}
