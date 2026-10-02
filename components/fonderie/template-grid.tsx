"use client"

import Link from "next/link"

import { generatorHref } from "@/lib/fonderie/presets"
import { TEMPLATES } from "@/lib/fonderie/templates"
import { cn } from "@/lib/utils"

import { TextCanvas } from "./font-canvas"
import { DashOutline } from "./dash-outline"
import { PILL } from "./panel-ui"

// Chaque template est une petite affiche monochrome (noir, blanc ou gris) ;
// un clic ouvre le générateur avec ses réglages.
export function TemplateGrid() {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {TEMPLATES.map((s) => (
        <li key={s.text} className={cn(s.wide && "md:col-span-2")}>
          <Link
            href={generatorHref(s.params, s.text)}
            className={cn(
              `palette-${s.palette}`,
              "group grid h-full gap-6 p-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:p-7"
            )}
          >
            <TextCanvas
              text={s.text}
              params={s.params}
              sizes={s.wide ? [64, 96, 132] : [56, 72, 84]}
              lineGap={0.25}
              label={`${s.text.replace(/\n/g, " ")}, ${s.caption}`}
            />
            <div className="flex items-end justify-between gap-3 self-end">
              <span className="text-[10px] leading-normal font-medium text-muted-foreground">
                {s.caption}
                {s.author && (
                  <>
                    <br />
                    <span className="text-foreground">by {s.author}</span>
                  </>
                )}
              </span>
              {/* Pastille qui se remplit au survol de l'affiche */}
              <span
                className={cn(
                  PILL,
                  "bg-transparent group-hover:bg-foreground group-hover:text-background"
                )}
              >
                <DashOutline />
                Use this template
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
