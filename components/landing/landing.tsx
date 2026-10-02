"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { ArrowRight, ArrowUpRight, Compass } from "lucide-react"
import { CopyButton } from "@/components/docs/copy-button"
import { Logo } from "@/components/docs/sidebar"
import { ThemeToggle } from "@/components/docs/theme-toggle"
import { Bento } from "./bento"
import { Catalogue } from "./catalogue"
import { InstallTerminal } from "./install-terminal"
import { OnionSkin } from "./onion-skin"
import { ShaderGradient } from "./shader-gradient"
import { SmoothScroll } from "./smooth-scroll"
import { categories, components, githubUrl, siteConfig } from "@/lib/docs"
import { track } from "@/lib/analytics"
import { features } from "@/lib/features"
import { LogoMark } from "@/components/site/logo-mark"
import { GithubStars } from "@/components/site/github-stars"
import { TOUR_HOME } from "@/lib/tour"
import { NewsletterForm } from "@/components/site/newsletter-form"
import { CommandMenu, SearchTrigger } from "@/components/docs/command-menu"
import { Preloader, type PreloaderQuote } from "@/registry/new-york/preloader/preloader"
import { Magnetic } from "@/registry/new-york/magnetic/magnetic"
import { Marquee } from "@/registry/new-york/marquee/marquee"
import { FadeIn } from "@/registry/new-york/fade-in/fade-in"
import { Footer } from "@/registry/new-york/footer/footer"

gsap.registerPlugin(useGSAP, ScrollTrigger)

// One of these plays per visit, picked at random
const QUOTES: PreloaderQuote[] = [
  { text: "Motion is the language of change.", author: "tweenly" },
  { text: "Details are not the details. They make the design.", author: "Charles Eames" },
  { text: "Good design is as little design as possible.", author: "Dieter Rams" },
  { text: "Animation is not the art of drawings that move but the art of movements that are drawn.", author: "Norman McLaren" },
  { text: "Design is not just what it looks like. Design is how it works.", author: "Steve Jobs" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "What happens between each frame is more important than what exists on each frame.", author: "Norman McLaren" },
  { text: "The details are not the details. They are the product.", author: "tweenly" },
  { text: "Make it work, make it right, make it move.", author: "tweenly" },
]

export function Landing() {
  const [ready, setReady] = useState(false)
  const [quote, setQuote] = useState<PreloaderQuote[]>([])

  // Picked after mount so the server and client render the same markup
  useEffect(() => {
    const id = requestAnimationFrame(() => setQuote([QUOTES[Math.floor(Math.random() * QUOTES.length)]]))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (ready) ScrollTrigger.refresh()
  }, [ready])

  return (
    <Preloader quotes={quote} duration={2.6} onComplete={() => setReady(true)}>
      <SmoothScroll enabled={ready} />
      <div className="relative z-10 overflow-x-clip bg-background">
        <Header ready={ready} />
        <Hero ready={ready} />
        <ComponentMarquee />
        <OnionSkin />
        <Catalogue total={components.length} />
        <section className="mx-auto max-w-6xl px-6 pb-32">
          <SectionHeading eyebrow="Playground" title="Touch everything." description="Type a code, flip a switch, hover a chart. Nothing here is a screenshot." />
          <FadeIn distance={40} blur={10}>
            <Bento />
          </FadeIn>
        </section>
        <Install />
        <FinalCta ready={ready} />
      </div>
      <Footer
        variant="sticky-reveal"
        brand="tweenly"
        logo={<LogoMark tile={false} className="size-5" />}
        description="Animated React components you install with the shadcn CLI and own forever."
        columns={[
          {
            title: "Library",
            links: [
              { label: "Components", href: "/docs/components/fade-in" },
              { label: "Installation", href: "/docs/installation" },
              { label: "Changelog", href: "/changelog", badge: "New" },
              ...(features.sponsors ? [{ label: "Sponsor", href: "/sponsor" }] : []),
            ],
          },
          {
            title: "Popular",
            links: [
              { label: "Text Reveal", href: "/docs/components/text-reveal" },
              { label: "Charts", href: "/docs/components/chart-line" },
              { label: "Preloader", href: "/docs/components/preloader" },
            ],
          },
          {
            title: "Resources",
            links: [
              { label: "Docs", href: "/docs" },
              { label: "llms.txt", href: "/llms.txt" },
              { label: "GitHub", href: githubUrl },
            ],
          },
        ]}
        socials={[
          { label: "GitHub", href: githubUrl },
          { label: "X", href: "https://x.com/MIrukulla" },
          { label: "LinkedIn", href: "https://www.linkedin.com/in/irumanjunath/" },
        ]}
        newsletter={false}
        cta={{ label: "Start building", href: "/docs/components/fade-in" }}
        copyright="tweenly. MIT licensed."
        legal={[]}
      />
      <CommandMenu />
    </Preloader>
  )
}

function Header({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!ready) return
      gsap.fromTo(ref.current, { yPercent: -140, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, ease: "expo.out", delay: 0.5 })
    },
    { dependencies: [ready] }
  )

  return (
    <header ref={ref} className="fixed inset-x-0 top-0 z-50" style={{ transform: "translateY(-140%)" }}>
      <div className="mx-auto mt-3 flex h-12 max-w-6xl items-center justify-between rounded-full border bg-background/60 pl-4 pr-1.5 backdrop-blur-xl sm:mx-6 xl:mx-auto">
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

const HEADLINE = ["Motion for", "the in-between."]

function SplitLine({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`block overflow-hidden pb-[0.08em] ${className ?? ""}`} aria-hidden="true">
      {text.split(" ").map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {Array.from(word).map((c, ci) => (
            <span key={ci} data-char className="inline-block will-change-transform" style={{ transform: "translateY(110%)" }}>
              {c}
            </span>
          ))}
          {wi < text.split(" ").length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  )
}

function Hero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const command = "npx shadcn@latest add @tweenly/text-reveal"

  useGSAP(
    () => {
      if (!ready) return
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const chars = gsap.utils.toArray<HTMLElement>("[data-char]")

      if (reduced) {
        gsap.set(chars, { yPercent: 0, y: 0 })
        gsap.set("[data-hero-fade]", { opacity: 1, y: 0 })
        return
      }

      // Intro: letters rise with a little rotation and random lag, like they were thrown
      gsap
        .timeline({ delay: 0.15 })
        .fromTo(
          chars,
          { yPercent: 110, y: 0, rotate: 8 },
          { yPercent: 0, rotate: 0, duration: 1.5, ease: "expo.out", stagger: { each: 0.028, from: "start" } }
        )
        .fromTo("[data-hero-fade]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 }, "-=1.05")

      // Scroll out: every letter drifts at its own speed and dissolves
      const drift = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: 0.6 },
      })
      chars.forEach((c, i) => {
        drift.to(
          c,
          {
            y: () => -gsap.utils.random(80, 320),
            rotate: () => gsap.utils.random(-18, 18),
            opacity: 0,
            filter: "blur(10px)",
            ease: "power2.in",
            duration: 1,
          },
          (i % 7) * 0.04
        )
      })
      drift.to("[data-hero-fade]", { opacity: 0, y: -60, ease: "power1.in", duration: 0.6 }, 0)
    },
    { scope: ref, dependencies: [ready] }
  )

  return (
    <section ref={ref} className="relative flex min-h-dvh flex-col justify-end overflow-hidden px-6 pb-10 pt-32 sm:px-12">
      <ShaderGradient visible={ready} />
      <div className="relative mx-auto w-full max-w-6xl">
        <Link
          href="/docs"
          data-hero-fade
          className="group inline-flex items-center gap-2 rounded-full border bg-background/40 py-1 pl-1 pr-3 text-[12.5px] text-muted-foreground opacity-0 backdrop-blur-md transition-colors hover:text-foreground"
        >
          <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">New</span>
          Now in the shadcn registry directory
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <h1
          aria-label={HEADLINE.join(" ")}
          className="mt-6 text-[clamp(3.25rem,11.5vw,11rem)] font-semibold leading-[0.86] tracking-[-0.06em]"
        >
          <SplitLine text={HEADLINE[0]} />
          <SplitLine text={HEADLINE[1]} />
        </h1>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div data-hero-fade className="opacity-0">
            <p className="max-w-md text-balance text-[16px] leading-relaxed text-foreground/75">
              {components.length} animated React components across {categories.length} categories. Built on Motion and GSAP,
              installed with the shadcn CLI, owned by you.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Magnetic strength={0.25}>
                <Link
                  href="/docs/components/fade-in"
                  className="group flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background"
                >
                  Browse components
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Magnetic>
              <Link
                href={TOUR_HOME}
                className="group inline-flex h-12 items-center gap-1.5 rounded-full border bg-background/40 px-5 text-[13.5px] backdrop-blur-md transition-colors hover:bg-background/70"
              >
                <Compass className="size-3.5 text-brand transition-transform duration-500 group-hover:rotate-[135deg]" />
                30-second tour
              </Link>
            </div>
          </div>

          <div data-hero-fade className="flex h-12 items-center gap-2 rounded-full border bg-background/40 pl-4 pr-1.5 opacity-0 backdrop-blur-md">
            <code className="max-w-[260px] truncate font-mono text-[12.5px] text-foreground/70 sm:max-w-[360px]">
              <span className="select-none opacity-50">$ </span>
              {command}
            </code>
            <CopyButton value={command} onCopy={() => track("copy_hero_install")} className="size-9 rounded-full" />
          </div>
        </div>

        <div data-hero-fade className="mt-12 flex items-center justify-between border-t border-foreground/10 pt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/60 opacity-0">
          <span className="flex items-center gap-3">
            <span className="relative block h-6 w-px overflow-hidden bg-foreground/15">
              <span className="absolute inset-x-0 top-0 h-2 animate-[scroll-cue_1.8s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-foreground" />
            </span>
            Scroll
          </span>
          <span className="hidden sm:block">Copy · Paste · Own</span>
          <span>MIT · {siteConfig.name}</span>
        </div>
      </div>
    </section>
  )
}

function ComponentMarquee() {
  return (
    <div className="border-y py-6">
      <Marquee duration={70} gap={48}>
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
    <FadeIn blur={6} distance={16} className="mb-14 pt-32">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.9] tracking-[-0.05em]">{title}</h2>
        {description && <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground md:text-right">{description}</p>}
      </div>
    </FadeIn>
  )
}

function Install() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-6 pb-32">
        <SectionHeading
          eyebrow="Install"
          title="Ship it your way."
          description="From your terminal, from your agent, or by hand. Every path ends with plain source code in your repo."
        />
        <FadeIn distance={32} blur={8}>
          <InstallTerminal />
        </FadeIn>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["0", "runtime packages", "Components are files you own, not a dependency you update."],
            ["1", "command", "No components.json edits. tweenly is in the shadcn registry directory."],
            ["llms.txt", "for agents", "Every prop and usage example, in plain text for any model."],
          ].map(([value, label, body]) => (
            <div key={label} className="rounded-2xl border bg-card/40 p-5">
              <dt className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">{value}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
              </dt>
              <dd className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function FinalCta({ ready }: { ready: boolean }) {
  return (
    <section className="px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="relative isolate overflow-hidden rounded-[32px] border">
        <ShaderGradient visible={ready} seed={7.3} speed={0.8} />
        <FadeIn blur={10} distance={32} className="relative flex flex-col items-center px-6 py-36 text-center">
          <h2 className="text-[clamp(3rem,10vw,9rem)] font-semibold leading-[0.85] tracking-[-0.06em]">
            Make it
            <br />
            move.
          </h2>
          <Magnetic strength={0.3}>
            <Link
              href="/docs/components/fade-in"
              className="group mt-12 flex h-14 items-center gap-2 rounded-full bg-foreground px-8 text-[15px] font-medium text-background"
            >
              Start building
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Magnetic>
          <div className="mt-16 w-full max-w-md rounded-3xl border bg-background/50 p-5 text-left backdrop-blur-xl">
            <NewsletterForm source="landing" />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
