"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Peu d'entrées, l'outil d'abord (comme Metaflop). Le logo ramène à la home.
const NAV = [
  { href: "/generator", label: "Generator" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b pb-3">
      <Link href="/" className="font-bold tracking-[0.02em]">
        Fonderie modulaire
      </Link>
      <nav aria-label="Main" className="flex items-center gap-1">
        {NAV.map((item) => {
          const active = item.href === pathname
          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "text-muted-foreground",
                active && "text-foreground underline underline-offset-4"
              )}
            >
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            </Button>
          )
        })}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
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
