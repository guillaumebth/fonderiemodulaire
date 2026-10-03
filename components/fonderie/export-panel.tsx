"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { CHECKOUT_URL, CONTACT_URL, PRICE } from "@/lib/fonderie/config"
import {
  rememberFontBeforeCheckout,
  savedLicense,
  takeFontAfterCheckout,
  unlockLicense,
} from "@/lib/fonderie/license"
import type { Params } from "@/lib/fonderie/params"
import { playDownload } from "@/lib/fonderie/sound"
import { cn } from "@/lib/utils"

import { PanelSection, Pill, PillChoice } from "./panel-ui"
import { DashOutline } from "./dash-outline"
import { ACTION_COLORS, PILL, PILL_ACTIVE } from "./pill-styles"
import { PurchaseDialog, type Purchase } from "./purchase-dialog"
import { ShakeLink } from "./shake-link"

// Rendu de l'image : tel qu'à l'écran, ou vue de conception (grille, tracé rouge, contour)
export type ImageLook = "shown" | "blueprint"

type ExportPanelProps = {
  params: Params
  // nom de la police : partagé avec l'éditeur (la planche Specimen l'affiche)
  name: string
  onNameChange: (name: string) => void
  // ouvre l'onglet Specimen de l'aperçu (montre tout ce que contient la version complète)
  onShowSpecimen?: () => void
  // export image de l'aperçu (SVG vectoriel ou PNG), fourni par l'éditeur qui connaît le texte et sa mise en page
  onExportImage?: (format: "svg" | "png") => void
  // rendu choisi pour l'image ; l'aperçu de l'éditeur l'affiche en direct
  look?: ImageLook
  onLookChange?: (look: ImageLook) => void
}

const FIELD =
  "w-full rounded-full bg-field px-[7px] py-[2px] text-xs leading-normal font-medium text-field-foreground outline-none placeholder:text-field-foreground focus:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"

// E-mail prérempli pour proposer sa police aux templates. L'adresse de la page contient
// tous les réglages et le texte (après le #) : c'est elle qu'on envoie.
function submitHref(name: string) {
  const url = typeof window === "undefined" ? "" : window.location.href
  const to = CONTACT_URL.replace(/^mailto:/, "")
  const subject = `Template submission: ${name || "my font"}`
  const body = [
    `Font name: ${name}`,
    `Link: ${url}`,
    "",
    "Credit me as (name, X or Instagram handle): ",
    "",
  ].join("\n")
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// Sections Download et Image of the preview du panneau (maquette Figma « Generator »).
// Download : nom de la police, essai gratuit (A–Z, 0–9) et version complète.
// Version complète : on paie sur Stripe (PRICE). Au retour, l'adresse
// contient l'identifiant du paiement (?session_id=cs_…) : il est vérifié, sert de clé de licence et le
// bouton télécharge alors tous les caractères, sans « Trial ». La police en cours est mémorisée avant
// de partir payer et retrouvée au retour. Sur un autre ordinateur, on colle la clé à la main.
// id="download" : cible des liens « #download » vers cette section.
export function ExportPanel({
  params,
  name,
  onNameChange: setName,
  onShowSpecimen,
  onExportImage,
  look = "shown",
  onLookChange,
}: ExportPanelProps) {
  const [busy, setBusy] = useState(false)
  // version complète débloquée : la clé validée sur ce navigateur
  const [license, setLicense] = useState<string | null>(null)
  const full = license !== null
  const [key, setKey] = useState("")
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // retour du paiement : fenêtre de remerciement (vérification, téléchargement, clé à garder)
  const [purchase, setPurchase] = useState<Purchase | null>(null)

  async function verify(candidate: string) {
    setChecking(true)
    setError(null)
    const problem = await unlockLicense(candidate)
    setChecking(false)
    if (problem) return setError(problem)
    setLicense(savedLicense() ?? candidate.trim())
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
    // En local seulement (npm run dev) : aperçu de la fenêtre sans vrai paiement
    // ?session_id=preview → paiement confirmé ; ?session_id=preview-error → échec. Ignoré en ligne.
    if (
      process.env.NODE_ENV === "development" &&
      session.startsWith("preview")
    ) {
      const key = "cs_live_a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ"
      if (session === "preview-error")
        return setPurchase({
          key,
          status: "error",
          error: "This key isn't a paid Fonderie modulaire license.",
        })
      setLicense(key) // débloqué le temps de la visite, sans être retenu
      return setPurchase({ key, status: "ok" })
    }
    setPurchase({ key: session, status: "checking" })
    unlockLicense(session).then((problem) => {
      if (problem)
        return setPurchase({ key: session, status: "error", error: problem })
      setLicense(session)
      setPurchase({ key: session, status: "ok" })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function download() {
    playDownload()
    setBusy(true)
    try {
      // Le module d'export (et opentype.js) ne se charge qu'au premier clic : la page reste légère
      const { downloadFont } = await import("@/lib/fonderie/export")
      // le zip contient aussi la licence et un lien pour rouvrir la police (l'adresse suit les réglages)
      const file = downloadFont(
        params,
        name.trim() || "Fonderie Modulaire",
        full,
        {
          key: license ?? undefined,
          url:
            window.location.origin +
            window.location.pathname +
            window.location.hash,
        }
      )
      // compteur anonyme des téléchargements (functions/api/count.ts) ; sans effet s'il n'existe pas
      void fetch("/api/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: full ? "full" : "trial" }),
        keepalive: true,
      }).catch(() => {})
      toast.success(`${file} downloaded`, {
        description:
          "Unzip it, then double-click the .otf to install the font.",
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
      <PurchaseDialog
        purchase={purchase}
        params={params}
        busy={busy}
        onDownload={download}
        onClose={() => setPurchase(null)}
      />
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
          placeholder="Name your font"
        />
        <div>
          <Pill active onClick={download} disabled={busy}>
            {full ? "Download full font" : "Download free trial"}
          </Pill>
        </div>
        <p className="text-[10px] leading-normal font-medium">
          {full
            ? "Full version: every character, kerning and a commercial license. Thank you for your support!"
            : "The trial includes uppercase A–Z and figures 0–9, kerning included, for personal projects."}
          {
            " A .zip with the .otf file, its license and a link to edit it again."
          }
          {params.mode === "contour" &&
            " The file is always solid: outline mode only exists on screen."}
        </p>
        {license && (
          <p className="text-[10px] leading-normal font-medium">
            On another computer, unlock the full version with the email you paid
            with, or this license key:{" "}
            <span className="break-all select-all">{license}</span>
          </p>
        )}
        {/* Version complète : cachée tant que le lien de paiement n'est pas renseigné (lib/fonderie/config.ts) */}
        {CHECKOUT_URL && !full && (
          <>
            <p className="pt-2 text-xs leading-normal font-medium">
              Full version: lowercase, accents, punctuation and a commercial
              license, for {PRICE}.
            </p>
            <div className="flex flex-wrap gap-1">
              {/* Bleu d'action, à la taille d'une pastille ; tremble et clignote au survol, comme sur la home */}
              <ShakeLink
                href={CHECKOUT_URL}
                colors={ACTION_COLORS}
                sound
                onClick={(e) => {
                  // la police en cours est retrouvée au retour du paiement
                  rememberFontBeforeCheckout(name)
                  // Stripe s'ouvre dans la page : on attend un quart de seconde pour entendre le « clac »
                  // (sauf ⌘/Ctrl-clic, qui ouvre un nouvel onglet)
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return
                  e.preventDefault()
                  setTimeout(() => window.location.assign(CHECKOUT_URL), 250)
                }}
                className={cn(
                  PILL,
                  "bg-action text-action-foreground hover:bg-action"
                )}
              >
                Get the full font
              </ShakeLink>
              {/* La planche montre tout ce que contient la version complète */}
              {onShowSpecimen && (
                <button type="button" onClick={onShowSpecimen} className={PILL}>
                  <DashOutline />
                  See the specimen
                </button>
              )}
            </div>
            <form onSubmit={unlock} className="grid gap-2 pt-2">
              <label
                htmlFor="license-key"
                className="text-xs leading-normal font-medium"
              >
                Already paid? Enter the email you paid with
              </label>
              <div className="flex gap-1">
                <input
                  id="license-key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className={FIELD}
                  type="text"
                  inputMode="email"
                  placeholder="you@email.com, or your license key"
                />
                <Pill muted type="submit" disabled={checking || !key.trim()}>
                  {checking ? "Checking…" : "Unlock"}
                </Pill>
              </div>
              {error && (
                <p
                  role="alert"
                  className="text-[10px] leading-normal font-medium"
                >
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
      {/* Communauté : on envoie sa police par e-mail (lien de l'atelier = tous les réglages),
          pour qu'elle rejoigne peut-être les templates, avec son nom */}
      {CONTACT_URL && (
        <PanelSection title="Submit to templates" collapsible>
          <p className="text-xs leading-normal font-medium">
            Proud of this one? Send it over: the best fonts join the templates,
            with your name on them.
          </p>
          <div>
            <a
              href={submitHref(name)}
              // l'adresse suit les réglages sans recharger la page : on la relit au moment du clic
              onClick={(e) => (e.currentTarget.href = submitHref(name))}
              className={PILL}
            >
              <DashOutline />
              Submit my font
            </a>
          </div>
          <p className="text-[10px] leading-normal font-medium">
            Opens an email with the link to your font. Add your name or your X /
            Instagram handle for the credit.
          </p>
        </PanelSection>
      )}
    </div>
  )
}
