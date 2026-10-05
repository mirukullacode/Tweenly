"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChartNoAxesColumn, Heart, MessageCircle, Repeat2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"

export type TweetCardVariant = "default" | "compact" | "minimal"

export interface TweetAuthor {
  /** Display name. */
  name: string
  /** Handle without the @. */
  handle: string
  /** Avatar image URL. Falls back to initials on a color derived from the handle. */
  avatar?: string
  /** Show the verified badge. Default: false */
  verified?: boolean
}

export interface TweetStats {
  /** Default: 0 */
  replies?: number
  /** Default: 0 */
  reposts?: number
  /** Likes, excluding the viewer's own like. Default: 0 */
  likes?: number
  /** Default: 0 */
  views?: number
}

export interface TweetCardProps {
  /** Who posted it. */
  author: TweetAuthor
  /** Post text. @mentions, #hashtags and URLs are highlighted automatically. */
  content: string
  /** Date label shown as-is, e.g. "Mar 4" or "2h". */
  date: string
  /** Up to 4 image URLs. Images that fail to load are hidden. */
  media?: string[]
  /** Engagement counts, shown compactly (1.2K). */
  stats?: TweetStats
  /** Makes the whole card a link, e.g. to the original post. */
  href?: string
  /** Layout density. Default: "default" */
  variant?: TweetCardVariant
  /** Start with the like button toggled on. Default: false */
  defaultLiked?: boolean
  /** Called when the like button toggles. */
  onLike?: (liked: boolean) => void
  /** Show the X logo in the corner. Default: true */
  showLogo?: boolean
  /** Color for links, mentions and hashtags (any CSS color). Default: "#ff4d12" */
  accent?: string
  className?: string
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const formatCount = (n: number) => compact.format(n)

const TOKEN = /(https?:\/\/[^\s]+|@\w+|#\w+)/g
const pop = { type: "spring", stiffness: 500, damping: 30 } as const

function hashHue(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % 360
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function Verified({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" aria-label="Verified account" role="img" className={className}>
      <path
        fill="#1d9bf0"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"
      />
      <path fill="#fff" d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  )
}

function Avatar({ author, size }: { author: TweetAuthor; size: number }) {
  const [failed, setFailed] = useState(false)
  const hue = hashHue(author.handle.toLowerCase())

  if (author.avatar && !failed) {
    return (
      <img
        src={author.avatar}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
        ref={(img) => {
          if (img && img.complete && img.naturalWidth === 0) setFailed(true)
        }}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: `hsl(${hue} 62% 46%)`,
      }}
    >
      {initials(author.name)}
    </span>
  )
}

function RichText({ text, accent, interactive }: { text: string; accent: string; interactive: boolean }) {
  return text.split(TOKEN).map((part, i) => {
    if (i % 2 === 0) return part
    const style = { color: accent }
    if (!interactive) return <span key={i} style={style}>{part}</span>
    const href = part.startsWith("@")
      ? `https://x.com/${part.slice(1)}`
      : part.startsWith("#")
        ? `https://x.com/hashtag/${part.slice(1)}`
        : part
    const label = part.startsWith("http") ? part.replace(/^https?:\/\/(www\.)?/, "") : part
    return (
      <a key={i} href={href} target="_blank" rel="noopener noreferrer" style={style} className="relative z-10 hover:underline">
        {label}
      </a>
    )
  })
}

function MediaGrid({ media }: { media: string[] }) {
  const [failed, setFailed] = useState<string[]>([])
  const visible = media.filter((src) => !failed.includes(src)).slice(0, 4)
  if (visible.length === 0) return null

  const fail = (src: string) => setFailed((f) => (f.includes(src) ? f : [...f, src]))
  const n = visible.length

  return (
    <div
      className={cn(
        "mt-3 grid gap-0.5 overflow-hidden rounded-xl border border-border",
        n === 1 ? "grid-cols-1" : "grid-cols-2",
        n === 1 ? "aspect-[16/10]" : n === 2 ? "aspect-[2/1]" : "aspect-[16/10] grid-rows-2"
      )}
    >
      {visible.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          onError={() => fail(src)}
          ref={(img) => {
            if (img && img.complete && img.naturalWidth === 0) fail(src)
          }}
          className={cn("size-full bg-foreground/[0.05] object-cover", n === 3 && i === 0 && "row-span-2")}
        />
      ))}
    </div>
  )
}

function LikeAction({
  likes,
  defaultLiked,
  onLike,
  reduced,
  showCount,
}: {
  likes: number
  defaultLiked: boolean
  onLike?: (liked: boolean) => void
  reduced: boolean
  showCount: boolean
}) {
  const [liked, setLiked] = useState(defaultLiked)
  const [burst, setBurst] = useState(0)
  const total = likes + (liked ? 1 : 0)

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      onClick={() => {
        const next = !liked
        setLiked(next)
        if (next) setBurst((b) => b + 1)
        onLike?.(next)
      }}
      className={cn(
        "group/like relative z-10 -m-1.5 flex items-center gap-1.5 rounded-full p-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#f91880]/60",
        liked ? "text-[#f91880]" : "hover:text-[#f91880]"
      )}
    >
      <span className="relative flex size-[18px] items-center justify-center">
        <AnimatePresence>
          {burst > 0 && liked && !reduced && (
            <motion.span
              key={burst}
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-[#f91880]"
              initial={{ scale: 0.3, opacity: 0.9 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>
        <motion.span
          key={String(liked)}
          className="flex"
          initial={reduced ? false : { scale: liked ? 0.3 : 0.8 }}
          animate={{ scale: 1 }}
          transition={pop}
        >
          <Heart className="size-[18px]" fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 1.75} />
        </motion.span>
      </span>
      {showCount && <span className="tabular-nums">{formatCount(total)}</span>}
    </button>
  )
}

export function TweetCard({
  author,
  content,
  date,
  media,
  stats,
  href,
  variant = "default",
  defaultLiked = false,
  onLike,
  showLogo = true,
  accent = "#ff4d12",
  className,
}: TweetCardProps) {
  const reduced = useReducedMotion()
  const isCompact = variant === "compact"
  const isMinimal = variant === "minimal"
  const avatarSize = isCompact ? 36 : isMinimal ? 32 : 42

  return (
    <article
      className={cn(
        "group/tweet relative text-left text-foreground",
        isMinimal
          ? "p-1"
          : cn(
              "rounded-2xl border border-border bg-card transition-colors",
              isCompact ? "p-3.5" : "p-5",
              href && "hover:bg-foreground/[0.03]"
            ),
        className
      )}
    >
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Post by ${author.name}`} className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d12]" />
      )}

      <header className="flex items-start gap-3">
        <Avatar author={author} size={avatarSize} />
        <div className={cn("min-w-0 flex-1", showLogo && "pr-6")}>
          <div className="flex items-center gap-1">
            <span className={cn("truncate font-semibold", isCompact || isMinimal ? "text-sm" : "text-[15px]")}>{author.name}</span>
            {author.verified && <Verified className="size-4 shrink-0" />}
          </div>
          <div className="flex items-center gap-1 truncate text-[13px] text-muted-foreground">
            <span className="truncate">@{author.handle}</span>
            {!isCompact && (
              <>
                <span aria-hidden="true">·</span>
                <time className="shrink-0">{date}</time>
              </>
            )}
          </div>
        </div>
        {showLogo && <XLogo className="absolute right-4 top-4 size-4 text-foreground/80" />}
      </header>

      <p
        className={cn(
          "whitespace-pre-wrap break-words",
          isCompact ? "mt-2 text-sm leading-snug" : isMinimal ? "mt-2.5 text-sm leading-relaxed text-foreground/90" : "mt-3 text-[15px] leading-relaxed"
        )}
      >
        <RichText text={content} accent={accent} interactive={!href} />
      </p>

      {!isCompact && !isMinimal && media && media.length > 0 && <MediaGrid media={media} />}

      {isCompact && <time className="mt-2 block text-xs text-muted-foreground">{date}</time>}

      {stats && !isMinimal && (
        <footer className={cn("flex items-center text-[13px] text-muted-foreground", isCompact ? "mt-2.5 gap-5" : "mt-4 justify-between pr-2")}>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            <span className="tabular-nums">{formatCount(stats.replies ?? 0)}</span>
            <span className="sr-only">replies</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Repeat2 className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            <span className="tabular-nums">{formatCount(stats.reposts ?? 0)}</span>
            <span className="sr-only">reposts</span>
          </span>
          <LikeAction likes={stats.likes ?? 0} defaultLiked={defaultLiked} onLike={onLike} reduced={reduced} showCount />
          {!isCompact && (
            <span className="flex items-center gap-1.5">
              <ChartNoAxesColumn className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              <span className="tabular-nums">{formatCount(stats.views ?? 0)}</span>
              <span className="sr-only">views</span>
            </span>
          )}
        </footer>
      )}
    </article>
  )
}

export interface TweetGridItem extends TweetCardProps {
  /** Stable key. Falls back to the index. */
  id?: string
}

export interface TweetGridProps {
  /** Posts to lay out. */
  tweets: TweetGridItem[]
  /** Maximum number of columns. Fewer are shown in narrow containers. Default: 3 */
  columns?: number
  /** Auto-scroll each column vertically like a marquee. Default: false */
  scroll?: boolean
  /** Scroll speed multiplier. Higher = faster. Default: 1 */
  speed?: number
  /** Scroll every other column in the opposite direction. Default: true */
  alternate?: boolean
  /** Pause a column while it is hovered. Default: true */
  pauseOnHover?: boolean
  /** Fade the top and bottom edges while scrolling. Default: true */
  fade?: boolean
  /** Height of the wall in px when scrolling. Default: 560 */
  height?: number
  /** Gap between cards in px. Default: 16 */
  gap?: number
  /** Variant applied to every card unless a tweet sets its own. Default: "default" */
  variant?: TweetCardVariant
  className?: string
}

// Columns appear as the container grows: 1 → 2 (36rem) → 3 (48rem) → 4 (64rem)
const columnVisibility = ["flex", "hidden @xl:flex", "hidden @3xl:flex", "hidden @5xl:flex"]

export function TweetGrid({
  tweets,
  columns = 3,
  scroll = false,
  speed = 1,
  alternate = true,
  pauseOnHover = true,
  fade = true,
  height = 560,
  gap = 16,
  variant = "default",
  className,
}: TweetGridProps) {
  const reduced = useReducedMotion()
  const cols = Math.min(4, Math.max(1, Math.round(columns)))

  const card = (t: TweetGridItem, i: number, hidden = false, key?: string) => {
    const { id, ...rest } = t
    return (
      <div key={key ?? id ?? i} aria-hidden={hidden || undefined} className="break-inside-avoid" style={{ marginBottom: scroll && !reduced ? 0 : gap }} {...(hidden ? { inert: true } : {})}>
        <TweetCard variant={variant} {...rest} />
      </div>
    )
  }

  if (!scroll || reduced) {
    return (
      <div className={cn("@container w-full", className)}>
        <div
          className="[column-count:1] @xl:[column-count:min(2,var(--tg-cols))] @3xl:[column-count:min(3,var(--tg-cols))] @5xl:[column-count:var(--tg-cols)]"
          style={{ "--tg-cols": cols, columnGap: gap } as React.CSSProperties}
        >
          {tweets.map((t, i) => card(t, i))}
        </div>
      </div>
    )
  }

  const buckets: { tweet: TweetGridItem; index: number }[][] = Array.from({ length: cols }, () => [])
  tweets.forEach((tweet, index) => buckets[index % cols].push({ tweet, index }))

  return (
    <div className={cn("@container w-full", className)}>
      <div
        className="flex overflow-hidden"
        style={{
          gap,
          height,
          // Alpha mask for edge fading, not a color gradient
          maskImage: fade ? "linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)" : undefined,
        }}
      >
        {buckets.map((bucket, c) => {
          // Repeat short columns so one copy is always taller than the viewport
          const repeats = Math.max(1, Math.ceil(4 / Math.max(1, bucket.length)))
          const unit = Array.from({ length: repeats }, (_, r) => bucket.map((b) => ({ ...b, r }))).flat()
          const duration = Math.max(8, unit.length * 9) / Math.max(0.1, speed)
          const reverse = alternate && c % 2 === 1
          return (
            <div key={c} className={cn("group/col min-w-0 flex-1 flex-col", columnVisibility[c])}>
              <div
                className={cn("flex flex-col", pauseOnHover && "group-hover/col:[animation-play-state:paused]")}
                style={{ animation: `tw-tweet-scroll ${duration}s linear infinite${reverse ? " reverse" : ""}` }}
              >
                {[0, 1].map((copy) => (
                  <div key={copy} aria-hidden={copy === 1 || undefined} className="flex flex-col" style={{ gap, paddingBottom: gap }}>
                    {unit.map(({ tweet, index, r }) => card(tweet, index, copy === 1 || r > 0, `${index}-${r}`))}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes tw-tweet-scroll { to { transform: translateY(-50%) } }`}</style>
    </div>
  )
}
