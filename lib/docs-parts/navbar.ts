import { classNameProp, num, type ComponentDoc } from "@/lib/docs-types"

export const navbarDocs: ComponentDoc[] = [
  {
    slug: "navbar",
    name: "Navbar",
    exportName: "Navbar",
    description:
      "Five minimal, animated navigation bars: glass pill, scroll morph, sliding underline, dynamic island mega-menu and full-screen overlay.",
    category: "Navigation",
    file: "registry/new-york/navbar/navbar.tsx",
    dependencies: ["motion", "lucide-react"],
    isNew: true,
    preamble: `const links = [
  {
    label: "Product",
    href: "/product",
    children: [
      { label: "Analytics", href: "/analytics", description: "Understand every interaction." },
      { label: "Automations", href: "/automations", description: "Workflows that run themselves." },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
]`,
    staticProps: [`links={links}`, `cta={{ label: "Get started", href: "/start" }}`],
    props: [
      {
        name: "links",
        type: "{ label: string; href: string; description?: string; children?: { label: string; href: string; description?: string }[] }[]",
        required: true,
        description: "Top-level links. Links with children open a mega-menu in the island variant.",
      },
      {
        name: "variant",
        type: `"pill" | "morph" | "underline" | "island" | "overlay"`,
        default: "pill",
        description: "Visual style.",
        control: { type: "select", options: ["pill", "morph", "underline", "island", "overlay"] },
      },
      { name: "logo", type: "ReactNode", description: "Brand shown on the left. Defaults to a small wordmark." },
      { name: "cta", type: "{ label: string; href: string }", description: "Call-to-action button on the right." },
      { name: "activeHref", type: "string", description: "Href of the current page, marked as active." },
      {
        name: "scrollThreshold",
        type: "number",
        default: 40,
        description: "Scroll distance before the morph variant turns into a pill, in px.",
        control: num(0, 400, 10, "px"),
      },
      {
        name: "hideOnScroll",
        type: "boolean",
        default: true,
        description: "Hide on fast downward scroll and reveal on scroll up (morph).",
        control: { type: "boolean" },
      },
      {
        name: "position",
        type: `"fixed" | "sticky" | "absolute"`,
        default: "sticky",
        description: "CSS positioning of the bar.",
        control: { type: "select", options: ["sticky", "fixed", "absolute"] },
      },
      {
        name: "accentColor",
        type: "string",
        description: "Indicator and CTA color (any CSS color). Defaults to the foreground color.",
        control: { type: "color" },
      },
      {
        name: "scroller",
        type: "HTMLElement | null",
        description: "Element to read the scroll position from. Defaults to the window.",
      },
      {
        name: "onNavigate",
        type: "(href: string, e: MouseEvent) => void",
        description: "Called when a link is clicked. Call e.preventDefault() to handle routing yourself.",
      },
      classNameProp,
    ],
  },
]
