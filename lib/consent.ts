/**
 * Analytics consent, stored in one first-party cookie so both the browser and
 * the server can read it. tweenly sets no other cookies.
 */
export const CONSENT_COOKIE = "tweenly_consent"
export const CONSENT_EVENT = "tweenly:consent"

export type Consent = "granted" | "denied"

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`))
  return (match?.[1] as Consent | undefined) ?? null
}

export function writeConsent(value: Consent) {
  // One year, whole site, not sent to third parties
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax${
    location.protocol === "https:" ? "; Secure" : ""
  }`
  window.dispatchEvent(new Event(CONSENT_EVENT))
}
