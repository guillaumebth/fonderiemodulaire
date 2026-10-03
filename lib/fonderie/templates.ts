// Templates : des affiches faites avec l'outil, qui servent de points de départ.
// Chacune ouvre le générateur avec ses réglages et son texte.

import { DEFAULT_PARAMS, type Params } from "./params"

// black / white / grey : monochromes ; punch-1 à 5 : les couleurs vives du bouton « Make your font »
export type Palette =
  | "black"
  | "white"
  | "grey"
  | "punch-1"
  | "punch-2"
  | "punch-3"
  | "punch-4"
  | "punch-5"

export type Template = {
  text: string
  caption: string // ce qu'on voit : réglages résumés en une ligne
  palette: Palette
  wide?: boolean // occupe toute la largeur
  params: Params
  // police envoyée par quelqu'un (bouton « Submit to templates » de l'atelier) : son nom ou son compte
  author?: string
}

const p = (x: Partial<Params>): Params => ({ ...DEFAULT_PARAMS, ...x })

export const TEMPLATES: Template[] = [
  {
    text: "Hand\nstitched",
    caption: "Along the path · Cross · 2 rows · rotated",
    palette: "black",
    wide: true,
    params: p({
      layout: "trace",
      shape: "croix",
      orient: true,
      lanes: 2,
      wt: 0.3,
      spacing: 0.6,
      rows: 9,
      cols: 6,
    }),
  },
  {
    text: "Open\n24/7",
    caption: "Grid · Dot · 5 × 7",
    palette: "punch-1",
    params: p({}),
  },
  {
    text: "Melt",
    caption: "Grid · Dot · merged",
    palette: "punch-2",
    params: p({ gap: -0.7, rows: 9, cols: 6 }),
  },
  {
    text: "Rivets\n& bolts",
    caption: "Along the path · Screw · rotated",
    palette: "punch-3",
    params: p({
      layout: "trace",
      shape: "vis",
      orient: true,
      spacing: 0.95,
      wt: 0.45,
    }),
  },
  {
    text: "Grow\nslow",
    caption: "Grid · Square · organic",
    palette: "grey",
    params: p({
      shape: "carre",
      org: 0.7,
      gap: 0.2,
      rad: 0.15,
      rows: 9,
      cols: 6,
      seed: 4,
    }),
  },
  {
    text: "Signal 26",
    caption: "Grid · Target · wide · slanted",
    palette: "punch-4",
    wide: true,
    params: p({
      shape: "cible",
      wid: 1.4,
      sla: 10,
      rows: 9,
      cols: 6,
      gap: 0.05,
    }),
  },
  {
    text: "Chain",
    caption: "Along the path · Ring · 2 rails",
    palette: "punch-5",
    params: p({
      layout: "trace",
      shape: "anneau",
      lanes: 2,
      laneGap: 1.6,
      spacing: 0.7,
      wt: 0.3,
      rows: 9,
      cols: 6,
    }),
  },
  {
    text: "Moon\nbase",
    caption: "Grid · Frame · outline",
    palette: "black",
    params: p({
      shape: "carrevide",
      mode: "contour",
      rows: 9,
      cols: 6,
      gap: 0.1,
    }),
  },
  // --- Des réglages encore peu montrés : contour, minuscules, cadres inclinés, briques, fil, mélange
  {
    text: "Neon\ntubes",
    caption: "Grid · Dot · merged outline",
    palette: "punch-2",
    params: p({
      mode: "contour",
      gap: -0.35,
      wt: 0.7,
      str: 0.07,
      rows: 9,
      cols: 6,
    }),
  },
  {
    text: "bubble\ntea",
    caption: "Grid · Ring · lowercase · round",
    palette: "white",
    params: p({
      shape: "anneau",
      gap: -0.2,
      rnd: 1,
      xh: 0.7,
      thk: 0.3,
      rows: 9,
      cols: 6,
    }),
  },
  {
    text: "TICKET 0042",
    caption: "Grid · Frame · narrow · slanted",
    palette: "punch-3",
    wide: true,
    params: p({
      shape: "carrevide",
      wid: 0.8,
      sla: 12,
      wt: 0.6,
      thk: 0.3,
      gap: 0.04,
      rows: 9,
      cols: 6,
    }),
  },
  {
    text: "Brick\nby brick",
    caption: "Grid · Square · tight",
    palette: "grey",
    params: p({
      shape: "carre",
      rad: 0,
      gap: 0.04,
      wt: 0.6,
      rows: 8,
      cols: 6,
    }),
  },
  {
    text: "thread",
    caption: "Along the path · Dot · fine beads",
    palette: "punch-1",
    params: p({
      layout: "trace",
      spacing: 0.35,
      wt: 0.18,
      rows: 9,
      cols: 6,
    }),
  },
  {
    text: "Confetti!",
    caption: "Grid · Mix · organic · corner dots",
    palette: "punch-4",
    wide: true,
    params: p({
      shape: "melange",
      org: 0.45,
      smo: 0.25,
      wt: 0.6,
      gap: -0.12,
      rows: 9,
      cols: 6,
      seed: 7,
    }),
  },
]
