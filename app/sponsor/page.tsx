import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { features } from "@/lib/features"
import { Heart, ShieldCheck } from "lucide-react"
import { SponsorPlans } from "@/components/site/sponsor-plans"
import { components, siteConfig } from "@/lib/docs"
import { sponsors } from "@/lib/sponsor"

export const metadata: Metadata = {
  title: "Sponsor",
  description: `Sponsor ${siteConfig.name} and help keep the component library free and growing.`,
  alternates: { canonical: "/sponsor" },
}

export default function SponsorPage() {
  if (!features.sponsors) notFound()
  const companies = sponsors.filter((s) => s.tier === "company")
  const people = sponsors.filter((s) => s.tier !== "company")

  return (
    <div className="mc-scroll flex-1 rounded-3xl border bg-panel lg:overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-14 sm:pt-20">
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand/12 text-brand">
            <Heart className="size-5 fill-current" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Sponsor tweenly</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {components.length} animated components, free and open source. Sponsorship pays for the time and hosting
            behind every new component, and keeps it all free.
          </p>
        </div>

        <div className="mt-12">
          <SponsorPlans />
        </div>

        <section className="mt-16">
          <h2 className="text-center text-lg font-semibold tracking-tight">Sponsors</h2>
          {sponsors.length === 0 ? (
            <p className="mt-3 text-center text-[14px] text-muted-foreground">
              No sponsors yet. Yours could be the first name here.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {companies.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {companies.map((s) => (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer sponsored"
                      className="flex h-16 items-center gap-3 rounded-2xl border bg-inset px-5 text-[15px] font-semibold transition-colors hover:border-brand/40"
                    >
                      {s.logo && <Image src={s.logo} alt="" width={112} height={28} className="h-7 w-auto" />}
                      {s.name}
                    </a>
                  ))}
                </div>
              )}
              {people.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {people.map((s) => (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border bg-inset px-3 py-1 text-[13px] transition-colors hover:text-brand"
                    >
                      {s.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <p className="mt-16 flex items-center justify-center gap-2 text-center text-[12.5px] text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Payments are processed securely by Dodo Payments. Monthly sponsorships can be cancelled anytime.
        </p>
      </div>
    </div>
  )
}
