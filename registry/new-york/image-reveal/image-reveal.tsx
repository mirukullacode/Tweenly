"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export type RevealFrom = "left" | "right" | "top" | "bottom" | "scale"

export interface ImageRevealItem {
  src: string
  alt: string
  /** Direction this image enters from. Defaults to alternating left / right. */
  from?: RevealFrom
  /** Columns this image spans in the grid. Default: 1 */
  span?: number
}

export interface ImageRevealProps {
  images: ImageRevealItem[]
  /** Grid columns. Default: 2 */
  columns?: number
  /** Gap between images in px. Default: 16 */
  gap?: number
  /** Travel distance in px. Default: 160 */
  distance?: number
  /** Starting rotation in degrees. Default: 4 */
  rotate?: number
  /** Starting blur in px. Default: 0 */
  blur?: number
  /** Tie progress to the scrollbar. When false, each image plays once on enter. Default: true */
  scrub?: boolean
  /** Duration when `scrub` is false, in seconds. Default: 0.9 */
  duration?: number
  /** Image aspect ratio. Default: "4 / 3" */
  aspectRatio?: string
  /** Scroll container to track instead of the window (selector or element). */
  scroller?: string | HTMLElement
  className?: string
  itemClassName?: string
}

function fromVars(from: RevealFrom, distance: number, rotate: number): gsap.TweenVars {
  switch (from) {
    case "left":
      return { x: -distance, rotation: -rotate }
    case "right":
      return { x: distance, rotation: rotate }
    case "top":
      return { y: -distance }
    case "bottom":
      return { y: distance }
    case "scale":
      return { scale: 0.7 }
  }
}

export function ImageReveal({
  images,
  columns = 2,
  gap = 16,
  distance = 160,
  rotate = 4,
  blur = 0,
  scrub = true,
  duration = 0.9,
  aspectRatio = "4 / 3",
  scroller,
  className,
  itemClassName,
}: ImageRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced) return
      gsap.utils.toArray<HTMLElement>("[data-reveal]", rootRef.current).forEach((el, i) => {
        const from = (el.dataset.reveal as RevealFrom) || (i % 2 ? "right" : "left")
        gsap.fromTo(
          el,
          { opacity: 0, filter: blur ? `blur(${blur}px)` : "none", ...fromVars(from, distance, rotate) },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            filter: "blur(0px)",
            ease: scrub ? "none" : "power3.out",
            duration: scrub ? undefined : duration,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: "top bottom",
              end: "center 60%",
              scrub: scrub ? 0.6 : false,
              toggleActions: "play none none reverse",
            },
          }
        )
      })
    },
    { scope: rootRef, dependencies: [images, distance, rotate, blur, scrub, duration, scroller, reduced], revertOnUpdate: true }
  )

  return (
    <div
      ref={rootRef}
      className={cn("grid w-full overflow-x-clip", className)}
      style={{ gap, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {images.map((img, i) => (
        <div
          key={i}
          data-reveal={img.from ?? ""}
          className={cn("overflow-hidden rounded-2xl bg-muted will-change-transform", itemClassName)}
          style={{ aspectRatio, gridColumn: img.span ? `span ${img.span}` : undefined }}
        >
          <img src={img.src} alt={img.alt} className="size-full object-cover" draggable={false} />
        </div>
      ))}
    </div>
  )
}
