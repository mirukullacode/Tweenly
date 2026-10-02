import type { Metadata } from "next"
import { ForgeTemplate } from "@/components/templates/forge-template"

export const metadata: Metadata = {
  title: "Forge template",
  description:
    "A landing page template for an AI coding agent, built with tweenly animated components and shadcn/ui: feature tabs, animated terminal, code diffs, MCP servers, parallel agents, pricing and FAQ.",
  alternates: { canonical: "/templates/forge" },
}

export default function ForgeTemplatePage() {
  return <ForgeTemplate />
}
