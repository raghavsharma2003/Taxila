// /api/lesson/* and /api/realtime/token — the Director's HTTP surface (docs/ARCHITECTURE.md §1.2, §2).
// Every route acts for an authenticated guardian's child (requireChild). One compile() feeds both lanes:
// the voice client applies `instructions` verbatim via session.update, and text mode generates its reply
// from the SAME string (inherited rejection: two prompts for two lanes).
import { q, one } from "../db.js";
import { need, bad, forbidden, notFound, send, HttpError } from "../http.js";
import { requireChild, hasConsent } from "../auth.js";
import { chat, mintRealtimeSecret, endpoint, DEPLOY } from "../azure.js";
import { getTopic, getKit, topicOf, topicSequence } from "../content/index.js";
import { nextTopicFor } from "../content/next-topic.js";
import { applyEvidence, markIntroduced, newSkillState } from "../learner/bkt.js";
import { gamingDiscount } from "../learner/affect.js";
import { hasAbilityLabel } from "../learner/brief.js";
import {
  buildChildBrief, loadSkillStates, saveSkillState, insertEvidence, flagMisconception, resolveMisconception,
  loadActiveMisconceptionIds, loadRecentOutcomes, loadDueSkills,
} from "../learner/model.js";
import { classify, targetFor } from "../director/classify.js";
import { initLessonState, step, describe, evidenceFrom, snapshotSkill, LIMITS } from "../director/state.js";
import { findItem, promptFor, revealsAnswer, posesItem, handsBack, asksWhy, norm as normAnswer } from "../director/items.js";
import { compile, TURN_WORDS } from "../compiler/compile.js";
import { CHARACTERS, teacherFor } from "../compiler/characters/index.js";

/**
 * Debug payloads carry answer keys, so they go only to a loopback caller on a dev machine (never on a
 * hosted platform, where the ingress proxy is the caller), or when TAXILA_DEBUG=1 is set explicitly.
 */
const HOSTED = !!(process.env.VERCEL || process.env.CONTAINER_APP_NAME);
const debugFor = (req) => process.env.TAXILA_DEBUG === "1"
  || (!HOSTED && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket?.remoteAddress));
/** Text-mode hard ceiling for the reply guard (the compiled rule asks for TURN_WORDS). */
const REPLY_MAX_WORDS = { "6-9": 30, "10-15": 40 };
const RECENT_TURNS = 8;

const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

/** Lesson row + its child, scoped to the signed-in guardian (403 otherwise). */
async function loadLessonFor(req, lessonId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId))) throw bad("invalid lessonId");
  const lesson = await one("select * from lesson where id = $1", [lessonId]);
  if (!lesson) throw notFound("lesson not found");
  const { guardian, child } = await requireChild(req, lesson.child_id);
  return { lesson, guardian, child };
}

/**
 * Kit for a lesson's topic, pinned to the kind the lesson started on (state.kitVerified). Content can
 * vanish (a file mid-rewrite), so a missing kit is a 503, not a crash.
 */
async function kitFor(topicId, state, trace) {
  const kit = await getKit(topicId, { trace, mini: state?.kitVerified === false });
  if (!kit) throw new HttpError(503, "no teaching content is available for this topic yet");
  return kit;
}

/** One compile() for both lanes; the lane only decides whether the voice-only contingency lines appear. */
function instructionsFor(state, kit, lane = state.mode === "text" ? "text" : "voice") {
  const topic = getTopic(state.topicId);
  return compile({
    character: CHARACTERS[state.ctx.teacherId], brief: state.brief, lessonState: state, move: state.lastMove,
    ...describe(state, kit), topic, language: state.ctx.lang, lane,
  });
}

/** Append turns (seq from the lesson state) and remember the last few for text-mode context. */
async function insertTurns(lessonId, state, rows) {
  if (!rows.length) return [];
  const params = [];
  const values = rows.map((r, i) => {
    state.seq += 1;
    params.push(lessonId, state.seq, r.speaker, r.text, r.asrConf ?? null, r.meta ?? {});
    const b = i * 6;
    return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6})`;
  });
  const out = await q(`insert into turn(lesson_id, seq, speaker, text, asr_conf, meta) values ${values.join(",")} returning id, seq`, params);
  if (out.length !== rows.length) throw new Error(`turn insert: expected ${rows.length} rows, wrote ${out.length}`);
  for (const r of rows) if (r.speaker !== "system") state.recent = [...state.recent, { who: r.speaker, text: r.text.slice(0, 400) }].slice(-RECENT_TURNS);
  return out;
}

/** Keep whole sentences up to `max` words (last-resort guard after one rewrite failed). */
function trimToWords(text, max) {
  const sentences = String(text).match(/[^.!?।]+[.!?।]*\s*/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    if (words(out + s) > max) break;
    out += s;
  }
  return (out || String(text).split(/\s+/).slice(0, max).join(" ") + "…").trim();
}

/** Moves whose turn must put the active item's question to the child (at rung 0, before any nudge). */
const POSING_MOVES = new Set(["practice", "probe", "retrieval", "greet"]);
/** Moves that end the exchange or hold it; every other turn must hand the floor back. */
const CLOSING_MOVES = new Set(["wrap", "safeguard"]);
/**
 * Scripts a written reply may use: Roman for Hinglish/English (the compiled rule asks for it), Roman or
 * Devanagari for Hindi. Measured in evals/director-sim.mjs: a stray Gujarati word and Devanagari fragments
 * inside Roman Hinglish both reached the child before this check.
 */
const LATIN = /^[\p{Script=Latin}\p{Script=Common}\p{M}]*$/u;
const SCRIPT_OK = { hinglish: LATIN, english: LATIN, hindi: /^[\p{Script=Latin}\p{Script=Devanagari}\p{Script=Common}\p{M}]*$/u };
const OFF_SCRIPT = { hinglish: /[^\p{Script=Latin}\p{Script=Common}\p{M}]/gu, english: /[^\p{Script=Latin}\p{Script=Common}\p{M}]/gu,
  hindi: /[^\p{Script=Latin}\p{Script=Devanagari}\p{Script=Common}\p{M}]/gu };

/**
 * Text-mode teacher reply from the SAME compiled instructions, guarded on the bytes: an answer leak before
 * rung 4, a posing turn that does not pose the item (drift), or an over-long turn gets one rewrite; a leak
 * or drift that survives is replaced by the question itself (content), never shipped.
 */
async function textReply({ instructions, state, kit, childText, trace, history = state.recent.slice(0, -1) }) {
  const item = state.lastMove?.itemId ? findItem(state, kit, state.lastMove.itemId) : null;
  const lang = state.ctx.lang;
  // A diagnostic's options are content read aloud, so they do not count against the turn length.
  const max = REPLY_MAX_WORDS[state.ctx.ageBand] + (item?.diagnostic ? words(item.options.map((o) => o.text).join(" ")) : 0);
  const guardable = item && state.hintLevel < 4 && state.pendingWhy !== item.id;
  const mustPose = guardable && state.hintLevel === 0 && POSING_MOVES.has(state.lastMove.kind);
  const mustHandBack = !CLOSING_MOVES.has(state.lastMove.kind);
  const whyProbe = !!item && state.pendingWhy === item.id;
  const problems = (t) => [
    guardable && revealsAnswer(t, item) && "leak",
    mustPose && !posesItem(t, item, lang) && "drift",
    whyProbe && !asksWhy(t) && "nowhy",
    mustHandBack && !handsBack(t) && "flat",
    !(SCRIPT_OK[lang] ?? LATIN).test(t) && "script",
    words(t) > max && "long",
  ].filter(Boolean);
  const messages = [
    { role: "system", content: instructions },
    // The turn being answered is the last message (childText); by default it is the newest recent row.
    ...history.map((t) => ({ role: t.who === "teacher" ? "assistant" : "user", content: t.text })),
    { role: "user", content: childText || "(the child has joined the lesson and is listening)" },
  ];
  // Replies take ~1-2 s (measured in evals/director-sim.mjs); a stuck call is cut at 6 s and retried once.
  const ask = (msgs) => chat(DEPLOY.fast, msgs, { maxTokens: 220, effort: "none", timeoutMs: 6000, trace }).then((r) => r.text.trim());
  let reply = await ask(messages);
  let found = problems(reply);
  const guard = { caught: found, rewritten: false, replaced: false, ...(found.length ? { firstDraft: reply } : {}) };
  if (found.length) {
    const why = [found.includes("leak") && "it gives away the key answer — the hint ladder has not reached rung 4",
      found.includes("drift") && `it must ask exactly this question and no other: "${promptFor(item, lang)}"`,
      found.includes("nowhy") && "it must ask how they knew or why — about the question they just answered, not a new problem; the reason is theirs to give",
      found.includes("flat") && !found.includes("nowhy") && "it never hands the floor back — end with one question for the child about the same thing (and do not answer it yourself)",
      found.includes("script") && (lang === "hindi" ? "write it in Roman or Devanagari only" : "write it in Roman script only — no Devanagari or any other script"),
      found.includes("long") && `it is too long — at most ${TURN_WORDS[state.ctx.ageBand]} words`].filter(Boolean).join("; and ");
    reply = await ask([...messages, { role: "assistant", content: reply }, { role: "system", content: `Rewrite that turn: ${why}. Same move, same language, one idea, end by handing the floor back.` }]);
    guard.rewritten = true;
    found = problems(reply);
    guard.afterRewrite = found;
    if (found.includes("leak") || found.includes("drift")) { reply = promptFor(item, lang); guard.replaced = true; }
    else {
      if (found.includes("script")) reply = reply.replace(OFF_SCRIPT[lang] ?? OFF_SCRIPT.english, "").replace(/\s{2,}/g, " ").trim();
      if (found.includes("long")) reply = trimToWords(reply, max);
    }
  }
  return { reply, guard };
}

/** Warm-up retrieval items from due skills (rule 18), snapshotted into the lesson state with their kit facts. */
async function warmupItemsFor(childId) {
  const out = [];
  for (const st of await loadDueSkills(childId, LIMITS.warmupMax)) {
    const topicId = topicOf(st.skillId);
    const kit = topicId ? await getKit(topicId, { generate: false }) : null;
    const it = kit?.items
      .filter((i) => i.skillId === st.skillId && ["retrieval", "practice", "near_transfer"].includes(i.kind))
      .sort((a, b) => (b.kind === "retrieval") - (a.kind === "retrieval") || a.difficulty - b.difficulty)[0];
    if (!it) continue;
    out.push({
      ...it, kind: "retrieval", topicId, topicType: kit.topicType, kitVerified: kit.verified, expectations: kit.expectations,
      misconceptions: kit.misconceptions.filter((m) => m.id === it.targetsMisconception)
        .map((m) => ({ id: m.id, belief: m.belief, signs: m.signs, remediation: m.remediation })),
    });
  }
  return out;
}

// ───────────────────────────── POST /api/lesson/start ─────────────────────────────

/** @type {(req: any, res: any, body: import("../../shared/contracts").LessonStartRequest) => Promise<void>} */
async function start(req, res, body) {
  const t0 = performance.now();
  const trace = [];
  const { guardian, child } = await requireChild(req, need(body, "childId").childId);
  const [core, memory] = await Promise.all([
    hasConsent(guardian.id, child.id, "core_tutoring"), hasConsent(guardian.id, child.id, "memory"),
  ]);
  if (!core) throw forbidden("core_tutoring consent is required before a lesson");
  const mode = body.mode === "text" ? "text" : "voice";
  const topic = body.topicId ? getTopic(body.topicId) : await nextTopicFor(child);
  if (!topic) throw bad(body.topicId ? `unknown topic ${body.topicId}` : "no topic available for this class");
  const kit = await kitFor(topic.id, null, trace);
  const warmupItems = await warmupItemsFor(child.id);
  const skillIds = [...new Set([...kit.skills.map((s) => s.id), ...warmupItems.map((w) => w.skillId)])];
  const [skills, history, activeMisconceptionIds, brief] = await Promise.all([
    loadSkillStates(child.id, skillIds), loadRecentOutcomes(child.id, kit.skills.map((s) => s.id)),
    loadActiveMisconceptionIds(child.id, 5), buildChildBrief(child, { memory }),
  ]);
  const teacher = teacherFor(child);
  const seqIds = topicSequence(topic.classLevel, topic.subject);
  const nextTopic = getTopic(seqIds[seqIds.indexOf(topic.id) + 1]);
  const now = Date.now();
  const state0 = initLessonState({
    topicId: topic.id, kit, skills, history, warmupItems, activeMisconceptionIds, now,
    seed: Math.floor(Math.random() * 2 ** 32),
    ctx: {
      firstName: child.first_name, teacherName: teacher.name, teacherId: teacher.id, protege: teacher.protege,
      ageBand: brief.ageBand, lang: child.language_pref, interests: brief.interests,
      firstMeeting: brief.relationshipStage.startsWith("first_meeting"), hasCallback: brief.memoryCallbacks.length > 0,
      topicTitle: topic.title, nextTitle: nextTopic?.title,
    },
  });
  const r = step(state0, { event: "start", kit, now });
  const state = { ...r.state, brief, mode, kitVerified: kit.verified };
  const instructions = instructionsFor(state, kit);
  const lesson = await one("insert into lesson(child_id, topic_id, kind, state) values ($1,$2,'live',$3) returning id", [child.id, topic.id, state]);
  if (!lesson) throw new Error("lesson insert did not land");

  let teacherOpening, teacherOpeningSeq;
  if (mode === "text") {
    teacherOpening = (await textReply({ instructions, state, kit, childText: "", trace })).reply;
    [{ seq: teacherOpeningSeq }] = await insertTurns(lesson.id, state, [{ speaker: "teacher", text: teacherOpening, meta: { move: r.move.kind } }]);
    await q("update lesson set state = $2 where id = $1", [lesson.id, state]);
  }
  console.info(`[lesson] start ${lesson.id} topic=${topic.id} kit=${kit.verified ? "verified" : "mini"} ${Math.round(performance.now() - t0)}ms`);
  /** @type {import("../../shared/contracts").LessonStartResponse} */
  const out = {
    lessonId: lesson.id, topic: { id: topic.id, title: topic.title, chapter: topic.chapter.title }, instructions,
    teacher: { id: teacher.id, name: teacher.name, voice: teacher.voice }, moduleCommands: r.moduleCommands, ui: r.ui,
    ...(teacherOpening ? { teacherOpening, teacherOpeningSeq } : {}),
  };
  send(res, 201, debugFor(req) ? { ...out, debug: { move: r.move, kitVerified: kit.verified, timings: trace } } : out);
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
  const session = realtimeSession({ instructions: instructionsFor(lesson.state, kit, "voice"), voice: teacherFor(child).voice });
  const secret = await mintRealtimeSecret(session);
  /** @type {import("../../shared/contracts").RealtimeTokenResponse} */
  const out = { token: secret.value, expiresAt: secret.expires_at, base: endpoint(), session };
  send(res, 200, out);
}

// ───────────────────────────── POST /api/lesson/turn ─────────────────────────────

/** What a module-only turn carried, in a few words: its milestones, and how many plain events. */
function activitySummary(events, dropped) {
  const milestones = events.filter((e) => ["goal_met", "stuck", "answer"].includes(e?.type)).map((e) =>
    e.type === "answer" ? `answer${typeof e.data?.correct === "boolean" ? (e.data.correct ? " (right)" : " (wrong)") : ""}` : `${e.type} ${String(e.name ?? "").slice(0, 40)}`.trim());
  const other = events.length - milestones.length + dropped;
  return [...milestones, ...(other ? [`${other} other event${other === 1 ? "" : "s"}`] : [])].join("; ");
}

/** @type {(req: any, res: any, body: import("../../shared/contracts").TurnRequest) => Promise<void>} */
async function turn(req, res, body) {
  const t0 = performance.now();
  const trace = [];
  const { lesson, guardian, child } = await loadLessonFor(req, need(body, "lessonId").lessonId);
  if (lesson.ended_at) throw new HttpError(409, "lesson has ended");
  const prev = lesson.state;
  const state = structuredClone(prev);
  const [kit, core] = await Promise.all([kitFor(lesson.topic_id, state, trace), hasConsent(guardian.id, child.id, "core_tutoring")]);
  // The lane is the lesson's mode. `typed` only says there was no ASR: a typed or tapped turn in a voice
  // lesson is still voice-lane (a text reply for it was never heard, yet was stored as a teacher turn).
  const textLane = state.mode === "text";
  const typed = !!body.typed || textLane;
  const childText = String(body.childText || "").slice(0, 2000).trim();
  const moduleEvents = Array.isArray(body.moduleEvents) ? body.moduleEvents : [];
  const dropped = Number.isInteger(body.droppedEvents) && body.droppedEvents > 0 ? body.droppedEvents : 0;
  // contracts.ts TurnRequest: the child acted in an activity and said nothing. Never graded as a reply —
  // it was once stored as "[no speech]", classified unclear, and walked the lesson plan.
  const moduleOnly = !childText && !body.chipId && body.asrConfidence !== 0 && moduleEvents.length > 0;

  // The teacher's last turn as heard (voice lane only: in the text lane the server wrote and stored every
  // teacher line, and an echo of it stored each one twice), then the child's turn.
  const activeItem = findItem(state, kit, state.activeItemId);
  const teacherText = textLane ? "" : String(body.teacherText || "").slice(0, 2000);
  const heard = teacherText || state.recent.findLast((t) => t.who === "teacher")?.text;
  const leaked = !!teacherText && !!activeItem && state.hintLevel < 4 && state.pendingWhy !== activeItem.id && revealsAnswer(teacherText, activeItem);
  const turnRows = [];
  if (teacherText) turnRows.push({ speaker: "teacher", text: teacherText, meta: { interrupted: !!body.teacherInterrupted, ...(leaked ? { answerLeak: true } : {}) } });
  const extra = dropped ? { droppedEvents: dropped } : {};
  turnRows.push(moduleOnly
    ? { speaker: "system", text: `[activity: ${activitySummary(moduleEvents, dropped)}]`, meta: { module: true, ...extra } }
    : {
      speaker: "child", text: childText || (body.chipId ? `[tap ${body.chipId}]` : "[no speech]"),
      asrConf: typed ? null : body.asrConfidence, meta: { typed, ...(body.chipId ? { chipId: body.chipId } : {}), ...extra },
    });
  const [inserted] = await Promise.all([
    insertTurns(lesson.id, state, turnRows),
    // Text lane: the child cut off the latest stored teacher line; mark that row rather than storing it again.
    textLane && body.teacherInterrupted
      ? q(`update turn set meta = meta || '{"interrupted": true}'::jsonb
           where id = (select id from turn where lesson_id = $1 and speaker = 'teacher' order by seq desc limit 1) returning id`, [lesson.id])
      : null,
  ]);
  const childTurnId = inserted.at(-1).id; // the child's row, or a module-only turn's activity row

  // Classify against the active item's key (never free grading). A module answer on the active item's own
  // module is machine truth; a module-only turn has nothing else to classify.
  const target = targetFor(state, kit, activeItem);
  const moduleAnswer = moduleEvents
    .filter((e) => e?.type === "answer" && state.module && e.moduleId === state.module.id && state.module.itemId === state.activeItemId).at(-1)?.data ?? null;
  const machineAnswer = typeof moduleAnswer?.correct === "boolean" && target.mode === "item";
  const cls = moduleOnly && !machineAnswer ? null : await classify({
    target, childText, heard, asrConfidence: body.asrConfidence, typed, chipId: body.chipId,
    moduleAnswer, classLevel: child.class_level, trace,
  });

  // Evidence → learner model (only with core_tutoring consent).
  const evidence = cls ? evidenceFrom(state, cls, kit, { leaked, discount: gamingDiscount(state.affect) }) : [];
  const skillChanges = {};
  if (core && evidence.length) {
    const current = await loadSkillStates(child.id, [...new Set(evidence.map((e) => e.skillId))]);
    const topicType = activeItem?.topicType ?? kit.topicType;
    const now = new Date();
    const writes = [];
    // Fold rows for the same skill in order (an answer and its volunteered reason are two rows).
    for (const ev of evidence) {
      const before = current[ev.skillId] ?? newSkillState(ev.skillId, topicType, now);
      const after = applyEvidence(before, ev, { topicType, now, lessonStartedAt: lesson.started_at });
      current[ev.skillId] = after;
      writes.push(insertEvidence(child.id, lesson.id, ev, childTurnId));
      if (ev.misconceptionId) writes.push(flagMisconception(child.id, ev.misconceptionId));
      state.history[ev.skillId] = [...(state.history[ev.skillId] ?? []), ev.outcome].slice(-10);
      skillChanges[ev.skillId] ??= { before: Math.round(before.pKnown * 1000) / 1000 };
      Object.assign(skillChanges[ev.skillId], { after: Math.round(after.pKnown * 1000) / 1000, status: after.status });
    }
    for (const id of Object.keys(skillChanges)) {
      writes.push(saveSkillState(child.id, current[id]));
      state.skills[id] = snapshotSkill(current[id]);
    }
    const resolved = activeItem?.targetsMisconception && cls.outcome === "correct" && cls.reason !== "misconception"
      && state.hintLevel === 0 && state.pendingWhy !== activeItem.id;
    if (resolved) writes.push(resolveMisconception(child.id, activeItem.targetsMisconception));
    await Promise.all(writes);
  }
  // A belief voiced outside a keyed item counts on the misconception ledger, never as graded evidence.
  if (core && cls?.voiced) await flagMisconception(child.id, cls.voiced);
  if (cls?.flags.distress) {
    await q("insert into incident(child_id, lesson_id, kind, severity, detail) values ($1,$2,'safeguarding','high',$3)",
      [child.id, lesson.id, { turnId: childTurnId, source: cls.source === "predicate" ? "predicate" : "classifier", family: cls.flags.distressKind }]);
  }

  // Director step → compile → (text lane) reply from the same instructions.
  const r = moduleOnly
    ? step(state, { event: "module", kit, cls: cls ?? undefined, moduleEvents, now: Date.now() })
    : step(state, { event: "turn", kit, cls, chipId: body.chipId, answer: normAnswer(childText), now: Date.now() });
  const next = r.state;
  if (core && r.move.kind === "explain" && r.move.skillId && !next.skills[r.move.skillId]) {
    const intro = markIntroduced(newSkillState(r.move.skillId, kit.topicType));
    await saveSkillState(child.id, intro);
    next.skills[r.move.skillId] = snapshotSkill(intro);
  }
  const instructions = instructionsFor(next, kit);
  let teacherReply, teacherReplySeq, guard;
  if (textLane && !r.hold) {
    const tapped = body.chipId?.startsWith("opt:") ? activeItem?.options?.[Number(body.chipId.slice(4))]?.text : body.chipId?.split(":")[1];
    const said = childText || (moduleOnly ? `(no words; in the activity: ${activitySummary(moduleEvents, 0)})` : `(tapped: ${tapped ?? "nothing"})`);
    // A module-only turn stored no child row, so the whole recent transcript is history.
    ({ reply: teacherReply, guard } = await textReply({ instructions, state: next, kit, childText: said, trace, ...(moduleOnly ? { history: next.recent } : {}) }));
    [{ seq: teacherReplySeq }] = await insertTurns(lesson.id, next, [{ speaker: "teacher", text: teacherReply, meta: { move: r.move.kind, ...(guard.caught.length ? { guard: guard.caught } : {}) } }]);
  }
  // `and ended_at is null`: a turn still in flight when the lesson ends must not rewrite its state.
  const saved = await q("update lesson set state = $2 where id = $1 and ended_at is null and (state->>'turn')::int = $3 returning id", [lesson.id, next, prev.turn]);
  if (saved.length !== 1) {
    const ended = (await one("select ended_at from lesson where id = $1", [lesson.id]))?.ended_at;
    throw new HttpError(409, ended ? "lesson has ended" : "another turn for this lesson landed first; retry");
  }

  // Voice lane: what must be heard now rather than on the child's next turn (contracts.ts TurnResponse).
  const speakNow = textLane ? undefined
    : r.move.kind === "safeguard" && !prev.safeguard ? "interrupt"
      : moduleOnly && !r.hold ? "when_free" : undefined;
  const ms = Math.round(performance.now() - t0);
  console.info(`[lesson] turn ${lesson.id} #${next.turn} ${r.move.kind}${r.hold ? " (hold)" : ""} cls=${cls ? `${cls.outcome}/${cls.source}` : "module"} ${ms}ms`);
  /** @type {import("../../shared/contracts").TurnResponse} */
  const out = {
    instructions, move: r.move, moduleCommands: r.moduleCommands, ui: r.ui,
    ...(teacherReply ? { teacherReply, teacherReplySeq } : {}), ...(speakNow ? { speakNow } : {}), ...(r.end ? { end: true } : {}),
  };
  if (debugFor(req)) {
    const item = r.item;
    out.debug = {
      phase: next.phase, turn: next.turn, teachIdx: next.teachIdx, hintLevel: next.hintLevel, unclear: next.unclear, moduleOnly, hold: !!r.hold,
      classification: cls ? { outcome: cls.outcome, misconceptionId: cls.misconceptionId, voiced: cls.voiced, confidence: cls.confidence, source: cls.source, flags: cls.flags } : null,
      evidence, skills: skillChanges, flagged: next.flagged, guard,
      item: item ? { id: item.id, kind: item.kind, prompt_en: item.prompt_en, prompt_hi: item.prompt_hi, answer: item.answer, acceptable: item.acceptable, ...(item.options ? { options: item.options.map((o) => o.text) } : {}) } : null,
      kitVerified: kit.verified, ms, timings: trace,
    };
  }
  send(res, 200, out);
}

// ───────────────────────────── POST /api/lesson/end ─────────────────────────────

const MEMORY_KINDS = ["interest", "preference", "win", "life_event", "joke"];
const STOP_WORDS = new Set(["the", "and", "with", "likes", "loves", "has", "have", "they", "their", "this", "that", "from", "about", "child", "kid", "very", "really", "hai", "mein", "aur", "bhi", "ko", "ka", "ki", "ke"]);
/** Topics never stored about a child, whatever they say (DPDP minimisation; harvest gurukul §8.5). */
const SENSITIVE = /\b(religio|caste|jaati|dharm|hindu|muslim|christian|sikh|god|bhagwan|allah|address|phone|school name|divorce|fight|beat|sick|ill|hospital|medicine|money|poor|rich|password)/i;

const END_SCHEMA = {
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
function lessonFacts(state, evidence, kit) {
  const bySkill = {};
  for (const e of evidence) {
    const s = (bySkill[e.skill_id] ??= { attempts: 0, unaided: 0 });
    s.attempts += 1;
    if (e.outcome === "correct" && e.hints_used === 0) s.unaided += 1;
  }
  const misIds = [...new Set(evidence.map((e) => e.misconception_id).filter(Boolean))];
  return {
    topic: getTopic(state.topicId)?.title, minutes: state.minutes, teachbackPassed: state.teachbackPassed,
    skills: Object.entries(bySkill).map(([id, s]) => ({ skill: kit.skills.find((k) => k.id === id)?.title ?? "an earlier skill", attempts: s.attempts, unaidedCorrect: s.unaided })),
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

async function end(req, res, body) {
  const trace = [];
  const { lesson, guardian, child } = await loadLessonFor(req, need(body, "lessonId").lessonId);
  if (lesson.ended_at) return send(res, 200, { summary: lesson.summary, parentNote: lesson.parent_note, alreadyEnded: true });
  const state = lesson.state;
  const [turns, evidence, memoryOk, profileOk, kit] = await Promise.all([
    q("select id, seq, speaker, text from turn where lesson_id = $1 order by seq", [lesson.id]),
    q("select skill_id, item_id, probe, outcome, misconception_id, hints_used from evidence where lesson_id = $1 order by at", [lesson.id]),
    hasConsent(guardian.id, child.id, "memory"), hasConsent(guardian.id, child.id, "learning_profile"),
    getKit(lesson.topic_id, { generate: false, mini: state.kitVerified === false }),
  ]);
  const facts = kit ? lessonFacts(state, evidence, kit) : { topic: getTopic(lesson.topic_id)?.title, skills: [] };
  const childTurns = turns.filter((t) => t.speaker === "child" && !t.text.startsWith("["));

  let summary, parentNote, memories = [];
  try {
    const { json } = await chat(DEPLOY.fast, [
      { role: "system", content: [
        `You write the record of one tutoring lesson with ${child.first_name} (class ${child.class_level}).`,
        "Write ONLY from the FACTS and the child's numbered turns. summary: short factual lines. parentNote: plain, warm, specific — what was practised, what went well (the method, not ability), any mix-up and whether it was corrected later in the lesson (correctAfterLastSeen), one way to help at home. Never use ability words (smart, weak, slow, intelligent, topper…), never compare with other children, never predict marks.",
        "memories: at most 3 harmless things the child SAID about themself (interests, preferences, a win, a joke, a happy event). Cite the number of the child turn it came from. Never anything about religion, caste, health, family problems, money, location, school name or other people's names. Empty if nothing fits.",
      ].join("\n") },
      { role: "user", content: `FACTS: ${JSON.stringify(facts)}\nCHILD TURNS:\n${childTurns.map((t, i) => `${i}. ${t.text}`).join("\n") || "(none)"}` },
    ], { schema: END_SCHEMA, schemaName: "lesson_end", effort: "low", maxTokens: 2000, timeoutMs: 25_000, trace });
    summary = json.summary;
    // Ability-label fence on what a parent reads: a sentence with a label is dropped, never rewritten.
    parentNote = json.parentNote.split(/(?<=[.!?।])\s+/).filter((s) => !hasAbilityLabel(s)).join(" ");
    memories = memoryOk ? json.memories : [];
  } catch (e) {
    console.warn("[lesson] end summary unavailable:", e.message);
    summary = `Practised ${facts.topic}. ${(facts.skills || []).map((s) => `${s.skill}: ${s.unaidedCorrect}/${s.attempts} on their own`).join("; ")}`;
    parentNote = `Today ${child.first_name} practised ${facts.topic}.`;
  }

  const saved = [];
  for (const m of memories.slice(0, 3)) {
    const t = citedTurn(m, childTurns);
    if (!t || SENSITIVE.test(m.text) || hasAbilityLabel(m.text) || words(m.text) > 14 || !MEMORY_KINDS.includes(m.kind)) continue;
    saved.push([child.id, m.kind, m.text.trim(), t.id]);
  }
  const writes = [
    q("update lesson set ended_at = now(), summary = $2, parent_note = $3, state = jsonb_set(state, '{phase}', '\"done\"') where id = $1 and ended_at is null returning id",
      [lesson.id, summary, parentNote]),
    // Trust moves at most once a day (rate-limited, inherited rel-state law); sessions always count.
    q(`insert into rel_state(child_id, sessions, stage, last_trust_update) values ($1, 1, 'getting_to_know', current_date)
       on conflict (child_id) do update set sessions = rel_state.sessions + 1,
         stage = case when rel_state.sessions + 1 >= 20 then 'established' when rel_state.sessions + 1 >= 5 then 'familiar' else 'getting_to_know' end,
         trust = case when rel_state.last_trust_update is distinct from current_date then least(0.9, rel_state.trust + 0.03) else rel_state.trust end,
         last_trust_update = current_date, updated_at = now()
       returning sessions`, [child.id]),
    ...saved.map((m) => q("insert into memory(child_id, kind, text, source_turn) values ($1,$2,$3,$4) returning id", m)),
  ];
  // Learning-profile rows only with that consent: one format trial per skill practised, immediate outcome only.
  if (profileOk && kit) {
    for (const s of new Set(evidence.map((e) => e.skill_id))) {
      const rows = evidence.filter((e) => e.skill_id === s);
      writes.push(q("insert into format_trial(child_id, skill_id, topic_type, format, allocated_by, immediate) values ($1,$2,$3,$4,'prior',$5) returning id",
        [child.id, s, kit.topicType, kit.formats.primary, rows.filter((e) => e.outcome === "correct" && e.hints_used === 0).length / rows.length]));
    }
  }
  const results = await Promise.all(writes);
  if (results.some((rows) => rows.length !== 1)) throw new Error("lesson end: a write did not land");
  send(res, 200, { summary, parentNote, memoriesSaved: saved.length, sessions: results[1][0].sessions, ...(debugFor(req) ? { debug: { facts, timings: trace } } : {}) });
}

export const routes = {
  "POST /api/lesson/start": start,
  "POST /api/realtime/token": realtimeToken,
  "POST /api/lesson/turn": turn,
  "POST /api/lesson/end": end,
};
