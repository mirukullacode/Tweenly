import { track as vercelTrack } from "@vercel/analytics"

/**
 * Every custom event the site sends. Page views (and so "which components get
 * viewed most") are collected automatically by <Analytics />.
 */
export type AnalyticsEvent =
  | { name: "copy_install"; props: { slug: string; pm: string } }
  | { name: "install_tab"; props: { method: string } }
  | { name: "copy_install_terminal"; props: { method: string } }
  | { name: "copy_code"; props: { slug: string; tab: string } }
  | { name: "copy_hero_install"; props?: undefined }
  | { name: "open_v0"; props: { slug: string } }
  | { name: "github_click"; props: { from: string } }
  | { name: "star_prompt"; props: { action: "shown" | "starred" | "dismissed" } }
  | { name: "newsletter_subscribe"; props: { from: string } }
  | { name: "tour"; props: { action: "start" | "complete" | "skip"; step?: number } }
  | { name: "sponsor_checkout"; props: { tier: string; amount: number } }
  | { name: "sponsor_click"; props: { from: string } }

export function track<E extends AnalyticsEvent>(name: E["name"], props?: E["props"]) {
  try {
    vercelTrack(name, props)
  } catch {
    // Analytics must never break the UI
  }
}
