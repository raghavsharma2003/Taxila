// The Scheduler library (CONDUCTOR.md §3.2): pure functions of (facts, an explicit now). Never reads
// Date.now or the server's timezone (eastus2 runs UTC; dc AR-6.3). Times of day are 'HH:MM' strings in the
// child's tz, which compare correctly as strings.
import { fnv1a } from "./ids.js";

const fmtCache = new Map();
function fmt(tz) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", weekday: "short" });
    fmtCache.set(tz, f);
  }
  return f;
}
/** Local calendar parts of an instant in tz. */
export function localParts(d, tz) {
  const p = Object.fromEntries(fmt(tz).formatToParts(d).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mi: +p.minute, ss: +p.second, wd: p.weekday };
}
const pad = (n) => String(n).padStart(2, "0");
export const localDate = (d, tz) => { const p = localParts(d, tz); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };
export const localTime = (d, tz) => { const p = localParts(d, tz); return `${pad(p.hh)}:${pad(p.mi)}`; };

/** The learning day: localDate(now − 4 h). A 23:50 sitting and its 00:20 wrap belong to one day. */
export const learningDay = (now, tz) => localDate(new Date(now.getTime() - 4 * 3600_000), tz);

/** 'YYYY-MM-DD' ± n days (calendar arithmetic, tz-free). */
export function addDays(day, n) {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
export const daysBetween = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400_000);
/** 0 = Sunday … 6 = Saturday, for a calendar day. */
export const weekday = (day) => new Date(day + "T00:00:00Z").getUTCDay();

/** ISO-8601 week id 'YYYY-Www' of a calendar day. */
export function isoWeek(day) {
  const t = new Date(day + "T00:00:00Z");
  const wd = (t.getUTCDay() + 6) % 7;                  // Monday = 0
  t.setUTCDate(t.getUTCDate() - wd + 3);               // Thursday of this week
  const y = t.getUTCFullYear();
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const w = 1 + Math.round(((t - jan4) / 86400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${y}-W${pad(w)}`;
}

export const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const fromMin = (min) => { const m = ((min % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
export const addMin = (hhmm, n) => fromMin(toMin(hhmm) + n);
export const maxTime = (a, b) => (a >= b ? a : b);
export const minTime = (a, b) => (a <= b ? a : b);
export const floorTo = (hhmm, step) => fromMin(Math.floor(toMin(hhmm) / step) * step);

/**
 * Minutes since the learning-day anchor (04:00 local). 'HH:MM' strings compare correctly only inside one
 * calendar day, but the learning day runs 04:00 → 04:00, so 00:30 must order AFTER 20:30 (00:30 → 1230).
 * Every comparison of "now" against a window (planner effFrom, V2) goes through this, never string order.
 */
export const DAY_ANCHOR_MIN = 4 * 60;
export const dayMin = (hhmm) => (toMin(hhmm) - DAY_ANCHOR_MIN + 1440) % 1440;
export const fromDayMin = (dm) => fromMin(Math.max(0, Math.min(1439, dm)) + DAY_ANCHOR_MIN);

/** The UTC instant of local wall time `hhmm` on calendar `day` in tz (DST-safe for the zones we serve). */
export function zonedToUtc(day, hhmm, tz) {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mi] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mi);
  const off = (t) => { const p = localParts(new Date(t), tz); return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mi, p.ss) - t; };
  let t = guess - off(guess);
  t = guess - off(t);
  return new Date(t);
}

/**
 * Per-child deterministic jitter in [0, windowSec) seconds (orch R3.2): mass wakeups spread over a window
 * instead of all firing at :00. Stable for a child, so a re-armed row lands at the same offset.
 */
export const jitterSec = (childId, salt, windowSec) => (windowSec > 0 ? fnv1a(`${childId}|${salt}`) % windowSec : 0);

/**
 * @typedef {{ tz: string, wakeTime: string, schoolStart: string, schoolEnd: string, recoveryMin: number, bedtime: string, anchor?: string }} RoutineFacts
 * @typedef {{ allowedFrom: string, allowedTo: string, dailyMinutes: number, restDays?: number[] }} ParentLimits
 * @typedef {{ kind: (day: string) => 'school_day' | 'holiday' | 'off' }} DayKindLookup
 * @typedef {'morning'|'at_school'|'recovery'|'learning_window'|'wind_down'|'night'|'free_day'} ClockPhase
 */

/** The learning window [from, to) of a day: allowed hours ∩ after school + recovery ∩ before bedtime − 60 (DC7). */
export function learningWindow(r, l, day, cal) {
  const off = cal.kind(day) !== "school_day";
  const from = off ? l.allowedFrom : maxTime(l.allowedFrom, addMin(r.schoolEnd, r.recoveryMin));
  const to = minTime(l.allowedTo, addMin(r.bedtime, -60));
  return { from, to, off };
}

/** CONDUCTOR.md §3.2 clockPhase, verbatim in structure. @returns {ClockPhase} */
export function clockPhase(r, l, now, cal) {
  const t = localTime(now, r.tz);
  const day = learningDay(now, r.tz);
  const { from: winFrom, to: winTo, off } = learningWindow(r, l, day, cal);
  if (t >= addMin(r.bedtime, -30) || t < r.wakeTime) return "night";
  if (t >= winTo) return "wind_down";
  if (off) return t >= winFrom ? "free_day" : "morning";
  if (t < r.schoolStart) return "morning";
  if (t < r.schoolEnd) return "at_school";
  return t < winFrom ? "recovery" : "learning_window";
}

/**
 * Day kinds from (in precedence order) the child's own overrides, the shared calendar, and the weekly
 * default (Sunday off [U]: many CBSE schools also close 2nd/4th Saturdays; the parent marks those).
 * @param {Record<string, string>} overrides  school.day_override fold: day -> 'off'|'holiday'|'school_day'
 * @param {Record<string, string>} calendar   shared calendar rows: day -> kind
 */
export function dayKindLookup(overrides = {}, calendar = {}) {
  return { kind: (day) => overrides[day] || calendar[day] || (weekday(day) === 0 ? "off" : "school_day") };
}
