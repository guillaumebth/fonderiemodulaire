import type { Metadata } from "next"
import Link from "next/link"

import { TemplateGrid } from "@/components/fonderie/template-grid"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Templates — Fonderie modulaire",
  description:
    "Ready-made starting points. Open any of them in the generator and make it yours.",
}

export default function TemplatesPage() {
  return (
    <main className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 pt-7 pb-16">
      <section className="grid max-w-[62ch] gap-4">
        <h1 className="text-[32px] leading-tight font-bold text-balance">
          Templates
        </h1>
        <p>
          Ready-made starting points. Each one is a single set of settings —
          open it, change one slider, and make it yours.
        </p>
      </section>
      <TemplateGrid />
      <div>
        <Button asChild>
          <Link href="/generator">Start from scratch</Link>
        </Button>
      </div>
    </main>
  )
}
