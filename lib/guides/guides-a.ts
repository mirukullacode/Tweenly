import type { ComponentGuide } from "./types"

export const guidesA: Record<string, ComponentGuide> = {
  "fade-in": {
    overview:
      "A wrapper that fades its children in as they scroll into view. It is a single motion `motion.div` using `whileInView`, so it can slide from a direction, scale up or un-blur while the opacity rises. Easing presets map to cubic-bezier curves, and the spring preset uses a motion spring.",
    whenToUse: [
      "Section headings and paragraphs that should appear as the reader scrolls to them.",
      "A single card, image or call-to-action block that needs a light entrance.",
      "Wrapping any element when you want one consistent reveal without writing variants yourself.",
    ],
    features: [
      "Five travel directions via `direction`: up, down, left, right or none, with `distance` in px.",
      "Optional starting `scale` and `blur` for a zoom or focus-in effect.",
      "Easing presets through `ease`: smooth, snappy, linear or a physics spring.",
      "Viewport control with `once` and `amount` (how much must be visible before it plays).",
      "Timing control through `duration` and `delay`.",
    ],
    accessibility: [
      "Uses the library's `useReducedMotion` hook. With reduced motion on, movement, scale and blur are dropped and only a 0.2s opacity fade remains.",
      "Adds no roles or ARIA attributes. Your children keep their own semantics, so wrap real headings and landmarks rather than styled divs.",
    ],
    tips: [
      "Keep `blur` small or at 0 on large blocks. Animating `filter` is more expensive than transform and opacity.",
      "For lists, use Stagger instead of many FadeIn wrappers with hand-tuned `delay` values.",
    ],
    related: ["stagger", "text-reveal", "image-reveal"],
  },

  "text-reveal": {
    overview:
      "Animates a string word by word or character by character when it enters the viewport. Each piece is a motion span driven by parent variants with `staggerChildren`, rising from an offset while it un-blurs and fades in.",
    whenToUse: [
      "Hero headlines that should land word by word.",
      "Short taglines or section titles where a character-level reveal adds emphasis.",
      "Pull quotes that should draw the eye as they scroll into view.",
    ],
    features: [
      "Split by word or character with `split`.",
      "Pieces travel up, down or not at all via `direction`, over `distance` px.",
      "Tunable `stagger`, `duration`, `delay` and starting `blur`.",
      "Renders as `p`, `h1`, `h2`, `h3` or `span` through `as`, so headings stay semantic.",
      "Plays once by default, or every time it re-enters view with `once={false}`.",
    ],
    accessibility: [
      "The full text is set as `aria-label` on the outer element and each word wrapper is `aria-hidden`, so screen readers hear the sentence once instead of letter by letter.",
      "Respects reduced motion through motion's `useReducedMotion`: no offset, no blur, no stagger, and a 0.2s fade.",
    ],
    tips: [
      "Character mode creates one animated span per letter. Keep it for short strings and use word mode for paragraphs.",
      "Words are wrapped in `whitespace-nowrap`, so a character reveal never breaks a word across lines.",
    ],
    related: ["scroll-text-reveal", "word-rotate", "fade-in"],
  },

  typewriter: {
    overview:
      "Types a list of words one character at a time, pauses, deletes them and moves to the next. It is plain React state stepped by `setTimeout`, with a CSS keyframe for the blinking cursor. Motion is used only to read the reduced-motion preference.",
    whenToUse: [
      "Hero lines like \"Build for ___\" that cycle through audiences or use cases.",
      "Terminal or chat-style UI where text should appear as if typed.",
      "Placeholder-style hints that show several example queries in turn.",
    ],
    features: [
      "Separate `typeSpeed` and `deleteSpeed` in milliseconds per character.",
      "Configurable `pause` after each word is fully typed.",
      "Loops forever by default; with `loop={false}` it stops on the last word.",
      "Optional blinking cursor via `cursor`, with a custom `cursorChar` and `cursorClassName`.",
    ],
    accessibility: [
      "The wrapper has `aria-label` set to all words joined by commas, and the typed text and cursor are `aria-hidden`, so screen readers do not hear partial words.",
      "With reduced motion on, typing stops and the first word is shown in full. The cursor's CSS blink still runs, so set `cursor={false}` if you want no motion at all.",
    ],
    tips: [
      "Give the parent a fixed min-width or place the component at the end of a line so changing word lengths do not reflow surrounding text.",
      "Keep `words` stable (memoize or define it outside the component) so the effect does not restart on every render.",
    ],
    related: ["word-rotate", "shimmer-text", "text-reveal"],
  },

  "word-rotate": {
    overview:
      "Cycles through a list of words in place on a timer. Each word is a keyed motion span inside `AnimatePresence` with `mode=\"popLayout\"`, so the outgoing word exits while the next one enters.",
    whenToUse: [
      "A rotating keyword inside a headline, such as \"Ship faster / safer / smarter\".",
      "Compact spaces where a typewriter effect would take too long to read.",
      "Listing supported platforms or roles without adding more lines.",
    ],
    features: [
      "Four transition styles via `effect`: slide, fade, blur and a 3D flip.",
      "Control how long each word stays with `interval` (ms) and the transition length with `duration` (s).",
      "Clips overflow so slide and flip transitions stay inside the line box.",
      "Does nothing when given fewer than two words.",
    ],
    accessibility: [
      "With reduced motion on (motion's `useReducedMotion`), every effect falls back to a plain fade. Words still rotate on the interval.",
      "No `aria-live` region is set, so screen readers read only the word present when they reach it. If every option matters, put the full list in visually hidden text nearby.",
    ],
    tips: [
      "Word widths differ, so surrounding text can shift. Give the component a `className` with a min-width or right-align it if that matters.",
      "Avoid very short `interval` values; readers need time to take in each word.",
    ],
    related: ["typewriter", "text-reveal", "shimmer-text"],
  },

  "shimmer-text": {
    overview:
      "Text with a highlight band that sweeps across it on a loop. It layers two background gradients clipped to the text and uses motion to animate `backgroundPosition` linearly, with a pause between sweeps.",
    whenToUse: [
      "Loading or \"thinking\" labels in AI and async UI.",
      "A subtle accent on a badge or announcement line.",
      "Skeleton-style text that should look alive while content loads.",
    ],
    features: [
      "Sweep speed via `duration` and pause between sweeps via `repeatDelay`.",
      "Band width in px via `spread`.",
      "Custom `baseColor` and `shimmerColor`; both default to theme tokens so light and dark mode work.",
    ],
    accessibility: [
      "The text stays real text in a span, so screen readers read it normally.",
      "With reduced motion on (motion's `useReducedMotion`), the sweep does not run and the text stays static.",
    ],
    tips: [
      "Children must be a string. Wrap it in your own heading or label element for semantics.",
      "Make sure `baseColor` alone has enough contrast against the background, because that is what most of the text shows most of the time.",
    ],
    related: ["typewriter", "loader", "word-rotate"],
  },

  "number-ticker": {
    overview:
      "Counts from a start value to a target value when it scrolls into view. It uses motion's `animate()` on a plain number and writes each frame straight to the element's `textContent`, so React does not re-render per frame. Formatting goes through `toLocaleString`.",
    whenToUse: [
      "Stats sections such as user counts, revenue or uptime.",
      "Pricing or KPI cards where the final number should feel earned.",
      "Dashboards that reveal totals as the user scrolls down.",
    ],
    features: [
      "Count from `from` to `value` over `duration`, with an optional `delay`.",
      "Fixed decimal places via `decimals`.",
      "`prefix` and `suffix` for currency signs, percent and units.",
      "Locale thousands grouping, switchable with `separator`.",
      "Starts when half the element is visible; replays on re-entry when `once={false}`.",
    ],
    accessibility: [
      "With reduced motion on (motion's `useReducedMotion`), the final value is shown immediately with no counting.",
      "No ARIA attributes are set. Screen readers may read an in-between value, so add an `aria-label` with the final figure to the parent, or nearby text, if that matters.",
    ],
    tips: [
      "The element uses `tabular-nums` so digits do not jitter while counting. Keep a font that supports tabular figures.",
      "The server render uses `toFixed` without grouping, and the client switches to the locale format. With a large `from`, expect a brief format change after hydration.",
    ],
    related: ["chart-kpi", "fade-in", "stagger"],
  },

  "fill-button": {
    overview:
      "A pill button that fills with an inverted copy of its label on hover or focus. GSAP tweens the `clip-path` inset of an overlay span, so the fill sweeps in from one edge and back out.",
    whenToUse: [
      "Primary or secondary calls to action in minimal, outlined layouts.",
      "Navigation or footer links styled as buttons that need a clear hover state.",
      "Anywhere you want a hover effect that also shows on keyboard focus.",
    ],
    features: [
      "Four sweep directions via `direction`: up, down, left or right.",
      "Any GSAP ease string through `ease`, for example `elastic.out(1, 0.6)`, plus `duration`.",
      "Accepts all native button props; `type` defaults to `button`.",
      "Your own `onMouseEnter`, `onMouseLeave`, `onFocus` and `onBlur` handlers still run.",
    ],
    accessibility: [
      "It is a real `button`, so Enter and Space work. The fill also plays on focus and has a visible `focus-visible` outline.",
      "The inverted overlay copy is `aria-hidden`, so the label is announced once.",
      "Uses the library's `useReducedMotion` hook: with reduced motion on the fill switches instantly instead of sweeping.",
    ],
    tips: [
      "Colors come from `border-foreground`, `bg-foreground` and `text-background`, so it follows your theme. Override with `className` for a brand color.",
      "Running tweens are killed on unmount and each new sweep overwrites the last, so fast hover in and out stays smooth.",
    ],
    related: ["magnetic", "shine-button", "ripple-button"],
  },

  magnetic: {
    overview:
      "A wrapper that pulls its child toward the cursor when the pointer is nearby. It tracks pointer offset from the element's center and feeds it into motion springs on `x` and `y`, then springs back to rest on leave.",
    whenToUse: [
      "Icon buttons or a hero call to action that should feel responsive to the cursor.",
      "Social links in a footer or nav.",
      "Playful UI elements on portfolio or landing pages.",
    ],
    features: [
      "How far the child follows via `strength` (0 to 1).",
      "An invisible hit area around the child via `range`, so the pull starts before the cursor touches it.",
      "Spring feel through `stiffness` and `damping`.",
      "Wraps any element without changing its markup.",
    ],
    accessibility: [
      "Pointer only. Keyboard focus does not move the element, which is fine since the effect is decorative. Make sure the child has its own focus style.",
      "With reduced motion on (motion's `useReducedMotion`), pointer moves are ignored and the child stays still.",
    ],
    tips: [
      "The `range` padding is offset by a negative margin, so layout does not change. Very large values can overlap neighbors and catch their pointer events.",
      "Keep `strength` low (0.2 to 0.4) on large elements, since the offset scales with distance from the center.",
    ],
    related: ["fill-button", "cursor", "tilt-card"],
  },

  "tilt-card": {
    overview:
      "A card that tilts in 3D toward the cursor, with an optional glare that follows the pointer. Pointer position is normalized and mapped through motion `useTransform` to `rotateX` and `rotateY`, then smoothed with springs. The glare is a radial gradient built with `useMotionTemplate`.",
    whenToUse: [
      "Product, pricing or feature cards on a landing page.",
      "Portfolio thumbnails or collectible-style cards.",
      "Any hero visual that should react to the cursor without a full 3D scene.",
    ],
    features: [
      "Maximum rotation via `maxTilt` and depth via `perspective`.",
      "Hover scale via `scale`.",
      "Optional cursor-following glare with `glare` and `glareOpacity`.",
      "Invert the tilt with `reverse`.",
    ],
    accessibility: [
      "Pointer only, with no keyboard equivalent. The effect is decorative, so put any interactive content (links, buttons) inside the card where it stays reachable.",
      "With reduced motion on (motion's `useReducedMotion`), pointer moves are ignored and the card stays flat.",
      "The glare layer is `aria-hidden` and has `pointer-events: none`.",
    ],
    tips: [
      "Lower `perspective` makes the tilt more dramatic; raise it for a subtler effect on large cards.",
      "The glare is white, so it reads best on dark or saturated cards. Lower `glareOpacity` on light backgrounds.",
    ],
    related: ["spotlight-card", "magnetic", "product-card"],
  },

  "spotlight-card": {
    overview:
      "A card with a soft radial light that follows the cursor, plus an optional lit border. Pointer coordinates go into motion values, `useMotionTemplate` builds the gradients, and a spring fades the light in and out on enter and leave. The border glow is masked down to a 1px ring.",
    whenToUse: [
      "Feature grids where each card should respond on hover.",
      "Dark-themed dashboards or pricing tables.",
      "Bento layouts that need a subtle interactive surface.",
    ],
    features: [
      "Spotlight radius via `size` and color via `color`.",
      "Border highlight toggled with `border`, colored with `borderColor`.",
      "Defaults use `color-mix` with theme tokens, so it works in light and dark mode.",
      "Accepts all div props; your `onPointerMove`, `onPointerEnter` and `onPointerLeave` handlers still run.",
    ],
    accessibility: [
      "Both light layers are `aria-hidden` and ignore pointer events, so content inside stays readable and clickable.",
      "There is no reduced-motion check. The light only follows the pointer and fades, which most users find acceptable, but you can skip the component when `prefers-reduced-motion` is set.",
      "Pointer only. If the card is a link, add your own focus style, since focus does not light it.",
    ],
    tips: [
      "Raise the opacity in `color` for a stronger spotlight on dark cards.",
      "The card sets `bg-card`, `border` and `rounded-2xl`. Override with `className` instead of nesting another card inside.",
    ],
    related: ["tilt-card", "cursor", "product-card"],
  },

  cursor: {
    overview:
      "A custom cursor rendered in a portal over the page, with seven variants from a simple ring to sunflower and rose shapes. Position runs through motion springs, and the sparkle and flower variants drop particles drawn on a canvas with `requestAnimationFrame`. It hides the native cursor inside its scope and reacts when hovering interactive elements.",
    whenToUse: [
      "Portfolio, agency or campaign sites where the cursor is part of the brand.",
      "A contained playground or hero area via `container`, leaving the rest of the page normal.",
      "Creative pages that want a playful trail effect.",
    ],
    features: [
      "Variants via `variant`: ring, dot, blend, crosshair (with live coordinates), sparkle, sunflower and rose.",
      "Hover state on links, buttons, inputs and `[data-cursor-hover]`, customizable with `hoverSelector`.",
      "Particle trail for sparkle, sunflower and rose, toggled with `trail`.",
      "Follow feel via `stiffness` and `damping`, size via `size`, and `color`.",
      "Shrinks while the pointer is pressed.",
    ],
    accessibility: [
      "Renders only for fine pointers (mouse or pen), so touch users keep the system behavior.",
      "The overlay is `aria-hidden` and ignores pointer events, so it never blocks clicks or focus.",
      "With reduced motion on (motion's `useReducedMotion`), the follow spring becomes nearly rigid and particles are disabled. The sparkle still rotates, so pick another variant if that matters.",
    ],
    tips: [
      "The native cursor is hidden with `cursor: none`. Users who rely on large or high-contrast system cursors lose them, so consider a `container` instead of the whole page.",
      "Particles are spaced by travel distance and the canvas loop stops when no particles are left, so idle cost is low.",
    ],
    related: ["magnetic", "spotlight-card", "confetti"],
  },

  loader: {
    overview:
      "A small loading indicator with three styles: bouncing dots, pulsing bars and an orbit. Each piece is a motion element with an infinite keyframe animation and a per-item delay, sized relative to `size`.",
    whenToUse: [
      "Inline loading states inside buttons or cards.",
      "Full-panel placeholders while data fetches.",
      "AI or chat UI waiting for a response.",
    ],
    features: [
      "Three styles via `variant`: dots, bars or orbit.",
      "Scales from one `size` value; `count` sets the number of dots or bars.",
      "Uses `currentColor` by default, or any CSS `color`.",
      "Cycle speed via `speed`.",
    ],
    accessibility: [
      "Has `role=\"status\"` and an `aria-label` (`label`, default \"Loading\").",
      "With reduced motion on (motion's `useReducedMotion`), each animation plays once instead of looping.",
    ],
    tips: [
      "Set a meaningful `label`, such as \"Loading results\", when several loaders can appear on one page.",
      "Since color defaults to `currentColor`, a loader inside a button automatically matches the button text.",
    ],
    related: ["download-button", "shimmer-text", "preloader"],
  },

  "download-button": {
    overview:
      "A button that moves from idle to a progress state and then to a done state with an animated check. Motion animates a progress motion value and swaps labels with `AnimatePresence`. It can simulate progress, wait for your promise, or follow a controlled `progress` prop.",
    whenToUse: [
      "Downloading a file from a known URL with clear feedback.",
      "Export or generate actions where your own async function does the work.",
      "Uploads or jobs that report real progress you can pass in.",
    ],
    features: [
      "Triggers a download of `href` (with optional `fileName`) once the bar completes.",
      "`onDownload` can return a promise; the simulated bar eases to 90% and waits for it.",
      "Controlled mode: pass `progress` (0 to 100) and the bar follows it, finishing at 100.",
      "Shows a live percentage (`showPercent`) and returns to idle after `resetAfter` ms.",
      "Custom `label`, `doneLabel` and `fillColor`.",
    ],
    accessibility: [
      "It is a native `button` with `aria-live=\"polite\"`, so label changes such as \"Downloaded\" are announced.",
      "With reduced motion on (motion's `useReducedMotion`), the simulated progress jumps to completion. The label swap and spinner still animate.",
    ],
    tips: [
      "In controlled mode the button still needs a click to enter the loading state; drive `progress` after that.",
      "A rejected `onDownload` promise is swallowed and the button still shows done. Handle errors in your own function if you need a failure state.",
    ],
    related: ["loader", "hold-button", "fill-button"],
  },

  "ascii-image": {
    overview:
      "Renders an image as ASCII characters on a canvas, with a glittering pixel trail that follows the cursor. The image is sampled into one pixel per cell, converted to brightness, and mapped to a character ramp. Hover energy decays each frame in a `requestAnimationFrame` loop that stops when idle. No animation library is used for drawing; motion only provides the reduced-motion check.",
    whenToUse: [
      "Hero visuals on developer, terminal or retro-styled sites.",
      "Team or product portraits that should feel interactive.",
      "Section breaks where an image should read as texture rather than a photo.",
    ],
    features: [
      "Character density via `cellSize` and a custom ramp via `characters`.",
      "Hover trail with `radius`, `decay` and `glitter`, using `sparkColor` for sparks.",
      "Brightness `contrast` and `invert` for dark or light source images.",
      "Re-samples on resize through a ResizeObserver.",
      "Shows a clear message if the image fails or cannot be read due to CORS.",
    ],
    accessibility: [
      "The wrapper has `role=\"img\"` and `aria-label` set from `alt`, so describe the picture there.",
      "With reduced motion on (motion's `useReducedMotion`), random sparkles are off. The hover trail still draws, since it follows the pointer directly.",
    ],
    tips: [
      "`color` and `sparkColor` go straight to canvas, so use real color values, not CSS variables.",
      "Remote images must be served with CORS headers. Same-origin images in your public folder always work.",
      "Smaller `cellSize` means more cells to draw per frame. Keep it at 8 or above on large canvases.",
    ],
    related: ["hover-media", "image-reveal", "hero-background"],
  },

  "hover-media": {
    overview:
      "An inline keyword that shows a floating image or video preview next to the cursor while hovered. The preview is portaled to the body, follows the pointer with motion springs, and tilts with horizontal cursor velocity via `useVelocity`. `AnimatePresence` handles the scale and blur in and out.",
    whenToUse: [
      "Editorial or portfolio copy where project names reveal a thumbnail.",
      "About pages that link people or places to photos.",
      "Changelogs or blog posts that preview a short clip on hover.",
    ],
    features: [
      "Images or videos; `type` is detected from the file extension when omitted.",
      "Preview size via `width` and `aspectRatio`.",
      "Velocity-based tilt via `tilt` and cursor distance via `offset`.",
      "Follow feel through `stiffness` and `damping`.",
      "Videos autoplay muted, looped and inline.",
    ],
    accessibility: [
      "The preview is `aria-hidden` and only opens on pointer hover. Keyboard and touch users never see it, so do not put essential content only in the preview.",
      "With reduced motion on (motion's `useReducedMotion`), velocity tilt is removed. The follow spring and the open animation still run.",
      "The trigger is a plain span. If it should be focusable or link somewhere, wrap it in an `a` yourself.",
    ],
    tips: [
      "The portal is created only after the first hover, so nothing extra renders on the server.",
      "Use short, small video files; each hover mounts a fresh video element.",
    ],
    related: ["cursor", "image-fan", "ascii-image"],
  },

  "image-fan": {
    overview:
      "A stack of images that fans out when scrolled into view. The first card rises from below, then the rest slide out from under it into an arced, tilted row. It is a GSAP timeline started by ScrollTrigger, with spacing recalculated so the fan fits the container.",
    whenToUse: [
      "Showcasing a small set of photos or product shots in a hero or section intro.",
      "Portfolio pages that want a single, memorable reveal.",
      "Team or event galleries with five to nine images.",
    ],
    features: [
      "Spread to the right, left or from the center via `direction`.",
      "Shape control with `overlap`, `rotate` and `arc`.",
      "Entrance control with `rise`, `blur`, `stagger` and a global `speed` multiplier.",
      "Optional hover lift on each card with `hoverLift`.",
      "Replays in reverse on scroll back when `once={false}`; `scroller` supports custom scroll containers.",
    ],
    accessibility: [
      "Uses the library's `useReducedMotion` hook. With reduced motion on, cards are placed in their final fan positions with no animation.",
      "Each image uses its `alt`. Missing images are hidden and a tinted placeholder shows instead.",
      "There is no keyboard interaction. Hover lift is pointer only and purely decorative.",
    ],
    tips: [
      "Spacing shrinks automatically on narrow containers, but very long lists still overlap heavily. Keep it under about ten images.",
      "`cardWidth` defaults to a container-query unit, so the fan scales with its parent, not the viewport.",
    ],
    related: ["image-arc", "image-reveal", "expand-gallery"],
  },

  "image-arc": {
    overview:
      "Images placed around a large wheel, with only the top arc visible, spinning slowly or turning with scroll. Card positions are computed from the container width, and GSAP rotates the wheel either with an infinite tween or a scrubbed ScrollTrigger. Images repeat to fill the circle so the loop has no gap.",
    whenToUse: [
      "Hero or footer bands with a gallery in constant gentle motion.",
      "Logo or product walls that should feel less static than a marquee.",
      "Scroll-driven storytelling sections where the wheel turns as you read.",
    ],
    features: [
      "Two modes via `mode`: auto spin (`duration` per revolution) or scroll-linked (`scrollRotation` degrees).",
      "Spin `direction`: clockwise or counterclockwise.",
      "Geometry via `radius`, `itemSize`, `aspectRatio` and `gap`.",
      "Pauses smoothly when a card is hovered (`pauseOnHover`, auto mode only).",
      "Optional bottom `fade` mask into the background.",
    ],
    accessibility: [
      "Uses the library's `useReducedMotion` hook. With reduced motion on, the wheel does not rotate in either mode.",
      "Only the first copy of each image gets its `alt`; repeated copies use an empty `alt`, so screen readers do not hear duplicates.",
      "There is no keyboard control to pause the auto spin. It is slow by default, but for long pages consider `mode=\"scroll\"` or a pause button.",
    ],
    tips: [
      "Lower `duration` spins faster. Values well below the default can feel busy.",
      "Pause is triggered by hovering a card, not empty space in the section.",
    ],
    related: ["image-fan", "marquee", "orbiting-circles"],
  },

  "scroll-text-reveal": {
    overview:
      "A paragraph whose words or characters brighten from dim to full as you scroll. GSAP ScrollTrigger pins the section and scrubs a staggered timeline across every piece, optionally clearing blur and a vertical offset at the same time.",
    whenToUse: [
      "Manifesto or mission statements on a landing page.",
      "Long-form storytelling where one key paragraph deserves focus.",
      "Product pages that walk through a single strong claim.",
    ],
    features: [
      "Split by word or character with `split`.",
      "Starting look via `dim` (opacity), `blur` and `lift`.",
      "Pin the section while revealing (`pin`), with length set by `scrollLength`.",
      "Scroll smoothing via `scrub`; `align` for left or centered text.",
      "Style the text with `textClassName` and set the section `height`.",
    ],
    accessibility: [
      "The paragraph has `aria-label` with the full text and all word spans are `aria-hidden`, so it is read as one sentence.",
      "Uses the library's `useReducedMotion` hook. With reduced motion on, no pinning or animation is set up and the text shows at full opacity.",
    ],
    tips: [
      "With `pin={false}` the reveal starts when the section reaches 80% of the viewport, which suits shorter passages.",
      "Character mode creates many tweened spans. Prefer word mode for paragraphs longer than a sentence or two.",
    ],
    related: ["text-reveal", "smooth-scroll", "sticky-cards"],
  },

  "horizontal-scroll": {
    overview:
      "A pinned section that turns vertical scrolling into horizontal movement through a row of images. GSAP ScrollTrigger pins the section and scrubs the track's `x`, while nested triggers using `containerAnimation` zoom each image out as it crosses the viewport.",
    whenToUse: [
      "Case study or project galleries that read left to right.",
      "Product feature tours with captioned images.",
      "Timelines or step sequences shown as a filmstrip.",
    ],
    features: [
      "Sizing via `itemWidth`, `aspectRatio` and `gap`.",
      "Travel speed via `speed` and smoothing via `scrub`.",
      "Optional per-image zoom with `parallax`.",
      "Optional numbered captions from each item's `caption`.",
      "Works inside custom scroll containers via `scroller`.",
    ],
    accessibility: [
      "Uses the library's `useReducedMotion` hook. With reduced motion on, nothing is pinned and the row becomes a normal horizontally scrollable strip.",
      "Images use `figure` and `figcaption`, and each `alt` is passed through.",
      "In the animated mode the track only moves with page scroll. Keyboard users can reach it with arrow or Page Down keys, but there are no focusable items inside unless you add them.",
    ],
    tips: [
      "Raise `speed` to make the horizontal travel take more scroll distance and feel slower.",
      "Turn off `parallax` on long lists to cut the number of ScrollTriggers.",
    ],
    related: ["sticky-cards", "expand-gallery", "smooth-scroll"],
  },

  "image-reveal": {
    overview:
      "A grid of images that slide, rotate or scale into place as they scroll into view. Each tile gets its own GSAP tween with a ScrollTrigger, either scrubbed to the scrollbar or played once on enter.",
    whenToUse: [
      "Editorial photo grids on blog posts or case studies.",
      "Feature sections that alternate images from left and right.",
      "Mood boards or galleries where tiles span multiple columns.",
    ],
    features: [
      "Per-image entry direction via each item's `from`: left, right, top, bottom or scale. Defaults alternate left and right.",
      "Grid layout via `columns`, `gap` and per-item `span`.",
      "Entrance strength via `distance`, `rotate` and `blur`.",
      "Scroll-linked with `scrub`, or time-based with `scrub={false}` and `duration`.",
    ],
    accessibility: [
      "Uses the library's `useReducedMotion` hook. With reduced motion on, no tweens are created and images show in place.",
      "Each image uses its `alt`. The grid adds no extra roles.",
    ],
    tips: [
      "The grid uses `overflow-x: clip`, so large `distance` values do not cause horizontal page scroll.",
      "Tiles have a `bg-muted` background, which acts as a placeholder while images load.",
    ],
    related: ["fade-in", "image-fan", "horizontal-scroll"],
  },

  "expand-gallery": {
    overview:
      "A pinned row of thumbnails where one image at a time grows large as you scroll, then shrinks as the next takes over. GSAP ScrollTrigger pins the section and scrubs a timeline that tweens each item's width and height, with an optional counter.",
    whenToUse: [
      "Portfolio or lookbook sections that step through images one by one.",
      "Product galleries where each shot deserves a moment at full size.",
      "Process or before-and-after sequences.",
    ],
    features: [
      "Thumbnail size via `smallWidth` and `smallAspect`; expanded size via `largeWidth` and `largeHeight`.",
      "Scroll length per image via `scrollPerImage`, smoothing via `scrub`.",
      "Row alignment with `align` and spacing with `gap`.",
      "An \"03 / 06\" style `counter` synced to scroll progress.",
      "Missing images are hidden and a tinted placeholder shows instead.",
    ],
    accessibility: [
      "Uses the library's `useReducedMotion` hook. With reduced motion on, the first image is shown large and the rest stay small, with no pinning.",
      "Each image uses its `alt`. The counter is plain text with no live region, which avoids noisy announcements while scrolling.",
    ],
    tips: [
      "This component animates width and height, which triggers layout. Keep image counts modest and avoid heavy content inside the section.",
      "Each image adds `scrollPerImage` section heights of pinned scrolling, so long lists make a long section.",
    ],
    related: ["scroll-focus", "horizontal-scroll", "image-fan"],
  },

  "scroll-focus": {
    overview:
      "A pinned column of images where the one in focus grows and centers itself as you scroll, with a synced title list beside it. GSAP ScrollTrigger scrubs a single progress value, and a layout function sizes each image by its distance from that value using a smoothstep curve.",
    whenToUse: [
      "Project indexes where titles and images should move together.",
      "Service or chapter lists that need a visual for each entry.",
      "Editorial sections that step through a numbered sequence.",
    ],
    features: [
      "Focused and resting sizes via `largeWidth` and `smallWidth`, with `aspectRatio` and `gap`.",
      "Synced title list on the left or right via `side`, styled with `titleClassName`.",
      "Optional \"(1)\" index labels with `showIndex`.",
      "Scroll length via `scrollPerItem` and smoothing via `scrub`.",
      "Re-lays out on resize through a ResizeObserver.",
    ],
    accessibility: [
      "The active title gets `aria-current=\"true\"`, so the current item is exposed to assistive tech.",
      "Uses the library's `useReducedMotion` hook. With reduced motion on, the layout is drawn once with the first item in focus and nothing is pinned.",
      "Titles are a plain list with no links or key handlers. If they should jump to items, add buttons and scroll logic yourself.",
    ],
    tips: [
      "Layout writes width, height and transform on every scroll update. It is fine for a handful of items but avoid dozens.",
      "A wide `aspectRatio` like the default `2 / 1` keeps the column short enough to center the focus item.",
    ],
    related: ["expand-gallery", "table-of-contents", "sticky-cards"],
  },

  stagger: {
    overview:
      "A container that animates its children in one after another when it enters view. Each child is wrapped in a motion div, and the parent's variants use `staggerChildren` and `delayChildren` to sequence them.",
    whenToUse: [
      "Feature grids and card lists that should cascade in.",
      "Nav or footer link groups revealed on scroll.",
      "Bullet lists or step-by-step instructions.",
    ],
    features: [
      "Entry direction via `direction`: up, down, left, right or scale.",
      "Timing via `stagger`, `duration` and `delay`, with travel `distance`.",
      "Classes for each wrapper via `itemClassName`, useful for grid cells.",
      "Plays once by default; replays on re-entry with `once={false}`.",
    ],
    accessibility: [
      "With reduced motion on (motion's `useReducedMotion`), movement and stagger are removed and children fade in over 0.2s.",
      "Each child is wrapped in a `div`. Inside a `ul`, that breaks list semantics, so put the list markup inside the children or use `className` on a wrapping element.",
    ],
    tips: [
      "Put grid or flex classes on `className`; the wrapper divs become the grid items.",
      "Keep `stagger` short for long lists so the last item does not arrive too late.",
    ],
    related: ["fade-in", "text-reveal", "marquee"],
  },

  marquee: {
    overview:
      "An endlessly scrolling row or column of content. It repeats the children several times and moves each copy with a pure CSS keyframe on `transform`, so there is no JavaScript per frame. Motion is used only to read the reduced-motion preference.",
    whenToUse: [
      "Logo walls and \"trusted by\" strips.",
      "Testimonial or tweet tickers.",
      "Vertical feeds in a sidebar or hero column.",
    ],
    features: [
      "Horizontal or `vertical` scrolling, with `reverse` for the opposite direction.",
      "Loop length via `duration` and spacing via `gap`.",
      "Pauses on hover with `pauseOnHover`.",
      "Edge fade mask via `fade`.",
      "Copy count via `repeat`, for short content that would otherwise leave gaps.",
    ],
    accessibility: [
      "Every copy after the first is `aria-hidden`, so screen readers read the content once.",
      "With reduced motion on (motion's `useReducedMotion`), the animation is removed and the content sits still.",
      "Hover pause does not apply to keyboard focus. If items contain links, consider pausing on `focus-within` too.",
    ],
    tips: [
      "If you see a gap at the end of the loop, raise `repeat` until the content is wider than the container.",
      "Pair two marquees with opposite `reverse` values for a layered logo band.",
    ],
    related: ["image-arc", "tweet-card", "stagger"],
  },

  "sticky-cards": {
    overview:
      "A pinned stack of large colored cards where each front card lifts away as you scroll, and the cards behind step forward. GSAP ScrollTrigger pins the section and scrubs a timeline that tweens each card's `yPercent`, `scale`, `rotationX` and opacity.",
    whenToUse: [
      "Services, features or process steps told one card at a time.",
      "Case study highlights on an agency or portfolio site.",
      "Pricing tiers or values sections with strong color blocks.",
    ],
    features: [
      "Built-in five-color palette, or per-card `color` and `textColor`.",
      "Each card shows a `tag`, a `title` and an optional `image` with a tinted fallback if it is missing or fails.",
      "Stack shape via `cardYOffset` and `cardScaleStep`.",
      "Pacing via `stepInterval`, `stepDuration` and `scrollLengthPerCard`.",
      "Keep the last card on screen as the pin releases, or animate it away with `exitLast`.",
    ],
    accessibility: [
      "Uses the library's `useReducedMotion` hook. With reduced motion on, it renders a plain vertical list of cards with no pinning or motion.",
      "Each card is an `article` with an `h3` title, and images use the title as `alt`.",
      "Stacked cards behind the front one are still in the DOM and readable by screen readers in order.",
    ],
    tips: [
      "Titles use `var(--font-display)` with a Barlow Condensed fallback. Load that font or set the variable for the intended look.",
      "Images show only at the `@lg` container size and up; on narrow containers the card is text only.",
    ],
    related: ["horizontal-scroll", "scroll-text-reveal", "smooth-scroll"],
  },
}
