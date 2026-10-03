// number-line@1 — whole numbers, fractions, decimals and integers on one line (maths M01).
//   place: tap the line (snaps to the nearest tick) or nudge ◀ ▶, then Check: is the marker on the target?
//   read:  a marker sits on the target; the child types its value (any equivalent form counts).
//   jump:  hop from `start` with the jump buttons (+2, −2 …), then Check: did you land on the target?
// Highlight targets: "tick:<k>", "marker", "target", "check", "jump:<i>". Reveal: the target tick is ringed.
import { useMemo, useRef, useState, type MouseEvent } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri } from "../kit/i18n.ts";
import { fmtQ, q, qMul } from "../kit/math.ts";
import { useTracker } from "../kit/tracker.ts";
import { Btn, CheckBtn, cls, EngineRoot, NumPad, Prompt, useEngineError, useHl, useIssues, Verdict } from "../kit/ui.tsx";
import { absErr, fmtValue, indexOf, labelAt, normalize, placeCorrect, placeMisc, readCorrect, valueAt } from "./numberLine.logic.ts";

const def = defineEngine({
  id: "number-line@1",
  title: "Number line",
  subjects: ["maths"],
  params: {
    mode: { type: "string", enum: ["place", "read", "jump", ...GENERIC_MODES], default: "place", doc: "place a value, read a marker, or jump from start" },
    numberKind: { type: "string", enum: ["whole", "fraction", "decimal", "integer"], doc: "default: inferred from target" },
    min: { type: "string", doc: "left end as a MathValue ('0', '-5', '1/2'); default from the values" },
    max: { type: "string", doc: "right end as a MathValue; default from the values" },
    partition: { type: "number", min: 1, max: 24, doc: "ticks per unit (fraction/decimal lines), e.g. 4 for quarters" },
    step: { type: "number", min: 1, max: 1000, doc: "whole-number tick spacing, e.g. 10" },
    target: { type: "string", doc: "the value to place / read / reach, as a MathValue ('3/4', '0.7', '-3')" },
    start: { type: "string", doc: "jump mode: where the hopper starts" },
    jumps: { type: "array", doc: "jump mode: jump sizes as MathValues, e.g. ['1', '5'] (default: one tick)" },
    labels: { type: "string", enum: ["all", "units", "ends", "none"], doc: "which ticks are labelled (default: all when ≤ 12 ticks)" },
    point: { type: "string", doc: "a labelled point drawn on the line (e.g. the number to round)" },
    round: { type: "number", min: 10, max: 100000, doc: "rounding task: round `point` to this unit (10/100/1000…); the target is computed, never passed" },
    question: { type: "string", doc: "what the child is shown instead of the target, e.g. '46 + 25' or '2, 5, 8, 11, …' (digits/operators only)" },
  },
  emits: ["nl.place", "nl.jump", "nl.read"],
});

const TX = {
  place: tri("Put the marker on", "Marker ko yahan rakho:", "निशान यहाँ रखो:"),
  read: tri("Which number is at the marker?", "Marker par kaunsa number hai?", "निशान पर कौन-सी संख्या है?"),
  jump: tri("Jump to", "Yahan tak koodo:", "यहाँ तक कूदो:"),
  round: tri("Move the marker to the nearest", "Marker ko sabse paas wale par le jao:", "निशान को सबसे पास वाले पर ले जाओ:"),
  solve: tri("Use the line:", "Line par karke dekho:", "रेखा पर करके देखो:"),
  left: tri("move left", "baayein", "बाएँ"),
  right: tri("move right", "daayein", "दाएँ"),
  back: tri("jump back", "peeche koodo", "पीछे कूदो"),
  fwd: tri("jump forward", "aage koodo", "आगे कूदो"),
};

const W0 = 20;
const W1 = 320;
const LINE_Y = 64;

function NumberLine({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  useEngineError(c.error, api);
  const hl = useHl(highlight);
  const key = `${c.mode}|${fmtQ(c.min)}|${fmtQ(c.max)}|${fmtQ(c.unit)}|${c.target ? fmtQ(c.target) : ""}|${fmtQ(c.start)}|${c.point ? fmtQ(c.point) : ""}`;
  const t = useTracker(api, key, { stuckAfterChanges: 20 });
  const startK = indexOf(c, c.start) ?? 0;
  const firstK = c.mode === "jump" ? startK : c.point ? indexOf(c, c.point) : null;
  const [state, setState] = useState({ key, k: firstK as number | null, hops: [] as [number, number][], entry: "", verdict: null as boolean | null });
  if (state.key !== key) setState({ key, k: firstK, hops: [], entry: "", verdict: null });
  const svgRef = useRef<SVGSVGElement>(null);
  const xOf = (k: number) => W0 + ((W1 - W0) * k) / c.ticks;
  const targetK = c.target ? indexOf(c, c.target) : null;
  const k = state.k;

  const moveTo = (nk: number, via: string) => {
    if (nk < 0 || nk > c.ticks || t.done) return;
    setState((s) => ({ ...s, k: nk, verdict: null }));
    const v = valueAt(c, nk);
    t.change("nl.place", { value: fmtValue(c, v), via });
  };
  const tapLine = (e: MouseEvent<SVGSVGElement>) => {
    if (c.mode !== "place") return;
    const box = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 340;
    moveTo(Math.round(((x - W0) / (W1 - W0)) * c.ticks), "tap");
  };
  const hop = (size: number) => {
    if (t.done || k === null) return;
    const nk = k + size;
    if (nk < 0 || nk > c.ticks) return;
    setState((s) => ({ ...s, k: nk, hops: [...s.hops, [k, nk]], verdict: null }));
    t.change("nl.jump", { from: fmtValue(c, valueAt(c, k)), to: fmtValue(c, valueAt(c, nk)), size: fmtValue(c, qMul(c.unit, q(size, 1))) });
  };
  const check = () => {
    if (!c.target) return;
    if (c.mode === "read") {
      const ok = readCorrect(c, state.entry);
      setState((s) => ({ ...s, verdict: ok }));
      t.answer({ kind: "nl.read", value: state.entry, target_shown: true }, ok, goal || `read ${fmtValue(c, c.target)}`);
      return;
    }
    if (k === null) return;
    const ok = placeCorrect(c, k);
    setState((s) => ({ ...s, verdict: ok }));
    const misc = placeMisc(c, k);
    t.answer(
      { kind: c.mode === "jump" ? "nl.jump" : "nl.place", value: fmtValue(c, valueAt(c, k)), abs_err: Math.round(absErr(c, k) * 1e4) / 1e4, hops: state.hops.length, ...(misc && { misc }) },
      ok,
      goal || `${c.mode} ${fmtValue(c, c.target)}`,
    );
  };

  const hideAids = c.hideAnswer && !revealed && state.verdict === null;
  const showTargetText = c.mode !== "read" && c.target && !c.roundTo && !c.question;
  const ringK = (revealed || (c.mode === "read")) && targetK !== null ? targetK : null;
  const big = c.ticks <= 20;
  return (
    <EngineRoot name="number-line" ageBand={ageBand} mode={c.mode}>
      <Prompt>
        {c.question ? <>{say(TX.solve, lang)} <strong className="ek-math" data-question>{c.question}</strong></> : c.roundTo ? <>{say(TX.round, lang)} <strong className="ek-math">{c.roundTo}</strong> · <strong className="ek-math">{fmtValue(c, c.point!)}</strong></> : c.mode === "read" ? say(TX.read, lang) : say(c.mode === "jump" ? TX.jump : TX.place, lang)}{" "}
        {showTargetText && <strong key={hl("target").key} className={cls("ek-math", hl("target").cls)}>{fmtValue(c, c.target!)}</strong>}
      </Prompt>
      <svg
        ref={svgRef}
        className={cls("ek-svg", "nl-svg", c.mode === "place" && "is-tappable")}
        viewBox="0 0 340 110"
        role={c.mode === "place" ? "slider" : "img"}
        aria-label={`number line ${fmtValue(c, c.min)} to ${fmtValue(c, c.max)}`}
        aria-valuemin={0}
        aria-valuemax={c.ticks}
        aria-valuenow={k ?? undefined}
        aria-valuetext={k !== null && !hideAids ? fmtValue(c, valueAt(c, k)) : undefined}
        tabIndex={c.mode === "place" ? 0 : undefined}
        onKeyDown={(e) => {
          if (c.mode !== "place") return;
          if (e.key === "ArrowLeft") moveTo((k ?? 0) - 1, "keys");
          if (e.key === "ArrowRight") moveTo((k ?? -1) + 1, "keys");
        }}
        onClick={tapLine}
      >
        <line className="nl-axis" x1={W0 - 8} y1={LINE_Y} x2={W1 + 8} y2={LINE_Y} />
        {Array.from({ length: c.ticks + 1 }, (_, i) => {
          const label = labelAt(c, i);
          const h = hl(`tick:${i}`);
          const isUnit = valueAt(c, i).d === 1;
          return (
            <g key={h.key} className={cls("nl-tick", h.cls)} data-tick={i}>
              <line x1={xOf(i)} x2={xOf(i)} y1={LINE_Y - (isUnit ? 12 : 8)} y2={LINE_Y + (isUnit ? 12 : 8)} />
              {label && (
                <text x={xOf(i)} y={LINE_Y + 34} className={cls("nl-label", big && "is-big")} textAnchor="middle">
                  {label}
                </text>
              )}
            </g>
          );
        })}
        {state.hops.map(([a, b], i) => (
          <path key={i} className="nl-hop" d={`M ${xOf(a)} ${LINE_Y - 6} Q ${(xOf(a) + xOf(b)) / 2} ${LINE_Y - 40} ${xOf(b)} ${LINE_Y - 6}`} />
        ))}
        {ringK !== null && <circle className="nl-ring" data-target="target" cx={xOf(ringK)} cy={LINE_Y} r={10} />}
        {c.point && indexOf(c, c.point) !== null && (
          <g key={hl("point").key} className={cls("nl-point", hl("point").cls)} data-target="point">
            <circle cx={xOf(indexOf(c, c.point)!)} cy={LINE_Y} r={6} />
            <text x={xOf(indexOf(c, c.point)!)} y={LINE_Y + 34} textAnchor="middle" className="nl-label is-big">{fmtValue(c, c.point)}</text>
          </g>
        )}
        {k !== null && c.mode !== "read" && (
          <g key={hl("marker").key} className={cls("nl-marker", hl("marker").cls)} data-marker={k}>
            <path d={`M ${xOf(k)} ${LINE_Y - 4} l -9 -18 h 18 z`} />
          </g>
        )}
      </svg>
      {c.mode === "place" && (
        <div className="ek-row">
          <Btn kind="round" label={say(TX.left, lang)} target="left" onClick={() => moveTo((k ?? 1) - 1, "nudge")}>◀</Btn>
          {/* predict: the marker's value is an answer-bearing aid (nudge until it reads the target): hidden until a verdict or reveal */}
          <output className="ek-readout" aria-live="polite" data-hidden={hideAids ? "readout" : undefined}>{k !== null && !hideAids ? fmtValue(c, valueAt(c, k)) : "?"}</output>
          <Btn kind="round" label={say(TX.right, lang)} target="right" onClick={() => moveTo((k ?? -1) + 1, "nudge")}>▶</Btn>
        </div>
      )}
      {c.mode === "jump" && (
        <div className="ek-row is-wrap">
          {c.jumps.map((j, i) => {
            const s = qMul(j, q(c.unit.d, c.unit.n)).n;
            return [
              <Btn key={`b${i}`} label={`${say(TX.back, lang)} ${fmtValue(c, j)}`} target={`jump:${i}:back`} hl={hl(`jump:${i}`).cls} onClick={() => hop(-s)}>−{fmtValue(c, j)}</Btn>,
              <Btn key={`f${i}`} label={`${say(TX.fwd, lang)} ${fmtValue(c, j)}`} target={`jump:${i}`} hl={hl(`jump:${i}`).cls} onClick={() => hop(s)}>+{fmtValue(c, j)}</Btn>,
            ];
          })}
        </div>
      )}
      {c.mode === "read" && (
        <NumPad value={state.entry} onChange={(entry) => setState((s) => ({ ...s, entry, verdict: null }))} lang={lang}
          fraction={c.kind === "fraction"} decimal={c.kind === "decimal"} negative={c.kind === "integer"} />
      )}
      <div className="ek-row">
        <CheckBtn lang={lang} onClick={check} hl={hl("check").cls} disabled={!c.target || (c.mode === "read" ? !state.entry : k === null)} />
      </div>
      <Verdict ok={state.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: NumberLine };
