import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/fonderie/config"

// Consignes pour les robots des moteurs de recherche (servies en /robots.txt) : tout est visitable
export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
