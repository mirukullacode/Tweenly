"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Compass } from "lucide-react"
import { driver, type DriveStep } from "driver.js"
import "driver.js/dist/driver.css"
import { components } from "@/lib/docs"
import { track } from "@/lib/analytics"
import { TOUR_HOME } from "@/lib/tour"
import { cn } from "@/lib/utils"

const DONE_KEY = "tweenly:tour"
const START_EVENT = "tweenly:start-tour"

const isPlayground = (path: string) => path.startsWith("/docs/components/")

function visible(selector: string) {
  const el = document.querySelector<HTMLElement>(selector)
  return !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden"
}

function buildSteps(): DriveStep[] {
  const all: (DriveStep & { selector?: string })[] = [
    {
      popover: {
        title: "Welcome to tweenly",
        description: `${components.length} animated components for shadcn/ui. Here's how to get the most out of every page, in about 30 seconds.`,
      },
    },
    {
      selector: '[data-tour="sidebar"]',
      popover: {
        title: "Browse by category",
        description: "Text, buttons, charts, scroll effects, whole page sections. New components are marked as they ship.",
        side: "right",
        align: "start",
      },
    },
    {
      selector: '[data-tour="stage"]',
      popover: {
        title: "A real, live preview",
        description: "This isn't a video. Hover, click, drag and scroll the component right here.",
        side: "bottom",
        align: "center",
      },
    },
    {
      selector: '[data-tour="controls"]',
      popover: {
        title: "Tweak every prop",
        description: "Variants, colors, timing, even real chart data. The preview updates the moment you change something.",
        side: "left",
        align: "start",
      },
    },
    {
      selector: '[data-tour="dock"]',
      popover: {
        title: "Replay and go fullscreen",
        description: "Watch an entrance again, hide the controls, or give the preview the whole screen.",
        side: "top",
        align: "center",
      },
    },
    {
      selector: '[data-tour="code"]',
      popover: {
        title: "Copy exactly what you tuned",
        description: "Usage rewrites itself as you change the controls. Source is the full component, and API lists every prop.",
        side: "left",
        align: "start",
      },
    },
    {
      selector: '[data-tour="install"]',
      popover: {
        title: "Install in one command",
        description: "Pick your package manager and copy. The shadcn CLI drops the source into your project, so you own every line.",
        side: "left",
        align: "start",
      },
    },
    {
      selector: '[data-tour="v0"]',
      popover: {
        title: "Or start in v0",
        description: "Open the component in v0 and keep building on it with AI.",
        side: "bottom",
        align: "end",
      },
    },
    {
      selector: '[data-tour="github"]',
      popover: {
        title: "That's it",
        description: "If tweenly saves you time, a star on GitHub helps other developers find it. You can replay this tour from the sidebar anytime.",
        side: "right",
        align: "start",
      },
    },
  ]

  return all
    .filter((s) => !s.selector || visible(s.selector))
    .map(({ selector, ...step }) => (selector ? { ...step, element: selector } : step))
}

function runTour() {
  const steps = buildSteps()
  let finished = false

  const tour = driver({
    steps,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Start building",
    popoverClass: "tweenly-tour",
    overlayColor: "#000",
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 18,
    onNextClick: () => {
      if (!tour.hasNextStep()) finished = true
      tour.moveNext()
    },
    onDestroyed: () => {
      localStorage.setItem(DONE_KEY, finished ? "done" : "skipped")
      track("tour", finished ? { action: "complete" } : { action: "skip", step: (tour.getActiveIndex() ?? 0) + 1 })
    },
  })

  localStorage.setItem(DONE_KEY, "started")
  track("tour", { action: "start" })
  tour.drive()
}

/** Replays the tour: in place on playground pages, otherwise on a featured component. */
export function startTour() {
  window.dispatchEvent(new Event(START_EVENT))
}

/**
 * Mount once in the docs shell. Starts automatically for first-time visitors on
 * a component page, when the URL has ?tour=1, or when startTour() is called.
 */
export function GuidedTour() {
  const pathname = usePathname()

  useEffect(() => {
    if (!isPlayground(pathname)) return
    const forced = new URLSearchParams(window.location.search).get("tour") === "1"
    const firstVisit = !localStorage.getItem(DONE_KEY)
    if (!forced && !firstVisit) return
    if (forced) window.history.replaceState(null, "", pathname)
    // Let the page and its entrance animations settle before highlighting
    const t = setTimeout(runTour, forced ? 600 : 1400)
    return () => clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    const onStart = () => runTour()
    window.addEventListener(START_EVENT, onStart)
    return () => window.removeEventListener(START_EVENT, onStart)
  }, [])

  return null
}

export function TourButton({ label = "Take the tour", className }: { label?: string; className?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => (isPlayground(pathname) ? startTour() : router.push(TOUR_HOME))}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
    >
      <Compass className="size-3.5" /> {label}
    </button>
  )
}
