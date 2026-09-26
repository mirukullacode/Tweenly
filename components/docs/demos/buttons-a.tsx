"use client"

import { ArrowRight } from "lucide-react"
import { as, type DemoMap } from "@/components/docs/demo-utils"
import { ShineButton, type ShineButtonProps } from "@/registry/new-york/shine-button/shine-button"
import { RippleButton, type RippleButtonProps } from "@/registry/new-york/ripple-button/ripple-button"
import { HoldButton, type HoldButtonProps } from "@/registry/new-york/hold-button/hold-button"
import { SlideButton, type SlideButtonProps } from "@/registry/new-york/slide-button/slide-button"
import { LikeButton, type LikeButtonProps } from "@/registry/new-york/like-button/like-button"

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground">{children}</p>
)

export const buttonsADemos: DemoMap = {
  "shine-button": ({ values }) => (
    <ShineButton {...as<ShineButtonProps>(values)}>
      Get started
      <ArrowRight className="size-4" />
    </ShineButton>
  ),

  "ripple-button": ({ values }) => (
    <div className="flex flex-col items-center gap-3">
      <RippleButton {...as<RippleButtonProps>(values)} className="h-12 px-8">
        Click me
      </RippleButton>
      <Hint>Click anywhere on the button, rapidly for overlapping ripples</Hint>
    </div>
  ),

  "hold-button": ({ values }) => (
    <div className="flex flex-col items-center gap-3">
      <HoldButton {...as<HoldButtonProps>(values)} />
      <Hint>Press and hold (or hold Space)</Hint>
    </div>
  ),

  "slide-button": ({ values }) => (
    <div className="flex flex-col items-center gap-3">
      <SlideButton {...as<SlideButtonProps>(values)} />
      <Hint>Drag the knob to the end, or focus it and use the arrow keys</Hint>
    </div>
  ),

  "like-button": ({ values }) => (
    <div className="flex flex-col items-center gap-3">
      <LikeButton {...as<LikeButtonProps>(values)} />
      <Hint>Tap the heart</Hint>
    </div>
  ),
}
