// Mode « le long du tracé » : au lieu de remplir les cases d'une grille, on enfile les pièces sur le tracé,
// comme des perles sur un fil, à intervalles réguliers.
//
// - Le tracé est le même qu'en mode grille (skeleton), posé sur la même grille (donc la variation organique
//   le déforme aussi). Seule la façon de poser les pièces change.
// - Chaque trait est découpé à ses angles vifs : on pose toujours une pièce pile sur un angle et sur
//   les extrémités, puis on répartit les autres régulièrement entre deux. Les coins restent nets.
// - Quand deux traits se croisent ou se touchent (barre du H, T…), on ne repose pas une pièce
//   là où il y en a déjà une.

import { center, glyphGrid } from "./grid"
import type { Params } from "./params"
import { skeleton } from "./skeleton"

export type Placed = { x: number; y: number; angle: number }

type Pt = { x: number; y: number; sharp?: boolean }

const BREAK_ANGLE = 0.5 // ~30° : au-delà, un changement de direction compte comme un angle

function turn(a: Pt, b: Pt, c: Pt) {
  const d1 = Math.atan2(b.y - a.y, b.x - a.x)
  const d2 = Math.atan2(c.y - b.y, c.x - b.x)
  let d = Math.abs(d2 - d1)
  if (d > Math.PI) d = Math.PI * 2 - d
  return d
}

// Positions des pièces, en pixels pour une case de 1 (origine en haut à gauche de la grille)
export function tracePositions(c: string, P: Params): Placed[] {
  const { xs, ys } = glyphGrid(c, 1, P)
  const step = P.spacing // pas entre deux pièces, en hauteurs de case
  const out: Placed[] = []

  const place = (x: number, y: number, angle: number) => {
    if (out.some((p) => Math.hypot(p.x - x, p.y - y) < step * 0.5)) return
    out.push({ x, y, angle })
  }

  for (const stroke of skeleton(c, P)) {
    const pts: Pt[] = stroke.map((p) => ({
      x: center(xs, p.x),
      y: center(ys, p.y),
      sharp: p.sharp,
    }))
    if (pts.length === 1) {
      place(pts[0].x, pts[0].y, 0)
      continue
    }
    // Découpe aux angles vifs (et aux changements de direction marqués)
    const breaks = [0]
    for (let k = 1; k < pts.length - 1; k++)
      if (pts[k].sharp || turn(pts[k - 1], pts[k], pts[k + 1]) > BREAK_ANGLE)
        breaks.push(k)
    breaks.push(pts.length - 1)

    for (let b = 0; b + 1 < breaks.length; b++) {
      const run = pts.slice(breaks[b], breaks[b + 1] + 1)
      const lens = [0]
      for (let k = 1; k < run.length; k++)
        lens.push(
          lens[k - 1] +
            Math.hypot(run[k].x - run[k - 1].x, run[k].y - run[k - 1].y)
        )
      const L = lens[lens.length - 1]
      if (L < 1e-6) {
        place(run[0].x, run[0].y, 0)
        continue
      }
      const n = Math.max(1, Math.round(L / step))
      let k = 1
      for (let s = 0; s <= n; s++) {
        const t = (s * L) / n
        while (k < run.length - 1 && lens[k] < t) k++
        const a = run[k - 1]
        const z = run[k]
        const seg = lens[k] - lens[k - 1]
        const f = seg ? (t - lens[k - 1]) / seg : 0
        place(
          a.x + (z.x - a.x) * f,
          a.y + (z.y - a.y) * f,
          Math.atan2(z.y - a.y, z.x - a.x)
        )
      }
    }
  }
  return out
}

// Taille d'une pièce en mode tracé, en cases : la graisse décide de l'épaisseur du trait,
// l'écart entre pièces la réduit (ou l'agrandit quand il est négatif)
export function traceSize(P: Params) {
  return 2 * P.wt * (1 - P.gap)
}
