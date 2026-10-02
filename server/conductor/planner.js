// The code day planner (CONDUCTOR.md §3.7, §4.3-§4.5). planDay(inputs) is PURE over PlannerInputs: no
// reader, clock, I/O or randomness, so equal inputs give byte-equal plans (I-A4) and inputsHash identifies a
// plan (X43). buildPlannerInputs is the only place state/ctx are read, and it quantises what it reads.
// M0 implements R0 (band template + priority stack), the R1 "one bad close → success-first only" (X45),
// R8's re-anchor opener, R10 (voice rung) and the frozen-slot rule V10. R2-R7, R9, R11-R14 need the
// ConductorChildView keys from the learner workstream and are not built yet.
import { BAND, PLAN, PLANNER_V, TIER, cfgDigest } from "./config.js";
import { addMin, daysBetween, fromMin, learningWindow, localTime, maxTime, minTime, toMin, weekday } from "./clock.js";
import { jcs, sha256hex } from "./ids.js";

const ceilTo = (hhmm, step) => { const m = toMin(hhmm); return m >= 1440 - step ? "23:59" : fromMin(Math.ceil(m / step) * step); };
/** Quantised view value: counts as ints, ratios to .1 (X43). */
const qCount = (n) => Math.max(0, Math.round(Number(n) || 0));

/**
 * @param {import('./state.js').ConductorState} state
 * @param {{ now: Date, view: ReturnType<import('./view.js').recordingView>, cal: import('./clock.js').DayKindLookup }} ctx
 */
export function buildPlannerInputs(state, ctx) {
  const tz = state.tz;
  const day = state.learningDay;
  const b = BAND[state.band];
  const r = state.routine, l = state.limits;
  const dayKind = ctx.cal.kind(day);
  const win = learningWindow(r, { ...l, allowedTo: minTime(l.allowedTo, b.allowedTo) }, day, ctx.cal);
  // A late open shortens the sitting only by time left before bedtime − 60 (§4.4), never by lateness itself.
  // Ceiled to 15 min: hash-stable inside a quarter hour, and never plans minutes that have already gone.
  const nowLocal = ceilTo(localTime(ctx.now, tz), 15);
  const effFrom = nowLocal > win.from ? nowLocal : win.from;     // planning always runs for learningDay(now)
  const due = ctx.view.get("kt.dueCount");
  const used = ctx.view.get("usage.usedMin");
  const today = state.plan?.day === day ? state.plan : null;
  const frozenIds = new Set(today ? [...today.shownSlotIds, ...today.startedSlotIds] : []);
  const frozen = today ? today.slots.filter((s) => frozenIds.has(s.id)) : [];
  const startedIds = today ? [...new Set([...today.startedSlotIds, ...today.doneSlotIds])].filter((id) => frozenIds.has(id)).sort() : [];
  const testWindows = state.school.testWindows.filter((w) => w.from <= day && day <= w.to)
    .map((w) => ({ subject: w.subject, from: w.from, to: w.to, chapters: [...w.chapters].sort() }))
    .sort((a, b2) => (a.subject + a.to < b2.subject + b2.to ? -1 : 1));
  const gapDays = state.counters.lastActiveDay ? Math.min(30, daysBetween(state.counters.lastActiveDay, day)) : null;
  return {
    v: 1,
    build: { plannerSha: PLANNER_V, cfgDigest: cfgDigest() },
    child: { band: state.band, classLevel: state.classLevel, tier: state.tier },
    day: { learningDay: day, dayKind, weekday: weekday(day) },
    window: { from: win.from, to: win.to, effFrom },
    routine: { bedtime: r.bedtime },
    limits: { capMin: Math.min(l.dailyMinutes, b.capMin), hwSubCapMin: b.hwSubCapMin, restDay: (l.restDays || []).includes(weekday(day)) },
    mode: state.mode, consentCore: !!state.consent.core_tutoring,
    school: { testWindows },
    promises: [...state.promises].sort((a, b2) => (a.id < b2.id ? -1 : 1)),
    frozen: { slots: frozen, startedIds },              // no plan version: a re-plan of an unchanged day must hash equal
    usage: { usedMin: Math.floor(Number(used.value) || 0) },
    voice: { budgetLow: !!state.budget.low, voiceBudgetSec: TIER[state.tier].voiceSecMonth },
    adapt: { successFirst: !!state.adapt.successFirstNext, gapDays },
    view: { "kt.dueCount": { value: qCount(due.value), src: due.src, stale: due.stale },
            "usage.usedMin": { value: Math.floor(Number(used.value) || 0), src: used.src, stale: used.stale } },
    household: null,
  };
}

/** 'pi1:' + sha256(JCS(inputs)) (X43). Inputs are already quantised and hold no raw now or asOf. */
export const inputsHash = (inputs) => "pi1:" + sha256hex(jcs(inputs));

/** Fit the band template into `budget` minutes, shrinking optional segments first, never below the minimum set. */
export function fitSegments(template, budget) {
  const segs = template.map(([kind, minutes, lane, min]) => ({ kind, minutes, laneWanted: lane, min: !!min }));
  const total = () => segs.reduce((a, s) => a + s.minutes, 0);
  const shrink = (kinds, floor) => {
    for (const k of kinds) {
      for (const s of segs) {
        while (s.kind === k && s.minutes > floor && total() > budget) s.minutes--;
      }
    }
  };
  shrink(["break", "offline", "play", "practice"], 0);
  shrink(["teach"], 3);
  shrink(["teachback", "transfer"], 2);
  shrink(["retrieve"], 2);
  if (total() > budget) return null;
  return segs.filter((s) => s.minutes > 0).map(({ kind, minutes, laneWanted }) => ({ kind, minutes, laneWanted }));
}

const RT_LANES = new Set(["realtime", "realtime_mini"]);
const voiceOf = (segments) => {
  const v = {};
  for (const s of segments) if (s.laneWanted !== "tap") v[s.laneWanted] = (v[s.laneWanted] || 0) + s.minutes * 60;
  return v;
};

/**
 * PURE. PlannerInputs → { plan, firings }. The plan carries no version/childId (decide adds them).
 * Priority stack (§4.4): holds/rest → homework (none at M0) → test window → due reviews → level path → promises.
 */
export function planDay(inputs) {
  const { day, window: win, limits, frozen, usage, voice, adapt, school } = inputs;
  const b = BAND[inputs.child.band];
  const firings = [];
  const fire = (rule, layer, knob, value, evidence = []) => firings.push({ rule, layer, knob, value, evidence });
  const testWindow = school.testWindows[0] || null;
  const rest = inputs.mode === "paused" || inputs.mode === "safety_hold" || !inputs.consentCore || limits.restDay || day.dayKind === "holiday";
  const mode = rest ? "rest_day" : testWindow ? "test_window" : day.dayKind === "off" ? "free_day" : "school_day";
  const slots = frozen.slots.map((s) => ({ ...s }));
  const base = { band: inputs.child.band, mode, capMin: limits.capMin, window: { from: win.from, to: win.to },
    splitLevelVsSchool: testWindow ? [30, 70] : [60, 40], voiceBudgetSec: voice.voiceBudgetSec, prefetch: [], builtBy: "code" };
  if (rest) {
    fire("R0", "safety_limits", "day", "rest", [inputs.mode !== "free" ? "mode" : !inputs.consentCore ? "consent" : "calendar"]);
    return finish(base, slots, firings);
  }
  // Shown-but-not-started slots still need their minutes; started ones are already in usage.usedMin.
  const frozenMin = slots.filter((s) => !frozen.startedIds.includes(s.id)).reduce((a, s) => a + s.targetMin, 0);
  let remaining = Math.max(0, limits.capMin - usage.usedMin - frozenMin);
  const timeLeft = Math.max(0, toMin(win.to) - toMin(maxTime(win.from, win.effFrom)));
  const lessonToday = slots.some((s) => s.kind === "live_lesson");
  const due = inputs.view["kt.dueCount"];
  const dueCount = due.stale ? 0 : due.value;                      // a stale key never fires a rule (V25)
  const slotWindow = [maxTime(win.from, win.effFrom), win.to];

  if (!lessonToday && timeLeft > 0) {
    const aim = Math.max(b.segments.filter((s) => s[3]).reduce((a, s) => a + s[1], 0), Math.floor(PLAN.capShare * limits.capMin));
    const budget = Math.min(b.sessionMin, aim, remaining, timeLeft);
    let segments = fitSegments(b.segments, budget);
    if (segments) {
      fire("R0", "kt", "sessionMin", segments.reduce((a, s) => a + s.minutes, 0), ["band", "limits.capMin", "usage.usedMin"]);
      if (voice.budgetLow) {
        segments = segments.map((s) => (RT_LANES.has(s.laneWanted) ? { ...s, laneWanted: "cascade" } : s));
        fire("R10", "budget", "laneMix", "cascade", ["budget.low"]);
      }
      const opener = adapt.gapDays !== null && adapt.gapDays >= PLAN.reanchorGapDays ? "reanchor_light" : "standard_retrieval";
      if (opener !== "standard_retrieval") fire("R8", "kt", "opener", opener, ["counters.lastActiveDay"]);
      if (adapt.successFirst) fire("R1", "vibe", "successFirst", true, ["adapt.closes"]);
      const why = [testWindow ? { code: "test_window", ref: testWindow.subject } : { code: "level_path", ref: "next_topic" }];
      if (dueCount > 0) why.push({ code: "due_review", ref: `n${Math.min(dueCount, 4)}` });
      const promise = inputs.promises[0];
      if (promise) why.push({ code: "teacher_promise", ref: promise.id });
      const targetMin = segments.reduce((a, s) => a + s.minutes, 0);
      slots.push({ id: `${day.learningDay}:L1`, kind: "live_lesson", targetMin, window: slotWindow, segments,
        voiceSecWanted: voiceOf(segments), why, opener, successFirst: !!adapt.successFirst,
        pace: { newSkillBudget: testWindow && daysBetween(day.learningDay, testWindow.to) < 2 ? 0 : 1 },
        ...(testWindow ? { testChapters: testWindow.chapters } : {}) });
      remaining -= targetMin;
    }
  }
  // A tap review burst with what is left (≤ 10 min), only when reviews are due; never a "one more round" push.
  if (dueCount > 0 && remaining >= PLAN.burstMinMin && timeLeft > 0 && !slots.some((s) => s.kind === "burst")) {
    const m = Math.min(PLAN.burstMaxMin, remaining);
    slots.push({ id: `${day.learningDay}:B1`, kind: "burst", targetMin: m, window: slotWindow,
      segments: [{ kind: "retrieve", minutes: m, laneWanted: "tap" }], voiceSecWanted: {}, why: [{ code: "due_review", ref: `n${Math.min(dueCount, 10)}` }] });
    fire("R3", "kt", "burst", m, ["kt.dueCount"]);
  }
  return finish(base, slots, firings);
}

function finish(base, slots, firings) {
  const plannedMin = slots.reduce((a, s) => a + s.targetMin, 0);
  const voice = {};
  for (const s of slots) for (const [k, v] of Object.entries(s.voiceSecWanted || {})) voice[k] = (voice[k] || 0) + v;
  return { plan: { ...base, plannedMin, voiceSecWanted: voice, slots, adapt: { rules: firings } }, firings };
}

/** Bedtime − 60 for V2, from the inputs. */
export const teachingEnd = (inputs) => addMin(inputs.routine.bedtime, -60);
