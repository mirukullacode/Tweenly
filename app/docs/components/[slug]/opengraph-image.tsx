import { ImageResponse } from "next/og"
import { components, getComponent, siteConfig } from "@/lib/docs"
import { og, OG_SIZE, OgFrame, OgMotif, OgShadcnBadge, OgWordmark, truncate } from "@/lib/og"

export const alt = `${siteConfig.name} component`
export const size = OG_SIZE
export const contentType = "image/png"

export function generateStaticParams() {
  return components.map((c) => ({ slug: c.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getComponent(slug)
  const name = doc?.name ?? siteConfig.name
  const description = truncate(doc?.description ?? siteConfig.description, 120)
  const nameSize = name.length <= 11 ? 104 : name.length <= 15 ? 88 : 72
  const command = `npx shadcn add @tweenly/${slug}`

  return new ImageResponse(
    (
      <OgFrame glow={{ x: 960, y: 315 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 760, padding: "76px 0 76px 88px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, color: og.accent, letterSpacing: "0.14em" }}>
            <div style={{ display: "flex", width: 28, height: 2, background: og.accent }} />
            {(doc?.category ?? "Components").toUpperCase()}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", fontSize: nameSize, lineHeight: 1, letterSpacing: "-0.045em" }}>{name}</div>
            <div style={{ display: "flex", fontSize: 28, lineHeight: 1.4, color: og.muted, maxWidth: 640 }}>{description}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 52,
                padding: "0 22px",
                borderRadius: 14,
                border: `1px solid ${og.line}`,
                background: "rgba(255,255,255,0.04)",
                fontSize: 21,
                color: og.fg,
              }}
            >
              <div style={{ display: "flex", color: og.accent }}>$</div>
              {command}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flex: 1, padding: "76px 88px 76px 0" }}>
          <OgWordmark size={36} />
          {doc ? <OgMotif category={doc.category} /> : <div style={{ display: "flex" }} />}
          <OgShadcnBadge size={17} />
        </div>
      </OgFrame>
    ),
    size,
  )
}
