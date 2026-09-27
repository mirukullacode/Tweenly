import type { MetadataRoute } from "next"
import { components, siteConfig } from "@/lib/docs"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "")
  const lastModified = new Date()

  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/docs`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/docs/installation`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/changelog`, lastModified, changeFrequency: "weekly", priority: 0.6 },
  ]

  return [
    ...pages,
    ...components.map((c) => ({
      url: `${base}/docs/components/${c.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: c.isNew ? 0.8 : 0.7,
    })),
  ]
}
