"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

import { readColors, type Colors } from "@/lib/fonderie/render"

// Redessine un canvas à chaque rendu, quand sa largeur change, au changement de thème et quand les polices sont chargées
export function useCanvas(draw: (cv: HTMLCanvasElement, col: Colors, width: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)
  const [fontsReady, setFontsReady] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(cv)
    document.fonts?.ready.then(() => setFontsReady(true))
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (ref.current && width) draw(ref.current, readColors(), width)
  })

  return { ref, width, resolvedTheme, fontsReady }
}
