// Yantra · pendulum (round 7 E6, science puzzle-physics; c7-science-ch08-t01). A real pendulum (a thread, a bob) hangs
// beside a target rhythm: a mela drum that beats every T* seconds, or a clock-tower bell. The child sets three knobs, the
// thread's length (cm), the bob's mass (a choice of bobs, g) and the release angle (5-20°), then RUNs: the bob swings in real
// time with its real period beside the beat, and the law grades. Two goals:
//   match        make it swing with the beat: accepted when |T − T*| ≤ tol · T* (tol 4%). Only length can do it: the level
//                starts with the length well off the beat (never within 2 · tol, never one step from an accepted length)
//   oscillation  the knobs are set; release the bob and press "one more" each time it comes BACK to the side it started
//                from; after n presses the law checks every press against the real return times k · T (a press may come a
//                little early or late: −0.25 s … +0.4 s). Then n oscillations in the time on the stopwatch give one period
// THE LAW (exact, small-angle): T = 2π√(L/g), g = 9.8 m/s². The bob's mass is not in it; for swings of 20° or less the
// release angle is not in it either (the levels never go past 20°, so the small-angle law is the truth they show).
// PURE law + generator + solver + grader: no clock, no Math.random (the generator is seeded with mulberry32).
// Mal-rules (each with a deterministic malActs):
//   heavier-faster    match: to change the rhythm the child changes the bob (heavier to swing faster, lighter for slower)
//   amplitude-period  match: the child changes the release angle (a bigger pull for a slower swing, a smaller for faster)
//   half-oscillation  oscillation: one press at every end the bob reaches (one side to the other = "one"), so the presses
//                     come at k · T / 2
// A run that moved ONLY the mass (or ONLY the swing) since the last run (or the start) shows that mal-rule's consequence:
// the period did not move. The law sees which knob moved; nothing else decides it.
import type { Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, YantraAct } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export const G = 9.8;
export const LEN = { min: 10, max: 150, step: 5 } as const;
export const BOBS = [20, 50, 100, 200] as const;
export const SWINGS = [5, 10, 15, 20] as const;
export const TOL = 0.04;
/** a press for oscillation k may come this much before / after the real return k · T (s) */
export const EARLY = 0.25, LATE = 0.4;
export const CTXS = ["tower", "drum"] as const;
export const PENDULUM_MAL = ["heavier-faster", "amplitude-period", "half-oscillation"] as const;
export type Knob = "length" | "mass" | "swing";
export interface Knobs { length: number; mass: number; swing: number }

export interface PendulumParams {
  goal: "match" | "oscillation";
  /** the context skin (words and drawing only): the clock tower's bell or the mela drum */
  ctx: (typeof CTXS)[number];
  /** the knobs at the start */
  length: number; mass: number; swing: number;
  /** match: the target beat T* (s, two decimals) and the acceptance (a fraction of T*) */
  beat?: number; tol?: number;
  /** oscillation: how many full oscillations to count; the side the bob is released from */
  n?: number; side?: "left" | "right";
  /** the ruler beside the thread (fade): 1 every 10 cm labelled every 50, 2 ticks only, 3 none */
  marks: 1 | 2 | 3;
}
export interface PendulumState extends Undoable<PendulumState> {
  k: Knobs;
  /** the knobs at the last run (null before the first) and the period that run showed */
  ran: Knobs | null; lastT: number | null;
  runs: number;
  /** oscillation: the bob is swinging and the presses since its release */
  live: boolean; taps: number[];
  done: boolean; acts: number;
}

/** THE LAW: the period of a simple pendulum of length `cm`, seconds (exact small-angle; mass and swing are not in it) */
export const periodOf = (cm: number): number => 2 * Math.PI * Math.sqrt(cm / 100 / G);
/** every length the thread can be set to */
export const LENGTHS: number[] = Array.from({ length: (LEN.max - LEN.min) / LEN.step + 1 }, (_, i) => LEN.min + i * LEN.step);
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const onLen = (x: unknown): x is number => isInt(x) && x >= LEN.min && x <= LEN.max && (x - LEN.min) % LEN.step === 0;
const onBob = (x: unknown): x is number => (BOBS as readonly unknown[]).includes(x);
const onSwing = (x: unknown): x is number => (SWINGS as readonly unknown[]).includes(x);
const validKnob = (k: Knob, v: unknown) => (k === "length" ? onLen(v) : k === "mass" ? onBob(v) : onSwing(v));
/** within the beat's acceptance */
export const meetsBeat = (beat: number, tol: number, cm: number) => Math.abs(periodOf(cm) - beat) <= tol * beat;
/** the lengths the beat accepts */
export const acceptedLengths = (beat: number, tol: number) => LENGTHS.filter((L) => meetsBeat(beat, tol, L));
/** the length closest to the beat (the solver's) */
export const bestLength = (beat: number) => LENGTHS.reduce((b, L) => (Math.abs(periodOf(L) - beat) < Math.abs(periodOf(b) - beat) ? L : b), LENGTHS[0]);
/** what the teacher may not say before the child finds it: the lengths that keep the beat */
export function pendulumHidden(level: PlayLevel<unknown>): number[] {
  const p = level.params as Partial<PendulumParams> | null;
  return p && p.goal === "match" && typeof p.beat === "number" ? acceptedLengths(p.beat, p.tol ?? TOL) : [];
}
export const about = (s: number, d = 2) => `lagbhag ${s.toFixed(d)} s`;
const r2 = (x: number) => Math.round(x * 100) / 100;
/** a press for oscillation i (1-based) at `at` matches the return i · T */
const pressOk = (at: number, i: number, T: number) => at - i * T >= -EARLY && at - i * T <= LATE;
const knobsOf = (p: PendulumParams): Knobs => ({ length: p.length, mass: p.mass, swing: p.swing });
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });

function validate(level: PlayLevel<unknown>): PlayLevel<PendulumParams> | null {
  const p = level.params as Partial<PendulumParams> | null;
  if (!p || typeof p !== "object" || level.mode !== "pendulum") return null;
  if (p.goal !== "match" && p.goal !== "oscillation") return null;
  if (!(CTXS as readonly unknown[]).includes(p.ctx)) return null;
  if (!onLen(p.length) || !onBob(p.mass) || !onSwing(p.swing)) return null;
  const marks = p.marks === 2 || p.marks === 3 ? p.marks : 1;
  const base: PendulumParams = { goal: p.goal, ctx: p.ctx as PendulumParams["ctx"], length: p.length, mass: p.mass, swing: p.swing, marks };
  if (p.goal === "match") {
    const beat = Number(p.beat), tol = Number(p.tol ?? TOL);
    if (!Number.isFinite(beat) || beat < 0.6 || beat > 2.5 || Math.abs(beat * 100 - Math.round(beat * 100)) > 1e-6) return null;
    if (!Number.isFinite(tol) || tol < 0.02 || tol > 0.06) return null;
    // solvable by length, and not already solved by the start (a served level always asks for a change of length)
    if (!acceptedLengths(beat, tol).length || meetsBeat(beat, tol, p.length)) return null;
    return { ...level, params: { ...base, beat, tol } } as PlayLevel<PendulumParams>;
  }
  const n = Number(p.n);
  if (!isInt(n) || n < 3 || n > 8 || (p.side !== "left" && p.side !== "right")) return null;
  // the press windows of a full and of a half oscillation must never overlap: T / 2 > EARLY + LATE
  if (periodOf(p.length) / 2 <= EARLY + LATE + 0.05) return null;
  return { ...level, params: { ...base, n, side: p.side } } as PlayLevel<PendulumParams>;
}
function init(level: PlayLevel<PendulumParams>): PendulumState {
  return { k: knobsOf(level.params), ran: null, lastT: null, runs: 0, live: false, taps: [], done: false, acts: 0, prev: null, depth: 0 };
}

function runMatch(level: PlayLevel<PendulumParams>, s: PendulumState, seq: number, out: Moment[]): PendulumState {
  const p = level.params, beat = p.beat ?? 1, tol = p.tol ?? TOL, T = periodOf(s.k.length);
  const next = pushUndo(s, { ...s, ran: { ...s.k }, lastT: T, runs: s.runs + 1 });
  const f: Facts = { period: about(T), target: `${beat.toFixed(2)} s`, length: s.k.length, mass: s.k.mass, swing: s.k.swing };
  if (meetsBeat(beat, tol, s.k.length)) { out.push(mom("solved", seq, f)); return { ...next, done: true }; }
  const was = s.ran ?? knobsOf(p);
  const moved = (["length", "mass", "swing"] as Knob[]).filter((k) => s.k[k] !== was[k]);
  const only = moved.length === 1 ? moved[0] : null;
  const mal = only === "mass" ? "heavier-faster" : only === "swing" ? "amplitude-period" : null;
  if (mal && level.mal[mal]) { out.push(mom("misconception_consequence", seq, { ...f, moved: only as string }, mal)); return next; }
  const why = !moved.length ? "same" : !moved.includes("length") ? "length_same" : "off_beat";
  const near = moved.includes("length") && Math.abs(T - beat) <= 2 * tol * beat;
  out.push(mom(near ? "near_miss" : "law_refused", seq, { ...f, why, faster: T > beat ? "yes" : "no" }));
  return next;
}
function judgeTaps(level: PlayLevel<PendulumParams>, s: PendulumState, taps: number[], seq: number, out: Moment[]): PendulumState {
  const p = level.params, T = periodOf(p.length), n = p.n ?? 5, last = taps[taps.length - 1];
  const f: Facts = { n, time: `${last.toFixed(1)} s`, period: about(last / n), real: (Math.round((2 * last) / T) / 2).toString() };
  const next = pushUndo(s, { ...s, taps, live: false, runs: s.runs });
  if (taps.every((at, i) => pressOk(at, i + 1, T))) { out.push(mom("solved", seq, f)); return { ...next, done: true }; }
  if (level.mal["half-oscillation"] && taps.every((at, i) => pressOk(at, i + 1, T / 2))) {
    out.push(mom("misconception_consequence", seq, f, "half-oscillation"));
    return next;
  }
  out.push(mom("law_refused", seq, { ...f, why: "off_return", matched: taps.filter((at, i) => pressOk(at, i + 1, T)).length }));
  return next;
}

function apply(level: PlayLevel<PendulumParams>, s: PendulumState, act: YantraAct, seq: number): { state: PendulumState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: PendulumState): PendulumState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  if (act.kind === "set") {
    if (p.goal !== "match") return { state: bump(s), moments: out, refused: "locked" };
    const knob = act.knob as Knob;
    if (knob !== "length" && knob !== "mass" && knob !== "swing") return { state: bump(s), moments: out, refused: "bad_knob" };
    const v = Number(act.value);
    if (!validKnob(knob, v)) return { state: bump(s), moments: out, refused: "bad_value" };
    if (s.k[knob] === v) return { state: bump(s), moments: out, refused: "same" };
    return { state: bump(pushUndo(s, { ...s, k: { ...s.k, [knob]: v } })), moments: out };
  }
  if (act.kind === "run") {
    if (p.goal === "match") return { state: bump(runMatch(level, s, seq, out)), moments: out };
    // oscillation: release the bob from its side; the presses start again
    return { state: bump(pushUndo(s, { ...s, live: true, taps: [], runs: s.runs + 1, lastT: periodOf(p.length) })), moments: out };
  }
  if (act.kind === "count") {
    if (p.goal !== "oscillation") return { state: bump(s), moments: out, refused: "unknown_act" };
    if (!s.live) return { state: bump(s), moments: out, refused: "run_first" };
    const at = Number(act.at), n = p.n ?? 5;
    const prevAt = s.taps.length ? s.taps[s.taps.length - 1] : 0;
    if (!Number.isFinite(at) || at <= 0 || at <= prevAt || at > (n + 3) * periodOf(p.length) + 5) return { state: bump(s), moments: out, refused: "bad_time" };
    const taps = [...s.taps, r2(at)];
    if (taps.length < n) return { state: bump(pushUndo(s, { ...s, taps })), moments: out };
    return { state: bump(judgeTaps(level, s, taps, seq, out)), moments: out };
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<PendulumParams>, s: PendulumState) => s.done;

/** the presses at the return times `step` · 1, 2, … n after the release */
const pressActs = (n: number, step: number): YantraAct[] => [{ kind: "run" }, ...Array.from({ length: n }, (_, i) => ({ kind: "count" as const, at: r2((i + 1) * step) }))];
function solve(level: PlayLevel<PendulumParams>): YantraAct[] {
  const p = level.params;
  if (p.goal === "oscillation") return pressActs(p.n ?? 5, periodOf(p.length));
  return [{ kind: "set", knob: "length", value: bestLength(p.beat ?? 1) }, { kind: "run" }];
}
/**
 * Keeping the beat without the idea: the start already keeps it (just run), or one blind nudge of the thread does. Mass and
 * swing never move the period, so no sequence of them alone can. Oscillation has none: a steady press that matches every
 * return has seen the return.
 */
function shortcut(level: PlayLevel<PendulumParams>): YantraAct[] | null {
  const p = level.params;
  if (p.goal !== "match") return null;
  const beat = p.beat ?? 1, tol = p.tol ?? TOL;
  if (meetsBeat(beat, tol, p.length)) return [{ kind: "run" }];
  for (const L of [p.length - LEN.step, p.length + LEN.step]) if (onLen(L) && meetsBeat(beat, tol, L)) return [{ kind: "set", knob: "length", value: L }, { kind: "run" }];
  return null;
}
/** the knob value a child holding `mal` turns to (null when the belief has no move here) */
export function malKnob(p: PendulumParams, mal: string): { knob: Knob; value: number } | null {
  if (p.goal !== "match") return null;
  const faster = (p.beat ?? 1) < periodOf(p.length);
  if (mal === "heavier-faster") {
    // heavier to swing faster, lighter to swing slower: the next bob that way
    const i = BOBS.indexOf(p.mass as (typeof BOBS)[number]), j = faster ? i + 1 : i - 1;
    return j >= 0 && j < BOBS.length ? { knob: "mass", value: BOBS[j] } : null;
  }
  if (mal === "amplitude-period") {
    // a smaller pull to swing faster, a bigger pull to swing slower
    const i = SWINGS.indexOf(p.swing as (typeof SWINGS)[number]), j = faster ? i - 1 : i + 1;
    return j >= 0 && j < SWINGS.length ? { knob: "swing", value: SWINGS[j] } : null;
  }
  return null;
}
function malActs(level: PlayLevel<PendulumParams>, mal: string): YantraAct[] | null {
  const p = level.params;
  if (mal === "half-oscillation") return p.goal === "oscillation" ? pressActs(p.n ?? 5, periodOf(p.length) / 2) : null;
  const m = malKnob(p, mal);
  return m ? [{ kind: "set", knob: m.knob, value: m.value }, { kind: "run" }] : null;
}

interface PendulumGrammar { goal?: "match" | "oscillation"; tol?: number; lo?: number; hi?: number }
function difficultyOf(p: PendulumParams): number {
  if (p.goal === "oscillation") return Math.min(1, 0.35 + 0.06 * ((p.n ?? 5) - 4) + (periodOf(p.length) < 1.8 ? 0.1 : 0) + 0.05 * (p.marks - 1));
  const far = Math.abs(Math.log(p.length / bestLength(p.beat ?? 1)));
  return Math.min(1, 0.3 + 0.25 * Math.min(1, far / 1.5) + ((p.beat ?? 1) > periodOf(p.length) ? 0.05 : 0) + 0.06 * (p.marks - 1));
}
function generate(req: GenRequest): Candidate<PendulumParams>[] {
  const g = req.grammar as PendulumGrammar;
  const goal: "match" | "oscillation" = (req.goal ?? g.goal) === "oscillation" ? "oscillation" : "match";
  const tol = typeof g.tol === "number" && g.tol >= 0.02 && g.tol <= 0.06 ? g.tol : TOL;
  const rnd = mulberry32(req.seed), out: Candidate<PendulumParams>[] = [], seen = new Set<string>();
  const marks = req.fade as 1 | 2 | 3;
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length) % xs.length];
  const mk = (params: PendulumParams, sig: string): Candidate<PendulumParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `yantra-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "yantra", mode: "pendulum", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: params.ctx, seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  for (let k = 0; k < 80 && out.length < 24; k++) {
    const ctx = pick(CTXS);
    if (goal === "oscillation") {
      const length = pick(LENGTHS.filter((L) => L >= 60));
      const n = 4 + Math.floor(rnd() * 3), side = rnd() < 0.5 ? "left" : "right";
      const params: PendulumParams = { goal, ctx, length, mass: pick(BOBS), swing: pick(SWINGS.filter((a) => a >= 10)), n, side, marks };
      const sig = `oscillation:${length}:${n}:${side}`;
      if (seen.has(sig)) continue;
      seen.add(sig); out.push(mk(params, sig));
      continue;
    }
    // the beat comes from a length the thread can really take; the start is well off it, so only length can bring it in
    const lo = typeof g.lo === "number" ? g.lo : 20, hi = typeof g.hi === "number" ? g.hi : 140;
    const tl = pick(LENGTHS.filter((L) => L >= lo && L <= hi));
    const beat = r2(periodOf(tl));
    const starts = LENGTHS.filter((L) => Math.abs(periodOf(L) - beat) > 2 * tol * beat);
    if (!starts.length) continue;
    const length = pick(starts);
    const params: PendulumParams = { goal, ctx, length, mass: pick([50, 100]), swing: pick([10, 15]), beat, tol, marks };
    const sig = `match:${ctx}:${beat.toFixed(2)}:${length}:${params.mass}:${params.swing}`;
    if (seen.has(sig)) continue;
    const lv = mk(params, sig).level;
    if (!acceptedLengths(beat, tol).length || shortcut(lv)) continue;
    seen.add(sig); out.push(mk(params, sig));
  }
  return out;
}
function facts(level: PlayLevel<PendulumParams>, s: PendulumState): Facts {
  const p = level.params;
  const f: Facts = { goal: p.goal, length: s.k.length, mass: s.k.mass, swing: s.k.swing };
  if (p.goal === "match") f.target = `${(p.beat ?? 1).toFixed(2)} s`;
  else { f.n = p.n ?? 5; f.counted = s.taps.length; }
  if (s.lastT !== null && p.goal === "match") f.period = about(s.lastT);
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<PendulumParams>, s: PendulumState) {
  const p = level.params;
  const knobs = [`thread ${s.k.length} cm`, `bob ${s.k.mass} g`, `swing ${s.k.swing}°`];
  if (p.goal === "oscillation") {
    return { title: "Pendulum", lines: [`count ${p.n} oscillations (start side: ${p.side})`, ...knobs, `counted ${s.taps.length}${s.taps.length ? ` · last at ${s.taps[s.taps.length - 1].toFixed(1)} s` : ""}`] };
  }
  const last = s.lastT !== null ? [`last run: ${about(s.lastT)} vs ${(p.beat ?? 1).toFixed(2)} s`] : [];
  return { title: "Pendulum", lines: [`beat every ${(p.beat ?? 1).toFixed(2)} s`, ...knobs, ...last] };
}
function grade(level: PlayLevel<PendulumParams>, acts: PlayActEnvelope<YantraAct>[]): PlayGrade {
  return gradeLevel(pendulumLogic, level, acts, { final: true });
}

export const pendulumLogic: FamilyLogic<PendulumParams, PendulumState, YantraAct> = {
  family: "yantra", modes: ["pendulum"], malRules: PENDULUM_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
