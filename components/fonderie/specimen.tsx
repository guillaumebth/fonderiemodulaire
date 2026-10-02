"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { ACCENTED_CHARS, CHARSET } from "@/lib/fonderie/glyphs"
import { layoutToSvg } from "@/lib/fonderie/image-export"
import { DEFAULT_PARAMS, SHAPES, type Params } from "@/lib/fonderie/params"
import { layoutText, type Colors } from "@/lib/fonderie/render"
import { cn } from "@/lib/utils"

import { PILL, PILL_ACTIVE } from "./pill-styles"

// Planche « specimen » imprimable (A4), comme celles des vraies fonderies : nom de la police en grand,
// tous les caractères, une cascade de tailles, des mots d'essai et le texte de l'atelier.
// Onglet « Specimen » de l'atelier : la planche suit les réglages en direct.
// Chaque bloc est un dessin vectoriel (SVG du moteur) : net à l'impression et dans le PDF.
// Clic sur la feuille (pastille « Save as PDF » au survol) : imprime seulement la feuille : une copie est posée directement dans <body>
// (invisible à l'écran) et, à l'impression, tout le reste de la page est masqué (voir globals.css).

const W = 680 // largeur de mise en page (unités SVG) ; le dessin s'adapte ensuite à la feuille
const INK: Colors = {
  fg: "#000000",
  bg: "#ffffff",
  accent: "#999999",
  path: "#e5332a",
  line: "#cccccc",
}

const UPPER = CHARSET.filter((c) => /[A-Z]/.test(c)).join("")
const LOWER = CHARSET.filter((c) => /[a-z]/.test(c)).join("")
const FIGURES = CHARSET.filter(
  (c) => !/[A-Za-z]/.test(c) && !ACCENTED_CHARS.includes(c)
).join(" ")
const ACCENTS = ACCENTED_CHARS.join("")
const PANGRAM = "The quick brown fox jumps over the lazy dog"
const SIZES = [32, 20, 12]

// Tout doit tenir sur une feuille A4. Hauteur dispo pour les dessins, en unités de mise en page :
// 273 mm de feuille utile, moins ~80 mm de textes, filets et espaces ; 1 mm ≈ W / 186 unités.
const ROOM = ((273 - 80) * W) / 186

// Facteur de taille (≤ 1) pour que tous les blocs tiennent : des lettres très larges font plus de lignes
function fitScale(P: Params, name: string, text: string) {
  const blocks: [string, number, number][] = [
    [name, 64, 0.15],
    [UPPER, 22, 0.3],
    [LOWER, 22, 0.3],
    [ACCENTS, 22, 0.3],
    [FIGURES, 22, 0.3],
    ...SIZES.map((sz): [string, number, number] => [PANGRAM, sz, 0.35]),
    ...(text.trim() ? [[text, 28, 0.25] as [string, number, number]] : []),
  ]
  let k = 1
  for (let i = 0; i < 12; i++) {
    const h = blocks.reduce(
      (sum, [t, c, g]) => sum + layoutText(W, t, c * k, g, P).H,
      0
    )
    if (h <= ROOM) break
    k *= 0.9
  }
  return k
}

// Un bloc de texte dessiné avec la police, en SVG
function Specimen({
  text,
  capH,
  P,
  lineGap = 0.3,
}: {
  text: string
  capH: number
  P: Params
  lineGap?: number
}) {
  const L = layoutText(W, text, capH, lineGap, P)
  return (
    <div
      aria-label={text}
      role="img"
      className="w-full [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{
        __html: layoutToSvg(L, P, INK).replace(/^<\?xml[^>]*>\s*/, ""),
      }}
    />
  )
}

// Petit titre de section : filet noir avec le « coin » (direction artistique)
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="relative border-t border-black pt-1.5 pl-2 text-[9px] leading-normal font-medium before:absolute before:top-0 before:left-0 before:h-2 before:w-px before:bg-black before:content-['']">
      {children}
    </p>
  )
}

export function SpecimenTab({
  P: params,
  name: rawName,
  text,
}: {
  P: Params
  name: string
  text: string
}) {
  // la copie pour l'impression n'existe qu'une fois la page chargée (document.body)
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  // À l'écran, la feuille A4 (210 × 297 mm) est réduite pour tenir entière dans la colonne et dans la
  // hauteur de la fenêtre, comme un aperçu avant impression : pas de défilement. L'impression reste à 100 %.
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const mm = 96 / 25.4 // pixels par millimètre (CSS)
    const fit = () => {
      const availW = el.clientWidth
      // fenêtre moins l'espace au-dessus de la feuille (onglets, marges)
      const availH = window.innerHeight - 140
      setScale(Math.min(1, availW / (210 * mm), availH / (297 * mm)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    window.addEventListener("resize", fit)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", fit)
    }
  }, [])

  // planche au repos : pas de grille, pas d'ondulation
  const P = { ...params, grid: false, phase: 0 }
  const name = rawName.trim() || "Fonderie modulaire"
  const sheet = <Sheet P={P} name={name} text={text} />

  return (
    <div className="grid gap-4">
      <div ref={box} className="w-full">
        {/* La feuille est le bouton : au survol, voile et pastille « Save as PDF » ; clic = impression */}
        <button
          type="button"
          onClick={() => window.print()}
          aria-label="Print or save as PDF"
          className="group relative block text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          style={{
            width: `calc(210mm * ${scale})`,
            height: `calc(297mm * ${scale})`,
          }}
        >
          <div
            className="w-[210mm] origin-top-left"
            style={{ transform: `scale(${scale})` }}
          >
            {sheet}
          </div>
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/25 group-focus-visible:bg-foreground/25">
            <span
              className={cn(
                PILL,
                PILL_ACTIVE,
                "px-4 py-1.5 text-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              )}
            >
              Save as PDF
            </span>
          </span>
        </button>
      </div>
      {ready &&
        createPortal(
          <div className="specimen-print hidden print:block">{sheet}</div>,
          document.body
        )}
    </div>
  )
}

function Sheet({ P, name, text }: { P: Params; name: string; text: string }) {
  const shape = SHAPES.find((s) => s.id === P.shape)?.label ?? ""
  const meta = [
    P.layout === "trace" ? "Along the path" : "Grid",
    shape,
    `${P.cols} × ${P.rows}`,
    `Weight ${P.wt.toFixed(2)}`,
    P.org ? `Organic ${Math.round(P.org * 100)}%` : null,
    P.sla ? `Slant ${P.sla}°` : null,
  ]
    .filter(Boolean)
    .join(" · ")
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const k = fitScale(P, name, text)
  const same = JSON.stringify(P) === JSON.stringify(DEFAULT_PARAMS)

  return (
    <article className="flex h-[297mm] w-[210mm] flex-col gap-[5mm] overflow-hidden bg-white p-[12mm] text-black">
      <header className="flex items-baseline justify-between text-[9px] leading-normal font-medium">
        <span>Fonderie modulaire · Specimen</span>
        <span>{date}</span>
      </header>

      <Specimen text={name} capH={64 * k} P={P} lineGap={0.15} />
      <p className="-mt-2 text-[9px] leading-normal font-medium text-neutral-500">
        {same ? "Default settings" : meta}
      </p>

      <div className="grid gap-2">
        <Label>Characters</Label>
        <Specimen text={UPPER} capH={22 * k} P={P} />
        <Specimen text={LOWER} capH={22 * k} P={P} />
        <Specimen text={ACCENTS} capH={22 * k} P={P} />
        <Specimen text={FIGURES} capH={22 * k} P={P} />
      </div>

      <div className="grid gap-2">
        <Label>Sizes</Label>
        {SIZES.map((s) => (
          <div key={s} className="grid grid-cols-[28px_1fr] items-start gap-2">
            <span className="text-[8px] leading-normal font-medium text-neutral-500">
              {s}
            </span>
            <Specimen text={PANGRAM} capH={s * k} P={P} lineGap={0.35} />
          </div>
        ))}
      </div>

      {text.trim() && (
        <div className="grid gap-2">
          <Label>From the atelier</Label>
          <Specimen text={text} capH={28 * k} P={P} lineGap={0.25} />
        </div>
      )}

      <footer className="mt-auto flex items-baseline justify-between text-[9px] leading-normal font-medium">
        <span>{name}</span>
        <span>fonderiemodulaire.com</span>
      </footer>
    </article>
  )
}
