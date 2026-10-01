"use client"

import { useEffect, useRef, useState } from "react"

import { Dices, Redo2, RotateCcw, Shuffle, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useParamsHistory } from "@/hooks/use-params-history"
import { CHARSET, isLower } from "@/lib/fonderie/glyphs"
import {
  DEFAULT_PARAMS,
  randomParams,
  SHAPES,
  USES_RADIUS,
  USES_ROTATION,
  USES_THICKNESS,
  type Layout,
  type RenderMode,
  type ShapeKind,
} from "@/lib/fonderie/params"
import { decodeShare, encodeShare } from "@/lib/fonderie/share"

import { ControlSlider } from "./control-slider"
import { ExportPanel } from "./export-panel"
import { TextCanvas } from "./font-canvas"

const DEFAULT_TEXT = "Fonderie\nmodulaire 26"
const pct = (v: number) => Math.round(v * 100) + "%"
const cells = (v: number) => v.toFixed(2) + " cell"
// Une ligne par famille : capitales, minuscules, chiffres et ponctuation
const ALPHABET = [
  CHARSET.filter((c) => /[A-Z]/.test(c)),
  CHARSET.filter(isLower),
  CHARSET.filter((c) => !/[A-Z]/.test(c) && !isLower(c)),
]
  .map((g) => g.join(" "))
  .join("\n")
// Cascade de tailles dans la vue Text (hauteur des capitales en px), comme le « Typewriter » de Metaflop
const WATERFALL = [16, 28, 48]
const SECTION_LABEL =
  "font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase"
const PRESSED =
  "data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"
const ADVANCED_KEY = "fonderie:advanced"

// Bouton icône avec info-bulle (Undo, Redo)
function IconAction({
  label,
  shortcut,
  disabled,
  onClick,
  children,
}: {
  label: string
  shortcut: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <kbd className="ml-1 font-mono opacity-70">{shortcut}</kbd>
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

  // Au chargement : réglages et texte depuis l'adresse (lien partagé, ou style choisi sur la home),
  // et préférence Simple / Advanced
  useEffect(() => {
    if (window.location.hash.length > 1) {
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

  function toggleAdvanced(on: boolean) {
    setAdvanced(on)
    try {
      localStorage.setItem(ADVANCED_KEY, on ? "1" : "0")
    } catch {}
  }

  return (
    <>
      <p className="-mt-2 max-w-[62ch] text-pretty text-muted-foreground">
        Every letter is a path laid on a grid. Tune the grid, the weight and the
        shape of the pieces, and the whole alphabet rebuilds itself.
      </p>

      <section className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
        {/* ---------- Aperçu : trois vues ---------- */}
        <Tabs defaultValue="text" className="min-w-0 gap-4">
          {/* Chaque vue n'existe que quand elle est affichée : en changer rejoue la broderie */}
          <TabsList aria-label="Preview">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="glyph">Glyph</TabsTrigger>
            <TabsTrigger value="charset">Charset</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="grid gap-5">
            <Field className="gap-3">
              <FieldLabel htmlFor="txt" className={SECTION_LABEL}>
                Type your text
              </FieldLabel>
              <Textarea
                id="txt"
                rows={2}
                spellCheck={false}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-0 resize-none rounded-none border-0 border-b bg-transparent px-0 font-mono shadow-none focus-visible:border-brand focus-visible:ring-0 dark:bg-transparent"
              />
            </Field>
            <TextCanvas
              text={text}
              params={P}
              sizes={[64, 92, 128]}
              lineGap={0.42}
              intro
              alive={alive}
              label="Preview of your text in the modular font"
            />
            <div className="grid gap-4 border-t pt-4">
              <span className={SECTION_LABEL}>Sizes</span>
              {WATERFALL.map((size) => (
                <div
                  key={size}
                  className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-3"
                >
                  <span className="pt-1 font-mono text-xs text-muted-foreground tabular-nums">
                    {size}px
                  </span>
                  <TextCanvas
                    text={text.replace(/\n/g, " ")}
                    params={P}
                    sizes={[size, size, size]}
                    lineGap={0.3}
                    alive={alive}
                    label={`Your text at ${size} pixels`}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="glyph" className="grid gap-4">
            <ToggleGroup
              type="single"
              value={glyph}
              onValueChange={(v) => v && setGlyph(v)}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap"
              aria-label="Choose a character"
            >
              {CHARSET.map((c) => (
                <ToggleGroupItem
                  key={c}
                  value={c}
                  className={`min-w-7 font-mono ${PRESSED}`}
                >
                  {c}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <TextCanvas
              text={glyph}
              params={{ ...P, grid: true }}
              sizes={[220, 320, 380]}
              lineGap={0}
              intro
              alive={alive}
              label={`The character ${glyph}, with its grid and path`}
            />
          </TabsContent>

          <TabsContent value="charset">
            <TextCanvas
              text={ALPHABET}
              params={P}
              sizes={[34, 52, 52]}
              lineGap={0.5}
              intro
              alive={alive}
              label="Every letter and figure in the font"
            />
          </TabsContent>
        </Tabs>

        {/* ---------- Réglages ---------- */}
        <Card
          role="complementary"
          aria-label="Settings"
          className="rounded-md ring-0"
        >
          <CardContent>
            <FieldGroup>
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <IconAction
                    label="Undo"
                    shortcut="⌘Z"
                    disabled={!history.canUndo}
                    onClick={history.undo}
                  >
                    <Undo2 />
                  </IconAction>
                  <IconAction
                    label="Redo"
                    shortcut="⇧⌘Z"
                    disabled={!history.canRedo}
                    onClick={history.redo}
                  >
                    <Redo2 />
                  </IconAction>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    onClick={() => replace(randomParams(P))}
                  >
                    <Dices data-icon="inline-start" />
                    Randomize
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      replace({
                        ...DEFAULT_PARAMS,
                        grid: P.grid,
                        mode: P.mode,
                        layout: P.layout,
                      })
                    }
                  >
                    <RotateCcw data-icon="inline-start" />
                    Reset
                  </Button>
                </div>
              </div>

              <Field orientation="horizontal">
                <Switch
                  id="advanced"
                  checked={advanced}
                  onCheckedChange={toggleAdvanced}
                />
                <FieldLabel htmlFor="advanced" className="font-normal">
                  Show all settings
                </FieldLabel>
              </Field>

              <FieldSeparator />

              <FieldSet className="gap-3.5">
                <FieldLegend className={SECTION_LABEL}>
                  Construction
                </FieldLegend>
                <ToggleGroup
                  type="single"
                  value={P.layout}
                  onValueChange={(v) => v && set("layout")(v as Layout)}
                  variant="outline"
                  spacing={0}
                  className="grid w-full grid-cols-2"
                  aria-label="How letters are built"
                >
                  <ToggleGroupItem value="grille" className={PRESSED}>
                    Grid
                  </ToggleGroupItem>
                  <ToggleGroupItem value="trace" className={PRESSED}>
                    Along the path
                  </ToggleGroupItem>
                </ToggleGroup>
                {P.layout === "trace" && (
                  <>
                    <ControlSlider
                      id="spacing"
                      label="Piece spacing"
                      value={P.spacing}
                      min={0.15}
                      max={2.5}
                      step={0.01}
                      format={cells}
                      onChange={set("spacing")}
                    />
                    <ControlSlider
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
                      <ControlSlider
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
                    <Field
                      orientation="horizontal"
                      data-disabled={!USES_ROTATION.includes(P.shape)}
                      className="transition-opacity data-[disabled=true]:opacity-40"
                    >
                      <Switch
                        id="orient"
                        checked={P.orient}
                        onCheckedChange={set("orient")}
                        disabled={!USES_ROTATION.includes(P.shape)}
                      />
                      <FieldLabel htmlFor="orient" className="font-normal">
                        Rotate pieces along the stroke
                      </FieldLabel>
                    </Field>
                  </>
                )}
              </FieldSet>

              <FieldSeparator />

              <FieldSet className="gap-3.5">
                <FieldLegend className={SECTION_LABEL}>
                  Grid & letters
                </FieldLegend>
                <ControlSlider
                  id="cols"
                  label="Columns"
                  value={P.cols}
                  min={3}
                  max={12}
                  step={1}
                  format={String}
                  onChange={set("cols")}
                />
                <ControlSlider
                  id="rows"
                  label="Rows"
                  value={P.rows}
                  min={5}
                  max={15}
                  step={1}
                  format={String}
                  onChange={set("rows")}
                />
                <ControlSlider
                  id="wt"
                  label="Weight"
                  value={P.wt}
                  min={0.45}
                  max={1.8}
                  step={0.05}
                  format={cells}
                  onChange={set("wt")}
                />
                {advanced && (
                  <>
                    <ControlSlider
                      id="xh"
                      label="x-height"
                      value={P.xh}
                      min={0.4}
                      max={0.85}
                      step={0.01}
                      format={pct}
                      onChange={set("xh")}
                    />
                    <ControlSlider
                      id="desc"
                      label="Descenders (g, p, q…)"
                      value={P.desc}
                      min={0.15}
                      max={0.5}
                      step={0.01}
                      format={pct}
                      onChange={set("desc")}
                    />
                    <ControlSlider
                      id="rnd"
                      label="Roundness"
                      value={P.rnd}
                      min={0}
                      max={1}
                      step={0.01}
                      format={pct}
                      onChange={set("rnd")}
                    />
                    <ControlSlider
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
                <ControlSlider
                  id="org"
                  label="Organic variation"
                  value={P.org}
                  min={0}
                  max={1}
                  step={0.01}
                  format={(v) => (v ? pct(v) : "none")}
                  onChange={set("org")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!P.org}
                  onClick={() => set("seed")(P.seed + 1)}
                  className="w-fit"
                >
                  <Shuffle data-icon="inline-start" />
                  Reshuffle
                </Button>
                <Field orientation="horizontal">
                  <Switch
                    id="alive"
                    checked={alive}
                    onCheckedChange={(on) => {
                      setAlive(on)
                      // Sans variation organique, il n'y a rien à faire onduler
                      if (on && !P.org) set("org")(0.35)
                    }}
                  />
                  <FieldLabel htmlFor="alive" className="font-normal">
                    Alive: the grid breathes
                  </FieldLabel>
                </Field>
              </FieldSet>

              <FieldSeparator />

              <FieldSet className="gap-3.5">
                <FieldLegend className={SECTION_LABEL}>Pieces</FieldLegend>
                <ToggleGroup
                  type="single"
                  value={P.shape}
                  onValueChange={(v) => v && set("shape")(v as ShapeKind)}
                  className="flex-wrap"
                  spacing={1.5}
                  aria-label="Pieces"
                >
                  {SHAPES.map((s) => (
                    <ToggleGroupItem
                      key={s.id}
                      value={s.id}
                      variant="outline"
                      size="sm"
                      className={`rounded-full ${PRESSED}`}
                    >
                      {s.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <ControlSlider
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
                    <ControlSlider
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
                    <ControlSlider
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
              </FieldSet>

              {advanced && (
                <>
                  <FieldSeparator />

                  <FieldSet className="gap-3.5">
                    <FieldLegend className={SECTION_LABEL}>
                      Rendering
                    </FieldLegend>
                    <ControlSlider
                      id="wid"
                      label="Width"
                      value={P.wid}
                      min={0.55}
                      max={1.7}
                      step={0.01}
                      format={pct}
                      onChange={set("wid")}
                    />
                    <ControlSlider
                      id="kern"
                      label="Auto kerning"
                      value={P.kern}
                      min={0}
                      max={1}
                      step={0.01}
                      format={(v) => (v ? pct(v) : "none")}
                      onChange={set("kern")}
                    />
                    <ControlSlider
                      id="sla"
                      label="Slant"
                      value={P.sla}
                      min={0}
                      max={20}
                      step={1}
                      format={(v) => v + "°"}
                      onChange={set("sla")}
                    />
                    <ToggleGroup
                      type="single"
                      value={P.mode}
                      onValueChange={(v) => v && set("mode")(v as RenderMode)}
                      variant="outline"
                      spacing={0}
                      className="grid w-full grid-cols-2"
                      aria-label="Solid or outline"
                    >
                      <ToggleGroupItem value="plein" className={PRESSED}>
                        Solid
                      </ToggleGroupItem>
                      <ToggleGroupItem value="contour" className={PRESSED}>
                        Outline
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <ControlSlider
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
                    <Field orientation="horizontal">
                      <Switch
                        id="grid"
                        checked={P.grid}
                        onCheckedChange={set("grid")}
                      />
                      <FieldLabel htmlFor="grid" className="font-normal">
                        Show grid & path
                      </FieldLabel>
                    </Field>
                  </FieldSet>
                </>
              )}

              <FieldSeparator />

              <ExportPanel params={P} legendClassName={SECTION_LABEL} />
            </FieldGroup>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
