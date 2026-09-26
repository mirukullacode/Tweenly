"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface AsciiImageProps {
  /** Image URL. Remote images must allow CORS so their pixels can be read. */
  src: string
  /** Accessible description of the image. */
  alt: string
  /** Size of each character cell in px. Default: 10 */
  cellSize?: number
  /** Characters from lightest to densest. Default: " .:-=+*#%@" */
  characters?: string
  /** Character color (any canvas color, not CSS variables). Default: "#3b5bff" */
  color?: string
  /** Color of the glitter sparks near the cursor. Default: "#ffffff" */
  sparkColor?: string
  /** Radius of the hover region in px. Default: 90 */
  radius?: number
  /** How quickly the hover trail fades, 0 to 1. Higher = longer trail. Default: 0.93 */
  decay?: number
  /** Chance per frame that a lit cell sparkles, 0 to 1. Default: 0.12 */
  glitter?: number
  /** Brightness contrast applied before mapping to characters. Default: 1.3 */
  contrast?: number
  /** Map dark pixels to dense characters instead of light ones. Default: false */
  invert?: boolean
  className?: string
}

export function AsciiImage({
  src,
  alt,
  cellSize = 10,
  characters = " .:-=+*#%@",
  color = "#3b5bff",
  sparkColor = "#ffffff",
  radius = 90,
  decay = 0.93,
  glitter = 0.12,
  contrast = 1.3,
  invert = false,
  className,
}: AsciiImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [error, setError] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!wrap || !canvas || !ctx) return

    let cols = 0
    let rows = 0
    let luma = new Float32Array(0) // 0..1 brightness per cell
    let energy = new Float32Array(0) // 0..1 hover intensity per cell
    let raf = 0
    let running = false
    let pointer: { x: number; y: number } | null = null
    let disposed = false

    const img = new Image()
    img.crossOrigin = "anonymous"

    const sample = () => {
      const { width, height } = wrap.getBoundingClientRect()
      if (!width || !height || !img.naturalWidth) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.ceil(width / cellSize)
      rows = Math.ceil(height / cellSize)

      // Draw the image "object-fit: cover" into a tiny canvas, one pixel per cell
      const small = document.createElement("canvas")
      small.width = cols
      small.height = rows
      const sctx = small.getContext("2d", { willReadFrequently: true })!
      const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      sctx.drawImage(img, (cols - w) / 2, (rows - h) / 2, w, h)

      let data: Uint8ClampedArray
      try {
        data = sctx.getImageData(0, 0, cols, rows).data
      } catch {
        setError(true) // tainted canvas: the image host doesn't allow CORS
        return
      }

      luma = new Float32Array(cols * rows)
      energy = new Float32Array(cols * rows)
      for (let i = 0; i < cols * rows; i++) {
        const r = data[i * 4]
        const g = data[i * 4 + 1]
        const b = data[i * 4 + 2]
        const a = data[i * 4 + 3] / 255
        let l = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * a
        l = Math.min(Math.max((l - 0.5) * contrast + 0.5, 0), 1)
        luma[i] = invert ? 1 - l : l
      }
      draw()
    }

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, width, height)
      ctx.font = `${cellSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const ramp = characters.length - 1
      const block = cellSize * 0.82
      let active = false

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          const l = luma[i]
          const e = energy[i]
          const cx = x * cellSize + cellSize / 2
          const cy = y * cellSize + cellSize / 2

          if (e > 0.02) {
            active = true
            if (l < 0.08) continue
            // Lit region: solid blocks with random sparkles
            const spark = !reduced && Math.random() < glitter * e
            ctx.globalAlpha = Math.min(1, 0.35 + e)
            ctx.fillStyle = spark ? sparkColor : color
            ctx.fillRect(cx - block / 2, cy - block / 2, block, block)
            continue
          }

          const ci = Math.round(l * ramp)
          if (ci === 0) continue
          ctx.globalAlpha = 0.25 + l * 0.75
          ctx.fillStyle = color
          ctx.fillText(characters[ci], cx, cy)
        }
      }
      ctx.globalAlpha = 1
      return active
    }

    const tick = () => {
      if (pointer) {
        const r = radius / cellSize
        const px = pointer.x / cellSize
        const py = pointer.y / cellSize
        const x0 = Math.max(0, Math.floor(px - r))
        const x1 = Math.min(cols - 1, Math.ceil(px + r))
        const y0 = Math.max(0, Math.floor(py - r))
        const y1 = Math.min(rows - 1, Math.ceil(py + r))
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            // Jittered falloff gives the region a ragged, pixelated edge
            const d = Math.hypot(x - px, y - py) / r + Math.random() * 0.35
            if (d < 1) energy[y * cols + x] = Math.max(energy[y * cols + x], 1 - d)
          }
        }
      }
      for (let i = 0; i < energy.length; i++) energy[i] *= decay

      const active = draw()
      if (active || pointer) raf = requestAnimationFrame(tick)
      else running = false
    }

    const start = () => {
      if (running || disposed) return
      running = true
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      start()
    }
    const onLeave = () => {
      pointer = null
    }

    img.onload = sample
    img.onerror = () => setError(true)
    img.src = src

    const ro = new ResizeObserver(() => sample())
    ro.observe(wrap)
    wrap.addEventListener("pointermove", onMove)
    wrap.addEventListener("pointerleave", onLeave)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      wrap.removeEventListener("pointermove", onMove)
      wrap.removeEventListener("pointerleave", onLeave)
    }
  }, [src, cellSize, characters, color, sparkColor, radius, decay, glitter, contrast, invert, reduced])

  return (
    <div ref={wrapRef} role="img" aria-label={alt} className={cn("relative overflow-hidden", className)}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      {error && (
        <p className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">
          Couldn&apos;t read this image. Make sure it is same-origin or served with CORS.
        </p>
      )}
    </div>
  )
}
