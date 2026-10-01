"use client"

import { DEFAULT_PARAMS, type Params } from "@/lib/fonderie/params"

import { StepCanvas } from "./font-canvas"

const SECTION_LABEL =
  "font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase"

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
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="grid scroll-mt-6 gap-8 border-t pt-8"
    >
      <div className="grid max-w-[62ch] gap-4">
        <h2
          id="how-it-works-title"
          className="text-[22px] leading-tight font-bold"
        >
          How it works
        </h2>
        <p>
          Each letter is described only once, as a path: a few lines and a few
          corners. That path doesn&apos;t depend on any grid, so the same
          alphabet can be rebuilt at any size, with any pieces. There are two
          ways to turn that path into a letter.
        </p>
      </div>
      {MODES.map((mode) => (
        <div
          key={mode.title}
          className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
        >
          <div className="grid content-start gap-2.5">
            <h3 className={SECTION_LABEL}>{mode.title}</h3>
            <p className="max-w-[60ch]">{mode.intro}</p>
          </div>
          <div className="grid grid-cols-3 content-start gap-3.5">
            {mode.steps.map(([step, title, desc]) => (
              <div key={step} className="grid gap-2">
                <StepCanvas
                  step={step}
                  char="R"
                  params={mode.params}
                  label={`${mode.title}, step ${title}`}
                />
                <span className="text-[13px] leading-snug text-muted-foreground">
                  <b className="font-medium text-foreground">{title}</b>
                  <br />
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="max-w-[62ch] text-muted-foreground">
        Weight decides how far the stroke spills into neighbouring cells, or how
        big the pieces are along the path. Roundness softens the corners.
        Organic variation makes some columns and rows wider than others. Kerning
        is computed automatically and written into the font file.
      </p>
    </section>
  )
}
