// Seeded synthetic evidence logs for the property tests (LEARNER-MODEL §13.2 generators): 1-6 sessions,
// 5-40 events per session over 1-12 skills on 1-3 subjects, every EvidenceClass × outcome × flag
// combination, gaps of 0-90 days. Deterministic per seed. Test-only, but importable by evals.
import { OUTCOMES } from "./outcomes.js";

/** mulberry32 */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];

const SUBJECTS = ["maths", "english", "hindi"];
const CLASSES = Object.keys(OUTCOMES);

export function skillPool(r, n) {
  const out = new Set();
  while (out.size < n) out.add(`c${1 + Math.floor(r() * 9)}-${pick(r, SUBJECTS)}-ch${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-t01-s${1 + Math.floor(r() * 3)}`);
  return [...out].sort();
}

/**
 * @param {number} seed
 * @param {{ sessions?: number, skills?: number, perSession?: [number, number], single?: boolean, flags?: boolean }} [o]
 */
export function makeLog(seed, { sessions, skills, perSession = [5, 40], single = false, flags = true } = {}) {
  const r = rng(seed);
  const nS = sessions ?? 1 + Math.floor(r() * 6);
  const pool = skillPool(r, skills ?? 1 + Math.floor(r() * 12));
  const events = [];
  let t = Date.UTC(2026, 3, 1, 4, 30);
  let seq = 0, ep = 0;
  for (let s = 0; s < nS; s++) {
    t += Math.floor(r() * 90) * 86_400_000 + Math.floor(r() * 10) * 3600_000;
    const sessionId = `s${seed}-${s}`;
    const startAt = new Date(t).toISOString();
    const n = perSession[0] + Math.floor(r() * (perSession[1] - perSession[0] + 1));
    let episode = null, epSkill = null;
    for (let i = 0; i < n; i++) {
      if (!episode || r() < 0.6) { episode = `e${seed}-${ep++}`; epSkill = pick(r, pool); }
      const cls = r() < 0.08 ? null : pick(r, CLASSES);
      const multi = !single && r() < 0.1;
      const skillIds = multi ? [...new Set([epSkill, pick(r, pool)])] : [epSkill];
      const base = { id: `ev${seed}-${seq}`, seq: ++seq, sessionId, sessionStartAt: startAt, episodeId: episode,
        at: new Date(t + i * 40_000).toISOString(), skillIds, itemKey: `item-${epSkill}-${i % 4}`, graderVersion: "g1",
        topicType: pick(r, ["T3", "T4", "T5"]) };
      if (!cls) { events.push({ ...base, teach: true, cls: "item.open", outcome: 0, grader: "code" }); continue; }
      const ev = { ...base, cls, outcome: Math.floor(r() * OUTCOMES[cls].length), grader: cls.startsWith("probe") ? pick(r, ["llm", "code"]) : pick(r, ["code", "code", "llm"]) };
      if (flags) {
        if (r() < 0.05) ev.assisted = pick(r, ["parent", "sibling"]);
        if (r() < 0.05) ev.gamingWindowKt = true;
        if (r() < 0.08) ev.controllerEasy = true;
        if (r() < 0.05) ev.preAttemptHelp = true;
        if (r() < 0.04) ev.contaminated = true;
        if (r() < 0.04) ev.asrConf = r();
        if (r() < 0.03) ev.safetyFired = true;
        if (r() < 0.05) ev.entryRung = 1 + Math.floor(r() * 3);
        if (r() < 0.06) ev.misconceptionId = `mis-${pick(r, ["a", "b", "c"])}`;
        if (r() < 0.06) ev.discriminates = `mis-${pick(r, ["a", "b", "c"])}`;
        if (r() < 0.1) ev.form = pick(r, ["produce", "recognise"]);
      }
      events.push(ev);
    }
  }
  return events;
}

/** Fisher-Yates with a seeded rng (arrival order). */
export function shuffled(xs, seed) {
  const r = rng(seed), a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
