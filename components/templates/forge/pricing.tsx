"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SegmentedControl } from "@/registry/new-york/segmented-control/segmented-control"
import { Stagger } from "@/registry/new-york/stagger/stagger"
import { useReducedMotion } from "@/registry/new-york/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"
import { ACCENT, ENTER } from "./shared"

const PLANS = [
  {
    name: "Free",
    monthly: 0,
    description: "For side projects and trying Forge on real code.",
    cta: "Start for free",
    features: ["1 connected repository", "200 agent requests / month", "Code generation & review", "Community support"],
  },
  {
    name: "Startup",
    monthly: 12,
    popular: true,
    description: "For small teams shipping every day.",
    cta: "Start 14-day trial",
    features: [
      "Unlimited repositories",
      "Parallel agents (up to 3)",
      "Auto testing & deploy checks",
      "All MCP integrations",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    monthly: 24,
    description: "For organizations with security and scale needs.",
    cta: "Contact sales",
    features: ["Everything in Startup", "Unlimited parallel agents", "SSO, SCIM & audit logs", "Self-hosted runners", "Dedicated success engineer"],
  },
]

export function Pricing() {
  const reduced = useReducedMotion()
  const [cycle, setCycle] = useState("monthly")
  const annual = cycle === "annually"

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex items-center gap-3">
        <SegmentedControl
          aria-label="Billing cycle"
          size="sm"
          value={cycle}
          onValueChange={setCycle}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "annually", label: "Annually" },
          ]}
        />
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color: ACCENT, backgroundColor: `${ACCENT}1a` }}
        >
          Save 20%
        </span>
      </div>

      <Stagger className="grid w-full gap-4 md:grid-cols-3" itemClassName="flex" stagger={0.1}>
        {PLANS.map((plan) => {
          const price = annual ? Math.round(plan.monthly * 0.8 * 100) / 100 : plan.monthly
          return (
            <Card
              key={plan.name}
              className={cn(
                "relative w-full rounded-3xl py-6 [--card-spacing:--spacing(6)]",
                plan.popular && "ring-2 ring-[#ff4d12] md:-my-3 md:py-9"
              )}
            >
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">{plan.name}</CardTitle>
                  {plan.popular && (
                    <Badge className="border-transparent text-white" style={{ backgroundColor: ACCENT }}>
                      Popular
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="relative inline-flex overflow-hidden text-5xl font-semibold tracking-tight tabular-nums">
                    $
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={price}
                        initial={{ y: "60%", opacity: 0 }}
                        animate={{ y: "0%", opacity: 1 }}
                        exit={{ y: "-60%", opacity: 0 }}
                        transition={{ duration: reduced ? 0 : 0.4, ease: ENTER }}
                      >
                        {Number.isInteger(price) ? price : price.toFixed(2)}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="text-sm text-muted-foreground">/ user / month</span>
                </div>
                <p className="h-4 text-xs text-muted-foreground">
                  {plan.monthly === 0 ? "Free forever" : annual ? "Billed annually" : "Billed monthly"}
                </p>
              </CardHeader>
              <CardContent className="relative flex-1">
                <Separator className="mb-5" />
                <ul className="flex flex-col gap-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full"
                        style={{ backgroundColor: plan.popular ? ACCENT : undefined }}
                      >
                        <Check
                          className={cn("size-3", plan.popular ? "text-white" : "text-foreground/70")}
                          strokeWidth={3}
                        />
                      </span>
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="relative border-0 bg-transparent">
                <a
                  href="#get-started"
                  className={cn(
                    buttonVariants({ variant: plan.popular ? "default" : "outline", size: "lg" }),
                    "h-10 w-full rounded-xl"
                  )}
                >
                  {plan.cta}
                </a>
              </CardFooter>
            </Card>
          )
        })}
      </Stagger>
    </div>
  )
}
