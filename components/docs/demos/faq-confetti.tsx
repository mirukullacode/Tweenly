"use client"

import { as, type DemoMap } from "@/components/docs/demo-utils"
import { Faq, type FaqProps } from "@/registry/new-york/faq/faq"
import {
  confetti,
  ConfettiButton,
  type ConfettiButtonProps,
  type ConfettiPreset,
} from "@/registry/new-york/confetti/confetti"

const faqItems: FaqProps["items"] = [
  {
    question: "How does billing work?",
    answer:
      "You're billed monthly or annually per workspace. Invoices are emailed to the billing owner and are always available under Settings, Billing.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Annual plans are fully refundable within 30 days of purchase. Monthly plans can be cancelled anytime and won't renew, but partial months aren't refunded.",
  },
  {
    question: "How do team seats work?",
    answer:
      "Every member with edit access uses a seat. Viewers are free and unlimited. Seats added mid-cycle are prorated to the day.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. Export your entire workspace as JSON or CSV at any time, or use the REST API to sync it into your own warehouse on a schedule.",
  },
  {
    question: "Do you support SSO and SCIM?",
    answer:
      "SAML SSO with Okta, Azure AD and Google Workspace is included on the Business plan, along with SCIM provisioning and enforced login.",
  },
  {
    question: "What happens when I cancel?",
    answer:
      "Your workspace stays active until the end of the paid period, then switches to read-only for 90 days so you can export everything before deletion.",
  },
]

// Options whose documented default is burst-specific. Leaving them at that value lets each preset use its own tuning.
const PRESET_TUNED: Partial<Record<keyof ConfettiButtonProps, number>> = {
  particleCount: 90,
  spread: 70,
  startVelocity: 45,
  duration: 2.5,
}

const others: { preset: ConfettiPreset; label: string }[] = [
  { preset: "cannons", label: "Cannons" },
  { preset: "fireworks", label: "Fireworks" },
  { preset: "rain", label: "Rain" },
  { preset: "stream", label: "Stream" },
  { preset: "pride", label: "Pride" },
]

export const faqConfettiDemos: DemoMap = {
  faq: ({ values }) => {
    const props = as<Omit<FaqProps, "items">>(values)
    return (
      <div className="mc-scroll h-full w-full self-stretch overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-12">
          <Faq {...props} items={faqItems} />
        </div>
      </div>
    )
  },

  confetti: ({ values }) => {
    const raw = as<ConfettiButtonProps>(values)
    const props: ConfettiButtonProps = { ...raw }
    for (const [key, def] of Object.entries(PRESET_TUNED) as [keyof ConfettiButtonProps, number][]) {
      if (props[key] === def) delete props[key]
    }
    const { preset: _preset, ...shared } = props
    void _preset
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border bg-card px-8 py-10 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)]">
        <div className="grid size-12 place-items-center rounded-2xl bg-[#ff4d12]/10 text-2xl" aria-hidden="true">
          🚀
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">You shipped it</h3>
          <p className="text-sm text-muted-foreground">v2.4.0 is live for 12,408 users. Take a second to celebrate.</p>
        </div>
        <ConfettiButton {...props}>Celebrate</ConfettiButton>
        <div className="flex flex-wrap justify-center gap-1.5">
          {others.map((o) => (
            <button
              key={o.preset}
              type="button"
              onClick={() => void confetti({ ...shared, preset: o.preset })}
              className="h-7 rounded-full border bg-foreground/[0.03] px-3 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
            >
              {o.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void confetti({ ...shared, preset: "burst", emoji: ["🎉", "✨", "🧡"], scalar: 1.6, particleCount: 50 })}
            className="h-7 rounded-full border bg-foreground/[0.03] px-3 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
          >
            Emoji
          </button>
        </div>
      </div>
    )
  },
}
