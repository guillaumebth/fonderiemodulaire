// Styles d'exemple montrés sur la home. Chacun ouvre le générateur avec ses réglages (via l'adresse).

import { DEFAULT_PARAMS, type Params } from "./params"
import { encodeShare } from "./share"
import { TEMPLATES } from "./templates"

export type Preset = { name: string; description: string; params: Params }

const preset = (
  name: string,
  description: string,
  p: Partial<Params>
): Preset => ({
  name,
  description,
  params: { ...DEFAULT_PARAMS, ...p },
})

export const PRESETS: Preset[] = [
  preset("LED", "Dots on a 5 × 7 grid, like an old display.", {}),
  preset("Stitch", "Two rows of crosses threaded along the path.", {
    layout: "trace",
    shape: "croix",
    orient: true,
    lanes: 2,
    wt: 0.3,
    spacing: 0.6,
    rows: 9,
    cols: 6,
  }),
  preset("Melt", "Dots so close they merge into soft strokes.", {
    gap: -0.6,
    rows: 9,
    cols: 6,
  }),
  preset("Rivets", "Screws following every curve.", {
    layout: "trace",
    shape: "vis",
    orient: true,
    spacing: 0.95,
    wt: 0.45,
  }),
  preset("Mosaic", "Squares on a grid that never sits still.", {
    shape: "carre",
    org: 0.6,
    gap: 0.18,
    rad: 0.12,
    rows: 9,
    cols: 6,
  }),
  preset("Chain", "Rings on two rails.", {
    layout: "trace",
    shape: "anneau",
    lanes: 2,
    laneGap: 1.6,
    spacing: 0.7,
    wt: 0.3,
    rows: 9,
    cols: 6,
  }),
]

// Le titre animé de la home
export const HERO_PARAMS: Params = {
  ...DEFAULT_PARAMS,
  layout: "trace",
  shape: "croix",
  orient: true,
  lanes: 2,
  wt: 0.3,
  spacing: 0.6,
  rows: 9,
  cols: 6,
  org: 0.3,
}

// Adresse du générateur ouvert avec ces réglages et ce texte
export function generatorHref(params: Params, text: string) {
  return `/generator#${encodeShare(params, text, "")}`
}

// Adresse du générateur ouvert avec ce style (le nom du style sert de texte)
export const presetHref = (p: Preset) => generatorHref(p.params, p.name)

// Les polices du panneau noir de la home, dans l'ordre où elles défilent.
// Toutes les polices de la home et des templates, sans doublons (le titre ouvre le bal).
// Le panneau est « vivant » : chaque police reçoit un peu de variation organique pour onduler.
const ALIVE_MIN = 0.4
const alive = (params: Params): Params => ({
  ...params,
  org: Math.max(params.org, ALIVE_MIN),
})

// Vue de conception : ronds fusionnés en contour, grille et tracé rouge visibles
const BLUEPRINT: Params = {
  ...DEFAULT_PARAMS,
  shape: "rond",
  mode: "contour",
  grid: true,
  gap: -0.4,
  str: 0.06,
  rnd: 0.8,
}

export const HERO_STYLES: { name: string; params: Params }[] = [
  { name: "Stitch", params: alive(HERO_PARAMS) },
  ...PRESETS.filter((p) => p.name !== "Stitch").map((p) => ({
    name: p.name,
    params: alive(p.params),
  })),
  ...TEMPLATES.filter((t) => /Signal|Moon/.test(t.text)).map((t) => ({
    name: t.text.replace(/\n/g, " "),
    params: alive(t.params),
  })),
  { name: "Blueprint", params: alive(BLUEPRINT) },
]
