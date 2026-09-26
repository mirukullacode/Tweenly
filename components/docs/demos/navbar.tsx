"use client"

import { useState } from "react"
import { as, type DemoMap, type DemoProps } from "@/components/docs/demo-utils"
import { Navbar, type NavbarLink, type NavbarProps } from "@/registry/new-york/navbar/navbar"

const LINKS: NavbarLink[] = [
  {
    label: "Product",
    href: "#product",
    children: [
      { label: "Analytics", href: "#analytics", description: "Understand every interaction in real time." },
      { label: "Automations", href: "#automations", description: "Workflows that quietly run themselves." },
      { label: "Integrations", href: "#integrations", description: "Connect the tools you already use." },
      { label: "Security", href: "#security", description: "SSO, audit logs and granular roles." },
    ],
  },
  {
    label: "Solutions",
    href: "#solutions",
    children: [
      { label: "Startups", href: "#startups", description: "Move fast without the busywork." },
      { label: "Enterprise", href: "#enterprise", description: "Scale with governance built in." },
    ],
  },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
]

function NavbarDemo({ values }: DemoProps) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const [active, setActive] = useState("#product")

  return (
    // The transform makes fixed children (overlay, position="fixed") stay inside the preview
    <div className="relative h-full w-full self-stretch justify-self-stretch overflow-hidden [transform:translateZ(0)]">
      <div ref={setScroller} className="mc-scroll relative h-full overflow-y-auto bg-background text-foreground">
        {scroller && (
          <Navbar
            position="sticky"
            {...as<Omit<NavbarProps, "links">>(values)}
            links={LINKS}
            cta={{ label: "Get started", href: "#start" }}
            activeHref={active}
            scroller={scroller}
            onNavigate={(href, e) => {
              e.preventDefault()
              setActive(href)
            }}
          />
        )}

        <section className="mx-auto max-w-2xl px-6 pb-16 pt-20 text-center">
          <p className="text-xs text-muted-foreground">Scroll the page · hover the links</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Interfaces that feel quietly alive.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-balance text-sm leading-relaxed text-muted-foreground">
            A mock landing page so you can try the scroll morph, the hide-on-scroll behaviour and the menus.
          </p>
          <div className="mt-7 flex justify-center gap-2">
            <div className="h-9 w-28 rounded-full bg-foreground" />
            <div className="h-9 w-28 rounded-full border bg-muted" />
          </div>
        </section>

        <div className="mx-auto grid max-w-3xl gap-3 px-6 pb-24">
          <div className="h-64 rounded-3xl border bg-muted" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2 rounded-2xl border bg-card p-4">
                <div className="size-7 rounded-lg bg-muted" />
                <div className="h-2.5 w-3/4 rounded-full bg-muted" />
                <div className="h-2.5 w-1/2 rounded-full bg-muted" />
              </div>
            ))}
          </div>
          <div className="h-48 rounded-3xl border bg-muted/60" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-40 rounded-3xl border bg-card" />
            <div className="h-40 rounded-3xl border bg-card" />
          </div>
          <div className="h-72 rounded-3xl border bg-muted" />
        </div>
      </div>
    </div>
  )
}

export const navbarDemos: DemoMap = {
  navbar: NavbarDemo,
}
