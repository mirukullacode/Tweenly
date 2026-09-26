"use client"

import { Fragment } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { Variants } from "motion/react"

export type TextRevealSplit = "word" | "char"
export type TextRevealDirection = "up" | "down" | "none"

export interface TextRevealProps {
  /** The text to animate. */
  text: string
  /** Animate each word or each character. Default: "word" */
  split?: TextRevealSplit
  /** Direction each piece travels from. Default: "up" */
  direction?: TextRevealDirection
  /** Delay between pieces, in seconds. Default: 0.06 */
  stagger?: number
  /** Duration of each piece, in seconds. Default: 0.5 */
  duration?: number
  /** Delay before the first piece starts, in seconds. Default: 0 */
  delay?: number
  /** Starting blur in px. Default: 8 */
  blur?: number
  /** Travel distance in px. Default: 16 */
  distance?: number
  /** Animate only the first time it enters view. Default: true */
  once?: boolean
  /** Element to render as. Default: "p" */
  as?: "p" | "h1" | "h2" | "h3" | "span"
  className?: string
}

export function TextReveal({
  text,
  split = "word",
  direction = "up",
  stagger = 0.06,
  duration = 0.5,
  delay = 0,
  blur = 8,
  distance = 16,
  once = true,
  as = "p",
  className,
}: TextRevealProps) {
  const reduced = useReducedMotion()
  const Tag = motion[as]

  const offset = reduced || direction === "none" ? 0 : direction === "up" ? distance : -distance

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : stagger, delayChildren: delay } },
  }

  const piece: Variants = {
    hidden: { opacity: 0, y: offset, filter: `blur(${reduced ? 0 : blur}px)` },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduced ? 0.2 : duration, ease: [0.16, 1, 0.3, 1] },
    },
  }

  const words = text.split(" ")

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.3 }}
      variants={container}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span aria-hidden="true" className="inline-block whitespace-nowrap">
            {split === "word" ? (
              <motion.span className="inline-block" variants={piece}>
                {word}
              </motion.span>
            ) : (
              Array.from(word).map((char, ci) => (
                <motion.span key={ci} className="inline-block" variants={piece}>
                  {char}
                </motion.span>
              ))
            )}
          </span>
          {wi < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  )
}
