"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
  type Transition,
  type Variants,
} from "motion/react"
import { Check, Heart, MapPin, Minus, Plus, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type ProductCardBadge = string | { label: string; icon?: ReactNode }

export interface ProductCardProps {
  /** Image URLs shown as a swipeable carousel. Missing or broken images fall back to a tinted placeholder. Default: [] */
  images?: string[]
  /** Product name. */
  title: string
  /** Short description, clamped to three lines. */
  description?: string
  /** Price as a number. Default: 0 */
  price?: number
  /** Optional price per image. The price rolls to the new value when the image changes. */
  prices?: number[]
  /** Currency symbol shown before the price. Default: "₹" */
  currency?: string
  /** Locale used to format numbers. Default: "en-IN" */
  locale?: string
  /** Original price, shown struck through inside the price pill. */
  compareAt?: number
  /** Label for the top-right pill, e.g. "20% off". Hidden when empty. */
  discount?: string
  /** Chips shown under the description. Strings or `{ label, icon }`. Default: [] */
  badges?: ProductCardBadge[]
  /** Location chip with a pin icon, appended after the badges. */
  location?: string
  /** Label of the call-to-action button. Default: "Add to cart" */
  ctaLabel?: string
  /** Called with the quantity (1) when the button is pressed. */
  onAddToCart?: (quantity: number) => void
  /** Controlled quantity. 0 shows the button, anything above shows the stepper. */
  quantity?: number
  /** Initial quantity when uncontrolled. Default: 0 */
  defaultQuantity?: number
  /** Called whenever the quantity changes. */
  onQuantityChange?: (quantity: number) => void
  /** Upper bound of the stepper. Default: 99 */
  maxQuantity?: number
  /** Scrim and fallback color (any CSS color). Default: "#d9870b" */
  tint?: string
  /** Button background (any CSS color). Default: "#ffffff" */
  accent?: string
  /** Button text color (any CSS color). Default: "#0a0a0a" */
  accentForeground?: string
  /** Corner radius in px. Default: 28 */
  radius?: number
  /** CSS aspect ratio of the card. Default: "3 / 4.4" */
  aspect?: string
  /** Advance the carousel every N ms, or false to disable. Pauses on hover. Default: false */
  autoplay?: number | false
  /** Show a wishlist heart in the top-left corner. Default: false */
  wishlist?: boolean
  /** Initial wishlist state. Default: false */
  defaultWishlisted?: boolean
  /** Called when the heart is toggled. */
  onWishlistChange?: (wishlisted: boolean) => void
  /** How images fill the card. Default: "cover" */
  imageFit?: "cover" | "contain"
  className?: string
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const SPRING: Transition = { type: "spring", stiffness: 450, damping: 34 }
const GLASS = "border border-white/25 bg-white/[0.17] text-white backdrop-blur-md"

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

// Highlight position and blob rotation per slide so the fallback carousel still changes
const SPOTS: [number, number, number][] = [
  [30, 22, -18],
  [70, 26, 24],
  [46, 16, -40],
  [24, 34, 10],
  [64, 20, -6],
]

const slide: Variants = {
  enter: (d: number) => ({ opacity: 0, scale: 1.08, x: d * 36 }),
  center: { opacity: 1, scale: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, scale: 1.02, x: d * -36 }),
}

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE_OUT } },
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

function Fallback({ tint, index }: { tint: string; index: number }) {
  const [, , rot] = SPOTS[index % SPOTS.length]
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: `color-mix(in oklab, ${tint} 82%, #fff)` }}
    >
      <div
        className="absolute left-1/2 top-[33%] aspect-[1/1.12] w-[58%] -translate-x-1/2 -translate-y-1/2"
        style={{
          rotate: `${rot}deg`,
          borderRadius: "58% 42% 52% 48% / 62% 54% 46% 38%",
          backgroundColor: `color-mix(in oklab, ${tint} 55%, #fff)`,
          boxShadow: `0 40px 60px -24px color-mix(in oklab, ${tint} 45%, #000)`,
        }}
      />
      <div className="absolute inset-0 opacity-[0.22] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
    </div>
  )
}

function Slide({ src, alt, fit, tint, index }: { src?: string; alt: string; fit: "cover" | "contain"; tint: string; index: number }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading")
  return (
    <div className="absolute inset-0">
      <Fallback tint={tint} index={index} />
      {src && state !== "error" && (
        <img
          src={src}
          alt={alt}
          draggable={false}
          ref={(el) => {
            if (el?.complete) setState(el.naturalWidth > 0 ? "loaded" : "error")
          }}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className="absolute inset-0 size-full select-none transition-opacity duration-500"
          style={{ objectFit: fit, opacity: state === "loaded" ? 1 : 0 }}
        />
      )}
    </div>
  )
}

function Digit({ d, reduced }: { d: number; reduced: boolean }) {
  return (
    <span className="relative inline-block h-[1em] overflow-hidden leading-none">
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-d * 10}%` }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block h-[1em] leading-none">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

function Rolling({ value, locale, reduced }: { value: number; locale: string; reduced: boolean }) {
  const text = value.toLocaleString(locale)
  const chars = text.split("")
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex tabular-nums">
        {chars.map((c, i) => {
          const key = chars.length - i
          return /\d/.test(c) ? <Digit key={key} d={Number(c)} reduced={reduced} /> : <span key={`s${key}`}>{c}</span>
        })}
      </span>
    </>
  )
}

export function ProductCard({
  images = [],
  title,
  description,
  price = 0,
  prices,
  currency = "₹",
  locale = "en-IN",
  compareAt,
  discount,
  badges = [],
  location,
  ctaLabel = "Add to cart",
  onAddToCart,
  quantity: quantityProp,
  defaultQuantity = 0,
  onQuantityChange,
  maxQuantity = 99,
  tint = "#d9870b",
  accent = "#ffffff",
  accentForeground = "#0a0a0a",
  radius = 28,
  aspect = "3 / 4.4",
  autoplay = false,
  wishlist = false,
  defaultWishlisted = false,
  onWishlistChange,
  imageFit = "cover",
  className,
}: ProductCardProps) {
  const reduced = useReducedMotion()
  const t = (tr: Transition): Transition => (reduced ? { duration: 0 } : tr)

  const count = Math.max(images.length, 1)
  const [[index, dir], setPage] = useState<[number, number]>([0, 0])
  const [hovered, setHovered] = useState(false)
  const [innerQty, setInnerQty] = useState(defaultQuantity)
  const [bump, setBump] = useState(0)
  const [liked, setLiked] = useState(defaultWishlisted)
  const [likeTick, setLikeTick] = useState(0)

  const current = index % count
  const qty = clamp(quantityProp ?? innerQty, 0, maxQuantity)
  const inCart = qty > 0
  const shownPrice = prices?.[current] ?? price

  const dragX = useMotionValue(0)
  const parallax = useTransform(dragX, (v) => v * 0.22)

  const goTo = (next: number, direction?: number) => {
    const wrapped = ((next % count) + count) % count
    if (wrapped === current) return
    setPage([wrapped, direction ?? (wrapped > current ? 1 : -1)])
  }

  useEffect(() => {
    if (!autoplay || count < 2 || hovered || reduced) return
    const id = setInterval(() => setPage(([i]) => [(i + 1) % count, 1]), autoplay)
    return () => clearInterval(id)
  }, [autoplay, count, hovered, reduced])

  const onPan = (_: PointerEvent, info: PanInfo) => {
    if (count > 1 && !reduced) dragX.set(info.offset.x)
  }

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.2
    if (count > 1 && Math.abs(swipe) > 60 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
      goTo(current + (swipe < 0 ? 1 : -1), swipe < 0 ? 1 : -1)
    }
    animate(dragX, 0, t(SPRING))
  }

  const setQty = (next: number) => {
    const v = clamp(next, 0, maxQuantity)
    if (v === qty) return
    if (quantityProp === undefined) setInnerQty(v)
    if (v > qty) setBump((b) => b + 1)
    onQuantityChange?.(v)
  }

  const addToCart = () => {
    setQty(1)
    onAddToCart?.(1)
  }

  const toggleLike = () => {
    const next = !liked
    setLiked(next)
    if (next) setLikeTick((n) => n + 1)
    onWishlistChange?.(next)
  }

  const chips = [
    ...badges.map((b) => (typeof b === "string" ? { label: b, icon: undefined } : b)),
    ...(location ? [{ label: location, icon: <MapPin className="size-3.5" strokeWidth={2.2} /> }] : []),
  ]

  return (
    <motion.article
      className={cn(
        "@container relative isolate w-full max-w-[320px] touch-pan-y select-none overflow-hidden text-white shadow-2xl shadow-black/20",
        className
      )}
      style={{ aspectRatio: aspect, borderRadius: radius, backgroundColor: tint } as CSSProperties}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onPan={onPan}
      onPanEnd={onPanEnd}
      aria-roledescription="product card"
      aria-label={title}
    >
      {/* images */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ x: parallax }}
        animate={{ scale: hovered && !reduced ? 1.06 : 1 }}
        transition={{ duration: 1.1, ease: EASE_OUT }}
      >
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={current}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={t({ duration: 0.7, ease: EASE_OUT })}
            className="absolute inset-0"
          >
            <Slide src={images[current]} alt={images.length > 1 ? `${title}, image ${current + 1} of ${count}` : title} fit={imageFit} tint={tint} index={current} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* top row */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
        {wishlist ? (
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(GLASS, "relative grid size-9 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/70")}
          >
            <AnimatePresence>
              {likeTick > 0 && liked && !reduced && (
                <motion.span
                  key={likeTick}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border-2 border-white"
                  initial={{ scale: 0.6, opacity: 0.9 }}
                  animate={{ scale: 1.7, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                />
              )}
            </AnimatePresence>
            <motion.span
              key={likeTick}
              className="grid"
              initial={likeTick > 0 && !reduced ? { scale: 0.6 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
            >
              <Heart className={cn("size-4 transition-colors", liked && "fill-white")} strokeWidth={2.2} />
            </motion.span>
          </button>
        ) : (
          <span />
        )}
        {discount && (
          <motion.span
            className={cn(GLASS, "rounded-full px-3 py-1 text-[13px] font-medium")}
            initial={reduced ? false : { opacity: 0, y: -8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }}
          >
            {discount}
          </motion.span>
        )}
      </div>

      {/* content */}
      <motion.div
        className="absolute inset-x-0 bottom-0 flex flex-col p-[clamp(14px,6.5cqw,24px)]"
        // Solid tinted scrim behind the text keeps it legible over any image
        style={{ backgroundColor: `color-mix(in oklab, ${tint} 90%, transparent)` }}
        variants={list}
        initial={reduced ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        {count > 1 && (
          <motion.div variants={item} className="mb-3 flex items-center gap-1.5">
            {images.map((_, i) => (
              <motion.button
                key={i}
                type="button"
                layout
                aria-label={`Show image ${i + 1}`}
                aria-current={i === current}
                onClick={() => goTo(i)}
                transition={t(SPRING)}
                style={{ borderRadius: 999 }}
                className={cn(
                  "h-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70",
                  i === current ? "w-5 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
                )}
              />
            ))}
          </motion.div>
        )}

        <motion.div variants={item} className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 break-words text-[clamp(22px,9.5cqw,44px)] font-bold leading-[1.05] tracking-tight [overflow-wrap:anywhere]">{title}</h3>
          <span className={cn(GLASS, "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[17px] font-semibold leading-none")}>
            {compareAt !== undefined && compareAt > shownPrice && (
              <s className="text-[12px] font-medium text-white/65">
                {currency}
                {compareAt.toLocaleString(locale)}
              </s>
            )}
            <span className="inline-flex items-center">
              {currency}
              <Rolling value={shownPrice} locale={locale} reduced={reduced} />
            </span>
          </span>
        </motion.div>

        {description && (
          <motion.p variants={item} className="mt-2 line-clamp-3 text-[clamp(12px,4.6cqw,15px)] leading-snug text-white/80">
            {description}
          </motion.p>
        )}

        {chips.length > 0 && (
          <motion.div variants={item} className="mt-3 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <span key={`${c.label}-${i}`} className={cn(GLASS, "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-medium")}>
                {c.icon}
                {c.label}
              </span>
            ))}
          </motion.div>
        )}

        <motion.div variants={item} className="relative mt-4 flex h-12 items-center justify-end">
          <AnimatePresence>
            {inCart && (
              <motion.div
                key="added"
                className={cn(GLASS, "absolute inset-y-0 left-0 right-[calc(136px+8px)] flex items-center justify-center gap-2 rounded-full text-sm font-medium")}
                initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                transition={t({ duration: 0.4, ease: EASE_OUT, delay: 0.08 })}
              >
                <motion.span
                  key={bump}
                  className="relative grid"
                  initial={reduced ? false : { scale: 1, rotate: 0 }}
                  animate={reduced ? undefined : { scale: [1, 1.3, 0.92, 1], rotate: [0, -12, 6, 0] }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                >
                  <ShoppingCart className="size-4" strokeWidth={2.2} />
                  <span className="absolute -right-1.5 -top-1.5 grid size-3 place-items-center rounded-full bg-white" style={{ color: tint }}>
                    <Check className="size-2.5" strokeWidth={3.5} />
                  </span>
                </motion.span>
                Added
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            layout
            transition={t(SPRING)}
            className={cn("relative h-12 shrink-0 overflow-hidden", inCart ? "w-[136px]" : "w-full")}
            style={{ borderRadius: 999, backgroundColor: accent, color: accentForeground }}
          >
            <AnimatePresence initial={false}>
              {inCart ? (
                <motion.div
                  key="stepper"
                  layout="position"
                  className="absolute inset-0 flex items-center justify-between px-1.5"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={t({ duration: 0.3, ease: EASE_OUT })}
                >
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty(qty - 1)}
                    className="grid size-9 place-items-center rounded-full outline-none transition hover:bg-black/[0.06] focus-visible:ring-2 focus-visible:ring-black/20 active:scale-90"
                  >
                    <Minus className="size-4" strokeWidth={2.4} />
                  </button>
                  <span className="text-base font-semibold leading-none" aria-live="polite">
                    <Rolling value={qty} locale={locale} reduced={reduced} />
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={qty >= maxQuantity}
                    onClick={() => setQty(qty + 1)}
                    className="grid size-9 place-items-center rounded-full outline-none transition hover:bg-black/[0.06] focus-visible:ring-2 focus-visible:ring-black/20 active:scale-90 disabled:opacity-40"
                  >
                    <Plus className="size-4" strokeWidth={2.4} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="cta"
                  type="button"
                  layout="position"
                  onClick={addToCart}
                  className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={reduced ? undefined : { scale: 0.97 }}
                  transition={t({ duration: 0.3, ease: EASE_OUT })}
                >
                  <span className="whitespace-nowrap">{ctaLabel}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.article>
  )
}
