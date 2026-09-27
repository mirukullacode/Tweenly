import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { DocPage } from "@/components/docs/doc-page"
import { NewsletterForm } from "@/components/site/newsletter-form"
import { changelog } from "@/lib/changelog"
import { getComponent } from "@/lib/docs"

export const metadata: Metadata = {
  title: "Changelog",
  description: "New components, improvements and fixes in every tweenly release.",
  alternates: { canonical: "/changelog" },
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })

export default function ChangelogPage() {
  return (
    <DocPage title="Changelog" description="New components, improvements and fixes in every release.">
      <div className="rounded-2xl border bg-inset p-5">
        <NewsletterForm source="changelog" title="Get release notes by email" />
      </div>

      <ol className="space-y-14">
        {changelog.map((entry, i) => (
          <li key={entry.version} className="relative grid gap-4 sm:grid-cols-[8.5rem_1fr]">
            <div className="flex items-baseline gap-2 sm:flex-col sm:gap-1">
              <span className="font-mono text-[13px] font-medium">v{entry.version}</span>
              <time dateTime={entry.date} className="text-[12.5px] text-muted-foreground">
                {formatDate(entry.date)}
              </time>
              {i === 0 && (
                <span className="rounded-full bg-brand/12 px-2 py-px text-[10.5px] font-medium text-brand">Latest</span>
              )}
            </div>
            <div className="space-y-4 border-l border-dashed pl-6 sm:pl-8">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{entry.title}</h2>
                <p className="mt-1.5 text-[14.5px] leading-7 text-muted-foreground">{entry.summary}</p>
              </div>

              {entry.added && entry.added.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">New components</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.added.map((slug) => {
                      const doc = getComponent(slug)
                      if (!doc) return null
                      return (
                        <Link
                          key={slug}
                          href={`/docs/components/${slug}`}
                          className="group inline-flex items-center gap-1 rounded-full border bg-panel px-3 py-1 text-[13px] transition-colors hover:border-brand/40 hover:text-foreground"
                        >
                          {doc.name}
                          <ArrowUpRight className="size-3 text-muted-foreground transition group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-brand" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {entry.changes && entry.changes.length > 0 && (
                <ul className="space-y-2">
                  {entry.changes.map((c) => (
                    <li key={c} className="flex gap-2.5 text-[14px] leading-6 text-muted-foreground">
                      <span className="mt-[9px] size-1 shrink-0 rounded-full bg-brand" />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </DocPage>
  )
}
