"use client"

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Download, Link2, Loader2, Share2, X } from "lucide-react"
import { confetti } from "@/registry/new-york/confetti/confetti"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

/*
 * Celebration dialog for a new runner record: a live preview of the sunflower
 * card, share actions, and a form that emails the player their card.
 * Query building mirrors lib/achievement-card.tsx, kept separate so next/og
 * never lands in the client bundle.
 */

export type AchievementCharacter = "dino" | "cat" | "mark"

type Status = "idle" | "sending" | "sent" | "error"

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const PALETTE = ["#ffc93c", "#ffb000", "#f59e0b", "#ff4d12", "#ff8a4c", "#3b2412"]
const MAX_NAME = 32

function cleanName(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f-\u009f<>{}[\]\\`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME)
}

function cardQuery(p: { name: string; score: number; date: string; character: AchievementCharacter }) {
  const q = new URLSearchParams()
  if (p.name) q.set("name", p.name)
  q.set("score", String(p.score))
  q.set("date", p.date)
  q.set("character", p.character)
  return q.toString()
}

const subscribeNoop = () => () => {}
const canNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function"

/* ---------------------------------------------------------------- copy link */

/** Copies `url` to the clipboard and confirms for a moment. */
export function CopyLinkButton({ url, className, label = "Copy link" }: { url: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt("Copy this link", url)
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  )
}

/* ---------------------------------------------------------------- sunflower */

const petal = (r0: number, len: number, w: number) =>
  `M0 ${-r0}C${w} ${-(r0 + len * 0.3)} ${w * 0.75} ${-(r0 + len * 0.8)} 0 ${-(r0 + len)}C${-w * 0.75} ${-(r0 + len * 0.8)} ${-w} ${-(r0 + len * 0.3)} 0 ${-r0}Z`

const LAYERS = [
  { count: 22, len: 118, w: 26, fill: "#f59e0b", offset: 0 },
  { count: 18, len: 104, w: 28, fill: "#ffb000", offset: 10 },
  { count: 14, len: 84, w: 26, fill: "#ffc93c", offset: 4 },
]

function Sunflower({ className }: { className?: string }) {
  return (
    <svg viewBox="-200 -200 400 400" className={className} aria-hidden>
      {LAYERS.map((l, li) => (
        <g key={li}>
          {Array.from({ length: l.count }, (_, i) => (
            <path key={i} d={petal(60, l.len, l.w)} fill={l.fill} transform={`rotate(${(i * 360) / l.count + l.offset})`} />
          ))}
        </g>
      ))}
      <circle r="72" fill="#3b2412" />
      <circle r="58" fill="none" stroke="#24150a" strokeWidth="6" strokeDasharray="2 10" />
      <circle r="38" fill="none" stroke="#6b4423" strokeWidth="5" strokeDasharray="2 9" />
    </svg>
  )
}

/* ---------------------------------------------------------------- dialog */

export type AchievementDialogProps = {
  /** Whether the dialog is shown. Default: false */
  open: boolean
  /** The record score to celebrate. Default: none (required) */
  score: number
  /** Runner character shown on the card. Default: "mark" */
  character?: AchievementCharacter
  /** Called on Escape, backdrop click or the close button. Default: none (required) */
  onClose: () => void
}

/** Celebrates a new runner record and offers the sunflower card. */
export function AchievementDialog({ open, score, character = "mark", onClose }: AchievementDialogProps) {
  return (
    <AnimatePresence>
      {open ? <AchievementPanel key="achievement" score={score} character={character} onClose={onClose} /> : null}
    </AnimatePresence>
  )
}

function AchievementPanel({ score, character, onClose }: { score: number; character: AchievementCharacter; onClose: () => void }) {
  const reduced = useReducedMotion()
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)

  const [date] = useState(() => new Date().toISOString().slice(0, 10))
  const [name, setName] = useState("")
  const [previewName, setPreviewName] = useState("")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState("")
  const [emailed, setEmailed] = useState(false)
  const [previewLoaded, setPreviewLoaded] = useState("")
  const nativeShare = useSyncExternalStore(subscribeNoop, canNativeShare, () => false)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Debounce the preview so the image route isn't hit on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setPreviewName(cleanName(name)), 400)
    return () => clearTimeout(t)
  }, [name])

  // Focus, scroll lock, Escape, focus trap, and focus restore
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusTimer = setTimeout(() => nameRef.current?.focus(), 60)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== "Tab" || !panelRef.current) return
      const items = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])

  // A warm burst once the sunflower has bloomed
  useEffect(() => {
    const t = setTimeout(() => {
      void confetti({ particleCount: 110, spread: 80, origin: { x: 0.5, y: 0.35 }, colors: PALETTE, zIndex: 120 })
    }, 280)
    return () => clearTimeout(t)
  }, [])

  const card = { name: previewName, score, date, character }
  const query = cardQuery(card)
  const imageUrl = `/api/achievement/image?${query}&format=portrait`
  const origin = useSyncExternalStore(subscribeNoop, () => window.location.origin, () => "")
  const shareUrl = `${origin}/achievement?${query}`
  const shareText = `New record on tweenly runner: ${score.toLocaleString("en-US")}`
  const xUrl = `https://x.com/intent/tweet?${new URLSearchParams({ text: shareText, url: shareUrl })}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: shareUrl })}`

  const share = async () => {
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const file = new File([blob], `tweenly-record-${score}.png`, { type: "image/png" })
      const data: ShareData = { title: "tweenly runner record", text: shareText, url: shareUrl }
      if (navigator.canShare?.({ files: [file] })) data.files = [file]
      await navigator.share(data)
    } catch {
      // Cancelled or unsupported: nothing to do
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const clean = cleanName(name)
    if (!clean) {
      setStatus("error")
      setError("Add your name for the card.")
      nameRef.current?.focus()
      return
    }
    setStatus("sending")
    setError("")
    try {
      const res = await fetch("/api/achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean, email: email.trim(), score, character, consent, website }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; emailed?: boolean }
      if (!res.ok) throw new Error(data.error ?? "Couldn't send your record.")
      setPreviewName(clean)
      setEmailed(Boolean(data.emailed))
      setStatus("sent")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Couldn't send your record.")
    }
  }

  const action =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d12]"
  const field =
    "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-[#ff4d12]"

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative flex h-dvh w-full flex-col overflow-y-auto bg-background text-foreground shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-3xl sm:rounded-3xl sm:border"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
        transition={reduced ? { duration: 0.15 } : { type: "spring", stiffness: 450, damping: 34 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="grid gap-6 p-5 pt-6 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
          {/* Card preview and actions */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border bg-[#0a0a0a]">
              {previewLoaded !== imageUrl ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-[#8a8a8a]" aria-hidden />
                </div>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamic PNG from our own route */}
              <img
                key={imageUrl}
                src={imageUrl}
                alt={`Your record card: ${score.toLocaleString("en-US")}`}
                width={1080}
                height={1350}
                onLoad={() => setPreviewLoaded(imageUrl)}
                className={cn(
                  "relative h-full w-full object-cover transition-opacity duration-300",
                  previewLoaded === imageUrl ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href={imageUrl} download={`tweenly-record-${score}.png`} className={action}>
                <Download className="size-3.5" aria-hidden />
                Download
              </a>
              <CopyLinkButton url={shareUrl} className={action} />
              <a href={xUrl} target="_blank" rel="noreferrer" className={action}>
                Share on X
              </a>
              <a href={linkedInUrl} target="_blank" rel="noreferrer" className={action}>
                LinkedIn
              </a>
              {nativeShare ? (
                <button type="button" onClick={share} className={cn(action, "col-span-2")}>
                  <Share2 className="size-3.5" aria-hidden />
                  Share card
                </button>
              ) : null}
            </div>
          </div>

          {/* Celebration and form */}
          <div className="flex flex-col">
            <motion.div
              className="size-16"
              initial={reduced ? false : { scale: 0, rotate: -120 }}
              animate={reduced ? undefined : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 }}
            >
              <motion.div
                className="size-full"
                animate={reduced ? undefined : { rotate: 360 }}
                transition={{ duration: 40, ease: "linear", repeat: Infinity }}
              >
                <Sunflower className="size-full" />
              </motion.div>
            </motion.div>

            <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[#f59e0b]">Achievement unlocked</p>
            <h2 id={titleId} className="mt-2 text-2xl font-semibold tracking-tight">
              New high score: <span className="tabular-nums">{score.toLocaleString("en-US")}</span>
            </h2>
            <p id={descId} className="mt-2 text-sm text-muted-foreground">
              You set the record. Put your name on the sunflower card and we&apos;ll email it to you.
            </p>

            <AnimatePresence mode="wait" initial={false}>
              {status === "sent" ? (
                <motion.div
                  key="sent"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="mt-6 rounded-2xl border bg-card p-5"
                  role="status"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="size-4 text-[#ff4d12]" aria-hidden />
                    {emailed ? "Check your inbox" : "We've got your record"}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {emailed
                      ? "Your card is on its way. Share it while it's fresh."
                      : "Download your card above and share it while it's fresh."}
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={submit}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 flex flex-col gap-3"
                  noValidate
                >
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Name</span>
                    <input
                      ref={nameRef}
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                      maxLength={MAX_NAME}
                      required
                      autoComplete="nickname"
                      placeholder="How the card should say it"
                      className={field}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={field}
                    />
                  </label>
                  {/* Honeypot: hidden from people, tempting to bots */}
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden
                    className="absolute -left-[9999px] size-px opacity-0"
                  />
                  <label className="mt-1 flex items-start gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 size-4 accent-[#ff4d12]"
                    />
                    <span className="text-muted-foreground">Feature me in the tweenly hall of fame</span>
                  </label>
                  {status === "error" && error ? (
                    <p className="text-sm text-[#ff4d12]" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#ff4d12] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {status === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                    Send me my card
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
