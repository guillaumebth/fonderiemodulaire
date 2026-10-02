import type { Metadata } from "next"
import { PAGE, PageIntro } from "@/components/fonderie/page-intro"
import {
  ACTION_BUTTON,
  ACTION_COLORS,
  pillLink,
} from "@/components/fonderie/pill-styles"
import { ShakeLink } from "@/components/fonderie/shake-link"
import { DashOutline } from "@/components/fonderie/dash-outline"
import { SoundLink } from "@/components/fonderie/sound-link"
import { TemplateGrid } from "@/components/fonderie/template-grid"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Templates · Fonderie modulaire",
  description:
    "Ready-made starting points. Open any of them in the atelier and make it yours.",
}

export default function TemplatesPage() {
  return (
    <main className={PAGE}>
      <PageIntro title="Templates">
        <p>
          Ready-made starting points. Each one is a single set of settings: open
          it, change one slider, and make it yours.
        </p>
      </PageIntro>
      {/* Bandeau communauté (cliquable en entier) : envoyer sa police depuis l'atelier pour qu'elle rejoigne les templates */}
      <SoundLink
        href="/atelier"
        className="group palette-black flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[2rem] py-4 pr-4 pl-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:rounded-full md:pl-8"
      >
        <p className="text-sm leading-normal font-medium">
          Made a font you love? Submit it from the atelier and it could end up
          here, with your name on it.
        </p>
        {/* Pastille qui se remplit au survol du bandeau (tout le bandeau est cliquable) */}
        <span
          className={cn(
            pillLink(),
            "bg-transparent group-hover:bg-foreground group-hover:text-background"
          )}
        >
          <DashOutline />
          Open the atelier
        </span>
      </SoundLink>
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
