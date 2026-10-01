import type { Metadata } from "next"
import Link from "next/link"

import { HowItWorks } from "@/components/fonderie/how-it-works"
import { SiteHeader } from "@/components/fonderie/site-header"

export const metadata: Metadata = {
  title: "About — Fonderie modulaire",
  description:
    "What Fonderie modulaire is, how it works, and answers to common questions.",
}

const FAQ = [
  {
    q: "How do I install my font?",
    a: "Click “Download free trial (.otf)” in the generator, then double-click the file and choose Install. It works in Figma, Word, InDesign and any app that reads OpenType fonts.",
  },
  {
    q: "Is it free?",
    a: "Yes. The download is a free trial of your font, with uppercase A–Z and figures 0–9. If you like what you made, you can support the project and pay what you want.",
  },
  {
    q: "Which characters does the generator draw?",
    a: "On screen: uppercase A–Z, lowercase a–z, figures 0–9 and the punctuation . , ; : ! ? - ' \" ( ) / & @ # € %. Accented letters are coming next.",
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
    <main className="mx-auto grid max-w-[1180px] gap-10 px-5 pt-7 pb-16">
      <SiteHeader />

      <section className="grid max-w-[62ch] gap-4">
        <h1 className="text-[32px] leading-tight font-bold text-balance">
          A font generator made of pieces
        </h1>
        <p>
          Fonderie modulaire lets anyone build a modular typeface with a few
          sliders, then download it as a real font file.
        </p>
        <p>
          Every letter is described once, as a path. That path is laid on a grid
          you control, and pieces — dots, rings, screws, crosses — are placed on
          it. Change the grid, the weight or the pieces, and the whole alphabet
          rebuilds itself. No letter is ever redrawn by hand.
        </p>
        <p>
          <Link
            href="/generator"
            className="font-medium underline underline-offset-4"
          >
            Open the generator →
          </Link>
        </p>
      </section>

      <HowItWorks />

      <section
        className="grid max-w-[62ch] gap-6 border-t pt-8"
        aria-labelledby="faq"
      >
        <h2 id="faq" className="text-[22px] leading-tight font-bold">
          FAQ
        </h2>
        <dl className="grid gap-5">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="grid gap-1.5">
              <dt className="font-medium">{q}</dt>
              <dd className="text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}
