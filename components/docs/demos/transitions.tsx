"use client"

import { useState } from "react"
import { as, type DemoMap, type Values } from "@/components/docs/demo-utils"
import { cn } from "@/lib/utils"
import { PageLoader, type PageLoaderProps } from "@/registry/new-york/page-loader/page-loader"
import {
  PageTransitionProvider,
  TransitionLink,
  type PageTransitionProviderProps,
} from "@/registry/new-york/page-transition/page-transition"

const PAGES = {
  home: { title: "Home", caption: "Independent studio for motion-first interfaces.", bg: "#ededed", fg: "#0a0a0a" },
  work: { title: "Work", caption: "Selected projects, 2021 — 2026.", bg: "#ff4d12", fg: "#0a0a0a" },
  about: { title: "About", caption: "Small team. Big on details.", bg: "#161616", fg: "#ededed" },
} as const

type PageKey = keyof typeof PAGES
const KEYS = Object.keys(PAGES) as PageKey[]
const keyOf = (href: string) => (href.replace("#", "") in PAGES ? (href.replace("#", "") as PageKey) : "home")

function TransitionSite({ values }: { values: Values }) {
  const [page, setPage] = useState<PageKey>("home")
  const props = as<PageTransitionProviderProps>(values)
  const current = PAGES[page]
  const index = KEYS.indexOf(page) + 1

  return (
    <div className="relative h-full w-full self-stretch justify-self-stretch overflow-hidden rounded-[inherit] [container-type:size]">
      <PageTransitionProvider
        {...props}
        label={typeof props.label === "string" && props.label ? props.label : (href) => PAGES[keyOf(href)].title}
        position="absolute"
        navigate={(href) => setPage(keyOf(href))}
        className="h-full"
      >
        <div
          className="flex h-[100cqh] flex-col justify-between p-5 sm:p-8"
          style={{ background: current.bg, color: current.fg }}
        >
          <header className="flex items-center justify-between text-sm">
            <span className="font-semibold tracking-tight">
              studio<span style={{ color: page === "work" ? "#0a0a0a" : "#ff4d12" }}>.</span>
            </span>
            <nav className="flex gap-1">
              {KEYS.map((k) => (
                <TransitionLink
                  key={k}
                  href={`#${k}`}
                  aria-current={k === page ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1 transition-colors",
                    k === page ? "bg-current/10 font-medium" : "opacity-60 hover:opacity-100",
                  )}
                >
                  {PAGES[k].title}
                </TransitionLink>
              ))}
            </nav>
          </header>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
              0{index} / 0{KEYS.length}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(4rem,20cqw,11rem)] font-semibold uppercase leading-[0.82] tracking-[-0.01em]">
              {current.title}
            </h2>
            <div className="mt-4 flex items-end justify-between gap-6 text-sm">
              <p className="max-w-xs opacity-70">{current.caption}</p>
              <p className="hidden font-mono text-[11px] uppercase tracking-[0.2em] opacity-50 sm:block">Click the nav ↗</p>
            </div>
          </div>
        </div>
      </PageTransitionProvider>
    </div>
  )
}

export const transitionsDemos: DemoMap = {
  "page-loader": ({ values }) => (
    <div className="relative grid h-full w-full self-stretch justify-self-stretch place-items-center overflow-hidden rounded-[inherit]">
      <PageLoader {...as<PageLoaderProps>(values)} position="absolute">
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] text-6xl font-semibold uppercase leading-none tracking-tight">
            Welcome in
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Press replay to watch it again.</p>
        </div>
      </PageLoader>
    </div>
  ),
  "page-transition": ({ values }) => <TransitionSite values={values} />,
}
