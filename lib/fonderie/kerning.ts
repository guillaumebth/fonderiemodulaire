// Crénage automatique : rapproche deux lettres quand leurs bords se font face avec des cases vides (LT, AV, r.).
//
// Pour chaque lettre, on mesure ligne par ligne l'espace vide à gauche et à droite (le « profil »).
// Pour une paire, l'espace récupérable est le plus petit vide total, en comparant chaque ligne
// avec ses voisines du dessus et du dessous (pour ne pas coller les diagonales). P.kern dit quelle part on en retire.

import { GLYPHS } from "./glyphs"
import type { Params } from "./params"
import { glyphGrid } from "./grid"
import { bitmap } from "./skeleton"

type Profile = { left: number[]; right: number[] }

// Profils calculés pour U = 1 (tout est proportionnel à la taille des cases)
const cache = new Map<string, Profile>()
function profile(c: string, P: Params): Profile {
  const key = [
    c,
    P.cols,
    P.rows,
    P.xh,
    P.desc,
    P.wt,
    P.rnd,
    P.smo,
    P.wid,
    P.org,
    P.seed,
  ].join("|")
  const hit = cache.get(key)
  if (hit) return hit
  const bm = bitmap(c, P)
  const { xs } = glyphGrid(c, 1, P)
  const width = xs[xs.length - 1]
  const left: number[] = []
  const right: number[] = []
  for (const row of bm) {
    const first = row.findIndex((v) => v > 0)
    const last = row.length - 1 - [...row].reverse().findIndex((v) => v > 0)
    left.push(first < 0 ? Infinity : xs[first])
    right.push(first < 0 ? Infinity : width - xs[last + 1])
  }
  if (cache.size > 2000) cache.clear()
  const p = { left, right }
  cache.set(key, p)
  return p
}

// Ajustement entre deux lettres, en pixels (négatif = on rapproche)
export function kerning(a: string, b: string, U: number, P: Params) {
  if (!P.kern || !GLYPHS[a] || !GLYPHS[b]) return 0
  const pa = profile(a, P)
  const pb = profile(b, P)
  let gap = Infinity
  for (let i = 0; i < pa.right.length; i++)
    for (
      let j = Math.max(0, i - 1);
      j <= Math.min(pb.left.length - 1, i + 1);
      j++
    )
      gap = Math.min(gap, pa.right[i] + pb.left[j])
  // Aucune ligne en commun (ex. apostrophe puis virgule) : on ne touche à rien
  if (!Number.isFinite(gap) || gap <= 0) return 0
  return -gap * P.kern * U
}
