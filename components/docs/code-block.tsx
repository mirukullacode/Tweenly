"use client"

import { useMemo } from "react"
import { highlight } from "sugar-high"
import { cn } from "@/lib/utils"
import { CopyButton } from "./copy-button"

export function CodeBlock({
  code,
  lineNumbers = true,
  className,
  onCopy,
}: {
  code: string
  lineNumbers?: boolean
  className?: string
  onCopy?: () => void
}) {
  const html = useMemo(() => highlight(code.trimEnd()), [code])

  return (
    <div className={cn("group relative min-h-0 rounded-2xl border bg-inset", className)}>
      <CopyButton
        value={code}
        onCopy={onCopy}
        className="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
      <pre className="mc-scroll h-full overflow-auto py-4 pr-12 font-mono text-[12.5px] leading-[1.6]">
        <code
          className={cn("block w-max min-w-full", lineNumbers ? "code-lines" : "pl-4")}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  )
}
