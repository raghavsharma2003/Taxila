// Learner-view exports for Brain (round 7 F item 4): the three things a lesson start and its turns need from the
// learner model, as reads only. Brain consumes them (server/routes/lesson.js, server/director/items.js
// buildPracticeQueue's `theta` and `weak`, the mid-lesson limit wrap of D5); Learning owns how they are computed.
//
//   strandTheta(ledger, subject)            the child's θ on the subject's strand (GE scale), or null with no evidence
//   weakOn(ledger, skillIds, prereqIds)     the weak flag: has the child shown weakness on these skills or their prereqs?
//   minutesLeft({...})                      today's minutes left under the parent's limits, and the planned slot's minutes
//   learnerView({...})                      all three for one lesson start (PURE)
//   learnerViewOf(child, {...})             the same from the DB (one call; never throws: a failed read is "no view")
//
// Everything here is pure except learnerViewOf. θ comes from the KT ledger's ability epochs (kt/ability.js currentTheta,
// the same posterior writer.js persists to kt_ability), so the lesson and the parent report never disagree.

import { thetaView, readSkill } from "./kt/ledger.js";
import { strandOfSkill, subjectOfSkill } from "./kt/ability.js";

/** A strand estimate is used for item selection only once it rests on this many scored observations. */
export const THETA_MIN_OBS = 2;
/** Weak on a skill: at least this many observations and pL under WEAK_PL (director/state.js statusOf uses 3 / 0.4). */
export const WEAK_MIN_N = 3;
export const WEAK_PL = 0.4;
/** Weak on the strand: θ this far (GE) below the start of the child's class, with enough evidence. */
export const WEAK_THETA_BELOW = 1;

/**
 * PURE. The child's θ on a subject's core strand.
 * @param {any} ledger  a KT ledger (kt/ledger.js newLedger / fold)
 * @param {string} subject  e.g. "maths"
 * @returns {{ strand: string, mu: number, sd: number, nObs: number, value: number|null } | null}
 *   `value` is what item selection should use: mu once nObs >= THETA_MIN_OBS, else null (the caller's class default).
 */
export function strandTheta(ledger, subject) {
  if (!ledger?.ability?.[subject]) return null;
  let view;
  try { view = thetaView({ ability: { [subject]: ledger.ability[subject] } })[subject]; } catch { return null; }
  const strand = `${subject}:core`;
  const t = view?.[strand] ?? Object.values(view ?? {})[0];
  if (!t || !Number.isFinite(t.mu)) return null;
  const nObs = Number(t.nObs) || 0;
  return { strand: view?.[strand] ? strand : Object.keys(view)[0], mu: round2(t.mu), sd: round2(t.sd), nObs, value: nObs >= THETA_MIN_OBS ? round2(t.mu) : null };
}

/** PURE. θ for every subject the ledger has an epoch for: { [subject]: strandTheta }. */
export function allThetas(ledger) {
  return Object.fromEntries(Object.keys(ledger?.ability ?? {}).map((s) => [s, strandTheta(ledger, s)]).filter(([, v]) => v));
}

/**
 * PURE. The weak flag items.js buildPracticeQueue reads ("the child has shown weakness on this topic or its
 * prerequisite"): a skill of the topic or of a prerequisite with WEAK_MIN_N+ observations and pL < WEAK_PL, or the
 * strand θ more than WEAK_THETA_BELOW under the start of the class (GE C-1) on enough evidence.
 * @param {any} ledger
 * @param {string[]} skillIds   the topic's kit skills
 * @param {string[]} [prereqSkillIds]  skills of the topic's prerequisites
 * @param {{ classLevel?: number, now?: number|string|Date }} [o]
 * @returns {{ weak: boolean, skills: string[], reasons: ("topic"|"prereq"|"theta")[] }}
 */
export function weakOn(ledger, skillIds = [], prereqSkillIds = [], { classLevel, now = Date.now() } = {}) {
  const t = new Date(now).getTime();
  const weakSkill = (id) => {
    const s = readSkill(ledger?.skills?.[id], t);
    return !!s && (Number(s.n) || 0) >= WEAK_MIN_N && Number(s.pL) < WEAK_PL;
  };
  const own = skillIds.filter(weakSkill);
  const pre = prereqSkillIds.filter((id) => !skillIds.includes(id)).filter(weakSkill);
  const reasons = [];
  if (own.length) reasons.push("topic");
  if (pre.length) reasons.push("prereq");
  const subject = skillIds.length ? subjectOfSkill(skillIds[0]) : null;
  const th = subject ? strandTheta(ledger, subject) : null;
  if (classLevel && th?.value != null && th.value < classLevel - 1 - WEAK_THETA_BELOW) reasons.push("theta");
  return { weak: reasons.length > 0, skills: [...own, ...pre].sort(), reasons };
}

const hhmmMin = (s) => { const m = /^(\d\d):(\d\d)$/.exec(String(s ?? "")); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };

/**
 * PURE. Minutes left today, for the lesson start and the mid-lesson wrap (D5: at a parent limit she finishes the
 * current question, then wraps). With limits off (the parent has not opted in) `today` is null: no limit applies.
 * @param {{ limitsOn: boolean, capMin: number, usedMin: number, to?: string|null, localNow?: string|null,
 *   openUntil?: string|null, slotTargetMin?: number|null, now?: number|string|Date }} x
 *   `to` the lesson-hours end (HH:MM, the child's tz); `localNow` HH:MM in the child's tz (conductor/clock.js localTime)
 * @returns {{ limitsOn: boolean, today: number|null, slot: number|null, by: "cap"|"hours"|null, deadlineAt: string|null }}
 */
export function minutesLeft({ limitsOn, capMin, usedMin, to = null, localNow = null, openUntil = null, slotTargetMin = null, now = Date.now() }) {
  const slot = Number.isFinite(Number(slotTargetMin)) && Number(slotTargetMin) > 0 ? Math.round(Number(slotTargetMin)) : null;
  if (!limitsOn) return { limitsOn: false, today: null, slot, by: null, deadlineAt: null };
  const cap = Math.max(0, round1((Number(capMin) || 0) - (Number(usedMin) || 0)));
  let hours = null;
  const end = hhmmMin(to), cur = hhmmMin(localNow);
  // "Open now for 1 hour" (parent) lifts the hours window until openUntil; the daily cap still holds.
  const openMin = openUntil ? Math.max(0, (Date.parse(openUntil) - new Date(now).getTime()) / 60000) : null;
  if (end != null && cur != null) hours = Math.max(0, end - cur, openMin ?? 0);
  const today = hours == null ? cap : Math.min(cap, round1(hours));
  const by = hours != null && hours < cap ? "hours" : "cap";
  return { limitsOn: true, today, slot, by, deadlineAt: new Date(new Date(now).getTime() + today * 60000).toISOString() };
}

/**
 * PURE. Everything Brain reads from the learner model at a lesson start.
 * @param {{ ledger: any, topicId: string, classLevel: number, skillIds: string[], prereqSkillIds?: string[],
 *   limits: Parameters<typeof minutesLeft>[0], now?: number|string|Date }} x
 * @returns {LearnerView}
 *
 * @typedef {{ topicId: string, subject: string, theta: ReturnType<typeof strandTheta>, thetas: Record<string, any>,
 *   weak: ReturnType<typeof weakOn>, minutesLeft: ReturnType<typeof minutesLeft> }} LearnerView
 */
export function learnerView({ ledger, topicId, classLevel, skillIds, prereqSkillIds = [], limits, now = Date.now() }) {
  const subject = /^c\d-([a-z]+)-/.exec(String(topicId))?.[1] ?? (skillIds[0] ? subjectOfSkill(skillIds[0]) : "other");
  return {
    topicId, subject,
    theta: strandTheta(ledger, subject),
    thetas: allThetas(ledger),
    weak: weakOn(ledger, skillIds, prereqSkillIds, { classLevel, now }),
    minutesLeft: minutesLeft({ ...limits, now }),
  };
}

/**
 * The learner view from the DB for one lesson start (Brain's one call). Pass the ledger the start already loaded
 * (learner/live.js loadLive(child).state) to avoid a second fold. Never throws: a read that fails returns null and the
 * lesson starts with today's defaults (θ = class default, not weak, no limit).
 * @param {{ id: string, class_level: number }} child
 * @param {{ topicId: string, ledger?: any, kit?: { skills: { id: string }[] }, now?: Date }} o
 * @returns {Promise<LearnerView|null>}
 */
export async function learnerViewOf(child, { topicId, ledger, kit, now = new Date() }) {
  try {
    const [{ getTopic }, { kitFromFile }, { limitsFor }, live] = await Promise.all([
      import("../content/curriculum.js"), import("../content/kits.js"), import("../routes/child.js"),
      ledger ? null : import("./live.js"),
    ]);
    const L = ledger ?? (await live.loadLive(child)).state;
    const kitOf = (id) => { const t = getTopic(id); return t ? kitFromFile(t) : null; };
    const k = kit ?? kitOf(topicId);
    const skillIds = (k?.skills ?? []).map((s) => s.id);
    const prereqSkillIds = (getTopic(topicId)?.prerequisites ?? []).flatMap((p) => (kitOf(p)?.skills ?? []).map((s) => s.id));
    const limits = await limitsFor(child, now);
    return learnerView({ ledger: L, topicId, classLevel: child.class_level, skillIds, prereqSkillIds, limits, now });
  } catch {
    return null;
  }
}

/** PURE. The skill's strand (re-exported so callers need one import). */
export { strandOfSkill };

function round1(x) { return Math.round(x * 10) / 10; }
function round2(x) { return Math.round(x * 100) / 100; }
