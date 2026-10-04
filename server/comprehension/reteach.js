// Re-teach selector (COMPREHENSION-ENGINE.md §5, CE9): chosen from THIS child's history of knowledge (failed
// representation classes, representation fluency, CPA position, prior level), never from a "learning style".
// Deterministic given state and seed. Voice and vibe never trigger a re-teach; a voice tie-break may only ORDER the
// two options of a step-8 pick (lighter first). Pure.
import { u01 } from "./schedule.js";
import { TH } from "./params.js";

export const REP_CLASSES = Object.freeze(["concrete", "pictorial", "abstract", "analogy", "counterexample", "worked_example", "story", "game", "language_switch"]);
const CPA_OF = { concrete: "C", game: "C", pictorial: "P", story: "P", analogy: "P", abstract: "A", worked_example: "A", counterexample: "A", language_switch: "A" };
export const EXPLORATION_FLOOR = 0.2;
const DAY = 86_400_000;

/** Generic arms every skill can fall back to (one per CPA rung plus a worked example). */
export const GENERIC_ARMS = Object.freeze([
  { id: "gen:concrete", repClass: "concrete", representationId: "manipulative", cost: 2 },
  { id: "gen:pictorial", repClass: "pictorial", representationId: "diagram", cost: 1 },
  { id: "gen:worked", repClass: "worked_example", representationId: "worked_steps", cost: 1, lowPrior: true },
  { id: "gen:story", repClass: "story", representationId: "story", cost: 1 },
  { id: "gen:hindi", repClass: "language_switch", representationId: "same_in_hindi", cost: 1, needsHindi: true },
]);

/**
 * Kit remediation → ReteachArmSpec[]. Accepts the new array form and the old single-fix form
 * ({ representation, moveShape }), which becomes one primary arm (a single-arm kit never reaches the bandit).
 */
export function armsFromKit(mis) {
  const r = mis?.remediation;
  if (!r) return [];
  if (Array.isArray(r)) return r.map((a, i) => ({ cost: 1, ...a, id: a.id ?? `${mis.id}:arm${i}`, primary: a.primary ?? i === 0, repClass: a.repClass ?? "pictorial" }));
  const text = `${r.representation ?? ""} ${r.moveShape ?? ""}`.toLowerCase();
  const repClass = /chart|diagram|draw|picture|number line|bar|grid|table/.test(text) ? "pictorial" : /slide|block|count|object|hand|fold|cut/.test(text) ? "concrete" : "abstract";
  return [{ id: `${mis.id}:primary`, repClass, representationId: r.representation ?? "kit", primary: true, cost: 1, shape: r.moveShape ?? null }];
}

/**
 * Which trigger (if any) the belief and its history fire (§5.1). Voice/vibe are not inputs (CE8).
 * @param {any} b belief @param {{ uProbes?: number, wheelSpin?: 'none'|'warn'|'confirm', failsPostRung3?: number, nearTransferFailed?: boolean }} h
 */
export function reteachTrigger(b, h = {}) {
  if (!b) return null;
  if (b.misconception?.mStar >= TH.M_CONFIRMED && b.misconception.verified) return "misconception_confirmed";
  if (b.reason === "forgot_not_never") return "delayed_fail";
  if ((h.failsPostRung3 ?? 0) >= 2) return "two_fails_post_rung3";
  if (h.wheelSpin === "confirm") return "wheel_spin";
  const does = b.pL >= TH.K_DO;
  if (does && b.U <= TH.LOW && (h.uProbes ?? 0) >= 2) return "u_low_after_practice";
  if (does && b.T <= TH.LOW && h.nearTransferFailed) return "transfer_fail";
  return null;
}

/** Seeded PRNG + Beta sampling (Marsaglia-Tsang gamma), deterministic per (seed, tag). */
function rng(seed) { let a = Math.floor(seed * 4294967296) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gamma(k, r) {
  if (k < 1) return gamma(k + 1, r) * r() ** (1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do { const u1 = r() || 1e-12, u2 = r(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0);
    v = v ** 3; const u = r();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
const beta = (a, b, r) => { const x = gamma(a, r), y = gamma(b, r); return x / (x + y); };

/**
 * selectReteach (§5.3). Returns a PedagogyDecision-shaped plan.
 * @param {{ trigger: string, skillId: string, misId?: string|null, kitArms?: any[], attempts?: any[], repFluency?: Record<string, number>,
 *   lessonArmsUsed?: string[], failedArmsThisSession?: string[], prereqs?: { skillId: string, pL: number }[], band?: string, hindiObserved?: boolean,
 *   seed?: string, posteriors?: Record<string, { a: number, b: number }>, pL?: number, voiceTie?: boolean, safetyFired?: boolean, now?: string,
 *   timeLeftMin?: number, deviceTier?: 'low'|'mid'|'high' }} c
 */
export function selectReteach(c) {
  if (c.safetyFired || !c.trigger) return { move: "none" };
  const attempts = (c.attempts ?? []).filter((a) => a.skillId === c.skillId).sort((a, b) => (a.at < b.at ? -1 : 1));
  const now = new Date(c.now ?? 0).getTime();
  const base = { skillId: c.skillId, misId: c.misId ?? null, trigger: c.trigger, suppression: true };

  // 1 forgot ≠ never understood (RT9): recap via the arm that resolved it before, plus one retrieval item.
  if (c.trigger === "delayed_fail") {
    const worked = [...attempts].reverse().find((a) => a.outcome === "resolved_now" || a.outcome === "resolved_next" || a.outcome === "resolved_delayed");
    if (worked) return { ...base, move: "recap", armId: worked.armId, representation: worked.representationId, repClass: worked.repClass, retrievalItem: true };
  }
  // 4 two distinct failed arms this session → prerequisite descent; three → park and schedule a spaced re-teach.
  const failedNow = [...new Set(c.failedArmsThisSession ?? [])];
  if (failedNow.length >= 3) return { ...base, move: "park", excludedClasses: excludedClasses(attempts, now), tellConductor: true };
  if (failedNow.length >= 2) {
    const weak = (c.prereqs ?? []).filter((p) => p.pL < 0.5).sort((a, b) => a.pL - b.pL || (a.skillId < b.skillId ? -1 : 1))[0];
    if (weak) return { ...base, move: "prereq_descent", prereqSkillId: weak.skillId };
  }
  // 2 eligible arms
  let E = [...(c.kitArms ?? []), ...GENERIC_ARMS.map((a) => ({ ...a }))];
  E = E.filter((a) => !a.bands || a.bands.includes(c.band));
  E = E.filter((a) => !a.needsHindi || c.hindiObserved);                         // language_switch never first, only if Hindi is observed
  E = E.filter((a) => !(a.lowPrior && (c.pL ?? 0.5) >= 0.7));                    // expertise reversal: worked examples are for low prior
  E = E.filter((a) => !(c.deviceTier === "low" && a.engine));
  E = E.filter((a) => !(a.minMin && (c.timeLeftMin ?? 99) < a.minMin));
  if (attempts.length === 0) E = E.filter((a) => a.repClass !== "language_switch");
  // 3 exclusions
  const used = new Set(c.lessonArmsUsed ?? []);
  const lastTwoFailed = new Set(attempts.slice(-2).filter((a) => a.outcome === "failed").map((a) => a.repClass));
  const twice30 = excludedClasses(attempts, now);
  const before = E;
  E = E.filter((a) => !used.has(a.id) && !lastTwoFailed.has(a.repClass) && !twice30.includes(a.repClass));
  E = E.filter((a) => !(a.representationId && c.repFluency && c.repFluency[a.representationId] !== undefined && c.repFluency[a.representationId] < 0.5) || a.teachesRepresentation);
  const logged = E.length === 0 ? "exclusions_emptied_set" : null;
  if (!E.length) E = before.filter((a) => !used.has(a.id));
  if (!E.length) return { ...base, move: "park", excludedClasses: twice30, tellConductor: true, logged };
  // 5 CPA: after an abstract failure prefer P/C; a transfer fail after a concrete success → fade up.
  const lastFail = [...attempts].reverse().find((a) => a.outcome === "failed");
  if (lastFail && CPA_OF[lastFail.repClass] === "A") { const pc = E.filter((a) => CPA_OF[a.repClass] !== "A"); if (pc.length) E = pc; }
  if (c.trigger === "transfer_fail") { const up = E.filter((a) => CPA_OF[a.repClass] !== "C"); if (up.length) E = up; }
  // 6 the first re-teach of a confirmed misconception → the kit primary arm (deterministic).
  const priorOnMis = attempts.filter((a) => c.misId && a.misId === c.misId).length;
  if (c.trigger === "misconception_confirmed" && priorOnMis === 0) {
    const primary = E.find((a) => a.primary);
    if (primary) return { ...base, move: "reteach", armId: primary.id, representation: primary.representationId, repClass: primary.repClass, chosenBy: "kit_primary", secondContextProbe: false };
  }
  // 7 TS with an exploration floor over population posteriors (no child id in arm_posteriors).
  const seed = u01(c.seed ?? c.skillId, "reteach", c.skillId, attempts.length);
  const r = rng(seed);
  const post = (a) => c.posteriors?.[a.id] ?? { a: 1, b: 1 };
  const mean = (a) => post(a).a / (post(a).a + post(a).b);
  let chosen, chosenBy;
  if (r() < EXPLORATION_FLOOR) { chosen = E[Math.floor(r() * E.length)]; chosenBy = "explore"; }
  else { chosen = E.map((a) => ({ a, s: beta(post(a).a, post(a).b, r) })).sort((x, y) => y.s - x.s || (x.a.id < y.a.id ? -1 : 1))[0].a; chosenBy = "thompson"; }
  // 8 top two within 0.05 expected reward → offer a two-way pick; a voice tie-break may only put the lighter first.
  const byMean = [...E].sort((x, y) => mean(y) - mean(x) || (x.id < y.id ? -1 : 1));
  let offerPick = null;
  if (byMean.length >= 2 && Math.abs(mean(byMean[0]) - mean(byMean[1])) <= 0.05 && (chosen === byMean[0] || chosen === byMean[1])) {
    offerPick = [byMean[0].id, byMean[1].id];
    if (c.voiceTie) offerPick.sort((x, y) => (E.find((a) => a.id === x).cost ?? 1) - (E.find((a) => a.id === y).cost ?? 1));
  }
  return { ...base, move: "reteach", armId: chosen.id, representation: chosen.representationId, repClass: chosen.repClass, chosenBy, offerPick,
    secondContextProbe: c.trigger === "transfer_fail", logged };
}

/** Classes that failed twice on this concept family in 30 days. */
function excludedClasses(attempts, now) {
  const recent = attempts.filter((a) => a.outcome === "failed" && (!now || now - new Date(a.at).getTime() <= 30 * DAY));
  const n = {};
  for (const a of recent) n[a.repClass] = (n[a.repClass] ?? 0) + 1;
  return Object.keys(n).filter((k) => n[k] >= 2).sort();
}

/** Bandit reward (RT7): 0.3·repaired_now + 0.3·resolved_next + 0.4·resolved_delayed; induced bug = 0; contaminated = drop. */
export function armReward({ repairedNow = false, resolvedNext = false, resolvedDelayed = false, inducedBug = false, contaminated = false }) {
  if (contaminated) return null;
  if (inducedBug) return 0;
  return 0.3 * +repairedNow + 0.3 * +resolvedNext + 0.4 * +resolvedDelayed;
}
/** Posterior update with a fractional reward (Beta pseudo-counts). */
export const updatePosterior = (p = { a: 1, b: 1 }, reward) => (reward == null ? p : { a: p.a + reward, b: p.b + (1 - reward) });

// ───────────── engineReteach's in-lesson inputs (W1-C #5; director/state.js, seam-patches/w1c-state-reteach.patch) ─────────────

/** pL assumed for a prerequisite skill the child has never touched [U]: below 0.5, so it is a descent target. */
export const UNSEEN_PREREQ_PL = 0.3;

/**
 * What selectReteach needs from THIS lesson for skill k: the arms that already failed on k (an engine re-teach fires
 * again on k only after its cooldown re-check, with the trigger still holding: the arm tried last on k did not work),
 * and k's prerequisites with their pL (the kit's own prereqSkillIds from the live beliefs, then the cross-topic ones
 * pinned at start). Pure; pair with noteReteach.
 * @param {any} s lesson state @param {string} k skill id @param {any} kit
 * @returns {{ failedArmsThisSession: string[], prereqs: { skillId: string, pL: number }[] }}
 */
export function reteachSessionInputs(s, k, kit) {
  const failed = s.failedArms?.[k] ?? [];
  const last = s.lastArmBySkill?.[k];
  const failedArmsThisSession = last && !failed.includes(last) ? [...failed, last] : failed;
  const within = (kit?.skills?.find((x) => x.id === k)?.prereqSkillIds ?? []).map((p) => ({
    skillId: p, pL: s.comp?.[p]?.belief?.pL ?? s.skills?.[p]?.pL ?? UNSEEN_PREREQ_PL }));
  const cross = s.ctx?.reteach?.prereqs?.[k] ?? [];
  const seen = new Set();
  const prereqs = [...within, ...cross].filter((p) => p?.skillId && p.skillId !== k && !seen.has(p.skillId) && seen.add(p.skillId))
    .map((p) => ({ skillId: p.skillId, pL: Number(p.pL) }));
  return { failedArmsThisSession, prereqs };
}

/** Record the decision in the lesson state: the failed arms on k, and the arm now tried on k. Mutates s (as engineReteach does). */
export function noteReteach(s, k, d, inputs) {
  s.failedArms = { ...(s.failedArms ?? {}), [k]: inputs?.failedArmsThisSession ?? s.failedArms?.[k] ?? [] };
  // what was tried on k now: an arm, or a prerequisite descent (if the trigger still holds after it, that counts as a
  // third failure and the next decision parks the skill); park and none try nothing
  const tried = d?.armId && (d.move === "reteach" || d.move === "recap") ? d.armId : d?.move === "prereq_descent" ? `descent:${d.prereqSkillId}` : null;
  if (d && d.move !== "none") s.lastArmBySkill = { ...(s.lastArmBySkill ?? {}), [k]: tried };
}
