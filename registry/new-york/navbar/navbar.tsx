"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type Transition,
} from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type NavbarVariant = "pill" | "morph" | "underline" | "island" | "overlay"

export interface NavbarChildLink {
  label: string
  href: string
  description?: string
}

export interface NavbarLink extends NavbarChildLink {
  /** Sub-links shown in the island mega-menu and the overlay footer. */
  children?: NavbarChildLink[]
}

export interface NavbarProps {
  /** Top-level links. */
  links: NavbarLink[]
  /** Brand shown on the left. Default: a small wordmark */
  logo?: React.ReactNode
  /** Call-to-action button on the right. */
  cta?: { label: string; href: string }
  /** Href of the current page, marked as active. */
  activeHref?: string
  /** Visual style. Default: "pill" */
  variant?: NavbarVariant
  /** Scroll distance in px before the morph variant turns into a pill. Default: 40 */
  scrollThreshold?: number
  /** Hide on fast downward scroll and reveal on scroll up (morph). Default: true */
  hideOnScroll?: boolean
  /** Element to read the scroll position from. Default: window */
  scroller?: HTMLElement | null
  /** CSS positioning of the bar. Default: "sticky" */
  position?: "fixed" | "sticky" | "absolute"
  /** Indicator and CTA color (any CSS color). Default: foreground */
  accentColor?: string
  /** Called when a link is clicked. Call `e.preventDefault()` to route yourself. */
  onNavigate?: (href: string, e: React.MouseEvent<HTMLAnchorElement>) => void
  className?: string
}

type Shared = {
  links: NavbarLink[]
  logo: React.ReactNode
  cta?: { label: string; href: string }
  activeHref?: string
  accent: string
  accentColor?: string
  onNavigate?: NavbarProps["onNavigate"]
  reduced: boolean
}

const POSITION = {
  fixed: "fixed inset-x-0 top-0",
  sticky: "sticky top-0",
  absolute: "absolute inset-x-0 top-0",
}

const SPRING: Transition = { type: "spring", stiffness: 420, damping: 34 }
const SOFT: Transition = { type: "spring", stiffness: 260, damping: 30 }
const INSTANT: Transition = { duration: 0 }
const EASE = [0.76, 0, 0.24, 1] as const

const HOME = "/"
const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function Navbar({
  links,
  logo,
  cta,
  activeHref,
  variant = "pill",
  scrollThreshold = 40,
  hideOnScroll = true,
  scroller,
  position = "sticky",
  accentColor,
  onNavigate,
  className,
}: NavbarProps) {
  const reduced = !!useReducedMotion()
  const s: Shared = {
    links,
    logo: logo ?? <DefaultLogo onNavigate={onNavigate} />,
    cta,
    activeHref,
    accent: accentColor ?? "currentColor",
    accentColor,
    onNavigate,
    reduced,
  }
  const root = cn("z-50 w-full", POSITION[position], className)

  switch (variant) {
    case "morph":
      return (
        <MorphNav s={s} className={root} scroller={scroller} threshold={scrollThreshold} hideOnScroll={hideOnScroll} />
      )
    case "underline":
      return <UnderlineNav s={s} className={root} />
    case "island":
      return <IslandNav s={s} className={root} />
    case "overlay":
      return <OverlayNav s={s} className={root} />
    default:
      return <PillNav s={s} className={root} />
  }
}

// ------------------------------------------------------------------ shared

function DefaultLogo({ onNavigate }: { onNavigate?: NavbarProps["onNavigate"] }) {
  return (
    <a
      href={HOME}
      aria-label="Home"
      onClick={(e) => onNavigate?.(HOME, e)}
      className={cn("flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight", focusRing)}
    >
      <span aria-hidden className="size-3 rotate-45 rounded-[3px] bg-current" />
      acme
    </a>
  )
}

function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [active, onEscape])
}

function useScrollState(scroller: HTMLElement | null | undefined, threshold: number) {
  const [state, setState] = useState({ scrolled: false, hidden: false })

  useEffect(() => {
    const target: HTMLElement | Window = scroller ?? window
    const read = () => (scroller ? scroller.scrollTop : window.scrollY)
    let last = read()

    const onScroll = () => {
      const y = read()
      const delta = y - last
      last = y
      setState((prev) => {
        const scrolled = y > threshold
        let hidden = prev.hidden
        if (y <= threshold + 80) hidden = false
        else if (delta > 8) hidden = true
        else if (delta < -4) hidden = false
        return scrolled === prev.scrolled && hidden === prev.hidden ? prev : { scrolled, hidden }
      })
    }

    const raf = requestAnimationFrame(onScroll)
    target.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      target.removeEventListener("scroll", onScroll)
    }
  }, [scroller, threshold])

  return state
}

function Cta({ s, inverted, className }: { s: Shared; inverted?: boolean; className?: string }) {
  if (!s.cta) return null
  const { href, label } = s.cta
  return (
    <a
      href={href}
      onClick={(e) => s.onNavigate?.(href, e)}
      style={s.accentColor ? { background: s.accentColor, color: "#fff" } : undefined}
      className={cn(
        "group inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full pl-3.5 pr-3 text-sm font-medium transition-[opacity,transform] hover:opacity-90 active:scale-[0.97]",
        inverted ? "bg-background text-foreground" : "bg-foreground text-background",
        focusRing,
        className
      )}
    >
      {label}
      <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
    </a>
  )
}

function Burger({
  open,
  onClick,
  controls,
  className,
  ref,
}: {
  open: boolean
  onClick: () => void
  controls: string
  className?: string
  ref?: React.Ref<HTMLButtonElement>
}) {
  const reduced = useReducedMotion()
  const t: Transition = reduced ? INSTANT : { type: "spring", stiffness: 400, damping: 26 }
  const line = "absolute inset-x-0 top-1/2 -mt-[0.75px] h-[1.5px] rounded-full bg-current"

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={onClick}
      className={cn("grid size-9 shrink-0 place-items-center rounded-full", focusRing, className)}
    >
      <span className="relative block h-3 w-4">
        <motion.span
          className={line}
          initial={false}
          animate={open ? { y: 0, rotate: 45 } : { y: -3.5, rotate: 0 }}
          transition={t}
        />
        <motion.span
          className={line}
          initial={false}
          animate={open ? { y: 0, rotate: -45 } : { y: 3.5, rotate: 0 }}
          transition={t}
        />
      </span>
    </button>
  )
}

function CapsuleLinks({
  s,
  tone = "default",
  openIndex,
  onHoverLink,
  className,
}: {
  s: Shared
  tone?: "default" | "inverted"
  openIndex?: number | null
  onHoverLink?: (index: number) => void
  className?: string
}) {
  const id = useId()
  const [hover, setHover] = useState<string | null>(null)
  const inverted = tone === "inverted"
  const t = s.reduced ? INSTANT : SPRING

  return (
    <ul className={cn("items-center", className)} onPointerLeave={() => setHover(null)}>
      {s.links.map((l, i) => {
        const active = l.href === s.activeHref
        const hasMenu = !!l.children?.length
        const enter = () => {
          setHover(l.href)
          onHoverLink?.(i)
        }
        return (
          <li key={l.href}>
            <a
              href={l.href}
              aria-current={active ? "page" : undefined}
              aria-expanded={onHoverLink && hasMenu ? openIndex === i : undefined}
              onClick={(e) => s.onNavigate?.(l.href, e)}
              onPointerEnter={enter}
              onFocus={enter}
              className={cn(
                "relative isolate flex items-center rounded-full px-3 py-1.5 text-sm transition-colors duration-200",
                focusRing,
                inverted
                  ? active || hover === l.href
                    ? "text-background"
                    : "text-background/60"
                  : active || hover === l.href
                    ? "text-foreground"
                    : "text-muted-foreground"
              )}
            >
              <AnimatePresence>
                {hover === l.href && (
                  <motion.span
                    layoutId={`${id}-hl`}
                    className={cn("absolute inset-0 -z-10 rounded-full", inverted ? "bg-background/15" : "bg-muted")}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={t}
                  />
                )}
              </AnimatePresence>
              {l.label}
              {active && (
                <motion.span
                  layoutId={`${id}-dot`}
                  className="absolute inset-x-0 bottom-0.5 mx-auto size-1 rounded-full"
                  style={{ background: s.accent }}
                  transition={t}
                />
              )}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

function MobileSheet({
  s,
  id,
  open,
  onClose,
  className,
}: {
  s: Shared
  id: string
  open: boolean
  onClose: () => void
  className?: string
}) {
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={id}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={s.reduced ? INSTANT : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn("absolute top-full origin-top", className)}
        >
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: s.reduced ? 0 : 0.045, delayChildren: 0.04 } } }}
            className="flex flex-col p-2"
          >
            {s.links.map((l) => (
              <motion.li key={l.href} variants={item}>
                <a
                  href={l.href}
                  aria-current={l.href === s.activeHref ? "page" : undefined}
                  onClick={(e) => {
                    s.onNavigate?.(l.href, e)
                    onClose()
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] transition-colors hover:bg-muted",
                    focusRing
                  )}
                >
                  {l.label}
                  {l.href === s.activeHref && <span className="size-1.5 rounded-full" style={{ background: s.accent }} />}
                </a>
              </motion.li>
            ))}
            {s.cta && (
              <motion.li variants={item} className="mt-1 px-1 pb-1">
                <Cta s={s} className="h-10 w-full justify-center" />
              </motion.li>
            )}
          </motion.ul>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ------------------------------------------------------------------ pill

function PillNav({ s, className }: { s: Shared; className?: string }) {
  const [open, setOpen] = useState(false)
  const sheetId = useId()
  useEscape(open, () => setOpen(false))

  return (
    <header className={cn("@container flex justify-center px-3 pt-4", className)}>
      <nav
        aria-label="Main"
        className="flex w-full max-w-max items-center gap-1 rounded-full border bg-background/70 p-1.5 pl-4 shadow-lg shadow-black/[0.04] backdrop-blur-xl dark:shadow-black/30"
      >
        <div className="mr-2 flex shrink-0 items-center">{s.logo}</div>
        <CapsuleLinks s={s} className="hidden @lg:flex" />
        <div className="ml-auto flex items-center gap-1 @lg:ml-2">
          <Cta s={s} className="hidden @md:inline-flex" />
          <Burger open={open} onClick={() => setOpen((o) => !o)} controls={sheetId} className="@lg:hidden" />
        </div>
      </nav>
      <MobileSheet
        s={s}
        id={sheetId}
        open={open}
        onClose={() => setOpen(false)}
        className="inset-x-3 mt-2 rounded-2xl border bg-popover text-popover-foreground shadow-xl @lg:hidden"
      />
    </header>
  )
}

// ------------------------------------------------------------------ morph

function MorphNav({
  s,
  className,
  scroller,
  threshold,
  hideOnScroll,
}: {
  s: Shared
  className?: string
  scroller?: HTMLElement | null
  threshold: number
  hideOnScroll: boolean
}) {
  const { scrolled, hidden } = useScrollState(scroller, threshold)
  const [open, setOpen] = useState(false)
  const sheetId = useId()
  useEscape(open, () => setOpen(false))
  const t = s.reduced ? INSTANT : SOFT

  return (
    <motion.header
      className={cn("@container flex h-[72px] justify-center", className)}
      initial={false}
      animate={{ y: hideOnScroll && hidden && !open ? "-110%" : "0%" }}
      transition={t}
    >
      <motion.nav
        layout
        aria-label="Main"
        transition={t}
        style={{ borderRadius: scrolled ? 24 : 0 }}
        className={cn(
          "flex items-center gap-2 border transition-[background-color,border-color,box-shadow] duration-500",
          scrolled
            ? "mt-3 h-12 w-[min(100%_-_1.5rem,42rem)] border-border bg-background/70 pl-4 pr-1.5 shadow-xl shadow-black/[0.06] backdrop-blur-xl dark:shadow-black/40"
            : "h-[72px] w-full border-transparent bg-transparent px-6"
        )}
      >
        <motion.div layout="position" transition={t} className="flex shrink-0 items-center">
          {s.logo}
        </motion.div>
        <motion.div layout="position" transition={t} className="mx-auto hidden @lg:block">
          <CapsuleLinks s={s} className="flex" />
        </motion.div>
        <motion.div layout="position" transition={t} className="ml-auto flex items-center gap-1 @lg:ml-0">
          <Cta s={s} className="hidden @md:inline-flex" />
          <Burger open={open} onClick={() => setOpen((o) => !o)} controls={sheetId} className="@lg:hidden" />
        </motion.div>
      </motion.nav>
      <MobileSheet
        s={s}
        id={sheetId}
        open={open}
        onClose={() => setOpen(false)}
        className="inset-x-3 mt-2 rounded-2xl border bg-popover text-popover-foreground shadow-xl @lg:hidden"
      />
    </motion.header>
  )
}

// ------------------------------------------------------------------ underline

function UnderlineNav({ s, className }: { s: Shared; className?: string }) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const sheetId = useId()
  const id = useId()
  useEscape(open, () => setOpen(false))
  const current = hover ?? s.activeHref
  const t = s.reduced ? INSTANT : SPRING

  return (
    <header className={cn("@container border-b bg-background/80 backdrop-blur-xl", className)}>
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5">
        <div className="mr-2 flex shrink-0 items-center">{s.logo}</div>
        <ul className="hidden h-full items-stretch @lg:flex" onPointerLeave={() => setHover(null)}>
          {s.links.map((l) => (
            <li key={l.href} className="relative flex">
              <a
                href={l.href}
                aria-current={l.href === s.activeHref ? "page" : undefined}
                onClick={(e) => s.onNavigate?.(l.href, e)}
                onPointerEnter={() => setHover(l.href)}
                onFocus={() => setHover(l.href)}
                onBlur={() => setHover(null)}
                className={cn(
                  "relative flex items-center px-3 text-sm transition-colors duration-200 focus-visible:ring-inset",
                  focusRing,
                  current === l.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {l.label}
                {current === l.href && (
                  <motion.span
                    layoutId={`${id}-line`}
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full"
                    style={{ background: s.accent }}
                    transition={t}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-1">
          <Cta s={s} className="hidden @md:inline-flex" />
          <Burger open={open} onClick={() => setOpen((o) => !o)} controls={sheetId} className="-mr-2 @lg:hidden" />
        </div>
      </nav>
      <MobileSheet
        s={s}
        id={sheetId}
        open={open}
        onClose={() => setOpen(false)}
        className="inset-x-0 border-b bg-background shadow-lg shadow-black/5 @lg:hidden"
      />
    </header>
  )
}

// ------------------------------------------------------------------ island

function IslandNav({ s, className }: { s: Shared; className?: string }) {
  const [menu, setMenu] = useState<number | null>(null)
  const [mobile, setMobile] = useState(false)
  const panelId = useId()
  const expanded = menu !== null || mobile
  const close = () => {
    setMenu(null)
    setMobile(false)
  }
  useEscape(expanded, close)

  const t: Transition = s.reduced ? INSTANT : { type: "spring", stiffness: 380, damping: 32 }
  const fade: Transition = s.reduced ? INSTANT : { duration: 0.2, ease: "easeOut" }
  const children = menu !== null ? s.links[menu]?.children : undefined

  return (
    <header className={cn("@container flex justify-center px-3 pt-3", className)}>
      <motion.nav
        layout
        aria-label="Main"
        transition={t}
        onPointerLeave={() => setMenu(null)}
        style={{ borderRadius: expanded ? 26 : 22 }}
        className={cn(
          "relative overflow-hidden bg-foreground text-background shadow-2xl shadow-black/25",
          expanded && "w-[min(36rem,100cqw_-_1.5rem)]"
        )}
      >
        <div className="flex h-11 items-center gap-1 pl-4 pr-1.5">
          <motion.div layout="position" transition={t} className="mr-2 flex shrink-0 items-center">
            {s.logo}
          </motion.div>
          <motion.div layout="position" transition={t} className="hidden @lg:block">
            <CapsuleLinks
              s={s}
              tone="inverted"
              openIndex={menu}
              onHoverLink={(i) => {
                setMobile(false)
                setMenu(s.links[i]?.children?.length ? i : null)
              }}
              className="flex"
            />
          </motion.div>
          <motion.div layout="position" transition={t} className="ml-auto flex items-center gap-1 pl-2">
            <Cta s={s} inverted className="hidden h-8 @md:inline-flex" />
            <Burger
              open={mobile}
              onClick={() => {
                setMenu(null)
                setMobile((m) => !m)
              }}
              controls={panelId}
              className="@lg:hidden"
            />
          </motion.div>
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          {children && (
            <motion.div
              key={menu}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={fade}
              className="grid grid-cols-1 gap-0.5 p-2 pt-1 @md:grid-cols-2"
            >
              {children.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  onClick={(e) => {
                    s.onNavigate?.(c.href, e)
                    close()
                  }}
                  className={cn("rounded-2xl px-3 py-2.5 transition-colors hover:bg-background/10", focusRing)}
                >
                  <span className="block text-sm font-medium">{c.label}</span>
                  {c.description && (
                    <span className="mt-0.5 block text-xs leading-relaxed text-background/55">{c.description}</span>
                  )}
                </a>
              ))}
            </motion.div>
          )}
          {mobile && (
            <motion.ul
              key="mobile"
              id={panelId}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              variants={{ show: { transition: { staggerChildren: s.reduced ? 0 : 0.04 } } }}
              className="flex flex-col p-2 pt-1"
            >
              {s.links.map((l) => (
                <motion.li key={l.href} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                  <a
                    href={l.href}
                    aria-current={l.href === s.activeHref ? "page" : undefined}
                    onClick={(e) => {
                      s.onNavigate?.(l.href, e)
                      close()
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-3 py-2.5 text-[15px] transition-colors hover:bg-background/10",
                      focusRing
                    )}
                  >
                    {l.label}
                    {l.href === s.activeHref && <span className="size-1.5 rounded-full" style={{ background: s.accent }} />}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  )
}

// ------------------------------------------------------------------ overlay

function OverlayNav({ s, className }: { s: Shared; className?: string }) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const burgerRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  useEscape(open, () => setOpen(false))

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const r = useMotionValue(0)
  const clipPath = useMotionTemplate`circle(${r}px at ${x}px ${y}px)`
  const { reduced } = s

  // Grow the circle from the burger to the farthest corner of the overlay
  useEffect(() => {
    const b = burgerRef.current?.getBoundingClientRect()
    const o = overlayRef.current?.getBoundingClientRect()
    if (!b || !o) return
    const cx = b.left + b.width / 2 - o.left
    const cy = b.top + b.height / 2 - o.top
    x.set(cx)
    y.set(cy)
    const target = open ? Math.hypot(Math.max(cx, o.width - cx), Math.max(cy, o.height - cy)) : 0
    const controls = animate(r, target, reduced ? INSTANT : { duration: open ? 0.75 : 0.55, ease: EASE })
    return () => controls.stop()
  }, [open, reduced, r, x, y])

  const secondary = s.links.flatMap((l) => l.children ?? []).slice(0, 6)
  const rise: Transition = { duration: 0.8, ease: [0.22, 1, 0.36, 1] }

  return (
    <nav aria-label="Main" className={className}>
      <div
        className={cn(
          "relative z-10 flex h-16 items-center justify-between px-5 transition-[color,background-color] duration-500",
          open ? "bg-transparent text-background delay-150" : "bg-background/80 text-foreground backdrop-blur-xl"
        )}
      >
        <div className="flex shrink-0 items-center">{s.logo}</div>
        <div className="flex items-center gap-1">
          <span aria-hidden className="relative h-5 overflow-hidden text-sm">
            <motion.span
              className="flex flex-col"
              initial={false}
              animate={{ y: open ? "-50%" : "0%" }}
              transition={reduced ? INSTANT : { duration: 0.5, ease: EASE }}
            >
              <span className="h-5 leading-5">Menu</span>
              <span className="h-5 leading-5">Close</span>
            </motion.span>
          </span>
          <Burger ref={burgerRef} open={open} onClick={() => setOpen((o) => !o)} controls={menuId} className="-mr-2" />
        </div>
      </div>

      <motion.div
        ref={overlayRef}
        id={menuId}
        inert={!open}
        aria-hidden={!open}
        style={{ clipPath }}
        className={cn(
          "fixed inset-0 flex flex-col bg-foreground px-6 pb-8 pt-24 text-background sm:px-10",
          !open && "pointer-events-none"
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-10">
          <ul className="flex flex-col">
            {s.links.map((l, i) => {
              const active = l.href === s.activeHref
              return (
                <li key={l.href} className="overflow-hidden">
                  <motion.a
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => {
                      s.onNavigate?.(l.href, e)
                      setOpen(false)
                    }}
                    initial={false}
                    animate={open ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }}
                    transition={reduced ? INSTANT : { ...rise, delay: open ? 0.25 + i * 0.07 : 0 }}
                    className={cn(
                      "group flex items-baseline gap-4 rounded-lg py-1 text-5xl font-semibold tracking-tighter sm:text-7xl",
                      focusRing
                    )}
                  >
                    <span className="w-6 font-mono text-xs font-normal tracking-normal text-background/40 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "transition-[opacity,transform] duration-300 group-hover:translate-x-2",
                        active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                      )}
                    >
                      {l.label}
                    </span>
                    {active && (
                      <span
                        className="size-2 self-center rounded-full"
                        style={{ background: s.accentColor ?? "currentColor" }}
                      />
                    )}
                  </motion.a>
                </li>
              )
            })}
          </ul>

          <motion.div
            initial={false}
            animate={{ opacity: open ? 1 : 0, y: open ? 0 : 12 }}
            transition={reduced ? INSTANT : { duration: 0.5, delay: open ? 0.5 : 0 }}
            className="flex flex-wrap items-end justify-between gap-6 border-t border-background/15 pt-5 text-sm"
          >
            {secondary.length > 0 && (
              <ul className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
                {secondary.map((c) => (
                  <li key={c.href}>
                    <a
                      href={c.href}
                      onClick={(e) => {
                        s.onNavigate?.(c.href, e)
                        setOpen(false)
                      }}
                      className={cn("rounded text-background/55 transition-colors hover:text-background", focusRing)}
                    >
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <Cta s={s} inverted className="h-10 px-5" />
          </motion.div>
        </div>
      </motion.div>
    </nav>
  )
}
