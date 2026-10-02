// fraction-bars@1 — 1-3 bars cut into equal parts. Shade mode: the child taps parts (or uses −/+) to show
// a fraction; goal_met fires when the target bar shows the target. Compare mode: the bars are pre-shaded
// and the child taps the bigger (or smaller) one, or "same". Concrete → pictorial step for fractions.
//
// Highlight targets: "bar:N", "bar:N:part:K", "label:N", "same" (N, K from 0).
// Reveal: shade mode outlines the target on the target bar; compare mode marks the right answer.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { EngineDef } from "../../../../shared/contracts.ts";
import type { EngineModule, EngineProps } from "../engine.ts";
import {
  compareCorrect,
  correctBars,
  countShaded,
  fmt,
  goalReached,
  initialShading,
  normalizeConfig,
  partsForTarget,
  step,
  STUCK_AFTER_CHANGES,
  STUCK_AFTER_WRONG,
  toggle,
  type BarsConfig,
  type Choice,
} from "./fractionBars.logic.ts";

const def: EngineDef = {
  id: "fraction-bars@1",
  title: "Fraction bars",
  subjects: ["maths"],
  params: {
    denominators: { type: "array", default: [4], doc: "parts per bar, 1-3 bars, each 1-12" },
    numerators: { type: "array", default: [], doc: "parts shaded at the start, per bar (missing = 0)" },
    locked: { type: "array", default: [], doc: "per bar: true = the child cannot change it (a reference bar)" },
    mode: { type: "string", enum: ["shade", "compare"], default: "shade", doc: "shade: tap parts; compare: tap the bigger/smaller bar" },
    target: { type: "string", doc: "shade mode goal as 'n/d', e.g. '3/4'; absent = free play" },
    targetBar: { type: "number", min: 0, max: 2, doc: "bar the target is checked on (default: first unlocked bar)" },
    equivalentOk: { type: "boolean", default: true, doc: "goal accepts equivalent fractions (2/4 for 1/2)" },
    question: { type: "string", enum: ["bigger", "smaller"], default: "bigger", doc: "compare mode question" },
    showLabels: { type: "boolean", default: true, doc: "show n/d above each bar (reveal always shows them)" },
  },
  emits: ["shade_changed", "compare_answer", "goal_met", "stuck", "params_adjusted"],
};

const TEXT: Record<string, Record<string, string>> = {
  bigger: { english: "Tap the bigger one", hinglish: "Bada wala tap karo", hindi: "बड़ा वाला छुओ" },
  smaller: { english: "Tap the smaller one", hinglish: "Chhota wala tap karo", hindi: "छोटा वाला छुओ" },
  same: { english: "Same", hinglish: "Barabar", hindi: "बराबर" },
};
const say = (key: string, lang: string) => TEXT[key][lang] ?? TEXT[key].english;
const cls = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");

const W = 320;
const H = 64;
const GAP = 3;

function FractionBars({ params, goal, lang, highlight, revealed, api }: EngineProps) {
  const cfg = useMemo(() => normalizeConfig(params), [params]);
  const need = partsForTarget(cfg);

  // Re-cut the bars when their structure changes (set_param on denominators/numerators/mode); other
  // params (labels, target) keep the child's work.
  const structure = `${cfg.mode}|${cfg.denominators.join(",")}|${cfg.numerators.join(",")}`;
  const [shading, setShading] = useState(() => initialShading(cfg));
  const [choice, setChoice] = useState<Choice | null>(null);
  const [seen, setSeen] = useState(structure);
  if (seen !== structure) {
    setSeen(structure);
    setShading(initialShading(cfg));
    setChoice(null);
  }
  const progress = useRef({ changes: 0, wrong: 0, goalSent: false, stuckSent: false });
  useEffect(() => {
    progress.current = { changes: 0, wrong: 0, goalSent: false, stuckSent: false };
  }, [structure]);

  useEffect(() => {
    if (cfg.issues.length) api.interaction("params_adjusted", { issues: cfg.issues });
    if (cfg.target && need === null) {
      const d = cfg.denominators[cfg.targetBar];
      api.error(`target ${fmt(cfg.target)} cannot be shown on bar ${cfg.targetBar + 1} (${d} parts)`);
    }
  }, [cfg, need, api]);

  const fractions = cfg.denominators.map((d, i) => ({ n: countShaded(shading[i]), d }));

  function shade(next: boolean[][], bar: number) {
    if (next === shading) return;
    setShading(next);
    const p = progress.current;
    p.changes++;
    const n = countShaded(next[bar]);
    const d = cfg.denominators[bar];
    api.interaction("shade_changed", { bar, shaded: n, parts: d, fraction: `${n}/${d}` });
    if (!cfg.target || p.goalSent) return;
    if (bar === cfg.targetBar && goalReached(cfg, next)) {
      p.goalSent = true;
      api.goalMet(goal || `shade ${fmt(cfg.target)}`);
    } else if (p.changes >= STUCK_AFTER_CHANGES && !p.stuckSent) {
      p.stuckSent = true;
      api.stuck("many_changes_without_goal");
    }
  }

  function choose(c: Choice) {
    setChoice(c);
    const correct = compareCorrect(fractions, cfg.question, c);
    api.answer({ kind: "compare_answer", question: cfg.question, choice: c, fractions: fractions.map(fmt) }, correct);
    const p = progress.current;
    if (correct && !p.goalSent) {
      p.goalSent = true;
      api.goalMet(goal || `compare ${cfg.question}`);
    } else if (!correct && ++p.wrong >= STUCK_AFTER_WRONG && !p.stuckSent) {
      p.stuckSent = true;
      api.stuck("repeated_wrong_compare");
    }
  }

  const hl = highlight?.target ?? "";
  const seq = highlight?.seq ?? 0;
  const compare = cfg.mode === "compare";
  const answers = revealed && compare ? correctBars(fractions, cfg.question) : [];
  const sameIsAnswer = revealed && compare && compareCorrect(fractions, cfg.question, "same");

  return (
    <div className="fb" data-mode={cfg.mode}>
      {compare && <p className="fb-prompt">{say(cfg.question, lang)}</p>}
      {cfg.denominators.map((d, b) => (
        <Bar
          key={b}
          index={b}
          d={d}
          row={shading[b]}
          cfg={cfg}
          hl={hl}
          seq={seq}
          ghost={revealed && !compare && b === cfg.targetBar ? need : null}
          showLabel={cfg.showLabels || revealed}
          selected={choice === b}
          isAnswer={answers.includes(b)}
          onToggle={(k) => shade(toggle(shading, b, k), b)}
          onStep={(dir) => shade(step(shading, b, dir), b)}
          onChoose={() => choose(b)}
        />
      ))}
      {compare && (
        <button
          type="button"
          key={hl === "same" ? `same-${seq}` : "same"}
          className={cls("fb-same", choice === "same" && "is-selected", hl === "same" && "is-highlight", sameIsAnswer && "is-answer")}
          aria-pressed={choice === "same"}
          onClick={() => choose("same")}
        >
          {say("same", lang)}
        </button>
      )}
    </div>
  );
}

interface BarProps {
  index: number;
  d: number;
  row: boolean[];
  cfg: BarsConfig;
  hl: string;
  seq: number;
  /** Parts to outline as the revealed target (shade mode), or null. */
  ghost: number | null;
  showLabel: boolean;
  selected: boolean;
  isAnswer: boolean;
  onToggle(part: number): void;
  onStep(dir: 1 | -1): void;
  onChoose(): void;
}

function Bar({ index, d, row, cfg, hl, seq, ghost, showLabel, selected, isAnswer, onToggle, onStep, onChoose }: BarProps) {
  const n = countShaded(row);
  const compare = cfg.mode === "compare";
  const editable = !compare && !cfg.locked[index];
  const partW = W / d;
  const key = (k: number) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(k);
    }
  };

  const head = (
    <div className="fb-head">
      {showLabel ? (
        <span key={hl === `label:${index}` ? `l${seq}` : "l"} className={cls("fb-label", hl === `label:${index}` && "is-highlight")}>
          {n}/{d}
        </span>
      ) : (
        <span />
      )}
      {editable && (
        <span className="fb-steps">
          <button type="button" className="fb-step" aria-label="shade one part less" disabled={n === 0} onClick={() => onStep(-1)}>
            −
          </button>
          <button type="button" className="fb-step" aria-label="shade one part more" disabled={n === d} onClick={() => onStep(1)}>
            +
          </button>
        </span>
      )}
      {isAnswer && <span className="fb-tick" aria-label="right answer">✓</span>}
    </div>
  );

  const svg = (
    <svg className="fb-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${n} of ${d} parts shaded`}>
      {row.map((on, k) => {
        const partHl = hl === `bar:${index}:part:${k}`;
        return (
          <rect
            key={partHl ? `${k}-${seq}` : k}
            data-part={k}
            x={k * partW + GAP / 2}
            y={GAP}
            width={partW - GAP}
            height={H - 2 * GAP}
            rx={5}
            className={cls("fb-part", on && "is-on", partHl && "is-highlight", ghost !== null && k < ghost && "is-ghost", editable && "is-editable")}
            {...(editable && {
              role: "button",
              tabIndex: 0,
              "aria-pressed": on,
              "aria-label": `part ${k + 1} of ${d}`,
              onClick: () => onToggle(k),
              onKeyDown: key(k),
            })}
          />
        );
      })}
      {hl === `bar:${index}` && <rect key={`o${seq}`} className="fb-outline is-highlight" x={1} y={1} width={W - 2} height={H - 2} rx={7} />}
    </svg>
  );

  if (compare) {
    return (
      <button
        type="button"
        data-bar={index}
        className={cls("fb-bar", "fb-choice", selected && "is-selected", isAnswer && "is-answer")}
        aria-pressed={selected}
        aria-label={`bar ${index + 1}${showLabel ? `, ${n}/${d}` : ""}`}
        onClick={onChoose}
      >
        {head}
        {svg}
      </button>
    );
  }
  return (
    <div className="fb-bar" data-bar={index}>
      {head}
      {svg}
    </div>
  );
}

export const engine: EngineModule = { def, Component: FractionBars };
