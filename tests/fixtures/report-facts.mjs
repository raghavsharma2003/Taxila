// Hand-built report snapshots (server/reports/facts.js shape) for the pure report tests. Times are IST lessons at
// 17:00 local (11:30Z). Outcome indices follow server/learner/kt/outcomes.js (item.open: 0 = C0, 4 = C4).
import { windowOf } from "../../server/reports/facts.js";

const A = "c5-maths-ch01-t01-s1", B = "c5-maths-ch02-t02-s1", C = "c6-science-ch04-t01-s1";
export const SKILLS = { A, B, C };
let n = 0;
const ev = (o) => ({ id: `e${++n}`, seq: n, grader: "code", itemKey: `k${n}`, teach: false, preAttemptHelp: false, entryRung: 0, misconceptionId: null,
  discriminates: null, via: "dialogue", contaminated: false, assisted: null, ...o });
const at = (day, min = 0) => new Date(Date.parse(`${day}T11:30:00.000Z`) + min * 60_000).toISOString();

/** A child with one session on 10-05 and one on 10-06 (the reported day), in `lang`. */
export function dayFacts({ lang = "hinglish", name = "Riya", period = "2026-10-06", cadence = "daily", extra = [], memories = [], lessons } = {}) {
  n = 0;
  const s1 = "S1", s2 = "S2";
  const events = [
    ev({ sessionId: s1, at: at("2026-10-05", 1), skillIds: [A], cls: "teach", outcome: -1, teach: true, itemKey: "" }),
    ev({ sessionId: s1, at: at("2026-10-05", 3), skillIds: [A], cls: "item.open", outcome: 0 }),
    ev({ sessionId: s1, at: at("2026-10-05", 5), skillIds: [A], cls: "item.open", outcome: 2 }),
    // 10-06: delayed success on A (previous contact 10-05 in S1, ~24 h earlier)
    ev({ sessionId: s2, at: at("2026-10-06", 1), skillIds: [A], cls: "item.open", outcome: 0 }),
    ev({ sessionId: s2, at: at("2026-10-06", 2), skillIds: [A], cls: "item.open", outcome: 0 }),
    ev({ sessionId: s2, at: at("2026-10-06", 3), skillIds: [A], cls: "probe.teachback", outcome: 0, grader: "llm" }),
    ev({ sessionId: s2, at: at("2026-10-06", 4), skillIds: [A], cls: "probe.why", outcome: 0, grader: "llm" }),
    // B: taught, then mostly wrong, two answers matching misconception m1 on discriminating items
    ev({ sessionId: s2, at: at("2026-10-06", 6), skillIds: [B], cls: "teach", outcome: -1, teach: true, itemKey: "" }),
    ev({ sessionId: s2, at: at("2026-10-06", 7), skillIds: [B], cls: "item.open", outcome: 4, misconceptionId: "m1", discriminates: "m1" }),
    ev({ sessionId: s2, at: at("2026-10-06", 8), skillIds: [B], cls: "item.open", outcome: 4, misconceptionId: "m1", discriminates: "m1" }),
    ev({ sessionId: s2, at: at("2026-10-06", 9), skillIds: [B], cls: "item.open", outcome: 0, discriminates: "m1" }),
    ev({ sessionId: s2, at: at("2026-10-06", 10), skillIds: [B], cls: "item.open", outcome: 3 }),
    ...extra.map((e) => ev(e)),
  ];
  return {
    child: { id: "11111111-1111-4111-8111-111111111111", firstName: name, classLevel: 5, languagePref: lang, tz: "Asia/Kolkata" },
    window: windowOf(cadence, period, "Asia/Kolkata"),
    consent: { core_tutoring: true, memory: true },
    lessons: lessons ?? [{ id: "L2", topicId: "c5-maths-ch01-t01", startedAt: at("2026-10-06", 0), endedAt: at("2026-10-06", 24) }],
    events,
    skills: { [A]: { display: "learned_today", nextReviewAt: "2026-10-09T11:30:00.000Z", refresh: false }, [B]: { display: "practising", nextReviewAt: "2026-10-08T11:30:00.000Z", refresh: false } },
    misconceptions: { m1: { hits: 2, resolvedAt: null } },
    memories,
    titles: { [A]: "Reads and writes numbers up to 1,00,000 in words", [B]: "Compares fractions with the same numerator", [C]: "Separates mixtures by sieving" },
    beliefs: { m1: "A bigger denominator means a bigger fraction" },
  };
}
