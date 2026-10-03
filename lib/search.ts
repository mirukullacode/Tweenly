import { components, docsNav, LIBRARIES, librariesOf, type ComponentDoc } from "@/lib/docs"

export type SearchItem = {
  id: string
  title: string
  href: string
  group: string
  description?: string
  keywords: string
  doc?: ComponentDoc
}

const normalize = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")

export const searchItems: SearchItem[] = [
  ...docsNav.map((d) => ({
    id: d.href,
    title: d.title,
    href: d.href,
    group: "Getting started",
    keywords: normalize(d.title),
  })),
  ...components.map((c) => ({
    id: c.slug,
    title: c.name,
    href: `/docs/components/${c.slug}`,
    group: c.category,
    description: c.description,
    // Prop names help queries like "stagger" or "blur" find the right component
    keywords: normalize([c.name, c.slug, c.category, c.exportName, c.description, ...librariesOf(c).map((l) => LIBRARIES[l].name), ...c.props.map((p) => p.name)].join(" ")),
    doc: c,
  })),
]

function scoreItem(item: SearchItem, terms: string[]) {
  const title = normalize(item.title)
  const group = normalize(item.group)
  let score = 0
  for (const t of terms) {
    if (title === t) score += 100
    else if (title.startsWith(t)) score += 60
    else if (title.split(/\s+/).some((w) => w.startsWith(t))) score += 40
    else if (title.includes(t)) score += 25
    else if (group.startsWith(t)) score += 15
    else if (item.keywords.includes(t)) score += 6
    // Every term must match somewhere
    else return 0
  }
  return score
}

/** Ranked matches for a query. Empty queries return nothing; callers show a default list. */
export function search(query: string, limit = 40): SearchItem[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  return searchItems
    .map((item) => ({ item, score: scoreItem(item, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map((r) => r.item)
}
