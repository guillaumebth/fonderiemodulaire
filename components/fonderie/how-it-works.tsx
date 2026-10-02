"use client"

import { useEffect, useState } from "react"

import { DEFAULT_PARAMS, type Params } from "@/lib/fonderie/params"

import { StepCanvas } from "./font-canvas"
import { PanelSection } from "./panel-ui"

const GRID: Params = DEFAULT_PARAMS
const PATH: Params = { ...DEFAULT_PARAMS, layout: "trace" }

type Step = [1 | 2 | 3, string, string]

const MODES: { title: string; intro: string; params: Params; steps: Step[] }[] =
  [
    {
      title: "Grid",
      intro:
        "The path is laid on the grid. Every cell the stroke touches is filled, and each filled cell gets a piece. Curves become steps, for a pixel or LED look.",
      params: GRID,
      steps: [
        [1, "1. The path", "the letter drawn as lines"],
        [2, "2. The grid", "every cell the stroke touches"],
        [3, "3. The pieces", "a shape in each cell"],
      ],
    },
    {
      title: "Along the path",
      intro:
        "Pieces are threaded along the stroke at regular intervals, like beads on a string. Curves stay truly round and diagonals stay straight.",
      params: PATH,
      steps: [
        [1, "1. The path", "the letter drawn as lines"],
        [2, "2. The positions", "evenly spaced along the stroke"],
        [3, "3. The pieces", "a shape at each position"],
      ],
    },
  ]

// Lettres qui défilent dans les schémas : droites, courbes, diagonales, chiffre, minuscule
const LETTERS = ["R", "A", "G", "S", "K", "8", "Q", "e", "&"]
const CYCLE_MS = 2000

// Section de la page About (ancre #how-it-works, visée par le bouton de la home).
// Chaque mode : un texte, puis ses 3 étapes dans des cartes blanches (sans ombre ni coins arrondis).
// La lettre change toute seule toutes les 2 s (même lettre dans toutes les cartes), ou au clic sur une carte.
// Pas de défilement automatique si le système demande de réduire les animations.
export function HowItWorks() {
  const [index, setIndex] = useState(0)
  const char = LETTERS[index]
  const next = () => setIndex((i) => (i + 1) % LETTERS.length)

  // Le compte repart à chaque changement de lettre (clic compris)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % LETTERS.length),
      CYCLE_MS
    )
    return () => clearTimeout(id)
  }, [index])

  return (
    <div id="how-it-works" className="grid scroll-mt-6 gap-10">
      {MODES.map((mode) => (
        <PanelSection key={mode.title} title={mode.title}>
          <div className="grid max-w-[900px] gap-4">
            <p className="max-w-[470px] text-xs leading-normal">{mode.intro}</p>
            <div className="grid grid-cols-3 gap-2">
              {mode.steps.map(([step, title, desc]) => (
                <button
                  key={step}
                  type="button"
                  onClick={next}
                  aria-label={`${title}, ${desc}. Show another letter`}
                  className="grid content-start gap-3 bg-surface p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:p-4"
                >
                  <span className="flex items-baseline justify-between text-xs leading-normal font-medium">
                    {title}
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {char}
                    </span>
                  </span>
                  <StepCanvas
                    step={step}
                    char={char}
                    params={mode.params}
                    label={`${mode.title}, step ${title}, letter ${char}`}
                  />
                  <span className="text-[10px] leading-normal">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </PanelSection>
      ))}
      <div className="max-w-[470px]">
        <PanelSection title="The rest">
          <p className="text-xs leading-normal">
            Weight decides how far the stroke spills into neighbouring cells, or
            how big the pieces are along the path. Roundness softens the
            corners. Organic variation makes some columns and rows wider than
            others. Kerning is computed automatically and written into the font
            file.
          </p>
        </PanelSection>
      </div>
    </div>
  )
}
