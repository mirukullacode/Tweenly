"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface ImageArcItem {
  src: string
  alt: string
}

export interface ImageArcProps {
  images: ImageArcItem[]
  /** "auto" spins continuously; "scroll" turns the wheel as the page scrolls. Default: "auto" */
  mode?: "auto" | "scroll"
  /** Seconds per full revolution in auto mode. Lower = faster. Default: 80 */
  duration?: number
  /** Spin direction. Default: "clockwise" */
  direction?: "clockwise" | "counterclockwise"
  /** Degrees turned while the section scrolls past, in scroll mode. Default: 120 */
  scrollRotation?: number
  /** Wheel radius as a fraction of the container width. Default: 0.42 */
  radius?: number
  /** Card width as a fraction of the radius. Default: 0.26 */
  itemSize?: number
  /** Card aspect ratio. Default: "3 / 4" */
  aspectRatio?: string
  /** Space between cards along the circle, in px. Default: 28 */
  gap?: number
  /** Corner radius in px. Default: 12 */
  rounded?: number
  /** Pause while hovered (auto mode). Default: true */
  pauseOnHover?: boolean
  /** Fade the lower edge into the background. Default: true */
  fade?: boolean
  /** Scroll container to track in scroll mode (selector or element). */
  scroller?: string | HTMLElement
  className?: string
}

const tint = (i: number) =>
  `hsl(${(i * 47) % 360} 42% 52% / 0.4)`
const hideBroken = (e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.style.visibility = "hidden")

function ratio(aspect: string) {
  const [w, h] = aspect.split("/").map((v) => parseFloat(v))
  return w && h ? w / h : 0.75
}

export function ImageArc({
  images,
  mode = "auto",
  duration = 80,
  direction = "clockwise",
  scrollRotation = 120,
  radius = 0.42,
  itemSize = 0.26,
  aspectRatio = "3 / 4",
  gap = 28,
  rounded = 12,
  pauseOnHover = true,
  fade = true,
  scroller,
  className,
}: ImageArcProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    rootRef.current?.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) img.style.visibility = "hidden"
    })
  }, [images, width])

  // Geometry: the wheel's center sits below the cards so only the top half shows
  const R = width * radius
  const itemW = R * itemSize
  const itemH = itemW / ratio(aspectRatio)
  const centerY = R + itemH / 2 + 24
  const containerH = centerY + R * 0.3
  // Fill the whole circle so the spin loops seamlessly; repeat images if needed
  const slots = images.length ? Math.max(images.length, Math.floor((2 * Math.PI * R) / (itemW + gap))) : 0
  const sign = direction === "clockwise" ? 1 : -1

  useGSAP(
    () => {
      const wheel = wheelRef.current
      if (!wheel || reduced || !width) return
      if (mode === "auto") {
        gsap.to(wheel, { rotation: `+=${360 * sign}`, duration, ease: "none", repeat: -1 })
      } else {
        gsap.fromTo(
          wheel,
          { rotation: 0 },
          {
            rotation: scrollRotation * sign,
            ease: "none",
            scrollTrigger: { trigger: rootRef.current, scroller, start: "top bottom", end: "bottom top", scrub: 0.6 },
          }
        )
      }
    },
    { scope: rootRef, dependencies: [mode, duration, sign, scrollRotation, scroller, reduced, width > 0], revertOnUpdate: true }
  )

  const setPaused = (paused: boolean) => {
    if (!pauseOnHover || mode !== "auto" || !wheelRef.current) return
    gsap.getTweensOf(wheelRef.current).forEach((t) => gsap.to(t, { timeScale: paused ? 0 : 1, duration: 0.6 }))
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{
        height: width ? containerH : 400,
        // Alpha mask for edge fading, not a color gradient
        maskImage: fade ? "linear-gradient(to bottom, #000 62%, transparent)" : undefined,
      }}
    >
      {width > 0 && (
        <div ref={wheelRef} className="absolute left-1/2 size-0" style={{ top: centerY }}>
          {Array.from({ length: slots }, (_, i) => {
            const img = images[i % images.length]
            const angle = (360 / slots) * i
            return (
              <div
                key={i}
                className="absolute left-0 top-0 overflow-hidden shadow-[0_14px_30px_-12px_rgb(0_0_0/0.4)]"
                style={{
                  width: itemW,
                  height: itemH,
                  borderRadius: rounded,
                  background: tint(i % images.length),
                  // Place on the circle and rotate so each card faces outward
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${-R}px)`,
                }}
                onPointerEnter={() => setPaused(true)}
                onPointerLeave={() => setPaused(false)}
              >
                <img
                  src={img.src}
                  alt={i < images.length ? img.alt : ""}
                  onError={hideBroken}
                  draggable={false}
                  className="size-full object-cover"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
