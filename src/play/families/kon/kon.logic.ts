// Kon (कोण) · angles as an amount of turning (round 4 G1, E1 angles; FEASIBILITY.md §4.3). The child turns an arm (the
// ship's nose, a cannon) about a fixed centre and commits; the law answers with where the arm should point and draws the
// turn between. Two goals:
//   turn  a quarter / half / three-quarter turn, clockwise or anticlockwise, from a start heading (c5-maths-ch03-t01)
//   set   open the arm to a given number of degrees from a base arm, reading a protractor (c6-maths-ch02-t03)
// r7 (studio-play-coverage-expansion), three more modes on the same arm:
//   zone/kind   open an angle of a KIND (acute, right, obtuse, straight, reflex) from a base arm that may be tilted and may
//               open either way; no numbers: the kind is the skill (c4-maths-ch01-t02, c5-maths-ch03-t02, c6-maths-ch02-t04)
//   zone/match  open your short-armed angle to equal a reference angle drawn elsewhere with long arms and a big arc
//               (arm length and arc size are not the angle: c4-maths-ch01-t02 s2, c6-maths-ch02-t02 s3)
//   pair/linear ∠AOC is stated, never drawn; the protractor sits only on the B side; open ∠COB (c7-maths-ch05-t01 s1)
//   close/tri   a triangle on base AB: ∠A is drawn, the top angle is stated; turn the arm at B so it closes (c7-maths-ch07-t03 s2)
//   close/iso   the same with AC = BC: ∠A is drawn (∠B = ∠A), or the top angle is stated (c7-maths-ch09-t03 s1, s2)
// PURE law + generator + solver + grader. Angles in degrees, 0 = pointing right, anticlockwise positive (the maths
// convention); the view may draw it any way it likes.
// Mal-rules: cw-confuse (turns the other way) · half-is-quarter (a half turn for a quarter, a quarter for a half) ·
// wrong-scale (reads the protractor's other scale: 180 − θ) · orientation (a tilted base: the "right angle" is made
// standing straight up instead) · reflex-missing (a reflex asked, the smaller angle made) · linear-90 (a linear pair read
// as adding to 90°) · wrong-pair (isosceles: the top angle made equal to ∠A instead of ∠B).
// r7 kon2: lines (parallel / perpendicular on squared paper), cross (a transversal: corresponding and alternate angles) and
// ends (segment / ray / line by where the stops sit): the law lives in kon.lines.ts; each function below hands a line goal
// there first, so every earlier goal runs exactly the code it ran before.
// r8: place (c6-maths-ch02-t03): the child PLACES a loose protractor (move, spin, lock), then measures, draws or compares
// (measure, draw, size); the law lives in kon.place.ts and every function below hands a place goal there first too.
import type { Candidate, FamilyLogic, Facts, GenRequest, KonAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";
import { PLACE_MAL, generatePlace, initPlace, isPlaceGoal, malPlace, placeDifficulty, placeFacts, placeValueFacts, shortcutPlace, solvePlace, stepPlace, validatePlace, type PlaceAct, type PlaceFields, type PlaceGoal, type PlaceState } from "./kon.place.ts";
import { LINE_MAL, endsMal, endsTarget, generateLine, isLineGoal, ldiff, lineDifficulty, lineMalHeading, lineMeets, lineTarget, lineValueFacts, sameStops, stopsOk, validateLine, type Fig, type LineGoal, type LineParams, type Stops } from "./kon.lines.ts";

export type KonGoal = "turn" | "set" | "kind" | "match" | "linear" | "tri" | "iso" | LineGoal | PlaceGoal;
export type AngleKind = "acute" | "right" | "obtuse" | "straight" | "reflex";
export const ANGLE_KINDS: readonly AngleKind[] = ["acute", "right", "obtuse", "straight", "reflex"];
export interface KonParams extends Omit<LineParams, "goal">, PlaceFields {
  goal: KonGoal;
  /** the arm's heading at the start (turn) or the base arm's heading (set), degrees */
  start: number;
  /** turn: quarter turns (1, 2, 3) and the direction */
  q?: 1 | 2 | 3; dir?: "cw" | "acw";
  /** set: the angle to open, degrees (from the base arm, anticlockwise, or clockwise when mirrored) */
  theta?: number; mirror?: boolean;
  /** kind: the kind of angle to make (opened from the base arm `start`, in the `mirror` sense) */
  kind?: AngleKind;
  /** match: the reference angle (degrees), drawn with long arms at its own base heading `refStart` */
  ref?: number; refStart?: number;
  /** linear: the stated ∠AOC (A is on the far side of the line); tri/iso: ∠A, drawn at A */
  given?: number;
  /** tri: the stated top angle; iso with `isoBy` "apex": the stated top angle */
  apex?: number; isoBy?: "base" | "apex";
  /** acceptance, degrees */
  tol: number;
  /** what the dial shows (fade): every 10°, every 30°, or only 0 / 90 / 180 */
  scale: "10" | "30" | "landmarks";
}
export interface KonState extends Undoable<KonState> { heading: number | null; commits: number; done: boolean; acts: number; stops?: Stops; pl?: PlaceState }
export const KON_MAL = ["cw-confuse", "half-is-quarter", "wrong-scale", "orientation", "reflex-missing", "linear-90", "wrong-pair", ...LINE_MAL, ...PLACE_MAL] as const;
/** the goals each mode plays */
export const KON_GOALS: Record<string, readonly KonGoal[]> = { turn: ["turn"], set: ["set"], zone: ["kind", "match"], pair: ["linear"], close: ["tri", "iso"],
  lines: ["parallel", "perp"], cross: ["corr", "alt"], ends: ["ends"], place: ["measure", "draw", "size"] };
export const modeOfGoal = (g: KonGoal): string => (Object.entries(KON_GOALS).find(([, gs]) => gs.includes(g))?.[0] ?? g);
/** the angle (degrees from the base arm) each kind accepts, and the one the solver makes */
export const KIND_ZONE: Record<AngleKind, { lo: number; hi: number; make: number }> = {
  acute: { lo: 12, hi: 78, make: 45 }, right: { lo: 0, hi: 0, make: 90 }, obtuse: { lo: 102, hi: 168, make: 135 },
  straight: { lo: 0, hi: 0, make: 180 }, reflex: { lo: 192, hi: 348, make: 270 },
};
/** the opening (degrees from the base arm) a set-like goal asks for: set θ, match ref, linear 180 − given, tri 180 − ∠A − top,
 *  iso ∠A (base) or (180 − top) / 2 (apex) */
export function openingOf(p: KonParams): number {
  switch (p.goal) {
    case "set": return p.theta ?? 0;
    case "kind": return KIND_ZONE[p.kind ?? "right"].make;
    case "match": return p.ref ?? 0;
    case "linear": return 180 - (p.given ?? 0);
    case "tri": return 180 - (p.given ?? 0) - (p.apex ?? 0);
    case "iso": return p.isoBy === "apex" ? (180 - (p.apex ?? 0)) / 2 : (p.given ?? 0);
    default: return 0;
  }
}
/** the opening of heading h from the base arm, in the goal's sense (0 … 360) */
export const openingAt = (p: KonParams, h: number) => norm((p.mirror ? -1 : 1) * (h - p.start));
/** whether heading h meets the goal (a zone for acute / obtuse / reflex; within tolerance of the target otherwise) */
export function meets(p: KonParams, h: number): boolean {
  if (isLineGoal(p.goal)) return lineMeets(p, h);
  if (p.goal === "kind" && p.kind && KIND_ZONE[p.kind].hi > 0) { const a = openingAt(p, h), z = KIND_ZONE[p.kind]; return a >= z.lo && a <= z.hi; }
  return diff(h, targetOf(p)) <= p.tol;
}

export const norm = (d: number) => ((d % 360) + 360) % 360;
/** the shortest unsigned difference between two headings */
export const diff = (a: number, b: number) => { const d = Math.abs(norm(a) - norm(b)); return Math.min(d, 360 - d); };
export function targetOf(p: KonParams): number {
  if (isLineGoal(p.goal)) return lineTarget(p);
  if (p.goal === "turn") return norm(p.start + (p.dir === "acw" ? 1 : -1) * 90 * (p.q ?? 1));
  return norm(p.start + (p.mirror ? -1 : 1) * openingOf(p));
}
/** where a child holding mal-rule `mal` points the arm (null = the belief says nothing different here) */
export function malHeading(p: KonParams, mal: string): number | null {
  if (isLineGoal(p.goal)) return lineMalHeading(p, mal);
  const t = targetOf(p);
  let h: number | null = null;
  if (p.goal === "turn" && mal === "cw-confuse") h = norm(p.start + (p.dir === "acw" ? -1 : 1) * 90 * (p.q ?? 1));
  if (p.goal === "turn" && mal === "half-is-quarter" && (p.q === 1 || p.q === 2)) h = norm(p.start + (p.dir === "acw" ? 1 : -1) * 90 * (p.q === 1 ? 2 : 1));
  if (p.goal === "set" && mal === "wrong-scale") h = norm(p.start + (p.mirror ? -1 : 1) * (180 - (p.theta ?? 0)));
  // a tilted base: the L-shaped "right angle" stands straight up (or down) whatever the base does
  if (p.goal === "kind" && p.kind === "right" && mal === "orientation" && p.start % 90 !== 0) h = norm(p.mirror ? 270 : 90);
  // a reflex asked: the smaller angle on the same arms (the obtuse one)
  if (p.goal === "kind" && p.kind === "reflex" && mal === "reflex-missing") h = norm(p.start + (p.mirror ? -1 : 1) * 135);
  if (p.goal === "linear" && mal === "linear-90" && (p.given ?? 90) < 80) h = norm(p.start + (p.mirror ? -1 : 1) * (90 - (p.given ?? 0)));
  // isosceles: the top angle made equal to ∠A, so ∠B = 180 − 2∠A
  if (p.goal === "iso" && p.isoBy !== "apex" && mal === "wrong-pair") h = norm(p.start + (p.mirror ? -1 : 1) * (180 - 2 * (p.given ?? 0)));
  if (h === null || meets(p, h)) return null;
  return p.goal === "kind" || diff(h, t) > 3 * p.tol ? h : null;
}
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
/** the value the child is working towards, as on-screen facts (never a sentence) */
export function valueFacts(p: KonParams): Facts {
  if (isPlaceGoal(p.goal)) return placeValueFacts(p);
  if (isLineGoal(p.goal)) return lineValueFacts(p);
  switch (p.goal) {
    case "turn": return { turn: `${p.q}/4`, dir: p.dir ?? "cw" };
    case "set": return { angle: `${p.theta}°` };
    case "kind": return { kind: p.kind ?? "right" };
    case "match": return { match: "reference" };
    case "linear": return { given: `${p.given}°` };
    case "tri": return { a: `${p.given}°`, top: `${p.apex}°` };
    case "iso": return p.isoBy === "apex" ? { top: `${p.apex}°`, iso: "yes" } : { a: `${p.given}°`, iso: "yes" };
  }
  return {};
}

const intIn = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
function validate(level: PlayLevel<unknown>): PlayLevel<KonParams> | null {
  const p = level.params as Partial<KonParams> | null;
  if (p && isPlaceGoal(p.goal)) { const q = validatePlace<KonParams>(p); return q ? ({ ...level, params: q } as PlayLevel<KonParams>) : null; }
  if (p && isLineGoal(p.goal)) { const q = validateLine(p as Partial<LineParams>); return q ? ({ ...level, params: q } as PlayLevel<KonParams>) : null; }
  if (!p || !["turn", "set", "kind", "match", "linear", "tri", "iso"].includes(p.goal as string)) return null;
  if (p.goal !== "turn" && p.goal !== "set") return validateMore(level, p);
  const start = Number(p.start), tol = Number(p.tol);
  if (!Number.isFinite(start) || !(tol >= 1 && tol <= 15)) return null;
  const scale = p.scale === "30" || p.scale === "landmarks" ? p.scale : "10";
  if (p.goal === "turn") {
    if (![1, 2, 3].includes(Number(p.q)) || (p.dir !== "cw" && p.dir !== "acw")) return null;
    return { ...level, params: { goal: "turn", start: norm(start), q: Number(p.q) as 1 | 2 | 3, dir: p.dir, tol, scale } } as PlayLevel<KonParams>;
  }
  const theta = Number(p.theta);
  if (!Number.isInteger(theta) || theta < 5 || theta > 175) return null;
  return { ...level, params: { goal: "set", start: norm(start), theta, mirror: !!p.mirror, tol, scale } } as PlayLevel<KonParams>;
}
/** the r7 goals: each value in its range, and the asked opening a real angle (a triangle that closes, an integer base) */
function validateMore(level: PlayLevel<unknown>, p: Partial<KonParams>): PlayLevel<KonParams> | null {
  const start = Number(p.start), tol = Number(p.tol);
  if (!Number.isFinite(start) || !(tol >= 1 && tol <= 15)) return null;
  const scale = p.scale === "30" || p.scale === "landmarks" ? p.scale : "10";
  const base = { goal: p.goal as KonGoal, start: norm(start), mirror: !!p.mirror, tol, scale } as KonParams;
  let q: KonParams | null = null;
  if (p.goal === "kind") q = ANGLE_KINDS.includes(p.kind as AngleKind) ? { ...base, kind: p.kind } : null;
  if (p.goal === "match") { const ref = intIn(p.ref, 10, 170), rs = Number(p.refStart); q = ref !== null && Number.isFinite(rs) ? { ...base, ref, refStart: norm(rs) } : null; }
  if (p.goal === "linear") { const given = intIn(p.given, 10, 170); q = given !== null ? { ...base, given } : null; }
  if (p.goal === "tri") { const given = intIn(p.given, 10, 150), apex = intIn(p.apex, 10, 150); q = given !== null && apex !== null && given + apex <= 170 ? { ...base, given, apex } : null; }
  if (p.goal === "iso") {
    if (p.isoBy === "apex") { const apex = intIn(p.apex, 10, 160); q = apex !== null && apex % 2 === 0 ? { ...base, apex, isoBy: "apex" } : null; }
    else { const given = intIn(p.given, 10, 85); q = given !== null ? { ...base, given, isoBy: "base" } : null; }
  }
  return q ? ({ ...level, params: q } as PlayLevel<KonParams>) : null;
}
const init = (l: PlayLevel<KonParams>): KonState => (isPlaceGoal(l.params.goal) ? { heading: null, commits: 0, done: false, acts: 0, prev: null, depth: 0, pl: initPlace(l.params) }
  : l.params.goal === "ends"
  ? { heading: null, commits: 0, done: false, acts: 0, prev: null, depth: 0, stops: { lo: -2, hi: -2 } }
  : { heading: null, commits: 0, done: false, acts: 0, prev: null, depth: 0 });

function apply(level: PlayLevel<KonParams>, s: KonState, act: KonAct, seq: number): { state: KonState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: KonState): KonState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  if (isPlaceGoal(p.goal)) return applyPlace(level, s, act as unknown as PlaceAct, seq, out, bump);
  if (act.kind === "turn") {
    const d = Number(act.deg);
    if (!Number.isFinite(d)) return { state: bump(s), moments: out, refused: "bad_turn" };
    return { state: bump(pushUndo(s, { ...s, heading: norm(d) })), moments: out };
  }
  if (act.kind === "stop") {
    if (p.goal !== "ends") return { state: bump(s), moments: out, refused: "unknown_act" };
    const n = p.names?.length ?? 0, at = Number(act.at);
    if ((act.side !== "lo" && act.side !== "hi") || !Number.isInteger(at) || at < -2 || at >= n) return { state: bump(s), moments: out, refused: "bad_stop" };
    const stops = { ...(s.stops ?? { lo: -2, hi: -2 }), [act.side]: at };
    if (!stopsOk({ lo: stops.lo === -2 ? -1 : stops.lo, hi: stops.hi === -2 ? -1 : stops.hi })) return { state: bump(s), moments: out, refused: "stops_cross" };
    return { state: bump(pushUndo(s, { ...s, stops })), moments: out };
  }
  if (act.kind === "commit" && p.goal === "ends") return commitEnds(level, s, seq, out, bump);
  if (act.kind === "commit" && isLineGoal(p.goal)) return commitLine(level, s, seq, out, bump);
  if (act.kind === "commit") {
    if (s.heading === null) return { state: bump(s), moments: out, refused: "turn_first" };
    const t = targetOf(p), e = p.goal === "kind" && meets(p, s.heading) ? 0 : diff(s.heading, t);
    const next = bump(pushUndo(s, { ...s, commits: s.commits + 1 }));
    const at = Math.round(s.heading), truth = Math.round(t);
    if (meets(p, s.heading)) { out.push(mom("solved", seq, { ...valueFacts(p), at, truth })); return { state: { ...next, done: true }, moments: out }; }
    const g: Facts = Math.round(e) === e ? { gap: `${e}°` } : { gap_about: `${Math.round(e)}°` };
    for (const mal of Object.keys(level.mal)) {
      const mh = malHeading(p, mal);
      if (mh !== null && diff(s.heading, mh) <= p.tol) { out.push(mom("misconception_consequence", seq, { ...valueFacts(p), at, truth, ...g }, mal)); return { state: next, moments: out, refused: "missed" }; }
    }
    out.push(mom(e <= 2 * p.tol ? "near_miss" : "law_refused", seq, { ...valueFacts(p), at, truth, ...g, why: "landed_off" }));
    return { state: next, moments: out, refused: "missed" };
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
type Bump = (st: KonState) => KonState;
type Applied = { state: KonState; moments: Moment[]; refused?: string };
/** place: the protractor's acts; a read / join / pick is the committed decision (a miss is decisive, as every kon commit) */
function applyPlace(level: PlayLevel<KonParams>, s: KonState, act: PlaceAct, seq: number, out: Moment[], bump: Bump): Applied {
  const r = stepPlace(level.params, s.pl ?? initPlace(level.params), act, level.mal);
  if (r.refused) return { state: bump(s), moments: out, refused: r.refused };
  if (!r.commit) return { state: bump(pushUndo(s, { ...s, pl: r.pl })), moments: out };
  const next = bump(pushUndo(s, { ...s, pl: r.pl, commits: s.commits + 1, done: !!r.commit.done }));
  out.push(mom(r.commit.kind, seq, { ...valueFacts(level.params), ...r.commit.facts }, r.commit.mis));
  return r.commit.done ? { state: next, moments: out } : { state: next, moments: out, refused: "missed" };
}
/** lines / cross: the arm is a line (h and h + 180 the same); the gap is the angle between the two lines */
function commitLine(level: PlayLevel<KonParams>, s: KonState, seq: number, out: Moment[], bump: Bump): Applied {
  const p = level.params;
  if (s.heading === null) return { state: bump(s), moments: out, refused: "turn_first" };
  const next = bump(pushUndo(s, { ...s, commits: s.commits + 1 }));
  const t = targetOf(p), at = Math.round(s.heading), truth = Math.round(t), e = ldiff(s.heading, t);
  if (meets(p, s.heading)) { out.push(mom("solved", seq, { ...valueFacts(p), at, truth })); return { state: { ...next, done: true }, moments: out }; }
  const g: Facts = Math.round(e) === e ? { gap: `${e}°` } : { gap_about: `${Math.round(e)}°` };
  for (const mal of Object.keys(level.mal)) {
    const mh = malHeading(p, mal);
    if (mh !== null && ldiff(s.heading, mh) <= p.tol) { out.push(mom("misconception_consequence", seq, { ...valueFacts(p), at, truth, ...g }, mal)); return { state: next, moments: out, refused: "missed" }; }
  }
  out.push(mom(e <= 2 * p.tol ? "near_miss" : "law_refused", seq, { ...valueFacts(p), at, truth, ...g, why: "landed_off" }));
  return { state: next, moments: out, refused: "missed" };
}
/** ends: both stops placed; the figure left between them is the named one, or it is not */
function commitEnds(level: PlayLevel<KonParams>, s: KonState, seq: number, out: Moment[], bump: Bump): Applied {
  const p = level.params, st = s.stops ?? { lo: -2, hi: -2 };
  if (st.lo === -2 || st.hi === -2) return { state: bump(s), moments: out, refused: "stops_first" };
  const next = bump(pushUndo(s, { ...s, commits: s.commits + 1 }));
  const f: Facts = { ...valueFacts(p), lo: st.lo, hi: st.hi };
  if (sameStops(st, endsTarget(p))) { out.push(mom("solved", seq, f)); return { state: { ...next, done: true }, moments: out }; }
  for (const mal of Object.keys(level.mal)) {
    const ms = endsMal(p, mal);
    if (ms && sameStops(st, ms)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: next, moments: out, refused: "missed" }; }
  }
  out.push(mom("law_refused", seq, { ...f, why: "other_figure" }));
  return { state: next, moments: out, refused: "missed" };
}
const stopActs = (st: Stops): KonAct[] => [{ kind: "stop", side: "lo", at: st.lo }, { kind: "stop", side: "hi", at: st.hi }, { kind: "commit" }];
const goalMet = (_l: PlayLevel<KonParams>, s: KonState) => s.done;
const solve = (level: PlayLevel<KonParams>): KonAct[] => (isPlaceGoal(level.params.goal) ? solvePlace(level.params) as KonAct[]
  : level.params.goal === "ends" ? stopActs(endsTarget(level.params))
  : [{ kind: "turn", deg: targetOf(level.params) }, { kind: "commit" }]);
/** without the concept a child can only point at a landmark it can see (right, up, left, down; on a protractor 0 / 90 /
 *  180 from the base arm); a target within tolerance of one would be passed by guessing, so it is never served */
function shortcut(level: PlayLevel<KonParams>): KonAct[] | null {
  if (isPlaceGoal(level.params.goal)) return shortcutPlace(level.params, level.mal) as KonAct[] | null;
  const p = level.params, t = targetOf(p);
  if (p.goal === "ends") return null;   // where each stop sits IS the skill (a figure is its ends)
  if (isLineGoal(p.goal)) {
    // lines: the landmarks are flat and upright; cross: the protractor's 0 / 90 / 180 from the road ray at X2
    const marks = p.goal === "corr" || p.goal === "alt" ? [0, 90, 180].map((o) => (p.start + (p.t2 === "down" ? 180 : 0) + o) % 360) : [0, 90];
    for (const g of marks) if (meets(p, g)) return [{ kind: "turn", deg: g }, { kind: "commit" }];
    return null;
  }
  if (p.goal === "turn") return null;   // every quarter heading is a landmark: which one is the skill (four choices, 3 wrong)
  if (p.goal === "kind") return null;   // the kind IS the skill: right and straight are landmarks by definition
  for (const off of [0, 90, 180]) { const g = norm(p.start + (p.mirror ? -1 : 1) * off); if (diff(g, t) <= p.tol) return [{ kind: "turn", deg: g }, { kind: "commit" }]; }
  return null;
}
function malActs(level: PlayLevel<KonParams>, mal: string): KonAct[] | null {
  if (isPlaceGoal(level.params.goal)) return malPlace(level.params, mal) as KonAct[] | null;
  if (level.params.goal === "ends") { const st = endsMal(level.params, mal); return st ? stopActs(st) : null; }
  const h = malHeading(level.params, mal);
  return h === null ? null : [{ kind: "turn", deg: h }, { kind: "commit" }];
}

interface KonGrammar { goal?: KonGoal; q?: (1 | 2 | 3)[]; tol?: number; tolPx?: number; mirror?: boolean; kinds?: AngleKind[]; isoBy?: ("base" | "apex")[]; figs?: Fig[]; grid?: boolean }
function difficultyOf(p: KonParams): number {
  if (isPlaceGoal(p.goal)) return placeDifficulty(p);
  if (isLineGoal(p.goal)) return lineDifficulty(p);
  if (p.goal === "kind") return Math.min(1, 0.2 + (p.kind === "reflex" ? 0.3 : p.kind === "straight" ? 0.15 : 0) + (p.start % 90 ? 0.2 : 0) + (p.mirror ? 0.1 : 0));
  if (p.goal === "match") return Math.min(1, 0.3 + (Math.abs((p.refStart ?? 0) - p.start) % 180 ? 0.2 : 0) + ((p.ref ?? 0) % 10 ? 0.1 : 0));
  if (p.goal === "linear" || p.goal === "tri" || p.goal === "iso") return Math.min(1, 0.45 + (p.scale === "landmarks" ? 0.25 : p.scale === "30" ? 0.1 : 0) + (openingOf(p) % 10 ? 0.1 : 0));
  if (p.goal === "turn") return Math.min(1, 0.2 + ((p.q ?? 1) === 3 ? 0.25 : (p.q ?? 1) === 2 ? 0.1 : 0) + (p.dir === "acw" ? 0.05 : 0) + (p.start % 180 ? 0.1 : 0));
  return Math.min(1, 0.3 + (p.mirror ? 0.15 : 0) + (p.scale === "landmarks" ? 0.25 : p.scale === "30" ? 0.1 : 0) + ((p.theta ?? 0) % 10 ? 0.1 : 0));
}
function generate(req: GenRequest): Candidate<KonParams>[] {
  const g = req.grammar as KonGrammar;
  const goal = (req.goal as KonGoal) ?? g.goal ?? (KON_GOALS[req.mode]?.[0] as KonGoal | undefined) ?? "turn";
  const rnd = mulberry32(req.seed), out: Candidate<KonParams>[] = [];
  const scale: KonParams["scale"] = req.fade === 1 ? "10" : req.fade === 2 ? "30" : "landmarks";
  const mk = (params: KonParams, sig: string): Candidate<KonParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `kon-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "kon", mode: modeOfGoal(goal) as PlayLevel["mode"], topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "space", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  if (isPlaceGoal(goal)) return generatePlace(goal, g, rnd, req.fade).map(({ params, sig }) => mk(params as KonParams, sig));
  if (isLineGoal(goal)) return generateLine(goal, g, rnd, req.fade).map(({ params, sig }) => mk(params as KonParams, sig));
  if (goal === "turn") {
    for (const start of [0, 90, 180, 270]) for (const q of g.q ?? [1, 2, 3]) for (const dir of ["cw", "acw"] as const)
      out.push(mk({ goal, start, q, dir, tol: g.tol ?? 12, scale }, `turn:${start}:${q}${dir}`));
    return out;
  }
  if (goal !== "set") return generateMore(goal, g, rnd, scale, mk);
  for (let k = 0; k < 40; k++) {
    const theta = 15 + 5 * Math.floor(rnd() * 31);                       // 15° … 165° in 5° steps
    if (Math.abs(theta - 90) < 10 || theta > 165) continue;
    const mirror = g.mirror === false ? false : rnd() < 0.4;
    const start = mirror ? 180 : 0;
    out.push(mk({ goal, start, theta, mirror, tol: g.tol ?? 3, scale }, `set:${theta}${mirror ? "m" : ""}`));
  }
  return out;
}
/** a set-like opening is served only away from the protractor's landmarks (0 / 90 / 180), or pointing at one would pass */
const offLandmark = (a: number, tol: number) => [0, 90, 180].every((l) => Math.abs(a - l) > Math.max(10, 2 * tol));
function generateMore(goal: KonGoal, g: KonGrammar, rnd: () => number, scale: KonParams["scale"], mk: (p: KonParams, sig: string) => Candidate<KonParams>): Candidate<KonParams>[] {
  const out: Candidate<KonParams>[] = [];
  const mirrorOf = () => (g.mirror === false ? false : rnd() < 0.4);
  if (goal === "kind") {
    // the base arm sits at any 15° heading: flat, standing, or tilted (a tilted square corner is still a right angle)
    for (const kind of g.kinds ?? ["acute", "right", "obtuse"]) for (let k = 0; k < 6; k++) {
      const start = 15 * Math.floor(rnd() * 24), mirror = mirrorOf();
      out.push(mk({ goal, start, kind, mirror, tol: g.tol ?? 4, scale }, `kind:${kind}:${start}${mirror ? "m" : ""}`));
    }
    return out;
  }
  if (goal === "match") {
    for (let k = 0; k < 24; k++) {
      const ref = 20 + 5 * Math.floor(rnd() * 29);                        // 20° … 160°
      if (!offLandmark(ref, 5)) continue;
      const refStart = 15 * Math.floor(rnd() * 24), start = norm(refStart + 45 + 15 * Math.floor(rnd() * 18));
      out.push(mk({ goal, start, ref, refStart, mirror: false, tol: g.tol ?? 5, scale }, `match:${ref}:${refStart}:${start}`));
    }
    return out;
  }
  if (goal === "linear") {
    // the line runs flat: B on the right (base arm 0°, opening anticlockwise), A on the left
    for (let k = 0; k < 30; k++) {
      const given = 25 + 5 * Math.floor(rnd() * 27);                      // 25° … 155°
      if (!offLandmark(180 - given, g.tol ?? 3) || Math.abs(given - 90) < 10) continue;
      out.push(mk({ goal, start: 0, given, mirror: false, tol: g.tol ?? 3, scale }, `linear:${given}`));
    }
    return out;
  }
  // tri / iso: base AB flat, the arm turns at B from the base arm pointing back at A (180°), opening clockwise (upwards)
  for (let k = 0; k < 40; k++) {
    let p: KonParams | null = null;
    if (goal === "tri") {
      const given = 25 + 5 * Math.floor(rnd() * 20), apex = 20 + 5 * Math.floor(rnd() * 24);
      if (given + apex > 155) continue;
      p = { goal, start: 180, mirror: true, given, apex, tol: g.tol ?? 3, scale };
    } else {
      const by = (g.isoBy ?? ["base", "apex"])[Math.floor(rnd() * (g.isoBy?.length ?? 2))];
      p = by === "apex" ? { goal, start: 180, mirror: true, apex: 2 * (10 + 5 * Math.floor(rnd() * 15)), isoBy: "apex", tol: g.tol ?? 3, scale }
        : { goal, start: 180, mirror: true, given: 25 + 5 * Math.floor(rnd() * 12), isoBy: "base", tol: g.tol ?? 3, scale };
    }
    if (!offLandmark(openingOf(p), p.tol)) continue;
    out.push(mk(p, `${goal}:${p.isoBy ?? ""}:${p.given ?? ""}:${p.apex ?? ""}`));
  }
  return out;
}
function facts(level: PlayLevel<KonParams>, s: KonState): Facts {
  if (isPlaceGoal(level.params.goal)) {
    const f = placeFacts(level.params, s.pl, { goal: level.params.goal, ...valueFacts(level.params) });
    if (s.commits) f.commits = s.commits;
    if (s.done) f.done = "yes";
    return f;
  }
  const f: Facts = { goal: level.params.goal, ...valueFacts(level.params) };
  if (s.heading !== null) f.at = Math.round(s.heading);
  if (s.stops) { f.lo = s.stops.lo; f.hi = s.stops.hi; }
  if (s.commits) f.commits = s.commits;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<KonParams>, s: KonState) {
  const p = level.params;
  if (isPlaceGoal(p.goal)) {
    const what = p.goal === "measure" ? "measure ∠AOB with the protractor" : p.goal === "draw" ? `draw ∠AOB = ${p.theta}° on OA with the protractor` : "which angle is more: ∠P, ∠Q, or the same?";
    return { title: "Protractor", lines: [what, ...(s.pl?.locked ? ["protractor placed"] : [])] };
  }
  if (isLineGoal(p.goal)) {
    const v = lineValueFacts(p);
    const what = p.goal === "parallel" ? "line 2 parallel to line 1" : p.goal === "perp" ? "line 2 perpendicular to line 1"
      : p.goal === "ends" ? `${v.fig} ${v.name}` : `∠1 = ${p.given}°; open ∠2 so the lines are parallel`;
    return { title: p.goal === "ends" ? "Ends" : "Lines", lines: [what, ...(s.heading !== null ? [`now: ${Math.round(s.heading)}°`] : [])] };
  }
  const what = p.goal === "turn" ? `${p.q}/4 ${p.dir === "acw" ? "anticlockwise" : "clockwise"}` : p.goal === "set" ? `${p.theta}°`
    : p.goal === "kind" ? `${p.kind} angle` : p.goal === "match" ? "equal to the reference" : p.goal === "linear" ? `∠AOC = ${p.given}°; open ∠COB`
    : p.goal === "tri" ? `∠A = ${p.given}°, top = ${p.apex}°; open ∠B` : p.isoBy === "apex" ? `AC = BC, top = ${p.apex}°; open ∠B` : `AC = BC, ∠A = ${p.given}°; open ∠B`;
  return { title: p.goal === "turn" ? "Turn" : "Angle", lines: [what, ...(s.heading !== null ? [`now: ${Math.round(s.heading)}°`] : [])] };
}
function grade(level: PlayLevel<KonParams>, acts: PlayActEnvelope<KonAct>[]): PlayGrade {
  return gradeLevel(konLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const konLogic: FamilyLogic<KonParams, KonState, KonAct> = {
  family: "kon", modes: ["turn", "set", "zone", "pair", "close", "lines", "cross", "ends", "place"], malRules: KON_MAL,
  // zone/kind: one turn into a wide zone wins (a lucky tap 10 to 26 %, games audit GAMES-03): its correct enters at CHANCE_WEIGHT
  // r8 place/size: one pick among three (P, Q, the same)
  oneDecision: ["kind", "turn", "corr", "alt", "size"],   // zone kind, turn, and cross (corr, alt): one dial or one pick (main 2026-11-10: turn and cross join the chance weight)
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
