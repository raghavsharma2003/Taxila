// The child's day turns at 04:00, not midnight (r5 QA: 00:20 said "Morning, Riya"). One helper for the server's daily
// greeting pick (server/face-puppet/greetings.js) and the Kaksha Home greeting word (src/ui-v3/kaksha/screens/KakshaHome.tsx),
// so the two cannot drift. Audit FACE-07.
export const DAY_START_HOUR = 4;

/** "morning" 04:00-11:59, "afternoon" 12:00-16:59, "evening" 17:00-03:59 (hour 0-23, the child's local hour). */
export const partOfDay = (hour) => (hour >= DAY_START_HOUR && hour < 12 ? "morning" : hour >= 12 && hour < 17 ? "afternoon" : "evening");

/** The learning day (YYYY-MM-DD) and the clock hour in a zone (the device's own zone when tz is omitted). Before 04:00 the
 *  day is still yesterday's. */
export function learningDay(now = new Date(), tz) {
  const fmt = (t) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(t).map((x) => [x.type, x.value]));
  const p = fmt(now);
  const shifted = fmt(new Date(now.getTime() - DAY_START_HOUR * 3600_000));
  return { day: `${shifted.year}-${shifted.month}-${shifted.day}`, hour: Number(p.hour) };
}
