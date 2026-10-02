// The learner ledger: one deterministic fold of evidence events into KT skill states, misconception
// states and θ epochs (LEARNER-MODEL §6.1-§6.3.1, §7). Pure: no clock, no randomness, no I/O. Sequenced
// events are ordered by the server-assigned seq and de-duplicated by id, so a replay is the same under any
// arrival order or re-delivery (§5 "Ordering and concurrency"; TP1-TP2); unsequenced ones, see below.
//
// The order inside one event (§6.3.1c): dedupe → open the subject's epoch for this session (lazily) →
// materialise priors from θ_BASE for skills with no state → KT update (the only path into pL) →
// misconceptions → thetaObs (the only path into θ) → mark seen.
//
// Isolation (§13.1): every input read here is a HELD input (episode, outcome, held flags, sessionStartAt,
// params). The only clock is the session's start: an event's own wall-clock time is never read, so vibe
// knobs that shift timestamps by seconds cannot move a byte (mutant VK6).
//
// ONE order for the cache and the log (TP2 on the real write path): events that carry a seq fold in seq
// order; events that do not (an online turn, before the database assigned one) fold in ARRIVAL order, and
// writer.ledgerStmts inserts them in exactly that order (foldOrder), so the database hands out seq in the
// order the cached fold applied them and a replay of kt_evidence reproduces kt_skill_state byte for byte.
// There is deliberately no id tiebreak: ids are opaque strings ("e10" < "e9"), not an order.
import { formOf, fsrsGrade, isDelayedMiss, isDelayedSuccess, isGenerativePass, isUnaidedCorrect, ITEM_CLASSES, outcomeName, recentValue, EMISSIONS } from "./outcomes.js";
import { dropReason, logEvidence, logit, sigmoid, spend, teachStep, temper, tEff, transition } from "./bktr.js";
import { nextReviewAt, retrievability, review } from "./fsrs.js";
import { addObs, currentTheta, defaultItemMeta, initialBase, newEpoch, openEpoch, strandOfSkill, subjectOfSkill, subjectOfStrand, thetaObs } from "./ability.js";
import { priorFromTheta } from "./priors.js";
import { misconceptionEffects, newMisconception, updateMisconception } from "./misconception.js";

export const PARAMS_VERSION = "kt-launch-2026-10-02";
export const LEARNED_P = 0.95;
export const DELAY_MS = 20 * 3600_000;
const DAY_MS = 86_400_000;
const IST_MS = 5.5 * 3600_000;
export const DISPLAY = Object.freeze(["unseen", "introduced", "practising", "learned_today", "mastered", "durable"]);
export const rank = (d) => DISPLAY.indexOf(d);
/** The local learning day (IST; allowed hours end 20:30, so no lesson crosses midnight). */
export const dayOf = (at) => new Date(new Date(at).getTime() + IST_MS).toISOString().slice(0, 10);

/** @returns {import("../../../shared/learner").Ledger} */
export function newLedger({ childId, classLevel, paramsVersion = PARAMS_VERSION }) {
  return { v: 1, childId, classLevel, paramsVersion, skills: {}, mis: {}, ability: {}, seen: {}, lastSeq: 0, session: null };
}

function newSkill(skillId, prior, topicType, epochId, seq, paramsVersion) {
  return {
    skillId, topicType, pL: prior.pL0, retention: prior.pL0, mem: null, n: 0, lastAt: null, paramsVersion,
    flags: { unaided: false, generative: false, delayed: false, durable7: false, durable30: false },
    recent: [], opp: 0, run: 0, display: "unseen", refresh: false,
    prior: { pL0: prior.pL0, source: prior.source, epochId, seq },
    aDay: null, bDay: null, learnedAt: null, anchorAt: null, anchorSession: null, delayedMisses: 0, nextReviewAt: null,
  };
}

function newSession(ev) {
  const startAt = new Date(ev.sessionStartAt ?? ev.at).toISOString();
  return { sessionId: ev.sessionId, startAt, day: dayOf(startAt), skills: {}, episodes: [], thetaW: {}, thetaCount: {}, drops: {} };
}
const sessSkill = (sess, k) => (sess.skills[k] ??= {
  budget: { sum: 0, byClass: {} }, episodes: [], oppEpisodes: [], teachGain: {}, memBefore: undefined, memEp: null,
  attempted: false, taught: false, checkDone: false,
});
/** The classes a delayed check can be (PRODUCT-DESIGN §6.4.1: an item or solo round, a near transfer, an error-spot). */
const CHECK_CLASSES = new Set([...ITEM_CLASSES, "probe.transfer.near", "probe.errorspot"]);

/**
 * Validate the shape of an event (throws: a malformed event is a bug upstream, never silent evidence).
 * @param {import("../../../shared/learner").EvidenceEvent} ev
 */
export function checkEvent(ev) {
  if (!ev || typeof ev.id !== "string" || !ev.id) throw new Error("evidence: id required");
  if (!ev.sessionId || !ev.episodeId) throw new Error(`evidence ${ev.id}: sessionId and episodeId required`);
  if (!Array.isArray(ev.skillIds) || ev.skillIds.length < 1 || ev.skillIds.length > 3) throw new Error(`evidence ${ev.id}: 1-3 skillIds`);
  if (!ev.teach && !EMISSIONS[ev.cls]) throw new Error(`evidence ${ev.id}: unknown class ${ev.cls}`);
  if (!ev.teach && outcomeName(ev.cls, ev.outcome) === undefined) throw new Error(`evidence ${ev.id}: bad outcome ${ev.outcome}`);
}

/**
 * The order a batch folds in: sequenced events by seq, then unsequenced ones in arrival order (a stable
 * sort; no id tiebreak). writer.ledgerStmts stages kt_evidence inserts in this same order.
 * @template {{ seq?: number | null }} E @param {E[]} events @returns {E[]}
 */
export const foldOrder = (events) => [...events].sort((a, b) => (a.seq ?? Infinity) - (b.seq ?? Infinity) || 0);

/**
 * Fold events into a COPY of the ledger, in foldOrder, duplicates skipped. Copy-on-write: only the skills,
 * epochs and session an event touches are cloned (the input ledger is never mutated), so one online event
 * costs O(touched state) plus one flat copy of `seen`. `seen` stays complete: it is the dedupe that keeps the
 * cached fold equal to a replay under re-delivery (TP1; the database key dedupes inserts, not the cache), and
 * comprehension/fuse.js reads it directly. Bounding it needs that reader moved onto a helper first.
 * @param {import("../../../shared/learner").Ledger} ledger
 * @param {import("../../../shared/learner").EvidenceEvent[]} events
 * @param {FoldCtx} [ctx]
 * @typedef {{ itemMeta?: (ev: any) => any, strandOf?: (skillId: string) => string, prereqsOf?: (skillId: string) => string[], strandsFor?: (subject: string) => string[],
 *   eta?: number, confusion?: any, cohort?: string, paraEnabled?: boolean, onTheta?: (o: any) => void, onKt?: (evId: string, skillId: string) => void }} FoldCtx
 */
export function fold(ledger, events, ctx = {}) {
  const L = { ...ledger, skills: { ...ledger.skills }, mis: { ...ledger.mis }, ability: { ...ledger.ability }, seen: { ...ledger.seen },
    session: ledger.session ? structuredClone(ledger.session) : null };
  const owned = new Set();
  const own = (bag, k) => { const x = bag[k]; if (x && !owned.has(x)) { bag[k] = structuredClone(x); owned.add(bag[k]); } return bag[k]; };
  for (const ev of foldOrder(events)) applyOne(L, ev, ctx, own);
  return L;
}
/** One event, online. Throws on an event older than the ledger's last seq (re-fold from the log instead). */
export const foldEvidence = (ledger, ev, ctx) => fold(ledger, [ev], ctx);

function ensureEpoch(L, subject, sess, ctx, own) {
  const cur = own(L.ability, subject);
  const epochId = `${sess.sessionId}:${subject}`;
  if (!cur) {
    const strands = (ctx.strandsFor?.(subject) ?? [`${subject}:core`]).slice().sort();
    L.ability[subject] = { ...newEpoch(initialBase({ strands, classLevel: L.classLevel, openedAt: sess.startAt, epochId })), sessionId: sess.sessionId };
  } else if (cur.sessionId !== sess.sessionId) {
    L.ability[subject] = { ...openEpoch(cur, sess.startAt, epochId), sessionId: sess.sessionId };
  }
  return L.ability[subject];
}

function applyOne(L, ev, ctx, own) {
  if (L.seen[ev.id] !== undefined) return;
  checkEvent(ev);
  if (ev.seq != null && ev.seq <= L.lastSeq) throw new Error(`evidence ${ev.id}: seq ${ev.seq} ≤ ledger seq ${L.lastSeq} (re-fold from the log)`);
  if (!L.session || L.session.sessionId !== ev.sessionId) L.session = newSession(ev);
  const sess = L.session;
  const markSeen = () => { L.seen[ev.id] = ev.seq ?? null; if (ev.seq != null) L.lastSeq = ev.seq; };

  const drop = ev.teach ? null : dropReason(ev, ctx);
  if (drop) { sess.drops[drop] = (sess.drops[drop] ?? 0) + 1; markSeen(); return; }

  for (const subject of [...new Set(ev.skillIds.map(subjectOfSkill))].sort()) ensureEpoch(L, subject, sess, ctx, own);
  for (const k of ev.skillIds) own(L.skills, k);
  // TH2: priors from θ_BASE only, materialised before the event is applied, then frozen.
  for (const k of ev.skillIds) {
    if (L.skills[k]) continue;
    const ep = L.ability[subjectOfSkill(k)];
    const prereqPLs = (ctx.prereqsOf?.(k) ?? []).map((p) => L.skills[p]?.pL).filter((p) => p != null);
    L.skills[k] = newSkill(k, priorFromTheta(ep.base, k, { topicType: ev.topicType, prereqPLs, strand: (ctx.strandOf ?? strandOfSkill)(k) }), ev.topicType ?? "T3", ep.base.epochId, ev.seq ?? null, L.paramsVersion);
  }
  const firstOfEpisode = !sess.episodes.includes(ev.episodeId);

  if (ev.teach) applyTeach(L, ev, sess, ctx);
  else applyEvidence(L, ev, sess, ctx);

  // θ: the only path in (TH1).
  if (!ev.teach) {
    const item = ctx.itemMeta?.(ev) ?? defaultItemMeta(ev, ctx.strandOf);
    const key = [...item.skillIds].sort().join("|");
    const r = thetaObs(ev, item, {
      firstOfEpisode, cohort: ctx.cohort,
      taughtBefore: (k) => !!sess.skills[k]?.taught,
      thetaCount: () => sess.thetaCount[key] ?? 0,
      thetaWeight: (s) => sess.thetaW[s] ?? 0,
    });
    if (r.obs) {
      const ep = own(L.ability, subjectOfStrand(r.obs.strand));
      if (ep?.ll[r.obs.strand]) {
        addObs(ep, r.obs);
        sess.thetaW[r.obs.strand] = (sess.thetaW[r.obs.strand] ?? 0) + r.obs.w;
        sess.thetaCount[key] = (sess.thetaCount[key] ?? 0) + 1;
        ctx.onTheta?.(r.obs);
      }
    }
  }
  if (firstOfEpisode) sess.episodes.push(ev.episodeId);
  markSeen();
}

function applyTeach(L, ev, sess, ctx) {
  for (const k of ev.skillIds) {
    const sk = L.skills[k], ss = sessSkill(sess, k);
    const T = tEff(sk.topicType, ctx.eta ?? 0);
    const gained = ss.teachGain[ev.episodeId] ?? 0;
    if (!ss.episodes.includes(ev.episodeId)) {
      const pL = teachStep(sk.pL, T, gained);
      ss.teachGain[ev.episodeId] = gained + (pL - sk.pL);
      sk.pL = pL;
      ss.episodes.push(ev.episodeId);
    }
    ss.taught = true;
    if (rank(sk.display) < rank("introduced")) sk.display = "introduced";
    sk.retention = sk.pL * retrievability(sk.mem, sess.startAt);
  }
}

function applyEvidence(L, ev, sess, ctx) {
  const ks = ev.skillIds;
  const sks = ks.map((k) => L.skills[k]);
  // No double count (§6.2): a misconception-graded why/teach-back routed to the misconception layer
  // carries no skill emission.
  const misOnly = ev.misconceptionId && ev.misRoute !== "skill" && outcomeName(ev.cls, ev.outcome) === "misconception";
  const raw = misOnly ? ks.map(() => 0)
    : logEvidence(ev, sks.map((s) => s.pL), sks.map((s) => retrievability(s.mem, sess.startAt)), ctx.confusion);
  const x = temper(ev);
  ks.forEach((k, i) => {
    const sk = sks[i], ss = sessSkill(sess, k);
    const { applied, budget } = misOnly ? { applied: 0, budget: ss.budget } : spend(ss.budget, ev.cls, raw[i] * x);
    ss.budget = budget;
    const q = sigmoid(logit(sk.pL) + applied);
    let pL = q;
    if (!ss.episodes.includes(ev.episodeId)) { pL = transition(q, tEff(sk.topicType, ctx.eta ?? 0)); ss.episodes.push(ev.episodeId); }
    sk.pL = pL;
    // Rule 8: FSRS once per skill per session, on the first retrieval-type event; C0 + a passed
    // transfer/why in the same episode upgrades the grade to 4.
    if (ITEM_CLASSES.has(ev.cls) && !ss.memEp) {
      ss.memBefore = sk.mem;
      ss.memEp = { episodeId: ev.episodeId, g: fsrsGrade(ev.cls, ev.outcome) };
      sk.mem = review(ss.memBefore, ss.memEp.g, sess.startAt);
    } else if (ss.memEp && ss.memEp.episodeId === ev.episodeId && ss.memEp.g === 3 && isGenerativePass(ev.cls, ev.outcome)) {
      ss.memEp.g = 4;
      sk.mem = review(ss.memBefore, 4, sess.startAt);
    }
    sk.n += 1;
    sk.lastAt = sess.startAt;
    ctx.onKt?.(ev.id, k);
    advanceDisplay(sk, ev, sess, ss, ev.target ? ev.target === k : i === 0);
    sk.retention = sk.pL * retrievability(sk.mem, sess.startAt);
    sk.nextReviewAt = rank(sk.display) >= rank("learned_today") ? reviewAt(sk) : null;
  });
  for (const eff of misconceptionEffects(ev)) {
    // A correct answer on a discriminating item is evidence AGAINST a belief the child has shown; with no
    // hit there is nothing to discount, so no row is created and no check is scheduled.
    if (eff.kind === "discriminating_correct" && !(L.mis[eff.id]?.hits > 0)) continue;
    const m = L.mis[eff.id] ?? newMisconception(eff.id);
    L.mis[eff.id] = updateMisconception(m, eff.kind, sess.startAt);
  }
}

function reviewAt(sk) {
  const fs = nextReviewAt(sk.mem);
  const anchor = sk.anchorAt ? new Date(new Date(sk.anchorAt).getTime() + DELAY_MS).toISOString() : null;
  return [fs, anchor].filter(Boolean).sort().pop() ?? null;
}

/**
 * The ledger state machine (LEARNER-MODEL §6.1 States; PRODUCT-DESIGN §6.4.1). (a), (b) and (c) count
 * only for the item's TARGET skill (the other skills of a conjunctive item get pL evidence only).
 */
function advanceDisplay(sk, ev, sess, ss, isTarget) {
  const produce = formOf(ev) === "produce";
  const clean = !ev.assisted && !ev.preAttemptHelp && !ev.gamingWindowKt && !ev.controllerEasy;
  ss.attempted = true;
  if (rank(sk.display) < rank("practising")) sk.display = "practising";

  const rv = recentValue(ev.cls, ev.outcome);
  if (rv !== null) sk.recent = [...sk.recent, clean ? rv : 0].slice(-3);
  if (ITEM_CLASSES.has(ev.cls) && !ss.oppEpisodes.includes(ev.episodeId)) {
    ss.oppEpisodes.push(ev.episodeId);
    sk.opp += 1;
    sk.run = rv === 1 && clean ? sk.run + 1 : 0;
    if (sk.run >= 3) sk.opp = 0;
  }
  if (!isTarget) return;

  const start = new Date(sess.startAt).getTime();
  // (c) the delayed check: the first CHECK-CLASS attempt on the skill in a later session ≥ 20 h after the
  // anchor, before any re-teach of it in that session; produce-form only (a recognition item is never a
  // check, and spends it). Only an item / solo round, a near transfer or an error-spot can be the check: a why, predict or
  // teach-back opening the session neither uses the check up nor re-anchors the clock. The 20 h is measured
  // session start to session start (no intra-session clock, §13.1): decision learner-delayed-check-session-clock.
  const due = CHECK_CLASSES.has(ev.cls) && rank(sk.display) >= rank("learned_today") && !ss.checkDone && !ss.taught
    && sk.anchorAt && sk.anchorSession !== sess.sessionId && start - new Date(sk.anchorAt).getTime() >= DELAY_MS;
  // A recognition item (a tap on shown options) at the check's moment SPENDS the check without counting:
  // the options cue the answer, so a produce attempt after it is no longer an unprompted retrieval.
  if (due && !produce) ss.checkDone = true;
  const isCheck = due && produce;
  if (isCheck) {
    if (clean && isDelayedSuccess(ev.cls, ev.outcome)) {
      ss.checkDone = true;
      sk.flags.delayed = true;
      sk.delayedMisses = 0;
      sk.refresh = false;
      const since = sk.learnedAt ? start - new Date(sk.learnedAt).getTime() : 0;
      if (rank(sk.display) >= rank("mastered")) {
        if (since >= 7 * DAY_MS) sk.flags.durable7 = true;
        if (since >= 30 * DAY_MS) sk.flags.durable30 = true;
        if (sk.flags.durable7 && sk.flags.durable30) sk.display = "durable";
      } else if (sk.pL >= LEARNED_P) {
        sk.display = "mastered";
      }
      reanchor(sk, sess);
    } else if (isDelayedMiss(ev.cls, ev.outcome)) {
      ss.checkDone = true;
      sk.delayedMisses += 1;
      sk.refresh = true;
      if (sk.delayedMisses >= 2) demote(sk);
      reanchor(sk, sess);
    } else if (fsrsGrade(ev.cls, ev.outcome) === 2) {
      ss.checkDone = true;
      reanchor(sk, sess);    // C1 / C2 (G = 2): neither a pass nor a miss; only these re-anchor (§6.4.1)
    }                        // anything else (an error-spot caught but not fixed, NA): not a check at all
  }

  if (produce && clean && isUnaidedCorrect(ev.cls, ev.outcome)) { sk.aDay = sess.day; sk.flags.unaided = true; }
  if (produce && clean && isGenerativePass(ev.cls, ev.outcome)) { sk.bDay = sess.day; sk.flags.generative = true; }
  if (rank(sk.display) <= rank("practising") && sk.aDay === sess.day && sk.bDay === sess.day && sk.pL >= LEARNED_P
    && sk.recent.filter((r) => r === 1).length >= 2) {
    sk.display = "learned_today";
    sk.learnedAt ??= sess.startAt;
    sk.delayedMisses = 0;
    reanchor(sk, sess);
  }
}
const reanchor = (sk, sess) => { sk.anchorAt = sess.startAt; sk.anchorSession = sess.sessionId; };
function demote(sk) {
  sk.delayedMisses = 0;
  if (sk.display === "durable") { sk.display = "mastered"; sk.flags.durable30 = false; return; }
  if (sk.display === "mastered") { sk.display = "learned_today"; return; }
  sk.display = "practising";                         // a fresh (a) + (b) day comes first
  sk.aDay = null; sk.bDay = null; sk.learnedAt = null;
}

// ───────────── reads ─────────────
/** Retention and the refresh flag at read time (absence never lowers display; only the flag moves). */
export function readSkill(sk, now) {
  if (!sk) return undefined;
  const R = retrievability(sk.mem, now);
  return { ...sk, retention: sk.pL * R, refresh: sk.refresh || (rank(sk.display) >= rank("learned_today") && R < 0.9) };
}

/** Current θ per strand for every subject (marginals). */
export function thetaView(L) {
  return Object.fromEntries(Object.entries(L.ability).map(([subject, ep]) => [subject, currentTheta(ep)]));
}

/** The KtView the Director reads (LEARNER-MODEL §6.1). */
export function ktView(L, { now, prereqsOf } = {}) {
  return {
    skill: (id) => readSkill(L.skills[id], now),
    /** P(first-attempt success) on an open item of these skills, from retention (not pL). */
    pSuccessNext: (skillIds, cls = "item.open") => {
      const e = EMISSIONS[cls];
      return skillIds.reduce((p, id) => {
        const s = readSkill(L.skills[id], now);
        const ret = s ? s.retention : 0.1;
        return p * (ret * e.k[0] + (1 - ret) * e.u[0]);
      }, 1);
    },
    weakestPrereq: (id) => {
      const ps = (prereqsOf?.(id) ?? []).map((p) => readSkill(L.skills[p], now)).filter(Boolean);
      return ps.length ? ps.sort((a, b) => a.pL - b.pL || (a.skillId < b.skillId ? -1 : 1))[0].skillId : null;
    },
    due: (k = 3) => Object.values(L.skills).map((s) => readSkill(s, now))
      .filter((s) => rank(s.display) >= rank("learned_today") && (s.refresh || (s.nextReviewAt && s.nextReviewAt <= new Date(now).toISOString())))
      .sort((a, b) => (a.nextReviewAt ?? "") < (b.nextReviewAt ?? "") ? -1 : 1).slice(0, k).map((s) => s.skillId),
    wheelSpin: (id) => { const s = L.skills[id]; return !s ? "none" : s.opp >= 10 ? "confirm" : s.opp >= 6 ? "warn" : "none"; },
  };
}

/** Canonical JSON (sorted keys): the byte form the replay and isolation properties compare. */
export function canonical(x) {
  if (Array.isArray(x)) return `[${x.map(canonical).join(",")}]`;
  if (x && typeof x === "object") return `{${Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(x[k])}`).join(",")}}`;
  return JSON.stringify(x ?? null);
}

/** The persisted part of a ledger (no session ledger, no in-epoch LL: those are rebuilt by replay). */
export function ledgerDigest(L) {
  return canonical({ skills: L.skills, mis: L.mis, theta: thetaView(L) });
}

export { strandOfSkill };
