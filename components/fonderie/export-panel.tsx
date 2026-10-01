"use client"

import { useState } from "react"
import { Download } from "lucide-react"
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
import type { Params } from "@/lib/fonderie/params"

type ExportPanelProps = { params: Params; legendClassName?: string }

export function ExportPanel({ params, legendClassName }: ExportPanelProps) {
  const [name, setName] = useState("Fonderie Modulaire")
  const [busy, setBusy] = useState(false)

  async function download() {
    setBusy(true)
    try {
      // Le module d'export (et opentype.js) ne se charge qu'au premier clic : la page reste légère
      const { downloadFont, fileName } = await import("@/lib/fonderie/export")
      const family = name.trim() || "Fonderie Modulaire"
      downloadFont(params, family)
      toast.success(`${fileName(family)} téléchargé`, {
        description: "Double-clique sur le fichier pour installer la police.",
      })
    } catch (e) {
      console.error(e)
      toast.error("L'export a échoué", { description: String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <FieldSet className="gap-3.5">
      <FieldLegend className={legendClassName}>Télécharger</FieldLegend>
      <Field>
        <FieldLabel htmlFor="font-name">Nom de la police</FieldLabel>
        <Input
          id="font-name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Button type="button" onClick={download} disabled={busy}>
        <Download data-icon="inline-start" />
        Télécharger la police (.otf)
      </Button>
      <FieldDescription>
        Capitales, minuscules, chiffres et ponctuation, avec le crénage.
        {params.mode === "contour" &&
          " Le fichier est toujours en plein : le contour n'existe qu'à l'écran."}
      </FieldDescription>
    </FieldSet>
  )
}
