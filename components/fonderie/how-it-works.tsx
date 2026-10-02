"use client"

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

// Section de la page About (ancre #how-it-works, visée par le bouton de la home)
// Section de la page About (ancre #how-it-works, visée par le bouton de la home).
// Direction artistique : filet en coin par section, Inter 12 / 14 px medium.
export function HowItWorks() {
  return (
    <div id="how-it-works" className="grid scroll-mt-6 gap-10">
      <div className="max-w-[470px]">
        <PanelSection title="How it works">
          <p className="text-xs leading-normal">
            Each letter is described only once, as a path: a few lines and a few
            corners. That path doesn&apos;t depend on any grid, so the same
            alphabet can be rebuilt at any size, with any pieces. There are two
            ways to turn that path into a letter.
          </p>
        </PanelSection>
      </div>
      {MODES.map((mode) => (
        <PanelSection key={mode.title} title={mode.title}>
          <div className="grid gap-6 md:grid-cols-[minmax(0,470px)_minmax(0,1fr)]">
            <p className="text-xs leading-normal">{mode.intro}</p>
            <div className="grid max-w-[560px] grid-cols-3 content-start gap-4">
              {mode.steps.map(([step, title, desc]) => (
                <div key={step} className="grid gap-2">
                  <StepCanvas
                    step={step}
                    char="R"
                    params={mode.params}
                    label={`${mode.title}, step ${title}`}
                  />
                  <span className="text-[10px] leading-normal">
                    <b className="text-xs font-medium">{title}</b>
                    <br />
                    {desc}
                  </span>
                </div>
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
