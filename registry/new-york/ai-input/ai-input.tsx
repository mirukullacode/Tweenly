"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, type MotionValue, type Transition } from "motion/react"
import { ArrowUp, Check, ChevronDown, FileText, ImageIcon, Paperclip, Square, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type AiInputStatus = "idle" | "submitting" | "streaming"

export interface AiInputToggle {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface AiInputSubmit {
  text: string
  files: File[]
  model: string | undefined
  /** Ids of the toggles that are on. */
  toggles: string[]
}

export interface AiInputProps {
  /** Controlled text. Default: undefined */
  value?: string
  /** Initial text when uncontrolled. Default: "" */
  defaultValue?: string
  /** Called whenever the text changes. */
  onValueChange?: (value: string) => void
  /** Called on Enter or the send button with the prompt, files, model and active toggles. */
  onSubmit?: (payload: AiInputSubmit) => void
  /** Called when the stop button is pressed while streaming. */
  onStop?: () => void
  /** Request state. "streaming" turns the send button into a stop button. Default: "idle" */
  status?: AiInputStatus
  /** Example prompts cycled through while the box is empty. Default: a few sample prompts */
  placeholders?: string[]
  /** Models offered in the selector. An empty array hides it. Default: ["Auto", "Fast", "Reasoning"] */
  models?: string[]
  /** Initially selected model. Default: the first model */
  defaultModel?: string
  /** Toggle chips shown in the toolbar, such as web search. Default: [] */
  toggles?: AiInputToggle[]
  /** Suggestion chips below the box that fill the input on click. Default: [] */
  suggestions?: string[]
  /** Rows the textarea grows to before scrolling. Default: 8 */
  maxRows?: number
  /** Accent for the send button, focus ring and active chips (any CSS color). Default: "#ff4d12" */
  accent?: string
  /** Corner radius of the box in px. Default: 20 */
  radius?: number
  /** Show the attach button. Default: true */
  attachments?: boolean
  /** Disable all input. Default: false */
  disabled?: boolean
  /** Additional classes for the root element. Default: undefined */
  className?: string
}

const DEFAULT_PLACEHOLDERS = ["Ask anything…", "Summarize this article in three bullets", "Draft a launch tweet for a UI library", "Explain springs vs. easing curves"]
const DEFAULT_MODELS = ["Auto", "Fast", "Reasoning"]
const LINE = 24
const ease = [0.22, 1, 0.36, 1] as const
const spring: Transition = { type: "spring", stiffness: 450, damping: 34 }

type Attached = { id: number; file: File }

const formatSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)

/** Rotating solid highlight segment that sweeps the 1px border; only mounted while visible. */
function Ring({ rotate, speed, accent }: { rotate: MotionValue<number>; speed: number; accent: string }) {
  useAnimationFrame((_, delta) => {
    if (speed) rotate.set((rotate.get() + (delta / 1000) * speed) % 360)
  })
  return (
    <motion.div
      aria-hidden
      className="absolute top-1/2 left-1/2 aspect-square w-[max(200%,40rem)] -translate-x-1/2 -translate-y-1/2"
      style={{ rotate }}
    >
      {/* A flat wedge from the centre outward; only the slice crossing the border shows. */}
      <span className="absolute bottom-1/2 left-1/2 h-1/2 w-[18%]" style={{ backgroundColor: accent }} />
    </motion.div>
  )
}

export function AiInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  onStop,
  status = "idle",
  placeholders = DEFAULT_PLACEHOLDERS,
  models = DEFAULT_MODELS,
  defaultModel,
  toggles = [],
  suggestions = [],
  maxRows = 8,
  accent = "#ff4d12",
  radius = 20,
  attachments = true,
  disabled = false,
  className,
}: AiInputProps) {
  const reduced = useReducedMotion()
  const listId = useId()
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const modelBtnRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)
  const rotate = useMotionValue(0)

  const [inner, setInner] = useState(defaultValue)
  const [files, setFiles] = useState<Attached[]>([])
  const [model, setModel] = useState<string | undefined>(defaultModel ?? models[0])
  const [on, setOn] = useState<string[]>([])
  const [focused, setFocused] = useState(false)
  const [phIndex, setPhIndex] = useState(0)
  const [menu, setMenu] = useState(false)
  const [hl, setHl] = useState(0)
  const [dragging, setDragging] = useState(false)

  const text = valueProp ?? inner
  const empty = text.length === 0
  const busy = status !== "idle"
  const streaming = status === "streaming"
  const canSend = !disabled && !busy && (text.trim().length > 0 || files.length > 0)
  const activeModel = model !== undefined && models.includes(model) ? model : models[0]
  const ph = placeholders.length ? placeholders[phIndex % placeholders.length] : ""
  const ringOn = !disabled && (focused || streaming)
  const t = (tr: Transition): Transition => (reduced ? { duration: 0 } : tr)

  const setText = (v: string) => {
    if (valueProp === undefined) setInner(v)
    onValueChange?.(v)
  }

  // Auto-grow up to maxRows
  useLayoutEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = "auto"
    const max = Math.max(1, maxRows) * LINE
    const content = ta.scrollHeight
    ta.style.height = `${Math.min(content, max + 4)}px`
    ta.style.overflowY = content > max + 4 ? "auto" : "hidden"
  }, [text, maxRows])

  // Cycle placeholders while empty
  useEffect(() => {
    if (!empty || placeholders.length < 2) return
    const id = setInterval(() => setPhIndex((i) => (i + 1) % placeholders.length), 3200)
    return () => clearInterval(id)
  }, [empty, placeholders.length])

  // Model menu: focus list, close on outside press
  useEffect(() => {
    if (!menu) return
    listRef.current?.focus()
    const onDown = (e: PointerEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [menu])

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    const added = Array.from(list).map((file) => ({ id: nextId.current++, file }))
    setFiles((f) => [...f, ...added])
  }

  const submit = () => {
    if (!canSend) return
    onSubmit?.({ text: text.trim(), files: files.map((f) => f.file), model: activeModel, toggles: on })
    setText("")
    setFiles([])
  }

  const openMenu = () => {
    setHl(Math.max(0, models.indexOf(activeModel ?? "")))
    setMenu(true)
  }

  const choose = (m: string) => {
    setModel(m)
    setMenu(false)
    modelBtnRef.current?.focus()
  }

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setHl((h) => (h + 1) % models.length)
    else if (e.key === "ArrowUp") setHl((h) => (h - 1 + models.length) % models.length)
    else if (e.key === "Home") setHl(0)
    else if (e.key === "End") setHl(models.length - 1)
    else if (e.key === "Enter" || e.key === " ") choose(models[hl])
    else if (e.key === "Escape") {
      setMenu(false)
      modelBtnRef.current?.focus()
    } else if (e.key === "Tab") setMenu(false)
    else return
    e.preventDefault()
  }

  const chip =
    "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative overflow-hidden p-px transition-shadow duration-300"
        style={{
          borderRadius: radius,
          boxShadow: ringOn ? `0 0 0 4px color-mix(in oklab, ${accent} 12%, transparent)` : "0 0 0 0 transparent",
        }}
        onDragOver={(e) => {
          if (!attachments || disabled) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (!attachments || disabled) return
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <div aria-hidden className="absolute inset-0 bg-border" />
        <AnimatePresence>
          {ringOn && (
            <motion.div
              key="ring"
              aria-hidden
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: streaming ? 1 : 0.7 }}
              exit={{ opacity: 0 }}
              transition={t({ duration: 0.4, ease })}
            >
              <Ring rotate={rotate} speed={reduced ? 0 : streaming ? 220 : 50} accent={accent} />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn("relative bg-card transition-colors", dragging && "bg-panel")}
          style={{ borderRadius: Math.max(0, radius - 1) }}
          onClick={(e) => {
            if (e.target === e.currentTarget) taRef.current?.focus()
          }}
        >
          {/* Attached files */}
          <AnimatePresence initial={false}>
            {files.length > 0 && (
              <motion.div
                key="files"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={t({ duration: 0.3, ease })}
                className="overflow-hidden"
              >
                <ul className="flex flex-wrap gap-1.5 px-3 pt-3" aria-label="Attached files">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {files.map(({ id, file }) => {
                      const Icon = file.type.startsWith("image/") ? ImageIcon : FileText
                      return (
                        <motion.li
                          key={id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={t(spring)}
                          className="flex h-9 items-center gap-2 rounded-xl border bg-background py-1 pr-1 pl-2.5 text-xs"
                        >
                          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="max-w-[10rem] truncate font-medium text-foreground">{file.name}</span>
                          <span className="text-muted-foreground tabular-nums">{formatSize(file.size)}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${file.name}`}
                            onClick={() => setFiles((f) => f.filter((x) => x.id !== id))}
                            className="grid size-6 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea + cycling placeholder */}
          <div className="relative">
            <textarea
              ref={taRef}
              value={text}
              rows={1}
              disabled={disabled}
              aria-label={ph || "Message"}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  submit()
                }
              }}
              className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] leading-6 text-foreground outline-none disabled:cursor-not-allowed"
            />
            <AnimatePresence initial={false}>
              {empty && ph && (
                <motion.span
                  key={ph}
                  aria-hidden
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: reduced ? 0.15 : 0.5, ease }}
                  className="pointer-events-none absolute top-3.5 right-4 left-4 truncate text-[15px] leading-6 text-muted-foreground"
                >
                  {ph}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 px-2 pt-1 pb-2">
            {attachments && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  tabIndex={-1}
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
                <button
                  type="button"
                  aria-label="Attach files"
                  title="Attach files"
                  disabled={disabled}
                  onClick={() => fileRef.current?.click()}
                  className={cn(chip, "w-8 justify-center px-0")}
                >
                  <Paperclip className="size-4" aria-hidden />
                </button>
              </>
            )}

            {models.length > 0 && (
              <div ref={popRef} className="relative">
                <button
                  ref={modelBtnRef}
                  type="button"
                  disabled={disabled}
                  aria-haspopup="listbox"
                  aria-expanded={menu}
                  aria-controls={listId}
                  aria-label={`Model: ${activeModel}`}
                  onClick={() => (menu ? setMenu(false) : openMenu())}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault()
                      openMenu()
                    }
                  }}
                  className={chip}
                >
                  {activeModel}
                  <motion.span animate={{ rotate: menu ? 180 : 0 }} transition={t(spring)} className="inline-grid">
                    <ChevronDown className="size-3.5" aria-hidden />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {menu && (
                    <motion.ul
                      ref={listRef}
                      id={listId}
                      role="listbox"
                      tabIndex={-1}
                      aria-label="Model"
                      aria-activedescendant={`${listId}-${hl}`}
                      onKeyDown={onListKey}
                      initial={{ opacity: 0, scale: 0.96, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 4 }}
                      transition={t({ duration: 0.18, ease })}
                      className="absolute bottom-full left-0 z-20 mb-2 min-w-40 origin-bottom-left rounded-xl border bg-popover p-1 text-sm text-popover-foreground shadow-lg outline-none"
                    >
                      {models.map((m, i) => (
                        <li
                          key={m}
                          id={`${listId}-${i}`}
                          role="option"
                          aria-selected={m === activeModel}
                          onPointerEnter={() => setHl(i)}
                          onClick={() => choose(m)}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 transition-colors",
                            i === hl && "bg-foreground/[0.06]"
                          )}
                        >
                          {m}
                          {m === activeModel && <Check className="size-3.5" style={{ color: accent }} aria-hidden />}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}

            {toggles.map((tg) => {
              const pressed = on.includes(tg.id)
              return (
                <motion.button
                  key={tg.id}
                  type="button"
                  disabled={disabled}
                  aria-pressed={pressed}
                  onClick={() => setOn((o) => (o.includes(tg.id) ? o.filter((x) => x !== tg.id) : [...o, tg.id]))}
                  whileTap={reduced ? undefined : { scale: 0.95 }}
                  transition={spring}
                  className={cn(chip, pressed && "hover:bg-transparent")}
                  style={
                    pressed
                      ? { color: accent, backgroundColor: `color-mix(in oklab, ${accent} 12%, transparent)` }
                      : undefined
                  }
                >
                  {tg.icon && <span className="inline-grid [&_svg]:size-3.5">{tg.icon}</span>}
                  {tg.label}
                </motion.button>
              )
            })}

            <div className="ml-auto" />

            <motion.button
              type="button"
              aria-label={streaming ? "Stop generating" : status === "submitting" ? "Sending" : "Send message"}
              disabled={streaming ? false : !canSend}
              onClick={() => (streaming ? onStop?.() : submit())}
              whileTap={reduced ? undefined : { scale: 0.9 }}
              animate={{ borderRadius: streaming ? 12 : 18 }}
              style={{ backgroundColor: canSend || busy ? accent : "color-mix(in oklab, currentColor 10%, transparent)" }}
              transition={t(spring)}
              className={cn(
                "relative grid size-9 place-items-center overflow-hidden transition-[background-color,color] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
                canSend || busy ? "text-white" : "text-muted-foreground"
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={status}
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                  transition={t(spring)}
                  className="grid place-items-center"
                >
                  {streaming ? (
                    <Square className="size-3.5" fill="currentColor" strokeWidth={0} aria-hidden />
                  ) : status === "submitting" ? (
                    <motion.span
                      className="block size-4 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <ArrowUp className="size-4" strokeWidth={2.4} aria-hidden />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <AnimatePresence initial={false}>
          {empty && !busy && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={t({ duration: 0.3, ease })}
              className="mt-3 flex flex-wrap justify-center gap-2"
            >
              {suggestions.map((s, i) => (
                <motion.button
                  key={s}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setText(s)
                    taRef.current?.focus()
                  }}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease, delay: reduced ? 0 : i * 0.04 }}
                  whileTap={reduced ? undefined : { scale: 0.97 }}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors outline-none hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
