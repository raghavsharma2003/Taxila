// Kyun-Lab · fair test (DESIGN.md §3.4). Two set-ups side by side with condition chips; the fair-test meter counts the
// conditions that differ; predict → run → conclude. Outcomes come from the reviewed causal models in labs.ts. PURE.
//
// Goals: "fair" (both set-ups start the same: make them differ in the tested condition only, predict, run, conclude) ·
// "predict" (a fair pair is given: predict, run, conclude) · "golu" (Golu's test changed two things: say what can be
// concluded — nothing — then fix it).
// Mal-rules: the lab's beliefs (needs-soil-light, more-water-better, warmth-irrelevant, only-temperature, heavy-faster,
// pull-changes-period, one-of-air-water, shadow-same-size, black-attracts-heat, sinker-never-floats, heavy-sinks,
// wool-makes-heat, metal-is-colder, all-metals-magnetic, magnet-needs-touch, water-never-conducts, only-metals-conduct,
// only-age-spoils, food-from-soil, light-only) and many-at-once (concluding a cause from a test that changed several things).
import type { Candidate, FamilyLogic, Facts, GenRequest, LabAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";
import { BINARY_KINDS, LABS, outcomeOf, type LabDef } from "./labs.ts";

export interface LabParams {
  lab: string;
  setups: Record<string, string>[];      // exactly 2
  test: string;                          // the condition under test
  goal: "fair" | "predict" | "golu";
  /** what the level grades on: the design and conclusion (fair-test skill) or the prediction (the idea itself) */
  judge: "design" | "predict";
}
export interface LabState extends Undoable<LabState> {
  setups: Record<string, string>[];
  predicted: string | null;              // "A" | "B" | "same"
  results: number[] | null;              // after a run
  ranDiffs: string[] | null;             // the conditions that differed in the last run
  concluded: string | null;
  done: boolean;
  acts: number;
}
export const LAB_MAL = ["needs-soil-light", "more-water-better", "warmth-irrelevant", "only-temperature", "heavy-faster", "pull-changes-period", "one-of-air-water", "shadow-same-size", "black-attracts-heat", "sinker-never-floats", "heavy-sinks",
  "wool-makes-heat", "metal-is-colder", "all-metals-magnetic", "magnet-needs-touch", "water-never-conducts", "only-metals-conduct", "only-age-spoils", "food-from-soil", "light-only", "many-at-once"] as const;

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
export const labOf = (p: LabParams): LabDef | null => LABS[p.lab] ?? null;
export function diffsOf(lab: LabDef, setups: Record<string, string>[]): string[] {
  return lab.factors.filter((f) => (setups[0][f.id] ?? lab.defaults[f.id]) !== (setups[1][f.id] ?? lab.defaults[f.id])).map((f) => f.id);
}
/** Which set-up comes out "more" by the outcome's own sense (for time: finishes first), or "same". */
export function winner(lab: LabDef, a: number, b: number): "A" | "B" | "same" {
  if (a === b) return "same";
  const aMore = lab.outcome.better === "less" ? a < b : a > b;
  return aMore ? "A" : "B";
}
const predictOf = (lab: LabDef, setups: Record<string, string>[], override?: Record<string, Record<string, number>>) =>
  winner(lab, outcomeOf(lab, setups[0], override), outcomeOf(lab, setups[1], override));

function validate(level: PlayLevel<unknown>): PlayLevel<LabParams> | null {
  const p = level.params as Partial<LabParams> | null;
  if (!p || typeof p.lab !== "string" || !LABS[p.lab] || !Array.isArray(p.setups) || p.setups.length !== 2) return null;
  const lab = LABS[p.lab];
  if (!lab.factors.some((f) => f.id === p.test)) return null;
  if (p.goal !== "fair" && p.goal !== "predict" && p.goal !== "golu") return null;
  const setups = p.setups.map((s) => {
    const o: Record<string, string> = {};
    for (const f of lab.factors) { const v = (s as Record<string, string>)?.[f.id]; o[f.id] = f.levels.some((l) => l.id === v) ? v : lab.defaults[f.id]; }
    return o;
  });
  const d = diffsOf(lab, setups);
  if (p.goal === "fair" && d.length !== 0) return null;
  if (p.goal === "predict" && !(d.length === 1 && d[0] === p.test)) return null;
  if (p.goal === "golu" && !(d.length === 2 && d.includes(p.test as string))) return null;
  return { ...level, params: { lab: p.lab, setups, test: p.test as string, goal: p.goal, judge: p.judge === "predict" ? "predict" : "design" } } as PlayLevel<LabParams>;
}
function init(level: PlayLevel<LabParams>): LabState {
  return { setups: level.params.setups.map((s) => ({ ...s })), predicted: null, results: null, ranDiffs: null, concluded: null, done: false, acts: 0, prev: null, depth: 0 };
}

function apply(level: PlayLevel<LabParams>, s: LabState, act: LabAct, seq: number): { state: LabState; moments: Moment[]; refused?: string } {
  const p = level.params, lab = labOf(p)!, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: LabState): LabState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  switch (act.kind) {
    case "set": {
      const i = act.setup, f = lab.factors.find((x) => x.id === act.factor);
      if ((i !== 0 && i !== 1) || !f || !f.levels.some((l) => l.id === act.level)) return { state: bump(s), moments: out, refused: "bad_set" };
      if (!lab.free.includes(f.id) || p.goal === "predict") return { state: bump(s), moments: out, refused: "locked" };
      const setups = s.setups.map((x, k) => (k === i ? { ...x, [f.id]: act.level } : x));
      const d = diffsOf(lab, setups);
      out.push(mom("progress", seq, { changed: f.id, to: act.level, differences: d.length, which: d.join(",") || "-" }));
      return { state: bump(pushUndo(s, { ...s, setups, results: null, ranDiffs: null, concluded: null, predicted: s.results ? null : s.predicted })), moments: out };
    }
    case "predict": {
      const c = act.choice === "A" || act.choice === "B" || act.choice === "same" ? act.choice : null;
      if (!c) return { state: bump(s), moments: out, refused: "bad_choice" };
      if (s.predicted !== null) return { state: bump(s), moments: out, refused: "already_predicted" };
      const next = bump(pushUndo(s, { ...s, predicted: c }));
      out.push(mom("prediction_committed", seq, { predicted: c }));
      const truth = predictOf(lab, s.setups);
      if (c !== truth) for (const b of lab.beliefs) {
        if (!(b.mal in level.mal)) continue;
        if (predictOf(lab, s.setups, b.mult) === c) { out.push(mom("misconception_consequence", seq, { predicted: c }, b.mal)); return { state: next, moments: out }; }
      }
      if (c !== truth && p.judge === "predict") return { state: next, moments: out, refused: "wrong_prediction" };
      return { state: next, moments: out };
    }
    case "run": {
      if (s.predicted === null) return { state: bump(s), moments: out, refused: "predict_first" };
      const results = s.setups.map((x) => outcomeOf(lab, x));
      const d = diffsOf(lab, s.setups);
      if (d.length === 0) { out.push(mom("law_refused", seq, { why: "nothing_differs" })); return { state: bump(s), moments: out, refused: "nothing_differs" }; }
      const w = winner(lab, results[0], results[1]);
      out.push(mom(w === s.predicted ? "prediction_confirmed" : "prediction_violated", seq, { a: results[0], b: results[1], unit: lab.outcome.unit.en, differences: d.length }));
      if (d.length > 1) out.push(mom("law_refused", seq, { why: "several_differ", which: d.join(",") }));
      return { state: bump(pushUndo(s, { ...s, results, ranDiffs: d })), moments: out };
    }
    case "conclude": {
      if (!s.results || !s.ranDiffs) return { state: bump(s), moments: out, refused: "run_first" };
      const c = String(act.factor);
      const d = s.ranDiffs;
      const truth = d.length > 1 ? "cant_tell" : s.results[0] !== s.results[1] ? d[0] : "none";
      if (c === truth) {
        if (p.goal === "golu") out.push(mom("slip_found", seq, { by: "golu", differences: d.length }));
        if (p.goal === "fair" && d.length !== 1) return { state: bump(s), moments: out, refused: "make_it_fair" };
        out.push(mom("solved", seq, { concluded: c, a: s.results[0], b: s.results[1] }));
        return { state: bump(pushUndo(s, { ...s, concluded: c, done: true })), moments: out };
      }
      if (d.length > 1 && c !== "cant_tell" && "many-at-once" in level.mal) { out.push(mom("misconception_consequence", seq, { concluded: c, differences: d.length }, "many-at-once")); return { state: bump(s), moments: out, refused: "wrong_conclusion" }; }
      out.push(mom("law_refused", seq, { concluded: c, why: "look_again" }));
      return { state: bump(s), moments: out, refused: "wrong_conclusion" };
    }
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<LabParams>, s: LabState) => s.done;

function solve(level: PlayLevel<LabParams>): LabAct[] | null {
  const p = level.params, lab = labOf(p);
  if (!lab) return null;
  const acts: LabAct[] = [];
  let setups = p.setups.map((x) => ({ ...x }));
  if (p.goal === "fair") {
    const f = lab.factors.find((x) => x.id === p.test)!;
    const alt = f.levels.find((l) => l.id !== setups[0][f.id]);
    if (!alt) return null;
    acts.push({ kind: "set", setup: 1, factor: f.id, level: alt.id });
    setups = [setups[0], { ...setups[1], [f.id]: alt.id }];
  }
  if (p.goal === "golu") {
    // the honest finding first: two things changed, so nothing can be concluded
    const w = predictOf(lab, setups);
    acts.push({ kind: "predict", choice: w }, { kind: "run" }, { kind: "conclude", factor: "cant_tell" });
    return acts;
  }
  const w = predictOf(lab, setups);
  acts.push({ kind: "predict", choice: w }, { kind: "run" });
  const r = setups.map((x) => outcomeOf(lab, x));
  acts.push({ kind: "conclude", factor: r[0] !== r[1] ? p.test : "none" });
  return acts;
}
/** Shortcuts: concluding without the fair comparison the goal asks for (the law refuses: `make_it_fair`, `run_first`). */
function shortcut(level: PlayLevel<LabParams>): LabAct[] | null {
  const p = level.params, lab = labOf(p);
  if (!lab) return null;
  for (const c of [p.test, "none", "cant_tell"]) {
    const t: LabAct[] = [{ kind: "predict", choice: "A" }, { kind: "run" }, { kind: "conclude", factor: c }];
    let s = init(level);
    for (const a of t) s = apply(level, s, a, 1).state;
    if (s.done && p.goal === "fair") return t;
  }
  return null;
}
function malActs(level: PlayLevel<LabParams>, mal: string): LabAct[] | null {
  const p = level.params, lab = labOf(p);
  if (!lab) return null;
  if (mal === "many-at-once") return p.goal === "golu" ? [{ kind: "predict", choice: predictOf(lab, p.setups) }, { kind: "run" }, { kind: "conclude", factor: p.test }] : null;
  const b = lab.beliefs.find((x) => x.mal === mal);
  if (!b) return null;
  let setups = p.setups;
  const pre: LabAct[] = [];
  if (p.goal === "fair") {
    const f = lab.factors.find((x) => x.id === p.test)!, alt = f.levels.find((l) => l.id !== setups[0][f.id]);
    if (!alt) return null;
    pre.push({ kind: "set", setup: 1, factor: f.id, level: alt.id });
    setups = [setups[0], { ...setups[1], [f.id]: alt.id }];
  }
  const believed = predictOf(lab, setups, b.mult);
  return believed !== predictOf(lab, setups) ? [...pre, { kind: "predict", choice: believed }] : null;
}

function difficultyOf(p: LabParams, lab: LabDef): number {
  const g = { predict: 0.2, fair: 0.4, golu: 0.55 }[p.goal];
  return Math.min(1, g + 0.05 * lab.factors.length);
}
function generate(req: GenRequest): Candidate<LabParams>[] {
  const g = req.grammar as { labs?: string[]; tests?: string[]; goal?: LabParams["goal"]; judge?: LabParams["judge"] };
  const labs = (g.labs ?? Object.keys(LABS).filter((k) => LABS[k].topicIds.includes(req.topicId))).map((k) => LABS[k]).filter(Boolean);
  const goal = (req.goal as LabParams["goal"]) ?? g.goal ?? "predict";
  const judge = g.judge ?? (goal === "predict" ? "predict" : "design");
  const rnd = mulberry32(req.seed), out: Candidate<LabParams>[] = [];
  for (const lab of labs) {
    const tests = (g.tests ?? lab.free).filter((x) => lab.factors.some((f) => f.id === x));
    for (const test of tests) {
      const f = lab.factors.find((x) => x.id === test)!;
      // a few base set-ups: the defaults, and one or two other free conditions changed in BOTH set-ups
      const bases: Record<string, string>[] = [{ ...lab.defaults }];
      // every single-condition variant is a candidate base (a lab has ≤ 5 conditions of ≤ 3 levels: ≤ 11 bases)
      for (const o of lab.free) if (o !== test) for (const lv of lab.factors.find((x) => x.id === o)!.levels) if (lv.id !== lab.defaults[o]) bases.push({ ...lab.defaults, [o]: lv.id });
      for (const base of bases) for (const lv of f.levels) for (const lv2 of f.levels) {
        if (lv.id >= lv2.id) continue;
        const a = { ...base, [test]: lv.id }, b = { ...base, [test]: lv2.id };
        // a test must SHOW the law: when the condition matters, the two outcomes differ by ≥ 20% (a base that suppresses
        // both, like two trays in the fridge for an air test, teaches nothing)
        const oa = outcomeOf(lab, a), ob = outcomeOf(lab, b), matters = lab.model.mult[test]?.[lv.id] !== lab.model.mult[test]?.[lv2.id];
        const k = lab.outcome.kind;
        const visible = BINARY_KINDS.includes(k) ? oa !== ob : k === "time" || k === "size" ? Math.abs(oa - ob) >= 0.2 * Math.max(oa, ob) : Math.abs(oa - ob) >= 0.25 * lab.outcome.max;
        if (matters && !visible) continue;
        let setups: Record<string, string>[];
        if (goal === "fair") setups = [a, { ...a }];
        else if (goal === "predict") setups = rnd() < 0.5 ? [a, b] : [b, a];
        else {
          const other = lab.free.find((o) => o !== test && rnd() < 0.7) ?? lab.free.find((o) => o !== test);
          if (!other) continue;
          const ofc = lab.factors.find((x) => x.id === other)!, alt = ofc.levels.find((l) => l.id !== b[other]);
          if (!alt) continue;
          setups = [a, { ...b, [other]: alt.id }];
        }
        const params: LabParams = { lab: lab.id, setups, test, goal, judge };
        const sig = `${lab.id}:${goal}:${test}:${JSON.stringify(setups)}`;
        out.push({ signature: sig, difficulty: difficultyOf(params, lab),
          level: { v: "play@1", levelId: `lab-${lab.id}-${goal}-${test}-${out.length}-${req.seed}`, family: "kyun-lab", mode: "fair-test", topicId: req.topicId, skillId: req.skillId,
            fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: goal === "golu" ? { misconceptionId: req.misMap["many-at-once"] ?? "", by: "golu" } : null,
            context: lab.id, seed: req.seed, proof: { solvable: true, shortcutFree: true, minActs: 0, solutions: 0, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } } });
      }
    }
  }
  return out;
}

function facts(level: PlayLevel<LabParams>, s: LabState): Facts {
  const lab = labOf(level.params)!, f: Facts = { lab: lab.id, testing: level.params.test, differences: diffsOf(lab, s.setups).length };
  s.setups.forEach((x, i) => { f[i ? "B" : "A"] = lab.factors.map((fc) => x[fc.id]).join("/"); });
  if (s.predicted) f.predicted = s.predicted;
  if (s.results) { f.result_A = s.results[0]; f.result_B = s.results[1]; f.unit = lab.outcome.unit.en; }
  if (s.concluded) f.concluded = s.concluded;
  return f;
}
function board(level: PlayLevel<LabParams>, s: LabState) {
  const lab = labOf(level.params)!;
  const row = (i: number) => `${i ? "B" : "A"}: ${lab.factors.map((fc) => (lab.factors.find((x) => x.id === fc.id)!.levels.find((l) => l.id === s.setups[i][fc.id])?.label.en ?? "")).join(", ")}${s.results ? ` → ${s.results[i]} ${lab.outcome.unit.en}` : ""}`;
  return { title: lab.title.en, lines: [row(0), row(1), `differ: ${diffsOf(lab, s.setups).join(", ") || "nothing"}`] };
}
function grade(level: PlayLevel<LabParams>, acts: PlayActEnvelope<LabAct>[]): PlayGrade {
  return gradeLevel(labLogic, level, acts, { decisiveRefusals: ["wrong_prediction", "wrong_conclusion"], final: true });
}

export const labLogic: FamilyLogic<LabParams, LabState, LabAct> = {
  family: "kyun-lab", modes: ["fair-test"], malRules: LAB_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
export const labHelpers = { diffsOf, winner, predictOf, outcomeOf };
