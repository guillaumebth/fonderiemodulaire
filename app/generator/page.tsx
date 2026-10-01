import type { Metadata } from "next"

import { FontEditor } from "@/components/fonderie/font-editor"
import { SiteHeader } from "@/components/fonderie/site-header"

export const metadata: Metadata = {
  title: "Generator — Fonderie modulaire",
  description:
    "Tune the grid, the weight and the pieces, then download your font.",
}

export default function GeneratorPage() {
  return (
    <main className="mx-auto grid max-w-[1180px] gap-7 px-5 pt-7 pb-12">
      <SiteHeader />
      <FontEditor />
    </main>
  )
}
