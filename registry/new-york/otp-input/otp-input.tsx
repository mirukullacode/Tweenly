"use client"

import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion, type Transition, type Variants } from "motion/react"
import { cn } from "@/lib/utils"

export type OtpInputVariant = "boxes" | "line"
export type OtpInputStatus = "idle" | "loading" | "success" | "error"
export type OtpInputPattern = "numeric" | "alphanumeric"

export interface OtpInputProps {
  /** Number of characters in the code. Default: 6 */
  length?: number
  /** Visual style: rounded boxes or minimal underlines. Default: "boxes" */
  variant?: OtpInputVariant
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. Default: "" */
  defaultValue?: string
  /** Called on every change with the sanitized value. */
  onChange?: (value: string) => void
  /** Called once every slot is filled. */
  onComplete?: (code: string) => void
  /** Checks the completed code. Shows a loading shimmer while pending, then success or error. */
  verify?: (code: string) => Promise<boolean> | boolean
  /** Controlled status. Overrides the internal verify state. */
  status?: OtpInputStatus
  /** Show dots instead of characters. Default: false */
  masked?: boolean
  /** Accepted characters. Default: "numeric" */
  pattern?: OtpInputPattern
  /** Focus the input on mount. Default: false */
  autoFocus?: boolean
  /** Disable input. Default: false */
  disabled?: boolean
  /** Color of the success state (any CSS color). Default: "#22c55e" */
  successColor?: string
  /** Color of the error state (any CSS color). Default: "#ef4444" */
  errorColor?: string
  /** Clear the code and refocus after an error. Default: true */
  resetOnError?: boolean
  /** Boxes variant: collapse the slots into a check badge on success. Default: true */
  collapseOnSuccess?: boolean
  /** Accessible label for the input. Default: "Verification code" */
  label?: string
  className?: string
}

const BOX = 48
const BOX_GAP = 8
const LINE = 40
const LINE_GAP = 12

const pop: Transition = { type: "spring", stiffness: 520, damping: 30, mass: 0.6 }
const glide: Transition = { type: "spring", stiffness: 480, damping: 38 }

const rowShake: Variants = {
  rest: { x: 0 },
  shake: { x: [0, -10, 9, -6, 4, -2, 0], transition: { duration: 0.5, ease: "easeOut" } },
}

const slotWave: Variants = {
  rest: { x: 0 },
  shake: (i: number) => ({
    x: [0, -6, 5, -3, 1.5, 0],
    transition: { duration: 0.5, delay: i * 0.035, ease: "easeOut" },
  }),
}

const sanitize = (raw: string, pattern: OtpInputPattern) =>
  pattern === "numeric" ? raw.replace(/\D/g, "") : raw.replace(/[^a-z0-9]/gi, "").toUpperCase()

function Check({ className, delay = 0, instant }: { className?: string; delay?: number; instant?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <motion.path
        d="M3 8.5 6.5 12 13 4.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={instant ? { duration: 0 } : { duration: 0.35, ease: "easeOut", delay }}
      />
    </svg>
  )
}

function Caret({ className, reduced }: { className?: string; reduced: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      className={cn("pointer-events-none absolute w-px rounded-full bg-foreground", className)}
      animate={{ opacity: reduced ? 1 : [1, 1, 0, 0] }}
      transition={reduced ? { duration: 0 } : { duration: 1.05, times: [0, 0.5, 0.6, 1], repeat: Infinity, ease: "linear" }}
    />
  )
}

export function OtpInput({
  length = 6,
  variant = "boxes",
  value: valueProp,
  defaultValue = "",
  onChange,
  onComplete,
  verify,
  status: statusProp,
  masked = false,
  pattern = "numeric",
  autoFocus = false,
  disabled = false,
  successColor = "#22c55e",
  errorColor = "#ef4444",
  resetOnError = true,
  collapseOnSuccess = true,
  label = "Verification code",
  className,
}: OtpInputProps) {
  const id = useId()
  const reduced = useReducedMotion() ?? false
  const inputRef = useRef<HTMLInputElement>(null)
  const runRef = useRef(0)

  const [inner, setInner] = useState(defaultValue)
  const [innerStatus, setInnerStatus] = useState<OtpInputStatus>("idle")
  const [focused, setFocused] = useState(false)
  const [sel, setSel] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const status = statusProp ?? innerStatus
  const [prevStatus, setPrevStatus] = useState(status)
  const [tone, setTone] = useState<"success" | "error">(status === "success" ? "success" : "error")
  if (status !== prevStatus) {
    setPrevStatus(status)
    setCollapsed(false)
    if (status === "success" || status === "error") setTone(status)
  }

  const code = sanitize(valueProp ?? inner, pattern).slice(0, length)
  const active = Math.min(sel ?? code.length, code.length, length - 1)
  const locked = disabled || status === "loading" || status === "success" || (status === "error" && resetOnError)
  const showCursor = focused && !locked
  const state = status === "error" ? "error" : status === "success" ? "success" : "idle"
  const toneColor = tone === "success" ? successColor : errorColor
  const t = (tr: Transition): Transition => (reduced ? { duration: 0 } : tr)

  const write = (next: string) => {
    if (valueProp === undefined) setInner(next)
    setSel(next.length)
    onChange?.(next)
  }

  const complete = (next: string) => {
    onComplete?.(next)
    if (!verify) return
    const run = ++runRef.current
    setInnerStatus("loading")
    Promise.resolve()
      .then(() => verify(next))
      .then(
        (ok) => ok,
        () => false
      )
      .then((ok) => {
        if (runRef.current === run) setInnerStatus(ok ? "success" : "error")
      })
  }

  const handleInput = (raw: string, caret?: number | null) => {
    if (locked) return
    const next = sanitize(raw, pattern).slice(0, length)
    if (next === code) return
    runRef.current++
    if (innerStatus !== "idle") setInnerStatus("idle")
    write(next)
    if (caret != null) setSel(Math.min(caret, next.length))
    if (next.length === length) complete(next)
  }

  // Error: let the shake play, then clear right-to-left and refocus
  useEffect(() => {
    if (status !== "error" || !resetOnError) return
    const snapshot = code
    const start = reduced ? 500 : 750
    const step = reduced ? 0 : 45
    const timers = Array.from({ length: snapshot.length }, (_, k) =>
      setTimeout(() => write(snapshot.slice(0, snapshot.length - 1 - k)), start + k * step)
    )
    timers.push(
      setTimeout(() => {
        setInnerStatus("idle")
        inputRef.current?.focus()
      }, start + snapshot.length * step + 120)
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, resetOnError])

  useEffect(() => {
    if (status !== "success" || variant !== "boxes" || !collapseOnSuccess) return
    const timer = setTimeout(() => setCollapsed(true), reduced ? 300 : length * 60 + 500)
    return () => clearTimeout(timer)
  }, [status, variant, collapseOnSuccess, length, reduced])

  const slots = Array.from({ length }, (_, i) => i)
  const center = (length - 1) / 2

  const boxes = (
    <motion.div
      className="relative flex"
      style={{ gap: BOX_GAP }}
      variants={rowShake}
      initial={false}
      animate={state === "error" && !reduced ? "shake" : "rest"}
    >
      {slots.map((i) => {
        const char = code[i]
        const isActive = showCursor && i === active
        return (
          <motion.div
            key={i}
            className="relative grid place-items-center rounded-xl border bg-card text-xl font-medium tabular-nums text-foreground shadow-xs"
            style={{ width: BOX, height: BOX }}
            initial={false}
            animate={collapsed ? { x: (center - i) * (BOX + BOX_GAP), scale: 0.5, opacity: 0 } : { x: 0, scale: 1, opacity: 1 }}
            transition={t({ type: "spring", stiffness: 380, damping: 32, delay: collapsed ? Math.abs(center - i) * 0.02 : 0 })}
          >
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px rounded-[inherit] border"
              style={{ borderColor: toneColor, backgroundColor: `color-mix(in oklab, ${toneColor} 12%, transparent)` }}
              initial={false}
              animate={{ opacity: state === "idle" ? 0 : 1 }}
              transition={t({ duration: 0.25, delay: state === "success" ? i * 0.06 : 0 })}
            />
            {status === "loading" && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit] bg-foreground/[0.07]"
                initial={{ opacity: 0 }}
                animate={{ opacity: reduced ? 1 : [0, 1, 0] }}
                transition={reduced ? { duration: 0 } : { duration: 1.1, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
              />
            )}
            {isActive && (
              <motion.span
                layoutId={`${id}-ring`}
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px rounded-xl border border-foreground/45 ring-4 ring-foreground/[0.07]"
                transition={t(glide)}
              />
            )}
            <AnimatePresence mode="popLayout" initial={false}>
              {char && (
                <motion.span
                  key={char}
                  className="relative"
                  initial={{ opacity: 0, scale: 0.6, y: 6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
                  transition={t(pop)}
                >
                  {masked ? <span className="block size-2.5 rounded-full bg-current" /> : char}
                </motion.span>
              )}
            </AnimatePresence>
            {isActive && !char && <Caret className="h-5" reduced={reduced} />}
          </motion.div>
        )
      })}
      <AnimatePresence>
        {collapsed && (
          <motion.div
            className="absolute inset-0 m-auto grid place-items-center rounded-full text-white"
            style={{
              width: BOX,
              height: BOX,
              backgroundColor: successColor,
              boxShadow: `0 0 0 6px color-mix(in oklab, ${successColor} 16%, transparent)`,
            }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={t({ type: "spring", stiffness: 420, damping: 24, delay: 0.12 })}
          >
            <Check className="size-5" delay={0.25} instant={reduced} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  const merged = state === "success"
  const line = (
    <div className="relative flex" style={{ gap: LINE_GAP }}>
      {slots.map((i) => {
        const char = code[i]
        const isActive = showCursor && i === active
        return (
          <motion.div
            key={i}
            custom={i}
            variants={slotWave}
            initial={false}
            animate={state === "error" && !reduced ? "shake" : "rest"}
            className="relative flex h-16 items-center justify-center text-4xl font-light tabular-nums tracking-tight text-foreground"
            style={{ width: LINE }}
          >
            <motion.span
              className="relative"
              initial={false}
              animate={{ y: merged ? -4 : 0 }}
              transition={t({ ...pop, delay: merged ? 0.15 + i * 0.04 : 0 })}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {char && (
                  <motion.span
                    key={char}
                    className="block"
                    initial={{ opacity: 0, y: 18, filter: "blur(3px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                    transition={t(pop)}
                  >
                    {masked ? <span className="my-3 block size-3 rounded-full bg-current" /> : char}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.span>
            {isActive && !char && <Caret className="h-8" reduced={reduced} />}
            <motion.span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-px origin-center"
              initial={false}
              animate={{ scaleX: merged ? (LINE + LINE_GAP) / LINE : 1 }}
              transition={t({ type: "spring", stiffness: 300, damping: 30, delay: merged ? 0.05 : 0 })}
            >
              <span className={cn("absolute inset-0 transition-colors duration-300", char ? "bg-foreground/40" : "bg-foreground/15")} />
              {isActive && (
                <motion.span
                  key={active}
                  className="absolute inset-x-0 -top-px h-[2px] origin-left rounded-full bg-foreground"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={t({ duration: 0.3, ease: [0.22, 1, 0.36, 1] })}
                />
              )}
              {status === "loading" && (
                <motion.span
                  className="absolute inset-x-0 -top-px h-[2px] bg-foreground/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: reduced ? 1 : [0, 1, 0] }}
                  transition={reduced ? { duration: 0 } : { duration: 1.1, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
                />
              )}
              <motion.span
                className="absolute inset-x-0 -top-px h-[2px]"
                style={{ backgroundColor: toneColor }}
                initial={false}
                animate={{ opacity: state === "idle" ? 0 : 1 }}
                transition={t({ duration: 0.3, delay: merged ? 0.1 : 0 })}
              />
            </motion.span>
          </motion.div>
        )
      })}
      <AnimatePresence>
        {merged && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-y-0 left-full ml-4 flex items-center"
            style={{ color: successColor }}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={t({ duration: 0.3, delay: 0.5 })}
          >
            <Check className="size-6" delay={0.55} instant={reduced} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div className={cn("relative inline-flex", disabled && "opacity-50", className)}>
      {variant === "line" ? line : boxes}
      <input
        ref={inputRef}
        type="text"
        value={code}
        maxLength={length}
        inputMode={pattern === "numeric" ? "numeric" : "text"}
        autoComplete="one-time-code"
        autoCapitalize={pattern === "numeric" ? "off" : "characters"}
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        disabled={disabled}
        readOnly={locked}
        aria-label={label}
        aria-invalid={status === "error" || undefined}
        className="absolute inset-0 z-10 size-full cursor-text appearance-none bg-transparent text-base text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
        onChange={(e) => handleInput(e.target.value, e.target.selectionStart)}
        onPaste={(e) => {
          e.preventDefault()
          handleInput(e.clipboardData.getData("text"))
        }}
        onSelect={(e) => setSel(e.currentTarget.selectionStart)}
        onClick={(e) => {
          const el = e.currentTarget
          const rect = el.getBoundingClientRect()
          const i = Math.min(Math.max(Math.floor(((e.clientX - rect.left) / rect.width) * length), 0), code.length)
          el.setSelectionRange(i, Math.min(i + 1, code.length))
          setSel(i)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {status === "success" ? "Code verified" : status === "error" ? "Incorrect code, try again" : status === "loading" ? "Verifying code" : ""}
      </span>
    </div>
  )
}
