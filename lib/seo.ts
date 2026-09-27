import type { Metadata } from "next"
import { components, githubUrl, siteConfig, type ComponentDoc } from "@/lib/docs"

const base = siteConfig.url.replace(/\/$/, "")
const defaultTitle = `${siteConfig.name}: ${siteConfig.tagline}`
const twitterHandle = siteConfig.twitter ? `@${siteConfig.twitter.replace(/^@/, "")}` : undefined

/** Root metadata; spread or export from app/layout.tsx. */
export const rootMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: defaultTitle, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name, url: githubUrl }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: base,
    siteName: siteConfig.name,
    title: defaultTitle,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteConfig.description,
    ...(twitterHandle ? { creator: twitterHandle, site: twitterHandle } : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
}

/** Metadata for a component docs page. */
export function componentMetadata(doc: ComponentDoc): Metadata {
  const path = `/docs/components/${doc.slug}`
  const title = `${doc.name}: animated ${doc.category.toLowerCase()} component for React`
  return {
    title: doc.name,
    description: doc.description,
    keywords: [doc.name, doc.exportName, doc.category, "react", "shadcn", "animation", ...doc.dependencies],
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: siteConfig.name,
      title,
      description: doc.description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: doc.description,
      ...(twitterHandle ? { creator: twitterHandle } : {}),
    },
  }
}

/** SoftwareSourceCode + BreadcrumbList for a component page. */
export function componentJsonLd(doc: ComponentDoc) {
  const url = `${base}/docs/components/${doc.slug}`
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareSourceCode",
        "@id": `${url}#code`,
        name: doc.name,
        description: doc.description,
        url,
        codeRepository: githubUrl,
        programmingLanguage: [
          { "@type": "ComputerLanguage", name: "TypeScript" },
          { "@type": "ComputerLanguage", name: "React" },
        ],
        runtimePlatform: "React",
        keywords: [doc.category, "react", "shadcn", "animation"].join(", "),
        isPartOf: { "@type": "WebSite", name: siteConfig.name, url: base },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Docs", item: `${base}/docs` },
          { "@type": "ListItem", position: 2, name: "Components", item: `${base}/docs` },
          { "@type": "ListItem", position: 3, name: doc.name, item: url },
        ],
      },
    ],
  }
}

/** WebSite + SoftwareApplication JSON-LD for the landing page. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: siteConfig.name,
        url: base,
        description: siteConfig.description,
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${base}/#software`,
        name: siteConfig.name,
        description: `${siteConfig.tagline}. ${siteConfig.description}`,
        url: base,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        softwareHelp: `${base}/docs`,
        downloadUrl: githubUrl,
        featureList: `${components.length} animated React components for shadcn/ui`,
        keywords: siteConfig.keywords.join(", "),
      },
    ],
  }
}

/** Serialize JSON-LD for a <script type="application/ld+json"> tag, escaping `<`. */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
