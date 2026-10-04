// server/signals: the per-turn signal layer (docs/design/signals/SIGNALS-SPEC.md). One pure function:
//
//   step(session, input, { off? }) → { frame: SignalFrame, next: SignalSession }
//
// - EVIDENCE, NOT AUTHORITY (decision sig-layer-evidence-not-authority): the frame proposes nothing; the existing proposers
//   (Director, comprehension, RELATIONAL-OS, vibe/persona, the Moment) read it. The kernel's authority order is untouched.
// - SAFETY FIRST (SL-1): on any safety turn the frame is ABSTAIN with no licence, no cause candidate, no evidence weight and
//   no sig:* reason code.
// - PURE (SL-13, G-SIG-PURE): no network, no clock (time is an input), no randomness, no DB, no process.env. The same input
//   gives a byte-identical frame. Callers wrap it in seamSafe(); a throw means frame = null and today's behaviour.
// - Feature names in comments are SIGNALS-SPEC ids (A = acoustic, L = linguistic, I = interaction, G = session).
import { readText } from "./linguistic.js";
import { acousticCues, fin, mean, quality, sttFamily } from "./quality.js";
import { coerceSession, foldAnchor, median, newSignalSession } from "./session.js";
import { derive } from "./states.js";
import { BAND_PRIORS } from "./priors.js";
import { fnv1a, numberOf } from "./text.js";
import { PURE_FILLER } from "./lexicon/discourse.js";
import { safetyBackstop } from "./backstop.js";

export { newSignalSession } from "./session.js";
export { safetyBackstop } from "./backstop.js";
export { SIG_STATES, BAND_PRIORS, MASTERY_NUDGE_CAP, MAX_CONSOLIDATE, VERIFY_EVERY } from "./priors.js";

/** Characters of one child turn the lexicons read (a child's turn is far shorter; this bounds worst-case latency). */
const MAX_TEXT = 1200;
/** Child turns after a safety turn during which playful licences (child_joke, choiceDue) are withheld. [U] */
const SAFETY_HOLD_TURNS = 3;
const VERDICTS = new Set(["correct", "partial", "not_yet", "ungraded"]);
const RANK = { not_yet: 0, partial: 1, correct: 2 };

/**
 * Kill switches (SIGNALS-SPEC §5): TAXILA_SIGNALS = off | shadow | on (default off), TAXILA_SIGNALS_OFF = "A1,L10,…".
 * The caller passes its env; this module never reads process.env (purity).
 * @param {Record<string, string | undefined>} env
 */
export function signalsMode(env = {}) {
  const m = String(env.TAXILA_SIGNALS ?? "off").trim().toLowerCase();
  const mode = m === "on" || m === "shadow" ? m : "off";
  const off = new Set(String(env.TAXILA_SIGNALS_OFF ?? "").split(",").map((s) => s.trim().toUpperCase()).filter((s) => /^[ALIG]\d+$/.test(s)));
  return { mode, off };
}

/**
 * SL-8 helper for the comprehension fold (§8.2 step 10): clip a signal-weighted pL to within MASTERY_NUDGE_CAP of the
 * no-signal pL. Exported so the consumer cannot re-implement the cap differently.
 */
export function clipMasteryNudge(pWithSignals, pWithout, cap = 0.03) {
  return Math.max(pWithout - cap, Math.min(pWithout + cap, pWithSignals));
}

function abstainFrame(input) {
  const prior = BAND_PRIORS[input.band] ?? BAND_PRIORS.B3;
  return {
    v: 1, abstain: true, reasons: [],
    turn: { waitLonger: false, nudgeAtSec: prior.waitNudgeSec, thinkAloud: false },
    q: { asr: 0, acoustic: 0, source: input.asrSource ?? "unknown" },
  };
}

/** Null out features the kill switch turned off, so no state can read them. */
function applyOff(L, off) {
  if (!off.size) return L;
  const o = { ...L };
  if (off.has("L1")) o.idk = null;
  if (off.has("L2") || off.has("L3")) o.hedge = false;
  if (off.has("L4")) o.fillerLead = null;
  if (off.has("L5")) o.repairDir = null;
  if (off.has("L7")) o.metaRequest = null;
  if (off.has("L8")) o.helpAsk = null;
  if (off.has("L9")) o.question = null;
  if (off.has("L10")) { o.initiative = null; o.fragment = undefined; }
  if (off.has("L11")) o.alignment = null;
  if (off.has("L12")) o.share = false;
  if (off.has("L13")) o.laugh = false;
  return o;
}

/**
 * One turn. `session` may be null/undefined (a fresh lesson) or a stored lesson.state.sig.
 * @param {any} session @param {import("../../shared/signals.ts").SignalInput} input @param {{ off?: Iterable<string> }} [opts]
 */
export function step(session, input, opts = {}) {
  const sess = coerceSession(session);
  const off = new Set(opts.off ?? []);
  const childTurns = sess.childTurns + 1;
  // A child turn is bounded for the lexicons (latency: SL-13). Safety never reads this copy; it reads the full text upstream.
  if (typeof input.childText === "string" && input.childText.length > MAX_TEXT) input = { ...input, childText: input.childText.slice(0, MAX_TEXT) };
  // SL-1, plus the abstain-only backstop for distress shapes the floor predicate missed in ES-3 (backstop.js).
  if (input.safety || safetyBackstop(input.childText)) {
    return { frame: abstainFrame(input), next: { ...sess, childTurns, turnsSinceVerify: sess.turnsSinceVerify + 1, safetyHold: SAFETY_HOLD_TURNS } };
  }
  // After a safety turn, playful licences (a teacher laugh, a game/choice offer) stay off for SAFETY_HOLD_TURNS child turns:
  // RELATIONAL-OS owns the check-in after distress (SL-1), and a laugh one turn after a disclosure is the worst failure.
  const hold = (sess.safetyHold ?? 0) > 0;
  const verdict = VERDICTS.has(input.verdict) ? input.verdict : "ungraded";
  const graded = verdict !== "ungraded";
  const L = applyOff(readText(input), off);
  const q = quality(input, L);
  const prior = BAND_PRIORS[input.band] ?? BAND_PRIORS.B3;

  // ── acoustics: session anchor (§2.5.4) then the cue reads ──
  const reliableAns = !!input.voice?.reliable && q.acoustic >= 0.5 && input.item?.form !== "read_aloud" && !input.typed;
  const anc = foldAnchor(sess, input.voice?.z, reliableAns, !!input.voice?.anchorReset);
  const E = acousticCues(input, q, anc.anchor, off);
  // L4 on a clean STT falls back to A7 via A2: a leading filled segment = onsetContentMs beyond onsetMs (§2.7, SG-M4).
  const f = input.voice?.f ?? {};
  const fillerA7 = sttFamily(input.asrSource) !== "verbatim" && !off.has("A2") && q.acoustic >= 0.5 && fin(f.onsetContentMs) && fin(f.onsetMs) ? f.onsetContentMs - f.onsetMs >= 300 : null;

  // ── interaction: the item / step state (I1, I2, I4, I10) ──
  const sameItem = !!input.item && input.item.id === sess.item.id;
  const it = sameItem ? { ...sess.item, attempts: [...sess.item.attempts] } : { id: input.item?.id ?? null, impasse: 0, attempts: [], clarified: false, notYet: 0, lastHintRung: input.hintRung ?? 0 };
  const hintNow = input.hintRung ?? 0;
  const hintBetween = hintNow > (it.lastHintRung ?? 0);
  const content = L.toks.filter((t) => t !== "?" && !PURE_FILLER.test(t));
  const h = fnv1a(content.join(" "));
  const num = content.map(numberOf).find((n) => n != null);
  const prevAttempt = it.attempts.at(-1);
  const notYetBefore = it.notYet;
  const lastVerdict = it.lastVerdict;
  let progress = false, retryUnprompted = false, repeatWrong = false;
  if (input.item && graded) {
    repeatWrong = verdict !== "correct" && it.attempts.some((a) => a.h === h && a.v !== "correct");
    const towardKey = input.item.keyNum != null && num != null && prevAttempt?.num != null && Math.abs(num - input.item.keyNum) < Math.abs(prevAttempt.num - input.item.keyNum);
    const improved = lastVerdict && lastVerdict !== "ungraded" && RANK[verdict] > RANK[lastVerdict];
    progress = !repeatWrong && (improved || towardKey || (verdict === "partial" && !it.attempts.some((a) => a.h === h)));
    retryUnprompted = !off.has("I4") && ((lastVerdict === "not_yet" && !hintBetween && prevAttempt?.h !== h) || L.retryLex);
    if (verdict === "correct") it.impasse = 0;
    else if (progress) it.impasse = 1;              // still on an unsolved step; the no-progress clock restarts
    else it.impasse += 1;
    if (verdict === "not_yet") it.notYet += 1;
    it.attempts = [...it.attempts, { h, ...(num != null ? { num } : {}), v: verdict }].slice(-8);
    it.lastVerdict = verdict;
    it.lastHintRung = hintNow;
  } else if (input.item && L.idk) {
    it.impasse += 1;
  }
  if (L.question?.type === "clarify" && input.item) it.clarified = true;
  const last3 = it.attempts.slice(-3);
  const cycling = !off.has("I2") && last3.length === 3 && last3.every((a) => a.v !== "correct") && new Set(last3.map((a) => a.h)).size === 3;
  const thinkAloud = !off.has("I10") && (((input.held ?? 0) >= 1 && L.thinkAloudLex) || (L.thinkAloudLex && !graded && L.words <= 6 && L.toks.length > 0 && !L.idk && !L.question && THINK_EXPLICIT(L)));

  // ── session features (G1, G3, G4, G5, L15) ──
  // A graded attempt is an answer, however short: a shy child's correct "haan" / "5" / "nahi" on a yes-no item is never a
  // non-answer (review 2026-10-04: three correct one-word answers fired choiceDue). An empty or tiny transcript over a
  // second of detected speech is an STT miss, not silence from the child (SL-10: absence is weightless both ways).
  const answered = graded && (verdict === "correct" || verdict === "partial" || input.item?.form === "choice_spoken");
  const asrMiss = L.words === 0 && !input.typed && fin(f.durationMs) && f.durationMs >= 600 && (!fin(f.voicedFrac) || f.voicedFrac >= 0.2);
  const nonAnswer = !answered && !asrMiss && (!!L.idk || L.minimal || (verdict === "ungraded" && !!input.item && L.words <= 2 && !L.question && !thinkAloud));
  // L15 compares answer length only where length can vary: a number or a spoken choice is short for everyone, so those
  // forms never feed it (ES-1 first run: L15 on number items fired choiceDue on ordinary "pata nahi" turns, precision 0.45).
  const wordyForm = ["explain", "word", "read_aloud"].includes(input.item?.form ?? "");
  const priorAnswers = sess.answerWords;
  const sessMedian = priorAnswers.length >= 4 ? median(priorAnswers) : prior.medianWords;
  const wordsRel = off.has("L15") || !sessMedian || !wordyForm ? null : L.words / sessMedian;
  const answerWords = graded && wordyForm ? [...priorAnswers, L.words].slice(-40) : priorAnswers;
  const lowWords = graded && wordyForm ? (wordsRel != null && wordsRel <= 1 / 3 ? sess.lowWords + 1 : 0) : sess.lowWords;
  const nonAnswers = [...sess.nonAnswers, nonAnswer ? 1 : 0].slice(-5);
  const bt = input.item?.b != null && input.ledger?.theta != null ? Math.max(-2, Math.min(2, input.item.b - input.ledger.theta)) : undefined;
  const gradedList = graded ? [...sess.graded, { y: verdict === "correct" ? 1 : 0, ...(bt != null ? { bt } : {}) }].slice(-24) : sess.graded;
  const gradedFirst = graded && sess.gradedFirst.length < 6 ? [...sess.gradedFirst, { y: verdict === "correct" ? 1 : 0, ...(bt != null ? { bt } : {}) }] : sess.gradedFirst;
  const gradedN = (sess.gradedN ?? sess.graded.length) + (graded ? 1 : 0);
  const errDrift = errorDrift(gradedFirst, gradedList, gradedN);
  // G3: composite of difficulty-adjusted onset z and −rate z over the last 4 reliable answer turns, minus the anchor.
  let driftBuf = sess.driftBuf;
  if (reliableAns && graded) {
    const c = mean([E.onsetAdj, E.rateLow == null ? null : -E.rateLow]);
    if (c != null) driftBuf = [...driftBuf, c].slice(-4);
  }
  const drift = driftBuf.length >= 4 ? median(driftBuf) : null;
  const driftHigh = drift != null && drift >= 1 ? sess.driftHigh + (reliableAns && graded ? 1 : 0) : 0;

  // D10 input: affect.js gaming() when the caller passes it; else the same two halves locally.
  const answerAsks = L.helpAsk === "answer" ? [...sess.answerAsks, childTurns].filter((t) => t > childTurns - 10) : sess.answerAsks.filter((t) => t > childTurns - 10);
  const gamingSuspect = typeof input.gaming === "boolean" ? input.gaming : answerAsks.length >= 2 || cycling;

  // D12 relational counts (session only).
  const rel = { ...sess.rel };
  if (L.initiative) rel.initiative += 1;
  if (L.question && (L.question.depth === "why_how" || L.question.depth === "what_if")) rel.deepQuestions += 1;
  if (L.alignment != null) { rel.alignmentSum = Math.round((rel.alignmentSum + L.alignment) * 1000) / 1000; rel.alignmentN += 1; }
  if (L.share || input.relSignals?.share) rel.shares += 1;
  if (retryUnprompted) rel.retries += 1;
  if (L.laugh && !L.sarcasm) rel.jokes += 1;

  // Skill outcomes for D9 (last 2).
  const skillLast = { ...sess.skillLast };
  if (graded && input.item?.skillId) skillLast[input.item.skillId] = [...(skillLast[input.item.skillId] ?? []), verdict === "correct" ? 1 : 0].slice(-2);

  const langCounts = { ...sess.langCounts };
  if (L.langMode) langCounts[L.langMode] = (langCounts[L.langMode] ?? 0) + 1;

  const F = {
    input, L, E, q, verdict, fillerA7,
    I: { impasse: input.item ? it.impasse : 0, progress, retryUnprompted, repeatWrong, cycling, wheelSpin: !off.has("I3") && !!input.ledger?.wheelSpin, thinkAloud, nonAnswer, notYetBefore },
    G: { wordsRel, lowWordsRun: lowWords, nonAnswersK5: nonAnswers.reduce((a, b) => a + b, 0), gradedN, minutes: input.minutes ?? 0, plannedMinutes: input.plannedMinutes ?? prior.plannedMinutes, drift, driftHigh, errDrift },
    rel, pendingE: sess.pendingE, breakOffered: sess.breakOffered, turnsSinceVerify: sess.turnsSinceVerify,
    consolidated: sess.consolidated, skillLast2: input.item?.skillId ? skillLast[input.item.skillId] ?? [] : [],
    clarified: it.clarified, lastVerdict, recentNotYet: it.attempts.slice(-3).filter((a) => a.v === "not_yet").length - (verdict === "not_yet" ? 1 : 0),
    gamingSuspect, selfLabel: !!input.relSignals?.selfLabel, contest: !!input.relSignals?.contest, withdrawal: !!input.relSignals?.withdrawal,
    tiredSaid: !!input.relSignals?.tiredSaid,
    // L6 (consumed): the classify act, or W2-I's self_label predicate. Read as an input name, never emitted.
    ownWordsNeg: input.cls?.signals?.act === "frustration_words" || !!input.relSignals?.selfLabel,
  };
  const d = derive({ ...F, safetyHold: hold });
  const consolidated = d.consolidate && input.item?.skillId ? { ...sess.consolidated, [input.item.skillId]: (sess.consolidated[input.item.skillId] ?? 0) + 1 } : sess.consolidated;
  const next = {
    ...sess,
    answerWords, anchor: anc.anchor, anchorN: anc.anchorN, anchorBuf: anc.anchorBuf,
    item: input.item ? it : sess.item,
    turnsSinceVerify: d.consumedVerify ? 1 : sess.turnsSinceVerify + 1,   // counts the verifying turn itself: next allowed 4 turns later
    consolidated, graded: gradedList, gradedFirst, gradedN, skillLast, rel,
    breakOffered: d.breakOffered, pendingE: d.pendingE, driftBuf, driftHigh, nonAnswers, lowWords, answerAsks, childTurns, langCounts,
    safetyHold: hold ? sess.safetyHold - 1 : 0,
  };
  return { frame: d.frame, next };
}

/** An explicit "ruko / sochne do / let me think" (not merely a trailing connective) counts without a held fragment. */
const THINK_EXPLICIT = (L) => L.toks.some((t) => ["ruko", "sochne", "soch", "think", "minute", "second", "wait", "रुको", "सोचने"].includes(t));

/** G4: error rate over the last 6 difficulty-matched graded items minus the first 6 (needs ≥ 12 graded). */
function errorDrift(first, list, n) {
  if (n < 12) return null;
  const matched = (xs) => xs.filter((g) => g.bt == null || Math.abs(g.bt) <= 1);
  const a = matched(first), b = matched(list.slice(-6));
  if (a.length < 4 || b.length < 4) return null;
  const err = (xs) => xs.filter((g) => g.y === 0).length / xs.length;
  return Math.round((err(b) - err(a)) * 1000) / 1000;
}
