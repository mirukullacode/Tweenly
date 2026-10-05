const RATINGS = ["love", "ok", "needs-work", "helpful", "not-helpful"] as const
type Rating = (typeof RATINGS)[number]

const LABELS: Record<Rating, string> = {
  love: "Love it",
  ok: "It's OK",
  "needs-work": "Needs work",
  helpful: "Helpful",
  "not-helpful": "Not helpful",
}

/**
 * In-site feedback. Set FEEDBACK_WEBHOOK_URL to a Discord or Slack incoming
 * webhook to receive each message. Without it, feedback is logged in
 * development and refused in production so nothing is silently lost.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  // Honeypot: real people never fill the hidden "website" field
  if (typeof body.website === "string" && body.website.length > 0) return Response.json({ ok: true })

  const rating = RATINGS.includes(body.rating as Rating) ? (body.rating as Rating) : null
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : ""
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : "unknown"
  const email = typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email.trim()) ? body.email.trim() : ""
  if (!rating && !message) return Response.json({ error: "Add a rating or a message." }, { status: 400 })

  const text = [
    `Feedback on ${page}`,
    rating ? `Rating: ${LABELS[rating]}` : null,
    message ? `Message: ${message}` : null,
    email ? `Reply to: ${email}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const webhook = process.env.FEEDBACK_WEBHOOK_URL
  if (!webhook) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[feedback]\n${text}`)
      return Response.json({ ok: true })
    }
    return Response.json({ error: "Feedback isn't set up yet." }, { status: 503 })
  }

  // "content" is read by Discord, "text" by Slack; each ignores the other
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text, text }),
  }).catch(() => null)

  if (!res?.ok) return Response.json({ error: "Couldn't send feedback. Please try again." }, { status: 502 })
  return Response.json({ ok: true })
}
