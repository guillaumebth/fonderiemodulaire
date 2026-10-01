"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

import chevron from "@/public/images/chevron.svg"
import circle from "@/public/images/cursor-circle.svg"

gsap.registerPlugin(useGSAP)

type ArrowCursorProps = {
  // appelé au clic (ou tap) : -1 sur la moitié gauche, +1 sur la moitié droite
  onStep: (step: -1 | 1) => void
}

// Curseur de la maquette Figma : rond gris de 94 px avec un chevron de 40 px au centre.
// À poser DANS le bloc survolé (le panneau noir) : il s'accroche à son parent.
// - il remplace le curseur et suit la souris avec un léger retard ;
// - il apparaît en grossissant, disparaît en rétrécissant ;
// - le chevron pivote quand on passe d'une moitié à l'autre (‹ à gauche, › à droite) ;
// - au clic, le rond s'écrase un peu et le chevron donne un coup dans sa direction ;
// - effet « invert » : en fusion « différence », le rond inverse ce qu'il survole (gris sur le fond
//   noir, sombre sur les lettres blanches), et le chevron reste lisible dans les deux cas.
// La flèche n'apparaît qu'avec une souris ; sur écran tactile, taper à gauche ou à droite suffit.
// Sans animation si le système demande de réduire les animations.
export function ArrowCursor({ onStep }: ArrowCursorProps) {
  const cursor = useRef<HTMLDivElement>(null)
  // Dernière version de onStep, sans relancer GSAP à chaque rendu du parent
  const step = useRef(onStep)
  useEffect(() => {
    step.current = onStep
  }, [onStep])

  useGSAP(
    (_, contextSafe) => {
      const dot = cursor.current
      const el = dot?.parentElement
      const arrow = dot?.querySelector<HTMLElement>("[data-chevron]")
      if (!dot || !el || !arrow || !contextSafe) return
      let side: -1 | 1 = 1
      const sideOf = (e: MouseEvent) => {
        const r = el.getBoundingClientRect()
        return e.clientX - r.left < r.width / 2 ? -1 : 1
      }

      const mm = gsap.matchMedia()
      mm.add(
        {
          pointer: "(hover: hover) and (pointer: fine)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { pointer, reduce } = ctx.conditions as {
            pointer: boolean
            reduce: boolean
          }
          if (!pointer) return
          el.style.cursor = "none"
          const k = reduce ? 0 : 1
          gsap.set(dot, {
            xPercent: -50,
            yPercent: -50,
            scale: 0,
            autoAlpha: 0,
          })
          const toX = gsap.quickTo(dot, "x", {
            duration: 0.45 * k,
            ease: "power3.out",
          })
          const toY = gsap.quickTo(dot, "y", {
            duration: 0.45 * k,
            ease: "power3.out",
          })

          const move = contextSafe((e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            toX(e.clientX - r.left)
            toY(e.clientY - r.top)
            const s = sideOf(e)
            if (s !== side) {
              side = s
              gsap.to(arrow, {
                rotation: s < 0 ? 180 : 0,
                duration: 0.6 * k,
                ease: "back.inOut(2)",
              })
            }
          })
          const enter = contextSafe((e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            side = sideOf(e)
            gsap.set(dot, { x: e.clientX - r.left, y: e.clientY - r.top })
            gsap.set(arrow, { rotation: side < 0 ? 180 : 0 })
            gsap.to(dot, {
              scale: 1,
              autoAlpha: 1,
              duration: 0.5 * k,
              ease: "elastic.out(1, 0.6)",
              overwrite: "auto",
            })
          })
          const leave = contextSafe(() => {
            gsap.to(dot, {
              scale: 0,
              autoAlpha: 0,
              duration: 0.25 * k,
              ease: "power2.in",
              overwrite: "auto",
            })
          })
          const press = contextSafe(() => {
            gsap
              .timeline({ defaults: { overwrite: "auto" } })
              .to(dot, { scale: 0.82, duration: 0.08 * k, ease: "power2.out" })
              .to(dot, {
                scale: 1,
                duration: 0.5 * k,
                ease: "elastic.out(1.2, 0.4)",
              })
            // coup de chevron dans sa direction (il est tourné de 180° à gauche : x local = vers l'avant)
            gsap.fromTo(
              arrow,
              { x: 0 },
              {
                x: 8,
                duration: 0.12 * k,
                ease: "power2.out",
                yoyo: true,
                repeat: 1,
              }
            )
          })

          el.addEventListener("pointermove", move)
          el.addEventListener("pointerenter", enter)
          el.addEventListener("pointerleave", leave)
          el.addEventListener("click", press)
          return () => {
            el.style.cursor = ""
            el.removeEventListener("pointermove", move)
            el.removeEventListener("pointerenter", enter)
            el.removeEventListener("pointerleave", leave)
            el.removeEventListener("click", press)
          }
        }
      )

      // Clic (ou tap sur mobile) : moitié gauche = police précédente, moitié droite = suivante
      const click = (e: MouseEvent) => step.current(sideOf(e))
      el.addEventListener("click", click)
      return () => {
        mm.revert()
        el.removeEventListener("click", click)
      }
    },
    { scope: cursor }
  )

  return (
    <div
      ref={cursor}
      aria-hidden="true"
      className="pointer-events-none invisible absolute top-0 left-0 z-10 size-[94px] mix-blend-difference"
    >
      <Image
        src={circle}
        alt=""
        width={94}
        height={94}
        className="absolute inset-0"
        priority
      />
      <div
        data-chevron
        className="absolute inset-0 flex items-center justify-center"
      >
        <Image src={chevron} alt="" width={40} height={40} />
      </div>
    </div>
  )
}
