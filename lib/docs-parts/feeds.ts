import { classNameProp, num, type ComponentDoc } from "@/lib/docs-types"

export const feedsDocs: ComponentDoc[] = [
  {
    slug: "swipe-row",
    name: "Swipe Row",
    exportName: "SwipeList",
    description:
      "Swipeable list rows with iOS-style reveal actions, full-swipe commits and floating cards. Removed rows fly off and the rest glide into place.",
    category: "Interactive",
    file: "registry/new-york/swipe-row/swipe-row.tsx",
    dependencies: ["motion", "lucide-react"],
    isNew: true,
    preamble: `import { Archive, Clock, Trash2 } from "lucide-react"

const emails = [
  { id: "1", sender: "Maya Chen", subject: "Design review moved to Thursday" },
  { id: "2", sender: "Stripe", subject: "Your payout is on the way" },
  { id: "3", sender: "Vercel", subject: "Deployment ready" },
]

const leftActions = [{ id: "snooze", label: "Snooze", icon: <Clock /> }]

const rightActions = [
  { id: "delete", label: "Delete", icon: <Trash2 />, color: "#ef4444", destructive: true },
  { id: "archive", label: "Archive", icon: <Archive />, color: "#3b82f6", destructive: true },
]`,
    staticProps: [
      "items={emails}",
      "getKey={(email) => email.id}",
      "leftActions={leftActions}",
      "rightActions={rightActions}",
      `renderItem={(email) => (
    <div className="px-4 py-3">
      <p className="text-sm font-medium">{email.sender}</p>
      <p className="text-sm text-muted-foreground">{email.subject}</p>
    </div>
  )}`,
    ],
    props: [
      { name: "variant", type: '"reveal" | "full" | "card"', default: "reveal", description: "Reveal action buttons that stay open, commit with a full swipe, or drag floating cards with tilt.", control: { type: "select", options: ["reveal", "full", "card"] } },
      { name: "items", type: "T[]", required: true, description: "Items to render. Removed items animate out and siblings glide up." },
      { name: "getKey", type: "(item: T) => string | number", required: true, description: "Returns a stable key for an item." },
      { name: "renderItem", type: "(item: T, index: number) => ReactNode", required: true, description: "Renders the content of a row." },
      { name: "leftActions", type: "SwipeAction[] | ((item: T) => SwipeAction[])", default: "[]", description: "Actions revealed when dragging right, listed from the outer edge inward. Full and card variants commit the first." },
      { name: "rightActions", type: "SwipeAction[] | ((item: T) => SwipeAction[])", default: "[]", description: "Actions revealed when dragging left. Each action: { id, label, icon?, color?, onAction?, destructive? }. Destructive actions remove the row." },
      { name: "threshold", type: "number", default: 0.4, description: "Fraction of the row width that commits a full swipe.", control: num(0.2, 0.8, 0.05) },
      { name: "elastic", type: "number", default: 0.5, description: "Rubber-band resistance past the drag limits.", control: num(0, 1, 0.05) },
      { name: "haptics", type: "boolean", default: true, description: "Vibrate briefly on supported devices when a swipe arms or commits.", control: { type: "boolean" } },
      { name: "accent", type: "string", default: "#ff4d12", description: "Focus rings and actions without their own color.", control: { type: "color" } },
      { name: "radius", type: "number", default: 14, description: "Corner radius of the list (or of each card).", control: num(0, 28, 1, "px") },
      { name: "gap", type: "number", default: 8, description: "Space between rows in the card variant.", control: num(0, 24, 1, "px") },
      { name: "disabled", type: "boolean", default: false, description: "Disable dragging and actions.", control: { type: "boolean" } },
      { name: "onSwipe", type: "(direction, action, item) => void", description: "Called after an action runs." },
      { name: "onRemove", type: "(item: T) => void", description: "Called when a destructive action removes an item." },
      { name: "emptyState", type: "ReactNode", description: "Shown once every item is gone." },
      classNameProp,
    ],
  },
  {
    slug: "notification-feed",
    name: "Notification Feed",
    exportName: "NotificationFeed",
    description:
      "Layout-animated notifications as a Sonner-style stack, inbox list, dynamic island or timeline cards, with swipe to dismiss and pausable timers.",
    category: "Feedback",
    file: "registry/new-york/notification-feed/notification-feed.tsx",
    dependencies: ["motion", "lucide-react"],
    isNew: true,
    preamble: `// Inside your component:
// const { items, notify, dismiss, clear } = useNotifications()
//
// notify({
//   title: "Deploy succeeded",
//   description: "tweenly-docs is live on production.",
//   tone: "success",
// })`,
    staticProps: ["items={items}", "onDismiss={dismiss}"],
    props: [
      { name: "variant", type: '"stack" | "list" | "island" | "cards"', default: "stack", description: "Collapsed stack that fans out, inbox list, morphing dynamic island, or timeline cards.", control: { type: "select", options: ["stack", "list", "island", "cards"] } },
      { name: "items", type: "NotificationItem[]", required: true, description: "Notifications, newest first: { id, title, description?, icon?, avatar?, time?, tone?, action?, read? }." },
      { name: "onDismiss", type: "(id: string) => void", description: "Called on swipe, dismiss button or timeout." },
      { name: "position", type: '"top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"', default: "top-center", description: "Corner for the stack and island variants.", control: { type: "select", options: ["top-center", "top-right", "top-left", "bottom-center", "bottom-right", "bottom-left"] } },
      { name: "expand", type: '"hover" | "always" | "click"', default: "hover", description: "When the stack or island opens into a full list.", control: { type: "select", options: ["hover", "always", "click"] } },
      { name: "max", type: "number", default: 4, description: "Maximum visible items.", control: num(1, 6, 1) },
      { name: "duration", type: "number", default: 5000, description: "Auto-dismiss delay, paused on hover. 0 disables.", control: num(0, 12000, 500, "ms") },
      { name: "gap", type: "number", default: 12, description: "Space between expanded items.", control: num(0, 24, 1, "px") },
      { name: "offset", type: "number", default: 24, description: "Distance from the container edges.", control: num(0, 64, 2, "px") },
      { name: "width", type: "number", default: 360, description: "Width of the feed.", control: num(280, 440, 4, "px") },
      { name: "accent", type: "string", default: "#ff4d12", description: "Progress line, unread dots and focus rings.", control: { type: "color" } },
      { name: "radius", type: "number", default: 16, description: "Corner radius of items.", control: num(0, 28, 1, "px") },
      { name: "grouped", type: "boolean", default: false, description: 'List variant: group items under "Now" and "Earlier".', control: { type: "boolean" } },
      { name: "swipeToDismiss", type: "boolean", default: true, description: "Drag items sideways to dismiss.", control: { type: "boolean" } },
      { name: "strategy", type: '"fixed" | "absolute"', default: "fixed", description: "Positioning context for the stack and island. Use absolute inside a relative container." },
      { name: "emptyState", type: "ReactNode", default: "You're all caught up", description: "Shown by the list and cards variants when empty." },
      { name: "label", type: "string", default: "Notifications", description: "Accessible name of the region." },
      classNameProp,
    ],
  },
]
