import type { Metadata } from "next"

import { PAGE } from "@/components/fonderie/page-intro"
import { ShowcaseGallery } from "@/components/fonderie/showcase-gallery"
import { SubmitBanner } from "@/components/fonderie/submit-banner"
import { CONTACT_URL } from "@/lib/fonderie/config"
import { SHOWCASE } from "@/lib/fonderie/showcase"

export const metadata: Metadata = {
  title: "Showcase · Fonderie modulaire",
  description: "Posters and projects made with fonts from Fonderie modulaire.",
}

// Affiches et projets faits avec des polices de l'atelier (liste dans lib/fonderie/showcase.ts),
// en grille, avec une galerie plein écran au clic (components/fonderie/showcase-gallery.tsx).
// En haut, un bandeau ouvre un e-mail prérempli pour envoyer sa création.
const email = CONTACT_URL.replace(/^mailto:/, "")
const SUBMIT_HREF =
  `mailto:${email}?subject=${encodeURIComponent("Showcase: my poster")}` +
  `&body=${encodeURIComponent(
    [
      "Hi Guillaume,",
      "",
      "Here's something I made with Fonderie modulaire (image attached).",
      "",
      "Title: ",
      "Link to my font (from the atelier): ",
      "Credit me as (name, X or Instagram handle): ",
      "My website or portfolio: ",
      "",
    ].join("\n")
  )}`
export default function ShowcasePage() {
  return (
    <main className={PAGE}>
      <h1 className="sr-only">Showcase</h1>
      <SubmitBanner
        href={SUBMIT_HREF}
        text="Made something with a Fonderie modulaire font? Send it to me with your website, and I’ll feature it here with a link to your work."
        label="Send me your work"
      />
      <ShowcaseGallery items={SHOWCASE} />
    </main>
  )
}
