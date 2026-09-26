import { DocsShell } from "@/components/docs/docs-shell"

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return <DocsShell>{children}</DocsShell>
}
