import { isIsoDate, parseAchievementParams, renderAchievementCard } from "@/lib/achievement-card"

/**
 * The sunflower record card as a PNG.
 * Query: name, score, date (YYYY-MM-DD), character (dino | cat | mark), format (portrait | wide).
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const params = parseAchievementParams(query)
  // Identical params always render the same image; without a date the card shows "today", so cache it briefly
  const cache = isIsoDate(query.get("date"))
    ? "public, max-age=31536000, immutable"
    : "public, max-age=3600"
  try {
    return renderAchievementCard(params, { "Cache-Control": cache })
  } catch (error) {
    console.error("[achievement/image]", error)
    return new Response("Failed to generate the image.", { status: 500 })
  }
}
