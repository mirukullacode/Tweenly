import { classNameProp, num, type ComponentDoc } from "@/lib/docs-types"

export const showcaseKitDocs: ComponentDoc[] = [
  {
    slug: "dock",
    name: "Dock",
    exportName: "Dock",
    description:
      "macOS-style dock: icons magnify with pointer distance, labels spring up as tooltips, with active dots, badges and a click bounce.",
    category: "Navigation",
    file: "registry/new-york/dock/dock.tsx",
    dependencies: ["motion"],
    isNew: true,
    preamble: `import { DockItem, DockSeparator } from "@/components/dock"
import { Folder, Home, Mail, Settings } from "lucide-react"`,
    children: `<DockItem label="Home" href="/" active><Home /></DockItem>
  <DockItem label="Projects" href="/projects"><Folder /></DockItem>
  <DockItem label="Mail" href="/mail" badge={3}><Mail /></DockItem>
  <DockSeparator />
  <DockItem label="Settings" href="/settings"><Settings /></DockItem>`,
    props: [
      { name: "children", type: "React.ReactNode", required: true, description: "DockItem and DockSeparator elements." },
      { name: "orientation", type: '"horizontal" | "vertical"', default: "horizontal", description: "Lay the items out in a row or a column.", control: { type: "select", options: ["horizontal", "vertical"] } },
      { name: "size", type: "number", default: 44, description: "Resting item size in px.", control: num(32, 64, 2, "px") },
      { name: "magnification", type: "number", default: 72, description: "Item size in px right under the pointer.", control: num(32, 110, 2, "px") },
      { name: "distance", type: "number", default: 140, description: "How far from the pointer, in px, items still grow.", control: num(60, 300, 10, "px") },
      { name: "spring", type: "{ stiffness?: number; damping?: number; mass?: number }", default: "{ stiffness: 450, damping: 34, mass: 0.25 }", description: "Spring used for the magnification." },
      { name: "variant", type: '"glass" | "solid" | "minimal"', default: "glass", description: "Surface style.", control: { type: "select", options: ["glass", "solid", "minimal"] } },
      { name: "position", type: '"static" | "fixed-bottom" | "fixed-left"', default: "static", description: "Where the dock sits. Fixed positions pin it to the viewport edge.", control: { type: "select", options: ["static", "fixed-bottom", "fixed-left"] } },
      { name: "bounce", type: "boolean", default: true, description: "Bounce items when clicked.", control: { type: "boolean" } },
      { name: "label", type: "string", default: "Dock", description: "Accessible label for the dock." },
      classNameProp,
      { name: "DockItem.label", type: "string", required: true, description: "Tooltip text and accessible name." },
      { name: "DockItem.href", type: "string", description: "Render the item as a link." },
      { name: "DockItem.onClick", type: "(event) => void", description: "Click handler." },
      { name: "DockItem.active", type: "boolean", default: false, description: "Show the active indicator dot." },
      { name: "DockItem.badge", type: "number", description: "Count bubble on the corner. Hidden when 0." },
    ],
  },
  {
    slug: "tweet-card",
    name: "Tweet Card",
    exportName: "TweetGrid",
    description:
      "X-style post cards rendered from data, no API calls. Highlighted mentions, media grid, compact stats and a like pop, plus a scrolling testimonial wall.",
    category: "Cards",
    file: "registry/new-york/tweet-card/tweet-card.tsx",
    dependencies: ["motion", "lucide-react"],
    isNew: true,
    preamble: `const tweets = [
  {
    author: { name: "Maya Chen", handle: "mayabuilds", verified: true },
    content: "Swapped our hand-rolled modals for @tweenly in an afternoon. The springs just feel right. #react",
    date: "Mar 4",
    stats: { replies: 24, reposts: 61, likes: 1240, views: 48200 },
    href: "https://x.com/mayabuilds/status/1",
  },
  // ...
]

// A single card works on its own too:
// import { TweetCard } from "@/components/tweet-card"
// <TweetCard {...tweets[0]} variant="compact" />`,
    staticProps: [`tweets={tweets}`],
    props: [
      { name: "tweets", type: "(TweetCardProps & { id?: string })[]", required: true, description: "Posts to lay out." },
      { name: "columns", type: "number", default: 3, description: "Maximum number of columns. Fewer show in narrow containers.", control: num(1, 4, 1) },
      { name: "scroll", type: "boolean", default: false, description: "Auto-scroll each column vertically like a marquee.", control: { type: "boolean" }, demo: true },
      { name: "speed", type: "number", default: 1, description: "Scroll speed multiplier. Higher is faster.", control: num(0.25, 3, 0.25, "x") },
      { name: "alternate", type: "boolean", default: true, description: "Scroll every other column in the opposite direction.", control: { type: "boolean" } },
      { name: "pauseOnHover", type: "boolean", default: true, description: "Pause a column while it is hovered.", control: { type: "boolean" } },
      { name: "fade", type: "boolean", default: true, description: "Fade the top and bottom edges while scrolling.", control: { type: "boolean" } },
      { name: "height", type: "number", default: 560, description: "Height of the wall in px when scrolling.", control: num(300, 800, 20, "px") },
      { name: "gap", type: "number", default: 16, description: "Gap between cards in px.", control: num(8, 32, 2, "px") },
      { name: "variant", type: '"default" | "compact" | "minimal"', default: "default", description: "Card density applied to every card.", control: { type: "select", options: ["default", "compact", "minimal"] } },
      classNameProp,
      { name: "TweetCard.author", type: "{ name: string; handle: string; avatar?: string; verified?: boolean }", required: true, description: "Who posted it. Without an avatar, initials render on a color derived from the handle." },
      { name: "TweetCard.content", type: "string", required: true, description: "Post text. @mentions, #hashtags and URLs are highlighted automatically." },
      { name: "TweetCard.date", type: "string", required: true, description: "Date label shown as-is." },
      { name: "TweetCard.media", type: "string[]", description: "Up to 4 image URLs. Images that fail to load are hidden." },
      { name: "TweetCard.stats", type: "{ replies?; reposts?; likes?; views? }", description: "Engagement counts, formatted compactly (1.2K)." },
      { name: "TweetCard.href", type: "string", description: "Makes the whole card a link." },
      { name: "TweetCard.defaultLiked", type: "boolean", default: false, description: "Start with the like button toggled on." },
      { name: "TweetCard.onLike", type: "(liked: boolean) => void", description: "Called when the like button toggles." },
      { name: "TweetCard.showLogo", type: "boolean", default: true, description: "Show the X logo in the corner." },
      { name: "TweetCard.accent", type: "string", default: "#ff4d12", description: "Color for links, mentions and hashtags." },
    ],
  },
  {
    slug: "orbiting-circles",
    name: "Orbiting Circles",
    exportName: "OrbitingCircles",
    description:
      "Icons orbit a center on a circular path. Layer rings with different radii and directions for integration graphics. Pure CSS transforms.",
    category: "Media",
    file: "registry/new-york/orbiting-circles/orbiting-circles.tsx",
    dependencies: [],
    isNew: true,
    preamble: `import { OrbitCenter } from "@/components/orbiting-circles"
import { Cloud, Database, Mail } from "lucide-react"

// The orbit centers on its nearest relative parent:
// <div className="relative h-[420px]">
//   <OrbitCenter>Logo</OrbitCenter>
//   <OrbitingCircles radius={90} reverse>...</OrbitingCircles>
//   <OrbitingCircles> ← this one is shown below
// </div>`,
    children: `<Cloud />
  <Database />
  <Mail />`,
    props: [
      { name: "children", type: "React.ReactNode", required: true, description: "Items to orbit, spaced evenly around the circle." },
      { name: "radius", type: "number", default: 160, description: "Orbit radius in px.", control: num(60, 260, 5, "px") },
      { name: "duration", type: "number", default: 20, description: "Seconds for one full orbit at speed 1.", control: num(4, 60, 1, "s") },
      { name: "reverse", type: "boolean", default: false, description: "Orbit counter-clockwise.", control: { type: "boolean" } },
      { name: "delay", type: "number", default: 0, description: "Seconds to wait before the orbit starts moving.", control: num(0, 5, 0.5, "s") },
      { name: "path", type: "boolean", default: true, description: "Draw a faint ring along the orbit.", control: { type: "boolean" } },
      { name: "iconSize", type: "number", default: 40, description: "Size of each item's box in px.", control: num(24, 64, 2, "px") },
      { name: "speed", type: "number", default: 1, description: "Speed multiplier. Higher is faster.", control: num(0.25, 4, 0.25, "x") },
      { name: "startAngle", type: "number", default: -90, description: "Angle of the first item in degrees. 0 is 3 o'clock, -90 is 12 o'clock.", control: num(-180, 180, 15, "°") },
      { name: "pauseOnHover", type: "boolean", default: false, description: "Pause the orbit while an item is hovered.", control: { type: "boolean" } },
      { name: "itemClassName", type: "string", description: "Classes for the item boxes." },
      classNameProp,
      { name: "OrbitCenter.size", type: "number", default: 72, description: "Diameter of the center disc in px." },
    ],
  },
  {
    slug: "banner",
    name: "Banner",
    exportName: "Banner",
    description:
      "Announcement banner: a dismissible top bar that slides in, a hero pill chip, a scrolling ticker or a bar with a light sweep. Remembers dismissal.",
    category: "Feedback",
    file: "registry/new-york/banner/banner.tsx",
    dependencies: ["motion", "lucide-react"],
    isNew: true,
    staticProps: [
      `message="tweenly 0.4 is here: AI components and smooth scroll sections."`,
      `cta={{ label: "Read more", href: "/changelog" }}`,
      `storageKey="banner-v1"`,
    ],
    props: [
      { name: "variant", type: '"bar" | "pill" | "marquee" | "shimmer"', default: "bar", description: "Visual style.", control: { type: "select", options: ["bar", "pill", "marquee", "shimmer"] } },
      { name: "message", type: "React.ReactNode", description: "The announcement." },
      { name: "messages", type: "React.ReactNode[]", description: "Marquee variant: messages scrolled in sequence. Falls back to message." },
      { name: "badge", type: "React.ReactNode", description: 'Short label in a badge before the message. The pill variant defaults to "New".', control: { type: "text" }, demo: "New" },
      { name: "href", type: "string", description: "Makes the message a link." },
      { name: "cta", type: "{ label: string; href: string }", description: "Call to action shown after the message." },
      { name: "dismissible", type: "boolean", default: false, description: "Show a close button. Dismissal collapses the banner.", control: { type: "boolean" }, demo: true },
      { name: "storageKey", type: "string", description: "Remember dismissal in localStorage under this key." },
      { name: "icon", type: "React.ReactNode", description: "Icon shown before the message." },
      { name: "tone", type: '"accent" | "neutral" | "inverted"', default: "accent", description: "Color scheme.", control: { type: "select", options: ["accent", "neutral", "inverted"] } },
      { name: "accent", type: "string", default: "#ff4d12", description: "Accent color for the accent tone and badges.", control: { type: "color" } },
      { name: "position", type: '"static" | "sticky" | "fixed"', default: "static", description: "Positioning. Fixed pins to the top of the viewport.", control: { type: "select", options: ["static", "sticky", "fixed"] } },
      { name: "duration", type: "number", default: 30, description: "Marquee variant: seconds for one full loop.", control: num(8, 60, 1, "s") },
      { name: "onDismiss", type: "() => void", description: "Called after the banner is dismissed." },
      classNameProp,
    ],
  },
]
