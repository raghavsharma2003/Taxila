// The code day planner (CONDUCTOR.md §3.7, §4.3-§4.5). planDay(inputs) is PURE over PlannerInputs: no
// reader, clock, I/O or randomness, so equal inputs give byte-equal plans (I-A4) and inputsHash identifies a
// plan (X43). buildPlannerInputs is the only place state/ctx are read, and it quantises what it reads.
// M0 implements R0 (band template + priority stack), the R1 "one bad close → success-first only" (X45),
// R8's re-anchor opener, R10 (voice rung) and the frozen-slot rule V10. Round 7 F adds R2 (late sittings get the
// minimum segment set), R5 (a prerequisite check for a wheel-spinning skill) and R9 (the foundation share for a child
// placed below her class): conductor/adapt.js. R4, R6, R7 and R11-R14 are not built yet.
import { BAND, PLAN, PLANNER_V, TIER, cfgDigest } from "./config.js";
import { R5, foundationShare, prereqPick } from "./adapt.js";
import { addMin, dayMin, daysBetween, fromDayMin, learningWindow, localTime, minTime, weekday } from "./clock.js";
import { jcs, sha256hex } from "./ids.js";

/** Quantised view value: counts as ints, ratios to .1 (X43). */
const qCount = (n) => Math.max(0, Math.round(Number(n) || 0));

/**
 * @param {import('./state.js').ConductorState} state
 * @param {{ now: Date, view: ReturnType<import('./view.js').recordingView>, cal: import('./clock.js').DayKindLookup }} ctx
 */
/** The tier's monthly voice seconds minus what this month already used, per lane (V3's budget). A stale/fallback
 *  read subtracts nothing (V25: a missing key never fires a rule). Rounded down to 60 s so the hash is stable. */
function remainingVoice(tierSec, used) {
  const u = used?.stale ? {} : (used?.value || {});
  return Object.fromEntries(Object.entries(tierSec).map(([lane, sec]) => [lane, Math.max(0, Math.floor((sec - (Number(u[lane]) || 0)) / 60) * 60)]));
}

export function buildPlannerInputs(state, ctx) {
  const tz = state.tz;
  const day = state.learningDay;
  const b = BAND[state.band];
  const r = state.routine, l = state.limits;
  const dayKind = ctx.cal.kind(day);
  const win = learningWindow(r, { ...l, allowedTo: minTime(l.allowedTo, b.allowedTo) }, day, ctx.cal);
  // A late open shortens the sitting only by time left before bedtime − 60 (§4.4), never by lateness itself.
  // All in minutes since the 04:00 learning-day anchor (an open at 00:30 is 20:30 AFTER the anchor, i.e. after
  // the window, never "before it opens"). Ceiled to 15 min: hash-stable inside a quarter hour, and never plans
  // minutes that have already gone. Clamped into [from, to]: before the window opens and after it closes the
  // clock is not an input (effFrom = to → timeLeft 0 → no new slot tonight).
  const fromDM = dayMin(win.from), toDM = dayMin(win.to);
  const nowDM = Math.min(1439, Math.ceil(dayMin(localTime(ctx.now, tz)) / 15) * 15);
  const effFrom = fromDayMin(Math.max(fromDM, Math.min(nowDM, Math.max(fromDM, toDM))));
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
  // round 7 F (R2, R5, R9): present only when they can fire, so a plan that reads none of them hashes as before
  const wheel = ctx.view.get("kt.wheelSpin"), placeGap = ctx.view.get("learner.placementGap");
  // round 7 F household v1: a window on the phone she shares with siblings (null when she shares with nobody)
  const hhv = ctx.view.get("household.window");
  const household = !hhv.stale && hhv.value?.state === "planned" && hhv.value.from && hhv.value.to
    ? { state: "planned", from: floor5(hhv.value.from), to: floor5(hhv.value.to) } : null;
  const checked = Object.entries(state.adapt.prereqChecked ?? {}).filter(([, d]) => daysBetween(d, day) < R5.recheckDays).map(([k]) => k).sort();
  const adaptAdd = { ...(state.adapt.lateMinSet ? { lateMinSet: true } : {}), ...(checked.length ? { prereqChecked: checked } : {}) };
  const viewAdd = {
    ...(!wheel.stale && wheel.value?.length ? { "kt.wheelSpin": { value: wheel.value, src: wheel.src, stale: false } } : {}),
    ...(!placeGap.stale && placeGap.value && Object.keys(placeGap.value).length ? { "learner.placementGap": { value: placeGap.value, src: placeGap.src, stale: false } } : {}),
  };
  return {
    v: 1,
    build: { plannerSha: PLANNER_V, cfgDigest: cfgDigest() },
    child: { band: state.band, classLevel: state.classLevel, tier: state.tier },
    day: { learningDay: day, dayKind, weekday: weekday(day) },
    window: { from: win.from, to: win.to, effFrom },
    routine: { bedtime: r.bedtime },
    limits: { capMin: Math.min(l.dailyMinutes, b.capMin), hwSubCapMin: b.hwSubCapMin, restDay: (l.restDays || []).includes(weekday(day)) },
    mode: state.mode, consentCore: !!state.consent.core_tutoring,
    school: { testWindows, subjects: subjectsInput(ctx.view.get("school.subjects")) },
    promises: [...state.promises].sort((a, b2) => (a.id < b2.id ? -1 : 1)),
    frozen: { slots: frozen, startedIds },              // no plan version: a re-plan of an unchanged day must hash equal
    usage: { usedMin: Math.floor(Number(used.value) || 0) },
    voice: { budgetLow: !!state.budget.low, voiceBudgetSec: remainingVoice(TIER[state.tier].voiceSecMonth, ctx.view.get("usage.voiceSecMonth")) },
    adapt: { successFirst: !!state.adapt.successFirstNext, gapDays, ...adaptAdd },
    view: { "kt.dueCount": { value: qCount(due.value), src: due.src, stale: due.stale },
            "usage.usedMin": { value: Math.floor(Number(used.value) || 0), src: used.src, stale: used.stale }, ...viewAdd },
    household,
  };
}

/** 'HH:MM' floored to 5 min (household windows inside inputsHash, household.md §3.4). */
const floor5 = (hm) => { const [h, m] = String(hm).split(":").map(Number); return `${String(h).padStart(2, "0")}:${String(Math.floor(m / 5) * 5).padStart(2, "0")}`; };

/** The rotation's ranked subjects as a planner input (a stale or missing key plans no subject: V25). */
function subjectsInput(v) {
  if (!v || v.stale || !v.value?.subjects?.length) return null;
  return { subjects: [...v.value.subjects], why: v.value.why ?? "rotation", timetable: [...(v.value.timetable ?? [])] };
}

/**
 * PURE. Today's lesson subject (round 7 F item 1, rotation.js priority): a test window whose subject the timetable
 * allows (or with no timetable), else the rotation's first pick. null when neither is known (the start then asks
 * reports/truth.js nextTopicForPlan, which applies the same order).
 * @returns {{ subject: string, why: string } | null}
 */
export function slotSubject(school) {
  const tw = school?.testWindows?.[0] ?? null;
  const subj = school?.subjects ?? null;
  if (tw && (!subj?.timetable?.length || subj.timetable.includes(tw.subject))) return { subject: tw.subject, why: "test_window" };
  if (subj?.subjects?.length) return { subject: subj.subjects[0], why: subj.why };
  return null;
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

/** R2's late sitting starts here (local time; the learning day runs 04:00 → 04:00). */
export const LATE_SITTING_FROM = "20:00";

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
  let startDM = Math.max(dayMin(win.from), dayMin(win.effFrom));
  let endDM = dayMin(win.to);
  // household v1 (household.md §3.4): a planned window that starts at or after now is this sitting's window; it can only
  // shorten the sitting (≤ to − from), never raise it. A window already past falls back to her own routine window.
  const hh = inputs.household;
  if (hh && dayMin(hh.from) >= startDM && dayMin(hh.from) < endDM) {
    startDM = dayMin(hh.from);
    endDM = Math.min(endDM, dayMin(hh.to));
    fire("HH", "limits", "window", hh.from, ["household.window"]);
  }
  const timeLeft = Math.max(0, endDM - startDM);   // learning-day minutes: 00:30 is after 20:30
  const lessonToday = slots.some((s) => s.kind === "live_lesson");
  const due = inputs.view["kt.dueCount"];
  const dueCount = due.stale ? 0 : due.value;                      // a stale key never fires a rule (V25)
  const slotWindow = [fromDayMin(startDM), fromDayMin(endDM)];

  if (!lessonToday && timeLeft > 0) {
    const aim = Math.max(b.segments.filter((s) => s[3]).reduce((a, s) => a + s[1], 0), Math.floor(PLAN.capShare * limits.capMin));
    let budget = Math.min(b.sessionMin, aim, remaining, timeLeft);
    // R2: a sitting at or after 20:00, latched on this child's own late-vs-early closes, gets the minimum segment set
    const minSetMin = b.segments.filter((s) => s[3]).reduce((a, s) => a + s[1], 0);
    const lateSitting = !!adapt.lateMinSet && startDM >= dayMin(LATE_SITTING_FROM);
    if (lateSitting && budget > minSetMin) budget = minSetMin;
    let segments = fitSegments(b.segments, budget);
    if (segments) {
      fire("R0", "kt", "sessionMin", segments.reduce((a, s) => a + s.minutes, 0), ["band", "limits.capMin", "usage.usedMin"]);
      if (voice.budgetLow) {
        segments = segments.map((s) => (RT_LANES.has(s.laneWanted) ? { ...s, laneWanted: "cascade" } : s));
        fire("R10", "budget", "laneMix", "cascade", ["budget.low"]);
      }
      // the month's remaining realtime seconds (V3): a lesson that would overrun them steps down to cascade
      const want = voiceOf(segments);
      if ([...RT_LANES].some((l) => (want[l] || 0) > (voice.voiceBudgetSec?.[l] ?? 0))) {
        segments = segments.map((s) => (RT_LANES.has(s.laneWanted) ? { ...s, laneWanted: "cascade" } : s));
        fire("R10", "budget", "laneMix", "cascade", ["usage.voiceSecMonth"]);
      }
      const opener = adapt.gapDays !== null && adapt.gapDays >= PLAN.reanchorGapDays ? "reanchor_light" : "standard_retrieval";
      if (opener !== "standard_retrieval") fire("R8", "kt", "opener", opener, ["counters.lastActiveDay"]);
      if (adapt.successFirst) fire("R1", "vibe", "successFirst", true, ["adapt.closes"]);
      if (lateSitting && segments.reduce((a, s) => a + s.minutes, 0) === minSetMin) fire("R2", "vibe", "sessionMin", minSetMin, ["adapt.closes"]);
      const why = [testWindow ? { code: "test_window", ref: testWindow.subject } : { code: "level_path", ref: "next_topic" }];
      if (dueCount > 0) why.push({ code: "due_review", ref: `n${Math.min(dueCount, 4)}` });
      const promise = inputs.promises[0];
      if (promise) why.push({ code: "teacher_promise", ref: promise.id });
      const targetMin = segments.reduce((a, s) => a + s.minutes, 0);
      const subj = slotSubject(school);
      if (subj && subj.why !== "test_window") why.push({ code: subj.why, ref: subj.subject });
      // R5: a wheel-spinning skill with a weak prerequisite → this lesson checks that prerequisite first
      const pick = prereqPick(inputs.view["kt.wheelSpin"]?.value, adapt.prereqChecked);
      if (pick) {
        why.push({ code: "prereq_gap", ref: pick.prereq.topicId });
        fire("R5", "kt", "prereqCheck", pick.prereq.topicId, ["kt.wheelSpin"]);
      }
      // R9: a child placed below her class gets a foundation share of the lesson (halved in a test window)
      const fshare = subj ? foundationShare(inputs.view["learner.placementGap"]?.value?.[subj.subject], !!testWindow) : null;
      if (fshare !== null) fire("R9", "kt", "foundationShare", fshare, ["learner.placementGap"]);
      slots.push({ id: `${day.learningDay}:L1`, kind: "live_lesson", targetMin, window: slotWindow, segments,
        ...(pick ? { prereqCheck: { skillId: pick.skillId, forTopicId: pick.topicId, prereqTopicId: pick.prereq.topicId } } : {}),
        ...(fshare !== null ? { foundationShare: fshare } : {}),
        ...(subj ? { subject: subj.subject } : {}),
        // round 7 F item 8: her open promises (teacher.promise, e.g. a Question-jar revisit) this lesson keeps
        ...(inputs.promises.length ? { promisesDue: inputs.promises.slice(0, 2).map((p) => p.id) } : {}),
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
