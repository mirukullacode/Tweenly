"use client"

import { useState } from "react"
import {
  Calendar,
  Camera,
  Cloud,
  Code2,
  Database,
  Folder,
  GitBranch,
  Home,
  Mail,
  MessageSquare,
  Music,
  Rocket,
  Settings,
  Sparkles,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react"
import { as, type DemoMap, type DemoProps } from "@/components/docs/demo-utils"
import { Banner, type BannerProps } from "@/registry/new-york/banner/banner"
import { Dock, DockItem, DockSeparator, type DockProps } from "@/registry/new-york/dock/dock"
import { OrbitCenter, OrbitingCircles, type OrbitingCirclesProps } from "@/registry/new-york/orbiting-circles/orbiting-circles"
import { TweetGrid, type TweetGridItem, type TweetGridProps } from "@/registry/new-york/tweet-card/tweet-card"

// ------------------------------------------------------------------ dock

const DOCK_APPS = [
  { id: "home", label: "Home", icon: Home },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "mail", label: "Mail", icon: Mail, badge: 3 },
  { id: "messages", label: "Messages", icon: MessageSquare, badge: 12 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "music", label: "Music", icon: Music },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "photos", label: "Photos", icon: Camera },
]

function DockDemo({ values }: DemoProps) {
  const props = as<Omit<DockProps, "children">>(values)
  const [active, setActive] = useState("home")
  const fixed = props.position && props.position !== "static"

  const dock = (
    <Dock {...props}>
      {DOCK_APPS.map(({ id, label, icon: Icon, badge }) => (
        <DockItem key={id} label={label} active={active === id} badge={badge} onClick={() => setActive(id)}>
          <Icon strokeWidth={1.75} />
        </DockItem>
      ))}
      <DockSeparator />
      <DockItem label="Settings" active={active === "settings"} onClick={() => setActive("settings")}>
        <Settings strokeWidth={1.75} />
      </DockItem>
      <DockItem label="Trash" onClick={() => undefined}>
        <Trash2 strokeWidth={1.75} />
      </DockItem>
    </Dock>
  )

  return (
    // The transform keeps fixed docks inside the preview
    <div className="relative h-full w-full self-stretch justify-self-stretch overflow-hidden [transform:translateZ(0)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"

      />
      <p className="absolute inset-x-0 top-8 text-center text-xs text-muted-foreground">Hover the dock · click to bounce · Tab to focus</p>
      {fixed ? dock : <div className="absolute inset-0 grid place-items-center">{dock}</div>}
    </div>
  )
}

// ------------------------------------------------------------------ tweets

const TWEETS: TweetGridItem[] = [
  {
    id: "1",
    author: { name: "Maya Chen", handle: "mayabuilds", verified: true },
    content: "Swapped our hand-rolled modals for @tweenly in an afternoon. The springs just feel right, and the reduced-motion handling is already done. #react",
    date: "Mar 4",
    stats: { replies: 24, reposts: 61, likes: 1240, views: 48200 },
  },
  {
    id: "2",
    author: { name: "Diego Alvarez", handle: "diegoa_dev" },
    content: "Copy, paste, ship. It's shadcn-style so I actually own the code. The dock component alone saved me a weekend.",
    date: "Mar 2",
    media: ["/gallery/01.jpg"],
    stats: { replies: 8, reposts: 19, likes: 342, views: 12100 },
  },
  {
    id: "3",
    author: { name: "Priya Raman", handle: "priyacodes", verified: true },
    content: "Hot take: most UI animation is noise. This library is the rare one where every transition earns its place. Docs at https://tweenly.dev are great too.",
    date: "Feb 27",
    stats: { replies: 57, reposts: 132, likes: 2890, views: 104000 },
  },
  {
    id: "4",
    author: { name: "Tom Becker", handle: "tbecker" },
    content: "Our landing page conversion went up after we added the testimonial wall. Correlation, causation, whatever. It looks sick. #buildinpublic",
    date: "Feb 25",
    stats: { replies: 13, reposts: 22, likes: 518, views: 20400 },
  },
  {
    id: "5",
    author: { name: "Aiko Tanaka", handle: "aiko_ui", verified: true },
    content: "Love that it's just motion + Tailwind. No new runtime, no theme provider, works with the React Compiler out of the box. cc @vercel",
    date: "Feb 21",
    media: ["/gallery/02.jpg", "/gallery/03.jpg"],
    stats: { replies: 31, reposts: 74, likes: 1610, views: 63000 },
  },
  {
    id: "6",
    author: { name: "Sam Okafor", handle: "samokafor" },
    content: "Every component respects prefers-reduced-motion. Accessibility as a default, not an afterthought. More of this please. #a11y",
    date: "Feb 18",
    stats: { replies: 6, reposts: 41, likes: 977, views: 31800 },
  },
]

function TweetDemo({ values }: DemoProps) {
  const props = as<Omit<TweetGridProps, "tweets">>(values)
  return (
    <div className="mc-scroll h-full w-full self-stretch justify-self-stretch overflow-y-auto px-6 py-6">
      <TweetGrid {...props} height={props.scroll ? Math.min(props.height ?? 560, 512) : props.height} tweets={TWEETS} />
    </div>
  )
}

// ------------------------------------------------------------------ orbit

const chip = "flex size-full items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm [&_svg]:size-[46%]"

function OrbitDemo({ values }: DemoProps) {
  const props = as<Omit<OrbitingCirclesProps, "children">>(values)
  const radius = props.radius ?? 160
  return (
    <div className="relative h-full min-h-[480px] w-full self-stretch justify-self-stretch overflow-hidden">
      <OrbitCenter size={76}>
        <span className="flex size-10 items-center justify-center rounded-full bg-[#ff4d12] text-white shadow-[0_0_30px_rgba(255,77,18,0.55)]">
          <Sparkles className="size-5" />
        </span>
      </OrbitCenter>
      <OrbitingCircles
        radius={Math.round(radius * 0.5)}
        duration={(props.duration ?? 20) * 0.6}
        speed={props.speed}
        reverse={!props.reverse}
        delay={props.delay}
        path={props.path}
        iconSize={Math.round((props.iconSize ?? 40) * 0.8)}
        pauseOnHover={props.pauseOnHover}
        itemClassName={chip}
      >
        <Zap />
        <Database />
        <Cloud />
      </OrbitingCircles>
      <OrbitingCircles {...props} itemClassName={chip}>
        <GitBranch />
        <Mail />
        <Code2 />
        <Rocket />
        <Terminal />
        <MessageSquare />
      </OrbitingCircles>
    </div>
  )
}

// ------------------------------------------------------------------ banner

function BannerDemo({ values }: DemoProps) {
  const props = as<BannerProps>(values)
  const [round, setRound] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const isPill = props.variant === "pill"

  return (
    <div className="relative h-full w-full self-stretch justify-self-stretch overflow-hidden [transform:translateZ(0)]">
      <div className="mc-scroll relative h-full overflow-y-auto bg-background text-foreground">
        {!isPill && (
          <Banner
            key={round}
            {...props}
            message="tweenly 0.4 is here: AI components and smooth scroll sections."
            messages={[
              "Tweenly 1.0 is live",
              "New: Dock, Tweet Card, Orbiting Circles",
              "Free and open source, MIT licensed",
              "Works with the React Compiler",
            ]}
            cta={{ label: "Read more", href: "#changelog" }}
            onDismiss={() => setDismissed(true)}
          />
        )}

        <header className="flex items-center justify-between border-b border-border px-6 py-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="size-2.5 rounded-full bg-[#ff4d12]" />
            Acme
          </span>
          <nav className="flex gap-5 text-xs text-muted-foreground">
            <span>Product</span>
            <span>Pricing</span>
            <span>Docs</span>
          </nav>
        </header>

        <section className="mx-auto max-w-xl px-6 pb-24 pt-14 text-center">
          {isPill && (
            <div className="mb-6">
              <Banner
                key={round}
                {...props}
                message="Introducing Orbiting Circles"
                href="#changelog"
                onDismiss={() => setDismissed(true)}
              />
            </div>
          )}
          <h1 className="text-balance text-4xl font-semibold tracking-tight">Ship interfaces that feel alive.</h1>
          <p className="mx-auto mt-4 max-w-md text-balance text-sm leading-relaxed text-muted-foreground">
            A mock landing page so you can see the banner in context. Dismiss it, then bring it back.
          </p>
          {dismissed && (
            <button
              type="button"
              onClick={() => {
                setDismissed(false)
                setRound((r) => r + 1)
              }}
              className="mt-6 rounded-full border border-border bg-foreground/[0.05] px-4 py-1.5 text-xs font-medium transition-colors hover:bg-foreground/[0.1]"
            >
              Show the banner again
            </button>
          )}
          <div className="mt-12 grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 rounded-xl border border-border bg-foreground/[0.03]" />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export const showcaseKitDemos: DemoMap = {
  dock: (p) => <DockDemo {...p} />,
  "tweet-card": (p) => <TweetDemo {...p} />,
  "orbiting-circles": (p) => <OrbitDemo {...p} />,
  banner: (p) => <BannerDemo {...p} />,
}
