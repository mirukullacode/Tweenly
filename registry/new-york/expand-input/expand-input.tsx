"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

type State = "idle" | "open" | "loading" | "success"

export interface ExpandInputProps {
  /** Label of the collapsed button. Default: "Subscribe" */
  label?: string
  /** Input placeholder. Default: "you@example.com" */
  placeholder?: string
  /** Message shown after a successful submit. Default: "You're in!" */
  successLabel?: string
  /** Called with the email on submit. The spinner waits for the promise; a rejection returns to the input. */
  onSubmit?: (value: string) => Promise<unknown> | void
  /** Collapse back to the button this many ms after success (0 = stay). Default: 2500 */
  resetAfter?: number
  /** Width of the expanded input, in px. Default: 300 */
  width?: number
  className?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ArrowRight = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
)

const Check = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <motion.path
      d="M3 8.5 6.5 12 13 4.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
    />
  </svg>
)

export function ExpandInput({
  label = "Subscribe",
  placeholder = "you@example.com",
  successLabel = "You're in!",
  onSubmit,
  resetAfter = 2500,
  width = 300,
  className,
}: ExpandInputProps) {
  const reduced = useReducedMotion()
  const [state, setState] = useState<State>("idle")
  const [email, setEmail] = useState("")
  const [invalid, setInvalid] = useState(false)
  const [returnFocus, setReturnFocus] = useState(false)
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const expanded = state === "open" || state === "loading"
  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 32 }
  const fade = {
    initial: { opacity: 0, filter: "blur(4px)", scale: reduced ? 1 : 0.96 },
    animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    exit: { opacity: 0, filter: "blur(4px)", scale: reduced ? 1 : 0.96 },
    transition: reduced ? { duration: 0 } : { duration: 0.2 },
  }

  const collapse = (focusButton: boolean) => {
    setState("idle")
    setInvalid(false)
    setReturnFocus(focusButton)
  }

  const shake = () => {
    if (reduced || !scope.current) return
    animate(scope.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.4 })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state !== "open") return
    const value = email.trim()
    if (!EMAIL.test(value)) {
      setInvalid(true)
      shake()
      return
    }
    setState("loading")
    try {
      const minDelay = new Promise((r) => setTimeout(r, reduced ? 0 : 700))
      await Promise.all([Promise.resolve(onSubmit?.(value)), minDelay])
    } catch {
      setState("open")
      shake()
      return
    }
    setState("success")
    setEmail("")
    if (resetAfter > 0) timer.current = setTimeout(() => collapse(false), resetAfter)
  }

  return (
    <motion.div
      ref={scope}
      initial={false}
      animate={{ width: expanded ? width : "auto" }}
      transition={spring}
      className={cn(
        "relative inline-flex h-12 items-center overflow-hidden rounded-full border transition-colors duration-300",
        expanded ? "bg-background text-foreground" : "border-transparent bg-foreground text-background",
        invalid && "border-red-500/70",
        className
      )}
    >
      <span className="sr-only" aria-live="polite">
        {state === "success" ? successLabel : state === "loading" ? "Submitting" : ""}
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        {state === "idle" && (
          <motion.button
            key="idle"
            {...fade}
            type="button"
            autoFocus={returnFocus}
            onClick={() => {
              clearTimeout(timer.current)
              setState("open")
            }}
            className="h-full whitespace-nowrap rounded-full px-6 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            {label}
          </motion.button>
        )}

        {expanded && (
          <motion.form
            key="form"
            {...fade}
            onSubmit={submit}
            noValidate
            onKeyDown={(e) => {
              if (e.key === "Escape" && state === "open") collapse(true)
            }}
            onBlur={(e) => {
              if (!email && state === "open" && !e.currentTarget.contains(e.relatedTarget)) collapse(false)
            }}
            className="flex h-full w-full items-center gap-2 py-1.5 pl-5 pr-1.5"
          >
            <input
              type="email"
              autoFocus
              value={email}
              disabled={state === "loading"}
              onChange={(e) => {
                setEmail(e.target.value)
                setInvalid(false)
              }}
              placeholder={placeholder}
              aria-label="Email address"
              aria-invalid={invalid || undefined}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Submit"
              disabled={state === "loading"}
              className="grid aspect-square h-full shrink-0 place-items-center rounded-full bg-foreground text-background outline-none transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {state === "loading" ? (
                <motion.span
                  className="size-4 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <ArrowRight />
              )}
            </button>
          </motion.form>
        )}

        {state === "success" && (
          <motion.span
            key="success"
            {...fade}
            className="flex h-full items-center gap-2 whitespace-nowrap px-6 text-sm font-medium"
          >
            <Check />
            {successLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
