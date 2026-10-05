"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import {
  AnimatePresence,
  motion,
  useAnimate,
  useSpring,
  type Transition,
  type Variants,
} from "motion/react"
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { OtpInput } from "@/registry/new-york/otp-input/otp-input"

export type AuthVariant = "split" | "card" | "steps"
export type AuthMode = "sign-in" | "sign-up"
export type AuthProvider = "google" | "github" | "apple" | "x"
/** A single string, or one string per mode. */
export type AuthText = string | Partial<Record<AuthMode, string>>

export interface AuthValues {
  mode: AuthMode
  email: string
  password?: string
  /** Split sign up. */
  firstName?: string
  /** Split sign up. */
  lastName?: string
  /** Full name (split joins first and last). */
  name?: string
  /** Sign in with "Remember me" checked. */
  remember?: boolean
  /** Card: the user asked for a magic link instead of a password. */
  magicLink?: boolean
  /** Steps: the verified one-time code. */
  code?: string
  /** Steps: the chosen role. */
  role?: string
}

export interface AuthSectionProps {
  /** Layout: two-panel onboarding, centered card, or a multi-step flow. Default: "split" */
  variant?: AuthVariant
  /** Controlled mode. */
  mode?: AuthMode
  /** Initial mode when uncontrolled. Default: "sign-up" */
  defaultMode?: AuthMode
  /** Called when the user switches between sign in and sign up. */
  onModeChange?: (mode: AuthMode) => void
  /** Heading. A string, or one per mode. Default: per variant and mode, e.g. "Sign Up Account" */
  title?: AuthText
  /** Line under the heading. A string, or one per mode. Default: per variant and mode */
  subtitle?: AuthText
  /** Split: left panel headline. Default: "Get Started with Us" */
  headline?: string
  /** Split: left panel description. Default: "Complete these easy steps to register your account." */
  description?: string
  /** Social sign-in buttons, in order. Pass [] to hide them. Default: ["google", "github"] */
  providers?: AuthProvider[]
  /** Receives the form values. Return a promise to show the loading state; reject to show its message. */
  onSubmit?: (values: AuthValues) => Promise<void> | void
  /** Called when a social button is pressed. */
  onProviderClick?: (provider: AuthProvider) => void
  /** Called when "Forgot password?" is pressed. */
  onForgotPassword?: () => void
  /** Renders "Forgot password?" as a link to this URL instead of a button. */
  forgotPasswordHref?: string
  /** Logo shown above the heading. Default: none */
  logo?: ReactNode
  /** Color of primary actions, links and focus rings. Default: "#ff4d12" */
  accent?: string
  /** Split: base color of the left panel. Default: "#0f3d2e" */
  panelColor?: string
  /** Split: color of the soft light in the left panel. Default: "#2f8f73" */
  glowColor?: string
  /** Corner radius of the outer container in px. Default: 24 */
  radius?: number
  /** Split: labels of the three onboarding steps. Default: ["Sign up your account", "Set up your workspace", "Set up your profile"] */
  steps?: string[]
  /** Show the remember-me checkbox when signing in. Default: true */
  showRememberMe?: boolean
  /** Card: offer a passwordless "email me a link" option. Default: true */
  magicLink?: boolean
  /** Steps: checks the emailed code. Default: accepts any complete code */
  verifyCode?: (code: string, email: string) => Promise<boolean> | boolean
  /** Steps: called when "Resend code" is pressed. */
  onResendCode?: (email: string) => void
  /** Steps: choices for the role picker. Default: ["Designer", "Engineer", "Founder", "Other"] */
  roles?: string[]
  /** Terms of service URL. Sign up shows "By continuing you agree to…" when this or privacyHref is set. */
  termsHref?: string
  /** Privacy policy URL. */
  privacyHref?: string
  className?: string
}

type Bezier = [number, number, number, number]
const EASE_OUT: Bezier = [0.22, 1, 0.36, 1]
const EASE_IN_OUT: Bezier = [0.76, 0, 0.24, 1]
const SPRING: Transition = { type: "spring", stiffness: 450, damping: 34 }
const INSTANT: Transition = { duration: 0 }

const DEFAULT_PROVIDERS: AuthProvider[] = ["google", "github"]
const DEFAULT_STEPS = ["Sign up your account", "Set up your workspace", "Set up your profile"]
const DEFAULT_ROLES = ["Designer", "Engineer", "Founder", "Other"]

const COPY: Record<AuthVariant, Record<AuthMode, [string, string]>> = {
  split: {
    "sign-up": ["Sign Up Account", "Enter your personal data to create your account."],
    "sign-in": ["Log In Account", "Enter your credentials to access your account."],
  },
  card: {
    "sign-up": ["Create an account", "Start building in less than a minute."],
    "sign-in": ["Welcome back", "Sign in to continue to your workspace."],
  },
  steps: {
    "sign-up": ["Create your account", "Enter your email to get started."],
    "sign-in": ["Sign in", "We'll email you a one-time code."],
  },
}

const PROVIDER_NAMES: Record<AuthProvider, string> = { google: "Google", github: "GitHub", apple: "Apple", x: "X" }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Status = "idle" | "loading" | "success"
type FieldName = "firstName" | "lastName" | "name" | "email" | "password"
type Errors = Partial<Record<FieldName, string>>

const pick = (text: AuthText | undefined, mode: AuthMode, fallback: string) =>
  (typeof text === "string" ? text : text?.[mode]) || fallback

function validateField(name: FieldName, value: string, mode: AuthMode): string | undefined {
  const v = value.trim()
  switch (name) {
    case "email":
      if (!v) return "Email is required."
      return EMAIL_RE.test(v) ? undefined : "Enter a valid email address."
    case "password":
      if (!value) return "Password is required."
      return mode === "sign-up" && value.length < 8 ? "Must be at least 8 characters." : undefined
    case "firstName":
      return v ? undefined : "First name is required."
    case "lastName":
      return v ? undefined : "Last name is required."
    case "name":
      return v ? undefined : "Name is required."
  }
}

function errorMessage(err: unknown) {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === "string" && err) return err
  return "Something went wrong. Please try again."
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function ProviderIcon({ provider, className }: { provider: AuthProvider; className?: string }) {
  const common = { viewBox: "0 0 24 24", className, "aria-hidden": true as const }
  switch (provider) {
    case "google":
      return (
        <svg {...common}>
          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
          <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
        </svg>
      )
    case "github":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      )
    case "apple":
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
        </svg>
      )
    case "x":
      return (
        <svg {...common} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
  }
}

/** Rises into place when scrolled into view; `order` staggers sibling blocks. */
function Rise({ order = 0, reduced, className, children }: { order?: number; reduced: boolean; className?: string; children: ReactNode }) {
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={reduced ? INSTANT : { duration: 0.7, ease: EASE_OUT, delay: 0.08 + order * 0.07 }}
    >
      {children}
    </motion.div>
  )
}

/** Height-animated show/hide. Overflow is only clipped while animating so focus rings stay visible. */
function Collapse({ show, reduced, children, className }: { show: boolean; reduced: boolean; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="collapse"
          className={cn("-mx-1 px-1", className)}
          initial={{ height: 0, opacity: 0, overflow: "hidden" }}
          animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
          exit={{ height: 0, opacity: 0, overflow: "hidden" }}
          transition={reduced ? INSTANT : { height: { duration: 0.5, ease: EASE_IN_OUT }, opacity: { duration: 0.3, ease: EASE_OUT } }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Crossfades text in place; old and new overlap in one grid cell so nothing jumps. */
function SwapText({ text, as = "h2", className, reduced }: { text: string; as?: "h2" | "p"; className?: string; reduced: boolean }) {
  const Comp = as === "h2" ? motion.h2 : motion.p
  return (
    <div className="grid">
      <AnimatePresence initial={false}>
        <Comp
          key={text}
          className={cn("[grid-area:1/1]", className)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={reduced ? INSTANT : { duration: 0.35, ease: EASE_OUT }}
        >
          {text}
        </Comp>
      </AnimatePresence>
    </div>
  )
}

function FieldMessage({ id, error, hint, reduced, hintClassName }: { id: string; error?: string; hint?: string; reduced: boolean; hintClassName?: string }) {
  const t = reduced ? INSTANT : { duration: 0.28, ease: EASE_OUT }
  return (
    <div id={id} aria-live="polite" className="text-xs">
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            className="pt-1.5 text-destructive"
            initial={{ opacity: 0, y: -4, height: hint ? "auto" : 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: hint ? "auto" : 0 }}
            transition={t}
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            className={cn("pt-1.5 text-muted-foreground", hintClassName)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={t}
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  aside?: ReactNode
  reduced: boolean
  labelClassName?: string
  hintClassName?: string
  children: ReactNode
}

function Field({ id, label, error, hint, aside, reduced, labelClassName, hintClassName, children }: FieldProps) {
  return (
    <div className="group/field">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label
          htmlFor={id}
          className={cn("transition-colors duration-200 group-focus-within/field:text-[var(--auth-accent)]", labelClassName)}
        >
          {label}
        </Label>
        {aside}
      </div>
      {children}
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} reduced={reduced} hintClassName={hintClassName} />
    </div>
  )
}

function PasswordInput({ reduced, className, ...props }: React.ComponentProps<"input"> & { reduced: boolean }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-10", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)]"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={visible ? "hide" : "show"}
            className="grid place-items-center"
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
            transition={reduced ? INSTANT : SPRING}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}

function SubmitButton({ status, reduced, className, style, children }: { status: Status; reduced: boolean; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <Button
      type="submit"
      aria-busy={status === "loading" || undefined}
      className={cn("relative h-10 w-full overflow-hidden rounded-lg text-sm font-medium", className)}
      style={style}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: status === "idle" ? -14 : 14, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.85 }}
          transition={reduced ? INSTANT : SPRING}
        >
          {status === "loading" ? (
            <LoaderCircle className={cn("size-4", !reduced && "animate-spin")} aria-hidden="true" />
          ) : status === "success" ? (
            <Check className="size-4" strokeWidth={2.75} aria-hidden="true" />
          ) : (
            children
          )}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {status === "loading" ? "Submitting" : status === "success" ? "Done" : ""}
      </span>
    </Button>
  )
}

function ProviderButtons({
  providers,
  onProviderClick,
  iconOnly = false,
  buttonClassName,
}: {
  providers: AuthProvider[]
  onProviderClick?: (provider: AuthProvider) => void
  iconOnly?: boolean
  buttonClassName?: string
}) {
  const cols = iconOnly ? providers.length : Math.min(providers.length, 2)
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {providers.map((p) => (
        <Button
          key={p}
          type="button"
          variant="outline"
          aria-label={iconOnly ? `Continue with ${PROVIDER_NAMES[p]}` : undefined}
          onClick={() => onProviderClick?.(p)}
          className={cn("h-10 gap-2 rounded-lg transition-[transform,background-color] duration-150 active:scale-[0.97]", buttonClassName)}
        >
          <ProviderIcon provider={p} className="size-4" />
          {!iconOnly && <span>{PROVIDER_NAMES[p]}</span>}
        </Button>
      ))}
    </div>
  )
}

function Divider({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function Terms({ termsHref, privacyHref, className, linkClassName }: { termsHref?: string; privacyHref?: string; className?: string; linkClassName?: string }) {
  if (!termsHref && !privacyHref) return null
  const link = cn("font-medium text-foreground underline underline-offset-4 hover:text-[var(--auth-accent)]", linkClassName)
  return (
    <p className={cn("text-center text-xs leading-relaxed text-muted-foreground", className)}>
      By continuing you agree to our{" "}
      {termsHref && (
        <a href={termsHref} className={link}>
          Terms of Service
        </a>
      )}
      {termsHref && privacyHref && " and "}
      {privacyHref && (
        <a href={privacyHref} className={link}>
          Privacy Policy
        </a>
      )}
      .
    </p>
  )
}

function ModeSwitch({ mode, onSwitch, className, linkClassName, signInLabel = "Sign in" }: { mode: AuthMode; onSwitch: (m: AuthMode) => void; className?: string; linkClassName?: string; signInLabel?: string }) {
  const signUp = mode === "sign-up"
  return (
    <p className={cn("text-center text-sm text-muted-foreground", className)}>
      {signUp ? "Already have an account? " : "Don't have an account? "}
      <button
        type="button"
        onClick={() => onSwitch(signUp ? "sign-in" : "sign-up")}
        className={cn("rounded-sm font-medium text-[var(--auth-accent)] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)]", linkClassName)}
      >
        {signUp ? signInLabel : "Sign up"}
      </button>
    </p>
  )
}

function useMode(mode: AuthMode | undefined, defaultMode: AuthMode, onModeChange?: (m: AuthMode) => void) {
  const [inner, setInner] = useState(defaultMode)
  const current = mode ?? inner
  const set = (next: AuthMode) => {
    if (next === current) return
    if (mode === undefined) setInner(next)
    onModeChange?.(next)
  }
  return [current, set] as const
}

function useShake(reduced: boolean) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const shake = () => {
    if (reduced || !scope.current) return
    animate(scope.current, { x: [0, -10, 9, -6, 4, -2, 0] }, { duration: 0.5, ease: "easeOut" })
  }
  return [scope, shake] as const
}

const ACCENT_FOCUS =
  "h-10 rounded-lg px-3 transition-[border-color,box-shadow,background-color] duration-200 focus-visible:border-[var(--auth-accent)] focus-visible:ring-[color-mix(in_oklab,var(--auth-accent)_25%,transparent)] focus-visible:shadow-[0_0_0_6px_color-mix(in_oklab,var(--auth-accent)_10%,transparent)]"

/* ------------------------------------------------------------------ */
/* Credentials form (split + card)                                     */
/* ------------------------------------------------------------------ */

interface CredentialsFormProps {
  appearance: "split" | "card"
  mode: AuthMode
  onModeSwitch: (mode: AuthMode) => void
  title: string
  subtitle: string
  logo?: ReactNode
  providers: AuthProvider[]
  onProviderClick?: (provider: AuthProvider) => void
  onSubmit?: (values: AuthValues) => Promise<void> | void
  onForgotPassword?: () => void
  forgotPasswordHref?: string
  showRememberMe: boolean
  magicLink: boolean
  termsHref?: string
  privacyHref?: string
  reduced: boolean
  onSuccess?: () => void
}

function CredentialsForm({
  appearance,
  mode,
  onModeSwitch,
  title,
  subtitle,
  logo,
  providers,
  onProviderClick,
  onSubmit,
  onForgotPassword,
  forgotPasswordHref,
  showRememberMe,
  magicLink,
  termsHref,
  privacyHref,
  reduced,
  onSuccess,
}: CredentialsFormProps) {
  const id = useId()
  const [values, setValues] = useState<Record<FieldName, string>>({ firstName: "", lastName: "", name: "", email: "", password: "" })
  const [remember, setRemember] = useState(true)
  const [useLink, setUseLink] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>("idle")
  const [formError, setFormError] = useState<string | null>(null)
  const [prevMode, setPrevMode] = useState(mode)
  const [scope, shake] = useShake(reduced)
  const runRef = useRef(0)

  if (mode !== prevMode) {
    setPrevMode(mode)
    setErrors({})
    setStatus("idle")
    setFormError(null)
  }

  const split = appearance === "split"
  const signUp = mode === "sign-up"
  const linkMode = !split && magicLink && useLink
  const active: FieldName[] = [
    ...(signUp ? (split ? (["firstName", "lastName"] as const) : (["name"] as const)) : []),
    "email",
    ...(linkMode ? [] : (["password"] as const)),
  ]

  const inputCls = cn(
    ACCENT_FOCUS,
    split && "border-white/10 bg-white/[0.05] text-white placeholder:text-white/30 dark:bg-white/[0.05]"
  )
  const labelCls = split ? "text-[13px] font-normal text-white/85" : undefined
  const hintCls = split ? "text-white/45" : undefined

  const resetFeedback = () => {
    if (status === "success") setStatus("idle")
    if (formError) setFormError(null)
  }

  const change = (name: FieldName) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValues((s) => ({ ...s, [name]: v }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: validateField(name, v, mode) }))
    resetFeedback()
  }

  const blur = (name: FieldName) => () => {
    const v = values[name]
    if (v) setErrors((er) => ({ ...er, [name]: validateField(name, v, mode) }))
  }

  const inputProps = (name: FieldName) => ({
    id: `${id}-${name}`,
    name,
    value: values[name],
    onChange: change(name),
    onBlur: blur(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": `${id}-${name}-msg`,
    className: inputCls,
  })

  const switchMode = (next: AuthMode) => {
    runRef.current++
    onModeSwitch(next)
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === "loading") return
    const next: Errors = {}
    for (const n of active) {
      const m = validateField(n, values[n], mode)
      if (m) next[n] = m
    }
    setErrors(next)
    setFormError(null)
    const first = active.find((n) => next[n])
    if (first) {
      shake()
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const payload: AuthValues = { mode, email: values.email.trim() }
    if (!linkMode) payload.password = values.password
    if (signUp && split) {
      payload.firstName = values.firstName.trim()
      payload.lastName = values.lastName.trim()
      payload.name = `${payload.firstName} ${payload.lastName}`
    }
    if (signUp && !split) payload.name = values.name.trim()
    if (!signUp && showRememberMe && !linkMode) payload.remember = remember
    if (linkMode) payload.magicLink = true

    const run = ++runRef.current
    setStatus("loading")
    try {
      await onSubmit?.(payload)
      if (runRef.current !== run) return
      setStatus("success")
      onSuccess?.()
    } catch (err) {
      if (runRef.current !== run) return
      setStatus("idle")
      setFormError(errorMessage(err))
      shake()
    }
  }

  const forgotCls = cn(
    "rounded-sm text-xs font-medium outline-none underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)]",
    split ? "text-white/70 hover:text-white" : "text-[var(--auth-accent)]"
  )
  const forgot = !signUp ? (
    forgotPasswordHref ? (
      <a href={forgotPasswordHref} className={forgotCls}>
        Forgot password?
      </a>
    ) : (
      <button type="button" onClick={onForgotPassword} className={forgotCls}>
        Forgot password?
      </button>
    )
  ) : null

  const submitLabel = linkMode ? "Send magic link" : split ? (signUp ? "Sign Up" : "Log In") : signUp ? "Create account" : "Sign in"

  return (
    <div className="flex w-full flex-col">
      <Rise order={0} reduced={reduced} className="flex flex-col items-center gap-1.5 text-center">
        {!split && logo && <div className="mb-3">{logo}</div>}
        <SwapText
          text={title}
          reduced={reduced}
          className={cn("font-semibold tracking-tight", split ? "text-2xl text-white @[720px]:text-[1.75rem]" : "text-xl text-foreground")}
        />
        <SwapText text={subtitle} as="p" reduced={reduced} className={cn("text-sm", split ? "text-white/55" : "text-muted-foreground")} />
      </Rise>

      {providers.length > 0 && (
        <Rise order={1} reduced={reduced} className={cn("flex flex-col gap-5", split ? "mt-7" : "mt-6")}>
          <ProviderButtons
            providers={providers}
            onProviderClick={onProviderClick}
            iconOnly={!split && providers.length > 2}
            buttonClassName={split ? "border-white/15 bg-transparent text-white hover:bg-white/[0.06] dark:bg-transparent dark:hover:bg-white/[0.06]" : undefined}
          />
          <Divider label={split ? "Or" : "or continue with email"} className={split ? "text-white/45 [&>span]:bg-white/10" : undefined} />
        </Rise>
      )}

      <Rise order={2} reduced={reduced} className={providers.length ? "mt-5" : "mt-6"}>
      <div ref={scope}>
      <form noValidate onSubmit={submit} className="flex flex-col">
        <Collapse show={signUp && split} reduced={reduced}>
          <div className="grid grid-cols-2 gap-3 pb-4">
            <Field id={`${id}-firstName`} label="First Name" error={errors.firstName} reduced={reduced} labelClassName={labelCls}>
              <Input {...inputProps("firstName")} autoComplete="given-name" placeholder="eg. John" />
            </Field>
            <Field id={`${id}-lastName`} label="Last Name" error={errors.lastName} reduced={reduced} labelClassName={labelCls}>
              <Input {...inputProps("lastName")} autoComplete="family-name" placeholder="eg. Francisco" />
            </Field>
          </div>
        </Collapse>
        <Collapse show={signUp && !split} reduced={reduced}>
          <div className="pb-4">
            <Field id={`${id}-name`} label="Name" error={errors.name} reduced={reduced}>
              <Input {...inputProps("name")} autoComplete="name" placeholder="Ada Lovelace" />
            </Field>
          </div>
        </Collapse>
        <div className="pb-4">
          <Field id={`${id}-email`} label="Email" error={errors.email} reduced={reduced} labelClassName={labelCls}>
            <Input {...inputProps("email")} type="email" inputMode="email" autoComplete="email" placeholder={split ? "eg. johnfrans@gmail.com" : "you@example.com"} />
          </Field>
        </div>
        <Collapse show={!linkMode} reduced={reduced}>
          <div className="pb-4">
            <Field
              id={`${id}-password`}
              label="Password"
              error={errors.password}
              hint={signUp ? "Must be at least 8 characters." : undefined}
              aside={forgot}
              reduced={reduced}
              labelClassName={labelCls}
              hintClassName={hintCls}
            >
              <PasswordInput
                {...inputProps("password")}
                reduced={reduced}
                autoComplete={signUp ? "new-password" : "current-password"}
                placeholder="Enter your password"
              />
            </Field>
          </div>
        </Collapse>
        <Collapse show={!signUp && showRememberMe && !linkMode} reduced={reduced}>
          <div className="pb-4">
            <Label className={cn("w-fit cursor-pointer font-normal", split ? "text-white/75" : "text-muted-foreground")}>
              <Checkbox
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked)}
                className={cn(
                  "data-checked:border-[var(--auth-accent)] data-checked:bg-[var(--auth-accent)] data-checked:text-white dark:data-checked:bg-[var(--auth-accent)]",
                  split && "border-white/20"
                )}
              />
              Remember me
            </Label>
          </div>
        </Collapse>
        <Collapse show={!!formError} reduced={reduced}>
          <div className="pb-4">
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          </div>
        </Collapse>
        <SubmitButton
          status={status}
          reduced={reduced}
          className={split ? "bg-white text-black hover:bg-white/85" : "text-white hover:opacity-90"}
          style={split ? undefined : { backgroundColor: "var(--auth-accent)" }}
        >
          {submitLabel}
        </SubmitButton>
        <Collapse show={linkMode && status === "success"} reduced={reduced}>
          <p className="pt-3 text-center text-sm text-muted-foreground" role="status">
            Check your inbox. We sent a sign-in link to <span className="font-medium text-foreground">{values.email.trim()}</span>.
          </p>
        </Collapse>
      </form>
      </div>
      </Rise>

      {!split && magicLink && (
        <button
          type="button"
          onClick={() => {
            setUseLink((v) => !v)
            setErrors((er) => ({ ...er, password: undefined }))
            resetFeedback()
          }}
          className="mx-auto mt-3 rounded-sm text-xs font-medium text-muted-foreground outline-none underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)]"
        >
          {useLink ? "Use a password instead" : "Email me a sign-in link instead"}
        </button>
      )}

      <Rise order={3} reduced={reduced}>
      <ModeSwitch
        mode={mode}
        onSwitch={switchMode}
        signInLabel={split ? "Log in" : "Sign in"}
        className={cn("mt-5", split && "text-white/55")}
        linkClassName={split ? "text-white" : undefined}
      />
      {signUp && (
        <Terms termsHref={termsHref} privacyHref={privacyHref} className={cn("mt-3", split && "text-white/40")} linkClassName={split ? "text-white/80" : undefined} />
      )}
      </Rise>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Split                                                              */
/* ------------------------------------------------------------------ */

function SplitPanel({
  headline,
  description,
  steps,
  active,
  logo,
  panelColor,
  glowColor,
  radius,
  reduced,
}: {
  headline: string
  description: string
  steps: string[]
  active: number
  logo?: ReactNode
  panelColor: string
  glowColor: string
  radius: number
  reduced: boolean
}) {
  const id = useId()
  return (
    <div
      className="relative isolate flex flex-col overflow-hidden p-5 text-white @[720px]:p-7"
      style={{
        borderRadius: radius,
        backgroundColor: `color-mix(in oklab, ${panelColor} 70%, #020604)`,
      }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[55%] left-1/2 -z-10 h-[90%] w-[120%] rounded-full opacity-25"
        style={{ x: "-50%", backgroundColor: glowColor }}
        animate={reduced ? undefined : { y: [0, 18, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[30%] -left-[20%] -z-10 h-[55%] w-[60%] rounded-full opacity-15"
        style={{ backgroundColor: glowColor }}
        animate={reduced ? undefined : { x: [0, 24, 0], y: [0, -12, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {logo && <div className="flex justify-center">{logo}</div>}

      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center @[720px]:py-12">
        <h3 className="max-w-[14ch] text-3xl leading-[1.05] font-semibold tracking-tight text-balance @[720px]:text-[2.6rem]">{headline}</h3>
        <p className="max-w-xs text-sm text-white/65">{description}</p>
      </div>

      <ol aria-label="Registration steps" className="grid grid-cols-3 gap-2 @[720px]:gap-2.5">
        {steps.slice(0, 3).map((label, i) => {
          const isActive = i === active
          const done = i < active
          return (
            <li
              key={i}
              aria-current={isActive ? "step" : undefined}
              className="relative flex min-h-[6.5rem] flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-md @[720px]:min-h-[8rem] @[720px]:p-4"
            >
              {isActive && (
                <motion.span
                  layoutId={`${id}-active`}
                  aria-hidden="true"
                  className="absolute -inset-px bg-white shadow-lg"
                  style={{ borderRadius: 16 }}
                  transition={reduced ? INSTANT : SPRING}
                />
              )}
              <span
                className={cn(
                  "relative grid size-6 place-items-center rounded-full text-xs font-semibold transition-colors duration-300 @[720px]:size-7",
                  isActive ? "bg-black text-white" : done ? "bg-white text-black" : "bg-white/15 text-white"
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} aria-label="Done" /> : i + 1}
              </span>
              <span
                className={cn(
                  "relative text-xs leading-snug font-medium transition-colors duration-300 @[720px]:text-sm",
                  isActive ? "text-black" : "text-white/85"
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Card                                                               */
/* ------------------------------------------------------------------ */

function TiltCard({ radius, accent, reduced, children }: { radius: number; accent: string; reduced: boolean; children: ReactNode }) {
  const rx = useSpring(0, { stiffness: 400, damping: 32 })
  const ry = useSpring(0, { stiffness: 400, damping: 32 })
  const [hover, setHover] = useState(false)

  return (
    <div className="w-full max-w-[400px]" style={{ perspective: 1200 }}>
      <motion.div
        className="relative border bg-card p-6 text-card-foreground shadow-sm @sm:p-8"
        style={{ rotateX: rx, rotateY: ry, borderRadius: radius }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return
          const r = e.currentTarget.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width
          const py = (e.clientY - r.top) / r.height
          if (!reduced) {
            rx.set((0.5 - py) * 4)
            ry.set((px - 0.5) * 4)
          }
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={() => {
          setHover(false)
          rx.set(0)
          ry.set(0)
        }}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-[inherit] border"
          style={{ borderColor: accent }}
          initial={false}
          animate={{ opacity: hover ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ backgroundColor: `color-mix(in oklab, ${accent} 4%, transparent)` }}
          initial={false}
          animate={{ opacity: hover ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        <div className="relative">{children}</div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Steps                                                              */
/* ------------------------------------------------------------------ */

type StepKey = "email" | "verify" | "profile" | "done"
const STEP_LABELS: Record<Exclude<StepKey, "done">, string> = { email: "Email", verify: "Verify", profile: "Profile" }

const slide: Variants = {
  enter: (d: number) => ({ x: `${d * 35}%`, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: `${d * -35}%`, opacity: 0 }),
}

function useHeight() {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | "auto">("auto")
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return [setEl, height] as const
}

interface StepsAuthProps {
  mode: AuthMode
  onModeSwitch: (mode: AuthMode) => void
  title: string
  subtitle: string
  logo?: ReactNode
  providers: AuthProvider[]
  onProviderClick?: (provider: AuthProvider) => void
  onSubmit?: (values: AuthValues) => Promise<void> | void
  verifyCode?: (code: string, email: string) => Promise<boolean> | boolean
  onResendCode?: (email: string) => void
  roles: string[]
  radius: number
  termsHref?: string
  privacyHref?: string
  reduced: boolean
}

function StepsAuth({
  mode,
  onModeSwitch,
  title,
  subtitle,
  logo,
  providers,
  onProviderClick,
  onSubmit,
  verifyCode,
  onResendCode,
  roles,
  radius,
  termsHref,
  privacyHref,
  reduced,
}: StepsAuthProps) {
  const id = useId()
  const [step, setStep] = useState<StepKey>("email")
  const [dir, setDir] = useState(1)
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string>()
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState<string>()
  const [role, setRole] = useState(roles[0] ?? "")
  const [status, setStatus] = useState<Status>("idle")
  const [formError, setFormError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [otpKey, setOtpKey] = useState(0)
  const [prevMode, setPrevMode] = useState(mode)
  const [scope, shake] = useShake(reduced)
  const [measure, height] = useHeight()
  const bodyRef = useRef<HTMLDivElement>(null)
  const movedRef = useRef(false)

  const flow: Exclude<StepKey, "done">[] = mode === "sign-up" ? ["email", "verify", "profile"] : ["email", "verify"]
  const index = step === "done" ? flow.length : flow.indexOf(step as Exclude<StepKey, "done">)

  if (mode !== prevMode) {
    setPrevMode(mode)
    setStep("email")
    setStatus("idle")
    setFormError(null)
    setEmailError(undefined)
  }

  // Move focus into the step that just slid in (never on first mount)
  useEffect(() => {
    if (!movedRef.current) return
    const timer = setTimeout(() => {
      const root = bodyRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`)
      root?.querySelector<HTMLElement>("[data-autofocus], input")?.focus({ preventScroll: true })
    }, reduced ? 0 : 120)
    return () => clearTimeout(timer)
  }, [step, reduced])

  const go = (next: StepKey) => {
    movedRef.current = true
    const ni = next === "done" ? flow.length : flow.indexOf(next)
    setDir(ni >= index ? 1 : -1)
    setStatus("idle")
    setFormError(null)
    setStep(next)
  }

  const submitEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const err = validateField("email", email, mode)
    setEmailError(err)
    if (err) {
      shake()
      document.getElementById(`${id}-email`)?.focus()
      return
    }
    setCode("")
    setOtpKey((k) => k + 1)
    go("verify")
  }

  const verify = async (c: string) => {
    setFormError(null)
    let ok = false
    try {
      ok = verifyCode ? await verifyCode(c, email.trim()) : true
    } catch {
      ok = false
    }
    if (!ok) {
      setFormError("That code didn't match. Try again.")
      return false
    }
    if (mode === "sign-in") {
      try {
        await onSubmit?.({ mode, email: email.trim(), code: c })
      } catch (err) {
        setFormError(errorMessage(err))
        return false
      }
    }
    setTimeout(() => go(mode === "sign-up" ? "profile" : "done"), reduced ? 300 : 1300)
    return true
  }

  const submitProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === "loading") return
    const err = validateField("name", name, mode)
    setNameError(err)
    setFormError(null)
    if (err) {
      shake()
      document.getElementById(`${id}-name`)?.focus()
      return
    }
    setStatus("loading")
    try {
      await onSubmit?.({ mode, email: email.trim(), code, name: name.trim(), role })
      setStatus("success")
      setTimeout(() => go("done"), reduced ? 200 : 700)
    } catch (error) {
      setStatus("idle")
      setFormError(errorMessage(error))
      shake()
    }
  }

  const restart = () => {
    setEmail("")
    setName("")
    setCode("")
    setRole(roles[0] ?? "")
    go("email")
  }

  const onRoleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]
    if (!keys.includes(e.key) || !roles.length) return
    e.preventDefault()
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1
    const next = (roles.indexOf(role) + delta + roles.length) % roles.length
    setRole(roles[next])
    e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus()
  }

  const t = (tr: Transition): Transition => (reduced ? INSTANT : tr)
  const inputCls = ACCENT_FOCUS
  const firstName = name.trim().split(/\s+/)[0]

  let body: ReactNode
  if (step === "email") {
    body = (
      <form noValidate onSubmit={submitEmail} className="flex flex-col">
        <div className="flex flex-col gap-1.5">
          <SwapText text={title} reduced={reduced} className="text-xl font-semibold tracking-tight text-foreground" />
          <SwapText text={subtitle} as="p" reduced={reduced} className="text-sm text-muted-foreground" />
        </div>
        {providers.length > 0 && (
          <div className="mt-6 flex flex-col gap-5">
            <ProviderButtons providers={providers} onProviderClick={onProviderClick} iconOnly={providers.length > 2} />
            <Divider label="or" />
          </div>
        )}
        <div className={cn("pb-4", providers.length ? "mt-5" : "mt-6")}>
          <Field id={`${id}-email`} label="Email" error={emailError} reduced={reduced}>
            <Input
              id={`${id}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError(validateField("email", e.target.value, mode))
              }}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={`${id}-email-msg`}
              className={inputCls}
            />
          </Field>
        </div>
        <SubmitButton status="idle" reduced={reduced} className="text-white hover:opacity-90" style={{ backgroundColor: "var(--auth-accent)" }}>
          Continue <ArrowRight className="size-4" aria-hidden="true" />
        </SubmitButton>
        <ModeSwitch mode={mode} onSwitch={onModeSwitch} className="mt-5" />
        {mode === "sign-up" && <Terms termsHref={termsHref} privacyHref={privacyHref} className="mt-3" />}
      </form>
    )
  } else if (step === "verify") {
    body = (
      <div className="flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => go("email")}
          className="mb-4 inline-flex items-center gap-1.5 self-start rounded-sm text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" /> Change email
        </button>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Check your inbox</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium break-all text-foreground">{email.trim()}</span>
        </p>
        <div className="mt-6 origin-center @max-sm:scale-[0.85]">
          <OtpInput
            key={otpKey}
            length={6}
            verify={verify}
            onChange={(v) => {
              if (v.length > code.length) setFormError(null)
              setCode(v)
            }}
          />
        </div>
        <div className="w-full">
          <Collapse show={!!formError} reduced={reduced}>
            <p role="alert" className="pt-4 text-sm text-destructive">
              {formError}
            </p>
          </Collapse>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={() => {
              onResendCode?.(email.trim())
              setResent(true)
              setTimeout(() => setResent(false), 2400)
            }}
            className="rounded-sm font-medium text-[var(--auth-accent)] outline-none underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)]"
          >
            {resent ? "Code sent" : "Resend code"}
          </button>
        </p>
      </div>
    )
  } else if (step === "profile") {
    body = (
      <form noValidate onSubmit={submitProfile} className="flex flex-col">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Tell us about you</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">This helps us tailor your workspace.</p>
        <div className="mt-6 pb-4">
          <Field id={`${id}-name`} label="Full name" error={nameError} reduced={reduced}>
            <Input
              id={`${id}-name`}
              name="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError(validateField("name", e.target.value, mode))
                if (formError) setFormError(null)
              }}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={`${id}-name-msg`}
              className={inputCls}
            />
          </Field>
        </div>
        {roles.length > 0 && (
          <div className="pb-4">
            <p id={`${id}-role`} className="mb-2 text-sm font-medium">
              Your role
            </p>
            <div role="radiogroup" aria-labelledby={`${id}-role`} onKeyDown={onRoleKey} className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 @sm:grid-cols-4">
              {roles.map((r) => {
                const checked = r === role
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    tabIndex={checked ? 0 : -1}
                    onClick={() => setRole(r)}
                    className={cn(
                      "relative h-8 rounded-lg px-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--auth-accent)]",
                      checked ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {checked && (
                      <motion.span
                        layoutId={`${id}-role-pill`}
                        aria-hidden="true"
                        className="absolute inset-0 bg-background shadow-sm"
                        style={{ borderRadius: 8 }}
                        transition={t(SPRING)}
                      />
                    )}
                    <span className="relative">{r}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <Collapse show={!!formError} reduced={reduced}>
          <div className="pb-4">
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          </div>
        </Collapse>
        <SubmitButton status={status} reduced={reduced} className="text-white hover:opacity-90" style={{ backgroundColor: "var(--auth-accent)" }}>
          Create account
        </SubmitButton>
      </form>
    )
  } else {
    body = (
      <div className="flex flex-col items-center py-4 text-center">
        <motion.div
          className="grid size-16 place-items-center rounded-full text-white"
          style={{ backgroundColor: "var(--auth-accent)", boxShadow: "0 0 0 8px color-mix(in oklab, var(--auth-accent) 15%, transparent)" }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={t({ type: "spring", stiffness: 420, damping: 30, delay: 0.1 })}
        >
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <motion.path d="M5 12.5 10 17.5 19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t({ duration: 0.4, ease: EASE_OUT, delay: 0.3 })} />
          </svg>
        </motion.div>
        <h2 data-autofocus tabIndex={-1} className="mt-6 text-xl font-semibold tracking-tight text-foreground outline-none">
          You&apos;re all set
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "sign-up" ? `Welcome aboard${firstName ? `, ${firstName}` : ""}. Your workspace is ready.` : `Signed in as ${email.trim()}.`}
        </p>
        <Button type="button" variant="outline" onClick={restart} className="mt-6 h-9 rounded-lg">
          Start over
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md border bg-card p-6 text-card-foreground shadow-sm @sm:p-8" style={{ borderRadius: radius }}>
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          {logo ?? <span />}
          <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
            {step === "done" ? "Complete" : `Step ${index + 1} of ${flow.length}`}
          </span>
        </div>
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-label={mode === "sign-up" ? "Sign-up progress" : "Sign-in progress"}
          aria-valuemin={0}
          aria-valuemax={flow.length}
          aria-valuenow={index}
        >
          {flow.map((k, i) => (
            <div key={k} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full origin-left rounded-full"
                style={{ backgroundColor: "var(--auth-accent)" }}
                initial={false}
                animate={{ scaleX: i < index ? 1 : i === index ? 0.4 : 0 }}
                transition={t({ duration: 0.5, ease: EASE_IN_OUT })}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          {flow.map((k, i) => (
            <span key={k} className={cn("flex-1 text-[11px] transition-colors duration-300", i <= index ? "text-foreground" : "text-muted-foreground")}>
              {STEP_LABELS[k]}
            </span>
          ))}
        </div>
      </div>

      <motion.div
        className="-mx-1 overflow-hidden px-1"
        initial={false}
        animate={{ height: height === "auto" ? "auto" : height + 8 }}
        transition={t({ duration: 0.45, ease: EASE_IN_OUT })}
      >
        <div ref={measure} className="relative pt-1 pb-1">
          <div ref={bodyRef}>
            <div ref={scope}>
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.div
                  key={step}
                  data-step={step}
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={reduced ? INSTANT : { x: { type: "spring", stiffness: 420, damping: 36 }, opacity: { duration: 0.22 } }}
                >
                  {body}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* AuthSection                                                         */
/* ------------------------------------------------------------------ */

export function AuthSection({
  variant = "split",
  mode: modeProp,
  defaultMode = "sign-up",
  onModeChange,
  title,
  subtitle,
  headline = "Get Started with Us",
  description = "Complete these easy steps to register your account.",
  providers = DEFAULT_PROVIDERS,
  onSubmit,
  onProviderClick,
  onForgotPassword,
  forgotPasswordHref,
  logo,
  accent = "#ff4d12",
  panelColor = "#0f3d2e",
  glowColor = "#2f8f73",
  radius = 24,
  steps = DEFAULT_STEPS,
  showRememberMe = true,
  magicLink = true,
  verifyCode,
  onResendCode,
  roles = DEFAULT_ROLES,
  termsHref,
  privacyHref,
  className,
}: AuthSectionProps) {
  const reduced = useReducedMotion()
  const [mode, setMode] = useMode(modeProp, defaultMode, onModeChange)
  const [progress, setProgress] = useState(0)
  const [prevMode, setPrevMode] = useState(mode)
  if (mode !== prevMode) {
    setPrevMode(mode)
    setProgress(0)
  }

  const [defTitle, defSubtitle] = COPY[variant][mode]
  const heading = pick(title, mode, defTitle)
  const sub = pick(subtitle, mode, defSubtitle)
  const vars = { "--auth-accent": accent } as CSSProperties

  const formProps = {
    mode,
    onModeSwitch: setMode,
    title: heading,
    subtitle: sub,
    providers,
    onProviderClick,
    onSubmit,
    onForgotPassword,
    forgotPasswordHref,
    showRememberMe,
    termsHref,
    privacyHref,
    reduced,
  }

  if (variant === "card") {
    return (
      <div className={cn("@container grid w-full place-items-center", className)} style={vars}>
        <TiltCard radius={radius} accent={accent} reduced={reduced}>
          <CredentialsForm {...formProps} appearance="card" logo={logo} magicLink={magicLink} />
        </TiltCard>
      </div>
    )
  }

  if (variant === "steps") {
    return (
      <div className={cn("@container grid w-full place-items-center", className)} style={vars}>
        <StepsAuth
          mode={mode}
          onModeSwitch={setMode}
          title={heading}
          subtitle={sub}
          logo={logo}
          providers={providers}
          onProviderClick={onProviderClick}
          onSubmit={onSubmit}
          verifyCode={verifyCode}
          onResendCode={onResendCode}
          roles={roles}
          radius={radius}
          termsHref={termsHref}
          privacyHref={privacyHref}
          reduced={reduced}
        />
      </div>
    )
  }

  const inner = Math.max(radius - 8, 0)
  return (
    <div className={cn("@container w-full", className)} style={vars}>
      <div
        className="dark grid gap-2 bg-black p-2 text-foreground @[720px]:min-h-[560px] @[720px]:grid-cols-2"
        style={{ borderRadius: radius, colorScheme: "dark" }}
      >
        <SplitPanel
          headline={headline}
          description={description}
          steps={steps}
          active={progress}
          logo={logo}
          panelColor={panelColor}
          glowColor={glowColor}
          radius={inner}
          reduced={reduced}
        />
        <div className="flex items-center justify-center px-4 py-8 @[720px]:px-10 @[720px]:py-10">
          <div className="w-full max-w-[380px]">
            <CredentialsForm {...formProps} appearance="split" magicLink={false} onSuccess={() => setProgress(1)} />
          </div>
        </div>
      </div>
    </div>
  )
}
