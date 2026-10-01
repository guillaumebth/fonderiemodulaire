// Outils bas niveau sur le fichier de police (format « sfnt », commun à .otf et .ttf).
// opentype.js sait lire le crénage mais pas l'écrire : on fabrique la table `kern` nous-mêmes
// et on l'insère dans le fichier produit.

export type KernPair = { left: number; right: number; value: number } // index des glyphes, valeur en unités

// Table `kern` classique (format 0) : lue par macOS, Windows, Figma, Word, InDesign…
export function makeKernTable(pairs: KernPair[]) {
  const sorted = [...pairs].sort((a, b) => a.left - b.left || a.right - b.right)
  const n = sorted.length
  const pow = n ? 2 ** Math.floor(Math.log2(n)) : 0
  const buf = new DataView(new ArrayBuffer(4 + 14 + n * 6))
  let o = 0
  const u16 = (v: number) => {
    buf.setUint16(o, v)
    o += 2
  }
  u16(0) // version
  u16(1) // nombre de sous-tables
  u16(0) // version de la sous-table
  u16(14 + n * 6) // longueur
  u16(0x0001) // horizontal, format 0
  u16(n)
  u16(pow * 6) // searchRange
  u16(n ? Math.floor(Math.log2(n)) : 0) // entrySelector
  u16(n * 6 - pow * 6) // rangeShift
  for (const p of sorted) {
    u16(p.left)
    u16(p.right)
    buf.setInt16(o, p.value)
    o += 2
  }
  return new Uint8Array(buf.buffer)
}

function checksum(bytes: Uint8Array) {
  const padded = new Uint8Array(Math.ceil(bytes.length / 4) * 4)
  padded.set(bytes)
  const view = new DataView(padded.buffer)
  let sum = 0
  for (let i = 0; i < padded.length; i += 4)
    sum = (sum + view.getUint32(i)) >>> 0
  return sum
}

// Ajoute (ou remplace) une table dans un fichier de police, et recalcule sommes de contrôle et décalages
export function addTable(
  font: ArrayBuffer,
  tag: string,
  data: Uint8Array
): ArrayBuffer {
  const view = new DataView(font)
  const version = view.getUint32(0)
  const count = view.getUint16(4)
  const tables = new Map<string, Uint8Array>()
  for (let i = 0; i < count; i++) {
    const rec = 12 + i * 16
    const t = String.fromCharCode(...new Uint8Array(font, rec, 4))
    const offset = view.getUint32(rec + 8)
    const length = view.getUint32(rec + 12)
    tables.set(t, new Uint8Array(font.slice(offset, offset + length)))
  }
  tables.set(tag, data)

  const tags = [...tables.keys()].sort()
  const n = tags.length
  const pow = 2 ** Math.floor(Math.log2(n))
  let size = 12 + n * 16
  for (const t of tags) size += Math.ceil(tables.get(t)!.length / 4) * 4
  const out = new Uint8Array(size)
  const ov = new DataView(out.buffer)
  ov.setUint32(0, version)
  ov.setUint16(4, n)
  ov.setUint16(6, pow * 16)
  ov.setUint16(8, Math.floor(Math.log2(n)))
  ov.setUint16(10, n * 16 - pow * 16)

  let offset = 12 + n * 16
  let headOffset = -1
  tags.forEach((t, i) => {
    const bytes = tables.get(t)!
    if (t === "head") {
      new DataView(bytes.buffer, bytes.byteOffset).setUint32(8, 0) // checkSumAdjustment remis à zéro
      headOffset = offset
    }
    const rec = 12 + i * 16
    for (let k = 0; k < 4; k++) out[rec + k] = t.charCodeAt(k)
    ov.setUint32(rec + 4, checksum(bytes))
    ov.setUint32(rec + 8, offset)
    ov.setUint32(rec + 12, bytes.length)
    out.set(bytes, offset)
    offset += Math.ceil(bytes.length / 4) * 4
  })
  if (headOffset >= 0)
    ov.setUint32(headOffset + 8, (0xb1b0afba - checksum(out)) >>> 0)
  return out.buffer
}
