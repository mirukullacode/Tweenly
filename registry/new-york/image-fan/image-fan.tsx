"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface ImageFanItem {
  src: string
  alt: string
}

export type ImageFanDirection = "right" | "left" | "center"

export interface ImageFanProps {
  images: ImageFanItem[]
  /** Which way the stack spreads after the first image rises. Default: "right" */
  direction?: ImageFanDirection
  /** Speed multiplier. 2 = twice as fast. Default: 1 */
  speed?: number
  /** Blur in px while cards are moving in. Default: 10 */
  blur?: number
  /** How far the first card rises from, in card heights. Default: 1.2 */
  rise?: number
  /** Gap between card centers, as a fraction of card width (auto-shrinks to fit). Default: 0.72 */
  overlap?: number
  /** Tilt added per card away from the first, in degrees. Default: 3 */
  rotate?: number
  /** How much the row curves downward toward the ends, in px. Default: 6 */
  arc?: number
  /** Delay between cards sliding out, in seconds. Default: 0.06 */
  stagger?: number
  /** Card width (any CSS length). Default: "min(20cqw, 220px)" */
  cardWidth?: string
  /** Card aspect ratio. Default: "3 / 4" */
  aspectRatio?: string
  /** Corner radius in px. Default: 14 */
  radius?: number
  /** Lift cards on hover. Default: true */
  hoverLift?: boolean
  /** Play only the first time it enters view. Default: true */
  once?: boolean
  /** Scroll container to watch instead of the window (selector or element). */
  scroller?: string | HTMLElement
  /** Section height (any CSS length). Default: "28rem" */
  height?: string
  className?: string
}

// Tinted placeholder shown behind each image (and instead of it if the file is missing)
const tint = (i: number) =>
  `linear-gradient(135deg, hsl(${(i * 47) % 360} 45% 62% / 0.45), hsl(${(i * 47 + 40) % 360} 40% 38% / 0.3))`
const hideBroken = (e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.style.visibility = "hidden")

/** Final slot for card `i`, as an offset from the center (in "card steps"). */
function slotOf(i: number, n: number, direction: ImageFanDirection) {
  const mid = (n - 1) / 2
  if (direction === "right") return i - mid
  if (direction === "left") return mid - i
  // center: first card in the middle, then alternate right, left, right…
  return i === 0 ? 0 : Math.ceil(i / 2) * (i % 2 ? 1 : -1)
}

export function ImageFan({
  images,
  direction = "right",
  speed = 1,
  blur = 10,
  rise = 1.2,
  overlap = 0.72,
  rotate = 3,
  arc = 6,
  stagger = 0.06,
  cardWidth = "min(20cqw, 220px)",
  aspectRatio = "3 / 4",
  radius = 14,
  hoverLift = true,
  once = true,
  scroller,
  height = "28rem",
  className,
}: ImageFanProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const n = images.length

  // Hide images that failed before hydration attached onError
  useEffect(() => {
    rootRef.current?.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) img.style.visibility = "hidden"
    })
  }, [images])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !n) return
      const cards = gsap.utils.toArray<HTMLElement>("[data-fan-card]", root)
      const s = Math.max(speed, 0.05)

      // Spacing shrinks automatically so the whole fan fits the container
      const step = () => {
        const w = cards[0].offsetWidth
        const maxSlot = Math.max(...cards.map((_, i) => Math.abs(slotOf(i, n, direction))), 1)
        const room = (root.clientWidth - w - 32) / 2 / maxSlot
        return Math.max(Math.min(w * overlap, room), w * 0.12)
      }
      const slot = (i: number) => slotOf(i, n, direction)
      const startX = () => slot(0) * step()
      const final = (i: number) => ({
        x: () => slot(i) * step(),
        y: () => slot(i) ** 2 * arc,
        rotation: (slot(i) - slot(0)) * rotate,
      })

      if (reduced) {
        cards.forEach((c, i) => gsap.set(c, { xPercent: -50, yPercent: -50, ...final(i), autoAlpha: 1 }))
        return
      }

      // Everything starts stacked where the first card lands; only the first is visible
      cards.forEach((c, i) =>
        gsap.set(c, { xPercent: -50, yPercent: -50, x: startX, y: 0, rotation: 0, autoAlpha: i === 0 ? 1 : 0 })
      )

      const tl = gsap.timeline({ paused: true })

      // 1. First card rises from below
      tl.fromTo(
        cards[0],
        { y: () => cards[0].offsetHeight * rise, autoAlpha: 0, filter: blur ? `blur(${blur}px)` : "none" },
        { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.9 / s, ease: "power3.out" }
      )

      // 2. The rest slide out from under it into the fan
      tl.set(cards.slice(1), { autoAlpha: 1 })
      tl.to(cards[0], { ...final(0), duration: 1.1 / s, ease: "power3.inOut" }, ">-0.05")
      cards.slice(1).forEach((c, k) => {
        tl.fromTo(
          c,
          { filter: blur ? `blur(${blur / 2}px)` : "none" },
          { ...final(k + 1), filter: "blur(0px)", duration: 1.1 / s, ease: "power3.inOut" },
          `<${k === 0 ? 0 : stagger / s}`
        )
      })

      ScrollTrigger.create({
        trigger: root,
        scroller,
        start: "top 75%",
        onEnter: () => tl.play(),
        onLeaveBack: () => !once && tl.reverse(),
        invalidateOnRefresh: true,
        onRefresh: () => tl.invalidate(),
      })
    },
    {
      scope: rootRef,
      dependencies: [images, direction, speed, blur, rise, overlap, rotate, arc, stagger, once, scroller, reduced],
      revertOnUpdate: true,
    }
  )

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full overflow-hidden [container-type:inline-size]", className)}
      style={{ height }}
    >
      {images.map((img, i) => (
        <div
          key={i}
          data-fan-card
          className="invisible absolute left-1/2 top-1/2"
          // The first card sits on top; the rest tuck underneath in order
          style={{ width: cardWidth, zIndex: n - Math.abs(slotOf(i, n, direction) - slotOf(0, n, direction)) }}
        >
          <div
            className={cn(
              "overflow-hidden shadow-[0_18px_40px_-12px_rgb(0_0_0/0.45)]",
              hoverLift && "transition-transform duration-300 ease-out hover:-translate-y-3 hover:scale-[1.04]"
            )}
            style={{ aspectRatio, borderRadius: radius, background: tint(i) }}
          >
            <img src={img.src} alt={img.alt} onError={hideBroken} draggable={false} className="size-full object-cover" />
          </div>
        </div>
      ))}
    </div>
  )
}
