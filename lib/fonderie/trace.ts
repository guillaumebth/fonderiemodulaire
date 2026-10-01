// Mode « le long du tracé » : au lieu de remplir les cases d'une grille, on enfile les pièces sur le tracé,
// comme des perles sur un fil, à intervalles réguliers.
//
// - Le tracé est le même qu'en mode grille (skeleton), posé sur la même grille (donc la variation organique
//   le déforme aussi). Seule la façon de poser les pièces change.
// - Chaque trait est découpé à ses angles vifs : on pose toujours une pièce pile sur un angle et sur
//   les extrémités, puis on répartit les autres régulièrement entre deux. Les coins restent nets.
// - Jonctions : quand un trait en rejoint ou en croise un autre déjà posé (barre du H, jambe du R, X…),
//   ses pièces s'arrêtent au bord de l'autre trait, rangées comprises, au lieu de s'empiler dessus.
//   C'est le principe dessus/dessous d'une couture. Pareil quand un trait se recroise lui-même (&).

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

// Décale une ligne de `d` perpendiculairement à sa direction (vers la droite du sens de parcours).
// Aux angles, le décalage est prolongé en onglet pour que les rangées restent parallèles (plafonné à ×2).
function offsetLine(pts: Pt[], d: number, closed: boolean): Pt[] {
  if (!d) return pts
  const normal = (a: Pt, b: Pt) => {
    const l = Math.hypot(b.x - a.x, b.y - a.y)
    return { x: -(b.y - a.y) / l, y: (b.x - a.x) / l }
  }
  const n = pts.length
  return pts.map((p, k) => {
    const prev = k > 0 ? pts[k - 1] : closed ? pts[n - 2] : null
    const next = k < n - 1 ? pts[k + 1] : closed ? pts[1] : null
    const n1 = prev ? normal(prev, p) : null
    const n2 = next ? normal(p, next) : null
    let m = n1 && n2 ? { x: n1.x + n2.x, y: n1.y + n2.y } : (n1 ?? n2)!
    const ml = Math.hypot(m.x, m.y)
    if (ml < 1e-9) m = n1!
    else m = { x: m.x / ml, y: m.y / ml }
    const cos = n1 ? m.x * n1.x + m.y * n1.y : 1
    const scale = 1 / Math.max(0.5, cos)
    return {
      x: p.x + m.x * d * scale,
      y: p.y + m.y * d * scale,
      sharp: p.sharp,
    }
  })
}

// Positions des pièces, en pixels pour une case de 1 (origine en haut à gauche de la grille)
export function tracePositions(c: string, P: Params): Placed[] {
  const { xs, ys } = glyphGrid(c, 1, P)
  const step = P.spacing // pas entre deux pièces, en hauteurs de case
  // Rangées parallèles : décalages centrés sur le tracé
  const laneGap = P.laneGap * traceSize(P)
  const lanes = Array.from(
    { length: P.lanes },
    (_, k) => (k - (P.lanes - 1) / 2) * laneGap
  )
  const minDist = 0.5 * (P.lanes > 1 ? Math.min(step, laneGap) : step)
  // Distance au tracé d'un autre trait en dessous de laquelle une pièce est masquée :
  // la rangée la plus éloignée de l'autre trait, plus presque une pièce
  const clear = ((P.lanes - 1) / 2) * laneGap + 0.9 * traceSize(P)
  const endZone = clear + step / 2 // « près d'une extrémité » d'un trait ouvert
  const window = 2 * clear + step // le long d'un même trait, en deçà c'est le voisinage normal

  type Candidate = Placed & { stroke: number; t: number }
  type Laid = { a: Pt; b: Pt; stroke: number; s0: number; s1: number }
  const candidates: Candidate[] = []
  const laid: Laid[] = []
  const strokes: { total: number; open: boolean }[] = []

  // 1. Toutes les positions possibles, trait par trait
  skeleton(c, P).forEach((stroke, si) => {
    // Points dans l'espace de la grille, sans doublons consécutifs
    const pts: Pt[] = []
    for (const p of stroke) {
      const q = { x: center(xs, p.x), y: center(ys, p.y), sharp: p.sharp }
      const last = pts[pts.length - 1]
      if (last && Math.hypot(q.x - last.x, q.y - last.y) < 1e-9) {
        last.sharp ||= q.sharp
        continue
      }
      pts.push(q)
    }
    if (pts.length === 1) {
      // Un point (i, ponctuation) : les rangées se posent côte à côte, à l'horizontale
      strokes.push({ total: 0, open: false })
      for (const d of lanes)
        candidates.push({
          x: pts[0].x + d,
          y: pts[0].y,
          angle: 0,
          stroke: -1,
          t: 0,
        })
      return
    }
    const last = pts[pts.length - 1]
    const closed =
      pts.length > 2 && Math.hypot(pts[0].x - last.x, pts[0].y - last.y) < 1e-9
    // Position de chaque point le long du tracé
    const sc = [0]
    for (let k = 1; k < pts.length; k++)
      sc.push(
        sc[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y)
      )
    strokes.push({ total: sc[sc.length - 1], open: !closed })
    for (let k = 1; k < pts.length; k++)
      laid.push({
        a: pts[k - 1],
        b: pts[k],
        stroke: si,
        s0: sc[k - 1],
        s1: sc[k],
      })

    // Découpe aux angles vifs (et aux changements de direction marqués)
    const breaks = [0]
    for (let k = 1; k < pts.length - 1; k++)
      if (pts[k].sharp || turn(pts[k - 1], pts[k], pts[k + 1]) > BREAK_ANGLE)
        breaks.push(k)
    breaks.push(pts.length - 1)

    for (const d of lanes) {
      const line = offsetLine(pts, d, closed)
      for (let b = 0; b + 1 < breaks.length; b++) {
        const run = line.slice(breaks[b], breaks[b + 1] + 1)
        const lens = [0]
        for (let k = 1; k < run.length; k++)
          lens.push(
            lens[k - 1] +
              Math.hypot(run[k].x - run[k - 1].x, run[k].y - run[k - 1].y)
          )
        const L = lens[lens.length - 1]
        if (L < 1e-6) continue
        const n = Math.max(1, Math.round(L / step))
        let k = 1
        for (let s = 0; s <= n; s++) {
          const t = (s * L) / n
          while (k < run.length - 1 && lens[k] < t) k++
          const a = run[k - 1]
          const z = run[k]
          const seg = lens[k] - lens[k - 1]
          const f = seg ? (t - lens[k - 1]) / seg : 0
          const i0 = breaks[b] + k - 1
          candidates.push({
            x: a.x + (z.x - a.x) * f,
            y: a.y + (z.y - a.y) * f,
            angle: Math.atan2(z.y - a.y, z.x - a.x),
            stroke: si,
            t: sc[i0] + (sc[i0 + 1] - sc[i0]) * f,
          })
        }
      }
    }
  })

  // 2. Jonctions : qui passe dessous ?
  const nearEnd = (stroke: number, t: number) =>
    strokes[stroke].open && (t < endZone || strokes[stroke].total - t < endZone)
  const arcGap = (stroke: number, t: number, u: number) => {
    const d = Math.abs(t - u)
    return strokes[stroke].open ? d : Math.min(d, strokes[stroke].total - d)
  }
  const hidden = (p: Candidate) => {
    if (p.stroke < 0) return false
    return laid.some((g) => {
      const dx = g.b.x - g.a.x
      const dy = g.b.y - g.a.y
      const l2 = dx * dx + dy * dy
      const f = l2
        ? Math.max(
            0,
            Math.min(1, ((p.x - g.a.x) * dx + (p.y - g.a.y) * dy) / l2)
          )
        : 0
      if (Math.hypot(p.x - g.a.x - f * dx, p.y - g.a.y - f * dy) >= clear)
        return false
      const u = g.s0 + (g.s1 - g.s0) * f // point le plus proche, le long de l'autre trait
      if (g.stroke === p.stroke && arcGap(p.stroke, p.t, u) <= window)
        return false
      const pEnd = nearEnd(p.stroke, p.t)
      const gEnd = nearEnd(g.stroke, u)
      // L'extrémité qui arrive sur un trait s'arrête ; sinon (croisement, coin), le dernier tracé passe dessous
      if (pEnd !== gEnd) return pEnd
      return p.stroke > g.stroke || (p.stroke === g.stroke && p.t > u)
    })
  }

  // 3. On pose, sans doublons
  const out: Placed[] = []
  for (const p of candidates) {
    if (hidden(p)) continue
    if (out.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < minDist)) continue
    out.push({ x: p.x, y: p.y, angle: p.angle })
  }
  return out
}

// Taille d'une pièce en mode tracé, en cases : la graisse décide de la taille des pièces,
// l'écart entre pièces la réduit (ou l'agrandit quand il est négatif)
export function traceSize(P: Params) {
  return 2.2 * P.wt * (1 - P.gap)
}

// Demi-épaisseur totale du trait en mode tracé, en cases (rangées comprises)
export function traceHalfWidth(P: Params) {
  return ((P.lanes - 1) / 2) * P.laneGap * traceSize(P) + traceSize(P) / 2
}
