// decide(state, event, ctx) → { state', commands, rulesFired, blocked, viewRead }: PURE (CONDUCTOR.md §3.4).
// Inputs only: (state, event, ctx = { now, view }). No Date.now, Math.random, env or I/O; the input state is
// never mutated. Handlers propose candidate commands; GUARDS (authority order) drop or narrow them; the
// surviving plan.adopt is what state.plan records. step.js gives decide one recorded `now` per batch.
import { JOB_KINDS, PLAN, REPORT_GRACE_MIN, WAKE, authorityClass } from "./config.js";
import { addDays, dayMin, daysBetween, dayKindLookup, isoWeek, jitterSec, learningDay, localParts, weekday, zonedToUtc } from "./clock.js";
import { runGuards, summarize } from "./guards.js";
import { buildPlannerInputs, inputsHash, planDay } from "./planner.js";
import { validatePlan } from "./validate.js";

const BAD_CLOSE = new Set(["strained", "tired"]);
const RESUMABLE = new Set(["network", "profile_switch"]);
const LESSON_STALE_MS = 3 * 3600_000;          // an in_lesson with no lesson.ended for 3 h is closed by the clock [U]
const SKEW_MS = 30_000;                         // DB clock vs batch clock tolerance for timer handlers

/** Does this event set lower a limit (authority class, §3.6)? */
export function lowersLimit(state, ev) {
  if (ev.type !== "parent.setting_changed") return false;
  const { key, value } = ev;
  if (key === "dailyMinutes") return Number(value) < state.limits.dailyMinutes;
  // learning-day minutes, not string order: a bedtime moved from 23:30 to 00:15 is LATER, not earlier
  if (key === "hoursEnd") return dayMin(String(value)) < dayMin(state.limits.allowedTo);
  if (key === "hoursStart") return dayMin(String(value)) > dayMin(state.limits.allowedFrom);
  if (key === "bedtime") return dayMin(String(value)) < dayMin(state.routine.bedtime);
  if (key === "restDays") return Array.isArray(value) && value.some((d) => !(state.limits.restDays || []).includes(d));
  return false;
}
export const isAuthority = (state, ev) => authorityClass({ ...ev, lowers: lowersLimit(state, ev) });

/**
 * @param {import('./state.js').ConductorState} state0
 * @param {{ type: string } & Record<string, any>} ev   the event body (validated at ingest)
 * @param {{ now: Date, view: ReturnType<import('./view.js').recordingView> }} ctx
 */
export function decide(state0, ev, ctx) {
  const s = structuredClone(state0);
  const now = ctx.now, nowMs = now.getTime(), iso = now.toISOString();
  const cmds = [], rules = [];
  const cal = dayKindLookup(s.school.dayOverrides, ctx.view.get("cal.days").value || {});
  const today = learningDay(now, s.tz);

  const H = {
    cmd: (c) => cmds.push(c),
    rule: (r) => rules.push(r),
    audit: (code) => cmds.push({ kind: "audit", code }),
    wake: (reason, at, dedupe) => cmds.push({ kind: "wakeup", at: at.toISOString(), reason, dedupe }),
    /** Re-plan now (unshown slots only: frozen ones are copied verbatim, V10). */
    replanNow: (reason) => replan(s, reason, { now, view: ctx.view, cal }, H),
    /** Debounced re-plan (§3.7): one `replan:{day}` wakeup row is moved, never added. */
    replanSoon: (cause) => {
      const at = new Date(nowMs + PLAN.replanDebounceMin * 60_000);
      s.pending.replanAfter = at.toISOString(); s.pending.replanCause = cause;
      H.wake("replan", at, `replan:${today}`);
      H.rule(`replan_soon:${cause}`);
    },
    enqueue: (kind, idemKey, input, extra = {}) => {
      const k = JOB_KINDS[kind];
      if (!k) throw new Error(`unknown job kind ${kind}`);
      cmds.push({ kind: "enqueue", job: { kind, idemKey, input, lane: k.lane, priority: k.priority, budgetMicroUsd: k.budgetMicroUsd,
        maxAttempts: k.maxAttempts, leaseSec: k.leaseSec, notBeforeLessonEnd: !!k.notBeforeLessonEnd, ...extra } });
    },
    cancelJob: (kind, idemKey, reason) => cmds.push({ kind: "cancel", jobKind: kind, idemKey, reason }),
    armAhead: (fromDay) => {
      const ds = (d) => new Date(zonedToUtc(d, WAKE.dayStart.at, s.tz).getTime() + jitterSec(s.childId, "day_start", WAKE.dayStart.windowSec) * 1000);
      const nt = (d) => new Date(zonedToUtc(addDays(d, 1), WAKE.night.at, s.tz).getTime() + jitterSec(s.childId, "night", WAKE.night.windowSec) * 1000);
      const plan = [["day_start", ds(addDays(fromDay, 1)), `day_start:${addDays(fromDay, 1)}`],
        ["night", nt(fromDay), `night:${fromDay}`], ["night", nt(addDays(fromDay, 1)), `night:${addDays(fromDay, 1)}`]];
      for (const [reason, at, dedupe] of plan) if (at.getTime() > nowMs) H.wake(reason, at, dedupe);
    },
  };

  // ── day rollover: a missed `night` is caught up by the first event of a later learning day, once (§3.3) ──
  // The fold closes the OLD day but arms from TODAY: after days away every old-day wakeup is already past, so
  // arming from s.learningDay would leave no day_start/night until the next app.opened.
  if (s.learningDay && s.learningDay < today && s.adapt.foldedDay !== s.learningDay) foldNight(s, s.learningDay, H, { arm: true, armFrom: today });
  s.learningDay = today;
  // an in_lesson that never ended (crashed client) is closed by the clock, not left to block the day; a pause the
  // parent asked for mid-lesson takes effect exactly as lesson.ended would apply it (or lapses if already over)
  if (s.mode === "in_lesson" && s.lesson && nowMs - Date.parse(s.lesson.since) > LESSON_STALE_MS && ev.type !== "lesson.ended") {
    endLessonMode(s, nowMs); s.modeSince = iso; delete s.lesson; H.audit("lesson_timed_out");
  }
  if (s.resumable && Date.parse(s.resumable.until) <= nowMs) delete s.resumable;

  (HANDLERS[ev.type] || noop)(s, ev, H, { now, nowMs, iso, today });

  const { kept, blocked } = runGuards(cmds, s);
  // The surviving plan.adopt (guards may have narrowed it) is the plan of record.
  for (const c of kept) {
    if (c.kind === "plan.adopt") adoptInto(s, c);
    if (c.kind === "enqueue") s.pending.jobs[c.job.idemKey] = { kind: c.job.kind, idem: c.job.idemKey };   // only what survived the guards
  }
  return { state: s, commands: kept, rulesFired: rules, blocked, viewRead: ctx.view.recorded() };
}

function adoptInto(s, c) {
  const prev = s.plan?.day === c.day ? s.plan : null;
  s.plan = { day: c.day, version: c.version, source: c.source, inputsHash: c.inputsHash, mode: c.plan.mode, slots: c.plan.slots,
    shownSlotIds: prev?.shownSlotIds || [], startedSlotIds: prev?.startedSlotIds || [], doneSlotIds: prev?.doneSlotIds || [] };
}

/** Build, hash, validate and propose today's plan. Skips when nothing that matters changed (X43). */
function replan(s, reason, pctx, H) {
  const inputs = buildPlannerInputs(s, pctx);
  const hash = inputsHash(inputs);
  if (s.plan?.day === s.learningDay && s.plan.inputsHash === hash) { H.rule(`plan_unchanged:${reason}`); return; }
  let { plan, firings } = planDay(inputs);
  const violations = validatePlan(plan, inputs, { childId: s.childId, now: pctx.now, tz: s.tz });
  if (violations.length) {
    for (const v of violations) H.audit(`plan.rejected:${v.rule}`);
    // fall back to a plan that cannot be wrong: the frozen slots only
    const slots = inputs.frozen.slots;
    plan = { ...plan, mode: "rest_day", slots, plannedMin: slots.reduce((a, x) => a + x.targetMin, 0),
      voiceSecWanted: {}, adapt: { rules: [], rejected: violations.map((v) => v.rule) } };
    firings = [];
  }
  const version = s.plan?.day === s.learningDay ? s.plan.version + 1 : 1;
  H.cmd({ kind: "plan.adopt", day: s.learningDay, version, source: "code", inputsHash: hash, reason, plan });
  for (const f of firings) H.rule(`${f.rule}:${f.knob}`);
}

/** Close a learning day (§3.3 night): once per day; trims, expires, recounts, re-arms if not dormant (X36). */
/** Leave in_lesson: a pending pause still in the future becomes the pause; one already over lapses. */
function endLessonMode(s, nowMs) {
  if (s.pendingPause && Date.parse(s.pendingPause) > nowMs) { s.mode = "paused"; s.pauseUntil = s.pendingPause; }
  else s.mode = "free";
  delete s.pendingPause;
}

function foldNight(s, day, H, { arm, armFrom = day }) {
  const wasActive = s.counters.lastActiveDay === day || s.counters.activeDays.includes(day);
  const cut = addDays(day, -PLAN.closesMaxDays);
  s.adapt.closes = s.adapt.closes.filter((c) => c.day >= cut).slice(-PLAN.closesRing);
  s.counters.activeDays = s.counters.activeDays.filter((d) => d > addDays(day, -7)).sort();
  s.school.testWindows = s.school.testWindows.filter((w) => w.to >= day);
  const oCut = addDays(day, -PLAN.overridesKeepDays);
  s.school.dayOverrides = Object.fromEntries(Object.entries(s.school.dayOverrides).filter(([d]) => d >= oCut));
  if (s.budget.low && s.budget.since && s.budget.since.slice(0, 7) !== addDays(day, 1).slice(0, 7)) s.budget = { low: false };
  s.adapt.foldedDay = day;
  H.rule("fold_night");
  enqueueReports(s, day, H, wasActive);
  const active = s.counters.lastActiveDay || s.counters.lastOpenDay;
  if (arm) {
    if (active && daysBetween(active, day) <= PLAN.dormantDays) H.armAhead(armFrom);
    else H.rule("dormant_not_rearmed");
  }
}

/**
 * End-of-day parent reports, once per learning day (foldNight runs once per day: adapt.foldedDay). An active day gets
 * its pull-only daily note (X11); the fold of a Sunday enqueues the ISO week's letter body (X8: one idem key per child
 * and week, whatever the lessons). Both run after the day's window closes (04:00 local + grace), never before.
 */
function enqueueReports(s, day, H, active) {
  const runAfter = new Date(zonedToUtc(addDays(day, 1), "04:00", s.tz).getTime() + REPORT_GRACE_MIN * 60_000).toISOString();
  if (active) { H.enqueue("report.daily", `report.daily:${s.childId}:${day}`, { day }, { runAfter }); H.rule("report_daily"); }
  if (weekday(day) === 0) {
    const wk = isoWeek(day);
    H.enqueue("parent.letter", `parent.letter:${s.childId}:${wk}`, { isoWeek: wk }, { runAfter });
    H.rule("parent_letter");
  }
}

const markActive = (s, day) => {
  s.counters.lastActiveDay = day;
  if (!s.counters.activeDays.includes(day)) s.counters.activeDays = [...s.counters.activeDays, day].sort().slice(-7);
};
const todaysPlan = (s) => (s.plan?.day === s.learningDay ? s.plan : null);
const addId = (arr, id) => (arr.includes(id) ? arr : [...arr, id]);

function noop(s, ev, H) { H.rule(`ignored:${ev.type}`); }

const HANDLERS = {
  "app.opened"(s, ev, H, t) {
    s.counters.lastOpenDay = t.today;
    H.armAhead(t.today);                                       // also re-arms a dormant child's clock (X36)
    if (!todaysPlan(s)) H.replanNow("first_open");
    if (s.resumable) H.cmd({ kind: "brief.refresh", resumeOf: s.resumable.lessonId });
  },
  "app.closed"() {},
  "slot.shown"(s, ev, H) {
    const p = todaysPlan(s);
    if (!p || ev.planDay !== p.day || !p.slots.some((x) => x.id === ev.slotId)) return H.rule("slot_unknown");
    p.shownSlotIds = addId(p.shownSlotIds, ev.slotId);
  },
  "slot.started"(s, ev, H) {
    const p = todaysPlan(s);
    if (!p || !p.slots.some((x) => x.id === ev.slotId)) return H.rule("slot_unknown");
    p.shownSlotIds = addId(p.shownSlotIds, ev.slotId); p.startedSlotIds = addId(p.startedSlotIds, ev.slotId);
  },
  "slot.completed"(s, ev, H, t) {
    const p = todaysPlan(s);
    if (p && p.slots.some((x) => x.id === ev.slotId)) {
      p.shownSlotIds = addId(p.shownSlotIds, ev.slotId); p.startedSlotIds = addId(p.startedSlotIds, ev.slotId); p.doneSlotIds = addId(p.doneSlotIds, ev.slotId);
    }
    markActive(s, t.today);
  },
  "slot.skipped"(s, ev) {
    const p = todaysPlan(s);
    if (p && p.slots.some((x) => x.id === ev.slotId)) { p.shownSlotIds = addId(p.shownSlotIds, ev.slotId); p.doneSlotIds = addId(p.doneSlotIds, ev.slotId); }
  },
  "lesson.started"(s, ev, H, t) {
    if (s.mode === "paused" || s.mode === "safety_hold") { H.audit(`lesson_started_in_${s.mode}`); return; }
    if (s.mode === "in_lesson" && s.lesson?.lessonId !== ev.lessonId) H.audit("lesson_overlap");
    // attribute the lesson to its slot (or today's first unstarted live slot) so a re-plan freezes it
    const p = todaysPlan(s);
    const slot = p && (p.slots.find((x) => x.id === ev.slotId) || p.slots.find((x) => x.kind === "live_lesson" && !p.startedSlotIds.includes(x.id)));
    if (slot) { p.shownSlotIds = addId(p.shownSlotIds, slot.id); p.startedSlotIds = addId(p.startedSlotIds, slot.id); }
    s.mode = "in_lesson"; s.modeSince = t.iso;
    s.lesson = { lessonId: ev.lessonId, since: t.iso, ...(slot ? { slotId: slot.id } : {}) };
    if (ev.resumeOf && s.resumable?.lessonId === ev.resumeOf) delete s.resumable;
  },
  "lesson.ended"(s, ev, H, t) {
    const slotId = s.lesson?.lessonId === ev.lessonId ? s.lesson.slotId : undefined;
    if (s.mode === "in_lesson") { endLessonMode(s, t.nowMs); s.modeSince = t.iso; }
    if (s.lesson?.lessonId === ev.lessonId) delete s.lesson;
    const p = todaysPlan(s);
    if (p && slotId) p.doneSlotIds = addId(p.doneSlotIds, slotId);
    if (RESUMABLE.has(ev.reason)) {
      const until = new Date(t.nowMs + PLAN.resumeWindowMin * 60_000);
      s.resumable = { lessonId: ev.lessonId, until: until.toISOString() };
      H.wake("resume_window_end", until, `resume:${ev.lessonId}`);
    }
    H.enqueue("memory.consolidate", `memory.consolidate:${ev.lessonId}`, { lessonId: ev.lessonId });
    const vibe = ev.outcomeDigest?.vibeClose;
    if (vibe) {
      const lp = localParts(t.now, s.tz);
      s.adapt.closes = [...s.adapt.closes, { day: t.today, localHour: lp.hh, vibeClose: vibe, endedBy: ev.reason, minutes: ev.minutes,
        plannedMin: p?.slots.find((x) => x.id === slotId)?.targetMin ?? 0 }].slice(-PLAN.closesRing);
      // X45: one bad close → success-first only (segments shorten only under the R1 latch, not built at M0)
      s.adapt.successFirstNext = BAD_CLOSE.has(vibe);
      if (BAD_CLOSE.has(vibe)) H.rule("R1:successFirst");
    }
    if (ev.minutes > 0) markActive(s, t.today);
    H.replanSoon("lesson_ended");
  },
  "skill.milestone"(s, ev, H) {
    if (ev.to === "wheel_spin") H.replanSoon("wheel_spin");
    else H.rule(`milestone:${ev.to}`);
  },
  "teacher.promise"(s, ev) {
    if (s.promises.some((p) => p.id === ev.promiseId)) return;
    s.promises = [...s.promises, { id: ev.promiseId, kind: ev.what.kind, ref: ev.what.ref, by: ev.by }].slice(-PLAN.promisesMax);
  },
  "parent.setting_changed"(s, ev, H) {
    const lowers = lowersLimit(s, ev);
    const v = ev.value;
    switch (ev.key) {
      case "dailyMinutes": s.limits.dailyMinutes = v; break;           // int 10-120, refused at ingest otherwise (events.SETTING_VALUE)
      case "hoursStart": s.limits.allowedFrom = String(v); break;
      case "hoursEnd": s.limits.allowedTo = String(v); break;
      case "restDays": s.limits.restDays = [...new Set(v)].sort(); break;
      case "bedtime": s.routine.bedtime = String(v); break;
      case "schoolStart": s.routine.schoolStart = String(v); break;
      case "schoolEnd": s.routine.schoolEnd = String(v); break;
      case "wakeTime": s.routine.wakeTime = String(v); break;
      case "tz": s.tz = String(v); s.routine.tz = String(v); break;
    }
    // a lowered cap or earlier bedtime reaches a live lesson at its next segment boundary (dc AR-5 R8)
    if (lowers && s.mode === "in_lesson" && s.lesson) H.cmd({ kind: "brief.refresh", lessonId: s.lesson.lessonId });
    H.replanNow("parent_change");
  },
  "parent.pause"(s, ev, H, t) {
    if (Date.parse(ev.until) <= t.nowMs) return H.rule("pause_in_past");
    if (s.mode === "in_lesson") s.pendingPause = ev.until;              // effective when the lesson ends (pl PA-21 C5)
    else if (s.mode !== "safety_hold") { s.mode = "paused"; s.modeSince = t.iso; s.pauseUntil = ev.until; }
    else s.pauseUntil = ev.until;                                        // the hold outranks; the pause applies after it clears
    H.wake("pause_end", new Date(ev.until), `pause_end:${ev.until}`);
    H.replanNow("replan:pause");
  },
  "parent.resume"(s, ev, H, t) {
    delete s.pendingPause;
    if (s.mode === "paused") { s.mode = "free"; s.modeSince = t.iso; }
    delete s.pauseUntil;
    H.replanNow("replan:resume");
  },
  "parent.consent_changed"(s, ev, H) {
    s.consent[ev.purpose] = ev.granted;
    if (!ev.granted) {
      for (const [idem, j] of Object.entries(s.pending.jobs)) {
        if (JOB_KINDS[j.kind]?.purpose === ev.purpose) { H.cancelJob(j.kind, idem, `consent:${ev.purpose}`); delete s.pending.jobs[idem]; }
      }
    }
    if (ev.purpose === "core_tutoring") H.replanNow("replan:consent");
  },
  "school.day_override"(s, ev, H, t) {
    s.school.dayOverrides = { ...s.school.dayOverrides, [ev.date]: ev.kind };
    if (ev.date === t.today) H.replanNow("replan:day_override");
  },
  "school.test_announced"(s, ev, H) {
    const w = { subject: ev.subject, from: addDays(ev.on, -4), to: ev.on, chapters: [...ev.chapters].sort() };
    s.school.testWindows = [...s.school.testWindows.filter((x) => !(x.subject === w.subject && x.to === w.to)), w];
    H.replanSoon("test_window");
  },
  "clock.wakeup"(s, ev, H, t) {
    switch (ev.reason) {
      case "day_start": H.replanNow("day_start"); break;                  // skipped inside replan if inputsHash is unchanged
      case "night": {
        const d = ev.wakeupId?.startsWith("night:") ? ev.wakeupId.slice(6) : addDays(t.today, 0);
        if (s.adapt.foldedDay && s.adapt.foldedDay >= d) { H.rule("fold_night_already"); break; }
        foldNight(s, d, H, { arm: true });
        break;
      }
      case "replan":
        if (s.pending.replanAfter && Date.parse(s.pending.replanAfter) <= t.nowMs + SKEW_MS) {
          const cause = s.pending.replanCause || "debounce";
          delete s.pending.replanAfter; delete s.pending.replanCause;
          H.replanNow(`replan:${cause}`);
        } else H.rule("replan_not_due");
        break;
      case "pause_end":
        if (s.mode === "paused" && s.pauseUntil && Date.parse(s.pauseUntil) <= t.nowMs + SKEW_MS) {
          s.mode = "free"; s.modeSince = t.iso; delete s.pauseUntil; H.replanNow("replan:pause_end");
        } else H.rule("pause_end_noop");
        break;
      case "resume_window_end":
        if (s.resumable && Date.parse(s.resumable.until) <= t.nowMs + SKEW_MS) delete s.resumable;
        break;
      default: H.rule(`wakeup_unhandled:${ev.reason}`);
    }
  },
  "job.done"(s, ev) { if (ev.idemKey) delete s.pending.jobs[ev.idemKey]; },
  "job.failed"(s, ev, H) {
    if (ev.idemKey) delete s.pending.jobs[ev.idemKey];
    if (ev.final) H.audit(`job_failed:${ev.kind}`);                     // memory.consolidate's fallback = no memory written
  },
  "safety.incident"(s, ev, H, t) {
    // pre-empts everything (X33): every severity holds until the protocol owner rules on a split (D-SAFE)
    s.mode = "safety_hold"; s.modeSince = t.iso; s.hold = { incidentId: ev.incidentId, level: ev.severity };
    for (const [idem, j] of Object.entries(s.pending.jobs)) { H.cancelJob(j.kind, idem, "safety_hold"); delete s.pending.jobs[idem]; }
    H.audit("safety_hold_entered");
    H.replanNow("replan:safety");
  },
  "safety.incident_updated"(s, ev, H) { H.audit(`safety_updated:${ev.familyImplicated}`); },
  "safety.cleared"(s, ev, H, t) {
    if (s.mode !== "safety_hold" || s.hold?.incidentId !== ev.incidentId) return H.audit("safety_clear_mismatch");
    delete s.hold;
    if (s.pauseUntil && Date.parse(s.pauseUntil) > t.nowMs) s.mode = "paused"; else { s.mode = "free"; delete s.pauseUntil; }
    s.modeSince = t.iso;
    H.replanNow("replan:safety_cleared");
  },
  "ops.fail_safe_cleared"(s, ev, H) {
    // the ONLY way out of the sticky fail-safe (§3.6): an operator replayed and fixed the poison, then cleared it
    if (!s.failSafe) return H.rule("fail_safe_not_set");
    delete s.failSafe;
    H.audit(`fail_safe_cleared:${ev.ticket}`);
    H.replanNow("replan:fail_safe_cleared");
  },
  "budget.threshold"(s, ev, H, t) {
    if (ev.scope === "global" || ev.pct < 80) return;
    if (!s.budget.low) s.budget = { low: true, since: t.today };
    H.replanSoon("budget");                                              // the child is never told about money
  },
};

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const minTimeStr = (a, b) => (dayMin(a) <= dayMin(b) ? a : b);   // learning-day order (00:30 is after 21:30)

/**
 * §3.6: an authority event whose handler throws three times gets the minimal, dependency-free handler, and the
 * actor stays in that conservative state (s.failSafe) until an operator clears it (ops.fail_safe_cleared): while
 * it is set, the failSafe guard narrows every plan.adopt to rest and drops every enqueue (guards.js). Ops is paged
 * (console.error → App Insights), like a quarantine. The fail-safe only ever makes limits stricter.
 */
export function decideOrFailSafe(state, ev, ctx) {
  let err;
  for (let i = 0; i < 3; i++) {
    try { return decide(state, ev, ctx); } catch (e) { err = e; }
  }
  const error = String(err?.message || err).slice(0, 200);
  console.error(`[conductor] FAIL-SAFE ${state.childId} type=${ev.type}: ${error}`);
  const s = structuredClone(state);
  const cmds = [{ kind: "audit", code: `fail_safe:${ev.type}` }];
  if (ev.type === "safety.incident") { s.mode = "safety_hold"; s.hold = { incidentId: ev.incidentId, level: ev.severity }; s.modeSince = ctx.now.toISOString(); }
  else if (ev.type === "parent.consent_changed" && !ev.granted) {
    s.consent = { ...s.consent, [ev.purpose]: false };
    for (const [idem, j] of Object.entries(s.pending?.jobs || {})) if (JOB_KINDS[j.kind]?.purpose === ev.purpose) cmds.push({ kind: "cancel", jobKind: j.kind, idemKey: idem, reason: "fail_safe" });
  } else if (ev.type === "parent.pause" && s.mode !== "safety_hold") {
    const until = Date.parse(ev.until);
    if (Number.isFinite(until) && until > ctx.now.getTime()) {
      s.mode = "paused"; s.pauseUntil = new Date(until).toISOString(); s.modeSince = ctx.now.toISOString();
      cmds.push({ kind: "wakeup", at: s.pauseUntil, reason: "pause_end", dedupe: `pause_end:${ev.until}` });   // the pause still ends
    }
  } else if (ev.type === "parent.setting_changed" && ev.key === "dailyMinutes") {
    const n = Math.round(Number(ev.value));
    // validated, clamped, and never raised by the fail-safe (a non-number falls to the floor)
    s.limits = { ...s.limits, dailyMinutes: Number.isFinite(n) ? Math.min(s.limits.dailyMinutes, Math.max(10, Math.min(120, n))) : 10 };
  } else if (ev.type === "parent.setting_changed" && ev.key === "hoursEnd" && HHMM_RE.test(String(ev.value))) s.limits = { ...s.limits, allowedTo: minTimeStr(s.limits.allowedTo, String(ev.value)) };
  else if (ev.type === "parent.setting_changed" && ev.key === "bedtime" && HHMM_RE.test(String(ev.value))) s.routine = { ...s.routine, bedtime: minTimeStr(s.routine.bedtime, String(ev.value)) };
  s.failSafe = { type: ev.type, error };
  return { state: s, commands: cmds, rulesFired: ["fail_safe"], blocked: [], viewRead: ctx.view.recorded() };
}

export { summarize };
