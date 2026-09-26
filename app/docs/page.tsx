import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Copy, Accessibility, SlidersHorizontal } from "lucide-react"
import { DocPage, P, Section } from "@/components/docs/doc-page"
import { categories, components } from "@/lib/docs"

export const metadata: Metadata = { title: "Introduction" }

const PRINCIPLES = [
  {
    icon: Copy,
    title: "Copy, paste, own",
    body: "Components are added to your codebase through the shadcn CLI. No package to upgrade, nothing hidden.",
  },
  {
    icon: SlidersHorizontal,
    title: "Tuned through props",
    body: "Every timing, distance and easing is exposed as a typed prop with sensible defaults.",
  },
  {
    icon: Accessibility,
    title: "Respectful by default",
    body: "All motion honours prefers-reduced-motion and falls back to a gentle fade or a static state.",
  },
]

export default function IntroductionPage() {
  return (
    <DocPage
      title="Introduction"
      description="motioncn is a collection of animated React components built on Motion and GSAP, distributed as a shadcn registry. Try every prop live, then copy the exact code you tuned."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {PRINCIPLES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border bg-inset p-4">
            <Icon className="size-4 text-brand" />
            <p className="mt-6 text-[14px] font-medium">{title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <Section title="How it works">
        <P>
          Each component page has a live stage, a controls panel and a code panel. Change a control and
          the preview replays while the usage snippet updates to include exactly the props you changed.
          When you are happy, install the component with one command and paste the snippet.
        </P>
      </Section>

      {categories.map((category) => (
        <Section key={category} title={category}>
          <div className="grid gap-2 sm:grid-cols-2">
            {components
              .filter((c) => c.category === category)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/docs/components/${c.slug}`}
                  className="group rounded-2xl border bg-inset p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium">{c.name}</span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{c.description}</p>
                </Link>
              ))}
          </div>
        </Section>
      ))}
    </DocPage>
  )
}
