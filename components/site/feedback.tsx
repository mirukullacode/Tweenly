"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Check, Loader2, MessageSquare, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { githubUrl } from "@/lib/docs"
import { cn } from "@/lib/utils"

type Status = "idle" | "sending" | "sent" | "error"

async function send(payload: Record<string, string>) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error ?? "Couldn't send feedback.")
}

const RATINGS = [
  { value: "love", label: "Love it" },
  { value: "ok", label: "It's OK" },
  { value: "needs-work", label: "Needs work" },
] as const

/** Sidebar button that opens a small feedback form. */
export function FeedbackButton({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState("")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState("")

  const close = () => {
    setOpen(false)
    if (status === "sent") {
      setRating("")
      setMessage("")
      setEmail("")
      setStatus("idle")
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("sending")
    setError("")
    try {
      await send({ rating, message, email, website, page: pathname })
      setStatus("sent")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Couldn't send feedback.")
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Send feedback"
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          className
        )}
      >
        <MessageSquare className="size-3.5" />
        {iconOnly ? <span className="sr-only">Send feedback</span> : "Feedback"}
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[70] grid place-items-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-label="Send feedback"
              onSubmit={submit}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onKeyDown={(e) => e.key === "Escape" && close()}
              className="relative w-full max-w-md rounded-2xl border bg-panel p-5 shadow-2xl shadow-black/25"
            >
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="absolute right-3 top-3 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>

              {status === "sent" ? (
                <div className="py-6 text-center">
                  <span className="mx-auto grid size-10 place-items-center rounded-full bg-brand/12 text-brand">
                    <Check className="size-5" />
                  </span>
                  <p className="mt-3 text-[15px] font-semibold">Thank you</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">Every message is read. It shapes what gets built next.</p>
                </div>
              ) : (
                <>
                  <p className="text-[15px] font-semibold tracking-tight">Send feedback</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">Bugs, ideas, components you want. About this page or the whole site.</p>

                  <div role="radiogroup" aria-label="Rating" className="mt-4 grid grid-cols-3 gap-2">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        role="radio"
                        aria-checked={rating === r.value}
                        onClick={() => setRating(rating === r.value ? "" : r.value)}
                        className={cn(
                          "h-9 rounded-xl border text-[12.5px] font-medium transition-colors",
                          rating === r.value ? "border-foreground bg-foreground text-background" : "hover:bg-accent"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <label className="mt-3 block">
                    <span className="sr-only">Message</span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      rows={4}
                      placeholder="What should we know?"
                      className="w-full resize-none rounded-xl border bg-inset px-3 py-2.5 text-[13.5px] outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/50"
                    />
                  </label>
                  <label className="mt-2 block">
                    <span className="sr-only">Email (optional)</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email, if you'd like a reply (optional)"
                      className="h-10 w-full rounded-xl border bg-inset px-3 text-[13.5px] outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/50"
                    />
                  </label>
                  {/* Hidden from people, tempting for bots */}
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="absolute -left-[9999px] h-0 w-0 opacity-0"
                    name="website"
                  />

                  {status === "error" && (
                    <p role="alert" className="mt-2 text-[12.5px] text-red-500">
                      {error}{" "}
                      <a href={`${githubUrl}/issues/new/choose`} target="_blank" rel="noreferrer" className="underline">
                        Open a GitHub issue instead
                      </a>
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <a
                      href={`${githubUrl}/issues/new/choose`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] text-muted-foreground hover:text-foreground"
                    >
                      Prefer GitHub?
                    </a>
                    <button
                      type="submit"
                      disabled={status === "sending" || (!rating && !message.trim())}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {status === "sending" && <Loader2 className="size-3.5 animate-spin" />}
                      Send
                    </button>
                  </div>
                </>
              )}
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

/** "Was this helpful?" row for the end of a docs page. */
export function HelpfulPrompt({ page }: { page: string }) {
  const [state, setState] = useState<"idle" | "sent" | "error">("idle")

  const vote = async (rating: "helpful" | "not-helpful") => {
    try {
      await send({ rating, page })
      setState("sent")
    } catch {
      setState("error")
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-inset px-3.5 py-2.5 text-[12.5px]">
      {state === "sent" ? (
        <span className="text-muted-foreground">Thanks for the feedback.</span>
      ) : state === "error" ? (
        <span className="text-muted-foreground">Couldn&apos;t send right now.</span>
      ) : (
        <>
          <span className="text-muted-foreground">Was this helpful?</span>
          <span className="flex gap-1">
            <button
              type="button"
              aria-label="Yes, this was helpful"
              onClick={() => vote("helpful")}
              className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ThumbsUp className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="No, this wasn't helpful"
              onClick={() => vote("not-helpful")}
              className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ThumbsDown className="size-3.5" />
            </button>
          </span>
        </>
      )}
    </div>
  )
}
