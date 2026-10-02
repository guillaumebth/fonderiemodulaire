"use client"

import { useLayoutEffect, useRef, useState } from "react"

// Contour pointillé d'une pastille, dessiné en SVG pour pouvoir l'animer :
// au survol de la pastille, les pointillés défilent tout autour (« fourmis qui marchent »).
// Un contour CSS en pointillés ne s'anime pas : d'où ce tracé, qui épouse la forme arrondie.
// À placer DANS la pastille (classe « pill », position relative, bordure transparente).
// Style et animation : .dash-outline dans globals.css (sans animation si « réduire les animations »).
export function DashOutline() {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = ref.current?.parentElement
    if (!el) return
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className="dash-outline pointer-events-none absolute -inset-px overflow-visible"
      width={size.w}
      height={size.h}
    >
      {size.w > 0 && (
        <rect
          x={0.5}
          y={0.5}
          width={size.w - 1}
          height={size.h - 1}
          rx={(size.h - 1) / 2}
        />
      )}
    </svg>
  )
}
