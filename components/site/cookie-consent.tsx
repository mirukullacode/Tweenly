"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { Analytics } from "@vercel/analytics/next"
import { CONSENT_EVENT, readConsent, writeConsent, type Consent } from "@/lib/consent"

/** Subscribes to the consent cookie; null until the visitor chooses. */
function useConsent() {
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined)
  useEffect(() => {
    const sync = () => setConsent(readConsent())
    // Read after mount so the server and first client render agree
    queueMicrotask(sync)
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])
  return consent
}

/**
 * Vercel Analytics is cookieless and anonymous, so it runs by default; choosing
 * "Decline" stops every page view and event from being sent.
 */
export function ConsentAnalytics() {
  const consent = useConsent()
  return <Analytics beforeSend={(event) => (readConsent() === "denied" || consent === "denied" ? null : event)} />
}

export function CookieConsent() {
  const consent = useConsent()
  const [hidden, setHidden] = useState(false)
  const open = consent === null && !hidden

  const choose = (value: Consent) => {
    writeConsent(value)
    setHidden(true)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Cookie preferences"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 z-[65] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border bg-panel p-4 shadow-xl shadow-black/15"
        >
          <p className="text-[13.5px] font-semibold tracking-tight">Your privacy</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            We use cookieless, anonymous analytics to see which components people use, and we keep preferences like your
            theme in your browser. No ads, no tracking across sites.{" "}
            <Link href="/cookies" className="font-medium text-foreground underline underline-offset-2">
              Cookie policy
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => choose("granted")}
              className="h-8 flex-1 rounded-full bg-foreground text-[12.5px] font-medium text-background transition-opacity hover:opacity-90"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => choose("denied")}
              className="h-8 flex-1 rounded-full border text-[12.5px] font-medium transition-colors hover:bg-accent"
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** "Change cookie preferences" control for the cookie policy page. */
export function ConsentControls() {
  const consent = useConsent()
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-inset p-4">
      <p className="flex-1 text-[13.5px]">
        Analytics is currently{" "}
        <span className="font-semibold">{consent === "denied" ? "off" : consent === "granted" ? "on" : "on (no choice made yet)"}</span>.
      </p>
      <button
        type="button"
        onClick={() => writeConsent("granted")}
        className="h-8 rounded-full bg-foreground px-4 text-[12.5px] font-medium text-background transition-opacity hover:opacity-90"
      >
        Allow analytics
      </button>
      <button
        type="button"
        onClick={() => writeConsent("denied")}
        className="h-8 rounded-full border px-4 text-[12.5px] font-medium transition-colors hover:bg-accent"
      >
        Turn off analytics
      </button>
    </div>
  )
}
