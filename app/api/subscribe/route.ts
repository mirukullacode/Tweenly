const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Newsletter signups. Set NEWSLETTER_WEBHOOK_URL to any endpoint that accepts
 * `POST { email, source }` as JSON (Loops, Resend, Zapier, Make, Formspree, your
 * own API). Without it, signups are logged in development and rejected in
 * production so they're never silently lost.
 */
export async function POST(request: Request) {
  let body: { email?: unknown; source?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const source = typeof body.source === "string" ? body.source.slice(0, 40) : "site"
  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 })
  }

  const webhook = process.env.NEWSLETTER_WEBHOOK_URL
  if (!webhook) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[newsletter] ${email} (from ${source}); set NEWSLETTER_WEBHOOK_URL to store signups`)
      return Response.json({ ok: true })
    }
    return Response.json({ error: "Signups aren't open yet. Try again soon." }, { status: 503 })
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NEWSLETTER_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.NEWSLETTER_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({ email, source }),
  }).catch(() => null)

  if (!res?.ok) {
    return Response.json({ error: "Couldn't subscribe right now. Please try again." }, { status: 502 })
  }
  return Response.json({ ok: true })
}
