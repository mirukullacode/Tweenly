export type Control =
  | { type: "select"; options: readonly string[] }
  | { type: "number"; min: number; max: number; step: number; unit?: string }
  | { type: "boolean" }
  | { type: "text" }
  | { type: "color" }
  /** Editable table of rows; the value is an array of objects. */
  | { type: "data" }

export type DataRow = Record<string, string | number>
export type PropValue = string | number | boolean | DataRow[]

export interface PropDoc {
  name: string
  type: string
  description: string
  default?: PropValue
  required?: boolean
  /** Renders a playground control for this prop. */
  control?: Control
  /** Starting value in the playground when it differs from `default`. */
  demo?: PropValue
}

export type Category =
  | "Text"
  | "Buttons"
  | "Interactive"
  | "Navigation"
  | "Forms"
  | "Feedback"
  | "Charts"
  | "Media"
  | "Scroll"
  | "Layout"
  | "AI"
  | "Cards"
  | "Sections"

export interface ComponentDoc {
  slug: string
  name: string
  exportName: string
  description: string
  category: Category
  file: string
  dependencies: string[]
  props: PropDoc[]
  /** Extra JSX attributes always shown in the usage snippet. */
  staticProps?: string[]
  /** Children shown in the usage snippet. */
  children?: string
  /** Code placed above the component in the usage snippet. */
  preamble?: string
  isNew?: boolean
}

export const classNameProp: PropDoc = {
  name: "className",
  type: "string",
  description: "Additional classes for the root element.",
}

export const num = (min: number, max: number, step: number, unit?: string): Control => ({
  type: "number",
  min,
  max,
  step,
  unit,
})
