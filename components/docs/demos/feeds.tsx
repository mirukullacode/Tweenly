"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Archive, Clock, GitMerge, Plus, Rocket, Trash2 } from "lucide-react"
import { as, type DemoMap } from "@/components/docs/demo-utils"
import { cn } from "@/lib/utils"
import { SwipeList, type SwipeAction, type SwipeListProps } from "@/registry/new-york/swipe-row/swipe-row"
import {
  NotificationFeed,
  useNotifications,
  type NotificationFeedProps,
  type NotifyInput,
} from "@/registry/new-york/notification-feed/notification-feed"

/* ------------------------------------------------------------------ swipe row */

interface Email {
  id: string
  sender: string
  subject: string
  preview: string
  time: string
  unread?: boolean
}

const EMAILS: Email[] = [
  { id: "1", sender: "Maya Chen", subject: "Design review moved to Thursday", preview: "Same room, 2pm. I added the new motion specs to the doc.", time: "9:41", unread: true },
  { id: "2", sender: "Stripe", subject: "Your payout is on the way", preview: "$4,280.00 will arrive in your account by Friday.", time: "9:12", unread: true },
  { id: "3", sender: "Vercel", subject: "Deployment ready", preview: "tweenly-docs was deployed to production in 42s.", time: "8:57" },
  { id: "4", sender: "Jonas Weber", subject: "Re: Pricing page copy", preview: "Looks great. One nit on the enterprise tier wording.", time: "Yesterday" },
  { id: "5", sender: "GitHub", subject: "[tweenly] PR #214 approved", preview: "priya-k approved: feat: layout-animated feeds.", time: "Yesterday" },
  { id: "6", sender: "Linear", subject: "Weekly digest", preview: "12 issues closed, 4 in review, 2 new cycles planned.", time: "Mon" },
]

const PAST: Record<string, string> = { snooze: "Snoozed", archive: "Archived", delete: "Deleted" }

const leftActions: SwipeAction[] = [{ id: "snooze", label: "Snooze", icon: <Clock /> }]
const rightActions: SwipeAction[] = [
  { id: "delete", label: "Delete", icon: <Trash2 />, color: "#ef4444", destructive: true },
  { id: "archive", label: "Archive", icon: <Archive />, color: "#3b82f6", destructive: true },
]

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)

function InboxDemo({ props }: { props: Partial<SwipeListProps<Email>> }) {
  const [emails, setEmails] = useState(EMAILS)
  const [last, setLast] = useState<{ n: number; text: string } | null>(null)

  return (
    <div className="w-full max-w-[440px] px-5">
      <div className="mb-3 flex h-6 items-center justify-between px-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Inbox <span className="font-normal text-muted-foreground">· {emails.length}</span>
        </h3>
        <AnimatePresence mode="popLayout" initial={false}>
          {last && (
            <motion.span
              key={last.n}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="truncate text-xs text-muted-foreground"
            >
              {last.text}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <SwipeList
        {...props}
        items={emails}
        getKey={(e) => e.id}
        leftActions={leftActions}
        rightActions={rightActions}
        onSwipe={(_, action, email) => setLast((l) => ({ n: (l?.n ?? 0) + 1, text: `${PAST[action.id]} · ${email.sender}` }))}
        onRemove={(email) => setEmails((list) => list.filter((e) => e.id !== email.id))}
        emptyState={
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center">
            <p className="text-sm font-medium text-foreground">All caught up</p>
            <button
              type="button"
              onClick={() => {
                setEmails([...EMAILS])
                setLast(null)
              }}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Reset
            </button>
          </div>
        }
        renderItem={(email) => (
          <div className="flex items-center gap-3 py-3 pl-4 pr-12">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.07] text-xs font-semibold text-foreground">
              {initials(email.sender)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{email.sender}</span>
                {email.unread && <span className="size-1.5 shrink-0 rounded-full" style={{ background: props.accent ?? "#ff4d12" }} />}
                <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">{email.time}</span>
              </div>
              <p className="truncate text-[13px] text-muted-foreground">
                <span className="text-foreground/80">{email.subject}</span> · {email.preview}
              </p>
            </div>
          </div>
        )}
      />

      <p className="mt-3 text-center text-[11px] text-muted-foreground">Drag rows left or right · Tab to a row and use the arrow keys</p>
    </div>
  )
}

/* ----------------------------------------------------------- notification feed */

function avatar(letters: string, bg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" font-weight="600" fill="#fff">${letters}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const FEED: NotifyInput[] = [
  { title: "Deploy succeeded", description: "tweenly-docs is live on production in 42s.", tone: "success" },
  { title: "Maya Chen commented", description: "“Love the new spring on the island. Ship it.”", avatar: avatar("MC", "#7c3aed") },
  { title: "Payment failed", description: "Card ending 4242 was declined for the Pro renewal.", tone: "error", action: { label: "Update card", onClick: () => {} } },
  { title: "PR #214 merged", description: "feat: layout-animated notification feed", tone: "info", icon: <GitMerge /> },
  { title: "Storage 90% full", description: "45 of 50 GB used. Upgrade to keep syncing.", tone: "warning" },
  { title: "Jonas Weber mentioned you", description: "@you can you check the pricing copy before 5pm?", avatar: avatar("JW", "#0f766e") },
  { title: "New team sign-up", description: "Priya from Acme Inc. started a Team trial.", icon: <Rocket /> },
]

function FeedDemo({ props }: { props: Partial<NotificationFeedProps> }) {
  const { items, notify, dismiss, clear } = useNotifications({ limit: 12 })
  const counter = useRef(0)

  const push = useCallback(
    (extra?: Partial<NotifyInput>) => {
      const next = FEED[counter.current % FEED.length]
      counter.current += 1
      notify({ ...next, time: "now", ...extra })
    },
    [notify]
  )

  useEffect(() => {
    const timers = [
      setTimeout(() => push({ read: true, time: "2h" }), 150),
      setTimeout(() => push({ read: true, time: "1h" }), 450),
      setTimeout(() => push(), 1200),
    ]
    const cycle = setInterval(() => push(), 4200)
    return () => {
      timers.forEach(clearTimeout)
      clearInterval(cycle)
    }
  }, [push])

  const variant = props.variant ?? "stack"
  const floating = variant === "stack" || variant === "island"
  const bottom = (props.position ?? "top-center").startsWith("bottom")

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center gap-5 self-stretch justify-self-stretch px-6",
        !floating ? "justify-center" : bottom ? "justify-start pt-8" : "justify-end pb-24"
      )}
    >
      <NotificationFeed {...props} strategy="absolute" items={items} onDismiss={dismiss} />
      <div className="flex items-center gap-1 rounded-full border bg-panel/85 p-1 shadow-sm backdrop-blur-xl">
        <button
          type="button"
          onClick={() => push()}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
        >
          <Plus className="size-3.5" />
          Add notification
        </button>
        <button
          type="button"
          onClick={clear}
          className="h-8 rounded-full px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

export const feedsDemos: DemoMap = {
  "swipe-row": ({ values }) => <InboxDemo props={as<Partial<SwipeListProps<Email>>>(values)} />,
  "notification-feed": ({ values }) => <FeedDemo props={as<Partial<NotificationFeedProps>>(values)} />,
}
