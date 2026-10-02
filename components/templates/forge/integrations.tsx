"use client"

import {
  Bug,
  Cloud,
  Container,
  CreditCard,
  Database,
  GitBranch,
  MessageSquare,
  PenTool,
  SquareKanban,
  Terminal,
  type LucideIcon,
} from "lucide-react"
import { OrbitCenter, OrbitingCircles } from "@/registry/new-york/orbiting-circles/orbiting-circles"
import { ForgeMark } from "./shared"

const INNER: { icon: LucideIcon; label: string }[] = [
  { icon: GitBranch, label: "Git" },
  { icon: Database, label: "Postgres" },
  { icon: Terminal, label: "CLI" },
  { icon: Bug, label: "Sentry" },
]

const OUTER: { icon: LucideIcon; label: string }[] = [
  { icon: MessageSquare, label: "Slack" },
  { icon: PenTool, label: "Figma" },
  { icon: SquareKanban, label: "Linear" },
  { icon: Cloud, label: "AWS" },
  { icon: Container, label: "Docker" },
  { icon: CreditCard, label: "Stripe" },
]

function Node({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span
      title={label}
      className="grid size-full place-items-center rounded-full border bg-card text-foreground/80 shadow-sm"
    >
      <Icon className="size-[45%]" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Two rings of integrations orbiting the Forge mark. */
export function Integrations() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[420px]">
      <div
        aria-hidden
        className="absolute inset-[18%] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, #ff4d1240, transparent 70%)" }}
      />
      {/* Small screens */}
      <div className="sm:hidden">
        <OrbitingCircles radius={72} duration={24} iconSize={38}>
          {INNER.map((n) => (
            <Node key={n.label} {...n} />
          ))}
        </OrbitingCircles>
        <OrbitingCircles radius={140} duration={36} iconSize={42} reverse startAngle={-60}>
          {OUTER.map((n) => (
            <Node key={n.label} {...n} />
          ))}
        </OrbitingCircles>
      </div>
      {/* sm and up */}
      <div className="hidden sm:block">
        <OrbitingCircles radius={92} duration={24} iconSize={42}>
          {INNER.map((n) => (
            <Node key={n.label} {...n} />
          ))}
        </OrbitingCircles>
        <OrbitingCircles radius={180} duration={36} iconSize={48} reverse startAngle={-60}>
          {OUTER.map((n) => (
            <Node key={n.label} {...n} />
          ))}
        </OrbitingCircles>
      </div>
      <OrbitCenter size={76} className="shadow-[0_10px_40px_-12px_rgba(255,77,18,0.6)]">
        <ForgeMark className="size-9" />
      </OrbitCenter>
    </div>
  )
}
