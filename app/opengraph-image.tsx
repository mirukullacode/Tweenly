import { ImageResponse } from "next/og"
import { components, siteConfig } from "@/lib/docs"
import { og, OG_SIZE, OgFrame, OgOnionSkin, OgShadcnBadge, OgWordmark } from "@/lib/og"

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`
export const size = OG_SIZE
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <OgFrame glow={{ x: 1000, y: 330 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "72px 88px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <OgWordmark size={42} />
            <OgShadcnBadge size={19} />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", flexDirection: "column", fontSize: 104, lineHeight: 0.92, letterSpacing: "-0.055em" }}>
                <span>Motion for</span>
                <span>the in-between.</span>
              </div>
              <div style={{ display: "flex", fontSize: 27, color: og.muted }}>
                {`${components.length} animated React components. Copy, paste, own.`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 54,
                padding: "0 22px",
                borderRadius: 14,
                border: `1px solid ${og.line}`,
                background: "rgba(255,255,255,0.04)",
                fontSize: 22,
              }}
            >
              <div style={{ display: "flex", color: og.accent }}>$</div>
              npx shadcn add @tweenly/text-reveal
            </div>
            <OgOnionSkin width={400} box={64} />
          </div>
        </div>
      </OgFrame>
    ),
    size,
  )
}
