// The plan validator (CONDUCTOR.md §4.5), the M0 rules. Each has a negative-control fixture in
// tests/conductor-planner.test.mjs. A rejected plan is never adopted: decide() logs plan.rejected{rule} and
// falls back to the frozen slots only (a plan that cannot be wrong).
import { BAND, PLAN } from "./config.js";
import { jcs } from "./ids.js";
import { teachingEnd } from "./planner.js";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * @param {any} plan     planDay(inputs).plan
 * @param {any} inputs   the PlannerInputs it was built from
 * @param {{ childId: string, prevSlots?: any[] }} ctx
 * @returns {Array<{ rule: string, detail: string }>}
 */
export function validatePlan(plan, inputs, { childId, prevSlots = [] } = {}) {
  const out = [];
  const bad = (rule, detail) => out.push({ rule, detail });
  const b = BAND[inputs.child.band];
  const sum = plan.slots.reduce((a, s) => a + s.targetMin, 0);
  // V1: plannedMin ≤ capMin over ALL slot kinds; homework under the band sub-cap.
  if (sum !== plan.plannedMin) bad("V1", `plannedMin ${plan.plannedMin} ≠ Σ slots ${sum}`);
  if (plan.plannedMin > plan.capMin) bad("V1", `plannedMin ${plan.plannedMin} > cap ${plan.capMin}`);
  const hw = plan.slots.filter((s) => s.kind === "homework_help").reduce((a, s) => a + s.targetMin, 0);
  if (hw > b.hwSubCapMin) bad("V1", `homework ${hw} > sub-cap ${b.hwSubCapMin}`);
  // V2: inside allowed hours ∩ learning window; no teaching after bedtime − 60.
  const end = teachingEnd(inputs);
  for (const s of plan.slots) {
    if (inputs.frozen.slots.some((f) => f.id === s.id)) continue;   // frozen slots were valid when shown (V10 wins)
    const [from, to] = s.window;
    if (from < inputs.window.from || to > inputs.window.to || from >= to) bad("V2", `slot ${s.id} window ${from}-${to} outside ${inputs.window.from}-${inputs.window.to}`);
    if (to > end) bad("V2", `slot ${s.id} ends after bedtime − 60 (${end})`);
  }
  // V3: realtime wanted within the remaining tier budget.
  const rt = plan.slots.reduce((a, s) => a + (s.voiceSecWanted?.realtime || 0), 0);
  if (rt > (plan.voiceBudgetSec?.realtime ?? 0)) bad("V3", `realtime ${rt}s > budget ${plan.voiceBudgetSec?.realtime ?? 0}s`);
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
  // V30 (and V14's spirit): no other child's id anywhere in the plan.
  for (const m of jcs(plan).match(UUID) || []) if (m.toLowerCase() !== String(childId).toLowerCase()) bad("V30", `foreign id ${m.slice(0, 8)}…`);
  void prevSlots;
  return out;
}
