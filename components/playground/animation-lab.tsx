"use client"

import { useState } from "react"
import { motion, type TargetAndTransition, type Transition } from "motion/react"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { EASE_PRESETS, bezierString, fmt, getPreset, nearestGsapEase } from "./easing"
import { ActionButton, CodeTabs, PanelBody, ReducedMotionNote, Segmented, Select, Slider, Stage } from "./ui"

type Props = { opacity?: number; x?: number; y?: number; scale?: number; rotate?: number; rotateX?: number; blur?: number }
type Key = keyof Props

const PRESETS = {
  fade: { from: { opacity: 0 } },
  "slide up": { from: { opacity: 0, y: 24 } },
  "slide down": { from: { opacity: 0, y: -24 } },
  "slide left": { from: { opacity: 0, x: 32 } },
  "slide right": { from: { opacity: 0, x: -32 } },
  scale: { from: { opacity: 0, scale: 0.6 } },
  rotate: { from: { opacity: 0, rotate: -90, scale: 0.6 } },
  "blur in": { from: { opacity: 0, blur: 10 } },
  flip: { from: { opacity: 0, rotateX: -90 } },
  pop: { from: { opacity: 0, scale: 0.3 }, mid: { opacity: 1, scale: 1.12 } },
} satisfies Record<string, { from: Props; mid?: Props }>

type PresetName = keyof typeof PRESETS
const PRESET_NAMES = Object.keys(PRESETS) as PresetName[]

const REST: Required<Props> = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, rotateX: 0, blur: 0 }
const MID_AT = 0.6

const REPEATS = ["once", "2x", "3x", "loop"] as const
type RepeatName = (typeof REPEATS)[number]
const repeatCount = (r: RepeatName) => (r === "loop" ? Infinity : REPEATS.indexOf(r))

const TARGETS = ["boxes", "text"] as const
type TargetName = (typeof TARGETS)[number]

const WORDS = "Motion is a design material.".split(" ")

type Config = {
  preset: PresetName
  duration: number
  delay: number
  ease: string
  repeat: RepeatName
  target: TargetName
  count: number
  stagger: number
}

function getPresetDef(name: PresetName): { from: Props; mid?: Props } {
  return PRESETS[name]
}

const keysOf = (p: Props) => Object.keys(p) as Key[]

/* ------------------------------------------------------------------ motion */

function motionValue(key: Key, v: number): [string, string | number] {
  if (key === "blur") return ["filter", `blur(${v}px)`]
  return [key, v]
}

function toMotion(cfg: Config) {
  const { from, mid } = getPresetDef(cfg.preset)
  const initial: Record<string, string | number> = {}
  const animate: Record<string, string | number | (string | number)[]> = {}
  for (const k of keysOf(from)) {
    const [name, a] = motionValue(k, from[k] ?? REST[k])
    const [, b] = motionValue(k, REST[k])
    initial[name] = a
    if (mid) {
      const [, m] = motionValue(k, mid[k] ?? REST[k])
      animate[name] = [a, m, b]
    } else {
      animate[name] = b
    }
  }
  return { initial, animate, times: mid ? [0, MID_AT, 1] : undefined }
}

const literal = (v: string | number | (string | number)[]): string =>
  Array.isArray(v) ? `[${v.map(literal).join(", ")}]` : typeof v === "string" ? `"${v}"` : fmt(v)

const objectLiteral = (o: Record<string, string | number | (string | number)[]>) =>
  `{ ${Object.entries(o)
    .map(([k, v]) => `${k}: ${literal(v)}`)
    .join(", ")} }`

function motionCode(cfg: Config) {
  const { initial, animate, times } = toMotion(cfg)
  const bez = getPreset(cfg.ease).bezier
  const repeat = repeatCount(cfg.repeat)
  const many = cfg.target === "text" || cfg.count > 1
  const delayExpr =
    many && cfg.stagger > 0
      ? cfg.delay > 0
        ? `${fmt(cfg.delay)} + i * ${fmt(cfg.stagger)}`
        : `i * ${fmt(cfg.stagger)}`
      : fmt(cfg.delay)
  const flip = cfg.preset === "flip"

  const transition = [
    `duration: ${fmt(cfg.duration)},`,
    delayExpr !== "0" ? `delay: ${delayExpr},` : null,
    `ease: [${bezierString(bez)}],`,
    times ? `times: [${times.join(", ")}],` : null,
    repeat ? `repeat: ${repeat === Infinity ? "Infinity" : repeat},` : null,
  ].filter(Boolean)

  const props = (pad: string) =>
    [
      `initial={${objectLiteral(initial)}}`,
      `animate={${objectLiteral(animate)}}`,
      `transition={{`,
      ...transition.map((t) => `  ${t}`),
      `}}`,
      flip ? `style={{ transformPerspective: 600 }}` : null,
    ]
      .filter(Boolean)
      .map((l) => pad + l)
      .join("\n")

  if (cfg.target === "text") {
    return `import { motion } from "motion/react"

const words = "${WORDS.join(" ")}".split(" ")

export function Headline() {
  return (
    <p className="text-3xl font-semibold tracking-tight">
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="mr-[0.25em] inline-block"
${props("          ")}
        >
          {word}
        </motion.span>
      ))}
    </p>
  )
}
`
  }

  if (!many) {
    return `import { motion } from "motion/react"

export function Box() {
  return (
    <motion.div
      className="size-12 rounded-xl bg-[#ff4d12]"
${props("      ")}
    />
  )
}
`
  }

  return `import { motion } from "motion/react"

export function Boxes() {
  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: ${cfg.count} }, (_, i) => (
        <motion.div
          key={i}
          className="size-12 rounded-xl bg-[#ff4d12]"
${props("          ")}
        />
      ))}
    </div>
  )
}
`
}

/* -------------------------------------------------------------------- gsap */

function gsapEntries(p: Props) {
  return keysOf(p).map((k): [string, string | number] => {
    const v = p[k] ?? REST[k]
    if (k === "blur") return ["filter", `blur(${v}px)`]
    if (k === "rotateX") return ["rotationX", v]
    return [k, v]
  })
}

function gsapCode(cfg: Config) {
  const { from, mid } = getPresetDef(cfg.preset)
  const bez = getPreset(cfg.ease).bezier
  const near = nearestGsapEase(bez)
  const exact = cfg.ease === "linear"
  const repeat = repeatCount(cfg.repeat)
  const selector = cfg.target === "text" ? ".word" : ".box"
  const many = cfg.target === "text" || cfg.count > 1
  const lit = (v: string | number) => (typeof v === "string" ? `"${v}"` : fmt(v))
  const timing = [
    `duration: ${fmt(cfg.duration)},`,
    cfg.delay > 0 ? `delay: ${fmt(cfg.delay)},` : null,
    `ease: "${near.name}",${exact ? "" : ` // nearest named ease to cubic-bezier(${bezierString(bez)})`}`,
    many && cfg.stagger > 0 ? `stagger: ${fmt(cfg.stagger)},` : null,
    repeat ? `repeat: ${repeat === Infinity ? -1 : repeat},` : null,
  ].filter(Boolean) as string[]

  const indent = "    "
  let body: string
  if (mid) {
    const restOf = (p: Props) => keysOf(p).reduce<Props>((acc, k) => ({ ...acc, [k]: REST[k] }), {})
    const obj = (p: Props) => `{ ${gsapEntries(p).map(([k, v]) => `${k}: ${lit(v)}`).join(", ")} }`
    body = `${indent}gsap.set("${selector}", ${obj(from)})
${indent}gsap.to("${selector}", {
${indent}  keyframes: {
${indent}    "${MID_AT * 100}%": ${obj({ ...restOf(from), ...mid })},
${indent}    "100%": ${obj(restOf(from))},
${indent}    easeEach: "none",
${indent}  },
${timing.map((t) => `${indent}  ${t}`).join("\n")}
${indent}})`
  } else {
    body = `${indent}gsap.from("${selector}", {
${gsapEntries(from).map(([k, v]) => `${indent}  ${k}: ${lit(v)},`).join("\n")}
${cfg.preset === "flip" ? `${indent}  transformPerspective: 600,\n` : ""}${timing.map((t) => `${indent}  ${t}`).join("\n")}
${indent}})`
  }

  return `import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export function Stage() {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(() => {
${body}
  }, { scope })

  return <div ref={scope}>{/* ${many ? `elements with class "${selector.slice(1)}"` : `one element with class "${selector.slice(1)}"`} */}</div>
}
`
}

/* --------------------------------------------------------------------- css */

function cssDecl(p: Props, perspective: boolean) {
  const parts: string[] = []
  if (perspective && p.rotateX !== undefined) parts.push("perspective(600px)")
  if (p.x || p.y) parts.push(`translate(${fmt(p.x ?? 0)}px, ${fmt(p.y ?? 0)}px)`)
  if (p.rotate) parts.push(`rotate(${fmt(p.rotate)}deg)`)
  if (p.rotateX) parts.push(`rotateX(${fmt(p.rotateX)}deg)`)
  if (p.scale !== undefined && p.scale !== 1) parts.push(`scale(${fmt(p.scale)})`)
  const decl: string[] = []
  if (p.opacity !== undefined) decl.push(`opacity: ${fmt(p.opacity)};`)
  if (parts.length) decl.push(`transform: ${parts.join(" ")};`)
  if (p.blur) decl.push(`filter: blur(${fmt(p.blur)}px);`)
  return decl
}

function cssCode(cfg: Config) {
  const { from, mid } = getPresetDef(cfg.preset)
  const bez = getPreset(cfg.ease).bezier
  const repeat = repeatCount(cfg.repeat)
  const name = `tw-${cfg.preset.replace(/\s+/g, "-")}`
  const selector = cfg.target === "text" ? ".word" : ".box"
  const many = cfg.target === "text" || cfg.count > 1
  const end: string[] = ["opacity: 1;", "transform: none;"]
  if (from.blur) end.push("filter: none;")
  const frame = (sel: string, decl: string[]) => `  ${sel} { ${decl.join(" ")} }`

  const frames = [
    frame(mid ? "0%" : "from", cssDecl(from, true)),
    mid ? frame(`${MID_AT * 100}%`, cssDecl({ ...mid }, true)) : null,
    frame(mid ? "100%" : "to", end),
  ].filter(Boolean)

  const delay =
    many && cfg.stagger > 0
      ? `calc(${fmt(cfg.delay)}s + var(--i, 0) * ${fmt(cfg.stagger)}s)`
      : `${fmt(cfg.delay)}s`
  const count = repeat === Infinity ? "infinite" : String(repeat + 1)

  return `@keyframes ${name} {
${frames.join("\n")}
}

${selector} {
  animation: ${name} ${fmt(cfg.duration)}s cubic-bezier(${bezierString(bez)}) ${delay} ${count} both;${cfg.target === "text" ? "\n  display: inline-block;" : ""}
}
${many && cfg.stagger > 0 ? `\n/* Give each element its index: style="--i: 0", "--i: 1", ... */\n` : ""}
@media (prefers-reduced-motion: reduce) {
  ${selector} { animation: none; }
}
`
}

/* -------------------------------------------------------------- component */

export function AnimationLab() {
  const reduced = useReducedMotion()
  const [cfg, setCfg] = useState<Config>({
    preset: "slide up",
    duration: 0.6,
    delay: 0.1,
    ease: "enter",
    repeat: "once",
    target: "boxes",
    count: 6,
    stagger: 0.06,
  })
  const [run, setRun] = useState(0)
  const set = <K extends keyof Config>(k: K, v: Config[K]) => setCfg((c) => ({ ...c, [k]: v }))

  const { initial, animate, times } = toMotion(cfg)
  const bez = getPreset(cfg.ease).bezier
  const repeat = repeatCount(cfg.repeat)
  const flip = cfg.preset === "flip"
  // Remount the stage whenever the config changes so every tweak replays
  const stageKey = `${run}-${JSON.stringify(cfg)}`

  const itemProps = (i: number) => {
    if (reduced) return { initial: false as const }
    const transition: Transition = {
      duration: cfg.duration,
      delay: cfg.delay + i * cfg.stagger,
      ease: bez,
      times,
      repeat,
      repeatType: "loop",
    }
    return {
      initial: initial as TargetAndTransition,
      animate: animate as TargetAndTransition,
      transition,
    }
  }

  const style = flip ? { transformPerspective: 600 } : undefined

  return (
    <>
      <PanelBody
        preview={
          <Stage className="min-h-72">
            <div className="absolute right-3 top-3 z-10">
              <ActionButton onClick={() => setRun((r) => r + 1)} label="Replay animation">
                Replay
              </ActionButton>
            </div>
            <div key={stageKey} className="w-full">
              {cfg.target === "boxes" ? (
                <div className="mx-auto grid w-fit grid-cols-3 gap-3 sm:flex sm:max-w-md sm:flex-wrap sm:justify-center">
                  {Array.from({ length: cfg.count }, (_, i) => (
                    <motion.div key={i} {...itemProps(i)} style={style} className="size-12 rounded-xl bg-brand sm:size-14" />
                  ))}
                </div>
              ) : (
                <p className="mx-auto max-w-md text-center text-3xl font-semibold tracking-tight sm:text-4xl">
                  {WORDS.map((w, i) => (
                    <motion.span key={i} {...itemProps(i)} style={style} className="mr-[0.25em] inline-block last:mr-0">
                      {w}
                    </motion.span>
                  ))}
                </p>
              )}
            </div>
          </Stage>
        }
        controls={
          <>
            <Select
              label="preset"
              value={cfg.preset}
              onChange={(v) => set("preset", v)}
              options={PRESET_NAMES.map((p) => ({ value: p, label: p }))}
            />
            <Select
              label="easing"
              value={cfg.ease}
              onChange={(v) => set("ease", v)}
              options={EASE_PRESETS.map((p) => ({ value: p.id, label: `${p.label} (${bezierString(p.bezier)})` }))}
            />
            <Slider label="duration" value={cfg.duration} min={0.1} max={2} step={0.05} unit="s" onChange={(v) => set("duration", v)} />
            <Slider label="delay" value={cfg.delay} min={0} max={1} step={0.05} unit="s" onChange={(v) => set("delay", v)} />
            <Segmented label="repeat" options={REPEATS} value={cfg.repeat} onChange={(v) => set("repeat", v)} />
            <Segmented label="target" options={TARGETS} value={cfg.target} onChange={(v) => set("target", v)} />
            {cfg.target === "boxes" && (
              <Slider label="boxes" value={cfg.count} min={1} max={9} step={1} onChange={(v) => set("count", v)} />
            )}
            <Slider label="stagger" value={cfg.stagger} min={0} max={0.3} step={0.01} unit="s" onChange={(v) => set("stagger", v)} />
            {reduced && <ReducedMotionNote />}
          </>
        }
      />
      <CodeTabs
        tabs={[
          { label: "Motion", code: motionCode(cfg) },
          { label: "GSAP", code: gsapCode(cfg) },
          { label: "CSS", code: cssCode(cfg) },
        ]}
      />
    </>
  )
}
