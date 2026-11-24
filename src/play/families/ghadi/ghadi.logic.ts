// Ghadi (घड़ी, "clock") · round 7, time and clocks (classes 4-5). Nothing here ever runs on a clock: every hand, ticket,
// runner and flag moves only on the child's act, and the law answers only on "run". The clock is GEARED, as a real one
// is: the child turns the minute hand and the hour hand follows (the law computes it); a full turn of the minute hand
// moves the hour on, and passing 12 moves the day strip from a.m. to p.m. (or back). One reading, t = minutes since
// midnight (0..1439), is the whole clock; the hands are drawn from it.
// Modes and goals (each a different use of one law: time is counted in 60s, a day in two halves of 12 hours):
//   set/hands       the station bell rings at a time written on the board (7:20 p.m.): set the clock to it (minute hand by
//                   winding, hour hand by its sector, a.m. / p.m. on the day strip), then ring the bell
//   run/arrive      a bus leaves at the board's time and the trip takes so long (1 h 35 min · 80 min · 1.5 h · a quarter of
//                   an hour): the clock starts at the departure; wind it to the arrival, then run the bus (the hands sweep
//                   the trip and the bus arrives when they stop)
//   run/leave       the bus must arrive at the board's time: the clock starts at the arrival; wind it back to when it must
//                   leave, then run (the sweep starts at the child's departure)
//   run/trip        the bus leaves and arrives at two board times: make its ticket (hours + minutes); the sweep runs the
//                   ticket from the departure and must stop on the arrival
//   race/podium     runners' finish times (15 s · 12.45 s · 1 min 5 s): put each on the podium, then the race is run (each
//                   runner covers the track in exactly their time); less time is faster
//   calendar/days   today is ringed on a month: the fair is n days (or w weeks d days) ahead; plant the flag on its date,
//                   then hop: one hop per day, from today
// Mal-rules (each a deterministic set-up; a level serves one only where it differs from every other one of the goal's):
//   minute-number   hands: the minute hand put on the number of minutes (h:05 → hand on 5 = h:25; h:10 → h:50)
//   hour-next       hands: the hour taken from the number the hour hand is close to (2:45 set as 3:45)
//   noon-am         hands: 12 noon is 12 a.m. (12:15 p.m. set on the night half, and 12:15 a.m. on the day half)
//   no-carry        arrive: minutes past 60 not carried into an hour (1:50 + 20 min → 1:10 with the hour left alone)
//   decimal-hours   arrive / leave: 1.5 h read as 1 h 50 min
//   quarter-25      arrive / leave: a quarter of an hour read as 25 min (three quarters as 75)
//   base-hundred    leave: an hour borrowed as 100 minutes (10:00 − 45 min → 9:55)
//   base-ten        trip: the times subtracted as plain numbers (2:10 − 1:50 → 210 − 150 = 60 minutes)
//   bigger-faster   podium: the biggest time first
//   longer-decimal  podium: more digits after the dot is bigger (12.45 s after 12.5 s)
//   minute-hundred  podium: 1 min 5 s read as 105 s (a minute as 100 seconds)
//   count-start     days: today counted as the first day ahead (the flag one day short)
import type { Candidate, Facts, FamilyLogic, GenRequest, GhadiAct, Moment, PlayActEnvelope, PlayGrade, PlayLevel } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export type GhadiMode = "set" | "run" | "race" | "calendar";
export type GhadiGoal = "hands" | "arrive" | "leave" | "trip" | "podium" | "days";
/** how a trip's length is written: "1 h 35 min" · "80 min" · "1.5 h" · "a quarter of an hour" · "three quarters of an hour" */
export type DurSay = "hm" | "min" | "dec" | "quarter" | "threeq";
/** a runner's time as written: whole seconds · one decimal · two decimals · minutes and seconds */
export type RunFmt = "s" | "d1" | "d2" | "ms";
export interface Runner { cs: number; fmt: RunFmt }
export interface GhadiParams {
  goal: GhadiGoal;
  /** the clock face (fade): 1 numerals and the minute ring 5, 10, 15 … · 2 numerals only · 3 only 12, 3, 6 and 9 */
  face: 1 | 2 | 3;
  /** the child's clock before any act (hands: anywhere; arrive: the departure; leave: the arrival); else 0 */
  start: number;
  /** hands: the time to show · arrive / trip: the departure · leave: the arrival (minutes since midnight) */
  at: number;
  /** trip: the arrival; else 0 */
  to: number;
  /** arrive / leave: the trip's length in minutes; else 0 */
  dur: number;
  /** arrive / leave: how the length is written; else "" */
  say: DurSay | "";
  /** podium: the runners in their lanes (lane = index; the bib is lane + 1) */
  runners: Runner[];
  /** days: the month (its length, the weekday of the 1st with 0 = Monday), today, how many days ahead, written in weeks */
  days: number; first: number; today: number; ahead: number; weeks: boolean;
}
export interface GhadiState extends Undoable<GhadiState> {
  /** the child's clock (minutes since midnight) */
  t: number;
  /** trip: the ticket's hours and minutes */
  th: number; tm: number;
  /** podium: the lane on each step (1st first), −1 = empty */
  order: number[];
  /** days: the flag's date, 0 = not planted */
  pick: number;
  ended: boolean; runs: number; done: boolean; acts: number;
}

export const DAY = 1440;
export const GHADI_MAL = ["minute-number", "hour-next", "noon-am", "no-carry", "decimal-hours", "quarter-25", "base-hundred", "base-ten",
  "bigger-faster", "longer-decimal", "minute-hundred", "count-start"] as const;
const MAL_OF: Record<GhadiGoal, readonly string[]> = {
  hands: ["minute-number", "hour-next", "noon-am"],
  arrive: ["no-carry", "decimal-hours", "quarter-25"],
  leave: ["base-hundred", "decimal-hours", "quarter-25"],
  trip: ["base-ten"],
  podium: ["bigger-faster", "longer-decimal", "minute-hundred"],
  days: ["count-start"],
};
const GOALS_OF: Record<GhadiMode, readonly GhadiGoal[]> = { set: ["hands"], run: ["arrive", "leave", "trip"], race: ["podium"], calendar: ["days"] };
const CLOCK_GOALS: readonly GhadiGoal[] = ["hands", "arrive", "leave"];
export const clockGoal = (g: GhadiGoal) => CLOCK_GOALS.includes(g);
export const TICKET_H = 12, TICKET_M = 115;

const mod = (x: number, m: number) => ((x % m) + m) % m;
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
export const pad2 = (x: number) => String(x).padStart(2, "0");
/** the hour on a 12-hour face (1..12) */
export const hour12 = (t: number) => { const h = Math.floor(mod(t, DAY) / 60) % 12; return h === 0 ? 12 : h; };
export const isPm = (t: number) => mod(t, DAY) >= 720;
/** "7:20" (the face's reading; a.m. / p.m. is drawn apart) */
export const clockText = (t: number) => `${hour12(t)}:${pad2(mod(t, 60))}`;
/** a.m. / p.m. for the board twin and the facts */
export const halfText = (t: number) => (isPm(t) ? "p.m." : "a.m.");
/** minute and hour hand angles, degrees clockwise from 12: the hour hand moves with the minutes (geared) */
export const minuteAngle = (t: number) => mod(t, 60) * 6;
export const hourAngle = (t: number) => (mod(t, 720) / 720) * 360;

/** the hours and minutes a trip's length is written in (min: all in minutes) */
export function durParts(dur: number, say: DurSay | ""): [number, number] { return say === "min" ? [0, dur] : [Math.floor(dur / 60), dur % 60]; }
/** a runner's time as written ("15", "12.5", "12.45", "1 min 5"): the value the child reads, in its own unit */
export function runText(r: Runner): string {
  if (r.fmt === "ms") { const s = Math.round(r.cs / 100); return `${Math.floor(s / 60)} min ${s % 60} s`; }
  if (r.fmt === "s") return `${Math.round(r.cs / 100)} s`;
  return `${(r.cs / 100).toFixed(r.fmt === "d1" ? 1 : 2)} s`;
}
/** the true finishing order: lanes by time, fastest first */
export const raceOrder = (p: Pick<GhadiParams, "runners">) => p.runners.map((_, i) => i).sort((a, b) => p.runners[a].cs - p.runners[b].cs);

/** THE ANSWER the law compares with: the clock time (hands, arrive, leave), the trip in minutes, the date */
export function want(p: GhadiParams): number {
  switch (p.goal) {
    case "hands": return p.at;
    case "arrive": return mod(p.at + p.dur, DAY);
    case "leave": return mod(p.at - p.dur, DAY);
    case "trip": return mod(p.to - p.at, DAY);
    case "days": return p.today + p.ahead;
    case "podium": return 0;
  }
}
/** a set-up: what the child commits before the run */
export interface Setup { t?: number; th?: number; tm?: number; order?: number[]; pick?: number }
const sameOrder = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
/** THE judgement of a run */
export function judge(p: GhadiParams, s: Setup): boolean {
  if (clockGoal(p.goal)) return s.t === want(p);
  if (p.goal === "trip") return (s.th ?? 0) * 60 + (s.tm ?? 0) === want(p);
  if (p.goal === "days") return s.pick === want(p);
  return !!s.order && sameOrder(s.order, raceOrder(p));
}
function legal(p: GhadiParams, s: Setup): boolean {
  if (clockGoal(p.goal)) return isInt(s.t) && s.t >= 0 && s.t < DAY;
  if (p.goal === "trip") return isInt(s.th) && isInt(s.tm) && s.th >= 0 && s.th <= TICKET_H && s.tm >= 0 && s.tm <= TICKET_M && s.th * 60 + s.tm > 0;
  if (p.goal === "days") return isInt(s.pick) && s.pick >= 1 && s.pick <= p.days;
  return !!s.order && s.order.length === p.runners.length && new Set(s.order).size === s.order.length && s.order.every((l) => l >= 0 && l < p.runners.length);
}

/** podium mal-rules: the value each belief reads a runner's time as (seconds), or null when it has no reading */
function belief(mal: string, r: Runner): [number, number] | null {
  const sec = r.cs / 100;
  if (mal === "bigger-faster") return [-sec, 0];
  if (mal === "longer-decimal") {
    if (r.fmt === "ms") return null;
    const [w, f = ""] = runText(r).replace(" s", "").split(".");
    return [Number(w), f ? Number(f) : 0];
  }
  if (mal === "minute-hundred") { if (r.fmt !== "ms") return [sec, 0]; const s = Math.round(sec); return [Math.floor(s / 60) * 100 + (s % 60), 0]; }
  return null;
}
function rawMal(p: GhadiParams, mal: string): Setup | null {
  if (!MAL_OF[p.goal].includes(mal)) return null;
  const hm = mod(p.at, 60);
  switch (mal) {
    case "minute-number": return hm >= 5 && hm <= 10 && hm % 5 === 0 ? { t: p.at + 4 * hm } : null;
    case "hour-next": return hm >= 35 && hour12(p.at) <= 10 ? { t: p.at + 60 } : null;
    case "noon-am": return hour12(p.at) === 12 ? { t: mod(p.at + 720, DAY) } : null;
    case "no-carry": {
      const [H, M] = durParts(p.dur, p.say);
      if (p.say !== "hm" && p.say !== "min") return null;
      return hm + M >= 60 ? { t: mod(p.at - hm + 60 * H + ((hm + M) % 60), DAY) } : null;
    }
    case "decimal-hours": case "quarter-25": {
      let d = -1;
      if (mal === "decimal-hours" && p.say === "dec") d = Math.floor(p.dur / 60) * 60 + 50;
      if (mal === "quarter-25" && (p.say === "quarter" || p.say === "threeq")) d = p.say === "quarter" ? 25 : 75;
      if (d < 0) return null;
      return { t: mod(p.goal === "arrive" ? p.at + d : p.at - d, DAY) };
    }
    case "base-hundred": {
      if (p.say !== "hm" && p.say !== "min") return null;
      const [H, M] = durParts(p.dur, p.say);
      const x = hour12(p.at) * 100 + hm - (H * 100 + M), h = Math.floor(x / 100), m = x % 100;
      if (x <= 0 || h < 1 || h > 12 || m >= 60) return null;
      return { t: (isPm(p.at) ? 720 : 0) + (h % 12) * 60 + m };
    }
    case "base-ten": {
      if (isPm(p.at) !== isPm(p.to) || hour12(p.to) === 12 || hour12(p.at) === 12) return null;
      const x = hour12(p.to) * 100 + mod(p.to, 60) - (hour12(p.at) * 100 + hm);
      return x > 0 ? { th: Math.floor(x / 100), tm: x % 100 } : null;
    }
    case "bigger-faster": case "longer-decimal": case "minute-hundred": {
      const keys = p.runners.map((r) => belief(mal, r));
      if (keys.some((k) => !k)) return null;
      const ks = keys as [number, number][];
      const order = p.runners.map((_, i) => i).sort((a, b) => ks[a][0] - ks[b][0] || ks[a][1] - ks[b][1]);
      // a belief that cannot rank two runners apart names no order
      for (let i = 1; i < order.length; i++) if (ks[order[i]][0] === ks[order[i - 1]][0] && ks[order[i]][1] === ks[order[i - 1]][1]) return null;
      return { order };
    }
    case "count-start": return { pick: p.today + p.ahead - 1 };
  }
  return null;
}
const sameSetup = (a: Setup, b: Setup) => a.t === b.t && a.th === b.th && a.tm === b.tm && a.pick === b.pick && sameOrder(a.order ?? [], b.order ?? []);
/** The set-up a child holding `mal` commits, or null (changes nothing here, not legal, would solve, or another of the goal's
 *  beliefs commits the very same set-up: a signature names ONE belief) */
export function malSetup(p: GhadiParams, mal: string): Setup | null {
  const m = rawMal(p, mal);
  if (!m || !legal(p, m) || judge(p, m)) return null;
  for (const other of MAL_OF[p.goal]) {
    if (other === mal) continue;
    const o = rawMal(p, other);
    if (o && sameSetup(o, m)) return null;
  }
  return m;
}

/** the values the teacher may not say before the child produces them */
export function ghadiHidden(level: PlayLevel<unknown>): string[] {
  const p = level.params as GhadiParams | null;
  if (!p || typeof p.goal !== "string") return [];
  try {
    if (p.goal === "hands") { const m = mod(p.at, 60); return [String(m === 0 ? 12 : m / 5)]; }   // the number the minute hand points to
    if (p.goal === "arrive" || p.goal === "leave") return [clockText(want(p))];
    if (p.goal === "trip") { const d = want(p); return [String(d), `${Math.floor(d / 60)}:${pad2(d % 60)}`]; }
    if (p.goal === "days") return [String(want(p))];
    // podium: the winner's bib, and the seconds a minutes-and-seconds time comes to
    const o = raceOrder(p);
    return [String(o[0] + 1), ...p.runners.filter((r) => r.fmt === "ms").map((r) => String(Math.round(r.cs / 100)))];
  } catch { return []; }
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts, mis?: string): Moment => ({ kind, seq, facts, ...(mis ? { misconceptionId: mis } : {}) });
const SAYS: readonly DurSay[] = ["hm", "min", "dec", "quarter", "threeq"];
const FMTS: readonly RunFmt[] = ["s", "d1", "d2", "ms"];
const ZERO = { start: 0, at: 0, to: 0, dur: 0, say: "" as const, runners: [] as Runner[], days: 0, first: 0, today: 0, ahead: 0, weeks: false };
/** a trip length that matches how it is written */
function durOk(dur: number, say: DurSay): boolean {
  switch (say) {
    case "hm": return dur >= 65 && dur <= 360 && dur % 5 === 0 && dur % 60 !== 0;
    case "min": return dur >= 65 && dur <= 115 && dur % 5 === 0;
    case "dec": return [30, 90, 150].includes(dur);
    case "quarter": return dur === 15;
    case "threeq": return dur === 45;
  }
}

function validate(level: PlayLevel<unknown>): PlayLevel<GhadiParams> | null {
  const p = level.params as Partial<GhadiParams> | null, mode = level.mode as GhadiMode;
  if (!p || !GOALS_OF[mode] || !GOALS_OF[mode].includes(p.goal as GhadiGoal)) return null;
  const goal = p.goal as GhadiGoal;
  const face = p.face === 2 || p.face === 3 ? p.face : p.face === 1 ? 1 : 0;
  if (!face) return null;
  const tOk = (x: unknown): x is number => isInt(x) && x >= 0 && x < DAY;
  const base: GhadiParams = { goal, face, ...ZERO };
  // every field a goal does not use stays empty (a tampered level never smuggles a second puzzle in)
  const unused = (keys: (keyof typeof ZERO)[]) => keys.every((k) => k === "runners" ? Array.isArray(p.runners) && !p.runners.length : p[k] === ZERO[k]);
  if (clockGoal(goal)) {
    const { start, at } = p;
    if (!tOk(start) || !tOk(at) || at % 5 !== 0 || !unused(["to", "runners", "days", "first", "today", "ahead", "weeks"])) return null;
    if (goal === "hands") {
      if (!unused(["dur", "say"])) return null;
      // the clock starts on a different hour, a different minute (and so needs every hand moved)
      if (hour12(start) === hour12(at) || mod(start, 60) === mod(at, 60)) return null;
      return { ...level, params: { ...base, start, at } } as PlayLevel<GhadiParams>;
    }
    const dur = p.dur, say = p.say as DurSay;
    if (!isInt(dur) || !SAYS.includes(say) || !durOk(dur, say)) return null;
    if (start !== at) return null;   // the clock starts on the board's time
    // the whole trip within one day (no midnight on the road)
    if (goal === "arrive" ? at + dur >= DAY : at - dur < 0) return null;
    return { ...level, params: { ...base, start, at, dur, say } } as PlayLevel<GhadiParams>;
  }
  if (goal === "trip") {
    const { at, to } = p;
    if (!tOk(at) || !tOk(to) || at % 5 || to % 5 || to <= at || to - at > TICKET_H * 60 || !unused(["start", "dur", "say", "runners", "days", "first", "today", "ahead", "weeks"])) return null;
    if ((to - at) % 60 === 0) return null;   // the trip is never whole hours: the minutes are the idea
    return { ...level, params: { ...base, at, to } } as PlayLevel<GhadiParams>;
  }
  if (goal === "days") {
    const { days, first, today, ahead } = p;
    if (![28, 29, 30, 31].includes(Number(days)) || !isInt(first) || first < 0 || first > 6 || !isInt(today) || !isInt(ahead)) return null;
    if (today < 1 || ahead < 3 || ahead > 20 || today + ahead > Number(days) || typeof p.weeks !== "boolean" || (p.weeks && (ahead < 8 || ahead % 7 < 2))) return null;
    if (!unused(["start", "at", "to", "dur", "say", "runners"])) return null;
    return { ...level, params: { ...base, days: Number(days), first, today, ahead, weeks: p.weeks } } as PlayLevel<GhadiParams>;
  }
  // podium: 3-4 runners, distinct times between 5 s and 3 min, each written as its format allows
  const rs = p.runners;
  if (!Array.isArray(rs) || rs.length < 3 || rs.length > 4 || !unused(["start", "at", "to", "dur", "say", "days", "first", "today", "ahead", "weeks"])) return null;
  const runners: Runner[] = [];
  for (const r of rs) {
    if (!r || !isInt(r.cs) || r.cs < 500 || r.cs > 18000 || !FMTS.includes(r.fmt)) return null;
    if ((r.fmt === "s" || r.fmt === "ms") && r.cs % 100) return null;
    if (r.fmt === "d1" && r.cs % 10) return null;
    if (r.fmt === "ms" && r.cs < 6000) return null;
    runners.push({ cs: r.cs, fmt: r.fmt });
  }
  if (new Set(runners.map((r) => r.cs)).size !== runners.length) return null;
  if (sameOrder(raceOrder({ runners }), runners.map((_, i) => i))) return null;   // the lanes are never already the podium
  return { ...level, params: { ...base, runners } } as PlayLevel<GhadiParams>;
}

function init(level: PlayLevel<GhadiParams>): GhadiState {
  const p = level.params;
  return { t: p.start, th: 0, tm: 0, order: p.runners.map(() => -1), pick: 0, ended: false, runs: 0, done: false, acts: 0, prev: null, depth: 0 };
}
const setupOf = (s: GhadiState): Setup => ({ t: s.t, th: s.th, tm: s.tm, order: s.order, pick: s.pick });

function apply(level: PlayLevel<GhadiParams>, s: GhadiState, act: GhadiAct, seq: number): { state: GhadiState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  const bump = (st: GhadiState): GhadiState => ({ ...st, acts: s.acts + 1 });
  const no = (code: string) => ({ state: bump(s), moments: out, refused: code });
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  // any change of the set-up makes the next run a fresh one
  const change = (patch: Partial<GhadiState>) => ({ state: bump(pushUndo(s, { ...s, ...patch, ended: false })), moments: out });
  switch (act.kind) {
    case "wind": case "hour": case "half": {
      if (!clockGoal(p.goal)) return no("no_clock");
      if (act.kind === "wind") {
        const by = Number(act.by);
        if (!isInt(by) || by === 0 || Math.abs(by) > DAY) return no("bad_turn");
        return change({ t: mod(s.t + by, DAY) });
      }
      if (act.kind === "hour") {
        const h = Number(act.h);
        if (!isInt(h) || h < 0 || h > 11) return no("bad_turn");
        return change({ t: (isPm(s.t) ? 720 : 0) + h * 60 + mod(s.t, 60) });
      }
      if (typeof act.pm !== "boolean") return no("bad_turn");
      return change({ t: (act.pm ? 720 : 0) + mod(s.t, 720) });
    }
    case "ticket": {
      if (p.goal !== "trip") return no("no_ticket");
      const h = Number(act.h), m = Number(act.m);
      if (!isInt(h) || !isInt(m) || h < 0 || h > TICKET_H || m < 0 || m > TICKET_M) return no("bad_ticket");
      return change({ th: h, tm: m });
    }
    case "put": {
      if (p.goal !== "podium") return no("no_podium");
      const lane = Number(act.lane), at = Number(act.at), n = p.runners.length;
      if (!isInt(lane) || !isInt(at) || lane < 0 || lane >= n || at < 0 || at >= n) return no("bad_step");
      const order = [...s.order], from = order.indexOf(lane);
      if (from === at) return no("same_step");
      if (from >= 0) order[from] = order[at];   // a runner already on the podium swaps with the one on that step
      order[at] = lane;
      return change({ order });
    }
    case "pick": {
      if (p.goal !== "days") return no("no_calendar");
      const day = Number(act.day);
      if (!isInt(day) || day < 1 || day > p.days) return no("off_month");
      return change({ pick: day });
    }
    case "run": {
      if (s.ended) return no("change_first");
      const su = setupOf(s);
      if (p.goal === "trip" && s.th * 60 + s.tm === 0) return no("ticket_first");
      if (p.goal === "podium" && s.order.some((l) => l < 0)) return no("podium_first");
      if (p.goal === "days" && !s.pick) return no("flag_first");
      const runs = s.runs + 1, ok = judge(p, su);
      const end = bump({ ...s, ended: true, runs, done: ok });
      const f: Facts = { goal: p.goal, run: runs };
      if (ok) { out.push(mom("solved", seq, f)); return { state: end, moments: out }; }
      for (const mal of Object.keys(level.mal)) {
        const m = malSetup(p, mal);
        if (m && sameSetup({ ...su, ...m }, su)) { out.push(mom("misconception_consequence", seq, f, mal)); return { state: end, moments: out, refused: "missed" }; }
      }
      // one 5-minute step / one day / two neighbours swapped away: near
      const off = clockGoal(p.goal) ? Math.min(mod(s.t - want(p), DAY), mod(want(p) - s.t, DAY)) <= 5
        : p.goal === "trip" ? Math.abs(s.th * 60 + s.tm - want(p)) <= 5
        : p.goal === "days" ? Math.abs(s.pick - want(p)) === 1
        : s.order.filter((l, i) => l !== raceOrder(p)[i]).length === 2;
      out.push(mom(off ? "near_miss" : "law_refused", seq, { ...f, why: "run_missed" }));
      return { state: end, moments: out, refused: "missed" };
    }
  }
  return no("unknown_act");
}
const goalMet = (_l: PlayLevel<GhadiParams>, s: GhadiState) => s.done;

/** the acts that commit a set-up from the level's start, then run */
export function setupActs(p: GhadiParams, su: Setup): GhadiAct[] {
  const acts: GhadiAct[] = [];
  if (clockGoal(p.goal) && su.t !== undefined) {
    // a.m. / p.m. on the strip, the hour hand to its sector, then the minute hand wound the short way (never past 12: the
    // hour stays). The geared law keeps the hour while the minute hand turns inside the hour
    const t = su.t;
    if (isPm(p.start) !== isPm(t)) acts.push({ kind: "half", pm: isPm(t) });
    const h = Math.floor(mod(t, 720) / 60);
    if (Math.floor(mod(p.start, 720) / 60) !== h) acts.push({ kind: "hour", h });
    const by = mod(t, 60) - mod(p.start, 60);
    if (by) acts.push({ kind: "wind", by });
  } else if (p.goal === "trip") acts.push({ kind: "ticket", h: su.th ?? 0, m: su.tm ?? 0 });
  else if (p.goal === "days") acts.push({ kind: "pick", day: su.pick ?? 0 });
  else (su.order ?? []).forEach((lane, at) => acts.push({ kind: "put", lane, at }));
  acts.push({ kind: "run" });
  return acts;
}
function solveSetup(p: GhadiParams): Setup {
  if (clockGoal(p.goal)) return { t: want(p) };
  if (p.goal === "trip") { const d = want(p); return { th: Math.floor(d / 60), tm: d % 60 }; }
  if (p.goal === "days") return { pick: want(p) };
  return { order: raceOrder(p) };
}
function solve(level: PlayLevel<GhadiParams>): GhadiAct[] | null {
  const su = solveSetup(level.params);
  return legal(level.params, su) ? setupActs(level.params, su) : null;
}
/**
 * Set-ups that win without the idea: the clock left as it starts, only its hour set, only its minutes set, only its half
 * flipped; the departure's own minutes or hours as the trip; the ticket of the plain hour gap; the lanes as they stand, or
 * reversed; the flag on today, on the number said, or one hop per week and per day. A level any of them solves is never
 * served.
 */
export function shortcutSetups(p: GhadiParams): Setup[] {
  const tries: Setup[] = [];
  if (clockGoal(p.goal)) {
    const w = want(p), s0 = p.start;
    tries.push({ t: s0 }, { t: (isPm(s0) ? 720 : 0) + (Math.floor(mod(w, 720) / 60)) * 60 + mod(s0, 60) }, { t: s0 - mod(s0, 60) + mod(w, 60) }, { t: mod(s0 + 720, DAY) });
    if (p.say === "hm") { const [H, M] = durParts(p.dur, p.say); tries.push({ t: mod(p.at + (p.goal === "arrive" ? 1 : -1) * M, DAY) }, { t: mod(p.at + (p.goal === "arrive" ? 1 : -1) * 60 * H, DAY) }); }
  } else if (p.goal === "trip") {
    const dh = hour12(p.to) - hour12(p.at);
    tries.push({ th: Math.max(0, dh), tm: 0 });
    if (dh > 0) tries.push({ th: 0, tm: Math.abs(mod(p.to, 60) - mod(p.at, 60)) });
  } else if (p.goal === "days") {
    tries.push({ pick: p.today }, { pick: p.ahead });
    if (p.weeks) tries.push({ pick: p.today + Math.floor(p.ahead / 7) + (p.ahead % 7) });
  } else {
    const lanes = p.runners.map((_, i) => i);
    tries.push({ order: lanes }, { order: [...lanes].reverse() });
  }
  return tries;
}
function shortcut(level: PlayLevel<GhadiParams>): GhadiAct[] | null {
  const p = level.params;
  for (const t of shortcutSetups(p)) {
    if (t.t !== undefined) t.t = mod(t.t, DAY);
    if (legal(p, t) && judge(p, t)) return setupActs(p, t);
  }
  return null;
}
function malActs(level: PlayLevel<GhadiParams>, mal: string): GhadiAct[] | null {
  const m = malSetup(level.params, mal);
  return m ? setupActs(level.params, m) : null;
}

interface GhadiGrammar {
  /** run: how trip lengths are written; podium: the runners' formats (one level draws one family of them) */
  says?: DurSay[]; fmts?: RunFmt[][];
  /** hands: the share of noon / midnight boards (12:xx) */
  noon?: number;
}
function difficultyOf(p: GhadiParams): number {
  const f = 0.08 * (p.face - 1);
  switch (p.goal) {
    case "hands": return Math.min(1, 0.2 + f + (mod(p.at, 60) >= 35 ? 0.1 : 0) + (hour12(p.at) === 12 ? 0.15 : 0));
    case "arrive": case "leave": return Math.min(1, 0.3 + f + (p.goal === "leave" ? 0.1 : 0) + 0.02 * Math.floor(p.dur / 30) + (isPm(p.at) !== isPm(want(p)) ? 0.1 : 0));
    case "trip": return Math.min(1, 0.35 + f + 0.03 * Math.floor((p.to - p.at) / 30) + (mod(p.to, 60) < mod(p.at, 60) ? 0.1 : 0));
    case "podium": return Math.min(1, 0.25 + 0.08 * p.runners.length + (p.runners.some((r) => r.fmt === "ms") ? 0.1 : 0) + (p.runners.some((r) => r.fmt === "d2") ? 0.1 : 0));
    case "days": return Math.min(1, 0.2 + 0.02 * p.ahead + (p.weeks ? 0.1 : 0));
  }
}
function generate(req: GenRequest): Candidate<GhadiParams>[] {
  const g = req.grammar as GhadiGrammar;
  const mode = (["set", "run", "race", "calendar"] as const).find((m) => m === req.mode) ?? "set";
  const goal = (GOALS_OF[mode].includes(req.goal as GhadiGoal) ? req.goal : GOALS_OF[mode][0]) as GhadiGoal;
  const rnd = mulberry32(req.seed), out: Candidate<GhadiParams>[] = [], seen = new Set<string>();
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const face = req.fade as 1 | 2 | 3;
  const base: GhadiParams = { goal, face, ...ZERO };
  const mk = (params: GhadiParams, sig: string): Candidate<GhadiParams> => ({
    signature: sig, difficulty: difficultyOf(params),
    level: { v: "play@1", levelId: `ghadi-${sig}-${req.seed}`.replace(/[^a-z0-9:/.,_-]/gi, "_"), family: "ghadi", mode, topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "ghadi", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } },
  });
  const says = (g.says ?? ["hm", "min"]).filter((x) => SAYS.includes(x));
  const fmtSets = (g.fmts ?? [["s"], ["d1", "d2"], ["s", "ms"]]).filter((xs) => xs.length && xs.every((x) => FMTS.includes(x)));
  const five = (lo: number, hi: number) => 5 * int(Math.ceil(lo / 5), Math.floor(hi / 5));
  for (let k = 0; k < 120 && out.length < 24; k++) {
    let params: GhadiParams | null = null, sig = "";
    if (goal === "hands") {
      // probes: minutes 5 / 10 (the minute-number belief), past the half (hour-next), the 12 o'clock hour (noon-am)
      const r = rnd(), half = rnd() < 0.5 ? 0 : 720;
      const h = r < (g.noon ?? 0.25) ? 0 : int(1, 11);
      const m = r < 0.55 ? pickOf([5, 10]) : r < 0.85 ? five(35, 55) : five(15, 30);
      const at = half + h * 60 + m;
      let start = -1;
      for (let tries = 0; tries < 20 && start < 0; tries++) {
        const s = int(0, 1) * 720 + int(0, 11) * 60 + five(0, 55);
        if (hour12(s) !== hour12(at) && mod(s, 60) !== mod(at, 60)) start = s;
      }
      if (start < 0) continue;
      params = { ...base, start, at }; sig = `hands:${at}:${start}`;
    } else if (goal === "arrive" || goal === "leave") {
      const say = pickOf(says);
      const dur = say === "hm" ? 60 * int(1, 3) + five(5, 55) : say === "min" ? five(65, 115) : say === "dec" ? pickOf([30, 90, 150]) : say === "quarter" ? 15 : 45;
      // the board's time on the 5-minute grid, morning to night; the minutes chosen so the belief's slip shows most times
      const M = durParts(dur, say)[1];
      let at = 60 * int(5, 21) + five(0, 55);
      if (goal === "arrive" && say !== "dec" && rnd() < 0.75) at = at - mod(at, 60) + five(Math.max(0, 60 - M), 55);   // past the hour: a carry
      if (goal === "leave" && rnd() < 0.75) at = at - mod(at, 60) + five(0, Math.max(0, (M % 60) - 5));               // a borrow
      if (goal === "arrive" ? at + dur >= DAY : at - dur < 0) continue;
      params = { ...base, start: at, at, dur, say }; sig = `${goal}:${at}:${dur}:${say}`;
    } else if (goal === "trip") {
      const at = 60 * int(6, 18) + five(0, 55);
      let to = at + five(25, 230);
      if (rnd() < 0.7) to = to - mod(to, 60) + five(0, Math.max(0, mod(at, 60) - 5));   // the arrival's minutes below the departure's
      if (to <= at || to >= DAY || (to - at) % 60 === 0 || to - at > TICKET_H * 60) continue;
      params = { ...base, at, to }; sig = `trip:${at}:${to}`;
    } else if (goal === "days") {
      const days = pickOf([28, 30, 31, 31]), first = int(0, 6), weeks = rnd() < 0.45;
      const ahead = weeks ? int(8, 20) : int(3, 13);
      if (weeks && ahead % 7 < 2) continue;   // "1 week and 1 day" never: the days part is always 2 or more
      const today = int(1, days - ahead);
      params = { ...base, days, first, today, ahead, weeks }; sig = `days:${days}:${first}:${today}:${ahead}:${weeks ? 1 : 0}`;
    } else {
      const fmts = pickOf(fmtSets), n = int(3, 4), runners: Runner[] = [];
      const w = int(11, 19);
      // the probes first: a two-decimal time below a one-decimal one with the bigger tail (12.45 / 12.5); a minutes time
      // below a seconds one that reads bigger as hundreds (1 min 5 s / 70 s)
      if (fmts.includes("d1") && fmts.includes("d2")) {
        const a = int(1, 8);
        const d2 = w * 100 + a * 10 + int(1, 9), d1 = w * 100 + (a + 1) * 10;
        if (Number(String(d2 % 100).padStart(2, "0")) > (a + 1)) runners.push({ cs: d2, fmt: "d2" }, { cs: d1, fmt: "d1" });
      }
      if (fmts.includes("ms")) { const s = int(62, 85); runners.push({ cs: s * 100, fmt: "ms" }, { cs: int(s + 1, 99) * 100, fmt: "s" }); }
      let guard = 0;
      while (runners.length < n && guard++ < 40) {
        const f = pickOf(fmts);
        const cs = f === "ms" ? int(61, 130) * 100 : f === "s" ? (fmts.includes("ms") ? int(55, 130) : int(w - 3, w + 6)) * 100 : f === "d1" ? w * 100 + int(0, 9) * 10 + (int(0, 1) ? 0 : 100) : w * 100 + int(1, 99) + (int(0, 1) ? 0 : 100);
        if (f === "d2" && cs % 10 === 0) continue;
        if (runners.some((r) => r.cs === cs)) continue;
        runners.push({ cs, fmt: f });
      }
      if (runners.length !== n) continue;
      for (let i = runners.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [runners[i], runners[j]] = [runners[j], runners[i]]; }
      params = { ...base, runners }; sig = `podium:${runners.map((r) => `${r.cs}${r.fmt}`).join(",")}`;
    }
    if (!params || seen.has(sig)) continue;
    seen.add(sig);
    const cand = mk(params, sig);
    const v = validate(cand.level);
    if (!v || !solve(v) || shortcut(v)) continue;
    out.push(cand);
  }
  return out;
}

function facts(level: PlayLevel<GhadiParams>, s: GhadiState): Facts {
  const p = level.params, f: Facts = { goal: p.goal };
  if (clockGoal(p.goal)) { f.clock = clockText(s.t); f.half = halfText(s.t); }
  if (p.goal === "trip" && s.th * 60 + s.tm > 0) f.ticket = `${s.th} h ${s.tm} min`;
  if (p.goal === "podium") f.placed = s.order.filter((l) => l >= 0).length;
  if (p.goal === "days" && s.pick) f.flag = s.pick;
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<GhadiParams>, s: GhadiState) {
  const p = level.params, lines: string[] = [];
  const T = (t: number) => `${clockText(t)} ${halfText(t)}`;
  const D = () => { const [h, m] = durParts(p.dur, p.say); return p.say === "dec" ? `${p.dur / 60} h` : p.say === "quarter" ? "1/4 h" : p.say === "threeq" ? "3/4 h" : h ? `${h} h ${m} min` : `${m} min`; };
  if (p.goal === "hands") lines.push(`bell: ${T(p.at)}`, `clock: ${T(s.t)}`);
  if (p.goal === "arrive") lines.push(`leaves: ${T(p.at)}`, `trip: ${D()}`, `arrives: ${T(s.t)}`);
  if (p.goal === "leave") lines.push(`arrives: ${T(p.at)}`, `trip: ${D()}`, `leaves: ${T(s.t)}`);
  if (p.goal === "trip") lines.push(`leaves: ${T(p.at)}`, `arrives: ${T(p.to)}`, `ticket: ${s.th} h ${s.tm} min`);
  if (p.goal === "podium") { p.runners.forEach((r, i) => lines.push(`${i + 1}: ${runText(r)}`)); lines.push(`podium: ${s.order.map((l) => (l < 0 ? "–" : l + 1)).join(", ")}`); }
  if (p.goal === "days") lines.push(`today: ${p.today}`, p.weeks ? `in ${Math.floor(p.ahead / 7)} w ${p.ahead % 7} d` : `in ${p.ahead} days`, `flag: ${s.pick || "–"}`);
  return { title: "Ghadi", lines };
}
function grade(level: PlayLevel<GhadiParams>, acts: PlayActEnvelope<GhadiAct>[]): PlayGrade {
  return gradeLevel(ghadiLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const ghadiLogic: FamilyLogic<GhadiParams, GhadiState, GhadiAct> = {
  family: "ghadi", modes: ["set", "run", "race", "calendar"], malRules: GHADI_MAL,
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
