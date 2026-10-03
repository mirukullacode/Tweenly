import { guidesA } from "./guides-a"
import { guidesB } from "./guides-b"
import { guidesC } from "./guides-c"
import type { ComponentGuide } from "./types"

const guides: Record<string, ComponentGuide> = { ...guidesA, ...guidesB, ...guidesC }

/** Hand-written docs for a component, if it has them. */
export function getGuide(slug: string): ComponentGuide | undefined {
  return guides[slug]
}

export const guideSlugs = Object.keys(guides)
