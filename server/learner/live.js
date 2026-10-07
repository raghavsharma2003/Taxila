// The live lesson's learner state (LEARNER-MODEL §5-§6; COMPREHENSION-ENGINE.md §1; INTEGRATION.md §1): the BKT-R
// ledger plus the comprehension facets, folded through ONE function (comprehension/fuse.js fuseEvidence) from ONE
// log (kt_evidence). The route never folds the legacy bkt.js again.
//
//   event source   kt_evidence (append-only; seq assigned under the child's advisory lock in the turn's transaction)
//   cache          kt_skill_state / kt_misconception / kt_ability* / comp_facet_state (writer.ledgerStmts, facetStmts)
//   projection     skill_state (+ the legacy evidence rows as the verdict log) for the readers that still read 001
//                  tables: parent corner, brief, next-topic, Conductor view. One source (the ledger), so they agree.
//
// In-process cache: the folded state per child, keyed by the highest kt_evidence seq it contains. Each turn reads
// only the rows after that seq (one indexed query, in parallel with the classifier, off the critical path), so a
// replica that missed turns catches up, and an unknown child is a full replay. After a commit the cache keeps the
// online fold ONLY if the new rows got exactly the next seqs (no other writer interleaved); otherwise it is evicted
// and the next turn replays from the log. Either way replay = online (TP2), which tests/learner-order.test.mjs and
// tests/learner-live.test.mjs pin.
import { q as dbq } from "../db.js";
import { fuseEvidence, newLearnerState, beliefFor } from "../comprehension/index.js";
import { eventFromRow } from "./model.js";
import { fromLegacyEvidence, teachEvent } from "./kt/adapter.js";
import { readSkill, rank, ktView, DELAY_MS } from "./kt/ledger.js";

/** One FoldCtx for the online fold AND every replay (a different ctx would make them differ). */
export const LIVE_FOLD_CTX = Object.freeze({});

const CACHE = new Map();
const CACHE_MAX = 2000;
function remember(cache, childId, entry) {
  cache.delete(childId);
  cache.set(childId, entry);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}
/** Drop a child's cached fold (tests; a commit that interleaved with another writer). */
export const evictLive = (childId, cache = CACHE) => cache.delete(String(childId));

/**
 * The child's folded { ledger, comp } with every committed kt_evidence row. Reads only rows after the cached seq.
 * @param {{ id: string, class_level: number }} child
 * @returns {Promise<{ state: { ledger: any, comp: any }, maxSeq: number }>}
 */
export async function loadLive(child, { q = dbq, cache = CACHE } = {}) {
  const id = String(child.id);
  const hit = cache.get(id);
  const after = hit?.maxSeq ?? 0;
  const rows = await q("select * from kt_evidence where child_id = $1 and seq > $2 order by seq", [id, after]);
  let state = hit?.state ?? newLearnerState({ childId: id, classLevel: child.class_level });
  if (rows.length) state = fuseEvidence(state, rows.map(eventFromRow), LIVE_FOLD_CTX);
  const out = { state, maxSeq: rows.length ? Number(rows.at(-1).seq) : after };
  remember(cache, id, out);
  return out;
}

/**
 * After the turn's transaction committed: keep the online fold when the inserted events got exactly the seqs
 * after `prevMaxSeq` (nobody else wrote in between); otherwise evict (the next read replays the log).
 * @param {number[]} seqs the seq each staged kt_evidence insert returned (null = a re-delivery no-op)
 */
export function commitLive(child, prevMaxSeq, state, seqs, { cache = CACHE } = {}) {
  const id = String(child.id);
  const got = seqs.filter((x) => x != null).map(Number);
  const contiguous = got.every((x, i) => x === prevMaxSeq + i + 1) && got.length === seqs.length;
  if (!contiguous) { cache.delete(id); return false; }
  remember(cache, id, { state, maxSeq: prevMaxSeq + got.length });
  return true;
}

// ───────────── the seam: Director evidence → EvidenceEvents ─────────────

/** Classifier sources that are code decisions (a verified key, a tap, a module's own verdict); a model label is "llm". */
const CODE_SOURCES = new Set(["exact", "chip", "module", "forge_g1", "lexical", "empty", "predicate", "asr", "branch", "test"]);
export const graderOf = (cls) => (cls && !CODE_SOURCES.has(cls.source) ? "llm" : "code");
/** Classifier / evidence sources that mean "a module graded it" (source weight ×0.75 until the agreement gate). */
const MODULE_SOURCES = new Set(["module", "forge_g1"]);
/** Moves that teach (a transition only, no observation). */
export const TEACH_MOVES = new Set(["explain", "worked_example", "reteach"]);

/**
 * The KT events one classified turn produces, in two halves (pure; the caller stores the returned `ep` in the
 * lesson state). The Director must read beliefs that include this turn's answer, so the route folds the ANSWER
 * events, steps, then folds the CLOSE events; both are inserted in that arrival order (one foldOrder).
 *
 * Mapping (kt/adapter.js) with the facts only the route knows: the episode (one item attempt chain), the tries
 * before, whether the episode ended, the grader, the options.
 *   - an open item's wrong answer is NOT an event yet: the hint ladder continues (adapter openOutcome); the episode
 *     emits ONE event when it closes — the correct answer (C0-C4 by tries and rungs), or C4 when the Director leaves
 *     the item or reaches the assertion without one. A misconception the child showed in the episode rides on that
 *     closing event (decision integration-episode-close-carries-misconception).
 *   - a diagnostic / options item is graded on its first try only (retries carry no evidence: elimination).
 *   - a why (P2) and a volunteered reason are probe.why; the teach-back (P1) is ONE probe.teachback event over the
 *     taught skills (≤ 3, conjunctive), never one per skill. Both are returned in `deferred`, not `events`: their
 *     verdict is graded blind off the reply path and the event lands at the next turn (INTEGRATION.md §8).
 * @param {{ lessonId: string, startedAt: any, now: number, childSeq: number, evidence: any[], cls: any, prev: any,
 *   kit: any, activeItem: any, asrConf?: number|null, gaming?: boolean, leaked?: boolean, moduleOnly?: boolean, chipId?: string,
 *   shapeId?: string|null, deferenceDiscount?: boolean }} c  prev: the lesson state the evidence was judged against
 * @returns {{ events: any[], deferred: any[], ep: any, k: number }}
 */
export function answerEvents(c) {
  const { lessonId, childSeq, evidence, cls, prev, kit, activeItem } = c;
  const grader = graderOf(cls);
  const topicType = activeItem?.topicType ?? kit.topicType;
  const kitVerified = (activeItem?.kitVerified ?? kit.verified) !== false;
  let ep = prev.kt?.ep ?? null;
  if (ep?.closed && ep.itemId !== prev.activeItemId) ep = null;              // a closed episode on another item is done
  const events = [], deferred = [];
  const ctr = { k: 0 };
  const base = baseOf(c, ctr, { grader, topicType, kitVerified });
  // The source weight (bktr.js temper, ×0.75 module / ×0.5 game) needs the source: a module-only turn, a classifier
  // verdict that came from a module (W1-B bound mounts: source "module" / "forge_g1"), or one evidence row so tagged.
  const turnVia = c.moduleOnly || MODULE_SOURCES.has(cls?.source) ? "module" : cls?.source === "game" ? "game" : "dialogue";
  const viaOf = (ev) => (MODULE_SOURCES.has(ev?.source) ? "module" : ev?.source === "game" ? "game" : turnVia);
  const meta = (it, ev) => ({ via: viaOf(ev), ...(it?.coincidentFor?.length ? { coincident: true } : {}) });
  for (const ev of evidence) {
    if (ev.probe === "P1") continue;                                          // one teach-back event, below
    const item = ev.itemId ? activeItem : null;
    const episodeId = `${lessonId}:${ev.itemId ?? `${ev.skillId}:${ev.probe}`}`;
    if (ev.probe === "P2") {
      const e = fromLegacyEvidence(ev, base({ episodeId }));
      if (e) deferred.push({ ...e, target: ev.skillId, ...meta(item, ev), ...(c.shapeId ? { shapeId: c.shapeId } : {}), ...(c.deferenceDiscount ? { deferenceDiscount: true } : {}) });
      continue;
    }
    if (!ep || ep.itemId !== ev.itemId) ep = { itemId: ev.itemId, skillId: ev.skillId, wrong: 0, mis: null, closed: false, mcq: !!item?.options?.length };
    if (ep.closed) continue;
    const options = item?.options?.length ?? 0;
    const correct = ev.outcome === "correct";
    if (!correct && ev.misconceptionId) ep.mis = ev.misconceptionId;
    if (options >= 2 || ev.probe === "P7") {
      const e = fromLegacyEvidence(ev, base({ episodeId, options, triesBefore: ep.wrong, ...(c.chipId?.startsWith("opt:") ? { form: "recognise" } : {}) }));
      if (e) events.push({ ...e, target: ev.skillId, ...meta(item, ev) });
      if (correct) ep.closed = true; else ep.wrong += 1;
      continue;
    }
    if (correct) {
      const { misconceptionId: _own, ...rest } = ev;
      const e = fromLegacyEvidence({ ...rest, ...(ep.mis ? { misconceptionId: ep.mis } : {}) }, base({ episodeId, triesBefore: ep.wrong }));
      if (e) events.push({ ...e, target: ev.skillId, ...meta(item, ev) });
      ep.closed = true;
    } else {
      ep.wrong += 1;
      ep.via = viaOf(ev);                                                     // round2 truth: endEvents writes the leave with it
    }
  }
  const tb = evidence.filter((ev) => ev.probe === "P1");
  if (tb.length) {
    const skillIds = [...new Set(tb.map((ev) => ev.skillId))].slice(0, 3);
    const e = fromLegacyEvidence({ ...tb[0], skillId: skillIds[0] }, base({ episodeId: `${lessonId}:teachback` }));
    if (e) deferred.push({ ...e, skillIds, target: skillIds[0], shapeId: "C01", via: "dialogue" });
  }
  return { events, deferred, ep, k: ctr.k };
}

/**
 * The second half: the episode closes without a correct answer (the Director left the item, or the assertion was
 * given), and a teaching move's teach event (a transition, capped per episode: one per lesson, move kind, skill).
 * @param {any} c answerEvents' input plus { next, hold } @param {{ ep: any, k: number }} a answerEvents' result
 * @returns {{ events: any[], ep: any }}
 */
export function closeEvents(c, a) {
  const { lessonId, next, kit, activeItem } = c;
  const ctr = { k: a.k };
  const topicType = activeItem?.topicType ?? kit.topicType;
  const base = baseOf(c, ctr, { grader: graderOf(c.cls), topicType, kitVerified: (activeItem?.kitVerified ?? kit.verified) !== false });
  const events = [];
  let ep = a.ep;
  if (ep && !ep.closed && !ep.mcq && ep.wrong > 0 && (next.activeItemId !== ep.itemId || next.hintLevel >= 4)) {
    const ev = { skillId: ep.skillId, itemId: ep.itemId, probe: "P15", outcome: "incorrect", hintsUsed: 4, weight: 1, ...(ep.mis ? { misconceptionId: ep.mis } : {}) };
    const e = fromLegacyEvidence(ev, base({ episodeId: `${lessonId}:${ep.itemId}`, triesBefore: ep.wrong, episodeEnded: true }));
    if (e) events.push({ ...e, target: ep.skillId, via: c.moduleOnly ? "module" : "dialogue" });
    ep = { ...ep, closed: true };
  }
  const move = next.lastMove;
  if (move && !c.hold && TEACH_MOVES.has(move.kind) && move.skillId) {
    const t = base({});
    events.push({ ...teachEvent({ id: t.id, sessionId: lessonId, sessionStartAt: t.sessionStartAt, at: t.at,
      episodeId: `${lessonId}:teach:${move.kind}:${move.skillId}`, skillId: move.skillId, topicType }), via: "dialogue" });
  }
  return { events, ep };
}

/**
 * round2 truth (prod w1b-mounts 2026-10-06: a G1 open-class commit answered wrong, then the lesson ended, wrote NO row):
 * the lesson end is the Director leaving the item. An open episode with wrong tries and no correct answer closes exactly
 * as closeEvents closes it on a leave (P15, C4, episodeEnded; the misconception shown rides on it), so a wrong answer the
 * child gave is never silently dropped. Options items already wrote their first try. Pure; [] when nothing is open.
 * @param {{ lessonId: string, startedAt: any, now: number, state: any, kit: any }} c
 * @returns {any[]}
 */
export function endEvents({ lessonId, startedAt, now, state, kit }) {
  const ep = state?.kt?.ep;
  if (!ep || ep.closed || ep.mcq || !(ep.wrong > 0) || !ep.itemId || !ep.skillId) return [];
  const ctr = { k: 0 };
  const base = baseOf({ lessonId, startedAt, now, childSeq: "end" }, ctr, { grader: "code", topicType: kit?.topicType, kitVerified: kit?.verified !== false });
  const ev = { skillId: ep.skillId, itemId: ep.itemId, probe: "P15", outcome: "incorrect", hintsUsed: 4, weight: 1, ...(ep.mis ? { misconceptionId: ep.mis } : {}) };
  const e = fromLegacyEvidence(ev, base({ episodeId: `${lessonId}:${ep.itemId}`, triesBefore: ep.wrong, episodeEnded: true }));
  return e ? [{ ...e, target: ep.skillId, via: ep.via === "module" ? "module" : "dialogue" }] : [];
}

function baseOf(c, ctr, { grader, topicType, kitVerified }) {
  const at = new Date(c.now).toISOString();
  const sessionStartAt = new Date(c.startedAt ?? c.now).toISOString();
  return (extra) => ({
    id: `${c.lessonId}:${c.childSeq}:${ctr.k++}`, sessionId: c.lessonId, sessionStartAt, at, grader, topicType, kitVerified,
    ...(c.asrConf != null ? { asrConf: c.asrConf } : {}), ...(c.gaming ? { gamingWindowKt: true } : {}),
    ...(c.leaked ? { preAttemptHelp: true } : {}), ...extra,
  });
}

/** The compact belief the Director state holds (what nextProbe, noteOutcome, markAsked and reteachTrigger read). */
export function compactBelief(b) {
  if (!b) return null;
  return { skillId: b.skillId, state: b.state, reason: b.reason, display: b.display, pL: b.pL, retention: b.retention, U: b.U, T: b.T, open: b.open,
    refresh: b.refresh, misconception: { mStar: b.misconception.mStar, mId: b.misconception.mId, verified: b.misconception.verified } };
}

// ───────────── projections for the 001 readers and the Director ─────────────

/** kt display → the legacy SkillState status (parent corner, brief, next-topic, Conductor view read skill_state). */
export function legacyStatus(sk, now) {
  const r = readSkill(sk, now);
  if (!r) return "unseen";
  const learned = rank(r.display) >= rank("learned_today");
  if (learned && (r.refresh || (r.nextReviewAt && r.nextReviewAt <= new Date(now).toISOString()))) return "due";
  return r.display === "durable" ? "mastered" : r.display;
}

/**
 * The skill_state row the 001 readers see, projected from the ledger (never folded separately). pKnown is the
 * ledger's retention-free pL; delayedPass is the ledger's delayed flag; nextReview its review time.
 * @returns {import("../../shared/contracts").SkillState}
 */
export function legacySkillState(sk, now) {
  const status = legacyStatus(sk, now);
  const s = {
    skillId: sk.skillId, pKnown: Math.min(0.999, Math.max(0.001, sk.pL)), status: status === "due" ? (sk.display === "learned_today" ? "learned_today" : "mastered") : status,
    attempts: sk.n, correctUnaided: sk.flags.unaided ? Math.max(1, sk.recent.filter((x) => x === 1).length) : 0, generativePass: !!sk.flags.generative,
    delayedPass: !!sk.flags.delayed, lastSeen: new Date(now).toISOString(),
  };
  if (sk.nextReviewAt) s.nextReview = sk.nextReviewAt;
  return s;
}

/** The Director's slice of a skill (state.js snapshotSkill's fields), from the ledger. */
export function snapshotFromKt(sk, now) {
  const s = legacySkillState(sk, now);
  return { pKnown: s.pKnown, status: legacyStatus(sk, now), attempts: s.attempts, correctUnaided: s.correctUnaided, generativePass: s.generativePass };
}

/**
 * Skills whose delayed check is due at session open (INTEGRATION.md §4): ktView.due() AND every learned skill
 * with no delayed pass yet whose anchor is ≥ 20 h old (FSRS's first interval is usually > 1 day, so without the
 * second set the next-day check never runs — found by the comprehension simulator).
 * Order (round2 truth, V1 "the delayed check leads the next lesson every time it is due"): the delayed checks FIRST
 * (`check: true`; oldest anchor first, so a check that has waited is never starved), then FSRS reviews by lowest
 * retention. Before this, a just-learned skill (high retention) sorted behind every mastered skill's review and lost
 * its opener slot: evals/next-day-check/sim.mjs, 1,000 starts, seed 7: the opener was the due check in 354/645.
 * @returns {{ skillId: string, retention: number, check?: boolean }[]}
 */
export function dueForChecks(ledger, now, k = 4) {
  const t = new Date(now).getTime();
  const view = ktView(ledger, { now });
  const ids = new Set(view.due(k * 3));
  const checks = new Set();
  for (const sk of Object.values(ledger.skills)) {
    // p5-interaction (w1c-three-day, "+1 day: the delayed check leads the next lesson"): the opener is due 20 h after the
    // anchor, as before V1-10. What changed with V1.3 is what it COUNTS for: before 2 learning days it is a review of an item
    // the child has met (server/learner/checks.js), which never certifies; from 2 days on, the certifying check on a new item
    // (kt/ledger.js advanceDisplay: checkDayOk + novel).
    if (rank(sk.display) >= rank("learned_today") && !sk.flags.delayed && sk.anchorAt && t - new Date(sk.anchorAt).getTime() >= DELAY_MS) { ids.add(sk.skillId); checks.add(sk.skillId); }
  }
  return [...ids].map((id) => readSkill(ledger.skills[id], now)).filter(Boolean)
    .sort((a, b) => checks.has(b.skillId) - checks.has(a.skillId)
      || (checks.has(a.skillId) && a.anchorAt !== b.anchorAt ? (a.anchorAt < b.anchorAt ? -1 : 1) : 0)
      || a.retention - b.retention || (a.skillId < b.skillId ? -1 : 1))
    .map((s) => ({ skillId: s.skillId, retention: s.retention, ...(checks.has(s.skillId) ? { check: true } : {}) }));
}

/** Kit fields a probe shape needs (COMPREHENSION-ENGINE.md §4.3), present on this kit for this skill. */
export function kitInputsOf(kit, skillId) {
  const has = (x) => (Array.isArray(x) ? x.length > 0 : !!x);
  const mis = kit.misconceptions ?? [];
  const items = (kit.items ?? []).filter((i) => i.skillId === skillId);
  return [
    has(kit.expectations) && "expectations", has(mis) && "misconceptions", mis.some((m) => m.diagnostic) && "diagnostic", has(items) && "items",
    has(kit.characterView) && "characterView", has(kit.myth) && "myth", has(kit.counterfactual) && "counterfactual", has(kit.instances) && "instances",
    has(kit.representations) && "representations", has(kit.weaveHosts) && "weaveHosts", has(kit.solver) && "solver", has(kit.interestContexts) && "interestContexts",
  ].filter(Boolean);
}

/**
 * The scheduler's candidate map (INTEGRATION.md §2 skillsMap) for the given skills: belief, topic type, kit
 * inputs, days since the anchor, and the ledger's wheel-spin read (re-teach trigger input).
 */
export function skillsMapFor(state, kit, skillIds, now) {
  const out = {};
  const view = ktView(state.ledger, { now });
  for (const id of skillIds) {
    const belief = beliefFor(id, { ...state, now });
    const sk = state.ledger.skills[id];
    const anchor = sk?.learnedAt ?? sk?.anchorAt;
    out[id] = { belief: compactBelief(belief), topicType: kit.topicType, kitInputs: kitInputsOf(kit, id),
      delayDays: anchor ? (new Date(now).getTime() - new Date(anchor).getTime()) / 86_400_000 : 0, wheelSpin: view.wheelSpin(id) };
  }
  return out;
}
