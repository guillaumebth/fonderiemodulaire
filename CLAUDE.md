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
| `lib/fonderie/font-package.ts` | Contenu du zip téléchargé (`downloadFont` dans `export.ts`, avec fflate) : `LICENSE.txt` (essai : usage personnel ; complète : usage commercial, pas de revente du fichier ; en tête, LICENSE dessiné en caractères avec la grille de la police) et `README.txt` (installation, lien pour rouvrir la police dans l'atelier) |
| `components/fonderie/specimen.tsx` | Onglet « Specimen » de l'atelier : planche A4 imprimable de la police (nom, caractères, tailles, texte), en SVG vectoriel, tailles réduites automatiquement pour tenir sur une page ; « Print or save as PDF » n'imprime que la feuille (copie dans `<body>`, règle `.specimen-print` dans globals.css) |
| `hooks/use-canvas.ts` | Redessine un canvas (resize, thème, polices) — utilisé par les étapes de construction |
| `hooks/use-animated-text.ts` | Texte animé : transitions entre réglages et mode « vivant » (pas d'animation d'apparition : retirée, jugée trop chargée) (respecte « réduire les animations ») |
| `components/fonderie/` | Interface : éditeur (vues Text / Glyph / Charset, réglages Simple / Advanced), curseurs, canvas, barre de navigation |
| `hooks/use-params-history.ts` | Réglages avec Undo / Redo (⌘Z, ⇧⌘Z) |
| `lib/fonderie/share.ts` | Lien de partage : réglages + texte dans l'adresse (#…) |
| `app/page.tsx` | Home (titre animé, styles d'exemple) — le logo y ramène |
| `app/atelier/page.tsx` | L'outil, appelé « Atelier » (pas « Generator », jugé trop « outil web » : vocabulaire de l'atelier, du fait main) ; `/generator` y redirige |
| `app/templates/page.tsx` | Templates : affiches colorées qui ouvrent le générateur réglé (`lib/fonderie/templates.ts`, palettes `.palette-*` dans globals.css) | Bandeau communauté : les gens envoient leur police par e-mail (section « Submit to templates » de l'atelier, `submitHref` dans `export-panel.tsx`). Pour en ajouter une : décoder le lien reçu avec `decodeShare` (`share.ts`), recopier ses réglages dans `TEMPLATES` avec `author` (crédit « by … »).
| `app/showcase/page.tsx` | Showcase : affiches faites avec les polices (liste dans `lib/fonderie/showcase.ts` : fichier, titre, auteur). Les images déposées dans `public/showcases/` sont optimisées automatiquement avant chaque build (`scripts/optimize-showcase.mjs`, sharp → WebP ≤ 1400 px dans `public/showcases/optimized/`, dimensions dans `showcase-images.json`) |
| `app/about/page.tsx` | About : présentation, section How it works (#how-it-works), FAQ ; `/how-it-works` y redirige |
| `lib/fonderie/config.ts` | Liens du footer, `CHECKOUT_URL` (paiement Stripe de la version complète, bloc caché tant qu'il est vide) et `PRICE` (prix affiché) |
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
3. **Compléter le jeu de caractères** : ~~minuscules~~ (faites : tracés dans `glyphs.ts`, hauteur d'x et jambages réglables, voir `vMetrics()` dans `skeleton.ts`), ~~accents français~~ faits (`ACCENTED` dans `glyphs.ts` : lettre de base + petit tracé d'accent ; lignes « above » réservées au-dessus des capitales dans `vMetrics`). ~~Ponctuation~~ et ~~crénage~~ faits (crénage automatique dans `kerning.ts`, écrit dans le .otf via une table `kern` ajoutée par `sfnt.ts`, car opentype.js ne sait pas l'écrire).
4. ~~**Mode « le long du tracé »**~~ : fait (`lib/fonderie/trace.ts`, interrupteur « Construction : Grille / Le long du tracé »). Pièces à intervalles réguliers, une pièce sur chaque angle vif, option pour orienter les pièces selon le trait, rangées parallèles. Jonctions : l'extrémité qui arrive sur un trait s'arrête à son bord ; aux croisements, le dernier tracé passe dessous.
5. **Identité du site** : nom, branding, page d'accueil. La réf. `proto/refs/05-marketing-couches.png` sert d'inspiration **pour les visuels marketing** (couches de couleurs, rendu « fusion », lettres faites de lettres). Ce n'est pas une fonctionnalité de l'outil pour l'instant.

## Direction artistique (à respecter sur toutes les pages)

Brutalisme doux : la structure est visible, l'interface s'efface derrière la police de l'utilisateur.

- **Rien de décoratif** : traits fins, contours, noir et gris. Pas d'ombres, pas de dégradés, pas de cartes arrondies ni de composants shadcn « par défaut » (ombres, gris bleutés, coins de cartes). Fond `#f1f1f1`.
- **La structure se montre** : sections séparées par un filet noir de 1 px avec un petit trait vertical de 12 px à gauche (le « coin »), pastilles à contour pointillé, curseurs réduits à une ligne et un point. Composants : `components/fonderie/panel-ui.tsx` (`PanelSection`, `Pill`, `PillChoice`, `PanelSlider`, `PanelSwitch`).
- **Une seule voix typographique** : Inter, petite et medium — 10 px (mentions), 12 px (libellés, pastilles), 14 px (titres de section). Seuls la police générée et le bouton d'action sont grands.
- **Le noir comme seul accent d'état** : actif = rempli en noir, inactif = pointillés sur blanc. Pas de couleur pour « sélectionné ».
- **La couleur est rare et réservée aux moments forts** : bleu vif `#08f` du bouton d'action, couleurs « punch » (au survol du bouton, et en fond des affiches de la page Templates : `.palette-punch-1` à `5`), rouge vif (`--path`) pour le tracé des lettres dans la vue technique. Aucune autre couleur d'interface.
- **De l'humour dans les interactions, pas dans le visuel** : bouton qui tremble, logo qui défile, curseur rond en invert, interrupteur Invert. Animations avec GSAP, toujours désactivées si « réduire les animations ».
- **Des réglages, pas des thèmes** : on donne des curseurs plutôt que des styles prédéfinis (les templates ne sont que des points de départ).
- **Pas d'icônes décoratives** : chevrons bruts (assets de la maquette), texte plutôt qu'icône.

## Notes

- Une police installable n'a qu'une couleur. Les visuels multicouches se feront à part (Figma ou export image), pas dans le .otf.
- Tester les cas limites des curseurs : grille 3 × 5 avec une graisse forte, grille 12 × 15 avec une graisse faible, et les lettres à diagonales (K, M, N, V, W, X, Z, 7).
- Modèle économique : essai gratuit (A–Z + 0–9, « Trial » dans le nom, `TRIAL_CHARSET` dans `export.ts`) et version complète à **prix fixe, 5,99 €** (`PRICE`), via **Stripe** (produit `prod_VMvHSpQEm3yJUP`, Payment Link dans `CHECKOUT_URL` de `config.ts` ; bloc caché tant qu'il est vide). Après paiement, Stripe redirige vers `/atelier?session_id={CHECKOUT_SESSION_ID}` ; `functions/api/license.ts` (Cloudflare Pages Function, le seul code serveur) vérifie auprès de Stripe que ce paiement est payé, pour ce produit, non remboursé (variables Cloudflare `STRIPE_SECRET_KEY` en secret, `STRIPE_PRODUCT_ID`). L'identifiant du paiement (cs_…) sert de clé de licence, retenue dans le navigateur (`lib/fonderie/license.ts`), qui mémorise aussi la police avant le paiement. Sur un autre ordinateur, on débloque avec l'**e-mail du paiement** (la fonction cherche ses paiements dans Stripe et renvoie la clé) ou la clé. Au retour du paiement, une fenêtre (`purchase-dialog.tsx`) propose le téléchargement et la clé. En local, `?session_id=preview` (ou `preview-error`) affiche cette fenêtre sans paiement. Une clé débloque toutes les polices. Stripe n'est pas vendeur officiel : la TVA est à la charge de l'auteur. Le moteur étant dans le navigateur, le verrou est contournable : on vend la licence et le confort.
- Hébergement : **Cloudflare Pages** (gratuit, bande passante illimitée, usage commercial autorisé), pas Vercel (plan gratuit non commercial). Le site est un export statique (`output: "export"` dans `next.config.ts`, dossier `out/`) : pas de redirections Next ni d'optimisation d'images, les redirections sont dans `public/_redirects`. Cloudflare : commande de build `npm run build`, dossier `out`.
- L'interface du site est en anglais (libellés, messages, accessibilité). Le code, ses commentaires et cette doc restent en français.
- Maquette Figma de la home : https://www.figma.com/design/uIaxWJkNlPTJVDcIgQac3n/Untitled?node-id=42-75 (fond #f1f1f1, police Inter, pastilles pointillées, bouton bleu #08f « Make your font » — renommé depuis « Test now »). L'en-tête est commun à toutes les pages (`app/layout.tsx`).
- Couleurs : noir pur, gris neutres (`#f1f1f1`, `#d9d9d9`, `#c2c2c2`, `#e4e4e4`, `#8f8f8f`), bleu `#08f` réservé au bouton d'action. Police Inter. Tout est dans `app/globals.css` (voir « Direction artistique »).

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
