import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Bento } from "@/components/landing/bento"
import { AnimationLab } from "@/components/playground/animation-lab"
import { EasingEditor } from "@/components/playground/easing-editor"
import { SpringExplorer } from "@/components/playground/spring-explorer"
import { StaggerGrid } from "@/components/playground/stagger-grid"
import { Panel } from "@/components/playground/ui"

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Play with animation itself: presets, easing curves, springs and staggers, with live previews and copy-ready Motion, GSAP and CSS code.",
  alternates: { canonical: "/playground" },
}

const SECTIONS = [
  { id: "lab", label: "Animation lab" },
  { id: "easing", label: "Easing editor" },
  { id: "springs", label: "Spring explorer" },
  { id: "stagger", label: "Stagger" },
  { id: "sandbox", label: "Component sandbox" },
]

export default function PlaygroundPage() {
  return (
    <div className="mc-scroll flex-1 rounded-3xl border bg-panel motion-safe:scroll-smooth lg:overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Playground</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Tune timing, curves and springs by hand, watch the result, then copy the code for Motion, GSAP or CSS.
          </p>
          <nav aria-label="Playground sections" className="mt-6 flex flex-wrap gap-1.5">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border bg-panel px-3 py-1 text-[13px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </header>

        <div className="mt-14 space-y-16">
          <Panel
            id="lab"
            index="01"
            title="Animation lab"
            description="Pick a preset, shape its timing and stagger, and get the same animation in three libraries."
          >
            <AnimationLab />
          </Panel>

          <Panel
            id="easing"
            index="02"
            title="Easing editor"
            description="Drag the control points of a cubic-bezier and feel the difference against linear."
          >
            <EasingEditor />
          </Panel>

          <Panel
            id="springs"
            index="03"
            title="Spring explorer"
            description="Stiffness, damping and mass, simulated in your browser. Fling the ball to feel it."
          >
            <SpringExplorer />
          </Panel>

          <Panel
            id="stagger"
            index="04"
            title="Stagger"
            description="Ripple a grid from the center, the edges, a corner or a seeded random order."
          >
            <StaggerGrid />
          </Panel>

          <section id="sandbox" aria-labelledby="sandbox-title" className="scroll-mt-6 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11.5px] text-muted-foreground">05</span>
                <div>
                  <h2 id="sandbox-title" className="text-lg font-semibold tracking-tight">
                    Touch everything
                  </h2>
                  <p className="mt-1 text-[14px] leading-6 text-muted-foreground">
                    Real tweenly components, live. Type, toggle, hold and slide.
                  </p>
                </div>
              </div>
              <Link
                href="/docs"
                className="group inline-flex items-center gap-1 rounded-full border bg-panel px-3 py-1 text-[13px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
              >
                Browse all components
                <ArrowUpRight className="size-3 transition group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-brand" />
              </Link>
            </div>
            <Bento />
          </section>
        </div>
      </div>
    </div>
  )
}
