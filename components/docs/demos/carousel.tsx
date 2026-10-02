"use client"

import { as, ScrollStage, type DemoMap } from "@/components/docs/demo-utils"
import { SmoothScroll } from "@/registry/new-york/smooth-scroll/smooth-scroll"
import {
  CurvedCarousel,
  type CurvedCarouselImage,
  type CurvedCarouselProps,
} from "@/registry/new-york/curved-carousel/curved-carousel"

// Drop your images into public/gallery/ as 01.jpg … 10.jpg. Missing files render as color posters.
const IMAGES: CurvedCarouselImage[] = [
  { src: "/gallery/01.jpg", title: "Opening Night", caption: "Main stage, 21:00" },
  { src: "/gallery/02.jpg", title: "Neon Garden", caption: "Light installation" },
  { src: "/gallery/03.jpg", title: "Bass Pier", caption: "Late set by the water" },
  { src: "/gallery/04.jpg", title: "Sunrise Club", caption: "Ambient until dawn" },
  { src: "/gallery/05.jpg", title: "Street Food", caption: "Forty stalls, one square" },
  { src: "/gallery/06.jpg", title: "Skate Bowl", caption: "Open session" },
  { src: "/gallery/07.jpg", title: "Poster Wall", caption: "Print studio" },
  { src: "/gallery/08.jpg", title: "Night Market", caption: "Vinyl and zines" },
  { src: "/gallery/09.jpg", title: "Big Wheel", caption: "Best view in town" },
  { src: "/gallery/10.jpg", title: "Last Dance", caption: "Closing set" },
]

type Props = Omit<CurvedCarouselProps, "images">

export const carouselDemos: DemoMap = {
  "curved-carousel": ({ values }) => {
    const props = as<Props>(values)
    if ((props.mode ?? "scroll") === "scroll") {
      return (
        <ScrollStage>
          {(scroller) => (
            <SmoothScroll wrapper={scroller}>
              <CurvedCarousel {...props} images={IMAGES} scroller={scroller} height="100cqh" />
            </SmoothScroll>
          )}
        </ScrollStage>
      )
    }
    return (
      <div className="grid h-full w-full place-items-center self-stretch justify-self-stretch [container-type:size]">
        <CurvedCarousel {...props} images={IMAGES} height="100cqh" />
      </div>
    )
  },
}
