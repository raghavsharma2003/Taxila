// Scheduling rules for the v3 date strip, time grid and time rail (owner reset R11; DESIGN-V3 §8 step 4, §11 item 5).
// Pure and erasable: the components render what these functions return, and src/ui-v3/__tests__/schedule.test.mjs
// pins every rule. No native <input type=date|time> anywhere (they are what failed on Android WebView and desktop).
//
// Dates are local calendar days as ISO strings ("2026-10-05"); times are minutes from local midnight. The caller passes
// "today" and "now" explicitly, so nothing here reads the clock (stable screenshots, deterministic tests, and the
// family's time zone is the server's business, not the browser's).

export type Iso = string;

export interface Lesson {
  /** Local calendar day. */
  date: Iso;
  /** Start, minutes from midnight. */
  start: number;
  /** Length in minutes. */
  length: number;
  id?: string;
}

export type DisabledReason = "clash" | "past" | "outside_hours" | "day_off";

export const REASON_TEXT: Record<DisabledReason, string> = {
  clash: "Already has a lesson",
  past: "Already past",
  outside_hours: "Outside lesson hours",
  day_off: "Day off",
};

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
/** Monday-first order for the weekly day toggles (index 0 = Monday … 6 = Sunday). */
export const WEEK_MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// ---------- calendar arithmetic on ISO days (UTC maths, so DST and the host time zone never shift a day) ----------

const toUtc = (iso: Iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number): Iso => new Date(ms).toISOString().slice(0, 10);

export function addDays(iso: Iso, n: number): Iso {
  return fromUtc(toUtc(iso) + n * 86_400_000);
}
/** 0 = Sunday … 6 = Saturday. */
export function weekday(iso: Iso): number {
  return new Date(toUtc(iso)).getUTCDay();
}
export function dayOfMonth(iso: Iso): number {
  return Number(iso.slice(8, 10));
}
export function monthIndex(iso: Iso): number {
  return Number(iso.slice(5, 7)) - 1;
}
/** "Mon 5 Oct". */
export function fmtDate(iso: Iso): string {
  return `${DAY_SHORT[weekday(iso)]} ${dayOfMonth(iso)} ${MONTH_SHORT[monthIndex(iso)]}`;
}
/** "Monday 5 October" (screen readers). */
export function fmtDateLong(iso: Iso): string {
  return `${DAY_LONG[weekday(iso)]} ${dayOfMonth(iso)} ${MONTH_LONG[monthIndex(iso)]}`;
}

// ---------- time formatting ----------

/** 990 → { hm: "4:30", ap: "PM" }. */
export function fmtTimeParts(min: number): { hm: string; ap: "AM" | "PM" } {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const h = h24 % 12 || 12;
  return { hm: `${h}:${String(mm).padStart(2, "0")}`, ap: h24 >= 12 ? "PM" : "AM" };
}
/** 990 → "4:30 PM". */
export function fmtTime(min: number): string {
  const { hm, ap } = fmtTimeParts(min);
  return `${hm} ${ap}`;
}
/** 1260 → "9 PM", 1290 → "9:30 PM" (compact, for limits). */
export function fmtTimeCompact(min: number): string {
  const { hm, ap } = fmtTimeParts(min);
  return `${hm.endsWith(":00") ? hm.slice(0, -3) : hm} ${ap}`;
}
export function partOfDay(min: number): "Morning" | "Afternoon" | "Evening" {
  return min < 720 ? "Morning" : min < 960 ? "Afternoon" : "Evening";
}

// ---------- the onboarding time rail ----------

export interface RailRange {
  /** First start, minutes (default 6:00 AM). */
  from: number;
  /** Lesson hours end: no lesson may END after this (default 10:00 PM). */
  until: number;
  step: number;
}
export const DEFAULT_RAIL: RailRange = { from: 6 * 60, until: 22 * 60, step: 15 };

/** Every start the rail offers for a lesson of `length` minutes: from … (until − length), on the step grid. */
export function railSlots(range: RailRange = DEFAULT_RAIL, length = 0): number[] {
  const out: number[] = [];
  const last = range.until - Math.max(length, range.step);
  for (let m = range.from; m <= last; m += range.step) out.push(m);
  return out;
}

/** Clamp and snap a start to the rail (steppers and arrow keys go through this). */
export function snapToRail(min: number, range: RailRange = DEFAULT_RAIL, length = 0): number {
  const slots = railSlots(range, length);
  if (!slots.length) return range.from;
  const snapped = Math.round((min - range.from) / range.step) * range.step + range.from;
  return Math.max(slots[0], Math.min(slots[slots.length - 1], snapped));
}

export interface WeeklyPlan {
  /** Monday-first indexes 0..6. */
  days: number[];
  start: number;
  length: number;
  reminderMin?: number;
}

/** The plain-English summary under the scheduler. ok=false means Save is disabled and line1 says why. */
export function weeklySummary(p: WeeklyPlan): { ok: boolean; line1: string; line2: string } {
  const d = [...new Set(p.days)].filter((x) => x >= 0 && x <= 6).sort((a, b) => a - b);
  if (!d.length) return { ok: false, line1: "Pick at least one day", line2: "Two or three days a week works well." };
  const names = d.length === 7 ? "Every day" : d.length === 5 && d.every((x) => x < 5) ? "Weekdays"
    : d.length === 2 && d[0] === 5 && d[1] === 6 ? "Weekends" : d.map((i) => WEEK_MON_FIRST[i]).join(", ");
  const reminder = p.reminderMin ?? 10;
  return {
    ok: true,
    line1: `${names} · ${fmtTime(p.start)}`,
    line2: `${p.length} min · done by ${fmtTime(p.start + p.length)} · reminder ${reminder} min before`,
  };
}

// ---------- the parent reschedule: 14-day strip + time grid ----------

export interface StripDay {
  iso: Iso;
  /** "Today", then the weekday ("Mon"); "Tomorrow" is spoken (aria) but not printed: it does not fit a 56 px cell. */
  label: string;
  day: number;
  month: string;
  disabled: boolean;
  reason?: DisabledReason;
  /** Accessible name, e.g. "Tuesday 6 October, already has a lesson". */
  aria: string;
}

export interface StripInput {
  today: Iso;
  days?: number;
  /** All scheduled lessons (the one being moved is excluded by id or index). */
  lessons: Lesson[];
  /** The lesson being moved (excluded from clash checks). */
  moving?: Lesson | null;
  /** Days off / exam weeks / holidays (schedule_exceptions, RS-2). */
  daysOff?: Iso[];
}

const sameLesson = (a: Lesson, b?: Lesson | null) =>
  !!b && (a.id && b.id ? a.id === b.id : a.date === b.date && a.start === b.start && a.length === b.length);

/** The 14-day strip: today first. A day that already holds another lesson, or is a day off, is disabled with a reason. */
export function dateStrip(inp: StripInput): StripDay[] {
  const n = inp.days ?? 14;
  const out: StripDay[] = [];
  for (let i = 0; i < n; i++) {
    const iso = addDays(inp.today, i);
    const clash = inp.lessons.some((l) => !sameLesson(l, inp.moving) && l.date === iso);
    const off = !!inp.daysOff?.includes(iso);
    const reason: DisabledReason | undefined = off ? "day_off" : clash ? "clash" : undefined;
    const label = i === 0 ? "Today" : DAY_SHORT[weekday(iso)];
    out.push({
      iso, label, day: dayOfMonth(iso), month: MONTH_LONG[monthIndex(iso)], disabled: !!reason, reason,
      aria: `${i === 0 ? "Today, " : i === 1 ? "Tomorrow, " : ""}${fmtDateLong(iso)}${reason ? `, ${REASON_TEXT[reason].toLowerCase()}` : ""}`,
    });
  }
  return out;
}

export interface TimeInput {
  date: Iso;
  today: Iso;
  /** Minutes from midnight right now (local to the family). */
  nowMin: number;
  /** Lesson hours window: a lesson may not start before `start` nor end after `end`. */
  hours: { start: number; end: number };
  length: number;
  lessons: Lesson[];
  moving?: Lesson | null;
  /** The candidate starts to show (default: every 30 min across lesson hours). */
  options?: number[];
  /** A start must be at least this far ahead of now to be offered today (default 15 min). */
  leadMin?: number;
  /** Minimum gap required between two lessons on the same day (default 0). */
  gapMin?: number;
}

export interface TimeOption {
  min: number;
  label: string;
  disabled: boolean;
  reason?: DisabledReason;
  aria: string;
}

/** Default candidate starts: every 30 min from lesson-hours start to end. */
export function defaultTimeOptions(hours: { start: number; end: number }, step = 30): number[] {
  const out: number[] = [];
  const first = Math.ceil(hours.start / step) * step;
  for (let m = first; m < hours.end; m += step) out.push(m);
  return out;
}

/**
 * The time grid for one date. Rules, first hit wins:
 *   past           the date is today and the start is not at least `leadMin` ahead of now (or the date is before today);
 *   outside_hours  the start is before lesson hours or the lesson would END after them;
 *   clash          it overlaps (or sits within gapMin of) another lesson that day.
 */
export function timeGrid(inp: TimeInput): TimeOption[] {
  const opts = inp.options ?? defaultTimeOptions(inp.hours);
  const lead = inp.leadMin ?? 15;
  const gap = inp.gapMin ?? 0;
  const isPastDay = toUtc(inp.date) < toUtc(inp.today);
  const isToday = inp.date === inp.today;
  const sameDay = inp.lessons.filter((l) => l.date === inp.date && !sameLesson(l, inp.moving));
  return opts.map((min) => {
    let reason: DisabledReason | undefined;
    if (isPastDay || (isToday && min < inp.nowMin + lead)) reason = "past";
    else if (min < inp.hours.start || min + inp.length > inp.hours.end) reason = "outside_hours";
    else if (sameDay.some((l) => min < l.start + l.length + gap && l.start < min + inp.length + gap)) reason = "clash";
    const label = fmtTime(min);
    return { min, label, disabled: !!reason, reason, aria: reason ? `${label}, ${REASON_TEXT[reason].toLowerCase()}` : label };
  });
}

/** The confirm line: "Mon 5 Oct · 5:30 PM · Aarav gets a heads-up", or why Save is off. */
export function moveSummary(date: Iso | null, time: number | null, grid: TimeOption[], childName: string): { ok: boolean; text: string } {
  if (!date || time == null) return { ok: false, text: "Pick a day and a time" };
  const opt = grid.find((o) => o.min === time);
  if (!opt || opt.disabled) return { ok: false, text: opt?.reason ? `${REASON_TEXT[opt.reason]}. Pick another time` : "Pick a time" };
  return { ok: true, text: `${fmtDate(date)} · ${fmtTime(time)} · ${childName} gets a heads-up` };
}

// ---------- keyboard model shared by the strip, the grid and the rail ----------

/**
 * Roving focus for a 1-D or 2-D option set. Returns the next index for a key, skipping disabled options, or null if the
 * key is not a navigation key. `cols` > 1 makes ArrowUp/ArrowDown move by a row (the time grid).
 */
export function nextIndex(key: string, from: number, disabled: boolean[], cols = 1): number | null {
  const n = disabled.length;
  if (!n) return null;
  const firstOk = disabled.findIndex((d) => !d);
  if (firstOk < 0) return null;
  const lastOk = n - 1 - [...disabled].reverse().findIndex((d) => !d);
  const step = (delta: number) => {
    let i = from;
    for (let k = 0; k < n; k++) {
      i += delta;
      if (i < 0 || i >= n) return from;
      if (!disabled[i]) return i;
    }
    return from;
  };
  switch (key) {
    case "ArrowRight": return step(1);
    case "ArrowLeft": return step(-1);
    case "ArrowDown": return cols > 1 ? step(cols) : step(1);
    case "ArrowUp": return cols > 1 ? step(-cols) : step(-1);
    case "Home": return firstOk;
    case "End": return lastOk;
    default: return null;
  }
}
