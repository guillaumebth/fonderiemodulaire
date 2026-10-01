"use client"

import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"

type ControlSliderProps = {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  // grisé quand le réglage n'a pas d'effet avec la forme ou le rendu choisi
  inactive?: boolean
}

export function ControlSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  inactive,
}: ControlSliderProps) {
  return (
    <Field
      data-disabled={inactive}
      className="transition-opacity data-[disabled=true]:opacity-40"
    >
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <output
          htmlFor={id}
          className="font-mono text-xs text-muted-foreground tabular-nums"
        >
          {format(value)}
        </output>
      </div>
      <Slider
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </Field>
  )
}
