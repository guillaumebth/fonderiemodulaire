"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

// Maquette Figma « HomePage » : logo à gauche, pastilles à droite.
// Pastilles : contour noir en pointillés, fond blanc ; la page active est remplie en noir.
const NAV = [
  { href: "/generator", label: "Generator" },
  { href: "/templates", label: "Template" },
  { href: "/showcase", label: "Showcase" },
  { href: "/about", label: "About" },
]

export const PILL =
  "inline-flex items-center justify-center rounded-full border border-dashed border-foreground bg-surface px-[7px] py-[2px] text-xs font-medium whitespace-nowrap transition-colors outline-none hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50"

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 pt-8 md:px-10">
      <Link href="/" className="text-sm font-semibold">
        Fonderie Modulaire
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                PILL,
                active && "bg-foreground text-background hover:bg-foreground/90"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
