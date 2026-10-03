// geoboard@1 (v1 slice) — area and perimeter by shading unit squares on a grid (maths M07).
//   build:    shade one connected shape with the given area and/or perimeter, Check.
//   measure:  a shape is shown; type its area (or perimeter). Giving the other measure is logged (AREA_PERIM_SWAP).
//   contrast: a shape is shown; build a different shape with the same area but a different perimeter (or the
//             same perimeter and a different area) — the "same perimeter, same area?" contrast.
// Squares are ≥ the band's hit size at 360 px (the grid is capped to fit). Highlight: "cell:x,y", "check".
import { useMemo, useState, type CSSProperties } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { CheckBtn, cls, EngineRoot, hitPx, NumPad, Prompt, useEngineError, useHl, useIssues, Verdict, Btn } from "../kit/ui.tsx";
import { area, buildCorrect, cellKey, connected, contrastCorrect, solveBuild, measureCorrect, measureMisc, normalize, perimeter, type Cell } from "./geoboard.logic.ts";

const def = defineEngine({
  id: "geoboard@1",
  title: "Area and perimeter grid",
  subjects: ["maths"],
  params: {
    mode: { type: "string", enum: ["build", "measure", "contrast", ...GENERIC_MODES], default: "build", doc: "build a shape, measure a shape, or the same-area contrast" },
    w: { type: "number", min: 2, max: 12, doc: "columns (capped so squares stay ≥ the hit size at 360px)" },
    h: { type: "number", min: 2, max: 8, doc: "rows" },
    area: { type: "number", min: 1, max: 96, doc: "build: target area in squares" },
    perimeter: { type: "number", min: 4, max: 200, doc: "build: target perimeter in unit edges" },
    ask: { type: "string", enum: ["area", "perimeter"], default: "area", doc: "measure: which measure the child gives" },
    contrast: { type: "string", enum: ["same_area", "same_perimeter"], default: "same_area", doc: "contrast: what stays the same" },
    shape: { type: "string", doc: "measure/contrast: a rectangle 'rect:WxH' at the top-left" },
    cells: { type: "array", doc: "measure/contrast: the shape as [[x, y], …] squares (instead of shape)" },
    unit: { type: "string", enum: ["units", "cm", "m"], default: "units", doc: "unit word shown with measures" },
    readout: { type: "string", enum: ["live", "after"], default: "after", doc: "show area/perimeter live or after Check" },
  },
  emits: ["geo.shape", "geo.claim"],
});

const TX = {
  build: tri("Shade a shape with", "Aisi shape rango jiska", "ऐसी आकृति रंगो जिसका"),
  area: tri("area", "kshetrafal", "क्षेत्रफल"),
  perimeter: tri("perimeter", "parimaap", "परिमाप"),
  measure: tri("What is its", "Iska kitna hai:", "इसका कितना है:"),
  sameArea: tri("Make a new shape: same area, different perimeter", "Nayi shape banao: kshetrafal wahi, parimaap alag", "नई आकृति बनाओ: क्षेत्रफल वही, परिमाप अलग"),
  samePerim: tri("Make a new shape: same perimeter, different area", "Nayi shape banao: parimaap wahi, kshetrafal alag", "नई आकृति बनाओ: परिमाप वही, क्षेत्रफल अलग"),
  clear: tri("clear", "mitao", "मिटाओ"),
};

function Geoboard({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const hit = hitPx(ageBand);
  const c = useMemo(() => normalize(params, hit), [params, hit]);
  useIssues(c.issues, api);
  useEngineError(c.error, api);
  const hl = useHl(highlight);
  const shapeKey = [...c.shape].sort().join(";");
  const key = `${c.mode}|${c.w}x${c.h}|${c.area}|${c.perimeter}|${c.ask}|${c.contrast}|${shapeKey}`;
  const t = useTracker(api, key, { stuckAfterChanges: 40 });
  const [s, setS] = useState({ key, cells: new Set<Cell>(), entry: "", verdict: null as boolean | null });
  if (s.key !== key) setS({ key, cells: new Set(), entry: "", verdict: null });
  const unit = typeof params.unit === "string" ? params.unit : "units";
  const shown = c.mode === "measure" ? c.shape : s.cells;
  const ghost = revealed && c.mode === "build" ? solveBuild(c) : null;
  const ref = c.mode === "contrast" ? c.shape : null;

  const toggle = (x: number, y: number) => {
    if (c.mode === "measure" || t.done) return;
    const cells = new Set(s.cells);
    const k = cellKey(x, y);
    if (cells.has(k)) cells.delete(k);
    else cells.add(k);
    setS({ ...s, cells, verdict: null });
    t.change("geo.shape", { cell: k, on: cells.has(k), area: area(cells), perimeter: perimeter(cells), connected: connected(cells) });
  };
  const check = () => {
    const g = goal || `${c.mode} ${c.area ?? ""} ${c.perimeter ?? ""}`.replace(/\s+/g, " ").trim();
    let ok: boolean;
    let value: Record<string, unknown>;
    if (c.mode === "measure") {
      ok = measureCorrect(c, s.entry);
      const misc = measureMisc(c, s.entry);
      value = { kind: "geo.claim", ask: c.ask, claimed: Number(s.entry), ...(misc && { misc }) };
    } else {
      ok = c.mode === "build" ? buildCorrect(c, s.cells) : contrastCorrect(c, s.cells);
      value = { kind: c.mode === "build" ? "geo.build" : "geo.contrast", area: area(s.cells), perimeter: perimeter(s.cells), connected: connected(s.cells) };
    }
    setS({ ...s, verdict: ok });
    t.answer(value, ok, g);
  };

  const cell = Math.max(hit, Math.min(56, Math.floor(320 / c.w)));
  const style = { gridTemplateColumns: `repeat(${c.w}, ${cell}px)`, "--geo-cell": `${cell}px` } as CSSProperties;
  // predict: the live area/perimeter readout is an answer-bearing aid, so it waits for Check or the reveal
  const live = (params.readout === "live" && !c.hideAnswer) || revealed || s.verdict !== null;
  return (
    <EngineRoot name="geoboard" ageBand={ageBand} mode={c.mode}>
      <Prompt>
        {c.mode === "build" && (
          <>
            {say(TX.build, lang)} {c.area !== null && <strong className="ek-math">{say(TX.area, lang)} = {c.area}</strong>}{" "}
            {c.perimeter !== null && <strong className="ek-math">{say(TX.perimeter, lang)} = {c.perimeter}</strong>}
          </>
        )}
        {c.mode === "measure" && <>{say(TX.measure, lang)} <strong className="ek-math">{say(c.ask === "area" ? TX.area : TX.perimeter, lang)}?</strong></>}
        {c.mode === "contrast" && say(c.contrast === "same_area" ? TX.sameArea : TX.samePerim, lang)}
      </Prompt>
      {ref && (
        <p className="ek-note" data-ref>
          {say(TX.area, lang)} {area(ref)} · {say(TX.perimeter, lang)} {perimeter(ref)}
        </p>
      )}
      <div className="geo-grid" style={style} role="grid" aria-label={`${c.w} by ${c.h} grid`}>
        {Array.from({ length: c.h }, (_, y) =>
          Array.from({ length: c.w }, (_, x) => {
            const k = cellKey(x, y);
            const h = hl(`cell:${k}`);
            const on = shown.has(k);
            return (
              <button type="button" key={h.key} data-cell={k} className={cls("geo-cell", on && "is-on", (ghost?.has(k) || ref?.has(k)) && "is-ghost", h.cls)}
                aria-pressed={on} aria-label={`square ${x + 1}, ${y + 1}`} disabled={c.mode === "measure"} onClick={() => toggle(x, y)} />
            );
          }),
        )}
      </div>
      {c.mode !== "measure" && live && (
        <p className="geo-read" data-readout>
          <span>{say(TX.area, lang)}: {area(s.cells)}</span>
          <span>{say(TX.perimeter, lang)}: {perimeter(s.cells)}</span>
        </p>
      )}
      {c.mode === "measure" && (
        <>
          {revealed && <p className="geo-read">{c.ask === "area" ? area(c.shape) : perimeter(c.shape)} {unit}</p>}
          <NumPad value={s.entry} onChange={(entry) => setS({ ...s, entry, verdict: null })} lang={lang} maxLen={3} />
        </>
      )}
      <div className="ek-row">
        {c.mode !== "measure" && <Btn target="clear" onClick={() => setS({ ...s, cells: new Set(), verdict: null })}>{say(TX.clear, lang)}</Btn>}
        <CheckBtn lang={lang} onClick={check} disabled={!!c.error || (c.mode === "measure" ? !s.entry : s.cells.size === 0)} hl={hl("check").cls} />
      </div>
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: Geoboard };
