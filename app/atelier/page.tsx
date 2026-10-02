import type { Metadata } from "next"

import { BuyAScreen } from "@/components/fonderie/buy-a-screen"
import { DesktopOnly } from "@/components/fonderie/desktop-only"
import { FontEditor } from "@/components/fonderie/font-editor"

export const metadata: Metadata = {
  title: "Atelier · Fonderie modulaire",
  description:
    "Tune the grid, the weight and the pieces, then download your font.",
}

// Sur téléphone, l'atelier laisse la place à une page « Buy a screen » (voir BuyAScreen)
export default function AtelierPage() {
  return (
    <DesktopOnly fallback={<BuyAScreen />}>
      <main className="mx-auto grid w-full max-w-[1360px] gap-7 px-5 pt-10 pb-12 md:px-10 md:pt-[71px]">
        <FontEditor />
      </main>
    </DesktopOnly>
  )
}
