"use client"

import { useState } from "react"
import { Download, Heart } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SUPPORT_URL } from "@/lib/fonderie/config"
import type { Params } from "@/lib/fonderie/params"

type ExportPanelProps = { params: Params; legendClassName?: string }

export function ExportPanel({ params, legendClassName }: ExportPanelProps) {
  const [name, setName] = useState("Fonderie Modulaire")
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
    // id="download" : cible du bouton « Trial ↓ » du menu
    <FieldSet id="download" className="scroll-mt-6 gap-3.5">
      <FieldLegend className={legendClassName}>Download</FieldLegend>
      <Field>
        <FieldLabel htmlFor="font-name">Font name</FieldLabel>
        <Input
          id="font-name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Button type="button" onClick={download} disabled={busy}>
        <Download data-icon="inline-start" />
        Download free trial (.otf)
      </Button>
      <FieldDescription>
        The trial includes uppercase A–Z and figures 0–9, kerning included.
        {params.mode === "contour" &&
          " The file is always solid: outline mode only exists on screen."}
      </FieldDescription>
      {/* Prix libre : caché tant que le lien de paiement n'est pas renseigné (lib/fonderie/config.ts) */}
      {SUPPORT_URL && (
        <Button asChild variant="outline">
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
            <Heart data-icon="inline-start" />
            Pay what you want
          </a>
        </Button>
      )}
    </FieldSet>
  )
}
