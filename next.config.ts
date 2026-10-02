import type { NextConfig } from "next"

// Le site est 100 % statique : tout (dessin des lettres, .otf, images) se calcule dans le navigateur.
// « export » produit un dossier out/ de simples fichiers, hébergé gratuitement sur Cloudflare Pages.
// Les redirections (/generator → /atelier, /how-it-works → /about) sont dans public/_redirects.
const nextConfig: NextConfig = {
  output: "export",
  // pas de serveur pour retravailler les images : elles sont servies telles quelles (quelques SVG)
  images: { unoptimized: true },
}

export default nextConfig
