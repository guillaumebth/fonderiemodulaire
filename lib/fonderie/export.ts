// Export .otf : chaque lettre devient l'union de ses pièces, converties en contours.
//
// Les difficultés :
// - les arcs (ronds, coins arrondis) deviennent des courbes de Bézier cubiques ;
// - à l'écran, les trous sont faits en « pair-impair » (evenodd). Une police utilise la règle « non nul » (nonzero) :
//   un trou doit tourner dans le sens inverse du contour qui l'entoure. On calcule donc, pour chaque pièce,
//   la profondeur de chaque contour (combien d'autres contours l'entourent) et on l'oriente en conséquence.

import { Font, Glyph, Path } from "opentype.js"

import { CHARSET } from "./glyphs"
import type { Params } from "./params"
import { kerning } from "./kerning"
import { advance, bleed, forEachPiece, tracking } from "./render"
import { addTable, makeKernTable, type KernPair } from "./sfnt"
import { vMetrics } from "./skeleton"
import { rotated, shape, type PathSink } from "./shapes"

type Pt = { x: number; y: number }
type Seg = { kind: "L"; p: Pt } | { kind: "C"; c1: Pt; c2: Pt; p: Pt }
type Contour = { start: Pt; segs: Seg[] }

// ---------- Enregistreur : reçoit les mêmes ordres que Path2D, produit des contours ----------

class ContourRecorder implements PathSink {
  contours: Contour[] = []
  private cur: Contour | null = null
  private pos: Pt = { x: 0, y: 0 }

  private finish() {
    if (this.cur && this.cur.segs.length) this.contours.push(this.cur)
    this.cur = null
  }

  moveTo(x: number, y: number) {
    this.finish()
    this.cur = { start: { x, y }, segs: [] }
    this.pos = { x, y }
  }

  lineTo(x: number, y: number) {
    if (!this.cur) return this.moveTo(x, y)
    if (Math.hypot(x - this.pos.x, y - this.pos.y) < 1e-9) return
    this.cur.segs.push({ kind: "L", p: { x, y } })
    this.pos = { x, y }
  }

  arc(cx: number, cy: number, r: number, a0: number, a1: number, ccw = false) {
    const TAU = Math.PI * 2
    const start = { x: cx + r * Math.cos(a0), y: cy + r * Math.sin(a0) }
    if (this.cur) this.lineTo(start.x, start.y)
    else this.moveTo(start.x, start.y)
    if (r <= 0) return
    let sweep = ccw ? a0 - a1 : a1 - a0
    sweep = sweep >= TAU ? TAU : ((sweep % TAU) + TAU) % TAU
    if (sweep < 1e-9) return
    const n = Math.ceil(sweep / (Math.PI / 2) - 1e-9)
    const step = ((ccw ? -1 : 1) * sweep) / n
    const k = (4 / 3) * Math.tan(step / 4)
    let t0 = a0
    for (let i = 0; i < n; i++) {
      const t1 = t0 + step
      const p0 = { x: cx + r * Math.cos(t0), y: cy + r * Math.sin(t0) }
      const p1 = { x: cx + r * Math.cos(t1), y: cy + r * Math.sin(t1) }
      this.cur!.segs.push({
        kind: "C",
        c1: { x: p0.x - k * r * Math.sin(t0), y: p0.y + k * r * Math.cos(t0) },
        c2: { x: p1.x + k * r * Math.sin(t1), y: p1.y - k * r * Math.cos(t1) },
        p: p1,
      })
      this.pos = p1
      t0 = t1
    }
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, r: number) {
    const p0 = this.pos
    const v1 = { x: p0.x - x1, y: p0.y - y1 }
    const v2 = { x: x2 - x1, y: y2 - y1 }
    const l1 = Math.hypot(v1.x, v1.y)
    const l2 = Math.hypot(v2.x, v2.y)
    const cross = v1.x * v2.y - v1.y * v2.x
    if (r <= 0 || !l1 || !l2 || Math.abs(cross) < 1e-9)
      return this.lineTo(x1, y1)
    const u1 = { x: v1.x / l1, y: v1.y / l1 }
    const u2 = { x: v2.x / l2, y: v2.y / l2 }
    const theta = Math.acos(
      Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y))
    )
    const d = r / Math.tan(theta / 2)
    const t1 = { x: x1 + u1.x * d, y: y1 + u1.y * d }
    const t2 = { x: x1 + u2.x * d, y: y1 + u2.y * d }
    const bis = { x: u1.x + u2.x, y: u1.y + u2.y }
    const bl = Math.hypot(bis.x, bis.y)
    const h = r / Math.sin(theta / 2)
    const c = { x: x1 + (bis.x / bl) * h, y: y1 + (bis.y / bl) * h }
    const a0 = Math.atan2(t1.y - c.y, t1.x - c.x)
    const a1 = Math.atan2(t2.y - c.y, t2.x - c.x)
    let delta = a1 - a0
    while (delta > Math.PI) delta -= Math.PI * 2
    while (delta <= -Math.PI) delta += Math.PI * 2
    this.lineTo(t1.x, t1.y)
    this.arc(c.x, c.y, r, a0, a1, delta < 0)
  }

  closePath() {
    if (!this.cur) return
    const s = this.cur.start
    this.lineTo(s.x, s.y)
    this.pos = s
    this.finish()
  }

  done() {
    this.finish()
    return this.contours
  }
}

// ---------- Géométrie des contours ----------

function mapContour(ct: Contour, f: (p: Pt) => Pt): Contour {
  return {
    start: f(ct.start),
    segs: ct.segs.map((s) =>
      s.kind === "L"
        ? { kind: "L", p: f(s.p) }
        : { kind: "C", c1: f(s.c1), c2: f(s.c2), p: f(s.p) }
    ),
  }
}

// Polygone approché (points + poignées), suffisant pour l'aire et les tests d'inclusion
function polygon(ct: Contour) {
  const pts = [ct.start]
  for (const s of ct.segs) {
    if (s.kind === "C") pts.push(s.c1, s.c2)
    pts.push(s.p)
  }
  return pts
}

function signedArea(pts: Pt[]) {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % pts.length]
    a += p.x * q.y - q.x * p.y
  }
  return a / 2
}

function inside(pt: Pt, poly: Pt[]) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (
      a.y > pt.y !== b.y > pt.y &&
      pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x
    )
      hit = !hit
  }
  return hit
}

function reverse(ct: Contour): Contour {
  const pts = [ct.start, ...ct.segs.map((s) => s.p)]
  const segs: Seg[] = []
  for (let i = ct.segs.length - 1; i >= 0; i--) {
    const s = ct.segs[i]
    const to = pts[i]
    segs.push(
      s.kind === "L"
        ? { kind: "L", p: to }
        : { kind: "C", c1: s.c2, c2: s.c1, p: to }
    )
  }
  return { start: pts[pts.length - 1], segs }
}

// Contour extérieur = sens inverse des aiguilles d'une montre (convention CFF, y vers le haut) ; trou = l'inverse
function orient(contours: Contour[]) {
  const polys = contours.map(polygon)
  return contours.map((ct, i) => {
    const depth = polys.filter(
      (poly, j) => j !== i && inside(ct.start, poly)
    ).length
    const wantCCW = depth % 2 === 0
    const isCCW = signedArea(polys[i]) > 0
    return wantCCW === isCCW ? ct : reverse(ct)
  })
}

// ---------- Construction de la police ----------

const UPM = 1000 // unités par em
const CAP = 700 // hauteur des capitales, en unités

const NAMES: Record<string, string> = {
  "0": "zero",
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  ".": "period",
  ",": "comma",
  ";": "semicolon",
  "'": "quotesingle",
  '"': "quotedbl",
  "(": "parenleft",
  ")": "parenright",
  "/": "slash",
  "&": "ampersand",
  "@": "at",
  "#": "numbersign",
  "€": "Euro",
  "%": "percent",
  "!": "exclam",
  ":": "colon",
  "-": "hyphen",
  "?": "question",
}

// Coordonnées entières : opentype.js arrondit chaque déplacement relatif, des décimales feraient dériver les contours
const r = Math.round

const EXTRA_UNICODES: Record<string, number[]> = {
  "'": [0x2018, 0x2019],
  '"': [0x201c, 0x201d],
}

function buildGlyph(c: string, P: Params) {
  const U = CAP / P.rows
  const slant = Math.tan((P.sla * Math.PI) / 180)
  const lsb = tracking(U, P) / 2
  // Canvas (y vers le bas, origine en haut de la grille) → police (y vers le haut, origine sur la ligne de base)
  const toFont = (p: Pt): Pt => {
    const y = CAP - p.y
    return { x: r(lsb + p.x + slant * y), y: r(y) }
  }
  const path = new Path()
  forEachPiece(c, U, P, (kind, cx, cy, w, h, angle) => {
    const rec = new ContourRecorder()
    shape(rotated(rec, cx, cy, angle), kind, cx, cy, w, h, P)
    const contours = orient(rec.done().map((ct) => mapContour(ct, toFont)))
    for (const ct of contours) {
      path.moveTo(ct.start.x, ct.start.y)
      for (const s of ct.segs) {
        if (s.kind === "L") path.lineTo(s.p.x, s.p.y)
        else path.curveTo(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.p.x, s.p.y)
      }
      path.close()
    }
  })
  return new Glyph({
    name: NAMES[c] ?? c,
    // Les apostrophes et guillemets typographiques (’ ‘ “ ”) utilisent le même dessin
    unicodes: [c.charCodeAt(0), ...(EXTRA_UNICODES[c] ?? [])],
    advanceWidth: Math.round(advance(c, U, P)),
    path,
  })
}

export function buildFont(P: Params, familyName: string) {
  const U = CAP / P.rows
  const glyphs = [
    new Glyph({
      name: ".notdef",
      advanceWidth: Math.round(advance(" ", U, P)),
      path: new Path(),
    }),
    new Glyph({
      name: "space",
      unicode: 32,
      advanceWidth: Math.round(advance(" ", U, P)),
      path: new Path(),
    }),
    ...CHARSET.map((c) => buildGlyph(c, P)),
  ]
  return new Font({
    familyName,
    styleName: "Regular",
    unitsPerEm: UPM,
    // Les pièces du haut et du bas débordent d'une demi-case au plus : on garde un peu de marge
    ascender: Math.round(CAP + U * (1 + bleed(P))),
    descender: -Math.round((vMetrics(P).desc + 1 + bleed(P)) * U),
    glyphs,
  })
}

export function fileName(familyName: string) {
  const slug = familyName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return (slug || "fonderie") + ".otf"
}

// Paires de crénage, en index de glyphes (0 = .notdef, 1 = espace, puis CHARSET dans l'ordre)
function kernPairs(P: Params): KernPair[] {
  const U = CAP / P.rows
  const pairs: KernPair[] = []
  CHARSET.forEach((a, i) =>
    CHARSET.forEach((b, j) => {
      const value = Math.round(kerning(a, b, U, P))
      if (value) pairs.push({ left: i + 2, right: j + 2, value })
    })
  )
  return pairs
}

// Le fichier .otf complet, crénage compris
export function fontFile(P: Params, familyName: string) {
  const bytes = buildFont(P, familyName).toArrayBuffer()
  const pairs = kernPairs(P)
  return pairs.length ? addTable(bytes, "kern", makeKernTable(pairs)) : bytes
}

// Construit la police et lance le téléchargement dans le navigateur
export function downloadFont(P: Params, familyName: string) {
  const blob = new Blob([fontFile(P, familyName)], { type: "font/otf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName(familyName)
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
