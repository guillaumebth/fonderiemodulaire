import type { Metadata } from "next"

import { HowItWorks } from "@/components/fonderie/how-it-works"
import { SiteHeader } from "@/components/fonderie/site-header"

export const metadata: Metadata = {
  title: "How it works — Fonderie modulaire",
  description: "How a single path per letter becomes a whole modular font.",
}

export default function HowItWorksPage() {
  return (
    <main className="mx-auto grid max-w-[1180px] gap-10 px-5 pt-7 pb-16">
      <SiteHeader />
      <HowItWorks />
    </main>
  )
}
