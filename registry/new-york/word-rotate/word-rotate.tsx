"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { TargetAndTransition } from "motion/react"
import { cn } from "@/lib/utils"

export type WordRotateEffect = "slide" | "fade" | "blur" | "flip"

export interface WordRotateProps {
  /** Words to cycle through. */
  words: string[]
  /** Time each word stays visible, in ms. Default: 2200 */
  interval?: number
  /** Transition style between words. Default: "slide" */
  effect?: WordRotateEffect
  /** Transition duration, in seconds. Default: 0.4 */
  duration?: number
  className?: string
}

const EFFECTS: Record<
  WordRotateEffect,
  { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }
> = {
  slide: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: "0%", opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  blur: {
    initial: { opacity: 0, filter: "blur(8px)", scale: 0.96 },
    animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    exit: { opacity: 0, filter: "blur(8px)", scale: 1.04 },
  },
  flip: {
    initial: { rotateX: 90, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: -90, opacity: 0 },
  },
}

export function WordRotate({
  words,
  interval = 2200,
  effect = "slide",
  duration = 0.4,
  className,
}: WordRotateProps) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval)
    return () => clearInterval(id)
  }, [words.length, interval])

  const variant = reduced ? EFFECTS.fade : EFFECTS[effect]

  return (
    <span
      className={cn("relative inline-flex overflow-hidden align-bottom", className)}
      style={{ perspective: effect === "flip" ? 600 : undefined }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={index}
          className="inline-block whitespace-nowrap"
          initial={variant.initial}
          animate={variant.animate}
          exit={variant.exit}
          transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
