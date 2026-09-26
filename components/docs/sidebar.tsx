"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { categories, components, docsNav } from "@/lib/docs"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-[15px] font-semibold tracking-tight", className)}>
      <span className="relative grid size-6 place-items-center overflow-hidden rounded-[7px] bg-foreground">
        <span className="absolute size-3 translate-x-[3px] translate-y-[3px] rounded-full bg-brand" />
        <span className="absolute size-3 -translate-x-[3px] -translate-y-[3px] rounded-full bg-background mix-blend-difference" />
      </span>
      motioncn
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

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-7 pb-10">
      <div>
        <p className="mb-2 px-2 text-sm font-medium text-foreground">Getting started</p>
        <div className="ml-2 border-l border-dashed">
          {docsNav.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href} onNavigate={onNavigate}>
              {item.title}
            </NavLink>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 px-2 text-sm font-medium text-foreground">Components</p>
        <div className="space-y-5">
          {categories.map((category) => (
            <div key={category}>
              <p className="mb-1 px-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                {category}
              </p>
              <div className="ml-2 border-l border-dashed">
                {components
                  .filter((c) => c.category === category)
                  .map((c) => {
                    const href = `/docs/components/${c.slug}`
                    return (
                      <NavLink key={c.slug} href={href} active={pathname === href} onNavigate={onNavigate}>
                        {c.name}
                        {c.isNew && (
                          <span className="rounded-full bg-brand/12 px-1.5 py-px text-[10px] font-medium text-brand">
                            New
                          </span>
                        )}
                      </NavLink>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}
