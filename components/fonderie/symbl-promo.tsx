"use client"

import { useState } from "react"
import Image from "next/image"

import { SYMBL_URL } from "@/lib/fonderie/config"

import icon from "@/public/images/symbl-appicon.png"

// Encart noir en bas à droite de la home (maquette Figma « HomePage », node 65:1509) :
// mon autre outil, Symbl, pour tester son logo. La carte est un lien (nouvel onglet).
// Seulement sur ordinateur (écrans ≥ 1024 px). Il apparaît en douceur une seconde après l'arrivée :
// fondu et petite montée, sans animation si le système demande de les réduire.
// Une petite croix le ferme, le temps de la visite : il revient quand on revient sur la home.
export function SymblPromo() {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  return (
    <div
      style={{ animationFillMode: "both", animationDelay: "1s" }}
      className="fixed right-2.5 bottom-2.5 z-30 hidden h-[154px] w-[203px] animate-in duration-700 ease-out fade-in-0 slide-in-from-bottom-3 motion-reduce:animate-none lg:block print:hidden"
    >
      <a
        href={SYMBL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex size-full flex-col items-center justify-center gap-4 bg-black text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Image
          src={icon}
          alt=""
          width={47}
          height={47}
          className="size-[47px]"
        />
        <span className="w-[92px] text-center text-[10px] leading-normal">
          Test your logo now with symbl.space!
        </span>
        <span className="rounded-full bg-white px-[7px] py-[2px] text-[10px] leading-normal font-medium text-black transition-colors group-hover:bg-white/85">
          Discover
        </span>
      </a>
      {/* Croix dessinée (deux traits fins), comme le « + » des sections du panneau */}
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Hide this"
        className="group/close absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span aria-hidden="true" className="relative size-2.5">
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 rotate-45 bg-white/60 transition-colors group-hover/close:bg-white" />
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 -rotate-45 bg-white/60 transition-colors group-hover/close:bg-white" />
        </span>
      </button>
    </div>
  )
}
