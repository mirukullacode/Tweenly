<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# tweenly: rules for AI coding agents

tweenly is an animated React component library shipped as a shadcn registry, plus its docs site. Read CONTRIBUTING.md for the full workflow.

- Component source lives in `registry/new-york/<name>/<name>.tsx`. It is copied verbatim into users' projects, so imports must be installable: `react`, `motion`, `gsap` / `@gsap/react`, `lenis`, `lucide-react`, `@/lib/utils`, other `@/registry/new-york/...` files, and shadcn/ui components from `@/components/ui/*` (declared as `registryDependencies`). List every npm package in the item's `dependencies`. Avoid framework-specific imports such as `next/navigation` unless the component is Next.js-only, and say so in its docs.
- Pick the animation library deliberately: Motion for state-driven UI, gestures, springs and layout or exit animations; GSAP for timelines and ScrollTrigger scenes. The docs label each component by its `dependencies`.
- Every prop needs a JSDoc comment ending in `Default: ...`.
- Design language: accent `#ff4d12`; theme tokens (`bg-card`, `text-muted-foreground`, `border`) so light and dark mode both work; enter easing `[0.22, 1, 0.36, 1]`, in-out `[0.76, 0, 0.24, 1]`, springs around stiffness 450 / damping 34; animate transform, opacity and clip-path only; honour reduced motion via `@/registry/new-york/hooks/use-reduced-motion`.
- React Compiler lint rules apply: no synchronous setState in effect bodies, no ref reads during render, no `Math.random()` during render.
- A new component needs four things: the source, a docs entry in `lib/docs-parts/`, a demo in `components/docs/demos/` (both registered in `lib/docs.ts` and `components/docs/demos.tsx`), and an item in `registry.json`.
- Demo photos live in `public/gallery/`, `public/sticky-cards/` and `public/products/` (Unsplash License, credited in IMAGE_CREDITS.md). Add new ones only from free-licensed sources and credit them. Components themselves never bundle images and must handle missing ones gracefully.
- Before finishing, run `npx tsc --noEmit`, `npm run lint` and `npm run build`.
