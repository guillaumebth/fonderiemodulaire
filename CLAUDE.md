# Projet : Fonderie modulaire

Site web où chacun peut créer sa propre police modulaire avec des curseurs, puis la télécharger. L'idée est proche de Metaflop (metaflop.com/modulator), mais avec un concept et une identité propres.

## Le concept

Chaque lettre est décrite **une seule fois**, sous forme de tracé (squelette) : quelques lignes et quelques angles, en coordonnées de 0 à 1. Le code :

1. pose ce tracé sur une grille dont la taille se règle avec des curseurs (colonnes × lignes) ;
2. remplit chaque case que le trait touche, selon la graisse ;
3. met une **pièce** (une forme : rond, vis, étoile…) dans chaque case remplie.

Changer la grille, la graisse ou la forme recalcule tout l'alphabet. Aucune lettre n'est redessinée à la main.

## Où est quoi

`proto/prototype.html` est la démo validée d'origine (un seul fichier HTML + canvas). Elle a été portée telle quelle dans le projet Next.js, et sert de référence. Les images de référence sont dans `proto/refs/`.

| Fichier | Rôle |
|---|---|
| `lib/fonderie/glyphs.ts` | Tracés des lettres (`GLYPHS`) |
| `lib/fonderie/params.ts` | Tous les réglages (`Params`, `DEFAULT_PARAMS`, liste des formes) |
| `lib/fonderie/skeleton.ts` | `skeleton()` et `bitmap()` : du tracé à la grille |
| `lib/fonderie/shapes.ts` | `shape()` : dessin des pièces (via `PathSink`, réutilisable pour l'export .otf) |
| `lib/fonderie/render.ts` | `layoutText()` calcule la liste des pièces du texte (avec une clé stable par pièce, pour animer), `drawText()` les dessine ; `forEachPiece()` partagé avec l'export |
| `lib/fonderie/trace.ts` | Mode « le long du tracé » : positions des pièces sur le trait |
| `lib/fonderie/grid.ts` | Bords des colonnes et lignes (variation organique) |
| `lib/fonderie/kerning.ts` | Crénage automatique, à partir des cases vides face à face |
| `lib/fonderie/sfnt.ts` | Ajout de la table `kern` dans le fichier .otf |
| `lib/fonderie/export.ts` | Export .otf (opentype.js) : arcs → Bézier, orientation des trous, coordonnées entières |
| `hooks/use-canvas.ts` | Redessine un canvas (resize, thème, polices) — utilisé par les étapes de construction |
| `hooks/use-animated-text.ts` | Texte animé : transitions entre réglages, broderie à l'arrivée, mode « vivant » (respecte « réduire les animations ») |
| `components/fonderie/` | Interface : éditeur (vues Text / Glyph / Charset, réglages Simple / Advanced), curseurs, canvas, barre de navigation |
| `hooks/use-params-history.ts` | Réglages avec Undo / Redo (⌘Z, ⇧⌘Z) |
| `lib/fonderie/share.ts` | Lien de partage : réglages + texte dans l'adresse (#…) |
| `app/page.tsx` | Home (titre animé, styles d'exemple) — le logo y ramène |
| `app/generator/page.tsx` | L'outil |
| `app/how-it-works/page.tsx` | Explication des deux modes, étape par étape |
| `app/about/page.tsx` | Page About + FAQ |
| `lib/fonderie/presets.ts` | Styles d'exemple de la home (LED, Stitch, Melt…) et réglages du titre |

Tout le moteur reçoit les réglages en paramètre (`P: Params`) : plus de variable globale.

### Le moteur

- **`GLYPHS`** : les tracés des lettres A–Z, des chiffres 0–9 et de `. ! : - ?`. Format : `{ w: largeurRelative, s: [tracé, tracé, …] }`. Un tracé est une liste de points `[x, y]`, et `[x, y, 1]` signifie un angle vif qui n'est pas arrondi. Un tracé dont le premier et le dernier point sont identiques est fermé (par exemple `O_`). Un tracé d'un seul point fait un point.
- **`skeleton(c)`** : convertit le tracé en coordonnées de grille. Les points sont arrondis au centre des cases, puis les angles non vifs sont arrondis selon `P.rnd`, par des courbes de Bézier quadratiques.
- **`bitmap(c)`** : pour chaque case, calcule la distance au tracé. Si elle est `≤ graisse`, la case est pleine (1). Si elle est `≤ graisse + petits points`, on obtient un petit point (0,55). Sinon, la case est vide. Le résultat est mis en cache.
- **`shape(path, kind, …)`** : dessine les pièces `rond`, `carre`, `anneau`, `vis`, `croix`, `carrevide` et `cible`. `melange` tire au hasard de façon déterministe parmi rond, anneau, vis et cible. Les trous sont faits avec le remplissage **evenodd**.
- **Rendu** : plein, ou contour (trait épais, puis remplissage avec la couleur du fond par-dessus). Il y a aussi la largeur des cases, l'inclinaison, l'écart entre les pièces, et un affichage de la grille et du tracé.
- **Curseurs** : colonnes de 3 à 12, lignes de 5 à 15, graisse, rondeur, petits points d'angle, écart, épaisseur des formes, arrondi des carrés, largeur, inclinaison, épaisseur du contour.

### Choix déjà faits (à respecter)

- Abandonné : le losange, l'étoile, le style « pièces » (carrés et quarts de rond posés à la main), les empattements (le rendu n'était pas bon), l'ombre portée et les styles prédéfinis (jugés inutiles).
- La grille se règle **avec des curseurs**, pas avec des choix fixes. C'est pour ça que les lettres sont des tracés et pas des bitmaps.
- Les formes viennent des références dans `proto/refs/` (01 à 03 : vis, anneaux, croix, carrés vides, petites formes dans les angles ; 04 : étoiles).

## Feuille de route

1. ~~**Export .otf**~~ : fait, dans `lib/fonderie/export.ts` (bouton « Télécharger » du panneau). Reste à vérifier dans Figma / Word / FontDrop. Utiliser opentype.js dans le navigateur. Chaque glyphe est l'union des pièces de ses cases, converties en contours. Les arcs deviennent des Bézier cubiques, et les trous (anneau, vis…) doivent être des contours tournant dans le sens inverse, car OpenType utilise le remplissage nonzero, pas evenodd. Il faut aussi régler l'avance (largeur) et l'espace, et donner un nom à la police. Vérifier le fichier dans Figma, Word ou FontDrop.
2. ~~**Transformer en vrai projet**~~ : fait, en Next.js (voir « Où est quoi »). Tout reste côté client, sans serveur.
3. **Compléter le jeu de caractères** : ~~minuscules~~ (faites : tracés dans `glyphs.ts`, hauteur d'x et jambages réglables, voir `vMetrics()` dans `skeleton.ts`), accents français (É È Ê À Ç…). ~~Ponctuation~~ et ~~crénage~~ faits (crénage automatique dans `kerning.ts`, écrit dans le .otf via une table `kern` ajoutée par `sfnt.ts`, car opentype.js ne sait pas l'écrire).
4. ~~**Mode « le long du tracé »**~~ : fait (`lib/fonderie/trace.ts`, interrupteur « Construction : Grille / Le long du tracé »). Pièces à intervalles réguliers, une pièce sur chaque angle vif, option pour orienter les pièces selon le trait, rangées parallèles. Jonctions : l'extrémité qui arrive sur un trait s'arrête à son bord ; aux croisements, le dernier tracé passe dessous.
5. **Identité du site** : nom, branding, page d'accueil. La réf. `proto/refs/05-marketing-couches.png` sert d'inspiration **pour les visuels marketing** (couches de couleurs, rendu « fusion », lettres faites de lettres). Ce n'est pas une fonctionnalité de l'outil pour l'instant.

## Notes

- Une police installable n'a qu'une couleur. Les visuels multicouches se feront à part (Figma ou export image), pas dans le .otf.
- Tester les cas limites des curseurs : grille 3 × 5 avec une graisse forte, grille 12 × 15 avec une graisse faible, et les lettres à diagonales (K, M, N, V, W, X, Z, 7).
- L'interface du site est en anglais (libellés, messages, accessibilité). Le code, ses commentaires et cette doc restent en français.
- Identité visuelle reprise du proto : fond vert-gris, encre presque noire, accent bleu (`--brand`), polices Familjen Grotesk + JetBrains Mono. Tout est dans `app/globals.css`.

---

# CLAUDE.md — Stack frontend 2025

## À lire en premier

Ce fichier est un **CLAUDE.md** : il doit être placé à la racine de chaque projet pour que Claude le lise automatiquement au démarrage et adapte son comportement.

La personne qui travaille sur ce projet est **designer, pas développeur**. Elle a une excellente sensibilité visuelle et produit des interfaces soignées, mais elle n'est pas à l'aise avec les concepts backend, les erreurs de compilation cryptiques ou les architectures complexes.

En tant qu'assistant sur ces projets, Claude doit :
- Favoriser des explications claires et visuelles plutôt que techniques
- Ne jamais supposer de connaissances en backend, base de données ou DevOps
- Toujours expliquer le *pourquoi* d'un choix, pas seulement le *comment*
- Proposer des solutions simples avant des solutions optimales mais complexes
- Signaler clairement quand quelque chose sort du scope frontend pur

---

## Stack de référence

| Outil | Version | Rôle |
|---|---|---|
| Next.js | 16 (latest) | Framework |
| React | 19 | UI |
| Tailwind CSS | v4 | Styles |
| shadcn/ui | latest (preset Nova) | Composants + icônes Lucide + font Geist |
| TypeScript | 5+ | Typage |
| react-hook-form + Zod | latest | Formulaires |
| lucide-react | latest | Icônes |
| next-themes | latest | Dark mode |
| Sonner | latest | Toasts |

---

## Initialiser un projet

Une seule commande, sans interaction, sans questions :

```bash
npx shadcn@latest init -t next --no-monorepo -b radix -p nova -n nom-du-projet -y
```

Remplacer `nom-du-projet` par le nom voulu (ex: `my-app`).

Ce que fait cette commande :
- Crée le projet Next.js avec TypeScript
- Installe Tailwind v4
- Configure shadcn avec le preset **Nova** (Lucide + Geist)
- Pas de monorepo, pas de questions interactives

Ensuite, installer les dépendances complémentaires :

```bash
npm install next-themes sonner react-hook-form @hookform/resolvers zod
```

Node.js **20.9+** requis.

---

## Configuration post-installation

### 1. Changer l'attribut du dark mode

Dans `components/theme-provider.tsx`, remplacer `attribute="class"` par `attribute="data-theme"` :

```tsx
<NextThemesProvider
  attribute="data-theme"
  defaultTheme="system"
  enableSystem
  ...
>
```

### 2. Mettre à jour globals.css

Remplacer la ligne `@custom-variant dark` et le sélecteur `.dark` :

```css
/* Remplacer */
@custom-variant dark (&:is(.dark *));
.dark { ... }

/* Par */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
[data-theme=dark] { ... }
```

### 3. Ajouter Sonner dans layout.tsx

```tsx
import { Toaster } from "sonner"

// Dans le JSX :
<ThemeProvider>
  {children}
  <Toaster />
</ThemeProvider>
```

### 4. Créer la structure de dossiers

```bash
mkdir -p hooks stores
```

---

## Composants : Server vs Client

Next.js rend les composants côté serveur par défaut. Pour un projet front, la règle est simple :

- **Pas d'interactivité** (affichage pur, layout, texte) → laisser en Server Component, ne rien ajouter
- **Interactivité** (état, événements, hooks) → ajouter `"use client"` en haut du fichier

```tsx
// ✅ Server Component — pas de directive, affichage simple
export default function Hero() {
  return <h1 className="text-4xl font-bold">Bonjour</h1>
}

// ✅ Client Component — interactivité nécessaire
"use client"
import { useState } from "react"

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

> **À noter** : pour un projet principalement front sans base de données, la plupart des composants seront `"use client"`. C'est tout à fait normal.

---

## React 19 — ce qui change

**Plus de `forwardRef`** — `ref` est maintenant une prop normale :
```tsx
function Input({ ref, ...props }: React.ComponentProps<"input">) {
  return <input ref={ref} {...props} />
}
```

**`useOptimistic`** — mettre à jour l'UI avant la confirmation :
```tsx
const [optimisticItems, addOptimistic] = useOptimistic(items)
```

**`use()`** — lire un Context dans n'importe quel composant :
```tsx
const theme = use(ThemeContext)
```

**React Compiler intégré dans Next.js 16** — ne pas écrire `useMemo` / `useCallback` manuellement, c'est géré automatiquement.

---

## Tailwind CSS v4

**Pas de `tailwind.config.ts`** — tout se configure dans `globals.css` :

```css
@import "tailwindcss";
@import "tw-animate-css";

/* Thème personnalisé */
@theme inline {
  --color-brand: oklch(0.7 0.15 200);
  --font-sans: "Inter", sans-serif;
  --radius-md: 0.5rem;
}

/* Couleurs sémantiques shadcn */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}

[data-theme=dark] {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}

/* Dark mode sans erreur d'hydratation */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

Les variables `@theme` génèrent automatiquement les classes utilitaires : `bg-brand`, `text-brand`, etc.

**Nouveautés v4 à connaître :**
- `size-*` à la place de `w-* h-*` quand les deux dimensions sont identiques (`size-4` = `w-4 h-4`)
- Couleurs en **OKLCH** (nouveau standard shadcn/ui)
- `tailwindcss-animate` est déprécié → utiliser `tw-animate-css`

---

## shadcn/ui

Les composants sont **copiés dans votre projet** (`/components/ui/`), pas une dépendance npm — ils sont modifiables librement.

```bash
npx shadcn@latest add button card dialog form input sheet
```

Points importants :
- Preset par défaut : **Nova** (Lucide + Geist)
- **Toast** : le composant `toast` de shadcn est déprécié → utiliser **Sonner**
- **Dark mode** : via `next-themes` avec l'attribut `data-theme` (pas les classes CSS)

---

## Structure de projet

```
app/
├── layout.tsx
├── globals.css
└── (pages)/
components/
├── ui/                # Composants shadcn (auto-générés, ne pas modifier)
└── [feature]/         # Tes composants custom
hooks/                 # Custom hooks
lib/
└── utils.ts           # cn() et helpers
```

---

## État global

Utiliser `useState` local par défaut. Si l'état doit être partagé entre plusieurs composants éloignés, utiliser le **Context API** de React :

```tsx
"use client"
import { createContext, useContext, useState } from "react"

const UIContext = createContext<{ sidebarOpen: boolean; toggleSidebar: () => void } | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <UIContext.Provider value={{ sidebarOpen, toggleSidebar: () => setSidebarOpen(o => !o) }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error("useUI must be used within UIProvider")
  return ctx
}
```

---

## Formulaires — react-hook-form + Zod + shadcn

```tsx
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const schema = z.object({
  email: z.string().email("Email invalide"),
})

export function ContactForm() {
  const form = useForm({ resolver: zodResolver(schema) })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(console.log)} className="space-y-4">
        <FormField name="email" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input placeholder="toi@exemple.fr" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit">Envoyer</Button>
      </form>
    </Form>
  )
}
```

---

## Bonnes pratiques

- Images : toujours `next/image` — jamais `<img>`
- Liens : toujours `next/link` — jamais `<a>` pour la navigation interne
- TypeScript strict — pas de `any`
- Ne jamais écrire `useMemo` / `useCallback` (React Compiler le fait)
- Les composants shadcn dans `/ui/` ne se modifient pas — créer un wrapper dans `/components/[feature]/`
- Toute la config de couleurs/thème dans `globals.css`, nulle part ailleurs
- Toujours `suppressHydrationWarning` sur la balise `<html>` quand on utilise next-themes
