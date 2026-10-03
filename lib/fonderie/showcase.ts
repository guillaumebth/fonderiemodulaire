// Projets du Showcase : affiches et visuels faits avec des polices de l'atelier.
// Pour en ajouter un : déposer l'image (PNG, JPG) dans public/showcases/, puis ajouter une ligne ici
// avec son nom de fichier, son titre et son auteur. L'image est optimisée toute seule (WebP, taille,
// dimensions) par scripts/optimize-showcase.mjs à chaque construction du site.

import images from "./showcase-images.json"

type Entry = {
  file: string // nom du fichier dans public/showcases/ (ex. "1.png")
  title: string // affiché entre guillemets sur le site
  alt: string // description de l'image, pour les lecteurs d'écran
  author: string // crédit affiché (« by … »)
  authorUrl?: string
}

const ENTRIES: Entry[] = [
  {
    file: "1.png",
    title: "Hello Crocs",
    alt: "Poster: HELLO CROCS in big merged blue dots, with a translucent blue clog floating over the letters and small blue texts on white.",
    author: "@guillaumebth",
    authorUrl: "https://www.instagram.com/guillaumebth/",
  },
  {
    file: "2.png",
    title: "F, as in ‘fine, whatever’",
    alt: "Poster: a giant letter F made of thick white rings with a red path running through them, on a red background.",
    author: "@guillaumebth",
    authorUrl: "https://www.instagram.com/guillaumebth/",
  },
]

// Image optimisée et ses dimensions (lues dans le fichier généré par le script)
export type ShowcaseItem = Entry & { src: string; width: number; height: number }

const IMAGES = images as Record<string, { src: string; width: number; height: number }>

export const SHOWCASE: ShowcaseItem[] = ENTRIES.filter((e) => IMAGES[e.file]).map(
  (e) => ({ ...e, ...IMAGES[e.file] })
)
