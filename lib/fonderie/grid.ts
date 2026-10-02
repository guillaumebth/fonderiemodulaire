// Géométrie de la grille d'une lettre : bords des colonnes et des lignes (avec la variation organique).

import type { Params } from "./params"
import { glyphCols, vMetrics } from "./skeleton"

// Nombre pseudo-aléatoire entre -1 et 1, toujours le même pour les mêmes entrées
function noise(a: number, b: number) {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

// Bords des cases le long d'un axe : n cases de taille moyenne `size`.
// Avec la variation organique, chaque case est plus large ou plus étroite,
// mais le total ne change pas (la lettre garde sa largeur, la ligne sa hauteur).
// La phase fait tourner doucement chaque case entre deux tirages : en boucle, la grille « respire ».
function edges(
  n: number,
  size: number,
  amount: number,
  seed: number,
  phase = 0
) {
  const f = Array.from(
    { length: n },
    (_, k) =>
      1 +
      amount *
        0.85 *
        (noise(k + 1, seed) * Math.cos(phase) +
          noise(k + 1, seed + 0.37) * Math.sin(phase))
  )
  const scale = (n * size) / f.reduce((a, b) => a + b, 0)
  const out = [0]
  for (const v of f) out.push(out[out.length - 1] + v * scale)
  return out
}

// Centre de la case t (t peut être fractionnaire : on interpole entre deux centres)
export function center(e: number[], t: number) {
  const n = e.length - 1
  const mid = (k: number) => (e[k] + e[k + 1]) / 2
  const i = Math.max(0, Math.min(n - 1, Math.floor(t)))
  if (i >= n - 1) return mid(n - 1)
  return mid(i) + (mid(i + 1) - mid(i)) * (t - i)
}

// La grille d'une lettre. Les lignes sont les mêmes pour toutes les lettres (barres et bas de casse alignés) ;
// les colonnes varient d'une lettre à l'autre, mais toujours pareil pour une même lettre.
export function glyphGrid(c: string, U: number, P: Params) {
  return {
    xs: edges(
      glyphCols(c, P),
      U * P.wid,
      P.org,
      P.seed * 31 + c.charCodeAt(0),
      P.phase
    ),
    ys: edges(vMetrics(P).total, U, P.org, P.seed * 31 + 0.5, P.phase * 0.8),
  }
}

// Jusqu'où le haut des lettres peut monter dans les lignes des accents (au-dessus des capitales) :
// - avec une graisse forte, les cases de la ligne juste au-dessus sont remplies (row < above) ;
// - avec la variation organique, si ces lignes rétrécissent, la lettre monte d'autant.
// row : première ligne de la grille occupée par une pièce. Pire cas sur toute l'ondulation (mode vivant),
// pour que la hauteur de l'aperçu ne bouge pas pendant l'animation.
export function capTopLift(U: number, P: Params, row = vMetrics(P).above) {
  const { above, total } = vMetrics(P)
  if (!P.org) return Math.max(0, (above - row) * U)
  let lift = 0
  for (let i = 0; i < 48; i++) {
    const ys = edges(total, U, P.org, P.seed * 31 + 0.5, (i / 48) * Math.PI * 2)
    lift = Math.max(lift, above * U - ys[row])
  }
  return lift
}
