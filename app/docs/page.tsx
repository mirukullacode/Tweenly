import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Compass, Copy, Accessibility, SlidersHorizontal } from "lucide-react"
import { DocPage, P, Section } from "@/components/docs/doc-page"
import { categories, components, LIBRARIES, librariesOf } from "@/lib/docs"
import { TOUR_HOME } from "@/lib/tour"
import { NewsletterForm } from "@/components/site/newsletter-form"

export const metadata: Metadata = {
  title: "Introduction",
  description: "What tweenly is, how it works and every animated component it ships, grouped by category.",
  alternates: { canonical: "/docs" },
}

const LIBRARY_CHOICES = [
  {
    lib: "motion" as const,
    bestFor: [
      "UI that reacts to state: toggles, inputs, menus, feeds",
      "Springs, gestures, drag and layout animations",
      "Enter and exit animations with AnimatePresence",
    ],
  },
  {
    lib: "gsap" as const,
    bestFor: [
      "Scroll-linked scenes that pin and scrub with ScrollTrigger",
      "Choreographed, multi-step timelines",
      "Page loaders, route transitions and storytelling sections",
    ],
  },
]

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
      description="tweenly is a collection of animated React components built on Motion and GSAP, distributed as a shadcn registry. Try every prop live, then copy the exact code you tuned."
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

      <Link
        href={TOUR_HOME}
        className="group flex items-center justify-between gap-4 rounded-2xl border bg-inset p-4 transition-colors hover:bg-accent"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-brand/12 text-brand">
            <Compass className="size-4" />
          </span>
          <span>
            <span className="block text-[14px] font-medium">New here? Take the 30-second tour</span>
            <span className="block text-[13px] text-muted-foreground">See the preview, controls, code and install flow on a real component.</span>
          </span>
        </span>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>

      <Section title="Motion or GSAP?">
        <P>
          Every component lists the animation library it&apos;s built on, and the sidebar filter shows only Motion or only
          GSAP components. Pick the one your project already uses, or mix them: they work side by side.
        </P>
        <div className="grid gap-3 sm:grid-cols-2">
          {LIBRARY_CHOICES.map((choice) => {
            const count = components.filter((c) => librariesOf(c).includes(choice.lib)).length
            return (
              <div key={choice.lib} className="rounded-2xl border bg-inset p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] font-medium">
                    <span className="size-2 rounded-full" style={{ backgroundColor: LIBRARIES[choice.lib].color }} />
                    {LIBRARIES[choice.lib].name}
                  </span>
                  <span className="font-mono text-[11.5px] text-muted-foreground">{count} components</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{LIBRARIES[choice.lib].blurb}</p>
                <p className="mt-3 text-[12px] font-medium text-foreground">Choose it for</p>
                <ul className="mt-1.5 space-y-1">
                  {choice.bestFor.map((item) => (
                    <li key={item} className="text-[12.5px] leading-relaxed text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <P className="text-[13px]">
          {components.filter((c) => librariesOf(c).length === 0).length} components need no animation library at all (pure CSS
          or canvas), and a few combine Motion and GSAP where each does what it&apos;s best at.
        </P>
      </Section>

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
      <div className="rounded-2xl border bg-inset p-5">
        <NewsletterForm source="docs-intro" />
      </div>
    </DocPage>
  )
}
