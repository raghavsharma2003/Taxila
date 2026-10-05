// The five candidate sources (STAGECRAFT.md §2.2). Each adapter turns what it reads into Nominations: SILENT proposals
// that can create, re-score or kill candidates and can never put anything on screen. Closed vocabulary only: kit ids,
// needs, kinds. A nomination never carries the child's words, name or id (B9).
//
//   plan_lookahead   the beat plan's next 2-3 beats (W2-H candidateIntents until beats ship)
//   partial_intent   the duplex partial stream (server/duplex/buildIntent.js intents: misconception, curiosity, hint)
//   child_request    explicit asks ("diagram dikhao", "game khelna hai", "dusre tarike se", an aid tap)
//   child_signal     stepState / verifyDue / choiceDue / curious / breakDue (server/signals, server/voicesig)
//   board_state      the host's grades on the piece on stage, and the steering words
import { BEAT_KINDS, BEAT_NEED, KINDS_FOR_NEED } from "./config.js";

/** `${skillId}|${need}|${misconceptionId ?? "-"}|${itemId ?? "-"}` (shared/stagecraft.ts FamilyKey). */
export const familyKey = (skillId, need, misconceptionId = null, itemId = null) => `${skillId}|${need}|${misconceptionId ?? "-"}|${itemId ?? "-"}`;
export const parseFamily = (key) => { const [skillId, need, m, i] = String(key).split("|"); return { skillId, need, misconceptionId: m === "-" ? null : m, itemId: i === "-" ? null : i }; };

const nom = (o) => ({ childRequested: false, ...o, target: { skillId: o.target.skillId, itemId: o.target.itemId ?? null, misconceptionId: o.target.misconceptionId ?? null, term: o.target.term ?? null, ...(o.target.topicId ? { topicId: o.target.topicId } : {}) } });

// ───────────────────────────── child requests: the stage lexicon ─────────────────────────────
// Closed lexicons in both scripts and romanised Hinglish (RS-5 note classes). Order matters: "dusre tarike se dikhao" is a
// re-representation, not a picture; "game dikhao" is a game. Shapes, never sentences.
const REQ = [
  ["explain_differently", /(dusre|doosre|alag|aur\s*kisi)\s*(tarike|tareeke|tarah)|दूसरे\s*तरीके|अलग\s*तरीके|another\s*way|different\s*way|samajh\s*(nahi|nahin|na)\s*(aaya|aya)|समझ\s*नहीं\s*आया|phir\s*se\s*samjha/iu],
  ["game_request", /\bgame\b|गेम|\bkhel(na|ne|o|enge)?\b|खेल(ना|ने|ो|ेंगे)?|\bplay\b/iu],
  ["animation_request", /animation|एनिमेशन|\bvideo\b|वीडियो|\bmovie\b|chalta\s*hua|चलता\s*हुआ/iu],
  ["visual_request", /diagram|डायग्राम|picture|\bphoto\b|chitra|चित्र|tasveer|तस्वीर|\bdraw\b|bana\s*ke|बना\s*के|dikhao|dikhaiye|dikha\s*do|दिखाओ|दिखाइए|दिखा\s*दो|show\s*me/iu],
];
/** Detects an explicit stage request in (echo-subtracted) child words. Returns the RS-5 note class, or null. */
export function requestFromText(text) {
  const t = String(text ?? "").toLowerCase().normalize("NFC");
  if (!t) return null;
  for (const [kind, re] of REQ) if (re.test(t)) return kind;
  return null;
}
/** RS-5 note class → the need and kinds it asks for. */
export const REQUEST_SHAPE = Object.freeze({
  visual_request: { need: "explain", kinds: ["animation", "simulation", "diagram"] },
  game_request: { need: "practice", kinds: ["game", "simulation"] },
  animation_request: { need: "explain", kinds: ["animation", "simulation"] },
  explain_differently: { need: "re_represent", kinds: KINDS_FOR_NEED.re_represent },
});

// ───────────────────────────── plan lookahead ─────────────────────────────
const PLAN_P = [0.8, 0.5, 0.3];
/**
 * The next 2-3 beats. A beat with no stage need (probe by voice, break) nominates nothing.
 * @param {{ beats: { beat: string, skillId: string, topicId?: string, misconceptionId?: string|null, itemId?: string|null, openAt: number }[], cursor: number }} plan
 */
export function fromPlan(plan, now) {
  const out = [];
  for (let k = 1; k <= 3; k++) {
    const b = plan?.beats?.[plan.cursor + k];
    if (!b) break;
    const need = BEAT_NEED[b.beat];
    if (!need) continue;
    const mis = need === "contrast_misconception" ? b.misconceptionId ?? null : null;
    out.push(nom({ source: "plan_lookahead", family: familyKey(b.skillId, need, mis, null), need, target: { skillId: b.skillId, topicId: b.topicId, misconceptionId: mis },
      kinds: BEAT_KINDS[b.beat] ?? KINDS_FOR_NEED[need], pNeed: PLAN_P[k - 1], deadlineAt: b.openAt, strength: "planned", at: now, forBeat: b.beat }));
  }
  return out;
}
/** W2-H candidateIntents(ctx) rows → plan nominations (the first plan source until beats ship). */
export function fromCandidateIntents(rows, { now, clockMs = 0 }) {
  return (rows ?? []).map((r) => nom({ source: "plan_lookahead", family: familyKey(r.intent.skillId, r.intent.need, r.intent.misconceptionId ?? null, null), need: r.intent.need,
    target: { skillId: r.intent.skillId, misconceptionId: r.intent.misconceptionId ?? null }, kinds: [r.intent.kind, ...(KINDS_FOR_NEED[r.intent.need] ?? [])].filter((x, i, a) => a.indexOf(x) === i),
    pNeed: 0.8, deadlineAt: now + Math.max(0, (r.intent.neededAtMs ?? 0) - clockMs), strength: "planned", at: now, forBeat: r.intent.beat }));
}

// ───────────────────────────── partial intent (duplex BuildIntents jobs) ─────────────────────────────
/**
 * A BuildIntents job (server/duplex/buildIntent.js fire()): misconception | curiosity | aid_request | hint. Values from
 * prefixes are wrong 38-45% of the time (M-B1), so pNeed is capped at 0.7 until commit; strength is `weak` (stable is
 * decided by the conductor when the same family holds for ≥ 2 slices or ≥ 1.5 s).
 */
export function fromBuildIntent(job, ctx) {
  const at = ctx.now, deadlineAt = ctx.nextTrpAt ?? at + 3000;
  // probe-then-contrast (policy.js step 4): a contrast is wanted at the point AFTER the one that answers this turn
  const contrastAt = deadlineAt + (ctx.turnMs ?? 12_000);
  if (job.kind === "misconception") return [nom({ source: "partial_intent", family: familyKey(ctx.skillId, "contrast_misconception", job.misconceptionId, null), need: "contrast_misconception",
    target: { skillId: ctx.skillId, topicId: ctx.topicId, misconceptionId: job.misconceptionId, itemId: job.itemId ?? null }, kinds: KINDS_FOR_NEED.contrast_misconception, pNeed: 0.45, deadlineAt: contrastAt, strength: "weak", at })];
  if (job.kind === "curiosity") return [nom({ source: "partial_intent", family: familyKey(ctx.skillId, "explore_question", null, null), need: "explore_question",
    target: { skillId: ctx.skillId, topicId: ctx.topicId, term: job.term ?? null }, kinds: KINDS_FOR_NEED.explore_question, pNeed: 0.45, deadlineAt, strength: "weak", at })];
  if (job.kind === "aid_request") return fromRequest("visual_request", ctx);
  if (job.kind === "hint") return [];       // a device prefetch key carries no family on its own; the request lexicon covers aids
  return [];
}

/** An explicit child request: pNeed 1, urgent, deadline the next TRP even mid-beat, never the live tier. */
export function fromRequest(kind, ctx) {
  const shape = REQUEST_SHAPE[kind];
  if (!shape) return [];
  const need = shape.need;
  return [nom({ source: "child_request", family: familyKey(ctx.skillId, need, need === "re_represent" ? ctx.misconceptionId ?? null : null, null),   // the same idea as the plan / signal family: speculation for it counts
    need, target: { skillId: ctx.skillId, topicId: ctx.topicId, misconceptionId: need === "re_represent" ? ctx.misconceptionId ?? null : null },
    kinds: shape.kinds, pNeed: 1, deadlineAt: ctx.nextTrpAt ?? ctx.now + 3000, strength: "explicit", childRequested: true, at: ctx.now, requestKind: kind })];
}

// ───────────────────────────── child signals ─────────────────────────────
/**
 * Licences only, never affect. stuck_productive nominates nothing (and the conductor vetoes swaps); breakDue suppresses
 * every nomination.
 * @param {import("../../shared/stagecraft").SignalReading} r
 */
export function fromSignal(r, ctx) {
  if (!r || r.abstain || r.breakDue) return [];
  const out = [], at = ctx.now, deadlineAt = ctx.nextTrpAt ?? at + 4000;
  if (r.stepState === "stuck_unproductive") out.push(nom({ source: "child_signal", family: familyKey(ctx.skillId, "re_represent", ctx.misconceptionId ?? null, null), need: "re_represent",
    target: { skillId: ctx.skillId, topicId: ctx.topicId, misconceptionId: ctx.misconceptionId ?? null }, kinds: KINDS_FOR_NEED.re_represent, pNeed: 0.6, deadlineAt, strength: "weak", at }));
  if (r.verifyDue) out.push(nom({ source: "child_signal", family: familyKey(ctx.skillId, "verify", null, null), need: "verify",
    target: { skillId: ctx.skillId, topicId: ctx.topicId }, kinds: KINDS_FOR_NEED.verify, pNeed: 0.5, deadlineAt, strength: "weak", at }));
  // engagement strained is the precursor of choiceDue: a hedge for the switch one turn ahead
  if (r.engagement === "strained" && !r.choiceDue) out.push(nom({ source: "child_signal", family: familyKey(ctx.skillId, "switch_modality", null, null), need: "switch_modality",
    target: { skillId: ctx.skillId, topicId: ctx.topicId }, kinds: KINDS_FOR_NEED.switch_modality, pNeed: 0.35, deadlineAt: ctx.nextTrpAt ?? at + 12000, strength: "weak", at }));
  if (r.choiceDue) out.push(nom({ source: "child_signal", family: familyKey(ctx.skillId, "switch_modality", null, null), need: "switch_modality",
    target: { skillId: ctx.skillId, topicId: ctx.topicId }, kinds: KINDS_FOR_NEED.switch_modality, pNeed: 0.5, deadlineAt, strength: "weak", at }));
  if (r.curious && r.curious.depth !== "what") out.push(nom({ source: "child_signal", family: familyKey(ctx.skillId, "explore_question", null, null), need: "explore_question",
    target: { skillId: ctx.skillId, topicId: ctx.topicId, term: r.curious.term ?? null }, kinds: KINDS_FOR_NEED.explore_question, pNeed: 0.45, deadlineAt, strength: "weak", at }));
  return out;
}

// ───────────────────────────── board state ─────────────────────────────
/**
 * The host's grades on the piece on stage. ≥ 2 wrong → re-represent the same item; complete → the next beat's family
 * gains +0.15 (ctx.next); a steering word is answered by a knob on the running piece (no nomination, no generation).
 * @param {import("../../shared/stagecraft").BoardReading} r
 */
export function fromBoard(r, ctx) {
  const out = [], at = ctx.now;
  if (!r?.onStage) return out;
  const o = r.outcome;
  // one wrong answer is a hedge (pNeed 0.35): a second wrong, or a stuck frame, makes the policy want it next turn
  if (o && o.wrongCount >= 1) out.push(nom({ source: "board_state", family: familyKey(ctx.skillId, "re_represent", ctx.misconceptionId ?? null, null), need: "re_represent",
    target: { skillId: ctx.skillId, topicId: ctx.topicId, misconceptionId: ctx.misconceptionId ?? null }, kinds: KINDS_FOR_NEED.re_represent,
    pNeed: o.wrongCount >= 2 ? 0.5 : 0.35, deadlineAt: ctx.nextTrpAt ?? at + 4000, strength: "weak", at, exclude: [r.onStage.archetype] }));
  if (o?.complete && ctx.next) out.push({ ...ctx.next, source: "board_state", pNeed: Math.min(1, (ctx.next.pNeed ?? 0.5) + 0.15), at });
  return out;
}
