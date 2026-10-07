// fractions@1 — fractions on bars or circles (maths M04).
//   make:       tap parts (or −/+) to shade the target, Check.
//   compare:    2-3 shaded shapes; tap the bigger (smaller) one or "same". Wrong picks log bigger_denominator /
//               count_pieces facts.
//   equivalent: the given fraction is shown; cut the second shape into a different number of parts (−/+ parts)
//               and shade the same amount, Check.
//   add:        two operands are shown; shade their sum on the result shape(s), Check (add_across is logged).
//   name:       a fixed shape with some parts shaded; set the top (shaded parts) and bottom (equal parts) of the
//               fraction, Check (any equal value is right). Round 2 content: "a roti cut into 4 equal pieces, what
//               fraction is one piece?" had no mode to bind to.
//   of:         a set of N objects; split it into equal groups (−/+ groups), then give a/b of N, Check. The verdict is on
//               the number only (grouping is the tool, not the answer); unit_fraction_only / wrong_operation are logged.
// Highlight targets: "shape:<i>", "part:<i>:<k>", "label:<i>", "parts", "check", "same". Reveal: the answer.
import { useMemo, useState } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri, W } from "../kit/i18n.ts";
import { q, qEq, type Q } from "../kit/math.ts";
import { useTracker } from "../kit/tracker.ts";
import { Btn, CheckBtn, cls, EngineRoot, Prompt, Stepper, useEngineError, useHl, useIssues, Verdict } from "../kit/ui.tsx";
import { addCorrect, addMisc, compareCorrect, compareMisc, equivalentCorrect, fmt, makeCorrect, nameCorrect, normalize, ofCorrect, ofMisc, ofValue } from "./fractions.logic.ts";

const def = defineEngine({
  id: "fractions@1",
  title: "Fractions",
  subjects: ["maths"],
  params: {
    mode: { type: "string", enum: ["make", "compare", "equivalent", "add", "name", "of", ...GENERIC_MODES], default: "make", doc: "make / compare / equivalent / add / name / of" },
    model: { type: "string", enum: ["bar", "circle"], doc: "bar (default) or circle (part-whole); default from representation" },
    target: { type: "string", doc: "make: 'n/d' to shade; equivalent: the given fraction" },
    parts: { type: "number", min: 1, max: 24, doc: "make: parts the shape is cut into (default: the target's denominator); equivalent: fix the second shape's parts ('1/3 = ?/6')" },
    fractions: { type: "array", doc: "compare: 2-3 fractions; add: the two operands ('1/4' or [1, 4])" },
    operands: { type: "array", doc: "add: the two operands (alias of fractions)" },
    question: { type: "string", enum: ["bigger", "smaller"], default: "bigger", doc: "compare question" },
    equivalentOk: { type: "boolean", default: true, doc: "make: accept equivalent shadings (2/4 for 1/2)" },
    shaded: { type: "number", min: 1, max: 24, doc: "name: parts shaded on the fixed shape (default: the target's numerator scaled to parts)" },
    count: { type: "number", min: 2, max: 60, doc: "of: how many objects in the set" },
  },
  emits: ["fr.shade", "fr.compare", "fr.refine", "fr.add", "fr.name", "fr.of"],
});

const TX = {
  make: tri("Shade", "Rang bharo:", "रंग भरो:"),
  equivalent: tri("Cut the second one differently and shade the same amount as", "Doosre ko alag tukdon mein kaato aur utna hi rang bharo jitna", "दूसरे को अलग टुकड़ों में काटो और उतना ही रंग भरो जितना"),
  add: tri("Shade the answer", "Jawab mein rang bharo", "जवाब में रंग भरो"),
  parts: tri("Parts", "Tukde", "टुकड़े"),
  shaded: tri("Shaded", "Rang", "रंग"),
  name: tri("What fraction is shaded?", "Kitna hissa rang hua hai?", "कितना हिस्सा रंगा है?"),
  top: tri("Shaded parts", "Rang wale tukde", "रंग वाले टुकड़े"),
  bottom: tri("Equal parts", "Barabar tukde", "बराबर टुकड़े"),
  of: tri("of", "ka", "का"),
  groups: tri("Groups", "Group", "समूह"),
  answer: tri("Answer", "Jawab", "जवाब"),
};

const BW = 300;
const BH = 64;

function Shape({ model, parts, on, onTap, ghost, idx, hlOf, label }: {
  model: "bar" | "circle"; parts: number; on: boolean[]; onTap?: (k: number) => void; ghost?: number | null; idx: number;
  hlOf: ReturnType<typeof useHl>; label: string;
}) {
  const h = hlOf(`shape:${idx}`);
  const part = (k: number) => {
    const ph = hlOf(`part:${idx}:${k}`);
    const props = {
      "data-part": k,
      className: cls("fr-part", on[k] && "is-on", onTap && "is-tap", ghost != null && k < ghost && "is-ghost", ph.cls),
      onClick: onTap ? () => onTap(k) : undefined,
    };
    if (model === "bar") return <rect key={ph.key} {...props} x={2 + (k * (BW - 4)) / parts} y={2} width={(BW - 4) / parts} height={BH - 4} />;
    if (parts === 1) return <circle key={ph.key} {...props} cx={80} cy={80} r={74} />;
    const a0 = (2 * Math.PI * k) / parts - Math.PI / 2;
    const a1 = (2 * Math.PI * (k + 1)) / parts - Math.PI / 2;
    const p = (a: number) => `${80 + 74 * Math.cos(a)} ${80 + 74 * Math.sin(a)}`;
    return <path key={ph.key} {...props} d={`M 80 80 L ${p(a0)} A 74 74 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)} Z`} />;
  };
  return (
    <svg key={h.key} className={cls("ek-svg", "fr-svg", h.cls)} viewBox={model === "bar" ? `0 0 ${BW} ${BH}` : "0 0 160 160"} role="img" aria-label={label} data-shape={idx}
      style={model === "circle" ? { maxWidth: 170 } : undefined}>
      {on.map((_, k) => part(k))}
    </svg>
  );
}

const fill = (n: number, parts: number) => Array.from({ length: parts }, (_, k) => k < n);

function Fractions({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  useEngineError(c.error, api);
  const hl = useHl(highlight);
  const key = `${c.mode}|${c.model}|${c.fractions.map(fmt).join(",")}|${c.target ? fmt(c.target) : ""}|${c.parts}|${c.question}|${c.shaded}|${c.count}`;
  const t = useTracker(api, key, { stuckAfterChanges: 20 });
  const fixedParts = c.mode === "equivalent" && c.parts > 0;
  const startParts = c.mode === "equivalent" ? (fixedParts ? c.parts : c.target ? c.target.d * 2 : 4) : c.parts;
  const [s, setS] = useState({ key, on: fill(0, startParts * c.wholes), parts: startParts, pick: null as string | null, verdict: null as boolean | null });
  if (s.key !== key) setS({ key, on: fill(0, startParts * c.wholes), parts: startParts, pick: null, verdict: null });
  // name: the fraction the child builds; of: the groups the set is split into and the number given
  const [nm, setNm] = useState({ key, top: 0, bottom: 1, groups: 1, value: 0 });
  if (nm.key !== key) setNm({ key, top: 0, bottom: 1, groups: 1, value: 0 });
  const setN = (patch: Partial<typeof nm>, act: string) => {
    if (t.done) return;
    setNm({ ...nm, ...patch });
    setS({ ...s, verdict: null });
    t.change(act, { ...nm, ...patch, key: undefined });
  };
  const shaded = s.on.filter(Boolean).length;

  const shade = (on: boolean[]) => {
    if (t.done) return;
    setS({ ...s, on, verdict: null });
    t.change("fr.shade", { shaded: on.filter(Boolean).length, parts: s.parts, wholes: c.wholes });
  };
  const toggle = (k: number) => shade(s.on.map((v, i) => (i === k ? !v : v)));
  const step = (d: 1 | -1) => {
    const n = Math.max(0, Math.min(s.on.length, shaded + d));
    shade(fill(n, s.on.length));
  };
  const reparts = (parts: number) => {
    if (t.done) return;
    setS({ ...s, parts, on: fill(0, parts), verdict: null });
    t.change("fr.refine", { from_d: s.parts, to_d: parts });
  };
  const commit = () => {
    const g = goal || `${c.mode} ${c.target ? fmt(c.target) : ""}`.trim();
    if (c.mode === "make") {
      const ok = makeCorrect(c, shaded, s.parts);
      setS({ ...s, verdict: ok });
      t.answer({ kind: "fr.make", shaded, parts: s.parts, value: `${shaded}/${s.parts}`, target: fmt(c.target!) }, ok, g);
    } else if (c.mode === "equivalent") {
      const ok = equivalentCorrect(c.target!, shaded, s.parts);
      setS({ ...s, verdict: ok });
      t.answer({ kind: "fr.equivalent", value: `${shaded}/${s.parts}`, given: fmt(c.target!), same_value: qEq(q(shaded, s.parts), c.target!) }, ok, g);
    } else if (c.mode === "name") {
      const ok = nameCorrect(c, nm.top, nm.bottom);
      setS({ ...s, verdict: ok });
      t.answer({ kind: "fr.name", value: `${nm.top}/${nm.bottom}`, shaded: c.shaded, parts: c.parts }, ok, g);
    } else if (c.mode === "of") {
      const ok = ofCorrect(c, nm.value);
      const misc = ofMisc(c, nm.value);
      setS({ ...s, verdict: ok });
      t.answer({ kind: "fr.of", value: nm.value, groups: nm.groups, count: c.count, of: fmt(c.target!), ...(misc && { misc }) }, ok, g);
    } else if (c.mode === "add") {
      const ok = addCorrect(c, shaded, s.parts);
      const misc = addMisc(c, shaded, s.parts);
      setS({ ...s, verdict: ok });
      t.answer({ kind: "fr.add", value: `${shaded}/${s.parts}`, operands: c.fractions.map(fmt), ...(misc && { misc }) }, ok, g);
    }
  };
  const choose = (pick: string) => {
    const ok = compareCorrect(c.fractions, c.question, pick);
    const misc = compareMisc(c.fractions, c.question, pick);
    setS({ ...s, pick, verdict: ok });
    t.answer({ kind: "fr.compare", chosen: pick, fractions: c.fractions.map(fmt), question: c.question, ...(misc && { misc }) }, ok, goal || `compare ${c.question}`);
  };

  const labelOf = (f: Q, i: number) => {
    const h = hl(`label:${i}`);
    return <span key={h.key} className={cls("fr-label", h.cls)}>{fmt(f)}</span>;
  };
  const steppers = (
    <div className="ek-row">
      <Btn kind="round" label="shade one part less" target="less" onClick={() => step(-1)} disabled={shaded === 0}>−</Btn>
      <output className="ek-readout" aria-live="polite">{shaded}</output>
      <Btn kind="round" label="shade one part more" target="more" onClick={() => step(1)} disabled={shaded === s.on.length}>+</Btn>
    </div>
  );
  const ghost = revealed && c.target ? Math.round((c.target.n * s.parts) / c.target.d) : null;

  return (
    <EngineRoot name="fractions" ageBand={ageBand} mode={c.mode}>
      {c.mode === "make" && c.target && (
        <>
          <Prompt>{say(TX.make, lang)} {labelOf(c.target, 0)}</Prompt>
          <div className="fr-shapes" data-exempt-hit>
            <Shape model={c.model} parts={s.parts} on={s.on} onTap={toggle} ghost={ghost} idx={0} hlOf={hl} label={`${shaded} of ${s.parts} parts shaded`} />
          </div>
          {steppers}
        </>
      )}
      {c.mode === "compare" && (
        <>
          <Prompt>{say(c.question === "bigger" ? W.bigger : W.smaller, lang)}</Prompt>
          <div className="fr-shapes">
            {c.fractions.map((f, i) => {
              const answer = revealed && compareCorrect(c.fractions, c.question, String(i));
              return (
                <button type="button" key={i} data-choice={i} className={cls("fr-shape", "ek-btn", s.pick === String(i) && "is-selected", answer && "is-answer")} aria-pressed={s.pick === String(i)} onClick={() => choose(String(i))}>
                  {labelOf(f, i)}
                  {/* predict: the drawn shapes answer the comparison: they appear after the pick or the reveal */}
                  {!c.hideAnswer || revealed || s.pick !== null ? <Shape model={c.model} parts={f.d} on={fill(f.n, f.d)} idx={i} hlOf={hl} label={`${f.n} of ${f.d} parts shaded`} /> : <span className="ek-note" data-hidden="shape">?</span>}
                  {answer && <span className="ek-tick">✓</span>}
                </button>
              );
            })}
          </div>
          <div className="ek-row">
            <Btn target="same" pressed={s.pick === "same"} hl={cls(hl("same").cls, revealed && compareCorrect(c.fractions, c.question, "same") && "is-answer")} onClick={() => choose("same")}>{say(W.same, lang)}</Btn>
          </div>
        </>
      )}
      {c.mode === "equivalent" && c.target && (
        <>
          <Prompt>{say(TX.equivalent, lang)} {labelOf(c.target, 0)}</Prompt>
          <div className="fr-shapes" data-exempt-hit>
            <Shape model={c.model} parts={c.target.d} on={fill(c.target.n, c.target.d)} idx={0} hlOf={hl} label={fmt(c.target)} />
            <Shape model={c.model} parts={s.parts} on={s.on} onTap={toggle} ghost={ghost} idx={1} hlOf={hl} label={`${shaded} of ${s.parts} parts shaded`} />
          </div>
          {!fixedParts && <Stepper label={say(TX.parts, lang)} value={s.parts} min={2} max={24} onChange={reparts} target="parts" hl={hl("parts").cls} lang={lang} />}
          {steppers}
        </>
      )}
      {c.mode === "add" && c.target && (
        <>
          <Prompt>
            {labelOf(c.fractions[0], 0)} + {labelOf(c.fractions[1], 1)} = ? · {say(TX.add, lang)}
          </Prompt>
          <div className="fr-shapes" data-exempt-hit>
            {c.fractions.map((f, i) => (
              <Shape key={i} model={c.model} parts={f.d} on={fill(f.n, f.d)} idx={i} hlOf={hl} label={fmt(f)} />
            ))}
          </div>
          <div className="fr-shapes" data-exempt-hit>
            {Array.from({ length: c.wholes }, (_, w) => (
              <Shape key={w} model={c.model} parts={s.parts} on={s.on.slice(w * s.parts, (w + 1) * s.parts)} onTap={(k) => toggle(w * s.parts + k)}
                ghost={ghost !== null ? Math.max(0, Math.min(s.parts, ghost - w * s.parts)) : null} idx={2 + w} hlOf={hl} label={`result ${w + 1}`} />
            ))}
          </div>
          {steppers}
        </>
      )}
      {c.mode === "name" && c.target && (
        <>
          <Prompt>{say(TX.name, lang)}</Prompt>
          <div className="fr-shapes" data-exempt-hit>
            <Shape model={c.model} parts={c.parts} on={fill(c.shaded, c.parts)} idx={0} hlOf={hl} label={`${c.shaded} of ${c.parts} equal parts shaded`} />
          </div>
          <Stepper label={say(TX.top, lang)} value={nm.top} min={0} max={24} onChange={(v) => setN({ top: v }, "fr.name.top")} target="top" hl={hl("top").cls} lang={lang} />
          <Stepper label={say(TX.bottom, lang)} value={nm.bottom} min={1} max={24} onChange={(v) => setN({ bottom: v }, "fr.name.bottom")} target="bottom" hl={hl("bottom").cls} lang={lang} />
          <output className="ek-readout fr-built" aria-live="polite" data-built>{nm.top}/{nm.bottom}</output>
          {revealed && <span className="ek-note" data-reveal>{fmt(c.target)}</span>}
        </>
      )}
      {c.mode === "of" && c.target && (
        <>
          <Prompt>{labelOf(c.target, 0)} {say(TX.of, lang)} {c.count} = ?</Prompt>
          <div className="fr-set" data-exempt-hit role="img" aria-label={`${c.count} objects in ${nm.groups} group(s)`} data-groups={nm.groups}>
            {Array.from({ length: nm.groups }, (_, g) => {
              const per = Math.floor(c.count / nm.groups);
              const n = g < nm.groups - 1 ? per : c.count - per * (nm.groups - 1);
              const h = hl(`group:${g}`);
              return (
                <span key={h.key} className={cls("fr-group", h.cls)} data-group={g}>
                  {Array.from({ length: n }, (_, k) => <span key={k} className="fr-dot" />)}
                </span>
              );
            })}
          </div>
          {c.count % nm.groups !== 0 && <span className="ek-note" data-note="uneven">{c.count} ÷ {nm.groups} ≠ ✓</span>}
          <Stepper label={say(TX.groups, lang)} value={nm.groups} min={1} max={12} onChange={(v) => setN({ groups: v }, "fr.of.groups")} target="groups" hl={hl("groups").cls} lang={lang} />
          <Stepper label={say(TX.answer, lang)} value={nm.value} min={0} max={c.count} onChange={(v) => setN({ value: v }, "fr.of.value")} target="answer" hl={hl("answer").cls} lang={lang} />
          {revealed && <span className="ek-note" data-reveal>{ofValue(c)}</span>}
        </>
      )}
      {c.mode !== "compare" && <div className="ek-row"><CheckBtn lang={lang} onClick={commit} disabled={!!c.error} hl={hl("check").cls} /></div>}
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: Fractions };
