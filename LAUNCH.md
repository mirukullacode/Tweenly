# tweenly launch kit

Ready-to-post drafts for launching tweenly. Everything below is written in first person (Manjunath).

Placeholders to replace before posting:

- `https://tweenly.dev`: the site URL is a placeholder. Swap in the real domain everywhere (search this file for `tweenly.dev`).
- `[VIDEO: ...]`, `[GIF: ...]`, `[CLIP LINK]`, `[NAME]`: media and personalisation slots.
- GitHub: `https://github.com/mirukullacode/tweenly`

Facts used in this kit (check them before launch in case anything changes):

- 55+ animated components across Text, Buttons, Interactive, Navigation, Forms, Feedback, Charts, Media, Scroll, Layout, Transitions and Feeds.
- Each one is a shadcn registry item: `npx shadcn@latest add https://tweenly.dev/r/<name>.json`. The source goes into your `components/` folder, so there's no runtime package to keep updated.
- Each docs page has a live playground with a control for every prop. The usage snippet updates as you change them, so what you copy matches what you see.
- Built with Motion and GSAP (ScrollTrigger), Tailwind CSS v4, React 19 and Next.js 16 App Router. Components respect `prefers-reduced-motion` and work in light and dark mode.
- Charts take plain row arrays (`data`, `index`, `series`) like shadcn charts, and share `chart-kit` (scales, formatters, textures, tooltip, legend).

---

## 1. Positioning

**One-liner:**
tweenly is the motion layer for shadcn/ui: 55+ animated React components you tune in a live playground, install with the shadcn CLI, and own as source code.

**Alternative taglines:**

1. Animated components you install with `shadcn add` and own outright.
2. Tweak it live, copy the exact code, ship it.
3. The animation work you keep putting off, done and yours to edit.

---

## 2. Show HN

**Title** (74 chars):

```
Show HN: Tweenly – Animated React components you install with shadcn CLI
```

Backup titles:

- `Show HN: Tweenly – The motion layer for shadcn/ui, 55+ components you own`
- `Show HN: Tweenly – App Router page transitions, charts and more for shadcn`

**URL:** https://tweenly.dev (link to the site, not the repo. The repo link goes in the comment.)

**First comment:**

> Hi HN, I'm Manjunath. I built tweenly, a set of 55+ animated React components distributed as a shadcn registry. You install a component with `npx shadcn add <url>`, and the source lands in your `components/` folder. There is no npm package, no wrapper and no theme layer.
>
> Why I made it: on every project I ended up rewriting the same motion work, like a page transition, a loader, a footer that reveals on scroll, or a toast stack that doesn't jump around. Most animated component collections I tried were either a demo you had to reverse-engineer, or a package whose internals I couldn't change once a designer asked for "the same thing but slower from the left." shadcn's copy-the-source model solved the ownership part, so I built motion components on top of it.
>
> What's different:
>
> - Every docs page is a playground. Every prop has a control, and the code panel regenerates as you change them, so the snippet you copy matches what's on screen.
> - The charts (line, bar, radial, radar, rings, heatmap, KPI, progress, dot matrix) take plain row arrays the way shadcn charts do. In the docs you can edit the data table and watch the chart re-animate with your numbers.
> - Some pieces are usually painful to build: App Router page transitions (curtain, stairs, iris from the click point, slide, blinds), intro page loaders, sticky-reveal footers, a notification feed (Sonner-style stack, inbox, dynamic island, timeline), iOS-style swipe rows, and canvas confetti with real physics.
>
> Technical notes:
>
> - Motion handles springs, layout animations and gestures. GSAP with ScrollTrigger handles timelines and pinned scroll sections. I picked whichever fit each component instead of forcing one library everywhere.
> - The page transition provider covers the page, calls `router.push`, then waits for `usePathname()` to change and two animation frames to pass before revealing. That way you never see the old page flash or the new one half-painted. Clicks during the cover phase retarget, and clicks during the reveal queue. Modifier-clicks, external links and same-page hash links fall through to the browser. It gives up waiting after 8s so a slow route can't leave you stuck behind an overlay.
> - Confetti runs on a single canvas with a particle pool, DPR capped at 2, and gravity and drag integrated per frame, so it doesn't create DOM nodes.
> - Everything checks `prefers-reduced-motion`. For example, the page transition becomes a short fade.
> - Stack: Next.js 16, React 19, Tailwind v4, TypeScript.
>
> Code: https://github.com/mirukullacode/tweenly (MIT)
>
> Feedback I'd like:
>
> 1. Try installing one component into a fresh project. Did anything break, or was a dependency missing?
> 2. Which components feel over-animated for real product UI? I would rather tone things down than add more.
> 3. Accessibility issues, especially keyboard and screen reader behaviour on the OTP input, slide button and notification feed.
>
> I'll be here all day to answer questions.

**Posting tips:**

- Post Tuesday to Thursday, around 8 to 10am US Eastern (5:30 to 7:30pm IST). Avoid weekends and major US holidays.
- Stay online for the first 3 to 4 hours. Early replies matter most.
- Reply to every substantive comment, especially critical ones. Thank people, answer directly, and admit tradeoffs ("yes, GSAP adds weight; here's why I used it for timelines").
- Don't argue about whether the web needs more animation. Acknowledge the point and mention reduced-motion support and the fact that you can delete what you don't want.
- Never ask for upvotes, and don't share the direct HN link asking people to vote. HN detects voting rings and will bury the post. Sharing the site itself is fine.
- If it doesn't catch on, you can repost once after a few weeks with a meaningfully different angle. The mods sometimes offer a second-chance pool.
- Make sure the site loads fast and works on mobile before posting. HN readers open it on phones.

---

## 3. Product Hunt

**Name:** tweenly

**Tagline** (52 chars):

```
The motion layer for shadcn/ui, and you own the code
```

Alternates: `Animated shadcn components you tune live and own` (48), `55+ animated React components for shadcn/ui` (43).

**Description** (242 chars):

```
55+ animated React components for shadcn/ui: page transitions, loaders, charts, footers, notification feeds, confetti and more. Tweak every prop in a live playground, copy the exact code, and install with npx shadcn add. Free and open source.
```

**Maker's first comment:**

> Hey Product Hunt, I'm Manjunath, and I made tweenly.
>
> I kept rebuilding the same animations on every project: page transitions, intro loaders, a footer that reveals on scroll, a toast stack that doesn't jitter. Most libraries I tried gave me a black box. I wanted the shadcn model instead, where the code goes into my project and I can change any line.
>
> So tweenly is a shadcn registry. You pick a component, tune its props in the live playground, and run `npx shadcn add`. The source goes into your `components/` folder, and the snippet you copy matches the demo you just tuned.
>
> A few I'm proud of:
> - App Router page transitions (curtain, stairs, iris, slide, blinds) that wait for the new route to render before revealing
> - Charts that work with your real data. You can edit the data table in the docs and watch them re-animate
> - A notification feed with Sonner-style stack, inbox, dynamic island and timeline variants
> - Physics confetti on canvas, swipe rows, OTP input, navbars, and a table of contents with a plane that flies along the headings
>
> Built with Motion, GSAP, Tailwind v4 and React 19. Everything respects reduced motion. MIT licensed.
>
> I'd love to hear which component you'd use first and what's missing. I'm replying to everyone today.

**Gallery captions** (5 images or clips):

1. Tune every prop live. The code updates to match what you see.
2. App Router page transitions: curtain, stairs, iris, slide and blinds.
3. Charts from your own data. Edit the table and watch them re-animate.
4. Notification feed, swipe rows, OTP input and confetti, all ready to install.
5. One command: npx shadcn add. The source is yours.

**Topics:** Developer Tools, Open Source, Design Tools, User Experience, GitHub

**PH tips:** Launch at 12:01am Pacific (12:31pm IST). Use a clip for the first gallery item. Tell your network you're live, but don't ask for upvotes directly. PH penalises that too. Reply to every comment within the first few hours.

---

## 4. X / Twitter

### Launch thread

**1/**
I just launched tweenly, the motion layer for shadcn/ui.

55+ animated React components. Tune every prop in a live playground, copy the exact code, install with `npx shadcn add`. The source is yours.

Free and open source.

https://tweenly.dev

[VIDEO: 20s montage: page transition iris, notification stack fanning out, confetti burst, chart drawing in, sticky footer reveal. End on the tweenly wordmark.]

**2/**
Every docs page is a playground. Every prop has a control, and the code panel rewrites itself as you drag sliders.

What you copy is exactly what you saw.

[VIDEO: Text Reveal docs page. Drag the blur and stagger sliders, switch split from word to char, cut to the code panel updating.]

**3/**
Page transitions for the App Router that actually wait for the next route to render. No flash of the old page, no half-painted new one.

Curtain, stairs, iris from your click point, slide, blinds.

[VIDEO: Clicking between three demo pages, cycling through all five variants.]

**4/**
Charts take plain row arrays like shadcn charts: data, index, series.

In the docs you can edit the data table and the chart re-animates with your numbers.

Line, bar, radial, radar, rings, heatmap, KPI, progress, dots.

[GIF: Editing a cell in the data table of Chart Bar; bars spring to the new values.]

**5/**
A notification feed with a useNotifications hook.

Sonner-style stack, inbox list, dynamic island, timeline cards. Swipe to dismiss, timers that pause on hover, layout animations that don't jump.

[VIDEO: Firing 5 notifications into the stack, hovering to fan out, swiping one away, switching to island.]

**6/**
Footers are usually the last thing anyone polishes.

Four variants: sticky reveal (the page lifts off it), giant kinetic wordmark, classic columns with newsletter, and a curtain panel that expands to full bleed with a magnetic CTA.

[VIDEO: Scrolling to the bottom to uncover the sticky-reveal footer, then the curtain variant expanding.]

**7/**
Small things I care about:

- Swipe rows with iOS-style actions
- OTP input with springy digits
- Physics confetti on one canvas
- A table of contents where a plane flies along your headings
- Sunflower and rose cursors

[GIF: 2x2 grid: swipe row, OTP success, confetti cannons, TOC plane trail.]

**8/**
Under the hood:

- Motion for springs, gestures, layout
- GSAP + ScrollTrigger for timelines and pinned scroll
- Tailwind v4, React 19, TypeScript
- Respects prefers-reduced-motion everywhere
- Light and dark mode

No wrapper package. It's just your code.

**9/**
Install any component:

npx shadcn@latest add https://tweenly.dev/r/page-transition.json

Works with pnpm, yarn and bun too. Dependencies like chart-kit come along automatically.

[IMAGE: Terminal screenshot of the install, then the file tree showing components/page-transition.tsx.]

**10/**
It's MIT and on GitHub. Stars, issues and "this broke in my project" reports all help.

https://github.com/mirukullacode/tweenly

What should I build next?

### Standalone component posts (weeks 2 to 4)

Post one every 2 to 3 days. Each post gets its own clip.

1. **Sticky Cards**
   A stack of cards pinned on scroll. The front one lifts away, then the next.
   One component, your images, GSAP ScrollTrigger underneath.
   npx shadcn add https://tweenly.dev/r/sticky-cards.json
   [VIDEO: Scrolling through five sticky cards.]

2. **Hold Button**
   Destructive actions deserve a pause. Hold to confirm, with a fill that sweeps across while you press and rewinds if you let go.
   Source you own: https://tweenly.dev
   [GIF: Holding, releasing early, then holding to completion.]

3. **Page Loader**
   Intro loaders built on GSAP timelines: stairs, odometer counter, greetings in five languages, an iris that opens from a tick dial, blinds.
   Tune the timing live, then copy it.
   [VIDEO: The words and iris variants back to back.]

4. **Table of Contents**
   An "On this page" sidebar where a paper plane flies along the heading trail as you scroll. Rail and spotlight variants too if planes aren't your thing.
   [VIDEO: Scrolling a long doc page with the plane following.]

5. **Confetti**
   Canvas confetti with burst, cannons, fireworks, rain and stream presets. One canvas, pooled particles, real gravity and drag.
   confetti() for one-offs, useConfetti and ConfettiButton when you want React.
   [VIDEO: Cycling through all five presets.]

6. **Swipe Row**
   iOS-style swipe actions for web lists. Reveal buttons, full-swipe to commit, or floating cards with tilt. Rows animate out of the layout when removed.
   [VIDEO: On a phone-sized viewport, swiping to archive and delete.]

7. **Image Fan**
   One image rises from below, then the rest slide out from under it into an overlapping fan.
   Good for hero sections and portfolio headers.
   [VIDEO: Image Fan entrance on scroll, played twice.]

8. **OTP Input**
   Verification codes with springy digits, a gliding focus ring, a shake on error and a collapse into a check badge on success.
   Paste support and keyboard navigation included.
   [GIF: Typing a wrong code (shake), then the right one (collapse to check).]

9. **Cursors**
   Seven custom cursors: ring, dot, blend, crosshair, sparkle trail, sunflower and rose.
   The sunflower one is my favourite. Use them sparingly.
   [VIDEO: Moving over a page with the sunflower cursor, then rose.]

10. **Chart KPI**
    Stat card with a count-up headline, a delta pill, and a halftone sparkline you can scrub.
    Plain row data in, animated dashboard tile out.
    [GIF: KPI card counting up, then scrubbing the sparkline.]

---

## 5. Reddit

Before posting anywhere: read the sidebar rules and recent pinned posts. Many subs limit self-promotion (a common guideline is 10% of your activity), require flairs, or only allow showcases on certain days. Post from an account with real history. Reply to comments, don't cross-post the same text on the same day, and space the four posts across the week.

### r/reactjs

Check: self-promotion rules, "Show /r/reactjs" flair requirements, and whether showcases must go in the monthly "Who's hiring / Show off" thread.

**Title:** I built 55+ animated components as a shadcn registry, with a playground that generates the code you copy

**Body:**

> I've been working on tweenly, a collection of animated React components you install with the shadcn CLI. The source goes into your project, so you can change anything.
>
> Some React details that might interest this sub:
>
> - **Page transitions:** a provider + `TransitionLink` + `usePageTransition` hook. It covers the page, calls `router.push`, waits for `usePathname()` to change plus two rAFs, then reveals. Clicks mid-cover retarget instead of stacking.
> - **Notification feed:** a `useNotifications` hook with layout animations (Motion) for stack, list, island and timeline variants. Swipe to dismiss, timers pause on hover.
> - **Charts** take `data` / `index` / `series` like shadcn charts and share a small `chart-kit` lib (scales, formatters, tooltip, legend).
> - **Reduced motion:** a shared `useReducedMotion` hook that every component checks.
>
> The docs are built around a props schema. Each prop gets a control, and the usage snippet is generated from the current state, so the code you copy matches the demo.
>
> Site: https://tweenly.dev
> Code (MIT): https://github.com/mirukullacode/tweenly
>
> I'd especially like feedback on the hook APIs. Are they shaped the way you'd expect?

### r/nextjs

Check: flair ("Discussion" / "Show & Tell"), self-promo rules.

**Title:** App Router page transitions that wait for the new route before revealing (open source, shadcn installable)

**Body:**

> Page transitions in the App Router are a common question here, so I want to share how I approached them in tweenly.
>
> The problem: with `router.push`, there's no "route finished rendering" event. If you animate on a timer, you either reveal the old page or flash a half-painted new one.
>
> What I ended up doing:
>
> 1. Cover the page with the exit animation (GSAP timeline).
> 2. Call `router.push` (or `replace`).
> 3. Wait for `usePathname()` to change. That's the signal the new route has committed. Then wait two `requestAnimationFrame`s so it's painted.
> 4. Reveal. There's an 8s timeout so a slow route never traps you behind the overlay.
>
> Extras: `TransitionLink` ignores modifier-clicks, external links and same-page hashes. The iris variant opens from the click point, and keyboard activation falls back to center. Hovering a link prefetches. You can also pass a custom `navigate` that returns a promise if you're not using the Next router.
>
> Five variants: curtain, stairs, iris, slide, blinds. Install:
>
> ```
> npx shadcn@latest add https://tweenly.dev/r/page-transition.json
> ```
>
> It's part of a larger set of animated components (loaders, footers, charts, navbars and more), but this is the one I think is most useful for Next devs.
>
> Demo: https://tweenly.dev
> Source: https://github.com/mirukullacode/tweenly
>
> If you've solved this differently, for example with View Transitions or template.tsx tricks, I'd like to compare notes.

### r/webdev

Check: r/webdev only allows showcase posts on Saturdays ("Showoff Saturday"). Confirm the current rule and flair before posting.

**Title:** [Showoff Saturday] I made a library of animated UI components where you tune every prop live and copy the exact code

**Body:**

> tweenly is a free, open-source set of 55+ animated components for React: page transitions, intro loaders, sticky-reveal footers, notification stacks, swipe rows, canvas confetti, charts and scroll storytelling (sticky cards, image fan, horizontal scroll).
>
> The part I think is most useful: every docs page is a playground. You adjust duration, easing, blur, direction and so on with controls, watch the result, and the code panel regenerates to match. Then one command (`npx shadcn add`) copies the component source into your project. There's no package to update and no black box.
>
> Everything respects `prefers-reduced-motion` and works in light and dark.
>
> https://tweenly.dev
>
> I'd like to hear about performance and anything that feels like too much animation for real product UI.

### r/tailwindcss

Check: self-promotion and showcase flair rules.

**Title:** Animated components built on Tailwind v4 with no extra theme layer, installable with the shadcn CLI

**Body:**

> I built tweenly with Tailwind v4 from the start. Components use plain utility classes and your existing shadcn tokens, so they pick up your theme and dark mode without a config file or plugin.
>
> What's in it: page transitions, loaders, footers, navbars (glass pill, scroll morph, dynamic island), notification feeds, OTP input, charts with textured fills, and more. There are 55+ components in total. Every one takes a `className` and installs as source you can restyle.
>
> Each docs page has a live playground, and the copied code matches your settings.
>
> https://tweenly.dev
> https://github.com/mirukullacode/tweenly
>
> Is there anything in the class structure that makes restyling awkward? I'd rather fix that now.

---

## 6. LinkedIn

> I just released tweenly, an open-source library of 55+ animated React components for shadcn/ui.
>
> Motion is the part of a UI that tends to get cut when deadlines hit: page transitions, loaders, the footer, feedback when you click something. I kept rebuilding these on every project, so I packaged them properly.
>
> How it works:
> - Every component has a live playground. You adjust the props and the code updates to match.
> - One command (npx shadcn add) copies the source into your project. You own it, and there's no dependency to maintain.
> - It covers App Router page transitions, charts that work with real data, notification feeds, swipe rows, physics confetti, navbars and scroll storytelling sections.
> - Built with Motion, GSAP, Tailwind CSS v4 and React 19, and it respects reduced-motion settings.
>
> It's free and MIT licensed. If you build with React or Next.js, I'd appreciate you trying one component and telling me what could be better.
>
> Site: https://tweenly.dev
> GitHub: https://github.com/mirukullacode/tweenly
>
> #react #nextjs #opensource #webdevelopment #frontend

(Attach the 20s montage video natively. LinkedIn favours native video over links. Put the links in the first comment if reach looks low.)

---

## 7. Newsletter pitches

### Generic template

**Subject:** tweenly: animated shadcn components you tune live and own

> Hi [NAME],
>
> I'm Manjunath, and I've been reading [NEWSLETTER] for a while. I just released tweenly, an open-source set of 55+ animated React components distributed as a shadcn registry.
>
> What might interest your readers: every component has a live playground whose code output matches the settings, installs with `npx shadcn add`, and ships as source the developer owns. Highlights include App Router page transitions that wait for the new route before revealing, charts driven by real row data, and a Sonner-style notification feed.
>
> Site: https://tweenly.dev
> GitHub (MIT): https://github.com/mirukullacode/tweenly
> 20s demo: [CLIP LINK]
>
> Happy to send anything else you need. Thanks for considering it.
>
> Manjunath Irukulla

Keep it this short. Editors skim. Send Tuesday to Thursday, a few days after launch once you have some traction to point to (stars, HN discussion).

### Tailored subject lines

| Newsletter | How to submit | Subject line |
| --- | --- | --- |
| This Week in React (Sébastien Lorber) | Submission form / X DM | `tweenly: App Router page transitions + 55 animated components for shadcn` |
| JavaScript Weekly (Cooperpress) | Reply to issue / submit link | `Open-source animated React components, installed via shadcn CLI` |
| React Status (Cooperpress) | Reply to issue / submit link | `tweenly: animated shadcn/ui components with a code-generating playground` |
| Frontend Focus (Cooperpress) | Reply to issue / submit link | `Motion components that respect prefers-reduced-motion, built on Tailwind v4` |
| Bytes (ui.dev) | Email / tips form | `A shadcn registry for motion (page transitions that actually wait for the route)` |
| Tailwind Weekly | Submission form | `tweenly: 55+ animated components on Tailwind v4, no theme layer` |
| Sidebar.io | Submit link | `tweenly: tune an animation live, copy the exact code` |
| Codrops | Pitch email (tutorial) | `Tutorial pitch: building App Router page transitions with GSAP` |

### Codrops tutorial pitch

**Subject:** Tutorial pitch: building App Router page transitions with GSAP

> Hi Codrops team,
>
> I'm Manjunath, the author of tweenly, an open-source library of animated React components. I'd like to write a tutorial for Codrops: "Page Transitions in the Next.js App Router with GSAP."
>
> It would cover why timer-based transitions flash in the App Router, using `usePathname` as the "route committed" signal, building curtain, stairs and an iris that opens from the click point with GSAP timelines, handling rapid clicks, modifier keys and reduced motion, and a live demo plus a repo readers can fork.
>
> Here's the finished effect: [CLIP LINK], and the library: https://tweenly.dev
>
> I can deliver a draft and demo within two weeks. Thanks for reading.
>
> Manjunath Irukulla

---

## 8. YouTube creator outreach

### Email template

**Subject:** A motion library you might like for a video

> Hi [NAME],
>
> Your video on [SPECIFIC VIDEO] is what got me into [SPECIFIC TECHNIQUE]. Thank you for it.
>
> I just released tweenly, a free, open-source set of 55+ animated React components that install with the shadcn CLI as editable source. I think [SPECIFIC COMPONENT] could fit your channel. Here's a 10-second clip: [CLIP LINK]
>
> No ask beyond a look. If it's ever useful for a video, I'm happy to walk through how anything works or prepare a demo repo.
>
> https://tweenly.dev
>
> Thanks,
> Manjunath

Rules: one creator per email, reference a real video, attach a clip that matches their style, and never follow up more than once.

### Creators and angles

| Creator | Angle |
| --- | --- |
| Hyperplexed | Recreating effects: the ASCII image with the pixel trail, image fan and the TOC plane trail are right in their style. |
| Codegrid | GSAP-heavy site animations: page loaders (stairs, odometer, iris), page transitions and sticky-reveal footers. |
| Olivier Larose | Awwwards-style scroll storytelling: sticky cards, horizontal scroll, image arc and curtain footer with a magnetic CTA. |
| Kevin Powell | Motion done responsibly: reduced-motion handling and Tailwind v4 styling without a theme layer. |
| Josh tried coding | Next.js App Router tutorials: "page transitions that wait for the route" as a build-along. |
| Web Dev Simplified | Explainer on how the shadcn registry model works, using tweenly as a concrete example. |
| Theo (t3.gg) | The "own your components" argument: registries vs npm packages, with a copy-the-source motion library. |
| Fireship | Fast "code report" style: 55+ components, one command, playground that writes the code. |

---

## 9. Article outlines

### Article 1: How I built App Router page transitions that actually work

1. **The problem**: `router.push` returns before the next page renders. Timer-based transitions reveal the old page or flash a half-painted new one. Show a slowed-down GIF of the flash.
2. **What I tried first**: `template.tsx` remounts, exit animations with AnimatePresence, and why they fall short with the App Router (the old tree is gone before the exit plays, and there's no layout-level exit).
3. **The approach**: a provider that owns an overlay and a three-phase state machine: `cover` → `wait` → `reveal`.
4. **Knowing when the route is ready**: `usePathname()` changes on commit. Resolve waiters in an effect, then two `requestAnimationFrame`s for paint. Add an 8s timeout as a safety net.
5. **Rapid clicks**: during `cover`, retarget the destination. During `wait` or `reveal`, queue one pending navigation. Use a run ID to discard stale timelines.
6. **TransitionLink details**: skip modifier-clicks, middle-clicks, `target="_blank"`, downloads, external origins and same-page hashes. Iris from the click point, with keyboard activation (`e.detail === 0`) falling back to center. Prefetch on hover.
7. **The variants**: curtain with curved edge, staggered stairs, iris via clip-path, card-deck slide, blinds. Each is a small GSAP timeline pair.
8. **Reduced motion**: collapse every variant into a 250ms fade.
9. **Escape hatch**: a custom `navigate` that returns a promise, for non-Next routers.
10. **Install it**: `npx shadcn add .../page-transition.json`, link to the playground.

### Article 2: Charts that animate from real data: designing chart-kit

1. Why most animated chart demos use fake data, and why I wanted `data` / `index` / `series` like shadcn charts.
2. Shared primitives: scales, nice ticks, number formatters (`compact`, `percent`, `currency`, custom functions).
3. Textures (hatch, halftone, grain) for telling series apart without relying only on color.
4. Entrance animation: draw-in lines, springy staggered bars, sweep-in radial slices, and re-animating when data changes.
5. Tooltips and crosshairs that snap to data points, and a legend that toggles and re-flows.
6. The docs' editable data table: wiring playground state into real props.
7. Shipping it as a registry lib that the CLI installs automatically alongside any chart.

### Article 3: Physics confetti on one canvas, and the notification feed that doesn't jump

(Or split into two posts.)

1. **Confetti**: why canvas over DOM nodes. The particle pool, DPR capped at 2, frame-rate-independent gravity and drag (`Math.pow(decay, dt)`). The presets (burst, cannons, fireworks, rain, stream). API design: an imperative `confetti()`, plus `useConfetti`, `ConfettiButton` and `<Confetti>`.
2. **Notification feed**: layout animations with Motion for a Sonner-style stack that fans out on hover. Morphing the dynamic island. Swipe to dismiss with velocity thresholds. Pausing timers while hovered or hidden. The `useNotifications` hook API.
3. What both taught me about keeping animations cheap: transforms and opacity only, and avoiding layout thrash.

---

## 10. Launch week calendar

Adjust dates to the actual launch week. HN day is Tuesday.

| Day | Actions |
| --- | --- |
| **Previous week** | Finish the pre-launch checklist. Record all clips. Schedule the X thread as a draft. Prepare the PH page (save as draft, add a hunter if you have one). Warm up: post 2 or 3 component clips on X without a link to the launch. |
| **Mon** | Final install test in a fresh project. Open PRs to awesome lists and the shadcn directory. Post one teaser clip on X ("launching tomorrow"). |
| **Tue** | **Show HN** at 8 to 10am ET. Stay on the thread all day. Post the **X launch thread** 1 to 2 hours after HN. Post the **LinkedIn** post in the evening IST / morning US. |
| **Wed** | **r/nextjs** post (page transitions angle). Reply to HN and X stragglers. Send **newsletter pitches** (TWIR, Cooperpress, Bytes). |
| **Thu** | **Product Hunt** launch at 12:01am PT. Reply to comments all day. **r/reactjs** post. |
| **Fri** | Publish **Article 1** on dev.to and your blog (canonical URL on your blog). Share it on X and LinkedIn. Send **YouTube outreach** (2 or 3 creators). |
| **Sat** | **r/webdev Showoff Saturday**. **r/tailwindcss** post. |
| **Sun** | Rest. Collect feedback into GitHub issues. Write a short "launch week numbers + what I learned" draft. |
| **Weeks 2 to 4** | Standalone component posts every 2 to 3 days. Articles 2 and 3. Tailwind Weekly, Sidebar and Codrops pitches. Ship fixes from launch feedback and post changelog updates. |

---

## Clip shot list

Record at 1440p or higher, 60fps, in a clean browser window (no extensions, bookmarks bar hidden) with dark mode on unless noted. Use slow, deliberate cursor movement and export MP4 plus GIF.

| # | Clip | Length | What to record |
| --- | --- | --- | --- |
| 1 | Playground | 10s | Text Reveal docs: drag blur and stagger, toggle word/char, pan to the code panel updating. |
| 2 | Page transitions | 10s | Click between 3 pages, cycling curtain → stairs → iris (click near a corner so the origin shows) → slide → blinds. |
| 3 | Chart data table | 8s | Chart Bar: edit two cells in the data table, bars spring to the new values, hover a tooltip. |
| 4 | Chart grid | 8s | 3x3 grid of all chart types animating in on scroll. |
| 5 | Notification stack | 10s | Fire 5 notifications, hover to fan out, swipe one away, switch to island. |
| 6 | Sticky-reveal footer | 7s | Scroll to the bottom as the page lifts off the footer. |
| 7 | Curtain footer | 7s | Curtain panel expanding to full bleed, cursor pulling the magnetic CTA. |
| 8 | Page loader | 8s | Words variant (Hello, Bonjour, Ciao...) then the iris exit. |
| 9 | Swipe rows | 7s | Mobile viewport (390px): reveal actions, full-swipe delete, row collapses. |
| 10 | Confetti | 8s | ConfettiButton burst, then cannons, then fireworks. |
| 11 | OTP input | 6s | Wrong code shakes, correct code collapses into a check badge. |
| 12 | Navbars | 8s | Island mega-menu opening, then the scroll morph turning into a pill. |
| 13 | TOC plane | 8s | Scroll a long doc page while the plane flies along the heading trail. |
| 14 | Cursors | 6s | Sunflower cursor over a hero, switch to rose. Light mode for contrast. |
| 15 | Scroll storytelling | 10s | Sticky cards lifting away → image fan opening → horizontal scroll row. |

Bonus: a 20s montage cut from clips 2, 5, 10, 3 and 6 for the X thread, LinkedIn and PH gallery. Also a terminal screenshot of `npx shadcn add` with the resulting file tree.

---

## 11. Pre-launch checklist

**Domain and deployment**
- [ ] Buy the domain and replace every `https://tweenly.dev` placeholder in this file.
- [ ] Deploy to production (e.g. Vercel) with `NEXT_PUBLIC_SITE_URL` set to the real domain, so registry dependency URLs don't point at `localhost:3000`.
- [ ] Set `NEXT_PUBLIC_GITHUB_REPO` (if it differs from `mirukullacode/tweenly`) and `NEXT_PUBLIC_TWITTER_HANDLE` for share cards.
- [ ] Run `npm run build` and spot-check a few `https://<domain>/r/<name>.json` files: URLs rewritten, and no `localhost` anywhere.
- [ ] Update the README install commands from `https://<your-domain>` to the real domain.

**Install testing**
- [ ] Fresh `create-next-app` + `npx shadcn@latest init`, then install at least: a chart (checks chart-kit comes along), page-transition, notification-feed, confetti, footer, sticky-cards, cursor.
- [ ] Repeat with pnpm and bun.
- [ ] Confirm `npm run build` and `npm run lint` pass in the test project, with no type errors.
- [ ] Test with reduced motion enabled at the OS level.
- [ ] Test the docs and landing page on mobile Safari and Android Chrome, and check Lighthouse performance.

**Presentation**
- [ ] OG images for the landing page, docs index and each component page. Check them with an X card validator and the LinkedIn post inspector.
- [ ] Favicon, site title and meta descriptions.
- [ ] Add a clip or GIF to the top of the README, plus a LICENSE file (MIT).
- [ ] GitHub repo: description, topics (`shadcn`, `react`, `animation`, `nextjs`, `tailwindcss`, `gsap`, `framer-motion`), social preview image, homepage link.
- [ ] Issue templates (bug report / component request).

**Tracking**
- [ ] Analytics (Vercel Analytics, Plausible or similar). Track copy-code and copy-install-command clicks if possible.
- [ ] UTM parameters on links you post (`?ref=hn`, `?ref=ph`, `?ref=reddit`).

**Distribution PRs**
- [ ] Namespace setup and a PR to the official shadcn registry directory (see PUBLISHING.md).
- [ ] PR to **awesome-shadcn-ui**.
- [ ] PR to **awesome-react-components** (Animation / UI section).
- [ ] PR to **awesome-tailwindcss** (UI libraries / components).
- [ ] Follow each list's contribution guidelines exactly: alphabetical order, description format, one entry per PR.

**Accounts**
- [ ] Product Hunt maker profile ready, and the launch saved as a draft.
- [ ] HN account with some prior comment history.
- [ ] Reddit account with genuine participation in the target subs.
- [ ] X thread drafted and media uploaded.
