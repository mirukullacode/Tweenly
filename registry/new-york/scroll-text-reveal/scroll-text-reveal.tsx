"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface ScrollTextRevealProps {
  /** The text to reveal. */
  text: string
  /** Reveal word by word or character by character. Default: "word" */
  split?: "word" | "char"
  /** Opacity of text that hasn't been revealed yet, 0 to 1. Default: 0.15 */
  dim?: number
  /** Starting blur in px for unrevealed text. Default: 0 */
  blur?: number
  /** Starting vertical offset in px for unrevealed text. Default: 0 */
  lift?: number
  /** How many section-heights of scrolling the reveal lasts. Default: 2 */
  scrollLength?: number
  /** Smoothing applied to the scroll link, in seconds (0 = instant). Default: 0.8 */
  scrub?: number
  /** Hold the section in place until the reveal completes. Default: true */
  pin?: boolean
  /** Text alignment. Default: "left" */
  align?: "left" | "center"
  /** Scroll container to track instead of the window (selector or element). */
  scroller?: string | HTMLElement
  /** Height of the pinned section (any CSS length). Default: "100vh" */
  height?: string
  className?: string
  /** Classes for the text element (font size, weight, color). */
  textClassName?: string
}

export function ScrollTextReveal({
  text,
  split = "word",
  dim = 0.15,
  blur = 0,
  lift = 0,
  scrollLength = 2,
  scrub = 0.8,
  pin = true,
  align = "left",
  scroller,
  height = "100vh",
  className,
  textClassName,
}: ScrollTextRevealProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section || reduced) return

      const pieces = gsap.utils.toArray<HTMLElement>("[data-piece]", section)
      gsap.set(pieces, { opacity: dim, filter: blur ? `blur(${blur}px)` : "none", y: lift })

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            scroller,
            start: pin ? "top top" : "top 80%",
            end: () => `+=${section.offsetHeight * scrollLength}`,
            pin,
            scrub: scrub || true,
            invalidateOnRefresh: true,
          },
        })
        .to(pieces, {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          ease: "none",
          stagger: 0.1,
          duration: 0.4,
        })
    },
    { scope: sectionRef, dependencies: [text, split, dim, blur, lift, scrollLength, scrub, pin, scroller, reduced], revertOnUpdate: true }
  )

  const words = text.split(" ")

  return (
    <section
      ref={sectionRef}
      className={cn("flex w-full items-center px-6 sm:px-12", align === "center" && "justify-center", className)}
      style={{ height }}
    >
      <p
        aria-label={text}
        className={cn(
          "max-w-4xl text-3xl font-medium leading-tight tracking-tight sm:text-5xl",
          align === "center" && "text-center",
          textClassName
        )}
      >
        {words.map((word, wi) => (
          <span key={wi} aria-hidden="true">
            {split === "word" ? (
              <span data-piece className="inline-block">
                {word}
              </span>
            ) : (
              <span className="inline-block whitespace-nowrap">
                {Array.from(word).map((c, ci) => (
                  <span key={ci} data-piece className="inline-block">
                    {c}
                  </span>
                ))}
              </span>
            )}
            {wi < words.length - 1 && " "}
          </span>
        ))}
      </p>
    </section>
  )
}
