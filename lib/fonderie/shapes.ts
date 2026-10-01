// Pièces : une forme dans chaque case remplie. Les trous sont faits en remplissage pair-impair (evenodd).
// PathSink = le sous-ensemble de Path2D utilisé ici, pour pouvoir brancher plus tard l'export .otf.

import type { Params, ShapeKind } from "./params"

export type PathSink = Pick<
  Path2D,
  "moveTo" | "lineTo" | "arc" | "arcTo" | "closePath"
>

function rrect(
  p: PathSink,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  p.moveTo(x + r, y)
  p.arcTo(x + w, y, x + w, y + h, r)
  p.arcTo(x + w, y + h, x, y + h, r)
  p.arcTo(x, y + h, x, y, r)
  p.arcTo(x, y, x + w, y, r)
  p.closePath()
}

function circ(p: PathSink, cx: number, cy: number, r: number) {
  if (r <= 0) return
  p.moveTo(cx + r, cy)
  p.arc(cx, cy, r, 0, Math.PI * 2)
}

function cross(p: PathSink, cx: number, cy: number, s: number, arm: number) {
  const a = s / 2
  const t = arm / 2
  const pts = [
    [-t, -a],
    [t, -a],
    [t, -t],
    [a, -t],
    [a, t],
    [t, t],
    [t, a],
    [-t, a],
    [-t, t],
    [-a, t],
    [-a, -t],
    [-t, -t],
  ]
  pts.forEach(([dx, dy], i) =>
    i ? p.lineTo(cx + dx, cy + dy) : p.moveTo(cx + dx, cy + dy)
  )
  p.closePath()
}

export type Piece = Exclude<ShapeKind, "melange">
const MIX: Piece[] = ["rond", "anneau", "vis", "vis", "anneau", "rond", "cible"]

// Une forme dans un rectangle w × h centré en (cx, cy)
export function shape(
  p: PathSink,
  kind: Piece,
  cx: number,
  cy: number,
  w: number,
  h: number,
  P: Params
) {
  const s = Math.min(w, h)
  const r = s / 2
  const t = Math.max(P.thk * s, 0.6)
  switch (kind) {
    case "rond":
      circ(p, cx, cy, r)
      break
    case "carre":
      rrect(p, cx - w / 2, cy - h / 2, w, h, P.rad * s)
      break
    case "anneau":
      circ(p, cx, cy, r)
      circ(p, cx, cy, r - t)
      break
    case "vis":
      circ(p, cx, cy, r)
      cross(p, cx, cy, s * 0.62, Math.max(t * 0.7, s * 0.12))
      break
    case "croix":
      cross(p, cx, cy, s, t * 1.4)
      break
    case "cible":
      circ(p, cx, cy, r)
      circ(p, cx, cy, r - t)
      circ(p, cx, cy, Math.max(r - t * 2.2, 0))
      break
    case "carrevide":
      rrect(p, cx - w / 2, cy - h / 2, w, h, P.rad * s)
      rrect(
        p,
        cx - w / 2 + t,
        cy - h / 2 + t,
        w - 2 * t,
        h - 2 * t,
        Math.max(P.rad * s - t, 0)
      )
      break
    case "etoile": {
      const ri = r * (0.28 + P.thk * 0.9)
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5
        const rr = k % 2 ? ri : r
        const x = cx + Math.cos(a) * rr
        const y = cy + Math.sin(a) * rr * 1.04 + r * 0.06
        if (k) p.lineTo(x, y)
        else p.moveTo(x, y)
      }
      p.closePath()
      break
    }
  }
}

// « Mélange » tire au hasard, mais toujours le même tirage pour une même case
export function pieceKind(seed: number, P: Params): Piece {
  if (P.shape !== "melange") return P.shape
  return MIX[Math.abs((Math.sin(seed * 12.9898) * 43758.5453) | 0) % MIX.length]
}
