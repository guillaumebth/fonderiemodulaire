"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { HERO_STYLES } from "@/lib/fonderie/presets"
import { cn } from "@/lib/utils"

import { TextCanvas } from "./font-canvas"

const CYCLE_MS = 160 // une nouvelle police toutes les 160 ms pendant le survol

// Les polices du défilement, sans ondulation ni grille (à cette taille, elles brouilleraient la lecture)
const STYLES = HERO_STYLES.map((s) => ({ ...s.params, org: 0, grid: false }))

// Logo « Fonderie Modulaire » : au survol (ou au focus clavier), il s'écrit dans les polices
// de l'outil et les fait défiler très vite, d'un coup (sans transition entre les polices).
// Le texte normal reste dans la page pour les lecteurs d'écran ; rien ne bouge autour
// (le dessin se superpose au logo). Sans défilement si le système demande de réduire les animations.
export function LogoLink() {
  const [hover, setHover] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!hover) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(
      () => setIndex((i) => (i + 1) % STYLES.length),
      CYCLE_MS
    )
    return () => clearInterval(id)
  }, [hover])

  return (
    <Link
      href="/"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="relative text-sm font-semibold"
    >
      <span className={cn(hover && "opacity-0")}>Fonderie Modulaire</span>
      {/* Le dessin est toujours là (invisible hors survol) pour que les transitions soient prêtes */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 left-0 w-[240px] -translate-y-1/2",
          !hover && "opacity-0"
        )}
      >
        <TextCanvas
          text="Fonderie Modulaire"
          params={STYLES[index]}
          // capitales de 11 px
          sizes={[11, 11, 11]}
          lineGap={0}
          morph={false}
          label=""
        />
      </span>
    </Link>
  )
}
