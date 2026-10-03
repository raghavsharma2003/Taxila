// collections@1 — counters in ten-frames (maths M02).
//   count:   n counters; tapping one tags it (✓) so the child can keep track, then the child enters how many.
//            Tapping a tagged counter again is logged (double_tag) — the ONE_TO_ONE signal.
//   make:    empty frames; +1 / −1 / +10 build a set, Check: is it n?
//   compare: two sets (the smaller one drawn spread out); tap the set with more / fewer, or "same".
// Highlight targets: "set:left" | "set:right" | "same" | "check" | "counter:<i>". Reveal: the count / answer.
import { useMemo, useState, type CSSProperties } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri, W } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { Btn, CheckBtn, cls, EngineRoot, hitPx, NumPad, Prompt, useHl, useIssues, Verdict } from "../kit/ui.tsx";
import { compareAnswer, compareCorrect, countCorrect, glyphOf, normalize, spreadSide } from "./collections.logic.ts";

const def = defineEngine({
  id: "collections@1",
  title: "Counters and ten-frames",
  subjects: ["maths"],
  params: {
    mode: { type: "string", enum: ["count", "make", "compare", ...GENERIC_MODES], default: "count", doc: "count a set, make a set of n, or compare two sets" },
    n: { type: "number", min: 0, max: 50, doc: "count/make: how many" },
    left: { type: "number", min: 0, max: 50, doc: "compare: left set size" },
    right: { type: "number", min: 0, max: 50, doc: "compare: right set size" },
    question: { type: "string", enum: ["more", "fewer"], default: "more", doc: "compare question" },
    layout: { type: "string", enum: ["ten_frame", "loose"], default: "ten_frame", doc: "ten-frames or a loose row" },
    item: { type: "string", enum: ["counter", "seed", "stick", "dot", "mango", "apple", "ball", "star"], default: "counter", doc: "what the counters look like" },
    showCount: { type: "string", enum: ["never", "after_commit", "live"], default: "after_commit", doc: "when the total is shown" },
  },
  emits: ["col.tag", "col.total", "col.add", "col.compare"],
});

const TX = {
  count: tri("How many? Tap each one as you count.", "Kitne hain? Ginte hue har ek ko tap karo.", "कितने हैं? गिनते हुए हर एक को छुओ।"),
  make: tri("Make", "Itne banao:", "इतने बनाओ:"),
  add1: tri("add one", "ek jodo", "एक जोड़ो"),
  sub1: tri("take one away", "ek hatao", "एक हटाओ"),
  add10: tri("add ten", "das jodo", "दस जोड़ो"),
  left: tri("left set", "baayein wale", "बाएँ वाले"),
  right: tri("right set", "daayein wale", "दाएँ वाले"),
};

function Frames({ count, filled, tagged, onTap, hlOf, glyph, cell, vertical }: {
  count: number; filled: number; tagged?: Set<number>; onTap?: (i: number) => void; hlOf: ReturnType<typeof useHl>;
  glyph: string; cell: number; vertical: boolean;
}) {
  const frames = Math.max(1, Math.ceil(count / 10));
  const style = { "--col-cell": `${cell}px`, gridTemplateColumns: `repeat(${vertical ? 2 : 5}, ${cell}px)` } as CSSProperties;
  return (
    <div className="col-sets">
      {Array.from({ length: frames }, (_, f) => (
        <div key={f} className="col-frame" style={style}>
          {Array.from({ length: 10 }, (_, j) => {
            const i = f * 10 + j;
            const on = i < filled;
            const h = hlOf(`counter:${i}`);
            const dot = on ? <span className={cls("col-dot", tagged?.has(i) && "is-tagged")}>{!tagged?.has(i) && glyphOf(glyph)}</span> : null;
            return onTap && on ? (
              <button type="button" key={h.key} className={cls("col-cell", h.cls)} data-counter={i} aria-pressed={tagged?.has(i)} aria-label={`counter ${i + 1}`} onClick={() => onTap(i)}>
                {dot}
              </button>
            ) : (
              <span key={h.key} className={cls("col-cell", h.cls)} data-exempt-hit>
                {dot}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Collections({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  const hl = useHl(highlight);
  const key = `${c.mode}|${c.n}|${c.left}|${c.right}|${c.question}`;
  const t = useTracker(api, key, { stuckAfterChanges: 30 });
  const [s, setS] = useState({ key, tagged: new Set<number>(), made: 0, entry: "", pick: null as string | null, verdict: null as boolean | null, doubles: 0 });
  if (s.key !== key) setS({ key, tagged: new Set(), made: 0, entry: "", pick: null, verdict: null, doubles: 0 });
  const hit = hitPx(ageBand);
  const vertical = hit > 48;

  const tag = (i: number) => {
    if (t.done) return;
    const tagged = new Set(s.tagged);
    const again = tagged.has(i);
    if (again) tagged.delete(i);
    else tagged.add(i);
    setS({ ...s, tagged, doubles: s.doubles + (again ? 1 : 0), verdict: null });
    t.change("col.tag", { i, tagged: tagged.size, double_tag: again });
  };
  const make = (d: number) => {
    const made = Math.max(0, Math.min(50, s.made + d));
    if (made === s.made || t.done) return;
    setS({ ...s, made, verdict: null });
    t.change("col.add", { delta: d, total: made });
  };
  const commitCount = () => {
    const claimed = Number(s.entry);
    const ok = countCorrect(c, claimed);
    setS({ ...s, verdict: ok });
    t.answer({ kind: "col.total", claimed, actual: c.n, tagged: s.tagged.size, all_tagged: s.tagged.size === c.n, double_tags: s.doubles }, ok, goal || `count ${c.n}`);
  };
  const commitMake = () => {
    const ok = s.made === c.n;
    setS({ ...s, verdict: ok });
    t.answer({ kind: "col.make", made: s.made, target: c.n }, ok, goal || `make ${c.n}`);
  };
  const choose = (pick: string) => {
    const ok = compareCorrect(c, pick);
    setS({ ...s, pick, verdict: ok });
    t.answer({ kind: "col.compare", chosen: pick, left: c.left, right: c.right, question: c.question, spread_side: spreadSide(c), chose_spread: pick === spreadSide(c) }, ok, goal || `compare ${c.question}`);
  };

  // predict: a live count is an answer-bearing aid, so it waits for the commit like "after_commit"
  const live = c.showCount === "live" && !c.hideAnswer;
  const showTotal = live || revealed || (c.showCount !== "never" && s.verdict !== null);
  return (
    <EngineRoot name="collections" ageBand={ageBand} mode={c.mode}>
      {c.mode === "count" && (
        <>
          <Prompt>{say(TX.count, lang)}</Prompt>
          <Frames count={c.n} filled={c.n} tagged={s.tagged} onTap={tag} hlOf={hl} glyph={c.glyph} cell={hit} vertical={vertical} />
          {showTotal && <p className="ek-note" data-total>{s.tagged.size} ✓ · {revealed ? c.n : ""}</p>}
          <NumPad value={s.entry} onChange={(entry) => setS({ ...s, entry, verdict: null })} lang={lang} maxLen={3} />
          <div className="ek-row"><CheckBtn lang={lang} onClick={commitCount} disabled={!s.entry} hl={hl("check").cls} /></div>
        </>
      )}
      {c.mode === "make" && (
        <>
          <Prompt>{say(TX.make, lang)} <strong className="ek-math">{c.n}</strong></Prompt>
          <Frames count={Math.max(10, Math.ceil((Math.max(s.made, c.n) + 1) / 10) * 10)} filled={s.made} hlOf={hl} glyph={c.glyph} cell={Math.min(hit, 44)} vertical={false} />
          {(live || revealed) && <output className="ek-readout">{s.made}</output>}
          <div className="ek-row">
            <Btn kind="round" label={say(TX.sub1, lang)} target="sub1" onClick={() => make(-1)} disabled={s.made === 0}>−1</Btn>
            <Btn kind="round" label={say(TX.add1, lang)} target="add1" onClick={() => make(1)}>+1</Btn>
            <Btn kind="round" label={say(TX.add10, lang)} target="add10" onClick={() => make(10)}>+10</Btn>
          </div>
          <div className="ek-row"><CheckBtn lang={lang} onClick={commitMake} hl={hl("check").cls} /></div>
        </>
      )}
      {c.mode === "compare" && (
        <>
          <Prompt>{say(c.question === "more" ? W.more : W.fewer, lang)}</Prompt>
          <div className="col-sets">
            {(["left", "right"] as const).map((side) => {
              const n = side === "left" ? c.left : c.right;
              const spread = spreadSide(c) === side && c.left !== c.right;
              const h = hl(`set:${side}`);
              const isAnswer = revealed && compareAnswer(c) === side;
              return (
                <button type="button" key={h.key} data-set={side} className={cls("col-set", "ek-btn", s.pick === side && "is-selected", isAnswer && "is-answer", h.cls)}
                  aria-pressed={s.pick === side} aria-label={say(side === "left" ? TX.left : TX.right, lang)} onClick={() => choose(side)}>
                  <span className="col-loose" style={{ gap: spread ? "14px 18px" : "3px", maxWidth: spread ? 150 : 110 }}>
                    {Array.from({ length: n }, (_, i) => (
                      <span key={i} className="col-dot" style={{ width: 18, height: 18 }} />
                    ))}
                  </span>
                  {(revealed || s.verdict !== null) && <span className="ek-readout">{n}</span>}
                </button>
              );
            })}
          </div>
          <div className="ek-row">
            <Btn target="same" pressed={s.pick === "same"} hl={cls(hl("same").cls, revealed && compareAnswer(c) === "same" && "is-answer")} onClick={() => choose("same")}>
              {say(W.same, lang)}
            </Btn>
          </div>
        </>
      )}
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: Collections };
