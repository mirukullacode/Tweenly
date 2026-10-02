"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ChevronRight } from "lucide-react"
import { categories, components, docsNav, type Category } from "@/lib/docs"
import { latestRelease } from "@/lib/changelog"
import { cn } from "@/lib/utils"
import { CATEGORY_ICONS } from "./category-icon"
import { LogoMark } from "@/components/site/logo-mark"

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="tweenly home" className={cn("flex items-center gap-2 text-[15px] font-semibold tracking-tight", className)}>
      <LogoMark playOnNavigate />
      tweenly
    </Link>
  )
}

function NavLink({ href, active, children, onNavigate }: {
  href: string
  active: boolean
  children: React.ReactNode
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-2 py-[7px] pl-5 text-[13.5px] transition-colors",
        active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-indicator"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="absolute -left-px top-[calc(50%-1rem)] h-4 w-3 rounded-bl-md border-b border-l border-dashed border-brand"
        />
      )}
      {children}
    </Link>
  )
}

const NAV_KEY = "tweenly:nav"
const newIds = new Set(latestRelease.added ?? [])

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const activeCategory = components.find((c) => pathname === `/docs/components/${c.slug}`)?.category
  // Only explicit user choices are stored; everything else defaults to "open if it holds the current page"
  const [toggled, setToggled] = useState<Partial<Record<Category, boolean>>>({})

  useEffect(() => {
    let saved: Partial<Record<Category, boolean>> = {}
    try {
      saved = JSON.parse(localStorage.getItem(NAV_KEY) ?? "{}")
    } catch {}
    Promise.resolve().then(() => setToggled(saved))
  }, [])

  const isOpen = (c: Category) => toggled[c] ?? c === activeCategory
  const persist = (next: Partial<Record<Category, boolean>>) => {
    setToggled(next)
    localStorage.setItem(NAV_KEY, JSON.stringify(next))
  }
  const toggle = (c: Category) => persist({ ...toggled, [c]: !isOpen(c) })
  const allOpen = categories.every(isOpen)
  const setAll = (open: boolean) => persist(Object.fromEntries(categories.map((c) => [c, open])))

  return (
    <nav className="space-y-7 pb-10">
      <div>
        <p className="mb-2 px-2 text-sm font-medium text-foreground">Getting started</p>
        <div className="ml-2 border-l border-dashed">
          {docsNav.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href} onNavigate={onNavigate}>
              {item.title}
              {item.badge && (
                <span className="rounded-full bg-brand/12 px-1.5 py-px font-mono text-[10px] font-medium text-brand">
                  v{item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-sm font-medium text-foreground">
            Components <span className="ml-1 font-mono text-[11px] font-normal text-muted-foreground">{components.length}</span>
          </p>
          <button
            type="button"
            onClick={() => setAll(!allOpen)}
            className="rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        <div className="space-y-0.5">
          {categories.map((category) => {
            const items = components.filter((c) => c.category === category)
            const open = isOpen(category)
            const current = category === activeCategory
            const fresh = items.some((c) => newIds.has(c.slug))
            const Icon = CATEGORY_ICONS[category]
            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => toggle(category)}
                  aria-expanded={open}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] transition-colors hover:bg-accent/70",
                    current || open ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md border transition-colors",
                      current ? "border-brand/30 bg-brand/10 text-brand" : "bg-panel/60 text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="flex-1 text-left font-medium">{category}</span>
                  {fresh && !open && <span className="size-1.5 rounded-full bg-brand" aria-label="Has new components" />}
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground/70">{items.length}</span>
                  <ChevronRight
                    className={cn("size-3.5 text-muted-foreground/60 transition-transform duration-300", open && "rotate-90")}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mb-2 ml-[1.15rem] mt-0.5 border-l border-dashed">
                        {items.map((c) => {
                          const href = `/docs/components/${c.slug}`
                          return (
                            <NavLink key={c.slug} href={href} active={pathname === href} onNavigate={onNavigate}>
                              {/* The group already says "Charts", so "Chart Line" reads as "Line" */}
                              {c.name.replace(/^Chart /, "")}
                              {newIds.has(c.slug) && (
                                <span className="rounded-full bg-brand/12 px-1.5 py-px text-[10px] font-medium text-brand">
                                  New
                                </span>
                              )}
                            </NavLink>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
