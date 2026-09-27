"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Star, X } from "lucide-react"
import { githubUrl } from "@/lib/docs"
import { track } from "@/lib/analytics"
import { GithubIcon } from "./github-stars"

export const INSTALL_EVENT = "tweenly:installed"
const SEEN_KEY = "tweenly:star-prompt"

/** Tell the star prompt that someone just copied an install command. */
export function announceInstall() {
  window.dispatchEvent(new Event(INSTALL_EVENT))
}

/**
 * Asks for a star right after the first install copy, the moment someone has
 * decided the library is useful. Shown once per browser.
 */
export function StarPrompt() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onInstall = () => {
      if (localStorage.getItem(SEEN_KEY)) return
      localStorage.setItem(SEEN_KEY, "shown")
      timer = setTimeout(() => {
        setOpen(true)
        track("star_prompt", { action: "shown" })
      }, 900)
    }
    window.addEventListener(INSTALL_EVENT, onInstall)
    return () => {
      window.removeEventListener(INSTALL_EVENT, onInstall)
      clearTimeout(timer)
    }
  }, [])

  const close = (action: "starred" | "dismissed") => {
    localStorage.setItem(SEEN_KEY, action)
    track("star_prompt", { action })
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="fixed bottom-4 right-4 z-[60] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-panel/95 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => close("dismissed")}
            className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
          <div className="flex gap-3">
            <motion.span
              initial={{ rotate: -30, scale: 0.4 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.15 }}
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand"
            >
              <Star className="size-4 fill-current" />
            </motion.span>
            <div className="min-w-0 pr-5">
              <p className="text-[13.5px] font-semibold tracking-tight">Enjoying tweenly?</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                A star on GitHub helps other developers find it, and keeps new components coming.
              </p>
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => close("starred")}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90"
              >
                <GithubIcon className="size-3.5" /> Star on GitHub
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
