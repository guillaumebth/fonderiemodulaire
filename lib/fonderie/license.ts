// Version complète : la « clé de licence » est l'identifiant du paiement Stripe (cs_…), vérifiée par
// functions/api/license.ts, puis retenue dans le navigateur. Au retour du paiement, Stripe la met dans
// l'adresse (?session_id=…) : le déblocage est automatique. Sur un autre ordinateur, on tape l'e-mail
// utilisé pour payer (le serveur retrouve le paiement et renvoie sa clé), ou on colle la clé.
// Rappel : tout le moteur tourne dans le navigateur, donc ce verrou n'est pas inviolable.
// Ce qu'on vend vraiment, c'est la licence d'usage et le confort d'un clic.

const STORAGE_KEY = "fonderie-license"
// Police en cours au moment de partir payer (réglages après #, et nom), retrouvée au retour
const PENDING_KEY = "fonderie-pending-purchase"

export function rememberFontBeforeCheckout(name: string) {
  try {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ hash: window.location.hash, name })
    )
  } catch {}
}

// Au retour du paiement : renvoie la police mémorisée (une seule fois)
export function takeFontAfterCheckout(): { hash: string; name: string } | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    localStorage.removeItem(PENDING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function savedLicense() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function forgetLicense() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

// key : clé de licence (cs_…) ou e-mail du paiement.
// Renvoie null si c'est bon (et retient la clé renvoyée par le serveur), sinon le message d'erreur
export async function unlockLicense(key: string): Promise<string | null> {
  try {
    const res = await fetch("/api/license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: key.trim() }),
    })
    const data = (await res.json()) as {
      valid?: boolean
      key?: string
      error?: string
    }
    if (!data.valid) return data.error ?? "This key doesn't look valid."
    try {
      localStorage.setItem(STORAGE_KEY, data.key ?? key.trim())
    } catch {}
    return null
  } catch {
    return "Can't check the key right now. Try again in a moment."
  }
}
