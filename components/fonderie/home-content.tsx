"use client"

import { useEffect, useState } from "react"

import { HERO_STYLES } from "@/lib/fonderie/presets"

import { ArrowCursor } from "./arrow-cursor"
import { TextCanvas } from "./font-canvas"
import { ACTION_BUTTON, ACTION_COLORS } from "./pill-styles"
import { ShakeLink } from "./shake-link"

// Maquette Figma « HomePage » : un grand panneau noir avec le titre animé,
// le bouton « Make your font » et un court texte. Le panneau fait 2/3 de la largeur de la fenêtre
// (960 px sur une maquette de 1440 px) et garde ses proportions ; le titre grandit avec lui.
// Sa taille est aussi limitée par la hauteur de l'écran (385 px = en-tête, bouton, texte, footer et marges) :
// la home tient toujours dans l'écran, sans scroll.
// Sur téléphone : panneau plus haut (4/3) et titre plus gros, pour qu'il occupe la largeur.
// Le panneau fait défiler les polices : le curseur devient une flèche (← à gauche, → à droite),
// un clic recule ou avance ; au clavier, flèches ← →. Défilement automatique toutes les 2 s,
// même au survol (le panneau est grand, la souris s'y pose souvent : une pause au survol
// donnait l'impression que le défilement était cassé). En pause seulement au focus clavier.
// Les pièces glissent d'une police à l'autre (transitions du moteur d'animation).

// Défilement automatique des polices du panneau
const AUTOPLAY_MS = 2000

export function HomeContent() {
  const [index, setIndex] = useState(0)
  const style = HERO_STYLES[index]
  const go = (step: number) =>
    setIndex((i) => (i + step + HERO_STYLES.length) % HERO_STYLES.length)
  // En pause quand le panneau a le focus clavier (on navigue soi-même avec les flèches)
  const [paused, setPaused] = useState(false)

  // Une nouvelle police toutes les 2 s. Le compte repart à chaque changement (clic compris).
  // Pas de défilement automatique si le système demande de réduire les animations.
  useEffect(() => {
    if (paused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % HERO_STYLES.length),
      AUTOPLAY_MS
    )
    return () => clearTimeout(id)
  }, [index, paused])

  return (
    <div className="grid w-full justify-items-center px-5 pt-9">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Fonderie modulaire in different fonts"
        tabIndex={0}
        // Pause au focus clavier seulement : un clic donne aussi le focus, et bloquait le défilement
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setPaused(true)
        }}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1)
          else if (e.key === "ArrowLeft") go(-1)
          else return
          e.preventDefault()
        }}
        className="group palette-black relative flex w-full cursor-pointer items-center justify-center aspect-[4/3] overflow-hidden p-4 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:aspect-[960/463] sm:p-6 md:aspect-[960/463] md:w-[min(66.667vw,calc((100dvh-385px)*960/463))] md:p-[4%]"
      >
        <TextCanvas
          text={"Fonderie\nmodulaire"}
          params={style.params}
          sizes={[40, 64, 104]}
          // titre plus gros sur téléphone (le moteur le réduit s'il déborde)
          fluid={(W) => (W < 500 ? 0.16 : 0.12)}
          lineGap={0}
          alive
          center
          label={`Fonderie modulaire, in the ${style.name} style`}
        />

        <ArrowCursor onStep={go} />

        {/* Pour le clavier et les lecteurs d'écran : boutons invisibles à l'œil, annonce du style */}
        <button
          type="button"
          className="sr-only"
          onClick={(e) => {
            e.stopPropagation()
            go(-1)
          }}
        >
          Previous font
        </button>
        <button
          type="button"
          className="sr-only"
          onClick={(e) => {
            e.stopPropagation()
            go(1)
          }}
        >
          Next font
        </button>
        <p aria-live={paused ? "polite" : "off"} className="sr-only">
          {style.name} style
        </p>
      </div>

      <ShakeLink
        href="/atelier"
        colors={ACTION_COLORS}
        sound
        className={`mt-8 ${ACTION_BUTTON}`}
      >
        Make your font
      </ShakeLink>

      <p className="mt-7 max-w-[470px] text-center text-xs leading-normal">
        Build your own modular typeface with a few sliders. Every letter is a
        path; pieces (dots, rings, screws, crosses) are laid on it. Change the
        grid and the whole alphabet rebuilds itself. Then download a real font
        file.
      </p>
    </div>
  )
}
