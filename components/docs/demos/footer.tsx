"use client"

import { useState } from "react"
import { as, type DemoMap, type DemoProps } from "@/components/docs/demo-utils"
import { Footer, type FooterColumn, type FooterProps, type FooterSocial } from "@/registry/new-york/footer/footer"

const COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Integrations", href: "#integrations" },
      { label: "Changelog", href: "#changelog", badge: "New" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#careers", badge: "Hiring" },
      { label: "Press", href: "#press" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "#docs" },
      { label: "Guides", href: "#guides" },
      { label: "Blog", href: "#blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
      { label: "Licenses", href: "#licenses" },
    ],
  },
]

const SOCIALS: FooterSocial[] = [
  { label: "GitHub", href: "https://github.com" },
  { label: "X", href: "https://x.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Dribbble", href: "https://dribbble.com" },
]

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Mock page content that scrolls away to uncover the footer. */
function FakePage() {
  return (
    <>
      <section className="mx-auto max-w-2xl px-6 pb-16 pt-20 text-center">
        <p className="text-xs text-muted-foreground">Scroll inside the preview ↓</p>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          The page ends. The footer begins.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-balance text-sm leading-relaxed text-muted-foreground">
          Keep scrolling to reveal the footer. Switch variants in the controls to compare the reveals.
        </p>
      </section>
      <div className="mx-auto grid max-w-3xl gap-3 px-6 pb-16">
        <div className="h-56 rounded-3xl border bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2 rounded-2xl border bg-card p-4">
              <div className="size-7 rounded-lg bg-muted" />
              <div className="h-2.5 w-3/4 rounded-full bg-muted" />
              <div className="h-2.5 w-1/2 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-2xl font-semibold tracking-tight">Ready when you are.</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          A final section before the footer, so the reveal has something to slide out from under.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="h-36 rounded-3xl border bg-card" />
          <div className="h-36 rounded-3xl border bg-muted/60" />
        </div>
      </section>
    </>
  )
}

function FooterDemo({ values }: DemoProps) {
  // Same stage as ScrollStage, but the footer is the last thing in it (no trailing spacer)
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)

  return (
    <div
      ref={setScroller}
      className="mc-scroll h-full w-full self-stretch justify-self-stretch overflow-y-auto bg-background [container-type:size]"
    >
      {/* The page sits above the footer (z-index) so the sticky reveal slides out from under it */}
      <div className="relative z-10 bg-background text-foreground">
        <FakePage />
      </div>
      {scroller && (
        <Footer
          {...as<Omit<FooterProps, "columns" | "socials">>(values)}
          columns={COLUMNS}
          socials={SOCIALS}
          cta={{ label: "Start a project", href: "#start" }}
          onSubscribe={() => wait(900)}
          scroller={scroller}
        />
      )}
    </div>
  )
}

export const footerDemos: DemoMap = {
  footer: FooterDemo,
}
