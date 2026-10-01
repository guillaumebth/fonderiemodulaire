// Dessin sur canvas : lettres, grille, mise en page du texte, étapes de construction.

import { GLYPHS } from "./glyphs"
import type { Params } from "./params"
import { pieceKind, shape, type Piece } from "./shapes"
import { center, glyphGrid } from "./grid"
import { kerning } from "./kerning"
import { bitmap, glyphCols, skeleton, vMetrics } from "./skeleton"

export type Colors = { bg: string; fg: string; accent: string; line: string }

// Les couleurs viennent des variables CSS de globals.css (et suivent donc le mode sombre)
export function readColors(): Colors {
  const s = getComputedStyle(document.documentElement)
  const g = (n: string) => s.getPropertyValue(n).trim()
  return {
    bg: g("--background"),
    fg: g("--foreground"),
    accent: g("--brand"),
    line: g("--border"),
  }
}

type PieceVisitor = (
  kind: Piece,
  cx: number,
  cy: number,
  w: number,
  h: number
) => void

// Parcourt les pièces d'une lettre (origine en haut à gauche de la grille).
// Utilisé pour l'écran (glyphPieces) et pour l'export .otf : les deux ont exactement les mêmes pièces.
export function forEachPiece(
  c: string,
  U: number,
  P: Params,
  visit: PieceVisitor
) {
  const bm = bitmap(c, P)
  const { xs, ys } = glyphGrid(c, U, P)
  bm.forEach((row, i) =>
    row.forEach((v, j) => {
      if (!v) return
      const cw = xs[j + 1] - xs[j]
      const ch = ys[i + 1] - ys[i]
      const inset = (P.gap * Math.min(cw, ch)) / 2
      const w = (cw - inset * 2) * v
      const h = (ch - inset * 2) * v
      if (w > 0 && h > 0) {
        const kind = pieceKind(c.charCodeAt(0) * 97 + i * 13 + j * 7 + 1, P)
        visit(kind, (xs[j] + xs[j + 1]) / 2, (ys[i] + ys[i + 1]) / 2, w, h)
      }
    })
  )
}

// Une Path2D par pièce. On remplit chaque pièce séparément : en « pair-impair », deux pièces qui se
// chevauchent (écart négatif) laisseraient un trou à l'endroit où elles se croisent.
export function glyphPieces(
  c: string,
  ox: number,
  oy: number,
  U: number,
  P: Params
) {
  const pieces: Path2D[] = []
  forEachPiece(c, U, P, (kind, cx, cy, w, h) => {
    const path = new Path2D()
    shape(path, kind, ox + cx, oy + cy, w, h, P)
    pieces.push(path)
  })
  return pieces
}

function fillPieces(ctx: CanvasRenderingContext2D, pieces: Path2D[]) {
  for (const p of pieces) ctx.fill(p, "evenodd")
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  c: string,
  ox: number,
  oy: number,
  U: number,
  P: Params,
  col: Colors,
  withSkeleton = true
) {
  const { xs, ys } = glyphGrid(c, U, P)
  ctx.save()
  ctx.strokeStyle = col.accent
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1
  for (let i = 0; i + 1 < ys.length; i++)
    for (let j = 0; j + 1 < xs.length; j++)
      ctx.strokeRect(
        ox + xs[j] + 0.5,
        oy + ys[i] + 0.5,
        xs[j + 1] - xs[j] - 1,
        ys[i + 1] - ys[i] - 1
      )
  if (withSkeleton) {
    ctx.globalAlpha = 0.9
    ctx.lineWidth = Math.max(1.5, U * 0.08)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    for (const s of skeleton(c, P)) {
      ctx.beginPath()
      s.forEach((pt, k) => {
        const x = ox + center(xs, pt.x)
        const y = oy + center(ys, pt.y)
        if (k) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      })
      if (s.length === 1)
        ctx.lineTo(ox + center(xs, s[0].x) + 0.01, oy + center(ys, s[0].y))
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  c: string,
  ox: number,
  oy: number,
  U: number,
  P: Params,
  col: Colors
) {
  if (!GLYPHS[c]) return
  const pieces = glyphPieces(c, ox, oy, U, P)
  if (P.mode === "plein") {
    ctx.fillStyle = col.fg
    fillPieces(ctx, pieces)
  } else {
    // Contour : trait épais, puis remplissage couleur du fond par-dessus
    ctx.lineWidth = P.str * U * 2
    ctx.lineJoin = "round"
    ctx.strokeStyle = col.fg
    for (const p of pieces) ctx.stroke(p)
    ctx.fillStyle = col.bg
    fillPieces(ctx, pieces)
  }
  if (P.grid) drawGrid(ctx, c, ox, oy, U, P, col)
}

export function tracking(U: number, P: Params) {
  return U * P.wid * Math.max(1, Math.round(P.rows / 7))
}

export function advance(c: string, U: number, P: Params) {
  if (c === " ") return U * P.wid * Math.max(2, Math.round(P.rows * 0.45))
  return GLYPHS[c] ? glyphCols(c, P) * U * P.wid + tracking(U, P) : 0
}

// Enlève les accents (en attendant les lettres accentuées) et ramène les apostrophes et guillemets typographiques
export function cleanText(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
}

// Largeur d'un mot : avances des lettres + crénage entre chaque paire
function wordWidth(word: string, U: number, P: Params) {
  const chars = [...word]
  return chars.reduce(
    (s, c, i) =>
      s + advance(c, U, P) + (i ? kerning(chars[i - 1], c, U, P) : 0),
    0
  )
}

function layout(text: string, U: number, maxW: number, P: Params) {
  const lines: string[] = []
  for (const par of cleanText(text).split("\n")) {
    let line = ""
    let lw = 0
    for (const word of par.split(" ")) {
      const ww = wordWidth(word, U, P)
      const sp = line ? advance(" ", U, P) : 0
      if (line && lw + sp + ww > maxW) {
        lines.push(line)
        line = word
        lw = ww
      } else {
        line += (line ? " " : "") + word
        lw += sp + ww
      }
    }
    lines.push(line)
  }
  return lines
}

function setupCanvas(cv: HTMLCanvasElement, cssW: number, cssH: number) {
  const dpr = window.devicePixelRatio || 1
  cv.width = Math.round(cssW * dpr)
  cv.height = Math.round(cssH * dpr)
  cv.style.height = cssH + "px"
  const ctx = cv.getContext("2d")!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)
  return ctx
}

// De combien les pièces peuvent dépasser de la grille, en cases :
// fusion (écart négatif, amplifié par la variation organique) et épaisseur du trait en mode contour.
export function bleed(P: Params) {
  return (
    (Math.max(0, -P.gap) * (1 + P.org)) / 2 + (P.mode === "contour" ? P.str : 0)
  )
}

// capH = hauteur des capitales en pixels ; la taille des cases s'en déduit
export function renderText(
  cv: HTMLCanvasElement,
  text: string,
  capH: number,
  lineGap: number,
  P: Params,
  col: Colors
) {
  const W = cv.clientWidth || cv.parentElement?.clientWidth || 300
  const slant = Math.tan((P.sla * Math.PI) / 180)
  const m = vMetrics(P)
  // Place prise en plus du texte, en part de capH : inclinaison, débordement des pièces des deux côtés,
  // et jambages qui partent vers la gauche quand le texte est incliné
  const extra = () => slant + (2 * bleed(P) + slant * m.desc) / P.rows
  // Réduit la taille si le mot le plus long ne tient pas sur une ligne
  const words = cleanText(text).split(/\s+/)
  const widest = Math.max(...words.map((w) => wordWidth(w, capH / P.rows, P)))
  if (widest + capH * extra() > W - 4)
    capH *= (W - 4) / (widest + capH * extra())
  const U = capH / P.rows
  const pad = bleed(P) * U // marge tout autour pour les pièces qui débordent
  const padLeft = pad + slant * m.desc * U
  const descH = m.desc * U // place des jambages sous la ligne de base
  const lines = layout(text, U, W - capH * extra() - 2, P)
  const lh = capH * (1 + lineGap) + descH + 2 * pad
  const H = (lines.length - 1) * lh + capH + descH + 2 * pad + 4
  const ctx = setupCanvas(cv, W, H)
  lines.forEach((line, li) => {
    ctx.save()
    ctx.translate(padLeft, pad + li * lh + capH)
    ctx.transform(1, 0, -slant, 1, 0, 0)
    let x = 0
    const chars = [...line]
    chars.forEach((c, i) => {
      if (i) x += kerning(chars[i - 1], c, U, P)
      drawGlyph(ctx, c, x, -capH, U, P, col)
      x += advance(c, U, P)
    })
    ctx.restore()
  })
}

export function renderStep(
  cv: HTMLCanvasElement,
  step: 1 | 2 | 3,
  c: string,
  P: Params,
  col: Colors
) {
  const W = cv.clientWidth || 120
  const H = (W * 5) / 4
  const ctx = setupCanvas(cv, W, H)
  const nc = glyphCols(c, P)
  const nr = vMetrics(P).total
  const b = 2 * bleed(P) // les pièces qui débordent doivent rester visibles
  const U = Math.min((H - 16) / (nr + b), (W - 16) / (nc * P.wid + b))
  const ox = (W - nc * U * P.wid) / 2
  const oy = (H - nr * U) / 2
  if (step === 1) drawGrid(ctx, c, ox, oy, U, P, col)
  if (step === 2) {
    drawGrid(ctx, c, ox, oy, U, P, col, false)
    ctx.fillStyle = col.fg
    const { xs, ys } = glyphGrid(c, U, P)
    bitmap(c, P).forEach((row, i) =>
      row.forEach((v, j) => {
        if (!v) return
        ctx.globalAlpha = v === 1 ? 0.85 : 0.35
        ctx.fillRect(
          ox + xs[j] + 1,
          oy + ys[i] + 1,
          xs[j + 1] - xs[j] - 2,
          ys[i + 1] - ys[i] - 2
        )
      })
    )
    ctx.globalAlpha = 1
  }
  if (step === 3) {
    ctx.fillStyle = col.fg
    fillPieces(ctx, glyphPieces(c, ox, oy, U, P))
  }
}
