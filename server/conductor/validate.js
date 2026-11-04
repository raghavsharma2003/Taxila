// The plan validator (CONDUCTOR.md §4.5), the M0 rules. Each has a negative-control fixture in
// tests/conductor-planner.test.mjs. A rejected plan is never adopted: decide() logs plan.rejected{rule} and
// falls back to the frozen slots only (a plan that cannot be wrong).
import { BAND, PLAN } from "./config.js";
import { jcs } from "./ids.js";
import { dayMin, daysBetween, localTime } from "./clock.js";
import { R5, R9 } from "./adapt.js";
import { teachingEnd } from "./planner.js";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * @param {any} plan     planDay(inputs).plan
 * @param {any} inputs   the PlannerInputs it was built from
 * @param {{ childId: string, now?: Date, tz?: string }} ctx  now/tz: the real current instant for V2
 * @returns {Array<{ rule: string, detail: string }>}
 */
export function validatePlan(plan, inputs, { childId, now, tz } = {}) {
  const out = [];
  const bad = (rule, detail) => out.push({ rule, detail });
  const b = BAND[inputs.child.band];
  const sum = plan.slots.reduce((a, s) => a + s.targetMin, 0);
  // V1: plannedMin ≤ capMin over ALL slot kinds; homework under the band sub-cap.
  if (sum !== plan.plannedMin) bad("V1", `plannedMin ${plan.plannedMin} ≠ Σ slots ${sum}`);
  if (plan.plannedMin > plan.capMin) bad("V1", `plannedMin ${plan.plannedMin} > cap ${plan.capMin}`);
  const hw = plan.slots.filter((s) => s.kind === "homework_help").reduce((a, s) => a + s.targetMin, 0);
  if (hw > b.hwSubCapMin) bad("V1", `homework ${hw} > sub-cap ${b.hwSubCapMin}`);
  // V2: inside allowed hours ∩ learning window; no teaching after bedtime − 60; never a window already gone.
  // Compared in minutes since the 04:00 learning-day anchor (clock.dayMin), never as 'HH:MM' strings: 00:30
  // is AFTER 20:30 in a learning day. With ctx.now (decide passes the batch's recorded now), a new slot must
  // also start no earlier than the real current instant and end after it.
  const end = dayMin(teachingEnd(inputs));
  const nowDM = now && tz ? dayMin(localTime(now, tz)) : null;
  const wFrom = dayMin(inputs.window.from), wTo = dayMin(inputs.window.to);
  for (const s of plan.slots) {
    if (inputs.frozen.slots.some((f) => f.id === s.id)) continue;   // frozen slots were valid when shown (V10 wins)
    const from = dayMin(s.window[0]), to = dayMin(s.window[1]);
    if (from < wFrom || to > wTo || from >= to) bad("V2", `slot ${s.id} window ${s.window[0]}-${s.window[1]} outside ${inputs.window.from}-${inputs.window.to}`);
    if (to > end) bad("V2", `slot ${s.id} ends after bedtime − 60 (${teachingEnd(inputs)})`);
    if (nowDM !== null && (from < nowDM - 15 || to <= nowDM)) bad("V2", `slot ${s.id} window ${s.window[0]}-${s.window[1]} already past at ${localTime(now, tz)}`);
  }
  // V3: realtime wanted within the REMAINING tier budget (tier month − month-to-date use, planner.remainingVoice).
  // The inputs' figure is authoritative: a plan cannot raise its own budget.
  const rt = plan.slots.reduce((a, s) => a + (s.voiceSecWanted?.realtime || 0), 0);
  const rtBudget = Math.min(plan.voiceBudgetSec?.realtime ?? 0, inputs.voice?.voiceBudgetSec?.realtime ?? Infinity);
  if (rt > rtBudget) bad("V3", `realtime ${rt}s > remaining budget ${rtBudget}s`);
  // V4: homework help never on realtime (the leak guard must be a pre-check).
  for (const s of plan.slots) {
    if (s.kind === "homework_help" && (s.segments || []).some((g) => g.laneWanted === "realtime" || g.laneWanted === "realtime_mini")) bad("V4", `slot ${s.id} homework on realtime`);
  }
  // V10: a shown or started slot is frozen for the day.
  for (const f of inputs.frozen.slots) {
    const now = plan.slots.find((s) => s.id === f.id);
    if (!now) bad("V10", `frozen slot ${f.id} dropped`);
    else if (jcs(now) !== jcs(f)) bad("V10", `frozen slot ${f.id} changed`);
  }
  // V12: no catch-up debt: never above a normal day's plan.
  if (plan.plannedMin > b.sessionMin + PLAN.burstMaxMin) bad("V12", `plannedMin ${plan.plannedMin} above a normal day`);
  // V15: adaptive knobs inside their bounds.
  for (const s of plan.slots) {
    const nb = s.pace?.newSkillBudget;
    if (nb !== undefined && (![0, 1, 2].includes(nb) || (inputs.child.band === "B1" && nb > 1))) bad("V15", `slot ${s.id} newSkillBudget ${nb}`);
    if (s.kind === "live_lesson") {
      const minSet = b.segments.filter((g) => g[3]).map((g) => g[0]);
      for (const k of minSet) if (!(s.segments || []).some((g) => g.kind === k)) bad("V15", `slot ${s.id} lacks minimum segment ${k}`);
      if (s.targetMin > b.sessionMin) bad("V15", `slot ${s.id} ${s.targetMin} min > band session ${b.sessionMin}`);
    }
  }
  // round 7 F: the R5 and R9 knobs (adapt.js)
  const fired = new Set((plan.adapt?.rules ?? []).map((r) => r.rule));
  const tw = inputs.school?.testWindows?.[0] ?? null;
  for (const s of plan.slots) {
    // V15: the foundation share stays inside its bound
    if (s.foundationShare !== undefined && !(s.foundationShare > 0 && s.foundationShare <= R9.max)) bad("V15", `slot ${s.id} foundationShare ${s.foundationShare}`);
    // V16: an adaptive knob away from R0 carries its firing
    if (s.prereqCheck && !fired.has("R5")) bad("V16", `slot ${s.id} prereqCheck without an R5 firing`);
    if (s.foundationShare !== undefined && !fired.has("R9")) bad("V16", `slot ${s.id} foundationShare without an R9 firing`);
    // V18: a prerequisite check at most once per lesson, never for a skill checked within the re-check gap
    if (s.prereqCheck && (inputs.adapt?.prereqChecked ?? []).includes(s.prereqCheck.skillId)) bad("V18", `slot ${s.id} re-checks ${s.prereqCheck.skillId} within ${R5.recheckDays} d`);
    // V20: no new skill in the last 2 days of a test window
    if (tw && (s.pace?.newSkillBudget ?? 0) > 0 && daysBetween(inputs.day.learningDay, tw.to) < 2) bad("V20", `slot ${s.id} newSkillBudget ${s.pace.newSkillBudget} in the last 2 days of a test window`);
  }
  // V30 (and V14's spirit): no other child's id anywhere in the plan.
  for (const m of jcs(plan).match(UUID) || []) if (m.toLowerCase() !== String(childId).toLowerCase()) bad("V30", `foreign id ${m.slice(0, 8)}…`);
  return out;
}
