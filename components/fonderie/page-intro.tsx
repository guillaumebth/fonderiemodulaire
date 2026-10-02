// En-tête des pages secondaires (direction artistique) : titre 14 px medium, texte 12 px.
// Les pages ont le même conteneur que le générateur (PAGE).
export const PAGE =
  "mx-auto grid w-full max-w-[1360px] content-start gap-10 px-5 pt-10 pb-12 md:px-10 md:pt-[71px]"

export function PageIntro({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <header className="grid max-w-[470px] gap-2">
      <h1 className="text-sm leading-normal font-medium">{title}</h1>
      <div className="grid gap-2 text-xs leading-normal">{children}</div>
    </header>
  )
}
