"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

import { playStamp } from "@/lib/fonderie/sound"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

// Bloc dont le curseur devient le gros bouton d'action bleu (ex. « Open the atelier ») :
// - elle apparaît avec un rebond quand la souris entre, disparaît en rétrécissant quand elle sort ;
// - elle suit la souris avec un léger retard et penche selon la vitesse (elle « traîne ») ;
// - son fond clignote entre les couleurs « punch », comme le bouton « Make your font » de la home ;
// - un clic n'importe où dans le bloc l'écrase un instant, puis ouvre le lien.
// Seulement avec une souris. Sur écran tactile ou au clavier, c'est un vrai lien visible
// qui fait le travail (à placer à côté du bloc). Mouvements instantanés si « réduire les animations ».
export function CursorLink({
  href,
  label,
  colors = [],
  sound,
  children,
  className,
}: {
  href: string
  label: string
  // couleurs de fond qui défilent tant que la pastille est visible (valeurs CSS, ex. "var(--punch-1)")
  colors?: string[]
  // joue le « clac » de fonderie au clic
  sound?: boolean
  children: React.ReactNode
  className?: string
}) {
  const root = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const router = useRouter()

  useGSAP(
    (_, contextSafe) => {
      const el = root.current
      const dot = pill.current
      if (!el || !dot || !contextSafe) return
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
            duration: 0.4 * k,
            ease: "power3.out",
          })
          const toY = gsap.quickTo(dot, "y", {
            duration: 0.4 * k,
            ease: "power3.out",
          })
          const toR = gsap.quickTo(dot, "rotation", {
            duration: 0.5 * k,
            ease: "power3.out",
          })
          let lastX = 0
          let going = false
          // Clignotement des couleurs (effet néon), seulement si les animations sont permises
          let flash: gsap.core.Timeline | null = null
          const startFlash = () => {
            flash?.kill()
            if (reduce || !colors.length) return
            flash = gsap.timeline({ repeat: -1 })
            colors.forEach((c, i) =>
              flash!.set(dot, { backgroundColor: c }, i * 0.11)
            )
            flash.set({}, {}, colors.length * 0.11)
          }
          const stopFlash = () => {
            flash?.kill()
            flash = null
            gsap.set(dot, { clearProps: "backgroundColor" })
          }

          const pos = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            return { x: e.clientX - r.left, y: e.clientY - r.top }
          }
          const move = contextSafe((e: PointerEvent) => {
            const { x, y } = pos(e)
            toX(x)
            toY(y)
            // penche dans le sens du mouvement, plus fort si la souris va vite
            toR(gsap.utils.clamp(-14, 14, (x - lastX) * 0.9 * k))
            lastX = x
          })
          const enter = contextSafe((e: PointerEvent) => {
            const { x, y } = pos(e)
            lastX = x
            gsap.set(dot, { x, y, rotation: 0 })
            startFlash()
            gsap.to(dot, {
              scale: 1,
              autoAlpha: 1,
              duration: 0.55 * k,
              ease: "elastic.out(1, 0.55)",
              overwrite: "auto",
            })
          })
          const leave = contextSafe(() => {
            stopFlash()
            gsap.to(dot, {
              scale: 0,
              autoAlpha: 0,
              duration: 0.25 * k,
              ease: "power2.in",
              overwrite: "auto",
            })
          })
          const click = contextSafe(() => {
            if (going) return
            going = true
            if (sound) playStamp()
            gsap
              .timeline({ onComplete: () => router.push(href) })
              .to(dot, {
                scaleX: 1.25,
                scaleY: 0.75,
                duration: 0.08 * k,
                ease: "power2.out",
              })
              .to(dot, {
                scaleX: 1,
                scaleY: 1,
                duration: 0.18 * k,
                ease: "back.out(3)",
              })
          })

          el.addEventListener("pointermove", move)
          el.addEventListener("pointerenter", enter)
          el.addEventListener("pointerleave", leave)
          el.addEventListener("click", click)
          return () => {
            flash?.kill()
            el.style.cursor = ""
            el.removeEventListener("pointermove", move)
            el.removeEventListener("pointerenter", enter)
            el.removeEventListener("pointerleave", leave)
            el.removeEventListener("click", click)
          }
        }
      )
      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <div ref={root} className={cn("relative select-none", className)}>
      {children}
      <span
        ref={pill}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 z-10 rounded-full bg-action px-5 text-[32px] leading-normal font-medium tracking-normal whitespace-nowrap text-action-foreground"
      >
        {label}
      </span>
    </div>
  )
}
