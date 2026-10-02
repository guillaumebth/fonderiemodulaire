// Export .otf : chaque lettre devient l'union de ses pièces, converties en contours.
//
// Les difficultés :
// - les arcs (ronds, coins arrondis) deviennent des courbes de Bézier cubiques ;
// - à l'écran, les trous sont faits en « pair-impair » (evenodd). Une police utilise la règle « non nul » (nonzero) :
//   un trou doit tourner dans le sens inverse du contour qui l'entoure. On calcule donc, pour chaque pièce,
//   la profondeur de chaque contour (combien d'autres contours l'entourent) et on l'oriente en conséquence.

import { Font, Glyph, Path } from "opentype.js"

import { ACCENT_NAMES, CHARSET } from "./glyphs"
import type { Params } from "./params"
import { kerning } from "./kerning"
import { advance, bleed, forEachPiece, tracking } from "./render"
import { addTable, makeKernTable, type KernPair } from "./sfnt"
import { vMetrics } from "./skeleton"
import { rotated, shape } from "./shapes"

import { ContourRecorder, type Contour, type Pt, type Seg } from "./contours"

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
    // la grille commence « above » lignes au-dessus du haut des capitales
    const y = CAP + vMetrics(P).above * U - p.y
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
    name: NAMES[c] ?? ACCENT_NAMES[c] ?? c,
    // Les apostrophes et guillemets typographiques (’ ‘ “ ”) utilisent le même dessin
    unicodes: [c.charCodeAt(0), ...(EXTRA_UNICODES[c] ?? [])],
    advanceWidth: Math.round(advance(c, U, P)),
    path,
  })
}

// Version d'essai gratuite : capitales et chiffres seulement (le site, lui, montre toute la police)
export const TRIAL_CHARSET = CHARSET.filter((c) => /[A-Z0-9]/.test(c))

export function buildFont(
  P: Params,
  familyName: string,
  chars: string[] = CHARSET
) {
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
    ...chars.map((c) => buildGlyph(c, P)),
  ]
  return new Font({
    familyName,
    styleName: "Regular",
    unitsPerEm: UPM,
    // Les pièces du haut et du bas débordent d'une demi-case au plus : on garde un peu de marge
    ascender: Math.round(CAP + U * (vMetrics(P).above + 1 + bleed(P))),
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

// Paires de crénage, en index de glyphes (0 = .notdef, 1 = espace, puis les caractères dans l'ordre)
// Une table « kern » (format 0) ne peut pas dépasser 65 535 octets, soit 10 920 paires :
// au-delà, Windows, Word ou InDesign peuvent ignorer le crénage, voire la police.
const MAX_KERN_PAIRS = 10920
const MIN_KERN = 5 // en unités (1/1000 em) : en dessous, l'ajustement ne se voit pas

function kernPairs(P: Params, chars: string[]): KernPair[] {
  const U = CAP / P.rows
  const pairs: KernPair[] = []
  chars.forEach((a, i) =>
    chars.forEach((b, j) => {
      const value = Math.round(kerning(a, b, U, P))
      if (Math.abs(value) >= MIN_KERN)
        pairs.push({ left: i + 2, right: j + 2, value })
    })
  )
  // Trop de paires : on garde les ajustements les plus forts (les plus visibles)
  if (pairs.length > MAX_KERN_PAIRS) {
    pairs.sort((p, q) => Math.abs(q.value) - Math.abs(p.value))
    pairs.length = MAX_KERN_PAIRS
  }
  return pairs
}

// Le fichier .otf, crénage compris (toute la police, ou seulement les caractères donnés)
export function fontFile(
  P: Params,
  familyName: string,
  chars: string[] = CHARSET
) {
  const bytes = buildFont(P, familyName, chars).toArrayBuffer()
  const pairs = kernPairs(P, chars)
  return pairs.length ? addTable(bytes, "kern", makeKernTable(pairs)) : bytes
}

// Nom de la version d'essai : « Trial » est ajouté au nom choisi
export const trialName = (familyName: string) => `${familyName} Trial`

// Construit la police et lance le téléchargement dans le navigateur. Renvoie le nom du fichier.
// full : version complète (tous les caractères, sans « Trial »), débloquée par une clé de licence.
export function downloadFont(P: Params, familyName: string, full = false) {
  const family = full ? familyName : trialName(familyName)
  const blob = new Blob([fontFile(P, family, full ? CHARSET : TRIAL_CHARSET)], {
    type: "font/otf",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName(family)
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return a.download
}
