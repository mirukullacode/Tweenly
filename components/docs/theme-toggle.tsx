"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement
    const apply = () => {
      const dark = !root.classList.contains("dark")
      root.classList.toggle("dark", dark)
      localStorage.setItem("theme", dark ? "dark" : "light")
    }
    // Cross-fade the whole page when the browser supports it
    if (document.startViewTransition) document.startViewTransition(apply)
    else apply()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        "relative grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
    >
      <Sun className="size-4 scale-100 transition-transform dark:scale-0" />
      <Moon className="absolute size-4 scale-0 transition-transform dark:scale-100" />
    </button>
  )
}
