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
import { nextTopicFor } from "../content/next-topic.js";
import { learningDay, localTime, zonedToUtc } from "../conductor/clock.js";
import { teacherFor, teacherCard, CHARACTERS, offerMode } from "../compiler/characters/index.js";
import { eligibleTutors } from "../../shared/tutors.js";
import { defaultControls, parentState, foldDelayedChecks } from "./parent.js";
import { lessonSummary } from "./lesson.js";
import { shortTitleOf } from "../director/state.js";

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
export const countsAsDone = (state) => !state?.abandoned
  && ((Array.isArray(state?.did) && state.did.length > 0) || Number(state?.minutes) >= DONE_MIN_MINUTES);

/** Lesson length shown on the card (V2 §3.4: Young 10-20 min, Older 20-30), never more than what is left today. */
export const lessonMinutes = (classLevel, capRemaining) => Math.max(5, Math.min(Number(classLevel) <= 4 ? 15 : 25, capRemaining ?? Infinity));

/**
 * PURE. The home's one state, in precedence order: an open lesson to continue → today's cap reached → a lesson
 * already done today → outside the allowed hours → never had a lesson → today's lesson.
 * @param {{ resumable: boolean, usedMin: number, capMin: number, doneToday: boolean, now: string, from: string, to: string, anyLesson: boolean }} a
 * @returns {import("../../shared/contracts").ChildHomeState}
 */
export function homeStateOf({ resumable, usedMin, capMin, doneToday, now, from, to, anyLesson, openNow = false }) {
  // openNow: the parent's "Open now for 1 hour" (child_controls.open_until, W1-A) opens the HOURS only; the cap and
  // "done for today" still hold.
  const inHours = openNow || (now >= from && now < to);
  if (resumable && inHours) return "resume";
  if (usedMin >= capMin) return "capped";
  if (doneToday) return "done";
  if (!inHours) return "resting";
  return anyLesson ? "start" : "first";
}

/** The legacy home state src/child/day.ts understands. */
export const legacyHome = (state) => (state === "done" || state === "capped" ? "done" : state === "resting" ? "resting" : "default");

async function controlsOf(child) {
  const [row, open] = await Promise.all([
    one("select daily_minutes, hours_start, hours_end from child_controls where child_id = $1", [child.id]).catch(() => null),
    // A separate read: before migration 015 the column does not exist, and that must never cost the saved controls.
    one("select open_until from child_controls where child_id = $1 and open_until > now()", [child.id]).catch(() => null),
  ]);
  const d = defaultControls(child.class_level);
  return {
    openUntil: open?.open_until ? new Date(open.open_until).toISOString() : null,
    capMin: Number(row?.daily_minutes) || d.dailyMinutes,
    from: HHMM.test(row?.hours_start ?? "") ? row.hours_start : d.hoursStart,
    to: HHMM.test(row?.hours_end ?? "") ? row.hours_end : d.hoursEnd,
  };
}

/** GET /api/child/plan */
async function plan(req, res) {
  const { guardian, child } = await requireChild(req, childIdOf(query(req).get("childId")));
  send(res, 200, await planFor(child, guardian));
}

/** @returns {Promise<import("../../shared/contracts").ChildPlanResponse>} */
export async function planFor(child, guardian, now = new Date()) {
  const routine = await one("select tz from child_routine where child_id = $1", [child.id]).catch(() => null);
  const tz = routine?.tz || DEFAULT_TZ;
  const day = learningDay(now, tz);
  const dayStart = zonedToUtc(day, "04:00", tz).toISOString();
  const [controls, profile, open, todayRows, anyRow, usage, dayPlan, next] = await Promise.all([
    controlsOf(child),
    hasConsent(guardian.id, child.id, "learning_profile"),
    one(`select l.id, l.topic_id, l.started_at, l.state->'lastUi'->'ask'->>'text' as ask,
            (select count(*)::int from turn t where t.lesson_id = l.id and t.speaker = 'child') as child_turns,
            greatest(l.started_at, coalesce((select max(t.at) from turn t where t.lesson_id = l.id), l.started_at)) as last_at
          from lesson l where l.child_id = $1 and l.ended_at is null order by l.started_at desc limit 1`, [child.id]),
    q(`select id, topic_id, state, ended_at from lesson where child_id = $1 and ended_at >= $2 order by ended_at desc limit 5`, [child.id, dayStart]),
    one("select exists(select 1 from lesson where child_id = $1) as any", [child.id]),
    one("select used_min, cap_min from conductor_usage where child_id = $1 and learning_day = $2", [child.id, day]).catch(() => null),
    one("select version, plan from day_plan where child_id = $1 and day = $2 order by version desc limit 1", [child.id, day]).catch(() => null),
    nextTopicFor(child).catch(() => null),
  ]);
  const loggedMin = todayRows.reduce((a, r) => a + (Number(r.state?.minutes) || 0), 0);
  const usedMin = Math.round(Math.max(Number(usage?.used_min) || 0, loggedMin) * 10) / 10;
  const capMin = Number(dayPlan?.plan?.capMin) || Number(usage?.cap_min) || controls.capMin;
  const capRemaining = Math.max(0, Math.round((capMin - usedMin) * 10) / 10);
  const lastAt = open ? new Date(open.last_at).getTime() : 0;
  // "Only this session" (learning_profile off): no Continue, no map, no notebook — hidden, not empty (§3.13).
  const resumable = !!open && profile && open.child_turns > 0 && now.getTime() - lastAt < RESUME_HOURS * 3600_000;
  const doneRows = todayRows.filter((r) => countsAsDone(r.state));
  const state = homeStateOf({ resumable, usedMin, capMin, doneToday: doneRows.length > 0, now: localTime(now, tz),
    from: controls.from, to: controls.to, anyLesson: !!anyRow?.any, openNow: !!controls.openUntil });
  const teacher = teacherFor(child);
  const topic = next ? { id: next.id, title: next.title, shortTitle: shortTitleOf(next.title), chapter: next.chapter.title, subject: next.subject,
    minutes: Number(dayPlan?.plan?.slots?.find((x) => x.kind === "live_lesson")?.targetMin) || lessonMinutes(child.class_level, capRemaining) } : null;
  const last = doneRows[0];
  return {
    state, homeState: legacyHome(state),
    plan: { openLesson: state === "resume" ? open.id : null, window: { from: controls.from, to: controls.to }, openUntil: controls.openUntil },
    topic: state === "resume" ? null : topic,
    resume: state === "resume" ? { lessonId: open.id, ask: open.ask ?? null, topicTitle: getTopic(open.topic_id)?.title ?? "" } : null,
    today: last ? { lessonId: last.id, summary: lessonSummary(last.state, { topic: getTopic(last.topic_id), teacher }) } : null,
    capRemaining, capMin, usedMin, opensAt: state === "resting" ? controls.from : null,
    packReady: null, day, tz, teacher: teacherCard(teacher),
    surfaces: { map: !!profile, notebook: !!profile, resume: !!profile },
    source: { dayPlan: dayPlan?.version ?? null },
  };
}

// ───────────────────────────── map ─────────────────────────────

/** Parent state key (routes/parent.js parentState) → the four map shapes (§4.8). */
const MAP_STATE = { unseen: "not_started", practising: "practising", learned_today: "got_it", mastered: "secure" };
export const mapStateOf = (row, dc) => MAP_STATE[parentState(row, dc).key];

/**
 * PURE. The map from the class syllabus, the kits' skills and the child's ledger projection.
 * @param {{ classLevel: number, rows: Map<string, any>, delayed: Map<string, any>, rechecks: Set<string>, hereTopicId?: string|null,
 *   kitOf: (topic: any) => any }} a
 * @returns {Omit<import("../../shared/contracts").ChildMapResponse, "hidden">}
 */
export function buildMap({ classLevel, rows, delayed, rechecks, hereTopicId = null, kitOf }) {
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
      if (!ch || ch.id !== t.chapter.id) chapters.push(ch = { id: t.chapter.id, number: t.chapter.number, title: t.chapter.title, sealed: false, here: t.chapter.id === hereChapter, secure: 0, total: 0, topics: [] });
      let kit = null;
      try { kit = kitOf(t); } catch { kit = null; }
      const skills = (kit?.skills ?? []).map((sk) => {
        const row = rows.get(sk.id) ?? null;
        const dc = delayed.get(sk.id) ?? null;
        const ps = parentState(row, dc);
        const out = { skillId: sk.id, title: sk.title, topicId: t.id, chapter: t.chapter.title, subject,
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
  const [states, ev, weave, next] = await Promise.all([
    q("select skill_id, status, p_known, attempts, delayed_pass, next_review from skill_state where child_id = $1", [child.id]),
    q(`select skill_id, at, probe, outcome, hints_used, lesson_id from evidence
        where child_id = $1 and outcome <> 'no_evidence' and skill_id in (select skill_id from evidence where child_id = $1 and probe = 'P10')
        order by skill_id, at, id`, [child.id]),
    q("select distinct skill_id from weave_queue where child_id = $1 and status in ('queued','hosted')", [child.id]).catch(() => []),
    nextTopicFor(child).catch(() => null),
  ]);
  const byEv = new Map();
  for (const r of ev) { if (!byEv.has(r.skill_id)) byEv.set(r.skill_id, []); byEv.get(r.skill_id).push(r); }
  const out = buildMap({
    classLevel: child.class_level, rows: new Map(states.map((r) => [r.skill_id, r])),
    delayed: new Map([...byEv].map(([k, v]) => [k, foldDelayedChecks(v)])), rechecks: new Set(weave.map((r) => r.skill_id)),
    hereTopicId: next?.id ?? null, kitOf: kitFromFile,
  });
  send(res, 200, { ...out, hidden: false });
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
  if (["start", "first"].includes(p.state) && p.topic) return send(res, 200, { granted: true, topicId: p.topic.id });
  if (p.state === "resume") return send(res, 200, { granted: true, lid: p.plan.openLesson });
  send(res, 200, { granted: false, state: p.state });
}

export const routes = {
  "GET /api/child/plan": plan,
  "GET /api/child/map": map,
  "GET /api/child/teacher": teacher,
  "POST /api/lesson/request": request,
};
