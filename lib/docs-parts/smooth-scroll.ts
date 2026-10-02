import { num, type ComponentDoc } from "@/lib/docs-types"

export const smoothScrollDocs: ComponentDoc[] = [
  {
    slug: "smooth-scroll",
    name: "Smooth Scroll",
    exportName: "SmoothScroll",
    description:
      "Lenis smooth scrolling driven by the GSAP ticker, so every ScrollTrigger stays in sync. Works on the window or inside any scroll container, with a useLenis() hook.",
    category: "Scroll",
    file: "registry/new-york/smooth-scroll/smooth-scroll.tsx",
    dependencies: ["lenis", "gsap"],
    preamble: `// Wrap your app once, for example in app/layout.tsx.
// Read the instance anywhere below it: const lenis = useLenis(); lenis?.scrollTo("#pricing")`,
    children: "{children}",
    isNew: true,
    props: [
      { name: "children", type: "ReactNode", description: "Content that can read the Lenis instance with useLenis()." },
      { name: "wrapper", type: "HTMLElement | null", description: "Scroll container to smooth. Omit to smooth the whole page." },
      { name: "lerp", type: "number", default: 0.09, description: "Linear interpolation per frame. Lower is smoother and slower.", control: num(0.02, 0.3, 0.01) },
      { name: "wheelMultiplier", type: "number", default: 0.9, description: "Multiplier for mouse wheel distance.", control: num(0.3, 2, 0.1) },
      { name: "syncTouch", type: "boolean", default: false, description: "Smooth touch scrolling too. Usually best left off on phones.", control: { type: "boolean" } },
      { name: "anchors", type: "boolean", default: true, description: "Smooth-scroll to in-page #anchors.", control: { type: "boolean" } },
      { name: "enabled", type: "boolean", default: true, description: "Turn smoothing on or off without unmounting.", control: { type: "boolean" } },
    ],
  },
]
