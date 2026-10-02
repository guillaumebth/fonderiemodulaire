"use client"

import { useState } from "react"
import { Dialog } from "radix-ui"

import { CONTACT_URL } from "@/lib/fonderie/config"
import type { Params } from "@/lib/fonderie/params"

import { DashOutline } from "./dash-outline"
import { TextCanvas } from "./font-canvas"
import { Pill, pillLink } from "./panel-ui"

export type Purchase = {
  key: string // identifiant du paiement Stripe (cs_…), qui sert de clé de licence
  status: "checking" | "ok" | "error"
  error?: string
}

// Fenêtre qui s'ouvre au retour du paiement Stripe, pour que l'acheteur n'ait pas à chercher :
// « Thank you » dessiné avec SA police, le bouton de téléchargement complet, et sa clé de licence
// à mettre de côté (avec un bouton Copy). Pendant la vérification : « Checking your payment… ».
// En cas d'échec : la clé et un lien de contact (le paiement a peut-être eu lieu).
// Direction artistique : fond clair, sans contour, ombre ni coins arrondis.
export function PurchaseDialog({
  purchase,
  params,
  busy,
  onDownload,
  onClose,
}: {
  purchase: Purchase | null
  params: Params
  busy: boolean
  onDownload: () => void
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!purchase) return
    try {
      await navigator.clipboard.writeText(purchase.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <Dialog.Root open={purchase !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-32px)] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto bg-background p-6 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none">
          {purchase?.status === "ok" ? (
            <>
              <TextCanvas
                text={"Thank\nyou"}
                params={params}
                sizes={[48, 48, 48]}
                lineGap={0}
                label="Thank you, written with your font"
              />
              <div className="grid gap-2">
                <Dialog.Title className="text-sm leading-normal font-medium">
                  Your full font is ready
                </Dialog.Title>
                <Dialog.Description className="text-xs leading-normal font-medium">
                  Every character, kerning and a commercial license.
                </Dialog.Description>
              </div>
              <div>
                <Pill active onClick={onDownload} disabled={busy}>
                  Download full font
                </Pill>
              </div>
              <div className="grid gap-2 border-t border-foreground pt-3">
                <p className="text-xs leading-normal font-medium">
                  Your license key
                </p>
                <div className="flex gap-1">
                  <input
                    readOnly
                    value={purchase.key}
                    aria-label="Your license key"
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full min-w-0 rounded-full bg-field px-[7px] py-[2px] text-xs leading-normal font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <Pill muted onClick={copy}>
                    {copied ? "Copied" : "Copy"}
                  </Pill>
                </div>
                <p className="text-[10px] leading-normal font-medium">
                  This browser remembers it, and it works for every font you
                  make. On another computer, unlock the full version again in
                  the atelier, under Download, with the email you paid with
                  (it&apos;s on your Stripe receipt) or this key.
                </p>
              </div>
            </>
          ) : purchase?.status === "error" ? (
            <>
              <Dialog.Title className="text-sm leading-normal font-medium">
                We couldn&apos;t confirm your payment
              </Dialog.Title>
              <Dialog.Description className="text-xs leading-normal font-medium">
                {purchase.error} If you were charged, keep this key and get in
                touch: we&apos;ll sort it out.
              </Dialog.Description>
              <input
                readOnly
                value={purchase.key}
                aria-label="Your payment reference"
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-full bg-field px-[7px] py-[2px] text-xs leading-normal font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              {CONTACT_URL && (
                <div>
                  <a href={CONTACT_URL} className={pillLink()}>
                    <DashOutline />
                    Contact
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              <Dialog.Title className="text-sm leading-normal font-medium">
                Checking your payment…
              </Dialog.Title>
              <Dialog.Description className="text-xs leading-normal font-medium">
                It only takes a second.
              </Dialog.Description>
            </>
          )}
          <Dialog.Close className="absolute top-3 right-4 text-xs leading-normal font-medium outline-none hover:underline hover:underline-offset-2 focus-visible:ring-3 focus-visible:ring-ring/50">
            Close
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
