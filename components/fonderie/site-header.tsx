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
  { href: "/atelier", label: "Atelier" },
  { href: "/templates", label: "Template" },
  { href: "/showcase", label: "Showcase" },
  { href: "/about", label: "About" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    // Collé en haut de l'écran au défilement, sans fond : il s'affiche en « différence » (comme le
    // curseur rond de la home), donc il inverse ce qui passe dessous et reste lisible partout
    // (noir sur fond clair, blanc sur le panneau noir ou une photo).
    // Pour ça, ses couleurs sont inversées : blanc (qui apparaît noir sur le fond clair),
    // et fond des pastilles noir (qui ne change rien, donc transparent).
    // Sauf dans l'atelier : le menu reste en haut de la page et ne suit pas (place à l'outil)
    <header
      className={cn(
        "z-40 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 pt-8 pb-3 text-foreground mix-blend-difference [--background:oklch(0_0_0)] [--foreground:oklch(1_0_0)] [--surface:oklch(0_0_0)] md:px-10",
        pathname.startsWith("/atelier") ? "relative" : "sticky top-0"
      )}
    >
      <LogoLink />
      <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(PILL, active && PILL_ACTIVE)}
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
