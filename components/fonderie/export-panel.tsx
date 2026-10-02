"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { CHECKOUT_URL, MIN_PRICE } from "@/lib/fonderie/config"
import {
  rememberFontBeforeCheckout,
  savedLicense,
  takeFontAfterCheckout,
  unlockLicense,
} from "@/lib/fonderie/license"
import type { Params } from "@/lib/fonderie/params"

import { DashOutline } from "./dash-outline"
import { PanelSection, Pill, PillChoice, pillLink } from "./panel-ui"

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

const FIELD =
  "w-full rounded-full bg-field px-[7px] py-[2px] text-xs leading-normal font-medium text-field-foreground outline-none placeholder:text-field-foreground focus:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"

// Sections Download et Image of the preview du panneau (maquette Figma « Generator »).
// Download : nom de la police, essai gratuit (A–Z, 0–9) et version complète.
// Version complète : on paie ce qu'on veut sur Stripe (à partir de MIN_PRICE). Au retour, l'adresse
// contient l'identifiant du paiement (?session_id=cs_…) : il est vérifié, sert de clé de licence et le
// bouton télécharge alors tous les caractères, sans « Trial ». La police en cours est mémorisée avant
// de partir payer et retrouvée au retour. Sur un autre ordinateur, on colle la clé à la main.
// id="download" : cible des liens « #download » vers cette section.
export function ExportPanel({
  params,
  onExportImage,
  look = "shown",
  onLookChange,
}: ExportPanelProps) {
  const [name, setName] = useState("Fonderie modulaire")
  const [busy, setBusy] = useState(false)
  // version complète débloquée : la clé validée sur ce navigateur
  const [license, setLicense] = useState<string | null>(null)
  const full = license !== null
  const [key, setKey] = useState("")
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function verify(candidate: string) {
    setChecking(true)
    setError(null)
    const problem = await unlockLicense(candidate)
    setChecking(false)
    if (problem) return setError(problem)
    setLicense(candidate.trim())
    toast.success("Full version unlocked", {
      description: "Every character is now in your download. Thank you!",
    })
  }

  useEffect(() => {
    setLicense(savedLicense())
    // Retour du paiement Stripe. Cet effet passe avant celui de l'éditeur (composant parent) :
    // la police remise dans l'adresse (#…) est donc celle que l'éditeur charge.
    const session = new URLSearchParams(window.location.search).get(
      "session_id"
    )
    if (!session) return
    const pending = takeFontAfterCheckout()
    if (pending?.name) setName(pending.name)
    const hash = window.location.hash || pending?.hash || ""
    window.history.replaceState(null, "", window.location.pathname + hash)
    verify(session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function download() {
    setBusy(true)
    try {
      // Le module d'export (et opentype.js) ne se charge qu'au premier clic : la page reste légère
      const { downloadFont } = await import("@/lib/fonderie/export")
      const file = downloadFont(params, name.trim() || "Fonderie Modulaire", full)
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

  function unlock(e: React.FormEvent) {
    e.preventDefault()
    verify(key)
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
          className={FIELD}
          placeholder="Fonderie modulaire"
        />
        <div>
          <Pill active onClick={download} disabled={busy}>
            {full ? "Download full font (.otf)" : "Download free trial (.otf)"}
          </Pill>
        </div>
        <p className="text-[10px] leading-normal font-medium">
          {full
            ? "Full version: every character, kerning and a commercial license. Thank you for your support!"
            : "The trial includes uppercase A–Z and figures 0–9, kerning included."}
          {params.mode === "contour" &&
            " The file is always solid: outline mode only exists on screen."}
        </p>
        {license && (
          <p className="text-[10px] leading-normal font-medium">
            Your license key, to unlock the full version on another computer:{" "}
            <span className="break-all select-all">{license}</span>
          </p>
        )}
        {/* Version complète : cachée tant que le lien de paiement n'est pas renseigné (lib/fonderie/config.ts) */}
        {CHECKOUT_URL && !full && (
          <>
            <p className="pt-2 text-xs leading-normal font-medium">
              Full version: lowercase, accents, punctuation and a commercial
              license. Pay what you want, from {MIN_PRICE}.
            </p>
            <div>
              <a
                href={CHECKOUT_URL}
                // la police en cours est retrouvée au retour du paiement
                onClick={() => rememberFontBeforeCheckout(name)}
                className={pillLink()}
              >
                <DashOutline />
                Get the full font
              </a>
            </div>
            <form onSubmit={unlock} className="grid gap-2 pt-2">
              <label
                htmlFor="license-key"
                className="text-xs leading-normal font-medium"
              >
                Already paid? Paste your license key
              </label>
              <div className="flex gap-1">
                <input
                  id="license-key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className={FIELD}
                  placeholder="cs_live_…"
                />
                <Pill muted type="submit" disabled={checking || !key.trim()}>
                  {checking ? "Checking…" : "Unlock"}
                </Pill>
              </div>
              {error && (
                <p role="alert" className="text-[10px] leading-normal font-medium">
                  {error}
                </p>
              )}
            </form>
          </>
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
