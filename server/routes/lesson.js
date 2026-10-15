// /api/lesson/* and /api/realtime/token — the Director's HTTP surface (docs/ARCHITECTURE.md §1.2, §2).
// Every route acts for an authenticated guardian's child (requireChild). One compile() feeds both lanes:
// the voice client applies `instructions` verbatim via session.update, and text mode generates its reply
// from the SAME string (inherited rejection: two prompts for two lanes).
import { warmupItemsFor } from "../learner/checks.js";
import { randomUUID } from "crypto";
import { q, one, tx } from "../db.js";
import { need, bad, forbidden, notFound, send, HttpError } from "../http.js";
import { requireChild, hasConsent, sessionTokenHash } from "../auth.js";
import { chat, mintRealtimeSecret, endpoint, realtimeLane, DEPLOY } from "../azure.js";
import { getTopic, getKit, pinKit, pinnedKit, topicOf, topicSequence } from "../content/index.js";
import { nextTopicOf, supersede, engineRow } from "../reports/truth.js";
import { hasAbilityLabel } from "../learner/brief.js";
import { buildChildBrief, loadRecentOutcomes, loadRecentStuck } from "../learner/model.js";
import { canWrite } from "../learner/mode.js";
import { canWriteMemory, formatTrialStmt, memoryStmt, relSessionStmt } from "../learner/writer.js";
import { skillsMapFor, snapshotFromKt, loadLive, dueForChecks } from "../learner/live.js";
import { misconceptionView } from "../learner/kt/misconception.js";
import { beliefFor, planChecks, onTopicPlanned, consumeExpired, weaveExpire, BAND_BUDGET, bandOf } from "../comprehension/index.js";
import { weaveStmts } from "../comprehension/store.js";
import { scrubPii, scanSafety, floorViolations, helpLeadOf } from "../director/safety.js";
import { laneFor } from "../agent/flags.js";
import { agentTurn, eventOf, applyAgentTurn } from "../agent/agent.js";
import { initLessonState, step, LIMITS, shortTitleOf } from "../director/state.js";
import { resolveAddress, codeSwitchAddress } from "../director/register.js";
import { instructionsFor, instructionsAfter } from "../compiler/instructions.js";
import { teacherFor, teacherForLesson, teacherCard } from "../compiler/characters/index.js";
import { prewarm } from "../voice/prewarm.js";
import { styleForChild } from "./voice.js";
import { planFor, dayLimitsOn } from "./child.js";
import { requireParentIfPinSet, defaultControls, engineTick } from "./parent.js";
import { forgeSeam } from "../forge/seam.js";
import { talkReport } from "../director/talk.js";
import { onLessonStart, onLessonEnd } from "../conductor/hooks.js";
import { takeAgentSpec, settleAgentSpec } from "../latency/agentSpec.js";
import { loadSessionContext, EMPTY_SESSION_CONTEXT } from "../comprehension/session.js";
import { seamSafe } from "../seam-safe.js";
import { studioSeam } from "../studio/seam.js";
import { relationalSeam } from "../relational/seam.js";
import { purposeSeam } from "../lesson/purpose.js";
import { sessionStartCtx, schoolPointerStmts } from "../director/session/start.js";
import { voicesigSeam } from "../voicesig/lesson.js";
import { realtimeSeam } from "../voice/realtimeSession.js";
import { fallbackReply, safeguardLine, carriedCheckInLine, scrubbed, textReply, words, floorContentOf } from "../brain/say.js";
import { clientInstructions, debugFor, floorIncidentStmt, kitFor, laneOf, stageTurns, turnInsertStmt, withAsk } from "../brain/rows.js";
import { nextBeat, uiBeatOf } from "../brain/beat.js";
import { momentOf } from "../brain/moment.js";
import { expressiveSeam } from "../voice/expressive/seam.js";
import { flushHeld, lessonTurn, noteDid, planTurn, replyKey, specFanout, speculate, uiVerdictOf } from "../brain/turn.js";

// W2-E BR1 (BUILD-PLAN W2-E #2): the turn's orchestration lives in server/brain/turn.js (the reply and its guards in
// server/brain/say.js, rows and lanes in server/brain/rows.js). This file keeps the HTTP routes; these re-exports keep
// every existing import path (tests, evals) working.
export { lessonTurn, LATE_TURN_MS, turnSeqOf, acceptsLate, replayFor } from "../brain/turn.js";
export { floorContentOf, replyDeps, repairDrift } from "../brain/say.js";
export { FLOOR_INCIDENT_FAMILIES, floorIncidentStmt, clientInstructions, turnLane, childTurnRow } from "../brain/rows.js";

/** Lesson row + its child, scoped to the signed-in guardian (403 otherwise). */
async function loadLessonFor(req, lessonId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId))) throw bad("invalid lessonId");
  const lesson = await one("select * from lesson where id = $1", [lessonId]);
  if (!lesson) throw notFound("lesson not found");
  const { guardian, child } = await requireChild(req, lesson.child_id);
  return { lesson, guardian, child };
}

/** Interests as they may be interpolated into a move shape: short plain labels only (they come from a profile). */
export const lessonInterests = (list) => (list ?? []).map((x) => String(x ?? "").trim()).filter((x) => /^[\p{L}][\p{L} '&-]{1,23}$/u.test(x)).slice(0, 3);

/**
 * Warm-up retrieval items for the session's openers (rule 18; COMPREHENSION-ENGINE.md §3.5.7): the delayed checks
 * the ledger says are due, snapshotted into the lesson state with their kit facts. Each one is a C31 callback that
 * clears its skill's delayed_check trigger (director/state.js activate).
 * @param {string[]} skillIds openers, most urgent first
 */
// The delayed check's item: server/learner/checks.js (VALUES-100 V1.3: a NEW form the child has never answered on the
// skill, from the per-skill check reserve; no unseen item → no check this session, never a repeat).

/** A weave_queue row → the reducer's entry (comprehension/weave.js). */
const weaveEntryOf = (r) => ({ childId: r.child_id, skillId: r.skill_id, kind: r.kind, anchorAt: new Date(r.anchor_at).toISOString(),
  earliestAt: new Date(r.earliest_at).toISOString(), dueAt: new Date(r.due_at).toISOString(), topicsSince: r.topics_since,
  hostCandidates: r.host_candidates ?? [], host: r.host ?? undefined, status: r.status });

// Forge / engine seams the Director calls: server/forge/seam.js (W1-B). A woven sub-step needs a host item that
// carries the earlier skill as a NECESSARY sub-step (kit isomorph or ModuleRequest.want.subSkill); until one exists
// the entry stays hosted and expires into a C31 callback.
export { forgeSeam };

// ───────────────────────────── POST /api/lesson/start ─────────────────────────────

// round 4 (stream 4A): "session" is the session-first start (no topic chosen by the child; the intake decides). It is
// served only when TAXILA_SESSION_FIRST=on (director/session/start.js); otherwise it starts exactly like "lesson".
const START_PURPOSES = new Set(["lesson", "practice", "doubt", "session"]);
/**
 * PURE. Why a lesson cannot start in this plan state (null: it can). safety_hold, capped and resting refuse everything; done
 * refuses a lesson ("never one more") but lets Practice and Ask through (§6.3.3 done row: "Practise something").
 * @param {import("../../shared/contracts").ChildHomeState} state  @param {string | undefined} purpose
 */
export function startRefusal(state, purpose, { limits = dayLimitsOn() } = {}) {
  const p = START_PURPOSES.has(purpose) ? purpose : "lesson";
  // the Conductor's safety hold (STUDENT-FLOW §4.2) refuses every purpose: no lesson, no Practice, no Ask
  if (state === "safety_hold") return "lessons are paused for now";
  // round 5 (owner 2026-10-14): the day limits are off by default, so a stale plan state never refuses a start either
  if (!limits) return null;
  if (state === "capped") return "today's lesson time is used up";
  if (state === "resting") return "outside today's lesson hours";
  if (state === "done" && p === "lesson") return "today's lesson is done";
  return null;
}

/** Which parent control (or day rule) a refusal comes from: "hours" (lesson hours), "daily_limit", "done" (today's lesson), "safety" (a safety hold). */
export const refusalControl = (state) => (state === "safety_hold" ? "safety" : state === "resting" ? "hours" : state === "capped" ? "daily_limit" : state === "done" ? "done" : null);

/** How long "Open now" opens the lesson hours for (Controls; BUILD-PLAN W1-A item 2). */
export const OPEN_NOW_MS = 3600_000;

/**
 * POST /api/lesson/open-now { childId } → { openUntil, plan }. The parent's one tap from Controls (or the resting screen's
 * hand-over): the lesson hours are open for the next hour, today only, without changing the saved hours. The daily
 * limit and "never one more" still hold (child.js homeStateOf honours open_until for the hours only). Gate: as every
 * consent-grade action, an unlocked Parent corner once a PIN exists. Audited.
 */
async function openNow(req, res, body) {
  const g = await requireParentIfPinSet(req);
  const { guardian, child } = await requireChild(req, need(body, "childId").childId);
  if (guardian.id !== g.id) throw forbidden("child not found for this account");
  const until = new Date(Date.now() + OPEN_NOW_MS);
  await one(`insert into child_controls(child_id, daily_minutes, open_until) values ($1, $2, $3)
      on conflict (child_id) do update set open_until = excluded.open_until, updated_at = now() returning child_id`,
  [child.id, defaultControls(child.class_level).dailyMinutes, until.toISOString()]);
  await q("insert into audit(guardian_id, action, detail) values ($1, 'open_now', $2)", [g.id, { childId: child.id, until: until.toISOString() }]).catch(() => {});
  send(res, 200, { openUntil: until.toISOString(), plan: await planFor(child, guardian) });
}

/** @type {(req: any, res: any, body: import("../../shared/contracts").LessonStartRequest) => Promise<void>} */
/**
 * r5 QA D24: rejoin this child's open lesson (POST /api/lesson/start with resumeLessonId). Only a server-written lane
 * (cascade / text: every reply is a stored turn) on the SAME lane as asked; the realtime lane's instructions are not
 * rebuilt here, so it starts fresh. The pending page-hide end is cancelled; her last line is the "opening" (she says it
 * again, from its stored turn), the screen is the last one the Director sent, and turnSeqFloor keeps a page that lost its
 * outbox (another device) above every turn the server has acknowledged. → the start response, or null (start fresh).
 */
async function resumeLesson(child, guardian, body) {
  const id = String(body.resumeLessonId ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const lesson = await one("select * from lesson where id = $1 and child_id = $2 and ended_at is null", [id, child.id]);
  if (!lesson) return null;
  const lane = laneOf(lesson.state?.mode);
  if (lane === "voice" || lane !== laneOf(startModeOf(body.mode))) return null;
  // main safety review (14.1 merge): never back into an open safeguarding episode (the Help sheet is raised by the
  // safeguard MOVE, and a resume replays no move), and never past a safety hold: the plain start applies startRefusal
  // (safety_hold refuses everything), so the child gets the hold, as the home shows it
  if (lesson.state?.safeguard) return null;
  if (startRefusal((await planFor(child, guardian))?.state, body.purpose) === "lessons are paused for now") return null;
  const claimed = await one("update lesson set state = state - 'pendingEndAt' where id = $1 and ended_at is null returning state", [id]);
  if (!claimed) return null;
  const state = claimed.state ?? {};
  const [last, controls] = await Promise.all([
    one("select seq, text from turn where lesson_id = $1 and speaker = 'teacher' order by seq desc limit 1", [id]),
    one("select address from child_controls where child_id = $1", [child.id]).catch(() => null),
  ]);
  const topic = getTopic(state.session && state.topicId ? state.topicId : lesson.topic_id);
  if (!topic) return null;
  const teacher = teacherForLesson(child, state.ctx?.teacherId, state.ctx?.teacherName);
  const address = resolveAddress({ classLevel: child.class_level, lang: child.language_pref, parent: controls?.address ?? null });
  const turnSeqFloor = Math.max(0, ...(state.acks ?? []).map((a) => Number(a?.turnSeq) || 0));
  console.info(`[lesson] resume ${id} turn=${state.turn ?? 0} floor=${turnSeqFloor}`);
  return {
    lessonId: id, topic: { id: topic.id, title: topic.title, chapter: topic.chapter.title },
    teacher: teacherCard(teacher), moduleCommands: [], ui: state.lastUi ?? {}, address,
    ...(last?.text ? { teacherOpening: last.text, teacherOpeningSeq: last.seq } : {}),
    resumed: true, turnSeqFloor,
  };
}

async function start(req, res, body) {
  const r = await lessonStart(req, body);
  send(res, 201, r.body);
}

/**
 * The lesson start (POST /api/lesson/start), as a function: r5-latency's POST /api/lesson/start-audio
 * (server/routes/voice.js) folds the opening's audio onto the same response, so it calls this and streams after it.
 * Every rule, refusal and write is the route's own. Resolves { body } (the LessonStartResponse, with debug locally).
 */
/** round 5 (14.2): how recent a safeguarding incident makes the next start a check-in (TAXILA_CARRIED_CHECKIN_HOURS, default 24). */
const carriedHours = () => { const h = Number(process.env.TAXILA_CARRIED_CHECKIN_HOURS ?? 24); return Number.isFinite(h) && h > 0 ? Math.min(168, Math.round(h)) : 24; };

export async function lessonStart(req, body) {
  const t0 = performance.now();
  const trace = [];
  // r5-latency: where a start's time goes (debug response `timings`, and the stage profiler evals/latency/start-profile.mjs)
  const mark = (name) => trace.push({ kind: `@${name}`, ms: Math.round(performance.now() - t0) });
  const { guardian, child } = await requireChild(req, need(body, "childId").childId);
  mark("auth");
  // r5 QA D24: a reload, a tab discard or the home's "continue" rejoins the open lesson instead of opening a new one
  if (body.resumeLessonId) {
    const resumed = await resumeLesson(child, guardian, body).catch((e) => { console.warn(`[lesson] resume refused: ${e.message}`); return null; });
    if (resumed) return { body: resumed };
  }
  // marked page-hide ends whose timer a restart lost (D24): ended now, before this start reads the plan
  await sweepPendingEnds(child.id).catch(() => {});
  // The parent's daily cap and lesson hours, and "Done for today", are promises (V2 §3.4, §6.3.3, §6.5.4): the plan
  // decides, here as on POST /api/lesson/request — a stale tab or a direct call cannot open a lesson past them. Read
  // alongside the consent and topic reads, checked before the kit read, any model call or write (planFor alone added
  // ~50 ms median on the Neon test branch, n = 12, before it was overlapped).
  const planP = planFor(child, guardian);
  // r5-latency: every read keyed only by the child starts NOW, beside the plan and consent reads; they used to wait in
  // three serial waves (the topic, then the live ledger / weave / bond, then the brief) before the opening's model call.
  // Reads only: a refused start below still wrote nothing. Each is awaited where it was used.
  const early = (p) => { p.catch(() => {}); return p; }; // awaited below; never an unhandled rejection if a check throws first
  const memoryP = early(hasConsent(guardian.id, child.id, "memory"));
  const nextTopicP = body.topicId ? null : early(nextTopicOf(child));
  const liveP = early(loadLive(child));
  const weaveP = early(q("select * from weave_queue where child_id = $1 and status in ('queued','hosted')", [child.id]).catch(() => []));
  // Seam (W2-I, server/relational/seam.js): the bond snapshot, read once per lesson; null until W2-I fills it.
  const bondP = early(Promise.resolve(seamSafe("relational.snapshot", () => relationalSeam.snapshot(child.id, { classLevel: child.class_level, lang: child.language_pref }), null)));
  const brief0P = early(memoryP.then((memory) => buildChildBrief(child, { memory })));
  // round 5 (14.2): a safeguarding incident within the last hours: this lesson opens on a calm check-in (state.js, `carried`)
  // once per incident: a lesson that already opened on the check-in for it (ctx.checkedInFor) is enough
  const carriedP = early(one(`select i.id, i.detail->>'family' as family from incident i where i.child_id = $1 and i.kind = 'safeguarding'
    and i.at > now() - make_interval(hours => $2::int)
    and not exists (select 1 from lesson l where l.child_id = $1 and l.started_at >= i.at and l.state->'ctx'->>'checkedInFor' = i.id::text)
    order by i.at desc limit 1`, [child.id, carriedHours()]).catch(() => null));
  planP.catch(() => {});
  const [core, memory, controls, lastLesson, vsb0] = await Promise.all([
    hasConsent(guardian.id, child.id, "core_tutoring"), memoryP,
    one("select address from child_controls where child_id = $1", [child.id]).catch(() => null),
    // the name the teacher had in the child's last lesson: a new one (the child renamed her, or picked another
    // teacher) is re-introduced at the greeting, still as their AI teacher (director/shapes.js greet)
    one("select state->'ctx'->>'teacherName' as name from lesson where child_id = $1 order by started_at desc limit 1", [child.id]).catch(() => null),
    // ship5 p3-voicesig: the child's answering-pace baseline (persisted only under the parent's voice_pace_memory choice;
    // else an empty session one). Never throws; undefined when voicesig is switched off.
    voicesigSeam.startRows({ q, hasConsent, guardianId: guardian.id, childId: child.id }),
  ]);
  mark("reads1");
  if (!core) throw forbidden("core_tutoring consent is required before a lesson");
  // round 4 (4A patch request 10b, main safety review): a start with no mode (or an unknown one) lands on the CASCADE lane,
  // the lane with the strongest floor (the server writes every reply); the realtime lane needs an explicit mode: "voice"
  const mode = startModeOf(body.mode);
  const purpose = START_PURPOSES.has(body.purpose) ? body.purpose : "lesson";
  // Seam (W2-A, server/lesson/purpose.js): an Ask start with no topic is routed by the child's first words; null (and any
  // unknown topic id) leaves the topic resolved exactly as before.
  const asked = purpose === "doubt" && !body.topicId
    ? await seamSafe("purpose.routeAsk", () => purposeSeam.routeAsk({ child, purpose, firstText: typeof body.firstText === "string" ? body.firstText.slice(0, 500) : undefined }), null)
    : null;
  const routed = asked?.topicId ? getTopic(asked.topicId) : null;
  // no topic: the ONE next-topic answer (reports/truth.js), so a start inside a school test window revises its subject
  const topic = routed ?? (body.topicId ? getTopic(body.topicId) : await (nextTopicP ?? nextTopicOf(child)));
  mark("topic");
  if (!topic) throw bad(body.topicId ? `unknown topic ${body.topicId}` : "no topic available for this class");
  // before getKit: a topic with no kit would otherwise be generated (a model call) for a refused start
  const dayPlan = await planP;
  mark("plan");
  const refusal = startRefusal(dayPlan.state, body.purpose);
  // The refusal names the control that refused (the parent's lesson hours or daily limit, or today's lesson done) and the
  // hours window, so the child's screen can say which and when (BUILD-PLAN W1-A item 2; smooth G8).
  if (refusal) throw new HttpError(409, refusal, { state: dayPlan.state, opensAt: dayPlan.opensAt, capRemaining: dayPlan.capRemaining,
    control: refusalControl(dayPlan.state), window: dayPlan.plan?.window ?? null });
  const kit = await getKit(topic.id, { trace });
  mark("kit");
  if (!kit) throw new HttpError(503, "no teaching content is available for this topic yet");
  // Every later request of this lesson reads back exactly this kit (kitFor).
  const now = Date.now();
  // the kit's reads start together (r5-latency: history and stuck used to wait for the warm-up items)
  const historyP = early(loadRecentOutcomes(child.id, kit.skills.map((s) => s.id)));
  // W2-C review: items stuck on in recent lessons (rung 4 / left after don't-knows) route the guidance ladder; never evidence
  const stuckP = early(loadRecentStuck(child.id, kit.skills.map((s) => s.id)));
  const [, live, weaveRows, sessionCtx, bond] = await Promise.all([pinKit(kit), liveP, weaveP,
    // Seam (W1-C): what the child's record says this lesson must know (re-teach attempts, fluency, arm posteriors).
    loadSessionContext(child.id, { skillIds: kit.skills.map((s) => s.id), now }).catch(() => EMPTY_SESSION_CONTEXT),
    bondP]);
  mark("reads2");
  const ledger = live.state.ledger;
  // Session openers (INTEGRATION.md §4): the ledger's due skills AND every learned skill ≥ 20 h past its anchor with
  // no delayed pass, plus weave entries that expired unhosted; then this topic is planned against the weave queue.
  const band = bandOf(child.class_level);
  const weaveQ = weaveExpire(weaveRows.map(weaveEntryOf), new Date(now).toISOString());
  const beliefs = {};
  for (const id of Object.keys(ledger.skills)) beliefs[id] = beliefFor(id, { ...live.state, now });
  const checks = planChecks({ q: weaveQ, due: dueForChecks(ledger, now), beliefs, now: new Date(now).toISOString(), openers: BAND_BUDGET[band].openers });
  const { q: plannedQ, hosted } = onTopicPlanned(consumeExpired(weaveQ, checks.consumed), kit.skills.map((x) => x.id), now);
  // Seam (no-op): a hosted woven sub-step goes to the item generator (kit isomorph or Forge ModuleRequest.want.subSkill).
  forgeSeam.wovenSubStep(hosted[0] ?? null);
  const warmupItems = await warmupItemsFor(checks.openers, { ledger });
  mark("warmup");
  const skillIds = [...new Set([...kit.skills.map((s) => s.id), ...warmupItems.map((w) => w.skillId)])];
  const [history, brief0, stuck] = await Promise.all([historyP, brief0P, stuckP]);
  // The interests the parent picked reach the teacher only under "Remember what {child} likes" (the memory consent;
  // V2 §3.2 step 5: "No" → no interests in examples), and only as short plain labels (they are interpolated).
  mark("reads3");
  const interests = memory ? lessonInterests(brief0.interests) : [];
  const brief = { ...brief0, interests };
  // aap / tum: the parent's controls, then the class default (G-REG-1; V2 §3.3 step 4). Never the request body.
  const address = resolveAddress({ classLevel: child.class_level, lang: child.language_pref, parent: controls?.address ?? null });
  // The Director's skill snapshot and misconceptions come from the ledger (the legacy fold is gone).
  const skills = Object.fromEntries(skillIds.filter((id) => ledger.skills[id]).map((id) => [id, { skillId: id, ...snapshotFromKt(ledger.skills[id], now) }]));
  const activeMisconceptionIds = misconceptionView(ledger.mis).slice(0, 5).map((m) => m.id);
  const teacher = teacherFor(child);
  // Seam (W2-A): a practice start's review-queue set ("Practice · n of 5"); null = today's practice behaviour.
  const practice = purpose === "practice" ? seamSafe("purpose.practiceSet", () => purposeSeam.practiceSet({ child, purpose, kit, ledger, now }), null) : null;
  const seqIds = topicSequence(topic.classLevel, topic.subject);
  const nextTopic = getTopic(seqIds[seqIds.indexOf(topic.id) + 1]);
  const lessonId = randomUUID();
  // An Ask's first words are the child's own (W2-C review: safety by predicate, not instruction). The same predicate
  // every child turn passes (director/safety.js scanSafety, passive ideation included) runs BEFORE they become the
  // question her opening answers: a disclosure opens on the safeguard move with the helplines, never on an explain.
  const askRaw = purpose === "doubt" && typeof body.firstText === "string" ? body.firstText.trim() : "";
  const askSafety = askRaw ? scanSafety(askRaw.slice(0, 500)) : { distress: false, kind: null };
  const askText = askRaw && !askSafety.distress ? askRaw.slice(0, 200) : "";
  // round 4 (stream 4A, session-first): the intake's inputs (the day plan as her private prior, due reviews, the school
  // pointer); null unless TAXILA_SESSION_FIRST=on and purpose "session" (then today's start, unchanged). The guardian in
  // TAXILA_SESSION_FIRST_FOR (the owner first) gets it on the plain Start too (purpose "lesson", no topic the child chose).
  const sessionFirst = sessionStartCtx({ purpose, child, plan: dayPlan.plan ?? null, levelPathTopic: topic.id, ledger, now,
    guardian, topicChosen: !!body.topicId || !!routed,
  });
  const state0 = initLessonState({
    topicId: topic.id, kit, skills, history, stuck, warmupItems, activeMisconceptionIds, now,
    seed: Math.floor(Math.random() * 2 ** 32),
    openers: warmupItems.map((w) => w.skillId), comp: skillsMapFor(live.state, kit, skillIds, now),
    ctx: {
      sessionId: lessonId, classLevel: child.class_level, schoolMedium: child.school_medium ?? undefined,
      // the teacher's id AND name are pinned here for the life of the lesson (a rename lands on the next one)
      firstName: child.first_name, teacherName: teacher.name, teacherId: teacher.id, protege: teacher.protege,
      ...(lastLesson?.name && lastLesson.name !== teacher.name ? { renamed: true } : {}),
      ageBand: brief.ageBand, lang: child.language_pref, interests, address,
      // r5 QA D38: an English lesson's code-switched lines are held to the parent's / class address (never in the prompt)
      ...(address ? {} : { mixAddress: codeSwitchAddress({ classLevel: child.class_level, parent: controls?.address ?? null }) }),
      firstMeeting: brief.relationshipStage.startsWith("first_meeting"), hasCallback: brief.memoryCallbacks.length > 0,
      topicTitle: topic.title, nextTitle: nextTopic?.title,
      // selectReteach's record inputs (director/state.js engineReteach); absent until W1-C fills the seam
      ...(sessionCtx?.reteach ? { reteach: sessionCtx.reteach } : {}),
      // the practice set from the purpose seam (W2-A); absent until it is filled
      ...(practice ? { practice } : {}),
      // the purpose and, for an Ask, the child's own question (W2-C #7: the Director answers it first, no greeting)
      purpose,
      ...(askText ? { askText } : {}),
      ...(sessionFirst ? { session: sessionFirst } : {}),
      // the bond stage RELATIONAL-OS pinned for this lesson (W2-I snapshot), for the turn's Moment (W2-E TB6)
      ...(bond?.stage ? { bondStage: bond.stage } : {}),
    },
  });
  const recent = askSafety.distress ? null : await carriedP;
  const carried = recent ? { kind: recent.family ?? null, incidentId: String(recent.id) } : null;
  const first = askSafety.distress
    ? step(state0, { event: "start", kit, now, cls: { outcome: "no_evidence", confidence: 1, source: "predicate",
      flags: { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: true, distressKind: askSafety.kind, wantsToStop: false } } })
    : step(state0, { event: "start", kit, now, ...(carried ? { carried } : {}) });
  const { r, instructions } = instructionsAfter({ ...first, state: { ...first.state, brief, mode, kitVerified: kit.verified, kitHash: kit.hash } }, kit, now);
  const state = r.state;
  if (vsb0) state.vsb = vsb0;
  if (carried && r.move.kind === "safeguard") state.ctx = { ...state.ctx, checkedInFor: carried.incidentId };
  // W2-E: the opening's beat (ui.beat; the client's end-of-turn thresholds read it) and its Moment for the voice layer.
  state.beat = nextBeat(undefined, r.move, state);
  const openingMoment = momentOf({ move: r.move, verdict: "ungraded", engagement: "warming", relational: null, ctx: state.ctx, turn: state.turn ?? 0,
    safety: r.move.kind === "safeguard", lane: mode === "voice" ? "voice" : mode === "cascade" ? "cascade" : "text" });

  mark("state");
  let teacherOpening, teacherOpeningSeq, rows = [], openingFloor = [];
  if (mode !== "voice" && askSafety.distress) {
    // A disclosure as an Ask's first words: the fixed safeguarding line (both helplines, the child's language and
    // address form), never a model draft that might open with a welcome or the topic (seen: "welcome. Aaj hum Numbers
    // karenge…" before the helpline).
    teacherOpening = safeguardLine(state.ctx);
    rows = stageTurns(state, [{ speaker: "teacher", text: teacherOpening, meta: { move: r.move.kind, fixed: true } }]);
    teacherOpeningSeq = rows[0].seq;
  } else if (mode !== "voice" && carried && r.move.kind === "safeguard") {
    // the check-in after a recent incident: a fixed line too, never a model draft that might open on the topic
    teacherOpening = carriedCheckInLine(state.ctx);
    rows = stageTurns(state, [{ speaker: "teacher", text: teacherOpening, meta: { move: r.move.kind, fixed: true, carried: true } }]);
    teacherOpeningSeq = rows[0].seq;
  } else if (mode !== "voice") {
    // round 5 (AGENT.md §3): the Teacher agent lane, decided once here and pinned for the lesson (server/agent/flags.js);
    // the realtime voice lane keeps the Director (its model speaks for itself)
    const lane = laneFor(guardian);
    state.ctx = { ...state.ctx, teacher: lane };
    let opened = null;
    // a safeguarding opening (a carried check-in after an incident, an open episode) is the Director's, never hers
    if (lane === "agent" && r.move.kind !== "safeguard" && !state.safeguard) {
      try {
        const out = await agentTurn({ state, kit, event: eventOf({ kind: "start" }), lessonId, lane: mode, trace });
        const floor = floorViolations(out.say, { content: floorContentOf(out.item ?? null) });
        if (floor.length) throw new Error(`agent opening broke the floor: ${floor.join(",")}`);
        const applied = applyAgentTurn(state, out, { kit, childText: null, lessonId });
        r.move = applied.move; r.ui = applied.ui; r.moduleCommands = [];
        opened = { reply: out.say, floor: [] };
      } catch (e) {
        console.warn(`[agent] opening fell back to the Director: ${String(e?.message ?? e).slice(0, 160)}`);
        state.agent = { ...(state.agent ?? {}), fallbacks: (state.agent?.fallbacks ?? 0) + 1 };
      }
    }
    opened ??= await textReply({ instructions, state, kit, childText: "", trace, ui: r.ui, module: state.module });
    teacherOpening = opened.reply;
    openingFloor = opened.floor ?? [];
    if (openingFloor.length) state.correction = openingFloor;
    rows = stageTurns(state, [{ speaker: "teacher", text: teacherOpening, meta: { move: r.move.kind, ...(openingFloor.length ? { floor: openingFloor } : {}) } }]);
    teacherOpeningSeq = rows[0].seq;
  }
  mark("opening");
  const openingIncident = teacherOpeningSeq ? floorIncidentStmt(child.id, lessonId, teacherOpeningSeq, openingFloor, mode) : null;
  // The lesson and its opening turn land together, or not at all.
  const [, created] = await tx([
    // An open lesson the child never spoke in (an accidental start, a killed tab) is closed, not left open beside
    // this one (V2 §3.13); it has no turns to fold, so nothing is lost, and it never counts as done (child.js countsAsDone).
    { text: `update lesson set ended_at = now(), state = state || '{"phase":"done","abandoned":true}'::jsonb
        where child_id = $1 and ended_at is null and started_at < now() - interval '2 minutes'
          and not exists (select 1 from turn t where t.lesson_id = lesson.id and t.speaker = 'child')`, params: [child.id] },
    { text: "insert into lesson(id, child_id, topic_id, kind, state) values ($1,$2,$3,'live',$4) returning id", params: [lessonId, child.id, topic.id, state] },
    ...(rows.length ? [turnInsertStmt(lessonId, rows)] : []),
    ...(openingIncident ? [openingIncident] : []),
    // a disclosure in an Ask's first words leaves the same incident row a turn's predicate hit does (no transcript)
    ...(askSafety.distress ? [{ text: "insert into incident(child_id, lesson_id, kind, severity, detail) values ($1,$2,'safeguarding','high',$3) returning id",
      params: [child.id, lessonId, { source: "predicate", family: askSafety.kind, at: "ask_start" }] }] : []),
    // the weave queue after this topic was planned (topicsSince, hosted, expired-as-callback): only the open entries
    ...(canWrite(child, "kt") && weaveRows.length ? weaveStmts(child, plannedQ) : []),
    // Seam (W1-D): the Conductor's lesson-start event lands with the lesson row, or not at all.
    ...onLessonStart({ child, lessonId, topicId: topic.id, purpose, mode, now }),
  ]);
  if (created.length !== 1) throw new Error("lesson insert did not land");
  mark("tx");
  // Seam (W1-B): warm the Forge fills this lesson may need; fire-and-forget, never the start's error.
  try {
    Promise.resolve(forgeSeam.prefetchLessonFills({ child, lessonId, topicId: topic.id, kit, lang: child.language_pref, band, mode }))
      .catch((e) => console.warn("[lesson] forge prefetch failed:", e?.message));
  } catch (e) { console.warn("[lesson] forge prefetch failed:", e?.message); }
  // Seam (W2-H, server/studio/seam.js): Studio's lesson-start prefetch (library hits, live builds with 3-6 min lead);
  // fire-and-forget after the lesson row landed, never the start's error.
  seamSafe("studio.prefetch", () => studioSeam.prefetch({ lessonId, child, topicId: topic.id, kit, band, mode, purpose,
    skillIds: kit.skills.map((s) => s.id), activeMisconceptionIds, reteach: sessionCtx?.reteach ?? null, bond }), null);
  if ((mode === "cascade" || mode === "text") && teacherOpeningSeq) {
    // Seam (W2-G): the opening's DeliveryPlan from its Moment, as on every turn (null = spoken plain).
    const delivery = seamSafe("expressive.planDelivery", () => expressiveSeam.planDelivery(openingMoment, teacherOpening), null);
    prewarm({ lessonId, seq: teacherOpeningSeq, text: teacherOpening, tokenHash: sessionTokenHash(req), guardianId: guardian.id, style: styleForChild(child, undefined, state.ctx?.teacherId, state.ctx?.teacherName),
      ...(delivery ? { delivery } : {}) });
  }
  mark("respond");
  console.info(`[lesson] start ${lessonId} topic=${topic.id} kit=${kit.verified ? "verified" : "mini"} ${Math.round(performance.now() - t0)}ms`);
  /** @type {import("../../shared/contracts").LessonStartResponse} */
  const out = {
    lessonId, topic: { id: topic.id, title: topic.title, chapter: topic.chapter.title },
    ...clientInstructions(mode, instructions), teacher: teacherCard(teacher), moduleCommands: r.moduleCommands,
    ui: withAsk(r.ui, teacherOpening, { ...(state.beat ? { beat: uiBeatOf(state.beat) } : {}),
      // the Ask's first words were handled here (answered, or met by the safeguard): the client shows the question
      // card and does NOT send them again as a turn (W2-C review: the same question was explained twice)
      ...(askRaw ? { askConsumed: true } : {}) }), address, moment: openingMoment,
    ...(teacherOpening ? { teacherOpening, teacherOpeningSeq } : {}),
    // the check-in's Help sheet leads as the incident's family asks (helpLeadOf: abuse → the helpline first)
    ...(carried && r.move.kind === "safeguard" ? { helpLead: helpLeadOf({ kind: carried.kind }) } : {}),
  };
  return { body: debugFor(req) ? { ...out, debug: { move: r.move, kitVerified: kit.verified, timings: trace } } : out };
}

// ───────────────────────────── POST /api/realtime/token ─────────────────────────────

/** Live-call session config from context/decisions.md#voice-turn-config. */
export function realtimeSession({ instructions, voice }) {
  return {
    type: "realtime", model: DEPLOY.realtime, instructions, output_modalities: ["audio"],
    // Transcription logprobs → TurnRequest.asrConfidence (src/lesson/realtime.ts), which feeds classify's
    // "low ASR ⇒ no evidence" gate; without them every misheard transcript was graded. Azure validates the
    // value (a bogus one is refused at mint), so it is not silently ignored.
    include: ["item.input_audio_transcription.logprobs"],
    audio: {
      input: {
        noise_reduction: { type: "near_field" },
        transcription: { model: DEPLOY.transcribe },
        turn_detection: { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: 900, create_response: true, interrupt_response: true },
      },
      output: { voice },
    },
  };
}

async function realtimeToken(req, res, body) {
  const { lesson, guardian, child } = await loadLessonFor(req, need(body, "lessonId").lessonId);
  if (lesson.ended_at) throw new HttpError(409, "lesson has ended");
  // A live call sends the child's voice to the model: it needs consent at the moment it starts.
  if (!(await hasConsent(guardian.id, child.id, "core_tutoring"))) throw forbidden("core_tutoring consent is required for a live call");
  const kit = await kitFor(lesson.topic_id, lesson.state);
  const base = realtimeSession({ instructions: instructionsFor(lesson.state, kit, "voice"), voice: teacherForLesson(child, lesson.state?.ctx?.teacherId, lesson.state?.ctx?.teacherName).voice });
  // Seam (W2-D, server/voice/realtimeSession.js): the session to mint (unchanged until W2-D fills it), and the lane switch
  // on a refused mint (null = rethrow, as before).
  const rtCtx = { kind: "lesson", lessonId: lesson.id, ...(lesson.state?.vibe ? { pace: { waitNudgeSec: lesson.state.vibe.waitNudgeSec, endpointSilenceMs: lesson.state.vibe.endpointSilenceMs } } : {}) };
  const session = seamSafe("realtime.shapeSession", () => realtimeSeam.shapeSession(base, rtCtx), base);
  let secret;
  try {
    secret = await mintRealtimeSecret(session);
  } catch (e) {
    const fb = seamSafe("realtime.onMintError", () => realtimeSeam.onMintError(e, rtCtx), null);
    if (fb?.fallback) throw new HttpError(503, "realtime lane unavailable", { fallback: fb.fallback });
    throw e;
  }
  /** @type {import("../../shared/contracts").RealtimeTokenResponse} */
  // The secret was minted WITH the instructions; the client gets the session back without them (it needs
  // only audio.input, to restore turn detection after push-to-talk) so the key is not in this response.
  const { instructions: _minted, ...clientSession } = session;
  const out = { token: secret.value, expiresAt: secret.expires_at, base: endpoint(realtimeLane(session)), session: clientSession };
  send(res, 200, out);
}

// ───────────────────────────── POST /api/lesson/end ─────────────────────────────

const MEMORY_KINDS = ["interest", "preference", "win", "life_event", "joke"];
/** A scrubPii mask the model copied from the (scrubbed) child turns into a memory: the memory is dropped. */
const PII_MASK = /\[(?:phone|aadhaar|email|pin|name|school|address)\]/i;
const STOP_WORDS = new Set(["the", "and", "with", "likes", "loves", "has", "have", "they", "their", "this", "that", "from", "about", "child", "kid", "very", "really", "hai", "mein", "aur", "bhi", "ko", "ka", "ki", "ke"]);
/** Topics never stored about a child, whatever they say (DPDP minimisation; harvest gurukul §8.5). */
const SENSITIVE = /\b(religio|caste|jaati|dharm|hindu|muslim|christian|sikh|god|bhagwan|allah|address|phone|school name|divorce|fight|beat|sick|ill|hospital|medicine|money|poor|rich|password)/i;

export const END_SCHEMA = {
  type: "object", additionalProperties: false, required: ["summary", "parentNote", "memories"],
  properties: {
    summary: { type: "string", description: "3-5 short factual lines for the teacher's own record" },
    parentNote: { type: "string", description: "2-4 plain sentences to the parent" },
    memories: {
      type: "array", description: "0-3 facts the CHILD said about themself, each citing the numbered child turn it came from",
      items: { type: "object", additionalProperties: false, required: ["kind", "text", "turn"], properties: {
        kind: { type: "string", enum: MEMORY_KINDS }, text: { type: "string", description: "third person, telegraphic, ≤12 words" }, turn: { type: "integer" },
      } },
    },
  },
};

/** Citation enforcement: the cited child turn must exist and share a content word with the fact. */
function citedTurn(mem, childTurns) {
  const t = childTurns[mem.turn];
  if (!t) return null;
  const toks = (s) => String(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  const turnWords = new Set(toks(t.text));
  return toks(mem.text).some((w) => turnWords.has(w)) ? t : null;
}

/** Items that probe a misconception: its diagnostic, and kit items that target it. */
const probesMisconception = (kit, itemId, misId) => itemId === `diag:${misId}` || kit.items.find((i) => i.id === itemId)?.targetsMisconception === misId;

/**
 * Deterministic facts the summary is written FROM (the model words them; it does not decide them).
 * A misconception reports how often it showed and how many correct answers on its own items came after
 * the last time it showed — "mixed up, then got it twice after the strips" is a different note to a parent.
 */
/**
 * The Teacher agent lane's own read of one skill (state.agent.learner, held to earned evidence by server/agent/agent.js
 * earnedRead) as the check the summary writer words it from, or null (the Director lane, or a skill she never read).
 * Round 5 (main: agent overclaims 64 vs the Director's 35 in sim lab cc4b3d2; in 34 of them her own read was LOWER than
 * what the record told the parent — the writer saw only right-answer counts). PURE.
 */
export function checkOf(entry) {
  const r = entry?.read;
  if (r === "understood") return "shown: right on a why or new-situation question as well as the practice";
  if (r === "partly") return entry.depth === "untested" ? "practised: easy questions right, not yet checked with a why or new-situation question" : "partly: some right, not steady yet";
  if (r === "not") return "still building";
  return null;
}

function lessonFacts(state, evidence, kit) {
  const bySkill = {};
  for (const e of evidence) {
    const s = (bySkill[e.skill_id] ??= { attempts: 0, unaided: 0 });
    s.attempts += 1;
    if (e.outcome === "correct" && e.hints_used === 0) s.unaided += 1;
  }
  const misIds = [...new Set(evidence.map((e) => e.misconception_id).filter(Boolean))];
  const read = state.agent?.learner ?? {};
  return {
    topic: getTopic(state.topicId)?.title, minutes: state.minutes, teachbackPassed: state.teachbackPassed,
    skills: Object.entries(bySkill).map(([id, s]) => ({ skill: kit.skills.find((k) => k.id === id)?.title ?? "an earlier skill", attempts: s.attempts, unaidedCorrect: s.unaided,
      ...(checkOf(read[id]) ? { check: checkOf(read[id]) } : {}) })),
    misconceptions: misIds.map((m) => {
      const last = evidence.map((e) => e.misconception_id).lastIndexOf(m);
      return {
        belief: kit.misconceptions.find((x) => x.id === m)?.belief ?? "an earlier mix-up",
        timesSeen: evidence.filter((e) => e.misconception_id === m).length,
        correctAfterLastSeen: evidence.slice(last + 1).filter((e) => e.outcome === "correct" && probesMisconception(kit, e.item_id, m)).length,
      };
    }),
  };
}

/**
 * The child's summary screen (V2 §6.3.5 "What you did today"), from the lesson's own record of graded turns
 * (state.did, written by the turn route from the verified-key classifier) — never from a model's account of the
 * lesson. Up to 3 cards: verified right answers first (newest first), then a teach-back; when nothing was verified,
 * what the child tried, with `tried` (the only count the screen may show). The face is verdict-neutral (ReactionGate):
 * the same "warm" program whatever happened. No score, minutes or comparison is ever in it.
 * @returns {import("../../shared/contracts").LessonSummary}
 */
export function lessonSummary(state, { topic, teacher, rows = null }) {
  const did = Array.isArray(state?.did) ? state.did : [];
  const latest = new Map();
  for (const d of did.filter((x) => x.kind === "item")) latest.set(d.itemId, d);
  const attempts = [...latest.values()].sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0));
  const ticks = attempts.filter((d) => d.verdict === "correct" && d.verified);
  const taught = [...did].reverse().find((d) => d.kind === "teachback" && d.verdict === "correct");
  const card = (d, tick) => ({ kind: d.kind, ask: d.ask ?? null, answer: d.answer, tick, withHelp: !!(tick && d.withHelp), turnSeq: d.seq ?? null });
  let cards = [...ticks.sort((a, b) => Number(a.withHelp) - Number(b.withHelp) || (b.turn ?? 0) - (a.turn ?? 0)).map((d) => card(d, true))];
  if (taught) cards.splice(Math.min(cards.length, 2), 0, card(taught, true));
  const anyVerified = cards.length > 0;
  if (!anyVerified) cards = attempts.map((d) => card(d, false));
  cards = cards.slice(0, 3);
  // journey audit #13: the tick and "with a hint" come from the engine rows of the card's own turn when they are read
  // (parent.js engineTick, the claim the parent's evidence page shows), never the Director's hint rung alone, so the
  // child's "On your own" and the parent's "Right, with a hint" cannot disagree about the same answer
  if (rows) cards = cards.map((c) => (c.turnSeq != null && rows.some((r) => r.turnSeq === Number(c.turnSeq)) ? { ...c, ...engineTick(rows, c.turnSeq) } : c));
  return {
    title: topic?.title ?? null, shortTitle: topic ? shortTitleOf(topic.title) : null, cards,
    ...(anyVerified ? {} : { tried: attempts.length }),
    nextTitle: state?.ctx?.nextTitle ?? null, face: "warm", ...(teacher ? { teacher: teacherCard(teacher) } : {}),
    revoiceSeq: cards.find((c) => c.turnSeq != null)?.turnSeq ?? null,
  };
}

/** The lesson's scored engine rows (the same read and filter as the parent's lesson page). Never throws: [] on error. */
async function engineRowsOf(childId, lessonId) {
  const raw = await q(`select id, seq, session_id, occurred_at, skill_ids, cls, outcome, grader, item_key, teach, pre_attempt_help, entry_rung,
      misconception_id, via, contaminated, assisted from kt_evidence where child_id = $1 and session_id = $2 order by seq`, [childId, String(lessonId)]).catch(() => []);
  return supersede(raw).map(engineRow).filter((r) => r.scored);
}

/** A lesson summary with "Next time" from the ONE next-topic answer (falls back to the start's pinned title). */
async function withPlanNext(did, child) {
  const next = await nextTopicOf(child);
  return { ...did, nextTitle: next?.title ?? did.nextTitle ?? null };
}

/** The end-of-lesson record's messages (the writer words the FACTS; it does not decide them). PURE. */
export function endMessages({ child, teacher, facts, childTurns }) {
  return [
    { role: "system", content: [
      `You write the record of one tutoring lesson with ${child.first_name} (class ${child.class_level}).`,
      `The teacher is ${teacher.name}, an AI teacher (${teacher.pronouns?.subject ?? "they"}/${teacher.pronouns?.object ?? "them"}): name ${teacher.pronouns?.object ?? "them"} by name or with these pronouns only. Refer to the child by first name or "they".`,
      "Write ONLY from the FACTS and the child's numbered turns. summary: short factual lines. parentNote: plain, warm, specific — what was practised, what went well (the method, not ability), any mix-up and whether it was corrected later in the lesson (correctAfterLastSeen), one way to help at home. Never use ability words (smart, weak, slow, intelligent, topper…), never compare with other children, never predict marks.",
      "memories: at most 3 harmless things the child SAID about themself (interests, preferences, a win, a joke, a happy event). Cite the number of the child turn it came from. Never anything about religion, caste, health, family problems, money, location, school name or other people's names. Empty if nothing fits.",
      // last: the rule that must fire (a skill's `check`, the agent lane's earned read, decides how far its words go)
      ...(facts.skills?.some((s) => s.check) ? ["A skill with a check is worded only as far as its check: a \"shown\" skill may read as understood; every other skill reads as practised, with what is still to check next time, in summary and parentNote alike, never as understood, mastered, secure, done well or explained correctly."] : []),
    ].join("\n") },
    // the child's words reach the model with direct identifiers masked (scrubPii), like every other model call
    { role: "user", content: `FACTS: ${JSON.stringify(facts)}\nCHILD TURNS:\n${childTurns.map((t, i) => `${i}. ${scrubbed(t.text)}`).join("\n") || "(none)"}` },
  ];
}

/**
 * Was this end the page-hide beacon (src/lesson/api.ts endBeacon)? Its body is sent as text/plain (navigator.sendBeacon
 * with a text/plain Blob, or the keepalive fetch fallback with a bare string body); every other end is a JSON POST.
 * An explicit `reason: "pagehide"` says the same. Such a lesson still takes the answers its outbox held (turn route).
 */
export const endedByPageHide = (req, body) => body?.reason === "pagehide"
  || /^text\/plain/i.test(String(req?.headers?.["content-type"] ?? ""));

/**
 * End one lesson: claim the row, write the summary, the parent note and the memories, fold the held evidence, and run
 * the Conductor's and the bond's lesson-end seams. → { status, body } (the route sends it; a deferred page-hide end
 * runs it from a timer). `endedBy` is "client" or "pagehide".
 */
export async function endLesson({ lesson, guardian, child, endedBy = "client", debug = false }) {
  const trace = [];
  const teacher = teacherForLesson(child, lesson.state?.ctx?.teacherId, lesson.state?.ctx?.teacherName);
  // round 4 (session-first): a session's segments re-point the state at another topic inside this lesson; the summary,
  // the kit and the row's topic are the last segment's (director/session/segments.js)
  const topicId = lesson.state?.session && lesson.state?.topicId ? lesson.state.topicId : lesson.topic_id;
  const topicRow = getTopic(topicId);
  // "Next time" on the end summary is the ONE next-topic answer read NOW (after this lesson's evidence), the same the
  // home, Progress and the parent read (reports/truth.js nextTopicForPlan), never the sequence-next pinned at the start
  const did = async (st) => withPlanNext(lessonSummary(st, { topic: topicRow, teacher, rows: await engineRowsOf(child.id, lesson.id) }), child);
  const already = async (row) => ({ status: 200, body: { summary: row?.summary ?? null, parentNote: row?.parent_note ?? null, alreadyEnded: true, did: await did(row?.state ?? lesson.state) } });
  if (lesson.ended_at) return already(lesson);
  // Claim the lesson BEFORE the slow summary: of two overlapping ends (a double tap, a retry on timeout) only
  // one gets the row back; the other writes nothing (sessions were once counted twice, memories duplicated).
  // The claim also closes the lesson to turns, so the facts below are final.
  const claimed = await one(`update lesson set ended_at = now(), state = jsonb_set(state, '{phase}', '"done"') || $2::jsonb
    where id = $1 and ended_at is null returning state`, [lesson.id, endedBy === "pagehide" ? { endedBy: "pagehide" } : {}]);
  if (!claimed) return already(await one("select summary, parent_note, state from lesson where id = $1", [lesson.id]));
  const state = claimed.state;
  // ship5 p3-voicesig: the session's answering-pace baseline goes back to the child's rows (only under the parent's
  // voice_pace_memory choice, re-checked now), off the reply path; endSave never throws.
  void voicesigSeam.endSave({ q, hasConsent, guardianId: guardian.id, childId: child.id, classLevel: child.class_level, vsb: state.vsb });
  // The last why / teach-back of the lesson is still held (its verdict lands "on the next turn", and there is none):
  // wait for the blind grader while the summary is written, then fold and store it like a turn would.
  const heldP = flushHeld(child, lesson, state).catch((e) => console.warn("[lesson] end: held evidence not stored:", e.message));
  const [turns, evidence, memoryOk, profileOk, kit] = await Promise.all([
    q("select id, seq, speaker, text from turn where lesson_id = $1 order by seq", [lesson.id]),
    q("select skill_id, item_id, probe, outcome, misconception_id, hints_used from evidence where lesson_id = $1 order by at", [lesson.id]),
    hasConsent(guardian.id, child.id, "memory"), hasConsent(guardian.id, child.id, "learning_profile"),
    state.kitHash ? pinnedKit(topicId, state.kitHash) : getKit(topicId, { generate: false }),
    ...(topicId !== lesson.topic_id ? [q("update lesson set topic_id = $2 where id = $1", [lesson.id, topicId]).catch(() => null)] : []),
    // the school position the intake confirmed (a school_continue / school_reteach segment): child.school_chapter, which
    // content/next-topic.js schoolStartIndex already reads (migration patch 01 adds the column; never the start's error)
    ...schoolPointerStmts(child, state).map((st) => q(st.text, st.params).catch(() => null)),
  ]);
  const facts = kit ? lessonFacts(state, evidence, kit) : { topic: getTopic(topicId)?.title, skills: [] };
  const childTurns = turns.filter((t) => t.speaker === "child" && !t.text.startsWith("["));
  // W2-C #5: child talk share and the conversation mix (a monitor; never evidence, never shown to anyone as a score)
  try {
    const talk = talkReport(turns.filter((t) => !(t.speaker === "child" && t.text.startsWith("["))));
    console.info(`[talk] lesson=${lesson.id} childTalkShare=${talk.childTalkShare} child=${talk.childWords}w/${talk.childTurns}t teacher=${talk.teacherWords}w/${talk.teacherTurns}t mix=${JSON.stringify(state.talk?.mix ?? {})}`);
  } catch { /* telemetry never fails an end */ }

  let summary, parentNote, memories = [];
  try {
    const { json } = await chat(DEPLOY.fast, endMessages({ child, teacher, facts, childTurns }), { schema: END_SCHEMA, schemaName: "lesson_end", effort: "low", maxTokens: 2000, timeoutMs: 25_000, trace });
    summary = json.summary;
    // Ability-label fence on what a parent reads: a sentence with a label is dropped, never rewritten.
    parentNote = json.parentNote.split(/(?<=[.!?।])\s+/).filter((s) => !hasAbilityLabel(s)).join(" ");
    // round 3 fix (adversarial N2): no memory is kept from a lesson that had a safeguarding turn (state.safeguardedAt)
    memories = memoryOk && state.safeguardedAt == null && !state.safeguard ? json.memories : [];
  } catch (e) {
    console.warn("[lesson] end summary unavailable:", e.message);
    summary = `Practised ${facts.topic}. ${(facts.skills || []).map((s) => `${s.skill}: ${s.unaidedCorrect}/${s.attempts} on their own`).join("; ")}`;
    parentNote = `Today ${child.first_name} practised ${facts.topic} with ${teacher.name}.`;
  }

  // The writer's view of this child: its mode plus the memory consent (P3, personal details).
  const writerChild = { ...child, consent: { ...(child.consent ?? {}), P3: !!memoryOk } };
  const saved = [];
  for (const m of memories.slice(0, 3)) {
    const t = citedTurn(m, childTurns);
    if (!t || SENSITIVE.test(m.text) || hasAbilityLabel(m.text) || words(m.text) > 14 || !MEMORY_KINDS.includes(m.kind)) continue;
    // A memory row never carries a direct identifier: one that names a phone, an id, an email, a surname, a school or
    // an address is dropped, never stored masked (a "[school]" memory is noise to the brief and a pointer to the turn).
    if (scrubPii(m.text).found.length || PII_MASK.test(m.text)) continue;
    saved.push({ kind: m.kind, text: m.text.trim(), sourceTurn: t.id });
  }
  const writes = [
    { text: "update lesson set summary = $2, parent_note = $3 where id = $1 returning id", params: [lesson.id, summary, parentNote] },
    // The relationship stage is the session count only (trust is never persisted, NM-3); M1+ only.
    ...(canWrite(child, "kt") ? [relSessionStmt(child)] : []),
    // Memories by tier: M1 keeps tier A (wins) only; interests/preferences need M2+ and P3; tier C never.
    ...saved.filter((m) => canWriteMemory(writerChild, m.kind)).map((m) => memoryStmt(writerChild, m)),
  ];
  // Per-child format trials are the pz_child layer (M3 only), and need the learning-profile consent too.
  if (profileOk && kit && canWrite(child, "pz_child")) {
    for (const s of new Set(evidence.map((e) => e.skill_id))) {
      const rows = evidence.filter((e) => e.skill_id === s);
      writes.push(formatTrialStmt(child, { skillId: s, topicType: kit.topicType, format: kit.formats.primary,
        immediate: rows.filter((e) => e.outcome === "correct" && e.hints_used === 0).length / rows.length }));
    }
  }
  // Seam (W1-D): the Conductor's lesson-end event lands with the lesson's record, after the caller's own writes (the
  // row-count check and the result indexes below read only `writes`).
  const hookStmts = onLessonEnd({ child, lessonId: lesson.id, topicId, endedBy,
    turns: state.turn ?? 0, startedAt: lesson.started_at ?? null, now: Date.now() });
  // Seam (W2-I, server/relational/seam.js): the bond's lesson-end rows (rel_state, rel_event, relational_note), appended
  // after the lesson's own writes and BEFORE the Conductor's (its ingest locks child_seq last). [] until W2-I fills it.
  const relEnd = seamSafe("relational.onLessonEnd", () => relationalSeam.onLessonEnd(child, { lessonId: lesson.id, childId: child.id,
    endedBy, turns: state.turn ?? 0 }), []);
  const relStmts = Array.isArray(relEnd) ? relEnd : [];
  const results = await tx([...writes, ...relStmts, ...hookStmts]);
  if (results.slice(0, writes.length).some((rows) => rows.length !== 1)) throw new Error("lesson end: a write did not land");
  await heldP;
  const relAt = canWrite(child, "kt") ? 1 : -1;
  return { status: 200, body: { summary, parentNote, memoriesSaved: writes.filter((w) => /insert into memory/.test(w.text)).length, sessions: relAt > 0 ? results[relAt][0].sessions : null,
    did: await did(state), ...(debug ? { debug: { facts, timings: trace } } : {}) } };
}

/**
 * r5 QA D24: a page-hide is not always goodbye. A reload, an Android tab discard or a quick app switch fires it too, and
 * ending the lesson then meant the child came back to a NEW lesson from the greeting. The page-hide end is deferred by
 * PAGEHIDE_GRACE_MS: the lesson is marked (state.pendingEndAt) and ended by this same path when the grace runs out,
 * unless a start resumes it first (resumeLessonId clears the mark). A process restart loses the timer; the next start
 * or plan read of the child sweeps marked lessons past their grace (sweepPendingEnds). 0 = end at once (the old way).
 */
export const PAGEHIDE_GRACE_MS = Math.max(0, Number(process.env.TAXILA_PAGEHIDE_GRACE_MS ?? 120_000) || 0);

/** End a deferred page-hide lesson if it is still marked with `stamp` (a resume or a later end clears or replaces it). */
async function finishPendingEnd(lessonId, stamp) {
  const lesson = await one("select * from lesson where id = $1", [lessonId]);
  if (!lesson || lesson.ended_at || lesson.state?.pendingEndAt !== stamp) return;
  const child = await one("select * from child where id = $1", [lesson.child_id]);
  const guardian = child && await one("select id, email, name, locale from guardian where id = $1", [child.guardian_id]);
  if (!child || !guardian) return;
  await endLesson({ lesson, guardian, child, endedBy: "pagehide" });
}

function schedulePendingEnd(lessonId, stamp, ms = PAGEHIDE_GRACE_MS) {
  const t = setTimeout(() => { finishPendingEnd(lessonId, stamp).catch((e) => console.warn(`[lesson] deferred end ${lessonId}: ${e.message}`)); }, ms);
  t.unref?.();
}

/** The child's marked lessons whose grace is over (a timer lost to a restart): ended now, never blocking the caller. */
export async function sweepPendingEnds(childId, now = Date.now()) {
  if (!PAGEHIDE_GRACE_MS) return;
  const rows = await q(`select id, state->>'pendingEndAt' as at from lesson where child_id = $1 and ended_at is null and state ? 'pendingEndAt'`, [childId]).catch(() => []);
  for (const r of rows) {
    const due = new Date(r.at).getTime() + PAGEHIDE_GRACE_MS;
    if (Number.isFinite(due) && due <= now) await finishPendingEnd(r.id, r.at).catch((e) => console.warn(`[lesson] swept end ${r.id}: ${e.message}`));
  }
}

async function end(req, res, body) {
  const { lesson, guardian, child } = await loadLessonFor(req, need(body, "lessonId").lessonId);
  const pagehide = endedByPageHide(req, body);
  if (pagehide && PAGEHIDE_GRACE_MS > 0 && !lesson.ended_at) {
    const stamp = new Date().toISOString();
    const marked = await one(`update lesson set state = state || jsonb_build_object('pendingEndAt', $2::text) where id = $1 and ended_at is null returning id`, [lesson.id, stamp]);
    if (marked) {
      schedulePendingEnd(lesson.id, stamp);
      return send(res, 202, { deferred: true, graceMs: PAGEHIDE_GRACE_MS });
    }
  }
  const out = await endLesson({ lesson, guardian, child, endedBy: pagehide ? "pagehide" : "client", debug: !!debugFor(req) });
  send(res, out.status, out.body);
}

/** GET /api/lesson/summary?lessonId= — the summary screen's data again (a reload, the "Show a grown-up" view). */
async function summaryRead(req, res) {
  const id = new URL(req.url || "/", "http://x").searchParams.get("lessonId");
  const { lesson, child } = await loadLessonFor(req, id);
  const teacher = teacherForLesson(child, lesson.state?.ctx?.teacherId, lesson.state?.ctx?.teacherName);
  send(res, 200, { lessonId: lesson.id, ended: !!lesson.ended_at, did: await withPlanNext(lessonSummary(lesson.state, { topic: getTopic(lesson.topic_id), teacher, rows: await engineRowsOf(child.id, lesson.id) }), child) });
}

/** POST /api/lesson/turn: a thin adapter over the Brain's turn handler (every refusal is a thrown HttpError). */
async function turn(req, res, body) {
  // round 5 (stream 3): her model call speculated on this turn's prefetch, for a plain spoken turn; agentTurn adopts it only on
  // identical inputs, and whatever happens it is aborted when the turn is done (a no-op once adopted and finished)
  // the take may wait for the same classify the turn adopts, so the turn never waits on it: the spec lands on `hooks` when
  // handed over (turn.js reads it only after its own classify); whatever happens it is settled (logged, aborted) at the end
  const hooks = {};
  const specP = !body?.typed && !body?.chipId ? takeAgentSpec(body?.lessonId, body?.childText).catch(() => null) : null;
  specP?.then((s) => { if (s) hooks.agentSpec = s; });
  try { send(res, 200, await lessonTurn(req, body, hooks)); }
  finally { if (specP) settleAgentSpec(body?.lessonId, await specP); }
}

export const routes = {
  "POST /api/lesson/open-now": openNow,
  "POST /api/lesson/start": start,
  "POST /api/realtime/token": realtimeToken,
  "POST /api/lesson/turn": turn,
  "POST /api/lesson/end": end,
  "GET /api/lesson/summary": summaryRead,
};

/** Internals for tests (the turn's planning and speculation, which need no database or model). */
export const __test = { safeguardLine, planTurn, replyKey, speculate, specFanout, textReply, noteDid, withAsk, uiVerdictOf, fallbackReply, scrubbed };

/** Round 4 (4A patch request 10b): the lane a start runs on. Only an explicit "text" or "voice" is honoured; no mode, or an
 *  unknown one, is the cascade lane (the strongest floor: the server writes every reply). PURE; exported for tests. */
export function startModeOf(mode) {
  return mode === "text" || mode === "voice" ? mode : "cascade";
}
