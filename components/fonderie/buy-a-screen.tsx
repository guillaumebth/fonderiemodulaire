"use client"

import Link from "next/link"

import { SCREEN_URL } from "@/lib/fonderie/config"
import { DEFAULT_PARAMS, type Params } from "@/lib/fonderie/params"

import { DashOutline } from "./dash-outline"
import { TextCanvas } from "./font-canvas"
import { ACTION_BUTTON, ACTION_COLORS, pillLink } from "./pill-styles"
import { ShakeLink } from "./shake-link"

// Anneaux épais au tout petit trou, qui débordent et fusionnent en une seule masse
const TOO_SMALL: Params = {
  ...DEFAULT_PARAMS,
  shape: "anneau",
  thk: 0.4, // Shape thickness au maximum
  gap: -0.45, // Piece gap : merge 45 %
  wt: 1.2,
  cols: 9,
  rows: 12,
  org: 0.4, // un peu d'ondulation (mode vivant)
}

// Ce que voit un téléphone à la place de l'atelier : un clin d'œil plutôt qu'un outil inutilisable.
// Titre dessiné avec la police modulaire, une phrase, le gros bouton bleu vers des écrans,
// et une pastille pour revenir à la home.
export function BuyAScreen() {
  return (
    <main className="mx-auto grid w-full max-w-[400px] flex-1 content-center justify-items-center gap-6 px-5 py-16 text-center">
      <div className="w-full">
        <TextCanvas
          text={"TOO\nSMALL"}
          params={TOO_SMALL}
          sizes={[64, 64, 64]} // réduit automatiquement si « SMALL » ne tient pas
          lineGap={-0.15}
          alive
          center
          label="Too small"
        />
      </div>
      <p className="max-w-[300px] text-xs leading-normal font-medium">
        The atelier doesn&apos;t work on phones. It needs a mouse, a keyboard
        and a screen bigger than your hand.
      </p>
      <ShakeLink
        href={SCREEN_URL}
        target="_blank"
        rel="noopener noreferrer"
        colors={ACTION_COLORS}
        className={ACTION_BUTTON}
      >
        Buy a screen
      </ShakeLink>
      <Link href="/" className={pillLink()}>
        <DashOutline />
        Back home
      </Link>
    </main>
  )
}
