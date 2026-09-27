"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, type Variants } from "motion/react"
import { ArrowRight, ArrowUpRight, Compass, Copy as CopyIcon, MousePointerClick, SlidersHorizontal } from "lucide-react"
import { CopyButton } from "@/components/docs/copy-button"
import { Logo } from "@/components/docs/sidebar"
import { ThemeToggle } from "@/components/docs/theme-toggle"
import { Showcase } from "@/components/docs/showcase"
import { Bento } from "./bento"
import { categories, components, githubUrl, siteConfig } from "@/lib/docs"
import { track } from "@/lib/analytics"
import { GithubStars } from "@/components/site/github-stars"
import { TOUR_HOME } from "@/lib/tour"
import { NewsletterForm } from "@/components/site/newsletter-form"
import { Preloader } from "@/registry/new-york/preloader/preloader"
import { WordRotate } from "@/registry/new-york/word-rotate/word-rotate"
import { FadeIn } from "@/registry/new-york/fade-in/fade-in"
import { Marquee } from "@/registry/new-york/marquee/marquee"

const QUOTES = [
  { text: "Motion is the language of change.", author: "tweenly" },
  { text: "Details are not the details. They make the design.", author: "Charles Eames" },
  { text: "Good design is as little design as possible.", author: "Dieter Rams" },
]

const EASE = [0.16, 1, 0.3, 1] as const

const rise: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE, delay: 0.1 + i * 0.08 },
  }),
}

export function Landing() {
  const [ready, setReady] = useState(false)
  const state = ready ? "visible" : "hidden"

  return (
    <Preloader quotes={QUOTES} duration={2.6} onComplete={() => setReady(true)}>
      <div className="min-h-dvh overflow-x-clip bg-background">
        <Header ready={ready} />
        <Hero state={state} />
        <ComponentMarquee />
        <section className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="New"
            title="Charts, inputs and controls."
            description="Everything below is live. Type a code, flip a switch, hover a chart."
          />
          <FadeIn distance={32} blur={8}>
            <Bento />
          </FadeIn>
        </section>
        <section className="mx-auto max-w-6xl px-6 pb-28">
          <SectionHeading eyebrow="Showcase" title="Built to be touched." />
          <FadeIn distance={32} blur={8}>
            <Showcase />
          </FadeIn>
        </section>
        <HowItWorks />
        <FinalCta />
        <Footer />
      </div>
    </Preloader>
  )
}

function Header({ ready }: { ready: boolean }) {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={ready ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: 0.8, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto mt-3 flex h-12 max-w-6xl items-center justify-between rounded-full border bg-background/70 pl-4 pr-1.5 backdrop-blur-xl sm:mx-6 xl:mx-auto">
        <Logo />
        <nav className="flex items-center gap-0.5 text-[13.5px]">
          <Link href="/docs" className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block">
            Docs
          </Link>
          <Link
            href="/docs/components/fade-in"
            className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Components
          </Link>
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
    </motion.header>
  )
}

function Hero({ state }: { state: "hidden" | "visible" }) {
  const command = `npx shadcn@latest add ${siteConfig.url}/r/text-reveal.json`

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6 pb-16 pt-32">
      {/* grid + glow */}
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_40%,#000_30%,transparent_80%)]" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[18%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={state === "visible" ? { opacity: 1, scale: [1, 1.08, 1], x: ["-50%", "-46%", "-50%"] } : undefined}
        transition={{ opacity: { duration: 1.2 }, scale: { duration: 12, repeat: Infinity, ease: "easeInOut" }, x: { duration: 12, repeat: Infinity, ease: "easeInOut" } }}
      />

      <motion.div initial="hidden" animate={state} className="relative flex max-w-4xl flex-col items-center text-center">
        <motion.div variants={rise} custom={0}>
          <Link
            href="/docs"
            className="group flex items-center gap-2 rounded-full border bg-background/60 py-1 pl-1 pr-3 text-[12.5px] text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <span className="rounded-full bg-brand px-2 py-0.5 font-medium text-white">New</span>
            {components.length} components across {categories.length} categories
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <h1 className="mt-8 text-[clamp(2.75rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
          <motion.span variants={rise} custom={1} className="block">
            Motion components
          </motion.span>
          <motion.span variants={rise} custom={2} className="block">
            <span className="text-muted-foreground">that feel </span>
            <WordRotate
              words={["alive.", "effortless.", "considered.", "yours."]}
              effect="blur"
              interval={2400}
              className="text-brand"
            />
          </motion.span>
        </h1>

        <motion.p variants={rise} custom={3} className="mt-7 max-w-xl text-balance text-[16px] leading-relaxed text-muted-foreground">
          {siteConfig.description} Built on Motion and GSAP, installed with the shadcn CLI.
        </motion.p>

        <motion.div variants={rise} custom={4} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/components/fade-in"
            className="group relative flex h-11 items-center gap-2 overflow-hidden rounded-full bg-foreground px-6 text-sm font-medium text-background"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            Browse components
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <div className="flex h-11 items-center gap-2 rounded-full border bg-background/60 pl-4 pr-1.5 backdrop-blur">
            <code className="max-w-[240px] truncate font-mono text-[12.5px] text-muted-foreground sm:max-w-none">
              <span className="select-none opacity-50">$ </span>
              {command}
            </code>
            <CopyButton value={command} onCopy={() => track("copy_hero_install")} className="size-8 rounded-full" />
          </div>
        </motion.div>

        <motion.div variants={rise} custom={4.5} className="mt-5">
          <Link
            href={TOUR_HOME}
            className="group inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Compass className="size-3.5 text-brand transition-transform duration-500 group-hover:rotate-[135deg]" />
            New here? Take the 30-second tour
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <motion.dl
          variants={rise}
          custom={5}
          className="mt-16 grid grid-cols-3 divide-x overflow-hidden rounded-2xl border bg-background/50 backdrop-blur"
        >
          {[
            [`${components.length}+`, "Components"],
            ["100%", "Copy & own"],
            ["0", "Runtime lock-in"],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-col-reverse px-6 py-4 sm:px-10">
              <dt className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{l}</dt>
              <dd className="text-2xl font-semibold tracking-tight tabular-nums">{v}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  )
}

function ComponentMarquee() {
  return (
    <div className="border-y py-5">
      <Marquee duration={60} gap={40}>
        {components.map((c) => (
          <Link
            key={c.slug}
            href={`/docs/components/${c.slug}`}
            className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="size-1 rounded-full bg-brand" />
            {c.name}
          </Link>
        ))}
      </Marquee>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <FadeIn blur={6} distance={16} className="mb-12 pt-28 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
      <h2 className="mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.035em]">{title}</h2>
      {description && <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{description}</p>}
    </FadeIn>
  )
}

const STEPS = [
  { icon: MousePointerClick, title: "Pick a component", body: "Every component has a live stage. Hover it, scroll it, break it." },
  { icon: SlidersHorizontal, title: "Tune it live", body: "Drag the controls. The usage snippet rewrites itself with only the props you changed." },
  { icon: CopyIcon, title: "Install and own it", body: "One shadcn command drops the source into your project. No package, no lock-in." },
]

function HowItWorks() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-6 pb-28">
        <SectionHeading eyebrow="How it works" title="From idea to shipped in a minute." />
        <div className="grid gap-3 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <FadeIn key={title} delay={i * 0.08} distance={20} blur={6}>
              <div className="group h-full rounded-3xl border bg-card p-7 transition-colors hover:bg-accent/40">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl border bg-background">
                    <Icon className="size-4" />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-10 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-64 max-w-3xl rounded-full bg-brand/15 blur-[100px]" />
      <FadeIn blur={8} distance={24} className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center">
        <h2 className="text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
          Make your interface
          <br />
          <span className="text-muted-foreground">move with intent.</span>
        </h2>
        <Link
          href="/docs/components/fade-in"
          className="group mt-10 flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background"
        >
          Start building
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
        <NewsletterForm source="landing" className="mt-16 text-left" />
      </FadeIn>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-[13px] text-muted-foreground sm:flex-row">
        <Logo />
        <p>Built with Motion, GSAP and the shadcn registry.</p>
        <div className="flex gap-5">
          <Link href="/docs" className="hover:text-foreground">Docs</Link>
          <Link href="/docs/installation" className="hover:text-foreground">Installation</Link>
          <Link href="/changelog" className="hover:text-foreground">Changelog</Link>
          <a href={githubUrl} target="_blank" rel="noreferrer" onClick={() => track("github_click", { from: "landing-footer" })} className="hover:text-foreground">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
