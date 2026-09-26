import { FadeIn } from "@/registry/new-york/fade-in/fade-in"
import { FadeInPlayground } from "../fade-in/playground"

export default function FadeInPreview() {
  return (
    <main className="mx-auto max-w-2xl space-y-16 px-6 py-16">
      <FadeIn>
        <h1 className="text-4xl font-bold">Fade In</h1>
        <p className="mt-2 text-muted-foreground">
          Scroll-triggered reveal. Tweak the props below.
        </p>
      </FadeIn>

      <FadeInPlayground />
    </main>
  )
}