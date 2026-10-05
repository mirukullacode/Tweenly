import { classNameProp, num, type ComponentDoc } from "@/lib/docs-types"

export const preloaderDocs: ComponentDoc[] = [
  {
    slug: "preloader",
    name: "Preloader",
    exportName: "Preloader",
    description: "Full-screen loader with a counting percentage and rotating quotes that reveals the page at 100%.",
    category: "Feedback",
    file: "registry/new-york/preloader/preloader.tsx",
    dependencies: ["motion"],
    staticProps: [`quotes={quotes}`],
    children: "{/* your page */}",
    isNew: true,
    props: [
      { name: "children", type: "ReactNode", description: "Page content, revealed when loading finishes." },
      { name: "quotes", type: "{ text: string; author?: string }[]", description: "Quotes that cycle while loading." },
      { name: "duration", type: "number", default: 3, description: "Length of the simulated load, in seconds.", control: num(0.5, 8, 0.1, "s") },
      { name: "progress", type: "number", description: "Controlled progress 0–100. The counter follows it instead of simulating." },
      {
        name: "exit",
        type: `"curtain" | "split" | "fade"`,
        default: "curtain",
        description: "How the loader leaves.",
        control: { type: "select", options: ["curtain", "split", "fade"] },
      },
      { name: "background", type: "string", default: "var(--foreground)", description: "Overlay background. Inverts the theme by default.", control: { type: "color" } },
      { name: "color", type: "string", default: "var(--background)", description: "Text color.", control: { type: "color" } },
      { name: "accent", type: "string", default: "#ff6a2b", description: "Progress line color.", control: { type: "color" } },
      { name: "showCounter", type: "boolean", default: true, description: "Show the big percentage counter.", control: { type: "boolean" } },
      { name: "lockScroll", type: "boolean", default: true, description: "Prevent page scrolling while loading." },
      { name: "position", type: `"fixed" | "absolute"`, default: "fixed", description: "Cover the viewport, or the nearest positioned parent." },
      { name: "onComplete", type: "() => void", description: "Called once the exit animation has finished." },
      classNameProp,
    ],
  },
]
