import { FontEditor } from "@/components/fonderie/font-editor"

export default function Page() {
  return (
    <main className="mx-auto grid max-w-[1180px] gap-7 px-5 pt-7 pb-12">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-bold tracking-[0.02em]">Fonderie modulaire</h1>
        <p className="max-w-[62ch] text-pretty text-muted-foreground">
          Chaque lettre est un tracé posé sur une grille. Tu règles la grille, l&apos;épaisseur et la forme des pièces, et tout l&apos;alphabet se recalcule.
        </p>
      </header>
      <FontEditor />
    </main>
  )
}
