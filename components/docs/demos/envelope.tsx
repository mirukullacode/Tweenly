"use client"

import { useState } from "react"
import { as, type DemoMap } from "@/components/docs/demo-utils"
import {
  Envelope,
  EnvelopeComposer,
  type EnvelopeComposerProps,
  type EnvelopeProps,
} from "@/registry/new-york/envelope/envelope"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function Invite({ serif }: { serif: boolean }) {
  return (
    <div className="space-y-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-60">Together with their families</p>
      <p className={serif ? "font-serif text-2xl italic leading-tight" : "text-2xl font-semibold leading-tight tracking-tight"}>
        Maya &amp; Jonah
      </p>
      <p className="text-[13px] leading-snug opacity-80">
        request the pleasure of your company
        <br />
        Saturday, 12 June · 4 pm · Lisbon
      </p>
      <p className="pt-1 text-[11px] font-medium uppercase tracking-[0.2em] opacity-60">RSVP by 1 May</p>
    </div>
  )
}

function RevealDemo({ props }: { props: EnvelopeProps }) {
  const [open, setOpen] = useState(props.defaultOpen ?? false)
  const manual = props.trigger === "manual"
  const variant = props.variant ?? "classic"

  return (
    <div className="flex flex-col items-center gap-5 px-6 pt-10">
      <Envelope {...props} {...(manual ? { open, onOpenChange: setOpen } : {})}>
        <Invite serif={variant === "classic"} />
      </Envelope>
      {manual ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full border bg-panel px-4 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent"
        >
          {open ? "Close" : "Open"} envelope
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">
          {props.trigger === "hover" ? "Hover" : props.trigger === "inView" ? "Opens when scrolled into view" : "Click"}
          {props.trigger === "inView" ? "" : " the envelope to open it"}
        </p>
      )}
    </div>
  )
}

export const envelopeDemos: DemoMap = {
  envelope: ({ values }) => {
    const props = as<EnvelopeComposerProps>(values)
    return (
      <div className="flex w-full flex-col items-center gap-4 px-6">
        <EnvelopeComposer
          {...props}
          onSend={async (v) => {
            await wait(900)
            if (/\bfail\b/i.test(v.message)) throw new Error("Couldn't send. Try again.")
          }}
        />
        <p className="text-xs text-muted-foreground">
          Include the word <span className="font-mono text-foreground">fail</span> in your message to see the error path
        </p>
      </div>
    )
  },
  "envelope-reveal": ({ values }) => <RevealDemo props={as<EnvelopeProps>(values)} />,
}
