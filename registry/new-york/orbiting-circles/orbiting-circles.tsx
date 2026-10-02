"use client"

import { Children } from "react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export interface OrbitingCirclesProps {
  /** Items to orbit, spaced evenly around the circle. */
  children: React.ReactNode
  /** Orbit radius in px. Default: 160 */
  radius?: number
  /** Seconds for one full orbit at speed 1. Default: 20 */
  duration?: number
  /** Orbit counter-clockwise. Default: false */
  reverse?: boolean
  /** Seconds to wait before the orbit starts moving. Default: 0 */
  delay?: number
  /** Draw a faint ring along the orbit. Default: true */
  path?: boolean
  /** Size of each item's box in px. Default: 40 */
  iconSize?: number
  /** Speed multiplier. Higher = faster. Default: 1 */
  speed?: number
  /** Angle of the first item in degrees, 0 = 3 o'clock, -90 = 12 o'clock. Default: -90 */
  startAngle?: number
  /** Pause the orbit while an item is hovered. Default: false */
  pauseOnHover?: boolean
  /** Classes for the item boxes. */
  itemClassName?: string
  className?: string
}

/**
 * Rotates a container with a CSS animation and counter-rotates every item so they stay upright.
 * Place inside a `relative` parent; the orbit is centered on it.
 */
export function OrbitingCircles({
  children,
  radius = 160,
  duration = 20,
  reverse = false,
  delay = 0,
  path = true,
  iconSize = 40,
  speed = 1,
  startAngle = -90,
  pauseOnHover = false,
  itemClassName,
  className,
}: OrbitingCirclesProps) {
  const reduced = useReducedMotion()
  const items = Children.toArray(children)
  const seconds = duration / Math.max(0.05, speed)
  const timing = `${seconds}s linear ${delay}s infinite ${reverse ? "reverse" : "normal"}`
  const pause = pauseOnHover && "group-hover/orbit:[animation-play-state:paused]"

  return (
    <div className={cn("group/orbit pointer-events-none absolute left-1/2 top-1/2 size-0", className)}>
      {path && (
        <div
          aria-hidden="true"
          className="absolute rounded-full border border-foreground/10"
          style={{ width: radius * 2, height: radius * 2, left: -radius, top: -radius }}
        />
      )}

      <div className={cn("absolute inset-0", pause)} style={{ animation: reduced ? undefined : `tw-orbit ${timing}` }}>
        {items.map((child, i) => {
          const angle = startAngle + (360 / items.length) * i
          return (
            <div
              key={i}
              className="absolute left-0 top-0 size-0"
              style={{ transform: `rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)` }}
            >
              <div
                className={cn("pointer-events-auto flex items-center justify-center", pause, itemClassName)}
                style={{
                  width: iconSize,
                  height: iconSize,
                  marginLeft: -iconSize / 2,
                  marginTop: -iconSize / 2,
                  animation: reduced ? undefined : `tw-orbit-counter ${timing}`,
                }}
              >
                {child}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes tw-orbit { to { transform: rotate(360deg) } }
        @keyframes tw-orbit-counter { to { transform: rotate(-360deg) } }
      `}</style>
    </div>
  )
}

export interface OrbitCenterProps {
  /** The center element, e.g. a logo. */
  children?: React.ReactNode
  /** Diameter in px. Default: 72 */
  size?: number
  className?: string
}

/** A centered disc for the middle of an orbit. Place inside the same `relative` parent. */
export function OrbitCenter({ children, size = 72, className }: OrbitCenterProps) {
  return (
    <div
      className={cn(
        "absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_8px_30px_-10px_rgba(0,0,0,0.45)]",
        className
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  )
}
