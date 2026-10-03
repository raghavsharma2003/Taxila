// patterns@1 core — extend a pattern or mark a number-grid rule (maths M10).
//   repeat: a repeating pattern of shapes (shape AND colour differ, never colour alone) with empty slots;
//           tap a tray piece to fill the next slot (tap a filled slot to empty it), Check.
//   grow:   a number sequence with blanks; tap a blank, type its number, Check (rule: +k, ×k or squares).
//   grid:   a number grid; tap every number that fits the rule (multiples of k, even, odd, ends in d), Check.
// Highlight: "slot:<i>", "tray:<token>", "cell:<n>", "check". Reveal: the blanks are filled / cells ringed.
import { useMemo, useState, type CSSProperties } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { Btn, CheckBtn, cls, EngineRoot, hitPx, NumPad, Prompt, useEngineError, useHl, useIssues, Verdict } from "../kit/ui.tsx";
import { firstWrong, gridCorrect, gridMember, growAt, growCorrect, normalize, repeatAt, repeatCorrect } from "./patterns.logic.ts";

const def = defineEngine({
  id: "patterns@1",
  title: "Patterns",
  subjects: ["maths"],
  params: {
    mode: { type: "string", enum: ["repeat", "grow", "grid", ...GENERIC_MODES], default: "repeat", doc: "repeat / grow / grid" },
    core: { type: "array", doc: "repeat: the unit, ≤ 4 tokens: 'red-circle', 'blue-square', 'A', '7'" },
    shown: { type: "number", min: 1, max: 12, doc: "terms shown before the blanks" },
    blanks: { type: "number", min: 1, max: 6, doc: "terms the child fills" },
    distractors: { type: "array", doc: "repeat: extra tray tokens not in the core (≤ 2)" },
    sequence: { type: "array", doc: "grow: the given terms (≥ 3), e.g. [3, 6, 9]" },
    rule: { type: "string", doc: "grow: 'add:3', 'mul:2', 'square', 'triangular' (default: inferred)" },
    gridStart: { type: "number", min: 0, max: 1000, default: 1, doc: "grid: first number" },
    gridCount: { type: "number", min: 6, max: 36, default: 30, doc: "grid: how many numbers" },
    gridRule: { type: "string", doc: "grid: 'multiples:3', 'even', 'odd', 'ends:5'" },
  },
  emits: ["pat.extend", "pat.term", "grid.mark"],
});

const TX = {
  repeat: tri("What comes next? Fill the empty boxes.", "Aage kya aayega? Khaali dabbe bharo.", "आगे क्या आएगा? खाली डिब्बे भरो।"),
  grow: tri("Find the next numbers", "Agle number dhoondo", "अगली संख्याएँ ढूँढो"),
  multiples: tri("Tap every multiple of", "Har gunaj tap karo:", "हर गुणज छुओ:"),
  even: tri("Tap every even number", "Har sam sankhya tap karo", "हर सम संख्या छुओ"),
  odd: tri("Tap every odd number", "Har visham sankhya tap karo", "हर विषम संख्या छुओ"),
  ends: tri("Tap every number ending in", "Har number jiske aakhir mein ho:", "हर संख्या जिसके अंत में हो:"),
};

const COLOR: Record<string, string> = { red: "#c0392b", blue: "#1f5f99", green: "#3f7a1e", yellow: "#d4a600", orange: "#e0892f", purple: "#6b3fa0" };

/** A token: a coloured shape (the shape alone tells it apart) or a short label. */
export function Token({ t, size = 34 }: { t: string; size?: number }) {
  const m = t.match(/^(?:(\w+)-)?(circle|square|triangle|star|diamond|heart)$/);
  if (!m) return <span className="pt-label">{t}</span>;
  const fill = COLOR[m[1] ?? ""] ?? "#5a5148";
  const s = size;
  const shape = m[2];
  const common = { fill, stroke: "#1f1a14", strokeWidth: 2 };
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" role="img" aria-label={t.replace("-", " ")}>
      {shape === "circle" && <circle cx={20} cy={20} r={16} {...common} />}
      {shape === "square" && <rect x={5} y={5} width={30} height={30} {...common} />}
      {shape === "triangle" && <path d="M20 4 L37 35 L3 35 Z" {...common} />}
      {shape === "diamond" && <path d="M20 3 L37 20 L20 37 L3 20 Z" {...common} />}
      {shape === "star" && <path d="M20 3 L25 15 L38 15 L27 23 L31 36 L20 28 L9 36 L13 23 L2 15 L15 15 Z" {...common} />}
      {shape === "heart" && <path d="M20 36 C4 24 2 14 8 8 C13 3 19 6 20 11 C21 6 27 3 32 8 C38 14 36 24 20 36 Z" {...common} />}
    </svg>
  );
}

function Patterns({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  useEngineError(c.error, api);
  const hl = useHl(highlight);
  const key = `${c.mode}|${c.core.join(",")}|${c.shown}|${c.blanks}|${c.terms.join(",")}|${JSON.stringify(c.rule)}|${c.gridStart}|${c.gridCount}|${JSON.stringify(c.gridRule)}`;
  const t = useTracker(api, key, { stuckAfterChanges: 30 });
  const fresh = () => ({ key, slots: Array(c.blanks).fill(null) as (string | null)[], entries: Array(c.blanks).fill("") as string[], active: 0, marked: new Set<number>(), verdict: null as boolean | null });
  const [s, setS] = useState(fresh);
  if (s.key !== key) setS(fresh());
  const hit = hitPx(ageBand);

  const place = (tok: string) => {
    if (t.done) return;
    const i = s.slots.indexOf(null);
    if (i < 0) return;
    const slots = [...s.slots];
    slots[i] = tok;
    setS({ ...s, slots, verdict: null });
    t.change("pat.extend", { slot: i, token: tok, fits: tok === repeatAt(c, i) });
  };
  const clear = (i: number) => {
    if (t.done || s.slots[i] === null) return;
    const slots = [...s.slots];
    slots[i] = null;
    setS({ ...s, slots, verdict: null });
    t.change("pat.extend", { slot: i, token: null });
  };
  const mark = (n: number) => {
    if (t.done) return;
    const marked = new Set(s.marked);
    if (marked.has(n)) marked.delete(n);
    else marked.add(n);
    setS({ ...s, marked, verdict: null });
    t.change("grid.mark", { n, on: marked.has(n), fits: gridMember(c.gridRule, n) });
  };
  const check = () => {
    let ok = false;
    let value: Record<string, unknown> = {};
    if (c.mode === "repeat") {
      ok = repeatCorrect(c, s.slots);
      value = { kind: "pat.extend", tokens: s.slots, first_wrong_slot: firstWrong(c, s.slots) };
    } else if (c.mode === "grow") {
      ok = growCorrect(c, s.entries);
      value = { kind: "pat.term", given: s.entries, first_wrong_slot: s.entries.findIndex((e, i) => Number(e) !== growAt(c, i)) };
    } else {
      ok = gridCorrect(c, s.marked);
      const missed = Array.from({ length: c.gridCount }, (_, i) => c.gridStart + i).filter((n) => gridMember(c.gridRule, n) && !s.marked.has(n)).length;
      const extra = [...s.marked].filter((n) => !gridMember(c.gridRule, n)).length;
      value = { kind: "grid.mark", marked: s.marked.size, missed, extra };
    }
    setS({ ...s, verdict: ok });
    t.answer(value, ok, goal || `${c.mode} pattern`);
  };

  const gridCols = Math.max(2, Math.min(c.gridRule.kind === "ends" ? 5 : 6, Math.floor(320 / (hit + 4))));
  const gridStyle = { gridTemplateColumns: `repeat(${gridCols}, ${hit}px)` } as CSSProperties;
  const ruleText =
    c.gridRule.kind === "multiples" ? <>{say(TX.multiples, lang)} <strong className="ek-math">{c.gridRule.k}</strong></> :
    c.gridRule.kind === "ends" ? <>{say(TX.ends, lang)} <strong className="ek-math">{c.gridRule.k}</strong></> :
    say(c.gridRule.kind === "even" ? TX.even : TX.odd, lang);
  return (
    <EngineRoot name="patterns" ageBand={ageBand} mode={c.mode}>
      {c.mode === "repeat" && (
        <>
          <Prompt>{say(TX.repeat, lang)}</Prompt>
          <div className="pt-seq" data-exempt-hit>
            {Array.from({ length: c.shown }, (_, i) => <span key={`s${i}`} className="pt-slot"><Token t={c.core[i % c.core.length]} /></span>)}
            {s.slots.map((tok, i) => {
              const h = hl(`slot:${i}`);
              const show = tok ?? (revealed ? repeatAt(c, i) : null);
              return (
                <button type="button" key={h.key} data-slot={i} className={cls("pt-slot", i === s.slots.indexOf(null) && "is-active", h.cls)} aria-label={`blank ${i + 1}`} onClick={() => clear(i)}>
                  {show ? <Token t={show} /> : "?"}
                </button>
              );
            })}
          </div>
          <div className="ek-row is-wrap" role="group" aria-label="tray">
            {c.tray.map((tok) => (
              <Btn key={tok} target={`tray:${tok}`} hl={hl(`tray:${tok}`).cls} label={tok} onClick={() => place(tok)}><Token t={tok} /></Btn>
            ))}
          </div>
        </>
      )}
      {c.mode === "grow" && (
        <>
          <Prompt>{say(TX.grow, lang)}</Prompt>
          <div className="pt-seq">
            {c.terms.map((x, i) => <span key={`t${i}`} className="pt-slot">{x}</span>)}
            {s.entries.map((e, i) => {
              const h = hl(`slot:${i}`);
              return (
                <button type="button" key={h.key} data-slot={i} className={cls("pt-slot", s.active === i && "is-active", h.cls)} aria-label={`blank ${i + 1}`}
                  onClick={() => setS({ ...s, active: i })}>
                  {e || (revealed ? growAt(c, i) : "?")}
                </button>
              );
            })}
          </div>
          <NumPad value={s.entries[s.active] ?? ""} negative={c.terms.some((x) => x < 0)} lang={lang} maxLen={6}
            onChange={(v) => {
              const entries = [...s.entries];
              entries[s.active] = v;
              setS({ ...s, entries, verdict: null });
            }} />
        </>
      )}
      {c.mode === "grid" && (
        <>
          <Prompt>{ruleText}</Prompt>
          <div className="pt-grid" style={gridStyle}>
            {Array.from({ length: c.gridCount }, (_, i) => {
              const n = c.gridStart + i;
              const h = hl(`cell:${n}`);
              const on = s.marked.has(n);
              return (
                <button type="button" key={h.key} data-cell={n} className={cls("ek-btn", "pt-cell", on && "is-on", revealed && gridMember(c.gridRule, n) && "is-answer", h.cls)} aria-pressed={on} onClick={() => mark(n)}>
                  {n}
                </button>
              );
            })}
          </div>
        </>
      )}
      <div className="ek-row"><CheckBtn lang={lang} onClick={check} disabled={!!c.error} hl={hl("check").cls} /></div>
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: Patterns };
