"use client"

import { Slider as SliderPrimitive, Switch as SwitchPrimitive } from "radix-ui"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

// Briques du panneau de réglages, d'après la maquette Figma « Generator ».
// Construites sur les primitives Radix (accessibles au clavier) avec le style de la maquette.

// ---------- Pastilles ----------
// Noire = active / action principale ; blanche pointillée = option ; grise = action secondaire
export const PILL =
  "inline-flex items-center justify-center rounded-full border border-dashed border-foreground bg-surface px-[7px] py-[2px] text-xs leading-normal font-medium whitespace-nowrap transition-colors outline-none hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
export const PILL_ACTIVE =
  "bg-foreground text-background hover:bg-foreground/85"
export const PILL_MUTED =
  "border-transparent bg-pill-muted hover:bg-pill-muted/70"

export function Pill({
  active,
  muted,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean; muted?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        PILL,
        active && PILL_ACTIVE,
        muted && PILL_MUTED,
        className
      )}
      {...props}
    />
  )
}

// Choix unique en pastilles (Construction, Pieces…)
export function PillChoice<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: readonly { id: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      spacing={1}
      className="flex-wrap gap-y-2"
      aria-label={label}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.id}
          value={o.id}
          className={cn(
            PILL,
            "h-auto min-w-0 data-[state=on]:bg-foreground data-[state=on]:text-background"
          )}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// ---------- Section : filet noir avec un petit trait vertical à gauche (le coin), titre ----------
export function PanelSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="relative grid gap-2 border-t border-foreground pt-2 before:absolute before:top-0 before:left-0 before:h-3 before:w-px before:bg-foreground before:content-['']">
      <h3 className="pl-2 text-sm leading-normal font-medium">{title}</h3>
      <div className="grid gap-2 pr-2 pl-2">{children}</div>
    </section>
  )
}

// ---------- Interrupteur : piste grise, rond noir ----------
export function PanelSwitch({
  id,
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  id?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className="relative inline-flex h-[21px] w-9 shrink-0 items-center rounded-full bg-track transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40 data-[state=checked]:bg-foreground"
    >
      <SwitchPrimitive.Thumb className="block size-[15px] translate-x-[3px] rounded-full bg-foreground transition-transform data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-background" />
    </SwitchPrimitive.Root>
  )
}

// ---------- Curseur : libellé, valeur, piste grise (4 px), partie remplie noire (2 px), rond noir (8 px) ----------
export function PanelSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  inactive,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  inactive?: boolean // grisé quand le réglage n'a pas d'effet
}) {
  return (
    <div
      className={cn(
        "grid gap-[3px] transition-opacity",
        inactive && "opacity-40"
      )}
    >
      <div className="grid grid-cols-[115px_minmax(0,1fr)] text-xs leading-normal font-medium">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="tabular-nums">
          {format(value)}
        </output>
      </div>
      <SliderPrimitive.Root
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="relative flex h-2 w-full touch-none items-center select-none"
      >
        <SliderPrimitive.Track className="relative h-1 grow bg-track">
          <SliderPrimitive.Range className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-foreground" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={label}
          className="block size-2 rounded-full bg-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </SliderPrimitive.Root>
    </div>
  )
}
