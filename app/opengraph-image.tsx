import { ImageResponse } from "next/og"
import { categories, components, siteConfig } from "@/lib/docs"
import { og, OG_SIZE, OgChip, OgFrame, OgWordmark } from "@/lib/og"

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`
export const size = OG_SIZE
export const contentType = "image/png"

export default function Image() {
  const chips = categories.slice(0, 6)
  return new ImageResponse(
    (
      <OgFrame glow={{ x: 980, y: 90 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "76px 88px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <OgWordmark size={44} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, color: og.muted }}>
              <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, background: og.accent }} />
              {`${components.length} animated components`}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", fontSize: 92, lineHeight: 1.02, letterSpacing: "-0.045em", maxWidth: 900 }}>
              {siteConfig.tagline}
            </div>
            <div style={{ display: "flex", fontSize: 28, lineHeight: 1.4, color: og.muted, maxWidth: 820 }}>
              {siteConfig.description}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {chips.map((c, i) => (
              <OgChip key={c} active={i === 0}>
                {c}
              </OgChip>
            ))}
            <OgChip>{`+${categories.length - chips.length} more`}</OgChip>
          </div>
        </div>
      </OgFrame>
    ),
    size,
  )
}
