import { cn } from "@/lib/utils"

export function DocPage({ title, description, children }: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="mc-scroll flex-1 rounded-3xl border bg-panel lg:overflow-y-auto">
      <article className="mx-auto max-w-2xl px-6 pb-24 pt-14 sm:pt-20">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-12 space-y-12">{children}</div>
      </article>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

export function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[14.5px] leading-7 text-muted-foreground", className)}>{children}</p>
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border bg-inset px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
      {children}
    </code>
  )
}

export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-10 [counter-reset:step]">{children}</ol>
}

export function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="relative space-y-3 border-l border-dashed pb-1 pl-8 [counter-increment:step] before:absolute before:-left-3 before:top-0 before:grid before:size-6 before:place-items-center before:rounded-full before:border before:bg-panel before:font-mono before:text-[11px] before:text-muted-foreground before:content-[counter(step)]">
      <h3 className="text-[15px] font-medium leading-6">{title}</h3>
      {children}
    </li>
  )
}
