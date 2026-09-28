"use client"

import { useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { ArrowUpRight } from "lucide-react"
import { demos } from "@/components/docs/demos"
import { getComponent, initialValues } from "@/lib/docs"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const SLUGS = ["text-reveal", "fill-button", "tilt-card", "ripple-button", "loader", "download-button", "stamp-card", "number-ticker"]

const items = SLUGS.map((slug) => ({ slug, doc: getComponent(slug), Demo: demos[slug] })).filter(
  (item): item is { slug: string; doc: NonNullable<ReturnType<typeof getComponent>>; Demo: (typeof demos)[string] } =>
    Boolean(item.doc && item.Demo)
)

/**
 * Vertical scroll drives a horizontal track of live demos. Cards lean into the
 * scroll velocity and settle back, so the track feels pushed rather than slid.
 */
export function Catalogue({ total }: { total: number }) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track) return
      const mm = gsap.matchMedia()

      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const distance = () => track.scrollWidth - window.innerWidth
        const cards = gsap.utils.toArray<HTMLElement>("[data-card]", track)
        const lean = cards.map((card) => gsap.quickTo(card, "skewX", { duration: 0.6, ease: "power3.out" }))

        const slide = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const v = gsap.utils.clamp(-8, 8, self.getVelocity() / -350)
              lean.forEach((to) => to(v))
            },
            onScrubComplete: () => lean.forEach((to) => to(0)),
          },
        })

        // Giant background word drifts slower and the opposite way
        gsap.fromTo(
          wordRef.current,
          { xPercent: 10 },
          {
            xPercent: -35,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top top", end: () => `+=${distance()}`, scrub: 1.2, invalidateOnRefresh: true },
          }
        )

        // Each demo stage lifts in as it enters from the right
        cards.forEach((card) => {
          gsap.fromTo(
            card.querySelector("[data-stage]"),
            { scale: 0.88, opacity: 0.4 },
            {
              scale: 1,
              opacity: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                containerAnimation: slide,
                start: "left 95%",
                end: "left 55%",
                scrub: true,
              },
            }
          )
        })
      })

      return () => mm.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="relative overflow-hidden md:h-dvh">
      <div
        ref={wordRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 hidden -translate-y-1/2 whitespace-nowrap font-[family-name:var(--font-display)] text-[34vh] uppercase leading-none text-transparent [-webkit-text-stroke:1px_var(--border)] md:block"
      >
        Tap · Drag · Scroll · Hover · Hold
      </div>

      <div
        ref={trackRef}
        className="relative flex h-full snap-x snap-mandatory items-center gap-5 overflow-x-auto px-6 py-24 md:snap-none md:overflow-visible md:px-12 md:py-0"
      >
        <div className="flex w-[min(80vw,420px)] shrink-0 flex-col justify-center md:w-[34vw]">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">The catalogue</p>
          <h2 className="mt-4 text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
            {total} components.
            <br />
            <span className="text-muted-foreground">Zero packages.</span>
          </h2>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Everything on this rail is running live. Poke it. Then copy the source straight into your project.
          </p>
        </div>

        {items.map(({ slug, doc, Demo }, i) => (
          <article
            key={slug}
            data-card
            className="group relative flex h-[min(68vh,560px)] w-[min(82vw,400px)] shrink-0 snap-center flex-col overflow-hidden rounded-[28px] border bg-card/70 backdrop-blur-sm"
          >
            <header className="flex items-center justify-between px-5 pt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>{doc.category}</span>
              <span>{String(i + 1).padStart(2, "0")}</span>
            </header>
            <div data-stage className="relative m-3 grid flex-1 place-items-center overflow-hidden rounded-[20px] bg-stage">
              <Demo values={initialValues(doc)} />
            </div>
            <Link
              href={`/docs/components/${slug}`}
              className="flex items-center justify-between px-5 pb-5 pt-2 text-[15px] font-medium tracking-tight"
            >
              {doc.name}
              <span className="grid size-8 place-items-center rounded-full border transition-colors group-hover:bg-foreground group-hover:text-background">
                <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
          </article>
        ))}

        <Link
          href="/docs/components/fade-in"
          className="group flex h-[min(68vh,560px)] w-[min(70vw,320px)] shrink-0 snap-center flex-col justify-end rounded-[28px] border border-dashed p-6 transition-colors hover:border-brand"
        >
          <span className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.04em]">
            +{Math.max(total - items.length, 0)} more
          </span>
          <span className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground">
            Browse the full library
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </Link>
        <div className="w-1 shrink-0 md:w-[8vw]" />
      </div>
    </section>
  )
}
