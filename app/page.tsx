import { HomeContent } from "@/components/fonderie/home-content"
import { SiteHeader } from "@/components/fonderie/site-header"

export default function HomePage() {
  return (
    <main className="mx-auto grid max-w-[1180px] gap-12 px-5 pt-7 pb-16">
      <SiteHeader />
      <HomeContent />
    </main>
  )
}
