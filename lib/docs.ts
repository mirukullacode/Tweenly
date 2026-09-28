import { classNameProp, num, type Category, type ComponentDoc, type DataRow, type PropDoc, type PropValue } from "./docs-types"

import { buttonsADocs } from "./docs-parts/buttons-a"
import { buttonsBDocs } from "./docs-parts/buttons-b"
import { navbarDocs } from "./docs-parts/navbar"
import { tocDocs } from "./docs-parts/toc"
import { otpDocs } from "./docs-parts/otp"
import { chartsCartesianDocs } from "./docs-parts/charts-cartesian"
import { chartsPolarDocs } from "./docs-parts/charts-polar"
import { chartsStatsDocs } from "./docs-parts/charts-stats"
import { preloaderDocs } from "./docs-parts/preloader"
import { footerDocs } from "./docs-parts/footer"
import { faqConfettiDocs } from "./docs-parts/faq-confetti"
import { transitionsDocs } from "./docs-parts/transitions"
import { feedsDocs } from "./docs-parts/feeds"
import { cardsDocs } from "./docs-parts/cards"
import { notFoundDocs } from "./docs-parts/not-found"
import { envelopeDocs } from "./docs-parts/envelope"
import { latestRelease } from "./changelog"

export type { Category, ComponentDoc, Control, DataRow, PropDoc, PropValue } from "./docs-types"

export const siteConfig = {
  name: "tweenly",
  description:
    "Beautifully crafted animated components. Tweak them live, copy the code, and own it.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "The motion layer for shadcn/ui",
  /** owner/repo on GitHub; powers the star button and source links. */
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO ?? "mirukullacode/tweenly",
  /** X / Twitter handle without the @, used in share cards. Leave empty to omit. */
  twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? "MIrukulla",
  keywords: [
    "shadcn",
    "shadcn/ui",
    "react animation",
    "animated components",
    "framer motion",
    "motion",
    "gsap",
    "tailwind",
    "next.js",
    "ui library",
  ],
}

export const githubUrl = `https://github.com/${siteConfig.repo}`

const className: PropDoc = classNameProp

const once = (what = "Animate"): PropDoc => ({
  name: "once",
  type: "boolean",
  default: true,
  description: `${what} only the first time it enters the viewport.`,
})

const baseComponents: ComponentDoc[] = [
  // ---------------------------------------------------------------- Text
  {
    slug: "fade-in",
    name: "Fade In",
    exportName: "FadeIn",
    description: "Scroll-triggered reveal with direction, distance, easing, scale and blur.",
    category: "Text",
    file: "registry/new-york/fade-in/fade-in.tsx",
    dependencies: ["motion"],
    children: `<div className="rounded-2xl border p-8">Hello, tweenly</div>`,
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Content to reveal." },
      {
        name: "direction",
        type: `"up" | "down" | "left" | "right" | "none"`,
        default: "up",
        description: "Direction the element travels while appearing.",
        control: { type: "select", options: ["up", "down", "left", "right", "none"] },
      },
      { name: "distance", type: "number", default: 24, demo: 40, description: "Travel distance in px.", control: num(0, 160, 4, "px") },
      { name: "duration", type: "number", default: 0.6, description: "Animation length in seconds.", control: num(0.1, 3, 0.05, "s") },
      { name: "delay", type: "number", default: 0, description: "Delay before starting, in seconds.", control: num(0, 2, 0.05, "s") },
      {
        name: "ease",
        type: `"smooth" | "snappy" | "linear" | "spring"`,
        default: "smooth",
        description: "Easing preset.",
        control: { type: "select", options: ["smooth", "snappy", "linear", "spring"] },
      },
      { name: "scale", type: "number", default: 1, description: "Starting scale (1 = no scale).", control: num(0.5, 1.5, 0.05) },
      { name: "blur", type: "number", default: 0, description: "Starting blur in px.", control: num(0, 24, 1, "px") },
      once(),
      { name: "amount", type: "number", default: 0.2, description: "Fraction of the element that must be visible, 0 to 1." },
      className,
    ],
  },
  {
    slug: "text-reveal",
    name: "Text Reveal",
    exportName: "TextReveal",
    description: "Word-by-word or character-by-character reveal with blur and stagger.",
    category: "Text",
    file: "registry/new-york/text-reveal/text-reveal.tsx",
    dependencies: ["motion"],
    staticProps: [`className="text-4xl font-semibold tracking-tight"`],
    isNew: true,
    props: [
      {
        name: "text",
        type: "string",
        required: true,
        demo: "Motion that feels considered, not decorated.",
        description: "The text to animate.",
        control: { type: "text" },
      },
      { name: "split", type: `"word" | "char"`, default: "word", description: "Animate each word or each character.", control: { type: "select", options: ["word", "char"] } },
      { name: "direction", type: `"up" | "down" | "none"`, default: "up", description: "Direction each piece travels from.", control: { type: "select", options: ["up", "down", "none"] } },
      { name: "stagger", type: "number", default: 0.06, description: "Delay between pieces, in seconds.", control: num(0, 0.3, 0.005, "s") },
      { name: "duration", type: "number", default: 0.5, description: "Duration of each piece, in seconds.", control: num(0.1, 2, 0.05, "s") },
      { name: "delay", type: "number", default: 0, description: "Delay before the first piece, in seconds.", control: num(0, 2, 0.05, "s") },
      { name: "blur", type: "number", default: 8, description: "Starting blur in px.", control: num(0, 24, 1, "px") },
      { name: "distance", type: "number", default: 16, description: "Travel distance in px.", control: num(0, 60, 1, "px") },
      once(),
      { name: "as", type: `"p" | "h1" | "h2" | "h3" | "span"`, default: "p", description: "Element to render as." },
      className,
    ],
  },
  {
    slug: "typewriter",
    name: "Typewriter",
    exportName: "Typewriter",
    description: "Types and deletes a list of phrases with a blinking cursor.",
    category: "Text",
    file: "registry/new-york/typewriter/typewriter.tsx",
    dependencies: ["motion"],
    staticProps: [`words={["Design", "Develop", "Deploy"]}`, `className="text-4xl font-semibold"`],
    isNew: true,
    props: [
      { name: "words", type: "string[]", required: true, description: "Words or phrases to type, in order." },
      { name: "typeSpeed", type: "number", default: 70, description: "Milliseconds per typed character.", control: num(10, 250, 5, "ms") },
      { name: "deleteSpeed", type: "number", default: 40, description: "Milliseconds per deleted character.", control: num(10, 200, 5, "ms") },
      { name: "pause", type: "number", default: 1400, description: "Pause after a word is typed, in ms.", control: num(200, 5000, 100, "ms") },
      { name: "loop", type: "boolean", default: true, description: "Cycle through the words forever.", control: { type: "boolean" } },
      { name: "cursor", type: "boolean", default: true, description: "Show a blinking cursor.", control: { type: "boolean" } },
      { name: "cursorChar", type: "string", default: "|", description: "Character used for the cursor.", control: { type: "text" } },
      className,
      { name: "cursorClassName", type: "string", description: "Additional classes for the cursor." },
    ],
  },
  {
    slug: "word-rotate",
    name: "Word Rotate",
    exportName: "WordRotate",
    description: "Cycles through words with slide, fade, blur or flip transitions.",
    category: "Text",
    file: "registry/new-york/word-rotate/word-rotate.tsx",
    dependencies: ["motion"],
    preamble: "Build interfaces that feel",
    staticProps: [`words={["fast", "fluid", "alive"]}`],
    isNew: true,
    props: [
      { name: "words", type: "string[]", required: true, description: "Words to cycle through." },
      { name: "interval", type: "number", default: 2200, description: "Time each word stays visible, in ms.", control: num(600, 5000, 100, "ms") },
      {
        name: "effect",
        type: `"slide" | "fade" | "blur" | "flip"`,
        default: "slide",
        description: "Transition style between words.",
        control: { type: "select", options: ["slide", "fade", "blur", "flip"] },
      },
      { name: "duration", type: "number", default: 0.4, description: "Transition duration in seconds.", control: num(0.1, 1.5, 0.05, "s") },
      className,
    ],
  },
  {
    slug: "shimmer-text",
    name: "Shimmer Text",
    exportName: "ShimmerText",
    description: "A band of light that sweeps across text on a loop.",
    category: "Text",
    file: "registry/new-york/shimmer-text/shimmer-text.tsx",
    dependencies: ["motion"],
    staticProps: [`className="text-4xl font-semibold"`],
    children: "Generating response…",
    props: [
      { name: "children", type: "string", required: true, description: "Text to shimmer." },
      { name: "duration", type: "number", default: 2, description: "Seconds for one sweep.", control: num(0.3, 6, 0.1, "s") },
      { name: "spread", type: "number", default: 60, description: "Width of the highlight band in px.", control: num(10, 240, 5, "px") },
      { name: "repeatDelay", type: "number", default: 0.4, description: "Pause between sweeps, in seconds.", control: num(0, 3, 0.1, "s") },
      { name: "baseColor", type: "string", default: "var(--muted-foreground)", description: "Base text color (any CSS color).", control: { type: "color" } },
      { name: "shimmerColor", type: "string", default: "var(--foreground)", description: "Highlight color (any CSS color).", control: { type: "color" } },
      className,
    ],
  },
  {
    slug: "number-ticker",
    name: "Number Ticker",
    exportName: "NumberTicker",
    description: "Counts up to a value when scrolled into view.",
    category: "Text",
    file: "registry/new-york/number-ticker/number-ticker.tsx",
    dependencies: ["motion"],
    staticProps: [`className="text-6xl font-semibold tracking-tight"`],
    props: [
      { name: "value", type: "number", required: true, demo: 12480, description: "Final value.", control: num(0, 1000000, 1) },
      { name: "from", type: "number", default: 0, description: "Starting value.", control: num(0, 1000000, 1) },
      { name: "duration", type: "number", default: 2, description: "Animation length in seconds.", control: num(0.2, 8, 0.1, "s") },
      { name: "delay", type: "number", default: 0, description: "Delay before counting, in seconds.", control: num(0, 3, 0.1, "s") },
      { name: "decimals", type: "number", default: 0, description: "Number of decimal places.", control: num(0, 4, 1) },
      { name: "prefix", type: "string", default: "", description: "Text rendered before the number.", control: { type: "text" } },
      { name: "suffix", type: "string", default: "", description: "Text rendered after the number.", control: { type: "text" } },
      { name: "separator", type: "boolean", default: true, description: "Group thousands with the locale separator.", control: { type: "boolean" } },
      once("Count"),
      className,
    ],
  },

  // --------------------------------------------------------- Interactive
  {
    slug: "fill-button",
    name: "Fill Button",
    exportName: "FillButton",
    description: "Button with a GSAP clip-path fill that sweeps in on hover and focus.",
    category: "Interactive",
    file: "registry/new-york/fill-button/fill-button.tsx",
    dependencies: ["gsap"],
    children: "Hover me",
    props: [
      {
        name: "direction",
        type: `"up" | "down" | "left" | "right"`,
        default: "up",
        description: "Direction the fill sweeps toward.",
        control: { type: "select", options: ["up", "down", "left", "right"] },
      },
      { name: "duration", type: "number", default: 0.45, description: "Sweep length in seconds.", control: num(0.1, 2, 0.05, "s") },
      {
        name: "ease",
        type: "string",
        default: "power3.out",
        description: "Any GSAP ease string.",
        control: {
          type: "select",
          options: ["power3.out", "power2.inOut", "expo.out", "back.out(1.7)", "elastic.out(1, 0.6)", "none"],
        },
      },
      { name: "...props", type: "ButtonHTMLAttributes", description: "All native button attributes are forwarded." },
    ],
  },
  {
    slug: "magnetic",
    name: "Magnetic",
    exportName: "Magnetic",
    description: "Wrap anything to make it drift toward the cursor on a spring.",
    category: "Interactive",
    file: "registry/new-york/magnetic/magnetic.tsx",
    dependencies: ["motion"],
    children: `<button className="rounded-full bg-foreground px-6 py-3 text-background">Get started</button>`,
    isNew: true,
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Element to make magnetic." },
      { name: "strength", type: "number", default: 0.35, description: "How far the element follows the cursor, 0 to 1.", control: num(0, 1, 0.05) },
      { name: "range", type: "number", default: 40, description: "Extra hit area around the element, in px.", control: num(0, 160, 5, "px") },
      { name: "stiffness", type: "number", default: 180, description: "Spring stiffness. Higher is snappier.", control: num(20, 800, 10) },
      { name: "damping", type: "number", default: 14, description: "Spring damping. Higher is less wobbly.", control: num(2, 60, 1) },
      className,
    ],
  },
  {
    slug: "tilt-card",
    name: "Tilt Card",
    exportName: "TiltCard",
    description: "3D perspective tilt that follows the pointer, with optional glare.",
    category: "Interactive",
    file: "registry/new-york/tilt-card/tilt-card.tsx",
    dependencies: ["motion"],
    staticProps: [`className="h-72 w-56 bg-neutral-900"`],
    children: `{/* card content */}`,
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Card content." },
      { name: "maxTilt", type: "number", default: 12, description: "Maximum rotation in degrees.", control: num(0, 45, 1, "°") },
      { name: "perspective", type: "number", default: 900, description: "CSS perspective in px. Lower is more dramatic.", control: num(200, 2400, 50, "px") },
      { name: "scale", type: "number", default: 1.03, description: "Scale while hovered.", control: num(1, 1.2, 0.01) },
      { name: "glare", type: "boolean", default: true, description: "Show a glare that follows the cursor.", control: { type: "boolean" } },
      { name: "glareOpacity", type: "number", default: 0.25, description: "Glare opacity, 0 to 1.", control: num(0, 1, 0.05) },
      { name: "reverse", type: "boolean", default: false, description: "Invert the tilt direction.", control: { type: "boolean" } },
      className,
    ],
  },
  {
    slug: "spotlight-card",
    name: "Spotlight Card",
    exportName: "SpotlightCard",
    description: "Card with a radial spotlight and glowing border that track the cursor.",
    category: "Interactive",
    file: "registry/new-york/spotlight-card/spotlight-card.tsx",
    dependencies: ["motion"],
    staticProps: [`className="w-80 p-6"`],
    children: `{/* card content */}`,
    isNew: true,
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Card content." },
      { name: "size", type: "number", default: 280, description: "Spotlight radius in px.", control: num(40, 700, 10, "px") },
      {
        name: "color",
        type: "string",
        default: "color-mix(in oklab, var(--foreground) 10%, transparent)",
        description: "Spotlight color (any CSS color).",
        control: { type: "color" },
      },
      { name: "border", type: "boolean", default: true, description: "Also light up the card border.", control: { type: "boolean" } },
      {
        name: "borderColor",
        type: "string",
        default: "color-mix(in oklab, var(--foreground) 50%, transparent)",
        description: "Border highlight color.",
        control: { type: "color" },
      },
      { name: "...props", type: "HTMLAttributes<HTMLDivElement>", description: "All native div attributes are forwarded." },
    ],
  },

  {
    slug: "cursor",
    name: "Cursor",
    exportName: "Cursor",
    description: "Custom cursors: ring, dot, blend, crosshair, sparkle trail, and sunflower or rose that shed petals.",
    category: "Interactive",
    file: "registry/new-york/cursor/cursor.tsx",
    dependencies: ["motion"],
    isNew: true,
    props: [
      {
        name: "variant",
        type: `"ring" | "dot" | "blend" | "crosshair" | "sparkle" | "sunflower" | "rose"`,
        default: "ring",
        description: "Cursor style.",
        control: { type: "select", options: ["ring", "dot", "blend", "crosshair", "sparkle", "sunflower", "rose"] },
      },
      { name: "color", type: "string", description: "Main color (any CSS color). Defaults to foreground, gold for sparkle.", control: { type: "color" } },
      { name: "size", type: "number", default: 1, description: "Size multiplier.", control: num(0.5, 2.5, 0.05, "×") },
      { name: "stiffness", type: "number", default: 400, description: "Follow spring stiffness. Higher is tighter.", control: num(50, 1500, 10) },
      { name: "damping", type: "number", default: 32, description: "Follow spring damping.", control: num(5, 80, 1) },
      { name: "trail", type: "boolean", default: true, description: "Drop particles (sparkle, sunflower, rose).", control: { type: "boolean" } },
      { name: "hoverSelector", type: "string", default: "a, button, [role=button], …", description: "Elements that trigger the hover state. Add data-cursor-hover to anything." },
      { name: "container", type: "HTMLElement | null", description: "Limit the cursor to this element. Defaults to the whole page." },
    ],
  },

  // ------------------------------------------------------------- Feedback
  {
    slug: "loader",
    name: "Loader",
    exportName: "Loader",
    description: "Three loading animations: bouncing dots, equalizer bars and an orbit spinner.",
    category: "Feedback",
    file: "registry/new-york/loader/loader.tsx",
    dependencies: ["motion"],
    isNew: true,
    props: [
      { name: "variant", type: `"dots" | "bars" | "orbit"`, default: "dots", description: "Animation style.", control: { type: "select", options: ["dots", "bars", "orbit"] } },
      { name: "size", type: "number", default: 40, demo: 64, description: "Overall size in px.", control: num(16, 160, 2, "px") },
      { name: "color", type: "string", default: "currentColor", description: "Color (any CSS color).", control: { type: "color" } },
      { name: "speed", type: "number", default: 1, description: "Seconds per cycle. Lower is faster.", control: num(0.3, 3, 0.05, "s") },
      { name: "count", type: "number", description: "Number of dots or bars. Default 3 for dots, 5 for bars." },
      { name: "label", type: "string", default: "Loading", description: "Accessible label." },
      className,
    ],
  },
  {
    slug: "download-button",
    name: "Download Button",
    exportName: "DownloadButton",
    description: "Button that morphs from Download to a live progress fill and a drawn check mark.",
    category: "Feedback",
    file: "registry/new-york/download-button/download-button.tsx",
    dependencies: ["motion"],
    staticProps: [`href="/files/report.pdf"`],
    isNew: true,
    props: [
      { name: "href", type: "string", description: "File to download, triggered when the animation completes." },
      { name: "fileName", type: "string", description: "Suggested file name for href." },
      { name: "onDownload", type: "() => Promise<unknown> | void", description: "Run your own download. The bar waits for the promise." },
      { name: "progress", type: "number", description: "Controlled progress 0–100. The bar follows it instead of simulating." },
      { name: "duration", type: "number", default: 2, description: "Length of the simulated progress in seconds.", control: num(0.3, 8, 0.1, "s") },
      { name: "resetAfter", type: "number", default: 2200, description: "Return to idle after finishing, in ms (0 = stay done).", control: num(0, 6000, 100, "ms") },
      { name: "label", type: "string", default: "Download", description: "Idle label.", control: { type: "text" } },
      { name: "doneLabel", type: "string", default: "Downloaded", description: "Finished label.", control: { type: "text" } },
      { name: "showPercent", type: "boolean", default: true, description: "Show the percentage while loading.", control: { type: "boolean" } },
      { name: "fillColor", type: "string", default: "color-mix(in oklab, var(--background) 25%, transparent)", description: "Progress fill color." },
      { name: "...props", type: "ButtonHTMLAttributes", description: "Native button attributes are forwarded." },
    ],
  },

  // ---------------------------------------------------------------- Media
  {
    slug: "ascii-image",
    name: "ASCII Image",
    exportName: "AsciiImage",
    description: "Renders any image as ASCII art, with a glittering pixel trail under the cursor.",
    category: "Media",
    file: "registry/new-york/ascii-image/ascii-image.tsx",
    dependencies: ["motion"],
    staticProps: [`src="/hero.jpg"`, `alt="Mountain range at dusk"`, `className="h-96 w-full"`],
    isNew: true,
    props: [
      { name: "src", type: "string", required: true, description: "Image URL. Remote images must allow CORS so their pixels can be read." },
      { name: "alt", type: "string", required: true, description: "Accessible description of the image." },
      { name: "cellSize", type: "number", default: 10, description: "Size of each character cell in px.", control: num(5, 24, 1, "px") },
      { name: "characters", type: "string", default: " .:-=+*#%@", description: "Characters from lightest to densest.", control: { type: "text" } },
      { name: "color", type: "string", default: "#3b5bff", description: "Character color (any canvas color, not CSS variables).", control: { type: "color" } },
      { name: "sparkColor", type: "string", default: "#ffffff", description: "Color of the glitter sparks near the cursor.", control: { type: "color" } },
      { name: "radius", type: "number", default: 90, description: "Radius of the hover region in px.", control: num(20, 300, 5, "px") },
      { name: "decay", type: "number", default: 0.93, description: "How long the hover trail lingers, 0 to 1.", control: num(0.5, 0.99, 0.01) },
      { name: "glitter", type: "number", default: 0.12, description: "Chance per frame that a lit cell sparkles.", control: num(0, 1, 0.01) },
      { name: "contrast", type: "number", default: 1.3, description: "Contrast applied before mapping to characters.", control: num(0.5, 3, 0.05) },
      { name: "invert", type: "boolean", default: false, description: "Map dark pixels to dense characters.", control: { type: "boolean" } },
      className,
    ],
  },
  {
    slug: "hover-media",
    name: "Hover Media",
    exportName: "HoverMedia",
    description: "Inline keyword that reveals a floating image or video following the cursor.",
    category: "Media",
    file: "registry/new-york/hover-media/hover-media.tsx",
    dependencies: ["motion"],
    preamble: "We craft",
    staticProps: [`src="/flower.mp4"`],
    children: "motion",
    isNew: true,
    props: [
      { name: "children", type: "ReactNode", required: true, description: "The keyword(s) that trigger the preview." },
      { name: "src", type: "string", required: true, description: "Image or video URL." },
      { name: "type", type: `"image" | "video"`, description: "Media type. Detected from the file extension when omitted." },
      { name: "alt", type: "string", default: "", description: "Alt text for images." },
      { name: "width", type: "number", default: 220, description: "Preview width in px.", control: num(80, 480, 10, "px") },
      {
        name: "aspectRatio",
        type: "string",
        default: "4 / 3",
        description: "Preview aspect ratio.",
        control: { type: "select", options: ["4 / 3", "1 / 1", "3 / 4", "16 / 9"] },
      },
      { name: "tilt", type: "number", default: 12, description: "Maximum tilt in degrees, driven by cursor speed.", control: num(0, 40, 1, "°") },
      { name: "offset", type: "number", default: 20, description: "Distance from the cursor in px.", control: num(0, 80, 2, "px") },
      { name: "stiffness", type: "number", default: 300, description: "Spring stiffness for the follow motion.", control: num(30, 800, 10) },
      { name: "damping", type: "number", default: 28, description: "Spring damping for the follow motion.", control: num(5, 60, 1) },
      className,
      { name: "mediaClassName", type: "string", description: "Classes for the floating preview." },
    ],
  },

  {
    slug: "image-fan",
    name: "Image Fan",
    exportName: "ImageFan",
    description: "One image rises from below, then the rest slide out from under it into an overlapping fan.",
    category: "Media",
    file: "registry/new-york/image-fan/image-fan.tsx",
    dependencies: ["gsap", "@gsap/react"],
    staticProps: ["images={images}"],
    isNew: true,
    props: [
      { name: "images", type: "ImageFanItem[]", required: true, description: "{ src, alt }[] — e.g. files in public/gallery/." },
      {
        name: "direction",
        type: `"right" | "left" | "center"`,
        default: "right",
        description: "Which way the stack spreads after the first image rises.",
        control: { type: "select", options: ["right", "left", "center"] },
      },
      { name: "speed", type: "number", default: 1, description: "Speed multiplier. 2 is twice as fast.", control: num(0.25, 3, 0.05, "×") },
      { name: "blur", type: "number", default: 10, description: "Blur in px while cards move in.", control: num(0, 30, 1, "px") },
      { name: "rise", type: "number", default: 1.2, description: "How far the first card rises from, in card heights.", control: num(0, 3, 0.1) },
      { name: "overlap", type: "number", default: 0.72, description: "Gap between cards as a fraction of card width (shrinks to fit).", control: num(0.15, 1.2, 0.01) },
      { name: "rotate", type: "number", default: 3, description: "Tilt added per card, in degrees.", control: num(0, 15, 0.5, "°") },
      { name: "arc", type: "number", default: 6, description: "Downward curve toward the ends, in px.", control: num(0, 30, 1, "px") },
      { name: "stagger", type: "number", default: 0.06, description: "Delay between cards sliding out, in seconds.", control: num(0, 0.3, 0.01, "s") },
      { name: "radius", type: "number", default: 14, description: "Corner radius in px.", control: num(0, 40, 1, "px") },
      { name: "hoverLift", type: "boolean", default: true, description: "Lift cards on hover.", control: { type: "boolean" } },
      { name: "cardWidth", type: "string", default: "min(20cqw, 220px)", description: "Card width (any CSS length)." },
      { name: "aspectRatio", type: "string", default: "3 / 4", description: "Card aspect ratio." },
      { name: "once", type: "boolean", default: true, description: "Play only the first time it enters view." },
      { name: "scroller", type: "string | HTMLElement", description: "Scroll container to watch instead of the window." },
      { name: "height", type: "string", default: "28rem", description: "Section height." },
      className,
    ],
  },
  {
    slug: "image-arc",
    name: "Image Arc",
    exportName: "ImageArc",
    description: "Images on a half-circle wheel that turns on its own or with the scroll.",
    category: "Media",
    file: "registry/new-york/image-arc/image-arc.tsx",
    dependencies: ["gsap", "@gsap/react"],
    staticProps: ["images={images}"],
    isNew: true,
    props: [
      { name: "images", type: "ImageArcItem[]", required: true, description: "{ src, alt }[]. Repeated around the wheel if there aren't enough." },
      { name: "mode", type: `"auto" | "scroll"`, default: "auto", description: "Spin continuously, or turn as the page scrolls.", control: { type: "select", options: ["auto", "scroll"] } },
      { name: "duration", type: "number", default: 80, description: "Seconds per revolution (auto). Lower is faster.", control: num(10, 240, 5, "s") },
      {
        name: "direction",
        type: `"clockwise" | "counterclockwise"`,
        default: "clockwise",
        description: "Spin direction.",
        control: { type: "select", options: ["clockwise", "counterclockwise"] },
      },
      { name: "scrollRotation", type: "number", default: 120, description: "Degrees turned while scrolling past (scroll mode).", control: num(15, 360, 5, "°") },
      { name: "radius", type: "number", default: 0.42, description: "Wheel radius as a fraction of the container width.", control: num(0.2, 0.8, 0.01) },
      { name: "itemSize", type: "number", default: 0.26, description: "Card width as a fraction of the radius.", control: num(0.1, 0.5, 0.01) },
      { name: "gap", type: "number", default: 28, description: "Space between cards along the circle, in px.", control: num(0, 120, 2, "px") },
      { name: "rounded", type: "number", default: 12, description: "Corner radius in px.", control: num(0, 40, 1, "px") },
      { name: "pauseOnHover", type: "boolean", default: true, description: "Pause while a card is hovered (auto).", control: { type: "boolean" } },
      { name: "fade", type: "boolean", default: true, description: "Fade the lower edge into the background.", control: { type: "boolean" } },
      { name: "aspectRatio", type: "string", default: "3 / 4", description: "Card aspect ratio." },
      { name: "scroller", type: "string | HTMLElement", description: "Scroll container to track in scroll mode." },
      className,
    ],
  },

  // --------------------------------------------------------------- Scroll
  {
    slug: "scroll-text-reveal",
    name: "Scroll Text Reveal",
    exportName: "ScrollTextReveal",
    description: "Pins the section and reveals text as you scroll. The page resumes once the reveal completes.",
    category: "Scroll",
    file: "registry/new-york/scroll-text-reveal/scroll-text-reveal.tsx",
    dependencies: ["gsap", "@gsap/react"],
    isNew: true,
    props: [
      {
        name: "text",
        type: "string",
        required: true,
        demo: "We build the quiet layer between intent and interface, where every transition earns its place and nothing moves without a reason.",
        description: "The text to reveal.",
        control: { type: "text" },
      },
      { name: "split", type: `"word" | "char"`, default: "word", description: "Reveal word by word or character by character.", control: { type: "select", options: ["word", "char"] } },
      { name: "dim", type: "number", default: 0.15, description: "Opacity of unrevealed text, 0 to 1.", control: num(0, 0.6, 0.01) },
      { name: "blur", type: "number", default: 0, description: "Starting blur in px.", control: num(0, 16, 1, "px") },
      { name: "lift", type: "number", default: 0, description: "Starting vertical offset in px.", control: num(0, 40, 1, "px") },
      { name: "scrollLength", type: "number", default: 2, description: "Section heights of scrolling the reveal lasts.", control: num(0.5, 6, 0.25) },
      { name: "scrub", type: "number", default: 0.8, description: "Scroll smoothing in seconds (0 = instant).", control: num(0, 3, 0.1, "s") },
      { name: "pin", type: "boolean", default: true, description: "Hold the section in place until the reveal completes.", control: { type: "boolean" } },
      { name: "align", type: `"left" | "center"`, default: "left", description: "Text alignment.", control: { type: "select", options: ["left", "center"] } },
      { name: "scroller", type: "string | HTMLElement", description: "Scroll container to track instead of the window." },
      { name: "height", type: "string", default: "100vh", description: "Height of the pinned section." },
      className,
      { name: "textClassName", type: "string", description: "Classes for the text element." },
    ],
  },
  {
    slug: "horizontal-scroll",
    name: "Horizontal Scroll",
    exportName: "HorizontalScroll",
    description: "Pins a row of images and scrolls it sideways with the page, then releases to normal scroll.",
    category: "Scroll",
    file: "registry/new-york/horizontal-scroll/horizontal-scroll.tsx",
    dependencies: ["gsap", "@gsap/react"],
    staticProps: ["items={items}"],
    isNew: true,
    props: [
      { name: "items", type: "HorizontalScrollItem[]", required: true, description: "{ src, alt, caption? }[]" },
      { name: "itemWidth", type: "string", default: "min(70cqw, 520px)", description: "Width of each image (any CSS length)." },
      {
        name: "aspectRatio",
        type: "string",
        default: "4 / 5",
        description: "Image aspect ratio.",
        control: { type: "select", options: ["4 / 5", "1 / 1", "4 / 3", "16 / 9"] },
      },
      { name: "gap", type: "number", default: 24, description: "Gap between images in px.", control: num(0, 80, 2, "px") },
      { name: "speed", type: "number", default: 1, description: "Scroll distance multiplier. Higher is slower.", control: num(0.3, 3, 0.1) },
      { name: "scrub", type: "number", default: 1, description: "Scroll smoothing in seconds.", control: num(0, 3, 0.1, "s") },
      { name: "parallax", type: "boolean", default: true, description: "Subtle zoom on each image as it crosses the viewport.", control: { type: "boolean" } },
      { name: "scroller", type: "string | HTMLElement", description: "Scroll container to track instead of the window." },
      { name: "height", type: "string", default: "100vh", description: "Height of the pinned section." },
      className,
      { name: "itemClassName", type: "string", description: "Classes for each image frame." },
    ],
  },
  {
    slug: "image-reveal",
    name: "Image Reveal",
    exportName: "ImageReveal",
    description: "Images fly in from their own direction as they scroll into view.",
    category: "Scroll",
    file: "registry/new-york/image-reveal/image-reveal.tsx",
    dependencies: ["gsap", "@gsap/react"],
    staticProps: ["images={images}"],
    isNew: true,
    props: [
      {
        name: "images",
        type: "ImageRevealItem[]",
        required: true,
        description: `{ src, alt, from?: "left" | "right" | "top" | "bottom" | "scale", span? }[]`,
      },
      { name: "columns", type: "number", default: 2, description: "Grid columns.", control: num(1, 4, 1) },
      { name: "gap", type: "number", default: 16, description: "Gap between images in px.", control: num(0, 64, 2, "px") },
      { name: "distance", type: "number", default: 160, description: "Travel distance in px.", control: num(0, 400, 10, "px") },
      { name: "rotate", type: "number", default: 4, description: "Starting rotation in degrees (left / right only).", control: num(0, 30, 1, "°") },
      { name: "blur", type: "number", default: 0, description: "Starting blur in px.", control: num(0, 20, 1, "px") },
      { name: "scrub", type: "boolean", default: true, description: "Tie progress to the scrollbar. Off plays once on enter.", control: { type: "boolean" } },
      { name: "duration", type: "number", default: 0.9, description: "Duration when scrub is off, in seconds.", control: num(0.2, 2, 0.05, "s") },
      { name: "aspectRatio", type: "string", default: "4 / 3", description: "Image aspect ratio." },
      { name: "scroller", type: "string | HTMLElement", description: "Scroll container to track instead of the window." },
      className,
      { name: "itemClassName", type: "string", description: "Classes for each image frame." },
    ],
  },

  {
    slug: "expand-gallery",
    name: "Expand Gallery",
    exportName: "ExpandGallery",
    description: "A row of small thumbnails where each one grows large in turn as you scroll.",
    category: "Scroll",
    file: "registry/new-york/expand-gallery/expand-gallery.tsx",
    dependencies: ["gsap", "@gsap/react"],
    staticProps: ["images={images}"],
    isNew: true,
    props: [
      { name: "images", type: "ExpandGalleryItem[]", required: true, description: "{ src, alt }[]" },
      { name: "smallWidth", type: "number", default: 9, description: "Thumbnail width, % of section width.", control: num(3, 20, 0.5, "%") },
      { name: "largeWidth", type: "number", default: 20, description: "Expanded width, % of section width.", control: num(10, 50, 0.5, "%") },
      { name: "largeHeight", type: "number", default: 72, description: "Expanded height, % of section height.", control: num(30, 90, 1, "%") },
      { name: "smallAspect", type: "string", default: "3 / 4", description: "Thumbnail aspect ratio.", control: { type: "select", options: ["3 / 4", "1 / 1", "4 / 5", "2 / 3"] } },
      { name: "gap", type: "number", default: 12, description: "Gap between images in px.", control: num(0, 48, 1, "px") },
      { name: "align", type: `"start" | "center"`, default: "start", description: "Row alignment.", control: { type: "select", options: ["start", "center"] } },
      { name: "scrollPerImage", type: "number", default: 0.6, description: "Section heights of scrolling per image.", control: num(0.2, 2, 0.05) },
      { name: "scrub", type: "number", default: 0.8, description: "Scroll smoothing in seconds.", control: num(0, 3, 0.1, "s") },
      { name: "counter", type: "boolean", default: true, description: `Show an "03 / 06" counter.`, control: { type: "boolean" } },
      { name: "scroller", type: "string | HTMLElement", description: "Scroll container to track instead of the window." },
      { name: "height", type: "string", default: "100vh", description: "Height of the pinned section." },
      className,
    ],
  },
  {
    slug: "scroll-focus",
    name: "Scroll Focus",
    exportName: "ScrollFocus",
    description: "A column of images where the one in the center grows, with a title list that stays in sync.",
    category: "Scroll",
    file: "registry/new-york/scroll-focus/scroll-focus.tsx",
    dependencies: ["gsap", "@gsap/react"],
    staticProps: ["items={items}"],
    isNew: true,
    props: [
      { name: "items", type: "ScrollFocusItem[]", required: true, description: "{ src, alt, title }[]" },
      { name: "side", type: `"left" | "right"`, default: "right", description: "Side the synced title list sits on.", control: { type: "select", options: ["left", "right"] } },
      { name: "smallWidth", type: "number", default: 26, description: "Width away from focus, % of section width.", control: num(8, 50, 0.5, "%") },
      { name: "largeWidth", type: "number", default: 40, description: "Width of the focused image, % of section width.", control: num(15, 70, 0.5, "%") },
      { name: "aspectRatio", type: "string", default: "2 / 1", description: "Image aspect ratio.", control: { type: "select", options: ["2 / 1", "16 / 9", "3 / 2", "4 / 3"] } },
      { name: "gap", type: "number", default: 14, description: "Vertical gap between images in px.", control: num(0, 60, 1, "px") },
      { name: "scrollPerItem", type: "number", default: 0.5, description: "Section heights of scrolling per image.", control: num(0.2, 2, 0.05) },
      { name: "scrub", type: "number", default: 0.8, description: "Scroll smoothing in seconds.", control: num(0, 3, 0.1, "s") },
      { name: "showIndex", type: "boolean", default: true, description: `Show "(1)" index labels beside images.`, control: { type: "boolean" } },
      { name: "scroller", type: "string | HTMLElement", description: "Scroll container to track instead of the window." },
      { name: "height", type: "string", default: "100vh", description: "Height of the pinned section." },
      className,
      { name: "titleClassName", type: "string", description: "Classes for the title list." },
    ],
  },

  // --------------------------------------------------------------- Layout
  {
    slug: "stagger",
    name: "Stagger",
    exportName: "Stagger",
    description: "Reveals its children one after another as they enter the viewport.",
    category: "Layout",
    file: "registry/new-york/stagger/stagger.tsx",
    dependencies: ["motion"],
    staticProps: [`className="grid grid-cols-3 gap-3"`],
    children: `{items.map((item) => (\n    <Card key={item.id} {...item} />\n  ))}`,
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Each direct child is animated in turn." },
      {
        name: "direction",
        type: `"up" | "down" | "left" | "right" | "scale"`,
        default: "up",
        description: "Where each child enters from.",
        control: { type: "select", options: ["up", "down", "left", "right", "scale"] },
      },
      { name: "stagger", type: "number", default: 0.08, description: "Delay between children, in seconds.", control: num(0, 0.5, 0.01, "s") },
      { name: "duration", type: "number", default: 0.5, description: "Duration of each child, in seconds.", control: num(0.1, 2, 0.05, "s") },
      { name: "delay", type: "number", default: 0, description: "Delay before the first child, in seconds.", control: num(0, 2, 0.05, "s") },
      { name: "distance", type: "number", default: 20, description: "Travel distance in px.", control: num(0, 100, 2, "px") },
      once(),
      className,
      { name: "itemClassName", type: "string", description: "Classes applied to each child wrapper." },
    ],
  },
  {
    slug: "marquee",
    name: "Marquee",
    exportName: "Marquee",
    description: "Infinite, seamless scrolling row or column of content.",
    category: "Layout",
    file: "registry/new-york/marquee/marquee.tsx",
    dependencies: ["motion"],
    children: `{logos.map((logo) => (\n    <Logo key={logo.name} {...logo} />\n  ))}`,
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Items to scroll." },
      { name: "duration", type: "number", default: 30, demo: 20, description: "Seconds for one loop. Lower is faster.", control: num(2, 80, 1, "s") },
      { name: "reverse", type: "boolean", default: false, description: "Scroll the other way.", control: { type: "boolean" } },
      { name: "vertical", type: "boolean", default: false, description: "Scroll vertically.", control: { type: "boolean" } },
      { name: "pauseOnHover", type: "boolean", default: true, description: "Pause while hovered.", control: { type: "boolean" } },
      { name: "gap", type: "number", default: 16, description: "Gap between items in px.", control: num(0, 80, 2, "px") },
      { name: "fade", type: "boolean", default: true, description: "Fade the edges into the background.", control: { type: "boolean" } },
      { name: "repeat", type: "number", default: 4, description: "Copies of the content to render.", control: num(2, 8, 1) },
      className,
    ],
  },
  {
    slug: "sticky-cards",
    name: "Sticky Cards",
    exportName: "StickyCards",
    description: "A stack of same-size cards pinned on scroll. The front card lifts away, then the next, one by one.",
    category: "Scroll",
    file: "registry/new-york/cards/sticky-cards.tsx",
    dependencies: ["gsap", "@gsap/react"],
    staticProps: ["cards={cards}"],
    props: [
      { name: "cards", type: "StickyCardItem[]", required: true, description: "{ id, tag, title, image?, color?, textColor? }[]. Colors default to the purple, orange, red, sky, navy palette." },
      { name: "cardYOffset", type: "number", default: 4, description: "Vertical offset (%) between stacked cards.", control: num(0, 12, 0.5, "%") },
      { name: "cardScaleStep", type: "number", default: 0.05, description: "Scale reduction per card behind the front one.", control: num(0, 0.15, 0.01) },
      { name: "stepInterval", type: "number", default: 1.2, description: "Timeline gap between each card's exit.", control: num(0.3, 3, 0.1) },
      { name: "stepDuration", type: "number", default: 1, description: "Duration of each card's exit.", control: num(0.2, 3, 0.1) },
      { name: "scrollLengthPerCard", type: "number", default: 1.8, description: "Section heights of scroll per card.", control: num(0.5, 4, 0.1) },
      { name: "background", type: "string", default: "#111111", description: "Section background.", control: { type: "color" } },
      { name: "exitLast", type: "boolean", default: false, description: "Animate the last card away too. When false it stays on screen as the pin releases.", control: { type: "boolean" } },
      { name: "scroller", type: "string | HTMLElement", description: "Scroll container to track instead of the window." },
      { name: "height", type: "string", default: "100vh", description: "Height of the pinned section." },
      className,
    ],
  },
]

// Component groups kept in their own files
const parts: ComponentDoc[][] = [buttonsADocs, buttonsBDocs, navbarDocs, tocDocs, otpDocs, chartsCartesianDocs, chartsPolarDocs, chartsStatsDocs, preloaderDocs, footerDocs, faqConfettiDocs, transitionsDocs, feedsDocs, cardsDocs, notFoundDocs, envelopeDocs]

export const components: ComponentDoc[] = [...baseComponents, ...parts.flat()]

export const categories: Category[] = [
  "Text",
  "Buttons",
  "Interactive",
  "Navigation",
  "Forms",
  "Feedback",
  "Charts",
  "Media",
  "Scroll",
  "Layout",
  "Cards",
  "Sections",
]

export const docsNav: { title: string; href: string; badge?: string }[] = [
  { title: "Introduction", href: "/docs" },
  { title: "Installation", href: "/docs/installation" },
  { title: "Changelog", href: "/changelog", badge: latestRelease.version },
]

export function getComponent(slug: string) {
  return components.find((c) => c.slug === slug)
}

export function initialValues(doc: ComponentDoc) {
  const values: Record<string, PropValue> = {}
  for (const p of doc.props) {
    if (!p.control) continue
    const v = p.demo ?? p.default
    if (v !== undefined) values[p.name] = v
  }
  return values
}

/** Installed file name, e.g. "@/components/fade-in". */
export function importPath(doc: ComponentDoc) {
  const base = doc.file.split("/").pop()!.replace(/\.tsx?$/, "")
  return `@/components/${base}`
}

export function registryUrl(slug: string) {
  return `${siteConfig.url}/r/${slug}.json`
}

/** Name the shadcn CLI resolves through its registry directory, no URL or config needed. */
export function registryItem(slug: string) {
  return `@tweenly/${slug}`
}

function formatRow(row: DataRow) {
  const fields = Object.entries(row).map(([k, v]) => `${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${JSON.stringify(v)}`)
  return `{ ${fields.join(", ")} }`
}

function formatProp(name: string, value: PropValue) {
  if (Array.isArray(value)) return `${name}={${name}}`
  if (typeof value === "boolean") return value ? name : `${name}={false}`
  if (typeof value === "number") return `${name}={${Number(value.toFixed(4))}}`
  return `${name}=${JSON.stringify(value)}`
}

/** Builds a usage snippet reflecting the current playground values. */
export function usageCode(doc: ComponentDoc, values: Record<string, PropValue>) {
  const attrs: string[] = []
  const decls: string[] = []
  for (const p of doc.props) {
    if (!p.control || !(p.name in values)) continue
    const v = values[p.name]
    if (!p.required && v === p.default) continue
    if (Array.isArray(v)) decls.push(`const ${p.name} = [\n${v.map((r) => `  ${formatRow(r)},`).join("\n")}\n]`)
    attrs.push(formatProp(p.name, v))
  }
  attrs.push(...(doc.staticProps ?? []))

  const tag = doc.exportName
  const inline = `<${tag}${attrs.map((a) => " " + a).join("")}`
  const open =
    inline.length <= 72 && !doc.children?.includes("\n")
      ? inline
      : `<${tag}\n${attrs.map((a) => "  " + a).join("\n")}\n`

  const jsx = doc.children
    ? `${open}>\n  ${doc.children}\n</${tag}>`
    : `${open}${open.endsWith("\n") ? "" : " "}/>`

  // Preambles that look like code go above the component; plain text wraps the JSX inline
  const codePreamble = !!doc.preamble && /^(?:(?:const|let|import|function)\b|\/\/)/.test(doc.preamble.trim())
  const body =
    doc.preamble && !codePreamble
      ? `<p>\n  ${doc.preamble}{" "}\n  ${jsx.replace(/\n/g, "\n  ")}\n</p>`
      : jsx
  const blocks = [...decls, ...(codePreamble ? [doc.preamble!.trim()] : [])]
  const top = blocks.length ? `\n${blocks.join("\n\n")}\n` : ""

  return `import { ${tag} } from "${importPath(doc)}"
${top}
export function Demo() {
  return (
    ${body.replace(/\n/g, "\n    ")}
  )
}
`
}
