// Styles des pastilles (direction artistique), sans « use client » : utilisables par les pages serveur.
import { cn } from "@/lib/utils"

// ---------- Pastilles ----------
// Noire = active / action principale ; blanche pointillée = option ; grise = action secondaire.
// Le pointillé n'est pas une bordure CSS mais un <DashOutline /> à mettre dans la pastille (il s'anime au survol).
export const PILL =
  "pill relative inline-flex items-center justify-center rounded-full border border-transparent bg-surface px-[7px] py-[2px] text-xs leading-normal font-medium whitespace-nowrap transition-colors outline-none hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
export const PILL_ACTIVE =
  "bg-foreground text-background hover:bg-foreground/85"
export const PILL_MUTED =
  "border-transparent bg-pill-muted hover:bg-pill-muted/70"

// Lien en forme de pastille (même rendu que Pill)
export function pillLink(active?: boolean) {
  return cn(PILL, active && PILL_ACTIVE)
}

// ---------- Gros bouton d'action (bleu vif #08f) : home, page Templates ----------
// À utiliser avec ShakeLink et ACTION_COLORS (il tremble et clignote au survol)
export const ACTION_BUTTON =
  "rounded-full bg-action px-6 text-[40px] leading-normal font-medium text-action-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 md:text-[60px]"
// Couleurs « punch » qui défilent au survol (définies dans globals.css)
export const ACTION_COLORS = [1, 2, 3, 4, 5].map((n) => `var(--punch-${n})`)
