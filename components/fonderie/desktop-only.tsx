"use client"

import { useSyncExternalStore } from "react"

// L'atelier ne s'utilise que sur un écran d'au moins 768 px (le « md » de Tailwind).
const QUERY = "(min-width: 768px)"

function subscribe(onChange: () => void) {
  const m = window.matchMedia(QUERY)
  m.addEventListener("change", onChange)
  return () => m.removeEventListener("change", onChange)
}

// Affiche children sur ordinateur, fallback sur mobile.
// Au premier affichage (avant que le navigateur ne connaisse la taille de l'écran), les deux sont là
// et le CSS montre le bon : pas de flash. Ensuite seul le bon reste, donc l'atelier ne tourne pas
// en cachette sur un téléphone.
export function DesktopOnly({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback: React.ReactNode
}) {
  const desktop = useSyncExternalStore<boolean | null>(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => null
  )
  return (
    <>
      {desktop !== false && (
        <div className="contents max-md:hidden">{children}</div>
      )}
      {desktop !== true && <div className="contents md:hidden">{fallback}</div>}
    </>
  )
}
