// multiply-divide@1 — arrays, fair sharing and factor rectangles (maths M05).
//   array:   set rows and columns (−/+); the dot array shows a×b; ⟲ turns it (commutativity); Check.
//            ask "product": build it if you like, then TYPE how many in all; the verdict is on the number only
//            (showExpr false hides "a × b" for word problems). With predict the dots stay hidden until reveal.
//   share:   n things, k plates; tap a plate to give it one, or "one each" to deal a round; Check: fair share
//            with the leftover kept back (unequal plates are logged — SHARE_UNEQUAL).
//   factors: find every rectangle of n dots: set rows × columns, "Add" records it if it uses all n; Check
//            when you think you have them all.
// Highlight targets: "rows", "cols", "rotate", "plate:<i>", "deal", "add", "check". Reveal: the answer.
import { useMemo, useState, type CSSProperties } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { Btn, CheckBtn, cls, EngineRoot, NumPad, Prompt, Stepper, useEngineError, useHl, useIssues, Verdict } from "../kit/ui.tsx";
import { arrayCorrect, productCorrect, factorPairs, factorsCorrect, MAX_SIDE, normalize, pairKey, shareCorrect, shareUnequal } from "./multiplyDivide.logic.ts";

const def = defineEngine({
  id: "multiply-divide@1",
  title: "Arrays, sharing and factors",
  subjects: ["maths"],
  params: {
    mode: { type: "string", enum: ["array", "share", "factors", ...GENERIC_MODES], default: "array", doc: "array (a×b), share (n among k), factors (all rectangles of n)" },
    a: { type: "number", min: 1, max: 12, doc: "array: rows" },
    b: { type: "number", min: 1, max: 12, doc: "array: columns" },
    product: { type: "number", min: 1, max: 144, doc: "array: any array with this many dots" },
    n: { type: "number", min: 1, max: 100, doc: "share/factors: how many things (factors ≤ 60)" },
    k: { type: "number", min: 1, max: 10, doc: "share: how many plates" },
    orderMatters: { type: "boolean", default: false, doc: "array: 3×4 ≠ 4×3" },
    ask: { type: "string", enum: ["array", "product"], default: "array", doc: "array: check the dimensions (array) or the typed total (product)" },
    showExpr: { type: "boolean", default: true, doc: "array/product: show 'a × b' (false for word problems)" },
  },
  emits: ["md.array", "md.rotate", "md.deal", "md.rect"],
});

const TX = {
  array: tri("Make an array of", "Itne ka array banao:", "इतने का ऐरे बनाओ:"),
  product: tri("How many in all?", "Kul kitne?", "कुल कितने?"),
  productBuild: tri("Make the array, then type how many in all.", "Array banao, phir likho kul kitne.", "ऐरे बनाओ, फिर लिखो कुल कितने।"),
  rows: tri("Rows", "Panktiyan", "पंक्तियाँ"),
  cols: tri("Columns", "Stambh", "स्तंभ"),
  share: tri("Share fairly. Keep back what is left over.", "Barabar baanto. Jo bache, alag rakho.", "बराबर बाँटो। जो बचे, अलग रखो।"),
  each: tri("one each", "sabko ek", "सबको एक"),
  takeBack: tri("take all back", "sab wapas", "सब वापस"),
  factors: tri("Find every rectangle that uses all", "Saare rectangle dhoondo jo poore istemaal karein:", "सारे आयत ढूँढो जो पूरे इस्तेमाल करें:"),
  addRect: tri("Add", "Jodo", "जोड़ो"),
  rotate: tri("turn", "ghumao", "घुमाओ"),
  left: tri("left over", "bache", "बचे"),
};

/** rows × cols dots; with `total`, `total` dots arranged column by column into `rows` rows (the last column may be short). */
function Dots({ rows, cols, total }: { rows: number; cols: number; total?: number }) {
  const n = total ?? rows * cols;
  const shownCols = total !== undefined ? Math.ceil(n / rows) : cols;
  if (rows > 24 || shownCols > 24) {
    return <p className="ek-note" data-strip>{rows} × {shownCols}</p>;
  }
  const cell = Math.max(8, Math.min(22, Math.floor(300 / Math.max(rows, shownCols)) - 4));
  const style = { gridTemplateColumns: `repeat(${shownCols}, ${cell}px)`, gridAutoFlow: "column", gridTemplateRows: `repeat(${rows}, ${cell}px)`, "--md-cell": `${cell}px` } as CSSProperties;
  return (
    <div className="md-grid" style={style} role="img" aria-label={`${rows} rows of ${shownCols}`} data-rows={rows} data-cols={shownCols}>
      {Array.from({ length: n }, (_, i) => <span key={i} className="md-dot" />)}
    </div>
  );
}

function MultiplyDivide({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  useEngineError(c.error, api);
  const hl = useHl(highlight);
  const key = `${c.mode}|${c.a}|${c.b}|${c.product}|${c.n}|${c.k}`;
  const t = useTracker(api, key, { stuckAfterChanges: 30 });
  const fresh = () => ({ key, entry: "", rows: 1, cols: 1, plates: Array(c.k).fill(0) as number[], found: new Set<string>(), verdict: null as boolean | null });
  const [s, setS] = useState(fresh);
  if (s.key !== key) setS(fresh());
  const pile = c.n - s.plates.reduce((x, y) => x + y, 0);

  const setDims = (rows: number, cols: number, name = "md.array") => {
    if (t.done) return;
    setS({ ...s, rows, cols, verdict: null });
    t.change(name, { rows, cols });
  };
  const deal = (i: number | "each" | "back") => {
    if (t.done) return;
    let plates = [...s.plates];
    if (i === "back") plates = plates.map(() => 0);
    else if (i === "each") {
      if (pile < c.k) return;
      plates = plates.map((x) => x + 1);
    } else {
      if (pile < 1) return;
      plates[i]++;
    }
    setS({ ...s, plates, verdict: null });
    t.change("md.deal", { plate: i, counts: plates, left: c.n - plates.reduce((x, y) => x + y, 0) });
  };
  const addRect = () => {
    if (t.done) return;
    const ok = c.n % s.rows === 0;
    const found = new Set(s.found);
    if (ok) found.add(pairKey(s.rows, c.n / s.rows));
    setS({ ...s, found, verdict: null });
    t.change("md.rect", { rows: s.rows, cols: Math.ceil(c.n / s.rows), left_over: c.n % s.rows, ok, found: found.size });
  };
  const check = () => {
    if (c.mode === "array" && c.ask === "product") {
      const ok = productCorrect(c, s.entry);
      setS({ ...s, verdict: ok });
      t.answer({ kind: "md.product", value: s.entry, rows: s.rows, cols: s.cols, built_right: arrayCorrect(c, s.rows, s.cols) }, ok, goal || `product ${c.a}x${c.b}`);
    } else if (c.mode === "array") {
      const ok = arrayCorrect(c, s.rows, s.cols);
      setS({ ...s, verdict: ok });
      t.answer({ kind: "md.array", rows: s.rows, cols: s.cols, product: s.rows * s.cols }, ok, goal || `array ${c.a ?? ""}x${c.b ?? ""}`.trim());
    } else if (c.mode === "share") {
      const ok = shareCorrect(c, s.plates);
      setS({ ...s, verdict: ok });
      t.answer({ kind: "md.share", plates: s.plates, left: pile, n: c.n, k: c.k, ...(shareUnequal(s.plates) && { misc: "share_unequal" }) }, ok, goal || `share ${c.n} among ${c.k}`);
    } else {
      const ok = factorsCorrect(c.n, s.found);
      setS({ ...s, verdict: ok });
      t.answer({ kind: "md.factors", found: [...s.found], total_pairs: factorPairs(c.n).length }, ok, goal || `factors of ${c.n}`);
    }
  };

  const asksProduct = c.mode === "array" && c.ask === "product";
  // predict: the dots to count are hidden until a verdict or reveal (the child works the product out first)
  const showAids = !c.hideAnswer || revealed || s.verdict !== null;
  const target = c.a !== null && c.b !== null ? `${c.a} × ${c.b}` : c.product !== null ? String(c.product) : "";
  const sideMax = c.mode === "factors" ? c.n : MAX_SIDE;
  return (
    <EngineRoot name="multiply-divide" ageBand={ageBand} mode={c.mode}>
      {(c.mode === "array" || c.mode === "factors") && (
        <>
          <Prompt>
            {asksProduct ? (
              <>{say(c.showExpr ? TX.product : TX.productBuild, lang)} {c.showExpr && <strong className="ek-math" data-question>{target}</strong>}</>
            ) : (
              <>{c.mode === "array" ? say(TX.array, lang) : say(TX.factors, lang)} <strong className="ek-math">{c.mode === "array" ? target : c.n}</strong></>
            )}
          </Prompt>
          {c.mode === "array" ? (showAids ? <Dots rows={s.rows} cols={s.cols} /> : <p className="ek-note" data-hidden="dots">? × ?</p>) : <Dots rows={s.rows} cols={0} total={c.n} />}
          <div className="ek-row">
            <Stepper label={say(TX.rows, lang)} value={s.rows} min={1} max={sideMax} onChange={(v) => setDims(v, s.cols)} target="rows" hl={hl("rows").cls} lang={lang} />
            {c.mode === "array" && (
              <Stepper label={say(TX.cols, lang)} value={s.cols} min={1} max={sideMax} onChange={(v) => setDims(s.rows, v)} target="cols" hl={hl("cols").cls} lang={lang} />
            )}
          </div>
          <div className="ek-row">
            {c.mode === "array" && <Btn label={say(TX.rotate, lang)} target="rotate" hl={hl("rotate").cls} onClick={() => setDims(s.cols, s.rows, "md.rotate")}>⟲</Btn>}
            {c.mode === "factors" && (
              <>
                <span className="ek-note" data-leftover={c.n % s.rows}>{c.n % s.rows ? `${c.n % s.rows} ${say(TX.left, lang)}` : `${s.rows} × ${c.n / s.rows}`}</span>
                <Btn target="add" hl={hl("add").cls} onClick={addRect}>{say(TX.addRect, lang)}</Btn>
              </>
            )}
          </div>
          {asksProduct && <NumPad value={s.entry} onChange={(entry) => setS({ ...s, entry, verdict: null })} lang={lang} maxLen={4} label={say(TX.product, lang)} />}
          {asksProduct && revealed && <p className="ek-readout" data-product>{c.a} × {c.b} = {(c.a ?? 0) * (c.b ?? 0)}</p>}
          {!asksProduct && (revealed || s.verdict !== null) && c.mode === "array" && <p className="ek-readout" data-product>{s.rows} × {s.cols} = {s.rows * s.cols}</p>}
          {c.mode === "factors" && (
            <div className="md-found" data-found={s.found.size}>
              {(revealed ? factorPairs(c.n).map(([r, q]) => pairKey(r, q)) : [...s.found]).map((k) => <span key={k}>{k.replace("x", " × ")}</span>)}
            </div>
          )}
        </>
      )}
      {c.mode === "share" && (
        <>
          <Prompt>{say(TX.share, lang)} <strong className="ek-math">{c.n} ÷ {c.k}</strong></Prompt>
          <div className="md-pile" aria-label={`${pile} ${say(TX.left, lang)}`} data-pile={pile}>
            {Array.from({ length: pile }, (_, i) => <span key={i} className="md-dot" style={{ width: 16, height: 16 }} />)}
          </div>
          <div className="md-plates">
            {s.plates.map((x, i) => {
              const h = hl(`plate:${i}`);
              const right = revealed ? Math.floor(c.n / c.k) : null;
              return (
                <button type="button" key={h.key} className={cls("md-plate", h.cls)} data-plate={i} aria-label={`plate ${i + 1}: ${x}`} onClick={() => deal(i)}>
                  {Array.from({ length: x }, (_, j) => <span key={j} className="md-dot" />)}
                  {right !== null && <span className="ek-tick">{right}</span>}
                </button>
              );
            })}
          </div>
          <div className="ek-row">
            <Btn target="deal" hl={hl("deal").cls} onClick={() => deal("each")} disabled={pile < c.k}>{say(TX.each, lang)}</Btn>
            <Btn target="back" onClick={() => deal("back")}>{say(TX.takeBack, lang)}</Btn>
          </div>
        </>
      )}
      <div className="ek-row"><CheckBtn lang={lang} onClick={check} disabled={!!c.error || (asksProduct && !s.entry)} hl={hl("check").cls} /></div>
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: MultiplyDivide };
