import { ImageResponse } from "next/og"
import { OgLogo } from "@/lib/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <OgLogo size={120} />
      </div>
    ),
    size,
  )
}
