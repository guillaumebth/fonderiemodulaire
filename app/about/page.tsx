import type { Metadata } from "next"
import Link from "next/link"

import { HowItWorks } from "@/components/fonderie/how-it-works"
import { PAGE, PageIntro } from "@/components/fonderie/page-intro"
import { PanelSection } from "@/components/fonderie/panel-ui"
import { pillLink } from "@/components/fonderie/pill-styles"
import { CHECKOUT_URL, PRICE } from "@/lib/fonderie/config"

export const metadata: Metadata = {
  title: "About · Fonderie modulaire",
  description:
    "What Fonderie modulaire is, how it works, and answers to common questions.",
}

const FAQ = [
  {
    q: "How do I install my font?",
    a: "Click “Download” in the atelier. You get a .zip with your font, its license and a link to edit it again: unzip it, double-click the .otf file and choose Install. It works in Figma, Word, InDesign and any app that reads OpenType fonts.",
  },
  {
    q: "Is it free?",
    // la réponse dépend de la version payante : ouverte seulement quand le lien de paiement est renseigné
    a: CHECKOUT_URL
      ? `The trial is free, for personal projects: uppercase A–Z and figures 0–9. The full version adds lowercase, accents, punctuation and a commercial license, for ${PRICE}. After paying you get a license key, paste it in the atelier once, and every download is complete.`
      : "Yes. The download is a free trial of your font, with uppercase A–Z and figures 0–9, for personal projects.",
  },
  {
    q: "Which characters are included?",
    a: "In the full version: uppercase A–Z, lowercase a–z, French accented letters (é è ê ë à â ä ç î ï ô ö ù û ü ÿ œ æ, plus á í ó ú ñ, in capitals too), figures 0–9 and the punctuation . , ; : ! ? - ' \" ( ) / & @ # € %.",
  },
  {
    q: "What’s the difference between Grid and Along the path?",
    a: "Grid fills every cell the stroke touches, for a pixel or LED look. Along the path threads pieces evenly along the stroke, like beads on a string, so curves stay truly round.",
  },
  {
    q: "Can I share what I made?",
    a: "Yes. The page address always stores every setting and your text: copy it from your browser, and whoever opens it sees exactly your font.",
  },
  {
    q: "Is kerning included?",
    a: "Yes. Kerning is computed automatically from the shape of each letter and written into the .otf file, so pairs like LT or r. stay tight.",
  },
]

export default function AboutPage() {
  return (
    <main className={PAGE}>
      <PageIntro title="About">
        <p>
          Fonderie modulaire lets anyone build a modular typeface with a few
          sliders, then download it as a real font file.
        </p>
        <p>
          Every letter is described once, as a path. That path is laid on a grid
          you control, and pieces (dots, rings, screws, crosses) are placed on
          it. Change the grid, the weight or the pieces, and the whole alphabet
          rebuilds itself. No letter is ever redrawn by hand.
        </p>
        <div>
          <Link href="/atelier" className={pillLink(true)}>
            Open the atelier
          </Link>
        </div>
      </PageIntro>

      <HowItWorks />

      <div className="max-w-[470px]">
        <PanelSection title="FAQ">
          <dl className="grid gap-4 text-xs leading-normal">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="grid gap-1">
                <dt className="font-medium">{q}</dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </PanelSection>
      </div>
    </main>
  )
}
