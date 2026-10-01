"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

import type { Params } from "@/lib/fonderie/params"
import {
  drawText,
  layoutText,
  readColors,
  type TextPiece,
} from "@/lib/fonderie/render"

const TWEEN_MS = 420 // durée d'une transition quand on bouge un réglage
const BREATH_SPEED = 0.8 // vitesse de l'ondulation en mode vivant (radians par seconde)

const ease = (t: number) => 1 - Math.pow(1 - t, 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function lerpAngle(a: number, b: number, t: number) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

type Options = {
  text: string
  params: Params
  capH: (width: number) => number // hauteur des capitales selon la largeur dispo
  lineGap: number
  alive?: boolean // la variation organique ondule en boucle
}

// Dessine le texte et l'anime :
// 1. transitions : quand un réglage change, chaque pièce glisse de son ancienne place à la nouvelle ;
// 2. vivant : la grille ondule en boucle.
// Si le système demande de réduire les animations, tout est dessiné directement.
export function useAnimatedText({
  text,
  params,
  capH,
  lineGap,
  alive,
}: Options) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)
  const [fontsReady, setFontsReady] = useState(false)
  const { resolvedTheme } = useTheme()
  // État de l'animation, gardé d'un rendu à l'autre
  const anim = useRef({
    shown: [] as TextPiece[], // pièces telles qu'elles sont à l'écran en ce moment
    phase: 0,
  })

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width))
    )
    ro.observe(cv)
    document.fonts?.ready.then(() => setFontsReady(true))
    return () => ro.disconnect()
  }, [])

  const size = width ? capH(width) : 0

  useEffect(() => {
    const cv = ref.current
    if (!cv || !width) return
    const st = anim.current
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const col = readColors(cv)
    const content = text || " "
    let raf = 0

    // 2. Vivant : on recalcule la mise en page à chaque image, avec une phase qui avance
    if (alive && !reduce) {
      let last = performance.now()
      const loop = (now: number) => {
        st.phase += ((now - last) / 1000) * BREATH_SPEED
        last = now
        const L = layoutText(width, content, size, lineGap, {
          ...params,
          phase: st.phase,
        })
        st.shown = L.pieces
        drawText(cv, L, L.pieces, params, col)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(raf)
    }

    // Hors mode vivant, on revient (en douceur) à la pose de départ : c'est elle qui part dans le .otf
    st.phase = 0
    const P = params
    const L = layoutText(width, content, size, lineGap, P)
    const from = new Map(st.shown.map((p) => [p.key, p]))
    const keys = new Set(L.pieces.map((p) => p.key))
    const leaving = st.shown.filter((p) => !keys.has(p.key))
    const tween = !reduce && st.shown.length > 0
    const start = performance.now()

    const frame = (now: number) => {
      const t = tween ? Math.min(1, (now - start) / TWEEN_MS) : 1
      const e = ease(t)
      const pieces = L.pieces.map((p) => {
        const f = from.get(p.key)
        // 1. Transition : position, taille et rotation glissent ; une nouvelle pièce grandit
        const q: TextPiece = f
          ? {
              ...p,
              x: lerp(f.x, p.x, e),
              y: lerp(f.y, p.y, e),
              w: lerp(f.w * f.s, p.w, e),
              h: lerp(f.h * f.s, p.h, e),
              angle: lerpAngle(f.angle, p.angle, e),
              base: lerp(f.base, p.base, e),
            }
          : { ...p, s: tween ? e : 1 }
        return q
      })
      // Les pièces qui n'existent plus rétrécissent
      const gone = leaving.map((p) => ({ ...p, s: p.s * (1 - e) }))
      st.shown = pieces
      drawText(cv, L, [...gone, ...pieces], P, col)
      if (t < 1) raf = requestAnimationFrame(frame)
    }
    frame(performance.now())
    return () => cancelAnimationFrame(raf)
    // capH est une nouvelle fonction à chaque rendu du parent : on suit sa valeur (size), pas la fonction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, size, text, params, lineGap, resolvedTheme, fontsReady, alive])

  return ref
}
