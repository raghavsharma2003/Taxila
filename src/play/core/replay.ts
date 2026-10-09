// The grading spine every family uses (DESIGN.md §8). Pure. The server calls `gradeLevel` with the level IT stored and the
// raw acts the device sent (already through sanitizeActs); the client calls the same code for its advisory read.
//
// Evidence rule (first committed decision per level, LEARNER-MODEL "first committed act per item only"):
//   - the FIRST decisive moment decides the evidence outcome: a mal-rule signature (misconception_consequence) → incorrect
//     with that misconception; a near miss → partial; a solve → correct (and, on a level built to discriminate a
//     misconception, a discriminating correct); a decisive refusal (e.g. "done" with a composite leaf) → incorrect;
//   - the VERDICT is the end state: solved if the goal is met at the end (a child who recovered after a slip still solved
//     the level; the evidence still records the slip);
//   - no acts → no evidence; the game weight is GAME_WEIGHT; mastery is never decided here.
import { GAME_WEIGHT, type FamilyLogic, type Moment, type PlayActBody, type PlayActEnvelope, type PlayEvidence, type PlayGrade, type PlayLevel, type PlayVerdict } from "../../../shared/play.ts";

export interface Replayed<S> { state: S; moments: Moment[]; refused: number; refusals: { seq: number; code: string }[] }

export function replayAll<P, S, A extends PlayActBody>(logic: FamilyLogic<P, S, A>, level: PlayLevel<P>, acts: PlayActEnvelope<A>[]): Replayed<S> {
  let state = logic.init(level);
  const moments: Moment[] = [];
  const refusals: { seq: number; code: string }[] = [];
  for (const e of acts) {
    let r: { state: S; moments: Moment[]; refused?: string };
    try { r = logic.apply(level, state, e.act, e.seq); } catch { r = { state, moments: [], refused: "bad_act" }; }
    state = r.state;
    moments.push(...r.moments);
    if (r.refused) refusals.push({ seq: e.seq, code: r.refused });
  }
  return { state, moments, refused: refusals.length, refusals };
}

/** Moments that settle the evidence for a level (in this order of precedence only when they share a seq). */
const DECISIVE = new Set(["misconception_consequence", "near_miss", "solved", "decisive_refusal"]);

export interface GradeOpts {
  /** refusal codes that count as a committed wrong decision (e.g. atoms "composite_leaf") */
  decisiveRefusals?: readonly string[];
  /** the verdict when the goal is not met but the child got close (family-specific) */
  partial?: boolean;
  final?: boolean;
}

export function gradeLevel<P, S, A extends PlayActBody>(logic: FamilyLogic<P, S, A>, level: PlayLevel<P>, acts: PlayActEnvelope<A>[], opts: GradeOpts = {}): PlayGrade {
  const r = replayAll(logic, level, acts);
  const solved = acts.length > 0 && logic.goalMet(level, r.state);
  const decisive: { kind: string; seq: number; mis?: string }[] = [];
  for (const m of r.moments) if (DECISIVE.has(m.kind)) decisive.push({ kind: m.kind, seq: m.seq, mis: m.misconceptionId });
  for (const f of r.refusals) if (opts.decisiveRefusals?.includes(f.code)) decisive.push({ kind: "decisive_refusal", seq: f.seq });
  decisive.sort((a, b) => a.seq - b.seq);
  const first = decisive[0] ?? null;
  const clean = !r.moments.some((m) => m.kind === "misconception_consequence");
  const verdict: PlayVerdict = acts.length === 0 ? "ungraded" : solved ? "solved" : opts.partial ? "partial" : "not_yet";
  const evidence: PlayEvidence[] = [];
  const base = { skillId: level.skillId, via: "game" as const, weight: GAME_WEIGHT as typeof GAME_WEIGHT, levelId: level.levelId };
  if (first) {
    if (first.kind === "misconception_consequence") {
      const kit = first.mis ? level.mal[first.mis] : undefined;
      evidence.push({ ...base, outcome: "incorrect", ...(kit ? { misconceptionId: kit } : {}), actSeq: first.seq });
    } else if (first.kind === "near_miss") evidence.push({ ...base, outcome: "partial", actSeq: first.seq });
    else if (first.kind === "decisive_refusal") evidence.push({ ...base, outcome: "incorrect", actSeq: first.seq });
    else if (first.kind === "solved") {
      const d = level.proof.discriminates[0];
      evidence.push({ ...base, outcome: "correct", ...(d ? { discriminates: d } : {}), actSeq: first.seq });
    }
  } else if (opts.final && acts.length > 0 && !solved) {
    evidence.push({ ...base, outcome: opts.partial ? "partial" : "incorrect", actSeq: acts[acts.length - 1].seq });
  }
  return { levelId: level.levelId, verdict, acts: acts.length, refused: r.refused, clean, evidence, moments: r.moments, facts: logic.facts(level, r.state) };
}

/** Undo support: every state carries its predecessor (bounded), so `undo` is a law act like any other. */
export interface Undoable<S> { prev: S | null; depth: number }
export function pushUndo<S extends Undoable<S>>(prev: S, next: Omit<S, "prev" | "depth">): S {
  const depth = Math.min(prev.depth + 1, 40);
  return { ...(next as S), prev: depth >= 40 ? trim(prev, 38) : prev, depth };
}
function trim<S extends Undoable<S>>(s: S, keep: number): S {
  if (keep <= 0 || !s.prev) return { ...s, prev: null, depth: 0 };
  return { ...s, prev: trim(s.prev, keep - 1), depth: Math.min(s.depth, keep) };
}
export function popUndo<S extends Undoable<S>>(s: S): S { return s.prev ?? s; }
