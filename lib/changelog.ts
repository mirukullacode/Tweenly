export interface ChangelogEntry {
  version: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  title: string
  summary: string
  /** Component slugs added in this release; rendered as links. */
  added?: string[]
  /** Other notable changes. */
  changes?: string[]
}

// Newest first. The first entry drives the "New" badge in the sidebar.
export const changelog: ChangelogEntry[] = [
  {
    version: "0.5.0",
    date: "2026-10-05",
    title: "A playground, smoother pages and portable styles",
    summary:
      "A new Playground for experimenting with animation, a simpler and faster home page, and components that look the same in your app as in the docs.",
    changes: [
      "Playground: build animations and copy them as Motion, GSAP or CSS, edit easing curves, explore springs and stagger grids.",
      "The home page is simpler and scrolls natively: no preloader, no pinned scenes and no heavy canvas.",
      "Components that use tweenly's brand or panel colors now install a small tweenly-theme item with the exact tokens and display font.",
      "Footers, loaders, page transitions and section backgrounds follow your light or dark theme by default.",
      "Gradients removed across the site and components in favor of solid colors.",
      "Send feedback from the sidebar or rate any component's docs; cookie and privacy policies, with an analytics opt-out.",
      "Real photos in every image demo, credited in IMAGE_CREDITS.md.",
      "Mobile and laptop fixes: demos no longer hide behind controls at 1024px, the preview dock no longer covers demos on phones, and search and install tabs fit small screens.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-10-02",
    title: "AI components, scroll storytelling and a new look",
    summary:
      "Components for AI interfaces, smooth scroll-driven sections, a fresh logo that redraws as you move between pages, and first-class support for AI coding agents.",
    added: [
      "ai-voice",
      "ai-recorder",
      "ai-input",
      "ai-thinking",
      "curved-carousel",
      "arc-steps",
      "timeline-scroll",
      "smooth-scroll",
      "hero-background",
      "auth",
      "dock",
      "tweet-card",
      "orbiting-circles",
      "banner",
    ],
    changes: [
      "Every component shows whether it is built with Motion or GSAP, with a sidebar filter to browse by library.",
      "A new Docs tab on every component: overview, when to use it, features, installation, accessibility, tips and related components.",
      "New logo, used for the favicon, share images and a draw-in animation on every page change.",
      "A Use with AI agents guide: connect Claude Code, Cursor, VS Code or Codex through the shadcn MCP server.",
      "CONTRIBUTING.md, issue and pull request templates, a code of conduct, a security policy and CI checks.",
      "Search now opens with Cmd/Ctrl K or /, and the sidebar groups components into collapsible categories.",
      "Sign-in and sign-up sections no longer show a placeholder logo, and fields reveal and focus more smoothly.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-09-27",
    title: "Cards, envelopes and 404 pages",
    summary:
      "A new Cards category, an envelope that sends and reveals messages, and a 404 section that makes getting lost a little more fun.",
    added: ["product-card", "stamp-card", "envelope", "envelope-reveal", "not-found"],
    changes: [
      "The site now has its own 404 page, built with the new component.",
      "Share images have a motif for the Cards category.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-09-27",
    title: "Tweenly, page transitions and sections",
    summary:
      "The library has a new name, seven new component families built for whole pages, and a guided tour for first-time visitors.",
    added: ["page-loader", "page-transition", "faq", "confetti", "swipe-row", "notification-feed", "footer"],
    changes: [
      "Renamed from motioncn to tweenly. Registry items now install from the tweenly namespace.",
      "Guided tour of the playground on your first visit, and a Take the tour button to replay it.",
      "Open in v0 on every component page.",
      "llms.txt and llms-full.txt so AI assistants can read the docs.",
      "Share images, sitemap and structured data for every page.",
      "Usage snippets that start with code comments are no longer wrapped in a paragraph tag.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-09-26",
    title: "First release",
    summary:
      "Fifty animated components across text, buttons, navigation, forms, feedback, charts, media, scroll and layout, each with a live playground.",
    changes: [
      "Charts render real row data with formatters, axes, tooltips and toggleable legends, and share one chart kit.",
      "Every prop can be tuned live, and the usage snippet updates to match.",
      "Install any component with the shadcn CLI and own the source.",
    ],
  },
]

export const latestRelease = changelog[0]

/** Slugs from the most recent release that added components; drives the "New" badges. */
export const newComponentSlugs = new Set((changelog.find((r) => r.added?.length) ?? changelog[0]).added ?? [])
