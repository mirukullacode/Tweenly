/**
 * Sponsorship tiers, shared by the sponsor page (display) and the checkout route
 * (validation). Dodo product IDs never reach the browser: each tier names the
 * environment variable that holds its product ID.
 */

export type SponsorTier = {
  id: string
  name: string
  /** Monthly price in USD. */
  price: number
  description: string
  perks: string[]
  /** Server env var holding the Dodo subscription product ID. */
  productEnv: string
  featured?: boolean
}

export const monthlyTiers: SponsorTier[] = [
  {
    id: "supporter",
    name: "Supporter",
    price: 5,
    description: "For developers who use tweenly and want it to keep growing.",
    perks: ["Your name on the sponsors wall", "Sponsor badge in the changelog thanks"],
    productEnv: "DODO_PRODUCT_SPONSOR_SUPPORTER",
  },
  {
    id: "backer",
    name: "Backer",
    price: 15,
    description: "Help decide what gets built next.",
    perks: ["Everything in Supporter", "Vote on the component roadmap", "Priority on component requests"],
    productEnv: "DODO_PRODUCT_SPONSOR_BACKER",
    featured: true,
  },
  {
    id: "company",
    name: "Company",
    price: 99,
    description: "For teams shipping tweenly in production.",
    perks: ["Everything in Backer", "Your logo on the landing page and README", "A thank-you post on launch channels"],
    productEnv: "DODO_PRODUCT_SPONSOR_COMPANY",
  },
]

/** One-time sponsorship uses a single Pay What You Want product in USD. */
export const oneTime = {
  productEnv: "DODO_PRODUCT_SPONSOR_ONE_TIME",
  presets: [5, 15, 50],
  min: 5,
  max: 1000,
}

export type Sponsor = {
  name: string
  url?: string
  /** Path to a logo in /public, for Company sponsors. */
  logo?: string
  tier: SponsorTier["id"] | "one-time"
}

/**
 * Add sponsors here after they pay (the webhook notification tells you who).
 * Kept manual on purpose: people choose how, and whether, they appear.
 */
export const sponsors: Sponsor[] = []
