// Simulated children for the knows-her eval. Every child here is invented; no real child's words or records. Each profile
// is a rule over the topic's kit and script (the same rule on every pilot topic), not a hand-tuned answer for one topic.
import { readFileSync } from "node:fs";
import { cardsOf, checkCardId } from "../../server/director/knows.js";

export const PILOT_TOPICS = Object.freeze(["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"]);
/** The fixed "now" of every run (IST morning, 2026-11-10). */
export const NOW = Date.parse("2026-11-10T10:00:00+05:30");
const day = (n) => new Date(NOW + 5.5 * 3_600_000 - n * 86_400_000).toISOString().slice(0, 10);
const ROOT = new URL("../../", import.meta.url);

/** The topic's lesson script and kit, read from data/ (the files the product reads). */
export function loadTopic(topicId) {
  const script = JSON.parse(readFileSync(new URL(`data/lesson-scripts/${topicId}.json`, ROOT), "utf8"));
  const subj = topicId.replace(/-ch\d+-t\d+$/, "");
  const kit = JSON.parse(readFileSync(new URL(`data/kits/${subj}.json`, ROOT), "utf8")).topics.find((t) => t.topicId === topicId);
  if (!kit) throw new Error(`no kit for ${topicId}`);
  return { script, kit };
}

const CARD = new Set(["practice", "retrieval", "near_transfer"]);
const skillOf = (script, kit, k) => script.skills.find((s) => s.skillId === kit.skills[k]?.id);
const topicOfSkill = (skillId) => String(skillId).replace(/-s\d+$/, "");

/** The first scripted skill with a later check whose target differs from its first check's: that target is the open mix-up. */
function ledgerMixup(script, kit) {
  for (const ks of kit.skills) {
    const sk = script.skills.find((s) => s.skillId === ks.id);
    const c = (sk?.checks ?? []).find((x, k) => k > 0 && x.targets && x.targets !== sk.checks[0].targets);
    if (c) return { skillId: sk.skillId, cardId: checkCardId(sk.skillId, c.id), misconceptionId: c.targets };
  }
  return null;
}
/** A later skill's first check with a remediation for a mix-up other than its own target (the classifier names that one). */
function classifiedMixup(script, kit, notSkill) {
  for (const ks of kit.skills) {
    const sk = script.skills.find((s) => s.skillId === ks.id);
    if (!sk || sk.skillId === notSkill || !sk.checks?.length) continue;
    const c = sk.checks[0];
    const other = (sk.remediation ?? []).map((r) => r.targets).find((t) => t !== c.targets);
    if (other) return { cardId: checkCardId(sk.skillId, c.id), misconceptionId: other };
  }
  return null;
}

/**
 * The children for one topic.
 * - new: no history at all (a first lesson with no plan, no interests, no ledger).
 * - meera: holds skill 1 as mastered with a passed delayed check (and has answered its easy items), is practising skill 2,
 *   likes cricket, and comes back after 12 days away. Answers every card right.
 * - meeraForgot: Meera's record, but she misses skill 1's opening check today (K1's fallback).
 * - player: has never had a lesson; everything known came from games (play: evidence): practising skill 1, met skill 2,
 *   one mix-up the games showed (p 0.74); first week (brief R15). Answers every card right. (Play alone never certifies a
 *   delayed check, so it can never compress a skill.)
 * - kabir: practising skill 1; his last lesson closed badly (brief R1 success-first); the Conductor marked a wheel-spinning
 *   skill whose prerequisite is in an earlier topic (R5); one mix-up is open in his ledger (p 0.82), the target of a later
 *   check; likes trains and drawing; came yesterday. Misses that check (the classifier names nothing: its own remediation),
 *   and one other check where the classifier names a different mix-up; right elsewhere.
 */
export function childrenFor(topicId) {
  const { script, kit } = loadTopic(topicId);
  const s1 = kit.skills[0].id, s2 = kit.skills[1]?.id;
  const easy = kit.items.filter((i) => i.skillId === s1 && CARD.has(i.kind) && (i.difficulty ?? 9) <= 2).map((i) => i.id);
  const lm = ledgerMixup(script, kit);
  const cm = classifiedMixup(script, kit, lm?.skillId);
  const spin = kit.skills.find((s) => (s.prereqSkillIds ?? []).some((p) => topicOfSkill(p) !== topicId));
  const prereq = spin ? (spin.prereqSkillIds ?? []).find((p) => topicOfSkill(p) !== topicId) : null;
  const firstCheck = (() => { const sk = skillOf(script, kit, 0); return sk?.checks?.length ? checkCardId(sk.skillId, sk.checks[0].id) : null; })();
  const right = () => ({ verdict: "right" });
  const meera = {
    skills: { [s1]: { status: "mastered", delayedPassed: true, attempts: 9, correctUnaided: 7 }, ...(s2 ? { [s2]: { status: "practising", delayedPassed: false, attempts: 3, correctUnaided: 1 } } : {}) },
    history: { [s1]: easy }, mixups: [], brief: null, interests: ["cricket"], memory: { likes: true, lastActiveDay: day(12) },
  };
  return {
    script, kit,
    children: {
      new: { input: {}, answer: right },
      meera: { input: meera, answer: right },
      meeraForgot: { input: meera, answer: (card) => ({ verdict: card.id === firstCheck ? "wrong" : "right" }) },
      kabir: {
        input: {
          skills: { [s1]: { status: "practising", delayedPassed: false, attempts: 6, correctUnaided: 1 } },
          history: {},
          mixups: lm ? [{ id: lm.misconceptionId, p: 0.82, needsVerify: true, hits: 3 }] : [],
          brief: { opener: "standard_retrieval", successFirst: true, newSkillBudget: 1, adaptTrace: ["R1"],
            ...(spin && prereq ? { prereqCheck: { skillId: spin.id, forTopicId: topicId, prereqTopicId: topicOfSkill(prereq) } } : {}) },
          interests: ["trains", "drawing"], memory: { likes: true, lastActiveDay: day(1) },
        },
        answer: (card) => (card.id === lm?.cardId ? { verdict: "wrong" } : card.id === cm?.cardId ? { verdict: "wrong", misconceptionId: cm.misconceptionId } : { verdict: "right" }),
      },
      player: {
        // every row of her record came from games (kt_evidence rows with a play: source): no script card, no lesson yet
        evidence: "play",
        input: {
          skills: { [s1]: { status: "practising", delayedPassed: false, attempts: 8, correctUnaided: 3 }, ...(s2 ? { [s2]: { status: "introduced", delayedPassed: false, attempts: 2, correctUnaided: 0 } } : {}) },
          history: {},
          mixups: lm ? [{ id: lm.misconceptionId, p: 0.74, needsVerify: true, hits: 2 }] : [],
          brief: { opener: "standard_retrieval", successFirst: true, newSkillBudget: 1, adaptTrace: ["R15"] },
          interests: [], memory: { likes: true, lastActiveDay: day(1) },
        },
        answer: right,
      },
    },
  };
}
