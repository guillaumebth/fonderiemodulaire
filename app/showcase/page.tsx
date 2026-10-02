import type { Metadata } from "next"
import Link from "next/link"

import { PAGE, PageIntro } from "@/components/fonderie/page-intro"
import { PanelSection } from "@/components/fonderie/panel-ui"
import { DashOutline } from "@/components/fonderie/dash-outline"
import { pillLink } from "@/components/fonderie/pill-styles"

export const metadata: Metadata = {
  title: "Showcase · Fonderie modulaire",
  description: "Projects made with fonts from Fonderie modulaire.",
}

// Les projets réalisés par des gens avec leurs polices. Vide pour l'instant : état d'attente.
export default function ShowcasePage() {
  return (
    <main className={PAGE}>
      <PageIntro title="Showcase">
        <p>
          Posters, logos, signs and screens made with Fonderie modulaire fonts.
        </p>
      </PageIntro>
      <div className="max-w-[470px]">
        <PanelSection title="Nothing here yet. Yours could be the first.">
          <p className="text-xs leading-normal">
            Made something with a font from the atelier? The first projects
            will be featured on this page.
          </p>
          <div className="flex flex-wrap gap-1">
            <Link href="/atelier" className={pillLink(true)}>
              Make a font
            </Link>
            <Link href="/templates" className={pillLink()}>
              <DashOutline />
              Browse templates
            </Link>
          </div>
        </PanelSection>
      </div>
    </main>
  )
}
