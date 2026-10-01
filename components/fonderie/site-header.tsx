"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowDown, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { SUPPORT_URL } from "@/lib/fonderie/config"
import { cn } from "@/lib/utils"

// Peu d'entrées, l'outil d'abord (comme Metaflop). Le logo ramène à la home.
const NAV = [
  { href: "/generator", label: "Generator" },
  { href: "/templates", label: "Templates" },
  { href: "/showcase", label: "Showcase" },
  { href: "/about", label: "About" },
]

// Pastilles du menu : contour en pointillés, la page active est remplie en jaune-vert
const PILL =
  "inline-flex h-9 items-center gap-1 rounded-full border border-foreground/70 px-4 text-[15px] transition-colors outline-none hover:border-foreground hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50"

export function SiteHeader() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b pb-3">
      <Link href="/" className="font-bold tracking-[0.02em]">
        Fonderie modulaire
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
        {NAV.map((item) => {
          const active = item.href === pathname
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                PILL,
                "border-dashed",
                active &&
                  "border-solid border-foreground bg-highlight text-highlight-foreground"
              )}
            >
              {item.label}
            </Link>
          )
        })}
        <Link href="/generator#download" className={cn(PILL, "border-dashed")}>
          Trial
          <ArrowDown className="size-4" />
        </Link>
        {SUPPORT_URL && (
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(PILL, "border-solid")}
          >
            Support
          </a>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </Button>
      </nav>
    </header>
  )
}
