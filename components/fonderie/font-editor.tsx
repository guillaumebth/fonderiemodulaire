"use client"

import { useEffect, useRef, useState } from "react"

import Image from "next/image"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useParamsHistory } from "@/hooks/use-params-history"
import { ACCENTED_CHARS, CHARSET } from "@/lib/fonderie/glyphs"
import {
  DEFAULT_PARAMS,
  randomParams,
  SHAPES,
  USES_RADIUS,
  USES_ROTATION,
  USES_THICKNESS,
  type Layout,
  type Params,
  type RenderMode,
  type ShapeKind,
} from "@/lib/fonderie/params"
import { layoutText, readColors } from "@/lib/fonderie/render"
import { decodeShare, encodeShare } from "@/lib/fonderie/share"
import { cn } from "@/lib/utils"
import chevron from "@/public/images/chevron-24.svg"

import { DashOutline } from "./dash-outline"
import { ExportPanel, type ImageLook } from "./export-panel"
import { TextCanvas } from "./font-canvas"
import {
  PanelSection,
  PanelSlider,
  PanelSwitch,
  PieceContext,
  Pill,
  PILL,
  PillChoice,
} from "./panel-ui"

const DEFAULT_TEXT = "Fonderie\nmodulaire 26"
const pct = (v: number) => Math.round(v * 100) + "%"
const cells = (v: number) => v.toFixed(2) + " cell"
// Une ligne par famille : capitales, minuscules, chiffres et ponctuation
const ALPHABET = [
  CHARSET.filter((c) => /[A-Z]/.test(c)),
  CHARSET.filter((c) => /[a-z]/.test(c)),
  ACCENTED_CHARS,
  CHARSET.filter((c) => !/[A-Za-z]/.test(c) && !ACCENTED_CHARS.includes(c)),
]
  .map((g) => g.join(" "))
  .join("\n")
// Cascade de tailles dans la vue Text (hauteur des capitales en px), comme le « Typewriter » de Metaflop
const WATERFALL = [16, 28, 48]
const ADVANCED_KEY = "fonderie:advanced"
// Hauteur des capitales de l'aperçu selon la largeur : [< 420 px, < 640 px, au-delà]
const PREVIEW_SIZES: [number, number, number] = [44, 56, 72]
// Sélecteur de lettre de la vue Glyph
const GLYPH_OPTIONS = CHARSET.map((c) => ({ id: c, label: c }))
// Onglets Text / Glyph / Charset en pastilles (charte du menu et du panneau) : actif en noir
const TAB_LIST = "h-auto gap-1 rounded-none bg-transparent p-0"
const TAB = cn(
  PILL,
  "h-auto flex-none text-foreground shadow-none after:hidden hover:text-foreground data-[state=active]:bg-foreground data-[state=active]:text-background data-active:bg-foreground data-active:text-background group-data-[variant=default]/tabs-list:data-active:shadow-none dark:data-active:bg-foreground"
)

// Undo / Redo : chevrons de la maquette (‹ ›) avec info-bulle et raccourci
function HistoryButton({
  label,
  shortcut,
  disabled,
  onClick,
  flip,
}: {
  label: string
  shortcut: string
  disabled: boolean
  onClick: () => void
  flip?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30"
        >
          <Image
            src={chevron}
            alt=""
            width={24}
            height={24}
            className={cn(flip && "rotate-180")}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <kbd className="ml-1 opacity-70">{shortcut}</kbd>
      </TooltipContent>
    </Tooltip>
  )
}

export function FontEditor() {
  const history = useParamsHistory(DEFAULT_PARAMS)
  const { params: P, set, replace } = history
  const [text, setText] = useState(DEFAULT_TEXT)
  const [alive, setAlive] = useState(false) // la variation organique ondule en boucle
  const [advanced, setAdvanced] = useState(false) // tous les réglages, ou seulement l'essentiel
  const [glyph, setGlyph] = useState("R") // lettre affichée dans la vue Glyph
  const skipUrlWrite = useRef(true)
  const previewRef = useRef<HTMLDivElement>(null) // aperçu du texte (pour l'export image)
  // Rendu de l'export image ; « Blueprint » s'affiche aussi en direct dans les aperçus.
  // C'est une vue : les réglages de la police (et le .otf) ne changent pas.
  const [look, setLook] = useState<ImageLook>("shown")
  const PI: Params =
    look === "blueprint"
      ? { ...P, grid: true, mode: "contour", str: Math.min(P.str, 0.06) }
      : P

  // Au chargement : réglages et texte depuis l'adresse (lien partagé, ou style choisi sur la home),
  // et préférence Simple / Advanced
  useEffect(() => {
    // (un simple #download, venu du bouton « Trial ↓ » du menu, n'est pas un lien de réglages)
    if (window.location.hash.includes("=")) {
      const shared = decodeShare(window.location.hash)
      replace(shared.params, false)
      if (shared.text !== null) setText(shared.text)
    }
    try {
      setAdvanced(localStorage.getItem(ADVANCED_KEY) === "1")
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // L'adresse suit les réglages : elle est toujours prête à être partagée
  useEffect(() => {
    if (skipUrlWrite.current) {
      skipUrlWrite.current = false
      return
    }
    const id = setTimeout(() => {
      const q = encodeShare(P, text, DEFAULT_TEXT)
      window.history.replaceState(
        null,
        "",
        q ? `#${q}` : window.location.pathname
      )
    }, 300)
    return () => clearTimeout(id)
  }, [P, text])

  // Export image de l'aperçu : même largeur et même taille que l'écran, donc même mise en page
  async function exportImage(format: "svg" | "png") {
    const W = previewRef.current?.clientWidth || 800
    const capH =
      W < 420 ? PREVIEW_SIZES[0] : W < 640 ? PREVIEW_SIZES[1] : PREVIEW_SIZES[2]
    const L = layoutText(W, text || " ", capH, P.leading, PI)
    const col = readColors()
    const { layoutToSvg, layoutToPng, downloadBlob } =
      await import("@/lib/fonderie/image-export")
    const blob =
      format === "svg"
        ? new Blob([layoutToSvg(L, PI, col)], { type: "image/svg+xml" })
        : await layoutToPng(L, PI, col)
    downloadBlob(
      blob,
      `fonderie-modulaire${look === "blueprint" ? "-blueprint" : ""}.${format}`
    )
  }

  function toggleAdvanced(on: boolean) {
    setAdvanced(on)
    try {
      localStorage.setItem(ADVANCED_KEY, on ? "1" : "0")
    } catch {}
  }

  return (
    <>
      <section className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_350px] lg:gap-12">
        {/* ---------- Aperçu : trois vues ---------- */}
        <Tabs defaultValue="text" className="min-w-0 gap-10">
          <TabsList aria-label="Preview" className={TAB_LIST}>
            <TabsTrigger value="text" className={TAB}>
              <DashOutline />
              Text
            </TabsTrigger>
            <TabsTrigger value="glyph" className={TAB}>
              <DashOutline />
              Glyph
            </TabsTrigger>
            <TabsTrigger value="charset" className={TAB}>
              <DashOutline />
              Charset
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="grid gap-5">
            <div ref={previewRef}>
              <TextCanvas
                text={text}
                params={PI}
                sizes={PREVIEW_SIZES}
                lineGap={P.leading}
                alive={alive}
                label="Preview of your text in the modular font"
                onTextChange={setText}
              />
            </div>
            {/* Même filet et mêmes typos que les sections du panneau */}
            <PanelSection title="Sizes">
              <div className="grid gap-4">
                {WATERFALL.map((size) => (
                  <div
                    key={size}
                    className="grid grid-cols-[56px_minmax(0,1fr)] items-start"
                  >
                    <span className="text-xs leading-normal font-medium tabular-nums">
                      {size}px
                    </span>
                    <TextCanvas
                      text={text.replace(/\n/g, " ")}
                      params={PI}
                      sizes={[size, size, size]}
                      lineGap={0.3}
                      alive={alive}
                      label={`Your text at ${size} pixels`}
                    />
                  </div>
                ))}
              </div>
            </PanelSection>
          </TabsContent>

          <TabsContent value="glyph" className="grid gap-8">
            <PillChoice
              label="Choose a character"
              value={glyph}
              onChange={setGlyph}
              options={GLYPH_OPTIONS}
            />
            <TextCanvas
              text={glyph}
              params={{ ...PI, grid: true }}
              sizes={[220, 320, 380]}
              lineGap={0}
              alive={alive}
              label={`The character ${glyph}, with its grid and path`}
            />
          </TabsContent>

          <TabsContent value="charset">
            <TextCanvas
              text={ALPHABET}
              params={PI}
              sizes={[34, 52, 52]}
              lineGap={0.5}
              alive={alive}
              label="Every letter and figure in the font"
            />
          </TabsContent>
        </Tabs>

        {/* ---------- Réglages (maquette Figma « Generator ») ---------- */}
        {/* Les poignées des curseurs sont dessinées avec la pièce choisie */}
        <PieceContext value={P}>
          <aside aria-label="Settings" className="grid content-start gap-6">
            {/* Reset / Randomize, à droite */}
            <div className="flex justify-end gap-1.5">
              <Pill
                muted
                onClick={() =>
                  replace({
                    ...DEFAULT_PARAMS,
                    grid: P.grid,
                    mode: P.mode,
                    layout: P.layout,
                  })
                }
              >
                Reset
              </Pill>
              <Pill active onClick={() => replace(randomParams(P))}>
                Randomize
              </Pill>
            </div>

            {/* Undo / Redo (chevrons) et « Show all settings » */}
            <div className="-mt-2 flex items-center justify-between gap-4">
              <div className="flex gap-4">
                <HistoryButton
                  label="Undo"
                  shortcut="⌘Z"
                  disabled={!history.canUndo}
                  onClick={history.undo}
                  flip
                />
                <HistoryButton
                  label="Redo"
                  shortcut="⇧⌘Z"
                  disabled={!history.canRedo}
                  onClick={history.redo}
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium">
                Show all settings
                <PanelSwitch
                  checked={advanced}
                  onCheckedChange={toggleAdvanced}
                />
              </label>
            </div>

            <PanelSection title="Construction">
              <PillChoice
                label="How letters are built"
                value={P.layout}
                onChange={(v: Layout) => set("layout")(v)}
                options={[
                  { id: "grille", label: "Grid" },
                  { id: "trace", label: "Along the path" },
                ]}
              />
              {P.layout === "trace" && (
                <div className="mt-2 grid gap-2">
                  <PanelSlider
                    id="spacing"
                    label="Piece spacing"
                    value={P.spacing}
                    min={0.15}
                    max={2.5}
                    step={0.01}
                    format={cells}
                    onChange={set("spacing")}
                  />
                  <PanelSlider
                    id="lanes"
                    label="Parallel rows"
                    value={P.lanes}
                    min={1}
                    max={2}
                    step={1}
                    format={String}
                    onChange={set("lanes")}
                  />
                  {advanced && (
                    <PanelSlider
                      id="laneGap"
                      label="Row spacing"
                      value={P.laneGap}
                      min={0.5}
                      max={3}
                      step={0.01}
                      format={(v) => v.toFixed(2) + "×"}
                      onChange={set("laneGap")}
                      inactive={P.lanes === 1}
                    />
                  )}
                  {/* Sans effet sur les formes rondes (rond, anneau, cible) : grisé */}
                  <label
                    className={cn(
                      "flex items-center gap-2 text-xs font-medium",
                      !USES_ROTATION.includes(P.shape) && "opacity-40"
                    )}
                  >
                    Rotate pieces
                    <PanelSwitch
                      checked={P.orient}
                      onCheckedChange={set("orient")}
                      disabled={!USES_ROTATION.includes(P.shape)}
                    />
                  </label>
                </div>
              )}
            </PanelSection>

            <PanelSection title="Grid & letters">
              <PanelSlider
                id="cols"
                label="Columns"
                value={P.cols}
                min={3}
                max={12}
                step={1}
                format={String}
                onChange={set("cols")}
              />
              <PanelSlider
                id="rows"
                label="Rows"
                value={P.rows}
                min={5}
                max={15}
                step={1}
                format={String}
                onChange={set("rows")}
              />
              <PanelSlider
                id="wt"
                label="Weight"
                value={P.wt}
                min={0.45}
                max={1.8}
                step={0.05}
                format={cells}
                onChange={set("wt")}
              />
              <PanelSlider
                id="leading"
                label="Line height"
                value={P.leading}
                min={-0.3}
                max={1.5}
                step={0.01}
                format={(v) => Math.round((1 + v) * 100) + "%"}
                onChange={set("leading")}
              />
              {advanced && (
                <>
                  <PanelSlider
                    id="xh"
                    label="x-height"
                    value={P.xh}
                    min={0.4}
                    max={0.85}
                    step={0.01}
                    format={pct}
                    onChange={set("xh")}
                  />
                  <PanelSlider
                    id="desc"
                    label="Descenders"
                    value={P.desc}
                    min={0.15}
                    max={0.5}
                    step={0.01}
                    format={pct}
                    onChange={set("desc")}
                  />
                  <PanelSlider
                    id="rnd"
                    label="Roundness"
                    value={P.rnd}
                    min={0}
                    max={1}
                    step={0.01}
                    format={pct}
                    onChange={set("rnd")}
                  />
                  <PanelSlider
                    id="smo"
                    label="Corner dots"
                    value={P.smo}
                    min={0}
                    max={0.6}
                    step={0.01}
                    format={(v) => (v ? pct(v) : "none")}
                    onChange={set("smo")}
                    inactive={P.layout === "trace"}
                  />
                </>
              )}
              <div className="mt-4">
                <PanelSlider
                  id="org"
                  label="Organic variation"
                  value={P.org}
                  min={0}
                  max={1}
                  step={0.01}
                  format={(v) => (v ? pct(v) : "none")}
                  onChange={set("org")}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium">
                  Alive
                  <PanelSwitch
                    checked={alive}
                    onCheckedChange={(on) => {
                      setAlive(on)
                      // Sans variation organique, il n'y a rien à faire onduler
                      if (on && !P.org) set("org")(0.35)
                    }}
                  />
                </label>
                <Pill
                  active
                  disabled={!P.org}
                  onClick={() => set("seed")(P.seed + 1)}
                >
                  Reshuffle
                </Pill>
              </div>
            </PanelSection>

            <PanelSection title="Pieces">
              <PillChoice
                label="Pieces"
                value={P.shape}
                onChange={(v: ShapeKind) => set("shape")(v)}
                options={SHAPES}
              />
              <PanelSlider
                id="gap"
                label="Piece gap"
                value={P.gap}
                min={-1}
                max={0.9}
                step={0.01}
                format={(v) =>
                  v < 0 ? `merge ${Math.round(-v * 100)}%` : pct(v)
                }
                onChange={set("gap")}
              />
              {advanced && (
                <>
                  <PanelSlider
                    id="thk"
                    label="Shape thickness"
                    value={P.thk}
                    min={0.08}
                    max={0.4}
                    step={0.01}
                    format={pct}
                    onChange={set("thk")}
                    inactive={!USES_THICKNESS.includes(P.shape)}
                  />
                  <PanelSlider
                    id="rad"
                    label="Corner radius"
                    value={P.rad}
                    min={0}
                    max={0.5}
                    step={0.01}
                    format={(v) => Math.round(v * 200) + "%"}
                    onChange={set("rad")}
                    inactive={!USES_RADIUS.includes(P.shape)}
                  />
                </>
              )}
            </PanelSection>

            {advanced && (
              <PanelSection title="Rendering">
                <PanelSlider
                  id="wid"
                  label="Width"
                  value={P.wid}
                  min={0.55}
                  max={1.7}
                  step={0.01}
                  format={pct}
                  onChange={set("wid")}
                />
                <PanelSlider
                  id="kern"
                  label="Auto kerning"
                  value={P.kern}
                  min={0}
                  max={1}
                  step={0.01}
                  format={(v) => (v ? pct(v) : "none")}
                  onChange={set("kern")}
                />
                <PanelSlider
                  id="sla"
                  label="Slant"
                  value={P.sla}
                  min={0}
                  max={20}
                  step={1}
                  format={(v) => v + "°"}
                  onChange={set("sla")}
                />
                <PillChoice
                  label="Solid or outline"
                  value={P.mode}
                  onChange={(v: RenderMode) => set("mode")(v)}
                  options={[
                    { id: "plein", label: "Solid" },
                    { id: "contour", label: "Outline" },
                  ]}
                />
                <PanelSlider
                  id="str"
                  label="Outline thickness"
                  value={P.str}
                  min={0.03}
                  max={0.3}
                  step={0.01}
                  format={pct}
                  onChange={set("str")}
                  inactive={P.mode === "plein"}
                />
                <label className="flex items-center gap-2 text-xs font-medium">
                  Show grid & path
                  <PanelSwitch checked={P.grid} onCheckedChange={set("grid")} />
                </label>
              </PanelSection>
            )}

            <ExportPanel
              params={P}
              onExportImage={exportImage}
              look={look}
              onLookChange={setLook}
            />
          </aside>
        </PieceContext>
      </section>
    </>
  )
}
