import { llmsFullTxt, TEXT_HEADERS } from "@/lib/llms"

export const dynamic = "force-static"

export function GET() {
  return new Response(llmsFullTxt(), { headers: TEXT_HEADERS })
}
