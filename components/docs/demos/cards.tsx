"use client"

import { useState } from "react"
import { as, type DemoMap, type DemoProps } from "@/components/docs/demo-utils"
import { ProductCard, type ProductCardProps } from "@/registry/new-york/product-card/product-card"
import { StampCard, type StampCardProps, type StampCardVariant } from "@/registry/new-york/stamp-card/stamp-card"

const images = ["/gallery/01.jpg", "/gallery/02.jpg", "/gallery/03.jpg"]

const STAMPS: Record<StampCardVariant, Pick<StampCardProps, "image" | "title" | "value" | "caption">> = {
  classic: { image: "/gallery/04.jpg", title: "Western Ghats", value: "₹5", caption: "1968" },
  airmail: { image: "/gallery/05.jpg", title: "Par Avion", value: "50c", caption: "Air mail" },
  minimal: { image: "/gallery/06.jpg", title: "Spice Route", value: "₹12", caption: "Series II" },
}

function StampDemo({ values }: DemoProps) {
  const props = as<StampCardProps>(values)
  const featured = props.variant ?? "classic"
  const order = (["classic", "airmail", "minimal"] as const).filter((v) => v !== featured)
  const row: StampCardVariant[] = [order[0], featured, order[1]]
  const [marks, setMarks] = useState(() => row.map(() => props.defaultPostmarked ?? false))
  const all = marks.every(Boolean)
  const size = props.size ?? 180

  const postmarkAll = () => {
    const next = !all
    row.forEach((_, i) => {
      setTimeout(() => setMarks((m) => m.map((v, j) => (j === i ? next : v))), next ? i * 180 : 0)
    })
  }

  return (
    <div className="flex flex-col items-center gap-10 px-6">
      <div className="flex items-center justify-center gap-6">
        {row.map((variant, i) => {
          const center = i === 1
          return (
            <StampCard
              key={variant}
              {...props}
              {...STAMPS[variant]}
              {...(center ? { title: props.title, value: props.value, caption: props.caption } : {})}
              variant={variant}
              size={center ? size : Math.round(size * 0.86)}
              rotate={(props.rotate ?? 0) + (center ? 0 : i === 0 ? -5 : 4)}
              postmarked={marks[i]}
              onPostmark={(next) => setMarks((m) => m.map((v, j) => (j === i ? next : v)))}
            />
          )
        })}
      </div>
      <button
        type="button"
        onClick={postmarkAll}
        className="rounded-full border bg-card px-5 py-2 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent active:scale-[0.97]"
      >
        {all ? "Clear postmarks" : "Postmark"}
      </button>
    </div>
  )
}

export const cardsDemos: DemoMap = {
  "product-card": ({ values }) => {
    const props = as<ProductCardProps>(values)
    return (
      <ProductCard
        {...props}
        images={images}
        badges={["Best Seller"]}
        className="w-[300px]"
      />
    )
  },
  "stamp-card": (p) => <StampDemo {...p} />,
}
