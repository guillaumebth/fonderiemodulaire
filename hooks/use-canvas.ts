"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

import { readColors, type Colors } from "@/lib/fonderie/render"

// Redessine un canvas à chaque rendu, quand sa largeur change, au changement de thème et quand les polices sont chargées
export function useCanvas(
  draw: (cv: HTMLCanvasElement, col: Colors, width: number) => void
) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)
  const [fontsReady, setFontsReady] = useState(false)
  const { resolvedTheme } = useTheme()

  // Mesure et premier dessin AVANT l'affichage (useLayoutEffect) : le canvas apparaît directement
  // à sa vraie taille, sans sauter de sa hauteur par défaut (150 px) à la bonne hauteur.
  useLayoutEffect(() => {
    const cv = ref.current
    if (!cv) return
    setWidth(Math.round(cv.getBoundingClientRect().width))
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width))
    )
    ro.observe(cv)
    document.fonts?.ready.then(() => setFontsReady(true))
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (ref.current && width) draw(ref.current, readColors(), width)
  })

  return { ref, width, resolvedTheme, fontsReady }
}
