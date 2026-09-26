"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface TypewriterProps {
  /** Words or phrases to type, in order. */
  words: string[]
  /** Milliseconds per typed character. Default: 70 */
  typeSpeed?: number
  /** Milliseconds per deleted character. Default: 40 */
  deleteSpeed?: number
  /** Pause after a word is fully typed, in ms. Default: 1400 */
  pause?: number
  /** Cycle through the words forever. Default: true */
  loop?: boolean
  /** Show a blinking cursor. Default: true */
  cursor?: boolean
  /** Character used for the cursor. Default: "|" */
  cursorChar?: string
  className?: string
  cursorClassName?: string
}

export function Typewriter({
  words,
  typeSpeed = 70,
  deleteSpeed = 40,
  pause = 1400,
  loop = true,
  cursor = true,
  cursorChar = "|",
  className,
  cursorClassName,
}: TypewriterProps) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [text, setText] = useState("")
  const [deleting, setDeleting] = useState(false)

  const word = words[index % words.length] ?? ""
  const isLast = index === words.length - 1

  useEffect(() => {
    if (reduced) return

    // Finished typing the current word
    if (!deleting && text === word) {
      if (isLast && !loop) return
      const t = setTimeout(() => setDeleting(true), pause)
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1))
        return
      }
      const next = text.slice(0, -1)
      setText(next)
      // Finished deleting: move to the next word
      if (next === "") {
        setDeleting(false)
        setIndex((i) => (i + 1) % words.length)
      }
    }, deleting ? deleteSpeed : typeSpeed)
    return () => clearTimeout(t)
  }, [text, deleting, word, isLast, loop, pause, typeSpeed, deleteSpeed, words.length, reduced])

  return (
    <span className={cn("inline-flex items-baseline", className)} aria-label={words.join(", ")}>
      <span aria-hidden="true" className="whitespace-pre">
        {reduced ? words[0] : text}
      </span>
      {cursor && (
        <span
          aria-hidden="true"
          className={cn("ml-0.5 animate-[mc-blink_1s_steps(1)_infinite]", cursorClassName)}
        >
          {cursorChar}
        </span>
      )}
      <style>{`@keyframes mc-blink{50%{opacity:0}}`}</style>
    </span>
  )
}
