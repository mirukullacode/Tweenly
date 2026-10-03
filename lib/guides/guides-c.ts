import type { ComponentGuide } from "./types"

export const guidesC: Record<string, ComponentGuide> = {
  confetti: {
    overview:
      "Confetti is a particle effect drawn on a single canvas with one requestAnimationFrame loop, written in plain canvas code with no animation library in the engine. The canvas is created when the first shot fires and removed once the last particle is gone, and particles are pooled between shots. It ships as a `confetti()` function, a `useConfetti` hook, a `ConfettiButton` (springy press via Motion) and a declarative `<Confetti>` component.",
    whenToUse: [
      "Celebrating a finished checkout, signup or onboarding step.",
      "Rewarding an achievement such as a streak or a completed task.",
      "A launch or announcement page that should fire once when a section scrolls into view.",
      "A celebration confined to one card or panel instead of the whole viewport.",
    ],
    features: [
      "Six presets through `preset`: burst, cannons, fireworks (rockets that explode at their apex), rain, pride and stream.",
      "Physics controls: `particleCount`, `spread`, `angle`, `startVelocity`, `gravity`, `drift`, `decay`, `scalar` and `ticks`.",
      "Square, circle, strip and star `shapes`, or `emoji` drawn as cached bitmaps.",
      "`<Confetti trigger>` fires on mount, when scrolled into view, or each time `active` turns true.",
      "Pass a ref to `useConfetti` or `container` to confine the effect to one element; `origin` then becomes relative to it.",
      "`confetti()` returns a promise that resolves when the effect finishes, and `confetti.reset()` stops viewport effects at once.",
    ],
    accessibility: [
      "The canvas is `aria-hidden` and ignores pointer events, so it never blocks clicks or reaches screen readers.",
      "With `disableForReducedMotion` (on by default) nothing fires when the user prefers reduced motion. `ConfettiButton` also skips its press pop in that case.",
      "Confetti is purely visual. If it marks a success, also show or announce the result in text.",
    ],
    tips: [
      "Particle counts for rain, pride and stream are spread over `duration`, so raise `particleCount` with longer durations to keep the density.",
      "Use `zIndex` if the viewport canvas has to sit above a modal or fixed header. The default is 100.",
    ],
    related: ["like-button", "hold-button", "number-ticker"],
  },

  "page-loader": {
    overview:
      "PageLoader is a full-screen intro overlay that counts to 100 and then plays an exit that reveals the page underneath. It is built on a GSAP timeline through `useGSAP`: a staged fake load (or your real `progress`) drives the counter, and the exit uses transforms or clip-path depending on the variant. The overlay unmounts once the exit finishes.",
    whenToUse: [
      "A portfolio or agency site that wants a branded first impression.",
      "Covering the page while fonts, video or a WebGL scene load, by passing real `progress`.",
      "A launch page where a short counted intro sets the tone.",
    ],
    features: [
      "Five `variant` styles: stairs (columns lift away), counter (rolling digits with a diagonal clip), words (greetings in sequence under a curved panel), iris (a dial of ticks, then a circular hole opens) and blinds.",
      "Uncontrolled mode runs staged checkpoints over `duration` so it reads as real loading; controlled mode follows `progress` and exits at 100.",
      "`ease` picks the GSAP ease family (power4, expo, circ, sine) and `exitDuration` sets the exit length.",
      "`position` covers the viewport or the nearest positioned parent, and `lockScroll` stops page scrolling while it is fixed.",
      "`onComplete` fires after the exit, which is a good moment to start hero animations.",
    ],
    accessibility: [
      "The overlay has `role=\"progressbar\"` with `aria-label` from `label` and min/max values, but it never sets `aria-valuenow`. Screen readers won't hear the percentage unless you add it.",
      "With reduced motion the intro is skipped, the fake load takes 0.4s, and the exit is a 0.35s fade instead of the variant animation.",
      "Page content renders underneath from the start, so it stays in the DOM. The overlay itself does not trap focus.",
    ],
    tips: [
      "Keep `duration` short (the default is 2.4s). A long loader in front of content that is already loaded only adds wait time.",
      "For real loading, feed `progress` from your asset loader. The counter tweens to each new value and the exit plays when it reaches 100.",
    ],
    related: ["page-transition", "preloader", "text-reveal"],
  },

  "page-transition": {
    overview:
      "PageTransition covers the screen, navigates, waits for the new route to render, then reveals it. A provider builds GSAP timelines for the cover and reveal phases, and by default it navigates with the Next.js App Router (`useRouter` and `usePathname` from `next/navigation`). `TransitionLink` and `usePageTransition` trigger it.",
    whenToUse: [
      "Portfolio, agency or editorial sites where route changes should feel deliberate.",
      "Showing the destination name on the cover between pages through `label`.",
      "Apps with a custom router: pass `navigate` and every same-origin `TransitionLink` goes through it.",
    ],
    features: [
      "Five `variant` styles: curtain (curved panel), stairs, iris (opens from the click point), slide (the page scales back while a panel slides over) and blinds.",
      "The reveal waits for the pathname to change, or for your custom `navigate` promise, with an 8 second safety timeout.",
      "`TransitionLink` is a drop-in anchor. Modifier-clicks, external links, `target`, `download` and in-page hash links behave like normal anchors.",
      "Routes prefetch on hover and focus by default (`prefetch`). Hash or query changes on the same path skip the cover.",
      "Clicks during a transition retarget or queue instead of stacking animations, and `usePageTransition` exposes `navigate` and `isTransitioning`.",
    ],
    accessibility: [
      "The overlay is `aria-hidden` and blocks pointer events only while a transition runs.",
      "Keyboard activation of a `TransitionLink` works; the iris then opens from the center because there is no pointer position.",
      "Reduced motion swaps every variant for a 0.25s crossfade. Focus is not moved and the route change is not announced, so move focus to the new page heading yourself.",
    ],
    tips: [
      "Mount `PageTransitionProvider` once in app/layout.tsx so it persists across routes. Outside a provider, `usePageTransition().navigate` falls back to a full page load.",
      "The slide variant transforms the element that wraps your pages. Use `className` to give that wrapper a background so the scaled page doesn't show through.",
    ],
    related: ["page-loader", "smooth-scroll", "navbar"],
  },

  "swipe-row": {
    overview:
      "SwipeRow is a list row you drag sideways to reveal or commit actions, like iOS Mail. It uses Motion: a drag motion value drives the action buttons, a velocity-based tilt on cards, and spring snapping. `SwipeList` wraps it with layout animations so removed rows animate out and the rest move up.",
    whenToUse: [
      "Inbox, task or notification lists on touch devices.",
      "Archive or delete actions that should be quick without cluttering each row.",
      "A stack of cards that can be flicked away.",
    ],
    features: [
      "Three `variant` modes: reveal (buttons fan out and stay open), full (a long swipe past `threshold` commits the first action) and card (the row tilts with drag velocity).",
      "`leftActions` and `rightActions` take a label, icon, color and `onAction`. Mark one `destructive` to slide the row off and collapse it.",
      "Fast flings commit even below the threshold, and `elastic` sets rubber-band resistance at the edges.",
      "`haptics` vibrates briefly when a swipe arms or commits, where the device supports it.",
      "`SwipeList` takes `items`, `getKey` and `renderItem`, accepts per-item action functions, and shows `emptyState` when everything is removed.",
    ],
    accessibility: [
      "Each row is a focusable group with `aria-roledescription=\"swipeable row\"`. Arrow keys open the reveal actions or the action menu, and Escape closes them.",
      "A visible \"Show actions\" button (with `aria-expanded`) opens a `role=\"menu\"` of the same actions, so swiping is never required. Reveal buttons are only tabbable while open.",
      "Under reduced motion snaps, tilt and the card scale are turned off and transitions are instant.",
    ],
    tips: [
      "Give destructive actions an `onRemove` handler (or use `SwipeList`) so your data updates. Without it the row only collapses itself visually.",
      "Keep reveal actions to two or three. Each button is a fixed 76px wide.",
    ],
    related: ["notification-feed", "hold-button", "segmented-control"],
  },

  "notification-feed": {
    overview:
      "NotificationFeed renders a list of notifications as a toast stack, an inbox list, a dynamic-island pill or timeline cards. It uses Motion springs and layout animations, measures each item's height with a ResizeObserver for the stack, and runs per-item auto-dismiss timers with a progress line. A `useNotifications` hook provides a small local store.",
    whenToUse: [
      "App-wide toasts in a corner of the screen (stack or island).",
      "An inbox panel with unread dots and Now/Earlier groups (list).",
      "An activity timeline on a dashboard (cards).",
    ],
    features: [
      "Four `variant` layouts; stack and island float at `position` with `strategy` fixed or absolute.",
      "`expand` opens the stack or island on hover, on click, or always. Timers pause while the feed is hovered or focused.",
      "Auto-dismiss after `duration` ms (0 disables), overridable per item, with a progress line in the `accent` color.",
      "Swipe items sideways to dismiss (`swipeToDismiss`), or use the close button.",
      "Items support a tone icon, `avatar`, `time`, an inline `action` button and `read` state. `useNotifications` returns `notify`, `dismiss` and `clear`.",
    ],
    accessibility: [
      "The feed is a `section` with `aria-live=\"polite\"` and an `aria-label` from `label`, so new items are announced.",
      "Each item is focusable with a label built from its title and description. Delete or Backspace dismisses it, and the close button is named \"Dismiss {title}\".",
      "Keyboard focus pauses timers, and with `expand=\"hover\"` it also expands the stack. Items hidden behind `max` are `aria-hidden` and untabbable, and reduced motion makes every transition instant.",
    ],
    tips: [
      "The feed is controlled: pass `items` and remove them in `onDismiss`. `useNotifications` handles both.",
      "Use `strategy=\"absolute\"` inside a relative container when previewing the stack or island in a card instead of the viewport.",
    ],
    related: ["swipe-row", "banner", "ai-thinking"],
  },

  "product-card": {
    overview:
      "ProductCard is a full-bleed product tile with an image carousel, a rolling price and an add-to-cart button that morphs into a quantity stepper. It uses Motion for the swipe carousel with parallax, a staggered content reveal on scroll, digit-rolling numbers and layout springs. Missing or broken images fall back to a generated gradient tinted with `tint`.",
    whenToUse: [
      "Storefront grids and featured product spots.",
      "Food, travel or experience listings with a location chip and badges.",
      "Product launches where one card needs more presence than a plain image tile.",
    ],
    features: [
      "Swipe or use the dots to browse `images`. `autoplay` advances on a timer and pauses on hover.",
      "Price digits roll on change. `prices` sets one price per image, and `compareAt` shows a struck-through original.",
      "The CTA morphs into a stepper. Quantity can be controlled (`quantity`) or uncontrolled (`defaultQuantity`) and is capped by `maxQuantity`.",
      "Optional `wishlist` heart with a burst on like, a `discount` pill, `badges` and a `location` chip.",
      "Look controls: `tint`, `accent`, `accentForeground`, `radius`, `aspect` and `imageFit`.",
    ],
    accessibility: [
      "The card is an `article` labeled with the title. The dots, wishlist (`aria-pressed`) and stepper buttons all have labels.",
      "Animated digits are `aria-hidden` with a screen-reader copy of the number, and the quantity sits in an `aria-live` region.",
      "Reduced motion stops autoplay, drag parallax and hover zoom, and makes transitions instant. Swiping is pointer-only, but the dot buttons give keyboard users the same control.",
    ],
    tips: [
      "Set `locale` and `currency` together. The defaults are `en-IN` and the rupee sign.",
      "Pick a `tint` close to your photo's dominant color. It colors the bottom scrim and the fallback art.",
    ],
    related: ["number-stepper", "like-button", "rating"],
  },

  "stamp-card": {
    overview:
      "StampCard renders a postage stamp with real perforated edges, made with a CSS radial-gradient mask that is snapped to whole holes. It uses Motion for a spring-driven 3D tilt with a pointer glare and a postmark that thumps down on click. `StampSheet` fans several stamps and spreads them on hover.",
    whenToUse: [
      "Collectible badges, achievements or travel logs.",
      "Pricing or ticket visuals with a playful paper feel.",
      "Decorative accents on invitation or postcard layouts.",
    ],
    features: [
      "Three `variant` styles: classic (cream paper), airmail (striped border) and minimal (accent tint with a duotone image).",
      "`image` artwork, with a seeded SVG illustration as the fallback when it is missing or fails to load.",
      "Click or Enter toggles a postmark with `postmarkLabel`; it can be controlled with `postmarked` or uncontrolled with `defaultPostmarked`.",
      "`tilt`, `glare` and resting `rotate` controls, plus `perforation` and `size` that snap to the hole grid.",
      "`StampSheet` takes `stamps`, `size`, `spread` and `fan`.",
    ],
    accessibility: [
      "With `clickToPostmark` on, the stamp is a `role=\"button\"` with `aria-pressed` and a label such as \"India stamp, ₹25, postmarked\". Enter and Space toggle it.",
      "The decorative artwork, glare and postmark SVG are `aria-hidden`.",
      "Reduced motion disables the tilt, lift, glare and press-down, and the postmark appears without its slam.",
    ],
    tips: [
      "Set `clickToPostmark={false}` for purely decorative stamps so they don't become buttons.",
      "Postmark ring text comes from `country`, so keep it short for a clean ring.",
    ],
    related: ["tilt-card", "envelope-reveal", "product-card"],
  },

  "not-found": {
    overview:
      "NotFound is a complete 404 section with five interactive heroes. It uses Motion springs and motion values for eyes that follow the cursor, a flashlight mask, throwable tiles and an orbiting planet, plus a requestAnimationFrame glyph scramble. Animation loops pause when the section is off screen or the tab is hidden.",
    whenToUse: [
      "The app/not-found.tsx page of a site with some personality.",
      "Error states for other status codes, by changing `code`.",
      "An empty or broken-link screen inside an app shell.",
    ],
    features: [
      "Five `variant` heroes: eyes (zeros become blinking eyes), spotlight (a flashlight reveals hidden text), drag (throwable tiles that snap back), orbit (a planet circles the zero) and scramble (digits decode, with a typed request log).",
      "`code`, `title`, `description` and `path` are configurable. The scramble log falls back to the current URL.",
      "`primaryAction` and `secondaryAction` render as links when given `href`, or as buttons. Pass `null` to hide the secondary.",
      "Theme-aware colors by default, with dark defaults for spotlight and orbit. Override with `background`, `color`, `muted` and `accent`.",
      "`digitFont` and `size` control the hero type, and `animate={false}` renders static final states.",
    ],
    accessibility: [
      "The heading reads as \"{code}: {title}\", and decorative heroes are `aria-hidden`. In the spotlight variant the duplicate lit copy is hidden and inert.",
      "Actions are real links or buttons with visible focus outlines in the accent color.",
      "Reduced motion (or `animate={false}`) renders every variant in its final state: eyes look at a fixed point, the scramble is already decoded and the light is on. The drag tiles still respond to pointer drag, but nothing moves on its own.",
    ],
    tips: [
      "Render it inside app/not-found.tsx with a full-height parent. The digits are sized in container query units, so `size` scales them.",
      "The default secondary action links to /docs. Change or hide it for your site.",
    ],
    related: ["cursor", "hero-background", "scroll-text-reveal"],
  },

  envelope: {
    overview:
      "The Envelope composer (`EnvelopeComposer`) is a contact form styled as a letter. On send, a GSAP timeline folds the letter, drops it into the pocket, closes the flap, stamps the seal and flies the envelope away. It waits for your `onSend` promise and reverses the timeline if it rejects; Motion handles smaller pieces like the shake and success state.",
    whenToUse: [
      "Contact or feedback forms on a portfolio or agency site.",
      "Newsletter replies or guestbook messages that deserve a little ceremony.",
      "Any short message form where a clear sent state matters.",
    ],
    features: [
      "Four `variant` looks: classic kraft with a wax seal, airmail with a stamp and postmark, minimal and theme-aware, and glass.",
      "`fields` toggles name, email and subject. The message is always shown, with a live counter up to `messageMaxLength`.",
      "Validation: name is required when shown, email is checked when filled, and the message is required. Invalid sends shake the letter and focus the first error.",
      "A rejected `onSend` reopens the envelope and shows `errorMessage`, or the Error's own message.",
      "`flyDirection`, `duration` (a speed multiplier), `resetAfter`, and success copy through `successTitle` and `successMessage`.",
    ],
    accessibility: [
      "Inputs have visible labels (the message label is screen-reader only), plus `aria-invalid` and `aria-describedby` for errors and the counter.",
      "A polite status region announces sending, validation errors and success, and failures use `role=\"alert\"`. Cmd/Ctrl+Enter sends, and plain Enter in a text input doesn't submit by accident.",
      "After success the form becomes inert and focus moves to \"Write another\". Reduced motion skips the fold and flight and simply fades the envelope out and back in.",
    ],
    tips: [
      "Return the fetch promise from `onSend`. The envelope stays sealed until it resolves, which doubles as a loading state.",
      "Set `sealLabel` for a fixed monogram. By default the seal shows the sender's initial.",
    ],
    related: ["envelope-reveal", "otp-input", "auth"],
  },

  "envelope-reveal": {
    overview:
      "Envelope Reveal (`Envelope`) is a sealed envelope that opens to show its children: the seal pops, the flap swings open, and the letter slides up and unfolds. It is one paused GSAP timeline built through `useGSAP` that plays forward to open and reverses to close. It shares the four looks of the envelope composer.",
    whenToUse: [
      "Digital invitations, save-the-dates or thank-you notes.",
      "Revealing a coupon, a result or a message after a click.",
      "A section that opens as it scrolls into view.",
    ],
    features: [
      "`trigger` opens on click, hover or scroll into view, or only through the `open` prop with \"manual\".",
      "Controlled (`open` and `onOpenChange`) or uncontrolled (`defaultOpen`).",
      "The open pose is measured, and just enough top padding is reserved so the layout never jumps.",
      "Four `variant` looks with `color`, `paper`, `ink`, `seal` and `sealLabel` overrides.",
      "`duration` is a speed multiplier, and closing plays back faster than opening.",
    ],
    accessibility: [
      "Click and hover triggers render a full-size button with `aria-expanded` and `aria-label` from `label`, so it works with the keyboard.",
      "While closed, the letter is `aria-hidden` and inert, so its links and text can't be reached until it opens.",
      "Reduced motion jumps straight to the open or closed pose. With `trigger=\"inView\"` or \"manual\" there is no button, so give users another way in if the content matters.",
    ],
    tips: [
      "Use `letterClassName` to style the paper, for example padding or a font for an invitation.",
      "Keep the letter content short. It has to fit the folded letter inside a 16:9 envelope.",
    ],
    related: ["envelope", "stamp-card", "confetti"],
  },

  "smooth-scroll": {
    overview:
      "SmoothScroll wraps your app in Lenis smooth scrolling driven by the GSAP ticker, so every GSAP ScrollTrigger stays in sync with the smoothed position. It renders no markup of its own and exposes the Lenis instance through `useLenis()`. It works on the window or inside a scroll container.",
    whenToUse: [
      "Sites with scroll-linked GSAP sections such as pinned carousels and step sequences.",
      "Editorial or portfolio pages that want eased wheel scrolling.",
      "Smoothing a single scroll container, like a preview pane, through `wrapper`.",
    ],
    features: [
      "`lerp` and `wheelMultiplier` tune how smooth and how far each wheel step goes.",
      "`anchors` smooth-scrolls to in-page #links. `syncTouch` smooths touch scrolling too (off by default).",
      "`enabled` turns smoothing on and off without unmounting.",
      "`useLenis()` returns the instance (or null) for programmatic `scrollTo` calls.",
      "Calls `ScrollTrigger.update` on every Lenis scroll and refreshes triggers on mount.",
    ],
    accessibility: [
      "When the user prefers reduced motion, Lenis is not created and the page keeps native scrolling. `useLenis()` returns null then.",
      "Keyboard scrolling, focus and the scrollbar are left to the browser and Lenis; the component adds no extra key handling.",
    ],
    tips: [
      "Mount it once near the root, in app/layout.tsx, around the content that uses ScrollTrigger.",
      "For a container, pass the element through `wrapper`. A `null` wrapper waits until the element mounts, while `undefined` targets the window.",
    ],
    related: ["curved-carousel", "arc-steps", "timeline-scroll"],
  },

  "hero-background": {
    overview:
      "HeroBackground is an interactive canvas backdrop for hero sections. One requestAnimationFrame loop steps a seeded scene and draws it in batched paths, one per color level, with plain canvas code and no animation library. The loop pauses off screen and in hidden tabs, and redraws its palette on theme changes.",
    whenToUse: [
      "Landing page heroes that need texture without a video or image.",
      "Section backdrops behind headings and calls to action.",
      "Empty states or sign-in screens that benefit from quiet motion.",
    ],
    features: [
      "Six `variant` scenes: dots, grid, particles (with links), waves, flow (noise-driven trails) and pixels.",
      "Marks push away, pull in or only light up under the cursor (`interaction`), within `radius` and scaled by `strength`.",
      "`clickRipple` sends a ripple out from each click or tap.",
      "`color` follows `currentColor` by default, so marks match light and dark themes. Marks near the cursor blend toward `accent`.",
      "`density`, `size`, `speed`, `opacity`, `mask`, `seed` and an `fps` cap.",
    ],
    accessibility: [
      "The canvas wrapper is `aria-hidden` and ignores pointer events. Your `children` render on top as normal content.",
      "Reduced motion draws one settled static frame and does not attach pointer listeners.",
      "Use `mask` and a low `opacity` so text on top keeps enough contrast.",
    ],
    tips: [
      "Lower `density` or `fps` on large screens or low-power devices. The particles and flow scenes cost the most per frame.",
      "Changing `color`, `accent`, `radius` or `strength` updates live. Changing `variant`, `density` or `seed` rebuilds the scene.",
    ],
    related: ["navbar", "text-reveal", "magnetic"],
  },

  "curved-carousel": {
    overview:
      "CurvedCarousel lays posters out on a 3D cylinder. In scroll mode a GSAP ScrollTrigger pins the section and scrubs a sequence where the first image starts full-bleed, shrinks into a card, and the ring turns card by card. Drag and auto modes run on the GSAP ticker with inertia; every frame sets the transforms directly.",
    whenToUse: [
      "Portfolio or case study galleries that should feel immersive.",
      "A pinned scroll story that walks through a series of images.",
      "An auto-rotating showcase of products or album covers.",
    ],
    features: [
      "Three `mode` options: scroll (pinned and scrubbed), drag (pointer drag with inertia) and auto (slow rotation that pauses on hover or focus).",
      "An `intro` that grows from full-bleed into the ring, with an optional circle morph through `introShape`.",
      "Geometry controls: `radius`, `curve` (inside or outside), `cardWidth`, `cardAspect`, `gap`, `perspective`, `tilt`, `visible` and `dim`.",
      "`snap` settles on the nearest card, and `onIndexChange` and `onIntroComplete` report progress.",
      "Missing images show a colored poster with the title, so the ring never has holes.",
    ],
    accessibility: [
      "The section has `aria-roledescription=\"carousel\"` and each card is a group labeled \"n of total\".",
      "In drag mode the section is focusable and the Left and Right arrow keys move one card. Scroll and auto modes have no keyboard controls of their own.",
      "Reduced motion renders a static, horizontally scrollable row with scroll snapping: no pin, no 3D and no motion.",
    ],
    tips: [
      "In scroll mode the pin adds `scrollLength` section heights of scrolling. Keep it near the image count so each card gets a fair share.",
      "Pass `scroller` when the carousel lives inside a scroll container. `null` waits for it to mount.",
    ],
    related: ["smooth-scroll", "horizontal-scroll", "image-arc"],
  },

  "arc-steps": {
    overview:
      "ArcSteps is a pinned \"How it works\" section where a marker travels along a half circle from step to step as you scroll. A scrubbed GSAP timeline with ScrollTrigger rotates an arm so the marker stays on the curve and draws in the passed arc. On each step change the whole section tweens to that step's solid color.",
    whenToUse: [
      "Explaining a three to five step process on a landing page.",
      "Onboarding or product tours told through scroll.",
      "Any sequence where each step deserves its own full-screen moment and color.",
    ],
    features: [
      "`position` places the arc on the bottom, top, left or right edge, and `align` sets the text alignment.",
      "Each step has a solid `color`. Text picks black or white for contrast unless `foreground` is set, and `ARC_STEPS_PALETTE` provides matching pairs.",
      "`snap` settles on the nearest step, and `scrollLength` sets the scroll distance per step.",
      "`showNumbers`, `markerSize`, `strokeWidth`, `arcSize` and `colorTransition` tune the visuals.",
      "`onStepChange` reports the active index, and a header shows a 01 / 05 counter.",
    ],
    accessibility: [
      "The section is labeled by `title`, and the content area is `aria-live=\"polite\"` so the new step is announced. The arc graphics are `aria-hidden`.",
      "Inactive steps are hidden with `visibility: hidden`, so only the current step is read.",
      "Reduced motion renders all steps as stacked, unpinned blocks in their own colors.",
    ],
    tips: [
      "Check that each step's `color` and `foreground` pair has enough contrast. The automatic choice only handles hex colors.",
      "Pass `scroller` when the section is inside a scroll container instead of the window.",
    ],
    related: ["timeline-scroll", "smooth-scroll", "sticky-cards"],
  },

  "timeline-scroll": {
    overview:
      "TimelineScroll is a horizontal timeline of years and milestones. In scroll mode a scrubbed GSAP ScrollTrigger pins the section and moves the track sideways as you scroll. In drag mode a Motion drag with inertia replaces the pin. The year nearest the center lights up in the accent and a rolling counter tracks it.",
    whenToUse: [
      "Company history or \"Our journey\" sections.",
      "Product release histories and roadmaps.",
      "Biographies or case studies told year by year.",
    ],
    features: [
      "Two `mode` options: scroll (pinned, vertical scroll moves the track) and drag (free drag or swipe with momentum, no pin).",
      "The active year scales up in `accent`, with a progress line along the baseline (`showProgress`).",
      "A rolling year counter (`showCounter`) rolls digit by digit when every year is numeric and the same length.",
      "`snap` settles on the nearest milestone in both modes.",
      "Layout controls: `itemWidth`, `yearSize`, `align` and `scrollLength`.",
    ],
    accessibility: [
      "The section is labeled by `title`, and the active milestone gets `aria-current=\"step\"`.",
      "In drag mode the stage is focusable and supports Left and Right arrows plus Home and End. Scroll mode relies on normal page scrolling.",
      "Reduced motion renders a plain vertical list with accent years and no pin or drag.",
    ],
    tips: [
      "Keep `title` and `description` short. Inactive columns are dimmed to 35% opacity and long text gets hard to read.",
      "Raise `scrollLength` to slow the horizontal travel when there are only a few items.",
    ],
    related: ["arc-steps", "horizontal-scroll", "smooth-scroll"],
  },

  auth: {
    overview:
      "AuthSection is a complete sign-in and sign-up block in three layouts. It uses Motion for height-animated fields, crossfading headings, a status-morphing submit button, a pointer-tilt card and sliding steps. Unlike most registry items it builds on shadcn/ui `Button`, `Checkbox`, `Input` and `Label`, plus tweenly's `OtpInput` for the code step.",
    whenToUse: [
      "Sign-in and sign-up pages for a SaaS app.",
      "Passwordless login with magic links (card) or one-time codes (steps).",
      "An onboarding screen that shows registration progress next to the form (split).",
    ],
    features: [
      "Three `variant` layouts: split (onboarding panel with three steps beside the form), card (centered card with a tilt and glow ring) and steps (email, then code, then profile).",
      "Switching `mode` animates fields in and out. Mode can be controlled or uncontrolled through `defaultMode`.",
      "Inline validation on blur and submit. A rejected `onSubmit` shows its message and shakes the form.",
      "Social buttons through `providers` (Google, GitHub, Apple, X) and an optional magic-link toggle in the card layout.",
      "The steps flow uses `verifyCode`, `onResendCode` and a `roles` picker. `termsHref` and `privacyHref` add a consent line on sign up.",
    ],
    accessibility: [
      "Fields have labels, `aria-invalid` and `aria-describedby` pointing to polite live messages. Form errors use `role=\"alert\"` and the first invalid field gets focus.",
      "The submit button sets `aria-busy` and announces \"Submitting\" and \"Done\". The password toggle uses `aria-pressed`, and the role picker is a radiogroup with arrow-key navigation.",
      "The steps flow shows a progressbar, moves focus into each new step, and reduced motion turns off the tilt, glows, shake and slides.",
    ],
    tips: [
      "Install the shadcn button, checkbox, input and label components and the otp-input item first. The source imports them from `@/components/ui` and the registry.",
      "Return a promise from `onSubmit` to get the loading state. Throw an Error with a readable message to show it in the form.",
    ],
    related: ["otp-input", "envelope", "elastic-switch"],
  },

  dock: {
    overview:
      "Dock is a macOS-style icon bar where items grow as the pointer approaches. Each item maps its distance from the pointer to a size and runs it through a Motion spring, so neighbors scale smoothly. Items can bounce on click and show tooltips, badges and an active dot.",
    whenToUse: [
      "App-like navigation for a portfolio or showcase page.",
      "A floating toolbar fixed to the bottom or left edge.",
      "Quick links to socials or tools in a footer.",
    ],
    features: [
      "Compose with `Dock`, `DockItem` and `DockSeparator`, in either `orientation`.",
      "`size`, `magnification` and `distance` control the growth, and `spring` tunes how it settles.",
      "`variant` sets the surface (glass, solid or minimal) and `position` can fix it to the bottom or left.",
      "Items render as links with `href` or as buttons, with `badge` counts (99+ cap) and an `active` dot.",
      "`bounce` hops an item when clicked.",
    ],
    accessibility: [
      "The dock is a `nav` with `aria-label` from `label`. Each item gets its accessible name from its `label`, and icons are `aria-hidden`.",
      "Tooltips show on keyboard focus as well as hover. Active links use `aria-current=\"page\"` and active buttons use `aria-pressed`.",
      "Reduced motion turns off magnification and the bounce. Touch input skips magnification.",
    ],
    tips: [
      "Keep `magnification` within about 1.5 to 2 times `size`. Larger values push neighbors around a lot.",
      "SVG icons passed as children are sized to fit automatically, so lucide icons need no size class.",
    ],
    related: ["navbar", "magnetic", "footer"],
  },

  "tweet-card": {
    overview:
      "TweetCard renders a static post in the style of X from props, with no embed script and no network calls. It uses Motion only for the like button's pop and burst ring. `TweetGrid` lays out many cards as a masonry wall, or as vertical marquee columns driven by a CSS keyframe animation.",
    whenToUse: [
      "Testimonials and social proof on a landing page.",
      "A wall of love built from posts you have permission to show.",
      "Quoting a single post in a blog or changelog without embedding X.",
    ],
    features: [
      "Mentions, hashtags and URLs are highlighted in `accent` and linked to x.com when the card itself isn't a link.",
      "Three `variant` densities: default, compact and minimal.",
      "Avatars fall back to initials on a color derived from the handle. Up to four `media` images, and images that fail to load are hidden.",
      "`stats` show as compact counts (1.2K), and the like button toggles with `defaultLiked` and `onLike`.",
      "`TweetGrid` takes `columns`, plus `scroll`, `speed`, `alternate`, `pauseOnHover` and `fade` for marquee columns.",
    ],
    accessibility: [
      "Each card is an `article`. With `href`, a full-card link is labeled \"Post by {name}\". The verified badge has an accessible label.",
      "The like button uses `aria-pressed`, and stat counts include screen-reader text such as \"replies\".",
      "Duplicated cards in scrolling columns are `aria-hidden` and inert. Reduced motion shows the static masonry layout instead of the marquee and skips the like burst.",
    ],
    tips: [
      "Media only shows in the default variant. Compact and minimal ignore `media`.",
      "Columns appear by container width (36rem, 48rem, 64rem), so `columns` is a maximum, not a guarantee.",
    ],
    related: ["marquee", "orbiting-circles", "footer"],
  },

  "orbiting-circles": {
    overview:
      "OrbitingCircles spins its children around a circle. It is plain CSS: a keyframe animation rotates the container while every item counter-rotates so it stays upright. `OrbitCenter` adds a disc for the middle, and several orbits can share one parent.",
    whenToUse: [
      "Integration or partner logo displays around your own logo.",
      "Hero illustrations showing an ecosystem of tools.",
      "Decorative motion in feature sections.",
    ],
    features: [
      "Items are spaced evenly around the orbit at `radius`, starting from `startAngle`.",
      "`duration`, `speed`, `reverse` and `delay` control the motion.",
      "`path` draws a faint ring along the orbit.",
      "`pauseOnHover` stops the orbit while an item is hovered.",
      "`iconSize` and `itemClassName` style the item boxes.",
    ],
    accessibility: [
      "The orbit ring is `aria-hidden`. Your items render as given, so give logos alt text or labels.",
      "Reduced motion removes the animation and leaves the items in their starting positions.",
      "Orbiting items are hard to click. Avoid putting essential links in them, or turn on `pauseOnHover`.",
    ],
    tips: [
      "Place each orbit inside a `relative` parent with a fixed size; the orbit is centered on it.",
      "Stack two orbits with different `radius` values and one set to `reverse` for depth.",
    ],
    related: ["marquee", "tweet-card", "dock"],
  },

  banner: {
    overview:
      "Banner is an announcement strip in four styles. Motion handles the slide-in, height collapse and dismiss, while the marquee and shimmer variants use CSS keyframe animations. Dismissal can persist in localStorage and is read through `useSyncExternalStore`, so a dismissed banner never flashes on load.",
    whenToUse: [
      "Launch, sale or release announcements at the top of a site.",
      "A small \"New\" pill above a hero heading.",
      "A scrolling ticker of several short updates.",
    ],
    features: [
      "Four `variant` styles: bar, pill, marquee (scrolling `messages`) and shimmer (a light sweep across the bar).",
      "Three `tone` options: accent, neutral and inverted, colored by `accent`.",
      "Optional `badge`, `icon`, `href` on the message and a `cta` link.",
      "`dismissible` adds a close button, and `storageKey` remembers the dismissal across visits and tabs.",
      "`position` can be static, sticky or fixed to the top. `duration` sets the marquee loop length.",
    ],
    accessibility: [
      "Bar variants render a `region` labeled \"Announcement\". The close button is labeled \"Dismiss announcement\".",
      "Links and the CTA show focus rings. In the marquee, repeated copies are `aria-hidden` and hovering pauses the scroll.",
      "Reduced motion replaces the slide with a fade, stops the shimmer, and shows only the first marquee message as static text.",
    ],
    tips: [
      "Use a new `storageKey` for each announcement so a past dismissal doesn't hide the next one.",
      "Keep marquee messages short. Each is repeated so one copy always spans wide screens.",
    ],
    related: ["navbar", "marquee", "shimmer-text"],
  },

  "ai-voice": {
    overview:
      "AiVoice is an audio-reactive visual for voice assistants. A single canvas requestAnimationFrame loop reads a level from the microphone (through a Web Audio AnalyserNode), from seeded speech-like noise, or from your `level` prop. It draws an orb, bars, a wave or dots that react differently for idle, listening, thinking and speaking states.",
    whenToUse: [
      "Voice mode in an AI chat or assistant UI.",
      "Showing that the microphone is live during dictation.",
      "A visual for text-to-speech playback, by feeding `level` from your audio pipeline.",
    ],
    features: [
      "Four `variant` styles: orb (layered noise blobs with a glow), bars, wave and dots.",
      "Three `source` options: mic (getUserMedia plus an AnalyserNode), simulated (seeded speech envelope) or level (controlled).",
      "`state` blends between breathing at idle, a shimmer while thinking, and audio reaction while listening or speaking.",
      "`sensitivity` and `smoothing` shape the response. `onLevel` reports the smoothed level every frame it changes.",
      "A built-in mic toggle (`showToggle`), or control the microphone with `active`.",
    ],
    accessibility: [
      "The canvas has `role=\"img\"` and an `aria-label` such as \"Voice activity: speaking\".",
      "The microphone is only requested after the toggle is pressed or `active` turns true. A polite status region reports waiting, denied (\"Allow it in your browser settings\") or unavailable, and pressing the toggle again retries.",
      "The toggle uses `aria-pressed` and a clear label. Reduced motion freezes the animation clock, so the shape no longer breathes or shimmers, but it still responds to audio level.",
    ],
    tips: [
      "The loop pauses when the canvas is off screen or the tab is hidden, and theme changes re-resolve `currentColor`.",
      "Use `source=\"level\"` when you already analyse audio elsewhere, to avoid opening the mic twice.",
    ],
    related: ["ai-recorder", "ai-thinking", "ai-input"],
  },

  "ai-recorder": {
    overview:
      "AiRecorder is a compact voice-note control: record, pause, resume, discard or save, then play back with a scrubbable waveform. It records with MediaRecorder, samples levels from a Web Audio AnalyserNode, and draws the live waveform on a canvas in a requestAnimationFrame loop. Motion morphs the pill between its idle, recording and playback layouts.",
    whenToUse: [
      "Voice input for an AI chat or support widget.",
      "Voice notes in messaging or comments.",
      "Demos and docs, with `simulate` faking the waveform and timer without the mic.",
    ],
    features: [
      "Pause and resume while recording, discard, or stop and save. Saving calls `onRecordingComplete` with the blob and duration.",
      "A live scrolling waveform and a timer. `maxDuration` stops automatically.",
      "Playback with a play/pause button and a seekable 36-bar waveform that fills in the `accent` color.",
      "`simulate` mode needs no microphone and returns an empty blob.",
      "`size` scales the whole pill.",
    ],
    accessibility: [
      "Every control is a labeled button, such as \"Start recording\" or \"Stop and save recording\". A polite status region announces start, pause, resume, save, discard and delete.",
      "The microphone is requested only on press. Denied or missing mics show an inline message with a \"Try again\" button, and streams are stopped on save, discard and unmount.",
      "The playback waveform is a `role=\"slider\"` with arrow keys, Home, End, and Space or Enter to play. Reduced motion stops the pulsing dot and the waveform scroll.",
    ],
    tips: [
      "Upload the blob in `onRecordingComplete`. Its MIME type comes from the browser's MediaRecorder, usually audio/webm.",
      "Object URLs for playback are revoked on delete and unmount, so you don't need to clean them up.",
    ],
    related: ["ai-voice", "ai-input", "ai-thinking"],
  },

  "ai-input": {
    overview:
      "AiInput is a chat prompt box with an auto-growing textarea, cycling example placeholders, file attachments, a model picker, toggle chips and suggestions. It uses Motion for a rotating conic-gradient ring while focused or streaming, layout animations for file chips, and a send button that morphs into a stop button.",
    whenToUse: [
      "The composer of an AI chat app.",
      "A search or ask box on a docs or support page.",
      "Prompt entry for generation tools that need a model choice and options like web search.",
    ],
    features: [
      "The textarea grows up to `maxRows`. Enter sends and Shift+Enter adds a new line, with IME composition respected.",
      "`placeholders` cycle every 3.2 seconds while the box is empty.",
      "Attach files through the button or drag and drop (`attachments`), with removable chips showing name and size.",
      "`models` picker, `toggles` chips and `suggestions` that fill the input. `onSubmit` receives text, files, model and active toggles.",
      "`status` shows a spinner while submitting and a stop button (`onStop`) while streaming. The text can be controlled or uncontrolled.",
    ],
    accessibility: [
      "The model picker is a listbox with `aria-expanded`, `aria-activedescendant`, arrow keys, Home, End, Enter and Escape, and focus returns to its button.",
      "Toggle chips use `aria-pressed`. The attach, remove, send and stop buttons have labels that follow `status`.",
      "The textarea's accessible name is the current placeholder text, which changes over time; pass a stable label if that is a concern. Reduced motion stops the ring rotation and placeholder blur.",
    ],
    tips: [
      "Drive `status` from your request: \"submitting\" until the first token, then \"streaming\" until done.",
      "Pass `models={[]}` to hide the picker. Files are kept in component state until submit.",
    ],
    related: ["ai-thinking", "ai-recorder", "expand-input"],
  },

  "ai-thinking": {
    overview:
      "AiThinking is a set of loading indicators for AI responses: a shimmering label, bouncing dots, a pulsing orb, a collapsible reasoning-steps trace and a streaming text reveal. It uses Motion keyframes and springs. Steps advance on a timer or follow `activeStep`, and the stream reveals text in uneven bursts like a real model.",
    whenToUse: [
      "Waiting for a model response in a chat UI.",
      "Showing agent or tool steps as they run, with \"Thought for Ns\" afterwards.",
      "Demoing streamed answers without a backend.",
    ],
    features: [
      "Five `variant` styles: shimmer, dots, orb, steps and stream.",
      "Steps show a spinner for the active step and a drawn check for finished ones, then collapse into \"Thought for Ns\".",
      "Steps can be controlled with `activeStep` or advance automatically with `auto` and `duration`.",
      "Stream reveals `text` at `speed` characters per second, fading in word by word with a blinking caret.",
      "`size`, `accent` and `onComplete`, which fires when the stream finishes or every step is done.",
    ],
    accessibility: [
      "Shimmer, dots and orb are `role=\"status\"` with `aria-live=\"polite\"`. Without a `label`, dots and orb announce a screen-reader-only \"Thinking\".",
      "The steps header is a button with `aria-expanded` and `aria-controls`, and its label is a live region. The stream paragraph is `aria-live` with `aria-busy` until it finishes.",
      "Reduced motion stops the bounce, scale and shimmer sweep (the dots still pulse in opacity), shows stream text all at once and draws checks instantly. The step spinner still rotates.",
    ],
    tips: [
      "For real agents, drive `activeStep` from your events. Set it to `steps.length` to mark everything done.",
      "Keep `label` short for the shimmer. Each glyph animates on its own.",
    ],
    related: ["ai-input", "ai-voice", "shimmer-text"],
  },
}
