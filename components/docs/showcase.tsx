"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { getComponent, initialValues } from "@/lib/docs"
import { cn } from "@/lib/utils"
import { demos } from "./demos"

const TILES = [
  { slug: "spotlight-card", className: "md:col-span-2" },
  { slug: "number-ticker", className: "" },
  { slug: "magnetic", className: "" },
  { slug: "word-rotate", className: "md:col-span-2" },
  { slug: "marquee", className: "md:col-span-3" },
]

export function Showcase() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {TILES.map(({ slug, className }) => {
        const doc = getComponent(slug)!
        const Demo = demos[slug]
        return (
          <div
            key={slug}
            className={cn("group relative flex h-72 flex-col overflow-hidden rounded-3xl border bg-stage", className)}
          >
            <div className="relative grid flex-1 place-items-center overflow-hidden">
              <Demo values={initialValues(doc)} />
            </div>
            <Link
              href={`/docs/components/${slug}`}
              className="flex items-center justify-between border-t px-5 py-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>
                <span className="font-medium text-foreground">{doc.name}</span>
                <span className="hidden sm:inline"> — {doc.description}</span>
              </span>
              <ArrowUpRight className="size-3.5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
