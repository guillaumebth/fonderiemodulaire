"use client"

import { useEffect, useState } from "react"

import { PanelSwitch } from "./panel-ui"

// Interrupteur « Invert » du footer : inverse toutes les couleurs du site, comme un négatif
// (ce n'est pas un mode sombre : les couleurs sont retournées, le bleu devient orange…).
// Le choix est mémorisé dans le navigateur ; le script de app/layout.tsx l'applique dès le
// chargement pour éviter un flash. Le style est dans globals.css (classe « inverted » sur <html>).
export const INVERT_KEY = "fonderie:invert"

export function InvertToggle() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    setOn(document.documentElement.classList.contains("inverted"))
  }, [])

  function toggle(next: boolean) {
    setOn(next)
    document.documentElement.classList.toggle("inverted", next)
    try {
      localStorage.setItem(INVERT_KEY, next ? "1" : "0")
    } catch {}
  }

  return (
    // Même interrupteur que les réglages de l'atelier (piste grise, rond noir), en petit
    <PanelSwitch
      size="sm"
      checked={on}
      onCheckedChange={toggle}
      label="Invert colors"
      className="self-center"
    />
  )
}
