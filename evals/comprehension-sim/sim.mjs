// One simulated child through five multi-topic sessions, driven by the REAL engine (server/comprehension/*: fusion,
// ladder, scheduler with test-load budget, weave queue, re-teach selector) or by a control policy. The engine sees
// only events; the child's truth stays here. Returns per-concept state trajectories and per-session load.
import { newLearnerState, fuseEvidence } from "../../server/comprehension/fuse.js";
import { beliefFor } from "../../server/comprehension/state.js";
import { nextProbe, noteOutcome, markAsked, openSession } from "../../server/comprehension/schedule.js";
import { newProbeSession, recordTurn, fits, sessionWeight, lexiconHit, deferenceDiscountOn } from "../../server/comprehension/budget.js";
import { enqueue, onTopicPlanned, expire, planChecks, consumeExpired, markDone, wovenEvent } from "../../server/comprehension/weave.js";
import { selectReteach, reteachTrigger, armsFromKit } from "../../server/comprehension/reteach.js";
import { shapeById } from "../../server/comprehension/probes/shapes.js";
import { isPartial } from "../../server/comprehension/facets.js";
import { bandOf } from "../../server/comprehension/params.js";
import { ktView, rank, DELAY_MS } from "../../server/learner/kt/ledger.js";
import { outcomeIndex, outcomeName } from "../../server/learner/kt/outcomes.js";
import { concepts as loadConcepts, SESSIONS, sessionStart, hostCandidates, KIT_INPUTS, codeMatchable } from "./world.mjs";
import { LIVE_PROBE_SHAPES } from "../../server/director/state.js";
import { kitInputsOf } from "../../server/learner/live.js";
import { expectedState, truthType } from "./personas.mjs";
import { rng, itemAnswer, probeAnswer, voiceCues, choiceAnswer, agreesWithTrue } from "./child.mjs";

/** Policies: the spec engine, its ablations, and the controls that must fail (§8.3). */
export const POLICIES = Object.freeze({
  engine: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true, e9: true },
  engine_no_e9: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true },
  no_delayed: { probes: true, delayed: false, games: true, voice: true, rule: "ladder", reteach: true, e9: true },
  no_game: { probes: true, delayed: true, games: false, voice: true, rule: "ladder", reteach: true, e9: true },
  no_voice: { probes: true, delayed: true, games: true, voice: false, rule: "ladder", reteach: true, e9: true },
  engine_T07: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true, th: { T_UNDERSTOOD: 0.7 }, e9: true },
  freeze_low: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true, freezeLow: true, e9: true },
  // mutants (§8.3): each must FAIL CE-M3, or the battery cannot see the bug it stands for
  mut_vc2_partial_as_full: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true, e9: true, vc2: true },
  // VC4 with the rank-exploit game volume (X7): at 2 commits per fresh topic the battery could not see full-weight game
  // evidence (review open item); a child replaying the trap level yields 6 commits at ~80% wins
  mut_vc4_game_full_weight: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true, e9: true, vc4: true, gameRounds: 6, exploit: true },
  // the same exploit volume at the correct weight (×0.5, ≤ fragile): the control VC4 is compared against
  engine_game_exploit: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true, e9: true, gameRounds: 6, exploit: true },
  // The DEPLOYED configuration (W1-C #4; comprehension audit G3): the live probe subset (director/state.js
  // LIVE_PROBE_SHAPES), the kit fields the real kits carry (learner/live.js kitInputsOf over data/kits), the kit's
  // predict / transfer / error-spot items graded the way production grades them (code only when the classifier can
  // match the key; otherwise llm with no span: E6 gives a positive nothing), no woven host items (the hosting seam is a
  // no-op), and the held why / teach-back verdict settling by the settle-latency model (later.js): settled → folded
  // now; not settled → folded on the classifier's label with no span, then the verdict lands as a `late` correction.
  live: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true, e9: true, live: true, settle: "w1c" },
  // production before W1-C: an unsettled verdict was simply lost (no wait, no correction)
  live_presettle: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true, e9: true, live: true, settle: "none" },
  // X1 oracle-prober: every shape, every kit field, and a grader that returns the TRUE label — the ceiling the engine's
  // ladder reaches on this simulator; every other row is also reported as a fraction of it
  oracle: { probes: true, delayed: true, games: true, voice: true, rule: "ladder", reteach: true, e9: true, perfect: true },
  // X7 gamer / rank-exploit control: a tutor that farms game wins (the child replays the trap level until it passes,
  // so ~80% of commits are wins whatever the child knows) instead of items and probes. Must fail at least one bar.
  gamer: { probes: false, delayed: true, games: true, rule: "ladder", reteach: false, gamer: true },
  quiz_bot: { quiz: true, delayed: true, rule: "konly" },
  samjha: { samjha: true, delayed: true, rule: "konly" },
  lecture: { lecture: true, delayed: true, rule: "ladder" },
  why_every_turn: { whyEvery: true, delayed: true, games: false, rule: "ladder" },
});

/** K-only mastery rule (the quiz-bot control): understood iff pL ≥ 0.95 and a delayed first-attempt success seen. */
function kOnlyState(b, delayedOk) {
  if (!b) return "not_yet";
  const does = b.pL >= 0.6;
  return !does ? "not_yet" : b.pL >= 0.95 && delayedOk ? "understood" : "fragile";
}

/**
 * Truth families (STUDENT-SIM SIM2: a conclusion counts only if it holds under both).
 * - `bkt2`: the hidden K/U/T bits are fixed per concept and every answer reads them (matched to the engine's two-state
 *   view: an UPPER BOUND).
 * - `cfrag` (cfrag-lite, the stress family): each facet is a continuous strength m ∈ [0, 1] (bit 1 → U[0.65, 0.95],
 *   bit 0 → U[0.05, 0.40]); every answer samples its own realisation (strategy mixture: a child who "has it" still
 *   uses the surface heuristic sometimes); forgetting is partial (m × 0.35 by the next session, not to zero); the
 *   truth type uses m ≥ 0.6 (STUDENT-SIM R2b's "unknown" line); and a re-teach raises the child's WEAKEST facet by
 *   (1 − m)·gain whatever trigger the engine named, so the child's gain never depends on the engine's own diagnosis
 *   label (in bkt2 it does: U can only flip under u_low / misconception triggers). Not the full evals/sim cfrag
 *   (no 4PL, no surface-novelty γ per item); labelled cfrag-lite in every result file.
 */
export const FAMILIES = Object.freeze(["bkt2", "cfrag"]);
const STRENGTH = { hi: [0.65, 0.95], lo: [0.05, 0.40], cut: 0.6, forget: 0.35 };

/**
 * Settle-latency model for the held why / teach-back verdict (later.js; W1-C #2) [U until production measures it]: the
 * blind grade's latency is lognormal around GRADE_MEDIAN_MS; the next turn arrives after the reply is heard and the
 * child answers (a base, more for a hesitant child, plus jitter); awaitSettled then waits up to 600 ms. The verdict
 * settles iff latency ≤ gap + wait. Override the median with SIM_GRADE_MEDIAN_MS.
 */
export const SETTLE = Object.freeze({ gradeMedianMs: Number(process.env.SIM_GRADE_MEDIAN_MS ?? 2500), gradeSigma: 0.5,
  gapBaseMs: 2500, gapHesitationMs: 4000, gapJitterMs: 3000, waitMs: 600 });
function settles(P, r) {
  const z = Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r());
  const latency = SETTLE.gradeMedianMs * Math.exp(SETTLE.gradeSigma * z);
  return latency <= SETTLE.gapBaseMs + P.hesitation * SETTLE.gapHesitationMs + r() * SETTLE.gapJitterMs + SETTLE.waitMs;
}
/** Kit item kind → the evidence class production emits for it (director/items.js PROBE_FOR_KIND → kt/adapter.js). */
const KIT_KIND_CLASS = Object.freeze({ predict: "probe.predict", near_transfer: "probe.transfer.near", far_transfer: "probe.transfer.far", error_spot: "probe.errorspot" });

export async function runChild({ persona: P, seed, policy: polName, llm = null, family = "bkt2" }) {
  if (!FAMILIES.includes(family)) throw new Error(`sim: unknown truth family ${family}`);
  const cf = family === "cfrag";
  const pol = POLICIES[polName];
  const r = rng(`${P.id}:${seed}:${polName}`);
  const cs = loadConcepts();
  const bySkill = Object.fromEntries(cs.map((c) => [c.skillId, c]));
  const rt = rng(`${P.id}:${seed}:truth`);                                // truth draws do not depend on the policy
  const strength = (bit) => { const [a, b] = bit ? STRENGTH.hi : STRENGTH.lo; return a + (b - a) * rt(); };
  const truth = Object.fromEntries(cs.map((c, i) => { const b = { ...P.truth(i) }; return [c.skillId, cf ? { ...b, mK: strength(b.K), mU: strength(b.U), mT: strength(b.T) } : b]; }));
  /** The truth bits a metric scores against (cfrag: m ≥ 0.6). */
  const bitsOf = (t) => (cf ? { ...t, K: +(t.mK >= STRENGTH.cut), U: +(t.mU >= STRENGTH.cut), T: +(t.mT >= STRENGTH.cut) } : t);
  const info = Object.fromEntries(cs.map((c) => [c.skillId, { cooldown: 0, learnedSession: null, refreshed: -1, delayedOk: false, uProbes: 0, nearFail: false, attempts: [], states: [], probes: 0, firstSeen: null }]));
  const childId = `${P.id}-${seed}`;
  let S = newLearnerState({ childId, classLevel: P.classLevel });
  let seq = 0, q = [];
  const band = bandOf(P.classLevel);
  const load = [];
  const counters = { probeTurns: 0, mandatory: 0, lexicon: 0, repeats: 0, events: 0, reteach: 0, wovenHosted: 0, callbacks: 0, perCS: {}, held: 0, settled: 0, late: 0, kitItems: 0, kitCode: 0 };
  let lateQ = [];                                                          // live: verdicts that land after their event folded
  const posteriors = {};
  const shapesBySession = [];                                              // [si][skillId] = shape ids asked

  for (let si = 0; si < SESSIONS.length; si++) {
    const plan = SESSIONS[si];
    const now = sessionStart(si);
    const sessionId = `${childId}-s${si}`;
    const sessionSeen = new Set();
    let ep = 0;
    const base = () => ({ id: `${sessionId}-e${++seq}`, seq, sessionId, sessionStartAt: now, at: now, episodeId: `${sessionId}-ep${++ep}`, itemKey: `k${seq}`, graderVersion: "sim", topicType: "T3" });
    const eff = (k) => {                                                   // effective truth: forgetting by the next session
      const t = truth[k], inf = info[k];
      const forgot = !t.keep && inf.learnedSession !== null && inf.learnedSession < si && inf.refreshed < si;
      if (cf) { const f = forgot ? STRENGTH.forget : 1; return { ...t, K: +(r() < t.mK * f), U: +(r() < t.mU * f), T: +(r() < t.mT * f) }; }
      if (forgot) return { ...t, K: 0, U: 0, T: 0 };
      return t;
    };
    const belief = (k) => beliefFor(k, { ...S, now, th: pol.th });
    const fuse = (ev) => {
      S = fuseEvidence(S, [ev], {});
      counters.events++;
      const k = ev.target ?? ev.skillIds[0];
      const b = belief(k);
      if (pol.delayed && b && rank(b.display) >= rank("learned_today") && !q.some((e) => e.skillId === k && e.kind === "woven")) {
        q = enqueue(q, { childId, skillId: k, anchorAt: S.ledger.skills[k].anchorAt ?? now, dueAt: S.ledger.skills[k].nextReviewAt, hostCandidates: hostCandidates(cs, bySkill[k]) });
      }
      if (b && info[k].learnedSession === null && rank(b.display) >= rank("learned_today")) info[k].learnedSession = si;
      return b;
    };
    // live: a verdict that landed late is folded as its correction event before the next answer (later.js lateEvent)
    const flushLate = () => {
      for (const ev of lateQ) { fuse({ ...ev, id: `${ev.id}:late`, seq: ++seq, via: "late" }); counters.late++; }
      lateQ = [];
    };
    // novelty across days (§3.4): yesterday's shapes per skill, when the previous session was the day before
    const yesterday = si > 0 && SESSIONS[si].day - SESSIONS[si - 1].day === 1 ? shapesBySession[si - 1] ?? {} : {};
    let sess = newProbeSession({ sessionId, band, lessonSeed: `${seed}:${sessionId}`, yesterday, targets: plan.topics.map((id) => cs.find((c) => c.id === id).skillId) });
    const turn = (t) => { sess = recordTurn(sess, t); };
    const teach = (k, reteach = false) => {
      fuse({ ...base(), skillIds: [k], cls: "item.open", outcome: 0, grader: "code", teach: true });
      turn({ kind: "teach", skillId: k, reteach });
      info[k].refreshed = si;
      sessionSeen.add(k);
    };
    const skillsMap = (current) => {
      const out = {};
      for (const k of new Set([...sessionSeen, current].filter(Boolean))) {
        const b = belief(k);
        if (!b) continue;
        const sk = S.ledger.skills[k];
        out[k] = { belief: b, topicType: bySkill[k].topicType, kitInputs: pol.live ? kitInputsOf(bySkill[k].kit, k) : KIT_INPUTS, delayDays: sk.learnedAt ? (Date.parse(now) - Date.parse(sk.learnedAt)) / 86_400_000 : 0 };
      }
      return out;
    };

    // ---- serve one probe plan ----
    let lastChar = null;                                                   // E9: the character statement this probe made
    const serve = async (pl) => {
      const shape = shapeById(pl.shapeId);
      const puppet = !!shape.planted || shape.id === "C08";
      const dd = puppet && !!pol.e9 && deferenceDiscountOn(sess);           // from held choice data BEFORE this event
      const k = pl.skillId, c = bySkill[k], t = eff(k);
      const mis = c.misconceptions[0]?.id;
      sessionSeen.add(k);
      if (pl.reason === "delayed_check" || shape.delayed) {
        // C31 / C32 / C33: the original class with Δt (an item, or a short teach-back headline)
        if (shape.emits === "item.open") {
          const a = itemAnswer(P, t, "std", r);
          const ev = { ...base(), skillIds: [k], cls: "item.open", outcome: outcomeIndex("item.open", a.o), grader: "code", shapeId: shape.id, via: shape.via === "dialogue" ? "callback" : shape.via, form: "produce" };
          fuse(ev); if (si > 0 && info[k].learnedSession !== null && info[k].learnedSession < si && a.o === "C0") info[k].delayedOk = true;
          counters.callbacks++;
          return ev;
        }
      }
      if (shape.pre) {
        const k2 = Number(shape.pre.slice(-1));
        const a = choiceAnswer(P, t, k2, r);
        fuse({ ...base(), skillIds: [k], cls: shape.pre, outcome: outcomeIndex(shape.pre, a.o), grader: "code", shapeId: shape.id, ...(a.mis && mis ? { misconceptionId: mis } : {}), ...(mis ? { discriminates: mis } : {}) });
      }
      let a;
      if (shape.id === "C08" && pol.e9 && r() < 0.5) {
        // half the puppet's statements are TRUE (E9 needs the yes-rate on both): agreeing is the right answer
        const agreed = agreesWithTrue(P, t, r);
        a = { outcome: outcomeIndex(shape.emits, agreed ? "first_correct" : "wrong"), grader: "code" };
        lastChar = { planted: false, agreed };
      } else {
        a = await probeAnswer(P, t, c, shape, r, llm, { game: shape.via === "game", perfect: !!pol.perfect });
        if (puppet && a.outcome != null && a.outcome >= 0) lastChar = { planted: true, agreed: ["missed", "wrong"].includes(outcomeName(shape.emits, a.outcome)) };
      }
      if (a.outcome === null || a.outcome === undefined || a.outcome < 0) return null;                    // NA: no update
      if (pol.vc2 && isPartial(shape.emits, a.outcome)) a = { ...a, outcome: 0 };   // VC2: partial scored as full (index 0 = full / high)
      const name = outcomeName(shape.emits, a.outcome);
      const misHit = a.mis && mis && ["misconception", "mapped_wrong", "wrong"].includes(name);
      const ev = { ...base(), skillIds: [k], cls: shape.emits, outcome: a.outcome, grader: a.grader, shapeId: shape.id, via: shape.via, spanOk: a.spanOk, ...(dd ? { deferenceDiscount: true } : {}),
        ...(misHit ? { misconceptionId: mis } : {}), ...(!misHit && mis && shape.verifier ? { discriminates: mis } : {}) };
      if (pol.live && (shape.emits === "probe.why" || shape.emits === "probe.teachback") && ev.grader === "llm") {
        counters.held++;
        if (settles(P, r)) { counters.settled++; fuse(ev); }
        else { fuse({ ...ev, spanOk: false }); if (pol.settle === "w1c") lateQ.push(ev); }
      } else fuse(ev);
      if (shape.facets.includes("U")) info[k].uProbes++;
      if (shape.emits === "probe.transfer.near" && name === "fail") info[k].nearFail = true;
      info[k].probes++;
      return ev;
    };
    const askProbe = async (current, voice) => {
      if (!pol.probes) return false;
      flushLate();
      const pl = nextProbe(skillsMap(current), sess, { currentSkill: current, voice: pol.voice ? voice : undefined, freezeLow: !!pol.freezeLow, ...(pol.live ? { allow: LIVE_PROBE_SHAPES } : {}) });
      if (!pl) return false;
      if (!pol.delayed && pl.reason === "delayed_check") { sess = { ...sess, pending: sess.pending.filter((x) => x.reason !== "delayed_check") }; return false; }
      const ev = await serve(pl);
      const b = belief(pl.skillId);
      sess = markAsked(sess, pl, b);
      turn({ kind: "probe", weight: pl.testWeight, shapeId: pl.shapeId, skillId: pl.skillId, facet: pl.facet, family: pl.family, cls: pl.cls, longForm: pl.longForm, mandatory: pl.mandatory, charStatement: lastChar });
      lastChar = null;
      if ((sess.yesterday?.[pl.skillId] ?? []).includes(pl.shapeId)) counters.repeats++;   // CE-M5: same shape, same skill, consecutive days
      ((shapesBySession[si] ??= {})[pl.skillId] ??= []).push(pl.shapeId);
      counters.probeTurns++; if (pl.mandatory) counters.mandatory++;
      { const key = `${si}:${pl.skillId}`; const pc = (counters.perCS[key] ??= { n: 0, u: 0, mand: 0, reasons: {} }); pc.n++; if (pl.facet === "U") pc.u++; if (pl.mandatory) pc.mand++; pc.reasons[pl.reason] = (pc.reasons[pl.reason] ?? 0) + 1; }
      if (ev) sess = noteOutcome(sess, ev, b);
      if (pl.reason === "delayed_check") q = q.map((e) => (e.skillId === pl.skillId && e.status === "expired" ? { ...e, status: "done" } : e));
      return true;
    };
    const item = async (k, kind, { woven } = {}) => {
      flushLate();
      const t = eff(k), c = bySkill[k], mis = c.misconceptions[0]?.id;
      const a = itemAnswer(P, t, kind, r);
      const seek = P.answerSeek && r() < P.answerSeek;
      const ev = { ...base(), skillIds: [k], cls: "item.open", outcome: outcomeIndex("item.open", a.o), grader: "code", form: "produce", ...(seek ? { preAttemptHelp: true, entryRung: 2 } : {}),
        ...(kind === "disc" && mis ? { discriminates: mis } : {}), ...(a.mis && mis ? { misconceptionId: mis } : {}), ...(kind === "coinc" ? { coincident: true } : {}) };
      const b = fuse(ev);
      const inf = info[k];
      if (inf.cooldown > 0) {
        inf.cooldown--;
        const open = inf.attempts.find((x) => x.outcome === null);
        if (open) {
          open.outcome = a.o === "C0" && !(kind === "disc" && a.mis) ? "repaired_now" : "failed";
          const p0 = posteriors[open.armId] ?? { a: 1, b: 1 }, rw = open.outcome === "repaired_now" ? 0.3 : 0;
          posteriors[open.armId] = { a: p0.a + rw, b: p0.b + 1 - rw };
        }
      }
      // the K-only control's delayed check: the first item on the concept in a LATER session than its first teaching, before any re-teach
      if (si > info[k].firstSeen && !sess.perSkill[k]?.practised && info[k].refreshed < si) { if (a.o === "C0") info[k].delayedOk = true; }
      turn({ kind: "item", weight: fits(sess, 1.0) ? 1.0 : 0.25, skillId: k });
      sess = noteOutcome(sess, ev, b);
      if (woven) {
        // ONE event on the earlier skill (E7), graded by R-KEY on the sub-step alone
        const tw = eff(woven.skillId);
        const aw = itemAnswer(P, tw, "std", r);
        const wev = wovenEvent(base(), { skillId: woven.skillId, host: k, correct: aw.o === "C0" });
        fuse(wev);
        if (info[woven.skillId].learnedSession !== null && info[woven.skillId].learnedSession < si && aw.o === "C0") info[woven.skillId].delayedOk = true;
        q = markDone(q, woven.skillId);
        counters.wovenHosted++;
      }
      return { b, correct: a.o === "C0", lucky: a.o === "C0" && !t.K };
    };
    // live: one of the kit's own predict / transfer / error-spot items, graded the way the classifier grades it in
    // production — code when the key can be matched, else llm with no span (E6: a positive carries no U/T)
    const kitItem = async (k, kind) => {
      flushLate();
      const c = bySkill[k], it = c.kit.items.find((i) => i.kind === kind), cls = KIT_KIND_CLASS[kind];
      if (!it || !cls) return null;
      const code = codeMatchable(it), mis = c.misconceptions[0]?.id;
      const t = eff(k);
      const a = await probeAnswer(P, t, c, { id: "KIT", emits: cls, op: "R-KEY", via: "dialogue", facets: [] }, r, null);
      if (a.outcome == null || a.outcome < 0) return null;
      const ev = { ...base(), skillIds: [k], cls, outcome: a.outcome, grader: code ? "code" : "llm", ...(code ? {} : { spanOk: false }), via: "dialogue", target: k,
        ...(a.mis && mis ? { misconceptionId: mis } : {}) };
      const b = fuse(ev);
      counters.kitItems++; if (code) counters.kitCode++;
      if (cls === "probe.transfer.near" && outcomeName(cls, a.outcome) === "fail") info[k].nearFail = true;
      turn({ kind: "item", weight: fits(sess, 1.0) ? 1.0 : 0.25, skillId: k });
      sess = noteOutcome(sess, ev, b);
      const correct = ["right", "pass", "caught_fixed"].includes(outcomeName(cls, a.outcome));
      return { b, correct, lucky: correct && !t.K };
    };
    // a game round (Forge module, C35): host-graded; `exploit` = the child replays the level until it passes (~80% wins)
    const gameRound = async (k, exploit) => {
      const shape = shapeById("C35"), c = bySkill[k], mis = c.misconceptions[0]?.id;
      let a = await probeAnswer(P, eff(k), c, shape, r, null, { game: true });
      if (exploit && r() < 0.8) a = { ...a, outcome: outcomeIndex(shape.emits, "right"), mis: false };
      fuse({ ...base(), skillIds: [k], cls: shape.emits, outcome: a.outcome, grader: "code", shapeId: "C35", via: pol.vc4 ? "dialogue" : "game", ...(a.mis && mis ? { misconceptionId: mis } : {}) });
      turn({ kind: "play", weight: 0.25, skillId: k });
    };
    const reteach = (k) => {
      if (!pol.reteach) return;
      const b = belief(k), inf = info[k];
      if (inf.cooldown > 0) return;                                        // the re-check after a re-teach comes first (§5.4)
      const trig = reteachTrigger(b, { uProbes: inf.uProbes, wheelSpin: ktView(S.ledger, { now }).wheelSpin(k), nearTransferFailed: inf.nearFail });
      if (!trig) return;
      const c = bySkill[k];
      const kitArms = c.misconceptions.flatMap((m) => armsFromKit({ id: m.id, remediation: [{ repClass: "pictorial", representationId: "chart" }, { repClass: "concrete", representationId: "objects" }, { repClass: "story", representationId: "story" }] }));
      const d = selectReteach({ trigger: trig, skillId: k, misId: c.misconceptions[0]?.id, kitArms, attempts: inf.attempts, band, seed: `${seed}:${k}:${si}`, posteriors,
        lessonArmsUsed: inf.attempts.filter((a) => a.session === si).map((a) => a.armId), failedArmsThisSession: inf.attempts.filter((a) => a.session === si && a.outcome === "failed").map((a) => a.armId),
        pL: b.pL, hindiObserved: P.lang !== "en", now });
      if (d.move !== "reteach" && d.move !== "recap") return;
      counters.reteach++;
      teach(k, true);
      const t = truth[k];
      // the arm's effect on the hidden truth (a different representation can make the idea click)
      if (trig === "misconception_confirmed" && t.mis && r() < P.misFix) { t.mis = 0; }
      if (cf) {
        const f = [["mK", P.kLearn], ["mU", t.mis ? 0 : P.uLearn], ["mT", P.tLearn]].sort((a, b) => t[a[0]] - t[b[0]])[0];
        t[f[0]] += (1 - t[f[0]]) * f[1];
      } else {
      if (!t.K && r() < P.kLearn) t.K = 1;
      if (t.K && !t.U && !t.mis && (trig === "u_low_after_practice" || trig === "misconception_confirmed") && r() < P.uLearn) t.U = 1;
      if (t.U && !t.T && trig === "transfer_fail" && r() < P.tLearn) t.T = 1;
      }
      inf.attempts.push({ skillId: k, misId: d.misId, armId: d.armId, repClass: d.repClass, session: si, at: now, outcome: null });
      inf.uProbes = 0; inf.nearFail = false; inf.cooldown = 2;
    };

    // ---- session open: delayed checks (openers) from due skills + expired weave entries ----
    if (pol.delayed) {
      q = expire(q, now);
      const kv = ktView(S.ledger, { now });
      const dueSet = new Set(kv.due(6));
      for (const [k, sk] of Object.entries(S.ledger.skills)) {
        if (rank(sk.display) >= rank("learned_today") && !sk.flags.delayed && sk.anchorAt && Date.parse(now) - Date.parse(sk.anchorAt) >= DELAY_MS) dueSet.add(k);
      }
      const due = [...dueSet].map((k) => ({ skillId: k, retention: kv.skill(k).retention }));
      const pc = planChecks({ q, due, now, openers: { B1: 2, B2: 3, B3: 4, B4: 4 }[band] });
      if (process.env.SIM_DEBUG) console.log("S", si, "due", JSON.stringify(due), "openers", pc.openers);
      q = consumeExpired(q, pc.consumed);
      if (pol.probes) {
        for (const k of pc.openers) sessionSeen.add(k);
        sess = openSession(sess, pc.openers);
        for (let w = 0; w < 4 && sess.pending.some((x) => x.reason === "delayed_check"); w++) {
          const pl = nextProbe(skillsMap(null), sess, {});
          if (!pl || pl.reason !== "delayed_check") { break; }
          await askProbe(null, {});
          turn({ kind: "chat" });
        }
        sess = { ...sess, pending: sess.pending.filter((x) => x.reason !== "delayed_check") };
      } else {
        // controls: the first item on each due skill is their (overt) delayed check
        for (const k of pc.openers) { await item(k, "std"); turn({ kind: "chat" }); }
      }
    }

    // ---- topics ----
    for (const cid of plan.topics) {
      const c = cs.find((x) => x.id === cid), k = c.skillId;
      if (info[k].firstSeen === null) info[k].firstSeen = si;
      let hosted = [];
      // live: the weave queue is planned and persisted, but a hosted sub-step has no host item (forgeSeam.wovenSubStep
      // is a no-op in production), so nothing is woven; entries expire into C31 callbacks
      if (pol.delayed) { const res = onTopicPlanned(q, [k], now); q = res.q; hosted = pol.live ? [] : res.hosted; }
      const fresh = plan.fresh.includes(cid);
      if (fresh || belief(k)?.refresh) teach(k);
      else sessionSeen.add(k);
      if (pol.samjha) { turn({ kind: "probe", weight: 1.0, skillId: k }); if (lexiconHit("Samjha? Did you understand?")) counters.lexicon++; }
      const nItems = pol.quiz ? 4 : fresh ? 6 : 4;
      if (pol.gamer) {                                                           // the rank-exploit tutor: game wins instead of items
        for (let j = 0; j < nItems; j++) { await gameRound(k, true); await gameRound(k, true); turn({ kind: "teach", skillId: k }); }
        continue;
      }
      const kinds = ["std", "disc", "std", "coinc", "std", "disc"];
      for (let j = 0; j < nItems; j++) {
        if (pol.quiz && (j === 1 || j === 2)) {                                    // the quiz-bot's mcq4 items
          const a = choiceAnswer(P, eff(k), 4, r);
          const ev = { ...base(), skillIds: [k], cls: "item.mcq4", outcome: outcomeIndex("item.mcq4", a.o), grader: "code" };
          fuse(ev); turn({ kind: "item", weight: 1.0, skillId: k });
          continue;
        }
        // live: the kit's predict / transfer / error-spot items take some practice slots, as the Director's practice
        // phase serves them (director/items.js KIND_ORDER), graded the production way (kitItem)
        const kitKind = pol.live ? (fresh ? { 1: "predict", 3: "near_transfer", 4: "error_spot" }[j] : { 1: "near_transfer" }[j]) : null;
        const res = (kitKind && await kitItem(k, kitKind)) || await item(k, kinds[j % kinds.length], { woven: j === 0 ? hosted[0] : null });
        if (pol.whyEvery) {
          await serve({ skillId: k, shapeId: "C06", facet: "U", reason: "voi" });
          turn({ kind: "probe", weight: 1.0, skillId: k });
          if (j > 0) counters.repeats++;
        }
        if (pol.probes) await askProbe(k, voiceCues(P, res.correct, r, { lucky: res.lucky }));
        turn({ kind: "teach", skillId: k });
        reteach(k);
        // a game round mid-topic (Forge module): two commits on the misconception-trap level, host-graded, w = 0.5
        if (pol.games && j === 2 && fresh) for (let g = 0; g < (pol.gameRounds ?? 2); g++) await gameRound(k, !!pol.exploit);
      }
    }

    flushLate();                                                           // lesson end: flushHeld folds what is still held
    if (process.env.SIM_DEBUG) for (const c of cs) { const b = belief(c.skillId); if (b) console.log(`  s${si} ${c.id} ${b.state}/${b.reason} pL ${b.pL.toFixed(2)} U ${b.U.toFixed(2)} T ${b.T.toFixed(2)} ${b.display} M* ${b.misconception.mStar.toFixed(2)} v=${b.misconception.verified} truth ${JSON.stringify(truth[c.skillId])}`); }
    // ---- end of session: record every seen concept's state vs its truth ----
    for (const c of cs) {
      const k = c.skillId;
      if (info[k].firstSeen === null) continue;
      const b = belief(k);
      const st = pol.rule === "konly" ? kOnlyState(b, info[k].delayedOk) : b?.state ?? "not_yet";
      const t = bitsOf(truth[k]);
      info[k].states.push({ session: si, state: st, expected: expectedState(t).exact, ok: expectedState(t).ok.includes(st), type: truthType(t) });
    }
    load.push({ session: si, childTurns: sess.childTurns, weight: sessionWeight(sess), per10: sess.childTurns ? (10 * sessionWeight(sess)) / sess.childTurns : 0,
      cap: { B1: 6, B2: 8, B3: 12.5, B4: 15 }[band], probeTurns: sess.probes });
  }
  return { persona: P.id, archetype: P.archetype, verbal: P.verbal, seed, policy: polName, band, load, counters,
    family, concepts: cs.map((c) => ({ conceptId: c.id, skillId: c.skillId, finalTruth: bitsOf(truth[c.skillId]), ...info[c.skillId], attempts: undefined })) };
}
