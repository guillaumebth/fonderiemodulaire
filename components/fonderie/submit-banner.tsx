"use client"

import { useRef } from "react"
import Link from "next/link"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

import { playStamp } from "@/lib/fonderie/sound"
import { cn } from "@/lib/utils"

import { ACTION_COLORS, PILL } from "./pill-styles"

gsap.registerPlugin(useGSAP)

// Bandeau noir, cliquable en entier (pages Templates et Showcase) : un texte et une pastille.
// Lien interne (ex. /atelier, avec le « clac ») ou adresse externe / e-mail (mailto:).
// Sa pastille est le bouton d'action bleu : au survol du bandeau (ou au focus clavier),
// elle tremble et clignote dans les couleurs « punch », comme « Make your font » sur la home.
// Clic : le « clac » de fonderie. Rien ne bouge si le système demande de réduire les animations.
export function SubmitBanner({
  href,
  text,
  label,
}: {
  href: string
  text: string
  label: string
}) {
  const internal = href.startsWith("/")
  const root = useRef<HTMLAnchorElement>(null)
  const pill = useRef<HTMLSpanElement>(null)

  useGSAP(
    (_, contextSafe) => {
      const el = root.current
      const dot = pill.current
      if (!el || !dot || !contextSafe) return
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let shake: gsap.core.Timeline | null = null
        let flash: gsap.core.Timeline | null = null
        const start = contextSafe(() => {
          flash?.kill()
          flash = gsap.timeline({ repeat: -1 })
          ACTION_COLORS.forEach((c, i) =>
            flash!.set(dot, { backgroundColor: c }, i * 0.11)
          )
          flash.set({}, {}, ACTION_COLORS.length * 0.11)
          shake?.kill()
          shake = gsap
            .timeline({ repeat: -1 })
            .to(dot, {
              rotation: -3,
              x: -2,
              y: 1,
              duration: 0.05,
              ease: "none",
            })
            .to(dot, {
              rotation: 2.5,
              x: 2,
              y: -1,
              duration: 0.05,
              ease: "none",
            })
            .to(dot, {
              rotation: -2,
              x: -1,
              y: -1,
              duration: 0.05,
              ease: "none",
            })
            .to(dot, { rotation: 3, x: 1, y: 1, duration: 0.05, ease: "none" })
        })
        const stop = contextSafe(() => {
          flash?.kill()
          flash = null
          gsap.set(dot, { clearProps: "backgroundColor" })
          shake?.kill()
          shake = null
          gsap.to(dot, {
            rotation: 0,
            x: 0,
            y: 0,
            duration: 0.4,
            ease: "elastic.out(1, 0.4)",
          })
        })
        el.addEventListener("pointerenter", start)
        el.addEventListener("pointerleave", stop)
        el.addEventListener("focus", start)
        el.addEventListener("blur", stop)
        return () => {
          shake?.kill()
          flash?.kill()
          el.removeEventListener("pointerenter", start)
          el.removeEventListener("pointerleave", stop)
          el.removeEventListener("focus", start)
          el.removeEventListener("blur", stop)
        }
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  const className =
    "palette-black flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[2rem] py-4 pr-4 pl-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:rounded-full md:pl-8"
  const content = (
    <>
      <p className="text-sm leading-normal font-medium">{text}</p>
      <span
        ref={pill}
        className={cn(PILL, "bg-action text-action-foreground hover:bg-action")}
      >
        {label}
      </span>
    </>
  )
  return internal ? (
    <Link
      ref={root}
      href={href}
      onClick={() => playStamp()}
      className={className}
    >
      {content}
    </Link>
  ) : (
    <a ref={root} href={href} className={className}>
      {content}
    </a>
  )
}
