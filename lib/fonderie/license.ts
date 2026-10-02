// Version complète : la « clé de licence » est l'identifiant du paiement Stripe (cs_…), vérifiée par
// functions/api/license.ts, puis retenue dans le navigateur. Au retour du paiement, Stripe la met dans
// l'adresse (?session_id=…) : le déblocage est automatique. Sur un autre ordinateur, on la colle à la main.
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

// Renvoie null si la clé est bonne (et la retient), sinon le message d'erreur à afficher
export async function unlockLicense(key: string): Promise<string | null> {
  try {
    const res = await fetch("/api/license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: key.trim() }),
    })
    const data = (await res.json()) as { valid?: boolean; error?: string }
    if (!data.valid) return data.error ?? "This key doesn't look valid."
    try {
      localStorage.setItem(STORAGE_KEY, key.trim())
    } catch {}
    return null
  } catch {
    return "Can't check the key right now. Try again in a moment."
  }
}
