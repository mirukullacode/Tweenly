"use client"

import { useState } from "react"
import { as, type DemoMap, type Values } from "@/components/docs/demo-utils"
import {
  TableOfContents,
  type TableOfContentsProps,
  type TocItem,
} from "@/registry/new-york/table-of-contents/table-of-contents"

const ITEMS: TocItem[] = [
  { id: "toc-demo-installation", title: "Installation", level: 1 },
  { id: "toc-demo-prerequisites", title: "Prerequisites", level: 2 },
  { id: "toc-demo-installation-steps", title: "Installation Steps", level: 2 },
  { id: "toc-demo-configuration", title: "Configuration", level: 2 },
  { id: "toc-demo-usage", title: "Usage", level: 1 },
  { id: "toc-demo-customizing-content", title: "Customizing Content", level: 2 },
  { id: "toc-demo-submenu-content", title: "Submenu Content", level: 2 },
  { id: "toc-demo-features", title: "Features", level: 1 },
]

const PROSE = [
  "Every section in this guide builds on the previous one, so reading from top to bottom gives the clearest picture of how the pieces fit together.",
  "The defaults are chosen to work well for most projects. You can revisit any of these choices later without starting over.",
  "Small, focused steps keep the setup predictable. Each step can be verified on its own before moving to the next.",
  "When something looks off, compare your setup with the examples here and adjust one option at a time.",
]

function Demo({ values }: { values: Values }) {
  const props = as<Omit<TableOfContentsProps, "items" | "container">>(values)
  const [article, setArticle] = useState<HTMLDivElement | null>(null)

  return (
    <div className="grid h-full w-full self-stretch justify-self-stretch grid-cols-[minmax(0,1fr)_220px] gap-6 overflow-hidden p-6">
      <div ref={setArticle} className="mc-scroll min-h-0 overflow-y-auto pr-4 text-xs leading-relaxed text-muted-foreground">
        {ITEMS.map((item, i) => {
          const Heading = item.level === 1 ? "h2" : "h3"
          return (
            <section key={item.id} className="pb-6">
              <Heading
                id={item.id}
                className={
                  item.level === 1
                    ? "mb-3 mt-4 text-base font-semibold text-foreground/80"
                    : "mb-2 mt-2 text-sm font-medium text-foreground/70"
                }
              >
                {item.title}
              </Heading>
              <p className="mb-3">{PROSE[i % PROSE.length]}</p>
              <p className="mb-3">{PROSE[(i + 1) % PROSE.length]}</p>
              {item.level === 1 && <p>{PROSE[(i + 2) % PROSE.length]}</p>}
            </section>
          )
        })}
        <div className="h-64" />
      </div>
      <div className="min-h-0 pt-4">
        <TableOfContents {...props} items={ITEMS} container={article} />
      </div>
    </div>
  )
}

export const tocDemos: DemoMap = {
  "table-of-contents": ({ values }) => <Demo values={values} />,
}
