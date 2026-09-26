"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface ScrollFocusItem {
  src: string
  alt: string
  /** Label shown in the synced list. */
  title: string
}

export interface ScrollFocusProps {
  items: ScrollFocusItem[]
  /** Side the synced title list sits on. Default: "right" */
  side?: "left" | "right"
  /** Width of images away from focus, as % of the section width. Default: 26 */
  smallWidth?: number
  /** Width of the focused image, as % of the section width. Default: 40 */
  largeWidth?: number
  /** Image aspect ratio. Default: "2 / 1" */
  aspectRatio?: string
  /** Vertical gap between images in px. Default: 14 */
  gap?: number
  /** Section heights of scrolling per image. Default: 0.5 */
  scrollPerItem?: number
  /** Scroll smoothing in seconds. Default: 0.8 */
  scrub?: number
  /** Show "(1)" index labels beside the images. Default: true */
  showIndex?: boolean
  /** Scroll container to track instead of the window (selector or element). */
  scroller?: string | HTMLElement
  /** Height of the pinned section (any CSS length). Default: "100vh" */
  height?: string
  className?: string
  /** Classes for the title list. */
  titleClassName?: string
}

const tint = (i: number) =>
  `linear-gradient(135deg, hsl(${(i * 47) % 360} 45% 62% / 0.45), hsl(${(i * 47 + 40) % 360} 40% 38% / 0.3))`
const hideBroken = (e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.style.visibility = "hidden")

function ratio(aspect: string) {
  const [w, h] = aspect.split("/").map((v) => parseFloat(v))
  return w && h ? w / h : 2
}

const smooth = (t: number) => t * t * (3 - 2 * t)

export function ScrollFocus({
  items,
  side = "right",
  smallWidth = 26,
  largeWidth = 40,
  aspectRatio = "2 / 1",
  gap = 14,
  scrollPerItem = 0.5,
  scrub = 0.8,
  showIndex = true,
  scroller,
  height = "100vh",
  className,
  titleClassName,
}: ScrollFocusProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const n = items.length

  useEffect(() => {
    sectionRef.current?.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) img.style.visibility = "hidden"
    })
  }, [items])

  useGSAP(
    () => {
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track || !n) return
      const els = gsap.utils.toArray<HTMLElement>("[data-focus-item]", track)
      const a = ratio(aspectRatio)
      const state = { p: 0 }

      // Size every image by its distance from the focus point, stack them,
      // then shift the track so the focus point sits in the vertical center.
      const layout = () => {
        const W = section.clientWidth
        const H = section.clientHeight
        const sw = (W * smallWidth) / 100
        const lw = (W * largeWidth) / 100
        const sizes = els.map((_, i) => {
          const t = smooth(Math.max(0, 1 - Math.abs(state.p - i)))
          const w = sw + (lw - sw) * t
          return { w, h: w / a }
        })
        let y = 0
        const tops = sizes.map((s) => {
          const top = y
          y += s.h + gap
          return top
        })
        const center = (i: number) => tops[i] + sizes[i].h / 2
        const lo = Math.floor(state.p)
        const hi = Math.min(lo + 1, n - 1)
        const focus = center(lo) + (center(hi) - center(lo)) * (state.p - lo)

        els.forEach((el, i) => {
          el.style.width = `${sizes[i].w}px`
          el.style.height = `${sizes[i].h}px`
          el.style.transform = `translate(-50%, ${tops[i]}px)`
        })
        track.style.transform = `translateY(${H / 2 - focus}px)`
      }

      layout()
      const ro = new ResizeObserver(layout)
      ro.observe(section)

      if (!reduced && n > 1) {
        gsap.to(state, {
          p: n - 1,
          ease: "none",
          onUpdate: () => {
            layout()
            setActive(Math.round(state.p))
          },
          scrollTrigger: {
            trigger: section,
            scroller,
            start: "top top",
            end: () => `+=${section.offsetHeight * scrollPerItem * (n - 1)}`,
            pin: true,
            scrub: scrub || true,
            invalidateOnRefresh: true,
          },
        })
      }

      return () => ro.disconnect()
    },
    {
      scope: sectionRef,
      dependencies: [items, smallWidth, largeWidth, aspectRatio, gap, scrollPerItem, scrub, scroller, reduced],
      revertOnUpdate: true,
    }
  )

  return (
    <section ref={sectionRef} className={cn("relative w-full overflow-hidden [container-type:inline-size]", className)} style={{ height }}>
      {/* image column */}
      <div ref={trackRef} className="absolute inset-x-0 top-0 will-change-transform">
        {items.map((item, i) => (
          <div key={i} data-focus-item className="absolute left-1/2 top-0" style={{ width: `${smallWidth}%` }}>
            <div className="size-full overflow-hidden" style={{ background: tint(i) }}>
              <img src={item.src} alt={item.alt} onError={hideBroken} draggable={false} className="size-full object-cover" />
            </div>
            {showIndex && (
              <span
                className={cn(
                  "absolute bottom-0 font-mono text-[10px] tabular-nums opacity-70",
                  i % 2 ? "left-full ml-3" : "right-full mr-3"
                )}
              >
                ({i + 1})
              </span>
            )}
          </div>
        ))}
      </div>

      {/* synced titles */}
      <ul
        className={cn(
          "absolute top-1/2 flex -translate-y-1/2 flex-col gap-0.5 font-mono uppercase",
          side === "right" ? "right-[5%] items-end text-right" : "left-[5%] items-start text-left",
          titleClassName
        )}
      >
        {items.map((item, i) => (
          <li
            key={i}
            aria-current={i === active ? "true" : undefined}
            className={cn(
              "leading-tight transition-all duration-300 ease-out",
              i === active
                ? "my-1 text-[clamp(1rem,2.6cqw,1.75rem)] font-bold tracking-tight"
                : "text-[11px] tracking-wide opacity-40"
            )}
          >
            {item.title}
          </li>
        ))}
      </ul>
    </section>
  )
}
