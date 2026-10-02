// Export image de l'aperçu, tel qu'il est à l'écran : SVG (vectoriel, à retravailler dans Figma)
// ou PNG haute définition. Fond transparent. Reprend exactement le dessin de l'écran :
// plein ou contour, inclinaison, grille et tracé rouge si « Show grid & path » est activé.

import { ContourRecorder, type Contour } from "./contours"
import { center, glyphGrid } from "./grid"
import type { Params } from "./params"
import { drawText, type Colors, type TextLayout } from "./render"
import { rotated, shape } from "./shapes"
import { skeleton } from "./skeleton"

const n = (v: number) => +v.toFixed(2)

function pathData(contours: Contour[]) {
  return contours
    .map(
      (c) =>
        `M${n(c.start.x)} ${n(c.start.y)}` +
        c.segs
          .map((s) =>
            s.kind === "L"
              ? `L${n(s.p.x)} ${n(s.p.y)}`
              : `C${n(s.c1.x)} ${n(s.c1.y)} ${n(s.c2.x)} ${n(s.c2.y)} ${n(s.p.x)} ${n(s.p.y)}`
          )
          .join("") +
        "Z"
    )
    .join("")
}

// Inclinaison autour de la ligne de base (même calcul que l'écran)
const skew = (slant: number, base: number) =>
  slant ? ` transform="matrix(1 0 ${n(-slant)} 1 ${n(slant * base)} 0)"` : ""

// Couleur CSS (oklch…) → #rrggbb, que tous les logiciels comprennent (Figma, Illustrator…)
function toHex(color: string) {
  if (typeof document === "undefined") return color
  const ctx = document.createElement("canvas").getContext("2d")
  if (!ctx) return color
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
}

export function layoutToSvg(L: TextLayout, P: Params, colors: Colors) {
  const col = {
    fg: toHex(colors.fg),
    bg: toHex(colors.bg),
    accent: toHex(colors.accent),
    path: toHex(colors.path),
  }
  const out: string[] = []
  const pieces = L.pieces.filter((p) => p.s > 0.01)
  const d = pieces.map((p) => {
    const rec = new ContourRecorder()
    shape(
      rotated(rec, p.x, p.y, p.angle),
      p.kind,
      p.x,
      p.y,
      p.w * p.s,
      p.h * p.s,
      P
    )
    return pathData(rec.done())
  })
  // Contour : trait épais de toutes les pièces, puis remplissage couleur du fond par-dessus
  if (P.mode === "contour") {
    const sw = n(P.str * L.U * 2)
    pieces.forEach((p, i) =>
      out.push(
        `<path d="${d[i]}" fill="none" stroke="${col.fg}" stroke-width="${sw}" stroke-linejoin="round"${skew(L.slant, p.base)}/>`
      )
    )
  }
  const fill = P.mode === "contour" ? col.bg : col.fg
  pieces.forEach((p, i) =>
    out.push(
      `<path d="${d[i]}" fill="${fill}" fill-rule="evenodd"${skew(L.slant, p.base)}/>`
    )
  )
  // Grille et tracé
  if (P.grid)
    for (const g of L.glyphs) {
      const { xs, ys } = glyphGrid(g.c, L.U, P)
      const cells: string[] = []
      for (let i = 0; i + 1 < ys.length; i++)
        for (let j = 0; j + 1 < xs.length; j++)
          cells.push(
            `<rect x="${n(g.x + xs[j] + 0.5)}" y="${n(g.top + ys[i] + 0.5)}" width="${n(xs[j + 1] - xs[j] - 1)}" height="${n(ys[i + 1] - ys[i] - 1)}"/>`
          )
      out.push(
        `<g fill="none" stroke="${col.accent}" stroke-opacity="0.35" stroke-width="1"${skew(L.slant, g.base)}>${cells.join("")}</g>`
      )
      const lines = skeleton(g.c, P).map((s) => {
        const pts = s.map(
          (pt) => `${n(g.x + center(xs, pt.x))},${n(g.top + center(ys, pt.y))}`
        )
        if (s.length === 1) pts.push(pts[0])
        return `<polyline points="${pts.join(" ")}"/>`
      })
      out.push(
        `<g fill="none" stroke="${col.path}" stroke-width="${n(Math.max(1.5, L.U * 0.08))}" stroke-linecap="round" stroke-linejoin="round"${skew(L.slant, g.base)}>${lines.join("")}</g>`
      )
    }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${n(L.W)}" height="${n(L.H)}" viewBox="0 0 ${n(L.W)} ${n(L.H)}">\n${out.join("\n")}\n</svg>\n`
}

// PNG : on redessine l'aperçu dans un canvas hors écran, à 3 fois la taille
export function layoutToPng(L: TextLayout, P: Params, col: Colors, scale = 3) {
  const cv = document.createElement("canvas")
  drawText(cv, L, L.pieces, P, col, scale)
  return new Promise<Blob>((resolve, reject) =>
    cv.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG export failed"))),
      "image/png"
    )
  )
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
