"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface ExpandGalleryItem {
  src: string
  alt: string
}

export interface ExpandGalleryProps {
  images: ExpandGalleryItem[]
  /** Thumbnail width, as % of the section width. Default: 9 */
  smallWidth?: number
  /** Thumbnail aspect ratio. Default: "3 / 4" */
  smallAspect?: string
  /** Expanded width, as % of the section width. Default: 20 */
  largeWidth?: number
  /** Expanded height, as % of the section height. Default: 72 */
  largeHeight?: number
  /** Gap between images in px. Default: 12 */
  gap?: number
  /** Row alignment. Default: "start" */
  align?: "start" | "center"
  /** Section heights of scrolling per image. Default: 0.6 */
  scrollPerImage?: number
  /** Scroll smoothing in seconds. Default: 0.8 */
  scrub?: number
  /** Show an "03 / 06" counter. Default: true */
  counter?: boolean
  /** Scroll container to track instead of the window (selector or element). */
  scroller?: string | HTMLElement
  /** Height of the pinned section (any CSS length). Default: "100vh" */
  height?: string
  className?: string
}

const tint = (i: number) =>
  `linear-gradient(135deg, hsl(${(i * 47) % 360} 45% 62% / 0.45), hsl(${(i * 47 + 40) % 360} 40% 38% / 0.3))`
const hideBroken = (e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.style.visibility = "hidden")

function ratio(aspect: string) {
  const [w, h] = aspect.split("/").map((v) => parseFloat(v))
  return w && h ? w / h : 0.75
}

export function ExpandGallery({
  images,
  smallWidth = 9,
  smallAspect = "3 / 4",
  largeWidth = 20,
  largeHeight = 72,
  gap = 12,
  align = "start",
  scrollPerImage = 0.6,
  scrub = 0.8,
  counter = true,
  scroller,
  height = "100vh",
  className,
}: ExpandGalleryProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const n = images.length

  useEffect(() => {
    sectionRef.current?.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) img.style.visibility = "hidden"
    })
  }, [images])

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section || !n) return
      const items = gsap.utils.toArray<HTMLElement>("[data-expand-item]", section)

      const small = { width: () => (section.clientWidth * smallWidth) / 100, height: () => (section.clientWidth * smallWidth) / 100 / ratio(smallAspect) }
      const large = { width: () => (section.clientWidth * largeWidth) / 100, height: () => (section.clientHeight * largeHeight) / 100 }

      items.forEach((el, i) => gsap.set(el, i === 0 ? large : small))
      if (reduced || n < 2) return

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut", duration: 1 },
        scrollTrigger: {
          trigger: section,
          scroller,
          start: "top top",
          end: () => `+=${section.offsetHeight * scrollPerImage * (n - 1)}`,
          pin: true,
          scrub: scrub || true,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActive(Math.round(self.progress * (n - 1))),
        },
      })

      // Each step: the current image shrinks back while the next one grows
      for (let i = 0; i < n - 1; i++) {
        tl.to(items[i], small, i).to(items[i + 1], large, i)
      }
    },
    {
      scope: sectionRef,
      dependencies: [images, smallWidth, smallAspect, largeWidth, largeHeight, scrollPerImage, scrub, scroller, reduced],
      revertOnUpdate: true,
    }
  )

  return (
    <section
      ref={sectionRef}
      className={cn("relative flex w-full items-end overflow-hidden px-[6%] pb-[8%]", className)}
      style={{ height }}
    >
      {counter && n > 0 && (
        <p className="absolute left-[6%] top-[10%] font-mono text-[11px] tabular-nums tracking-wider opacity-70">
          {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </p>
      )}
      <div
        className={cn("flex w-full items-end", align === "center" ? "justify-center" : "justify-start")}
        style={{ gap }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            data-expand-item
            className="shrink-0 overflow-hidden"
            style={{ background: tint(i), width: `${smallWidth}%`, aspectRatio: smallAspect }}
          >
            <img src={img.src} alt={img.alt} onError={hideBroken} draggable={false} className="size-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  )
}
