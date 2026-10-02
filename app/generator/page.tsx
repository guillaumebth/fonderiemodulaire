import type { Metadata } from "next"

import { FontEditor } from "@/components/fonderie/font-editor"

export const metadata: Metadata = {
  title: "Generator · Fonderie modulaire",
  description:
    "Tune the grid, the weight and the pieces, then download your font.",
}

export default function GeneratorPage() {
  return (
    <main className="mx-auto grid w-full max-w-[1360px] gap-7 px-5 pt-10 pb-12 md:px-10 md:pt-[71px]">
      <FontEditor />
    </main>
  )
}
