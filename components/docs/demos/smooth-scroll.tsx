"use client"

import { useEffect, useState } from "react"
import { as, ScrollStage, type DemoMap } from "@/components/docs/demo-utils"
import { SmoothScroll, useLenis, type SmoothScrollProps } from "@/registry/new-york/smooth-scroll/smooth-scroll"

function Readout() {
  const lenis = useLenis()
  const [state, setState] = useState({ progress: 0, velocity: 0 })

  useEffect(() => {
    if (!lenis) return
    const onScroll = () => setState({ progress: lenis.progress, velocity: lenis.velocity })
    lenis.on("scroll", onScroll)
    return () => lenis.off("scroll", onScroll)
  }, [lenis])

  return (
    <div className="sticky top-4 z-10 mx-auto flex w-fit items-center gap-4 rounded-full border bg-panel/85 px-4 py-2 font-mono text-[11.5px] backdrop-blur">
      <span className={lenis ? "text-brand" : "text-muted-foreground"}>{lenis ? "Lenis on" : "Native scroll"}</span>
      <span>progress {(state.progress * 100).toFixed(0)}%</span>
      <span>velocity {state.velocity.toFixed(1)}</span>
    </div>
  )
}

export const smoothScrollDemos: DemoMap = {
  "smooth-scroll": ({ values }) => (
    <ScrollStage>
      {(scroller) => (
        <SmoothScroll {...as<SmoothScrollProps>(values)} wrapper={scroller}>
          <Readout />
          <div className="mx-auto max-w-xl space-y-6 px-6 py-10">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="rounded-2xl border bg-inset p-6">
                <p className="font-mono text-[11px] text-muted-foreground">0{i + 1}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight">Every scroll eases in and out.</p>
                <p className="mt-1 text-[13.5px] text-muted-foreground">
                  Flick the wheel and watch the velocity settle. Toggle enabled to compare with native scrolling.
                </p>
              </div>
            ))}
          </div>
        </SmoothScroll>
      )}
    </ScrollStage>
  ),
}
