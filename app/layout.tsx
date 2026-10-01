import type { Metadata } from "next"
import { Familjen_Grotesk, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { Toaster } from "sonner"

import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const fontSans = Familjen_Grotesk({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Fonderie modulaire",
  description: "Crée ta propre police modulaire avec des curseurs, puis télécharge-la.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={cn("antialiased", fontSans.variable, fontMono.variable, "font-sans")}>
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
