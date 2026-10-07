import type { Metadata } from "next"
import Link from "next/link"
import {
  achievementImageUrl,
  achievementQuery,
  achievementShareUrl,
  formatDate,
  formatScore,
  parseAchievementParams,
} from "@/lib/achievement-card"
import { CopyLinkButton } from "@/components/site/achievement-dialog"

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

async function readCard(searchParams: Props["searchParams"]) {
  const { name, score, date, character } = parseAchievementParams(await searchParams)
  return { name, score, date, character, displayName: name || "A tweenly runner" }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const card = await readCard(searchParams)
  const title = `${card.displayName} set a new record on tweenly runner`
  const description = `${formatScore(card.score)} points on ${formatDate(card.date)}. Think you can beat it?`
  const image = {
    url: achievementImageUrl(card, "wide"),
    width: 1200,
    height: 630,
    alt: `${card.displayName}: new high score of ${formatScore(card.score)} on tweenly runner`,
  }
  return {
    title,
    description,
    robots: { index: false },
    alternates: { canonical: achievementShareUrl(card) },
    openGraph: { title, description, url: achievementShareUrl(card), type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  }
}

const buttonBase =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"

export default async function AchievementPage({ searchParams }: Props) {
  const card = await readCard(searchParams)
  const shareUrl = achievementShareUrl(card)
  const shareText = `${card.displayName} set a new record on tweenly runner: ${formatScore(card.score)}`
  const xUrl = `https://x.com/intent/tweet?${new URLSearchParams({ text: shareText, url: shareUrl })}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: shareUrl })}`

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic PNG from our own route */}
        <img
          src={`/api/achievement/image?${achievementQuery({ ...card, format: "portrait" })}`}
          alt={`${card.displayName}'s tweenly runner record card: ${formatScore(card.score)}`}
          width={1080}
          height={1350}
          className="h-auto w-full rounded-2xl border bg-card"
        />
        <p className="text-balance text-muted-foreground">
          <span className="text-foreground">{card.displayName}</span> scored{" "}
          <span className="tabular-nums text-foreground">{formatScore(card.score)}</span> on {formatDate(card.date)}.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/#runner"
            className={`${buttonBase} border-transparent bg-foreground text-background hover:opacity-90`}
          >
            Play the game
          </Link>
          <a href={xUrl} target="_blank" rel="noreferrer" className={`${buttonBase} bg-card hover:bg-muted`}>
            Share on X
          </a>
          <a href={linkedInUrl} target="_blank" rel="noreferrer" className={`${buttonBase} bg-card hover:bg-muted`}>
            LinkedIn
          </a>
          <CopyLinkButton url={shareUrl} className={`${buttonBase} bg-card hover:bg-muted`} />
        </div>
      </div>
    </main>
  )
}
