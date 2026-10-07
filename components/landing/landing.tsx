"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Copy, Play, SlidersHorizontal } from "lucide-react"
import { CopyButton } from "@/components/docs/copy-button"
import { CategoryIcon } from "@/components/docs/category-icon"
import { Logo } from "@/components/docs/sidebar"
import { ThemeToggle } from "@/components/docs/theme-toggle"
import { CommandMenu, SearchTrigger } from "@/components/docs/command-menu"
import { InstallTerminal } from "./install-terminal"
import { categories, components, githubUrl, LIBRARIES, librariesOf } from "@/lib/docs"
import { track } from "@/lib/analytics"
import { features } from "@/lib/features"
import { LogoMark } from "@/components/site/logo-mark"
import { GithubStars } from "@/components/site/github-stars"
import { NewsletterForm } from "@/components/site/newsletter-form"
import { RunnerGame } from "@/components/site/runner-game"
import { isCharacter } from "@/components/site/runner-sprites"
import { currentRecord } from "@/lib/hall-of-fame"
import { AchievementDialog } from "@/components/site/achievement-dialog"
import { HallOfFame } from "@/components/site/hall-of-fame"
import { FadeIn } from "@/registry/new-york/fade-in/fade-in"
import { Footer } from "@/registry/new-york/footer/footer"
import { Marquee } from "@/registry/new-york/marquee/marquee"

/*
 * Kept deliberately simple: native scrolling, no preloader, no pinned scenes,
 * no canvas and no blur animations, so the page scrolls smoothly on any device.
 */

export function Landing() {
  const [achievement, setAchievement] = useState<{ score: number; character: string } | null>(null)
  const record = currentRecord()

  return (
    <div className="relative bg-background">
      <Header />
      <main>
        <Hero />
        <ComponentMarquee />
        <HowItWorks />
        <Categories />
        <Install />
        <FinalCta />
      </main>
      {/* The last screen: footer and game share the full viewport, no dividers */}
      <section id="runner" className="flex min-h-dvh flex-col">
        <Footer
          className="shrink-0 border-t-0"
          variant="columns"
          brand="tweenly"
          logo={<LogoMark tile={false} className="size-5" />}
          description="Animated React components you install with the shadcn CLI and own forever."
          background="var(--background)"
          color="var(--foreground)"
          muted="var(--muted-foreground)"
          columns={[
            {
              title: "Library",
              links: [
                { label: "Components", href: "/docs/components/fade-in" },
                { label: "Playground", href: "/playground" },
                { label: "Installation", href: "/docs/installation" },
                { label: "Changelog", href: "/changelog" },
                ...(features.sponsors ? [{ label: "Sponsor", href: "/sponsor" }] : []),
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "Docs", href: "/docs" },
                { label: "Use with AI agents", href: "/docs/ai-agents" },
                { label: "Landing template", href: "/templates/forge" },
                { label: "llms.txt", href: "/llms.txt" },
              ],
            },
            {
              title: "Community",
              links: [
                { label: "GitHub", href: githubUrl },
                { label: "Contributing", href: `${githubUrl}/blob/main/CONTRIBUTING.md` },
                { label: "Request a component", href: `${githubUrl}/issues/new?template=component_request.yml` },
              ],
            },
          ]}
          socials={[
            { label: "GitHub", href: githubUrl },
            { label: "X", href: "https://x.com/MIrukulla" },
            { label: "LinkedIn", href: "https://www.linkedin.com/in/irumanjunath/" },
          ]}
          newsletter={false}
          copyright="tweenly. MIT licensed."
          legal={[
            { label: "Privacy", href: "/privacy" },
            { label: "Cookies", href: "/cookies" },
          ]}
        />
        <HallOfFame />
        <div className="relative grid min-h-[300px] flex-1 px-4 pb-6 sm:px-6">
          <RunnerGame record={record} onRecord={(score, character) => setAchievement({ score, character })} />
        </div>
      </section>
      <AchievementDialog
        open={achievement !== null}
        score={achievement?.score ?? 0}
        character={isCharacter(achievement?.character) ? achievement.character : undefined}
        onClose={() => setAchievement(null)}
      />
      <CommandMenu />
    </div>
  )
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-3 flex h-12 max-w-6xl items-center justify-between rounded-full border bg-background/90 pl-4 pr-1.5 sm:mx-6 xl:mx-auto">
        <Logo />
        <nav className="flex items-center gap-0.5 text-[13.5px]">
          <Link href="/docs" className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block">
            Docs
          </Link>
          <Link href="/docs/components/fade-in" className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block">
            Components
          </Link>
          <Link href="/playground" className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground md:block">
            Playground
          </Link>
          <SearchTrigger compact />
          <GithubStars from="landing-header" className="mx-1 hidden sm:inline-flex" />
          <ThemeToggle />
          <Link
            href="/docs/installation"
            className="ml-1 rounded-full bg-foreground px-4 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  const command = "npx shadcn@latest add @tweenly/text-reveal"
  const motionCount = components.filter((c) => librariesOf(c).includes("motion")).length
  const gsapCount = components.filter((c) => librariesOf(c).includes("gsap")).length

  return (
    <section className="px-6 pb-20 pt-40 sm:px-12 sm:pt-48">
      <div className="mx-auto max-w-6xl">
        <FadeIn blur={0} distance={16}>
          <Link
            href="/changelog"
            className="group inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">New</span>
            AI components, playground and more
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </FadeIn>

        <FadeIn blur={0} distance={24} delay={0.05}>
          <h1 className="mt-6 max-w-4xl text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
            Motion for the in-between.
          </h1>
        </FadeIn>

        <FadeIn blur={0} distance={20} delay={0.12}>
          <p className="mt-8 max-w-xl text-balance text-[17px] leading-relaxed text-muted-foreground">
            {components.length} animated React components for shadcn/ui. Tweak every prop live, copy the exact code, and install
            it with one command. You own the source.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/components/fade-in"
              className="group flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Browse components
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/playground"
              className="group inline-flex h-12 items-center gap-2 rounded-full border px-5 text-[14px] transition-colors hover:bg-accent"
            >
              <Play className="size-3.5 text-brand" />
              Open the playground
            </Link>
          </div>
        </FadeIn>

        <FadeIn blur={0} distance={16} delay={0.2}>
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6">
            <div className="flex h-11 items-center gap-2 rounded-full border bg-panel pl-4 pr-1.5">
              <code className="max-w-[240px] truncate font-mono text-[12.5px] text-foreground/75 sm:max-w-none">
                <span className="select-none opacity-50">$ </span>
                {command}
              </code>
              <CopyButton value={command} onCopy={() => track("copy_hero_install")} className="size-8 rounded-full" />
            </div>
            <span className="flex items-center gap-4 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: LIBRARIES.motion.color }} />
                {motionCount} with Motion
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: LIBRARIES.gsap.color }} />
                {gsapCount} with GSAP
              </span>
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

function ComponentMarquee() {
  return (
    <div className="border-y py-6">
      <Marquee duration={80} gap={48} pauseOnHover>
        {components.map((c) => (
          <Link
            key={c.slug}
            href={`/docs/components/${c.slug}`}
            className="flex items-center gap-3 whitespace-nowrap font-[family-name:var(--font-display)] text-3xl uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="size-1.5 rounded-full bg-brand" />
            {c.name}
          </Link>
        ))}
      </Marquee>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <FadeIn blur={0} distance={16} className="mb-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.045em]">{title}</h2>
        {description && <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground md:text-right">{description}</p>}
      </div>
    </FadeIn>
  )
}

const STEPS = [
  { icon: Play, title: "Pick", body: "Browse by category or search with ⌘K. Every component runs live, right on its page." },
  { icon: SlidersHorizontal, title: "Tweak", body: "Change variants, timing and colors in the controls. The code updates as you go." },
  { icon: Copy, title: "Own", body: "Install with one shadcn command or copy the source. It's your code from then on." },
]

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <SectionHeading eyebrow="How it works" title="Three steps. No lock-in." />
      <div className="grid gap-3 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <FadeIn key={title} blur={0} distance={20} delay={i * 0.06} className="h-full">
            <div className="h-full rounded-3xl border bg-panel p-6">
              <span className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-foreground/[0.05] text-brand">
                  <Icon className="size-4" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">0{i + 1}</span>
              </span>
              <p className="mt-8 text-xl font-semibold tracking-tight">{title}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}

function Categories() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <SectionHeading
          eyebrow="Components"
          title="Something for every screen."
          description="From a single button to a whole page section. Filter by Motion or GSAP in the docs sidebar."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => {
            const items = components.filter((c) => c.category === category)
            if (!items.length) return null
            return (
              <FadeIn key={category} blur={0} distance={16} delay={(i % 3) * 0.05} className="h-full">
                <Link
                  href={`/docs/components/${items[0].slug}`}
                  className="group flex h-full flex-col rounded-3xl border bg-panel p-5 transition-colors hover:border-foreground/20"
                >
                  <span className="flex items-center justify-between">
                    <span className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
                      <span className="grid size-8 place-items-center rounded-lg border bg-background text-muted-foreground transition-colors group-hover:text-brand">
                        <CategoryIcon group={category} className="size-4" />
                      </span>
                      {category}
                    </span>
                    <span className="font-mono text-[11.5px] text-muted-foreground">{items.length}</span>
                  </span>
                  <span className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                    {items.slice(0, 4).map((c) => c.name).join(", ")}
                    {items.length > 4 ? ` and ${items.length - 4} more` : ""}
                  </span>
                  <ArrowUpRight className="mt-4 size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Install() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <SectionHeading
          eyebrow="Install"
          title="Ship it your way."
          description="From your terminal, from your AI agent, or by hand. Every path ends with plain source code in your repo."
        />
        <FadeIn blur={0} distance={24}>
          <InstallTerminal />
        </FadeIn>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="rounded-[32px] border bg-panel">
        <FadeIn blur={0} distance={24} className="flex flex-col items-center px-6 py-28 text-center">
          <h2 className="text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.055em]">
            Make it
            <br />
            move.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/components/fade-in"
              className="group flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition-opacity hover:opacity-90"
            >
              Start building
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("github_click", { from: "landing-cta" })}
              className="flex h-12 items-center gap-2 rounded-full border px-6 text-[14px] transition-colors hover:bg-accent"
            >
              Star on GitHub
            </a>
          </div>
          <div className="mt-14 w-full max-w-md rounded-3xl border bg-background p-5 text-left">
            <NewsletterForm source="landing" />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
