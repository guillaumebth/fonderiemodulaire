import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // L'ancienne page How it works est devenue une section de la page About
  async redirects() {
    return [
      // « Generator » est devenu « Atelier » : les anciens liens partagés (réglages après #) restent valables
      { source: "/generator", destination: "/atelier", permanent: true },
      {
        source: "/how-it-works",
        destination: "/about#how-it-works",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
