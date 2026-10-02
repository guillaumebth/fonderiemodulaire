"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"

import { SUPPORT_URL } from "@/lib/fonderie/config"
import type { Params } from "@/lib/fonderie/params"

import { PanelSection, Pill, PILL, PillChoice } from "./panel-ui"

// Rendu de l'image : tel qu'à l'écran, ou vue de conception (grille, tracé rouge, contour)
export type ImageLook = "shown" | "blueprint"

type ExportPanelProps = {
  params: Params
  // export image de l'aperçu (SVG vectoriel ou PNG), fourni par l'éditeur qui connaît le texte et sa mise en page
  onExportImage?: (format: "svg" | "png") => void
  // rendu choisi pour l'image ; l'aperçu de l'éditeur l'affiche en direct
  look?: ImageLook
  onLookChange?: (look: ImageLook) => void
}

// Sections Download et Image of the preview du panneau (maquette Figma « Generator ») :
// nom de la police, bouton de téléchargement de la version d'essai, petite mention.
// id="download" : cible des liens « #download » vers cette section.
export function ExportPanel({
  params,
  onExportImage,
  look = "shown",
  onLookChange,
}: ExportPanelProps) {
  const [name, setName] = useState("Fonderie modulaire")
  const [busy, setBusy] = useState(false)

  async function download() {
    setBusy(true)
    try {
      // Le module d'export (et opentype.js) ne se charge qu'au premier clic : la page reste légère
      const { downloadFont } = await import("@/lib/fonderie/export")
      const file = downloadFont(params, name.trim() || "Fonderie Modulaire")
      toast.success(`${file} downloaded`, {
        description: "Double-click the file to install the font.",
      })
    } catch (e) {
      console.error(e)
      toast.error("Export failed", { description: String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div id="download" className="grid scroll-mt-6 gap-6">
      <PanelSection title="Download" collapsible>
        <label
          htmlFor="font-name"
          className="text-xs leading-normal font-medium"
        >
          Font name
        </label>
        <input
          id="font-name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full bg-field px-[7px] py-[2px] text-xs leading-normal font-medium text-field-foreground outline-none placeholder:text-field-foreground focus:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Fonderie modulaire"
        />
        <div>
          <Pill active onClick={download} disabled={busy}>
            Download free trial (.otf)
          </Pill>
        </div>
        <p className="text-[10px] leading-normal font-medium">
          The trial includes uppercase A–Z and figures 0–9, kerning included.
          {params.mode === "contour" &&
            " The file is always solid: outline mode only exists on screen."}
        </p>
        {/* Prix libre : caché tant que le lien de paiement n'est pas renseigné (lib/fonderie/config.ts) */}
        {SUPPORT_URL && (
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${PILL} w-fit gap-1`}
          >
            <Heart className="size-3" />
            Pay what you want
          </a>
        )}
      </PanelSection>
      {onExportImage && (
        <PanelSection title="Image of the preview" collapsible>
          <PillChoice
            label="Image style"
            value={look}
            onChange={(v) => onLookChange?.(v)}
            options={[
              { id: "shown", label: "As shown" },
              { id: "blueprint", label: "Blueprint" },
            ]}
          />
          <div className="flex gap-1">
            <Pill active onClick={() => onExportImage("svg")}>
              SVG
            </Pill>
            <Pill active onClick={() => onExportImage("png")}>
              PNG
            </Pill>
          </div>
          <p className="text-[10px] leading-normal font-medium">
            {look === "shown"
              ? "Exactly as on screen, on a transparent background."
              : "Your font as a construction drawing: grid, red path and outlined pieces."}{" "}
            The SVG opens in Figma.
          </p>
        </PanelSection>
      )}
    </div>
  )
}
