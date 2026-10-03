import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Playground } from "@/components/docs/playground"
import { getGuide } from "@/lib/guides"
import { components, getComponent } from "@/lib/docs"
import { componentJsonLd, componentMetadata, jsonLdString } from "@/lib/seo"

export const dynamicParams = false

export function generateStaticParams() {
  return components.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/docs/components/[slug]">): Promise<Metadata> {
  const doc = getComponent((await params).slug)
  return doc ? componentMetadata(doc) : {}
}

export default async function ComponentPage({ params }: PageProps<"/docs/components/[slug]">) {
  const { slug } = await params
  const doc = getComponent(slug)
  if (!doc) notFound()

  // Show imports the way they land in a user's project after `shadcn add`
  const file = path.join(process.cwd(), "registry", doc.file.replace(/^registry\//, ""))
  const source = (await readFile(file, "utf8"))
    .replace(/@\/registry\/new-york\/hooks\//g, "@/hooks/")
    .replace(/@\/registry\/new-york\/lib\//g, "@/lib/")

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(componentJsonLd(doc)) }} />
      <Playground slug={slug} source={source} guide={getGuide(slug)} />
    </>
  )
}
