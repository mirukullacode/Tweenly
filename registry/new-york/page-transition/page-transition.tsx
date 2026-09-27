"use client"

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

gsap.registerPlugin(useGSAP)

export type PageTransitionVariant = "curtain" | "stairs" | "iris" | "slide" | "blinds"
export type PageTransitionEase = "power4" | "expo" | "circ" | "sine"

export interface PageTransitionNavigateOptions {
  /** Click position (client coordinates). The iris variant opens from here. */
  x?: number
  y?: number
  /** Text shown on the cover for this navigation. Overrides the provider `label`. */
  label?: string
  /** Replace the current history entry instead of pushing one (default router only). */
  replace?: boolean
}

export interface PageTransitionContextValue {
  /** Cover the page, navigate to `href`, then reveal the new route. */
  navigate: (href: string, options?: PageTransitionNavigateOptions) => void
  /** Prefetch a route (default router only). */
  prefetch: (href: string) => void
  /** True from the moment the cover starts until the reveal ends. */
  isTransitioning: boolean
  /** Whether a custom `navigate` is in use (then every same-origin link is intercepted). */
  custom: boolean
}

export interface PageTransitionProviderProps {
  /** Transition style. Default: "curtain" */
  variant?: PageTransitionVariant
  /** Length of each phase (cover and reveal), in seconds. Default: 0.8 */
  duration?: number
  /** Cover color (any CSS color). Default: "#0a0a0a" */
  color?: string
  /** Text color on the cover. Default: "#ededed" */
  foreground?: string
  /** Accent used for the dot beside the label. Default: "#ff4d12" */
  accent?: string
  /** Text shown on the cover, or a function of the destination href. Default: undefined (no label) */
  label?: string | ((href: string) => string | undefined)
  /** Number of columns ("stairs") or bars ("blinds"). Default: 5 */
  columns?: number
  /** GSAP ease family used for cover and reveal. Default: "power4" */
  ease?: PageTransitionEase
  /** "fixed" covers the viewport; "absolute" covers the nearest positioned parent. Default: "fixed" */
  position?: "fixed" | "absolute"
  /**
   * Performs the actual navigation. May return a promise that resolves once the new page is rendered.
   * Default: `useRouter().push` (the reveal waits for `usePathname()` to change).
   */
  navigate?: (href: string) => void | Promise<void>
  /** Your pages. */
  children?: React.ReactNode
  /** Classes for the element wrapping your pages (the "slide" variant transforms it). */
  className?: string
  /** Classes for the cover overlay. */
  overlayClassName?: string
}

const EASES: Record<PageTransitionEase, string> = {
  power4: "power4.inOut",
  expo: "expo.inOut",
  circ: "circ.inOut",
  sine: "sine.inOut",
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null)

type Phase = "idle" | "cover" | "wait" | "reveal"
type Pending = { href: string; options: PageTransitionNavigateOptions }

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const finished = (tl: gsap.core.Timeline) => new Promise<void>((r) => tl.eventCallback("onComplete", () => r()))

/** Rectangle with a circular hole, as an even-odd polygon (clip-path can't subtract a circle). */
function holePolygon(w: number, h: number, cx: number, cy: number, r: number, steps = 72) {
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)}px ${(cy + Math.sin(a) * r).toFixed(1)}px`)
  }
  return `polygon(evenodd, 0px 0px, ${w}px 0px, ${w}px ${h}px, 0px ${h}px, 0px 0px, ${pts.join(", ")}, 0px 0px)`
}

/** Geometry that keeps the scaled page centred on, and clipped to, the visible area. */
function pageFrame(page: HTMLElement, overlay: HTMLElement) {
  const wr = page.getBoundingClientRect()
  const ov = overlay.getBoundingClientRect()
  const t = Math.max(0, ov.top - wr.top)
  const l = Math.max(0, ov.left - wr.left)
  const r = Math.max(0, wr.right - ov.right)
  const b = Math.max(0, wr.bottom - ov.bottom)
  return {
    origin: `${ov.left + ov.width / 2 - wr.left}px ${ov.top + ov.height / 2 - wr.top}px`,
    clip: (radius: number) => `inset(${t}px ${r}px ${b}px ${l}px round ${radius}px)`,
    height: ov.height,
  }
}

export function PageTransitionProvider({
  variant = "curtain",
  duration = 0.8,
  color = "#0a0a0a",
  foreground = "#ededed",
  accent = "#ff4d12",
  label,
  columns = 5,
  ease = "power4",
  position = "fixed",
  navigate: customNavigate,
  children,
  className,
  overlayClassName,
}: PageTransitionProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const overlayRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [coverLabel, setCoverLabel] = useState<string | undefined>(undefined)
  const { contextSafe } = useGSAP({ scope: overlayRef })

  const count = Math.max(1, Math.round(columns))
  const settings = { variant, duration, ease, reduced, label, customNavigate, router }
  const settingsRef = useRef(settings)
  const pathnameRef = useRef(pathname)
  const waitersRef = useRef<(() => void)[]>([])
  const runRef = useRef<{ id: number; phase: Phase; target: string; label?: string; pending: Pending | null }>({
    id: 0,
    phase: "idle",
    target: "",
    pending: null,
  })

  useLayoutEffect(() => {
    settingsRef.current = settings
  })

  // A pathname change means the new route has committed; release anyone waiting on it
  useEffect(() => {
    pathnameRef.current = pathname
    const waiters = waitersRef.current
    waitersRef.current = []
    waiters.forEach((resolve) => resolve())
  }, [pathname])

  // Abort in-flight transitions on unmount (and StrictMode's simulated unmount)
  useEffect(() => {
    const run = runRef.current
    return () => {
      run.id++
      run.phase = "idle"
      run.pending = null
    }
  }, [])

  const waitForRoute = useCallback(async (href: string, result: void | Promise<void>, custom: boolean) => {
    if (custom) {
      await result
      await frame()
      await frame()
      await wait(40)
      return
    }
    const target = new URL(href, window.location.href).pathname
    if (target !== pathnameRef.current) {
      await Promise.race([new Promise<void>((r) => waitersRef.current.push(r)), wait(8000)])
    }
    await frame()
    await frame()
  }, [])

  const start = useCallback(
    async (href: string, options: PageTransitionNavigateOptions): Promise<Pending | null> => {
      const overlay = overlayRef.current
      const page = pageRef.current
      if (!overlay || !page) return null
      const s = settingsRef.current
      const run = runRef.current
      const id = ++run.id
      const resolveLabel = (h: string) => options.label ?? (typeof s.label === "function" ? s.label(h) : s.label)
      const text = resolveLabel(href)
      run.phase = "cover"
      run.target = href
      setIsTransitioning(true)
      setCoverLabel(text)

      const q = gsap.utils.selector(overlay)
      const d = Math.max(0.15, s.duration)
      const E = EASES[s.ease] ?? EASES.power4

      // Click point relative to the overlay, for the iris
      const box = overlay.getBoundingClientRect()
      const cx = options.x === undefined ? box.width / 2 : options.x - box.left
      const cy = options.y === undefined ? box.height / 2 : options.y - box.top
      const R =
        Math.max(
          Math.hypot(cx, cy),
          Math.hypot(box.width - cx, cy),
          Math.hypot(cx, box.height - cy),
          Math.hypot(box.width - cx, box.height - cy),
        ) + 2

      // ---------- cover ----------
      const cover = contextSafe(() => {
        const tl = gsap.timeline()
        tl.set(overlay, { visibility: "visible" }).set(q("[data-pt-label]"), { yPercent: 110 })
        if (s.reduced) {
          tl.fromTo(q("[data-pt-fade]"), { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" })
          return tl
        }
        if (s.variant === "curtain") {
          tl.set(q("[data-pt-panel]"), { willChange: "transform" })
            .fromTo(q("[data-pt-panel]"), { yPercent: 118 }, { yPercent: 0, duration: d, ease: E })
            .fromTo(q("[data-pt-curve-top]"), { scaleY: 1 }, { scaleY: 0, duration: d, ease: E }, "<")
            .set(q("[data-pt-curve-bottom]"), { scaleY: 1 })
        } else if (s.variant === "stairs") {
          tl.fromTo(q("[data-pt-col]"), { yPercent: 100 }, { yPercent: 0, duration: d, ease: E, stagger: d * 0.08 })
        } else if (s.variant === "blinds") {
          tl.fromTo(
            q("[data-pt-bar]"),
            { scaleY: 0, transformOrigin: "50% 0%" },
            { scaleY: 1, duration: d * 0.8, ease: E, stagger: d * 0.06 },
          )
        } else if (s.variant === "iris") {
          tl.fromTo(
            q("[data-pt-panel]"),
            { clipPath: `circle(0px at ${cx}px ${cy}px)` },
            { clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: d, ease: E },
          )
        } else {
          const f = pageFrame(page, overlay)
          const panel = q("[data-pt-panel]")
          tl.set(page, { transformOrigin: f.origin, clipPath: f.clip(0), willChange: "transform" })
            .to(page, { scale: 0.9, clipPath: f.clip(28), duration: d * 0.45, ease: E })
            .fromTo(
              panel,
              { yPercent: 100, scale: 0.9, clipPath: "inset(0px round 28px)" },
              { yPercent: 0, duration: d * 0.8, ease: E },
              d * 0.25,
            )
            .to(page, { y: -f.height * 0.25, opacity: 0.4, duration: d * 0.8, ease: E }, "<")
            .to(panel, { scale: 1, clipPath: "inset(0px round 0px)", duration: d * 0.4, ease: E })
        }
        if (text) tl.to(q("[data-pt-label]"), { yPercent: 0, duration: 0.5, ease: "expo.out" }, "-=0.1")
        return tl
      })()

      await finished(cover)
      if (id !== run.id) return null

      // ---------- navigate ----------
      run.phase = "wait"
      const target = run.target
      const nextText = target === href ? text : resolveLabel(target)
      if (target !== href) setCoverLabel(nextText)
      const custom = !!s.customNavigate
      const result = s.customNavigate
        ? s.customNavigate(target)
        : options.replace
          ? s.router.replace(target)
          : s.router.push(target)
      await waitForRoute(target, result, custom)
      if (id !== run.id) return null

      // ---------- reveal ----------
      run.phase = "reveal"
      const reveal = contextSafe(() => {
        const tl = gsap.timeline()
        if (text && !s.reduced) tl.to(q("[data-pt-label]"), { yPercent: -110, duration: 0.35, ease: "power3.in" })
        if (s.reduced) {
          tl.to(q("[data-pt-fade]"), { opacity: 0, duration: 0.25, ease: "power1.out" })
        } else if (s.variant === "curtain") {
          tl.to(q("[data-pt-panel]"), { yPercent: -100, duration: d, ease: E }, "-=0.05").to(
            q("[data-pt-curve-bottom]"),
            { scaleY: 0, duration: d, ease: E },
            "<",
          )
        } else if (s.variant === "stairs") {
          tl.to(q("[data-pt-col]"), { yPercent: -100, duration: d, ease: E, stagger: d * 0.08 }, "-=0.05")
        } else if (s.variant === "blinds") {
          tl.set(q("[data-pt-bar]"), { transformOrigin: "50% 100%" }).to(
            q("[data-pt-bar]"),
            { scaleY: 0, duration: d * 0.8, ease: E, stagger: d * 0.06 },
            "-=0.05",
          )
        } else if (s.variant === "iris") {
          const panel = q("[data-pt-panel]")[0]
          const w = panel.offsetWidth
          const h = panel.offsetHeight
          const hole = { r: 0 }
          tl.set(panel, { clipPath: holePolygon(w, h, cx, cy, 0) }).to(hole, {
            r: R,
            duration: d,
            ease: E,
            onUpdate: () => {
              panel.style.clipPath = holePolygon(w, h, cx, cy, hole.r)
            },
          })
        } else {
          const f = pageFrame(page, overlay)
          const panel = q("[data-pt-panel]")
          tl.set(page, { transformOrigin: f.origin, clipPath: f.clip(28), scale: 0.9, y: 0, opacity: 1 })
            .to(panel, { scale: 0.9, clipPath: "inset(0px round 28px)", duration: d * 0.4, ease: E })
            .to(panel, { yPercent: -100, duration: d * 0.8, ease: E })
            .to(page, { scale: 1, clipPath: f.clip(0), duration: d * 0.5, ease: E }, "-=0.25")
        }
        return tl
      })()

      await finished(reveal)
      if (id !== run.id) return null

      contextSafe(() => {
        gsap.set(overlay, { visibility: "hidden" })
        gsap.set(q("[data-pt-panel], [data-pt-col], [data-pt-bar]"), { clearProps: "clipPath,willChange" })
        gsap.set(page, { clearProps: "transform,transformOrigin,clipPath,opacity,willChange" })
      })()
      run.phase = "idle"
      setIsTransitioning(false)

      const next = run.pending
      run.pending = null
      return next && next.href !== run.target ? next : null
    },
    [contextSafe, waitForRoute],
  )

  const navigate = useCallback(
    (href: string, options: PageTransitionNavigateOptions = {}) => {
      const run = runRef.current
      const s = settingsRef.current
      if (run.phase === "cover") {
        run.target = href
        return
      }
      if (run.phase !== "idle") {
        run.pending = { href, options }
        return
      }
      // Same route (hash or query change): no cover needed
      if (!s.customNavigate) {
        const url = new URL(href, window.location.href)
        if (url.pathname === pathnameRef.current) {
          if (options.replace) s.router.replace(href)
          else s.router.push(href)
          return
        }
      }
      void (async () => {
        let next: Pending | null = { href, options }
        while (next) next = await start(next.href, next.options)
      })()
    },
    [start],
  )

  const prefetch = useCallback((href: string) => {
    const s = settingsRef.current
    if (s.customNavigate || new URL(href, window.location.href).origin !== window.location.origin) return
    s.router.prefetch(href)
  }, [])

  const value = useMemo<PageTransitionContextValue>(
    () => ({ navigate, prefetch, isTransitioning, custom: !!customNavigate }),
    [navigate, prefetch, isTransitioning, customNavigate],
  )

  const curve = "absolute left-[-25%] h-[16cqh] w-[150%]"
  let layers: React.ReactNode = null
  if (variant === "curtain") {
    layers = (
      <div data-pt-panel className="absolute inset-0" style={{ background: color }}>
        <div
          data-pt-curve-top
          className={cn(curve, "bottom-[calc(100%-1px)] origin-bottom rounded-t-[100%]")}
          style={{ background: color }}
        />
        <div
          data-pt-curve-bottom
          className={cn(curve, "top-[calc(100%-1px)] origin-top rounded-b-[100%]")}
          style={{ background: color }}
        />
      </div>
    )
  } else if (variant === "stairs") {
    layers = (
      <div className="absolute inset-0 flex">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} data-pt-col className="-mr-px h-full flex-1" style={{ background: color }} />
        ))}
      </div>
    )
  } else if (variant === "blinds") {
    layers = (
      <div className="absolute inset-0 flex flex-col">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} data-pt-bar className="-mb-px w-full flex-1" style={{ background: color }} />
        ))}
      </div>
    )
  } else {
    layers = <div data-pt-panel className="absolute inset-0" style={{ background: color }} />
  }

  return (
    <PageTransitionContext.Provider value={value}>
      <div ref={pageRef} className={className}>
        {children}
      </div>
      <div
        ref={overlayRef}
        aria-hidden
        className={cn(
          "inset-0 z-[9999] overflow-hidden [container-type:size]",
          isTransitioning ? "pointer-events-auto" : "pointer-events-none",
          position,
          overlayClassName,
        )}
        style={{ visibility: "hidden", color: foreground }}
      >
        {layers}
        <div data-pt-fade className="absolute inset-0 opacity-0" style={{ background: color }} />
        <div className="absolute inset-0 grid place-items-center">
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-pt-label className="flex items-center gap-[0.3em] text-[clamp(2rem,7cqw,5rem)] font-medium tracking-tight">
              {coverLabel && <span className="size-[0.18em] shrink-0 rounded-full" style={{ background: accent }} />}
              {coverLabel}
            </span>
          </span>
        </div>
      </div>
    </PageTransitionContext.Provider>
  )
}

/** Returns `navigate(href, options?)` and `isTransitioning`. Falls back to plain navigation outside a provider. */
export function usePageTransition() {
  const ctx = useContext(PageTransitionContext)
  return useMemo(
    () => ({
      navigate: ctx?.navigate ?? ((href: string) => window.location.assign(href)),
      isTransitioning: ctx?.isTransitioning ?? false,
    }),
    [ctx],
  )
}

export interface TransitionLinkProps extends Omit<React.ComponentProps<"a">, "href"> {
  /** Destination. External links and modifier-clicks behave like a normal anchor. */
  href: string
  /** Text shown on the cover for this link. Overrides the provider `label`. */
  label?: string
  /** Replace the current history entry instead of pushing one. Default: false */
  replace?: boolean
  /** Prefetch the route on hover and focus (default router only). Default: true */
  prefetch?: boolean
}

/** Drop-in anchor that plays the page transition on plain left-clicks. */
export function TransitionLink({
  href,
  label,
  replace = false,
  prefetch = true,
  onClick,
  onMouseEnter,
  onFocus,
  target,
  download,
  ...props
}: TransitionLinkProps) {
  const ctx = useContext(PageTransitionContext)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || !ctx) return
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if ((target && target !== "_self") || download !== undefined) return
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin) return
    // In-page anchors scroll natively when the real router is in use
    if (!ctx.custom && url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return
    e.preventDefault()
    // detail === 0 means keyboard activation: no meaningful pointer position
    const point = e.detail === 0 ? {} : { x: e.clientX, y: e.clientY }
    ctx.navigate(href, { ...point, label, replace })
  }

  const warm = () => {
    if (prefetch && ctx) ctx.prefetch(href)
  }

  return (
    <a
      href={href}
      target={target}
      download={download}
      onClick={handleClick}
      onMouseEnter={(e) => {
        onMouseEnter?.(e)
        warm()
      }}
      onFocus={(e) => {
        onFocus?.(e)
        warm()
      }}
      {...props}
    />
  )
}
