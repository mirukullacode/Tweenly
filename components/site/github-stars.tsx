"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Star } from "lucide-react"
import { githubUrl, siteConfig } from "@/lib/docs"
import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const CACHE_KEY = `tweenly:stars:${siteConfig.repo}`
const CACHE_MS = 30 * 60 * 1000

function readCache(): number | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { count, at } = JSON.parse(raw) as { count: number; at: number }
    return Date.now() - at < CACHE_MS ? count : null
  } catch {
    return null
  }
}

/** Live stargazer count; null until loaded or if the repo can't be reached. */
export function useGithubStars() {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const cached = readCache()
    // Resolve on a microtask so the effect body never sets state synchronously
    Promise.resolve(cached)
      .then((hit) =>
        hit !== null
          ? hit
          : fetch(`https://api.github.com/repos/${siteConfig.repo}`, { headers: { Accept: "application/vnd.github+json" } })
              .then((r) => (r.ok ? r.json() : null))
              .then((d: { stargazers_count?: number } | null) => {
                const count = d?.stargazers_count
                if (typeof count !== "number") return null
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({ count, at: Date.now() }))
                return count
              })
      )
      .then((count) => !cancelled && setStars(count))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return stars
}

export function formatStars(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n)
}

export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

/** "Star" pill with a live count that rolls in once loaded. */
export function GithubStars({ from, className }: { from: string; className?: string }) {
  const stars = useGithubStars()

  return (
    <a
      href={githubUrl}
      target="_blank"
      rel="noreferrer"
      data-tour="github"
      onClick={() => track("github_click", { from })}
      className={cn(
        "group inline-flex h-8 items-center gap-1.5 rounded-full border bg-panel/60 pl-2.5 pr-3 text-[12.5px] font-medium text-foreground/90 transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
    >
      <GithubIcon className="size-3.5" />
      <span>Star</span>
      <AnimatePresence initial={false}>
        {stars !== null && (
          <motion.span
            initial={{ opacity: 0, width: 0, filter: "blur(3px)" }}
            animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap tabular-nums text-muted-foreground"
          >
            <span className="h-3.5 w-px bg-border" />
            <Star className="size-3 transition-colors group-hover:fill-brand group-hover:text-brand" />
            {formatStars(stars)}
          </motion.span>
        )}
      </AnimatePresence>
    </a>
  )
}
