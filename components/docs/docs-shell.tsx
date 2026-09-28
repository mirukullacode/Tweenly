"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Menu, PanelLeft, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo, SidebarNav } from "./sidebar"
import { ThemeToggle } from "./theme-toggle"
import { GithubStars } from "@/components/site/github-stars"
import { GuidedTour, TourButton } from "@/components/site/guided-tour"
import { StarPrompt } from "@/components/site/star-prompt"
import { CommandMenu, SearchTrigger } from "./command-menu"

export function DocsShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:h-dvh lg:flex-row lg:overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        data-tour="sidebar"
        className={cn(
          "hidden shrink-0 flex-col transition-[margin] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] lg:flex",
          "w-64",
          !open && "-ml-64"
        )}
      >
        <div className="flex h-16 items-center justify-between pl-[60px] pr-3">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="px-4 pt-3">
          <SearchTrigger />
        </div>
        <div className="mc-scroll flex-1 overflow-y-auto px-4 pt-5">
          <SidebarNav />
        </div>
        <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
          <GithubStars from="sidebar" />
          <TourButton label="Tour" />
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        className="fixed left-3.5 top-3.5 z-40 hidden size-9 place-items-center rounded-xl border bg-panel text-muted-foreground shadow-sm transition-colors hover:text-foreground lg:grid"
      >
        <PanelLeft className="size-4" />
      </button>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <SearchTrigger compact />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="mc-scroll fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r bg-background px-4 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="flex h-14 items-center justify-between px-2">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 px-2 pb-2 pt-1">
                <GithubStars from="mobile-menu" />
              </div>
              <div className="px-2 pt-2">
                <SearchTrigger />
              </div>
              <div className="pt-4">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col p-2 sm:p-3 lg:min-h-0">{children}</main>

      <CommandMenu />
      <GuidedTour />
      <StarPrompt />
    </div>
  )
}
