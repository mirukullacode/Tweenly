"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { LOGO_PATH, LOGO_VIEWBOX } from "@/lib/logo"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

const EASE_OUT = [0.22, 1, 0.36, 1] as const

function isInternalNavigation(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null
  const a = (e.target as HTMLElement | null)?.closest?.("a")
  if (!a || a.target === "_blank" || a.hasAttribute("download")) return null
  const url = new URL(a.href, window.location.href)
  if (url.origin !== window.location.origin) return null
  // Hash-only and same-page links don't change the route
  if (url.pathname === window.location.pathname) return null
  return url.pathname
}

/**
 * Route-change indicator for the App Router. Navigations that finish within
 * ~140ms (prefetched pages) show nothing; slower ones get a capsule with the
 * tweenly mark tracing itself and a thin progress bar. Mount once in the root layout.
 */
export function RouteLoader() {
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const [from, setFrom] = useState<string | null>(null)
  const [slow, setSlow] = useState(false)

  // Navigating = a link was clicked and the route hasn't changed yet.
  // Derived, so a finished navigation needs no state update.
  const navigating = from !== null && from === pathname

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isInternalNavigation(e)) return
      setSlow(false)
      setFrom(window.location.pathname)
    }
    const onPop = () => {
      setSlow(false)
      setFrom(null)
    }
    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPop)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPop)
    }
  }, [])

  useEffect(() => {
    if (!navigating) return
    const show = setTimeout(() => setSlow(true), 140)
    // Never get stuck if a navigation is cancelled
    const giveUp = setTimeout(() => setFrom(null), 8000)
    return () => {
      clearTimeout(show)
      clearTimeout(giveUp)
    }
  }, [navigating])

  const visible = navigating && slow

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="route-loader"
          className="pointer-events-none fixed inset-x-0 top-0 z-[80]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.1 } }}
          role="status"
          aria-label="Loading page"
        >
          <motion.div
            className="h-0.5 origin-left bg-brand"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.85, transition: { duration: 2.4, ease: EASE_OUT } }}
            exit={{ scaleX: 1, transition: { duration: 0.2 } }}
          />
          <motion.div
            className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border bg-panel/85 py-1.5 pl-1.5 pr-3 shadow-lg shadow-black/10 backdrop-blur-xl"
            initial={{ y: -16, scale: 0.9, filter: "blur(6px)" }}
            animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ y: -10, scale: 0.96, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 480, damping: 34 }}
          >
            <span className="grid size-6 place-items-center rounded-[7px] bg-foreground">
              <svg viewBox={LOGO_VIEWBOX} className="size-[72%] overflow-visible" aria-hidden="true">
                <path d={LOGO_PATH} className="fill-background/25" />
                <motion.path
                  d={LOGO_PATH}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth={5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={{ pathLength: 0.15, pathOffset: 0 }}
                  animate={reduced ? { pathLength: 1 } : { pathOffset: [0, 1] }}
                  transition={reduced ? { duration: 0 } : { duration: 0.9, ease: "linear", repeat: Infinity }}
                />
              </svg>
            </span>
            <span className="text-[12px] font-medium text-muted-foreground">Loading</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
