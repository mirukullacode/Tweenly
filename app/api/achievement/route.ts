import {
  achievementShareUrl,
  CHARACTER_LABELS,
  formatScore,
  MAX_NAME_LENGTH,
  MAX_SCORE,
  parseCharacter,
  renderAchievementCard,
  sanitizeName,
  todayUtc,
} from "@/lib/achievement-card"
import { siteConfig } from "@/lib/docs"
import { currentRecord } from "@/lib/hall-of-fame"

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")

/**
 * Runner record submissions. Notifies the maintainer through
 * ACHIEVEMENT_WEBHOOK_URL (or FEEDBACK_WEBHOOK_URL), a Discord or Slack
 * incoming webhook, and emails the player their card through Resend when
 * RESEND_API_KEY is set. With neither configured, submissions are logged in
 * development and refused in production.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    const json: unknown = await request.json()
    if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("not an object")
    body = json as Record<string, unknown>
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  // Honeypot: real people never fill the hidden "website" field
  if (typeof body.website === "string" && body.website.length > 0) {
    return Response.json({ ok: true, emailed: false, shareUrl: siteConfig.url })
  }

  const rawName = typeof body.name === "string" ? body.name : ""
  const name = sanitizeName(rawName)
  if (!name || rawName.trim().length > MAX_NAME_LENGTH) {
    return Response.json({ error: `Add a name of 1 to ${MAX_NAME_LENGTH} characters.` }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim() : ""
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Add a valid email address." }, { status: 400 })
  }

  const score = body.score
  if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > MAX_SCORE) {
    return Response.json({ error: "That score doesn't look right." }, { status: 400 })
  }
  if (score <= currentRecord()) {
    return Response.json({ error: `Beat ${formatScore(currentRecord())} to set a new record.` }, { status: 400 })
  }

  const character = parseCharacter(body.character)
  const consent = body.consent === true
  const date = todayUtc()
  const card = { name, score, date, character }
  const shareUrl = achievementShareUrl(card)

  const webhook = process.env.ACHIEVEMENT_WEBHOOK_URL || process.env.FEEDBACK_WEBHOOK_URL
  const resendKey = process.env.RESEND_API_KEY

  const text = [
    `New runner record: ${formatScore(score)}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Character: ${CHARACTER_LABELS[character]}`,
    `Share: ${shareUrl}`,
    consent
      ? `Hall of fame (lib/hall-of-fame.ts):\n{ name: ${JSON.stringify(name)}, score: ${score}, date: "${date}" },`
      : "Hall of fame: did not opt in",
  ].join("\n")

  if (!webhook && !resendKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[achievement]\n${text}`)
      return Response.json({ ok: true, emailed: false, shareUrl })
    }
    return Response.json({ error: "Submissions aren't open yet." }, { status: 503 })
  }

  const notify = async () => {
    if (!webhook) return true
    // "content" is read by Discord, "text" by Slack; each ignores the other. No pings from player names
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, text, allowed_mentions: { parse: [] } }),
    }).catch(() => null)
    return Boolean(res?.ok)
  }

  const sendEmail = async () => {
    if (!resendKey) return false
    try {
      const png = await renderAchievementCard({ ...card, format: "portrait" }).arrayBuffer()
      const safeName = escapeHtml(name)
      const safeShare = escapeHtml(shareUrl)
      const playUrl = escapeHtml(`${siteConfig.url}/#runner`)
      const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#0a0a0a;max-width:520px">
<p>Congrats ${safeName}!</p>
<p>You set a new record on the tweenly runner: <strong>${escapeHtml(formatScore(score))}</strong>. Your sunflower card is attached.</p>
<p>Share it: <a href="${safeShare}" style="color:#ff4d12">${safeShare}</a></p>
<p>Think you can beat it? <a href="${playUrl}" style="color:#ff4d12">Play again</a></p>
<p style="color:#8a8a8a">tweenly</p>
</div>`
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.ACHIEVEMENT_FROM_EMAIL || "tweenly <onboarding@resend.dev>",
          to: [email],
          subject: `Your tweenly runner record: ${formatScore(score)}`,
          html,
          attachments: [{ filename: `tweenly-record-${score}.png`, content: Buffer.from(png).toString("base64") }],
        }),
      })
      if (!res.ok) console.error("[achievement] Resend error", res.status, await res.text().catch(() => ""))
      return res.ok
    } catch (error) {
      console.error("[achievement] email failed", error)
      return false
    }
  }

  const [notified, emailed] = await Promise.all([notify(), sendEmail()])
  if (!notified && !emailed) {
    return Response.json({ error: "Couldn't send your record. Please try again." }, { status: 502 })
  }
  return Response.json({ ok: true, emailed, shareUrl })
}
