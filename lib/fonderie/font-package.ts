// Contenu du zip téléchargé : la police, LICENSE.txt et README.txt.
// En tête de la licence, le mot LICENSE dessiné en caractères avec la grille de la police de l'acheteur
// (les cases pleines de bitmap(), comme à l'écran mais en texte).
// Textes en anglais simple, sur un ton léger ; pas de tiret cadratin.

import { CONTACT_URL } from "./config"
import type { Params } from "./params"
import { bitmap } from "./skeleton"

// Mot en caractères : █ case pleine, ▪ petit point d'angle, espace vide ; une colonne entre les lettres
export function asciiWord(word: string, P: Params) {
  const maps = [...word].map((c) => bitmap(c, P))
  const rows = Math.max(...maps.map((m) => m.length))
  const lines: string[] = []
  for (let i = 0; i < rows; i++)
    lines.push(
      maps
        .map((m) =>
          (m[i] ?? []).map((v) => (v >= 1 ? "█" : v > 0 ? "▪" : " ")).join("")
        )
        .join(" ")
        .trimEnd()
    )
  // on retire les lignes vides du haut et du bas (place des accents et des jambages)
  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  return lines.join("\n")
}

const contact = CONTACT_URL.replace(/^mailto:/, "")

export function licenseText(o: {
  family: string
  full: boolean
  key?: string
  date: string
  P: Params
}) {
  const head = [
    asciiWord("LICENSE", o.P),
    "",
    o.full
      ? "FONDERIE MODULAIRE · FONT LICENSE"
      : "FONDERIE MODULAIRE · TRIAL LICENSE",
    "",
    `Font: ${o.family}`,
    ...(o.key ? [`License key: ${o.key}`] : []),
    `Date: ${o.date}`,
    "Made with Fonderie modulaire, fonderiemodulaire.com",
    "",
  ]
  const body = o.full
    ? [
        "In short: it's your font. Use it everywhere, just don't sell or share",
        "the font file itself.",
        "",
        "YOU CAN",
        "+ Use it in personal and commercial projects: print, packaging, posters,",
        "  books, merch, video, social media, websites, apps and games.",
        "+ Use it for client work.",
        "+ Make a logo or a whole brand with it.",
        "+ Embed it in a website (as a web font), an app, a PDF or an e-book.",
        "+ Install it on every computer you and your team use.",
        "+ Modify it.",
        "",
        "YOU CAN'T",
        "- Sell, share or give away the font file itself (or a modified version),",
        "  on its own or in a font bundle.",
        "- Upload it to a font-sharing website.",
        "- Sell it, or a font made from it, as your own typeface.",
      ]
    : [
        "In short: try it, play with it, but don't use it to make money.",
        "",
        "YOU CAN",
        "+ Use it for personal projects, tests and mockups.",
        "+ Install it on your own computers.",
        "",
        "YOU CAN'T",
        "- Use it in commercial work: anything you sell, or are paid to make.",
        "- Sell, share or give away the font file itself.",
        "",
        "Want to use it for real? The full version adds lowercase, accents,",
        "punctuation and a commercial license: fonderiemodulaire.com/atelier",
      ]
  const foot = [
    "",
    "Keep this file with the font.",
    ...(contact ? [`Questions: ${contact}`] : []),
    "",
    "The font is provided as is, without any warranty.",
    "",
  ]
  return [...head, ...body, ...foot].join("\n")
}

export function readmeText(o: {
  family: string
  file: string
  full: boolean
  url: string
}) {
  return [
    o.family,
    "",
    "Thanks for making a font with Fonderie modulaire!",
    "",
    "INSTALL",
    `Mac: double-click ${o.file}, then click "Install".`,
    `Windows: right-click ${o.file}, then "Install".`,
    "Restart your apps if the font doesn't show up right away.",
    "",
    "EDIT IT AGAIN",
    "This link opens your font in the atelier, with all its settings:",
    o.url,
    "",
    "WHAT'S INSIDE",
    o.full
      ? "Uppercase A-Z, lowercase a-z, accented letters, figures 0-9,\npunctuation and automatic kerning."
      : "Uppercase A-Z and figures 0-9, with automatic kerning (trial version).",
    "",
  ].join("\n")
}
