import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // L'ancienne page How it works est devenue une section de la page About
  async redirects() {
    return [
      {
        source: "/how-it-works",
        destination: "/about#how-it-works",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
