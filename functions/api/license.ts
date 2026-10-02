// Cloudflare Pages Function : POST /api/license  { key: "cs_…" ou "e-mail" }
//   →  { valid: true, key: "cs_…" }  ou  { valid: false, error }
// Le seul morceau de serveur du site. Il ne tourne qu'au retour d'un paiement ou quand quelqu'un
// débloque la version complète, pas à chaque visite. On demande à Stripe si un paiement est bien payé,
// pour NOTRE produit, et pas remboursé. Deux façons de le désigner :
// - la « clé de licence » : l'identifiant du paiement Stripe (cs_…), donné au retour du paiement ;
// - l'e-mail utilisé pour payer (celui du reçu Stripe) : rien à garder pour l'acheteur.
//   Compromis assumé : connaître l'e-mail d'un acheteur suffit à débloquer (le verrou est de toute
//   façon contournable, le moteur étant dans le navigateur).
// Réglages à mettre dans Cloudflare (Settings → Variables and secrets) :
// - STRIPE_SECRET_KEY : clé « restreinte » Stripe en lecture (Checkout Sessions, PaymentIntents, Charges),
//   enregistrée comme SECRET (chiffrée), jamais dans le code ;
// - STRIPE_PRODUCT_ID : l'identifiant du produit (prod_…), pas secret.

type Env = {
  STRIPE_SECRET_KEY?: string
  STRIPE_PRODUCT_ID?: string
}

type Session = {
  id?: string
  status?: string
  payment_status?: string
  line_items?: { data?: { price?: { product?: string } }[] }
  payment_intent?: { latest_charge?: { refunded?: boolean } | null } | null
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

const DOWN = "Can't check right now. Try again in a moment."
const EXPAND = "expand[]=line_items&expand[]=payment_intent.latest_charge"

// Paiement valable : payé, pour notre produit, pas remboursé
const isPaid = (s: Session | null | undefined, product: string) =>
  !!s &&
  s.status === "complete" &&
  s.payment_status === "paid" &&
  !!s.line_items?.data?.some((item) => item.price?.product === product) &&
  !s.payment_intent?.latest_charge?.refunded

export async function onRequestPost({
  request,
  env,
}: {
  request: Request
  env: Env
}) {
  let key = ""
  try {
    const body = (await request.json()) as { key?: unknown }
    key = String(body.key ?? "").trim()
  } catch {}
  const secret = env.STRIPE_SECRET_KEY
  const product = env.STRIPE_PRODUCT_ID
  if (!secret || !product) return json({ valid: false, error: DOWN }, 500)
  const stripe = (path: string) =>
    fetch(`https://api.stripe.com/v1/${path}`, {
      headers: { Authorization: `Bearer ${secret}` },
    }).catch(() => null)

  // 1. Clé de licence (identifiant du paiement)
  if (/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(key)) {
    const res = await stripe(`checkout/sessions/${key}?${EXPAND}`)
    if (!res) return json({ valid: false, error: DOWN }, 502)
    if (res.status === 404)
      return json({ valid: false, error: "This key doesn't look valid." })
    if (!res.ok) return json({ valid: false, error: DOWN }, 502)
    const s = (await res.json().catch(() => null)) as Session | null
    if (!isPaid(s, product))
      return json({
        valid: false,
        error: "This key isn't a paid Fonderie modulaire license.",
      })
    return json({ valid: true, key })
  }

  // 2. E-mail du paiement : on cherche ses paiements terminés
  if (/^[^\s@]{1,100}@[^\s@]{1,100}\.[^\s@]{1,30}$/.test(key)) {
    // tel que tapé, puis en minuscules (Stripe compare l'e-mail exactement)
    for (const email of [...new Set([key, key.toLowerCase()])]) {
      const res = await stripe(
        `checkout/sessions?customer_details[email]=${encodeURIComponent(email)}` +
          `&status=complete&limit=20&expand[]=data.line_items&expand[]=data.payment_intent.latest_charge`
      )
      if (!res || !res.ok) return json({ valid: false, error: DOWN }, 502)
      const list = (await res.json().catch(() => null)) as {
        data?: Session[]
      } | null
      const paid = list?.data?.find((s) => isPaid(s, product))
      if (paid?.id) return json({ valid: true, key: paid.id })
    }
    return json({
      valid: false,
      error:
        "No purchase found with this email. Check it's the one on your receipt.",
    })
  }

  return json(
    {
      valid: false,
      error: "Enter the email you paid with, or your license key.",
    },
    400
  )
}
