"use client"

import { useEffect, useState } from "react"

import { HERO_STYLES } from "@/lib/fonderie/presets"

import { ArrowCursor } from "./arrow-cursor"
import { TextCanvas } from "./font-canvas"
import { ShakeLink } from "./shake-link"

// Maquette Figma « HomePage » : un grand panneau noir avec le titre animé,
// le bouton « Make your font » et un court texte. Le panneau fait 2/3 de la largeur de la fenêtre
// (960 px sur une maquette de 1440 px) et garde ses proportions ; le titre grandit avec lui.
// Sa taille est aussi limitée par la hauteur de l'écran (385 px = en-tête, bouton, texte, footer et marges) :
// la home tient toujours dans l'écran, sans scroll.
// Le panneau fait défiler les polices : le curseur devient une flèche (← à gauche, → à droite),
// un clic recule ou avance ; au clavier, flèches ← →. Défilement automatique toutes les 2 s,
// en pause pendant le survol ou le focus.
// Les pièces glissent d'une police à l'autre (transitions du moteur d'animation).
// Couleurs du bouton « Make your font » au survol (définies dans globals.css)
const PUNCH = [1, 2, 3, 4, 5].map((n) => `var(--punch-${n})`)

// Défilement automatique des polices du panneau
const AUTOPLAY_MS = 2000

export function HomeContent() {
  const [index, setIndex] = useState(0)
  const style = HERO_STYLES[index]
  const go = (step: number) =>
    setIndex((i) => (i + step + HERO_STYLES.length) % HERO_STYLES.length)
  // En pause quand la souris est sur le panneau ou qu'il a le focus (on navigue soi-même)
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
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1)
          else if (e.key === "ArrowLeft") go(-1)
          else return
          e.preventDefault()
        }}
        className="group palette-black relative flex w-full cursor-pointer items-center justify-center overflow-hidden p-6 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 md:aspect-[960/463] md:w-[min(66.667vw,calc((100dvh-385px)*960/463))] md:p-[4%]"
      >
        <TextCanvas
          text={"Fonderie\nmodulaire"}
          params={style.params}
          sizes={[40, 64, 104]}
          fluid={0.12}
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
        href="/generator"
        colors={PUNCH}
        className="mt-8 rounded-full bg-action px-6 text-[40px] leading-normal font-medium text-action-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 md:text-[60px]"
      >
        Make your font
      </ShakeLink>

      <p className="mt-7 max-w-[470px] text-center text-[10px]">
        Build your own modular typeface with a few sliders. Every letter is a
        path; pieces — dots, rings, screws, crosses — are laid on it. Change the
        grid and the whole alphabet rebuilds itself. Then download a real font
        file.
      </p>
    </div>
  )
}
