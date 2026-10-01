import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Showcase — Fonderie modulaire",
  description: "Projects made with fonts from Fonderie modulaire.",
}

// Les projets réalisés par des gens avec leurs polices. Vide pour l'instant : état d'attente.
export default function ShowcasePage() {
  return (
    <main className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 pt-7 pb-16">
      <section className="grid max-w-[62ch] gap-4">
        <h1 className="text-[32px] leading-tight font-bold text-balance">
          Showcase
        </h1>
        <p>
          Posters, logos, signs and screens made with Fonderie modulaire fonts.
        </p>
      </section>
      <section className="grid justify-items-start gap-4 rounded-md border border-dashed p-8 md:p-12">
        <h2 className="text-[22px] leading-tight font-bold text-balance">
          Nothing here yet — yours could be the first.
        </h2>
        <p className="max-w-[56ch] text-muted-foreground">
          Made something with a font from the generator? The first projects will
          be featured on this page.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/generator">Make a font</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/templates">Browse templates</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
