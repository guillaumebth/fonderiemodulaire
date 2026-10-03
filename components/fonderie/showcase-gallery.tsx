"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog } from "radix-ui"

import type { ShowcaseItem } from "@/lib/fonderie/showcase"

import { ArrowCursor } from "./arrow-cursor"

// Grille des affiches + galerie plein écran.
// Clic sur une affiche : elle s'ouvre en grand sur fond sombre. On passe à la suivante comme dans le
// panneau de la home : curseur rond à flèche, clic (ou tap) à gauche = précédente, à droite = suivante ;
// au clavier ← →, Échap pour fermer. Titre, auteur et position (1 / 2) en bas.
export function ShowcaseGallery({ items }: { items: ShowcaseItem[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const go = (step: number) =>
    setOpen((i) => (i === null ? i : (i + step + items.length) % items.length))
  const item = open === null ? null : items[open]

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it, i) => (
          <li key={it.file} className="grid content-start gap-2">
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open “${it.title}” by ${it.author}`}
              className="block outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Image
                src={it.src}
                width={it.width}
                height={it.height}
                alt={it.alt}
                className="block h-auto w-full"
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              />
            </button>
            <p className="text-xs leading-normal font-medium">
              “{it.title}”
              <br />
              <span className="text-[10px] text-muted-foreground">
                by{" "}
                {it.authorUrl ? (
                  <a
                    href={it.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:underline hover:underline-offset-2"
                  >
                    {it.author}
                  </a>
                ) : (
                  <span className="text-foreground">{it.author}</span>
                )}
              </span>
            </p>
          </li>
        ))}
      </ul>

      <Dialog.Root
        open={open !== null}
        onOpenChange={(o) => !o && setOpen(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
          <Dialog.Content
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(1)
              else if (e.key === "ArrowLeft") go(-1)
            }}
            className="fixed inset-0 z-50 flex flex-col text-white outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none"
          >
            {item && (
              <>
                <div
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setOpen(null)
                  }}
                  className="flex items-baseline justify-between px-5 pt-5 text-xs leading-normal font-medium md:px-8"
                >
                  <Dialog.Title className="tabular-nums">
                    {open! + 1} / {items.length}
                  </Dialog.Title>
                  <Dialog.Close className="outline-none hover:underline hover:underline-offset-2 focus-visible:ring-3 focus-visible:ring-ring/50">
                    Close
                  </Dialog.Close>
                </div>
                {/* Zone de l'affiche. Clic en dehors de l'affiche : on ferme la galerie.
                    Sur l'affiche, le curseur rond à flèche : moitié gauche = précédente, droite = suivante. */}
                <div
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setOpen(null)
                  }}
                  className="flex min-h-0 flex-1 items-center justify-center p-8 select-none md:p-16"
                >
                  <div className="relative h-[85%] max-w-full cursor-pointer">
                    <Image
                      key={item.src}
                      src={item.src}
                      width={item.width}
                      height={item.height}
                      alt={item.alt}
                      className="block h-full w-auto max-w-full animate-in object-contain fade-in-0 zoom-in-95 motion-reduce:animate-none"
                      sizes="100vw"
                      priority
                    />
                    <ArrowCursor onStep={go} />
                  </div>
                </div>
                <Dialog.Description className="px-5 pb-5 text-center text-xs leading-normal font-medium md:px-8">
                  “{item.title}”{" "}
                  <span className="text-white/60">by {item.author}</span>
                </Dialog.Description>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
