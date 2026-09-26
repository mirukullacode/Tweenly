import { FadeIn } from "@/registry/new-york/fade-in/fade-in"
import { FadeInPlayground } from "./playground"

export default function FadeInPreview() {
  return (
    <main className="mx-auto max-w-2xl px-6">
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Scroll down ↓
      </div>

      <div className="space-y-6 pb-[50vh]">
        <FadeIn>
          <h1 className="text-4xl font-bold">Manjunath Irukulla</h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="text-lg text-muted-foreground">
            This paragraph fades in slightly after the heading.
          </p>
        </FadeIn>

        {[1, 2, 3].map((i) => (
          <FadeIn key={i} delay={i * 0.08}>
            <div className="rounded-xl border p-8">Card {i}</div>
          </FadeIn>
        ))}
      </div>
      <FadeInPlayground/>
    </main>
  )
}