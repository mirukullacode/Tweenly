import { Webhook } from "standardwebhooks"

type DodoEvent = {
  type: string
  data?: {
    payment_id?: string
    subscription_id?: string
    total_amount?: number
    recurring_pre_tax_amount?: number
    currency?: string
    customer?: { name?: string; email?: string }
    metadata?: Record<string, string>
  }
}

// Events worth telling you about; everything else is acknowledged and ignored
const NOTIFY: Record<string, string> = {
  "payment.succeeded": "New sponsorship",
  "subscription.active": "New monthly sponsor",
  "subscription.renewed": "Monthly sponsorship renewed",
  "subscription.cancelled": "Monthly sponsorship cancelled",
  "subscription.failed": "Monthly sponsorship payment failed",
  "subscription.on_hold": "Monthly sponsorship on hold",
}

const money = (cents?: number, currency = "USD") =>
  typeof cents === "number" ? `${(cents / 100).toFixed(2)} ${currency}` : "an unknown amount"

/**
 * Dodo Payments webhooks (Standard Webhooks spec). Set DODO_PAYMENTS_WEBHOOK_KEY
 * to the endpoint's signing secret. Optionally set SPONSOR_NOTIFY_WEBHOOK_URL to a
 * Discord or Slack incoming webhook to get a message for every sponsorship.
 */
export async function POST(request: Request) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY
  if (!secret) return new Response("Webhook not configured", { status: 503 })

  const rawBody = await request.text()
  try {
    await new Webhook(secret).verify(rawBody, {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    })
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  const event = JSON.parse(rawBody) as DodoEvent
  const label = NOTIFY[event.type]
  // Only react to tweenly sponsorships, in case the Dodo account sells other things
  if (!label || event.data?.metadata?.source !== "tweenly-sponsor") {
    return new Response(null, { status: 200 })
  }

  const d = event.data
  const who = d.customer?.name || d.customer?.email || "Someone"
  const amount = money(d.total_amount ?? d.recurring_pre_tax_amount, d.currency)
  const message = `${label}: ${who} (${d.customer?.email ?? "no email"}), ${amount}, tier "${d.metadata?.tier ?? "unknown"}"`
  console.log(`[sponsor] ${message}`)

  const notify = process.env.SPONSOR_NOTIFY_WEBHOOK_URL
  if (notify) {
    // "content" is read by Discord, "text" by Slack; each ignores the other
    await fetch(notify, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, text: message }),
    }).catch((err) => console.error("[sponsor] notification failed:", err))
  }

  return new Response(null, { status: 200 })
}
