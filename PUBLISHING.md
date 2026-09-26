# Publishing motioncn as a public shadcn registry

This guide takes motioncn from `localhost` to a registry anyone can install from:

```bash
npx shadcn@latest add @motioncn/sticky-cards
```

## How it works

A shadcn registry is a set of static JSON files. There's no server, database or npm package involved.

- `registry.json` lists every component: its name, files and dependencies.
- `npm run registry:build` reads that list and writes one file per component into `public/r/`, for example `public/r/sticky-cards.json`. Each file includes the component's source code.
- Next.js serves `public/` as-is, so once deployed each component is available at `https://your-domain/r/<name>.json`.
- When someone runs `shadcn add`, the CLI downloads that JSON, writes the source into their project and installs the npm dependencies.

`registry.json` uses `http://localhost:3000` for links between components, for example to `use-reduced-motion`. `scripts/build-registry.mjs` swaps that for `NEXT_PUBLIC_SITE_URL` at build time, so you never edit the URLs by hand.

## 1. Before you publish

- [ ] **Make the GitHub repo public.** The shadcn directory only lists open-source registries.
- [ ] **Add a license.** MIT is the norm for shadcn registries. Create a `LICENSE` file at the repo root.
- [ ] **Check your namespace is free.** Search for `"@motioncn"` in [directory.json](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json). If it's taken, pick another name and update `"name"` in `registry.json`.
- [ ] **Remove or finish `registry/new-york/buttons/hover-button.tsx`.** It's a leftover copy of Fill Button, isn't in the registry, and is the only file that fails `npm run lint`.

## 2. Deploy

Any static-friendly host works. These steps use Vercel:

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo. Vercel detects Next.js automatically.
3. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://motioncn.vercel.app` (your final domain, no trailing slash) |

4. Deploy. The build command is already `npm run registry:build && next build`, so the registry JSON is regenerated with the right domain every time.

If you add a custom domain later, update `NEXT_PUBLIC_SITE_URL` and redeploy. The domain is written into every JSON file at build time.

## 3. Check it works

Confirm the files are served:

```bash
curl https://motioncn.vercel.app/r/registry.json
curl https://motioncn.vercel.app/r/sticky-cards.json
```

Then install into a fresh project. This is the real test:

```bash
npx create-next-app@latest registry-test
cd registry-test
npx shadcn@latest init
npx shadcn@latest add https://motioncn.vercel.app/r/sticky-cards.json
```

Check that:

- `components/sticky-cards.tsx` and `hooks/use-reduced-motion.ts` were created.
- `gsap` and `@gsap/react` were added to `package.json`.
- Imports read `@/hooks/use-reduced-motion`, not `@/registry/...`.
- The component renders.

## 4. Let people install by name

Right after deploying, anyone can already use your components by adding this to their `components.json`:

```json
{
  "registries": {
    "@motioncn": "https://motioncn.vercel.app/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @motioncn/sticky-cards @motioncn/cursor
```

This snippet is already on the site's Installation page, filled in with `NEXT_PUBLIC_SITE_URL`.

## 5. Get listed in the official shadcn directory

Once listed, `@motioncn/...` works for everyone **without** editing `components.json`, and motioncn appears in the directory on ui.shadcn.com.

The directory's requirements:

- The registry must be open source and publicly accessible.
- `registry.json` must follow the [registry schema](https://ui.shadcn.com/schema/registry.json).
- It must be flat: `/registry.json` and `/<component>.json` side by side. `public/r/` already has this shape.
- Items in the `files` array of `registry.json` must not include a `content` property. The build output already meets this.

Steps:

1. Fork [shadcn-ui/ui](https://github.com/shadcn-ui/ui) and clone your fork.
2. Open `apps/v4/registry/directory.json` and add an entry. Entries are kept in alphabetical order by name:

   ```json
   {
     "name": "@motioncn",
     "homepage": "https://motioncn.vercel.app",
     "url": "https://motioncn.vercel.app/r/{name}.json",
     "description": "Animated React components built on Motion and GSAP. Tweak every prop live, then copy the code.",
     "logo": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='7' fill='var(--foreground)'/><circle cx='15' cy='15' r='6' fill='#ff6a2b'/></svg>"
   }
   ```

   The `logo` is inline SVG with single quotes inside. Using `var(--foreground)` keeps it readable in light and dark mode.

3. Run the validator from the repo root:

   ```bash
   pnpm install
   pnpm validate:registries
   ```

4. Commit, push and open a pull request against `shadcn-ui/ui`. Once it's merged the namespace works immediately; there's no separate publish step.

## 6. Adding a component later

1. Write it in `registry/new-york/<name>/<name>.tsx`. Import shared code from `@/registry/new-york/hooks/...` and `@/lib/utils`; the CLI rewrites these paths for users.
2. Add an entry to `registry.json` with `dependencies` (npm packages) and `registryDependencies` (`"utils"`, or the full localhost URL of another motioncn item).
3. Add its docs entry in `lib/docs.ts` and a demo in `components/docs/demos.tsx`.
4. Run `npm run registry:build`, check the page locally, then push. Vercel rebuilds and the component goes live.

Components are copied into users' projects, so there's no versioning to manage. Users re-run `shadcn add` to pick up changes, and the CLI asks before overwriting their edits. Treat renamed or removed props as breaking changes and mention them in your release notes.
