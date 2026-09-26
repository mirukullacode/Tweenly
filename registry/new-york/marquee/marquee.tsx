"use client"

import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface MarqueeProps {
  children: React.ReactNode
  /** Seconds for one full loop. Lower = faster. Default: 30 */
  duration?: number
  /** Scroll the other way. Default: false */
  reverse?: boolean
  /** Scroll vertically instead of horizontally. Default: false */
  vertical?: boolean
  /** Pause while hovered. Default: true */
  pauseOnHover?: boolean
  /** Gap between items, in px. Default: 16 */
  gap?: number
  /** Fade the edges into the background. Default: true */
  fade?: boolean
  /** How many copies of the content to render. Increase for short content. Default: 4 */
  repeat?: number
  className?: string
}

export function Marquee({
  children,
  duration = 30,
  reverse = false,
  vertical = false,
  pauseOnHover = true,
  gap = 16,
  fade = true,
  repeat = 4,
  className,
}: MarqueeProps) {
  const reduced = useReducedMotion()
  const edge = vertical ? "to bottom" : "to right"

  return (
    <div
      className={cn(
        "group flex overflow-hidden",
        vertical ? "flex-col" : "flex-row",
        className
      )}
      style={
        {
          gap,
          "--mc-gap": `${gap}px`,
          maskImage: fade
            ? `linear-gradient(${edge}, transparent, #000 12%, #000 88%, transparent)`
            : undefined,
        } as React.CSSProperties
      }
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0}
          className={cn(
            "flex shrink-0 justify-around",
            vertical ? "flex-col" : "flex-row",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
          style={{
            gap,
            animation: reduced
              ? undefined
              : `${vertical ? "mc-marquee-y" : "mc-marquee-x"} ${duration}s linear infinite${reverse ? " reverse" : ""}`,
          }}
        >
          {children}
        </div>
      ))}
      <style>{`
        @keyframes mc-marquee-x { to { transform: translateX(calc(-100% - var(--mc-gap))) } }
        @keyframes mc-marquee-y { to { transform: translateY(calc(-100% - var(--mc-gap))) } }
      `}</style>
    </div>
  )
}
