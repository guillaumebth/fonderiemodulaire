// Du tracé à la grille : skeleton() pose le tracé sur la grille, bitmap() décide quelles cases sont remplies.

import { GLYPHS, isLower } from "./glyphs"
import type { Params } from "./params"

export type GridPoint = { x: number; y: number; sharp?: boolean }

// Nombre de colonnes d'une lettre, selon sa largeur relative
export function glyphCols(c: string, P: Params) {
  const g = GLYPHS[c]
  return g.w === 0 ? 1 : Math.max(1, Math.round((P.cols - 1) * (g.w ?? 1)) + 1)
}

// Repères verticaux de la grille, en numéros de ligne.
// Toutes les lettres partagent la même grille : capitales en haut, jambages en dessous de la ligne de base.
// Toutes les lettres partagent la même grille, de haut en bas :
//   - « above » lignes au-dessus des capitales, pour les accents des capitales (É, À…) ;
//   - les capitales (P.rows lignes, de la ligne « above » jusqu'à la ligne de base) ;
//   - « desc » lignes sous la ligne de base, pour les jambages (g, p…) et la cédille.
// Les numéros de ligne (base, xhRow) sont comptés depuis le haut des capitales ; ajouter « above ».
export function vMetrics(P: Params) {
  const base = P.rows - 1 // ligne de base
  const xhRow = Math.round((1 - P.xh) * base) // haut des minuscules
  const desc = Math.max(1, Math.round(P.desc * base)) // nombre de lignes sous la ligne de base
  const above = Math.max(1, Math.round(0.25 * base)) // lignes réservées aux accents des capitales
  return { base, xhRow, desc, above, total: above + P.rows + desc }
}

// Coordonnée y d'un tracé → numéro de ligne dans la grille (voir les conventions dans glyphs.ts)
function rowOf(y: number, lower: boolean, m: ReturnType<typeof vMetrics>) {
  return m.above + rowFromCapTop(y, lower, m)
}
function rowFromCapTop(y: number, lower: boolean, m: ReturnType<typeof vMetrics>) {
  if (y > 1) return m.base + (y - 1) * m.desc
  if (!lower) return y < 0 ? y * m.above : y * m.base // y < 0 : zone des accents des capitales
  if (y < 0) return m.xhRow + y * m.xhRow
  return m.xhRow + y * (m.base - m.xhRow)
}

// Transforme les tracés en suites de points dans l'espace de la grille (angles arrondis selon la rondeur)
export function skeleton(c: string, P: Params): GridPoint[][] {
  const nc = glyphCols(c, P)
  const m = vMetrics(P)
  const lower = isLower(c)
  const R = (P.rnd * Math.min(nc - 1, m.base)) / 2
  return GLYPHS[c].s.map((stroke) => {
    const pts: GridPoint[] = stroke.map(([x, y, sharp]) => ({
      x: Math.round(x * (nc - 1)),
      y: Math.round(rowOf(y, lower, m)),
      sharp: !!sharp,
    }))
    if (pts.length < 3 || R <= 0) return pts
    const last = pts[pts.length - 1]
    const closed = pts[0].x === last.x && pts[0].y === last.y
    const out: GridPoint[] = []
    const n = pts.length
    for (let k = 0; k < n; k++) {
      const p = pts[k]
      const isEnd = !closed && (k === 0 || k === n - 1)
      if (closed && k === n - 1) continue
      const prev = pts[k === 0 ? (closed ? n - 2 : 0) : k - 1]
      const next = pts[k === n - 1 ? 0 : k + 1]
      if (isEnd || p.sharp) {
        out.push(p)
        continue
      }
      const d1 = Math.hypot(p.x - prev.x, p.y - prev.y)
      const d2 = Math.hypot(next.x - p.x, next.y - p.y)
      if (!d1 || !d2) {
        out.push(p)
        continue
      }
      const prevEnd = !closed && k - 1 === 0
      const nextEnd = !closed && k + 1 === n - 1
      const r = Math.min(R, prevEnd ? d1 : d1 / 2, nextEnd ? d2 : d2 / 2)
      const a = {
        x: p.x - ((p.x - prev.x) / d1) * r,
        y: p.y - ((p.y - prev.y) / d1) * r,
      }
      const b = {
        x: p.x + ((next.x - p.x) / d2) * r,
        y: p.y + ((next.y - p.y) / d2) * r,
      }
      for (let t = 0; t <= 1.0001; t += 1 / 10) {
        const u = 1 - t
        out.push({
          x: u * u * a.x + 2 * u * t * p.x + t * t * b.x,
          y: u * u * a.y + 2 * u * t * p.y + t * t * b.y,
        })
      }
    }
    if (closed) out.push(out[0])
    return out
  })
}

function segDist(px: number, py: number, a: GridPoint, b: GridPoint) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const L = dx * dx + dy * dy
  let t = L ? ((px - a.x) * dx + (py - a.y) * dy) / L : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - a.x - t * dx, py - a.y - t * dy)
}

// Pour chaque case : 1 = pleine, 0.55 = petit point d'angle, 0 = vide
const cache = new Map<string, number[][]>()
export function bitmap(c: string, P: Params): number[][] {
  const key = [c, P.cols, P.rows, P.xh, P.desc, P.wt, P.rnd, P.smo].join("|")
  const hit = cache.get(key)
  if (hit) return hit
  const sk = skeleton(c, P)
  const nc = glyphCols(c, P)
  const nr = vMetrics(P).total
  const bm: number[][] = []
  for (let i = 0; i < nr; i++) {
    const row: number[] = []
    for (let j = 0; j < nc; j++) {
      let d = Infinity
      for (const s of sk) {
        if (s.length === 1) d = Math.min(d, Math.hypot(j - s[0].x, i - s[0].y))
        for (let k = 0; k + 1 < s.length; k++)
          d = Math.min(d, segDist(j, i, s[k], s[k + 1]))
      }
      row.push(d <= P.wt + 1e-6 ? 1 : P.smo > 0 && d <= P.wt + P.smo ? 0.55 : 0)
    }
    bm.push(row)
  }
  if (cache.size > 600) cache.clear()
  cache.set(key, bm)
  return bm
}
