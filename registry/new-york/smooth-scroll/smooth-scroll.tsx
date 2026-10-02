"use client"

import { createContext, useContext, useEffect, useState } from "react"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

gsap.registerPlugin(ScrollTrigger)

const LenisContext = createContext<Lenis | null>(null)

/** The active Lenis instance, or null when smooth scrolling is off (e.g. reduced motion). */
export function useLenis() {
  return useContext(LenisContext)
}

export interface SmoothScrollProps {
  /** Content that can read the Lenis instance with useLenis(). */
  children?: React.ReactNode
  /** Scroll container to smooth. Omit to smooth the whole page. Default: window */
  wrapper?: HTMLElement | null
  /** Linear interpolation per frame; lower is smoother and slower. Default: 0.09 */
  lerp?: number
  /** Multiplier for mouse wheel distance. Default: 0.9 */
  wheelMultiplier?: number
  /** Smooth touch scrolling too. Usually best left off on phones. Default: false */
  syncTouch?: boolean
  /** Smooth-scroll to in-page #anchors. Default: true */
  anchors?: boolean
  /** Turn smoothing on or off without unmounting. Default: true */
  enabled?: boolean
}

/**
 * Lenis smooth scrolling driven by the GSAP ticker, so every ScrollTrigger stays
 * perfectly in sync. Works on the window or inside any scroll container.
 */
export function SmoothScroll({
  children,
  wrapper,
  lerp = 0.09,
  wheelMultiplier = 0.9,
  syncTouch = false,
  anchors = true,
  enabled = true,
}: SmoothScrollProps) {
  const reduced = useReducedMotion()
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    // A wrapper prop that is still null means the container hasn't mounted yet
    if (!enabled || reduced || wrapper === null) return

    const instance = new Lenis({
      lerp,
      wheelMultiplier,
      syncTouch,
      anchors,
      ...(wrapper ? { wrapper, content: wrapper, eventsTarget: wrapper } : {}),
    })
    instance.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    // Hand the instance to consumers after mount without setting state synchronously
    queueMicrotask(() => setLenis(instance))
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      instance.destroy()
      setLenis((current) => (current === instance ? null : current))
    }
  }, [enabled, reduced, wrapper, lerp, wheelMultiplier, syncTouch, anchors])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
