"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { generatorHref } from "@/lib/fonderie/presets"
import { TEMPLATES } from "@/lib/fonderie/templates"
import { cn } from "@/lib/utils"

import { TextCanvas } from "./font-canvas"

// Chaque template est une petite affiche colorée ; un clic ouvre le générateur avec ses réglages
export function TemplateGrid() {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {TEMPLATES.map((s) => (
        <li key={s.text} className={cn(s.wide && "md:col-span-2")}>
          <Link
            href={generatorHref(s.params, s.text)}
            className={cn(
              `palette-${s.palette}`,
              "group grid h-full gap-6 rounded-md p-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:p-7"
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
              <span className="font-mono text-xs text-muted-foreground">
                {s.caption}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-medium opacity-70 transition-opacity group-hover:opacity-100">
                Use this template
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
