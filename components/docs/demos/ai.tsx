"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Globe, Lightbulb, Mic, MicOff, RotateCcw } from "lucide-react"
import { as, type DemoMap, type DemoProps } from "@/components/docs/demo-utils"
import { AiVoice, type AiVoiceProps } from "@/registry/new-york/ai-voice/ai-voice"
import { AiRecorder, type AiRecorderProps } from "@/registry/new-york/ai-recorder/ai-recorder"
import { AiInput, type AiInputProps, type AiInputStatus } from "@/registry/new-york/ai-input/ai-input"
import { AiThinking, type AiThinkingProps } from "@/registry/new-york/ai-thinking/ai-thinking"

const ease = [0.22, 1, 0.36, 1] as const

function MicToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
    >
      {on ? <MicOff className="size-3.5" aria-hidden /> : <Mic className="size-3.5" aria-hidden />}
      {on ? "Use simulated audio" : "Use microphone"}
    </button>
  )
}

function VoiceDemo({ values }: DemoProps) {
  const props = as<AiVoiceProps>(values)
  const [mic, setMic] = useState(false)
  const ownMic = props.source === "mic"
  return (
    <div className="flex flex-col items-center gap-6">
      <AiVoice
        {...props}
        source={mic ? "mic" : props.source}
        active={mic ? true : undefined}
        state={mic && props.state === "speaking" ? "listening" : props.state}
      />
      {!ownMic && <MicToggle on={mic} onToggle={() => setMic((m) => !m)} />}
    </div>
  )
}

function RecorderDemo({ values }: DemoProps) {
  const props = as<AiRecorderProps>(values)
  const [mic, setMic] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const simulate = mic ? false : (props.simulate ?? false)
  return (
    <div className="flex flex-col items-center gap-6">
      <AiRecorder
        key={simulate ? "sim" : "mic"}
        {...props}
        simulate={simulate}
        onRecordingComplete={(blob, ms) => setSaved(`${(ms / 1000).toFixed(1)}s${blob.size ? ` · ${Math.round(blob.size / 1024)} KB` : " · simulated"}`)}
      />
      <p className="h-4 text-xs text-muted-foreground" aria-live="polite">
        {saved ? `Saved ${saved}` : "Tap the mic to record"}
      </p>
      <MicToggle
        on={mic}
        onToggle={() => {
          setMic((m) => !m)
          setSaved(null)
        }}
      />
    </div>
  )
}

const ANSWERS = [
  "Good motion is invisible until it is missing. Keep entrances quick with a soft ease-out, let exits be even faster, and use springs for anything the user drags or toggles so it feels connected to their hand.",
  "Here is a quick plan: start with the hero transition, add one micro-interaction per primary action, then audit everything with reduced motion turned on. If it still reads clearly, you are done.",
  "Short answer: yes. Animate transform and opacity only, cap durations around 300ms for UI feedback, and stagger lists by 30 to 50ms so the eye can follow without waiting.",
]

function InputDemo({ values }: DemoProps) {
  const props = as<AiInputProps>(values)
  const [status, setStatus] = useState<AiInputStatus>("idle")
  const [turn, setTurn] = useState<{ q: string; a: string; id: number; stopped: boolean } | null>(null)

  useEffect(() => {
    if (status !== "submitting") return
    const t = setTimeout(() => setStatus("streaming"), 900)
    return () => clearTimeout(t)
  }, [status])

  const effective = status === "idle" ? (props.status ?? "idle") : status

  return (
    <div className="flex w-full max-w-xl flex-col gap-5 px-4">
      <div className="min-h-28">
        <AnimatePresence mode="wait">
          {turn ? (
            <motion.div
              key={turn.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="flex flex-col gap-3"
            >
              <div className="max-w-[80%] self-end rounded-2xl bg-foreground/[0.06] px-3.5 py-2 text-sm text-foreground">{turn.q}</div>
              {status === "submitting" ? (
                <AiThinking variant="shimmer" size="sm" />
              ) : turn.stopped ? (
                <p className="text-sm text-muted-foreground">Response stopped.</p>
              ) : (
                <AiThinking variant="stream" size="sm" text={turn.a} speed={90} onComplete={() => setStatus("idle")} />
              )}
            </motion.div>
          ) : (
            <motion.p key="empty" exit={{ opacity: 0 }} className="pt-10 text-center text-sm text-muted-foreground">
              What can I help you build?
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <AiInput
        {...props}
        status={effective}
        toggles={[
          { id: "search", label: "Search", icon: <Globe /> },
          { id: "think", label: "Think", icon: <Lightbulb /> },
        ]}
        suggestions={["Make my buttons feel snappier", "Plan a landing page animation", "Is a 600ms fade too slow?"]}
        onSubmit={({ text }) => {
          setTurn((prev) => {
            const id = (prev?.id ?? -1) + 1
            return { q: text || "Sent attachments", a: ANSWERS[id % ANSWERS.length], id, stopped: false }
          })
          setStatus("submitting")
        }}
        onStop={() => {
          setTurn((t) => (t ? { ...t, stopped: true } : t))
          setStatus("idle")
        }}
      />
    </div>
  )
}

function ThinkingDemo({ values }: DemoProps) {
  const props = as<AiThinkingProps>(values)
  const [run, setRun] = useState(0)
  const variant = props.variant ?? "shimmer"
  const replayable = variant === "steps" || variant === "stream"
  return (
    <div className={replayable ? "flex w-full max-w-md flex-col items-start gap-5 px-6" : "flex flex-col items-center gap-5"}>
      <AiThinking key={`${variant}-${run}-${props.duration}-${props.text}`} {...props} />
      {replayable && (
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Replay
        </button>
      )}
    </div>
  )
}

export const aiDemos: DemoMap = {
  "ai-voice": (p) => <VoiceDemo {...p} />,
  "ai-recorder": (p) => <RecorderDemo {...p} />,
  "ai-input": (p) => <InputDemo {...p} />,
  "ai-thinking": (p) => <ThinkingDemo {...p} />,
}
