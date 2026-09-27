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
