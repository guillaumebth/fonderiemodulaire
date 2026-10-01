// Lien de partage : les réglages (et le texte) sont rangés dans l'adresse de la page, après le #.
// Seuls les réglages différents des valeurs par défaut sont écrits, pour garder des liens courts.
// Exemple : /#layout=trace&lanes=3&shape=croix&t=Hello

import { DEFAULT_PARAMS, SHAPES, type Params } from "./params"

const SKIP: (keyof Params)[] = ["phase"] // état d'animation, pas un réglage

export function encodeShare(P: Params, text: string, defaultText: string) {
  const q = new URLSearchParams()
  for (const key of Object.keys(DEFAULT_PARAMS) as (keyof Params)[]) {
    if (SKIP.includes(key) || P[key] === DEFAULT_PARAMS[key]) continue
    const v = P[key]
    q.set(
      key,
      typeof v === "boolean"
        ? v
          ? "1"
          : "0"
        : typeof v === "number"
          ? String(+v.toFixed(3))
          : v
    )
  }
  if (text !== defaultText) q.set("t", text)
  return q.toString()
}

// Lit l'adresse et renvoie les réglages et le texte qu'elle contient (les valeurs invalides sont ignorées)
export function decodeShare(hash: string): {
  params: Params
  text: string | null
} {
  const q = new URLSearchParams(hash.replace(/^#/, ""))
  const params: Params = { ...DEFAULT_PARAMS }
  const out = params as Record<string, unknown>
  for (const key of Object.keys(DEFAULT_PARAMS) as (keyof Params)[]) {
    const raw = q.get(key)
    if (raw === null || SKIP.includes(key)) continue
    const def = DEFAULT_PARAMS[key]
    if (typeof def === "boolean") out[key] = raw === "1"
    else if (typeof def === "number") {
      const n = Number(raw)
      // Les rangées sont limitées à 2 dans l'interface : un vieux lien ne peut pas en demander plus
      if (Number.isFinite(n))
        out[key] = key === "lanes" ? Math.min(2, Math.max(1, Math.round(n))) : n
    } else if (key === "shape") {
      if (SHAPES.some((s) => s.id === raw)) out[key] = raw
    } else if (key === "layout") {
      if (raw === "grille" || raw === "trace") out[key] = raw
    } else if (key === "mode") {
      if (raw === "plein" || raw === "contour") out[key] = raw
    }
  }
  return { params, text: q.get("t") }
}
