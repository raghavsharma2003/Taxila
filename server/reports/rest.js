// S15 "A note about routine and rest" (PARENT-REPORT §5 S15; RESEARCH-PROGRAM MH-M12 compulsion markers), round 7 F.
// Two facts, each behind an absolute floor and a minimum count so it fires rarely (MH R9: an own-75th-percentile rule
// fires for ~46% of children a year with no change, so no relative-only rule here):
//   after-bedtime starts  ≥ AFTER_BED_MIN counted lessons in the last 14 days started after the bedtime the parent set
//                         (or before 04:00, the learning-day boundary)
//   longer lessons        the median closed-lesson length of the last 14 days is ≥ CREEP_MIN_ABS min AND ≥ CREEP_RATIO ×
//                         that of the 14 days before, each half with ≥ CREEP_MIN_N lessons
// Facts plus one suggestion only: never "addicted", never a screen-time judgement, never distress (that goes to the
// safeguarding route). PURE: claims.js runs it on the report's facts and check.js on its own database rows.
import { localTime } from "../conductor/clock.js";

export const REST = Object.freeze({ days: 14, afterBedMin: 3, creepMinN: 4, creepMinAbs: 10, creepRatio: 1.5, dawn: "04:00" });
const DAY = 86_400_000;
const minOf = (hhmm) => { const [h, m] = String(hhmm).split(":").map(Number); return h * 60 + m; };

/** PURE. Did a lesson start after the bedtime (local, tz)? After midnight and before 04:00 counts as after bedtime. */
export function afterBedtime(startedAt, bedtime, tz) {
  if (!/^[0-2]\d:[0-5]\d$/.test(String(bedtime ?? ""))) return false;
  const t = minOf(localTime(new Date(startedAt), tz));
  return t >= minOf(bedtime) || t < minOf(REST.dawn);
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2); };

/**
 * PURE. The S15 signals at `to` (the report window's end) over counted lessons [{ id, startedAt, endedAt }] of the 28
 * days before it, the parent's bedtime ("HH:MM" or null) and the child's tz.
 * @returns {{ afterBed: { k: number, d: number, ids: string[] } | null, longer: { n1: number, n2: number, ids: string[] } | null }}
 */
export function restSignals(lessons, { bedtime, tz, to }) {
  const end = Date.parse(to), mid = end - REST.days * DAY, start = mid - REST.days * DAY;
  const at = (l) => Date.parse(l.startedAt);
  const recent = lessons.filter((l) => at(l) >= mid && at(l) < end);
  const late = recent.filter((l) => afterBedtime(l.startedAt, bedtime, tz));
  const afterBed = late.length >= REST.afterBedMin ? { k: late.length, d: REST.days, ids: late.map((l) => String(l.id)).sort() } : null;
  const closed = (xs) => xs.filter((l) => l.endedAt).map((l) => ({ id: String(l.id), min: Math.round((Date.parse(l.endedAt) - at(l)) / 60_000) }));
  const r = closed(recent), p = closed(lessons.filter((l) => at(l) >= start && at(l) < mid));
  let longer = null;
  if (r.length >= REST.creepMinN && p.length >= REST.creepMinN) {
    const n1 = median(p.map((x) => x.min)), n2 = median(r.map((x) => x.min));
    if (n2 - n1 >= REST.creepMinAbs && n2 >= REST.creepRatio * n1) longer = { n1, n2, ids: [...p, ...r].map((x) => x.id).sort() };
  }
  return { afterBed, longer };
}
