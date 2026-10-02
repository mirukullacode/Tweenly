"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type AiVoiceVariant = "orb" | "bars" | "wave" | "dots"
export type AiVoiceSource = "mic" | "simulated" | "level"
export type AiVoiceState = "idle" | "listening" | "thinking" | "speaking"

export interface AiVoiceProps {
  /** Visual style: breathing orb, equalizer bars, flowing line or bouncing dots. Default: "orb" */
  variant?: AiVoiceVariant
  /** Where the audio level comes from: the microphone, smooth seeded noise, or the `level` prop. Default: "simulated" */
  source?: AiVoiceSource
  /** Conversation state. Idle breathes, thinking shimmers, listening and speaking react to audio. Default: "speaking" */
  state?: AiVoiceState
  /** Controlled audio level from 0 to 1, used when `source` is "level". Default: 0 */
  level?: number
  /** Controls the microphone when `source` is "mic". Leave undefined to use the built-in toggle. Default: undefined */
  active?: boolean
  /** Base color for idle and listening (any CSS color). Default: "currentColor" */
  color?: string
  /** Color for speaking and the thinking shimmer (any CSS color). Default: "#ff4d12" */
  accent?: string
  /** Size in px. The orb is square; other variants are twice as wide as tall. Default: 120 */
  size?: number
  /** Number of bars (bars variant) or dots (dots variant). Default: 24 for bars, 5 for dots */
  bars?: number
  /** Multiplier applied to the incoming level. Default: 1 */
  sensitivity?: number
  /** Frame-to-frame smoothing from 0 (raw) to 0.98 (very smooth). Default: 0.75 */
  smoothing?: number
  /** Show the built-in microphone toggle when `source` is "mic" and `active` is undefined. Default: true */
  showToggle?: boolean
  /** Called every frame the smoothed level changes, with a value from 0 to 1. */
  onLevel?: (level: number) => void
  /** Additional classes for the root element. Default: undefined */
  className?: string
}

type MicStatus = "off" | "requesting" | "on" | "denied" | "unavailable"
type RGB = [number, number, number]

const ease = [0.22, 1, 0.36, 1] as const

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const hash = (n: number, seed: number) => {
  const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}
/** Smooth seeded value noise in [0, 1]. */
const noise = (x: number, seed = 0) => {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u
}
/** Speech-like envelope: syllable bursts riding on slower phrases. */
const speech = (t: number) => {
  const phrase = noise(t * 0.45, 3)
  const syllable = noise(t * 5.2, 11)
  const gate = clamp((phrase - 0.28) * 2.4)
  return clamp(0.08 + gate * (0.25 + syllable * 0.85))
}
const mix = (a: RGB, b: RGB, m: number): RGB => [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m, a[2] + (b[2] - a[2]) * m]
const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a)})`

export function AiVoice({
  variant = "orb",
  source = "simulated",
  state = "speaking",
  level = 0,
  active,
  color = "currentColor",
  accent = "#ff4d12",
  size = 120,
  bars,
  sensitivity = 1,
  smoothing = 0.75,
  showToggle = true,
  onLevel,
  className,
}: AiVoiceProps) {
  const reduced = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const [innerOn, setInnerOn] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const micWanted = source === "mic" && (active ?? innerOn)
  const [mic, setMic] = useState<MicStatus>(micWanted ? "requesting" : "off")
  const [prevWanted, setPrevWanted] = useState(micWanted)
  if (prevWanted !== micWanted) {
    setPrevWanted(micWanted)
    setMic(micWanted ? "requesting" : "off")
  }

  const live = useRef({ variant, source, state, level, color, accent, sensitivity, smoothing, bars, reduced, onLevel })
  useEffect(() => {
    live.current = { variant, source, state, level, color, accent, sensitivity, smoothing, bars, reduced, onLevel }
  })

  // Microphone: getUserMedia + AnalyserNode while wanted
  useEffect(() => {
    if (!micWanted) return
    let cancelled = false
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined
    const req = md?.getUserMedia
      ? md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      : Promise.reject(new DOMException("No media devices", "NotFoundError"))
    req
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        ctx = new AudioContext()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        analyser.smoothingTimeConstant = 0.55
        ctx.createMediaStreamSource(s).connect(analyser)
        analyserRef.current = analyser
        setMic("on")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : ""
        setMic(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable")
      })
    return () => {
      cancelled = true
      analyserRef.current = null
      stream?.getTracks().forEach((t) => t.stop())
      void ctx?.close()
    }
  }, [micWanted, attempt])

  // Single rAF render loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    let raf = 0
    let last = 0
    let t = 0
    let W = 0
    let H = 0
    let onScreen = true
    let lvl = 0
    let reportedLvl = -1
    let react = 0
    let think = 0
    let speak = 0
    let idle = 1
    let bands = new Float32Array(0)
    let timeBuf = new Float32Array(0)
    let freqBuf = new Uint8Array(0)
    let base: RGB = [237, 237, 237]
    let acc: RGB = [255, 77, 18]
    let resolvedFor = ""
    let dirty = true

    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    const resolve = (c: string, fallback: RGB): RGB => {
      if (!probe) return fallback
      const css = c === "currentColor" ? getComputedStyle(canvas).color : c
      probe.clearRect(0, 0, 1, 1)
      probe.fillStyle = "#000"
      probe.fillStyle = css
      probe.fillRect(0, 0, 1, 1)
      const d = probe.getImageData(0, 0, 1, 1).data
      return d[3] === 0 ? fallback : [d[0], d[1], d[2]]
    }

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      W = r.width
      H = r.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(W * dpr))
      canvas.height = Math.max(1, Math.round(H * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const blob = (cx: number, cy: number, r: number, amp: number, phase: number) => {
      const N = 72
      const pts: [number, number][] = []
      for (let k = 0; k < N; k++) {
        const a = (k / N) * Math.PI * 2
        const w2 = noise(t * 0.7 + 10, phase)
        const w3 = noise(t * 0.9 + 20, phase + 1)
        const w5 = noise(t * 1.3 + 30, phase + 2)
        const d =
          Math.sin(2 * a + t * 1.1 + phase) * w2 * 0.5 +
          Math.sin(3 * a - t * 1.6 + phase * 2) * w3 * 0.35 +
          Math.sin(5 * a + t * 2.3 + phase * 3) * w5 * 0.25
        const rr = r * (1 + amp * d)
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
      }
      ctx.beginPath()
      const m0x = (pts[N - 1][0] + pts[0][0]) / 2
      const m0y = (pts[N - 1][1] + pts[0][1]) / 2
      ctx.moveTo(m0x, m0y)
      for (let k = 0; k < N; k++) {
        const p = pts[k]
        const q = pts[(k + 1) % N]
        ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
      }
      ctx.closePath()
    }

    const pill = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(w, h) / 2)
      else ctx.rect(x, y, w, h)
      ctx.fill()
    }

    const draw = (dt: number) => {
      const p = live.current
      if (!p.reduced) t += dt
      if (dirty || resolvedFor !== p.color + "|" + p.accent) {
        base = resolve(p.color, base)
        acc = resolve(p.accent, acc)
        resolvedFor = p.color + "|" + p.accent
        dirty = false
      }

      const n = p.variant === "bars" ? clamp(Math.round(p.bars ?? 24), 3, 96) : p.variant === "dots" ? clamp(Math.round(p.bars ?? 5), 2, 16) : 1
      if (bands.length !== n) bands = new Float32Array(n)

      const reactive = p.state === "listening" || p.state === "speaking"
      const sens = Math.max(0, p.sensitivity)
      const k = 1 - Math.pow(clamp(p.smoothing, 0, 0.98), dt * 60)
      const km = 1 - Math.pow(0.88, dt * 60)
      react += ((reactive ? 1 : 0) - react) * km
      think += ((p.state === "thinking" ? 1 : 0) - think) * km
      speak += ((p.state === "speaking" ? 1 : 0) - speak) * km
      idle += ((p.state === "idle" ? 1 : 0) - idle) * km

      // Raw level from the selected source
      const an = p.source === "mic" ? analyserRef.current : null
      let raw = 0
      if (an) {
        if (timeBuf.length !== an.fftSize) timeBuf = new Float32Array(an.fftSize)
        if (freqBuf.length !== an.frequencyBinCount) freqBuf = new Uint8Array(an.frequencyBinCount)
        an.getFloatTimeDomainData(timeBuf)
        an.getByteFrequencyData(freqBuf)
        let sum = 0
        for (let i = 0; i < timeBuf.length; i++) sum += timeBuf[i] * timeBuf[i]
        raw = clamp(Math.sqrt(sum / timeBuf.length) * 5 * sens)
      } else if (p.source === "level") raw = clamp(p.level * sens)
      else if (p.source === "simulated") raw = clamp(speech(t) * sens)

      lvl += ((reactive ? raw : 0) - lvl) * k
      if (Math.abs(lvl - reportedLvl) > 0.002) {
        reportedLvl = lvl
        p.onLevel?.(lvl)
      }

      // Per-band values, center weighted
      const c = (n - 1) / 2
      for (let i = 0; i < n; i++) {
        const dist = c === 0 ? 0 : Math.abs(i - c) / c
        const weight = 0.3 + 0.7 * Math.pow(Math.cos((dist * Math.PI) / 2), 0.9)
        let v: number
        if (an && freqBuf.length) {
          const bin = Math.floor(2 + dist * freqBuf.length * 0.35)
          v = clamp((freqBuf[bin] / 255) * 1.15 * sens) * (0.55 + 0.45 * weight)
        } else {
          v = lvl * (0.35 + 0.75 * noise(i * 0.61 + t * 3.4, 7)) * weight
        }
        bands[i] += ((reactive ? clamp(v) : 0) - bands[i]) * k
      }

      const breathe = 0.5 + 0.5 * Math.sin(t * 1.4)
      const col = mix(base, acc, speak)
      ctx.clearRect(0, 0, W, H)

      if (p.variant === "orb") {
        const cx = W / 2
        const cy = H / 2
        const R0 = Math.min(W, H) * 0.27
        const R = R0 * (1 + idle * 0.05 * breathe + think * 0.03 * Math.sin(t * 3) + lvl * 0.24)
        const amp = 0.012 + idle * 0.01 + react * (0.03 + lvl * 0.2) + think * 0.02

        const glow = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.95)
        glow.addColorStop(0, rgba(col, 0.22 + lvl * 0.25 + think * 0.08))
        glow.addColorStop(1, rgba(col, 0))
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(cx, cy, R * 1.95, 0, Math.PI * 2)
        ctx.fill()

        blob(cx, cy, R * 1.17, amp * 1.4, 4.1)
        ctx.fillStyle = rgba(col, 0.14)
        ctx.fill()
        blob(cx, cy, R * 1.08, amp * 1.2, 2.3)
        ctx.fillStyle = rgba(col, 0.26)
        ctx.fill()
        blob(cx, cy, R, amp, 0.7)
        const core = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.1)
        core.addColorStop(0, rgba(mix(col, [255, 255, 255], 0.35), 1))
        core.addColorStop(1, rgba(col, 1))
        ctx.fillStyle = core
        ctx.fill()

        if (think > 0.01) {
          // Rotating shimmer arc
          const rr = R * 1.32
          const start = t * 2.6
          const segs = 36
          const span = Math.PI * 1.1
          ctx.lineCap = "round"
          ctx.lineWidth = Math.max(1.5, R0 * 0.06)
          for (let s = 0; s < segs; s++) {
            const a0 = start + (s / segs) * span
            const fade = Math.pow(Math.sin((Math.PI * s) / segs), 2)
            ctx.strokeStyle = rgba(acc, fade * think)
            ctx.beginPath()
            ctx.arc(cx, cy, rr, a0, a0 + span / segs + 0.01)
            ctx.stroke()
          }
          // Sheen sweeping across the core
          ctx.save()
          blob(cx, cy, R, amp, 0.7)
          ctx.clip()
          const sx = cx + Math.cos(t * 2.6) * R * 0.6
          const sy = cy + Math.sin(t * 2.6) * R * 0.6
          const sheen = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.9)
          sheen.addColorStop(0, rgba(acc, 0.55 * think))
          sheen.addColorStop(1, rgba(acc, 0))
          ctx.fillStyle = sheen
          ctx.fillRect(cx - R * 1.5, cy - R * 1.5, R * 3, R * 3)
          ctx.restore()
        }
      } else if (p.variant === "bars") {
        const unit = W / (n * 1.6 - 0.6)
        const bw = Math.min(unit, 14)
        const gap = n > 1 ? (W - bw * n) / (n - 1) : 0
        const cy = H / 2
        for (let i = 0; i < n; i++) {
          const dist = c === 0 ? 0 : Math.abs(i - c) / c
          const weight = 0.3 + 0.7 * Math.cos((dist * Math.PI) / 2)
          const wave = Math.pow(Math.max(0, Math.sin(i * 0.45 - t * 5)), 3)
          const restH = H * (0.07 + idle * 0.07 * weight * (0.6 + 0.4 * Math.sin(t * 1.4 - dist * 1.6)))
          const h = Math.max(bw, restH + bands[i] * H * 0.9 + think * wave * weight * H * 0.32)
          const hh = Math.min(H, h)
          ctx.fillStyle = rgba(think > 0.01 ? mix(col, acc, wave * think) : col, 1 - think * 0.45 * (1 - wave))
          pill(i * (bw + gap), cy - hh / 2, bw, hh)
        }
      } else if (p.variant === "wave") {
        const cy = H / 2
        const amp = H * 0.42 * lvl + idle * H * 0.035 * (0.6 + 0.4 * breathe) + think * H * 0.09 + H * 0.01
        const lines = [
          { a: 1, w: 2.2, o: 0 },
          { a: 0.35, w: 1.5, o: 1.7 },
          { a: 0.18, w: 1.2, o: 3.9 },
        ]
        const path = (o: number, scale: number) => {
          ctx.beginPath()
          for (let x = 0; x <= W; x += 2) {
            const u = x / W
            const env = Math.pow(Math.sin(Math.PI * u), 1.6)
            const y =
              cy +
              amp * scale * env *
                (Math.sin(u * 9 + t * 3.2 + o) * 0.6 + Math.sin(u * 17 - t * 4.4 + o * 2) * 0.3 + Math.sin(u * 4 + t * 1.3 + o) * 0.25)
            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
        }
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        for (let l = lines.length - 1; l >= 0; l--) {
          const L = lines[l]
          path(L.o, l === 0 ? 1 : 0.75 - l * 0.12)
          ctx.lineWidth = L.w
          ctx.strokeStyle = rgba(col, L.a)
          ctx.stroke()
        }
        if (think > 0.01) {
          const pos = ((t * 0.55) % 1.6) - 0.3
          const g = ctx.createLinearGradient(0, 0, W, 0)
          const stop = (u: number, a: number) => g.addColorStop(clamp(u), rgba(acc, a))
          stop(pos - 0.18, 0)
          stop(pos, think)
          stop(pos + 0.18, 0)
          path(0, 1)
          ctx.lineWidth = 2.6
          ctx.strokeStyle = g
          ctx.stroke()
        }
      } else {
        const r = Math.min(H * 0.11, W / (n * 3.2))
        const spacing = r * 3
        const x0 = W / 2 - ((n - 1) * spacing) / 2
        const cy = H / 2 + H * 0.12
        for (let i = 0; i < n; i++) {
          const hop = Math.pow(Math.max(0, Math.sin(t * 6 - i * 0.75)), 2)
          const rest = idle * Math.sin(t * 1.4 - i * 0.6) * r * 0.35
          const y = cy - bands[i] * H * 0.42 - think * hop * H * 0.2 + rest
          const s = 1 + bands[i] * 0.35
          ctx.fillStyle = rgba(think > 0.01 ? mix(col, acc, hop * think) : col, 1 - think * 0.4 * (1 - hop))
          ctx.beginPath()
          ctx.arc(x0 + i * spacing, y, r * s, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(Math.max((now - last) / 1000, 0.001), 0.05) : 1 / 60
      last = now
      draw(dt)
      if (onScreen && !document.hidden) raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (raf || !onScreen || document.hidden) return
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    resize()
    start()
    const ro = new ResizeObserver(() => {
      resize()
      if (!raf) draw(0)
    })
    ro.observe(canvas)
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1]?.isIntersecting ?? true
      if (onScreen) start()
      else stop()
    })
    io.observe(canvas)
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener("visibilitychange", onVisibility)
    const mo = new MutationObserver(() => {
      dirty = true
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  const square = variant === "orb"
  const toggleVisible = source === "mic" && showToggle && active === undefined
  const listening = mic === "on" || mic === "requesting"
  const message =
    source !== "mic"
      ? null
      : mic === "requesting"
        ? "Waiting for microphone…"
        : mic === "denied"
          ? "Microphone access was denied. Allow it in your browser settings."
          : mic === "unavailable"
            ? "No microphone available."
            : null

  const toggle = () => {
    if (innerOn && (mic === "denied" || mic === "unavailable")) {
      setMic("requesting")
      setAttempt((a) => a + 1)
      return
    }
    setInnerOn((v) => !v)
  }

  return (
    <div className={cn("inline-flex flex-col items-center gap-3", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Voice activity: ${state}`}
        className="block"
        style={{ width: square ? size : size * 2, height: square ? size : size * 0.6 }}
      />
      {toggleVisible && (
        <motion.button
          type="button"
          onClick={toggle}
          aria-pressed={listening}
          aria-label={listening ? "Turn microphone off" : "Turn microphone on"}
          whileTap={reduced ? undefined : { scale: 0.94 }}
          transition={{ type: "spring", stiffness: 450, damping: 32 }}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            listening ? "border-transparent text-white" : "bg-card text-foreground hover:bg-foreground/[0.05]"
          )}
          style={listening ? { backgroundColor: accent } : undefined}
        >
          {listening ? <Mic className="size-3.5" aria-hidden /> : <MicOff className="size-3.5" aria-hidden />}
          {listening ? "Listening" : "Use microphone"}
        </motion.button>
      )}
      <div role="status" aria-live="polite" className="min-h-0 text-center">
        <AnimatePresence initial={false}>
          {message && (
            <motion.p
              key={message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: reduced ? 0 : 0.3, ease }}
              className="max-w-[16rem] text-xs text-muted-foreground"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
