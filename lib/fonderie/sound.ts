// Petits sons de l'interface, fabriqués en direct par le navigateur (Web Audio) :
// pas de fichier à charger, pas de droits. Joués seulement après un clic (règle des navigateurs).

let ctx: AudioContext | null = null

// « Clac » de fonderie : la presse frappe le métal (coup sourd + choc), puis le caractère tinte
export function playStamp() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === "suspended") void ctx.resume()
    const a = ctx
    const t = a.currentTime
    const out = a.createGain()
    out.gain.value = 0.35 // volume général, discret
    out.connect(a.destination)

    // 1. Coup sourd : une note grave qui tombe très vite
    const thump = a.createOscillator()
    thump.type = "sine"
    thump.frequency.setValueAtTime(170, t)
    thump.frequency.exponentialRampToValueAtTime(45, t + 0.12)
    const tg = a.createGain()
    tg.gain.setValueAtTime(1, t)
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    thump.connect(tg).connect(out)
    thump.start(t)
    thump.stop(t + 0.22)

    // 2. Choc : un souffle de bruit très court, filtré dans les aigus
    const len = Math.floor(a.sampleRate * 0.03)
    const buf = a.createBuffer(1, len, a.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const hit = a.createBufferSource()
    hit.buffer = buf
    const hp = a.createBiquadFilter()
    hp.type = "highpass"
    hp.frequency.value = 1800
    const hg = a.createGain()
    hg.gain.value = 0.6
    hit.connect(hp).connect(hg).connect(out)
    hit.start(t)

    // 3. Tintement métallique : quelques harmoniques « fausses » (inharmoniques), comme une cloche
    ;[1, 2.76, 5.4, 8.93].forEach((m, i) => {
      const o = a.createOscillator()
      o.type = "sine"
      o.frequency.value = 1046 * m
      const g = a.createGain()
      const start = t + 0.012
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.22 / (i + 1), start)
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.55 / (i + 1) + 0.08)
      o.connect(g).connect(out)
      o.start(t)
      o.stop(start + 0.7)
    })
  } catch {
    // pas de son disponible : tant pis, le lien marche quand même
  }
}

// Téléchargement : une poignée de petites pièces de métal qui tombent et rebondissent
// (des caractères versés dans la casse), puis un « ding » à deux notes qui monte : c'est prêt
export function playDownload() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === "suspended") void ctx.resume()
    const a = ctx
    const t = a.currentTime
    const out = a.createGain()
    out.gain.value = 0.3
    out.connect(a.destination)

    // Petit « tic » métallique : note aiguë très brève
    const tick = (at: number, freq: number, vol: number) => {
      const o = a.createOscillator()
      o.type = "triangle"
      o.frequency.setValueAtTime(freq, at)
      o.frequency.exponentialRampToValueAtTime(freq * 0.7, at + 0.04)
      const g = a.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.setValueAtTime(vol, at)
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05)
      o.connect(g).connect(out)
      o.start(at)
      o.stop(at + 0.06)
    }
    // Les pièces : de plus en plus serrées et de plus en plus faibles, comme un rebond qui s'éteint
    let at = t
    let gap = 0.07
    for (let i = 0; i < 7; i++) {
      tick(at, 2200 + Math.random() * 1600, 0.5 * (1 - i / 9))
      at += gap
      gap *= 0.78
    }

    // « Ding » : deux notes douces qui montent (do puis mi), un peu après les pièces
    ;[1046.5, 1318.5].forEach((f, i) => {
      const start = at + 0.04 + i * 0.09
      const o = a.createOscillator()
      o.type = "sine"
      o.frequency.value = f
      const g = a.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(0.35, start + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.45)
      o.connect(g).connect(out)
      o.start(start)
      o.stop(start + 0.5)
    })
  } catch {
    // pas de son disponible : le téléchargement marche quand même
  }
}
