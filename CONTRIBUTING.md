# Contributing to tweenly

Thanks for helping. Whether it's a typo, a bug fix or a whole new component, every contribution makes the library better.

## Ways to contribute

- **Report a bug** with the [bug report form](https://github.com/mirukullacode/tweenly/issues/new?template=bug_report.yml).
- **Request a component** with the [component request form](https://github.com/mirukullacode/tweenly/issues/new?template=component_request.yml).
- **Improve the docs:** descriptions, prop docs, demos and guides all live in this repo.
- **Fix an issue:** look for the `good first issue` and `help wanted` labels.
- **Build a component:** read the guide below, then open an issue first so we can agree on the API.

## Setup

Requirements: Node.js 20 or later and npm.

```bash
git clone https://github.com/<your-username>/tweenly.git
cd tweenly
npm install
npm run dev
```

Open http://localhost:3000. Component pages live at `/docs/components/<slug>`.

## How the project is organized

| Path | What lives there |
| --- | --- |
| `registry/new-york/<name>/<name>.tsx` | Component source. This is exactly what users install |
| `registry/new-york/hooks/`, `registry/new-york/lib/` | Shared hooks and helpers users get as registry dependencies |
| `registry.json` | Registry manifest: files, npm dependencies, registry dependencies |
| `lib/docs-parts/*.ts` | Docs entries: description, category and every prop with its playground control |
| `components/docs/demos/*.tsx` | Demo renderers shown on the stage |
| `lib/docs.ts`, `components/docs/demos.tsx` | Where docs parts and demos are registered |

## Adding a component

1. **Write the component** in `registry/new-york/<name>/<name>.tsx`.
   - Start the file with `"use client"`.
   - Import only from `react`, `motion`, `gsap`, `lucide-react`, `@/lib/utils` and other registry files, so it installs cleanly.
   - Give every prop a JSDoc comment ending in `Default: ...`.
2. **Follow the design language.**
   - Accent `#ff4d12`; use theme tokens (`bg-card`, `text-muted-foreground`, `border`) so it works in light and dark mode.
   - Enter easing `[0.22, 1, 0.36, 1]`, in-out `[0.76, 0, 0.24, 1]`, springs around stiffness 450 and damping 34.
   - Animate `transform`, `opacity` and `clip-path`; avoid animating layout properties.
   - Respect reduced motion with `useReducedMotion` from `@/registry/new-york/hooks/use-reduced-motion`.
3. **Add a docs entry** to a file in `lib/docs-parts/`, with a `control` for every prop people will want to tweak.
4. **Add a demo** to `components/docs/demos/` and register both in `lib/docs.ts` and `components/docs/demos.tsx`.
5. **Add a registry item** to `registry.json`. Use `http://localhost:3000/r/<item>.json` for links to other tweenly items; the build swaps in the real domain.
6. **Check everything:**
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```
7. **Try the install** in a fresh Next.js app: `npx shadcn@latest add http://localhost:3000/r/<name>.json`.

## Code style

- TypeScript everywhere, no `any`.
- The React Compiler lint rules apply: no synchronous `setState` inside effect bodies, no reading refs during render, and no `Math.random()` during render (use a seeded generator inside effects).
- No bundled, remote or generated images. Demos read from `public/gallery/`, and every component must look good when an image is missing.
- Keep comments short and explain why, not what.

## Commits and pull requests

- **Branch from `main`**, one concern per pull request.
- **Short commit messages:** `feat(dock): add vertical orientation`, `fix(chart-bar): legend toggle in Safari`, `docs: clarify install steps`.
- **Sign your commits** so GitHub shows them as Verified.
- **Fill in the pull request template,** and add a screen recording for anything visual.
- **Leave unrelated code alone:** don't reformat lines you didn't change.

## Using an AI coding agent

AI agents are welcome. [AGENTS.md](AGENTS.md) gives them the project rules. You stay responsible for the result: run the checks, read the diff, and test the component in the browser before opening a pull request.

## Code of conduct

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
