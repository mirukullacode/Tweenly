"use client"

import { as, type DemoMap } from "@/components/docs/demo-utils"
import { HeroBackground, type HeroBackgroundProps } from "@/registry/new-york/hero-background/hero-background"

export const heroBgDemos: DemoMap = {
  "hero-background": ({ values }) => {
    const props = as<HeroBackgroundProps>(values)
    return (
      <HeroBackground
        {...props}
        className="relative h-full w-full self-stretch justify-self-stretch overflow-hidden rounded-[inherit] text-foreground"
      >
        <div className="pointer-events-none relative flex h-full min-h-[420px] flex-col items-center justify-center gap-5 px-6 py-16 text-center">
          <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-[#ff4d12]" />
            Now in beta
          </span>
          <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Interfaces that feel alive
          </h2>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            Move your cursor across the background. Click to send a ripple.
          </p>
          <div className="pointer-events-auto flex gap-2">
            <button
              type="button"
              className="h-9 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Get started
            </button>
            <button
              type="button"
              className="h-9 rounded-full border bg-background/70 px-4 text-sm font-medium backdrop-blur transition-colors hover:bg-muted"
            >
              Learn more
            </button>
          </div>
        </div>
      </HeroBackground>
    )
  },
}
