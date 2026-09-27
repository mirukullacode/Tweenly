import { NotFound } from "@/registry/new-york/not-found/not-found"

export default function NotFoundPage() {
  return (
    <NotFound
      variant="eyes"
      primaryAction={{ label: "Back home", href: "/" }}
      secondaryAction={{ label: "Browse docs", href: "/docs" }}
      className="min-h-dvh flex-1"
    />
  )
}
