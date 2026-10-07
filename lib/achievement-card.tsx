/* The runner "new record" sunflower card, rendered with next/og (Satori: every multi-child div needs display flex). */
import { ImageResponse } from "next/og"
import type { ReactNode } from "react"
import { siteConfig } from "@/lib/docs"
import { LOGO_PATH, LOGO_VIEWBOX } from "@/lib/logo"

export const ACHIEVEMENT_CHARACTERS = ["dino", "cat", "mark"] as const
export type AchievementCharacter = (typeof ACHIEVEMENT_CHARACTERS)[number]

export const ACHIEVEMENT_FORMATS = {
  portrait: { width: 1080, height: 1350 },
  wide: { width: 1200, height: 630 },
} as const
export type AchievementFormat = keyof typeof ACHIEVEMENT_FORMATS

export const MAX_NAME_LENGTH = 32
export const MAX_SCORE = 1_000_000

export type AchievementParams = {
  name: string
  score: number
  /** ISO date, YYYY-MM-DD. */
  date: string
  character: AchievementCharacter
  format: AchievementFormat
}

/* ------------------------------------------------------------- parsing */

/** Strips control characters and markup-ish symbols, collapses whitespace, caps the length. */
export function sanitizeName(value: unknown): string {
  if (typeof value !== "string") return ""
  return value
    .replace(/[\u0000-\u001f\u007f-\u009f<>{}[\]\\`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim()
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

export function parseScore(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN
  if (!Number.isFinite(n)) return 0
  return Math.min(MAX_SCORE, Math.max(0, Math.floor(n)))
}

export function parseCharacter(value: unknown): AchievementCharacter {
  return ACHIEVEMENT_CHARACTERS.includes(value as AchievementCharacter) ? (value as AchievementCharacter) : "mark"
}

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>

function pick(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined
  const v = source[key]
  return Array.isArray(v) ? v[0] : v
}

/** Reads card params from a query string or Next `searchParams`, falling back to safe defaults. */
export function parseAchievementParams(source: ParamSource): AchievementParams {
  const date = pick(source, "date")
  return {
    name: sanitizeName(pick(source, "name")),
    score: parseScore(pick(source, "score")),
    date: isIsoDate(date) ? date : todayUtc(),
    character: parseCharacter(pick(source, "character")),
    format: pick(source, "format") === "wide" ? "wide" : "portrait",
  }
}

/** Query string shared by the image route and the share page (format optional). */
export function achievementQuery(p: Omit<AchievementParams, "format"> & { format?: AchievementFormat }): string {
  const q = new URLSearchParams()
  if (p.name) q.set("name", p.name)
  q.set("score", String(p.score))
  q.set("date", p.date)
  q.set("character", p.character)
  if (p.format) q.set("format", p.format)
  return q.toString()
}

export function achievementShareUrl(p: Omit<AchievementParams, "format">): string {
  return `${siteConfig.url}/achievement?${achievementQuery(p)}`
}

export function achievementImageUrl(p: Omit<AchievementParams, "format">, format: AchievementFormat): string {
  return `${siteConfig.url}/api/achievement/image?${achievementQuery({ ...p, format })}`
}

export function formatScore(score: number): string {
  return score.toLocaleString("en-US")
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}

export const CHARACTER_LABELS: Record<AchievementCharacter, string> = {
  dino: "Dino",
  cat: "Cat",
  mark: "The mark",
}

/* -------------------------------------------------------------- design */

const c = {
  bg: "#0a0a0a",
  fg: "#f5f5f4",
  muted: "#8a8a8a",
  faint: "#5c5c5c",
  line: "#1f1f1f",
  sun: "#ffc93c",
  amber: "#ffb000",
  deep: "#f59e0b",
  seed: "#3b2412",
  seedDark: "#24150a",
  seedLight: "#6b4423",
}

/** A pointed petal pointing up, starting `r0` from the centre. */
function petal(r0: number, len: number, w: number): string {
  const tip = -(r0 + len)
  return [
    `M0 ${-r0}`,
    `C${w} ${-(r0 + len * 0.3)} ${w * 0.75} ${-(r0 + len * 0.8)} 0 ${tip}`,
    `C${-w * 0.75} ${-(r0 + len * 0.8)} ${-w} ${-(r0 + len * 0.3)} 0 ${-r0}Z`,
  ].join(" ")
}

const PETAL_LAYERS = [
  { count: 26, r0: 58, len: 128, w: 26, fill: c.deep, offset: 0 },
  { count: 22, r0: 60, len: 116, w: 28, fill: c.amber, offset: 360 / 44 },
  { count: 18, r0: 62, len: 92, w: 26, fill: c.sun, offset: 5 },
]

// Seeds on a golden-angle spiral: deterministic, so every render is identical
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const SEEDS = Array.from({ length: 150 }, (_, i) => {
  const r = 5.4 * Math.sqrt(i + 0.5)
  const a = i * GOLDEN
  return { x: +(Math.cos(a) * r).toFixed(2), y: +(Math.sin(a) * r).toFixed(2), r: 1.4 + (i / 150) * 1.4, light: i % 3 === 0 }
}).filter((s) => Math.hypot(s.x, s.y) < 62)

export function SunflowerSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="-200 -200 400 400">
      {PETAL_LAYERS.map((layer, li) => (
        <g key={li}>
          {Array.from({ length: layer.count }, (_, i) => (
            <path
              key={i}
              d={petal(layer.r0, layer.len, layer.w)}
              fill={layer.fill}
              transform={`rotate(${((i * 360) / layer.count + layer.offset).toFixed(2)})`}
            />
          ))}
        </g>
      ))}
      <circle cx="0" cy="0" r="74" fill={c.seed} />
      <circle cx="0" cy="0" r="68" fill="none" stroke={c.seedDark} strokeWidth="3" />
      {SEEDS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.light ? c.seedLight : c.seedDark} />
      ))}
    </svg>
  )
}

function CharacterGlyph({ character, size }: { character: AchievementCharacter; size: number }) {
  if (character === "dino") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16">
        <rect x="8" y="1" width="7" height="5" fill={c.fg} />
        <rect x="10" y="2" width="1" height="1" fill={c.bg} />
        <rect x="7" y="5" width="4" height="2" fill={c.fg} />
        <rect x="3" y="6" width="8" height="5" fill={c.fg} />
        <rect x="1" y="6" width="2" height="2" fill={c.fg} />
        <rect x="11" y="7" width="2" height="1" fill={c.fg} />
        <rect x="4" y="11" width="2" height="3" fill={c.fg} />
        <rect x="8" y="11" width="2" height="3" fill={c.fg} />
      </svg>
    )
  }
  if (character === "cat") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M4 21V9.5L4.5 3L9.5 7H14.5L19.5 3L20 9.5V21Z" fill={c.fg} />
        <circle cx="9" cy="13" r="1.4" fill={c.bg} />
        <circle cx="15" cy="13" r="1.4" fill={c.bg} />
        <path d="M11 16.5H13L12 17.6Z" fill={c.bg} />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox={LOGO_VIEWBOX}>
      <path d={LOGO_PATH} fill={c.fg} />
    </svg>
  )
}

function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.32 }}>
      <svg width={size} height={size} viewBox={LOGO_VIEWBOX}>
        <path d={LOGO_PATH} fill={c.fg} />
      </svg>
      <div style={{ display: "flex", fontSize: size * 0.82, letterSpacing: "-0.03em", color: c.fg }}>tweenly</div>
    </div>
  )
}

function Chip({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.5,
        height: size * 2.1,
        padding: `0 ${size * 0.9}px`,
        borderRadius: 999,
        border: `1.5px solid ${c.sun}`,
        color: c.sun,
        fontSize: size,
        letterSpacing: "0.04em",
      }}
    >
      <div style={{ display: "flex", width: size * 0.5, height: size * 0.5, borderRadius: 999, background: c.sun }} />
      #1 on tweenly runner
    </div>
  )
}

function Label({ children, size }: { children: ReactNode; size: number }) {
  return (
    <div style={{ display: "flex", fontSize: size, letterSpacing: "0.24em", color: c.muted, textTransform: "uppercase" }}>
      {children}
    </div>
  )
}

function Frame({ inset, radius }: { inset: number; radius: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: inset,
        left: inset,
        right: inset,
        bottom: inset,
        display: "flex",
        border: `1.5px solid ${c.line}`,
        borderRadius: radius,
      }}
    />
  )
}

const host = () => siteConfig.url.replace(/^https?:\/\//, "").replace(/\/$/, "")

function PortraitCard({ p, name }: { p: AchievementParams; name: string }) {
  return (
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: c.bg, color: c.fg }}>
      <Frame inset={36} radius={40} />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "84px 92px 72px",
        }}
      >
        <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark size={42} />
          <Chip size={21} />
        </div>

        <SunflowerSvg size={460} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.38em", color: c.sun }}>ACHIEVEMENT UNLOCKED</div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 60, letterSpacing: "-0.035em" }}>New high score</div>
          <div style={{ display: "flex", marginTop: 4, fontSize: 200, lineHeight: 1, letterSpacing: "-0.06em", color: c.fg }}>
            {formatScore(p.score)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 34 }}>
          <div style={{ display: "flex", width: "100%", height: 1.5, background: c.line }} />
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 520 }}>
              <Label size={18}>Player</Label>
              <div style={{ display: "flex", fontSize: 36, letterSpacing: "-0.02em" }}>{name}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <Label size={18}>Set on</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 36, color: c.fg }}>
                <CharacterGlyph character={p.character} size={30} />
                {formatDate(p.date)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 20, letterSpacing: "0.12em", color: c.faint }}>
            {host()}
          </div>
        </div>
      </div>
    </div>
  )
}

function WideCard({ p, name }: { p: AchievementParams; name: string }) {
  return (
    <div
      style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: c.bg, color: c.fg, overflow: "hidden" }}
    >
      <Frame inset={26} radius={28} />
      <div style={{ position: "absolute", left: 690, top: 25, display: "flex" }}>
        <SunflowerSvg size={580} />
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 680,
          height: "100%",
          padding: "62px 0 56px 72px",
        }}
      >
        <Wordmark size={34} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 19, letterSpacing: "0.36em", color: c.sun }}>ACHIEVEMENT UNLOCKED</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 44, letterSpacing: "-0.035em" }}>New high score</div>
          <div style={{ display: "flex", fontSize: 150, lineHeight: 1, letterSpacing: "-0.06em", marginLeft: -6 }}>
            {formatScore(p.score)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, fontSize: 26 }}>
            <CharacterGlyph character={p.character} size={26} />
            <div style={{ display: "flex" }}>{name}</div>
            <div style={{ display: "flex", color: c.faint }}>·</div>
            <div style={{ display: "flex", color: c.muted }}>{formatDate(p.date)}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Chip size={17} />
          <div style={{ display: "flex", fontSize: 17, letterSpacing: "0.12em", color: c.faint }}>{host()}</div>
        </div>
      </div>
    </div>
  )
}

/** Renders the sunflower card PNG. Used by the image route and the record email attachment. */
export function renderAchievementCard(params: AchievementParams, headers?: Record<string, string>): ImageResponse {
  const size = ACHIEVEMENT_FORMATS[params.format]
  const name = params.name || "A tweenly runner"
  return new ImageResponse(
    params.format === "wide" ? <WideCard p={params} name={name} /> : <PortraitCard p={params} name={name} />,
    { ...size, headers },
  )
}
