// Kon (कोण) · angles as an amount of turning (round 4 G1, E1 angles; FEASIBILITY.md §4.3). The child turns an arm (the
// ship's nose, a cannon) about a fixed centre and commits; the law answers with where the arm should point and draws the
// turn between. Two goals:
//   turn  a quarter / half / three-quarter turn, clockwise or anticlockwise, from a start heading (c5-maths-ch03-t01)
//   set   open the arm to a given number of degrees from a base arm, reading a protractor (c6-maths-ch02-t03)
// PURE law + generator + solver + grader. Angles in degrees, 0 = pointing right, anticlockwise positive (the maths
// convention); the view may draw it any way it likes.
// Mal-rules: cw-confuse (turns the other way) · half-is-quarter (a half turn for a quarter, a quarter for a half) ·
// wrong-scale (reads the protractor's other scale: 180 − θ).
import type { Candidate, FamilyLogic, Facts, GenRequest, KonAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export interface KonParams {
  goal: "turn" | "set";
  /** the arm's heading at the start (turn) or the base arm's heading (set), degrees */
  start: number;
  /** turn: quarter turns (1, 2, 3) and the direction */
  q?: 1 | 2 | 3; dir?: "cw" | "acw";
  /** set: the angle to open, degrees (from the base arm, anticlockwise, or clockwise when mirrored) */
  theta?: number; mirror?: boolean;
  /** acceptance, degrees */
  tol: number;
  /** what the dial shows (fade): every 10°, every 30°, or only 0 / 90 / 180 */
  scale: "10" | "30" | "landmarks";
}
export interface KonState extends Undoable<KonState> { heading: number | null; commits: number; done: boolean; acts: number }
export const KON_MAL = ["cw-confuse", "half-is-quarter", "wrong-scale"] as const;

export const norm = (d: number) => ((d % 360) + 360) % 360;
/** the shortest unsigned difference between two headings */
export const diff = (a: number, b: number) => { const d = Math.abs(norm(a) - norm(b)); return Math.min(d, 360 - d); };
export function targetOf(p: KonParams): number {
  if (p.goal === "turn") return norm(p.start + (p.dir === "acw" ? 1 : -1) * 90 * (p.q ?? 1));
  return norm(p.start + (p.mirror ? -1 : 1) * (p.theta ?? 0));
}
/** where a child holding mal-rule `mal` points the arm (null = the belief says nothing different here) */
export function malHeading(p: KonParams, mal: string): number | null {
  const t = targetOf(p);
  let h: number | null = null;
  if (p.goal === "turn" && mal === "cw-confuse") h = norm(p.start + (p.dir === "acw" ? -1 : 1) * 90 * (p.q ?? 1));
  if (p.goal === "turn" && mal === "half-is-quarter" && (p.q === 1 || p.q === 2)) h = norm(p.start + (p.dir === "acw" ? 1 : -1) * 90 * (p.q === 1 ? 2 : 1));
  if (p.goal === "set" && mal === "wrong-scale") h = norm(p.start + (p.mirror ? -1 : 1) * (180 - (p.theta ?? 0)));
  return h !== null && diff(h, t) > 3 * p.tol ? h : null;
}
const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
/** the value the child is working towards, as on-screen facts (never a sentence) */
export function valueFacts(p: KonParams): Facts {
  return p.goal === "turn" ? { turn: `${p.q}/4`, dir: p.dir ?? "cw" } : { angle: `${p.theta}°` };
}

function validate(level: PlayLevel<unknown>): PlayLevel<KonParams> | null {
  const p = level.params as Partial<KonParams> | null;
  if (!p || (p.goal !== "turn" && p.goal !== "set")) return null;
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
const init = (_l: PlayLevel<KonParams>): KonState => ({ heading: null, commits: 0, done: false, acts: 0, prev: null, depth: 0 });

function apply(level: PlayLevel<KonParams>, s: KonState, act: KonAct, seq: number): { state: KonState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: KonState): KonState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  if (act.kind === "turn") {
    const d = Number(act.deg);
    if (!Number.isFinite(d)) return { state: bump(s), moments: out, refused: "bad_turn" };
    return { state: bump(pushUndo(s, { ...s, heading: norm(d) })), moments: out };
  }
  if (act.kind === "commit") {
    if (s.heading === null) return { state: bump(s), moments: out, refused: "turn_first" };
    const t = targetOf(p), e = diff(s.heading, t);
    const next = bump(pushUndo(s, { ...s, commits: s.commits + 1 }));
    const at = Math.round(s.heading), truth = Math.round(t);
    if (e <= p.tol) { out.push(mom("solved", seq, { ...valueFacts(p), at, truth })); return { state: { ...next, done: true }, moments: out }; }
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
const goalMet = (_l: PlayLevel<KonParams>, s: KonState) => s.done;
const solve = (level: PlayLevel<KonParams>): KonAct[] => [{ kind: "turn", deg: targetOf(level.params) }, { kind: "commit" }];
/** without the concept a child can only point at a landmark it can see (right, up, left, down; on a protractor 0 / 90 /
 *  180 from the base arm); a target within tolerance of one would be passed by guessing, so it is never served */
function shortcut(level: PlayLevel<KonParams>): KonAct[] | null {
  const p = level.params, t = targetOf(p);
  if (p.goal === "turn") return null;   // every quarter heading is a landmark: which one is the skill (four choices, 3 wrong)
  for (const off of [0, 90, 180]) { const g = norm(p.start + (p.mirror ? -1 : 1) * off); if (diff(g, t) <= p.tol) return [{ kind: "turn", deg: g }, { kind: "commit" }]; }
  return null;
}
function malActs(level: PlayLevel<KonParams>, mal: string): KonAct[] | null {
  const h = malHeading(level.params, mal);
  return h === null ? null : [{ kind: "turn", deg: h }, { kind: "commit" }];
}

interface KonGrammar { goal?: "turn" | "set"; q?: (1 | 2 | 3)[]; tol?: number; mirror?: boolean }
function difficultyOf(p: KonParams): number {
  if (p.goal === "turn") return Math.min(1, 0.2 + ((p.q ?? 1) === 3 ? 0.25 : (p.q ?? 1) === 2 ? 0.1 : 0) + (p.dir === "acw" ? 0.05 : 0) + (p.start % 180 ? 0.1 : 0));
  return Math.min(1, 0.3 + (p.mirror ? 0.15 : 0) + (p.scale === "landmarks" ? 0.25 : p.scale === "30" ? 0.1 : 0) + ((p.theta ?? 0) % 10 ? 0.1 : 0));
}
function generate(req: GenRequest): Candidate<KonParams>[] {
  const g = req.grammar as KonGrammar;
  const goal = (req.goal as "turn" | "set") ?? g.goal ?? "turn";
  const rnd = mulberry32(req.seed), out: Candidate<KonParams>[] = [];
  const scale: KonParams["scale"] = req.fade === 1 ? "10" : req.fade === 2 ? "30" : "landmarks";
  const mk = (params: KonParams, sig: string): Candidate<KonParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `kon-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "kon", mode: goal, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "space", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  if (goal === "turn") {
    for (const start of [0, 90, 180, 270]) for (const q of g.q ?? [1, 2, 3]) for (const dir of ["cw", "acw"] as const)
      out.push(mk({ goal, start, q, dir, tol: g.tol ?? 12, scale }, `turn:${start}:${q}${dir}`));
    return out;
  }
  for (let k = 0; k < 40; k++) {
    const theta = 15 + 5 * Math.floor(rnd() * 31);                       // 15° … 165° in 5° steps
    if (Math.abs(theta - 90) < 10 || theta > 165) continue;
    const mirror = g.mirror === false ? false : rnd() < 0.4;
    const start = mirror ? 180 : 0;
    out.push(mk({ goal, start, theta, mirror, tol: g.tol ?? 3, scale }, `set:${theta}${mirror ? "m" : ""}`));
  }
  return out;
}
function facts(level: PlayLevel<KonParams>, s: KonState): Facts {
  const f: Facts = { goal: level.params.goal, ...valueFacts(level.params) };
  if (s.heading !== null) f.at = Math.round(s.heading);
  if (s.commits) f.commits = s.commits;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<KonParams>, s: KonState) {
  const p = level.params;
  const what = p.goal === "turn" ? `${p.q}/4 ${p.dir === "acw" ? "anticlockwise" : "clockwise"}` : `${p.theta}°`;
  return { title: p.goal === "turn" ? "Turn" : "Angle", lines: [what, ...(s.heading !== null ? [`now: ${Math.round(s.heading)}°`] : [])] };
}
function grade(level: PlayLevel<KonParams>, acts: PlayActEnvelope<KonAct>[]): PlayGrade {
  return gradeLevel(konLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const konLogic: FamilyLogic<KonParams, KonState, KonAct> = {
  family: "kon", modes: ["turn", "set"], malRules: KON_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
