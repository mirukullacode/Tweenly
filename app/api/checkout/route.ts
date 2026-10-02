import { siteConfig } from "@/lib/docs"
import { features } from "@/lib/features"
import { getDodo } from "@/lib/payments"
import { monthlyTiers, oneTime } from "@/lib/sponsor"

type Body = { tier?: unknown; amount?: unknown }

/**
 * Creates a Dodo Payments checkout session for a sponsorship and returns its URL.
 * Tier and amount are validated here; the browser only says what it wants.
 */
export async function POST(request: Request) {
  if (!features.sponsors) return Response.json({ error: "Not found." }, { status: 404 })
  let body: Body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  const dodo = getDodo()
  if (!dodo) {
    return Response.json({ error: "Sponsorships aren't open yet. Check back soon." }, { status: 503 })
  }

  let productId: string | undefined
  let amount: number | undefined
  let tierId: string

  if (body.tier === "one-time") {
    const dollars = Number(body.amount)
    if (!Number.isInteger(dollars) || dollars < oneTime.min || dollars > oneTime.max) {
      return Response.json(
        { error: `Choose a whole-dollar amount between $${oneTime.min} and $${oneTime.max}.` },
        { status: 400 }
      )
    }
    productId = process.env[oneTime.productEnv]
    amount = dollars * 100 // Pay What You Want takes the smallest currency unit
    tierId = "one-time"
  } else {
    const tier = monthlyTiers.find((t) => t.id === body.tier)
    if (!tier) return Response.json({ error: "Unknown sponsorship tier." }, { status: 400 })
    productId = process.env[tier.productEnv]
    tierId = tier.id
  }

  if (!productId) {
    return Response.json({ error: "This tier isn't available yet." }, { status: 503 })
  }

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1, ...(amount ? { amount } : {}) }],
      return_url: `${siteConfig.url}/sponsor/thanks`,
      metadata: { source: "tweenly-sponsor", tier: tierId },
    })
    if (!session.checkout_url) throw new Error("No checkout URL returned")
    return Response.json({ url: session.checkout_url })
  } catch (err) {
    console.error("[checkout] Dodo Payments error:", err instanceof Error ? err.message : err)
    return Response.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 })
  }
}
