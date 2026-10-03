import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { components, githubUrl, LIBRARIES, librariesOf, registryUrl, type ComponentDoc } from "@/lib/docs"
import type { ComponentGuide } from "@/lib/guides/types"
import { CodeBlock } from "./code-block"
import { LibraryBadges } from "./library-badges"

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2.5 text-[13px] font-semibold tracking-tight">{children}</h3>
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
          <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand" />
          <span>
            <Rich text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Renders `code` spans in guide text. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") ? (
          <code key={i} className="rounded border bg-inset px-1 py-px font-mono text-[11.5px] text-foreground">
            {p.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}

/** The Docs tab: overview, library, when to use, features, install, accessibility, tips and related. */
export function DocsPanel({ doc, guide }: { doc: ComponentDoc; guide?: ComponentGuide }) {
  const libs = librariesOf(doc)
  const fileName = doc.file.split("/").pop()
  const related = (guide?.related ?? [])
    .map((slug) => components.find((c) => c.slug === slug))
    .filter((c): c is ComponentDoc => !!c)
  const fallbackRelated = related.length
    ? related
    : components.filter((c) => c.category === doc.category && c.slug !== doc.slug).slice(0, 3)
  const deps = doc.dependencies.filter((d) => d !== "react")

  return (
    <div className="mc-scroll -mx-3 -mb-3 flex-1 space-y-7 overflow-y-auto px-4 pb-6 pt-1">
      <section>
        <Heading>Overview</Heading>
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          <Rich text={guide?.overview ?? doc.description} />
        </p>
      </section>

      <section>
        <Heading>Built with</Heading>
        <LibraryBadges doc={doc} className="mb-2.5" />
        {libs.length ? (
          <ul className="space-y-1.5">
            {libs.map((lib) => (
              <li key={lib} className="text-[13px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">{LIBRARIES[lib].name}:</span> {LIBRARIES[lib].blurb}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Pure CSS and canvas, so there&apos;s no animation library to install.
          </p>
        )}
      </section>

      {guide?.whenToUse?.length ? (
        <section>
          <Heading>When to use it</Heading>
          <List items={guide.whenToUse} />
        </section>
      ) : null}

      {guide?.features?.length ? (
        <section>
          <Heading>Features</Heading>
          <List items={guide.features} />
        </section>
      ) : null}

      <section>
        <Heading>Installation</Heading>
        <p className="mb-2 text-[12.5px] text-muted-foreground">With the shadcn CLI, which also installs dependencies:</p>
        <CodeBlock code={`npx shadcn@latest add ${registryUrl(doc.slug)}`} lineNumbers={false} />
        <p className="mb-2 mt-4 text-[12.5px] text-muted-foreground">Or manually:</p>
        <ol className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
          {deps.length > 0 && (
            <li>
              <span className="font-medium text-foreground">1.</span> Install the dependencies:
              <CodeBlock code={`npm install ${deps.join(" ")}`} lineNumbers={false} className="mt-2" />
            </li>
          )}
          <li>
            <span className="font-medium text-foreground">{deps.length ? "2." : "1."}</span> Copy the code from the Source tab into{" "}
            <code className="rounded border bg-inset px-1 py-px font-mono text-[11.5px] text-foreground">components/{fileName}</code>.
          </li>
          <li>
            <span className="font-medium text-foreground">{deps.length ? "3." : "2."}</span> Make sure{" "}
            <code className="rounded border bg-inset px-1 py-px font-mono text-[11.5px] text-foreground">cn</code> exists in{" "}
            <code className="rounded border bg-inset px-1 py-px font-mono text-[11.5px] text-foreground">lib/utils.ts</code> (every shadcn project has it).
          </li>
        </ol>
      </section>

      {guide?.accessibility?.length ? (
        <section>
          <Heading>Accessibility</Heading>
          <List items={guide.accessibility} />
        </section>
      ) : null}

      {guide?.tips?.length ? (
        <section>
          <Heading>Tips</Heading>
          <List items={guide.tips} />
        </section>
      ) : null}

      {fallbackRelated.length > 0 && (
        <section>
          <Heading>Pairs well with</Heading>
          <div className="grid gap-2">
            {fallbackRelated.map((c) => (
              <Link
                key={c.slug}
                href={`/docs/components/${c.slug}`}
                className="group flex items-center justify-between gap-3 rounded-xl border bg-inset px-3.5 py-2.5 transition-colors hover:bg-accent"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">{c.name}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">{c.description}</span>
                </span>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-4 text-[12px] text-muted-foreground">
        <a href={`${githubUrl}/blob/main/${doc.file}`} target="_blank" rel="noreferrer" className="hover:text-foreground">
          View source on GitHub
        </a>
        <a
          href={`${githubUrl}/issues/new?template=bug_report.yml&title=${encodeURIComponent(`[${doc.slug}] `)}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground"
        >
          Report an issue
        </a>
      </div>
    </div>
  )
}
