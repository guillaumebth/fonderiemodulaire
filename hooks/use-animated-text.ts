"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

import type { Params } from "@/lib/fonderie/params"
import {
  drawText,
  layoutText,
  readColors,
  type TextPiece,
} from "@/lib/fonderie/render"

const TWEEN_MS = 420 // durée d'une transition quand on bouge un réglage
const SETTLE_MS = 500 // pas de transition pendant la mise en place de la page
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
  center?: boolean // lignes centrées
  morph?: boolean // false : pas de transition, le dessin change d'un coup (ex. logo)
  // appelé après chaque mise en page avec la position de fin du texte (curseur de saisie)
  onEnd?: (end: { x: number; top: number; height: number }) => void
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
  center,
  morph = true,
  onEnd,
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
    content: "", // réglages + texte du dernier dessin (pour savoir si c'est eux qui ont changé)
    bornAt: 0, // moment de la première image
  })

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

  const size = width ? capH(width) : 0

  useLayoutEffect(() => {
    const cv = ref.current
    if (!cv || !width) return
    const st = anim.current
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const col = readColors(cv)
    const content = text || " "
    let raf = 0

    // Transition depuis ce qui est à l'écran : chaque pièce glisse vers sa nouvelle place,
    // les nouvelles grandissent, celles qui disparaissent rétrécissent
    const from = new Map(st.shown.map((p) => [p.key, p]))
    // On n'anime que si ce sont les réglages ou le texte qui changent : un changement de largeur
    // (fenêtre, polices qui finissent de charger, barre de défilement) se fait directement.
    // Et jamais dans la première demi-seconde, le temps que la page se mette en place.
    const now = performance.now()
    if (!st.bornAt) st.bornAt = now
    const signature = JSON.stringify([content, params, lineGap, center])
    const changed = st.content !== "" && st.content !== signature
    st.content = signature
    const tween =
      morph &&
      !reduce &&
      st.shown.length > 0 &&
      changed &&
      now - st.bornAt > SETTLE_MS
    const start = performance.now()
    const blend = (target: TextPiece[], e: number) => {
      const keys = new Set(target.map((p) => p.key))
      const pieces = target.map((p): TextPiece => {
        const f = from.get(p.key)
        if (!f) return { ...p, s: tween ? p.s * e : p.s }
        return {
          ...p,
          x: lerp(f.x, p.x, e),
          y: lerp(f.y, p.y, e),
          w: lerp(f.w * f.s, p.w, e),
          h: lerp(f.h * f.s, p.h, e),
          angle: lerpAngle(f.angle, p.angle, e),
          base: lerp(f.base, p.base, e),
        }
      })
      const gone = [...from.values()]
        .filter((p) => !keys.has(p.key))
        .map((p) => ({ ...p, s: p.s * (1 - e) }))
      return { pieces, gone }
    }

    // 2. Vivant : la mise en page est recalculée à chaque image avec une phase qui avance
    // (la transition s'applique aussi, par exemple quand on change de police)
    const live = alive && !reduce
    if (!live) st.phase = 0 // hors mode vivant : pose de départ, celle qui part dans le .otf
    const P = params
    const fixed = live
      ? null
      : layoutText(width, content, size, lineGap, P, center)
    let last = start

    const frame = (now: number) => {
      if (live) st.phase += ((now - last) / 1000) * BREATH_SPEED
      last = now
      const L =
        fixed ??
        layoutText(
          width,
          content,
          size,
          lineGap,
          { ...P, phase: st.phase },
          center
        )
      const t = tween ? Math.min(1, (now - start) / TWEEN_MS) : 1
      const { pieces, gone } = blend(L.pieces, ease(t))
      st.shown = pieces
      drawText(cv, L, [...gone, ...pieces], P, col)
      onEnd?.({ x: L.end.x, top: L.end.top, height: L.end.base - L.end.top })
      if (live || t < 1) raf = requestAnimationFrame(frame)
    }
    frame(performance.now())
    return () => cancelAnimationFrame(raf)
    // capH est une nouvelle fonction à chaque rendu du parent : on suit sa valeur (size), pas la fonction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    width,
    size,
    text,
    params,
    lineGap,
    center,
    morph,
    resolvedTheme,
    fontsReady,
    alive,
  ])

  return ref
}
