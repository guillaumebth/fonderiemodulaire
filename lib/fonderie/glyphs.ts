// Tracés des lettres.
// Coordonnées de 0 à 1 (x vers la droite, y vers le bas). Un point [x, y, 1] garde un angle vif.
// w = largeur relative de la lettre (1 = largeur normale, 0 = une seule colonne).
// Un tracé dont le premier et le dernier point sont identiques est fermé. Un tracé d'un seul point fait un point.
//
// Capitales, chiffres, ponctuation : y = 0 en haut des capitales, y = 1 sur la ligne de base,
//   y = 2 en bas des jambages (virgule, parenthèses…), y = -1 en haut de la zone des accents (É, À…).
// Minuscules : y = 0 sur la hauteur d'x, y = 1 sur la ligne de base,
//   y = -1 en haut des hampes (b, d, h, k, l…, à la hauteur des capitales), y = 2 en bas des jambages (g, j, p, q, y).

export type GlyphPoint = [number, number] | [number, number, 1]
export type Stroke = GlyphPoint[]
export type Glyph = { w?: number; s: Stroke[] }

const O_: Stroke = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]

export const GLYPHS: Record<string, Glyph> = {
  A: { s: [[[0, 1], [0, 0], [1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]] },
  B: { s: [[[0, 0, 1], [0, 1, 1]], [[0, 0, 1], [0.8, 0], [0.8, 0.5], [0, 0.5, 1]], [[0, 0.5, 1], [1, 0.5], [1, 1], [0, 1, 1]]] },
  C: { s: [[[1, 0], [0, 0], [0, 1], [1, 1]]] },
  D: { s: [[[0, 0, 1], [1, 0], [1, 1], [0, 1, 1], [0, 0, 1]]] },
  E: { s: [[[1, 0, 1], [0, 0, 1], [0, 1, 1], [1, 1, 1]], [[0, 0.5], [0.8, 0.5]]] },
  F: { s: [[[1, 0, 1], [0, 0, 1], [0, 1, 1]], [[0, 0.5], [0.8, 0.5]]] },
  G: { s: [[[1, 0], [0, 0], [0, 1], [1, 1], [1, 0.5, 1], [0.5, 0.5]]] },
  H: { s: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]] },
  I: { w: 0.6, s: [[[0.5, 0], [0.5, 1]], [[0, 0], [1, 0]], [[0, 1], [1, 1]]] },
  J: { s: [[[1, 0], [1, 1], [0, 1], [0, 0.7]]] },
  K: { s: [[[0, 0], [0, 1]], [[1, 0, 1], [0, 0.55, 1], [1, 1, 1]]] },
  L: { s: [[[0, 0, 1], [0, 1, 1], [1, 1, 1]]] },
  M: { w: 1.4, s: [[[0, 1, 1], [0, 0, 1], [0.5, 0.55, 1], [1, 0, 1], [1, 1, 1]]] },
  N: { s: [[[0, 1, 1], [0, 0, 1], [1, 1, 1], [1, 0, 1]]] },
  O: { s: [O_] },
  P: { s: [[[0, 1, 1], [0, 0, 1], [1, 0], [1, 0.5], [0, 0.5, 1]]] },
  Q: { s: [O_, [[0.55, 0.65, 1], [1, 1, 1]]] },
  R: { s: [[[0, 1, 1], [0, 0, 1], [1, 0], [1, 0.5], [0, 0.5, 1]], [[0.45, 0.5, 1], [1, 1, 1]]] },
  S: { s: [[[1, 0], [0, 0], [0, 0.5], [1, 0.5], [1, 1], [0, 1]]] },
  T: { s: [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 1]]] },
  U: { s: [[[0, 0], [0, 1], [1, 1], [1, 0]]] },
  V: { s: [[[0, 0], [0, 0.55, 1], [0.5, 1, 1], [1, 0.55, 1], [1, 0]]] },
  W: { w: 1.4, s: [[[0, 0, 1], [0, 1, 1], [0.5, 0.5, 1], [1, 1, 1], [1, 0, 1]]] },
  X: { s: [[[0, 0], [1, 1]], [[1, 0], [0, 1]]] },
  Y: { s: [[[0, 0, 1], [0.5, 0.5, 1], [1, 0, 1]], [[0.5, 0.5], [0.5, 1]]] },
  Z: { s: [[[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]] },
  "0": { s: [O_, [[0.8, 0.2], [0.2, 0.8]]] },
  "1": { w: 0.6, s: [[[0, 0.2, 1], [0.5, 0, 1], [0.5, 1, 1]], [[0, 1], [1, 1]]] },
  "2": { s: [[[0, 0], [1, 0], [1, 0.5], [0, 0.5], [0, 1, 1], [1, 1, 1]]] },
  "3": { s: [[[0, 0], [1, 0], [1, 1], [0, 1]], [[0.3, 0.5], [1, 0.5]]] },
  "4": { s: [[[0, 0, 1], [0, 0.65, 1], [1, 0.65]], [[0.8, 0], [0.8, 1]]] },
  "5": { s: [[[1, 0, 1], [0, 0, 1], [0, 0.5, 1], [1, 0.5], [1, 1], [0, 1]]] },
  "6": { s: [[[1, 0], [0, 0], [0, 1], [1, 1], [1, 0.5], [0, 0.5, 1]]] },
  "7": { s: [[[0, 0, 1], [1, 0, 1], [0.4, 1, 1]]] },
  "8": { s: [O_, [[0, 0.5], [1, 0.5]]] },
  "9": { s: [[[1, 0.5, 1], [0, 0.5], [0, 0], [1, 0], [1, 1], [0, 1]]] },
  ".": { w: 0, s: [[[0.5, 1]]] },
  "!": { w: 0, s: [[[0.5, 0], [0.5, 0.7]], [[0.5, 1]]] },
  ":": { w: 0, s: [[[0.5, 0.3]], [[0.5, 0.85]]] },
  "-": { w: 0.6, s: [[[0, 0.5], [1, 0.5]]] },
  "?": { s: [[[0, 0], [1, 0], [1, 0.45], [0.5, 0.45, 1], [0.5, 0.7]], [[0.5, 1]]] },
  ",": { w: 0, s: [[[0.5, 1], [0.5, 1.6]]] },
  ";": { w: 0, s: [[[0.5, 0.3]], [[0.5, 0.85], [0.5, 1.45]]] },
  "'": { w: 0, s: [[[0.5, 0], [0.5, 0.25]]] },
  '"': { w: 0.4, s: [[[0, 0], [0, 0.25]], [[1, 0], [1, 0.25]]] },
  "(": { w: 0.4, s: [[[1, 0], [0, 0.3], [0, 1.2], [1, 1.5]]] },
  ")": { w: 0.4, s: [[[0, 0], [1, 0.3], [1, 1.2], [0, 1.5]]] },
  "/": { w: 0.8, s: [[[1, 0], [0, 1]]] },
  "&": { w: 1.1, s: [[[1, 1, 1], [0.15, 0.45], [0.15, 0], [0.75, 0], [0.75, 0.45], [0, 0.7], [0, 1], [0.75, 1], [1, 0.7, 1]]] },
  "@": { w: 1.2, s: [[[0.7, 0.3, 1], [0.7, 0.75, 1], [1, 0.75], [1, 0], [0, 0], [0, 1], [1, 1]], [[0.7, 0.3], [0.3, 0.3], [0.3, 0.75], [0.7, 0.75, 1]]] },
  "#": { s: [[[0.3, 0], [0.3, 1]], [[0.7, 0], [0.7, 1]], [[0, 0.33], [1, 0.33]], [[0, 0.67], [1, 0.67]]] },
  "€": { s: [[[1, 0], [0.25, 0], [0.25, 1], [1, 1]], [[0, 0.4], [0.75, 0.4]], [[0, 0.6], [0.75, 0.6]]] },
  "%": { w: 1.2, s: [[[0, 0, 1], [0.25, 0, 1], [0.25, 0.3, 1], [0, 0.3, 1], [0, 0, 1]], [[0.9, 0, 1], [0.1, 1, 1]], [[0.75, 0.7, 1], [1, 0.7, 1], [1, 1, 1], [0.75, 1, 1], [0.75, 0.7, 1]]] },
}

// ---------- Minuscules ----------
const o_: Stroke = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]

const LOWER: Record<string, Glyph> = {
  a: { s: [[[0, 0], [1, 0], [1, 1, 1]], [[1, 0.5, 1], [0, 0.5], [0, 1], [1, 1, 1]]] },
  b: { s: [[[0, -1, 1], [0, 1, 1]], [[0, 0, 1], [1, 0], [1, 1], [0, 1, 1]]] },
  c: { s: [[[1, 0], [0, 0], [0, 1], [1, 1]]] },
  d: { s: [[[1, -1, 1], [1, 1, 1]], [[1, 0, 1], [0, 0], [0, 1], [1, 1, 1]]] },
  e: { s: [[[0, 0.5, 1], [1, 0.5, 1], [1, 0], [0, 0], [0, 1], [1, 1]]] },
  f: { w: 0.7, s: [[[1, -1], [0.3, -1], [0.3, 1]], [[0, 0], [1, 0]]] },
  g: { s: [[[1, 1, 1], [0, 1], [0, 0], [1, 0, 1], [1, 2], [0, 2]]] },
  h: { s: [[[0, -1, 1], [0, 1, 1]], [[0, 0, 1], [1, 0], [1, 1]]] },
  i: { w: 0, s: [[[0.5, -1]], [[0.5, 0], [0.5, 1]]] },
  j: { w: 0.6, s: [[[1, -1]], [[1, 0], [1, 2], [0, 2]]] },
  k: { s: [[[0, -1], [0, 1]], [[1, 0, 1], [0, 0.55, 1], [1, 1, 1]]] },
  l: { w: 0, s: [[[0.5, -1], [0.5, 1]]] },
  m: { w: 1.4, s: [[[0, 1, 1], [0, 0, 1], [1, 0], [1, 1]], [[0.5, 0, 1], [0.5, 1]]] },
  n: { s: [[[0, 1, 1], [0, 0, 1], [1, 0], [1, 1]]] },
  o: { s: [o_] },
  p: { s: [[[0, 2, 1], [0, 0, 1]], [[0, 0, 1], [1, 0], [1, 1], [0, 1, 1]]] },
  q: { s: [[[1, 2, 1], [1, 0, 1]], [[1, 0, 1], [0, 0], [0, 1], [1, 1, 1]]] },
  r: { w: 0.8, s: [[[0, 1, 1], [0, 0, 1], [1, 0], [1, 0.25]]] },
  s: { s: [[[1, 0], [0, 0], [0, 0.5], [1, 0.5], [1, 1], [0, 1]]] },
  t: { w: 0.7, s: [[[0.3, -1], [0.3, 1], [1, 1]], [[0, 0], [1, 0]]] },
  u: { s: [[[0, 0], [0, 1], [1, 1, 1]], [[1, 0, 1], [1, 1, 1]]] },
  v: { s: [[[0, 0], [0, 0.4, 1], [0.5, 1, 1], [1, 0.4, 1], [1, 0]]] },
  w: { w: 1.4, s: [[[0, 0, 1], [0, 1, 1], [0.5, 0.5, 1], [1, 1, 1], [1, 0, 1]]] },
  x: { s: [[[0, 0], [1, 1]], [[1, 0], [0, 1]]] },
  y: { s: [[[0, 0], [0, 1], [1, 1, 1]], [[1, 0, 1], [1, 2], [0, 2]]] },
  z: { s: [[[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]] },
}

Object.assign(GLYPHS, LOWER)

// ---------- Lettres accentuées ----------
// Chaque lettre accentuée = la lettre de base + un accent, lui-même un petit tracé.
// Minuscules : l'accent tient entre la hauteur d'x et le haut des capitales (y entre -1 et 0).
// Capitales : l'accent tient dans les lignes réservées au-dessus des capitales (y entre -1 et 0).
type Mark = "acute" | "grave" | "circumflex" | "dieresis" | "cedilla" | "tilde"

function markStrokes(mark: Mark, lower: boolean): Stroke[] {
  const lo = lower ? -0.45 : -0.25 // bas de l'accent
  switch (mark) {
    case "acute":
      return [[[0.65, -1], [0.4, lo]]]
    case "grave":
      return [[[0.35, -1], [0.6, lo]]]
    case "circumflex":
      return [[[0.15, lo, 1], [0.5, -1, 1], [0.85, lo, 1]]]
    case "dieresis":
      return [[[0.2, (lo - 1) / 2]], [[0.8, (lo - 1) / 2]]]
    case "tilde":
      return [[[0.05, lo], [0.35, -1], [0.65, lo], [0.95, -1]]]
    case "cedilla":
      return [[[0.5, 1], [0.5, 1.35], [0.25, 1.7]]]
  }
}

// i sans point, pour î ï í ì (le point est remplacé par l'accent)
const DOTLESS_I: Glyph = { w: 0.6, s: [[[0.5, 0], [0.5, 1]]] }

const ACCENTED: [string, string, Mark][] = [
  ["à", "a", "grave"], ["â", "a", "circumflex"], ["ä", "a", "dieresis"], ["á", "a", "acute"],
  ["ç", "c", "cedilla"],
  ["é", "e", "acute"], ["è", "e", "grave"], ["ê", "e", "circumflex"], ["ë", "e", "dieresis"],
  ["î", "ı", "circumflex"], ["ï", "ı", "dieresis"], ["í", "ı", "acute"],
  ["ô", "o", "circumflex"], ["ö", "o", "dieresis"], ["ó", "o", "acute"],
  ["ù", "u", "grave"], ["û", "u", "circumflex"], ["ü", "u", "dieresis"], ["ú", "u", "acute"],
  ["ÿ", "y", "dieresis"], ["ñ", "n", "tilde"],
  ["À", "A", "grave"], ["Â", "A", "circumflex"], ["Ä", "A", "dieresis"], ["Á", "A", "acute"],
  ["Ç", "C", "cedilla"],
  ["É", "E", "acute"], ["È", "E", "grave"], ["Ê", "E", "circumflex"], ["Ë", "E", "dieresis"],
  ["Î", "I", "circumflex"], ["Ï", "I", "dieresis"], ["Í", "I", "acute"],
  ["Ô", "O", "circumflex"], ["Ö", "O", "dieresis"], ["Ó", "O", "acute"],
  ["Ù", "U", "grave"], ["Û", "U", "circumflex"], ["Ü", "U", "dieresis"], ["Ú", "U", "acute"],
  ["Ÿ", "Y", "dieresis"], ["Ñ", "N", "tilde"],
]

// Ligatures : deux lettres côte à côte, chacune sur la moitié de la largeur (la jambe du milieu est partagée)
function ligature(a: Glyph, b: Glyph, w: number): Glyph {
  const half = (g: Glyph, offset: number): Stroke[] =>
    g.s.map((st) =>
      st.map((p) => [offset + p[0] * 0.5, p[1], ...(p.length > 2 ? [1] : [])] as GlyphPoint)
    )
  return { w, s: [...half(a, 0), ...half(b, 0.5)] }
}

const ACCENTED_LOWER: Record<string, Glyph> = {
  œ: ligature(LOWER.o, LOWER.e, 1.6),
  æ: ligature(LOWER.a, LOWER.e, 1.6),
}
const ACCENTED_UPPER: Record<string, Glyph> = {
  Œ: ligature(GLYPHS.O, GLYPHS.E, 1.6),
  Æ: ligature(GLYPHS.A, GLYPHS.E, 1.6),
}
for (const [c, base, mark] of ACCENTED) {
  const lower = base === "ı" || base in LOWER
  const g = base === "ı" ? DOTLESS_I : GLYPHS[base]
  ;(lower ? ACCENTED_LOWER : ACCENTED_UPPER)[c] = {
    w: g.w,
    s: [...g.s, ...markStrokes(mark, lower)],
  }
}
Object.assign(GLYPHS, ACCENTED_LOWER, ACCENTED_UPPER)

// Capitales qui ont besoin des lignes au-dessus (accent en haut) : la cédille, elle, est en bas
export const CAP_ACCENTED = new Set(
  Object.keys(ACCENTED_UPPER).filter((c) => c !== "Ç" && c !== "Œ" && c !== "Æ")
)

// Pour les noms de glyphes dans la police (.otf) : é → eacute, Ç → Ccedilla…
export const ACCENT_NAMES: Record<string, string> = {
  œ: "oe",
  æ: "ae",
  Œ: "OE",
  Æ: "AE",
  ...Object.fromEntries(
    ACCENTED.map(([c, base, mark]) => [c, (base === "ı" ? "i" : base) + mark])
  ),
}

export const isLower = (c: string) => c in LOWER || c in ACCENTED_LOWER

// Ordre d'affichage : capitales, minuscules, lettres accentuées, chiffres, ponctuation
// (Object.keys mettrait les chiffres en premier)
export const ACCENTED_CHARS = [...Object.keys(ACCENTED_UPPER), ...Object.keys(ACCENTED_LOWER)]
export const CHARSET = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."abcdefghijklmnopqrstuvwxyz",
  ...ACCENTED_CHARS,
  ..."0123456789",
  ...".,;:!?-'\"()/&@#€%",
]
