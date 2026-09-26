"use client"

import { useState } from "react"
import {
  ArrowUpRight,
  Box,
  Command,
  Feather,
  Gauge,
  Layers,
  MousePointer2,
  Orbit,
  Sparkles,
  Spline,
  Waves,
  Zap,
} from "lucide-react"
import { as, ScrollStage, type DemoProps } from "./demo-utils"
import { buttonsADemos } from "./demos/buttons-a"
import { buttonsBDemos } from "./demos/buttons-b"
import { navbarDemos } from "./demos/navbar"
import { tocDemos } from "./demos/toc"
import { otpDemos } from "./demos/otp"
import { chartsCartesianDemos } from "./demos/charts-cartesian"
import { chartsPolarDemos } from "./demos/charts-polar"
import { chartsStatsDemos } from "./demos/charts-stats"
import { preloaderDemos } from "./demos/preloader"
import { FadeIn, type FadeInProps } from "@/registry/new-york/fade-in/fade-in"
import { TextReveal, type TextRevealProps } from "@/registry/new-york/text-reveal/text-reveal"
import { Typewriter, type TypewriterProps } from "@/registry/new-york/typewriter/typewriter"
import { WordRotate, type WordRotateProps } from "@/registry/new-york/word-rotate/word-rotate"
import { ShimmerText, type ShimmerTextProps } from "@/registry/new-york/shimmer-text/shimmer-text"
import { NumberTicker, type NumberTickerProps } from "@/registry/new-york/number-ticker/number-ticker"
import { FillButton, type FillButtonProps } from "@/registry/new-york/fill-button/fill-button"
import { Magnetic, type MagneticProps } from "@/registry/new-york/magnetic/magnetic"
import { TiltCard, type TiltCardProps } from "@/registry/new-york/tilt-card/tilt-card"
import { SpotlightCard, type SpotlightCardProps } from "@/registry/new-york/spotlight-card/spotlight-card"
import { Stagger, type StaggerProps } from "@/registry/new-york/stagger/stagger"
import { Marquee, type MarqueeProps } from "@/registry/new-york/marquee/marquee"
import {
  StickyCards,
  type StickyCardItem,
  type StickyCardsProps,
} from "@/registry/new-york/cards/sticky-cards"
import {
  ScrollTextReveal,
  type ScrollTextRevealProps,
} from "@/registry/new-york/scroll-text-reveal/scroll-text-reveal"
import {
  HorizontalScroll,
  type HorizontalScrollItem,
  type HorizontalScrollProps,
} from "@/registry/new-york/horizontal-scroll/horizontal-scroll"
import {
  ImageReveal,
  type ImageRevealItem,
  type ImageRevealProps,
} from "@/registry/new-york/image-reveal/image-reveal"
import { AsciiImage, type AsciiImageProps } from "@/registry/new-york/ascii-image/ascii-image"
import { HoverMedia, type HoverMediaProps } from "@/registry/new-york/hover-media/hover-media"
import { Cursor, type CursorProps } from "@/registry/new-york/cursor/cursor"
import { ImageFan, type ImageFanProps } from "@/registry/new-york/image-fan/image-fan"
import { ImageArc, type ImageArcProps } from "@/registry/new-york/image-arc/image-arc"
import { ExpandGallery, type ExpandGalleryProps } from "@/registry/new-york/expand-gallery/expand-gallery"
import { ScrollFocus, type ScrollFocusProps } from "@/registry/new-york/scroll-focus/scroll-focus"
import { Loader, type LoaderProps } from "@/registry/new-york/loader/loader"
import { DownloadButton, type DownloadButtonProps } from "@/registry/new-york/download-button/download-button"

const FEATURES = [
  { icon: Zap, label: "Springs" },
  { icon: Feather, label: "Easing" },
  { icon: Layers, label: "Layout" },
  { icon: Orbit, label: "Gestures" },
  { icon: Waves, label: "Scroll" },
  { icon: Spline, label: "Paths" },
]

// Drop your images into public/sticky-cards/ as 01.jpg … 05.jpg
const STICKY_CARDS: StickyCardItem[] = [
  { id: "card-1", tag: "01 / Code Review", title: "Review every PR with agents that know your standards", image: "/sticky-cards/01.jpg" },
  { id: "card-2", tag: "02 / Test Coverage", title: "Coverage that climbs, suites that stay green", image: "/sticky-cards/02.jpg" },
  { id: "card-3", tag: "03 / Migrations", title: "Modernizations as a program, not a weekend project", image: "/sticky-cards/03.jpg" },
  { id: "card-4", tag: "04 / Automations", title: "Recurring engineering work as a repeatable workflow", image: "/sticky-cards/04.jpg" },
  { id: "card-5", tag: "05 / Team Standards", title: "Your best workflow becomes everyone's default", image: "/sticky-cards/05.jpg" },
]

const GALLERY: HorizontalScrollItem[] = [
  { src: "https://picsum.photos/id/1015/800/1000", alt: "River valley", caption: "River valley" },
  { src: "https://picsum.photos/id/1016/800/1000", alt: "Canyon", caption: "Canyon" },
  { src: "https://picsum.photos/id/1018/800/1000", alt: "Mountains", caption: "Mountains" },
  { src: "https://picsum.photos/id/1019/800/1000", alt: "Coastline", caption: "Coastline" },
  { src: "https://picsum.photos/id/1022/800/1000", alt: "Northern lights", caption: "Northern lights" },
  { src: "https://picsum.photos/id/1039/800/1000", alt: "Waterfall", caption: "Waterfall" },
]

const REVEAL_IMAGES: ImageRevealItem[] = [
  { src: "https://picsum.photos/id/1040/800/600", alt: "Castle", from: "left" },
  { src: "https://picsum.photos/id/1041/800/600", alt: "Forest", from: "right" },
  { src: "https://picsum.photos/id/1043/1600/600", alt: "Hills", from: "bottom", span: 2 },
  { src: "https://picsum.photos/id/1044/800/600", alt: "Sea", from: "top" },
  { src: "https://picsum.photos/id/1047/800/600", alt: "City", from: "scale" },
  { src: "https://picsum.photos/id/1048/800/600", alt: "Street", from: "left" },
  { src: "https://picsum.photos/id/1049/800/600", alt: "Shore", from: "right" },
]

function CursorDemo({ values }: DemoProps) {
  const [area, setArea] = useState<HTMLDivElement | null>(null)

  return (
    <div ref={setArea} className="grid h-full w-full self-stretch justify-self-stretch place-items-center">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-2xl font-medium tracking-tight sm:text-3xl">Move your cursor around</p>
        <p className="text-sm text-muted-foreground">Hover the buttons, press and hold to squeeze.</p>
        <div className="flex gap-2">
          <button type="button" className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
            Get started
          </button>
          <a href="#" onClick={(e) => e.preventDefault()} className="rounded-full border px-5 py-2.5 text-sm font-medium">
            Learn more
          </a>
        </div>
      </div>
      <Cursor {...as<CursorProps>(values)} container={area} />
    </div>
  )
}

// Your own images: drop them into public/gallery/ as 01.jpg … 10.jpg.
// Until then each slot shows a tinted placeholder.
const LOCAL_GALLERY = Array.from({ length: 10 }, (_, i) => ({
  src: `/gallery/${String(i + 1).padStart(2, "0")}.jpg`,
  alt: `Gallery image ${i + 1}`,
}))
const FOCUS_TITLES = ["Everything", "Horizon", "Synchrodogs", "Dune", "Meadow", "Cultivator", "Tide", "Ember"]
const FOCUS_ITEMS = FOCUS_TITLES.map((title, i) => ({ ...LOCAL_GALLERY[i], title }))

const baseDemos: Record<string, (props: DemoProps) => React.ReactNode> = {
  "fade-in": ({ values }) => (
    <FadeIn {...as<Omit<FadeInProps, "children">>(values)}>
      <div className="w-72 rounded-2xl border bg-card p-6 shadow-xl shadow-black/5">
        <div className="mb-8 grid size-9 place-items-center rounded-xl bg-foreground text-background">
          <Sparkles className="size-4" />
        </div>
        <p className="font-medium">Hello, motioncn</p>
        <p className="mt-1 text-sm text-muted-foreground">Tweak the controls and watch it replay.</p>
      </div>
    </FadeIn>
  ),

  "text-reveal": ({ values }) => (
    <TextReveal
      {...as<TextRevealProps>(values)}
      as="h2"
      className="max-w-xl px-6 text-center text-3xl font-semibold tracking-tight sm:text-5xl"
    />
  ),

  typewriter: ({ values }) => (
    <p className="px-6 text-center text-3xl font-semibold tracking-tight sm:text-5xl">
      <span className="text-muted-foreground">We </span>
      <Typewriter
        {...as<Omit<TypewriterProps, "words">>(values)}
        words={["design", "develop", "deploy"]}
        cursorClassName="text-brand"
      />
    </p>
  ),

  "word-rotate": ({ values }) => (
    <p className="px-6 text-center text-3xl font-semibold tracking-tight sm:text-5xl">
      <span className="text-muted-foreground">Build interfaces that feel </span>
      <WordRotate {...as<Omit<WordRotateProps, "words">>(values)} words={["fast", "fluid", "alive"]} />
    </p>
  ),

  "shimmer-text": ({ values }) => (
    <ShimmerText
      {...as<Omit<ShimmerTextProps, "children">>(values)}
      className="px-6 text-center text-3xl font-semibold tracking-tight sm:text-5xl"
    >
      Generating response…
    </ShimmerText>
  ),

  "number-ticker": ({ values }) => (
    <div className="text-center">
      <NumberTicker
        {...as<NumberTickerProps>(values)}
        className="text-6xl font-semibold tracking-tighter sm:text-7xl"
      />
      <p className="mt-3 text-sm text-muted-foreground">installs this month</p>
    </div>
  ),

  "fill-button": ({ values }) => (
    <FillButton {...as<FillButtonProps>(values)}>Hover me</FillButton>
  ),

  magnetic: ({ values }) => (
    <Magnetic {...as<Omit<MagneticProps, "children">>(values)}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full bg-foreground py-3 pl-6 pr-4 text-sm font-medium text-background"
      >
        Get started
        <span className="grid size-6 place-items-center rounded-full bg-background/15">
          <ArrowUpRight className="size-3.5" />
        </span>
      </button>
    </Magnetic>
  ),

  "tilt-card": ({ values }) => (
    <TiltCard {...as<Omit<TiltCardProps, "children">>(values)} className="border border-white/10">
      <div className="relative flex h-80 w-60 flex-col justify-between overflow-hidden bg-[radial-gradient(120%_90%_at_20%_0%,#3a2a22_0%,#161616_55%,#0c0c0c_100%)] p-5 text-white">
        <div className="mc-dots absolute inset-0 opacity-60 [--foreground:#fff]" />
        <div className="relative flex items-center justify-between text-xs text-white/60">
          <span className="font-mono">MC—01</span>
          <Box className="size-4" />
        </div>
        <div className="relative">
          <div className="mb-4 size-14 rounded-full bg-gradient-to-br from-[#ff8a4c] to-[#ff5a1f] shadow-[0_0_60px_-5px_#ff6a2b]" />
          <p className="text-lg font-semibold">Depth, on hover.</p>
          <p className="text-sm text-white/55">Move your cursor across the card.</p>
        </div>
      </div>
    </TiltCard>
  ),

  "spotlight-card": ({ values }) => (
    <SpotlightCard {...as<Omit<SpotlightCardProps, "children">>(values)} className="w-80">
      <div className="p-6">
        <div className="mb-10 grid size-10 place-items-center rounded-xl border bg-background">
          <MousePointer2 className="size-4" />
        </div>
        <p className="font-medium">Follow the light</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          The spotlight and border glow track your pointer across the surface.
        </p>
      </div>
    </SpotlightCard>
  ),

  stagger: ({ values }) => (
    <Stagger {...as<Omit<StaggerProps, "children">>(values)} className="grid grid-cols-3 gap-3">
      {FEATURES.map(({ icon: Icon, label }) => (
        <div key={label} className="flex size-28 flex-col justify-between rounded-2xl border bg-card p-4 sm:size-32">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
      ))}
    </Stagger>
  ),

  marquee: ({ values }) => (
    <Marquee
      {...as<Omit<MarqueeProps, "children">>(values)}
      className={values.vertical ? "h-80 w-64" : "w-full max-w-3xl"}
    >
      {[
        { icon: Command, label: "Keyboard" },
        { icon: Gauge, label: "Performance" },
        ...FEATURES,
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2 whitespace-nowrap rounded-full border bg-card px-4 py-2.5 text-sm">
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </div>
      ))}
    </Marquee>
  ),

  "sticky-cards": ({ values }) => (
    <ScrollStage>
      {(scroller) => (
        <StickyCards
          {...as<Omit<StickyCardsProps, "cards">>(values)}
          cards={STICKY_CARDS}
          scroller={scroller}
          height="100cqh"
        />
      )}
    </ScrollStage>
  ),

  "scroll-text-reveal": ({ values }) => (
    <ScrollStage>
      {(scroller) => (
        <ScrollTextReveal {...as<ScrollTextRevealProps>(values)} scroller={scroller} height="100cqh" />
      )}
    </ScrollStage>
  ),

  "horizontal-scroll": ({ values }) => (
    <ScrollStage>
      {(scroller) => (
        <HorizontalScroll
          {...as<Omit<HorizontalScrollProps, "items">>(values)}
          items={GALLERY}
          itemWidth="min(42cqw, 360px)"
          scroller={scroller}
          height="100cqh"
        />
      )}
    </ScrollStage>
  ),

  "image-reveal": ({ values }) => (
    <ScrollStage>
      {(scroller) => (
        <div className="mx-auto w-full max-w-2xl px-6">
          <ImageReveal {...as<Omit<ImageRevealProps, "images">>(values)} images={REVEAL_IMAGES} scroller={scroller} />
        </div>
      )}
    </ScrollStage>
  ),

  cursor: CursorDemo,

  "image-fan": ({ values }) => (
    <ImageFan {...as<Omit<ImageFanProps, "images">>(values)} images={LOCAL_GALLERY.slice(0, 8)} />
  ),

  "image-arc": ({ values }) =>
    values.mode === "scroll" ? (
      <ScrollStage>
        {(scroller) => (
          <ImageArc {...as<Omit<ImageArcProps, "images">>(values)} images={LOCAL_GALLERY} scroller={scroller} />
        )}
      </ScrollStage>
    ) : (
      <ImageArc {...as<Omit<ImageArcProps, "images">>(values)} images={LOCAL_GALLERY} />
    ),

  "expand-gallery": ({ values }) => (
    <ScrollStage>
      {(scroller) => (
        <ExpandGallery
          {...as<Omit<ExpandGalleryProps, "images">>(values)}
          images={LOCAL_GALLERY.slice(0, 6)}
          scroller={scroller}
          height="100cqh"
        />
      )}
    </ScrollStage>
  ),

  "scroll-focus": ({ values }) => (
    <ScrollStage>
      {(scroller) => (
        <ScrollFocus
          {...as<Omit<ScrollFocusProps, "items">>(values)}
          items={FOCUS_ITEMS}
          scroller={scroller}
          height="100cqh"
        />
      )}
    </ScrollStage>
  ),

  loader: ({ values }) => <Loader {...as<LoaderProps>(values)} />,

  "download-button": ({ values }) => <DownloadButton {...as<DownloadButtonProps>(values)} />,

  "ascii-image": ({ values }) => (
    <div className="flex w-full max-w-3xl flex-col items-center gap-3 px-6">
      <AsciiImage
        {...as<Omit<AsciiImageProps, "src" | "alt">>(values)}
        src="https://picsum.photos/id/1036/1200/700"
        alt="Snowy mountain landscape"
        className="aspect-[12/7] w-full"
      />
      <p className="text-xs text-muted-foreground">Move your cursor over the image</p>
    </div>
  ),

  "hover-media": ({ values }) => {
    const props = as<Omit<HoverMediaProps, "children" | "src">>(values)
    return (
      <p className="max-w-2xl px-8 text-center text-3xl font-medium leading-snug tracking-tight sm:text-4xl">
        We craft{" "}
        <HoverMedia {...props} src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4">
          motion
        </HoverMedia>{" "}
        for teams who sweat the{" "}
        <HoverMedia {...props} src="https://picsum.photos/id/1062/600/450" alt="Details">
          details
        </HoverMedia>{" "}
        and ship{" "}
        <HoverMedia {...props} src="https://picsum.photos/id/1043/600/450" alt="Landscape">
          beautiful
        </HoverMedia>{" "}
        interfaces.
      </p>
    )
  },
}

export const demos: Record<string, (props: DemoProps) => React.ReactNode> = {
  ...baseDemos,
  ...buttonsADemos,
  ...buttonsBDemos,
  ...navbarDemos,
  ...tocDemos,
  ...otpDemos,
  ...chartsCartesianDemos,
  ...chartsPolarDemos,
  ...chartsStatsDemos,
  ...preloaderDemos,
}
