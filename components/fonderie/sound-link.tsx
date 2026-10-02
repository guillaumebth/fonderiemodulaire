"use client"

import Link from "next/link"

import { playStamp } from "@/lib/fonderie/sound"

// Lien qui joue le « clac » de fonderie au clic (pour les liens vers l'atelier)
export function SoundLink({
  onClick,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      onClick={(e) => {
        playStamp()
        onClick?.(e)
      }}
      {...props}
    />
  )
}
