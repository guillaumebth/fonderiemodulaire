"use client"

import { useRef } from "react"
import Link from "next/link"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

import { playStamp } from "@/lib/fonderie/sound"

gsap.registerPlugin(useGSAP)

type ShakeLinkProps = React.ComponentProps<typeof Link> & {
  // couleurs de fond qui défilent pendant le survol (valeurs CSS, ex. "var(--punch-1)")
  colors?: string[]
  // joue le « clac » de fonderie au clic
  sound?: boolean
}

// Lien qui tremble tant qu'on le survole (petites secousses en rotation et en position),
// et fait clignoter son fond entre plusieurs couleurs vives, puis revient en place en douceur.
// Aussi au focus clavier. Rien si le système demande de réduire les animations.
export function ShakeLink({
  colors = [],
  sound,
  onClick,
  ...props
}: ShakeLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null)

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current
      if (!el || !contextSafe) return
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let shake: gsap.core.Timeline | null = null
        let flash: gsap.core.Timeline | null = null

        const start = contextSafe(() => {
          // Fond qui change de couleur d'un coup, en boucle (effet néon)
          flash?.kill()
          if (colors.length) {
            flash = gsap.timeline({ repeat: -1 })
            colors.forEach((c, i) =>
              flash!.set(el, { backgroundColor: c }, i * 0.11)
            )
            flash.set({}, {}, colors.length * 0.11)
          }
          shake?.kill()
          shake = gsap
            .timeline({ repeat: -1 })
            .to(el, { rotation: -3, x: -2, y: 1, duration: 0.05, ease: "none" })
            .to(el, {
              rotation: 2.5,
              x: 2,
              y: -1,
              duration: 0.05,
              ease: "none",
            })
            .to(el, {
              rotation: -2,
              x: -1,
              y: -1,
              duration: 0.05,
              ease: "none",
            })
            .to(el, { rotation: 3, x: 1, y: 1, duration: 0.05, ease: "none" })
        })
        const stop = contextSafe(() => {
          flash?.kill()
          flash = null
          gsap.set(el, { clearProps: "backgroundColor" })
          shake?.kill()
          shake = null
          gsap.to(el, {
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
    { scope: ref }
  )

  return (
    <Link
      ref={ref}
      onClick={(e) => {
        if (sound) playStamp()
        onClick?.(e)
      }}
      {...props}
    />
  )
}
