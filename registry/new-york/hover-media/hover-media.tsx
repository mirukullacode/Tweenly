"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"
import { cn } from "@/lib/utils"

export interface HoverMediaProps {
  /** The keyword(s) that trigger the preview. */
  children: React.ReactNode
  /** Image or video URL. */
  src: string
  /** Media type. Detected from the file extension when omitted. */
  type?: "image" | "video"
  /** Alt text for images. Default: "" */
  alt?: string
  /** Preview width in px. Default: 220 */
  width?: number
  /** Preview aspect ratio. Default: "4 / 3" */
  aspectRatio?: string
  /** Maximum tilt in degrees, driven by cursor speed. Default: 12 */
  tilt?: number
  /** Distance from the cursor in px. Default: 20 */
  offset?: number
  /** Spring stiffness for the follow motion. Default: 300 */
  stiffness?: number
  /** Spring damping for the follow motion. Default: 28 */
  damping?: number
  className?: string
  mediaClassName?: string
}

const isVideo = (src: string) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(src)

export function HoverMedia({
  children,
  src,
  type,
  alt = "",
  width = 220,
  aspectRatio = "4 / 3",
  tilt = 12,
  offset = 20,
  stiffness = 300,
  damping = 28,
  className,
  mediaClassName,
}: HoverMediaProps) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  // Only portal after the first hover so nothing renders during SSR/hydration
  const [armed, setArmed] = useState(false)

  const spring = { stiffness, damping, mass: 0.4 }
  const x = useSpring(useMotionValue(0), spring)
  const y = useSpring(useMotionValue(0), spring)
  const velocity = useVelocity(x)
  const rotate = useTransform(velocity, [-1500, 0, 1500], [-tilt, 0, tilt], { clamp: true })

  const video = type ? type === "video" : isVideo(src)

  const move = (e: React.PointerEvent) => {
    x.set(e.clientX + offset)
    y.set(e.clientY + offset)
  }

  return (
    <>
      <span
        className={cn(
          "cursor-default underline decoration-current/30 decoration-dotted underline-offset-[0.2em] transition-colors hover:decoration-current",
          className
        )}
        onPointerEnter={(e) => {
          x.jump(e.clientX + offset)
          y.jump(e.clientY + offset)
          setArmed(true)
          setOpen(true)
        }}
        onPointerMove={move}
        onPointerLeave={() => setOpen(false)}
      >
        {children}
      </span>

      {armed &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed left-0 top-0 z-[100]"
                style={{ x, y, rotate: reduced ? 0 : rotate }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.7, filter: "blur(6px)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={cn("overflow-hidden rounded-xl bg-muted shadow-2xl shadow-black/30", mediaClassName)}
                  style={{ width, aspectRatio, transformOrigin: "top left" }}
                >
                  {video ? (
                    <video src={src} autoPlay muted loop playsInline className="size-full object-cover" />
                  ) : (
                    <img src={src} alt={alt} className="size-full object-cover" />
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
