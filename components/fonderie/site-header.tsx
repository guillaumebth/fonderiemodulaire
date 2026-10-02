"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

import { DashOutline } from "./dash-outline"
import { LogoLink } from "./logo-link"
import { PILL, PILL_ACTIVE } from "./pill-styles"

// Maquette Figma « HomePage » : logo à gauche, pastilles à droite.
// Pastilles : contour noir en pointillés, fond blanc ; la page active est remplie en noir.
const NAV = [
  { href: "/generator", label: "Generator" },
  { href: "/templates", label: "Template" },
  { href: "/showcase", label: "Showcase" },
  { href: "/about", label: "About" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 pt-8 md:px-10">
      <LogoLink />
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
                active && PILL_ACTIVE
              )}
            >
              {!active && <DashOutline />}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
