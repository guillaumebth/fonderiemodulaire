import { AUTHOR_URL, CONTACT_URL, TWITTER_URL } from "@/lib/fonderie/config"

// Footer de la maquette Figma (« HomePage »), commun à toutes les pages :
// un filet noir puis une ligne en 10 px — signature, X (Twitter), Contact, copyright.
// Les adresses se renseignent dans lib/fonderie/config.ts ; sans adresse, l'intitulé reste en texte.
function FooterLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  if (!href) return <span>{children}</span>
  const external = href.startsWith("http")
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="hover:underline hover:underline-offset-2"
    >
      {children}
    </a>
  )
}

export function SiteFooter() {
  return (
    // Maquette : filet noir de 568 px avec un petit trait vertical de 12 px à gauche (un coin),
    // 8 px au-dessus du texte ; signature à gauche,
    // X / Contact / copyright alignés à droite ; 23 px sous le texte
    <footer className="mt-auto flex justify-center px-5 pt-[73px] pb-[23px] text-[10px]">
      <div className="relative flex w-full max-w-[568px] flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-foreground pt-2 pl-[10px] before:absolute before:top-0 before:left-0 before:h-3 before:w-px before:bg-foreground before:content-['']">
        <p>
          Made by <FooterLink href={AUTHOR_URL}>bguillaume.info</FooterLink>
        </p>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <FooterLink href={TWITTER_URL}>X (Twitter)</FooterLink>
          <FooterLink href={CONTACT_URL}>Contact</FooterLink>
          <p>
            © 2026 <b className="font-bold">Fonderie Modulaire</b> All rights
            reserved
          </p>
        </div>
      </div>
    </footer>
  )
}
