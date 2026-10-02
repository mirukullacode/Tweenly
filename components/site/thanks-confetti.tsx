"use client"

import { Confetti } from "@/registry/new-york/confetti/confetti"

export function ThanksConfetti() {
  return <Confetti trigger="mount" preset="cannons" />
}
