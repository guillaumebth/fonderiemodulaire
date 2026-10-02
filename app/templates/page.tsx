import type { Metadata } from "next"
import { PAGE } from "@/components/fonderie/page-intro"
import { ACTION_BUTTON, ACTION_COLORS } from "@/components/fonderie/pill-styles"
import { ShakeLink } from "@/components/fonderie/shake-link"
import { SubmitBanner } from "@/components/fonderie/submit-banner"
import { TemplateGrid } from "@/components/fonderie/template-grid"

export const metadata: Metadata = {
  title: "Templates · Fonderie modulaire",
  description:
    "Ready-made starting points. Open any of them in the atelier and make it yours.",
}

export default function TemplatesPage() {
  return (
    <main className={PAGE}>
      {/* Pas d'introduction visible (le menu et les cartes suffisent) ; titre gardé pour l'accessibilité et Google */}
      <h1 className="sr-only">Templates</h1>
      {/* Bandeau communauté (cliquable en entier) : envoyer sa police depuis l'atelier */}
      <SubmitBanner />
      <TemplateGrid />
      {/* Le gros bouton d'action de la home (tremble et clignote au survol) */}
      <div className="flex justify-center">
        <ShakeLink
          href="/atelier"
          colors={ACTION_COLORS}
          sound
          className={ACTION_BUTTON}
        >
          Start from scratch
        </ShakeLink>
      </div>
    </main>
  )
}
