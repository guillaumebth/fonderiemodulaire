"use client"

import { createContext, use, useId, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Slider as SliderPrimitive, Switch as SwitchPrimitive } from "radix-ui"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ContourRecorder } from "@/lib/fonderie/contours"
import { pathData } from "@/lib/fonderie/image-export"
import { DEFAULT_PARAMS, type Params } from "@/lib/fonderie/params"
import { shape, type Piece } from "@/lib/fonderie/shapes"
import { cn } from "@/lib/utils"

import { DashOutline } from "./dash-outline"
import { PILL, PILL_ACTIVE, PILL_MUTED } from "./pill-styles"

gsap.registerPlugin(useGSAP)

export { PILL, PILL_ACTIVE, PILL_MUTED, pillLink } from "./pill-styles"

// Briques du panneau de réglages, d'après la maquette Figma « Generator ».
// Construites sur les primitives Radix (accessibles au clavier) avec le style de la maquette.

// ---------- Pastilles ----------

export function Pill({
  active,
  muted,
  className,
  children,
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
    >
      {!active && !muted && <DashOutline />}
      {children}
    </button>
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
          <DashOutline />
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// ---------- Section : filet noir avec un petit trait vertical à gauche (le coin), titre ----------
const SECTION =
  "relative grid border-t border-foreground pt-2 before:absolute before:top-0 before:left-0 before:h-3 before:w-px before:bg-foreground before:content-['']"

export function PanelSection({
  title,
  children,
  collapsible,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  // repliable : on ne voit que le titre et un « + » ; un clic sur la ligne déplie la section
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  if (collapsible)
    return (
      <CollapsibleSection title={title} defaultOpen={defaultOpen}>
        {children}
      </CollapsibleSection>
    )
  return (
    <section className={SECTION}>
      <h3 className="pl-2 text-sm leading-normal font-medium">{title}</h3>
      <div className="grid gap-2 pt-2 pr-2 pl-2">{children}</div>
    </section>
  )
}

// Section repliable animée avec GSAP :
// - la hauteur s'ouvre / se ferme en douceur ;
// - à l'ouverture, les éléments arrivent l'un après l'autre (glissement + fondu) ;
// - le « + » devient « − » : son trait vertical pivote de 90° et se couche sur l'horizontal.
// Sans animation si le système demande de réduire les animations.
function CollapsibleSection({
  title,
  children,
  defaultOpen,
}: {
  title: string
  children: React.ReactNode
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const root = useRef<HTMLElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null) // trait vertical du « + »

  const { contextSafe } = useGSAP(
    () => {
      gsap.set(body.current, {
        height: defaultOpen ? "auto" : 0,
        overflow: defaultOpen ? "visible" : "hidden",
      })
      gsap.set(bar.current, { rotation: defaultOpen ? 90 : 0 })
    },
    { scope: root }
  )

  const toggle = contextSafe(() => {
    const next = !open
    setOpen(next)
    const k = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 1
    const items = body.current?.firstElementChild?.children ?? []
    gsap.killTweensOf([body.current, bar.current, ...Array.from(items)])
    gsap.to(bar.current, {
      rotation: next ? 90 : 0,
      duration: 0.5 * k,
      ease: "back.out(2.5)",
    })
    // Le contenu est rogné pendant l'animation, puis libéré une fois ouvert
    // (sinon le contour des champs et des pastilles au focus est coupé sur les bords)
    gsap.set(body.current, { overflow: "hidden" })
    if (next) {
      gsap.fromTo(
        body.current,
        { height: 0 },
        {
          height: "auto",
          duration: 0.55 * k,
          ease: "expo.out",
          onComplete: () => gsap.set(body.current, { overflow: "visible" }),
        }
      )
      gsap.fromTo(
        items,
        { y: 10, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.45 * k,
          ease: "power3.out",
          stagger: 0.05 * k,
          delay: 0.05 * k,
          clearProps: "transform,opacity,visibility",
        }
      )
    } else {
      gsap.to(items, { autoAlpha: 0, duration: 0.15 * k, ease: "power1.in" })
      gsap.to(body.current, {
        height: 0,
        duration: 0.4 * k,
        ease: "power3.inOut",
        onComplete: () => gsap.set(items, { clearProps: "opacity,visibility" }),
      })
    }
  })

  return (
    <section ref={root} className={SECTION}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={toggle}
          className="group flex w-full items-center justify-between px-2 text-left text-sm leading-normal font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {title}
          {/* « + » dessiné : deux traits de 10 px ; le vertical pivote pour former « − » */}
          <span aria-hidden="true" className="relative size-2.5">
            <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-foreground" />
            <span
              ref={bar}
              className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-foreground"
            />
          </span>
        </button>
      </h3>
      {/* hauteur fermée dès le premier affichage (pas de flash ouvert avant le script) */}
      <div
        id={id}
        ref={body}
        className="overflow-hidden"
        style={defaultOpen ? undefined : { height: 0 }}
        inert={!open}
      >
        <div className="grid gap-2 pt-2 pr-2 pl-2">{children}</div>
      </div>
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

// ---------- Curseur ----------
// Libellé et valeur ; piste grise (4 px) et partie remplie noire (2 px) ;
// dessous, une règle graduée (un trait par valeur pour les petits nombres entiers, sinon 10 intervalles) ;
// la poignée est dessinée avec la pièce choisie (rond, anneau, vis…), comme une perle sur le fil ;
// Pièce de la poignée : fournie par PieceContext (les réglages de la police), rond par défaut.
export const PieceContext = createContext<Params | null>(null)

const MIX: Piece[] = ["rond", "anneau", "vis", "cible"]
const THUMB = 14 // taille de la poignée, en px

function PieceIcon({ P, seed }: { P: Params | null; seed: number }) {
  const params = P ?? DEFAULT_PARAMS
  // « Mix » : chaque curseur montre une pièce différente du mélange
  const kind: Piece =
    params.shape === "melange" ? MIX[seed % MIX.length] : params.shape
  const rec = new ContourRecorder()
  shape(rec, kind, THUMB / 2, THUMB / 2, THUMB, THUMB, params)
  return (
    <svg
      viewBox={`0 0 ${THUMB} ${THUMB}`}
      aria-hidden="true"
      className="block size-full overflow-visible"
    >
      <path d={pathData(rec.done())} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}

// Positions des traits de la règle, en % de la course
function ticks(min: number, max: number, step: number) {
  const span = max - min
  const n = step >= 1 && span / step <= 20 ? Math.round(span / step) : 10
  return Array.from({ length: n + 1 }, (_, i) => (i / n) * 100)
}

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
  const P = use(PieceContext)
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0)

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
      <div>
        <SliderPrimitive.Root
          id={id}
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([v]) => onChange(v)}
          className="relative flex h-3.5 w-full cursor-pointer touch-none items-center select-none"
        >
          <SliderPrimitive.Track className="relative h-1 grow bg-track">
            <SliderPrimitive.Range className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-foreground" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            aria-label={label}
            className="block size-3.5 rounded-full text-foreground transition-[scale] outline-none hover:scale-125 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-125"
          >
            <PieceIcon P={P} seed={seed} />
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Root>
        {/* Règle graduée, alignée sur la course du centre de la poignée */}
        <div aria-hidden="true" className="relative mx-[7px] h-[3px]">
          {ticks(min, max, step).map((x) => (
            <span
              key={x}
              className="absolute top-0 h-full w-px -translate-x-1/2 bg-foreground/30"
              style={{ left: `${x}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
