// Cloudflare Pages Function : POST /api/count  { type: "trial" | "full" }
// Compte les téléchargements (essai et version complète), sans rien savoir de la personne :
// ni adresse IP, ni e-mail, juste des totaux. Avec les ventes de Stripe, ça donne le taux de conversion.
// Stockage : un espace Cloudflare KV relié au projet sous le nom STATS
// (Settings → Bindings → KV namespace). Sans lui, la fonction ne fait rien (et le site marche pareil).
// Les chiffres se lisent dans Cloudflare : Storage & databases → KV → l'espace → ses clés :
// « trial:total », « full:total », et un compte par jour (« trial:2026-10-03 »…).

type KV = {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

type Env = { STATS?: KV }

async function bump(kv: KV, key: string) {
  const n = Number((await kv.get(key)) ?? 0) || 0
  await kv.put(key, String(n + 1))
}

export async function onRequestPost({
  request,
  env,
}: {
  request: Request
  env: Env
}) {
  let type = ""
  try {
    type = String(((await request.json()) as { type?: unknown }).type ?? "")
  } catch {}
  if ((type === "trial" || type === "full") && env.STATS) {
    const day = new Date().toISOString().slice(0, 10)
    await Promise.all([
      bump(env.STATS, `${type}:total`),
      bump(env.STATS, `${type}:${day}`),
    ])
  }
  return new Response(null, { status: 204 })
}
