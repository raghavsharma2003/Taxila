// Nishana · land it on the line (DESIGN.md §3.3). The child places a marker for a value on a number line and commits; the
// pod lands where the child put it, the truth flag rises at the computed position and the gap is drawn exactly. Compare
// mode: place two values, then say which is smaller. PURE law + generator + solver + grader.
//
// Values are exact rationals (whole numbers, fractions, mixed numbers, decimals, integers). Mal-rules predict where a
// child holding a belief would put the marker; a level is served only if each mapped mal-rule's position is far from the
// truth (≥ 3 tolerances), so the placement tells the beliefs apart.
// Mal-rules: whole-number-bias · line-as-unit · all-less-than-one · count-marks · decimal-place · sign-ignored ·
// neg-order-line · neg-magnitude · longer-bigger · shorter-bigger · first-digit-compare · line-spacing.
import type { Candidate, FamilyLogic, Facts, GenRequest, LineAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { cmp, gcd, rat, ratStr, sub, type Rat } from "../../core/rat.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type LineForm = "whole" | "fraction" | "mixed" | "decimal" | "integer";
export interface LineValue { text: string; num: number; den: number; form: LineForm }
export interface LineParams {
  lo: number; hi: number;              // integers
  major: number; minor: number;        // tick steps in line units (minor 0 = none); labels on majors
  values: LineValue[];                 // 1 (place) or 2 (compare)
  tol: number;                         // absolute tolerance in line units
  goal: "place" | "compare" | "round";
  labels: "all" | "major" | "ends";    // what is written under the ticks (fade)
  /** round goal: the rounding unit; the line runs between two neighbouring landmarks (lo, hi = lo + to) */
  to?: number;
}
export interface LineState extends Undoable<LineState> {
  marks: (number | null)[];
  commits: number;
  landed: boolean;                     // the last commit landed every marker within tolerance
  ordered: number | null;
  rounded: number | null;
  done: boolean;
  acts: number;
}
export const LINE_MAL = ["whole-number-bias", "line-as-unit", "all-less-than-one", "count-marks", "decimal-place", "sign-ignored", "neg-order-line", "neg-magnitude", "longer-bigger", "shorter-bigger", "first-digit-compare", "line-spacing",
  "round-truncate", "round-chain", "round-last-digit"] as const;

/** Round half up to a multiple of `to` (the school rule). */
export const roundTo = (v: number, to: number) => Math.floor(v / to + 0.5) * to;
/** The landmark a child holding a rounding belief picks (null = the belief agrees with the truth here). */
export function malRound(v: number, to: number, mal: string): number | null {
  const truth = roundTo(v, to), lo = Math.floor(v / to) * to;
  let r: number | null = null;
  if (mal === "round-truncate") r = lo;                                                            // chops the digits: always down
  if (mal === "round-chain") { let x = v; for (let u = 10; u <= to; u *= 10) x = roundTo(x, u); r = x; }   // 3,449 → 3,450 → 3,500 → 4,000
  if (mal === "round-last-digit") r = v % 10 >= 5 ? lo + to : lo;                                  // decides by the ones digit
  return r !== null && r !== truth ? r : null;
}

export const valueOf = (v: LineValue): number => v.num / v.den;
const vRat = (v: LineValue): Rat => rat(v.num, v.den);
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

/** Where a child holding mal-rule `mal` puts value v on this line (null = the belief says nothing about this value). */
export function malPosition(p: LineParams, v: LineValue, mal: string): number | null {
  const x = valueOf(v), span = p.hi - p.lo;
  switch (mal) {
    case "whole-number-bias": return v.form === "fraction" && v.num > 0 ? Math.min(p.hi, v.den > 4 ? p.lo + span * (1 - 1 / v.den) : v.num) : null;   // 1/5 right of 1/2; 3/4 near 3
    case "line-as-unit": return (v.form === "fraction" || v.form === "mixed") && span !== 1 && x < 1 ? p.lo + x * span : null;              // 3/4 of the whole line
    case "all-less-than-one": return v.form !== "whole" && x > 1 ? Math.min(1, p.hi) - 0.05 * span : null;
    case "count-marks": return v.form === "fraction" && p.minor > 0 ? p.lo + (v.num - 1) / v.den * 1 : null;                              // counts the 0 tick as one
    case "decimal-place": return v.form === "decimal" && x > 0 && x < 0.1 ? x * 10 : v.form === "decimal" && x >= 1 && x < 10 && v.den >= 10 ? x / 10 : null;
    case "sign-ignored": return v.form === "integer" && x < 0 ? -x : null;
    case "neg-order-line": return v.form === "integer" && x < 0 && p.lo < 0 ? p.lo - x - 1 : null;                                          // −1, −2, −3 … written left to right from the far left, −k at lo + k − 1
  }
  return null;
}
/** Which marker a child holding a compare belief calls smaller (null = no prediction). */
export function malOrder(p: LineParams, mal: string): number | null {
  if (p.values.length !== 2) return null;
  const [a, b] = p.values;
  const places = (v: LineValue) => (v.text.split(".")[1] ?? "").length;
  switch (mal) {
    case "neg-magnitude": return a.form === "integer" && valueOf(a) < 0 && valueOf(b) < 0 ? (Math.abs(valueOf(a)) < Math.abs(valueOf(b)) ? 0 : 1) : null;
    case "longer-bigger": return a.form === "decimal" && b.form === "decimal" && places(a) !== places(b) ? (places(a) < places(b) ? 0 : 1) : null;
    case "shorter-bigger": return a.form === "decimal" && b.form === "decimal" && places(a) !== places(b) ? (places(a) > places(b) ? 0 : 1) : null;
    case "first-digit-compare": return a.form === "whole" && b.form === "whole" ? (a.text.replace(/\D/g, "")[0] < b.text.replace(/\D/g, "")[0] ? 0 : 1) : null;
    case "whole-number-bias": return a.form === "fraction" && b.form === "fraction" && a.num === b.num ? (a.den < b.den ? 0 : 1) : null;
  }
  return null;
}

function validate(level: PlayLevel<unknown>): PlayLevel<LineParams> | null {
  const p = level.params as Partial<LineParams> | null;
  if (!p || !Number.isInteger(p.lo) || !Number.isInteger(p.hi) || (p.hi as number) <= (p.lo as number)) return null;
  if (!Array.isArray(p.values) || !p.values.length || p.values.length > 2) return null;
  if (p.goal !== "place" && p.goal !== "compare" && p.goal !== "round") return null;
  if ((p.goal === "compare") !== (p.values.length === 2)) return null;
  if (p.goal === "round") {
    const to = Number(p.to);
    if (!(to >= 10) || (p.hi as number) - (p.lo as number) !== to || (p.lo as number) % to !== 0 || p.values.length !== 1 || p.values[0].den !== 1) return null;
  }
  const lo = p.lo as number, hi = p.hi as number;
  const values: LineValue[] = [];
  for (const v of p.values) {
    if (!v || !Number.isInteger(v.num) || !Number.isInteger(v.den) || v.den < 1 || typeof v.text !== "string" || v.text.length > 12) return null;
    const x = v.num / v.den;
    if (x < lo || x > hi) return null;
    values.push({ text: v.text, num: v.num, den: v.den, form: v.form as LineForm });
  }
  const major = Number(p.major), minor = Number(p.minor ?? 0), tol = Number(p.tol);
  if (!(major > 0) || (hi - lo) / major > 20 || !(tol > 0) || tol > (hi - lo) / 8) return null;
  const labels = p.labels === "major" || p.labels === "ends" ? p.labels : "all";
  return { ...level, params: { lo, hi, major, minor: minor > 0 && (hi - lo) / minor <= 60 ? minor : 0, values, tol, goal: p.goal, labels, ...(p.goal === "round" ? { to: Number(p.to) } : {}) } } as PlayLevel<LineParams>;
}
function init(level: PlayLevel<LineParams>): LineState {
  return { marks: level.params.values.map(() => null), commits: 0, landed: false, ordered: null, rounded: null, done: false, acts: 0, prev: null, depth: 0 };
}

function apply(level: PlayLevel<LineParams>, s: LineState, act: LineAct, seq: number): { state: LineState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: LineState): LineState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  switch (act.kind) {
    case "place": {
      const i = act.which, x = Number(act.x);
      if (!Number.isInteger(i) || i < 0 || i >= p.values.length || !Number.isFinite(x)) return { state: bump(s), moments: out, refused: "bad_place" };
      const cx = Math.min(p.hi, Math.max(p.lo, x));
      return { state: bump(pushUndo(s, { ...s, marks: s.marks.map((m, k) => (k === i ? cx : m)), landed: false })), moments: out };
    }
    case "commit": {
      if (s.marks.some((m) => m === null)) return { state: bump(s), moments: out, refused: "place_first" };
      const errs = p.values.map((v, k) => Math.abs((s.marks[k] as number) - valueOf(v)));
      const all = errs.every((e) => e <= p.tol);
      const next = bump(pushUndo(s, { ...s, commits: s.commits + 1, landed: all }));
      if (all) {
        if (p.goal === "round") { out.push(mom("progress", seq, { landed: "yes", value: p.values[0].text })); return { state: next, moments: out }; }
        if (p.goal === "place") { out.push(mom("solved", seq, { value: p.values[0].text, at: fmt(s.marks[0] as number) })); return { state: { ...next, done: true }, moments: out }; }
        out.push(mom("progress", seq, { landed: "both" }));
        return { state: next, moments: out };
      }
      // the first marker that missed decides the moment
      const k = errs.findIndex((e) => e > p.tol), v = p.values[k], x = s.marks[k] as number;
      const gap = gapFacts(v, x);
      for (const mal of Object.keys(level.mal)) {
        const mp = malPosition(p, v, mal);
        if (mp !== null && Math.abs(mp - valueOf(v)) > 2 * p.tol && Math.abs(x - mp) <= p.tol) {
          out.push(mom("misconception_consequence", seq, { value: v.text, at: fmt(x), truth: fmt(valueOf(v)), ...gap }, mal));
          return { state: next, moments: out, refused: "missed" };
        }
      }
      out.push(mom(errs[k] <= 2 * p.tol ? "near_miss" : "law_refused", seq, { value: v.text, at: fmt(x), truth: fmt(valueOf(v)), ...gap, why: "landed_off" }));
      return { state: next, moments: out, refused: "missed" };
    }
    case "round": {
      if (p.goal !== "round" || !p.to) return { state: bump(s), moments: out, refused: "no_round_here" };
      const to = p.to, v = valueOf(p.values[0]), pick = Number(act.to);
      if (pick !== p.lo && pick !== p.hi) return { state: bump(s), moments: out, refused: "bad_round" };
      if (!s.landed) { out.push(mom("law_refused", seq, { why: "land_first" })); return { state: bump(s), moments: out, refused: "land_first" }; }
      const truth = roundTo(v, to);
      if (pick === truth) { out.push(mom("solved", seq, { value: p.values[0].text, rounded: fmtWhole(truth) })); return { state: bump(pushUndo(s, { ...s, rounded: pick, done: true })), moments: out }; }
      for (const mal of Object.keys(level.mal)) if (malRound(v, to, mal) === pick) { out.push(mom("misconception_consequence", seq, { value: p.values[0].text, picked: fmtWhole(pick) }, mal)); return { state: bump({ ...s, rounded: pick }), moments: out, refused: "wrong_round" }; }
      out.push(mom("law_refused", seq, { value: p.values[0].text, picked: fmtWhole(pick), why: "look_again" }));
      return { state: bump({ ...s, rounded: pick }), moments: out, refused: "wrong_round" };
    }
    case "order": {
      if (p.goal !== "compare") return { state: bump(s), moments: out, refused: "no_order_here" };
      const c = act.first === -1 ? -1 : act.first === 0 || act.first === 1 ? act.first : null;
      if (c === null) return { state: bump(s), moments: out, refused: "bad_order" };
      const c0 = cmp(vRat(p.values[0]), vRat(p.values[1])), truth = c0 < 0 ? 0 : c0 > 0 ? 1 : -1;
      if (c !== truth) {
        for (const mal of Object.keys(level.mal)) if (malOrder(p, mal) === c) { out.push(mom("misconception_consequence", seq, { said_smaller: c === -1 ? "same" : p.values[c].text }, mal)); return { state: bump(s), moments: out, refused: "wrong_order" }; }
        out.push(mom("law_refused", seq, { why: "look_again" }));
        return { state: bump(s), moments: out, refused: "wrong_order" };
      }
      if (!s.landed) { out.push(mom("law_refused", seq, { why: "land_both_first" })); return { state: bump({ ...s, ordered: c }), moments: out, refused: "land_first" }; }
      out.push(mom("solved", seq, { smaller: c === -1 ? "same" : p.values[c].text }));
      return { state: bump(pushUndo(s, { ...s, ordered: c, done: true })), moments: out };
    }
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const fmtWhole = (x: number) => x.toLocaleString("en-IN");
function fmt(x: number): string { return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""); }
/**
 * The gap between the child's mark and the truth, written in the value's own form (a fraction gap for fractions), and
 * whether it is EXACT. A drag lands anywhere, so most gaps are not a neat 1/q: then the text is the nearest small
 * fraction and `exact` is false, and every surface must say "about" (the label was "1/3 off" for a 0.18 gap: a false
 * statement drawn on the child's screen, found in the round-3 shots).
 */
export function gapInfo(v: LineValue, x: number): { g: string; exact: boolean } {
  const t = valueOf(v), d = Math.abs(x - t);
  const red = (k: number, m: number) => { const g = gcd(k, m); return m / g === 1 ? String(k / g) : `${k / g}/${m / g}`; };
  if (v.form === "fraction" || v.form === "mixed") {
    const q = v.den;
    for (const m of [q, 2 * q, 3 * q, 4 * q]) { const k = Math.round(d * m); if (k > 0 && Math.abs(d - k / m) < 1e-6) return { g: red(k, m), exact: true }; }
    for (const m of [q, 2 * q, 4 * q, 8 * q]) { const k = Math.round(d * m); if (k >= 1) return { g: red(k, m), exact: false }; }
    return { g: red(1, 8 * q), exact: false };
  }
  const r2 = Math.round(d * 100) / 100;
  return { g: fmt(r2 > 0 ? r2 : 0.01), exact: r2 > 0 && Math.abs(d - r2) < 1e-6 };
}
export const gapText = (v: LineValue, x: number): string => gapInfo(v, x).g;
/** The facts row for a gap: `gap` only when exact, `gap_about` otherwise (a bank shape needing {gap} is then skipped). */
const gapFacts = (v: LineValue, x: number): Facts => { const gi = gapInfo(v, x); return gi.exact ? { gap: gi.g } : { gap_about: gi.g }; };
const goalMet = (_l: PlayLevel<LineParams>, s: LineState) => s.done;

function solve(level: PlayLevel<LineParams>): LineAct[] | null {
  const p = level.params, acts: LineAct[] = p.values.map((v, i) => ({ kind: "place", which: i, x: valueOf(v) }) as LineAct);
  acts.push({ kind: "commit" });
  if (p.goal === "compare") { const c = cmp(vRat(p.values[0]), vRat(p.values[1])); acts.push({ kind: "order", first: c < 0 ? 0 : c > 0 ? 1 : -1 }); }
  if (p.goal === "round" && p.to) acts.push({ kind: "round", to: roundTo(valueOf(p.values[0]), p.to) });
  return acts;
}
/** A placement cannot be passed without knowing where the value lives: probe the line's landmarks (ends, middle, majors). */
function shortcut(level: PlayLevel<LineParams>): LineAct[] | null {
  const p = level.params;
  if (p.goal === "round") return null;   // the law refuses a rounding before the value has landed on the line
  if (p.goal !== "place") return null;
  const v = valueOf(p.values[0]);
  // landmark guesses a child could make without the concept: the ends, the middle, and (when every tick is labelled with the
  // value's own text) reading the label. A labelled tick that IS the value is a reading task, not a placement.
  const guesses = [p.lo, p.hi, (p.lo + p.hi) / 2];
  if (p.labels !== "ends") for (let t = p.lo; t <= p.hi + 1e-9; t += p.major) guesses.push(t);   // a labelled tick is read, not placed
  for (const x of guesses) if (Math.abs(x - v) <= p.tol) return [{ kind: "place", which: 0, x }, { kind: "commit" }];
  return null;
}
function malActs(level: PlayLevel<LineParams>, mal: string): LineAct[] | null {
  const p = level.params;
  if (p.goal === "round") {
    const v = valueOf(p.values[0]), r = p.to ? malRound(v, p.to, mal) : null;
    return r === null ? null : [{ kind: "place", which: 0, x: v }, { kind: "commit" }, { kind: "round", to: r }];
  }
  if (p.goal === "compare") {
    const c = malOrder(p, mal);
    if (c === null) return null;
    return [...p.values.map((v, i) => ({ kind: "place", which: i, x: valueOf(v) }) as LineAct), { kind: "commit" }, { kind: "order", first: c }];
  }
  const v = p.values[0], mp = malPosition(p, v, mal);
  if (mp === null || mp < p.lo || mp > p.hi) return null;
  return [{ kind: "place", which: 0, x: mp }, { kind: "commit" }];
}

// ───────────────────────────── generation ─────────────────────────────

interface LineGrammar { forms?: LineForm[]; ranges?: [number, number][]; dens?: number[]; tolFrac?: number; goal?: "place" | "compare" | "round"; maxWhole?: number; decimals?: number; to?: number[]; maxV?: number }
/** Round-goal candidates: values between two landmarks, mixed on purpose so each rounding belief has levels it fails on. */
function roundCandidates(req: GenRequest, g: LineGrammar, rnd: () => number): { lo: number; hi: number; v: number; to: number }[] {
  const out: { lo: number; hi: number; v: number; to: number }[] = [];
  for (const to of g.to ?? [100, 1000]) {
    const maxV = g.maxV ?? (to >= 10000 ? 99999 : 9999);
    for (let k = 0; k < 40; k++) {
      const lo = (1 + Math.floor(rnd() * Math.max(1, Math.floor(maxV / to) - 1))) * to;
      const d = to / 10;
      // a mix: a plain value, a chain-rounding trap (4 then ≥ 5 below it), a last-digit trap, a value just past halfway
      const kind = k % 4;
      let off = kind === 0 ? 1 + Math.floor(rnd() * (to - 1))
        : kind === 1 ? 4 * d + Math.ceil(d / 2) + Math.floor(rnd() * Math.max(1, d / 2 - 1))
        : kind === 2 ? (rnd() < 0.5 ? Math.floor(rnd() * 4) * d + 5 + Math.floor(rnd() * 5) : (5 + Math.floor(rnd() * 5)) * d + Math.floor(rnd() * 5))
        : 5 * d + 1 + Math.floor(rnd() * (d - 1));
      off = Math.max(1, Math.min(to - 1, Math.round(off)));
      if (off === to / 2) off += 1;
      out.push({ lo, hi: lo + to, v: lo + off, to });
    }
  }
  return out;
}
function lineFor(lo: number, hi: number, form: LineForm, den: number, fade: 1 | 2 | 3): Pick<LineParams, "major" | "minor" | "labels"> {
  const span = hi - lo;
  const major = span <= 2 ? 1 : form === "integer" ? 5 : span <= 10 ? 1 : span <= 20 ? 5 : span <= 100 ? 10 : span <= 1000 ? 100 : span <= 10000 ? 1000 : span <= 100000 ? 10000 : 100000;
  const minor = fade === 3 ? 0 : form === "fraction" || form === "mixed" ? 1 / den : form === "decimal" ? (den >= 100 ? 0.01 : 0.1) * (span > 2 ? 10 : 1) : span <= 20 ? (form === "integer" ? 1 : 0) : major / 10;
  return { major, minor: minor && span / minor <= 60 ? minor : 0, labels: fade === 1 ? "major" : fade === 2 ? "major" : "ends" };
}
function difficultyOf(p: LineParams): number {
  const v = p.values[0], span = p.hi - p.lo;
  const formW: Record<LineForm, number> = { whole: 0.05, integer: 0.2, fraction: 0.3, decimal: 0.3, mixed: 0.45 };
  const ticks = p.minor ? 0 : 0.2;
  const unit = (v.form === "fraction" || v.form === "mixed") && span !== 1 ? 0.15 : 0;
  return Math.max(0, Math.min(1, formW[v.form] + ticks + unit + (p.goal === "compare" ? 0.1 : 0) + (span > 1000 ? 0.1 : 0)));
}
function generate(req: GenRequest): Candidate<LineParams>[] {
  const g = req.grammar as LineGrammar;
  const forms = g.forms ?? ["fraction"];
  const goal = (req.goal as "place" | "compare" | "round") ?? g.goal ?? "place";
  const rnd = mulberry32(req.seed), out: Candidate<LineParams>[] = [];
  const tolFrac = g.tolFrac ?? 0.025;
  const mk = (params: LineParams, sig: string): Candidate<LineParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `line-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "nishana", mode: goal === "compare" ? "compare" : "place", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "number-line", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 0, solutions: 0, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const valuesOf = (form: LineForm, lo: number, hi: number): LineValue[] => {
    const vs: LineValue[] = [];
    if (form === "fraction" || form === "mixed") for (const d of g.dens ?? [2, 3, 4, 5, 6, 8, 10]) for (let n = 1; n <= d * hi; n++) {
      if (gcd(n, d) !== 1 || n / d <= lo || n / d >= hi) continue;
      if (form === "fraction") vs.push({ text: `${n}/${d}`, num: n, den: d, form });
      else if (n > d) vs.push({ text: `${Math.floor(n / d)} ${n % d}/${d}`, num: n, den: d, form });
    }
    if (form === "decimal") {
      for (let places = 1; places <= (g.decimals ?? 2); places++) {
        const den = 10 ** places;
        for (let k = lo * den + 1; k < hi * den; k++) if (k % 10 !== 0 || places === 1) { const gg = gcd(k, den); vs.push({ text: (k / den).toFixed(places), num: k / gg, den: den / gg, form }); }
      }
    }
    if (form === "integer") for (let k = lo + 1; k < hi; k++) if (k !== 0) vs.push({ text: k < 0 ? `−${-k}` : String(k), num: k, den: 1, form });
    if (form === "whole") { const step = Math.max(1, Math.round((hi - lo) / 40)); for (let k = lo + step; k < hi; k += step) vs.push({ text: k.toLocaleString("en-IN"), num: k, den: 1, form }); }
    return vs;
  };
  if (goal === "round") {
    for (const r of roundCandidates(req, g, rnd)) {
      const v: LineValue = { text: r.v.toLocaleString("en-IN"), num: r.v, den: 1, form: "whole" };
      out.push(mk({ lo: r.lo, hi: r.hi, major: r.to / 10, minor: 0, values: [v], tol: r.to * tolFrac, goal, labels: "ends", to: r.to }, `round:${r.v}@${r.to}`));
    }
    return out;
  }
  for (const form of forms) {
    const ranges = g.ranges ?? (form === "fraction" ? [[0, 1], [0, 2], [0, 3]] : form === "mixed" ? [[0, 3], [0, 5]] : form === "decimal" ? [[0, 1], [0, 2]] : form === "integer" ? [[-10, 10], [-20, 5], [-5, 15]] : [[0, 10000], [0, 1000]]);
    for (const [lo, hi] of ranges) {
      const vs = valuesOf(form, lo, hi);
      const keep = vs.length > 40 ? vs.filter(() => rnd() < 40 / vs.length) : vs;
      for (const v of keep) {
        const ln = lineFor(lo, hi, form, v.den, req.fade);
        const tol = Math.max((hi - lo) * tolFrac, form === "fraction" || form === "mixed" ? 0 : 0);
        if (goal === "place") out.push(mk({ lo, hi, ...ln, values: [v], tol, goal }, `${form}:${v.text}@${lo}-${hi}`));
        else {
          const w = keep[Math.floor(rnd() * keep.length)];
          if (!w || w.text === v.text) continue;
          out.push(mk({ lo, hi, ...ln, values: [v, w], tol, goal }, `cmp:${v.text},${w.text}@${lo}-${hi}`));
        }
      }
    }
  }
  return out;
}

function facts(level: PlayLevel<LineParams>, s: LineState): Facts {
  const p = level.params, f: Facts = { line: `${p.lo} to ${p.hi}`, goal: p.goal };
  p.values.forEach((v, i) => { f[`value${i + 1}`] = v.text; if (s.marks[i] !== null) f[`mark${i + 1}`] = fmt(s.marks[i] as number); });
  if (s.commits) f.commits = s.commits;
  if (p.goal === "round" && p.to) { f.to = p.to; f.ends = `${fmtWhole(p.lo)},${fmtWhole(p.hi)}`; if (s.rounded !== null) f.rounded = fmtWhole(s.rounded); }
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<LineParams>, s: LineState) {
  const p = level.params;
  return { title: `${p.lo} se ${p.hi}`, lines: p.values.map((v, i) => `${v.text}${s.marks[i] !== null ? ` · yahan: ${fmt(s.marks[i] as number)}` : ""}`) };
}
function grade(level: PlayLevel<LineParams>, acts: PlayActEnvelope<LineAct>[]): PlayGrade {
  return gradeLevel(lineLogic, level, acts, { decisiveRefusals: ["missed", "wrong_order", "wrong_round"], final: true });
}

export const lineLogic: FamilyLogic<LineParams, LineState, LineAct> = {
  family: "nishana", modes: ["place", "compare"], malRules: LINE_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
export const lineHelpers = { valueOf, gapText, gapInfo, malPosition, ratStr, sub, fmt, roundTo, fmtWhole };
