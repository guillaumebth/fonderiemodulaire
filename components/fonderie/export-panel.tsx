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
      toast.success(`${fileName(family)} downloaded`, {
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
    <FieldSet className="gap-3.5">
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
        Download font (.otf)
      </Button>
      <FieldDescription>
        Uppercase, lowercase, figures and punctuation, kerning included.
        {params.mode === "contour" &&
          " The file is always solid: outline mode only exists on screen."}
      </FieldDescription>
    </FieldSet>
  )
}
