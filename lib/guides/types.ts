/** Hand-written documentation for one component, shown in its Docs tab. */
export interface ComponentGuide {
  /** Two or three sentences: what it is and how it works under the hood. */
  overview: string
  /** Concrete situations where this component is the right choice. */
  whenToUse: string[]
  /** What it does, in user-facing terms. */
  features: string[]
  /** Keyboard, screen reader and reduced-motion behaviour, as implemented. */
  accessibility: string[]
  /** Customization and performance advice. */
  tips?: string[]
  /** Slugs of components that pair well with this one. */
  related?: string[]
}
