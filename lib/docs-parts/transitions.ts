import { classNameProp, num, type ComponentDoc } from "@/lib/docs-types"

const easeControl = { type: "select", options: ["power4", "expo", "circ", "sine"] } as const

export const transitionsDocs: ComponentDoc[] = [
  {
    slug: "page-loader",
    name: "Page Loader",
    exportName: "PageLoader",
    description:
      "Website intro loader orchestrated with GSAP timelines. Five exits: staggered stairs, rolling odometer, flashing greetings with a curved sweep, an iris that opens from a tick dial, and blinds.",
    category: "Feedback",
    file: "registry/new-york/page-loader/page-loader.tsx",
    dependencies: ["gsap", "@gsap/react"],
    children: "{/* your page */}",
    isNew: true,
    props: [
      {
        name: "variant",
        type: `"stairs" | "counter" | "words" | "iris" | "blinds"`,
        default: "stairs",
        description: "Visual style of the loader and its exit.",
        control: { type: "select", options: ["stairs", "counter", "words", "iris", "blinds"] },
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Page content, rendered underneath and revealed when loading finishes.",
      },
      {
        name: "duration",
        type: "number",
        default: 2.4,
        description: "Length of the simulated load, in seconds.",
        control: num(0.5, 8, 0.1, "s"),
      },
      { name: "progress", type: "number", description: "Controlled progress 0–100. The loader follows it and exits at 100." },
      {
        name: "words",
        type: "string[]",
        description: "Words flashed in sequence by the words variant. Defaults to greetings: Hello, Bonjour, Ciao, Hola…",
      },
      {
        name: "columns",
        type: "number",
        default: 5,
        description: "Number of columns (stairs) or bars (blinds).",
        control: num(1, 12, 1),
      },
      { name: "background", type: "string", default: "var(--foreground)", description: "Loader background. Inverts the theme by default.", control: { type: "color" } },
      { name: "color", type: "string", default: "var(--background)", description: "Text color.", control: { type: "color" } },
      {
        name: "accent",
        type: "string",
        default: "#ff4d12",
        description: "Accent for progress marks.",
        control: { type: "color" },
      },
      {
        name: "ease",
        type: `"power4" | "expo" | "circ" | "sine"`,
        default: "power4",
        description: "GSAP ease family used for the intro and exit.",
        control: easeControl,
      },
      {
        name: "exitDuration",
        type: "number",
        default: 1,
        description: "Length of the exit animation, in seconds.",
        control: num(0.3, 3, 0.05, "s"),
      },
      {
        name: "label",
        type: "string",
        default: "Loading",
        description: "Small label shown while loading.",
        control: { type: "text" },
      },
      {
        name: "showCounter",
        type: "boolean",
        default: true,
        description: "Show the percentage counter.",
        control: { type: "boolean" },
      },
      { name: "lockScroll", type: "boolean", default: true, description: "Prevent page scrolling while loading (fixed only)." },
      {
        name: "position",
        type: `"fixed" | "absolute"`,
        default: "fixed",
        description: "Cover the viewport, or the nearest positioned parent.",
      },
      { name: "onComplete", type: "() => void", description: "Called once the exit animation has finished." },
      classNameProp,
    ],
  },
  {
    slug: "page-transition",
    name: "Page Transition",
    exportName: "PageTransitionProvider",
    description:
      "Route transitions for the App Router: a provider covers the page, navigates, waits for the new route to render, then reveals it. Curtain, stairs, iris from the click point, card-deck slide and blinds.",
    category: "Navigation",
    file: "registry/new-york/page-transition/page-transition.tsx",
    dependencies: ["gsap", "@gsap/react"],
    isNew: true,
    preamble: `// app/layout.tsx: wrap your pages once with the provider below.
// Then, anywhere inside, swap <a> / <Link> for <TransitionLink>:
//
//   import { TransitionLink, usePageTransition } from "@/components/page-transition"
//
//   <TransitionLink href="/work">Work</TransitionLink>
//
//   const { navigate, isTransitioning } = usePageTransition()
//   navigate("/about", { label: "About" })`,
    children: "{children}",
    props: [
      {
        name: "variant",
        type: `"curtain" | "stairs" | "iris" | "slide" | "blinds"`,
        default: "curtain",
        description: "Transition style.",
        control: { type: "select", options: ["curtain", "stairs", "iris", "slide", "blinds"] },
      },
      {
        name: "duration",
        type: "number",
        default: 0.8,
        description: "Length of each phase (cover and reveal), in seconds.",
        control: num(0.2, 2.5, 0.05, "s"),
      },
      { name: "color", type: "string", default: "var(--foreground)", description: "Cover color. Inverts the theme by default.", control: { type: "color" } },
      {
        name: "foreground",
        type: "string",
        default: "var(--background)",
        description: "Text color on the cover.",
        control: { type: "color" },
      },
      {
        name: "accent",
        type: "string",
        default: "#ff4d12",
        description: "Accent dot beside the label.",
        control: { type: "color" },
      },
      {
        name: "label",
        type: "string | ((href: string) => string | undefined)",
        description: "Text shown on the cover. TransitionLink's own label overrides it.",
        control: { type: "text" },
      },
      {
        name: "columns",
        type: "number",
        default: 5,
        description: "Number of columns (stairs) or bars (blinds).",
        control: num(1, 12, 1),
      },
      {
        name: "ease",
        type: `"power4" | "expo" | "circ" | "sine"`,
        default: "power4",
        description: "GSAP ease family used for cover and reveal.",
        control: easeControl,
      },
      {
        name: "position",
        type: `"fixed" | "absolute"`,
        default: "fixed",
        description: "Cover the viewport, or the nearest positioned parent.",
      },
      {
        name: "navigate",
        type: "(href: string) => void | Promise<void>",
        description: "Performs the navigation. Defaults to useRouter().push and waits for usePathname() to change.",
      },
      { name: "children", type: "ReactNode", description: "Your pages." },
      {
        name: "className",
        type: "string",
        description: "Classes for the element wrapping your pages (the slide variant transforms it).",
      },
      { name: "overlayClassName", type: "string", description: "Classes for the cover overlay." },
    ],
  },
]
