import type { Metadata } from "next"
import Link from "next/link"

import { PAGE, PageIntro } from "@/components/fonderie/page-intro"
import { PanelSection } from "@/components/fonderie/panel-ui"
import { CONTACT_URL, LEGAL } from "@/lib/fonderie/config"

export const metadata: Metadata = {
  title: "Legal · Fonderie modulaire",
  description: "Mentions légales et politique de confidentialité.",
}

// Le minimum légal, en français : mentions légales et confidentialité.
// Conditions générales de vente : à ajouter plus tard (section #cgv).
// Les informations de l'entreprise se renseignent dans LEGAL (lib/fonderie/config.ts).
const email = CONTACT_URL.replace(/^mailto:/, "")
const todo = (v: string) => v || "[à compléter]"

const P = "text-xs leading-normal"

export default function LegalPage() {
  return (
    <main className={PAGE}>
      <PageIntro title="Legal">
        <p>Legal information and privacy policy (in French).</p>
      </PageIntro>

      <div className="grid max-w-[640px] gap-10">
        <div id="mentions" className="scroll-mt-6">
          <PanelSection title="Mentions légales">
            <p className={P}>
              <b className="font-medium">Éditeur du site</b> : {LEGAL.name},{" "}
              {LEGAL.status}. SIREN : {todo(LEGAL.siren)}.{" "}
              {LEGAL.address && `Adresse : ${LEGAL.address}. `}E-mail : {email}.{" "}
              {LEGAL.vat}.
            </p>
            <p className={P}>
              <b className="font-medium">Directeur de la publication</b> :{" "}
              {LEGAL.name}.
            </p>
            <p className={P}>
              <b className="font-medium">Hébergeur</b> : Cloudflare, Inc., 101
              Townsend St, San Francisco, CA 94107, États-Unis (cloudflare.com).
            </p>
            <p className={P}>
              Le site, son moteur et ses textes appartiennent à {LEGAL.name}.
              Les polices créées par les utilisateurs s&apos;utilisent selon la
              licence fournie avec chaque téléchargement.
            </p>
          </PanelSection>
        </div>

        <div id="privacy" className="scroll-mt-6">
          <PanelSection title="Confidentialité">
            <p className={P}>
              <b className="font-medium">Ce que nous ne faisons pas</b> : pas de
              compte, pas de cookies, ni publicitaires ni de suivi. Les polices
              sont fabriquées dans votre navigateur : vos réglages et vos textes
              ne sont pas envoyés sur un serveur.
            </p>
            <p className={P}>
              <b className="font-medium">Dans votre navigateur</b> : quelques
              préférences (affichage, mode inversé) et, après un achat, votre
              clé de licence sont enregistrées localement. Elles ne quittent pas
              votre appareil.
            </p>
            <p className={P}>
              <b className="font-medium">Paiement</b> : Stripe recueille votre
              e-mail et vos informations de paiement pour traiter l&apos;achat
              (voir stripe.com/privacy). Nous recevons votre e-mail, le montant
              et la date, conservés le temps des obligations comptables (10
              ans).
            </p>
            <p className={P}>
              <b className="font-medium">Déblocage par e-mail</b> :
              l&apos;e-mail saisi dans l&apos;atelier sert uniquement à
              retrouver votre paiement chez Stripe. Il n&apos;est pas
              enregistré.
            </p>
            <p className={P}>
              <b className="font-medium">Mesure d&apos;audience</b> : Cloudflare
              Web Analytics compte les visites de façon anonyme, sans cookies et
              sans vous suivre d&apos;un site à l&apos;autre (pages vues, pays,
              type d&apos;appareil).
            </p>
            <p className={P}>
              <b className="font-medium">Hébergement</b> : Cloudflare traite des
              données techniques (adresse IP, journaux) pour servir le site et
              le protéger.
            </p>
            <p className={P}>
              <b className="font-medium">Vos droits</b> : accès, rectification,
              suppression, opposition. Écrivez à {email}. Vous pouvez aussi
              saisir la CNIL (cnil.fr).
            </p>
          </PanelSection>
        </div>

        <p className={P}>
          <Link href="/" className="underline underline-offset-2">
            Back home
          </Link>
        </p>
      </div>
    </main>
  )
}
