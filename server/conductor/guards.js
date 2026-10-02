// Ordered guards (CONDUCTOR.md §3.4, §1.1 rule 4): safety > consent > parent controls > law/policy caps >
// cost governor. A guard may DROP or NARROW a command, never add or widen one, and every drop/narrowing is
// logged in decision_log.decisions[].blocked. A lower guard never re-enables what a higher one blocked:
// guards run in order on the survivors of the previous guard.
import { JOB_KINDS } from "./config.js";

const RT = new Set(["realtime", "realtime_mini"]);

/** A plan reduced to a rest day: only already-frozen slots survive (V10), nothing new is offered. */
export function narrowToRest(cmd, state) {
  const keep = new Set(state.plan?.day === cmd.day ? [...state.plan.shownSlotIds, ...state.plan.startedSlotIds] : []);
  const slots = cmd.plan.slots.filter((s) => keep.has(s.id));
  return { ...cmd, plan: { ...cmd.plan, mode: "rest_day", slots, plannedMin: slots.reduce((a, s) => a + s.targetMin, 0) } };
}

const jobAllowedIn = (kind, mode) => (JOB_KINDS[kind]?.allowedIn || []).includes(mode);

function safetyGuard(cmd, s) {
  if (s.mode !== "safety_hold") return { cmd };
  switch (cmd.kind) {
    case "enqueue": return jobAllowedIn(cmd.job.kind, "safety_hold") ? { cmd } : { drop: "safety_hold" };
    case "notify": case "brief.refresh": return { drop: "safety_hold" };      // the protocol decides, never the plan
    case "plan.adopt": return cmd.plan.mode === "rest_day" ? { cmd } : { cmd: narrowToRest(cmd, s), narrowed: "safety_hold" };
    default: return { cmd };
  }
}

/** §3.6 sticky fail-safe: until an operator clears it, nothing new is offered and no work is queued. */
function failSafeGuard(cmd, s) {
  if (!s.failSafe) return { cmd };
  if (cmd.kind === "enqueue") return { drop: "fail_safe" };
  if (cmd.kind === "plan.adopt" && cmd.plan.mode !== "rest_day") return { cmd: narrowToRest(cmd, s), narrowed: "fail_safe" };
  return { cmd };
}

function consentGuard(cmd, s) {
  if (cmd.kind === "enqueue") {
    const p = JOB_KINDS[cmd.job.kind]?.purpose;
    if (p && !s.consent[p]) return { drop: `consent:${p}` };
  }
  if (cmd.kind === "plan.adopt" && !s.consent.core_tutoring && cmd.plan.mode !== "rest_day") return { cmd: narrowToRest(cmd, s), narrowed: "consent:core_tutoring" };
  return { cmd };
}

function parentControlGuard(cmd, s) {
  if (s.mode !== "paused") return { cmd };
  if (cmd.kind === "enqueue" && !jobAllowedIn(cmd.job.kind, "paused")) return { drop: "parent_pause" };
  if (cmd.kind === "plan.adopt" && cmd.plan.mode !== "rest_day") return { cmd: narrowToRest(cmd, s), narrowed: "parent_pause" };
  return { cmd };
}

function policyCapGuard(cmd, s) {
  // The Notifier and its slot caps are M1 (§10.2); at M0 only safety/account intents may enter the outbox.
  if (cmd.kind === "notify" && !["safety", "account"].includes(cmd.intent?.class)) return { drop: "notifier_m1_pull_only" };
  // In a lesson, only low-priority work for this child (§3.2 background-jobs row).
  if (cmd.kind === "enqueue" && s.mode === "in_lesson" && !jobAllowedIn(cmd.job.kind, "in_lesson")) return { drop: "in_lesson" };
  return { cmd };
}

function governorGuard(cmd, s) {
  if (cmd.kind !== "plan.adopt" || !s.budget.low) return { cmd };
  const frozen = new Set(s.plan?.day === cmd.day ? [...s.plan.shownSlotIds, ...s.plan.startedSlotIds] : []);
  let changed = false;
  const slots = cmd.plan.slots.map((sl) => {
    if (frozen.has(sl.id) || !(sl.segments || []).some((g) => RT.has(g.laneWanted))) return sl;
    changed = true;
    const segments = sl.segments.map((g) => (RT.has(g.laneWanted) ? { ...g, laneWanted: "cascade" } : g));
    const v = {};
    for (const g of segments) if (g.laneWanted !== "tap") v[g.laneWanted] = (v[g.laneWanted] || 0) + g.minutes * 60;
    return { ...sl, segments, voiceSecWanted: v };
  });
  return changed ? { cmd: { ...cmd, plan: { ...cmd.plan, slots } }, narrowed: "budget_low" } : { cmd };
}

export const GUARDS = [["safety", safetyGuard], ["failSafe", failSafeGuard], ["consent", consentGuard], ["parentControl", parentControlGuard],
  ["policyCap", policyCapGuard], ["governor", governorGuard]];

/** Run the guards in authority order → { kept, blocked }. */
export function runGuards(commands, state) {
  const kept = [], blocked = [];
  for (const c0 of commands) {
    let c = c0, dropped = false;
    for (const [name, g] of GUARDS) {
      const r = g(c, state);
      if (r.drop) { blocked.push({ cmd: summarize(c), guard: name, reason: r.drop }); dropped = true; break; }
      if (r.narrowed) blocked.push({ cmd: summarize(c), guard: name, reason: `narrowed:${r.narrowed}` });
      c = r.cmd;
    }
    if (!dropped) kept.push(c);
  }
  return { kept, blocked };
}

/** A command's identity for the log (no plan bodies in decisions[].blocked). */
export const summarize = (c) =>
  c.kind === "plan.adopt" ? { kind: c.kind, day: c.day, version: c.version }
  : c.kind === "enqueue" ? { kind: c.kind, job: c.job.kind, idem: c.job.idemKey }
  : c.kind === "wakeup" ? { kind: c.kind, dedupe: c.dedupe }
  : { kind: c.kind, ...(c.code ? { code: c.code } : {}) };
