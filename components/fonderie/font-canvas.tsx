"use client"

import { useState } from "react"

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
  // ou bien : hauteur des capitales proportionnelle à la largeur (ex. 0.12 = 12 % de la largeur)
  fluid?: number
  lineGap: number
  label: string
  alive?: boolean
  center?: boolean
  morph?: boolean
  // si présent : on tape directement dans l'aperçu (champ invisible + curseur clignotant)
  onTextChange?: (text: string) => void
  className?: string
}

export function TextCanvas({
  text,
  params,
  sizes,
  fluid,
  lineGap,
  label,
  alive,
  center,
  morph,
  onTextChange,
  className,
}: TextCanvasProps) {
  const [caret, setCaret] = useState<{
    x: number
    top: number
    height: number
  } | null>(null)
  const [focused, setFocused] = useState(false)
  const ref = useAnimatedText({
    text,
    params,
    capH: (W) =>
      fluid ? W * fluid : W < 420 ? sizes[0] : W < 640 ? sizes[1] : sizes[2],
    lineGap,
    alive,
    center,
    morph,
    // on ne met à jour le curseur que s'il a bougé (évite un rendu à chaque image)
    onEnd: onTextChange
      ? (e) =>
          setCaret((c) =>
            c && c.x === e.x && c.top === e.top && c.height === e.height ? c : e
          )
      : undefined,
  })
  const canvas = (
    <canvas
      ref={ref}
      aria-label={label}
      className={cn("block w-full", className)}
    />
  )
  if (!onTextChange) return canvas

  // Aperçu éditable : un champ invisible recouvre le dessin et capte la frappe (clavier mobile compris).
  // On écrit et on efface en fin de texte ; le curseur dessiné suit la dernière lettre.
  return (
    <div className="relative cursor-text">
      {canvas}
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        // le point d'insertion reste toujours en fin de texte
        onSelect={(e) => {
          const t = e.currentTarget
          if (t.selectionStart !== t.value.length)
            t.setSelectionRange(t.value.length, t.value.length)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Type your text"
        className="absolute inset-0 size-full cursor-text resize-none bg-transparent text-transparent caret-transparent opacity-0 outline-none"
      />
      {focused && caret && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute w-0.5 animate-caret-blink bg-foreground"
          style={{ left: caret.x, top: caret.top, height: caret.height }}
        />
      )}
      {!text && (
        <span className="pointer-events-none absolute top-0 left-0 text-sm text-muted-foreground">
          Type something…
        </span>
      )}
    </div>
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
