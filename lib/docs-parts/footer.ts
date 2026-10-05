import { classNameProp, num, type ComponentDoc } from "@/lib/docs-types"

export const footerDocs: ComponentDoc[] = [
  {
    slug: "footer",
    name: "Footer",
    exportName: "Footer",
    description:
      "Four premium, minimal footers: a sticky reveal uncovered as the page scrolls away, a giant kinetic wordmark, classic columns with a newsletter, and a curtain panel that expands to full bleed with a magnetic CTA.",
    category: "Sections",
    file: "registry/new-york/footer/footer.tsx",
    dependencies: ["gsap", "@gsap/react", "motion", "lucide-react"],
    isNew: true,
    preamble: `const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog", badge: "New" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers", badge: "Hiring" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Guides", href: "/guides" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
]

const socials = [
  { label: "GitHub", href: "https://github.com" },
  { label: "X", href: "https://x.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Dribbble", href: "https://dribbble.com" },
]`,
    staticProps: ["columns={columns}", "socials={socials}"],
    props: [
      {
        name: "variant",
        type: `"sticky-reveal" | "big-type" | "columns" | "curtain"`,
        default: "sticky-reveal",
        description: "Layout and motion style.",
        control: { type: "select", options: ["sticky-reveal", "big-type", "columns", "curtain"] },
      },
      {
        name: "brand",
        type: "string",
        default: "Motion",
        description: "Brand name, used for the giant wordmark and the default copyright.",
        control: { type: "text" },
      },
      {
        name: "description",
        type: "string",
        default: "Interfaces that feel quietly alive.",
        description: "Short line under the brand (the eyebrow in the curtain variant).",
        control: { type: "text" },
      },
      {
        name: "columns",
        type: "{ title: string; links: { label: string; href: string; badge?: string }[] }[]",
        description: "Link groups. Defaults to Product / Company / Resources.",
      },
      {
        name: "socials",
        type: "{ label: string; href: string; icon?: ReactNode }[]",
        description: "Social links. Icons for GitHub, X, LinkedIn, Dribbble, YouTube, Instagram and email are picked by label.",
      },
      { name: "logo", type: "ReactNode", description: "Mark shown before the brand name. Defaults to an accent dot." },
      {
        name: "newsletter",
        type: "boolean",
        default: true,
        description: "Show the newsletter form with an animated submit → check (columns and big-type).",
        control: { type: "boolean" },
      },
      {
        name: "onSubscribe",
        type: "(email: string) => Promise<void> | void",
        description: "Called with the email on submit. Throw or reject to show the error state.",
      },
      {
        name: "cta",
        type: "{ label: string; href: string }",
        default: `{ label: "Start a project", href: "#" }`,
        description: "Magnetic call-to-action button in the curtain variant.",
      },
      {
        name: "marqueeText",
        type: "string",
        default: "Let's work together",
        description: "Scrolling headline in the curtain variant.",
        control: { type: "text" },
      },
      {
        name: "copyright",
        type: "string",
        description: "Copyright line. Defaults to “© {year} {brand}. All rights reserved.”",
      },
      {
        name: "legal",
        type: "{ label: string; href: string }[]",
        description: "Links in the bottom bar. Defaults to Privacy / Terms / Cookies.",
      },
      {
        name: "background",
        type: "string",
        default: "var(--background)",
        description: "Footer background (any CSS color).",
        control: { type: "color" },
      },
      {
        name: "color",
        type: "string",
        default: "var(--foreground)",
        description: "Main text color.",
        control: { type: "color" },
      },
      {
        name: "accent",
        type: "string",
        default: "#ff4d12",
        description: "Accent for badges, focus rings, the CTA and hover states.",
        control: { type: "color" },
      },
      {
        name: "muted",
        type: "string",
        default: "var(--muted-foreground)",
        description: "Secondary text color for links and captions.",
        control: { type: "color" },
      },
      {
        name: "radius",
        type: "number",
        default: 12,
        description: "Corner radius of inputs and buttons; the curtain panel starts at twice this.",
        control: num(0, 32, 1, "px"),
      },
      {
        name: "height",
        type: "string",
        default: "70vh",
        demo: "90cqh",
        description: "Height of the sticky-reveal footer (any CSS length), capped at the scroller height.",
        control: { type: "select", options: ["70vh", "60cqh", "75cqh", "90cqh", "100cqh", "520px"] },
      },
      {
        name: "wordmarkSize",
        type: "number",
        default: 1,
        description: "Wordmark size relative to the width-filling size (1 = edge to edge).",
        control: num(0.3, 1, 0.05),
      },
      {
        name: "showWordmark",
        type: "boolean",
        default: true,
        description: "Show the giant wordmark (sticky-reveal and big-type).",
        control: { type: "boolean" },
      },
      {
        name: "animate",
        type: "boolean",
        default: true,
        description: "Run scroll and entrance animations. Reduced motion always renders the final state.",
        control: { type: "boolean" },
      },
      {
        name: "scroller",
        type: "HTMLElement | null",
        description: "Scroll container to track instead of the window.",
      },
      classNameProp,
    ],
  },
]
