"use client"

import { motion, useAnimationControls } from "motion/react"
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { LOGO_PATH, LOGO_VIEWBOX } from "@/lib/logo"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

const EASE = [0.76, 0, 0.24, 1] as const

/**
 * The tweenly mark on its tile. With `playOnNavigate`, the ribbon redraws itself
 * whenever the route changes: the outline traces in, then the fill wipes up.
 */
export function LogoMark({
  className,
  tile = true,
  playOnNavigate = false,
}: {
  className?: string
  /** Draw the dark rounded tile behind the mark. */
  tile?: boolean
  /** Replay the draw-in animation on every route change. */
  playOnNavigate?: boolean
}) {
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const outline = useAnimationControls()
  const fill = useAnimationControls()
  const tileCtl = useAnimationControls()
  const first = useRef(true)

  useEffect(() => {
    if (!playOnNavigate || reduced) return
    // Skip the very first render; the mark should simply be there on load
    if (first.current) {
      first.current = false
      return
    }
    let cancelled = false
    const run = async () => {
      tileCtl.start({ rotate: [0, -8, 0], scale: [1, 0.9, 1], transition: { duration: 0.7, ease: EASE } })
      fill.set({ clipPath: "inset(100% 0 0 0)" })
      outline.set({ pathLength: 0, opacity: 1 })
      await outline.start({ pathLength: 1, transition: { duration: 0.45, ease: EASE } })
      if (cancelled) return
      await fill.start({ clipPath: "inset(0% 0 0 0)", transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } })
      if (cancelled) return
      outline.start({ opacity: 0, transition: { duration: 0.2 } })
    }
    run()
    return () => {
      cancelled = true
    }
  }, [pathname, playOnNavigate, reduced, outline, fill, tileCtl])

  return (
    <motion.span
      animate={tileCtl}
      className={cn(
        "relative grid size-6 shrink-0 place-items-center",
        tile && "rounded-[7px] bg-foreground text-background",
        !tile && "text-foreground",
        className
      )}
    >
      <svg viewBox={LOGO_VIEWBOX} className={tile ? "size-[72%]" : "size-full"} aria-hidden="true">
        <motion.path d={LOGO_PATH} fill="currentColor" animate={fill} initial={false} />
        <motion.path
          d={LOGO_PATH}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={4}
          strokeLinejoin="round"
          initial={{ pathLength: 1, opacity: 0 }}
          animate={outline}
        />
      </svg>
    </motion.span>
  )
}
