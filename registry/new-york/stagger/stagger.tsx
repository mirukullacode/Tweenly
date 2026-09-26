"use client"

import { Children } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { Variants } from "motion/react"
import { cn } from "@/lib/utils"

export type StaggerDirection = "up" | "down" | "left" | "right" | "scale"

export interface StaggerProps {
  children: React.ReactNode
  /** Where each child enters from. Default: "up" */
  direction?: StaggerDirection
  /** Delay between children, in seconds. Default: 0.08 */
  stagger?: number
  /** Duration of each child, in seconds. Default: 0.5 */
  duration?: number
  /** Delay before the first child, in seconds. Default: 0 */
  delay?: number
  /** Travel distance in px. Default: 20 */
  distance?: number
  /** Animate only the first time it enters view. Default: true */
  once?: boolean
  className?: string
  /** Class applied to each child wrapper. */
  itemClassName?: string
}

function hiddenState(direction: StaggerDirection, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance }
    case "down":
      return { y: -distance }
    case "left":
      return { x: distance }
    case "right":
      return { x: -distance }
    case "scale":
      return { scale: 0.85 }
  }
}

export function Stagger({
  children,
  direction = "up",
  stagger = 0.08,
  duration = 0.5,
  delay = 0,
  distance = 20,
  once = true,
  className,
  itemClassName,
}: StaggerProps) {
  const reduced = useReducedMotion()

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : stagger, delayChildren: delay } },
  }

  const item: Variants = {
    hidden: { opacity: 0, ...(reduced ? {} : hiddenState(direction, distance)) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: reduced ? 0.2 : duration, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2 }}
      variants={container}
    >
      {Children.map(children, (child) => (
        <motion.div className={cn(itemClassName)} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
