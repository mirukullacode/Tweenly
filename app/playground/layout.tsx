import { DocsShell } from "@/components/docs/docs-shell"

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>
}
