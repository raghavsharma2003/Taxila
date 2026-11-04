// The household allocator, reduced v1 (round 7 F; main 2026-11-04; household.md §3.2, CONDUCTOR.md §4.4 "Siblings on
// one phone"). Siblings the parent says share one phone get each their own window on that phone, younger first.
//
// v1, as approved: allocate() is PURE and runs synchronously inside a sibling's own plan step (view.js loads the
// siblings' conductor_state rows and serves THIS child's window as the view key household.window), so there are no new
// tables, no inbox, no worker pass and no courier events. It is recorded in the decision's view snapshot like every other
// key, so a replay is exact. Not in v1 (household.md §3.3): presence-wins re-flow when a sibling starts early or out of
// order, overrun re-flow, the 60 s debounce and the 10-min hysteresis against a delivered window (v1 delivers nothing, it
// recomputes). Reversal: dc-r7-household-v1.
//
// What a child ever sees of this: nothing. Her plan's sitting simply starts later; no sibling id, name, band, length or
// count reaches her plan, brief or screen (V30).
import { BAND } from "./config.js";
import { dayKindLookup, dayMin, fromDayMin, learningWindow, localTime, minTime } from "./clock.js";

export const HANDOVER_MIN = 5;     // [U] household.md §3.2
export const MIN_WINDOW_MIN = 3;   // a window shorter than this is 'none'

/**
 * PURE. One sibling's allocator input from her conductor state, for `day`, at `now` (all times in learning-day minutes).
 * @param {import('./state.js').ConductorState} s
 * @param {{ day: string, now: Date, calendar?: Record<string, string> }} x
 * @returns {{ ref: string, classLevel: number, earliest: number, latestEnd: number, requestedMin: number, occupied: [number, number] | null, done: boolean }}
 */
export function memberOf(s, { day, now, calendar = {} }) {
  const b = BAND[s.band];
  const cal = dayKindLookup(s.school?.dayOverrides ?? {}, calendar);
  const win = learningWindow(s.routine, { ...s.limits, allowedTo: minTime(s.limits.allowedTo, b.allowedTo) }, day, cal);
  const plan = s.plan?.day === day ? s.plan : null;
  const lesson = plan?.slots?.find((x) => x.kind === "live_lesson") ?? null;
  const requestedMin = Number(lesson?.targetMin) || b.sessionMin;
  const nowDM = dayMin(localTime(now, s.tz));
  let occupied = null;
  if (s.mode === "in_lesson" && s.lesson?.since) {
    const from = dayMin(localTime(new Date(s.lesson.since), s.tz));
    occupied = [from, Math.max(nowDM, from + requestedMin)];
  }
  const done = !!(lesson && plan.doneSlotIds?.includes(lesson.id)) && !occupied;
  return { ref: s.childId, classLevel: s.classLevel, earliest: dayMin(win.from), latestEnd: dayMin(win.to), requestedMin, occupied, done };
}

/**
 * PURE. Lay the members' windows on one phone (household.md §3.2, v1): sittings in progress are fixed; the rest are
 * placed by list scheduling, younger first (class, then ref), each at the first gap from the cursor clear of every placed
 * interval plus the hand-over, clipped to her latestEnd; shorter than MIN_WINDOW_MIN → 'none'. A member done for the day
 * gets nothing. No clock, no randomness: `nowDM` is an input (floored to 5 min by the caller).
 * @param {ReturnType<typeof memberOf>[]} members
 * @param {{ nowDM: number }} x
 * @returns {Record<string, { state: 'planned'|'none'|'in_lesson'|'done', from?: string, to?: string }>}
 */
export function allocate(members, { nowDM }) {
  const out = {};
  const placed = [];                                          // [from, to) intervals on the phone
  for (const m of members) {
    if (m.occupied) { placed.push(m.occupied); out[m.ref] = { state: "in_lesson", from: fromDayMin(m.occupied[0]), to: fromDayMin(m.occupied[1]) }; }
    else if (m.done) out[m.ref] = { state: "done" };
  }
  const order = members.filter((m) => !m.occupied && !m.done)
    .sort((a, b) => a.classLevel - b.classLevel || (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0));
  const clash = (a, b) => placed.find(([p, q]) => a < q + HANDOVER_MIN && b + HANDOVER_MIN > p);
  let cursor = nowDM;
  const left = [...order];
  while (left.length) {
    // the first child (in order) who can start at the cursor; else jump to the smallest earliest
    let i = left.findIndex((m) => m.earliest <= cursor);
    if (i < 0) { cursor = Math.min(...left.map((m) => m.earliest)); i = left.findIndex((m) => m.earliest <= cursor); }
    const m = left.splice(i, 1)[0];
    let from = Math.max(cursor, m.earliest);
    for (let c = clash(from, from + m.requestedMin); c; c = clash(from, from + m.requestedMin)) from = c[1] + HANDOVER_MIN;
    const to = Math.min(from + m.requestedMin, m.latestEnd);
    if (to - from < MIN_WINDOW_MIN) { out[m.ref] = { state: "none" }; continue; }
    placed.push([from, to]);
    out[m.ref] = { state: "planned", from: fromDayMin(from), to: fromDayMin(to) };
    cursor = to + HANDOVER_MIN;
  }
  return out;
}

/**
 * PURE. This child's household window from her and her sharing siblings' states, or null when she shares with nobody.
 * Only the window comes back (V30): never who else, how many, or how long.
 * @param {string} childId @param {import('./state.js').ConductorState[]} states  every state of the guardian's children
 * @param {{ day: string, now: Date, calendar?: Record<string, string> }} x
 */
export function householdWindowOf(childId, states, { day, now, calendar = {} }) {
  const sharing = states.filter((s) => s?.household?.shared);
  if (!sharing.some((s) => s.childId === childId) || sharing.length < 2) return null;
  const self = sharing.find((s) => s.childId === childId);
  const nowDM = Math.floor(dayMin(localTime(now, self.tz)) / 5) * 5;
  const w = allocate(sharing.map((s) => memberOf(s, { day, now, calendar })), { nowDM })[childId];
  return w && w.state === "planned" ? { state: "planned", from: w.from, to: w.to } : { state: w?.state ?? "none" };
}

