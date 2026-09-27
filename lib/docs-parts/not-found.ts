import { classNameProp, num, type ComponentDoc } from "@/lib/docs-types"

export const notFoundDocs: ComponentDoc[] = [
  {
    slug: "not-found",
    name: "404",
    exportName: "NotFound",
    description:
      "Five playful 404 sections with a giant status code as the hero: a cursor-following eyeball, a flashlight in a dark room, throwable digit tiles, an orbiting moon and a decoding error log.",
    category: "Sections",
    file: "registry/new-york/not-found/not-found.tsx",
    dependencies: ["motion", "lucide-react"],
    isNew: true,
    preamble: `// app/not-found.tsx: Next.js renders this for unmatched URLs and notFound()`,
    staticProps: [
      `primaryAction={{ label: "Back home", href: "/" }}`,
      `secondaryAction={{ label: "Browse docs", href: "/docs" }}`,
    ],
    props: [
      { name: "variant", type: '"eyes" | "spotlight" | "drag" | "orbit" | "scramble"', default: "eyes", description: "Hero style: eyeball that follows the cursor, flashlight reveal, throwable tiles, orbiting moon, or decoding glyphs with a typed error log.", control: { type: "select", options: ["eyes", "spotlight", "drag", "orbit", "scramble"] } },
      { name: "code", type: "string", default: "404", description: "Status code shown as the hero. Zeros become the eye or planet.", control: { type: "text" } },
      { name: "title", type: "string", default: "Page not found", description: "Short headline under the code.", control: { type: "text" } },
      { name: "description", type: "string", description: "Supporting line. Defaults to a short sentence matching the variant.", control: { type: "text" } },
      { name: "path", type: "string", description: "Requested path. Typed into the scramble log (falls back to the current URL) and shown as a chip in other variants.", control: { type: "text" }, demo: "/pricing-2019" },
      { name: "primaryAction", type: "{ label: string; href?: string; onClick?: () => void }", default: '{ label: "Back home", href: "/" }', description: "Primary button. Renders a link when href is set." },
      { name: "secondaryAction", type: "{ label: string; href?: string; onClick?: () => void } | null", default: '{ label: "Browse docs", href: "/docs" }', description: "Secondary button. Pass null to hide." },
      { name: "accent", type: "string", default: "#ff4d12", description: "Accent color for the iris, moon, glyphs and accent tile.", control: { type: "color" } },
      { name: "background", type: "string", description: "Section background. Theme background by default, #0a0a0a for spotlight and orbit.", control: { type: "color" } },
      { name: "color", type: "string", description: "Text and digit color. Theme foreground by default, #ededed for spotlight and orbit.", control: { type: "color" } },
      { name: "muted", type: "string", description: "Secondary text color. Theme muted foreground by default.", control: { type: "color" } },
      { name: "digitFont", type: '"display" | "sans" | "mono"', default: "display", description: "Typeface of the digits. Display is Barlow Condensed via --font-display.", control: { type: "select", options: ["display", "sans", "mono"] } },
      { name: "size", type: "number", default: 1, description: "Digit size multiplier. Digits scale with container query units.", control: num(0.5, 1.4, 0.05, "x") },
      { name: "animate", type: "boolean", default: true, description: "Enable animation. Reduced motion always renders static final states.", control: { type: "boolean" } },
      classNameProp,
    ],
  },
]
