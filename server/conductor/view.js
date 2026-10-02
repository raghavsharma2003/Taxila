// The recording ViewReader (CONDUCTOR.md §3.4, X41). decide() is pure, so everything it knows beyond
// (state, event) arrives here, pre-loaded once per step batch, and every key it reads is recorded into
// brief_snapshot so a replay can serve the same values (§3.11). Keys at M0:
//   kt.dueCount     skills with next_review <= now (KT owns it: skill_state)
//   usage.usedMin   minutes used this learning day (conductor_usage when admission writes it, else the
//                   day's lesson.ended minutes from the log)
//   cal.days        shared calendar rows for [day − 1, day + 14] (the DayKindLookup input)
import { addDays, learningDay, zonedToUtc } from "./clock.js";

/** Declared fallbacks: a missing or stale key returns these and never fires a rule (V25). */
const FALLBACK = { "kt.dueCount": 0, "usage.usedMin": 0, "cal.days": {} };

export class ReplayMiss extends Error {}

/** @param {Record<string, { value: unknown, asOf: string, src: string, stale: boolean }>} values */
export function recordingView(values) {
  const rec = {};
  return {
    get(key) {
      const v = values[key] ?? { value: FALLBACK[key] ?? null, asOf: null, src: "fallback", stale: true };
      rec[key] = v;
      return v;
    },
    recorded: () => ({ ...rec }),
  };
}

/** Replay reader: serves ONLY the recorded map; a key that was not recorded throws (the view CassetteMiss). */
export function replayView(recorded) {
  return {
    get(key) {
      if (!(key in recorded)) throw new ReplayMiss(`view key ${key} not in the recorded snapshot`);
      return recorded[key];
    },
    recorded: () => ({ ...recorded }),
  };
}

/**
 * Pre-load every M0 key for one child at `now` (plain reads; no locks, so X29 is untouched).
 * @param {{ q: (text: string, params?: unknown[]) => Promise<any[]> }} db
 */
export async function loadView(db, childId, tz, now) {
  const asOf = now.toISOString();
  const day = learningDay(now, tz);
  // The learning day runs 04:00 → 04:00 local (§3.2).
  const from = zonedToUtc(day, "04:00", tz).toISOString(), to = zonedToUtc(addDays(day, 1), "04:00", tz).toISOString();
  const [due, usage, logged, cal] = await Promise.all([
    db.q("select count(*)::int as n from skill_state where child_id = $1 and next_review is not null and next_review <= $2", [childId, asOf]),
    db.q("select used_min from conductor_usage where child_id = $1 and learning_day = $2", [childId, day]),
    db.q(`select coalesce(sum((body->>'minutes')::real), 0) as m from student_event
           where child_id = $1 and type = 'lesson.ended' and occurred_at >= $2 and occurred_at < $3`, [childId, from, to]),
    db.q("select to_char(day, 'YYYY-MM-DD') as day, kind from calendar where region = 'IN' and day between $1::date and $2::date",
      [addDays(day, -1), addDays(day, 14)]),
  ]);
  return {
    "kt.dueCount": { value: due[0]?.n ?? 0, asOf, src: "skill_state", stale: false },
    "usage.usedMin": usage[0]
      ? { value: Number(usage[0].used_min), asOf, src: "conductor_usage", stale: false }
      : { value: Number(logged[0]?.m ?? 0), asOf, src: "student_event", stale: false },
    "cal.days": { value: Object.fromEntries(cal.map((r) => [r.day, r.kind])), asOf, src: "calendar", stale: false },
  };
}
