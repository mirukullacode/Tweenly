import type { ComponentGuide } from "./types"

/** Hand-written guides for buttons, inputs, navigation, charts and page sections. */
export const guidesB: Record<string, ComponentGuide> = {
  "shine-button": {
    overview:
      "A pill button with a light beam that runs around its edge. A conic gradient sits behind the face and rotates on an infinite linear loop with motion, so only a thin rim of it shows. An optional sheen sweeps across the face on hover using a CSS transition.",
    whenToUse: [
      "The single primary call to action in a hero or pricing section.",
      "Highlighting a new or premium action without adding a badge.",
      "Dark landing pages where a moving edge reads well against the background.",
    ],
    features: [
      "Beam color and lap time set with `beamColor` and `duration`.",
      "`variant` switches between a filled and an outlined face.",
      "Hover sheen that you can turn off with `sheen={false}`.",
      "Accepts every native button attribute and defaults to `type=\"button\"`.",
    ],
    accessibility: [
      "Renders a native `<button>`, so Enter and Space work and it shows a visible focus ring.",
      "The beam and sheen layers are `aria-hidden`. With reduced motion the beam stops rotating and the sheen is not rendered.",
    ],
    tips: [
      "Use one per screen. Several looping beams compete for attention and keep the compositor busy.",
      "A longer `duration` (5 to 6 seconds) feels calmer in dense layouts.",
    ],
    related: ["ripple-button", "fill-button", "magnetic"],
  },

  "ripple-button": {
    overview:
      "A button that spawns a circular ripple from the press point. Each ripple is a motion span that scales from zero to a size that reaches the farthest corner, then fades out and removes itself when its animation completes.",
    whenToUse: [
      "Toolbar or form actions that need clear press feedback.",
      "Touch-first interfaces where a visible response to a tap matters.",
      "Secondary actions next to a primary button, using the `outline` or `ghost` variant.",
    ],
    features: [
      "Ripples start at the pointer position, or at the center for keyboard presses.",
      "Rapid presses stack several ripples at once.",
      "`rippleColor` and `duration` control the ripple; it inherits the text color by default.",
      "`variant` offers `solid`, `outline` and `ghost` styles.",
    ],
    accessibility: [
      "Native `<button>` with a visible focus ring. Enter and Space spawn a centered ripple and ignore key repeat.",
      "The ripple layer is `aria-hidden`. With reduced motion ripples skip the scale-up and only fade briefly.",
    ],
    tips: [
      "Your own `onPointerDown` and `onKeyDown` handlers still run; the component calls them before spawning a ripple.",
      "On a solid button, a semi-transparent `rippleColor` such as `rgb(255 255 255 / 0.6)` reads better than the default.",
    ],
    related: ["shine-button", "hold-button", "fill-button"],
  },

  "hold-button": {
    overview:
      "A press-and-hold button for destructive or deliberate actions. A motion value drives a fill that sweeps left to right for `holdDuration` seconds; letting go early springs it back. On completion the label swaps to a confirmation with an animated check.",
    whenToUse: [
      "Delete, revoke or reset actions where a confirm dialog feels heavy.",
      "Preventing accidental taps on mobile.",
      "Any action that should take a moment of intent.",
    ],
    features: [
      "`holdDuration` sets how long the hold takes; releasing early resumes from the current progress on the next press.",
      "`onConfirm` fires once the fill completes.",
      "`resetAfter` returns to idle after a delay, or stays confirmed with `0`.",
      "A white copy of the label is revealed by the fill with `clip-path`, so text stays legible.",
      "`label`, `confirmedLabel` and `fillColor` customize the copy and color.",
    ],
    accessibility: [
      "Holding Space or Enter works the same as holding the pointer. Releasing the key or blurring the button cancels.",
      "The button has `aria-live=\"polite\"` so the confirmed label is announced. Consider adding an `aria-label` or nearby text that explains it must be held.",
      "With reduced motion the label swaps without blur or slide and the reset is instant.",
    ],
    tips: [
      "Keep `holdDuration` between 0.8 and 1.5 seconds. Longer holds feel broken.",
      "The context menu is suppressed so long presses on touch do not open it.",
    ],
    related: ["slide-button", "ripple-button", "confetti"],
  },

  "slide-button": {
    overview:
      "A slide-to-confirm control. The knob is a draggable motion element constrained to the track; a trailing fill and fading label follow its position. Releasing past the `threshold` completes it, otherwise it springs back.",
    whenToUse: [
      "Confirming payments, transfers or irreversible steps.",
      "Kiosk or mobile flows where an accidental tap must not trigger the action.",
      "Unlock-style interactions in onboarding.",
    ],
    features: [
      "`threshold` sets how far the knob must travel to complete.",
      "`onComplete` fires when the knob reaches the end; `resetAfter` slides it back after a delay.",
      "`width` and `accentColor` size and color the track, knob and fill.",
      "A shimmer moves across the label to hint at the gesture.",
      "`disabled` turns off dragging and keyboard input.",
    ],
    accessibility: [
      "The knob has `role=\"slider\"` with `aria-valuenow` from 0 to 100 and `aria-valuetext` that reads the complete label when done.",
      "Arrow keys move it in 10 percent steps, Home resets, and End or Enter completes it.",
      "With reduced motion the springs become instant and the label shimmer stops.",
    ],
    tips: [
      "Lower `threshold` to around 0.75 if users struggle to reach the end on small screens.",
      "Pass a CSS variable to `accentColor` to match your theme in both light and dark mode.",
    ],
    related: ["hold-button", "elastic-switch", "otp-input"],
  },

  "like-button": {
    overview:
      "A heart toggle with a burst. Liking pops the heart on a motion spring, expands a ring and throws a circle of particles. The count rolls digit by digit up or down with AnimatePresence.",
    whenToUse: [
      "Likes, favorites or saves on posts and products.",
      "Social feeds and comment threads.",
      "Any binary toggle that benefits from a celebratory moment.",
    ],
    features: [
      "Works controlled with `liked` and `onChange`, or uncontrolled with `defaultLiked`.",
      "`count` excludes the viewer's own like; the component adds one when liked.",
      "`color`, `size` and `particles` tune the heart and burst.",
      "Digits roll individually, so only the changed places animate.",
    ],
    accessibility: [
      "Native `<button>` with `aria-pressed` reflecting the liked state and a screen-reader-only \"Like\" label.",
      "The count is wrapped in `aria-live=\"polite\"`, so changes are announced.",
      "With reduced motion the ring, particles and heart pop are skipped and digits swap without sliding.",
    ],
    tips: [
      "Update your backend in `onChange` and keep `liked` controlled if the server can reject the change.",
      "Lower `particles` to 6 for small sizes so the burst does not look crowded.",
    ],
    related: ["rating", "number-ticker", "confetti"],
  },

  "segmented-control": {
    overview:
      "A row of mutually exclusive options with a pill that slides to the selected one. The pill uses a motion `layoutId`, so it springs between buttons with a configurable stiffness and damping.",
    whenToUse: [
      "Switching views such as list and grid, or monthly and yearly pricing.",
      "Filters with two to five options.",
      "Settings where a dropdown hides too much.",
    ],
    features: [
      "Options take a `value`, `label` and optional `icon`.",
      "Controlled with `value` and `onValueChange`, or uncontrolled with `defaultValue`.",
      "`size` offers `sm`, `md` and `lg`.",
      "`pillColor`, `stiffness` and `damping` tune the pill's look and motion.",
    ],
    accessibility: [
      "Uses `role=\"radiogroup\"` and `role=\"radio\"` with `aria-checked` and a roving tab index, so only the selected option is in the tab order.",
      "Arrow keys move and select with wraparound; Home and End jump to the ends. Pass `aria-label` to name the group.",
      "With reduced motion the pill moves instantly.",
    ],
    tips: [
      "Each instance uses its own `layoutId`, so several controls on one page do not interfere.",
      "Keep labels short. The control does not wrap or scroll.",
    ],
    related: ["elastic-switch", "number-stepper", "chart-bar"],
  },

  "number-stepper": {
    overview:
      "A plus and minus stepper with a rolling number. Each digit slides in the direction of the change through AnimatePresence, and hitting a limit shakes the control with motion's `useAnimate`.",
    whenToUse: [
      "Cart quantities and guest counts.",
      "Numeric settings with a clear range, such as font size or seats.",
      "Prices or weights with a `prefix` or `suffix`.",
    ],
    features: [
      "`min`, `max` and `step` define the range; decimals follow the precision of `step`.",
      "Holding a button repeats the change and speeds up over time.",
      "`prefix` and `suffix` add units like \"$\" or \"kg\".",
      "Controlled with `value` and `onValueChange`, or uncontrolled with `defaultValue`.",
      "`size` offers `sm`, `md` and `lg`.",
    ],
    accessibility: [
      "The value has `role=\"spinbutton\"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and an `aria-valuetext` that includes the prefix and suffix.",
      "Arrow keys step by one, Page Up and Page Down step by ten, Home and End jump to the limits. The buttons are labeled \"Decrease\" and \"Increase\" and work with Enter and Space.",
      "At a limit the buttons get `aria-disabled` but stay focusable. With reduced motion digits swap in place and the shake is skipped.",
    ],
    tips: [
      "Pass a descriptive `aria-label` such as \"Guests\"; the default is \"Quantity\".",
      "Use `step={0.5}` or similar for fractional values; output is rounded to that precision.",
    ],
    related: ["segmented-control", "number-ticker", "product-card"],
  },

  "elastic-switch": {
    overview:
      "A toggle switch whose knob stretches while pressed and bounces into place on release. The knob's position and width are driven by a motion spring with low damping, which gives it the elastic feel.",
    whenToUse: [
      "Boolean settings such as notifications or auto-save.",
      "Theme toggles, using the built-in sun and moon icons.",
      "Forms where a checkbox feels too plain.",
    ],
    features: [
      "Controlled with `checked` and `onCheckedChange`, or uncontrolled with `defaultChecked`.",
      "`size` offers `sm`, `md` and `lg`.",
      "`onColor` and `offColor` set the track colors.",
      "`icons` shows a sun or moon inside the knob that rotates when toggled.",
      "`label` renders a clickable label linked to the switch.",
    ],
    accessibility: [
      "Native `<button>` with `role=\"switch\"` and `aria-checked`. Space and Enter toggle it, and holding Space shows the stretch.",
      "With a visible `label`, it is linked by `htmlFor`; otherwise pass `aria-label`.",
      "With reduced motion the knob moves instantly without stretching.",
    ],
    tips: [
      "Use `disabled` rather than hiding the switch, so users can see the setting exists.",
      "Pick an `onColor` with enough contrast against the white knob.",
    ],
    related: ["segmented-control", "slide-button", "rating"],
  },

  "expand-input": {
    overview:
      "A button that expands into an email field. The container springs from its natural width to `width` with motion, then cycles through loading and success states with blur and scale crossfades.",
    whenToUse: [
      "Newsletter signups in a hero or footer.",
      "Waitlist forms where space is tight.",
      "Any single-field capture that should look like a button until used.",
    ],
    features: [
      "Validates the email before submitting and shakes on invalid input.",
      "`onSubmit` can return a promise; the spinner waits for it, and a rejection returns to the input.",
      "`resetAfter` collapses back to the button after success.",
      "`label`, `placeholder` and `successLabel` set the copy.",
    ],
    accessibility: [
      "The input has an \"Email address\" label and `aria-invalid` on bad input. A screen-reader-only live region announces \"Submitting\" and the success message.",
      "Escape collapses the field and returns focus to the button. Blurring an empty field also collapses it.",
      "With reduced motion the width change and crossfades are instant and the shake is skipped.",
    ],
    tips: [
      "Throw from `onSubmit` on a server error so the field reopens instead of showing success.",
      "There is a minimum 700 ms loading state so the spinner never flickers.",
    ],
    related: ["shine-button", "footer", "auth"],
  },

  rating: {
    overview:
      "A star rating with half-star support. Each star's fill width animates with a motion spring and a short stagger, so the fill sweeps across the row. Committing a value pops the star and throws small sparks.",
    whenToUse: [
      "Review and feedback forms.",
      "Displaying an average score in read-only mode.",
      "Quick satisfaction prompts after a task.",
    ],
    features: [
      "`allowHalf` enables half steps based on which half of a star you point at.",
      "Hover previews the value before you click.",
      "`max`, `size` and `color` set the star count, size and fill.",
      "`readOnly` turns it into a static display.",
      "Controlled with `value` and `onValueChange`, or uncontrolled with `defaultValue`.",
    ],
    accessibility: [
      "Interactive mode uses `role=\"slider\"` with `aria-valuenow` and `aria-valuetext` like \"3.5 out of 5\". Arrow keys step by the unit, Home clears and End sets the maximum.",
      "Read-only mode uses `role=\"img\"` with a label such as \"Rating: 4 out of 5\".",
      "With reduced motion the fill changes instantly and the pop, sparks and hover scale are skipped.",
    ],
    tips: [
      "Set `allowHalf={false}` for simple feedback prompts; it makes keyboard steps whole numbers.",
      "Pass a specific `aria-label` such as \"Rate this recipe\".",
    ],
    related: ["like-button", "number-stepper", "product-card"],
  },

  navbar: {
    overview:
      "A site header with five variants: pill, morph, underline, island and overlay. Hover indicators use motion `layoutId`, the morph variant shrinks into a floating pill on scroll, the island grows into a mega-menu, and the overlay opens with a `clip-path` circle that grows from the menu button.",
    whenToUse: [
      "Marketing sites that want a distinctive top bar.",
      "Docs or product sites where `activeHref` marks the current page.",
      "Portfolios that want a full-screen overlay menu.",
    ],
    features: [
      "`variant` picks the layout and motion style.",
      "`links` can include `children`, shown in the island mega-menu and the overlay footer.",
      "The morph variant reads `scrollThreshold` and `hideOnScroll`, and can track a custom `scroller`.",
      "`onNavigate` lets you call `e.preventDefault()` and route with your framework.",
      "A mobile sheet with a burger button appears at narrow container widths.",
      "`cta`, `logo`, `accentColor` and `position` customize the bar.",
    ],
    accessibility: [
      "Wrapped in `<nav aria-label=\"Main\">`. The current link gets `aria-current=\"page\"`, and the burger has `aria-expanded`, `aria-controls` and an Open or Close menu label.",
      "Escape closes open menus. The overlay is `inert` and `aria-hidden` while closed, but focus is not trapped or moved into it when open, so consider adding that for keyboard users.",
      "With reduced motion every spring, stagger and the overlay circle become instant.",
    ],
    tips: [
      "Breakpoints use container queries, so the navbar adapts to its parent's width, not the viewport.",
      "Pass `scroller` when the page scrolls inside a container instead of the window.",
    ],
    related: ["footer", "table-of-contents", "banner"],
  },

  "table-of-contents": {
    overview:
      "An \"On this page\" list that tracks the heading in view. It reads heading positions on scroll and resize in a requestAnimationFrame loop. Three variants animate the active state with motion: a plane that flies along a dashed SVG trail, a sliding rail indicator, and a spotlight with glowing dashes and a rolling counter.",
    whenToUse: [
      "Long docs pages and blog posts.",
      "Changelogs or guides with nested sections.",
      "Any page with a sticky sidebar for in-page navigation.",
    ],
    features: [
      "`items` take an `id`, `title` and optional `level` from 1 to 3 for nesting.",
      "`variant` switches between `trail`, `rail` and `spotlight`.",
      "Tracks scroll automatically, or follows a controlled `activeId`.",
      "`offset` sets where a heading becomes active, and `container` supports custom scroll areas.",
      "Clicking scrolls to the heading, smoothly unless `smoothScroll` is false.",
    ],
    accessibility: [
      "Renders a `<nav>` labeled with `title`, and the active entry gets `aria-current=\"location\"`. Entries are real anchor links.",
      "With reduced motion clicks jump instantly and the plane, rail and dashes snap into place.",
    ],
    tips: [
      "Make sure each heading has a matching `id` and accounts for your sticky header with `offset`.",
      "Generate `items` from your MDX or CMS headings so the list stays in sync.",
    ],
    related: ["navbar", "smooth-scroll", "scroll-text-reveal"],
  },

  "otp-input": {
    overview:
      "A one-time-code field drawn as boxes or underlines over a single hidden input. Characters pop in with motion springs, a ring glides between slots with `layoutId`, and verification states shake on error or collapse into a check on success.",
    whenToUse: [
      "Two-factor and email verification steps.",
      "Phone number confirmation.",
      "Invite or access codes using `pattern=\"alphanumeric\"`.",
    ],
    features: [
      "`verify` can return a promise; the slots shimmer while it runs, then show success or error.",
      "`resetOnError` clears the code right to left and refocuses after a failure.",
      "Pasting a full code fills every slot, and `autoComplete=\"one-time-code\"` supports SMS autofill.",
      "`variant` switches between `boxes` and `line`; `masked` shows dots.",
      "Controlled with `value`, `onChange` and `status`, or let the component manage state.",
    ],
    accessibility: [
      "A single real `<input>` handles typing, so screen readers see one field labeled by `label` with `aria-invalid` on error.",
      "A `role=\"status\"` live region announces verifying, verified and incorrect states.",
      "With reduced motion the shake, collapse and slot transitions are instant and the caret stops blinking.",
    ],
    tips: [
      "Return `false` from `verify` instead of throwing for a wrong code; a thrown error is also treated as a failure.",
      "Set `collapseOnSuccess={false}` if the next step needs the code to stay visible.",
    ],
    related: ["auth", "slide-button", "confetti"],
  },

  "chart-line": {
    overview:
      "A line and area chart drawn as SVG paths. The smooth curve uses monotone cubic interpolation, so it never overshoots the data. Lines draw in with motion's `pathLength`, areas reveal through an animated clip, and toggling a series morphs the paths.",
    whenToUse: [
      "Revenue, traffic or usage trends over time.",
      "Comparing a few series on the same axis.",
      "Dashboard cards that need a headline figure and change pill.",
    ],
    features: [
      "Real-data API: pass rows in `data`, the label key as `index`, and numeric keys in `series`.",
      "`curve` offers `smooth`, `linear` and `step`; `fill` offers `dots`, `hatch`, `gradient` or `none`.",
      "Crosshair and tooltip on hover, plus a legend that toggles series.",
      "`showPoints` marks `all`, `hover`, `none` or a pulsing `last` point.",
      "`total` and `delta` drive the headline; `valueFormat` handles numbers, percent and currency.",
      "Card props like `surface`, `accent`, `bare` and `titleSize` come from the shared chart kit.",
    ],
    accessibility: [
      "The plot is a focusable `role=\"group\"` labeled with the title. Left and Right arrows move the crosshair, Home and End jump to the ends, and Escape clears it.",
      "Legend items are buttons with `aria-pressed`.",
      "With reduced motion or `animate={false}` the chart renders in its final state with no draw-in or pulse.",
    ],
    tips: [
      "Set `yMin` and `yMax` to keep the scale steady when data updates.",
      "The entrance plays when the chart scrolls into view; set `once={false}` to replay it each time.",
    ],
    related: ["chart-bar", "chart-kpi", "chart-heatmap"],
  },

  "chart-bar": {
    overview:
      "A bar chart drawn in SVG that supports grouped or stacked bars in either orientation. Bars grow from the baseline with staggered motion springs, and stacked segments build one after another.",
    whenToUse: [
      "Comparing categories, such as sales by region.",
      "Monthly totals split by channel with `stacked`.",
      "Rankings with long labels using `layout=\"horizontal\"`.",
    ],
    features: [
      "Real-data API: rows in `data`, category key as `index`, and numeric keys in `series`.",
      "`layout` switches between vertical columns and horizontal rows; `stacked` stacks series.",
      "`highlight=\"hover\"` dims other categories, and a tooltip lists each series.",
      "Textured fills (solid, hatch, muted, dots) set per series or assigned in order.",
      "`showValues` prints totals at the end of each bar; `barRadius`, `barGap` and `categoryGap` tune spacing.",
    ],
    accessibility: [
      "The plot is a focusable `role=\"group\"` labeled with the title. Arrow keys step through categories (Up and Down when horizontal), Home and End jump, Escape clears.",
      "Legend items are toggle buttons with `aria-pressed`. Textures help tell series apart without relying on color.",
      "With reduced motion or `animate={false}` bars render at full size immediately.",
    ],
    tips: [
      "Keep series to four or fewer so the default textures stay distinct.",
      "Use `valueFormat=\"compact\"` for large numbers to keep axis labels narrow.",
    ],
    related: ["chart-line", "chart-radial", "segmented-control"],
  },

  "chart-radial": {
    overview:
      "A donut, pie or gauge chart built from SVG arc paths. Slices sweep in with a motion value that drives the reveal, and hovering pushes a slice outward on a spring.",
    whenToUse: [
      "Showing share of a whole, such as traffic by browser.",
      "Half-circle gauges with `startAngle={-90}` and `endAngle={90}`.",
      "Dashboard cards that pair a total with a breakdown.",
    ],
    features: [
      "Data API: rows in `data`, with `nameKey`, `valueKey` and an optional `colorKey`.",
      "`innerRadius` of 0 draws a pie; `padAngle` and `cornerRadius` shape the slices.",
      "`center` shows the total or the hovered slice in the hole.",
      "`hoverEffect` explodes or dims slices; `highlight` pushes one out permanently.",
      "Legend with values and shares; clicking a row hides its slice.",
      "`showLabels` prints percent, value or name on slices that fit.",
    ],
    accessibility: [
      "The SVG has `role=\"img\"` labeled with the title. Slice details are not exposed to keyboard users beyond the legend.",
      "Legend rows are buttons with `aria-pressed`, so slices can be toggled by keyboard. Hover effects are pointer only.",
      "With reduced motion or `animate={false}` the chart renders fully drawn.",
    ],
    tips: [
      "Use `sortBy=\"value\"` to make the largest slice start at the top.",
      "Keep the legend on when slices are small; labels hide on slices too narrow to fit them.",
    ],
    related: ["chart-rings", "chart-bar", "chart-progress"],
  },

  "chart-rings": {
    overview:
      "Concentric progress rings, one per row, outermost first. Each ring fills toward its goal from a motion value with a small stagger, and the list beside it counts up in step.",
    whenToUse: [
      "Activity goals such as move, exercise and stand.",
      "Quota progress for a few related metrics.",
      "Compact KPI cards that need more than one percentage.",
    ],
    features: [
      "Data API: rows in `data`, with `nameKey`, `valueKey`, and optional `maxKey` or a shared `max`.",
      "`thickness`, `gap` and `roundedCaps` shape the rings; `trackTexture` styles the unfilled part.",
      "Hovering a ring or list row dims the others and shows its percentage in the center.",
      "`showValues` lists percent or raw values; `layout` puts the list beside or under the rings.",
    ],
    accessibility: [
      "The SVG has `role=\"img\"` labeled with the title, and the value list beside it is plain readable text.",
      "Hover highlighting is pointer only. There is no keyboard interaction, which is fine because the list already shows every value.",
      "With reduced motion or `animate={false}` the rings and counts render in their final state.",
    ],
    tips: [
      "Three to four rings is the practical limit before inner rings get too small.",
      "Pass `colorKey` to give each ring a meaningful color instead of the derived palette.",
    ],
    related: ["chart-radial", "chart-progress", "chart-kpi"],
  },

  "chart-radar": {
    overview:
      "A radar chart that plots each row as an axis and each series as a polygon. Shapes grow out from the center with motion, and hovering an axis highlights it and lists every series' value.",
    whenToUse: [
      "Comparing skill or feature profiles.",
      "Benchmarking a team against a target across several metrics.",
      "Product comparisons with five to eight attributes.",
    ],
    features: [
      "Real-data API: rows in `data`, the axis label key as `index`, and polygons in `series`.",
      "`gridShape` draws polygon or circular rings; `levels` sets how many.",
      "`curve` switches between straight edges and a closed smooth shape.",
      "`fillOpacity`, `showPoints`, `showAxisLabels` and `showLevelLabels` control detail.",
      "Legend toggles series; `max` fixes the outer ring value.",
    ],
    accessibility: [
      "The SVG has `role=\"img\"` labeled with the title. The axis tooltip is pointer only, so provide the underlying numbers elsewhere if they matter.",
      "Legend items are buttons with `aria-pressed`.",
      "With reduced motion or `animate={false}` the polygons render without the grow-in.",
    ],
    tips: [
      "Set `max` when comparing several radar charts so they share a scale.",
      "Keep axis labels short; they get extra side room but long text will crowd.",
    ],
    related: ["chart-radial", "chart-bar", "chart-line"],
  },

  "chart-kpi": {
    overview:
      "A KPI card with a counting headline, change pill and sparkline. The number counts up and the sparkline reveals with motion when the card enters view; scrubbing the sparkline shows each row in a tooltip.",
    whenToUse: [
      "Dashboard rows of key metrics.",
      "Comparing this period with the last using `compareKey`.",
      "Tracking progress toward a target with `goal`.",
    ],
    features: [
      "Data API: rows in `data`, label key as `index`, metric as `valueKey`.",
      "`aggregate` combines rows by `sum`, `last` or `average` for the headline.",
      "`compareKey` draws a dashed previous-period line and feeds the delta.",
      "`sparkline` offers `area`, `line` or `bars`; `layout` stacks or inlines it.",
      "`goal` adds a thin progress bar; `trendColor=\"semantic\"` paints rises green and falls red.",
    ],
    accessibility: [
      "The headline and delta are plain text, so the main figure is readable by screen readers.",
      "Sparkline scrubbing is pointer only and the sparkline has no ARIA label. Add a short text summary if the trend itself matters.",
      "With reduced motion or `animate={false}` the number and sparkline render in their final state.",
    ],
    tips: [
      "Use `valueFormat=\"compact\"` or `\"currency\"` so large figures fit the card.",
      "Turn off `showTooltip` on very small cards where scrubbing is awkward.",
    ],
    related: ["chart-line", "number-ticker", "chart-progress"],
  },

  "chart-heatmap": {
    overview:
      "A calendar heatmap of daily values, laid out in weeks like a contribution graph. Cells scale and fade in with motion, and the total counts up in the header.",
    whenToUse: [
      "Activity or contribution history.",
      "Daily usage, sales or habit streaks.",
      "Spotting weekly patterns over a few months.",
    ],
    features: [
      "Data API: rows in `data` with a `dateKey` and `valueKey`; missing days count as zero.",
      "`weeks` sets the range, ending at the latest date; `weekStart` picks Sunday or Monday.",
      "`scale` uses `linear` steps or `quantile` buckets; `levels` sets the number of shades.",
      "`cellSize`, `cellGap`, `cellRadius` and `emptyTexture` style the grid.",
      "Month and day labels, a Less / More legend, and a hover tooltip using `unit`.",
    ],
    accessibility: [
      "The grid has no ARIA role or per-cell labels, and the tooltip is pointer only. Provide a text summary or table for screen reader users.",
      "The headline total is plain text.",
      "With reduced motion or `animate={false}` cells and the total render without animation.",
    ],
    tips: [
      "Use `scale=\"quantile\"` when one busy day would wash out the rest.",
      "The grid scrolls horizontally on narrow screens; lower `weeks` for small cards.",
    ],
    related: ["chart-dots", "chart-kpi", "chart-line"],
  },

  "chart-progress": {
    overview:
      "A thick progress bar card with a big percentage, an optional target marker and stacked segments. The fill grows from a motion value, and the default wave texture drifts on an infinite linear loop.",
    whenToUse: [
      "Fundraising, storage or quota progress.",
      "Sales against a target with `target`.",
      "Budget breakdowns using `segments`.",
    ],
    features: [
      "`value` and `max` set the fill; `segments` split it into labeled parts with a legend.",
      "`target` and `targetLabel` add a marker for a goal.",
      "`texture` offers `wave`, `solid` or `grain`; `remainder` styles the empty part.",
      "`orientation` draws it horizontal or vertical; `thickness` and `length` size it.",
      "`showMarker` toggles the thermometer cap; `showPercent` toggles the big percentage.",
    ],
    accessibility: [
      "The percentage and label render as text, but the bar has no `role=\"progressbar\"` or `aria-value*` attributes. Wrap it or add those attributes if it reports live progress.",
      "With reduced motion or `animate={false}` the fill renders at its value and the wave stops moving.",
    ],
    tips: [
      "Use `texture=\"solid\"` in dense dashboards to avoid constant motion.",
      "When using `segments`, the sum of the parts becomes the value and `value` is ignored.",
    ],
    related: ["chart-dots", "chart-rings", "chart-kpi"],
  },

  "chart-dots": {
    overview:
      "A dot matrix that fills a grid to show a share, like seats taken or a completion rate. Dots pop in one by one with motion springs in row, column or spiral order, and the headline counts up.",
    whenToUse: [
      "Showing a ratio such as 41 of 50 seats.",
      "Making a percentage feel tangible in a hero stat.",
      "Compact cards where a bar feels too plain.",
    ],
    features: [
      "`value` and `total` set the share; `columns` and `rows` size the grid.",
      "`partial` shows a fractional share as a partly filled dot.",
      "`display` shows a percentage, the raw value, or `value/total`.",
      "`shape`, `gap`, `emptyTexture` and `order` style the grid and fill sequence.",
      "`caption` adds text under the headline.",
    ],
    accessibility: [
      "The grid has `role=\"img\"` with a label built from the formatted value and caption.",
      "There is no interaction to make keyboard accessible.",
      "With reduced motion or `animate={false}` the grid and number render in their final state.",
    ],
    tips: [
      "Match `columns` times `rows` to a meaningful unit, such as 10 by 10 for percentages.",
      "Use `order=\"spiral\"` for a more playful fill in hero sections.",
    ],
    related: ["chart-progress", "chart-heatmap", "number-ticker"],
  },

  preloader: {
    overview:
      "A full-screen loading overlay with a large percentage counter, a progress line and rotating quotes. Progress is a motion value animated with an uneven ease, and the overlay leaves with a `clip-path` curtain, a split, or a fade.",
    whenToUse: [
      "Portfolio or campaign sites with a deliberate intro.",
      "Pages that preload heavy media and can report real progress.",
      "Brand moments where a quote or tagline sets the tone.",
    ],
    features: [
      "Simulates a load for `duration` seconds, or follows a controlled `progress` from 0 to 100.",
      "`exit` offers `curtain`, `split` or `fade`.",
      "`quotes` cycle evenly across the load with a word-by-word blur reveal.",
      "`lockScroll` stops page scrolling while loading; `position` covers the viewport or a parent.",
      "`onComplete` fires after the exit animation finishes.",
    ],
    accessibility: [
      "The overlay has `role=\"progressbar\"` with a \"Loading\" label and a 0 to 100 range, but no `aria-valuenow`, so screen readers do not hear the current value. Add it if progress matters.",
      "With reduced motion the simulated load shortens to 0.4 seconds and the exit becomes a quick fade.",
    ],
    tips: [
      "Keep `duration` short; a long fake load mostly delays users.",
      "Your page renders underneath from the start, so heavy content can load while the overlay shows.",
    ],
    related: ["page-loader", "loader", "page-transition"],
  },

  footer: {
    overview:
      "A site footer with four variants: sticky-reveal, big-type, columns and curtain. Scroll effects run on a GSAP timeline with ScrollTrigger, including a scrubbed reveal, a giant wordmark whose letters rise in, and a curtain panel that opens with `clip-path`. The curtain's magnetic call to action uses motion springs.",
    whenToUse: [
      "Marketing and agency sites that want a memorable ending.",
      "Product sites that need link columns and a newsletter form.",
      "Portfolios with a big \"let's work together\" call to action.",
    ],
    features: [
      "`variant` picks the layout and scroll effect.",
      "`columns`, `socials` and `legal` take your links; social icons are picked from the label.",
      "Newsletter form with validation; `onSubscribe` can reject to show an error.",
      "The curtain variant adds a looping `marqueeText` and a magnetic `cta`.",
      "Colors set with `background`, `color`, `accent` and `muted`; `scroller` supports custom scroll containers.",
      "A back-to-top button in the bottom bar.",
    ],
    accessibility: [
      "Link groups are `<nav>` elements labeled by their headings, social links have `aria-label`, and the wordmark and marquee have screen-reader-only text copies.",
      "The newsletter input uses a real label, `aria-invalid` and an `aria-live` message.",
      "With reduced motion or `animate={false}` the final state renders and the marquee does not loop. Otherwise the marquee loops with no pause control.",
    ],
    tips: [
      "Pass `scroller` when the page scrolls inside a container so ScrollTrigger measures the right element.",
      "Set `showWordmark={false}` for a quieter footer on content-heavy pages.",
    ],
    related: ["navbar", "expand-input", "marquee"],
  },

  faq: {
    overview:
      "An accordion of questions and answers with four variants: minimal, cards, numbered and split. Panels open with motion height animations, string answers reveal word by word, and the list staggers in when it scrolls into view.",
    whenToUse: [
      "Pricing and product pages.",
      "Support pages with many questions, using `searchable`.",
      "Landing pages where a split layout shows the answer beside the list.",
    ],
    features: [
      "`variant` sets the layout; `type` allows one or many items open.",
      "Controlled with `value` and `onValueChange`, or uncontrolled with `defaultOpen`.",
      "`searchable` adds a filter that collapses non-matching items and highlights matches.",
      "`icon` offers plus, chevron or arrow triggers.",
      "`accent`, `radius`, `duration` and `stagger` tune the look and timing.",
    ],
    accessibility: [
      "Triggers are buttons with `aria-expanded` and `aria-controls`, and panels are `role=\"region\"` labeled by their trigger.",
      "Up and Down arrows move focus between triggers with wraparound; Home and End jump to the ends.",
      "Reduced motion is read from the shared `useReducedMotion` hook and makes every transition instant.",
    ],
    tips: [
      "Pass plain strings as answers to get the word-by-word reveal and searchable text.",
      "Set `stagger={0}` to skip the entrance when the FAQ sits above the fold.",
    ],
    related: ["footer", "navbar", "table-of-contents"],
  },
}
