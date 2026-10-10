// The INTAKE beat (TUTOR-MODEL §2.1-2.3; the brief's (a)-(b)): at most 3 child turns and 90 s, no stage build. A pure state
// machine over the child's turns:
//
//   open ──child──► frame (intake.js) ──► candidates (closed set) ──┬─ p ≥ 0.6 ────────────► CONFIRM probe (graded vs the kit key)
//                                                                   ├─ two near ──────────► WHICH ONE? (two-way)
//                                                                   ├─ test, no topic ────► TEST SCOPE (once)
//                                                                   ├─ share ─────────────► uptake, ask again (once)
//                                                                   └─ nothing / unknown / safety / homework / want ► DECIDE
//   which ──child──► the picked option (or a new frame) ──► CONFIRM          confirm ──child──► grade ──► DECIDE
//   every stage: the safety predicate first; out of turns or time ──► DECIDE with what is known (decide.js order)
//
// It never calls a model and never reads the database: the caller passes the kit loader (kitFor), the ledger reading
// (statusOf) and the private prior. When a confirm reply needs the model's closed-label read, the step returns
// { needsGrade: { target } } and the caller re-enters with { graded: outcome } (classify.js classify, unchanged).

import { intakeParse, subjectOf } from "./intake.js";
import { intakeCandidates, subjectInClass } from "./candidates.js";
import { confirmItem, gradeConfirm, rejectsMapping } from "./confirm.js";
import { decideSegment } from "./decide.js";
import { INTAKE_MAX_TURNS, INTAKE_MAX_MS, CONFIRM_MIN_P } from "./flags.js";
import { scanSafety } from "../safety.js";
import { getTopic } from "../../content/curriculum.js";
import * as SH from "./shapes.js";

const titleOf = (id) => getTopic(id)?.title ?? getTopic(id)?.chapter?.title ?? id;
const chapterTitleOf = (c) => c?.title ?? getTopic(c?.topicId)?.chapter?.title ?? c?.topicId;

/** PURE. A new intake (turn 0): the opening move. */
export function intakeStart({ now = Date.now(), classLevel, ctx = {} } = {}) {
  const young = Number(classLevel) <= 2;
  return {
    state: { stage: "open", turns: 0, startedAt: now, classLevel, ctx, frame: null, cand: null, pick: null, item: null, shared: false, scoped: false, log: [] },
    move: { kind: "intake", shape: SH.intakeOpen({ young }), chips: chipsFor(classLevel, ctx), stage: false },
    done: false,
  };
}

/** The quiet chips under her (a voice fallback, never a menu): today's two timetable subjects, a test, homework. */
function chipsFor(classLevel, ctx) {
  const subj = (ctx.subjects ?? []).map((s) => subjectInClass(s, classLevel)).filter(Boolean).slice(0, 2);
  return [...subj.map((s) => ({ id: `intake:subject:${s}`, label: s === "sst" ? "SST" : s === "evs" ? "EVS" : s[0].toUpperCase() + s.slice(1) })),
    { id: "intake:test", label: "Test hai" }, { id: "intake:homework", label: "Homework" }];
}

/** A chip tap as words the parser reads (machine truth, never a model). */
const CHIP_TEXT = { "intake:test": "test hai", "intake:homework": "homework hai" };
const chipText = (chipId) => (CHIP_TEXT[chipId] ?? (/^intake:subject:(\w+)$/.test(chipId ?? "") ? `${chipId.split(":")[2]} padhaya` : null));

/** "pehla / first / 1 / the first one" → 0, "dusra / second / 2" → 1, else the option whose title words they said, else -1. */
function pickOption(text, options) {
  const t = String(text ?? "").toLowerCase();
  if (/\b(?:pehl[ae]|pahl[ae]|first|1st|ek|one|a)\b|^1\b|पहल/.test(t) && !/\b(?:dusr[ae]|doosr[ae]|second)\b/.test(t)) return 0;
  if (/\b(?:dusr[ae]|doosr[ae]|second|2nd|do|two|b)\b|^2\b|दूसर/.test(t)) return 1;
  const words = new Set(t.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4));
  let best = -1, score = 0;
  options.forEach((o, i) => { const s = String(chapterTitleOf(o)).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => words.has(w)).length; if (s > score) { best = i; score = s; } });
  return best;
}

/**
 * PURE. One child turn of the intake.
 * @param {object} state  from intakeStart / the previous step
 * @param {{ text?: string, chipId?: string, now?: number, kitFor?: (topicId: string) => object|null, statusOf?: (id: string) => string,
 *   prior?: object, graded?: string|null, explore?: boolean }} turn
 * @returns {{ state: object, move: object|null, done: boolean, decision?: object, needsGrade?: { target: object } }}
 */
export function intakeStep(state, turn) {
  const s = structuredClone(state);
  const now = turn.now ?? Date.now();
  const text = String(turn.text ?? chipText(turn.chipId) ?? "").trim();
  // a re-entry with the model's closed-label grade does not count as another child turn
  if (turn.graded === undefined) s.turns += 1;
  const outOfTurns = s.turns >= INTAKE_MAX_TURNS || now - s.startedAt >= INTAKE_MAX_MS;
  const decide = (extra = {}) => {
    const decision = decideSegment({ safety: extra.safety, frame: s.frame, pick: s.pick, confirm: extra.confirm ?? null, prior: turn.prior ?? {}, statusOf: turn.statusOf,
      explore: !!turn.explore, wantOutside: s.frame?.kind === "want" && !s.pick ? (s.frame.words ?? []).join(" ").slice(0, 40) : null });
    s.stage = "done";
    s.log.push({ turn: s.turns, decided: decision.purpose });
    const shape = decision.purpose === "safeguard" ? null
      : s.frame?.kind === "want" && !s.pick && decision.purpose !== "explore" ? `${SH.intakeWantOutside()}; ${SH.intakeAgenda({ purpose: decision.purpose })}`
        : SH.intakeAgenda({ purpose: decision.mode === "foundation_first" ? "foundation" : decision.purpose });
    return { state: s, move: shape ? { kind: "intake_agenda", shape, stage: false } : { kind: "safeguard", shape: null }, done: true, decision };
  };
  // the floor decides first, at every stage (the frozen predicate, never a model)
  if (text && scanSafety(text).distress) { s.frame = { ...(s.frame ?? {}), kind: "safety" }; return decide({ safety: true }); }

  if (s.stage === "confirm" && s.item) {
    let outcome = turn.graded ?? null;
    if (outcome === null || outcome === undefined) {
      const g = gradeConfirm(s.item, text);
      if (g.rejected) {
        // "nahi, woh nahi tha": the mapping was wrong; ask which one (if another candidate exists and turns remain), else decide
        const others = (s.cand?.candidates ?? []).filter((c) => c.chapterId !== s.pick?.chapterId).slice(0, 2);
        s.pick = null; s.item = null;
        if (!outOfTurns && others.length >= 2) { s.stage = "which"; s.options = others; return { state: s, move: { kind: "intake", shape: SH.intakeWhich({ a: chapterTitleOf(others[0]), b: chapterTitleOf(others[1]) }), stage: false }, done: false }; }
        return decide();
      }
      if (g.needsModel) return { state: s, move: null, done: false, needsGrade: { target: g.target } };
      outcome = g.outcome;
    }
    s.confirm = { outcome, itemId: s.item.id };
    return decide({ confirm: s.confirm });
  }

  if (s.stage === "which" && s.options?.length) {
    const i = pickOption(text, s.options);
    if (i >= 0) {
      s.pick = { ...s.options[i], p: 0.9 };
      return toConfirm(s, turn, text, outOfTurns, decide);
    }
    // a new answer instead of a pick: read it as a fresh frame below
    s.stage = "open";
  }

  if (s.stage === "test_scope") {
    const c = intakeCandidates({ kind: "test", subject: subjectOf(text) ?? s.frame?.subject ?? null }, text, { classLevel: s.classLevel, ...s.ctx });
    if (c.top && c.p >= CONFIRM_MIN_P) s.pick = c.top;
    return decide();
  }

  // stage "open": read the frame
  const frame = intakeParse(text);
  if (s.frame?.subject && !frame.subject) frame.subject = s.frame.subject;
  s.frame = frame;
  s.log.push({ turn: s.turns, kind: frame.kind });
  if (frame.kind === "safety") return decide({ safety: true });
  if (frame.kind === "share" && !s.shared && !outOfTurns) { s.shared = true; return { state: s, move: { kind: "intake", shape: SH.intakeShare(), stage: false }, done: false }; }
  if (frame.kind === "nothing" || frame.kind === "share") return decide();
  if (frame.kind === "unknown") {
    // recognition once: the two most likely chapters from the school's position, if one is known
    const opts = recognitionOptions(s);
    if (opts && !outOfTurns && !s.recognised) { s.recognised = true; s.stage = "which"; s.options = opts; s.frame = { ...frame, kind: "taught" };
      return { state: s, move: { kind: "intake", shape: SH.intakeRecognise({ a: chapterTitleOf(opts[0]), b: chapterTitleOf(opts[1]) }), stage: false }, done: false }; }
    return decide();
  }
  const cand = intakeCandidates(frame, text, { classLevel: s.classLevel, ...s.ctx });
  s.cand = { candidates: cand.candidates, p: cand.p };
  if (cand.top && cand.p >= CONFIRM_MIN_P) s.pick = cand.top;
  if (frame.kind === "test" && !s.pick && !s.scoped && !outOfTurns) { s.scoped = true; s.stage = "test_scope"; return { state: s, move: { kind: "intake", shape: SH.intakeTestScope(), stage: false }, done: false }; }
  if (frame.kind === "test" || frame.kind === "homework" || frame.kind === "want") {
    if (!s.pick && cand.ask && !outOfTurns && frame.kind === "want") { s.stage = "which"; s.options = cand.ask; return { state: s, move: { kind: "intake", shape: SH.intakeWhich({ a: chapterTitleOf(cand.ask[0]), b: chapterTitleOf(cand.ask[1]) }), stage: false }, done: false }; }
    return decide();
  }
  // taught / not understood
  if (s.pick) return toConfirm(s, turn, text, outOfTurns, decide);
  if (cand.ask && !outOfTurns) { s.stage = "which"; s.options = cand.ask; return { state: s, move: { kind: "intake", shape: SH.intakeWhich({ a: chapterTitleOf(cand.ask[0]), b: chapterTitleOf(cand.ask[1]) }), stage: false }, done: false }; }
  return decide();
}

/** The confirm probe for the picked topic (its kit's item), or decide at once when there is no item or no turn left. */
function toConfirm(s, turn, text, outOfTurns, decide) {
  const kit = turn.kitFor?.(s.pick.topicId) ?? null;
  const item = kit ? confirmItem(kit, { text }) : null;
  // not understood: no probe on the thing they just said they did not get (the re-teach starts from its first representation)
  if (!item || outOfTurns || s.frame?.kind === "not_understood") return decide();
  s.item = item; s.stage = "confirm";
  return { state: s, move: { kind: "intake_confirm", shape: SH.intakeConfirm(), item, stage: false }, done: false };
}

/** The two chapters at and after the school's position in the first timetable subject, when one is known. */
function recognitionOptions(s) {
  const subjects = [s.frame?.subject, ...(s.ctx?.subjects ?? [])].map((x) => subjectInClass(x, s.classLevel)).filter(Boolean);
  for (const subj of subjects) {
    const ch = Number(s.ctx?.pointer?.[subj]);
    if (!Number.isFinite(ch)) continue;
    const ids = [ch, ch + 1].map((n) => `c${s.classLevel}-${subj}-ch${String(n).padStart(2, "0")}-t01`).filter((id) => getTopic(id));
    if (ids.length === 2) return ids.map((id) => ({ topicId: id, chapterId: getTopic(id).chapter.id, subject: subj, title: getTopic(id).chapter.title, classLevel: s.classLevel }));
  }
  return null;
}

export { titleOf };
