import type { Metadata } from "next"
import Link from "next/link"
import { CodeBlock } from "@/components/docs/code-block"
import { DocPage, InlineCode, P, Section, Step, Steps } from "@/components/docs/doc-page"
import { githubUrl, siteConfig } from "@/lib/docs"

export const metadata: Metadata = {
  title: "Use with AI agents",
  description:
    "Let Claude Code, Cursor, VS Code, Codex or any AI agent find, install and customize tweenly components through the shadcn MCP server and llms.txt.",
  alternates: { canonical: "/docs/ai-agents" },
}

const CLIENTS = ["claude", "cursor", "vscode", "codex", "opencode"] as const

const PROMPTS = [
  "Add the tweenly sticky-reveal footer to my landing page with my site's links.",
  "Use tweenly's chart-bar to show monthly revenue from data/revenue.json, stacked by plan.",
  "Replace my hero background with tweenly's hero-background, dots variant, accent #2b2bd9.",
  "Build a sign-up page with the tweenly auth component, split variant, wired to my /api/signup route.",
  "Add a tweenly page transition to app/layout.tsx and swap my nav links for TransitionLink.",
]

export default function AiAgentsPage() {
  const url = siteConfig.url
  const registries = `{
  "registries": {
    "@tweenly": "${url}/r/{name}.json"
  }
}`

  return (
    <DocPage
      title="Use with AI agents"
      description="tweenly is built to be read by AI. Your coding agent can browse every component, install it with its dependencies, and adapt the props to your project."
    >
      <Section title="Connect your agent in one command">
        <Steps>
          <Step title="Add the shadcn MCP server">
            <P>Run this in your project and pick your client. It writes the MCP config file for you.</P>
            <CodeBlock code={`npx shadcn@latest mcp init --client claude`} lineNumbers={false} />
            <P>
              Supported clients: {CLIENTS.map((c, i) => (
                <span key={c}>
                  <InlineCode>{c}</InlineCode>
                  {i < CLIENTS.length - 1 ? ", " : "."}
                </span>
              ))}
            </P>
          </Step>
          <Step title="Register tweenly">
            <P>
              Add the namespace to <InlineCode>components.json</InlineCode> so the agent can search and install{" "}
              <InlineCode>@tweenly/...</InlineCode> items.
            </P>
            <CodeBlock code={registries} lineNumbers={false} />
          </Step>
          <Step title="Ask in plain words">
            <P>
              Restart your agent, then ask it to list tweenly components or add one. It installs the source into{" "}
              <InlineCode>components/</InlineCode>, along with any npm packages and registry dependencies.
            </P>
          </Step>
        </Steps>
      </Section>

      <Section title="Prompts that work well">
        <P>Name the component, say where it goes, and give the real data or links. The agent fills in the props.</P>
        <ul className="space-y-2">
          {PROMPTS.map((p) => (
            <li key={p} className="rounded-xl border bg-inset px-4 py-3 font-mono text-[12.5px] leading-relaxed">
              {p}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="For agents without MCP">
        <P>
          Point any model at these files. They are plain text, always up to date, and list every component with its
          install command, props and a usage example.
        </P>
        <ul className="space-y-1.5 text-[14.5px]">
          <li>
            <Link href="/llms.txt" className="font-medium underline underline-offset-4">/llms.txt</Link>
            <span className="text-muted-foreground">: index of every page and component</span>
          </li>
          <li>
            <Link href="/llms-full.txt" className="font-medium underline underline-offset-4">/llms-full.txt</Link>
            <span className="text-muted-foreground">: full reference with props and examples</span>
          </li>
        </ul>
      </Section>

      <Section title="Open in v0">
        <P>
          Every component page has an <strong className="text-foreground">Open in v0</strong> button in the install bar. It
          loads the component into v0 so you can keep iterating on it with AI.
        </P>
      </Section>

      <Section title="Contributing with an agent">
        <P>
          The repository ships an <InlineCode>AGENTS.md</InlineCode> with the project rules (file layout, design language,
          lint rules and checks), so Claude Code, Codex and Cursor follow the same conventions as human contributors. See{" "}
          <a href={`${githubUrl}/blob/main/CONTRIBUTING.md`} className="font-medium underline underline-offset-4" target="_blank" rel="noreferrer">
            CONTRIBUTING.md
          </a>{" "}
          to get started.
        </P>
      </Section>
    </DocPage>
  )
}
