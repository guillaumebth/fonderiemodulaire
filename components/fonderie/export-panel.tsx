"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"

import { SUPPORT_URL } from "@/lib/fonderie/config"
import type { Params } from "@/lib/fonderie/params"

import { PanelSection, Pill, PILL } from "./panel-ui"

type ExportPanelProps = { params: Params }

// Section Download du panneau (maquette Figma « Generator ») :
// nom de la police, bouton de téléchargement de la version d'essai, petite mention.
// id="download" : cible des liens « #download » vers cette section.
export function ExportPanel({ params }: ExportPanelProps) {
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
    <div id="download" className="scroll-mt-6">
      <PanelSection title="Download">
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
    </div>
  )
}
