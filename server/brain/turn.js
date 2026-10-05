// The Brain's turn (TEACHER-BRAIN §5, BR1; BUILD-PLAN W2-E #2): POST /api/lesson/turn's orchestration, moved out of
// server/routes/lesson.js behaviour-identical (evals/teacher-brain/replay: 30 lessons, 420 turns, byte-identical).
//   perceive (classifyFast ∥ classify ∥ the safety predicate ∥ speculative replies) → fold + propose (planTurn: the
//   evidence, the learner model, the Director's step) → word + guard (say.js) → commit (one transaction).
// The HTTP route (server/routes/lesson.js) stays a thin adapter; lessonTurn(req, body) is the exported turn handler,
// the seam W2-G's /api/lesson/turn-audio calls. Auth, dedupe/replay, the late-turn and outbox semantics are unchanged.
import { q, one, guardStmt, GUARD_FAILED } from "../db.js";
import { need, bad, forbidden, notFound, unauthorized, HttpError } from "../http.js";
import { sessionTokenHash } from "../auth.js";
import { turnVoice } from "../voice/features.js";
import { getTopic } from "../content/index.js";
import { gamingDiscount, nextAffect } from "../learner/affect.js";
import { skillStateStmt, evidenceStmt, misconceptionFlagStmt, misconceptionResolveStmt } from "../learner/model.js";
import { canWrite } from "../learner/mode.js";
import { ledgerStmts } from "../learner/writer.js";
import { LIVE_FOLD_CTX, answerEvents, closeEvents, compactBelief, skillsMapFor, snapshotFromKt, legacySkillState, loadLive, commitLive, evictLive } from "../learner/live.js";
import { newLearnerState, fuseEvidence, beliefFor, noteOutcome, auditRow, weaveEnqueue } from "../comprehension/index.js";
import { facetStmts, probeLogStmt, reteachStmt, gradeAuditStmt, weaveEnqueueStmt } from "../comprehension/store.js";
import { gradeLater, settledGrade, finalEvent, awaitGrade, forgetGrade, pregrade } from "../comprehension/later.js";
import { classify, classifyFast, targetFor, helpOf } from "../director/classify.js";
import { scanSafety, floorViolations } from "../director/safety.js";
import { step, evidenceFrom, upcomingItem } from "../director/state.js";
import { noteModuleEvents, moduleAnswerOf } from "../director/modules.js";
import { findItem, promptFor, revealsAnswer, whyKey, norm as normAnswer } from "../director/items.js";
import { registerBroken } from "../director/register.js";
import { verdictFor, uiVerdict, askText, refersToScreen, wrongAnswersOf } from "../director/say.js";
import { mixedUnitComparison } from "../director/units.js";
import { instructionsFor, instructionsAfter } from "../compiler/instructions.js";
import { prewarm, drop as dropPrewarm } from "../voice/prewarm.js";
import { styleForChild } from "../routes/voice.js";
import { onTurnCommit } from "../conductor/hooks.js";
import { awaitSettled } from "../comprehension/session.js";
import { seamSafe as guardSeam } from "../seam-safe.js";
import { duplexRegistry } from "../duplex/registry.js";
import { studioSeam, isStudioRow } from "../studio/seam.js";
import { relationalSeam } from "../relational/seam.js";
import { expressiveSeam } from "../voice/expressive/seam.js";
import { fallbackReply, floorContentOf, safeguardLine, scrubbed, textReply } from "./say.js";
import { arbitrate } from "./kernel.js";
import { proposalsOf, turnStudioOf, whiteboardAskOf, whiteboardIntentOf, RUNG_ENGINE } from "./propose.js";
import { relationalEffects } from "./relational-adapter.js";
import { withSafetyOpening } from "../relational/openings.js";
import { signalsOf } from "../relational/signals.js";
import { relationalViolations, repairSelfGender, safetyPreface, stripSafetyPreface } from "../director/safety.js";
import { characterForState } from "../compiler/characters/index.js";
import { nextBeat, uiBeatOf } from "./beat.js";
import { momentOf } from "./moment.js";
import { brainTraceStmt, columnReady, comprehensionReasons, inputsHashOf, reteachDecisionOf, tableReady } from "./trace.js";
import { FACTS_ROW_PREFIX } from "../director/modules.js";
import { engagementOf, frustrationLoop, initialAffect } from "../learner/affect.js";
import { turnSignals } from "../persona/signals.js";
import { childTurnRow, clientInstructions, debugFor, floorIncidentStmt, incidentStmt, kitFor, laneOf, runTurnTx, stageTurns, turnInsertStmt, turnLane, withAsk, withSeamUi, withStudioSlot } from "./rows.js";

/**
 * loadLessonFor + the core_tutoring consent check as ONE query, for the turn route: it is on the cascade
 * lane's reply path, where each sequential round trip to Neon is ~0.2-0.4 s (four of them were ~1 s of the
 * measured Director time). Same answers in the same order: 400 bad id, 404 no lesson, 401 not signed in /
 * expired, 403 not this guardian's child; `core` is the latest core_tutoring consent row (hasConsent's rule).
 */
export async function loadTurnContext(req, lessonId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId))) throw bad("invalid lessonId");
  const row = await one(
    `select l.*, to_jsonb(c) as child_row, to_jsonb(g) as guardian_row,
       (select granted from consent k where k.guardian_id = g.id and (k.child_id = c.id or k.child_id is null)
          and k.purpose = 'core_tutoring' order by k.created_at desc limit 1) as core_ok
     from lesson l join child c on c.id = l.child_id
     left join auth_session s on s.token_hash = $2 and s.expires_at > now()
     left join guardian g on g.id = s.guardian_id
     where l.id = $1`, [lessonId, sessionTokenHash(req) ?? ""]);
  if (!row) throw notFound("lesson not found");
  const { child_row: child, guardian_row: g, core_ok: core, ...lesson } = row;
  if (!sessionTokenHash(req)) throw unauthorized();
  if (!g) throw unauthorized("session expired");
  if (child.guardian_id !== g.id) throw forbidden("child not found for this account");
  return { lesson, guardian: { id: g.id, email: g.email, name: g.name, locale: g.locale }, child, core: !!core };
}

/** What a help request is, in the reply model's user turn (it is not the child's words). */
export const HELP_SAID = { hint: "asked for a hint", why: "asked why", know: "says they know this", another: "asked for it another way", slower: "asked her to go slower",
  skip: "asked to skip this one for now", choices: "asked to see choices", how: "asked how to do it" };

// ───────────────────────────── POST /api/lesson/turn ─────────────────────────────

/**
 * What a module-only turn carried, in a few words: its milestones, and how many plain events. An answer is named with
 * the value the child committed and NEVER with the frame's own `correct` claim (F2/F3, evals/owner-truth): the reply
 * model followed "answer (right)" over the server's verdict note when the two disagreed. The verdict the words must
 * agree with is the server's (planTurn lastVerdict → the move's VERDICT_NOTE and the G-PRAISE guards).
 */
const valueOf = (d) => {
  if (!d || typeof d !== "object") return "";
  const v = d.value ?? d.written ?? d.built ?? d.chosen ?? d.choice ?? d.picked;
  return v == null || typeof v === "object" ? "" : ` ${String(v).replace(/[^\p{L}\p{N} /.,-]/gu, "").slice(0, 24)}`.trimEnd();
};
export function activitySummary(events, dropped) {
  const milestones = events.filter((e) => ["goal_met", "stuck", "answer"].includes(e?.type)).map((e) =>
    e.type === "answer" ? `answer${valueOf(e.data)}` : `${e.type} ${String(e.name ?? "").slice(0, 40)}`.trim());
  const other = events.length - milestones.length + dropped;
  return [...milestones, ...(other ? [`${other} other event${other === 1 ? "" : "s"}`] : [])].join("; ");
}

/**
 * A held answer for a lesson the page-hide beacon closed is still accepted this long after the close (the outbox
 * drops a record older than 24 h unsent: src/lesson/outbox.ts).
 */
export const LATE_TURN_MS = 24 * 3600_000;
/** Moves that pose a kit item of their own: a NEW Studio piece waits while one is on the table (one task at a time). */
const ASKING_MOVES = new Set(["probe", "practice", "retrieval", "teachback"]);
/** How many landed turnSeqs a lesson remembers for dedupe (the outbox resends in order, so the window is short). */
export const ACKS_MAX = 16;

/** The outbox's key for this answer (contracts.ts TurnRequest.turnSeq), or null for a client that sends none. */
export const turnSeqOf = (body) => (Number.isInteger(body?.turnSeq) && body.turnSeq > 0 && body.turnSeq < 1e9 ? body.turnSeq : null);

/** Did the page-hide beacon close this lesson recently enough for a held answer to still land? Exported for tests. */
export function acceptsLate(lesson, turnSeq, now = Date.now()) {
  return !!lesson.ended_at && turnSeq != null && lesson.state?.endedBy === "pagehide"
    && now - new Date(lesson.ended_at).getTime() < LATE_TURN_MS;
}

/**
 * PURE. The response a resend of `turnSeq` gets when that turn already landed (dedupe on (lessonId, turnSeq)): the
 * landed turn's own response when it was the lesson's latest, else the current directives (an older resend: nothing
 * to say again). null when the turn has not landed. Never counts anything: no row, no evidence, no model call.
 */
export function replayFor(state, turnSeq) {
  if (turnSeq == null || !(state?.acks ?? []).some((a) => a.turnSeq === turnSeq)) return null;
  const last = state.lastAck?.turnSeq === turnSeq ? state.lastAck.out : null;
  return { ...(last ?? { move: state.lastMove ?? { kind: "hold", shape: "" }, moduleCommands: [], ui: state.lastUi ?? {}, ...(state.phase === "done" ? { end: true } : {}) }),
    duplicate: true };
}

/** The voice lane's replayed response also needs the current instructions (they are never stored). */
export async function replayResponse(lesson, state, replay, extra = {}) {
  const kit = laneOf(state.mode) === "voice" ? await kitFor(lesson.topic_id, state).catch(() => null) : null;
  return { ...replay, ...(kit ? clientInstructions(state.mode, instructionsFor(state, kit)) : {}), ...extra };
}

/**
 * The turn handler (the seam W2-G's /api/lesson/turn-audio calls): one child turn in, the TurnResponse out (always a 200
 * body; every refusal is a thrown HttpError, exactly as the route answered before BR1).
 * @type {(req: any, body: import("../../shared/contracts").TurnRequest) => Promise<import("../../shared/contracts").TurnResponse>}
 */
export async function lessonTurn(req, body) {
  const t0 = performance.now();
  const trace = [];
  // W2-E fixer (TB12): a seam that throws falls back (seam-safe.js) AND leaves a component_error.<component> code on the
  // turn's trace row, so "why did Studio show nothing?" is answerable from brain_trace alone. Same contract as seamSafe.
  // (Shadows the module's guard inside the turn, so every call site still reads seamSafe("<seam>", …): tests/w2-seams.)
  const seamErrors = new Set();
  const seamSafe = (name, fn, fallback = null) => guardSeam(name, () => {
    try {
      const out = fn();
      return out && typeof out.then === "function" ? out.catch((e) => { seamErrors.add(name.split(".")[0]); throw e; }) : out;
    } catch (e) { seamErrors.add(name.split(".")[0]); throw e; }
  }, fallback);
  // Phase marks (ms since the request arrived) ride in debug.timings beside the model calls: evals/cascade-latency.mjs.
  const mark = (name) => trace.push({ kind: `@${name}`, ms: Math.round(performance.now() - t0) });
  const { lesson, guardian, child, core } = await loadTurnContext(req, need(body, "lessonId").lessonId);
  mark("ctx");
  // Dedupe on (lessonId, turnSeq): a resend of an answer that already landed gets that turn's response back and is
  // never stored, graded or replied to twice (the outbox resends after a lost response, a timeout or "Try again").
  const turnSeq = turnSeqOf(body);
  const edited = !!body.edited && turnSeq != null;
  const replay = replayFor(lesson.state, turnSeq);
  // A lesson closed by the page-hide beacon still takes the answers the outbox held for it (stored and graded, no
  // reply unless it was a disclosure); any other closed lesson refuses, and the client drops the record. Checked
  // BEFORE a replay: a resend after a normal end, or after consent was withdrawn, never gets her words back.
  const late = acceptsLate(lesson, turnSeq);
  if (lesson.ended_at && !late) throw new HttpError(409, "lesson has ended");
  const childText = String(body.childText || "").slice(0, 2000).trim();
  // Consent is checked per turn, like start and token: once core_tutoring is withdrawn the child's words are
  // not stored, classified or sent to a model. The safety predicate still reads them (on this server only),
  // and a disclosure still leaves an incident row — without the transcript (once: a replayed turn already did).
  if (!core) {
    const safety = replay ? { distress: false } : scanSafety(childText);
    if (safety.distress) {
      await q("insert into incident(child_id, lesson_id, kind, severity, detail) values ($1,$2,'safeguarding','high',$3) returning id",
        [child.id, lesson.id, { source: "predicate", family: safety.kind, consentWithdrawn: true }]);
    }
    throw forbidden("core_tutoring consent withdrawn");
  }
  if (replay) return replayResponse(lesson, lesson.state, replay, edited ? { editLanded: true } : {});
  // "Fix" (edited: the same turnSeq, corrected words) REPLACES an attempt still in flight: the mark makes that attempt
  // lose its commit (its guard checks state.supersede), so only the corrected answer is counted. One statement: it
  // refuses when the first attempt landed meanwhile (then the landed response is replayed).
  if (edited) {
    const marked = await one(`update lesson set state = jsonb_set(state, '{supersede}', to_jsonb($2::int))
        where id = $1 and (ended_at is null or $3::boolean)
          and not coalesce(state->'acks' @> jsonb_build_array(jsonb_build_object('turnSeq', $2::int)), false) returning id`, [lesson.id, turnSeq, late]);
    if (!marked) {
      const cur = await one("select ended_at, state from lesson where id = $1", [lesson.id]);
      const again = cur && replayFor(cur.state, turnSeq);
      if (again) return replayResponse(lesson, cur.state, again, { editLanded: true });
      throw new HttpError(409, "lesson has ended");
    }
  }
  const prev = lesson.state;
  const state = structuredClone(prev);
  delete state.supersede;
  // This spoken turn's on-device voice features (TurnRequest.voiceFeatures): stored and z-scored against the
  // child's own baseline alongside classify, so the signals are this utterance's, never the previous one's.
  // Off the critical path (runs in parallel; never throws). Tie-breakers only — see server/voice/features.js.
  const voiceP = body.voiceFeatures && !body.typed
    ? turnVoice({ lessonId: lesson.id, childId: child.id, itemId: prev.activeItemId, voiceFeatures: body.voiceFeatures })
    : Promise.resolve(null);
  let voiceNow = null;
  voiceP.then((v) => { voiceNow = v; }, () => {});
  // The child's folded learner state (kt_evidence rows after the cached seq: one indexed read, in parallel with
  // the kit and the classifier, shared by the real plan and every speculative one).
  const liveP = loadLive(child);
  liveP.catch(() => {});
  // The 016 tables (brain_trace, decision_record): probed once per process, beside the kit read (trace.js tableReady).
  const tablesP = Promise.all([tableReady("brain_trace", q), tableReady("decision_record", q), columnReady("brain_trace", "misconception_id", q)]);
  const kit = await kitFor(lesson.topic_id, state);
  mark("kit");
  // The lane is the lesson's mode. `typed` only says there was no ASR: a typed or tapped turn in a voice
  // lesson is still voice-lane (a text reply for it was never heard, yet was stored as a teacher turn).
  const { textLane, typed } = turnLane(state.mode, body);
  const moduleEvents = Array.isArray(body.moduleEvents) ? body.moduleEvents : [];
  const dropped = Number.isInteger(body.droppedEvents) && body.droppedEvents > 0 ? body.droppedEvents : 0;
  // contracts.ts TurnRequest: the child acted in an activity and said nothing. Never graded as a reply —
  // it was once stored as "[no speech]", classified unclear, and walked the lesson plan.
  const moduleOnly = !childText && !body.chipId && body.asrConfidence !== 0 && moduleEvents.length > 0;
  // W1-B #4: a frame `error` on the mounted module clears it (no screen target, no module tray, never mounted again in
  // this lesson), BEFORE anything below reads state.module.
  noteModuleEvents(state, moduleEvents);
  // A help request (the Hint sheet, the Young Help menu: classify.js HELP_REQUESTS) is a client action, never the child's
  // words: stored as a system row (never in a transcript, the parent's quote or "In {child}'s words"), never graded.
  // Same predicate as classifyFast: words that trip the safety scan are never a help request, so a disclosure that rides on a
  // help chip id is stored as the child's row (transcript, safeguarding record) and given to the reply model as said.
  const help = helpOf(body.chipId) && !scanSafety(childText).distress ? helpOf(body.chipId) : null;
  // W2-D (TurnRequest.laneResume): the first turn after a realtime → cascade switch (server/voice/realtimeSession.js). Once
  // per switch, with nothing from the child: no child row, no classification, no evidence. The realtime turn last heard
  // (teacherText) is accepted once although the lane is now cascade, so it is stored and checked like any voice turn
  // (answer leak, spoiled item, floor, the helpline after a safeguard). When the move planned for the child's last answer
  // was never voiced (the refusal ate it), the cascade voices that move now (the plan holds; nothing is re-planned).
  const laneResume = body.laneResume === true && !!prev.laneSwitch && !prev.laneSwitch.resumed && !late
    && !childText && !body.chipId && !moduleEvents.length;
  if (laneResume) state.laneSwitch = { ...prev.laneSwitch, resumed: true };

  // The teacher's last turn as heard (voice lane only: in the text lane the server wrote and stored every
  // teacher line, and an echo of it stored each one twice), then the child's turn.
  const activeItem = findItem(state, kit, state.activeItemId);
  const teacherText = textLane && !laneResume ? "" : String(body.teacherText || "").slice(0, 2000);
  // The resume turn re-voices the planned move when the realtime lane never finished it (nothing heard, or cut off).
  const revoice = laneResume && !!prev.lastMove && !prev.moveVoiced && prev.phase !== "done" && (!teacherText || !!body.teacherInterrupted);
  // The client heard the teacher voice lastMove (contracts.ts TurnRequest.teacherText): until step() plans a
  // new move, the instructions frame it as already said.
  if (teacherText) state.moveVoiced = true;
  // What she last said, as the classifier reads it: masked like the child's words (a voice transcript can echo them).
  const heardRaw = teacherText || state.recent.findLast((t) => t.who === "teacher")?.text;
  const heard = heardRaw ? scrubbed(heardRaw) : heardRaw;
  const leaked = !!teacherText && !!activeItem && state.hintLevel < 4 && state.pendingWhy !== activeItem.id && revealsAnswer(teacherText, activeItem);
  // A voice turn can state the key of the question that comes NEXT (an explain turn, a re-teach): that item's
  // answer is then worth nothing. The text lane's reply is guarded before it is sent, and checked below.
  const spoils = teacherText ? spoiledBy(teacherText, state, kit, activeItem) : null;
  if (spoils) state.spoiled = [...(state.spoiled ?? []), spoils];
  const turnRows = [];
  // Voice lane: the realtime model wrote and spoke this turn itself, so its words are checked after the fact. A floor
  // break becomes state.correction (compile.js renders the fix first in the next instructions); a register or
  // screen mismatch is flagged on the row for review (it cannot be unsaid).
  // The call-site recipe: the posed item's verified content is passed (floorContentOf); the turn being judged is the one
  // the last move asked for, so a safeguard turn must carry the helpline and a goodbye must not hook (NEVER MANIPULATE).
  const voiceFloor = teacherText ? [...floorViolations(teacherText, { content: floorContentOf(activeItem),
    requireHelpline: state.lastMove?.kind === "safeguard", goodbye: state.lastMove?.kind === "wrap" }),
    // W2-I R3: the realtime lane composes its own safeguarding words; a spoken-planning preface on a safeguard turn (P2:
    // 18/18) and the relational families correct on the next turn (the fixed opening is the client's, safetyStrings.ts)
    ...(state.lastMove?.kind === "safeguard" && safetyPreface(teacherText) ? ["meta_talk"] : []),
    ...relationalViolations(teacherText, { content: floorContentOf(activeItem), gender: characterForState(state)?.pronouns?.subject === "he" ? "m" : "f" })] : [];
  if (teacherText) {
    turnRows.push({ speaker: "teacher", text: teacherText,
      meta: { interrupted: !!body.teacherInterrupted, ...(leaked ? { answerLeak: true } : {}), ...(spoils ? { spoils } : {}),
        // the realtime model wrote this turn itself: a mixed-unit comparison is flagged for review (it cannot be unsaid)
        ...(mixedUnitComparison(teacherText) ? { unitMix: true } : {}),
        ...(voiceFloor.length ? { floor: voiceFloor } : {}),
        ...(registerBroken(teacherText, state.ctx?.address) ? { register: true } : {}),
        ...(refersToScreen(teacherText) && !(state.lastUi?.chips?.length || state.module) ? { screenRef: true } : {}) } });
  }
  // The outbox key rides on the row: evidence from a resent turn is marked retried (§4.7), an edit says so, and a
  // late answer (a page-hide-closed lesson) is marked late.
  const extra = { ...(dropped ? { droppedEvents: dropped } : {}), ...(turnSeq != null ? { turnSeq } : {}), ...(body.retried ? { retried: true } : {}),
    ...(edited ? { edited: true } : {}), ...(late ? { late: true } : {}) };
  turnRows.push(laneResume
    ? { speaker: "system", text: "[lane: realtime → cascade]", meta: { laneResume: true, ...extra } }
    : moduleOnly
    ? { speaker: "system", text: `[activity: ${activitySummary(moduleEvents, dropped)}]`, meta: { module: true, ...extra } }
    : help ? { speaker: "system", text: `[help: ${help}]`, meta: { help, typed: true, chipId: body.chipId, ...extra } }
      : childTurnRow({ childText, chipId: body.chipId, asrConfidence: body.asrConfidence, typed, extra }));
  const staged = stageTurns(state, turnRows);

  // Classify against the active item's key (never free grading). A module answer on the active item's own
  // module is machine truth; a module-only turn has nothing else to classify.
  const target = targetFor(state, kit, activeItem);
  // W1-B #5/#6: a G1 fill is graded by its server-side binding (forge/grade.js gradeEvent), never by the frame's
  // `correct`; a bound catalog engine carries the engine's verdict (director/modules.js moduleAnswerOf).
  const moduleAnswer = moduleAnswerOf(state, moduleEvents);
  const machineAnswer = typeof moduleAnswer?.correct === "boolean" && target.mode === "item";
  const clsArgs = { target, childText, heard, lang: state.ctx?.lang, asrConfidence: body.asrConfidence, typed, chipId: body.chipId, moduleAnswer, classLevel: child.class_level, trace };
  const classified = !(moduleOnly && !machineAnswer) && !laneResume;
  const answer = normAnswer(childText);
  const tapped = body.chipId?.startsWith("opt:") ? activeItem?.options?.[Number(body.chipId.slice(4))]?.text
    : body.chipId?.startsWith("pick:") ? state.offered?.options?.[Number(body.chipId.slice(5))] : body.chipId?.split(":")[1];
  const said = laneResume ? "(no new words from the child: the call moved lines)"
    : help ? `(the child tapped a help button: ${HELP_SAID[help] ?? help} — not an answer)`
    : childText || (moduleOnly ? `(no words; in the activity: ${activitySummary(moduleEvents, 0)})` : `(tapped: ${tapped ?? "nothing"})`);
  // W1-C settle: the child is answering a pending why → this turn will hold a probe.why on the active item with exactly
  // this grade request; its blind grade starts NOW, beside the classifier and the reply (later.js pregrade; gradeLater
  // adopts the running calls when the plan holds the event, so the grade is never run twice).
  if (childText && !moduleOnly && !help && activeItem && state.pendingWhy === activeItem.id) {
    try { pregrade(lesson.id, gradeRequestFor({ cls: "probe.why", target: activeItem.skillId }, { kit, activeItem, state, childText })); } catch { /* the post-plan launch still grades it */ }
  }
  // Last turn's held why / teach-back events, with their blind verdict if it is in. Seam (W1-C): the settle runs BESIDE
  // the classifier — at least 600 ms, as long as the classifier takes, at most later.js SETTLE_CAP_MS — so a verdict
  // that lands while the classifier runs is folded at no cost to the turn (the serial 600 ms wait used to sit in front
  // of it). The speculative replies are planned on what is in now; the real plan re-reads the carried events after.
  const heldIds = (state.kt?.deferred ?? []).map((d) => d.event.id);
  let clsDone = () => {};
  const clsGate = new Promise((res) => { clsDone = res; });
  const settling = heldIds.length ? awaitSettled(heldIds, 600, { until: clsGate }).catch(() => {}) : null;
  let carried = carriedFrom(state);
  // Seam (W2-H, server/studio/seam.js): what Studio has on screen / in flight for this lesson, as values (in memory, no
  // network). null = nothing, and the plan context is exactly the pre-seam one.
  const studioView = seamSafe("studio.statusFacts", () => studioSeam.statusFacts(lesson.id, { beat: prev.beat?.type ?? null, moduleOnly: moduleOnly || laneResume }), null);
  // A resume turn plans as a module-only turn with no events: the Director holds (the last move and UI stand).
  const planCtx = { kit, child, lesson, activeItem, moduleOnly: moduleOnly || laneResume, moduleEvents, chipId: body.chipId, answer: help ? "" : answer, leaked, live: liveP, carried,
    childText, typed, asrConfidence: body.asrConfidence, bargeIn: !!body.teacherInterrupted, ...(studioView ? { studio: studioView } : {}) };
  // A module-only turn or a help request stored no child row, so the whole recent transcript is history.
  const historyOf = (next) => (moduleOnly || help || laneResume ? next.recent : next.recent.slice(0, -1));

  // Text lanes: when the classifier must ask the model, the reply for its likely outcomes starts NOW, in
  // parallel, and the one whose inputs turn out identical to the real plan's is used (speculate()).
  // ONE clock for the turn: the speculative plans and the real one are stepped at the moment the turn
  // arrived. Each used to read Date.now() when it ran, so a classifier call that crossed a 6 s boundary
  // moved the compiled "minute" line and every speculation missed on that alone (2/8 turns,
  // evals/cascade-latency.mjs 2026-10-02: "minute 0.7 || minute 0.8").
  const now = Date.now();
  const fast = classified ? classifyFast(clsArgs) : null;
  // A low-confidence transcript is already decided (no evidence, source "asr"); only the model's distress
  // backup is pending, so its one likely plan is speculated. A distress verdict changes the plan (safeguard),
  // its key no longer matches, and the real reply is written as before.
  const specs = textLane && !late && fast && !fast.result
    ? speculate(state, target, fast.flags, { ...planCtx, now }, { said, historyOf }, fast.lowAsr ? { outcomes: ["no_evidence"], source: "asr" } : {})
    : [];
  let cls;
  try { cls = classified ? await classify(clsArgs) : null; } finally { clsDone(); }
  mark("classified");
  // safety-robust (2026-10-05; INTEGRATION.md §2.1, PLAN X-1 / W2.5-2): the duplex floor's sticky partial-safety state
  // (TurnRequest.duplex.safetyPending: the predicate ran on EVERY partial, and a hit stays even when the final transcript
  // was revised clean) is OR-ed into this turn's distress flag before planTurn; it never subtracts. A client can only use
  // it to force a safeguard (fail closed), never to suppress one.
  const pendingSafety = body.duplex?.safetyPending;
  if (cls && pendingSafety && !cls.flags?.distress) {
    cls = { ...cls, flags: { ...cls.flags, distress: true, distressKind: cls.flags?.distressKind ?? (typeof pendingSafety.kind === "string" ? pendingSafety.kind : "duplex_partial") } };
  }
  // ... and a model distress read on the committed turn (classify's model flag or distressCheck, which now runs on every
  // committed child turn with words) reaches the duplex floor as a model note, so a reply speculated on the partials is
  // cancelled there as well (PartialSafety.modelNote was never called before this).
  if (cls?.flags?.distress && cls.source !== "predicate") {
    seamSafe("duplex.modelNote", () => duplexRegistry.sliceFor(lesson.id)?.modelNote(cls.flags.distressKind, Date.now()) ?? null, null);
  }
  if (settling) { await settling; carried = carriedFrom(state); planCtx.carried = carried; mark("settled"); }
  // This utterance's voice tie-breakers (features.js signalsFrom: capped booleans) reach the plan only if they are
  // already in when the classification is: the turn never waits on them (CE8: zero evidence weight, tie-break and
  // pacing only). A speculative reply was planned without them, so a non-empty signal set can only miss it.
  if (voiceNow?.reliable && Object.keys(voiceNow.signals ?? {}).length) planCtx.voice = { signals: voiceNow.signals, z: voiceNow.z };

  // Evidence → learner model → Director step → compile, all staged as statements for the turn's one transaction.
  let plan = await planTurn(state, cls, { ...planCtx, now });
  let { evidence, writes, skillChanges, incident, r, instructions, skipped } = plan;
  mark("planned");
  let next = r.state;
  // Seam (W2-I, server/relational/seam.js): one RelationalDirective per turn (pure, ≤ 3 ms). null = no relational move, and
  // nothing below changes. W2-E's BR5 splits it into the kernel's authority ranks; until then only its face display rides
  // the ui (teacherAffect, never keyed to a correct verdict).
  const relational = seamSafe("relational.decide", () => relationalSeam.decide({ lessonId: lesson.id, childId: child.id, turn: next.turn,
    childText: moduleOnly || help ? "" : childText, cls: cls ? { outcome: cls.outcome, flags: cls.flags } : null, move: r.move.kind,
    lane: state.mode === "text" || state.mode === "cascade" ? state.mode : "voice", safety: r.move.kind === "safeguard" || !!incident,
    // W2-I: a verdict reversed on re-check against the key (W1-C held-verdict settle / grade_audit) is the teacher-owned slip
    verdictReversed: !!cls?.flags?.verdictReversed }), null);
  // ── The kernel (BR1/BR5; TEACHER-BRAIN TB1, §10): every component's proposals, one arbitration by authority and budget.
  // Today's proposers: the Director (its move; a safeguard is the safety floor), the relational directive (split into its
  // ranks by relational-adapter.js), Studio's turn view, the whiteboard ask on an explanation beat, the vibe knobs.
  const lane = laneOf(state.mode);
  const kernelRun = () => {
    const beat = nextBeat(prev.beat, r.move, next);
    // the Director's only new thing on screen is its template whiteboard rung (W2-B): the live board replaces it (owner
    // priority 6), the rung stays the fallback when Studio declines
    const rungMounted = r.ui?.tray === "module" && next.module?.engine === RUNG_ENGINE;
    const wb = whiteboardAskOf({ beat, lane, late, strained: frustrationLoop(next.affect ?? initialAffect()), move: r.move, studioView: late ? null : studioView, rungMounted, requested: !!r.move?.visual });
    const t1 = performance.now();
    const proposals = proposalsOf({ r, relational, studioView: late ? null : studioView, whiteboard: wb.proposals, vibe: next.vibe });
    const arb = arbitrate(proposals);
    return { beat, wb, proposals, arb, us: Math.round((performance.now() - t1) * 1000) };
  };
  let kernel = kernelRun();
  // BR5: the bond outranks the plan (the child's goodbye ends the lesson this turn: NEVER MANIPULATE), and the relational
  // floor outranks everything. When the accepted directive asks for either and the Director's move is not already it,
  // the turn is re-planned through the Director's own stop / safeguarding path (one more pure plan, no model call),
  // exactly as the content-filter path re-plans a disclosure. An accepted overlay re-plans so the compile sees it.
  const relFx = relationalEffects(kernel.arb);
  const needRelease = relFx.release && !["wrap", "safeguard"].includes(r.move.kind);
  const needSafety = relFx.safety && r.move.kind !== "safeguard";
  if (needRelease || needSafety || relFx.overlay || relFx.callbackId || relFx.noticeId) {
    const relCls = needSafety ? { ...(cls ?? { outcome: "no_evidence", confidence: 1 }), source: cls?.source ?? "relational",
      flags: { ...(cls?.flags ?? fast?.flags ?? {}), distress: true, distressKind: cls?.flags?.distressKind ?? "relational_floor" } }
      : needRelease ? { ...(cls ?? { outcome: "no_evidence", confidence: 1, source: "relational" }), relRelease: true, flags: { ...(cls?.flags ?? fast?.flags ?? {}), wantsToStop: true } }
        : cls;
    const rel = { turn: next.turn, ...(relFx.overlay ? { overlay: relFx.overlay } : {}), ...(relFx.callbackId ? { callbackId: relFx.callbackId } : {}),
      ...(relFx.noticeId ? { noticeId: relFx.noticeId } : {}) };
    plan = await planTurn(state, relCls, { ...planCtx, now, rel });
    ({ evidence, writes, skillChanges, incident, r, instructions, skipped } = plan);
    next = r.state;
    kernel = kernelRun();
    kernel.replanned = true;
  }
  if (relFx.floorFix.length) next.correction = [...new Set([...(next.correction ?? []), ...relFx.floorFix])];
  next.beat = kernel.beat;
  // G-AUTHORITY on the real turn (not only on arbitrate() in isolation): the move sent is the move the kernel accepted. A
  // mismatch (a proposer the Director's re-plan did not honour) is logged and traced as component_error.director.
  const authorityCheck = () => {
    const k = kernel.arb.move?.payload?.move?.kind;
    if (k && k !== r.move.kind) { seamErrors.add("director"); console.warn(`[brain] kernel move ${k} ≠ sent move ${r.move.kind} (lesson ${lesson.id} #${next.turn})`); }
  };
  authorityCheck();
  mark("kernel");
  // W1-C settle: start the blind grade of this turn's held why / teach-back NOW (or adopt the pregrade), while the reply
  // is written and the turn commits, not after; the post-commit launchGrades below is then a no-op for the same event
  // ids (later.js gradeLater is idempotent per event id).
  launchGrades(next);
  // What the child did on this turn, for the lesson summary (DidCards): graded answers only, from the classifier.
  noteDid(next, { cls, target, activeItem, kit, childText, tapped, hintLevel: state.hintLevel, seq: childRowSeq(staged), leaked });
  // Voice lane: the floor families the heard teacher turn broke → the next compile's correction (cleared when clean).
  if (!textLane || (laneResume && teacherText)) next.correction = voiceFloor.length ? voiceFloor : undefined;
  // ... and when it broke a family that must never reach a child, an incident row (family names only) in the turn's
  // transaction, keyed to the stored teacher row.
  const floorIncidents = [];
  const voiceRow = teacherText ? staged.find((x) => x.speaker === "teacher") : null;
  const voiceIncident = voiceRow ? floorIncidentStmt(child.id, lesson.id, voiceRow.seq, voiceFloor, state.mode) : null;
  if (voiceIncident) floorIncidents.push(voiceIncident);
  let teacherReply, teacherReplySeq, guard, speculation, prewarmed = false, replyFloor = [], delivery = null;
  /** The turn's Moment (TB6): voice (planDelivery) and face read the same object. */
  const momentNow = () => momentOf({ move: r.move, verdict: next.lastVerdict,
    engagement: engagementOf(next.affect, { turn: next.turn, stopping: r.move.kind === "wrap" && !!r.proposal?.mandatory }),
    relational, ctx: next.ctx, turn: next.turn, safety: r.move.kind === "safeguard" || !!incident,
    childLaughed: !!cls?.flags?.humour || (!moduleOnly && !help && turnSignals({ text: childText }).laughter),
    studio: turnStudioNow()?.reveal || studioSlot ? "revealing" : undefined, lane, childText: moduleOnly || help ? "" : childText, typed });
  let moment = null;
  // Seam (W2-H, server/studio/seam.js slotFor): the Studio slot this turn shows: the piece the kernel let Studio reveal, or
  // the piece already on screen (it stays in the tray across turns until retired). Known BEFORE the reply, so the reply
  // guard counts it as a screen target (director/say.js screenHasTargets reads ui.studioSlot). A whiteboard ack below
  // replaces it. null = nothing from Studio (the pre-seam turn).
  let studioSlot = late ? null
    : seamSafe("studio.slotFor", () => (typeof studioSeam.slotFor === "function" ? studioSeam.slotFor(lesson.id, turnStudioOf(kernel.arb),
      { beat: kernel.beat?.type ?? null, tray: r.ui?.tray ?? null, safety: r.move.kind === "safeguard" || !!incident,
        asking: !!r.move.itemId && ASKING_MOVES.has(r.move.kind) }) : null), null);
  // Seam (W2-H fixer): the Studio facts row for THIS turn's reply comes from the slot the turn actually shows (after the
  // kernel and slotFor), never from the pre-arbitration view: a refused or held reveal, or a piece hidden by the
  // Director's tray, puts nothing on the row (AT-7: her line names only on-screen values). The row replaces last turn's,
  // and the instructions are recompiled only when the row changed.
  if (!late) {
    const studioRow = studioSlot ? seamSafe("studio.factsRowForSlot", () => (typeof studioSeam.factsRowForSlot === "function" ? studioSeam.factsRowForSlot(lesson.id, studioSlot) : null), null) : null;
    const before = Array.isArray(next.lastContent) ? next.lastContent : [];
    const kept = before.filter((l) => !isStudioRow(l));
    const content = studioRow ? [...kept, studioRow] : kept;
    if (content.length !== before.length || content.some((l, i) => l !== before[i])) {
      next.lastContent = content;
      try { instructions = instructionsFor(next, kit); } catch (e) {
        // the row does not fit the budget: the turn goes on without it (and the reply guard strips any screen pointer)
        next.lastContent = kept;
        try { instructions = instructionsFor(next, kit); } catch { next.lastContent = before; }
        console.warn(`[studio] facts row left out of the compile: ${String(e?.message ?? e).slice(0, 80)}`);
      }
    }
  }
  // Studio's actions for this turn as they reach the child: the kernel's accepted ones, minus a reveal Studio's slotFor held
  // (the tray is the Director's this turn, or the beat moved on). A reveal with no slot would mark a piece revealed, write
  // its studio_mount row and count in "Made for {child}" while the child never saw it (W2-E fixer, blocker).
  const studioReasons = [];
  let wbAcked = false, rungReplaced = false;
  const turnStudioNow = () => {
    const ts = late ? null : turnStudioOf(kernel.arb);
    if (!ts?.reveal || studioSlot?.intentId === ts.reveal) return ts;
    const { reveal: _held, ...rest } = ts;
    return Object.keys(rest).length ? rest : null;
  };
  // The verdict the teacher's words must agree with (G-PRAISE-1; planTurn: only a kit item graded against its key has one).
  const verdict = next.lastVerdict ?? "ungraded";
  if (textLane && (!r.hold || revoice) && !late) {
    const key = replyKey(next, kit, r, instructions, said, historyOf(next));
    const hit = await pickSpeculation(specs, key);
    speculation = specs.length ? { tried: specs.length, hit: !!hit, ...(hit ? {} : { differs: await missReason(specs, key) }) } : undefined;
    if (hit) trace.push(...hit.trace.map((t) => ({ ...t, speculative: true })));
    let filtered;
    ({ reply: teacherReply, guard, filtered, floor: replyFloor = [] } = hit
      ? hit.result
      : await textReply({ instructions, state: next, kit, childText: said, trace, history: historyOf(next), verdict, ui: withStudioSlot(r.ui, studioSlot), module: next.module }));
    // The content filter blocked the reply call that carried the child's words: fail CLOSED. The turn is
    // re-planned as a disclosure (safeguard move, incident row) and the fixed helpline line is sent, with no
    // further model call on the same words.
    if (filtered && (childText || body.chipId)) {
      const blockedCls = { ...(cls ?? { outcome: "no_evidence", confidence: 1 }), source: "content_filter",
        flags: { ...(cls?.flags ?? fast?.flags ?? {}), distress: true, distressKind: cls?.flags?.distressKind ?? "content_filter" } };
      plan = await planTurn(state, blockedCls, { ...planCtx, now });
      ({ evidence, writes, skillChanges, incident, r, instructions, skipped } = plan);
      next = r.state;
      noteDid(next, { cls: blockedCls, target, activeItem, kit, childText, tapped, hintLevel: state.hintLevel, seq: childRowSeq(staged), leaked });
      teacherReply = fallbackReply(next, null);
      guard = { ...guard, caught: [...new Set([...(guard?.caught ?? []), "content_filter"])], replaced: true };
      replyFloor = [];
      // the move is now the safeguard: the kernel runs again so the floor freezes everything below it
      kernel = kernelRun();
      next.beat = kernel.beat;
      authorityCheck();
      // and Studio freezes too: nothing new on screen, whatever was there retires (STUDENT-FLOW §5.7)
      studioSlot = null;
      seamSafe("studio.onSafety", () => (typeof studioSeam.onSafety === "function" ? studioSeam.onSafety(lesson.id) : null), null);
    }
    // Text lanes: what will be said (the cascade speaks exactly this) is clean after the guard; if even the fixed
    // line broke a family, the next compile renders the fix first, as on the voice lane.
    if (replyFloor.length) next.correction = replyFloor;
    // W2-I R3 (RELATIONAL-OS §9.4; P2: spoken planning on 18/18 heavy turns, English on 24/30 safety turns to a Hinglish
    // child): a safeguarding reply starts with the vetted opening in the child's language mode and address form
    // (server/relational/openings.js = src/lesson/safetyStrings.ts), and a model preface before it is cut. Both helplines
    // are in the opening, so the floor's requireHelpline check holds even when the model's words are dropped.
    // The neutral CHECK opening only when a classifier-only safeguard fired on pleading, loneliness, a stop or a goodbye
    // (it must not tell the child they disclosed something: AT-B1 cascade, CONVERSATION-V2 F10); otherwise DISCLOSURE.
    // Once per safeguarding episode (the first safeguard turn): a repeated opening reads robotic (AT-B1 cascade).
    if (r.move.kind === "safeguard" && teacherReply && !prev.safeguard) {
      const pleading = signalsOf(childText, { harm: false }).some((x) => ["goodbye_distress", "loneliness", "end_request", "goodbye", "tired"].includes(x.kind));
      teacherReply = withSafetyOpening(teacherReply, next.ctx?.lang, { address: next.ctx?.address,
        kind: scanSafety(childText).distress || relFx.safety || !pleading ? "disclosure" : "check", stripPreface: stripSafetyPreface });
    } else if (r.move.kind === "safeguard" && teacherReply) teacherReply = stripSafetyPreface(teacherReply);
    // W2-I R3 (RELATIONAL-OS §11): the relational never-rules on her final words. They correct on the next turn (W2-C renders
    // their REL_FLOOR_FIX rows) and never block: no precision ≥ 0.9 is measured out of sample yet.
    // W2-I fixer (2026-10-05): her possessive self-reference follows the persona's gender on every lane ("main aapki AI
    // teacher hoon" from a male sheet is swapped before it is stored or spoken; deterministic, one word).
    const selfGender = characterForState(next)?.pronouns?.subject === "he" ? "m" : "f";
    teacherReply = repairSelfGender(teacherReply, selfGender);
    const relFloor = relationalViolations(teacherReply, { content: floorContentOf(next.lastMove?.itemId ? findItem(next, kit, next.lastMove.itemId) : null),
      gender: selfGender });
    if (relFloor.length) next.correction = [...new Set([...(next.correction ?? []), ...relFloor])];
    const replyItem = next.lastMove?.itemId ? findItem(next, kit, next.lastMove.itemId) : null;
    const replySpoils = spoiledBy(teacherReply, next, kit, replyItem);
    if (replySpoils) next.spoiled = [...(next.spoiled ?? []), replySpoils];
    const [row] = stageTurns(next, [{ speaker: "teacher", text: teacherReply,
      meta: { move: r.move.kind, ...(guard.caught.length ? { guard: guard.caught } : {}), ...(replySpoils ? { spoils: replySpoils } : {}),
        ...(replyFloor.length ? { floor: replyFloor } : {}) } }]);
    staged.push(row);
    teacherReplySeq = row.seq;
    const replyIncident = floorIncidentStmt(child.id, lesson.id, row.seq, replyFloor, state.mode);
    if (replyIncident) floorIncidents.push(replyIncident);
    mark("replied");
    // Cascade: the guarded reply starts speaking now, while the transaction below runs (server/voice/prewarm.js);
    // a turn that is not stored drops it.
    // The text lane too (smooth G4): its voice was a whole-mp3 /api/tts call 1.6-2.1 s after the text; TextLink now
    // streams /api/voice/tts-stream, which takes this prewarm (decision cascade-tts-prewarm).
    // Seam (W2-G, server/voice/expressive/seam.js): the DeliveryPlan for the guarded reply, from the Brain's Moment only.
    // The Moment is W2-E's (server/brain/moment.js, BR2); until it exists it is null and so is the plan.
    moment = momentNow();
    delivery = seamSafe("expressive.planDelivery", () => expressiveSeam.planDelivery(moment, teacherReply), null);
    // The whiteboard (owner priority 6): when the kernel accepted the ask on an explanation beat, Studio gets the guarded
    // line it must draw beside (drawn tokens ⊆ the line's tokens ∪ kit values) and the kit truth on the table. Studio
    // answers at once with the slot it will stream the drawing script into, or null (nothing changes on screen).
    const ask = kernel.arb.accepted.find((p) => p.kind === "ask_whiteboard");
    // a picture the child asked for is drawn even when the guard replaced her words (owner-truth patch 09, F16)
    if (ask && teacherReply && (!guard?.replaced || r.move?.visual)) {
      const ack = seamSafe("studio.requestIntent", () => (typeof studioSeam.requestIntent === "function"
        ? studioSeam.requestIntent({ ...whiteboardIntentOf({ lessonId: lesson.id, turn: next.turn, beat: kernel.beat ?? { id: "visual", type: "explain" }, next, kit,
          item: next.lastMove?.itemId ? findItem(next, kit, next.lastMove.itemId) : null, line: { text: teacherReply, teacherReplySeq } }),
          // W2 integration: the template board it replaces rides along as the slot's fallback, so a live board that fails
          // the drawing gate shows the guarded template (W2-B, open-item safe) instead of an empty stage
          ...(ask.payload?.replacesRung && next.module?.engine === RUNG_ENGINE && next.module?.params?.script ? { fallback: { script: next.module.params.script } } : {}) })
        : null), null);
      if (ack?.slotId && ack?.intentId) {
        studioSlot = { slotId: String(ack.slotId), intentId: String(ack.intentId), state: ack.state ?? "planning" };
        wbAcked = true;
        next.wbBeat = kernel.beat?.id;
        // The live board IS the explanation surface: the Director's template rung (explainer@1) is not mounted beside it
        // (the client's tray shows one thing; a mounted module would win the tray over the studio slot). Its mount / param
        // commands go, a rung already on screen is unmounted, and its facts row leaves the move's content, so the next turn
        // never points at values that are not on screen. A declined ask keeps the rung (below).
        if (ask.payload?.replacesRung && next.module?.engine === RUNG_ENGINE) {
          const id = next.module.id;
          const mountedNow = r.moduleCommands.some((c) => c.op === "mount" && c.moduleId === id);
          r = { ...r, moduleCommands: [...r.moduleCommands.filter((c) => c.moduleId !== id || c.op === "unmount"), ...(mountedNow ? [] : [{ op: "unmount", moduleId: id }])] };
          next.module = null;
          if (Array.isArray(next.lastContent)) next.lastContent = next.lastContent.filter((l) => !(typeof l === "string" && l.startsWith(FACTS_ROW_PREFIX)));
          rungReplaced = true;
        }
        moment = momentNow();
      } else studioReasons.push("studio_rejected.declined_by_studio");
    } else if (ask) studioReasons.push("studio_rejected.no_reply");
    if (state.mode === "cascade" || state.mode === "text") {
      prewarmed = prewarm({ lessonId: lesson.id, seq: teacherReplySeq, text: teacherReply, tokenHash: sessionTokenHash(req), guardianId: guardian.id, style: styleForChild(child, undefined, state.ctx?.teacherId, state.ctx?.teacherName, { laneSwitched: !!state.laneSwitch }),
        ...(delivery ? { delivery } : {}) });
    }
  } else if (specs.length) {
    speculation = { tried: specs.length, hit: false };
  }
  // Voice lane, the child asked to SEE it (F16): her words are not known before she speaks, so Studio draws from the
  // move's kit content (the same lines her turn is written from); the slot rides on this response as on the text lanes.
  if (!textLane && !late && !r.hold && r.move?.visual && !studioSlot) {
    const ask = kernel.arb.accepted.find((p) => p.kind === "ask_whiteboard");
    const line = (next.lastContent ?? []).map((x) => String(typeof x === "string" ? x : "")).join(" ").trim() || String(kit?.skills?.find((k) => k.id === next.lastMove?.skillId)?.title ?? "");
    if (ask && line) {
      const ack = seamSafe("studio.requestIntent", () => (typeof studioSeam.requestIntent === "function"
        ? studioSeam.requestIntent(whiteboardIntentOf({ lessonId: lesson.id, turn: next.turn, beat: kernel.beat ?? { id: "visual", type: "explain" }, next, kit,
          item: next.lastMove?.itemId ? findItem(next, kit, next.lastMove.itemId) : null, line: { text: line } }))
        : null), null);
      if (ack?.slotId && ack?.intentId) { studioSlot = { slotId: String(ack.slotId), intentId: String(ack.intentId), state: ack.state ?? "planning" }; wbAcked = true; moment = null; }
    }
  }
  // A late answer (the page-hide beacon already closed the lesson) that was a disclosure still gets the fixed
  // safeguarding line with both helplines, stored as her turn: the client raises the Help sheet from it even though
  // the lesson stays closed (runtime.ts flushOthers → lateSafeguard). Safety by predicate, never left unsaid.
  const lateSafeguard = late && (r.move.kind === "safeguard" || !!incident);
  if (lateSafeguard) {
    teacherReply = safeguardLine(state.ctx, { kind: next.safeguard?.kind ?? null });
    const [row] = stageTurns(next, [{ speaker: "teacher", text: teacherReply, meta: { move: "safeguard", late: true } }]);
    staged.push(row);
    teacherReplySeq = row.seq;
  }

  if (!moment) moment = momentNow();
  // Studio's actions for this turn, as the kernel accepted them (a reveal on the teacher's cue; never on a safeguarding or
  // closing turn, never a second new thing on screen) and as Studio's slot shows them (a held reveal is not revealed).
  const turnStudio = turnStudioNow();
  if (!late && turnStudioOf(kernel.arb)?.reveal && !turnStudio?.reveal) studioReasons.push("studio_rejected.held");
  if (!late && studioSlot && !wbAcked) studioReasons.push("studio.slot");
  // The vibe knobs reach the client only when the kernel accepted them (a safeguarding turn freezes them: absent = unchanged).
  const vibeAccepted = kernel.arb.accepted.some((p) => p.source === "vibe");
  // Voice lane: what must be heard now rather than on the child's next turn (contracts.ts TurnResponse).
  const speakNow = textLane || late ? undefined
    : r.move.kind === "safeguard" && !prev.safeguard ? "interrupt"
      : moduleOnly && !r.hold ? "when_free" : undefined;
  /** @type {import("../../shared/contracts").TurnResponse} */
  const outCore = late
    // the lesson stays closed: the answer is in, nothing more is said — except the safeguarding line after a disclosure
    ? { move: lateSafeguard ? { ...r.move, kind: "safeguard" } : r.move, moduleCommands: [],
      ui: withAsk(r.ui, lateSafeguard ? teacherReply : null, uiVerdictOf(cls, target, state)),
      ...(lateSafeguard ? { teacherReply, teacherReplySeq } : {}), end: true, late: true }
    : {
      move: r.move, moduleCommands: r.moduleCommands,
      ui: withStudioSlot(withSeamUi(withAsk(r.ui, teacherReply, { ...uiVerdictOf(cls, target, state), ...(kernel.beat ? { beat: uiBeatOf(kernel.beat) } : {}) }), relational), studioSlot),
      ...(teacherReply ? { teacherReply, teacherReplySeq } : {}), ...(speakNow ? { speakNow } : {}), ...(r.end ? { end: true } : {}),
      // W2 seams: what Studio does on this turn (W2-H proposes through statusFacts; W2-E's kernel arbitrates from BR1) and the
      // turn's Moment (W2-E). Both absent until filled.
      ...(turnStudio ? { studio: turnStudio } : {}), moment,
      // Pace knobs from the vibe persona (wait before a nudge, end-of-speech silence): session config, never the prompt.
      ...(next.vibe && vibeAccepted ? { pace: { waitNudgeSec: next.vibe.waitNudgeSec, endpointSilenceMs: next.vibe.endpointSilenceMs } } : {}),
    };
  // The dedupe record lands in the same transaction as the turn: a resend of this turnSeq replays outCore.
  if (turnSeq != null) {
    next.acks = [...(prev.acks ?? []).filter((a) => a.turnSeq !== turnSeq), { turnSeq, ...(edited ? { edited: true } : {}) }].slice(-ACKS_MAX);
    next.lastAck = { turnSeq, out: outCore };
  }
  delete next.supersede;
  if (late) next.phase = "done"; // a late answer never reopens the lesson

  // One transaction: the state check first (`and ended_at is null`: a turn still in flight when the lesson
  // ends must not rewrite it; the turn number: a concurrent or replayed turn loses; an attempt an edit replaced
  // loses), then every row this turn produced. A loser, a failure or a 409 leaves nothing behind, so a retry cannot
  // double the evidence. A late answer instead requires the lesson to be the page-hide-closed one it was read as.
  const guardSql = late
    ? "update lesson set state = $2 where id = $1 and ended_at is not null and state->>'endedBy' = 'pagehide' and (state->>'turn')::int = $3"
    : "update lesson set state = $2 where id = $1 and ended_at is null and (state->>'turn')::int = $3";
  const notSuperseded = turnSeq != null && !edited ? " and coalesce((state->>'supersede')::int, -1) <> $4" : "";
  const [traceOk, decisionOk, traceIdsOk] = await tablesP;
  // The comprehension trail and the release path as codes (owner priority 1; G-AUTHORITY), for the trace row.
  const uiV = late ? null : uiVerdictOf(cls, target, state).verdict ?? null;
  const releaseReasons = [...(r.move.kind === "wrap" && (relFx.release || cls?.flags?.wantsToStop) ? ["release.goodbye_wrap"] : []),
    ...(next.stopAsked === next.turn && r.move.kind !== "wrap" ? ["release.check_in_given"] : [])];
  let seqs = [];
  try {
    ({ seqs } = await runTurnTx(child, [
      guardStmt(`${guardSql}${notSuperseded} returning id`, [lesson.id, next, prev.turn, ...(notSuperseded ? [turnSeq] : [])]),
      // Text lane: the child cut off the latest stored teacher line; mark that row rather than storing it again.
      ...(textLane && body.teacherInterrupted ? [{ text: `update turn set meta = meta || '{"interrupted": true}'::jsonb
           where id = (select id from turn where lesson_id = $1 and speaker = 'teacher' order by seq desc limit 1) returning id`, params: [lesson.id] }] : []),
      turnInsertStmt(lesson.id, staged),
      ...floorIncidents,
      ...writes,
      // The Brain's record of this turn (TB12) and of a chosen re-teach arm (RT-ARM), when the 016 tables exist.
      ...(traceOk ? [brainTraceStmt({ lessonId: lesson.id, turn: next.turn, lane, move: r.move.kind, beat: kernel.beat?.type ?? null,
        inputsHash: inputsHashOf({ prev: state, cls, move: r.move, itemId: r.move.itemId ?? null, kitHash: state.kitHash ?? null, lane }),
        proposals: kernel.proposals, arb: kernel.arb, reasons: [`lane.${lane}`, ...(late ? ["turn.late"] : []), ...(moduleOnly ? ["turn.module_only"] : []),
          ...(help ? ["turn.help"] : []), ...(laneResume ? [revoice ? "turn.lane_resume_revoice" : "turn.lane_resume"] : []), ...(kernel.replanned ? ["turn.replanned"] : []), ...(kernel.wb.declined ? [kernel.wb.declined] : []),
          ...(speculation ? [speculation.hit ? "turn.speculation_hit" : "turn.speculation_miss"] : []), ...(wbAcked ? ["studio.whiteboard_slot"] : []),
          ...(rungReplaced ? ["studio.rung_replaced"] : []), ...studioReasons, ...releaseReasons,
          ...comprehensionReasons({ cls, classified, help: !!help, uiVerdict: uiV, guard }),
          ...(guard?.caught?.includes("unavailable") ? ["turn.fallback_reply"] : []),
          ...[...seamErrors].map((c) => `component_error.${c}`)],
        serverMs: performance.now() - t0, kernelUs: kernel.us, legalMode: child.legal_mode ?? "M1",
        withIds: traceIdsOk, itemId: target?.mode === "item" ? activeItem?.id ?? null : null, misconceptionId: cls?.misconceptionId ?? cls?.voiced ?? null })] : []),
      ...(traceOk && decisionOk ? [reteachDecisionOf(next, { lessonId: lesson.id, legalMode: child.legal_mode ?? "M1" })].filter(Boolean) : []),
      // Seam (W1-D): the Conductor's turn event lands with the turn, or not at all.
      ...onTurnCommit({ child, lessonId: lesson.id, turn: next.turn, move: r.move.kind, end: !!r.end || late, late, now }),
    ]));
  } catch (e) {
    if (prewarmed) dropPrewarm(lesson.id, teacherReplySeq);
    if (e?.code === GUARD_FAILED) {
      const cur = await one("select ended_at, state from lesson where id = $1", [lesson.id]);
      // The same answer landed first (a resend raced its own first attempt): that turn's response, not an error.
      const again = cur && replayFor(cur.state, turnSeq);
      if (again) return replayResponse(lesson, cur.state, again, edited ? { editLanded: true } : {});
      if (turnSeq != null && !edited && Number(cur?.state?.supersede) === turnSeq) throw new HttpError(409, "this answer was replaced by an edit");
    }
    // A disclosure is recorded even when its turn is not (without the turn it came from).
    if (incident) {
      await q("insert into incident(child_id, lesson_id, kind, severity, detail) values ($1,$2,'safeguarding','high',$3) returning id",
        [child.id, lesson.id, { ...incident, turnUnsaved: true }]).catch((err) => console.error("[lesson] incident write failed:", err.message));
    }
    if (e?.code !== GUARD_FAILED) throw e;
    const ended = (await one("select ended_at from lesson where id = $1", [lesson.id]))?.ended_at;
    throw new HttpError(409, ended && !late ? "lesson has ended" : "another turn for this lesson landed first; retry");
  }
  mark("stored");
  // Seam (W2-H): the committed turn revealed / retired a Studio piece (mount row, SSE status); after commit, never awaited.
  if (turnStudio) seamSafe("studio.onReveal", () => studioSeam.onReveal({ lessonId: lesson.id, childId: child.id, turn: next.turn, studio: turnStudio }), null);
  // The online fold is the cache only if our inserts got the next seqs (no interleaved writer); else replay next turn.
  const learner = plan.learner;
  if (canWrite(child, "kt")) commitLive(child, learner.before.maxSeq, learner.after, seqs);
  else evictLive(child.id);
  for (const x of carried) forgetGrade(x.event.id);
  launchGrades(next);
  // A late answer has no next turn to carry its held why / teach-back: it is graded and stored now, as lesson end does.
  if (late) flushHeld(child, lesson, next).catch((e) => console.warn("[lesson] late turn: held evidence not stored:", e.message));
  const voice = await voiceP;
  const ms = Math.round(performance.now() - t0);
  console.info(`[lesson] turn ${lesson.id} #${next.turn} ${r.move.kind}${r.hold ? " (hold)" : ""}${late ? " (late)" : ""} cls=${cls ? `${cls.outcome}/${cls.source}` : "module"}${speculation ? ` spec=${speculation.hit ? "hit" : "miss"}/${speculation.tried}` : ""} ${ms}ms`);
  /** @type {import("../../shared/contracts").TurnResponse} */
  const out = { ...(late ? {} : clientInstructions(state.mode, instructions)), ...outCore };
  if (debugFor(req)) {
    const item = r.item;
    out.debug = {
      phase: next.phase, turn: next.turn, teachIdx: next.teachIdx, hintLevel: next.hintLevel, unclear: next.unclear, moduleOnly, hold: !!r.hold,
      classification: cls ? { outcome: cls.outcome, misconceptionId: cls.misconceptionId, voiced: cls.voiced, confidence: cls.confidence, source: cls.source, flags: cls.flags } : null,
      evidence, kt: plan.events.map((e) => ({ id: e.id, cls: e.cls, outcome: e.outcome, skillIds: e.skillIds, grader: e.grader, ...(e.teach ? { teach: true } : {}),
        ...(e.shapeId ? { shapeId: e.shapeId } : {}), ...(typeof e.spanOk === "boolean" ? { spanOk: e.spanOk } : {}), ...(e.misconceptionId ? { misconceptionId: e.misconceptionId } : {}) })),
      probe: next.pendingProbe ?? null, vibe: next.vibe ?? null, held: (next.kt?.deferred ?? []).map((d) => d.event.id), carried: carried.map((x) => ({ id: x.event.id, graded: !!x.results?.length })),
      skills: skillChanges, flagged: next.flagged, guard, verdict, spoiled: next.spoiled, ...(skipped ? { skipped } : {}),
      ...(speculation ? { speculation } : {}), ...(prewarmed ? { ttsPrewarmed: true } : {}),
      item: item ? { id: item.id, kind: item.kind, prompt_en: item.prompt_en, prompt_hi: item.prompt_hi, answer: item.answer, acceptable: item.acceptable, ...(item.options ? { options: item.options.map((o) => o.text) } : {}) } : null,
      kitVerified: kit.verified, ms, timings: trace,
      ...(voice ? { voice: { reliable: voice.reliable, signals: voice.signals, z: voice.z } } : {}),
    };
  }
  return out;
}

/** The child row's seq among this turn's staged rows (the DidCard cites it). */
export const childRowSeq = (staged) => staged.find((x) => x.speaker === "child")?.seq ?? null;

/**
 * The verdict marks for the response (V2 §4.6): `verdict` only from the verified-key classifier on a kit item
 * (absent = ungraded: a covert why or teach-back, an unclear reply); `withHelp` when it came after a hint rung.
 */
export function uiVerdictOf(cls, target, prev) {
  const verdict = uiVerdict(cls, target);
  if (!verdict) return {};
  return { verdict, ...(verdict === "correct" && prev.hintLevel > 0 ? { withHelp: true } : {}) };
}

export const DID_MAX = 12;
/**
 * Append what the child just did to the lesson state (state.did): a graded answer on a kit item, or a teach-back
 * explanation. Session state only (no learner layer), so it exists in every legal mode; the summary reads it.
 * `verified`: the kit's key is verified and the key was not heard before the answer (a leak makes it worthless).
 */
export function noteDid(next, { cls, target, activeItem, kit, childText, tapped, hintLevel, seq, leaked }) {
  if (!cls) return;
  const lang = next.ctx?.lang;
  const answer = String(childText || tapped || "").replace(/\s+/g, " ").trim().slice(0, 80);
  let entry = null;
  if (target.mode === "item" && activeItem && ["correct", "incorrect", "partial", "misconception"].includes(cls.outcome)) {
    entry = { kind: "item", itemId: activeItem.id, ask: askText(promptFor(activeItem, lang)), answer, verdict: uiVerdict(cls, target),
      withHelp: hintLevel > 0, verified: (activeItem.kitVerified ?? kit.verified) !== false && !leaked && !next.spoiled?.includes(activeItem.id), seq, turn: next.turn };
  } else if (target.mode === "teachback" && answer && cls.outcome !== "no_evidence") {
    entry = { kind: "teachback", itemId: null, ask: null, answer, verdict: cls.outcome === "correct" ? "correct" : undefined, withHelp: false,
      verified: kit.verified !== false, seq, turn: next.turn };
  }
  if (entry) next.did = [...(next.did ?? []), entry].slice(-DID_MAX);
}

/**
 * Everything a classified turn decides, from a COPY of the staged state: the evidence and its learner-model
 * writes, the affect, the Director step, and its compiled instructions. Pure apart from awaiting the child's
 * folded learner state (c.live, read once per turn and shared by every plan), so the speculative replies run
 * exactly the same code as the real turn. Gaming is read from the affect AFTER this turn (the same update step()
 * makes), so the second "just tell me" or the third different wrong answer is already discounted.
 *
 * The learner path (INTEGRATION.md §1; decisions integration-ledger-live-path): Director evidence → KT events
 * (learner/live.js answerEvents) → fuseEvidence (ledger K/D/M/θ + facets U/T, one fold) → noteOutcome → beliefs
 * into the Director → step → the close/teach events → fuse again. kt_evidence is the event source; the cached
 * fold, the facets and the 001 projection (skill_state; the legacy evidence rows as the verdict log) are staged for
 * the turn's ONE transaction under the child's advisory lock and legal-mode guard.
 */
export async function planTurn(base, cls, c) {
  const state = structuredClone(base);
  const { kit, child, lesson, activeItem, moduleOnly } = c;
  const affectNow = moduleOnly ? state.affect
    : nextAffect(state.affect, { read: cls?.flags ?? {}, outcome: cls?.outcome, itemId: state.activeItemId, answer: c.answer });
  const discount = gamingDiscount(affectNow);
  const evidence = cls ? evidenceFrom(state, cls, kit, { leaked: c.leaked, discount }) : [];
  const writes = [];
  // Learner rows only where the child's legal_mode permits the layer (server/learner/mode.js): an M0 child's
  // lesson runs on session state alone, and the writer itself throws on any forbidden layer.
  const keep = (layer) => canWrite(child, layer);
  const skillChanges = {};
  const childSeq = state.seq; // the child's row, or a module-only turn's activity row (staged last)
  const now = c.now;
  const live = c.live ? await c.live : { state: newLearnerState({ childId: child.id, classLevel: child.class_level ?? 5 }), maxSeq: 0 };
  const before = live.state;
  const ev0 = { lessonId: lesson.id, startedAt: lesson.started_at, now, childSeq, evidence, cls, prev: state, kit, activeItem, moduleOnly,
    asrConf: c.typed ? null : (typeof c.asrConfidence === "number" ? c.asrConfidence : null), gaming: discount < 1,
    leaked: !!(c.leaked || (activeItem && state.spoiled?.includes(activeItem.id))), chipId: c.chipId,
    shapeId: state.pendingWhy && state.pendingProbe?.shapeId ? state.pendingProbe.shapeId : null };
  // 1. what last turn held back (a why / teach-back whose blind verdict was graded off the path), then this answer
  const carried = c.carried ?? [];
  const a = answerEvents(ev0);
  let fused = fuseEvidence(before, [...carried.map((x) => x.event), ...a.events], LIVE_FOLD_CTX);
  // mandatory probe triggers from each graded event (§3.2), against the belief AFTER it
  for (const e of [...carried.map((x) => x.event), ...a.events]) {
    const k = e.target ?? e.skillIds[0];
    state.probeSess = noteOutcome(state.probeSess, e, compactBelief(beliefFor(k, { ...fused, now })));
  }
  const touched = () => [...new Set([...kit.skills.map((sk) => sk.id), ...Object.keys(state.skills),
    ...[...carried.map((x) => x.event), ...a.events].flatMap((e) => e.skillIds)])];
  state.comp = skillsMapFor(fused, kit, touched(), now);
  for (const id of Object.keys(fused.ledger.skills)) if (state.skills[id] || touched().includes(id)) state.skills[id] = snapshotFromKt(fused.ledger.skills[id], now);
  for (const ev of evidence) state.history[ev.skillId] = [...(state.history[ev.skillId] ?? []), ev.outcome].slice(-10);

  // BR5: the relational overlay the kernel accepted for this turn (relational-adapter.js) rides on the state the compile
  // reads (state.rel: the overlay shape id, a callback or notice id; ids only, session state). Absent = unchanged.
  if (c.rel) state.rel = c.rel;
  else if (state.rel) delete state.rel;
  // 2. the Director step on beliefs that include this answer (voice: capped tie-breakers only, CE8)
  const stepIn = { kit, cls: cls ?? undefined, chipId: c.chipId, answer: c.answer, now, comp: state.comp, voice: c.voice?.signals, voiceZ: c.voice?.z,
    text: c.childText, bargeIn: c.bargeIn, typed: !!c.typed };
  const stepped = moduleOnly
    ? step(state, { ...stepIn, event: "module", moduleEvents: c.moduleEvents })
    : step(state, { ...stepIn, event: "turn" });
  // Seam (W2-H): Studio's facts row is NOT added here (before the kernel and slotFor): turn() adds it from the slot the
  // turn actually shows (studioSeam.factsRowForSlot), so the reply never points at a refused, held or hidden piece.
  const { r, instructions, skipped } = instructionsAfter(stepped, kit, now);
  const next = r.state;
  // The verdict this turn's words must agree with (G-PRAISE-1): a kit item graded against its key, or "ungraded".
  const gradedTarget = targetFor(state, kit, activeItem);
  next.lastVerdict = verdictFor(cls, gradedTarget, { childText: c.childText });
  // What a right answer's acknowledgement must not name as the result (G-PRAISE-2): the key and the wrong options shown.
  const wrongShown = next.lastVerdict === "correct" ? wrongAnswersOf(gradedTarget) : [];
  if (wrongShown.length) next.lastRight = { key: String(gradedTarget.key), wrong: wrongShown };
  else delete next.lastRight;
  // 3. the episode that just closed without a correct answer, and a teaching move's teach event
  const b2 = closeEvents({ ...ev0, next, hold: !!r.hold }, a);
  const after = b2.events.length ? fuseEvidence(fused, b2.events, LIVE_FOLD_CTX) : fused;
  next.kt = { ...(next.kt ?? {}), ep: b2.ep, deferred: a.deferred.map((e) => ({ event: e, grade: gradeRequestFor(e, { kit, activeItem, state, childText: c.childText }) })) };
  const events = [...carried.map((x) => x.event), ...a.events, ...b2.events];
  if (b2.events.length) {
    next.comp = skillsMapFor(after, kit, touched(), now);
    for (const e of b2.events) for (const id of e.skillIds) if (after.ledger.skills[id]) next.skills[id] = snapshotFromKt(after.ledger.skills[id], now);
  }
  for (const id of new Set(events.flatMap((e) => e.skillIds))) {
    const p0 = before.ledger.skills[id]?.pL, p1 = after.ledger.skills[id]?.pL;
    skillChanges[id] = { before: p0 == null ? null : Math.round(p0 * 1000) / 1000, after: p1 == null ? null : Math.round(p1 * 1000) / 1000,
      display: after.ledger.skills[id]?.display, state: beliefFor(id, { ...after, now })?.state };
  }

  // 4. the writes, for the turn's one transaction
  if (keep("kt")) {
    // the verdict log the parent corner and the lesson-end facts read (001 evidence), as before
    for (const ev of evidence) writes.push(evidenceStmt(child.id, lesson.id, ev, { lessonId: lesson.id, seq: childSeq }, child));
    // the event source and its cached fold (kt_evidence, kt_skill_state, kt_misconception, kt_ability*)
    for (const st of ledgerStmts(child, before.ledger, after.ledger, events)) writes.push(/^with ins as \(insert into kt_evidence/.test(st.text) ? { ...st, ktEvidence: true } : st);
    // the 001 projection of every skill the fold changed, and the facet cache of every belief that moved
    const changed = Object.keys(after.ledger.skills).filter((id) => JSON.stringify(before.ledger.skills[id]) !== JSON.stringify(after.ledger.skills[id])).sort();
    for (const id of changed) writes.push(skillStateStmt(child.id, legacySkillState(after.ledger.skills[id], now), child));
    const facetMoved = Object.keys(after.comp.skills).filter((id) => JSON.stringify(before.comp.skills[id]) !== JSON.stringify(after.comp.skills[id])).sort();
    writes.push(...facetStmts(child, facetMoved.map((id) => beliefFor(id, { ...after, now }))));
    // a probe asked this turn (probe_log), an engine re-teach decision (reteach_attempts)
    if (next.pendingProbe && next.pendingProbe !== state.pendingProbe && next.pendingProbe.shapeId && next.pendingProbe.skillId) {
      writes.push(probeLogStmt(child, lesson.id, next.pendingProbe));
    }
    if (next.lastReteach && next.lastReteach.turn === next.turn && ["reteach", "recap"].includes(next.lastReteach.move)) writes.push(reteachStmt(child, lesson.id, next.lastReteach));
    // a skill that reached learned_today now enters the weave queue (§3.5): a woven sub-step 2-3 topics later
    for (const id of changed) {
      const sk = after.ledger.skills[id], was = before.ledger.skills[id];
      if (sk.display === "learned_today" && was?.display !== "learned_today" && sk.anchorAt) {
        const [entry] = weaveEnqueue([], { childId: child.id, skillId: id, anchorAt: sk.anchorAt, dueAt: sk.nextReviewAt, hostCandidates: kit.weaveHosts?.[id] ?? [] });
        writes.push(weaveEnqueueStmt(child, entry));
      }
    }
    // the blind verdicts behind the carried events (grade_audit; no span without the transcript consent)
    for (const x of carried) for (const res of x.results ?? []) {
      if (!res?.op) continue;
      writes.push(gradeAuditStmt(child, auditRow(res, { childId: child.id, sessionId: lesson.id, skillId: x.event.target ?? x.event.skillIds[0], shapeId: x.event.shapeId, lang: next.ctx?.lang }), { keepSpan: false }));
    }
  }
  if (keep("mis")) {
    for (const ev of evidence) if (ev.misconceptionId) writes.push(misconceptionFlagStmt(child.id, ev.misconceptionId, child));
    const resolved = activeItem?.targetsMisconception && cls?.outcome === "correct" && cls.reason !== "misconception"
      && state.hintLevel === 0 && state.pendingWhy !== activeItem.id;
    if (resolved) writes.push(misconceptionResolveStmt(child.id, activeItem.targetsMisconception, child));
    // A belief voiced outside a keyed item counts on the misconception ledger, never as graded evidence.
    if (cls?.voiced) writes.push(misconceptionFlagStmt(child.id, cls.voiced, child));
  }
  const incident = cls?.flags.distress
    ? { source: cls.source === "predicate" ? "predicate" : cls.source === "content_filter" ? "content_filter" : "classifier", family: cls.flags.distressKind } : null;
  if (incident) writes.push(incidentStmt(child.id, lesson.id, childSeq, incident));
  return { evidence, events, writes, skillChanges, incident, r, instructions, skipped, learner: { before: live, after } };
}

/**
 * The blind grader request for a held event (later.js): the child's own words and one kit target per call — the
 * item's key ideas for a why, each expectation for a teach-back. Never the teacher's turns, the name or a verdict.
 */
export function gradeRequestFor(ev, { kit, activeItem, state, childText }) {
  const ideas = ev.cls === "probe.teachback" ? kit.expectations ?? []
    : (activeItem?.expectations ?? kit.expectations ?? []).length ? (activeItem?.expectations ?? kit.expectations) : [whyKey(kit, ev.target) ?? activeItem?.answer].filter(Boolean);
  const heard = scrubbed(state.recent.findLast((t) => t.who === "teacher")?.text ?? "");
  return { childText: scrubbed(String(childText ?? "").slice(0, 1200)), targets: ideas.slice(0, 4).map((t, i) => ({ id: `${ev.target}:e${i + 1}`, textEn: String(t) })),
    echo: [kit.title ?? "", getTopic(state.topicId)?.title ?? "", heard].filter(Boolean), lang: state.ctx?.lang === "english" ? "en" : "hi-en" };
}

/** The held events of the previous turn, as they fold now: the blind verdict if it is in, else the classifier's. */
export function carriedFrom(state) {
  return (state.kt?.deferred ?? []).map((d) => finalEvent(d.event, settledGrade(d.event.id)));
}

/** Start the blind grading of this turn's held events (after the commit; never awaited by the turn). */
export function launchGrades(next) {
  for (const d of next.kt?.deferred ?? []) if (d.grade) gradeLater(d.event, d.grade);
}

/**
 * Everything textReply() reads, as one string: two plans with the same key get the same reply (the same
 * prompt, history and guards), so a speculative reply with the real plan's key IS the real reply.
 */
export function replyKey(next, kit, r, instructions, said, history) {
  return JSON.stringify([instructions, said, history, next.lastMove, next.hintLevel, next.pendingWhy, next.ctx?.lang,
    next.ctx?.ageBand, next.spoiled ?? [], upcomingItem(next, kit)?.id ?? null, !!r.hold, next.lastVerdict ?? "ungraded", r.ui?.chips ?? null, next.module?.id ?? null]);
}

/**
 * Outcomes worth a speculative reply while the classifier's model call runs, most likely first. On an item
 * the model is asked only when the bytes did not decide (no exact key, no bare "pata nahi"), and then
 * "no evidence" (an off-topic or unclear reply) is as common as a wrong one: measured in
 * evals/cascade-latency.mjs, 3/3 item turns were no_evidence and a 2-way fan-out of correct/incorrect missed
 * all three. The fan-out (TAXILA_SPECULATE, default 3, 0 = off) is extra taxila-fast reply calls per
 * model-classified turn; a miss costs only those tokens, never the reply's quality — the real reply is then
 * written exactly as before.
 */
export const SPEC_OUTCOMES = { item: ["incorrect", "no_evidence", "correct", "partial"], why: ["correct", "incorrect", "partial"], teachback: ["partial", "correct"], none: ["no_evidence"] };
export const specFanout = () => {
  const n = Number(process.env.TAXILA_SPECULATE ?? 3);
  return Number.isFinite(n) ? Math.max(0, Math.min(4, Math.floor(n))) : 3;
};

export function speculate(state, target, flags, planCtx, { said, historyOf }, { outcomes: only, source = "speculative" } = {}) {
  const outcomes = (only ?? SPEC_OUTCOMES[target.mode] ?? []).slice(0, specFanout());
  return outcomes.map((outcome) => {
    const trace = [];
    const cls = { outcome, confidence: 1, source, flags: { ...flags } };
    const p = planTurn(state, cls, { ...planCtx, now: planCtx.now ?? Date.now() }).then((plan) => {
      if (plan.r.hold) return null;
      const next = plan.r.state;
      const history = historyOf(next);
      return {
        key: replyKey(next, planCtx.kit, plan.r, plan.instructions, said, history), trace,
        result: (() => {
          const r = textReply({ instructions: plan.instructions, state: next, kit: planCtx.kit, childText: said, trace, history, ui: plan.r.ui, module: next.module });
          r.catch(() => {});
          return r;
        })(),
      };
    });
    p.catch(() => {}); // a failed speculation is a miss, never the turn's error
    return p;
  });
}

/**
 * The speculative reply whose plan matches `key` (awaited), or null. One that could not be written (the model
 * failed and textReply fell back) is a miss: the real reply gets its own attempt, as it would have without
 * speculation.
 */
export async function pickSpeculation(specs, key) {
  for (const p of specs) {
    const s = await p.catch(() => null);
    if (s?.key !== key) continue;
    const result = await s.result.catch(() => null);
    return result && !result.guard.caught.includes("unavailable") && !result.filtered ? { trace: s.trace, result } : null;
  }
  return null;
}

/**
 * The id of the not-yet-posed item whose key `teacherText` states (state.js upcomingItem), or null. The
 * active item is the leak check's business (`leaked`), not this one's.
 */
export function spoiledBy(teacherText, state, kit, activeItem) {
  const ahead = upcomingItem(state, kit);
  if (!ahead || ahead.id === activeItem?.id || state.spoiled?.includes(ahead.id)) return null;
  return revealsAnswer(teacherText, ahead) ? ahead.id : null;
}

/**
 * Fold and store the lesson's still-held events (lesson end). Waits up to END_GRADE_WAIT_MS for their blind verdicts;
 * without one an event lands with the classifier's outcome and spanOk:false (K only, E6).
 */
const END_GRADE_WAIT_MS = 6000;
export async function flushHeld(child, lesson, state) {
  const held = state.kt?.deferred ?? [];
  if (!held.length || !canWrite(child, "kt")) return;
  const carried = await Promise.all(held.map(async (d) => finalEvent(d.event, await awaitGrade(d.event.id, END_GRADE_WAIT_MS))));
  const live = await loadLive(child);
  const events = carried.map((x) => x.event);
  const after = fuseEvidence(live.state, events, LIVE_FOLD_CTX);
  const now = Date.now();
  const stmts = ledgerStmts(child, live.state.ledger, after.ledger, events).map((st) => (/^with ins as \(insert into kt_evidence/.test(st.text) ? { ...st, ktEvidence: true } : st));
  const changed = Object.keys(after.ledger.skills).filter((id) => JSON.stringify(live.state.ledger.skills[id]) !== JSON.stringify(after.ledger.skills[id])).sort();
  for (const id of changed) stmts.push(skillStateStmt(child.id, legacySkillState(after.ledger.skills[id], now), child));
  const moved = Object.keys(after.comp.skills).filter((id) => JSON.stringify(live.state.comp.skills[id]) !== JSON.stringify(after.comp.skills[id])).sort();
  stmts.push(...facetStmts(child, moved.map((id) => beliefFor(id, { ...after, now }))));
  for (const x of carried) for (const res of x.results ?? []) if (res?.op) {
    stmts.push(gradeAuditStmt(child, auditRow(res, { childId: child.id, sessionId: lesson.id, skillId: x.event.target ?? x.event.skillIds[0], shapeId: x.event.shapeId, lang: state.ctx?.lang }), { keepSpan: false }));
  }
  // the lesson state forgets them in the same transaction, so a retried end cannot store them twice
  stmts.push({ text: "update lesson set state = state #- '{kt,deferred}' where id = $1 returning id", params: [lesson.id] });
  const { seqs } = await runTurnTx(child, stmts);
  commitLive(child, live.maxSeq, after, seqs);
  for (const d of held) forgetGrade(d.event.id);
}

export const KEY_PARTS = ["instructions", "said", "history", "lastMove", "hintLevel", "pendingWhy", "lang", "ageBand", "spoiled", "upcoming", "hold", "verdict", "chips", "module"];
/** Debug only: which reply input differed for each speculative plan ("unavailable": its reply failed). */
export async function missReason(specs, key) {
  const real = JSON.parse(key);
  return Promise.all(specs.map(async (p) => {
    const s = await p.catch(() => null);
    if (!s) return "failed";
    if (s.key === key) return "unavailable";
    const k = JSON.parse(s.key);
    const parts = KEY_PARTS.filter((_, i) => JSON.stringify(k[i]) !== JSON.stringify(real[i])).join("+");
    if (k[0] === real[0]) return parts;
    // The first instruction line that differs (debug only: instructions carry the key).
    const a = String(k[0]).split("\n"), b = String(real[0]).split("\n");
    const i = a.findIndex((line, j) => line !== b[j]);
    return `${parts} [spec: ${String(a[i] ?? "").slice(0, 120)} || real: ${String(b[i] ?? "").slice(0, 120)}]`;
  }));
}
