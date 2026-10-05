"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export interface StickyCardItem {
  id: string
  tag: string
  title: string
  /** Image path, e.g. "/sticky-cards/01.jpg" from your public folder. */
  image?: string
  /** Card background. Defaults to the built-in palette, in order. */
  color?: string
  /** Card text color. Defaults to the palette's ink color. */
  textColor?: string
}

/** purple · orange · red · sky · navy */
export const STICKY_CARD_PALETTE = [
  { color: "#3E2EA8", textColor: "#FFFFFF" },
  { color: "#E2671E", textColor: "#FFFFFF" },
  { color: "#C4302B", textColor: "#FFFFFF" },
  { color: "#86BACB", textColor: "#10252B" },
  { color: "#172B4D", textColor: "#FFFFFF" },
]

export interface StickyCardsProps {
  cards: StickyCardItem[]
  className?: string
  /** Vertical offset (% of card height) between stacked cards. Default: 4 */
  cardYOffset?: number
  /** Scale reduction per card behind the front one. Default: 0.05 */
  cardScaleStep?: number
  /** Time (in the scroll timeline) between each card's exit starting. Default: 1.2 */
  stepInterval?: number
  /** Duration of each card's exit animation. Default: 1 */
  stepDuration?: number
  /** How many section-heights of scroll to reserve per card. Default: 1.8 */
  scrollLengthPerCard?: number
  /** Animate the last card away too. When false it stays on screen as the pin releases. Default: false */
  exitLast?: boolean
  /** Section background. Follows the theme by default. Default: "var(--background)" */
  background?: string
  /** Scroll container to track instead of the window (selector or element). */
  scroller?: string | HTMLElement
  /** Height of the pinned section (any CSS length). Default: "100vh" */
  height?: string
}

// Condensed display face for titles. Load "Barlow Condensed" (or set --font-display) for the intended look.
const DISPLAY_FONT = `var(--font-display, "Barlow Condensed", "Oswald", "Arial Narrow", sans-serif)`

function cardColors(card: StickyCardItem, index: number) {
  const palette = STICKY_CARD_PALETTE[index % STICKY_CARD_PALETTE.length]
  return {
    backgroundColor: card.color ?? palette.color,
    color: card.textColor ?? (card.color ? "#FFFFFF" : palette.textColor),
  }
}

/** Image that falls back to a soft tinted panel when the file is missing. */
function CardImage({ src, alt }: { src?: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null)
  const [failed, setFailed] = useState<string | null>(null)

  // Catch images that failed before hydration attached onError
  useEffect(() => {
    const img = ref.current
    if (!img?.complete || img.naturalWidth !== 0) return
    const id = requestAnimationFrame(() => setFailed(src ?? null))
    return () => cancelAnimationFrame(id)
  }, [src])

  return (
    <div className="relative size-full overflow-hidden rounded-[0.7rem] bg-current/10">
      {src && failed !== src ? (
        <img
          ref={ref}
          src={src}
          alt={alt}
          onError={() => setFailed(src)}
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-current/5" />
      )}
    </div>
  )
}

function Card({ card, index, className }: { card: StickyCardItem; index: number; className?: string }) {
  return (
    <article
      className={cn(
        "grid overflow-hidden rounded-[1.1rem] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] @lg:grid-cols-[1fr_44%]",
        className
      )}
      style={cardColors(card, index)}
    >
      <div className="flex flex-col justify-between gap-8 p-[clamp(1.5rem,4.8cqw,2.75rem)]">
        <p className="font-mono text-[clamp(0.7rem,1.3cqw,0.875rem)] uppercase tracking-[0.04em] opacity-75">
          {card.tag}
        </p>
        <h3
          className="max-w-[16ch] text-[clamp(1.75rem,4.4cqw,3rem)] font-bold uppercase leading-[1.02] tracking-[-0.005em]"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          {card.title}
        </h3>
      </div>
      <div className="hidden p-[clamp(1.25rem,3.9cqw,2.25rem)] @lg:block @lg:pl-0">
        <CardImage src={card.image} alt={card.title} />
      </div>
    </article>
  )
}

export function StickyCards({
  cards,
  className = "",
  cardYOffset = 4,
  cardScaleStep = 0.05,
  stepInterval = 1.2,
  stepDuration = 1,
  scrollLengthPerCard = 1.8,
  exitLast = false,
  background = "var(--background)",
  scroller,
  height = "100vh",
}: StickyCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced) return // fallback markup (below) handles this case instead

      const sticky = stickyRef.current
      if (!sticky) return

      const cardEls = gsap.utils.toArray<HTMLElement>("[data-sticky-card]", sticky)
      const totalCards = cardEls.length
      if (!totalCards) return
      const steps = exitLast ? totalCards : totalCards - 1

      // Stack: every card is the same size; the ones behind are scaled down from
      // their bottom edge and nudged lower so a sliver of each peeks out.
      cardEls.forEach((card, index) => {
        gsap.set(card, {
          xPercent: -50,
          yPercent: -50 + index * cardYOffset,
          scale: 1 - index * cardScaleStep,
          rotationX: 0,
          opacity: 1,
          transformOrigin: "center bottom",
        })
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sticky,
          scroller,
          start: "top top",
          end: () => `+=${sticky.offsetHeight * scrollLengthPerCard * Math.max(steps, 1)}px`,
          pin: true,
          pinSpacing: true,
          scrub: 1.4,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })

      for (let step = 0; step < steps; step++) {
        const timePos = step * stepInterval

        // Front card lifts up and away
        tl.to(
          cardEls[step],
          { yPercent: -230, rotationX: 25, opacity: 0, duration: stepDuration, ease: "power2.inOut" },
          timePos
        )

        // Everything behind moves one slot forward
        for (let behind = step + 1; behind < totalCards; behind++) {
          const slot = behind - (step + 1)
          tl.to(
            cardEls[behind],
            {
              yPercent: -50 + slot * cardYOffset,
              scale: 1 - slot * cardScaleStep,
              duration: stepDuration,
              ease: "power2.inOut",
            },
            timePos
          )
        }
      }

      const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 100)
      return () => window.clearTimeout(refreshTimer)
    },
    {
      scope: containerRef,
      dependencies: [cards, reduced, exitLast, scroller, cardYOffset, cardScaleStep, stepInterval, stepDuration, scrollLengthPerCard],
      revertOnUpdate: true,
    }
  )

  if (reduced) {
    // Accessible fallback: a plain list, no pin, no motion.
    return (
      <div ref={containerRef} className={cn("@container space-y-6 p-6", className)} style={{ background }}>
        {cards.map((card, i) => (
          <Card key={card.id} card={card} index={i} className="mx-auto aspect-[16/9] max-w-5xl" />
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      <section
        ref={stickyRef}
        className="@container relative w-full overflow-hidden [perspective:1600px]"
        style={{ height, background }}
      >
        {cards.map((card, i) => (
          <div
            key={card.id}
            data-sticky-card
            className="absolute left-1/2 top-1/2 w-[min(88%,58rem)]"
            // First card sits on top of the stack
            style={{ zIndex: cards.length - i }}
          >
            <Card card={card} index={i} className="aspect-[4/5] @lg:aspect-[16/9]" />
          </div>
        ))}
      </section>
    </div>
  )
}
