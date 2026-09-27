# tweenly

Animated React components you install with the shadcn CLI. You get the source code, so you can change anything.

Every component has a docs page with a live demo. You can adjust its props in the controls panel, and the code panel updates to match. The components are copied into your project, and there is no package to keep updated.

## Features

- **Installs with the shadcn CLI.** Each component is a registry item. `shadcn add` copies it into `components/` with its dependencies.
- **Live playground.** Every prop has a control. The usage snippet and source code update as you change settings.
- **Charts from real data.** Charts accept plain row arrays (`data`, `index`, `series`), like shadcn charts. They include number formatting, axes, tooltips and a legend you can toggle.
- **Respects reduced motion.** Animations follow `prefers-reduced-motion`.
- **Minimal styling.** Components use Tailwind v4, have no extra theme layer, and work in light and dark mode.

## Installation

Your project needs shadcn set up (`npx shadcn@latest init`). Then add any component by its registry URL:

```bash
npx shadcn@latest add https://<your-domain>/r/text-reveal.json
```

The command is the same with other package managers:

```bash
pnpm dlx shadcn@latest add https://<your-domain>/r/text-reveal.json
yarn dlx shadcn@latest add https://<your-domain>/r/text-reveal.json
bunx --bun shadcn@latest add https://<your-domain>/r/text-reveal.json
```

Each docs page shows its full install command, ready to copy.

Then use the component:

```tsx
import { TextReveal } from "@/components/text-reveal"

export function Hero() {
  return <TextReveal text="Build interfaces that feel alive." split="word" blur={8} />
}
```

## Components

| Category | Components |
| --- | --- |
| Text | Fade In, Text Reveal, Typewriter, Word Rotate, Shimmer Text, Number Ticker, Scroll Text Reveal |
| Buttons | Fill Button, Shine Button, Ripple Button, Hold Button, Slide Button, Like Button, Segmented Control, Number Stepper, Elastic Switch, Expand Input, Rating |
| Interactive | Magnetic, Tilt Card, Spotlight Card, Cursor (ring, dot, blend, crosshair, sparkle, sunflower, rose) |
| Navigation | Navbar (pill, morph, underline, island, overlay), Table of Contents (trail, rail, spotlight) |
| Forms | OTP Input (boxes, line) |
| Feedback | Loader (dots, bars, orbit), Download Button, Preloader |
| Charts | Line, Bar, Radial, Rings, Radar, KPI, Heatmap, Progress, Dots |
| Media | ASCII Image, Hover Media, Image Fan, Image Arc |
| Scroll | Sticky Cards, Horizontal Scroll, Image Reveal, Expand Gallery, Scroll Focus |
| Layout | Stagger, Marquee |

### Charts

The charts share `chart-kit`, a registry library for theme, scales, formatters, textures, the card, tooltip and legend. The CLI installs it automatically with any chart.

```tsx
import { ChartBar } from "@/components/chart-bar"

const data = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
]

export function Visitors() {
  return (
    <ChartBar
      data={data}
      index="month"
      series={[
        { key: "desktop", label: "Desktop" },
        { key: "mobile", label: "Mobile", texture: "hatch" },
      ]}
      title="Visitors"
      valueFormat="compact"
    />
  )
}
```

All charts support these props:

| Prop | Description |
| --- | --- |
| `surface` | `"dark"` or `"light"` card |
| `accent`, `palette` | Primary color and per-series colors |
| `titleSize` | `"hero"` or `"default"` headline |
| `bare` | Render the chart without the card |
| `radius` | Card corner radius |
| `animate`, `duration`, `delay`, `once` | Entrance animation settings |
| `valueFormat`, `currency`, `decimals` | `number`, `compact`, `percent`, `currency`, or a custom function |

Each chart also has its own props, listed in the API tab of its docs page.

### Images

The media and scroll components do not ship with images. Put your own files in `public/` and pass their paths as props. The docs demos look for:

```
public/gallery/01.jpg ... 10.jpg
public/sticky-cards/01.jpg ... 05.jpg
```

When a file is missing, the demo shows a placeholder.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- [Motion](https://motion.dev) and [GSAP](https://gsap.com) with ScrollTrigger
- shadcn registry and CLI
- sugar-high for syntax highlighting

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page is at `/`, and the docs are at `/docs`.

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run registry:build` | Build `registry.json` into `public/r/*.json` |
| `npm run build` | Build the registry, then the Next.js app |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

### Project structure

```
app/
  page.tsx                  Landing page
  docs/                     Docs routes (introduction, installation, components/[slug])
components/
  docs/                     Playground, controls, code panel, sidebar
  docs/demos/               Demo renderers for each component
  landing/                  Landing page sections
lib/
  docs.ts                   Component docs, prop schemas and usage-code generation
  docs-parts/               Docs entries grouped by family
registry/new-york/          Component source (what users install)
  hooks/                    Shared hooks
  lib/chart-kit.tsx         Shared chart library
registry.json               Registry manifest
scripts/build-registry.mjs  Registry build (rewrites URLs for production)
public/r/                   Built registry output
```

### Adding a component

1. Create the component in `registry/new-york/<name>/<name>.tsx`.
2. Add an item to `registry.json` with its files, dependencies and `registryDependencies`.
3. Add a docs entry (props and controls) in `lib/docs.ts` or a file in `lib/docs-parts/`.
4. Add a demo renderer in `components/docs/demos/`.
5. Run `npm run registry:build`.

## Publishing

1. Deploy the site, for example to Vercel.
2. Set `NEXT_PUBLIC_SITE_URL` to the production URL. The registry build replaces `http://localhost:3000` with this value in every registry dependency URL.
3. Run `npm run build`. Components are then available at `https://<your-domain>/r/<name>.json`.

Optional environment variables: `NEXT_PUBLIC_GITHUB_REPO` (star button), `NEXT_PUBLIC_TWITTER_HANDLE` (share cards), `NEWSLETTER_WEBHOOK_URL` and `NEWSLETTER_WEBHOOK_SECRET` (newsletter signups). Enable Vercel Analytics in your project settings to collect page views and events.

[PUBLISHING.md](PUBLISHING.md) covers the full process: testing the registry, setting up a namespace (`@tweenly/<name>`), and listing it in the official shadcn registry directory.
