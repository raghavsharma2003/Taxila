// The simulated curriculum: six real NCERT topics from data/kits (expectations, misconceptions with diagnostic
// options, topic type), studied in order over five sessions. Weave hosts: every later maths topic can host an
// earlier maths topic as a necessary sub-step (fractions inside fractions, numbers inside primes / area); the
// science topic hosts nothing and is hosted by nothing (it can only be checked by a callback).
import { readFileSync } from "fs";

const KITS = new URL("../../data/kits/", import.meta.url);
const PICK = [
  ["c5-maths", "c5-maths-ch01-t01"], ["c5-maths", "c5-maths-ch02-t02"], ["c5-maths", "c5-maths-ch11-t01"],
  ["c6-maths", "c6-maths-ch05-t02"], ["c6-maths", "c6-maths-ch07-t03"], ["c6-science", "c6-science-ch04-t01"],
];
const cache = {};
const kit = (f) => (cache[f] ??= JSON.parse(readFileSync(new URL(`${f}.json`, KITS), "utf8")));

/** @returns {{ id: string, topicId: string, skillId: string, title: string, topicType: string, subject: string, expectations: string[], misconceptions: any[] }[]} */
export function concepts() {
  return PICK.map(([f, topicId], i) => {
    const t = kit(f).topics.find((x) => x.topicId === topicId);
    if (!t) throw new Error(`world: topic ${topicId} missing from ${f}`);
    const sk = t.skills[0];
    const c = { id: `c${i + 1}`, topicId, skillId: sk.id, title: sk.title, topicType: t.topicType, subject: f.split("-")[1],
      expectations: t.expectations.slice(0, 3), misconceptions: t.misconceptions.slice(0, 2).map((m) => ({ id: m.id, belief: m.belief, options: m.diagnostic?.options ?? [] })) };
    // the REAL kit topic (the `live` policy reads its fields through server/learner/live.js kitInputsOf, and plays its
    // item kinds); non-enumerable so result files never copy it
    Object.defineProperty(c, "kit", { value: t, enumerable: false });
    return c;
  });
}

/**
 * Will the production classifier decide this kit item's answer in CODE (an exact / lexical match against the verified
 * key; classify.js sources exact|lexical) rather than with the model (grader llm, no span → a positive carries no U/T,
 * E6)? [U] a short answer that is a number, a numeral phrase or one or two words is matchable; a sentence is not.
 */
export function codeMatchable(item) {
  const a = String(Array.isArray(item?.answer) ? item.answer[0] : item?.answer ?? "").trim();
  if (!a) return false;
  if (/^[₹\d,.\s/:%-]+$/.test(a)) return true;
  return a.split(/\s+/).length <= 2 && a.length <= 24;
}

/** Kit inputs available for every simulated topic (the kits carry expectations, misconceptions + diagnostics, items). */
export const KIT_INPUTS = Object.freeze(["expectations", "misconceptions", "characterView", "myth", "diagnostic", "items", "counterfactual",
  "instances", "interestContexts", "representations", "weaveHosts", "solver"]);

/** Session plan: which concepts are topics in which session, and the session start times (days from day 0). */
export const SESSIONS = Object.freeze([
  { day: 0, topics: ["c1", "c2"], fresh: ["c1", "c2"] },
  { day: 1, topics: ["c3", "c4"], fresh: ["c3", "c4"] },
  { day: 2, topics: ["c5", "c6"], fresh: ["c5", "c6"] },
  { day: 5, topics: ["c1", "c3", "c5"], fresh: [] },
  { day: 6, topics: ["c2", "c4", "c6"], fresh: [] },
]);
export const DAY0 = Date.parse("2026-10-05T04:30:00.000Z");   // 10:00 IST
export const sessionStart = (i) => new Date(DAY0 + SESSIONS[i].day * 86_400_000).toISOString();

/** Weave host candidates: later maths topics host earlier maths topics. */
export function hostCandidates(cs, c) {
  if (c.subject !== "maths") return [];
  const i = cs.indexOf(c);
  return cs.slice(i + 1).filter((x) => x.subject === "maths").map((x) => x.skillId);
}
