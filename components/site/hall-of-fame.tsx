import { hallOfFame } from "@/lib/hall-of-fame"

const petal = (len: number, w: number) =>
  `M0 -10C${w} ${-10 - len * 0.3} ${w * 0.75} ${-10 - len * 0.8} 0 ${-10 - len}C${-w * 0.75} ${-10 - len * 0.8} ${-w} ${-10 - len * 0.3} 0 -10Z`

function SunflowerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="-32 -32 64 64" className={className} aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <path key={`a${i}`} d={petal(20, 5)} fill="#f59e0b" transform={`rotate(${i * 30 + 15})`} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <path key={`b${i}`} d={petal(17, 5)} fill="#ffc93c" transform={`rotate(${i * 30})`} />
      ))}
      <circle r="11" fill="#3b2412" />
    </svg>
  )
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })

/** Runner record holders. Renders nothing until lib/hall-of-fame.ts has an entry. */
export function HallOfFame() {
  if (hallOfFame.length === 0) return null
  const entries = [...hallOfFame].sort((a, b) => b.score - a.score)

  return (
    <section aria-labelledby="hall-of-fame-title" className="mx-auto w-full max-w-xl">
      <h2 id="hall-of-fame-title" className="text-sm font-medium text-muted-foreground">
        Hall of fame
      </h2>
      <ol className="mt-3 divide-y rounded-2xl border bg-card">
        {entries.map((entry, i) => (
          <li key={`${entry.name}-${entry.date}-${entry.score}`} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="flex w-6 justify-center tabular-nums text-muted-foreground">
              {i === 0 ? <SunflowerIcon className="size-5" /> : i + 1}
              {i === 0 ? <span className="sr-only">1</span> : null}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {entry.url ? (
                <a href={entry.url} target="_blank" rel="noreferrer nofollow" className="underline-offset-4 hover:underline">
                  {entry.name}
                </a>
              ) : (
                entry.name
              )}
            </span>
            <span className="tabular-nums">{entry.score.toLocaleString("en-US")}</span>
            <time dateTime={entry.date} className="hidden w-24 text-right text-muted-foreground sm:block">
              {formatDate(entry.date)}
            </time>
          </li>
        ))}
      </ol>
    </section>
  )
}
