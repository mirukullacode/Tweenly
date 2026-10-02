import { classNameProp, num, type ComponentDoc } from "@/lib/docs-types"

export const heroBgDocs: ComponentDoc[] = [
  {
    slug: "hero-background",
    name: "Hero Background",
    exportName: "HeroBackground",
    description:
      "Interactive canvas backgrounds for hero sections: dot grids, warping grids, constellations, waves, flow fields and pixel mosaics that react to the cursor.",
    category: "Interactive",
    file: "registry/new-york/hero-background/hero-background.tsx",
    dependencies: [],
    staticProps: [`className="min-h-[480px]"`],
    children: `<div className="relative z-10 grid min-h-[480px] place-items-center text-center">
    <h1 className="text-5xl font-semibold tracking-tight">Build something beautiful</h1>
  </div>`,
    isNew: true,
    props: [
      {
        name: "variant",
        type: `"dots" | "grid" | "particles" | "waves" | "flow" | "pixels"`,
        default: "dots",
        description: "Visual style: springy dot grid, gravity-well grid, constellation, layered waves, flow-field streaks or a hover-reveal pixel mosaic.",
        control: { type: "select", options: ["dots", "grid", "particles", "waves", "flow", "pixels"] },
      },
      { name: "color", type: "string", default: "currentColor", description: "Primary mark color (any CSS color, including CSS variables). Follows the text color, so it adapts to light and dark mode.", control: { type: "color" } },
      { name: "accent", type: "string", default: "#ff4d12", description: "Highlight color used near the cursor (any CSS color).", control: { type: "color" } },
      { name: "background", type: "string", default: "transparent", description: "Background fill behind the marks (any CSS color).", control: { type: "color" } },
      { name: "density", type: "number", default: 1, description: "Density multiplier. Higher packs dots, lines, cells and particles closer together.", control: num(0.4, 2.5, 0.1) },
      { name: "size", type: "number", default: 1.5, description: "Mark size in px: dot radius, line width, particle radius, or the gap between pixel cells.", control: num(0.5, 6, 0.25, "px") },
      { name: "speed", type: "number", default: 1, description: "Speed multiplier for the ambient motion.", control: num(0, 4, 0.1) },
      {
        name: "interaction",
        type: `"repel" | "attract" | "none"`,
        default: "repel",
        description: "How marks react to the cursor. \"none\" keeps marks in place and only highlights them.",
        control: { type: "select", options: ["repel", "attract", "none"] },
      },
      { name: "radius", type: "number", default: 160, description: "Cursor influence radius in px.", control: num(40, 400, 10, "px") },
      { name: "strength", type: "number", default: 1, description: "Strength of the cursor push, pull and highlight.", control: num(0, 3, 0.1) },
      { name: "opacity", type: "number", default: 0.35, description: "Opacity of the resting marks, 0 to 1. Marks near the cursor brighten towards full opacity.", control: num(0.05, 1, 0.05) },
      {
        name: "mask",
        type: `"none" | "radial" | "fade-bottom" | "fade-edges"`,
        default: "none",
        demo: "radial",
        description: "CSS mask over the canvas so foreground text stays readable.",
        control: { type: "select", options: ["none", "radial", "fade-bottom", "fade-edges"] },
      },
      { name: "clickRipple", type: "boolean", default: true, description: "Emit a ripple from the pointer on click or tap.", control: { type: "boolean" } },
      { name: "interactive", type: "boolean", default: true, description: "React to the pointer at all.", control: { type: "boolean" } },
      { name: "seed", type: "number", default: 1, description: "Seed for the deterministic layout and noise.", control: num(1, 100, 1) },
      { name: "fps", type: "number", default: 60, description: "Frame rate cap.", control: num(15, 120, 5) },
      { name: "children", type: "ReactNode", description: "Hero content rendered on top of the background." },
      classNameProp,
    ],
  },
]
