// The child's own reads (PRODUCT-DESIGN-V2 §3.4, §3.8, §6.3.3, §6.3.7; audit #9: both returned 404 in production):
//
//   GET  /api/child/plan?childId=     → ChildPlanResponse: the home's ONE primary card (start | first | resume | done |
//                                       capped | resting), today's topic, today's DidCards, the teacher record
//   GET  /api/child/map?childId=      → ChildMapResponse: Garden (classes 1-4) / Sky (5-9) — chapters → skills with the
//                                       four ledger shapes, chapter seals, "your class is here", server-scheduled re-checks
//   GET  /api/child/teacher?childId=  → { teacher: TeacherCard }; ?classLevel= (no child yet: onboarding "Meet {T}")
//                                       → { teacher, eligible: TeacherCard[] }
//   POST /api/lesson/request { cid }  → { granted, topicId? } (src/child/day.ts): only the plan can grant a lesson
//
// Every child-scoped read is requireChild(req, childId): the id is checked against the signed-in guardian (no IDOR).
// None of it sits behind the parent PIN: a child screen never depends on the Parent corner being unlocked.
// Pure parts (homeStateOf, mapStateOf, buildMap) are exported for tests; the queries are thin.
import { q, one } from "../db.js";
import { bad, need, send } from "../http.js";
import { requireChild, hasConsent } from "../auth.js";
import { getTopic, topicSequence, SUBJECT_ORDER } from "../content/curriculum.js";
import { kitFromFile } from "../content/kits.js";
import { learningDay, localTime, zonedToUtc } from "../conductor/clock.js";
import { teacherFor, teacherCard, CHARACTERS, offerMode } from "../compiler/characters/index.js";
import { eligibleTutors } from "../../shared/tutors.js";
import { defaultControls, parentState } from "./parent.js";
import { loadTruth, MAP_SHAPE, nextTopicOf, activeWindow } from "../reports/truth.js";
import { madeForOf } from "../reports/madeFor.js";
import { tts, AzureError } from "../azure.js";
import { allowSpeech, MAX_TTS_CHARS } from "./tts.js";
import { speakable, spokenOptsForChild } from "../voice/spoken.js";
import { resolveAddress } from "../director/register.js";
import { HttpError } from "../http.js";
import { lessonSummary } from "./lesson.js";
import { shortTitleOf } from "../director/state.js";
import { routes as placementRoutes } from "./placement.js";
import { openJar, jarSummary, jarNotebook } from "../learner/jar.js";
import { syncMarks } from "../learner/marks.js";
import { validateEquip } from "../learner/equip.js";

/** An open lesson older than this is an abandoned tab, not "Continue your lesson" (V2 §3.13 "App killed mid-lesson"). */
export const RESUME_HOURS = 6;
const DEFAULT_TZ = "Asia/Kolkata";
const query = (req) => new URL(req.url || "/", "http://x").searchParams;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The child id from the query or body, shape-checked before it reaches a query (a malformed id is a 400, not a 500). */
const childIdOf = (v) => { if (!UUID.test(String(v ?? ""))) throw bad("childId must be a child id"); return String(v); };

/** A lesson this short with nothing graded is an accidental start or a crash, not "Done for today" (V2 §3.13). */
export const DONE_MIN_MINUTES = 5;
/**
 * PURE. Does an ended lesson count as today's lesson? Only when the child did something the classifier graded
 * (state.did) or it ran DONE_MIN_MINUTES; an abandoned zero-turn lesson (closed by lesson start) never does.
 */
// OWNER TEST 2026-10-04 item 3 (evals/owner-truth F7, patch 07): a lesson the CHILD stopped before the plan's own wrap
// (director/state.js toWrap stoppedEarly) never shuts the day — one "bas" used to cost a child every lesson until
// tomorrow ("today's lesson is done", 409). The parent's controls (hours, daily minutes) still decide every start.
export const countsAsDone = (state) => !state?.abandoned && !state?.stoppedEarly
  // W2 integration: only a Learn sitting is "today's lesson" (STUDENT-FLOW §4.2 done row: Practice and Ask are what a
  // done day still offers, so they never use up the day; a Practice first must not refuse the lesson with 409).
  && (state?.ctx?.purpose ?? "lesson") === "lesson"
  && ((Array.isArray(state?.did) && state.did.length > 0) || Number(state?.minutes) >= DONE_MIN_MINUTES);

/**
 * Whose day limits apply (round 7 F, dc-r7 D5, superseding dc-r14's global off): TAXILA_DAY_LIMITS=on forces every child's
 * on, =off forces every child's off, and unset (the default) leaves it to each family (child_controls.limits_on, migration
 * 035, off by default: a lesson is always open until the parent turns the daily limit on).
 */
export const dayLimitsMode = () => { const v = process.env.TAXILA_DAY_LIMITS; return v === "on" || v === "off" ? v : "child"; };
/** Every child's limits forced on (TAXILA_DAY_LIMITS=on): lesson.js startRefusal's default. A start passes the child's own
 *  flag instead (planFor's plan.limits = limitsOnFor(controls)); see docs/patches/to-brain/002-start-refusal-limits.md. */
export const dayLimitsOn = () => dayLimitsMode() === "on";
/** Do the parent's daily limit, lesson hours and "done for today" apply to this child? */
export const limitsOnFor = (controls) => dayLimitsMode() === "on" || (dayLimitsMode() === "child" && !!controls?.limitsOn);

/** Lesson length shown on the card (V2 §3.4: Young 10-20 min, Older 20-30), never more than what is left today. */
export const lessonMinutes = (classLevel, capRemaining) => Math.max(5, Math.min(Number(classLevel) <= 4 ? 15 : 25, capRemaining ?? Infinity));

/**
 * PURE. The home's one state, in precedence order (STUDENT-FLOW §4.2): the Conductor's safety hold (no lesson, the
 * Help sheet) → an open lesson to continue → today's cap reached → a lesson already done today → outside the allowed
 * hours (never for a child with no lesson yet: the first lesson after set-up) → the parent's "Homework help today" → a
 * school test window → never had a lesson → today's lesson.
 * The state never depends on how long ago the last lesson was (F7: the home after 1 day and after 30 is the same).
 * @param {{ resumable: boolean, usedMin: number, capMin: number, doneToday: boolean, now: string, from: string, to: string, anyLesson: boolean,
 *   openNow?: boolean, safetyHold?: boolean, homework?: boolean, testWindow?: boolean }} a
 * @returns {import("../../shared/contracts").ChildHomeState}
 */
export function homeStateOf({ resumable, usedMin, capMin, doneToday, now, from, to, anyLesson, openNow = false, safetyHold = false, homework = false, testWindow = false, limits = limitsOnFor(null) }) {
  if (safetyHold) return "safety_hold";
  // round 5 (owner, 2026-10-14: "remove the time frame for the class ... I am not even able to test after the time"):
  // with the day limits off (the default) a lesson is always available: no lesson hours, no daily cap, no "done for today".
  // Only the safety hold above still closes the home. dc-r14-no-clock-gates; TAXILA_DAY_LIMITS=on restores the rules below.
  if (!limits) {
    if (resumable) return "resume";
    if (homework) return "homework";
    if (testWindow && anyLesson) return "test_window";
    return anyLesson ? "start" : "first";
  }
  // openNow: the parent's "Open now for 1 hour" (child_controls.open_until, W1-A) opens the HOURS only; the cap and
  // "done for today" still hold.
  // round 4 (journey audit #11, main session 2026-10-10): a child's FIRST lesson always opens, whatever the hours: the
  // parent has just finished set-up and handed the phone over (one session; from the second lesson the hours hold)
  const inHours = openNow || !anyLesson || (now >= from && now < to);
  if (resumable && inHours) return "resume";
  if (usedMin >= capMin) return "capped";
  if (doneToday) return "done";
  if (!inHours) return "resting";
  if (homework) return "homework";
  if (testWindow && anyLesson) return "test_window";
  return anyLesson ? "start" : "first";
}

/** The legacy home state src/child/day.ts understands. */
export const legacyHome = (state) => (state === "done" || state === "capped" ? "done" : state === "resting" || state === "safety_hold" ? "resting" : "default");

async function controlsOf(child) {
  const [row, open, w2a, r7] = await Promise.all([
    one("select daily_minutes, hours_start, hours_end from child_controls where child_id = $1", [child.id]).catch(() => null),
    // A separate read: before migration 015 the column does not exist, and that must never cost the saved controls.
    one("select open_until from child_controls where child_id = $1 and open_until > now()", [child.id]).catch(() => null),
    // 019 columns, read apart for the same reason (a missing column never costs the saved controls)
    one("select homework_until, text_only from child_controls where child_id = $1", [child.id]).catch(() => null),
    // 035 columns (round 7), apart for the same reason
    one("select limits_on, extra_time, data_saver from child_controls where child_id = $1", [child.id]).catch(() => null),
  ]);
  const d = defaultControls(child.class_level);
  return {
    openUntil: open?.open_until ? new Date(open.open_until).toISOString() : null,
    homeworkUntil: w2a?.homework_until && new Date(w2a.homework_until) > new Date() ? new Date(w2a.homework_until).toISOString() : null,
    textOnly: !!w2a?.text_only,
    limitsOn: !!r7?.limits_on, extraTime: r7?.extra_time ?? "normal", dataSaver: !!r7?.data_saver,
    capMin: Number(row?.daily_minutes) || d.dailyMinutes,
    from: HHMM.test(row?.hours_start ?? "") ? row.hours_start : d.hoursStart,
    to: HHMM.test(row?.hours_end ?? "") ? row.hours_end : d.hoursEnd,
  };
}

/**
 * The limit inputs of learner/view.js minutesLeft for a child right now (Brain's mid-lesson wrap, D5): the parent's
 * controls, today's used minutes (conductor_usage, else the day's ended lessons), the hours end in the child's tz and
 * today's planned live-lesson slot. Defensive: every read that fails falls back to the defaults.
 * @returns {Promise<{ limitsOn: boolean, capMin: number, usedMin: number, to: string, localNow: string, openUntil: string|null, slotTargetMin: number|null }>}
 */
export async function limitsFor(child, now = new Date()) {
  const routine = await one("select tz from child_routine where child_id = $1", [child.id]).catch(() => null);
  const tz = routine?.tz || DEFAULT_TZ;
  const day = learningDay(now, tz);
  const dayStart = zonedToUtc(day, "04:00", tz).toISOString();
  const [controls, usage, rows, dayPlan] = await Promise.all([
    controlsOf(child),
    one("select used_min from conductor_usage where child_id = $1 and learning_day = $2", [child.id, day]).catch(() => null),
    q("select state from lesson where child_id = $1 and ended_at >= $2", [child.id, dayStart]).catch(() => []),
    one("select plan from day_plan where child_id = $1 and day = $2 order by version desc limit 1", [child.id, day]).catch(() => null),
  ]);
  const loggedMin = rows.reduce((a, r) => a + (Number(r.state?.minutes) || 0), 0);
  const slot = dayPlan?.plan?.slots?.find((x) => x.kind === "live_lesson");
  return {
    limitsOn: limitsOnFor(controls), capMin: Number(dayPlan?.plan?.capMin) || controls.capMin,
    usedMin: Math.max(Number(usage?.used_min) || 0, loggedMin), to: controls.to, localNow: localTime(now, tz),
    openUntil: controls.openUntil, slotTargetMin: Number(slot?.targetMin) || null,
  };
}

/**
 * GET /api/child/boot?childId= → { me, plan }: child home's two reads in ONE hop (smooth G5/G6: me → plan was serial,
 * about 0.25 s per hop from India). index.html starts it before the bundle parses on /c/:cid. Same checks as both.
 */
async function boot(req, res) {
  const { guardian, child } = await requireChild(req, childIdOf(query(req).get("childId")));
  const { meData } = await import("./account.js");
  const [me, p] = await Promise.all([meData(guardian), planFor(child, guardian)]);
  // release 12 flight recorder: the same trace tier GET /api/me carries (the child app boots from here)
  const { traceMeFor } = await import("../trace/tier.js");
  send(res, 200, { me: { ...me, trace: traceMeFor(guardian) }, plan: p });
}

/** GET /api/child/plan */
async function plan(req, res) {
  const { guardian, child } = await requireChild(req, childIdOf(query(req).get("childId")));
  send(res, 200, await planFor(child, guardian));
}

/**
 * Round 7 F (learning-conductor-day-plan): the child home starts the Conductor's planToday IN THE BACKGROUND, so day_plan
 * (and its slot.subject from the rotation) exists after the first visit of a learning day. It never adds latency and
 * never fails the home: at most once per child per PLAN_KICK_MS on this replica, errors only logged. OPT-IN until checked
 * live on staging (TAXILA_CONDUCTOR_PLAN=on): the DB-backed suites drive the plan route against a test database, and a
 * background Conductor step there is unverified. Off, the home reads whatever day_plan exists, as before.
 */
export const PLAN_KICK_MS = 10 * 60_000;
const planKicks = new Map();
/** PURE. Should this replica start planToday for the child now? */
export function shouldKickPlan(childId, now, kicks = planKicks, env = process.env) {
  if (env.TAXILA_CONDUCTOR_PLAN !== "on" || !env.DATABASE_URL) return false;
  if (kicks.has(childId) && now - kicks.get(childId) < PLAN_KICK_MS) return false;
  kicks.set(childId, now);
  if (kicks.size > 5000) for (const [k, t] of kicks) if (now - t > PLAN_KICK_MS) kicks.delete(k);
  return true;
}
function kickPlanToday(childId, now) {
  if (!shouldKickPlan(childId, now.getTime())) return;
  import("../conductor/index.js")
    .then((m) => m.planToday(childId, { device: "web", now }))
    .catch((e) => console.warn(`[child] planToday ${String(childId).slice(0, 8)}: ${String(e?.message ?? e).slice(0, 160)}`));
}

/** @returns {Promise<import("../../shared/contracts").ChildPlanResponse>} */
export async function planFor(child, guardian, now = new Date()) {
  kickPlanToday(child.id, now);
  // select *: 045's lesson_days / lesson_min may not exist yet (then the schedule is the start time alone)
  const routine = await one("select * from child_routine where child_id = $1", [child.id]).catch(() => null);
  const tz = routine?.tz || DEFAULT_TZ;
  const day = learningDay(now, tz);
  const dayStart = zonedToUtc(day, "04:00", tz).toISOString();
  const profile0 = hasConsent(guardian.id, child.id, "learning_profile");
  const [controls, profile, open, todayRows, anyRow, usage, dayPlan, , hold, test, madeFor, jarItems] = await Promise.all([
    controlsOf(child),
    profile0,
    one(`select l.id, l.topic_id, l.started_at, l.state->'lastUi'->'ask'->>'text' as ask,
            coalesce(jsonb_typeof(l.state->'safeguard'), 'null') <> 'null' as safeguard_open,
            (select count(*)::int from turn t where t.lesson_id = l.id and t.speaker = 'child') as child_turns,
            greatest(l.started_at, coalesce((select max(t.at) from turn t where t.lesson_id = l.id), l.started_at)) as last_at
          from lesson l where l.child_id = $1 and l.ended_at is null order by l.started_at desc limit 1`, [child.id]),
    q(`select id, topic_id, state, ended_at from lesson where child_id = $1 and ended_at >= $2 order by ended_at desc limit 5`, [child.id, dayStart]),
    one("select exists(select 1 from lesson where child_id = $1) as any", [child.id]),
    one("select used_min, cap_min from conductor_usage where child_id = $1 and learning_day = $2", [child.id, day]).catch(() => null),
    one("select version, plan from day_plan where child_id = $1 and day = $2 order by version desc limit 1", [child.id, day]).catch(() => null),
    null, // the next topic is read below, once the test window is known (the ONE next-topic answer, truth.js)
    // the Conductor's safety hold (decide.js safety.incident → mode safety_hold): the home offers no lesson
    one("select mode from conductor_state where child_id = $1", [child.id]).catch(() => null),
    // a school test the parent entered, covering today (019 child_controls.test_window)
    one("select test_window from child_controls where child_id = $1", [child.id]).then((r) => {
      const w = activeWindow(r?.test_window, day);
      return w ? { subject: w.subject, from_day: w.from, to_day: w.to, chapters: w.chapters ?? null } : null;
    }).catch(() => null),
    // today's revealed Studio pieces (the mini-shelf; [] until W2-H's feed has rows)
    madeForOf(child.id, { since: dayStart, limit: 3 }),
    // round 7 F item 8: the Question jar (037): what she promised to come back to
    profile0.then((p) => (p ? openJar(child.id, { limit: 10 }) : [])).catch(() => []),
  ]);
  const loggedMin = todayRows.reduce((a, r) => a + (Number(r.state?.minutes) || 0), 0);
  const usedMin = Math.round(Math.max(Number(usage?.used_min) || 0, loggedMin) * 10) / 10;
  const capMin = Number(dayPlan?.plan?.capMin) || Number(usage?.cap_min) || controls.capMin;
  const capRemaining = Math.max(0, Math.round((capMin - usedMin) * 10) / 10);
  const lastAt = open ? new Date(open.last_at).getTime() : 0;
  // "Only this session" (learning_profile off): no Continue, no map, no notebook — hidden, not empty (§3.13).
  // r5 QA D37 (14.3): never offer Continue for a lesson the server will not resume (lesson.js resumeLesson): one parked
  // inside an open safeguarding episode is refused there, so the home said CONTINUE and a new lesson started instead
  const resumable = !!open && profile && open.child_turns > 0 && !open.safeguard_open && now.getTime() - lastAt < RESUME_HOURS * 3600_000;
  const doneRows = todayRows.filter((r) => countsAsDone(r.state));
  const state = homeStateOf({ resumable, usedMin, capMin, doneToday: doneRows.length > 0, now: localTime(now, tz),
    from: controls.from, to: controls.to, anyLesson: !!anyRow?.any, openNow: !!controls.openUntil,
    safetyHold: hold?.mode === "safety_hold", homework: !!controls.homeworkUntil, testWindow: !!test, limits: limitsOnFor(controls) });
  const teacher = teacherFor(child);
  // the ONE next-topic answer (truth.js nextTopicForPlan): inside an active test window it revises the test's subject,
  // on every surface (home topic, "Next time", parent next lesson, Progress, the lesson-end summary)
  // the window's chapters and today (round 7 F test-window revision): the home's "next" is the lesson's revision topic
  const nextT = await nextTopicOf(child, { testWindow: test ? { subject: test.subject, from: test.from_day, to: test.to_day, today: day, ...(test.chapters ? { chapters: test.chapters } : {}) } : null });
  const topic = nextT ? { id: nextT.id, title: nextT.title, shortTitle: shortTitleOf(nextT.title), chapter: nextT.chapter.title, subject: nextT.subject,
    minutes: Number(dayPlan?.plan?.slots?.find((x) => x.kind === "live_lesson")?.targetMin) || lessonMinutes(child.class_level, capRemaining) } : null;
  const last = doneRows[0];
  return {
    state, homeState: legacyHome(state),
    plan: { openLesson: state === "resume" ? open.id : null, window: { from: controls.from, to: controls.to }, openUntil: controls.openUntil, limits: limitsOnFor(controls) },
    topic: state === "resume" ? null : topic,
    resume: state === "resume" ? { lessonId: open.id, ask: open.ask ?? null, topicTitle: getTopic(open.topic_id)?.title ?? "" } : null,
    // "Next time" on today's card is the plan's own next topic (the ONE next-topic function), never the sequence's next
    today: last ? { lessonId: last.id, summary: { ...lessonSummary(last.state, { topic: getTopic(last.topic_id), teacher }), nextTitle: nextT?.title ?? null } } : null,
    capRemaining, capMin, usedMin, opensAt: state === "resting" ? controls.from : null,
    packReady: null, day, tz, teacher: teacherCard(teacher),
    surfaces: { map: !!profile, notebook: !!profile, resume: !!profile },
    source: { dayPlan: dayPlan?.version ?? null },
    madeFor: profile && state !== "safety_hold" ? madeFor : [],
    jar: state === "safety_hold" ? null : jarSummary(jarItems),
    testWindow: test ? { subject: test.subject, from: test.from_day, to: test.to_day } : null,
    homework: controls.homeworkUntil ? { until: controls.homeworkUntil } : null,
    textOnly: controls.textOnly,
    // round 7 F (app-parent-schedule): the family's lesson time, for "Lesson time 5:00" on Home; a plan, never a lock
    schedule: scheduleOf(routine, day),
  };
}

// ───────────────────────────── map ─────────────────────────────

/**
 * PURE. A skill's label in a child's words (flows G16: a 7-year-old was read "Make a sensible estimate of a collection
 * using a known group"): the first clause of the kit title (cut before "using", "including", "with", "and explain", a
 * comma or a bracket), at most 6 words, the first letter kept. A kit `childLabel` wins when one is authored (W3-B).
 */
export function childLabelOf(title, authored = null) {
  if (typeof authored === "string" && authored.trim()) return authored.trim();
  let s = String(title ?? "").replace(/\s*\([^)]*\)/g, "").trim();
  s = s.split(/\s*(?:;|:|\s+using\s|\s+including\s|\s+with\s|\s+and explain\s|\s+by\s|\s+(?:in|on)\s+(?:a|an|the)\s)/i)[0];
  const all = s.split(/\s+/).filter(Boolean);
  const words = all.slice(0, 6);
  // a cut that leaves a dangling phrase ("Order several 4-digit numbers from smallest") drops the phrase from its preposition
  if (all.length > 6) {
    const i = words.findLastIndex((w, k) => k >= 2 && k >= words.length - 2 && /^(from|than|into|between|to|of|with|for)$/i.test(w));
    if (i > 0) words.length = i;
  }
  while (words.length > 2 && /^(of|a|an|the|to|and|for|on|in|at|from|or|its|their)$/i.test(words.at(-1).replace(/[,.]$/, ""))) words.pop();
  return words.join(" ").replace(/[,;]$/, "") || String(title ?? "");
}

/** The one state key (reports/truth.js skillTruth, the parent's words too) → the four map shapes (§4.8). */
const MAP_STATE = MAP_SHAPE;
export const mapStateOf = (row, dc) => MAP_STATE[parentState(row, dc).key];

/**
 * PURE. The map from the class syllabus, the kits' skills and the child's ledger projection.
 * @param {{ classLevel: number, rows: Map<string, any>, delayed: Map<string, any>, rechecks: Set<string>, hereTopicId?: string|null,
 *   kitOf: (topic: any) => any }} a
 * @returns {Omit<import("../../shared/contracts").ChildMapResponse, "hidden">}
 */
export function buildMap({ classLevel, rows, delayed, rechecks, hereTopicId = null, kitOf, stateOf = null, schoolChapter = null }) {
  const subjects = [];
  const flat = [];
  const hereChapter = hereTopicId ? getTopic(hereTopicId)?.chapter.id : null;
  for (const subject of SUBJECT_ORDER) {
    const ids = topicSequence(classLevel, subject);
    if (!ids.length) continue;
    const chapters = [];
    for (const id of ids) {
      const t = getTopic(id);
      let ch = chapters.at(-1);
      if (!ch || ch.id !== t.chapter.id) chapters.push(ch = { id: t.chapter.id, number: t.chapter.number, title: t.chapter.title, sealed: false, here: t.chapter.id === hereChapter,
        // round 7 F item 2: "your class is here" = the chapter the parent (or the intake) said school is on
        school: Number(schoolChapter?.[subject]) === t.chapter.number, secure: 0, total: 0, topics: [] });
      let kit = null;
      try { kit = kitOf(t); } catch { kit = null; }
      const skills = (kit?.skills ?? []).map((sk) => {
        const row = rows.get(sk.id) ?? null;
        const dc = delayed.get(sk.id) ?? null;
        // stateOf: the one claim source (truth.state); the row/dc fold stays for the pure tests
        const ps = stateOf ? stateOf(sk.id) : parentState(row, dc);
        const out = { skillId: sk.id, title: sk.title, label: childLabelOf(sk.title), topicId: t.id, chapter: t.chapter.title, subject,
          status: row?.status ?? "unseen", state: MAP_STATE[ps.key], recheckScheduled: !!ps.recheck || (rechecks.has(sk.id) && ps.level >= 2) };
        flat.push(out);
        return out;
      });
      ch.topics.push({ id: t.id, title: t.title, skills });
    }
    for (const ch of chapters) {
      const all = ch.topics.flatMap((x) => x.skills);
      ch.total = all.length;
      ch.secure = all.filter((x) => x.state === "secure").length;
      // A chapter seal is a STATE of the map: every skill Got it or Secure, never a collectible (§0.11).
      ch.sealed = all.length > 0 && all.every((x) => x.state === "got_it" || x.state === "secure");
    }
    subjects.push({ subject, book: getTopic(ids[0]).book, chapters });
  }
  return { mode: Number(classLevel) <= 4 ? "garden" : "sky", subjects, skills: flat, empty: !flat.some((x) => x.state !== "not_started") };
}

/** GET /api/child/map */
async function map(req, res) {
  const { guardian, child } = await requireChild(req, childIdOf(query(req).get("childId")));
  const mode = Number(child.class_level) <= 4 ? "garden" : "sky";
  if (!(await hasConsent(guardian.id, child.id, "learning_profile"))) {
    return send(res, 200, { mode, hidden: true, subjects: [], skills: [], empty: true });
  }
  const [truth, weave, next] = await Promise.all([
    loadTruth(child),
    q("select distinct skill_id from weave_queue where child_id = $1 and status in ('queued','hosted')", [child.id]).catch(() => []),
    nextTopicOf(child),
  ]);
  const out = buildMap({
    classLevel: child.class_level, rows: truth.projection, delayed: new Map(), rechecks: new Set(weave.map((r) => r.skill_id)),
    hereTopicId: next?.id ?? null, kitOf: kitFromFile, stateOf: (id) => truth.state(id), schoolChapter: child.school_chapter ?? null,
  });
  // round 7 F (app-world-hangar-depth): sealedAt / secureSince = when the map FIRST saw it (046 child_map_mark; null = not yet or unknown)
  send(res, 200, { ...(await syncMarks(child.id, out)), hidden: false });
}

// ───────────────────────────── her line on a plant / star (flows G16) ─────────────────────────────

/**
 * Her one line about a skill on the Garden / Sky sheet, in the family's language, composed on the server from fixed
 * shapes per map state (never model text, never client text), so "Hear {T}" speaks server-held words only.
 */
const SKILL_LINE = {
  hinglish: {
    tum: { not_started: (l) => `${l}, yeh hum jald saath mein karenge.`, practising: (l) => `${l} par hum kaam kar rahe hain. Tum achhi koshish kar rahe ho.`,
      got_it: (l) => `${l} tumne karke dikhaya!`, secure: (l) => `${l} ab pakka ho gaya. Ek aur din bhi tumne sahi kiya.` },
    aap: { not_started: (l) => `${l}, yeh hum jald saath mein karenge.`, practising: (l) => `${l} par hum kaam kar rahe hain. Aap achhi koshish kar rahe hain.`,
      got_it: (l) => `${l} aapne karke dikhaya!`, secure: (l) => `${l} ab pakka ho gaya. Ek aur din bhi aapne sahi kiya.` },
  },
  hindi: {
    tum: { not_started: (l) => `${l}, यह हम जल्द साथ में करेंगे।`, practising: (l) => `${l} पर हम काम कर रहे हैं। तुम अच्छी कोशिश कर रहे हो।`,
      got_it: (l) => `${l} तुमने करके दिखाया!`, secure: (l) => `${l} अब पक्का हो गया। एक और दिन भी तुमने सही किया।` },
    aap: { not_started: (l) => `${l}, यह हम जल्द साथ में करेंगे।`, practising: (l) => `${l} पर हम काम कर रहे हैं। आप अच्छी कोशिश कर रहे हैं।`,
      got_it: (l) => `${l} आपने करके दिखाया!`, secure: (l) => `${l} अब पक्का हो गया। एक और दिन भी आपने सही किया।` },
  },
  english: {
    tum: { not_started: (l) => `${l}: we will do this together soon.`, practising: (l) => `We are working on ${l.charAt(0).toLowerCase() + l.slice(1)}. You are trying well.`,
      got_it: (l) => `You showed me ${l.charAt(0).toLowerCase() + l.slice(1)}!`, secure: (l) => `${l} is secure now. You got it right on a later day too.` },
  },
};
/**
 * PURE. Her line for one map state, in the family's language and the SAME address form the lessons use
 * (resolveAddress, G-REG-1: aap from class 5 or the parent's choice), so the teacher never says aap in the lesson and
 * tum on the Garden / Sky sheet (owner priority 2, one consistent personality). English has no address form.
 * @param {string} lang  @param {string} state  @param {string} label  @param {"aap" | "tum" | null} [address]
 */
export function skillLineOf(lang, state, label, address = "tum") {
  const T = SKILL_LINE[lang] ?? SKILL_LINE.hinglish;
  const L = (address === "aap" && T.aap) || T.tum;
  return (L[state] ?? L.practising)(label);
}

async function skillLineFor(req) {
  const sp = query(req);
  const { guardian, child } = await requireChild(req, childIdOf(sp.get("childId")));
  const skillId = String(sp.get("skillId") ?? "");
  if (!skillId || skillId.length > 120) throw bad("invalid skillId");
  if (!(await hasConsent(guardian.id, child.id, "learning_profile"))) throw new HttpError(404, "no map for this child");
  const [truth, controls] = await Promise.all([
    loadTruth(child, { skillIds: [skillId] }),
    one("select address from child_controls where child_id = $1", [child.id]).catch(() => null),
  ]);
  const address = resolveAddress({ classLevel: child.class_level, lang: child.language_pref, parent: controls?.address ?? null });
  let title = null;
  try { title = (await import("../content/index.js").then((m) => m.skillById(skillId)))?.title ?? null; } catch { title = null; }
  if (!title) throw new HttpError(404, "unknown skill");
  const state = MAP_STATE[truth.state(skillId).key];
  return { child, guardian, text: skillLineOf(child.language_pref, state, childLabelOf(title), address), state };
}

/** GET /api/child/skill-line?childId=&skillId= → { text, state } */
async function skillLine(req, res) {
  const { text, state } = await skillLineFor(req);
  send(res, 200, { text, state });
}

/** PURE. What "Hear {T}" gives the voice: the spoken form in the child's cell (no digits), within the speech limit. */
export const skillLineSaid = (child, text) => speakable(String(text), spokenOptsForChild(child)).slice(0, MAX_TTS_CHARS);

/** GET /api/child/skill-line/audio?childId=&skillId= → audio/mpeg in her voice ("Hear {T}"). */
async function skillLineAudio(req, res) {
  const { guardian, child, text } = await skillLineFor(req);
  if (!allowSpeech(guardian.id)) throw new HttpError(429, "too many speech requests");
  let audio;
  // speakable() is the last step before every voice (w2g-speakable): "Compare two 4-digit numbers" reaches tts as words
  try { audio = await tts(skillLineSaid(child, text), teacherFor(child).voice); } catch (e) {
    if (e instanceof AzureError) throw new HttpError(502, "speech service unavailable");
    throw e;
  }
  res.statusCode = 200;
  res.setHeader("content-type", "audio/mpeg");
  res.setHeader("content-length", String(audio.length));
  res.setHeader("cache-control", "private, max-age=3600");
  res.end(audio);
}

// ───────────────────────────── name preview (round 7 F; PRODUCT-DESIGN-V2 §6.2 step 6) ─────────────────────────────

/** PURE. The fixed line her preview speaks: the spoken spelling when given, else the name as written. Never free text. */
export const nameLineOf = (name) => `Namaste, ${name}!`;

/**
 * GET /api/child/name-audio?childId=&spoken=  |  ?classLevel=&name=&spoken=  → audio/mpeg: "Hear how {T} says it".
 * The child's teacher (or, before the child exists, the class's) says one fixed greeting with the name; `spoken` is the
 * parent's "Spell it how it sounds" (account.js spokenNameOf rules), so a spelling can be heard before it is saved.
 */
async function nameAudio(req, res) {
  const sp = query(req);
  const { spokenNameOf } = await import("./account.js");
  let guardian, who;
  if (sp.get("childId")) {
    const r = await requireChild(req, childIdOf(sp.get("childId")));
    guardian = r.guardian; who = r.child;
  } else {
    const { requireGuardian } = await import("../auth.js");
    guardian = await requireGuardian(req);
    const cl = Number(sp.get("classLevel"));
    if (!(cl >= 1 && cl <= 9)) throw bad("childId or classLevel (1-9) is required");
    who = { id: `class-${cl}`, class_level: cl, teacher_id: null, first_name: spokenNameOf(sp.get("name")) };
  }
  const name = spokenNameOf(sp.get("spoken")) ?? who.name_spoken ?? spokenNameOf(who.first_name);
  if (!name) throw bad("a name is required");
  if (!allowSpeech(guardian.id)) throw new HttpError(429, "too many speech requests");
  let audio;
  try { audio = await tts(nameLineOf(name), teacherFor(who).voice); } catch (e) {
    if (e instanceof AzureError) throw new HttpError(502, "speech service unavailable");
    throw e;
  }
  res.statusCode = 200;
  res.setHeader("content-type", "audio/mpeg");
  res.setHeader("content-length", String(audio.length));
  res.setHeader("cache-control", "private, max-age=600");
  res.end(audio);
}

// ───────────────────────────── teacher ─────────────────────────────

/** GET /api/child/teacher?childId= | ?classLevel= */
async function teacher(req, res) {
  const qs = query(req);
  if (qs.get("childId")) {
    const { child } = await requireChild(req, childIdOf(qs.get("childId")));
    return send(res, 200, { teacher: teacherCard(teacherFor(child)) });
  }
  const cl = Number(qs.get("classLevel"));
  if (!(cl >= 1 && cl <= 9)) throw bad("childId or classLevel (1-9) is required");
  // Onboarding, before the child exists: the class's teacher and who else is eligible (same rules as /api/tutors).
  const stub = { id: `class-${cl}`, class_level: cl, teacher_id: null };
  const el = eligibleTutors(stub, { hasSheet: (id) => Object.hasOwn(CHARACTERS, id), offer: offerMode() });
  send(res, 200, { teacher: teacherCard(teacherFor(stub)), eligible: el.tutors.map((t) => teacherCard(teacherFor({ ...stub, teacher_id: t.id }))) });
}

// ───────────────────────────── lesson request ─────────────────────────────

/** POST /api/lesson/request { cid } — only the plan grants a lesson (start / first); never "one more" after done. */
async function request(req, res, body) {
  const { guardian, child } = await requireChild(req, childIdOf(need(body, "cid").cid));
  const p = await planFor(child, guardian);
  if (["start", "first", "homework", "test_window"].includes(p.state) && p.topic) return send(res, 200, { granted: true, topicId: p.topic.id });
  if (p.state === "resume") return send(res, 200, { granted: true, lid: p.plan.openLesson });
  send(res, 200, { granted: false, state: p.state });
}

/**
 * PURE. The child Home's view of the parent's schedule (round 7 F, app-parent-schedule): { time, minutes, today } or null.
 * `today`: today is one of the lesson days (all days when none are stored).
 */
export function scheduleOf(routine, day) {
  if (!routine?.anchor) return null;
  const days = Array.isArray(routine.lesson_days) ? routine.lesson_days.map(Number) : null;
  return { time: routine.anchor, minutes: routine.lesson_min ?? null, today: !days || days.includes(new Date(`${day}T00:00:00Z`).getUTCDay()) };
}

/**
 * POST /api/homework/match { childId, text } → { match } (round 7 F, learning-homework-help; agreed with App 2026-11-04):
 * where the child's homework question sits in their own class book (server/homework/match.js: kit_item | topic | subject),
 * or null. In memory over the class's kits, no model call (App waits ≤ 1.5 s). The text is not stored.
 */
async function homeworkMatch(req, res, body) {
  const { child } = await requireChild(req, need(body, "childId").childId);
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";
  if (!text) throw bad("text required");
  const { matchHomework } = await import("../homework/match.js");
  send(res, 200, { match: matchHomework(text, child) });
}

/**
 * GET /api/child/jar?childId= → { items } (round 7 F, App's app-notebook-log: the Notebook's "Questions in the jar").
 * The child's own kept questions and shares: waiting ones oldest first, then up to 10 answered ones newest first, with
 * the date each was answered. No counts. On the Conductor's safety hold the page is empty. Read-only (no child delete).
 */
async function jar(req, res) {
  const { child } = await requireChild(req, childIdOf(query(req).get("childId")));
  const hold = await one("select mode from conductor_state where child_id = $1", [child.id]).catch(() => null);
  if (hold?.mode === "safety_hold") return send(res, 200, { items: [] });
  send(res, 200, { items: await jarNotebook(child.id) });
}

/**
 * GET /api/child/equip?childId= → { equipped } · PUT /api/child/equip { childId, equipped: { hull?, trail?, board?, rim?, emote? } }
 * → { equipped } (round 7 F, App's app-world-hangar-depth). The Hangar's equipped cosmetics, synced across devices; a PUT
 * replaces the whole set (null or a missing slot = nothing equipped there). Catalog ids are checked (learner/equip.js).
 */
async function equipGet(req, res) {
  const { child } = await requireChild(req, childIdOf(query(req).get("childId")));
  const row = await one("select equipped from child_equip where child_id = $1", [child.id]).catch(() => null);
  send(res, 200, { equipped: row?.equipped ?? {} });
}
async function equipPut(req, res, body) {
  const { child } = await requireChild(req, childIdOf(need(body, "childId").childId));
  const v = validateEquip(body.equipped);
  if (v.error) throw bad(v.error);
  await q(`insert into child_equip (child_id, equipped, updated_at) values ($1, $2, now())
      on conflict (child_id) do update set equipped = excluded.equipped, updated_at = now()`, [child.id, v.equipped]);
  send(res, 200, { equipped: v.equipped });
}

/**
 * POST /api/child/reflect { childId, lessonId, choice } → 204 (round 7 F, App's app-debrief-made-later "What helped?").
 * choice: "made:<madeForId>" (a piece revealed in THAT lesson) | board | explain | self | unsure. Emits child.reflect;
 * the first tap per lesson wins (a second is a 204 no-op). A lesson that is not this child's own → 404; an unknown
 * choice or a made-for piece not from that lesson → 400. A choice, never a claim: no parent surface reads it.
 */
async function reflect(req, res, body) {
  const { child } = await requireChild(req, need(body, "childId").childId);
  const { lessonId } = need(body, "lessonId");
  const { parseChoice } = await import("../learner/reflect.js");
  const c = parseChoice(body.choice);
  if (!c || !/^[A-Za-z0-9_.:@\-]{1,96}$/.test(String(lessonId))) throw bad("choice must be made:<id>, board, explain, self or unsure");
  const lesson = await one("select id from lesson where id::text = $1 and child_id = $2", [String(lessonId), child.id]).catch(() => null);
  if (!lesson) throw new HttpError(404, "lesson not found");
  if (c.kind === "made") {
    // the shelf's own rule (reports/madeFor.js): a revealed, not hidden, non-whiteboard mount of THIS lesson
    const made = await one(`select 1 as ok from studio_mount m where m.lesson_id = $1 and m.revealed_at is not null and not m.hidden
        and m.source <> 'whiteboard' and coalesce(m.intent_id::text, m.build_sha) = $2 limit 1`, [lesson.id, c.id]).catch(() => null);
    if (!made) throw bad("that piece was not made in this lesson");
  }
  const { emit } = await import("../conductor/index.js");
  await emit(child.id, { type: "child.reflect", lessonId: String(lesson.id), choice: body.choice });
  send(res, 204);
}

export const routes = {
  "GET /api/child/plan": plan,
  "GET /api/child/boot": boot,
  "GET /api/child/map": map,
  "GET /api/child/teacher": teacher,
  "POST /api/lesson/request": request,
  "GET /api/child/skill-line": skillLine,
  "GET /api/child/skill-line/audio": skillLineAudio,
  "GET /api/child/name-audio": nameAudio,
  "POST /api/homework/match": homeworkMatch,
  "POST /api/child/reflect": reflect,
  "GET /api/child/jar": jar,
  "GET /api/child/equip": equipGet,
  "PUT /api/child/equip": equipPut,
  // round 7 F item 6: the placement round (server/routes/placement.js), registered here so the route registry is untouched
  ...placementRoutes,
};
