"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HERO_PARAMS, PRESETS, presetHref } from "@/lib/fonderie/presets"

import { TextCanvas } from "./font-canvas"

const SECTION_LABEL =
  "font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase"

export function HomeContent() {
  return (
    <>
      <section className="grid gap-8">
        <TextCanvas
          text={"Fonderie\nmodulaire"}
          params={HERO_PARAMS}
          sizes={[72, 120, 168]}
          lineGap={0.3}
          intro
          alive
          label="Fonderie modulaire, written in a stitched modular font"
        />
        <div className="grid max-w-[62ch] gap-5">
          <p className="text-lg text-pretty">
            Build your own modular typeface with a few sliders. Every letter is
            a path; pieces — dots, rings, screws, crosses — are laid on it.
            Change the grid and the whole alphabet rebuilds itself. Then
            download a real font file.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/generator">
                Open the generator
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="styles">
        <h2 id="styles" className={SECTION_LABEL}>
          Start from a style
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((p) => (
            <li key={p.name}>
              <Link
                href={presetHref(p)}
                className="group block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full rounded-md ring-0 transition-colors group-hover:bg-muted">
                  <CardContent className="grid gap-3">
                    <TextCanvas
                      text={p.name}
                      params={p.params}
                      sizes={[48, 56, 56]}
                      lineGap={0.2}
                      intro
                      label={`${p.name} style`}
                    />
                    <p className="text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
