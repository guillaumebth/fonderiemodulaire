import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/fonderie/config"

// Plan du site pour les moteurs de recherche (servi en /sitemap.xml)
export const dynamic = "force-static"

const PAGES = ["", "/atelier", "/templates", "/showcase", "/about", "/legal"]

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({
    url: SITE_URL + path,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path === "/atelier" ? 0.9 : 0.5,
  }))
}
