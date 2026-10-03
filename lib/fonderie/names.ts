// Nom de police par défaut, différent d'une police à l'autre.
// Sans ça, toutes les polices téléchargées s'appelleraient « Fonderie modulaire » : en installer
// une deuxième remplacerait la première sur l'ordinateur (le système croit que c'est la même).
// Le nom vient des réglages : même police → même nom ; un réglage change → un autre mot.

import { SHAPES, type Params } from "./params"

const WORDS = [
  "Atlas", "Moon", "Rivet", "Neon", "Stitch", "Orbit", "Signal", "Harbor",
  "Comet", "Pixel", "Bolt", "Ember", "Prism", "Tide", "Meteor", "Quartz",
  "Static", "Velvet", "Gravel", "Lantern", "Marble", "Nova", "Pulse", "Relic",
  "Saturn", "Tinsel", "Vapor", "Willow", "Zinc", "Copper", "Dune", "Echo",
  "Fable", "Garnet", "Halo", "Ivory", "Juno", "Kiln", "Lumen", "Mosaic",
  "Nectar", "Onyx", "Pepper", "Quill", "Radar", "Sable", "Topaz", "Umber",
  "Vortex", "Wharf", "Yarrow", "Zephyr", "Anvil", "Beacon", "Cinder", "Drift",
  "Flint", "Glyph", "Hatch", "Ingot", "Jetty", "Kite", "Loom", "Mint",
]

// Petite empreinte des réglages (toujours la même pour les mêmes réglages)
function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function autoName(P: Params) {
  // la phase (ondulation du mode vivant) et l'affichage de la grille ne changent pas la police
  const { phase: _phase, grid: _grid, ...font } = P
  const shape = SHAPES.find((s) => s.id === P.shape)?.label ?? "Mix"
  const word = WORDS[hash(JSON.stringify(font)) % WORDS.length]
  return `Fonderie ${shape} ${word}`
}
