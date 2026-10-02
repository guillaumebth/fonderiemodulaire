// Dessin sur canvas : lettres, grille, mise en page du texte, étapes de construction.

import { CAP_ACCENTED, GLYPHS } from "./glyphs"
import type { Params } from "./params"
import { pieceKind, rotated, shape, type Piece } from "./shapes"
import { traceHalfWidth, tracePositions, traceSize } from "./trace"
import { capTopLift, center, glyphGrid } from "./grid"
import { kerning } from "./kerning"
import { bitmap, glyphCols, skeleton, vMetrics } from "./skeleton"

export type Colors = {
  bg: string
  fg: string
  accent: string
  line: string
  path: string // tracé de la vue technique (rouge vif)
}

// Les couleurs viennent des variables CSS de globals.css (et suivent donc le mode sombre).
// On les lit sur le canvas lui-même : un bloc parent peut les redéfinir (cartes colorées du Showcase).
export function readColors(el: Element = document.documentElement): Colors {
  const s = getComputedStyle(el)
  const g = (n: string) => s.getPropertyValue(n).trim()
  return {
    bg: g("--background"),
    fg: g("--foreground"),
    accent: g("--brand"),
    path: g("--path"),
    line: g("--border"),
  }
}

type PieceVisitor = (
  kind: Piece,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angle: number
) => void

// Parcourt les pièces d'une lettre (origine en haut à gauche de la grille).
// Utilisé pour l'écran (glyphPieces) et pour l'export .otf : les deux ont exactement les mêmes pièces.
export function forEachPiece(
  c: string,
  U: number,
  P: Params,
  visit: PieceVisitor
) {
  if (P.layout === "trace") {
    const size = traceSize(P) * U
    tracePositions(c, P).forEach((p, k) => {
      const kind = pieceKind(c.charCodeAt(0) * 97 + k * 13 + 1, P)
      if (size > 0)
        visit(
          kind,
          p.x * U,
          p.y * U,
          size * P.wid,
          size,
          P.orient ? p.angle : 0
        )
    })
    return
  }
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
        visit(kind, (xs[j] + xs[j + 1]) / 2, (ys[i] + ys[i + 1]) / 2, w, h, 0)
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
  forEachPiece(c, U, P, (kind, cx, cy, w, h, angle) => {
    const path = new Path2D()
    const x = ox + cx
    const y = oy + cy
    shape(rotated(path, x, y, angle), kind, x, y, w, h, P)
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
    ctx.strokeStyle = col.path
    ctx.globalAlpha = 1
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

export function tracking(U: number, P: Params) {
  return U * P.wid * Math.max(1, Math.round(P.rows / 7))
}

export function advance(c: string, U: number, P: Params) {
  if (c === " ") return U * P.wid * Math.max(2, Math.round(P.rows * 0.45))
  return GLYPHS[c] ? glyphCols(c, P) * U * P.wid + tracking(U, P) : 0
}

// Ramène les apostrophes et guillemets typographiques, et remplace une lettre accentuée que la police
// n'a pas encore (ex. « ō ») par sa lettre de base ; les accents dessinés (é, à, ç…) sont gardés.
export function cleanText(s: string) {
  return [...s.normalize("NFC").replace(/[‘’]/g, "'").replace(/[“”]/g, '"')]
    .map((c) =>
      GLYPHS[c] ? c : c.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    )
    .join("")
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
  const stroke = P.mode === "contour" ? P.str : 0
  if (P.layout === "trace") {
    // Le tracé passe au centre des cases du bord ; on déborde de la demi-épaisseur du trait
    // (rangées comprises) ; une pièce tournée prend plus de place
    const grow = Math.max(1, P.wid) * (P.orient ? Math.SQRT2 : 1)
    return Math.max(0, traceHalfWidth(P) * grow - 0.5) * (1 + P.org) + stroke
  }
  return (Math.max(0, -P.gap) * (1 + P.org)) / 2 + stroke
}

// Une pièce du texte, prête à dessiner (ou à animer).
// key identifie la pièce d'un réglage à l'autre (n° du caractère dans le texte, n° de la pièce dans la lettre) ;
// x, y sont donnés avant l'inclinaison, qui se fait autour de la ligne de base (base).
export type TextPiece = {
  key: string
  kind: Piece
  x: number
  y: number
  w: number
  h: number
  angle: number
  base: number
  s: number // échelle d'apparition (0 = invisible, 1 = normale)
}

export type TextLayout = {
  W: number
  H: number
  U: number
  slant: number
  pieces: TextPiece[]
  glyphs: { c: string; x: number; top: number; base: number }[]
  // Position juste après la dernière lettre (pour dessiner le curseur de saisie)
  end: { x: number; top: number; base: number }
}

// Met le texte en page et calcule toutes ses pièces.
// capH = hauteur des capitales en pixels ; la taille des cases s'en déduit
// Première ligne de la grille occupée par une pièce dans ce texte : avec une graisse forte,
// les lettres débordent au-dessus des capitales (mode grille ; le mode tracé est couvert par bleed)
function firstRow(text: string, P: Params) {
  const { above } = vMetrics(P)
  if (P.layout !== "grille") return above
  let first = above
  for (const c of new Set(cleanText(text)))
    if (GLYPHS[c]) {
      const i = bitmap(c, P).findIndex((row) => row.some((v) => v > 0))
      if (i >= 0) first = Math.min(first, i)
    }
  return first
}

export function layoutText(
  W: number,
  text: string,
  capH: number,
  lineGap: number,
  P: Params,
  center = false // centre chaque ligne dans la largeur
): TextLayout {
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
  const aboveH = m.above * U // lignes des accents des capitales, au-dessus du haut des capitales
  // On ne réserve cette place que si elle sert : capitale accentuée dans le texte, ou grille affichée.
  // Sinon, juste ce dont le haut des lettres peut remonter avec la variation organique.
  const reserve =
    P.grid || [...cleanText(text)].some((c) => CAP_ACCENTED.has(c))
      ? aboveH
      : capTopLift(U, P, firstRow(text, P))
  const lines = layout(text, U, W - capH * extra() - 2, P)
  const lh = capH * (1 + lineGap) + descH + 2 * pad + reserve
  const H = (lines.length - 1) * lh + reserve + capH + descH + 2 * pad + 4

  const pieces: TextPiece[] = []
  const glyphs: TextLayout["glyphs"] = []
  let index = 0 // n° du caractère dans le texte, pour reconnaître les pièces d'un réglage à l'autre
  let end = { x: padLeft, top: pad + reserve, base: pad + reserve + capH }
  lines.forEach((line, li) => {
    const base = pad + reserve + li * lh + capH
    const top = base - capH - aboveH // haut de la grille (au-dessus : rien)
    const chars = [...line]
    // Largeur de la ligne (sans l'espace qui suit la dernière lettre), pour la centrer
    const lineW = center
      ? chars.reduce(
          (w, c, i) =>
            w + advance(c, U, P) + (i ? kerning(chars[i - 1], c, U, P) : 0),
          0
        ) - tracking(U, P)
      : 0
    let x = center ? Math.max(padLeft, (W - lineW) / 2) : padLeft
    chars.forEach((c, i) => {
      if (i) x += kerning(chars[i - 1], c, U, P)
      if (GLYPHS[c]) {
        glyphs.push({ c, x, top, base })
        let k = 0
        const ci = index
        forEachPiece(c, U, P, (kind, cx, cy, w, h, angle) => {
          pieces.push({
            key: `${ci}:${k++}`,
            kind,
            x: x + cx,
            y: top + cy,
            w,
            h,
            angle,
            base,
            s: 1,
          })
        })
      }
      x += advance(c, U, P)
      index++
    })
    index++ // l'espace ou le retour à la ligne qui sépare les lignes
    // le curseur se place au milieu de l'espace qui suit la dernière lettre
    end = {
      x: chars.length ? x - tracking(U, P) / 2 : x,
      top: base - capH,
      base,
    }
  })
  return { W, H, U, slant, pieces, glyphs, end }
}

// Ne redimensionne le canvas que si sa taille change (sinon on l'efface simplement)
function prepareCanvas(
  cv: HTMLCanvasElement,
  cssW: number,
  cssH: number,
  scale?: number
) {
  const dpr = scale ?? (window.devicePixelRatio || 1)
  const w = Math.round(cssW * dpr)
  const h = Math.round(cssH * dpr)
  if (cv.width !== w || cv.height !== h) {
    cv.width = w
    cv.height = h
    cv.style.height = cssH + "px"
  }
  const ctx = cv.getContext("2d")!
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)
  return { ctx, dpr }
}

// Dessine des pièces (celles de la mise en page, ou une étape d'animation)
export function drawText(
  cv: HTMLCanvasElement,
  L: TextLayout,
  pieces: TextPiece[],
  P: Params,
  col: Colors,
  scale?: number // résolution forcée (export PNG) ; sinon celle de l'écran
) {
  const { ctx, dpr } = prepareCanvas(cv, L.W, L.H, scale)
  // Inclinaison autour de la ligne de base de chaque pièce
  const frame = (base: number) =>
    ctx.setTransform(dpr, 0, -L.slant * dpr, dpr, L.slant * base * dpr, 0)
  const path = (p: TextPiece) => {
    const path = new Path2D()
    shape(
      rotated(path, p.x, p.y, p.angle),
      p.kind,
      p.x,
      p.y,
      p.w * p.s,
      p.h * p.s,
      P
    )
    return path
  }
  const visible = pieces.filter((p) => p.s > 0.01)
  const paths = visible.map(path)
  if (P.mode === "contour") {
    // Contour : trait épais, puis remplissage couleur du fond par-dessus
    ctx.lineWidth = P.str * L.U * 2
    ctx.lineJoin = "round"
    ctx.strokeStyle = col.fg
    visible.forEach((p, i) => {
      frame(p.base)
      ctx.stroke(paths[i])
    })
  }
  ctx.fillStyle = P.mode === "contour" ? col.bg : col.fg
  visible.forEach((p, i) => {
    frame(p.base)
    ctx.fill(paths[i], "evenodd")
  })
  if (P.grid)
    for (const g of L.glyphs) {
      frame(g.base)
      drawGrid(ctx, g.c, g.x, g.top, L.U, P, col)
    }
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
  if (step === 2 && P.layout === "trace") {
    // Le tracé, avec un point à chaque endroit où une pièce sera posée
    drawGrid(ctx, c, ox, oy, U, P, col)
    ctx.fillStyle = col.path
    for (const p of tracePositions(c, P)) {
      ctx.beginPath()
      ctx.arc(ox + p.x * U, oy + p.y * U, Math.max(2, U * 0.14), 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (step === 2) {
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
