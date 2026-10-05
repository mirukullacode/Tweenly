import { DocsShell } from "@/components/docs/docs-shell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>
}
