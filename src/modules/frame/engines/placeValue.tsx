// place-value@1 — numbers by place, Indian (lakh) or international grouping (maths M03).
//   build:   add / remove pieces per place (+ / − per column), trade 10 for 1 up a place (or 1 for 10 down),
//            Check: do the pieces make the number?
//   read:    pieces are shown; the child types the number (concatenated / dropped-zero readings are logged).
//   compare: two numbers in place-value charts; tap the bigger (smaller) one, or "same".
// Highlight targets: "place:<p>" (0 = ones), "number", "check", "num:a" | "num:b". Reveal: digits per place.
import { useMemo, useState } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { indianGroup, say, tri, W } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { Btn, CheckBtn, Choices, cls, EngineRoot, NumPad, Prompt, useHl, useIssues, Verdict } from "../kit/ui.tsx";
import { buildCorrect, compareCorrect, digitsOf, exchange, normalize, PLACE_NAMES_IN, PLACE_NAMES_INTL, readCorrect, readMisc, total } from "./placeValue.logic.ts";

const def = defineEngine({
  id: "place-value@1",
  title: "Place value",
  subjects: ["maths"],
  params: {
    mode: { type: "string", enum: ["build", "read", "compare", ...GENERIC_MODES], default: "build", doc: "build a number, read pieces, compare two numbers" },
    value: { type: "number", min: 0, max: 9999999, doc: "build/read: the number" },
    a: { type: "number", min: 0, max: 9999999, doc: "compare: first number" },
    b: { type: "number", min: 0, max: 9999999, doc: "compare: second number" },
    question: { type: "string", enum: ["bigger", "smaller"], default: "bigger", doc: "compare question" },
    places: { type: "number", min: 1, max: 7, doc: "places shown (default: the number's digits, at least 3 when building)" },
    grouping: { type: "string", enum: ["indian", "international"], default: "indian", doc: "place names and commas" },
    readout: { type: "string", enum: ["live", "after"], default: "after", doc: "build: show the pieces' number live or after Check" },
    name: { type: "string", doc: "build: the number name to build ('four thousand fifty'); the numeral is then not shown" },
    counts: { type: "array", doc: "read: pieces per place, ones first ([6, 4] = 4 tens 6 ones; a place may hold up to 19); the value is their total" },
  },
  emits: ["pv.piece", "pv.exchange", "pv.write", "pv.compare"],
});

const TX = {
  build: tri("Make this number", "Yeh number banao", "यह संख्या बनाओ"),
  read: tri("What number do the pieces make?", "Yeh tukde kaunsa number banate hain?", "ये टुकड़े कौन-सी संख्या बनाते हैं?"),
  up: tri("trade 10 for 1", "10 ke badle 1", "10 के बदले 1"),
  down: tri("break 1 into 10", "1 ko 10 mein todo", "1 को 10 में तोड़ो"),
  add: tri("add one", "ek jodo", "एक जोड़ो"),
  sub: tri("take one away", "ek hatao", "एक हटाओ"),
};

function Glyphs({ p, n }: { p: number; n: number }) {
  const shown = Math.min(n, 10);
  return (
    <span className="pv-glyphs" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) =>
        p <= 2 ? <span key={i} className={`pv-glyph pv-g${p}`} /> : <span key={i} className="pv-glyph pv-disk">{10 ** p >= 100000 ? `${10 ** (p - 5)}L` : `${10 ** (p - 3)}K`}</span>,
      )}
      {n > 10 && <span className="pv-badge">×{n}</span>}
    </span>
  );
}

function PlaceValue({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  const hl = useHl(highlight);
  const names = c.grouping === "indian" ? PLACE_NAMES_IN : PLACE_NAMES_INTL;
  const fmt = (n: number) => (c.grouping === "indian" ? indianGroup(n) : n.toLocaleString("en-US"));
  const key = `${c.mode}|${c.value}|${c.a}|${c.b}|${c.places}|${c.question}`;
  const t = useTracker(api, key, { stuckAfterChanges: 40 });
  const zero = Array(c.places).fill(0);
  const [s, setS] = useState({ key, counts: zero, entry: "", pick: null as string | null, verdict: null as boolean | null });
  if (s.key !== key) setS({ key, counts: zero, entry: "", pick: null, verdict: null });
  const placesHiLo = Array.from({ length: c.places }, (_, i) => c.places - 1 - i);

  const setCounts = (counts: number[], name: string, data: Record<string, unknown>) => {
    if (t.done) return;
    setS({ ...s, counts, verdict: null });
    t.change(name, { ...data, total: total(counts) });
  };
  const piece = (p: number, d: number) => {
    const n = s.counts[p] + d;
    if (n < 0 || n > 19) return;
    const counts = [...s.counts];
    counts[p] = n;
    setCounts(counts, "pv.piece", { place: p, count: n });
  };
  const trade = (p: number, dir: "up" | "down") => {
    const next = exchange(s.counts, p, dir);
    if (next) setCounts(next, "pv.exchange", { from: p, to: dir === "up" ? p + 1 : p - 1, dir });
  };
  const checkBuild = () => {
    const ok = buildCorrect(c, s.counts);
    setS({ ...s, verdict: ok });
    t.answer({ kind: "pv.build", built: total(s.counts), target: c.value, counts: s.counts, canonical: s.counts.every((n) => n < 10) }, ok, goal || `build ${c.value}`);
  };
  const checkRead = () => {
    const ok = readCorrect(c, s.entry);
    const misc = readMisc(c, s.entry);
    setS({ ...s, verdict: ok });
    t.answer({ kind: "pv.write", written: s.entry, value: c.value, ...(misc && { misc }) }, ok, goal || `read ${c.value}`);
  };
  const choose = (pick: string) => {
    const ok = compareCorrect(c, pick);
    setS({ ...s, pick, verdict: ok });
    t.answer({ kind: "pv.compare", chosen: pick, a: c.a, b: c.b, question: c.question }, ok, goal || `compare ${c.question}`);
  };

  const chart = (n: number, label?: string, pieces?: number[] | null) => (
    <div className="pv-cols" aria-label={label}>
      {placesHiLo.map((p) => {
        const h = hl(`place:${p}`);
        const d = pieces ? pieces[p] ?? 0 : digitsOf(n, c.places)[p];
        return (
          <div key={h.key} className={cls("pv-col", h.cls)} data-place={p}>
            <span className="pv-col-name">{say(names[p], lang)}</span>
            <Glyphs p={p} n={d} />
            {(revealed || c.mode === "compare") && <span className="pv-digit">{d}</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <EngineRoot name="place-value" ageBand={ageBand} mode={c.mode}>
      {c.mode === "build" && (
        <>
          <Prompt>
            {say(TX.build, lang)}: <strong key={hl("number").key} className={cls("ek-math", hl("number").cls)} data-name={c.name ? "" : undefined}>{c.name ?? fmt(c.value)}</strong>
          </Prompt>
          <div className="pv-cols">
            {placesHiLo.map((p) => {
              const h = hl(`place:${p}`);
              const name = say(names[p], lang);
              return (
                <div key={h.key} className={cls("pv-col", h.cls)} data-place={p}>
                  <span className="pv-col-name">{name}</span>
                  <Btn kind="round" label={`${name}: ${say(TX.add, lang)}`} target={`add:${p}`} onClick={() => piece(p, 1)} disabled={s.counts[p] >= 19}>+</Btn>
                  <Glyphs p={p} n={s.counts[p]} />
                  <span className="pv-digit" data-count={p}>{s.counts[p]}</span>
                  <Btn kind="round" label={`${name}: ${say(TX.sub, lang)}`} target={`sub:${p}`} onClick={() => piece(p, -1)} disabled={s.counts[p] <= 0}>−</Btn>
                  {s.counts[p] >= 10 && p + 1 < c.places && (
                    <Btn label={say(TX.up, lang)} target={`trade:${p}`} onClick={() => trade(p, "up")}>⇧10</Btn>
                  )}
                  {p > 0 && s.counts[p] > 0 && s.counts[p - 1] <= 9 && (
                    <Btn label={say(TX.down, lang)} target={`break:${p}`} onClick={() => trade(p, "down")}>⇩1</Btn>
                  )}
                </div>
              );
            })}
          </div>
          {(c.readout === "live" || s.verdict !== null || revealed) && <p className="pv-number" data-total>{fmt(total(s.counts))}</p>}
          <div className="ek-row"><CheckBtn lang={lang} onClick={checkBuild} hl={hl("check").cls} /></div>
        </>
      )}
      {c.mode === "read" && (
        <>
          <Prompt>{say(TX.read, lang)}</Prompt>
          {chart(c.value, undefined, c.counts)}
          {revealed && <p className="pv-number">{fmt(c.value)}</p>}
          <NumPad value={s.entry} onChange={(entry) => setS({ ...s, entry, verdict: null })} lang={lang} maxLen={8} />
          <div className="ek-row"><CheckBtn lang={lang} onClick={checkRead} disabled={!s.entry} hl={hl("check").cls} /></div>
        </>
      )}
      {c.mode === "compare" && (
        <>
          <Prompt>{say(c.question === "bigger" ? W.bigger : W.smaller, lang)}</Prompt>
          {/* predict: the charts (which show the bigger number by place) wait for a pick or the reveal */}
          {(!c.hideAnswer || revealed || s.pick !== null) ? <>{chart(c.a, "a")}{chart(c.b, "b")}</> : <p className="ek-note" data-hidden="charts">?</p>}
          <Choices
            hlOf={(tg) => hl(tg.replace("choice:", "num:"))}
            options={[{ id: "a", label: fmt(c.a) }, { id: "b", label: fmt(c.b) }, { id: "same", label: say(W.same, lang) }]}
            selected={s.pick}
            answerIds={revealed ? ["a", "b", "same"].filter((x) => compareCorrect(c, x)) : []}
            onPick={choose}
          />
        </>
      )}
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: PlaceValue };
