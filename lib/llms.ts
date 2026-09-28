import { categories, components, docsNav, githubUrl, importPath, initialValues, registryUrl, siteConfig, usageCode, type ComponentDoc, type PropValue } from "@/lib/docs"

const base = siteConfig.url.replace(/\/$/, "")

export const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8" }

const DOC_SUMMARIES: Record<string, string> = {
  "/docs": "What tweenly is, the design principles and the full component list.",
  "/docs/installation": "Set up shadcn/ui, add components with the CLI and configure the @tweenly registry namespace.",
}

export function componentUrl(doc: ComponentDoc) {
  return `${base}/docs/components/${doc.slug}`
}

function byCategory() {
  return categories
    .map((category) => ({ category, items: components.filter((c) => c.category === category) }))
    .filter((g) => g.items.length > 0)
}

const namespaceConfig = `{
  "registries": {
    "@tweenly": "${base}/r/{name}.json"
  }
}`

function installSection() {
  return `## Installation

tweenly is a shadcn/ui registry. Components are copied into your project (no runtime package). Requires a project already set up with shadcn/ui and Tailwind CSS.

tweenly is listed in the shadcn registry directory, so the CLI resolves the \`@tweenly\` namespace with no setup:

\`\`\`bash
npx shadcn@latest add @tweenly/<slug>
\`\`\`

The full registry URL also works:

\`\`\`bash
npx shadcn@latest add ${base}/r/<slug>.json
\`\`\`

For AI agents, the shadcn MCP server can browse and install tweenly components. Run \`npx shadcn@latest mcp init --client claude\` (or \`cursor\`, \`vscode\`, \`codex\`) and add the namespace to \`components.json\` so the server can search it:

\`\`\`json
${namespaceConfig}
\`\`\`

Components land in \`@/components/<slug>\` and their npm dependencies (for example \`motion\`) are installed automatically.`
}

export function llmsTxt() {
  const docs = docsNav
    .map((d) => `- [${d.title}](${base}${d.href})${DOC_SUMMARIES[d.href] ? `: ${DOC_SUMMARIES[d.href]}` : ""}`)
    .join("\n")

  const groups = byCategory()
    .map(
      ({ category, items }) =>
        `### ${category}\n\n${items.map((c) => `- [${c.name}](${componentUrl(c)}): ${c.description}`).join("\n")}`,
    )
    .join("\n\n")

  return `# ${siteConfig.name}

> ${siteConfig.tagline}. ${siteConfig.description} ${components.length} animated React components (React 19, Tailwind CSS v4, motion) distributed as a shadcn/ui registry.

Each component is a single TypeScript file with typed props and sensible defaults. Every component page has a live playground, a props table and the full source.

## Docs

${docs}
- [Full reference for LLMs](${base}/llms-full.txt): every component with install command, props and a usage example.

${installSection()}

## Components

${groups}

## Optional

- [Source code](${githubUrl})
- [Registry index](${base}/r/registry.json)
`
}

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ")

function formatDefault(v: PropValue | undefined) {
  if (v === undefined) return "-"
  if (Array.isArray(v)) return "`[...]`"
  return `\`${typeof v === "string" ? JSON.stringify(v) : String(v)}\``
}

function componentSection(doc: ComponentDoc) {
  const rows = doc.props
    .map(
      (p) =>
        `| \`${p.name}\`${p.required ? " (required)" : ""} | \`${cell(p.type)}\` | ${formatDefault(p.default)} | ${cell(p.description)} |`,
    )
    .join("\n")

  const deps = doc.dependencies.length ? `\nDependencies: ${doc.dependencies.map((d) => `\`${d}\``).join(", ")}\n` : ""

  return `## ${doc.name}

${doc.description}

- Category: ${doc.category}
- Docs: ${componentUrl(doc)}
- Import: \`import { ${doc.exportName} } from "${importPath(doc)}"\`
${deps}
Install:

\`\`\`bash
npx shadcn@latest add @tweenly/${doc.slug}
# or by URL
npx shadcn@latest add ${registryUrl(doc.slug)}
\`\`\`

Props:

| Name | Type | Default | Description |
| --- | --- | --- | --- |
${rows}

Usage:

\`\`\`tsx
${usageCode(doc, initialValues(doc)).trim()}
\`\`\``
}

export function llmsFullTxt() {
  const body = byCategory()
    .flatMap(({ items }) => items)
    .map(componentSection)
    .join("\n\n---\n\n")

  return `# ${siteConfig.name}

> ${siteConfig.tagline}. ${siteConfig.description}

This file contains the complete reference for all ${components.length} ${siteConfig.name} components. An index is available at ${base}/llms.txt.

${installSection()}

---

${body}
`
}
