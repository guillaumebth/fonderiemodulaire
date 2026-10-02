"use client"

import { useState } from "react"

import { SCREEN_URL } from "@/lib/fonderie/config"
import { DEFAULT_PARAMS, type Params } from "@/lib/fonderie/params"

import { TextCanvas } from "./font-canvas"
import { ACTION_COLORS } from "./pill-styles"
import { ShakeLink } from "./shake-link"

// Anneaux épais au tout petit trou, qui débordent et fusionnent en une seule masse
const TOO_SMALL: Params = {
  ...DEFAULT_PARAMS,
  shape: "anneau",
  // grille plus grosse (6 × 8) : à cette taille, des anneaux plus grands gardent leurs trous visibles
  cols: 6,
  rows: 8,
  wt: 0.8,
  thk: 0.3,
  gap: -0.25, // Piece gap : merge 25 %, les anneaux se touchent sans se boucher
}

// Ce que voit un téléphone à la place de l'atelier : un clin d'œil plutôt qu'un outil inutilisable.
// Titre dessiné avec la police modulaire, une phrase, le gros bouton bleu vers des écrans,
// une pastille « Send me this link » (le menu de partage du téléphone : Messages, Mail, AirDrop…,
// pour rouvrir la page sur un ordinateur, avec le template ou la police choisis).
// Bouton pleine largeur, 48 px de haut, texte 16 px : facile à lire et à toucher
const BIG_BUTTON =
  "flex h-12 w-full items-center justify-center rounded-full px-5 text-base leading-normal font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function BuyAScreen() {
  const [copied, setCopied] = useState(false)

  async function sendLink() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Fonderie modulaire",
          text: "Open this on a computer to make your font.",
          url,
        })
      } catch {} // partage annulé : rien à faire
      return
    }
    // pas de menu de partage : on copie le lien
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    // Inspiré de la page Symbl : un titre et une phrase au centre, deux gros boutons pleine largeur
    // en bas, près du footer (là où tombe le pouce).
    // Accessibilité mobile : boutons de 48 px de haut (cible au doigt ≥ 44 px), texte ≥ 14 px.
    <main className="mx-auto flex w-full max-w-[360px] flex-1 flex-col items-center gap-10 px-5 pt-16 text-center">
      <div className="grid flex-1 content-center justify-items-center gap-8">
        <div className="w-full">
          <TextCanvas
            text={"TOO\nSMALL"}
            params={TOO_SMALL}
            sizes={[44, 44, 44]} // réduit automatiquement si « SMALL » ne tient pas
            lineGap={0.05}
              center
            label="Too small"
          />
        </div>
        <p className="text-sm leading-normal font-medium">
          The atelier doesn&apos;t work on phones. It needs a mouse, a keyboard
          and a screen bigger than your hand.
        </p>
      </div>
      <div className="grid w-full gap-3">
        <ShakeLink
          href={SCREEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          colors={ACTION_COLORS}
          className={BIG_BUTTON + " bg-action text-action-foreground"}
        >
          Buy a screen
        </ShakeLink>
        <button
          type="button"
          onClick={sendLink}
          className={BIG_BUTTON + " bg-foreground text-background"}
        >
          {copied ? "Link copied" : "Send this link to my computer"}
        </button>
      </div>
    </main>
  )
}
