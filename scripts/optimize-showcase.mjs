// Optimise les images du Showcase avant chaque construction du site (npm run build / npm run dev) :
// chaque image de public/showcases/ (PNG, JPG, WebP) devient un WebP léger, réduit à 1400 px de large au plus,
// rangé dans public/showcases/optimized/. Ses dimensions sont notées dans lib/fonderie/showcase-images.json :
// pas besoin de les saisir à la main. Une image déjà optimisée (et pas modifiée depuis) n'est pas refaite.

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import sharp from "sharp"

const SRC = "public/showcases"
const OUT = path.join(SRC, "optimized")
const MANIFEST = "lib/fonderie/showcase-images.json"
const MAX_WIDTH = 1400

mkdirSync(OUT, { recursive: true })
const manifest = {}

for (const file of readdirSync(SRC).sort()) {
  if (!/\.(png|jpe?g|webp)$/i.test(file)) continue
  const input = path.join(SRC, file)
  const name = file.replace(/\.[^.]+$/, "")
  const output = path.join(OUT, `${name}.webp`)
  // refaire seulement si l'image a changé
  if (!existsSync(output) || statSync(output).mtimeMs < statSync(input).mtimeMs) {
    await sharp(input)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(output)
  }
  const { width, height } = await sharp(output).metadata()
  manifest[file] = { src: `/showcases/optimized/${name}.webp`, width, height }
  const before = statSync(input).size
  const after = statSync(output).size
  console.log(`showcase: ${file} ${Math.round(before / 1024)} Ko → ${name}.webp ${Math.round(after / 1024)} Ko (${width}×${height})`)
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n")
