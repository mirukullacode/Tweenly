/* Shared building blocks for the next/og share cards (Satori: every multi-child div needs display flex). */
import type { CSSProperties, ReactNode } from "react"
import type { Category } from "@/lib/docs-types"

export const OG_SIZE = { width: 1200, height: 630 }

export const og = {
  bg: "#0a0a0a",
  fg: "#ededed",
  muted: "#8a8a8a",
  accent: "#ff4d12",
  line: "rgba(255,255,255,0.08)",
  faint: "rgba(255,255,255,0.14)",
}

export function truncate(text: string, max: number) {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(" ")
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:-]+$/, "")}…`
}

/** Rounded square with two overlapping circles, matching the site logo. */
export function OgLogo({ size = 40 }: { size?: number }) {
  const dot = size / 2
  const shift = size / 8
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: size,
        height: size,
        borderRadius: size * 0.29,
        background: og.fg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: size / 4 + shift,
          top: size / 4 + shift,
          width: dot,
          height: dot,
          borderRadius: dot,
          background: og.accent,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: size / 4 - shift,
          top: size / 4 - shift,
          width: dot,
          height: dot,
          borderRadius: dot,
          background: og.bg,
          mixBlendMode: "difference",
        }}
      />
    </div>
  )
}

export function OgWordmark({ size = 40 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.35 }}>
      <OgLogo size={size} />
      <div style={{ display: "flex", fontSize: size * 0.8, color: og.fg, letterSpacing: "-0.03em" }}>tweenly</div>
    </div>
  )
}

/** Dark canvas with a dot grid, hairline frame and an orange glow. */
export function OgFrame({
  children,
  glow = { x: 900, y: 120 },
}: {
  children: ReactNode
  glow?: { x: number; y: number }
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        background: og.bg,
        color: og.fg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          display: "flex",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.09) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          // Kept inside the canvas: Satori clips gradients on boxes that overflow it
          backgroundImage: `radial-gradient(circle 440px at ${glow.x}px ${glow.y}px, rgba(255,77,18,0.30) 0%, rgba(255,77,18,0.08) 45%, rgba(10,10,10,0) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 28, left: 28, right: 28, bottom: 28,
          display: "flex",
          border: `1px solid ${og.line}`,
          borderRadius: 24,
        }}
      />
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>{children}</div>
    </div>
  )
}

export function OgChip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 40,
        padding: "0 18px",
        borderRadius: 999,
        border: `1px solid ${active ? "rgba(255,77,18,0.5)" : og.line}`,
        background: active ? "rgba(255,77,18,0.12)" : "rgba(255,255,255,0.03)",
        color: active ? og.accent : og.muted,
        fontSize: 20,
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ motifs */

const S = 340 // motif canvas size

const abs = (style: CSSProperties): CSSProperties => ({ position: "absolute", display: "flex", ...style })

function Canvas({ children }: { children: ReactNode }) {
  return <div style={{ position: "relative", display: "flex", width: S, height: S }}>{children}</div>
}

function TextMotif() {
  const widths = [300, 250, 280, 180]
  return (
    <Canvas>
      {widths.map((w, i) => (
        <div
          key={i}
          style={abs({
            left: 20,
            top: 80 + i * 50,
            width: w,
            height: 18,
            borderRadius: 9,
            background: i === 3 ? og.accent : `rgba(237,237,237,${0.5 - i * 0.12})`,
          })}
        />
      ))}
      <div style={abs({ left: 212, top: 226, width: 3, height: 34, background: og.fg, borderRadius: 2 })} />
    </Canvas>
  )
}

function ButtonsMotif() {
  return (
    <Canvas>
      <div
        style={abs({
          left: 30,
          top: 130,
          width: 280,
          height: 80,
          borderRadius: 40,
          border: `1px solid ${og.faint}`,
          overflow: "hidden",
        })}
      >
        <div style={abs({ left: 0, top: 0, width: 170, height: 80, background: og.accent, borderRadius: 40 })} />
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={abs({
            left: 170 - 40 - i * 28,
            top: 238,
            width: 10,
            height: 10,
            borderRadius: 5,
            background: `rgba(255,77,18,${0.6 - i * 0.2})`,
          })}
        />
      ))}
    </Canvas>
  )
}

function InteractiveMotif() {
  return (
    <Canvas>
      {[260, 190, 120].map((d, i) => (
        <div
          key={d}
          style={abs({
            left: (S - d) / 2,
            top: (S - d) / 2,
            width: d,
            height: d,
            borderRadius: d,
            border: `1px solid rgba(237,237,237,${0.1 + i * 0.08})`,
          })}
        />
      ))}
      <div style={abs({ left: 190, top: 120, width: 44, height: 44, borderRadius: 22, background: og.accent })} />
      <div style={abs({ left: 160, top: 160, width: 20, height: 20, borderRadius: 10, background: og.fg })} />
    </Canvas>
  )
}

function NavigationMotif() {
  const widths = [70, 90, 64]
  let x = 20
  return (
    <Canvas>
      <div style={abs({ left: 10, top: 130, width: 320, height: 76, borderRadius: 38, border: `1px solid ${og.faint}` })} />
      {widths.map((w, i) => {
        const left = x
        x += w + 16
        return (
          <div
            key={i}
            style={abs({
              left: left + 12,
              top: 146,
              width: w + 12,
              height: 44,
              borderRadius: 22,
              background: i === 1 ? "rgba(255,77,18,0.16)" : "transparent",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <div
              style={{
                display: "flex",
                width: w - 20,
                height: 10,
                borderRadius: 5,
                background: i === 1 ? og.accent : "rgba(237,237,237,0.35)",
              }}
            />
          </div>
        )
      })}
      <div style={abs({ left: 128, top: 222, width: 70, height: 3, borderRadius: 2, background: og.accent })} />
    </Canvas>
  )
}

function FormsMotif() {
  return (
    <Canvas>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          style={abs({
            left: 14 + i * 53,
            top: 136,
            width: 44,
            height: 64,
            borderRadius: 12,
            border: `1px solid ${i === 3 ? og.accent : og.faint}`,
            background: i === 3 ? "rgba(255,77,18,0.08)" : "rgba(255,255,255,0.02)",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          {i < 3 ? <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, background: og.fg }} /> : null}
          {i === 3 ? <div style={{ display: "flex", width: 2, height: 26, background: og.accent }} /> : null}
        </div>
      ))}
    </Canvas>
  )
}

function FeedbackMotif() {
  const n = 12
  const r = 110
  return (
    <Canvas>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2
        const size = 10 + (i / n) * 14
        const last = i === n - 1
        return (
          <div
            key={i}
            style={abs({
              left: S / 2 + Math.cos(a) * r - size / 2,
              top: S / 2 + Math.sin(a) * r - size / 2,
              width: size,
              height: size,
              borderRadius: size,
              background: last ? og.accent : `rgba(237,237,237,${0.08 + (i / n) * 0.6})`,
            })}
          />
        )
      })}
    </Canvas>
  )
}

function ChartsMotif() {
  const bars = [90, 150, 120, 200, 170, 250]
  return (
    <Canvas>
      {bars.map((h, i) => (
        <div
          key={i}
          style={abs({
            left: 24 + i * 50,
            top: 290 - h,
            width: 34,
            height: h,
            borderRadius: 8,
            background: i === bars.length - 1 ? og.accent : `rgba(237,237,237,${0.12 + i * 0.05})`,
          })}
        />
      ))}
      <div style={abs({ left: 14, top: 300, width: 312, height: 1, background: og.faint })} />
    </Canvas>
  )
}

function MediaMotif() {
  const cards = [-18, -6, 6, 18]
  return (
    <Canvas>
      {cards.map((deg, i) => (
        <div
          key={deg}
          style={abs({
            left: 96 + (i - 1.5) * 40,
            top: 70,
            width: 120,
            height: 170,
            borderRadius: 16,
            border: `1px solid ${og.faint}`,
            background: i === 2 ? "linear-gradient(160deg, #ff4d12, #7a2208)" : `rgba(40,40,40,${0.9 - i * 0.1})`,
            transform: `rotate(${deg}deg)`,
            transformOrigin: "50% 140%",
          })}
        />
      ))}
    </Canvas>
  )
}

function ScrollMotif() {
  return (
    <Canvas>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={abs({
            left: 30,
            top: 40 + i * 68,
            width: 230,
            height: 48,
            borderRadius: 12,
            border: `1px solid ${og.line}`,
            background: `rgba(237,237,237,${0.1 - Math.abs(i - 1.5) * 0.04})`,
            opacity: 1 - Math.abs(i - 1.5) * 0.3,
          })}
        />
      ))}
      <div style={abs({ left: 296, top: 40, width: 4, height: 252, borderRadius: 2, background: og.line })} />
      <div style={abs({ left: 296, top: 110, width: 4, height: 80, borderRadius: 2, background: og.accent })} />
    </Canvas>
  )
}

function LayoutMotif() {
  const tiles = [
    { l: 30, t: 40, w: 170, h: 130 },
    { l: 212, t: 40, w: 98, h: 130 },
    { l: 30, t: 182, w: 98, h: 118 },
    { l: 140, t: 182, w: 170, h: 118 },
  ]
  return (
    <Canvas>
      {tiles.map((p, i) => (
        <div
          key={i}
          style={abs({
            left: p.l,
            top: p.t,
            width: p.w,
            height: p.h,
            borderRadius: 16,
            border: `1px solid ${i === 1 ? "rgba(255,77,18,0.6)" : og.faint}`,
            background: i === 1 ? "rgba(255,77,18,0.18)" : "rgba(255,255,255,0.03)",
          })}
        />
      ))}
    </Canvas>
  )
}

function SectionsMotif() {
  return (
    <Canvas>
      <div style={abs({ left: 30, top: 40, width: 280, height: 260, borderRadius: 18, border: `1px solid ${og.faint}` })} />
      <div style={abs({ left: 50, top: 62, width: 60, height: 10, borderRadius: 5, background: og.fg })} />
      <div style={abs({ left: 230, top: 62, width: 60, height: 10, borderRadius: 5, background: "rgba(237,237,237,0.3)" })} />
      <div style={abs({ left: 50, top: 110, width: 200, height: 18, borderRadius: 9, background: "rgba(237,237,237,0.5)" })} />
      <div style={abs({ left: 50, top: 140, width: 150, height: 18, borderRadius: 9, background: "rgba(237,237,237,0.25)" })} />
      <div style={abs({ left: 50, top: 180, width: 90, height: 34, borderRadius: 17, background: og.accent })} />
      <div style={abs({ left: 30, top: 244, width: 280, height: 1, background: og.line })} />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={abs({ left: 50 + i * 80, top: 266, width: 56, height: 8, borderRadius: 4, background: "rgba(237,237,237,0.2)" })}
        />
      ))}
    </Canvas>
  )
}

// A fanned hand of three cards, the front one in accent
function CardsMotif() {
  const cards = [
    { l: 60, t: 70, r: -12, front: false },
    { l: 110, t: 52, r: 0, front: false },
    { l: 160, t: 70, r: 12, front: true },
  ]
  return (
    <Canvas>
      {cards.map((c, i) => (
        <div
          key={i}
          style={abs({
            left: c.l,
            top: c.t,
            width: 130,
            height: 190,
            borderRadius: 18,
            transform: `rotate(${c.r}deg)`,
            border: `1px solid ${c.front ? "rgba(255,77,18,0.6)" : og.faint}`,
            background: c.front ? "rgba(255,77,18,0.2)" : "rgba(255,255,255,0.04)",
          })}
        />
      ))}
    </Canvas>
  )
}

const MOTIFS: Record<Category, () => ReactNode> = {
  Cards: CardsMotif,
  Text: TextMotif,
  Buttons: ButtonsMotif,
  Interactive: InteractiveMotif,
  Navigation: NavigationMotif,
  Forms: FormsMotif,
  Feedback: FeedbackMotif,
  Charts: ChartsMotif,
  Media: MediaMotif,
  Scroll: ScrollMotif,
  Layout: LayoutMotif,
  Sections: SectionsMotif,
}

export function OgMotif({ category }: { category: Category }) {
  const Motif = MOTIFS[category] ?? LayoutMotif
  return <Motif />
}
