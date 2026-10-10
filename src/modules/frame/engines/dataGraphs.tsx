// data-graphs@1 core — table, tally, pictograph and bar views (maths M08).
//   build: the data table is shown; raise each bar (or icon row) with −/+ in steps of the scale, Check.
//   read:  a graph is shown; answer most / least (tap a category) or a value / total / difference (keypad).
//          Counting icons and ignoring the key (each icon = scale) is logged as icon_ignores_key.
// Highlight targets: "cat:<i>", "key", "check". Reveal: values are written on the graph.
import { useMemo, useState } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { Btn, CheckBtn, Choices, cls, EngineRoot, NumPad, Prompt, useEngineError, useHl, useIssues, Verdict } from "../kit/ui.tsx";
import { answerOf, buildCorrect, gridStep, iconOf, normalize, readCorrect, readMisc, type DGConfig } from "./dataGraphs.logic.ts";

const def = defineEngine({
  id: "data-graphs@1",
  title: "Tables and graphs",
  subjects: ["maths"],
  params: {
    mode: { type: "string", enum: ["build", "read", ...GENERIC_MODES], default: "read", doc: "build a graph from a table, or read a graph" },
    view: { type: "string", enum: ["bar", "pictograph", "tally", "table"], default: "bar", doc: "how the data is drawn" },
    data: { type: "array", doc: "[{label, value}] ≤ 6 rows, whole-number values" },
    labels: { type: "array", doc: "category labels (with values, instead of data)" },
    values: { type: "array", doc: "category values (with labels)" },
    scale: { type: "number", min: 1, max: 100, default: 1, doc: "bar: units per step; pictograph: units per icon (the key)" },
    icon: { type: "string", enum: ["star", "smile", "apple", "book", "ball", "tree", "car", "sun", "fish", "flower"], default: "star", doc: "pictograph icon" },
    question: { type: "string", enum: ["most", "least", "value", "total", "difference"], default: "most", doc: "read question" },
    ask: { type: "string", doc: "value/difference: the category label asked about" },
    askB: { type: "string", doc: "difference: the second category label" },
  },
  emits: ["dat.bar", "dat.read"],
});

const TX = {
  most: tri("Which has the most?", "Kiska sabse zyada hai?", "किसका सबसे ज़्यादा है?"),
  least: tri("Which has the least?", "Kiska sabse kam hai?", "किसका सबसे कम है?"),
  value: tri("How many for", "Kitne hain:", "कितने हैं:"),
  howMany: tri("How many does it show?", "Yeh kitna dikhata hai?", "यह कितना दिखाता है?"),
  total: tri("How many altogether?", "Kul kitne hain?", "कुल कितने हैं?"),
  difference: tri("How many more", "Kitne zyada:", "कितने ज़्यादा:"),
  than: tri("than", "se", "से"),
  build: tri("Draw the graph from the table", "Table se graph banao", "तालिका से ग्राफ़ बनाओ"),
  key: tri("each", "har ek", "हर एक"),
};

function Tally({ n }: { n: number }) {
  const groups = Math.floor(n / 5);
  const rest = n % 5;
  const w = groups * 34 + rest * 8 + 4;
  return (
    <svg className="ek-svg" viewBox={`0 0 ${Math.max(w, 10)} 28`} style={{ width: Math.max(w, 10), height: 28 }} role="img" aria-label={`${groups} bundles of five, ${rest} single`}>
      {Array.from({ length: groups }, (_, g) => (
        <g key={g} stroke="currentColor" strokeWidth={2.5}>
          {[0, 1, 2, 3].map((i) => <line key={i} x1={4 + g * 34 + i * 7} x2={4 + g * 34 + i * 7} y1={3} y2={25} />)}
          <line x1={g * 34} x2={4 + g * 34 + 26} y1={22} y2={6} />
        </g>
      ))}
      {Array.from({ length: rest }, (_, i) => <line key={`r${i}`} stroke="currentColor" strokeWidth={2.5} x1={4 + groups * 34 + i * 8} x2={4 + groups * 34 + i * 8} y1={3} y2={25} />)}
    </svg>
  );
}

// round 4 content: 200 px (kit.css .dg-plot) so 16 px axis labels at a gridline every step never overlap (certs/modules.json)
const PLOT_H = 200;

function Graph({ c, values, showValues, hlOf }: { c: DGConfig; values: number[]; showValues: boolean; hlOf: ReturnType<typeof useHl> }) {
  if (c.view === "table" || c.view === "tally") {
    return (
      <table className="ek-table">
        <tbody>
          {c.cats.map((cat, i) => {
            const h = hlOf(`cat:${i}`);
            return (
              <tr key={h.key} className={h.cls} data-cat={i}>
                <th scope="row">{cat.label}</th>
                <td>{c.view === "tally" ? <Tally n={values[i]} /> : values[i]}</td>
                {c.view === "tally" && showValues && <td>{values[i]}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  if (c.view === "pictograph") {
    return (
      <div className="dg-picto">
        {c.cats.map((cat, i) => {
          const h = hlOf(`cat:${i}`);
          const icons = values[i] / c.scale;
          return (
            <div key={h.key} className={cls("dg-prow", h.cls)} data-cat={i}>
              <span className="dg-cat">{cat.label}</span>
              <span className="dg-icons" role="img" aria-label={`${Math.floor(icons)}${icons % 1 !== 0 ? " and a half" : ""} ${c.icon}`}>
                {Array.from({ length: Math.floor(icons) }, (_, k) => <span key={k} className="dg-icon">{iconOf(c.icon)}</span>)}
                {icons % 1 !== 0 && <span className="dg-icon is-half">{iconOf(c.icon)}</span>}
              </span>
              {showValues && <span className="dg-val">{values[i]}</span>}
            </div>
          );
        })}
        <p className="dg-key" data-target="key">{iconOf(c.icon)} = {c.scale}</p>
      </div>
    );
  }
  // A labelled value axis with a gridline every `step` (a multiple of the scale), so a value is read off the graph.
  const step = gridStep(c.max, c.scale);
  const lines = Array.from({ length: Math.floor(c.max / step) + 1 }, (_, i) => i * step);
  return (
    <div className="dg-barwrap" role="img" aria-label="bar graph">
      <div className="dg-plot" data-step={step}>
        {lines.map((v) => (
          <div key={v} className="dg-grid" style={{ bottom: `${(PLOT_H * v) / c.max}px` }}><span className="dg-axis">{v}</span></div>
        ))}
        <div className="dg-bars">
          {c.cats.map((cat, i) => {
            const h = hlOf(`cat:${i}`);
            return (
              <div key={h.key} className={cls("dg-barcol", h.cls)} data-cat={i}>
                {showValues && <span className="dg-val">{values[i]}</span>}
                <div className="dg-bar" style={{ height: `${(PLOT_H * values[i]) / c.max}px` }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="dg-cats">{c.cats.map((cat, i) => <span key={i} className="dg-cat">{cat.label}</span>)}</div>
    </div>
  );
}

function DataGraphs({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  useEngineError(c.error, api);
  const hl = useHl(highlight);
  const key = `${c.mode}|${c.view}|${c.cats.map((x) => `${x.label}:${x.value}`).join(",")}|${c.scale}|${c.question}|${c.ask}|${c.askB}`;
  const t = useTracker(api, key, { stuckAfterChanges: 40 });
  const [s, setS] = useState({ key, values: c.cats.map(() => 0), entry: "", pick: null as string | null, verdict: null as boolean | null });
  if (s.key !== key) setS({ key, values: c.cats.map(() => 0), entry: "", pick: null, verdict: null });
  const real = c.cats.map((x) => x.value);
  const pictoStep = c.view === "pictograph" ? c.scale / 2 : c.scale;

  const bar = (i: number, d: number) => {
    if (t.done) return;
    const values = [...s.values];
    values[i] = Math.max(0, Math.min(c.max, values[i] + d * pictoStep));
    setS({ ...s, values, verdict: null });
    t.change("dat.bar", { cat: i, value: values[i], ok: values[i] === real[i] });
  };
  const checkBuild = () => {
    const ok = buildCorrect(c, s.values);
    setS({ ...s, verdict: ok });
    t.answer({ kind: "dat.build", values: s.values, wrong: s.values.map((v, i) => v !== real[i]).filter(Boolean).length }, ok, goal || "build graph");
  };
  const commitRead = (entry: string) => {
    const ok = readCorrect(c, entry);
    const misc = readMisc(c, entry);
    setS({ ...s, entry, pick: c.question === "most" || c.question === "least" ? entry : s.pick, verdict: ok });
    t.answer({ kind: "dat.read", question: c.question, given: entry, ...(misc && { misc }) }, ok, goal || `read ${c.question}`);
  };

  const qText =
    c.question === "value" ? (c.cats[c.ask].label === "?" ? say(TX.howMany, lang) : `${say(TX.value, lang)} ${c.cats[c.ask].label}?`) :
    c.question === "difference" ? `${say(TX.difference, lang)} ${c.cats[c.ask].label} ${say(TX.than, lang)} ${c.cats[c.askB].label}?` :
    say(TX[c.question], lang);
  return (
    <EngineRoot name="data-graphs" ageBand={ageBand} mode={c.mode}>
      {c.mode === "build" ? (
        <>
          <Prompt>{say(TX.build, lang)}</Prompt>
          <Graph c={{ ...c, view: "table" }} values={real} showValues hlOf={hl} />
          <Graph c={c.view === "table" ? { ...c, view: "bar" } : c} values={s.values} showValues={c.view === "tally" || revealed} hlOf={hl} />
          <div className="ek-row is-wrap">
            {c.cats.map((cat, i) => (
              <span key={i} className="ek-stepper" role="group" aria-label={cat.label}>
                <span className="ek-stepper-label">{cat.label}</span>
                <Btn kind="round" label={`${cat.label} −`} target={`down:${i}`} onClick={() => bar(i, -1)} disabled={s.values[i] <= 0}>−</Btn>
                <Btn kind="round" label={`${cat.label} +`} target={`up:${i}`} onClick={() => bar(i, 1)} disabled={s.values[i] >= c.max}>+</Btn>
              </span>
            ))}
          </div>
          <div className="ek-row"><CheckBtn lang={lang} onClick={checkBuild} hl={hl("check").cls} /></div>
        </>
      ) : (
        <>
          <Prompt>{qText}</Prompt>
          <Graph c={c} values={real} showValues={revealed || c.view === "table"} hlOf={hl} />
          {c.question === "most" || c.question === "least" ? (
            <Choices options={c.cats.map((cat, i) => ({ id: String(i), label: cat.label }))} selected={s.pick} onPick={commitRead}
              answerIds={revealed ? [String(answerOf(c))] : []} hlOf={(tg) => hl(tg.replace("choice:", "cat:"))} />
          ) : (
            <>
              <NumPad value={s.entry} onChange={(entry) => setS({ ...s, entry, verdict: null })} lang={lang} maxLen={5} />
              <div className="ek-row"><CheckBtn lang={lang} onClick={() => commitRead(s.entry)} disabled={!s.entry} hl={hl("check").cls} /></div>
            </>
          )}
        </>
      )}
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: DataGraphs };
