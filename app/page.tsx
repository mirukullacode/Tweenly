import { Landing } from "@/components/landing/landing"
import { jsonLdString, websiteJsonLd } from "@/lib/seo"

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(websiteJsonLd()) }} />
      <Landing />
    </>
  )
}
