import DodoPayments from "dodopayments"

/**
 * Server-only Dodo Payments client. Defaults to test mode so nothing charges a
 * real card until DODO_PAYMENTS_ENVIRONMENT=live_mode is set deliberately.
 */
export function getDodo(): DodoPayments | null {
  const key = process.env.DODO_PAYMENTS_API_KEY
  if (!key) return null
  return new DodoPayments({
    bearerToken: key,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  })
}

export const isLiveMode = () => process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
