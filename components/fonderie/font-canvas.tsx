"use client"

import { useCanvas } from "@/hooks/use-canvas"
import type { Params } from "@/lib/fonderie/params"
import { renderStep } from "@/lib/fonderie/render"
import { useAnimatedText } from "@/hooks/use-animated-text"
import { cn } from "@/lib/utils"

type TextCanvasProps = {
  text: string
  params: Params
  // hauteur des capitales selon la largeur dispo : [< 420px, < 640px, au-delà]
  sizes: [number, number, number]
  lineGap: number
  label: string
  alive?: boolean
  className?: string
}

export function TextCanvas({
  text,
  params,
  sizes,
  lineGap,
  label,
  alive,
  className,
}: TextCanvasProps) {
  const ref = useAnimatedText({
    text,
    params,
    capH: (W) => (W < 420 ? sizes[0] : W < 640 ? sizes[1] : sizes[2]),
    lineGap,
    alive,
  })
  return (
    <canvas
      ref={ref}
      aria-label={label}
      className={cn("block w-full", className)}
    />
  )
}

type StepCanvasProps = {
  step: 1 | 2 | 3
  char: string
  params: Params
  label: string
}

export function StepCanvas({ step, char, params, label }: StepCanvasProps) {
  const { ref } = useCanvas((cv, col) =>
    renderStep(cv, step, char, params, col)
  )
  return (
    <canvas
      ref={ref}
      aria-label={label}
      className="block aspect-[4/5] w-full"
    />
  )
}
