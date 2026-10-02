"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useMotionValue, useTransform, type Transition } from "motion/react"
import { Check, Mic, MicOff, Pause, Play, RotateCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export interface AiRecorderProps {
  /** Called after stop with the recorded audio and its duration. In simulate mode the blob is empty. */
  onRecordingComplete?: (blob: Blob, durationMs: number) => void
  /** Stop automatically after this many seconds. Default: undefined (no limit) */
  maxDuration?: number
  /** Fake the waveform and timer without touching the microphone. Useful for demos. Default: false */
  simulate?: boolean
  /** Color of the stop button, recording dot and played waveform (any CSS color). Default: "#ff4d12" */
  accent?: string
  /** Height of the control in px. Default: 44 */
  size?: number
  /** Additional classes for the root element. Default: undefined */
  className?: string
}

type Phase = "idle" | "requesting" | "recording" | "paused" | "recorded" | "denied" | "unavailable"
type Recording = { url: string | null; duration: number; peaks: number[] }

const PEAKS = 36
const SAMPLE_MS = 50
const BAR = 2.5
const BAR_GAP = 2
const spring: Transition = { type: "spring", stiffness: 450, damping: 36 }
const ease = [0.22, 1, 0.36, 1] as const

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const hash = (n: number, seed: number) => {
  const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}
const noise = (x: number, seed = 0) => {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u
}
const speech = (t: number) => {
  const gate = clamp((noise(t * 0.45, 3) - 0.25) * 2.4)
  return clamp(0.06 + gate * (0.2 + noise(t * 5.2, 11) * 0.8))
}
const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}
const toPeaks = (levels: number[]) => {
  if (!levels.length) return Array.from({ length: PEAKS }, () => 0.1)
  const out: number[] = []
  for (let i = 0; i < PEAKS; i++) {
    const a = Math.floor((i / PEAKS) * levels.length)
    const b = Math.max(a + 1, Math.floor(((i + 1) / PEAKS) * levels.length))
    let m = 0
    for (let j = a; j < b && j < levels.length; j++) m = Math.max(m, levels[j])
    out.push(m)
  }
  const max = Math.max(...out, 0.05)
  return out.map((v) => clamp(0.12 + (v / max) * 0.88))
}

function IconButton({
  label,
  onClick,
  children,
  className,
  style,
  dim,
  reduced,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  dim: number
  reduced: boolean
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      whileTap={reduced ? undefined : { scale: 0.9 }}
      transition={spring}
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      style={{ width: dim, height: dim, ...style }}
    >
      {children}
    </motion.button>
  )
}

export function AiRecorder({
  onRecordingComplete,
  maxDuration,
  simulate = false,
  accent = "#ff4d12",
  size = 44,
  className,
}: AiRecorderProps) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("idle")
  const [elapsed, setElapsed] = useState(0)
  const [rec, setRec] = useState<Recording | null>(null)
  const [playing, setPlaying] = useState(false)
  const [posSec, setPosSec] = useState(0)
  const [announce, setAnnounce] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const levelsRef = useRef<number[]>([])
  const baseRef = useRef(0)
  const segRef = useRef(0)
  const durationRef = useRef(0)
  const cancelRef = useRef(false)
  const urlRef = useRef<string | null>(null)
  const aliveRef = useRef(true)
  const simPosRef = useRef(0)
  const phaseRef = useRef<Phase>("idle")
  const live = useRef({ onRecordingComplete, maxDuration })
  const finishRef = useRef<(commit: boolean) => void>(() => {})

  const progress = useMotionValue(0)
  const clip = useTransform(progress, (p) => `inset(0 ${(1 - p) * 100}% 0 0)`)

  const inner = Math.max(24, size - 12)
  const icon = Math.round(inner * 0.5)
  const capturing = phase === "recording" || phase === "paused"

  useEffect(() => {
    live.current = { onRecordingComplete, maxDuration }
    phaseRef.current = phase
  })

  const release = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    analyserRef.current = null
    void ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
  }

  const elapsedNow = () => baseRef.current + (phaseRef.current === "recording" ? performance.now() - segRef.current : 0)

  const begin = () => {
    levelsRef.current = []
    baseRef.current = 0
    segRef.current = performance.now()
    phaseRef.current = "recording"
    setElapsed(0)
    setPhase("recording")
    setAnnounce("Recording started")
  }

  const finalize = (blob: Blob, duration: number) => {
    if (!aliveRef.current) return
    release()
    if (cancelRef.current) {
      setPhase("idle")
      setAnnounce("Recording discarded")
      return
    }
    const url = blob.size ? URL.createObjectURL(blob) : null
    urlRef.current = url
    progress.set(0)
    simPosRef.current = 0
    setPosSec(0)
    setRec({ url, duration, peaks: toPeaks(levelsRef.current) })
    setPhase("recorded")
    setAnnounce(`Recording saved, ${fmt(duration)}`)
    live.current.onRecordingComplete?.(blob, duration)
  }

  const finish = (commit: boolean) => {
    const duration = elapsedNow()
    durationRef.current = duration
    cancelRef.current = !commit
    phaseRef.current = "idle"
    const r = recorderRef.current
    recorderRef.current = null
    if (r && r.state !== "inactive") r.stop()
    else finalize(new Blob([], { type: "audio/webm" }), duration)
  }

  useEffect(() => {
    finishRef.current = finish
  })

  const start = async () => {
    if (simulate) {
      begin()
      return
    }
    setPhase("requesting")
    setAnnounce("Requesting microphone")
    let stream: MediaStream
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new DOMException("Recording unsupported", "NotSupportedError")
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (!aliveRef.current) return
      const name = err instanceof DOMException ? err.name : ""
      const denied = name === "NotAllowedError" || name === "SecurityError"
      setPhase(denied ? "denied" : "unavailable")
      setAnnounce(denied ? "Microphone access denied" : "No microphone available")
      return
    }
    if (!aliveRef.current) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }
    streamRef.current = stream
    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.5
      ctx.createMediaStreamSource(stream).connect(analyser)
      ctxRef.current = ctx
      analyserRef.current = analyser
    } catch {
      // Waveform is optional; recording still works
    }
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      finalize(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }), durationRef.current)
    }
    recorderRef.current = recorder
    recorder.start(250)
    begin()
  }

  const pause = () => {
    baseRef.current += performance.now() - segRef.current
    phaseRef.current = "paused"
    recorderRef.current?.pause()
    setPhase("paused")
    setAnnounce("Recording paused")
  }

  const resume = () => {
    segRef.current = performance.now()
    phaseRef.current = "recording"
    recorderRef.current?.resume()
    setPhase("recording")
    setAnnounce("Recording resumed")
  }

  const remove = () => {
    audioRef.current?.pause()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setPlaying(false)
    setRec(null)
    setPhase("idle")
    setAnnounce("Recording deleted")
  }

  // Unmount cleanup
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      const r = recorderRef.current
      recorderRef.current = null
      if (r && r.state !== "inactive") {
        r.onstop = null
        r.stop()
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      void ctxRef.current?.close().catch(() => {})
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  // Capture loop: samples level, draws the live waveform, drives the timer
  useEffect(() => {
    if (!capturing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    let raf = 0
    let lastSample = performance.now()
    let shownSec = -1
    let fill = "currentColor"
    let W = 0
    let H = 0
    const samples: number[] = []
    const buf = new Uint8Array(512)

    const resize = () => {
      if (!canvas || !ctx) return
      const r = canvas.getBoundingClientRect()
      W = r.width
      H = r.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(W * dpr))
      canvas.height = Math.max(1, Math.round(H * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fill = getComputedStyle(canvas).color
    }
    resize()

    const level = (now: number) => {
      const an = analyserRef.current
      if (an) {
        an.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < an.fftSize && i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        return clamp(Math.sqrt(sum / Math.min(an.fftSize, buf.length)) * 4.5)
      }
      return simulate ? speech(now / 1000) : 0
    }

    const tick = (now: number) => {
      const recording = phaseRef.current === "recording"
      if (recording) {
        while (now - lastSample >= SAMPLE_MS) {
          lastSample += SAMPLE_MS
          const v = level(lastSample)
          samples.push(v)
          levelsRef.current.push(v)
          if (samples.length > 160) samples.shift()
        }
        const ms = baseRef.current + now - segRef.current
        const sec = Math.floor(ms / 1000)
        if (sec !== shownSec) {
          shownSec = sec
          setElapsed(ms)
        }
        const max = live.current.maxDuration
        if (max && ms >= max * 1000) {
          finishRef.current(true)
          return
        }
      } else {
        lastSample = now
      }

      if (canvas && ctx) {
        ctx.clearRect(0, 0, W, H)
        ctx.fillStyle = fill
        ctx.globalAlpha = recording ? 0.85 : 0.35
        const step = BAR + BAR_GAP
        const shift = recording && !reduced ? ((now - lastSample) / SAMPLE_MS) * step : 0
        const count = Math.ceil(W / step) + 1
        for (let i = 0; i < count; i++) {
          const v = samples[samples.length - 1 - i] ?? 0
          const x = W - BAR - i * step - shift + step
          if (x < -BAR) break
          const h = Math.max(BAR, v * H)
          // Fade bars toward the left edge
          const edge = clamp(x / (W * 0.25))
          ctx.globalAlpha = (recording ? 0.85 : 0.35) * edge
          ctx.beginPath()
          if (ctx.roundRect) ctx.roundRect(x, (H - h) / 2, BAR, h, BAR / 2)
          else ctx.rect(x, (H - h) / 2, BAR, h)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [capturing, simulate, reduced])

  // Playback loop
  useEffect(() => {
    if (!playing || !rec) return
    let raf = 0
    let last = performance.now()
    let shown = -1
    const tick = (now: number) => {
      const a = audioRef.current
      let ms: number
      if (rec.url && a) ms = a.currentTime * 1000
      else {
        simPosRef.current += now - last
        ms = simPosRef.current
      }
      last = now
      const frac = clamp(ms / rec.duration)
      progress.set(frac)
      const sec = Math.floor((frac * rec.duration) / 1000)
      if (sec !== shown) {
        shown = sec
        setPosSec(sec)
      }
      if (frac >= 1 || (rec.url && a?.ended)) {
        setPlaying(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, rec, progress])

  const togglePlay = () => {
    if (!rec) return
    const a = audioRef.current
    if (playing) {
      a?.pause()
      setPlaying(false)
      return
    }
    if (progress.get() >= 0.999) seek(0)
    if (rec.url && a) {
      a.play().catch(() => setPlaying(false))
    }
    setPlaying(true)
  }

  const seek = (frac: number) => {
    if (!rec) return
    const f = clamp(frac)
    progress.set(f)
    simPosRef.current = f * rec.duration
    setPosSec(Math.floor((f * rec.duration) / 1000))
    const a = audioRef.current
    if (rec.url && a) a.currentTime = (f * rec.duration) / 1000
  }

  const seekFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    seek((e.clientX - r.left) / r.width)
  }

  const group = phase === "recording" || phase === "paused" ? "rec" : phase === "recorded" ? "play" : phase === "denied" || phase === "unavailable" ? "blocked" : "idle"
  const fade: Transition = reduced ? { duration: 0 } : { duration: 0.25, ease }
  const contentMotion = {
    initial: { opacity: 0, filter: "blur(4px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(4px)" },
    transition: fade,
  }

  return (
    <div className={cn("inline-flex", className)}>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
      <motion.div
        layout
        transition={reduced ? { duration: 0 } : spring}
        className={cn(
          "relative flex items-center overflow-hidden border bg-card text-foreground shadow-sm",
          group === "idle" ? "p-0" : "px-1.5"
        )}
        style={{ height: size, borderRadius: size / 2, minWidth: size }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {group === "idle" && (
            <motion.button
              key="idle"
              type="button"
              layout="position"
              {...contentMotion}
              onClick={() => void start()}
              disabled={phase === "requesting"}
              aria-label="Start recording"
              title="Start recording"
              whileTap={reduced ? undefined : { scale: 0.92 }}
              className="grid shrink-0 place-items-center rounded-full outline-none transition-colors hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait"
              style={{ width: size - 2, height: size - 2 }}
            >
              <motion.span
                animate={phase === "requesting" && !reduced ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
                transition={phase === "requesting" ? { duration: 1.2, repeat: Infinity, ease: [0.76, 0, 0.24, 1] } : fade}
              >
                <Mic style={{ width: icon, height: icon }} aria-hidden />
              </motion.span>
            </motion.button>
          )}

          {group === "blocked" && (
            <motion.div key="blocked" layout="position" {...contentMotion} className="flex items-center gap-2 pr-1">
              <span className="grid shrink-0 place-items-center text-muted-foreground" style={{ width: inner, height: inner }}>
                <MicOff style={{ width: icon, height: icon }} aria-hidden />
              </span>
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                {phase === "denied" ? "Microphone access denied" : "No microphone found"}
              </span>
              <IconButton label="Try again" onClick={() => void start()} dim={inner} reduced={reduced}>
                <RotateCcw style={{ width: icon * 0.85, height: icon * 0.85 }} aria-hidden />
              </IconButton>
            </motion.div>
          )}

          {group === "rec" && (
            <motion.div key="rec" layout="position" {...contentMotion} className="flex items-center gap-1.5">
              <IconButton label="Discard recording" onClick={() => finish(false)} dim={inner} reduced={reduced}>
                <Trash2 style={{ width: icon * 0.85, height: icon * 0.85 }} aria-hidden />
              </IconButton>
              <div className="flex items-center gap-2 pl-0.5">
                <motion.span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                  animate={phase === "recording" && !reduced ? { opacity: [1, 0.3, 1] } : { opacity: phase === "recording" ? 1 : 0.35 }}
                  transition={phase === "recording" && !reduced ? { duration: 1.4, repeat: Infinity, ease: [0.76, 0, 0.24, 1] } : fade}
                />
                <span role="timer" aria-label={`Recording time ${fmt(elapsed)}`} className="w-9 text-xs font-medium tabular-nums">
                  {fmt(elapsed)}
                </span>
              </div>
              <canvas ref={canvasRef} aria-hidden className="block text-foreground" style={{ width: 128, height: Math.round(size * 0.5) }} />
              {phase === "recording" ? (
                <IconButton label="Pause recording" onClick={pause} dim={inner} reduced={reduced}>
                  <Pause style={{ width: icon * 0.85, height: icon * 0.85 }} aria-hidden />
                </IconButton>
              ) : (
                <IconButton label="Resume recording" onClick={resume} dim={inner} reduced={reduced}>
                  <Mic style={{ width: icon * 0.85, height: icon * 0.85 }} aria-hidden />
                </IconButton>
              )}
              <IconButton
                label="Stop and save recording"
                onClick={() => finish(true)}
                dim={inner}
                reduced={reduced}
                className="text-white hover:bg-transparent hover:text-white hover:brightness-110"
                style={{ backgroundColor: accent }}
              >
                <Check style={{ width: icon, height: icon }} strokeWidth={2.5} aria-hidden />
              </IconButton>
            </motion.div>
          )}

          {group === "play" && rec && (
            <motion.div key="play" layout="position" {...contentMotion} className="flex items-center gap-1.5">
              {rec.url && <audio ref={audioRef} src={rec.url} preload="metadata" onEnded={() => setPlaying(false)} className="hidden" />}
              <IconButton
                label={playing ? "Pause playback" : "Play recording"}
                onClick={togglePlay}
                dim={inner}
                reduced={reduced}
                className="bg-foreground/[0.06] text-foreground"
              >
                {playing ? (
                  <Pause style={{ width: icon * 0.8, height: icon * 0.8 }} fill="currentColor" aria-hidden />
                ) : (
                  <Play style={{ width: icon * 0.8, height: icon * 0.8 }} fill="currentColor" className="translate-x-px" aria-hidden />
                )}
              </IconButton>
              <div
                role="slider"
                tabIndex={0}
                aria-label="Playback position"
                aria-valuemin={0}
                aria-valuemax={Math.round(rec.duration / 1000)}
                aria-valuenow={posSec}
                aria-valuetext={`${fmt(posSec * 1000)} of ${fmt(rec.duration)}`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  seekFromPointer(e)
                }}
                onPointerMove={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) seekFromPointer(e)
                }}
                onKeyDown={(e) => {
                  const step = 0.05
                  const p = progress.get()
                  if (e.key === "ArrowRight" || e.key === "ArrowUp") seek(p + step)
                  else if (e.key === "ArrowLeft" || e.key === "ArrowDown") seek(p - step)
                  else if (e.key === "Home") seek(0)
                  else if (e.key === "End") seek(1)
                  else if (e.key === " " || e.key === "Enter") togglePlay()
                  else return
                  e.preventDefault()
                }}
                className="relative flex h-full cursor-pointer touch-none items-center rounded-md px-1 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ height: size * 0.6 }}
              >
                <Bars peaks={rec.peaks} height={size * 0.5} className="text-foreground/25" />
                <motion.div className="absolute inset-y-0 left-1 flex items-center" style={{ clipPath: clip, color: accent }} aria-hidden>
                  <Bars peaks={rec.peaks} height={size * 0.5} />
                </motion.div>
              </div>
              <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                {fmt(playing || posSec > 0 ? posSec * 1000 : rec.duration)}
              </span>
              <IconButton label="Delete recording" onClick={remove} dim={inner} reduced={reduced}>
                <Trash2 style={{ width: icon * 0.85, height: icon * 0.85 }} aria-hidden />
              </IconButton>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function Bars({ peaks, height, className }: { peaks: number[]; height: number; className?: string }) {
  return (
    <div className={cn("flex items-center", className)} style={{ height, gap: BAR_GAP }} aria-hidden>
      {peaks.map((p, i) => (
        <span key={i} className="shrink-0 rounded-full bg-current" style={{ width: BAR, height: Math.max(BAR, p * height) }} />
      ))}
    </div>
  )
}
