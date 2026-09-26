"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface HorizontalScrollItem {
  src: string
  alt: string
  caption?: string
}

export interface HorizontalScrollProps {
  items: HorizontalScrollItem[]
  /** Width of each image (any CSS length). Default: "min(70cqw, 520px)" */
  itemWidth?: string
  /** Image aspect ratio. Default: "4 / 5" */
  aspectRatio?: string
  /** Gap between images in px. Default: 24 */
  gap?: number
  /** Scroll distance multiplier. Higher = slower horizontal travel. Default: 1 */
  speed?: number
  /** Smoothing applied to the scroll link, in seconds. Default: 1 */
  scrub?: number
  /** Subtle zoom on each image as it crosses the viewport. Default: true */
  parallax?: boolean
  /** Scroll container to track instead of the window (selector or element). */
  scroller?: string | HTMLElement
  /** Height of the pinned section (any CSS length). Default: "100vh" */
  height?: string
  className?: string
  itemClassName?: string
}

export function HorizontalScroll({
  items,
  itemWidth = "min(70cqw, 520px)",
  aspectRatio = "4 / 5",
  gap = 24,
  speed = 1,
  scrub = 1,
  parallax = true,
  scroller,
  height = "100vh",
  className,
  itemClassName,
}: HorizontalScrollProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track || reduced) return

      const distance = () => Math.max(track.scrollWidth - section.clientWidth, 0)

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          scroller,
          start: "top top",
          end: () => `+=${distance() * speed}`,
          pin: true,
          scrub: scrub || true,
          invalidateOnRefresh: true,
        },
      })

      if (parallax) {
        gsap.utils.toArray<HTMLElement>("[data-media]", track).forEach((img) => {
          gsap.fromTo(
            img,
            { scale: 1.25 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: img.parentElement,
                scroller,
                containerAnimation: tween,
                start: "left right",
                end: "center center",
                scrub: true,
              },
            }
          )
        })
      }
    },
    { scope: sectionRef, dependencies: [items, gap, speed, scrub, parallax, scroller, reduced], revertOnUpdate: true }
  )

  return (
    <section
      ref={sectionRef}
      className={cn("relative flex w-full items-center overflow-hidden [container-type:inline-size]", reduced && "overflow-x-auto", className)}
      style={{ height }}
    >
      <div ref={trackRef} className="flex w-max px-[8cqw] will-change-transform" style={{ gap }}>
        {items.map((item, i) => (
          <figure key={i} className="shrink-0" style={{ width: itemWidth }}>
            <div className={cn("overflow-hidden rounded-2xl bg-muted", itemClassName)} style={{ aspectRatio }}>
              <img data-media src={item.src} alt={item.alt} className="size-full object-cover" draggable={false} />
            </div>
            {item.caption && (
              <figcaption className="mt-3 flex items-baseline gap-3 text-sm text-muted-foreground">
                <span className="font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  )
}
