import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { features } from "@/lib/features"
import { ArrowLeft, Heart, RotateCcw } from "lucide-react"
import { ThanksConfetti } from "@/components/site/thanks-confetti"

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false },
}

export default async function ThanksPage({ searchParams }: PageProps<"/sponsor/thanks">) {
  if (!features.sponsors) notFound()
  const { status } = await searchParams
  // Dodo appends ?status=... to the return URL; anything but a failure is treated as success
  const failed = status === "failed" || status === "cancelled"

  return (
    <div className="mc-scroll grid flex-1 place-items-center rounded-3xl border bg-panel px-6 py-24 lg:overflow-y-auto">
      {!failed && <ThanksConfetti />}
      <div className="max-w-md text-center">
        <span className={`mx-auto grid size-12 place-items-center rounded-2xl ${failed ? "bg-foreground/[0.06] text-muted-foreground" : "bg-brand/12 text-brand"}`}>
          {failed ? <RotateCcw className="size-5" /> : <Heart className="size-5 fill-current" />}
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          {failed ? "The payment didn't go through" : "Thank you for sponsoring"}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          {failed
            ? "No charge was made. You can try again, or use a different payment method."
            : "You're helping keep tweenly free for everyone. A receipt is on its way to your inbox."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={failed ? "/sponsor" : "/docs"}
            className="flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
          >
            {failed ? "Try again" : "Back to the components"}
          </Link>
          {!failed && (
            <Link href="/" className="flex h-10 items-center gap-1.5 rounded-full border px-4 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-3.5" /> Home
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
