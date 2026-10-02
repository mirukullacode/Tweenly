"use client"

import { ArrowRight, Play, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Banner } from "@/registry/new-york/banner/banner"
import { FadeIn } from "@/registry/new-york/fade-in/fade-in"
import { Footer, type FooterColumn } from "@/registry/new-york/footer/footer"
import { HeroBackground } from "@/registry/new-york/hero-background/hero-background"
import { Marquee } from "@/registry/new-york/marquee/marquee"
import { Navbar, type NavbarLink } from "@/registry/new-york/navbar/navbar"
import { NumberTicker } from "@/registry/new-york/number-ticker/number-ticker"
import { ShineButton } from "@/registry/new-york/shine-button/shine-button"
import { SmoothScroll, useLenis } from "@/registry/new-york/smooth-scroll/smooth-scroll"
import { Stagger } from "@/registry/new-york/stagger/stagger"
import { TextReveal } from "@/registry/new-york/text-reveal/text-reveal"
import { TweetGrid, type TweetGridItem } from "@/registry/new-york/tweet-card/tweet-card"
import { cn } from "@/lib/utils"
import { AgentsPanel } from "./forge/agents-panel"
import { CodeDiff } from "./forge/code-diff"
import { FeatureTabs } from "./forge/feature-tabs"
import { Integrations } from "./forge/integrations"
import { McpServers } from "./forge/mcp-servers"
import { Pricing } from "./forge/pricing"
import { SetupSteps } from "./forge/setup-steps"
import { ACCENT, Eyebrow, ForgeMark, ForgeWordmark, SectionHeading } from "./forge/shared"
import { Terminal } from "./forge/terminal"

/* ------------------------------------------------------------------ data */

const NAV_LINKS: NavbarLink[] = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
  { label: "Company", href: "#company" },
]

const COMPANIES: { name: string; className: string }[] = [
  { name: "Northwind", className: "font-semibold tracking-tight" },
  { name: "acme labs", className: "font-mono font-medium lowercase" },
  { name: "LUMEN", className: "font-bold tracking-[0.25em]" },
  { name: "Kestrel", className: "font-medium italic" },
  { name: "Polaris", className: "font-semibold tracking-tight" },
  { name: "VERTEX/", className: "font-mono font-bold" },
  { name: "Halcyon", className: "font-light tracking-wide" },
  { name: "oakline", className: "font-bold lowercase tracking-tighter" },
]

const STATS = [
  { value: 120, suffix: "+", label: "Countries with active teams" },
  { value: 48, suffix: "K", label: "Developers shipping daily" },
  { value: 2.4, suffix: "M", decimals: 1, label: "Pull requests merged" },
  { value: 63, suffix: "%", label: "Less time in code review" },
]

const TWEETS: TweetGridItem[] = [
  {
    author: { name: "Priya Raman", handle: "priyacodes", verified: true },
    content: "Gave Forge a gnarly Linear ticket before lunch. Came back to a PR with tests, a migration and a clean description. I just reviewed it. This is the future of the job.",
    date: "Sep 12",
    stats: { replies: 24, reposts: 61, likes: 812 },
  },
  {
    author: { name: "Marcus Oyelaran", handle: "marcus_ships" },
    content: "Parallel agents are wild. Planner, coder and reviewer all working at once and the reviewer actually catches the coder's mistakes.",
    date: "Sep 18",
    stats: { replies: 9, reposts: 22, likes: 340 },
  },
  {
    author: { name: "Elena Sokolova", handle: "elenasok", verified: true },
    content: "We wired Forge into Sentry via MCP. It now opens fix PRs for new errors with the stack trace and a repro test. On-call has never been this quiet.",
    date: "Aug 30",
    stats: { replies: 31, reposts: 104, likes: 1_420 },
  },
  {
    author: { name: "Dev Patel", handle: "devpatel" },
    content: "Smart Review flagged a race condition three senior engineers missed. Not replacing us, just making us look good.",
    date: "Sep 3",
    stats: { replies: 12, reposts: 18, likes: 296 },
  },
  {
    author: { name: "Hannah Becker", handle: "hbecker_dev" },
    content: "Setup took four minutes. Connect GitHub, toggle Linear and Figma, done. It already knew our conventions from the codebase.",
    date: "Sep 21",
    stats: { replies: 5, reposts: 14, likes: 188 },
  },
  {
    author: { name: "Tomás Herrera", handle: "tomasbuilds", verified: true },
    content: "Shipped our billing revamp in 6 days instead of the 5 weeks we scoped. Forge wrote ~70% of it and every line went through review.",
    date: "Aug 25",
    stats: { replies: 40, reposts: 88, likes: 1_105 },
  },
  {
    author: { name: "Aiko Tanaka", handle: "aikot" },
    content: "Auto Testing is the sleeper feature. Coverage went from 41% to 86% on a legacy service without anyone writing a test by hand.",
    date: "Sep 9",
    stats: { replies: 7, reposts: 29, likes: 402 },
  },
  {
    author: { name: "Jordan Mills", handle: "jmills" },
    content: "I was skeptical of AI agents touching prod code. The diff-first workflow sold me. Nothing merges without me clicking apply.",
    date: "Sep 15",
    stats: { replies: 18, reposts: 11, likes: 233 },
  },
  {
    author: { name: "Sofia Rossi", handle: "sofiarossi", verified: true },
    content: "Our 4-person startup ships like a team of 15. Forge is the best $12 per seat we spend, and it is not close.",
    date: "Sep 24",
    stats: { replies: 22, reposts: 47, likes: 655 },
  },
]

const FAQ = [
  {
    q: "What is an AI coding agent?",
    a: "An AI coding agent is software that can read your codebase, plan changes and carry them out across files, much like a teammate. Forge goes beyond autocomplete: it writes features, runs tests, reviews pull requests and prepares deploys.",
  },
  {
    q: "How does Forge work?",
    a: "Forge indexes your repositories to understand structure and conventions, then splits work across parallel agents (a planner, a coder and a reviewer). Every change is proposed as a diff you can inspect, edit and apply.",
  },
  {
    q: "Is my code and data secure?",
    a: "Yes. Code is encrypted in transit and at rest, never used to train models, and processed in isolated sandboxes. Enterprise plans add SSO, audit logs, data residency and self-hosted runners.",
  },
  {
    q: "Which tools does Forge integrate with?",
    a: "GitHub out of the box, plus MCP servers for Linear, Figma, Slack, Sentry, Postgres, Stripe, Notion and more. Any MCP-compatible server can be installed in one click.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is free forever for one repository. Startup comes with a 14-day trial with every feature unlocked, no credit card required.",
  },
  {
    q: "How much time will Forge save my team?",
    a: "Teams typically report shipping 5 to 10 times faster on well-scoped work and spending around 60% less time in code review, because Forge handles the boilerplate, tests and first-pass review.",
  },
]

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Integrations", href: "#integrations" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#", badge: "2.0" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#docs" },
      { label: "MCP directory", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#company" },
      { label: "Careers", href: "#", badge: "Hiring" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
]

/* ------------------------------------------------------------------ page */

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-6"

export function ForgeTemplate() {
  return (
    <SmoothScroll>
      <div id="top" className="relative flex flex-1 flex-col overflow-x-clip bg-background text-foreground">
        <Banner
          variant="shimmer"
          badge="New"
          message="Forge 2.0 is here: parallel agents and MCP servers"
          cta={{ label: "Read the launch post", href: "#features" }}
        />
        <Navbar
          variant="pill"
          links={NAV_LINKS}
          logo={<ForgeWordmark />}
          cta={{ label: "Get started", href: "#pricing" }}
        />

        <main className="flex flex-col">
          <Hero />
          <TrustedBy />
          <Features />
          <Scale />
          <Setup />
          <Testimonials />
          <section id="pricing" className="scroll-mt-24 py-24 sm:py-28">
            <div className={CONTAINER}>
              <SectionHeading
                eyebrow="Pricing"
                title="Build more. Pay less. Scale smart."
                description="Start free, upgrade when your team is ready. Every plan includes code generation and review."
              />
              <div className="mt-14">
                <Pricing />
              </div>
            </div>
          </section>
          <Faq />
          <FinalCta />
        </main>

        <div id="company">
          <Footer
            variant="columns"
            brand="Forge"
            logo={<ForgeMark className="size-6" />}
            description="The AI coding agent that plans, writes, tests and ships with your team."
            columns={FOOTER_COLUMNS}
            socials={[
              { label: "GitHub", href: "#" },
              { label: "X", href: "#" },
              { label: "LinkedIn", href: "#" },
            ]}
            newsletter
            background="var(--background)"
            color="var(--foreground)"
            muted="var(--muted-foreground)"
            accent={ACCENT}
            copyright="© 2026 Forge Labs, Inc. All rights reserved."
          />
        </div>
      </div>
    </SmoothScroll>
  )
}

/* -------------------------------------------------------------- sections */

function Hero() {
  return (
    <section id="product" className="relative scroll-mt-24">
      <HeroBackground variant="grid" mask="radial" opacity={0.28} interaction="repel" className="pb-10 pt-16 sm:pt-24">
        <div className={cn(CONTAINER, "flex flex-col items-center text-center")}>
          <FadeIn distance={10}>
            <a href="#features" className="group inline-flex">
              <Badge variant="outline" className="h-7 gap-2 bg-background/70 px-3 text-xs backdrop-blur">
                <Sparkles className="size-3!" style={{ color: ACCENT }} />
                Introducing intelligent code generation
                <ArrowRight className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Badge>
            </a>
          </FadeIn>
          <TextReveal
            as="h1"
            text="Ship production code 10x faster with AI"
            stagger={0.07}
            delay={0.1}
            className="mt-6 max-w-4xl text-balance text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl"
          />
          <FadeIn delay={0.45} distance={12}>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Forge is the AI coding agent that understands your codebase, writes features end to end, reviews every
              pull request and gets you to production with green checks.
            </p>
          </FadeIn>
          <FadeIn delay={0.6} distance={12} className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="#pricing"
              className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-5 text-sm")}
            >
              Start for free <ArrowRight data-icon="inline-end" />
            </a>
            <a
              href="#features"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full px-5 text-sm")}
            >
              <Play data-icon="inline-start" className="fill-current" /> Watch demo
            </a>
          </FadeIn>
          <FadeIn delay={0.7} distance={0}>
            <p className="mt-4 text-xs text-muted-foreground">Free forever for 1 repo · No credit card required</p>
          </FadeIn>
        </div>
      </HeroBackground>
      <div className={cn(CONTAINER, "relative")}>
        <FadeIn delay={0.5} distance={40} scale={0.98}>
          <FeatureTabs />
        </FadeIn>
      </div>
    </section>
  )
}

function TrustedBy() {
  return (
    <section aria-label="Trusted by" className="py-16 sm:py-20">
      <div className={CONTAINER}>
        <p className="text-center text-sm text-muted-foreground">Trusted by fast-moving engineering teams</p>
        <Marquee duration={36} gap={56} className="mt-8">
          {COMPANIES.map((c) => (
            <span
              key={c.name}
              className={cn("whitespace-nowrap text-xl text-foreground/45 transition-colors hover:text-foreground sm:text-2xl", c.className)}
            >
              {c.name}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

function BentoCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex h-full flex-col gap-5 rounded-3xl border bg-card/60 p-4 sm:p-6", className)}>
      <div className="px-1">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-24 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Features"
          title="Your AI partner for every commit"
          description="From the first clone to the final merge, Forge works alongside you in the terminal, the editor and the pull request."
        />
        <div className="mt-14 grid gap-4 lg:grid-cols-5">
          <FadeIn className="h-full min-w-0 lg:col-span-3" delay={0} distance={24}>
            <BentoCard
              title="Clone and go"
              description="Point Forge at any repository. It clones, indexes and learns your conventions in seconds."
            >
              <Terminal />
            </BentoCard>
          </FadeIn>
          <FadeIn className="h-full min-w-0 lg:col-span-2" delay={0.08} distance={24}>
            <BentoCard
              title="Suggestions as diffs"
              description="Every change is a reviewable diff. Apply it with one click, or undo it just as fast."
            >
              <CodeDiff />
            </BentoCard>
          </FadeIn>
          <FadeIn className="h-full min-w-0 lg:col-span-2" delay={0.16} distance={24}>
            <BentoCard
              title="MCP servers, one click"
              description="Give Forge context from the tools your team already uses."
            >
              <McpServers />
            </BentoCard>
          </FadeIn>
          <FadeIn className="h-full min-w-0 lg:col-span-3" delay={0.24} distance={24}>
            <BentoCard
              title="Parallel agents"
              description="A planner, a coder and a reviewer work at the same time, so features land in minutes, not days."
            >
              <AgentsPanel />
            </BentoCard>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

function Scale() {
  return (
    <section id="integrations" className="scroll-mt-24 border-y bg-card/30 py-24 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Scale"
          title="Built for teams scaling at warp speed"
          description="From two-person startups to global engineering orgs, Forge plugs into your stack and scales with every commit."
        />
        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
          <Stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border bg-border" itemClassName="bg-background" stagger={0.08}>
            {STATS.map((s) => (
              <div key={s.label} className="flex h-full flex-col gap-2 p-5 sm:p-8">
                <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                  <NumberTicker value={s.value} decimals={s.decimals ?? 0} />
                  <span style={{ color: ACCENT }}>{s.suffix}</span>
                </span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </Stagger>
          <FadeIn scale={0.94} distance={0}>
            <Integrations />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

function Setup() {
  return (
    <section id="docs" className="scroll-mt-24 py-24 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="How it works"
          title="Setup. Connect. Build. Ship."
          description="Go from sign-up to your first AI-authored pull request in under five minutes."
        />
        <FadeIn className="mt-14" distance={24}>
          <SetupSteps />
        </FadeIn>
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="py-24 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Testimonials"
          title="Hear from our developer community"
          description="Thousands of engineers ship with Forge every day. Here is what a few of them have to say."
        />
        <FadeIn className="mt-14" distance={24}>
          <TweetGrid tweets={TWEETS} columns={3} scroll speed={0.8} height={640} />
        </FadeIn>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-24 sm:py-28">
      <div className={cn(CONTAINER, "max-w-3xl")}>
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you need to know about Forge. Can't find what you're looking for? Talk to our team."
        />
        <FadeIn className="mt-12" distance={20}>
          <Accordion defaultValue={["faq-0"]} className="rounded-3xl border bg-card/60 px-5 sm:px-7">
            {FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="py-5 text-[15px] hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="pb-5 leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  )
}

function FinalCta() {
  const lenis = useLenis()
  const toPricing = () => {
    if (lenis) lenis.scrollTo("#pricing", { offset: -24 })
    else document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }
  return (
    <section id="get-started" className="scroll-mt-24 pb-24 pt-8 sm:pb-28">
      <div className={CONTAINER}>
        <FadeIn distance={24}>
          <HeroBackground
            variant="dots"
            mask="radial"
            opacity={0.3}
            className="rounded-3xl border bg-card/60 px-6 py-16 text-center sm:py-24"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -bottom-1/2 -z-10 mx-auto h-full max-w-2xl rounded-full opacity-50 blur-3xl"
              style={{ background: `radial-gradient(closest-side, ${ACCENT}55, transparent)` }}
            />
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <Eyebrow>Get started</Eyebrow>
              <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
                Ship your next feature 10x faster with Forge
              </h2>
              <p className="mt-4 max-w-md text-pretty text-muted-foreground">
                Join 48,000 developers who let Forge handle the busywork while they focus on what matters.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <ShineButton beamColor={ACCENT} onClick={toPricing}>
                  Start for free <ArrowRight className="size-4" />
                </ShineButton>
                <a
                  href="#faq"
                  className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-11 rounded-full px-5 text-sm")}
                >
                  Talk to sales
                </a>
              </div>
            </div>
          </HeroBackground>
        </FadeIn>
      </div>
    </section>
  )
}
