import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/docs"

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "")
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
