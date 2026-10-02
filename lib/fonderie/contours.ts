// Enregistreur de contours : reçoit les mêmes ordres que Path2D (moveTo, arc, arcTo…)
// et les transforme en contours faits de segments droits et de courbes de Bézier cubiques.
// Sert à l'export .otf et à l'export SVG.

import type { PathSink } from "./shapes"

export type Pt = { x: number; y: number }
export type Seg = { kind: "L"; p: Pt } | { kind: "C"; c1: Pt; c2: Pt; p: Pt }
export type Contour = { start: Pt; segs: Seg[] }

// ---------- Enregistreur : reçoit les mêmes ordres que Path2D, produit des contours ----------

export class ContourRecorder implements PathSink {
  contours: Contour[] = []
  private cur: Contour | null = null
  private pos: Pt = { x: 0, y: 0 }

  private finish() {
    if (this.cur && this.cur.segs.length) this.contours.push(this.cur)
    this.cur = null
  }

  moveTo(x: number, y: number) {
    this.finish()
    this.cur = { start: { x, y }, segs: [] }
    this.pos = { x, y }
  }

  lineTo(x: number, y: number) {
    if (!this.cur) return this.moveTo(x, y)
    if (Math.hypot(x - this.pos.x, y - this.pos.y) < 1e-9) return
    this.cur.segs.push({ kind: "L", p: { x, y } })
    this.pos = { x, y }
  }

  arc(cx: number, cy: number, r: number, a0: number, a1: number, ccw = false) {
    const TAU = Math.PI * 2
    const start = { x: cx + r * Math.cos(a0), y: cy + r * Math.sin(a0) }
    if (this.cur) this.lineTo(start.x, start.y)
    else this.moveTo(start.x, start.y)
    if (r <= 0) return
    let sweep = ccw ? a0 - a1 : a1 - a0
    // Tour complet, à une erreur d'arrondi près : (2π + a) − a peut valoir 2π − 0,000000000000001,
    // et le modulo ci-dessous le ramènerait à ~0 (le cercle disparaîtrait). Les navigateurs tolèrent cet écart.
    sweep = sweep >= TAU - 1e-9 ? TAU : ((sweep % TAU) + TAU) % TAU
    if (sweep < 1e-9) return
    const n = Math.ceil(sweep / (Math.PI / 2) - 1e-9)
    const step = ((ccw ? -1 : 1) * sweep) / n
    const k = (4 / 3) * Math.tan(step / 4)
    let t0 = a0
    for (let i = 0; i < n; i++) {
      const t1 = t0 + step
      const p0 = { x: cx + r * Math.cos(t0), y: cy + r * Math.sin(t0) }
      const p1 = { x: cx + r * Math.cos(t1), y: cy + r * Math.sin(t1) }
      this.cur!.segs.push({
        kind: "C",
        c1: { x: p0.x - k * r * Math.sin(t0), y: p0.y + k * r * Math.cos(t0) },
        c2: { x: p1.x + k * r * Math.sin(t1), y: p1.y - k * r * Math.cos(t1) },
        p: p1,
      })
      this.pos = p1
      t0 = t1
    }
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, r: number) {
    const p0 = this.pos
    const v1 = { x: p0.x - x1, y: p0.y - y1 }
    const v2 = { x: x2 - x1, y: y2 - y1 }
    const l1 = Math.hypot(v1.x, v1.y)
    const l2 = Math.hypot(v2.x, v2.y)
    const cross = v1.x * v2.y - v1.y * v2.x
    if (r <= 0 || !l1 || !l2 || Math.abs(cross) < 1e-9)
      return this.lineTo(x1, y1)
    const u1 = { x: v1.x / l1, y: v1.y / l1 }
    const u2 = { x: v2.x / l2, y: v2.y / l2 }
    const theta = Math.acos(
      Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y))
    )
    const d = r / Math.tan(theta / 2)
    const t1 = { x: x1 + u1.x * d, y: y1 + u1.y * d }
    const t2 = { x: x1 + u2.x * d, y: y1 + u2.y * d }
    const bis = { x: u1.x + u2.x, y: u1.y + u2.y }
    const bl = Math.hypot(bis.x, bis.y)
    const h = r / Math.sin(theta / 2)
    const c = { x: x1 + (bis.x / bl) * h, y: y1 + (bis.y / bl) * h }
    const a0 = Math.atan2(t1.y - c.y, t1.x - c.x)
    const a1 = Math.atan2(t2.y - c.y, t2.x - c.x)
    let delta = a1 - a0
    while (delta > Math.PI) delta -= Math.PI * 2
    while (delta <= -Math.PI) delta += Math.PI * 2
    this.lineTo(t1.x, t1.y)
    this.arc(c.x, c.y, r, a0, a1, delta < 0)
  }

  closePath() {
    if (!this.cur) return
    const s = this.cur.start
    this.lineTo(s.x, s.y)
    this.pos = s
    this.finish()
  }

  done() {
    this.finish()
    return this.contours
  }
}
