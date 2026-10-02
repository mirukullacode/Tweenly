/**
 * Feature flags for parts of the site that are built but not launched yet.
 * Flip them with environment variables, no code changes needed.
 */
export const features = {
  /** Sponsor page, sponsor links and Dodo Payments checkout. Off until launch. */
  sponsors: process.env.NEXT_PUBLIC_ENABLE_SPONSORS === "true",
}
