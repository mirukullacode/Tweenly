import { LIBRARIES, librariesOf, type ComponentDoc } from "@/lib/docs"
import { cn } from "@/lib/utils"

/** "Motion" / "GSAP" / "Lenis" chips, or "No animation library" for CSS and canvas components. */
export function LibraryBadges({ doc, className }: { doc: ComponentDoc; className?: string }) {
  const libs = librariesOf(doc)
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {libs.length === 0 ? (
        <span
          title="Built with CSS or canvas only, no animation library to install"
          className="inline-flex h-5 items-center gap-1.5 rounded-full border bg-inset px-2 text-[10.5px] font-medium text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-muted-foreground/60" />
          No animation library
        </span>
      ) : (
        libs.map((lib) => (
          <a
            key={lib}
            href={LIBRARIES[lib].url}
            target="_blank"
            rel="noreferrer"
            title={`Built with ${LIBRARIES[lib].name}: ${LIBRARIES[lib].blurb}`}
            className="inline-flex h-5 items-center gap-1.5 rounded-full border bg-inset px-2 text-[10.5px] font-medium text-foreground/85 transition-colors hover:text-foreground"
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: LIBRARIES[lib].color }} />
            {LIBRARIES[lib].name}
          </a>
        ))
      )}
    </div>
  )
}
