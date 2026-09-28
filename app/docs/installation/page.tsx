import type { Metadata } from "next"
import { CodeBlock } from "@/components/docs/code-block"
import { DocPage, InlineCode, P, Section, Step, Steps } from "@/components/docs/doc-page"
import { siteConfig } from "@/lib/docs"

export const metadata: Metadata = {
  title: "Installation",
  description: "Add tweenly components with the shadcn CLI, from an AI agent through the shadcn MCP server, or by copying the source.",
  alternates: { canonical: "/docs/installation" },
}

const MCP_JSON = `{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}`

export default function InstallationPage() {
  const url = siteConfig.url

  return (
    <DocPage
      title="Installation"
      description="tweenly components install like any shadcn component. They drop into your project as source files you can read and edit."
    >
      <Section title="With the shadcn CLI">
        <Steps>
          <Step title="Set up shadcn">
            <P>
              Skip this if your project already has a <InlineCode>components.json</InlineCode>.
            </P>
            <CodeBlock code="npx shadcn@latest init" lineNumbers={false} />
          </Step>
          <Step title="Add a component">
            <P>
              tweenly is listed in the shadcn registry directory, so the CLI knows the <InlineCode>@tweenly</InlineCode>{" "}
              namespace without any setup. Dependencies are installed for you.
            </P>
            <CodeBlock code="npx shadcn@latest add @tweenly/fade-in" lineNumbers={false} />
            <P>Add several at once by listing them:</P>
            <CodeBlock code="npx shadcn@latest add @tweenly/fade-in @tweenly/marquee @tweenly/chart-line" lineNumbers={false} />
          </Step>
          <Step title="Use it">
            <CodeBlock
              code={`import { FadeIn } from "@/components/fade-in"

export default function Page() {
  return (
    <FadeIn direction="up" blur={8}>
      <h1>Hello, world</h1>
    </FadeIn>
  )
}`}
            />
          </Step>
        </Steps>
      </Section>

      <Section title="With an AI agent">
        <P>
          Claude Code, Cursor, VS Code and Codex can browse and install tweenly components through the shadcn MCP
          server. Ask in plain language, for example &ldquo;add a tweenly text reveal to the hero&rdquo;.
        </P>
        <Steps>
          <Step title="Register the namespace">
            <P>
              Add <InlineCode>@tweenly</InlineCode> to <InlineCode>components.json</InlineCode> so the MCP server can search it
              alongside your other registries.
            </P>
            <CodeBlock
              code={`{
  "registries": {
    "@tweenly": "${url}/r/{name}.json"
  }
}`}
            />
          </Step>
          <Step title="Connect your agent">
            <P>Run the command for your client. It writes the MCP config into your project.</P>
            <CodeBlock
              code={`# Claude Code (.mcp.json)
npx shadcn@latest mcp init --client claude

# Cursor (.cursor/mcp.json)
npx shadcn@latest mcp init --client cursor

# VS Code with Copilot (.vscode/mcp.json)
npx shadcn@latest mcp init --client vscode

# Codex (prints the snippet for ~/.codex/config.toml)
npx shadcn@latest mcp init --client codex`}
              lineNumbers={false}
            />
          </Step>
          <Step title="Or add it by hand">
            <P>
              Any MCP client works with the same server. For Claude Code, save this as <InlineCode>.mcp.json</InlineCode>{" "}
              in the project root, or run <InlineCode>claude mcp add shadcn -- npx shadcn@latest mcp</InlineCode>.
            </P>
            <CodeBlock code={MCP_JSON} />
          </Step>
          <Step title="Ask for a component">
            <P>
              Restart the agent and check the server is connected (<InlineCode>/mcp</InlineCode> in Claude Code). Then try:
            </P>
            <CodeBlock
              code={`Show me all the button components in @tweenly
Add @tweenly/text-reveal to the hero and split it by word
Build a pricing section with @tweenly/number-ticker and @tweenly/fill-button`}
              lineNumbers={false}
            />
          </Step>
        </Steps>
        <P>
          Agents without MCP can read the docs as plain text: point them at{" "}
          <a href="/llms.txt" className="underline underline-offset-4">/llms.txt</a> for the index or{" "}
          <a href="/llms-full.txt" className="underline underline-offset-4">/llms-full.txt</a> for every component&apos;s props
          and usage.
        </P>
      </Section>

      <Section title="By URL">
        <P>Every component is also a plain registry item you can install by URL, which works with any shadcn version.</P>
        <CodeBlock code={`npx shadcn@latest add ${url}/r/fade-in.json`} lineNumbers={false} />
      </Section>

      <Section title="Manual">
        <P>
          Install the component&apos;s dependencies, then copy the code from its Source tab into{" "}
          <InlineCode>components/</InlineCode>. Most components only need Motion. Fill Button and
          Sticky Cards use GSAP.
        </P>
        <CodeBlock code="npm install motion" lineNumbers={false} />
        <P>
          Components import <InlineCode>cn</InlineCode> from <InlineCode>@/lib/utils</InlineCode>, which
          shadcn projects already include.
        </P>
      </Section>

      <Section title="Reduced motion">
        <P>
          Every component checks <InlineCode>prefers-reduced-motion</InlineCode>. When it is set,
          movement, blur and scale are removed and only a short opacity fade (or the final state) remains.
          You don&apos;t need to do anything extra.
        </P>
      </Section>
    </DocPage>
  )
}
