import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { Toaster } from "sonner"

import { SITE_URL } from "@/lib/fonderie/config"

import { SiteFooter } from "@/components/fonderie/site-footer"
import { SiteHeader } from "@/components/fonderie/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})
const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  // adresse de base des liens absolus (aperçus de partage, adresse canonique)
  metadataBase: new URL(SITE_URL),
  title: "Fonderie modulaire · Hand-cast modular typefaces",
  description:
    "Build your own modular typeface with sliders, then download it.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      {/* Colonne pleine hauteur : le footer se cale en bas de l'écran */}
      <head>
        {/* Applique « Invert » avant l'affichage s'il était activé (pas de flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("fonderie:invert")==="1")document.documentElement.classList.add("inverted")}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        {/* La maquette est en clair uniquement : on force le mode clair (les couleurs sombres restent prêtes dans globals.css) */}
        <ThemeProvider forcedTheme="light">
          <TooltipProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
          </TooltipProvider>
          {/* Notifications à la direction artistique : bloc noir, texte blanc en Inter 12 / 10 px,
              sans coins arrondis, ombre ni icône */}
          <Toaster
            toastOptions={{
              unstyled: true,
              classNames: {
                toast:
                  "grid w-[var(--width)] gap-0.5 bg-foreground px-4 py-3 text-background",
                title: "text-xs leading-normal font-medium",
                description: "text-[10px] leading-normal font-medium",
                icon: "hidden",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
