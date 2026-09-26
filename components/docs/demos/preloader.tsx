"use client"

import { as, type DemoMap } from "@/components/docs/demo-utils"
import { Preloader, type PreloaderProps } from "@/registry/new-york/preloader/preloader"

export const preloaderDemos: DemoMap = {
  preloader: ({ values }) => (
    <div className="relative grid h-full w-full self-stretch justify-self-stretch place-items-center overflow-hidden rounded-[inherit]">
      <Preloader {...as<PreloaderProps>(values)} position="absolute">
        <div className="text-center">
          <p className="text-3xl font-semibold tracking-tight">Welcome in.</p>
          <p className="mt-2 text-sm text-muted-foreground">Press replay to watch it again.</p>
        </div>
      </Preloader>
    </div>
  ),
}
