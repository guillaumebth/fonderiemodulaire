// Cloudflare Pages Function : POST /api/license  { key: "cs_…" }  →  { valid: true } ou { valid: false, error }
// Le seul morceau de serveur du site. Il ne tourne qu'au retour d'un paiement (ou quand quelqu'un colle
// sa clé), pas à chaque visite. La « clé de licence » est l'identifiant du paiement Stripe (cs_…) :
// on demande à Stripe si ce paiement est bien payé, pour NOTRE produit, et pas remboursé.
// Réglages à mettre dans Cloudflare (Settings → Variables and secrets) :
// - STRIPE_SECRET_KEY : clé secrète Stripe (de préférence une clé « restreinte » en lecture seule),
//   à enregistrer comme SECRET (chiffrée), jamais dans le code ;
// - STRIPE_PRODUCT_ID : l'identifiant du produit (prod_…), pas secret.

type Env = {
  STRIPE_SECRET_KEY?: string
  STRIPE_PRODUCT_ID?: string
}

type Session = {
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
  // Forme d'un identifiant de paiement Stripe : on ne transmet rien d'autre à Stripe
  if (!/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(key))
    return json({ valid: false, error: "This key doesn't look valid." }, 400)
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRODUCT_ID)
    return json({ valid: false, error: "Can't check the key right now." }, 500)

  const url =
    `https://api.stripe.com/v1/checkout/sessions/${key}` +
    "?expand[]=line_items&expand[]=payment_intent.latest_charge"
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  }).catch(() => null)
  if (!res) return json({ valid: false, error: "Can't check the key right now." }, 502)
  if (res.status === 404)
    return json({ valid: false, error: "This key doesn't look valid." })
  if (!res.ok) return json({ valid: false, error: "Can't check the key right now." }, 502)
  const s = (await res.json().catch(() => null)) as Session | null

  const paid = s?.status === "complete" && s.payment_status === "paid"
  const ours = !!s?.line_items?.data?.some(
    (item) => item.price?.product === env.STRIPE_PRODUCT_ID
  )
  const refunded = !!s?.payment_intent?.latest_charge?.refunded
  if (!paid || !ours || refunded)
    return json({ valid: false, error: "This key isn't a paid Fonderie modulaire license." })

  return json({ valid: true })
}
