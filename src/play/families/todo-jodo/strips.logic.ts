// Todo-Jodo · strips (DESIGN.md §3.1): fraction bars, each one whole, cut into equal parts. Re-cutting never moves the
// amount; pieces of different sizes do not fit each other's slots. PURE law + generator + solver + grader.
//
// Goals: "make" (shade an amount) · "equal" (the same amount with different parts) · "compare" (predict which is more, cut to
// common parts, confirm) · "unit" (unit fractions, same flow) · "add" (pour two bars into a third: only like pieces pour).
// Mal-rules: bigger-denominator · only-num-den · gap · more-pieces-more · add-same · one-side · add-across ·
// change-only-den · part-part.
import type { Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, StripsAct } from "../../../../shared/play.ts";
import { add, cmp, eq, gcd, lcm, rat, ratStr, type Rat } from "../../core/rat.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type StripsGoal = "make" | "equal" | "compare" | "unit" | "add";
export interface Bar { d: number; shaded: number[] }
export interface StripsParams { bars: Bar[]; goal: StripsGoal; target?: [number, number]; locked: number[] }
export interface StripsState extends Undoable<StripsState> {
  bars: Bar[];
  predicted: number | null;        // compare: the first choice (a committed prediction)
  revealed: boolean;               // compare: both bars now cut into the same number of parts
  poured: number[];                // add: bars already poured
  named: Rat | null;
  done: boolean;
  acts: number;
}
export const STRIPS_MAL = ["bigger-denominator", "only-num-den", "gap", "more-pieces-more", "add-same", "one-side", "add-across", "change-only-den", "part-part"] as const;
export const MAX_PARTS = 24, MAX_CUT = 12;

export const amountOf = (b: Bar): Rat => rat(b.shaded.length, b.d);
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const barStr = (b: Bar) => `${b.shaded.length}/${b.d}`;

function validate(level: PlayLevel<unknown>): PlayLevel<StripsParams> | null {
  const p = level.params as Partial<StripsParams> | null;
  if (!p || !Array.isArray(p.bars) || !p.bars.length || p.bars.length > 3) return null;
  const goals: StripsGoal[] = ["make", "equal", "compare", "unit", "add"];
  if (!goals.includes(p.goal as StripsGoal)) return null;
  const bars: Bar[] = [];
  for (const b of p.bars) {
    const d = Number(b?.d);
    if (!Number.isInteger(d) || d < 1 || d > MAX_PARTS || !Array.isArray(b.shaded)) return null;
    const sh = [...new Set(b.shaded.map(Number))].filter((i) => Number.isInteger(i) && i >= 0 && i < d).sort((x, y) => x - y);
    bars.push({ d, shaded: sh });
  }
  const locked = Array.isArray(p.locked) ? p.locked.filter((i) => Number.isInteger(i) && i >= 0 && i < bars.length) : [];
  let target: [number, number] | undefined;
  if (p.goal === "make") {
    const t = p.target;
    if (!Array.isArray(t) || !Number.isInteger(t[0]) || !Number.isInteger(t[1]) || t[1] < 2 || t[1] > MAX_PARTS || t[0] < 1 || t[0] >= t[1]) return null;
    target = [t[0], t[1]];
  }
  if ((p.goal === "compare" || p.goal === "unit") && bars.length !== 2) return null;
  if (p.goal === "equal" && bars.length !== 2) return null;
  if (p.goal === "add" && bars.length !== 3) return null;
  return { ...level, params: { bars, goal: p.goal as StripsGoal, ...(target ? { target } : {}), locked } } as PlayLevel<StripsParams>;
}

function init(level: PlayLevel<StripsParams>): StripsState {
  return { bars: level.params.bars.map((b) => ({ d: b.d, shaded: [...b.shaded] })), predicted: null, revealed: false, poured: [], named: null, done: false, acts: 0, prev: null, depth: 0 };
}

function truthCompare(p: StripsParams): number {
  const c = cmp(amountOf(p.bars[0]), amountOf(p.bars[1]));
  return c > 0 ? 0 : c < 0 ? 1 : -1;
}
/** Which mal-rule a compare choice matches (on the level's ORIGINAL bars). */
function compareMal(p: StripsParams, choice: number): string | null {
  const truth = truthCompare(p);
  if (choice === truth) return null;
  const [a, b] = p.bars, na = a.shaded.length, nb = b.shaded.length;
  if (na === nb && na > 0 && choice === (a.d > b.d ? 0 : 1)) return "bigger-denominator";
  if (truth === -1 && choice !== -1 && (a.d > b.d ? 0 : 1) === choice) return "more-pieces-more";
  if (choice === -1 && a.d - na === b.d - nb) return "gap";
  if (na !== nb && choice === (na > nb ? 0 : 1)) return "only-num-den";
  return null;
}

function apply(level: PlayLevel<StripsParams>, s: StripsState, act: StripsAct, seq: number): { state: StripsState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: StripsState): StripsState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const barOk = (i: number) => Number.isInteger(i) && i >= 0 && i < s.bars.length;
  switch (act.kind) {
    case "cut": {
      const k = Math.round(Number(act.k));
      if (!barOk(act.bar)) return { state: bump(s), moments: out, refused: "no_bar" };
      // the reference strip of an "equal" level is the given: re-cutting it would make the old cut look new
      if (p.goal === "equal" && p.locked.includes(act.bar)) return { state: bump(s), moments: out, refused: "locked" };
      if (!Number.isInteger(k) || k < 2 || k > MAX_CUT) return { state: bump(s), moments: out, refused: "bad_k" };
      const b = s.bars[act.bar];
      if (b.d * k > MAX_PARTS) { out.push(mom("law_refused", seq, { why: "too_thin", d: b.d, k })); return { state: bump(s), moments: out, refused: "too_thin" }; }
      const nb: Bar = { d: b.d * k, shaded: b.shaded.flatMap((i) => range(k).map((j) => i * k + j)) };
      const bars = s.bars.map((x, i) => (i === act.bar ? nb : x));
      out.push(mom("progress", seq, { bar: act.bar, from: barStr(b), to: barStr(nb), same_amount: "yes" }));
      let revealed = s.revealed;
      if ((p.goal === "compare" || p.goal === "unit") && bars[0].d === bars[1].d && !revealed) {
        revealed = true;
        const truth = truthCompare(p);
        if (s.predicted !== null) out.push(mom(s.predicted === truth ? "prediction_confirmed" : "prediction_violated", seq, { a: barStr(bars[0]), b: barStr(bars[1]) }));
      }
      return { state: bump(pushUndo(s, { ...s, bars, revealed })), moments: out };
    }
    case "join": {
      const k = Math.round(Number(act.k));
      if (!barOk(act.bar)) return { state: bump(s), moments: out, refused: "no_bar" };
      if (p.goal === "equal" && p.locked.includes(act.bar)) return { state: bump(s), moments: out, refused: "locked" };
      const b = s.bars[act.bar];
      if (!Number.isInteger(k) || k < 2 || b.d % k !== 0) return { state: bump(s), moments: out, refused: "bad_k" };
      const set = new Set(b.shaded);
      for (let g = 0; g < b.d / k; g++) {
        const n = range(k).filter((j) => set.has(g * k + j)).length;
        if (n !== 0 && n !== k) { out.push(mom("law_refused", seq, { why: "mixed_group", bar: act.bar })); return { state: bump(s), moments: out, refused: "mixed_group" }; }
      }
      const nb: Bar = { d: b.d / k, shaded: range(b.d / k).filter((g) => set.has(g * k)) };
      out.push(mom("progress", seq, { bar: act.bar, from: barStr(b), to: barStr(nb), same_amount: "yes" }));
      return { state: bump(pushUndo(s, { ...s, bars: s.bars.map((x, i) => (i === act.bar ? nb : x)) })), moments: out };
    }
    case "shade": {
      if (!barOk(act.bar)) return { state: bump(s), moments: out, refused: "no_bar" };
      if (p.locked.includes(act.bar) || p.goal === "compare" || p.goal === "unit" || p.goal === "add") return { state: bump(s), moments: out, refused: "locked" };
      const b = s.bars[act.bar];
      if (!Number.isInteger(act.part) || act.part < 0 || act.part >= b.d) return { state: bump(s), moments: out, refused: "no_part" };
      const shaded = b.shaded.includes(act.part) ? b.shaded.filter((x) => x !== act.part) : [...b.shaded, act.part].sort((x, y) => x - y);
      const nb = { d: b.d, shaded };
      out.push(mom("progress", seq, { bar: act.bar, amount: barStr(nb) }));
      return { state: bump(pushUndo(s, { ...s, bars: s.bars.map((x, i) => (i === act.bar ? nb : x)) })), moments: out };
    }
    case "pour": {
      if (p.goal !== "add") return { state: bump(s), moments: out, refused: "no_pour_here" };
      if (!barOk(act.from) || !barOk(act.to) || act.to !== 2 || act.from === 2) return { state: bump(s), moments: out, refused: "no_bar" };
      if (s.poured.includes(act.from)) return { state: bump(s), moments: out, refused: "already_poured" };
      const a = s.bars[act.from], c = s.bars[2];
      if (a.d !== c.d) { out.push(mom("law_refused", seq, { why: "unlike_pieces", from: `1/${a.d}`, to: `1/${c.d}` })); return { state: bump(s), moments: out, refused: "unlike_pieces" }; }
      const room = range(c.d).filter((i) => !c.shaded.includes(i));
      if (room.length < a.shaded.length) return { state: bump(s), moments: out, refused: "no_room" };
      const nc: Bar = { d: c.d, shaded: [...c.shaded, ...room.slice(0, a.shaded.length)].sort((x, y) => x - y) };
      const na: Bar = { d: a.d, shaded: [] };
      out.push(mom("progress", seq, { poured: act.from, total: barStr(nc) }));
      return { state: bump(pushUndo(s, { ...s, bars: s.bars.map((x, i) => (i === act.from ? na : i === 2 ? nc : x)), poured: [...s.poured, act.from] })), moments: out };
    }
    case "choose": {
      if (p.goal !== "compare" && p.goal !== "unit") return { state: bump(s), moments: out, refused: "no_choice_here" };
      const c = act.bar === -1 ? -1 : act.bar === 0 || act.bar === 1 ? act.bar : null;
      if (c === null) return { state: bump(s), moments: out, refused: "bad_choice" };
      const truth = truthCompare(p);
      if (s.predicted === null) {
        out.push(mom("prediction_committed", seq, { choice: c }));
        const mal = compareMal(p, c);
        if (mal) out.push(mom("misconception_consequence", seq, { choice: c }, mal));
        const next = bump(pushUndo(s, { ...s, predicted: c }));
        return c !== truth && !mal ? { state: next, moments: out, refused: "wrong_prediction" } : { state: next, moments: out };
      }
      if (!s.revealed) { out.push(mom("law_refused", seq, { why: "cut_to_same_parts" })); return { state: bump(s), moments: out, refused: "reveal_first" }; }
      if (c !== truth) { out.push(mom("law_refused", seq, { why: "look_again", a: barStr(s.bars[0]), b: barStr(s.bars[1]) })); return { state: bump(s), moments: out, refused: "wrong_choice" }; }
      out.push(mom("solved", seq, { a: barStr(s.bars[0]), b: barStr(s.bars[1]), more: c }));
      return { state: bump(pushUndo(s, { ...s, done: true })), moments: out };
    }
    case "name": {
      const n = Math.round(Number(act.n)), d = Math.round(Number(act.d));
      if (!barOk(act.bar) || !Number.isInteger(n) || !Number.isInteger(d) || d < 1 || d > MAX_PARTS || n < 0 || n > d) return { state: bump(s), moments: out, refused: "bad_name" };
      // a given (locked) strip is never renamed: the symbol controls only the child's own strip
      if (p.locked.includes(act.bar) && p.goal !== "add") return { state: bump(s), moments: out, refused: "locked" };
      const named = rat(n, d);
      if (p.goal === "make") {
        const [tn, td] = p.target!;
        if (n === tn && d === td - tn && tn !== td - tn) { out.push(mom("misconception_consequence", seq, { named: `${n}/${d}` }, "part-part")); return { state: bump(s), moments: out, refused: "not_target" }; }
        // the symbol is the controller: the bar becomes n/d
        const nb: Bar = { d, shaded: range(n) };
        out.push(mom("progress", seq, { bar: act.bar, amount: `${n}/${d}` }));
        return { state: bump(pushUndo(s, { ...s, bars: s.bars.map((x, i) => (i === act.bar ? nb : x)), named })), moments: out };
      }
      if (p.goal === "equal") {
        const ref = p.bars[0], rn = ref.shaded.length, rd = ref.d;
        const k = n - rn;
        if (k > 0 && d - rd === k && !eq(named, amountOf(ref))) { out.push(mom("misconception_consequence", seq, { named: `${n}/${d}` }, "add-same")); return { state: bump(s), moments: out, refused: "not_equal" }; }
        if ((d === rd && n !== rn && n % rn === 0) || (n === rn && d !== rd && d % rd === 0)) { out.push(mom("misconception_consequence", seq, { named: `${n}/${d}` }, "one-side")); return { state: bump(s), moments: out, refused: "not_equal" }; }
        const nb: Bar = { d, shaded: range(n) };
        out.push(mom("progress", seq, { bar: act.bar, amount: `${n}/${d}` }));
        return { state: bump(pushUndo(s, { ...s, bars: s.bars.map((x, i) => (i === act.bar ? nb : x)), named })), moments: out };
      }
      if (p.goal === "add") {
        const [a, b] = p.bars, na = a.shaded.length, nb2 = b.shaded.length;
        if (n === na + nb2 && d === a.d + b.d && a.d !== b.d) { out.push(mom("misconception_consequence", seq, { named: `${n}/${d}` }, "add-across")); return { state: bump(s), moments: out, refused: "not_sum" }; }
        if (a.d !== b.d && n === na + nb2 && d === lcm(a.d, b.d) && !eq(named, add(amountOf(a), amountOf(b)))) { out.push(mom("misconception_consequence", seq, { named: `${n}/${d}` }, "change-only-den")); return { state: bump(s), moments: out, refused: "not_sum" }; }
        if (!eq(named, add(amountOf(a), amountOf(b)))) { out.push(mom("law_refused", seq, { why: "not_sum", named: `${n}/${d}` })); return { state: bump(s), moments: out, refused: "not_sum" }; }
        out.push(mom("progress", seq, { named: `${n}/${d}` }));
        return { state: bump(pushUndo(s, { ...s, named })), moments: out };
      }
      return { state: bump(s), moments: out, refused: "no_name_here" };
    }
    case "done": {
      if (p.goal === "make") {
        const [tn, td] = p.target!;
        if (!eq(amountOf(s.bars[0]), rat(tn, td))) { out.push(mom("law_refused", seq, { why: "not_target", shown: barStr(s.bars[0]) })); return { state: bump(s), moments: out, refused: "not_target" }; }
        out.push(mom("solved", seq, { shown: barStr(s.bars[0]) }));
        return { state: bump(pushUndo(s, { ...s, done: true })), moments: out };
      }
      if (p.goal === "equal") {
        const ref = s.bars[0], mine = s.bars[1];
        if (!mine.shaded.length) { out.push(mom("law_refused", seq, { why: "nothing_shaded" })); return { state: bump(s), moments: out, refused: "nothing_shaded" }; }
        if (mine.d === ref.d) { out.push(mom("law_refused", seq, { why: "same_cut" })); return { state: bump(s), moments: out, refused: "same_cut" }; }
        if (!eq(amountOf(mine), amountOf(ref))) {
          const mal = equalMal(p, mine);
          if (mal) out.push(mom("misconception_consequence", seq, { shown: barStr(mine) }, mal));
          else out.push(mom("law_refused", seq, { why: "not_equal", shown: barStr(mine), ref: barStr(ref) }));
          return { state: bump(s), moments: out, refused: "not_equal" };
        }
        out.push(mom("solved", seq, { ref: barStr(ref), mine: barStr(mine) }));
        return { state: bump(pushUndo(s, { ...s, done: true })), moments: out };
      }
      if (p.goal === "add") {
        if (s.poured.length < 2) { out.push(mom("law_refused", seq, { why: "pour_both" })); return { state: bump(s), moments: out, refused: "pour_both" }; }
        if (level.fade === 3 && !s.named) return { state: bump(s), moments: out, refused: "name_it" };
        out.push(mom("solved", seq, { total: barStr(s.bars[2]) }));
        return { state: bump(pushUndo(s, { ...s, done: true })), moments: out };
      }
      return { state: bump(s), moments: out, refused: "choose_instead" };
    }
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
function equalMal(p: StripsParams, mine: Bar): string | null {
  const ref = p.bars[0], rn = ref.shaded.length, rd = ref.d, n = mine.shaded.length, d = mine.d;
  if (n - rn > 0 && n - rn === d - rd) return "add-same";
  if ((d === rd && n !== rn) || (n === rn && d !== rd)) return "one-side";
  return null;
}

const goalMet = (_l: PlayLevel<StripsParams>, s: StripsState) => s.done;

/** Cut sequence from d to D (D a multiple of d), each cut ≤ MAX_CUT. */
function cutsTo(d: number, D: number): number[] | null {
  let k = D / d; if (!Number.isInteger(k) || D > MAX_PARTS) return null;
  const out: number[] = [];
  while (k > 1) {
    let f = 0;
    for (let c = Math.min(MAX_CUT, k); c >= 2; c--) if (k % c === 0) { f = c; break; }
    if (!f) return null;
    out.push(f); k /= f;
  }
  return out;
}

function solve(level: PlayLevel<StripsParams>): StripsAct[] | null {
  const p = level.params, acts: StripsAct[] = [];
  const cuts = (bar: number, from: number, to: number) => { const cs = cutsTo(from, to); if (!cs) return false; for (const k of cs) acts.push({ kind: "cut", bar, k }); return true; };
  if (p.goal === "make") {
    const [tn, td] = p.target!, b = p.bars[0];
    if (level.fade === 3) { acts.push({ kind: "name", bar: 0, n: tn, d: td }); acts.push({ kind: "done" }); return acts; }
    const D = lcm(b.d, td); if (!cuts(0, b.d, D)) return null;
    const want = (tn * D) / td, have = (b.shaded.length * D) / b.d;
    const cur = new Set(b.shaded.flatMap((i) => range(D / b.d).map((j) => i * (D / b.d) + j)));
    if (have > want) for (const i of [...cur].slice(want)) acts.push({ kind: "shade", bar: 0, part: i });
    else for (let i = 0, added = 0; added < want - have && i < D; i++) if (!cur.has(i)) { acts.push({ kind: "shade", bar: 0, part: i }); added++; }
    acts.push({ kind: "done" });
    return acts;
  }
  if (p.goal === "equal") {
    const ref = p.bars[0], mine = p.bars[1];
    let D = 0;
    for (let m = 2; m * ref.d <= MAX_PARTS; m++) if (cutsTo(mine.d, m * ref.d)) { D = m * ref.d; break; }
    if (!D) { const g = gcd(ref.shaded.length, ref.d); if (g > 1 && cutsTo(mine.d, ref.d / g)) D = ref.d / g; }
    if (!D || D === ref.d) return null;
    if (level.fade === 3) { acts.push({ kind: "name", bar: 1, n: (ref.shaded.length * D) / ref.d, d: D }); acts.push({ kind: "done" }); return acts; }
    cuts(1, mine.d, D);
    const want = (ref.shaded.length * D) / ref.d;
    for (let i = 0; i < want; i++) acts.push({ kind: "shade", bar: 1, part: i });
    acts.push({ kind: "done" });
    return acts;
  }
  if (p.goal === "compare" || p.goal === "unit") {
    const truth = truthCompare(p), [a, b] = p.bars, D = lcm(a.d, b.d);
    acts.push({ kind: "choose", bar: truth });
    if (!cuts(0, a.d, D) || !cuts(1, b.d, D)) return null;
    if (a.d === b.d) return null;          // nothing to reveal: not a compare level
    acts.push({ kind: "choose", bar: truth });
    return acts;
  }
  if (p.goal === "add") {
    const [a, b, c] = p.bars, D = lcm(a.d, b.d);
    if (!cuts(0, a.d, D) || !cuts(1, b.d, D) || !cuts(2, c.d, D)) return null;
    acts.push({ kind: "pour", from: 0, to: 2 }, { kind: "pour", from: 1, to: 2 });
    if (level.fade === 3) { const t = add(amountOf(a), amountOf(b)); acts.push({ kind: "name", bar: 2, n: (t.n * D) / t.d, d: D }); }
    acts.push({ kind: "done" });
    return acts;
  }
  return null;
}

/** The goal never accepts a state the concept did not build: probe the act grammar's short non-conceptual routes. */
function shortcut(level: PlayLevel<StripsParams>): StripsAct[] | null {
  const p = level.params;
  const tries: StripsAct[][] = [[{ kind: "done" }]];
  if (p.goal === "compare" || p.goal === "unit") for (const c of [0, 1, -1]) tries.push([{ kind: "choose", bar: c }, { kind: "choose", bar: c }]);
  if (p.goal === "add") tries.push([{ kind: "pour", from: 0, to: 2 }, { kind: "pour", from: 1, to: 2 }, { kind: "done" }]);
  if (p.goal === "equal") tries.push([...range(p.bars[0].shaded.length).map((i) => ({ kind: "shade", bar: 1, part: i }) as StripsAct), { kind: "done" }]);
  for (const t of tries) {
    let s = init(level);
    for (const a of t) s = apply(level, s, a, 1).state;
    if (s.done) return t;
  }
  return null;
}

function malActs(level: PlayLevel<StripsParams>, mal: string): StripsAct[] | null {
  const p = level.params;
  if (p.goal === "compare" || p.goal === "unit") {
    for (const c of [0, 1, -1]) if (compareMal(p, c) === mal) return [{ kind: "choose", bar: c }];
    return null;
  }
  if (p.goal === "equal") {
    const ref = p.bars[0], rn = ref.shaded.length, rd = ref.d;
    if (mal === "add-same") { const n = rn + 1, d = rd + 1; return level.fade === 3 ? [{ kind: "name", bar: 1, n, d }] : [...(cutsTo(p.bars[1].d, d) ?? []).map((k) => ({ kind: "cut", bar: 1, k }) as StripsAct), ...range(n).map((i) => ({ kind: "shade", bar: 1, part: i }) as StripsAct), { kind: "done" }]; }
    if (mal === "one-side") { const d = rd * 2, n = rn; if (d > MAX_PARTS) return null; return level.fade === 3 ? [{ kind: "name", bar: 1, n, d }] : [...(cutsTo(p.bars[1].d, d) ?? []).map((k) => ({ kind: "cut", bar: 1, k }) as StripsAct), ...range(n).map((i) => ({ kind: "shade", bar: 1, part: i }) as StripsAct), { kind: "done" }]; }
    return null;
  }
  if (p.goal === "add" && level.fade === 3) {
    const [a, b] = p.bars, na = a.shaded.length, nb = b.shaded.length;
    const sol = solve(level); if (!sol) return null;
    const pre = sol.filter((x) => x.kind !== "name" && x.kind !== "done");
    if (mal === "add-across" && a.d !== b.d) return [...pre, { kind: "name", bar: 2, n: na + nb, d: a.d + b.d }];
    if (mal === "change-only-den" && a.d !== b.d) return [...pre, { kind: "name", bar: 2, n: na + nb, d: lcm(a.d, b.d) }];
    return null;
  }
  if (p.goal === "make" && mal === "part-part" && level.fade === 3) { const [tn, td] = p.target!; return tn !== td - tn ? [{ kind: "name", bar: 0, n: tn, d: td - tn }] : null; }
  return null;
}

function difficultyOf(p: StripsParams): number {
  const ds = p.bars.map((b) => b.d).concat(p.target ? [p.target[1]] : []);
  const big = Math.max(...ds), L = p.bars.length >= 2 ? lcm(p.bars[0].d, p.bars[1].d) : big;
  const goalW: Record<StripsGoal, number> = { make: 0, unit: 0.1, compare: 0.25, equal: 0.25, add: 0.4 };
  return Math.max(0, Math.min(1, goalW[p.goal] + 0.35 * (Math.log2(big) / Math.log2(24)) + 0.25 * (L / 24)));
}

function generate(req: GenRequest): Candidate<StripsParams>[] {
  const g = req.grammar as { dens?: number[]; goal?: StripsGoal };
  const goal: StripsGoal = (req.goal as StripsGoal) ?? g.goal ?? "make";
  const dens = g.dens ?? (req.classLevel <= 4 ? [2, 3, 4, 6, 8] : req.classLevel === 5 ? [2, 3, 4, 5, 6, 8, 10] : [2, 3, 4, 5, 6, 8, 10, 12]);
  const rnd = mulberry32(req.seed), out: Candidate<StripsParams>[] = [];
  const mk = (params: StripsParams, sig: string): Candidate<StripsParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `strips-${sig}-${req.seed}`, family: "todo-jodo", mode: "strips", topicId: req.topicId, skillId: req.skillId, fade: req.fade, goal, params,
      targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "roti-strips", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 0, solutions: 0, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const sh = (n: number) => range(n);
  if (goal === "make") for (const d of dens) for (let n = 1; n < d; n++) out.push(mk({ bars: [{ d: 1, shaded: [] }], goal, target: [n, d], locked: [] }, `make:${n}/${d}`));
  if (goal === "equal") for (const d of dens) for (let n = 1; n < d; n++) if (gcd(n, d) === 1 && d * 2 <= MAX_PARTS) out.push(mk({ bars: [{ d, shaded: sh(n) }, { d: 1, shaded: [] }], goal, locked: [0] }, `equal:${n}/${d}`));
  if (goal === "compare" || goal === "unit") {
    for (const a of dens) for (const b of dens) {
      if (a >= b || lcm(a, b) > MAX_PARTS) continue;
      if (goal === "unit") { out.push(mk({ bars: [{ d: a, shaded: [0] }, { d: b, shaded: [0] }], goal, locked: [0, 1] }, `unit:1/${a},1/${b}`)); continue; }
      for (let na = 1; na < a; na++) for (let nb = 1; nb < b; nb++) {
        if (rnd() > 0.35) continue;
        const swap = rnd() < 0.5;
        const bars = swap ? [{ d: b, shaded: sh(nb) }, { d: a, shaded: sh(na) }] : [{ d: a, shaded: sh(na) }, { d: b, shaded: sh(nb) }];
        out.push(mk({ bars, goal, locked: [0, 1] }, `cmp:${bars[0].shaded.length}/${bars[0].d},${bars[1].shaded.length}/${bars[1].d}`));
      }
    }
  }
  if (goal === "add") {
    for (const a of dens) for (const b of dens) {
      if (lcm(a, b) > MAX_PARTS) continue;
      for (let na = 1; na < a; na++) for (let nb = 1; nb < b; nb++) {
        if (cmp(add(rat(na, a), rat(nb, b)), rat(1, 1)) > 0 || rnd() > 0.3) continue;
        out.push(mk({ bars: [{ d: a, shaded: sh(na) }, { d: b, shaded: sh(nb) }, { d: 1, shaded: [] }], goal, locked: [0, 1] }, `add:${na}/${a}+${nb}/${b}`));
      }
    }
  }
  return out;
}

function facts(level: PlayLevel<StripsParams>, s: StripsState): Facts {
  const f: Facts = { goal: level.params.goal };
  s.bars.forEach((b, i) => { f[`bar${i + 1}`] = level.fade >= 2 ? barStr(b) : `${b.d} parts, ${b.shaded.length} shaded`; });
  if (level.params.target && level.fade >= 2) f.target = `${level.params.target[0]}/${level.params.target[1]}`;
  if (s.predicted !== null) f.predicted = s.predicted === -1 ? "same" : `bar${s.predicted + 1}`;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<StripsParams>, s: StripsState) {
  return { title: level.params.goal === "add" ? "Jodo" : "Barabar hisse", lines: s.bars.map((b, i) => `${i + 1}: ${ratStr(amountOf(b))} (${barStr(b)})`) };
}
function grade(level: PlayLevel<StripsParams>, acts: PlayActEnvelope<StripsAct>[]): PlayGrade {
  return gradeLevel(stripsLogic, level, acts, { decisiveRefusals: ["not_target", "not_equal", "wrong_prediction", "not_sum"], final: true });
}

export const stripsLogic: FamilyLogic<StripsParams, StripsState, StripsAct> = {
  family: "todo-jodo", modes: ["strips"], malRules: STRIPS_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
export const stripsHelpers = { amountOf, barStr, cutsTo, truthCompare };
