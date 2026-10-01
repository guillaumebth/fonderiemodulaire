"use client"

import { useState } from "react"

import { Dices, Play, RotateCcw, Shuffle } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CHARSET, isLower } from "@/lib/fonderie/glyphs"
import {
  DEFAULT_PARAMS,
  randomParams,
  SHAPES,
  USES_RADIUS,
  USES_THICKNESS,
  type Layout,
  type Params,
  type RenderMode,
  type ShapeKind,
} from "@/lib/fonderie/params"

import { ControlSlider } from "./control-slider"
import { ExportPanel } from "./export-panel"
import { StepCanvas, TextCanvas } from "./font-canvas"

const pct = (v: number) => Math.round(v * 100) + " %"
// Une ligne par famille : capitales, minuscules, chiffres et ponctuation
const ALPHABET = [
  CHARSET.filter((c) => /[A-Z]/.test(c)),
  CHARSET.filter(isLower),
  CHARSET.filter((c) => !/[A-Z]/.test(c) && !isLower(c)),
]
  .map((g) => g.join(" "))
  .join("\n")
const SECTION_LABEL =
  "font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase"
const PRESSED =
  "data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"

export function FontEditor() {
  const [P, setP] = useState<Params>(DEFAULT_PARAMS)
  const [text, setText] = useState("Fonderie\nmodulaire 26")
  const [alive, setAlive] = useState(false) // la variation organique ondule en boucle
  const [replay, setReplay] = useState(0) // incrémenté pour rejouer la broderie
  const set =
    <K extends keyof Params>(key: K) =>
    (value: Params[K]) =>
      setP((p) => ({ ...p, [key]: value }))

  return (
    <>
      <section className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
        <Field className="min-w-0 gap-3">
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="txt" className={SECTION_LABEL}>
              Tape ton texte
            </FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setReplay((r) => r + 1)}
            >
              <Play data-icon="inline-start" />
              Rejouer
            </Button>
          </div>
          <Textarea
            id="txt"
            rows={2}
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-0 resize-none rounded-none border-0 border-b bg-transparent px-0 font-mono shadow-none focus-visible:border-brand focus-visible:ring-0 dark:bg-transparent"
          />
          <TextCanvas
            text={text}
            params={P}
            sizes={[64, 92, 128]}
            lineGap={0.42}
            intro
            replay={replay}
            alive={alive}
            label="Aperçu du texte dans la police modulaire"
          />
        </Field>

        <Card
          role="complementary"
          aria-label="Réglages"
          className="rounded-md ring-0"
        >
          <CardContent>
            <FieldGroup>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  onClick={() => setP((p) => randomParams(p))}
                >
                  <Dices data-icon="inline-start" />
                  Au hasard
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setP((p) => ({
                      ...DEFAULT_PARAMS,
                      grid: p.grid,
                      mode: p.mode,
                      layout: p.layout,
                    }))
                  }
                >
                  <RotateCcw data-icon="inline-start" />
                  Réinitialiser
                </Button>
              </div>

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
                  aria-label="Construction des lettres"
                >
                  <ToggleGroupItem value="grille" className={PRESSED}>
                    Grille
                  </ToggleGroupItem>
                  <ToggleGroupItem value="trace" className={PRESSED}>
                    Le long du tracé
                  </ToggleGroupItem>
                </ToggleGroup>
                {P.layout === "trace" && (
                  <>
                    <ControlSlider
                      id="spacing"
                      label="Espacement des pièces"
                      value={P.spacing}
                      min={0.15}
                      max={2.5}
                      step={0.01}
                      format={(v) => v.toFixed(2).replace(".", ",") + " case"}
                      onChange={set("spacing")}
                    />
                    <ControlSlider
                      id="lanes"
                      label="Rangées côte à côte"
                      value={P.lanes}
                      min={1}
                      max={5}
                      step={1}
                      format={String}
                      onChange={set("lanes")}
                    />
                    <ControlSlider
                      id="laneGap"
                      label="Écart entre rangées"
                      value={P.laneGap}
                      min={0.5}
                      max={3}
                      step={0.01}
                      format={(v) => v.toFixed(2).replace(".", ",") + " ×"}
                      onChange={set("laneGap")}
                      inactive={P.lanes === 1}
                    />
                    <Field orientation="horizontal">
                      <Switch
                        id="orient"
                        checked={P.orient}
                        onCheckedChange={set("orient")}
                      />
                      <FieldLabel htmlFor="orient" className="font-normal">
                        Pièces orientées selon le trait
                      </FieldLabel>
                    </Field>
                  </>
                )}
              </FieldSet>

              <FieldSeparator />
              <FieldSet className="gap-3.5">
                <FieldLegend className={SECTION_LABEL}>
                  Grille et lettres
                </FieldLegend>
                <ControlSlider
                  id="cols"
                  label="Colonnes"
                  value={P.cols}
                  min={3}
                  max={12}
                  step={1}
                  format={String}
                  onChange={set("cols")}
                />
                <ControlSlider
                  id="rows"
                  label="Lignes"
                  value={P.rows}
                  min={5}
                  max={15}
                  step={1}
                  format={String}
                  onChange={set("rows")}
                />
                <ControlSlider
                  id="xh"
                  label="Hauteur des minuscules"
                  value={P.xh}
                  min={0.4}
                  max={0.85}
                  step={0.01}
                  format={pct}
                  onChange={set("xh")}
                />
                <ControlSlider
                  id="desc"
                  label="Jambages (g, p, q…)"
                  value={P.desc}
                  min={0.15}
                  max={0.5}
                  step={0.01}
                  format={pct}
                  onChange={set("desc")}
                />
                <ControlSlider
                  id="wt"
                  label="Graisse"
                  value={P.wt}
                  min={0.45}
                  max={1.8}
                  step={0.05}
                  format={(v) => v.toFixed(2).replace(".", ",") + " case"}
                  onChange={set("wt")}
                />
                <ControlSlider
                  id="rnd"
                  label="Rondeur des lettres"
                  value={P.rnd}
                  min={0}
                  max={1}
                  step={0.01}
                  format={pct}
                  onChange={set("rnd")}
                />
                <ControlSlider
                  id="smo"
                  label="Petits points d'angle"
                  value={P.smo}
                  min={0}
                  max={0.6}
                  step={0.01}
                  format={(v) => (v ? pct(v) : "aucun")}
                  onChange={set("smo")}
                  inactive={P.layout === "trace"}
                />
                <ControlSlider
                  id="org"
                  label="Variation organique"
                  value={P.org}
                  min={0}
                  max={1}
                  step={0.01}
                  format={(v) => (v ? pct(v) : "aucune")}
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
                  Autre tirage
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
                    Vivant : la grille ondule
                  </FieldLabel>
                </Field>
              </FieldSet>

              <FieldSeparator />

              <FieldSet className="gap-3.5">
                <FieldLegend className={SECTION_LABEL}>
                  Forme des pièces
                </FieldLegend>
                <ToggleGroup
                  type="single"
                  value={P.shape}
                  onValueChange={(v) => v && set("shape")(v as ShapeKind)}
                  className="flex-wrap"
                  spacing={1.5}
                  aria-label="Forme des pièces"
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
                  label="Écart entre pièces"
                  value={P.gap}
                  min={-1}
                  max={0.9}
                  step={0.01}
                  format={(v) =>
                    v < 0 ? `fusion ${Math.round(-v * 100)} %` : pct(v)
                  }
                  onChange={set("gap")}
                />
                <ControlSlider
                  id="thk"
                  label="Épaisseur des formes"
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
                  label="Arrondi des carrés"
                  value={P.rad}
                  min={0}
                  max={0.5}
                  step={0.01}
                  format={(v) => Math.round(v * 200) + " %"}
                  onChange={set("rad")}
                  inactive={!USES_RADIUS.includes(P.shape)}
                />
              </FieldSet>

              <FieldSeparator />

              <FieldSet className="gap-3.5">
                <FieldLegend className={SECTION_LABEL}>Rendu</FieldLegend>
                <ControlSlider
                  id="wid"
                  label="Largeur"
                  value={P.wid}
                  min={0.55}
                  max={1.7}
                  step={0.01}
                  format={pct}
                  onChange={set("wid")}
                />
                <ControlSlider
                  id="kern"
                  label="Crénage automatique"
                  value={P.kern}
                  min={0}
                  max={1}
                  step={0.01}
                  format={(v) => (v ? pct(v) : "aucun")}
                  onChange={set("kern")}
                />
                <ControlSlider
                  id="sla"
                  label="Inclinaison"
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
                  aria-label="Plein ou contour"
                >
                  <ToggleGroupItem value="plein" className={PRESSED}>
                    Plein
                  </ToggleGroupItem>
                  <ToggleGroupItem value="contour" className={PRESSED}>
                    Contour
                  </ToggleGroupItem>
                </ToggleGroup>
                <ControlSlider
                  id="str"
                  label="Épaisseur du contour"
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
                    Montrer la grille et le tracé
                  </FieldLabel>
                </Field>
              </FieldSet>

              <FieldSeparator />

              <ExportPanel params={P} legendClassName={SECTION_LABEL} />
            </FieldGroup>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="grid content-start gap-2.5">
          <h2 className="text-[22px] leading-tight font-bold text-balance">
            Comment c&apos;est construit
          </h2>
          <p className="max-w-[60ch]">
            Chaque lettre est décrite une seule fois, comme un tracé : quelques
            lignes et quelques angles. Ce tracé ne dépend d&apos;aucune grille.
          </p>
          <p className="max-w-[60ch]">
            Le code pose ensuite ce tracé sur la grille que tu as réglée,
            remplit chaque case que le trait touche, et met une pièce dans
            chaque case remplie. Si tu changes le nombre de colonnes ou de
            lignes, toutes les lettres sont recalculées toutes seules.
          </p>
          <p className="max-w-[60ch] text-sm text-muted-foreground">
            La graisse décide jusqu&apos;où le trait « déborde » sur les cases
            voisines. La rondeur arrondit les angles du tracé.
          </p>
        </div>
        <div className="grid grid-cols-3 content-start gap-3.5">
          {(
            [
              [1, "1. Le tracé", "la lettre décrite en lignes"],
              P.layout === "trace"
                ? [
                    2,
                    "2. Les positions",
                    "à intervalles réguliers sur le trait",
                  ]
                : [2, "2. La grille", "les cases que le trait touche"],
              [
                3,
                "3. Les pièces",
                P.layout === "trace"
                  ? "une forme à chaque position"
                  : "une forme dans chaque case",
              ],
            ] satisfies [1 | 2 | 3, string, string][]
          ).map(([step, title, desc]) => (
            <div key={step} className="grid gap-2">
              <StepCanvas
                step={step}
                char="R"
                params={P}
                label={`Étape ${title}`}
              />
              <span className="text-[13px] leading-snug text-muted-foreground">
                <b className="font-medium text-foreground">{title}</b>
                <br />
                {desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="grid gap-3">
        <span className={SECTION_LABEL}>Jeu de caractères complet</span>
        <TextCanvas
          text={ALPHABET}
          params={P}
          sizes={[34, 52, 52]}
          lineGap={0.5}
          alive={alive}
          label="Toutes les lettres et chiffres de la police"
        />
      </section>
    </>
  )
}
