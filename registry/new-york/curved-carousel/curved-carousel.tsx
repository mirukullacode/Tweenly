"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface CurvedCarouselImage {
  /** Image path, e.g. "/gallery/01.jpg" from your public folder. */
  src: string
  alt?: string
  /** Shown in the caption and, when the image is missing, as the poster title. */
  title?: string
  caption?: string
}

export interface CurvedCarouselProps {
  images: CurvedCarouselImage[]
  /** "scroll" pins and scrubs with the page, "drag" spins with pointer drag and inertia, "auto" rotates slowly. Default: "scroll" */
  mode?: "scroll" | "drag" | "auto"
  /** Start with the first image covering the whole section, then shrink it into the ring. Default: true */
  intro?: boolean
  /** "circle" morphs through a small circle on the way from full-bleed to card. Default: "rounded" */
  introShape?: "rounded" | "circle"
  /** Cylinder radius in card widths. Lower curves harder, higher is flatter. Default: 2.2 */
  radius?: number
  /** "inside" wraps the cards around the viewer, "outside" curves them away like a drum. Default: "inside" */
  curve?: "inside" | "outside"
  /** Card width as % of the section width (capped by the section height). Default: 24 */
  cardWidth?: number
  /** Card aspect ratio, width / height. Default: "3 / 4" */
  cardAspect?: string
  /** Space between cards along the curve, in px. Default: 24 */
  gap?: number
  /** Perspective distance in px. Lower exaggerates depth. Default: 1400 */
  perspective?: number
  /** How strongly side cards turn, as a multiple of the cylinder angle. 0 keeps them flat. Default: 1 */
  tilt?: number
  /** Cards visible on each side of the center card. Default: 3 */
  visible?: number
  /** Darkening of side cards, 0 to 1. Default: 0.55 */
  dim?: number
  /** Card corner radius in px. Default: 18 */
  cardRadius?: number
  /** Scroll mode: section heights of scrolling for the whole sequence. Default: 6 */
  scrollLength?: number
  /** Settle on the nearest card when scrolling or dragging stops. Default: false */
  snap?: boolean
  /** Auto mode: cards per second. Default: 0.15 */
  speed?: number
  /** Show number, title and caption on the center card. Default: true */
  showCaptions?: boolean
  /** Section background. Follows the theme by default. Default: "var(--background)" */
  background?: string
  /** Section height (any CSS length). 100cqh fills the nearest size container, or the viewport. Default: "100cqh" */
  height?: string
  /** Scroll container to track in scroll mode. Omit for the window; null waits for it to mount. Default: window */
  scroller?: HTMLElement | null
  /** Called when the intro finishes and the carousel takes over. */
  onIntroComplete?: () => void
  /** Called with the index of the image that becomes the center card. */
  onIndexChange?: (index: number) => void
  className?: string
}

/** violet · magenta · green · orange · blue · purple · teal */
const POSTER_PALETTE = ["#6b2bd9", "#e5197e", "#17a34a", "#ff6b1a", "#2563eb", "#b62bd9", "#0d9488"]

const inOut = gsap.parseEase("power4.inOut")
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function parseAspect(aspect: string) {
  const [w, h] = aspect.split("/").map((v) => parseFloat(v))
  return w && h ? w / h : 0.75
}

/** Image over a solid color poster; the poster shows while loading and whenever the file is missing. */
function CardMedia({ image, index }: { image: CurvedCarouselImage; index: number }) {
  const ref = useRef<HTMLImageElement>(null)
  const [failed, setFailed] = useState<string | null>(null)

  // Catch images that failed before hydration attached onError
  useEffect(() => {
    const img = ref.current
    if (!img?.complete || img.naturalWidth !== 0) return
    const id = requestAnimationFrame(() => setFailed(image.src))
    return () => cancelAnimationFrame(id)
  }, [image.src])

  const title = image.title ?? image.alt ?? `No. ${index + 1}`

  return (
    <>
      <div
        className="absolute inset-0 flex flex-col justify-start gap-[4cqw] overflow-hidden p-[7cqw] text-white [container-type:inline-size]"
        style={{ background: POSTER_PALETTE[index % POSTER_PALETTE.length] }}
        aria-hidden={!!image.src && failed !== image.src}
      >
        <span className="relative font-mono text-[6cqw] tracking-[0.08em] opacity-80">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="relative break-words font-[family-name:var(--font-display)] text-[19cqw] font-bold uppercase leading-[0.86] tracking-[-0.01em]">
          {title}
        </span>
      </div>
      {image.src && failed !== image.src && (
        <img
          ref={ref}
          src={image.src}
          alt={image.alt ?? image.title ?? ""}
          onError={() => setFailed(image.src)}
          draggable={false}
          className="absolute inset-0 size-full object-cover text-transparent"
        />
      )}
    </>
  )
}

function Caption({ image, index, total }: { image: CurvedCarouselImage; index: number; total: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/55 p-[clamp(0.75rem,6%,1.25rem)] text-[#ededed]">
      <p className="font-mono text-[10px] tabular-nums tracking-[0.12em] text-white/60">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      {image.title && <p className="mt-1 text-sm font-semibold leading-tight tracking-tight">{image.title}</p>}
      {image.caption && <p className="mt-0.5 text-xs leading-snug text-white/65">{image.caption}</p>}
    </div>
  )
}

/**
 * Posters on a 3D cylinder. In scroll mode the first image starts full-bleed, shrinks into a card
 * as the ring fades in around it, then the cylinder turns card by card while the section is pinned.
 */
export function CurvedCarousel({
  images,
  mode = "scroll",
  intro = true,
  introShape = "rounded",
  radius = 2.2,
  curve = "inside",
  cardWidth = 24,
  cardAspect = "3 / 4",
  gap = 24,
  perspective = 1400,
  tilt = 1,
  visible = 3,
  dim = 0.55,
  cardRadius = 18,
  scrollLength = 6,
  snap = false,
  speed = 0.15,
  showCaptions = true,
  background = "var(--background)",
  height = "100cqh",
  scroller,
  onIntroComplete,
  onIndexChange,
  className,
}: CurvedCarouselProps) {
  const rootRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [size, setSize] = useState({ w: 0, h: 0 })
  const n = images.length

  // State that survives re-runs (resize, prop tweaks) without re-rendering
  const posRef = useRef(0)
  const activeRef = useRef(-1)
  const introDoneRef = useRef(false)
  const sequenceRef = useRef("")
  const callbacks = useRef({ onIntroComplete, onIndexChange })
  useEffect(() => {
    callbacks.current = { onIntroComplete, onIndexChange }
  }, [onIntroComplete, onIndexChange])

  useEffect(() => {
    const root = rootRef.current
    if (!root || reduced) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height: h } = entry.contentRect
      setSize((s) => (Math.abs(s.w - width) < 1 && Math.abs(s.h - h) < 1 ? s : { w: width, h }))
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [reduced])

  // Geometry (pure): card size from the section, capped so tall cards still fit
  const ratio = parseAspect(cardAspect)
  const cw = size.w
    ? Math.min(Math.max((size.w * cardWidth) / 100, Math.min(size.w * 0.62, 200)), size.h * 0.74 * ratio)
    : 0
  const ch = cw / ratio
  const ready = cw > 0 && n > 0

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !ready || reduced) return
      if (mode === "scroll" && scroller === null) return

      // A new mode or intro setting replays the sequence from the first card
      const sequence = `${mode}|${intro}|${introShape}|${n}`
      if (sequenceRef.current !== sequence) {
        sequenceRef.current = sequence
        introDoneRef.current = false
        posRef.current = 0
      }

      const cards = gsap.utils.toArray<HTMLElement>("[data-cc-card]", root)
      const media = cards.map((c) => c.querySelector<HTMLElement>("[data-cc-media]"))
      const shades = cards.map((c) => c.querySelector<HTMLElement>("[data-cc-shade]"))
      const captions = cards.map((c) => c.querySelector<HTMLElement>("[data-cc-caption]"))

      const W = size.w
      const H = size.h
      const step = cw + gap
      const R = Math.max(radius, 0.4) * cw
      const stepAngle = step / R
      const sign = curve === "inside" ? 1 : -1
      const wrap = mode !== "scroll" || n > 2 * visible + 1
      const circle = Math.min(cw, ch) * 0.62

      const render = (pos: number, introP: number) => {
        // Intro shape for the first card: full-bleed -> (circle) -> card
        let sx = 1
        let sy = 1
        let rv = cardRadius
        let ringP = 1
        if (introP < 1) {
          if (introShape === "circle") {
            const a = inOut(clamp01(introP / 0.5))
            const b = inOut(clamp01((introP - 0.5) / 0.5))
            sx = lerp(lerp(W / cw, circle / cw, a), 1, b)
            sy = lerp(lerp(H / ch, circle / ch, a), 1, b)
            rv = lerp(lerp(0, circle / 2, a), cardRadius, b)
            ringP = inOut(clamp01((introP - 0.45) / 0.55))
          } else {
            const e = inOut(introP)
            sx = lerp(W / cw, 1, e)
            sy = lerp(H / ch, 1, e)
            rv = lerp(0, cardRadius, e)
            ringP = inOut(clamp01((introP - 0.25) / 0.75))
          }
        }

        for (let i = 0; i < n; i++) {
          const card = cards[i]
          let d = i - pos
          if (wrap) d = ((((d + n / 2) % n) + n) % n) - n / 2
          const isIntroCard = introP < 1 && i === 0
          // Neighbours slide in from further out while the intro plays
          const dd = isIntroCard ? 0 : d * (1 + (1 - ringP) * 0.9)
          const abs = Math.abs(dd)
          const angle = dd * stepAngle
          const depth = sign * R * (1 - Math.cos(angle))
          let opacity = clamp01(visible + 0.6 - abs) * (isIntroCard ? 1 : ringP)
          if (Math.abs(angle) > 1.45 || depth > perspective - 80) opacity = 0

          if (opacity <= 0.001) {
            card.style.visibility = "hidden"
            continue
          }
          card.style.visibility = "visible"
          card.style.opacity = String(opacity)
          card.style.zIndex = String(isIntroCard ? 2000 : 1000 - Math.round(abs * 10))

          const x = R * Math.sin(angle)
          const ry = ((-sign * angle * 180) / Math.PI) * tilt
          const s = 1 - Math.min(abs, visible) * 0.04
          card.style.transform = `perspective(${perspective}px) translate3d(${x}px, 0px, ${depth}px) rotateY(${ry}deg) scale(${s * sx}, ${s * sy})`
          card.style.borderRadius = isIntroCard ? `${rv / sx}px / ${rv / sy}px` : `${cardRadius}px`

          // Counter-scale the image so it stays undistorted inside a non-uniform frame
          const m = media[i]
          if (m) {
            const k = Math.max(sx, sy)
            m.style.transform = isIntroCard ? `scale(${k / sx}, ${k / sy})` : "none"
          }
          const shade = shades[i]
          if (shade) shade.style.opacity = String(Math.min(0.92, dim * Math.min(abs, 2.5) * 0.7))
          const cap = captions[i]
          if (cap) cap.style.opacity = String(isIntroCard ? 0 : clamp01(1 - abs * 1.6))
        }

        if (introP >= 1 && !introDoneRef.current) {
          introDoneRef.current = true
          callbacks.current.onIntroComplete?.()
        } else if (introP < 1) {
          introDoneRef.current = false
        }

        const active = ((Math.round(pos) % n) + n) % n
        if (active !== activeRef.current) {
          activeRef.current = active
          callbacks.current.onIndexChange?.(active)
        }
      }

      // ---- Scroll: pinned, scrubbed sequence ---------------------------------
      if (mode === "scroll") {
        const introFrac = intro ? Math.min(0.4, Math.max(0.12, 1.2 / Math.max(scrollLength, 1))) : 0
        const hold = 0.04
        const span = 1 - introFrac - hold
        const fromProgress = (p: number) => {
          const introP = intro ? clamp01(p / introFrac) : 1
          const pos = n > 1 ? clamp01((p - introFrac) / span) * (n - 1) : 0
          posRef.current = pos
          render(pos, introP)
        }
        const points = [0, ...images.map((_, k) => introFrac + (n > 1 ? (k / (n - 1)) * span : 0)), 1]
        const state = { p: 0 }
        fromProgress(0)
        gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: () => fromProgress(state.p),
          scrollTrigger: {
            trigger: root,
            scroller: scroller ?? undefined,
            start: "top top",
            end: () => `+=${root.offsetHeight * Math.max(scrollLength, 1)}`,
            pin: true,
            pinSpacing: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            snap: snap ? { snapTo: points, duration: { min: 0.25, max: 0.7 }, ease: "power4.inOut", delay: 0.08 } : undefined,
          },
        })
        const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 100)
        return () => window.clearTimeout(refresh)
      }

      // ---- Drag / auto -------------------------------------------------------
      const view = { intro: intro && !introDoneRef.current ? 0 : 1 }
      const draw = () => render(posRef.current, view.intro)
      draw()

      const cleanups: (() => void)[] = []

      if (view.intro < 1) {
        const io = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return
            io.disconnect()
            gsap.to(view, { intro: 1, duration: introShape === "circle" ? 2.2 : 1.6, ease: "none", delay: 0.2, onUpdate: draw })
          },
          { threshold: 0.35 }
        )
        io.observe(root)
        cleanups.push(() => io.disconnect())
      }

      if (mode === "auto") {
        let target = speed
        let current = speed
        const tick = (_time: number, dt: number) => {
          if (view.intro < 1) return
          const sec = Math.min(dt, 64) / 1000
          current += (target - current) * Math.min(1, sec * 4)
          posRef.current += current * sec
          if (posRef.current > n * 1000) posRef.current -= n * 1000
          draw()
        }
        const pause = () => (target = 0)
        const resume = () => (target = speed)
        gsap.ticker.add(tick)
        root.addEventListener("pointerenter", pause)
        root.addEventListener("pointerleave", resume)
        root.addEventListener("focusin", pause)
        root.addEventListener("focusout", resume)
        cleanups.push(() => {
          gsap.ticker.remove(tick)
          root.removeEventListener("pointerenter", pause)
          root.removeEventListener("pointerleave", resume)
          root.removeEventListener("focusin", pause)
          root.removeEventListener("focusout", resume)
        })
      } else {
        const proxy = { pos: posRef.current }
        let tween: gsap.core.Tween | null = null
        let dragging = false
        let startX = 0
        let startPos = 0
        let samples: { t: number; pos: number }[] = []

        const glideTo = (to: number, duration: number) => {
          tween?.kill()
          proxy.pos = posRef.current
          tween = gsap.to(proxy, {
            pos: to,
            duration,
            ease: "power4.out",
            onUpdate: () => {
              posRef.current = proxy.pos
              draw()
            },
          })
        }
        const down = (e: PointerEvent) => {
          if (view.intro < 1 || (e.pointerType === "mouse" && e.button !== 0)) return
          tween?.kill()
          dragging = true
          startX = e.clientX
          startPos = posRef.current
          samples = [{ t: performance.now(), pos: startPos }]
          root.setPointerCapture(e.pointerId)
        }
        const move = (e: PointerEvent) => {
          if (!dragging) return
          posRef.current = startPos - (e.clientX - startX) / step
          const now = performance.now()
          samples.push({ t: now, pos: posRef.current })
          samples = samples.filter((s) => now - s.t < 100)
          draw()
        }
        const up = (e: PointerEvent) => {
          if (!dragging) return
          dragging = false
          if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId)
          const first = samples[0]
          const last = samples[samples.length - 1]
          const dt = last && first ? (last.t - first.t) / 1000 : 0
          const velocity = dt > 0.01 ? (last.pos - first.pos) / dt : 0
          let to = posRef.current + velocity * 0.35
          if (snap) to = Math.round(to)
          glideTo(to, Math.min(1.4, Math.max(0.6, Math.abs(velocity) * 0.25)))
        }
        const key = (e: KeyboardEvent) => {
          if (view.intro < 1) return
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
          e.preventDefault()
          const base = tween?.isActive() ? Math.round(Number(tween.vars.pos)) : Math.round(posRef.current)
          glideTo(base + (e.key === "ArrowRight" ? 1 : -1), 0.8)
        }
        root.addEventListener("pointerdown", down)
        root.addEventListener("pointermove", move)
        root.addEventListener("pointerup", up)
        root.addEventListener("pointercancel", up)
        root.addEventListener("keydown", key)
        cleanups.push(() => {
          tween?.kill()
          root.removeEventListener("pointerdown", down)
          root.removeEventListener("pointermove", move)
          root.removeEventListener("pointerup", up)
          root.removeEventListener("pointercancel", up)
          root.removeEventListener("keydown", key)
        })
      }

      return () => cleanups.forEach((fn) => fn())
    },
    {
      scope: rootRef,
      dependencies: [
        ready, reduced, mode, size.w, size.h, cw, ch, images, intro, introShape, radius, curve, gap,
        perspective, tilt, visible, dim, cardRadius, scrollLength, snap, speed, scroller,
      ],
      revertOnUpdate: true,
    }
  )

  // A pin adds spacing that moves everything below it. Re-sort and refresh all
  // triggers after this section (re)builds, so later pinned sections recompute
  // their start instead of pinning too early and overlapping this one.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
    })
    return () => cancelAnimationFrame(id)
  }, [ready, reduced, mode, size.w, size.h, scrollLength, images.length, intro, scroller])

  if (reduced) {
    // Static, swipeable row: no pin, no 3D, no motion
    return (
      <section
        ref={rootRef}
        className={cn("@container relative w-full overflow-hidden", className)}
        style={{ background }}
        aria-roledescription="carousel"
      >
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[8cqw] py-10 [scrollbar-width:none]">
          {images.map((image, i) => (
            <div
              key={i}
              className="relative w-[min(64cqw,300px)] shrink-0 snap-center overflow-hidden"
              style={{ aspectRatio: cardAspect, borderRadius: cardRadius }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
            >
              <CardMedia image={image} index={i} />
              {showCaptions && <Caption image={image} index={i} total={n} />}
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section
      ref={rootRef}
      className={cn(
        "@container relative w-full overflow-hidden select-none",
        mode === "drag" && "cursor-grab touch-pan-y outline-none active:cursor-grabbing",
        className
      )}
      style={{ height, background }}
      aria-roledescription="carousel"
      tabIndex={mode === "drag" ? 0 : undefined}
    >
      {ready &&
        images.map((image, i) => (
          <div
            key={i}
            data-cc-card
            className="absolute left-1/2 top-1/2 overflow-hidden shadow-[0_30px_60px_-24px_rgb(0_0_0/0.7)] will-change-transform"
            style={{ width: cw, height: ch, marginLeft: -cw / 2, marginTop: -ch / 2, visibility: "hidden" }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}`}
          >
            <div data-cc-media className="absolute inset-0 will-change-transform">
              <CardMedia image={image} index={i} />
            </div>
            <div data-cc-shade className="pointer-events-none absolute inset-0 bg-black opacity-0" />
            {showCaptions && (
              <div data-cc-caption className="opacity-0">
                <Caption image={image} index={i} total={n} />
              </div>
            )}
          </div>
        ))}
    </section>
  )
}
