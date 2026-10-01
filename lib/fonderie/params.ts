// Tous les réglages de la police. Un seul objet, passé à chaque fonction du moteur.

export const SHAPES = [
  { id: "rond", label: "Rond" },
  { id: "carre", label: "Carré" },
  { id: "anneau", label: "Anneau" },
  { id: "vis", label: "Vis" },
  { id: "croix", label: "Croix" },
  { id: "carrevide", label: "Carré vide" },
  { id: "cible", label: "Cible" },
  { id: "etoile", label: "Étoile" },
  { id: "melange", label: "Mélange" },
] as const

export type ShapeKind = (typeof SHAPES)[number]["id"]
export type RenderMode = "plein" | "contour"

export type Params = {
  cols: number // colonnes de la grille
  rows: number // lignes de la grille
  wt: number // graisse, en cases
  rnd: number // rondeur des angles du tracé
  smo: number // petits points d'angle
  xh: number // hauteur d'x : hauteur des minuscules, en part de la hauteur des capitales
  desc: number // longueur des jambages (g, p, q…), en part de la hauteur des capitales
  org: number // variation organique : cases plus ou moins larges / hautes (0 = grille régulière)
  seed: number // tirage de la variation organique
  shape: ShapeKind
  gap: number // écart entre pièces ; négatif = les pièces débordent de leur case et fusionnent
  thk: number // épaisseur des formes évidées
  rad: number // arrondi des carrés
  wid: number // largeur des cases
  sla: number // inclinaison, en degrés
  kern: number // crénage automatique : part de l'espace vide retirée entre deux lettres (0 = aucun)
  mode: RenderMode
  str: number // épaisseur du contour
  grid: boolean // montrer la grille et le tracé
}

export const DEFAULT_PARAMS: Params = {
  cols: 5,
  rows: 7,
  wt: 0.5,
  rnd: 0.55,
  smo: 0,
  xh: 0.6,
  desc: 0.3,
  org: 0,
  seed: 1,
  shape: "rond",
  gap: 0.12,
  thk: 0.2,
  rad: 0.1,
  wid: 1,
  sla: 0,
  kern: 0.7,
  mode: "plein",
  str: 0.08,
  grid: false,
}

// Formes qui utilisent le curseur « Épaisseur des formes » / « Arrondi des carrés »
export const USES_THICKNESS: ShapeKind[] = [
  "anneau",
  "vis",
  "croix",
  "cible",
  "carrevide",
  "melange",
  "etoile",
]
export const USES_RADIUS: ShapeKind[] = ["carre", "carrevide"]

// Une police tirée au hasard, dans des plages qui donnent des résultats lisibles.
// Le texte, la grille affichée et le mode plein/contour ne changent pas.
export function randomParams(current: Params): Params {
  const rand = (min: number, max: number, step: number) =>
    Math.round((min + Math.random() * (max - min)) / step) * step
  const sometimes = (chance: number, value: number) =>
    Math.random() < chance ? value : 0
  const shapes = SHAPES.map((s) => s.id)
  return {
    ...current,
    cols: rand(3, 9, 1),
    rows: rand(5, 13, 1),
    wt: rand(0.45, 1.1, 0.05),
    rnd: rand(0, 1, 0.01),
    smo: sometimes(0.3, rand(0.1, 0.4, 0.01)),
    xh: rand(0.5, 0.75, 0.01),
    desc: rand(0.2, 0.4, 0.01),
    org: sometimes(0.4, rand(0.2, 0.9, 0.01)),
    seed: Math.floor(Math.random() * 1000),
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    gap: Math.random() < 0.25 ? rand(-0.6, -0.1, 0.01) : rand(0, 0.5, 0.01),
    thk: rand(0.12, 0.32, 0.01),
    rad: rand(0, 0.5, 0.01),
    wid: rand(0.7, 1.4, 0.01),
    sla: sometimes(0.2, rand(4, 14, 1)),
  }
}
