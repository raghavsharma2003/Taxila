// /api/lesson/* and /api/realtime/token — the Director's HTTP surface (docs/ARCHITECTURE.md §1.2, §2).
// Every route acts for an authenticated guardian's child (requireChild). One compile() feeds both lanes:
// the voice client applies `instructions` verbatim via session.update, and text mode generates its reply
// from the SAME string (inherited rejection: two prompts for two lanes).
import { randomUUID } from "crypto";
import { q, one, tx, guardStmt, GUARD_FAILED } from "../db.js";
import { need, bad, forbidden, notFound, unauthorized, send, HttpError } from "../http.js";
import { requireChild, hasConsent, sessionTokenHash } from "../auth.js";
import { turnVoice } from "../voice/features.js";
import { chat, mintRealtimeSecret, endpoint, DEPLOY, isContentFilter } from "../azure.js";
import { getTopic, getKit, pinKit, pinnedKit, topicOf, topicSequence } from "../content/index.js";
import { nextTopicFor } from "../content/next-topic.js";
import { gamingDiscount, nextAffect } from "../learner/affect.js";
import { hasAbilityLabel } from "../learner/brief.js";
import {
  buildChildBrief, loadRecentOutcomes, skillStateStmt, evidenceStmt, misconceptionFlagStmt, misconceptionResolveStmt,
} from "../learner/model.js";
import { canWrite } from "../learner/mode.js";
import { canWriteMemory, formatTrialStmt, memoryStmt, relSessionStmt, ledgerStmts, lockStmt, modeGuardStmt } from "../learner/writer.js";
import {
  LIVE_FOLD_CTX, answerEvents, closeEvents, compactBelief, skillsMapFor, snapshotFromKt, legacySkillState, loadLive, commitLive, evictLive, dueForChecks,
} from "../learner/live.js";
import { misconceptionView } from "../learner/kt/misconception.js";
import {
  newLearnerState, fuseEvidence, beliefFor, noteOutcome, auditRow, weaveEnqueue, planChecks, onTopicPlanned, consumeExpired, weaveExpire, BAND_BUDGET, bandOf,
} from "../comprehension/index.js";
import { facetStmts, probeLogStmt, reteachStmt, gradeAuditStmt, weaveEnqueueStmt, weaveStmts } from "../comprehension/store.js";
import { gradeLater, settledGrade, finalEvent, awaitGrade, forgetGrade } from "../comprehension/later.js";
import { classify, classifyFast, targetFor } from "../director/classify.js";
import { scanSafety } from "../director/safety.js";
import { initLessonState, step, evidenceFrom, upcomingItem, LIMITS } from "../director/state.js";
import { findItem, promptFor, revealsAnswer, posesItem, handsBack, asksWhy, whyKey, norm as normAnswer } from "../director/items.js";
import { TURN_WORDS } from "../compiler/compile.js";
import { mixedUnitComparison, withoutMixedUnits } from "../director/units.js";
import { instructionsFor, instructionsAfter } from "../compiler/instructions.js";
import { teacherFor, teacherForLesson } from "../compiler/characters/index.js";
import { prewarm, drop as dropPrewarm } from "../voice/prewarm.js";
import { styleForChild } from "./voice.js";

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
 * loadLessonFor + the core_tutoring consent check as ONE query, for the turn route: it is on the cascade
 * lane's reply path, where each sequential round trip to Neon is ~0.2-0.4 s (four of them were ~1 s of the
 * measured Director time). Same answers in the same order: 400 bad id, 404 no lesson, 401 not signed in /
 * expired, 403 not this guardian's child; `core` is the latest core_tutoring consent row (hasConsent's rule).
 */
async function loadTurnContext(req, lessonId) {
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

/**
 * The exact kit a lesson started on (state.kitHash, content/index.js pinnedKit): kit files are rewritten
 * while lessons run, and a lesson's item ids mean nothing in any other version. Never generated mid-lesson;
 * unavailable is a 503, not a crash. A lesson stored before pinning existed reads the current kit.
 */
async function kitFor(topicId, state) {
  const kit = state?.kitHash ? await pinnedKit(topicId, state.kitHash) : await getKit(topicId, { generate: false });
  if (!kit) throw new HttpError(503, "no teaching content is available for this topic yet");
  return kit;
}

/**
 * Give turn rows their seq (from the lesson state) and remember the last few for text-mode context. Pure:
 * the rows are written by the turn's single transaction (turnInsertStmt).
 */
function stageTurns(state, rows) {
  return rows.map((r) => {
    state.seq += 1;
    if (r.speaker !== "system") state.recent = [...state.recent, { who: r.speaker, text: r.text.slice(0, 400) }].slice(-RECENT_TURNS);
    return { ...r, seq: state.seq };
  });
}

/** One insert for staged turn rows; (lesson_id, seq) is unique, so a replayed turn cannot write twice. */
function turnInsertStmt(lessonId, rows) {
  const params = [];
  const values = rows.map((r, i) => {
    params.push(lessonId, r.seq, r.speaker, r.text, r.asrConf ?? null, r.meta ?? {});
    const b = i * 6;
    return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6})`;
  });
  return { text: `insert into turn(lesson_id, seq, speaker, text, asr_conf, meta) values ${values.join(",")} returning seq`, params };
}

/** A safeguarding incident row. turnSeq: the child turn it came from (same transaction), or null. */
function incidentStmt(childId, lessonId, turnSeq, detail) {
  return {
    text: `insert into incident(child_id, lesson_id, kind, severity, detail)
           values ($1, $2, 'safeguarding', 'high', jsonb_build_object('turnId', (select id from turn where lesson_id = $2 and seq = $3)) || $4::jsonb) returning id`,
    params: [childId, lessonId, turnSeq, detail],
  };
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
 * Teaching turns with no item on the table: what they say must not answer the question that comes next
 * (measured in evals/director-sim.mjs: an explain turn said "use one-fourth kehte hain", and the next item,
 * "Ek tukde ko kya kehte hain?", was scored as an unaided correct answer).
 */
const TEACHING_MOVES = new Set(["hook", "explain", "worked_example", "reteach"]);
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
 * What the child reads when no reply could be written (the model failed twice): content where there is
 * some — the question on the table — else a fixed line for the move. Never a throw after the turn's
 * evidence is decided: the lesson goes on. The safeguard line carries the helpline (the floor's contract).
 */
const FALLBACK = {
  english: { wrap: "That's all for today. See you next time!", safeguard: "What you said matters. Please tell a grown-up you trust, or call Childline 1098. Are you okay right now?",
    other: "Sorry, I lost my words for a second. Can you say that again?" },
  hinglish: { wrap: "Aaj ke liye itna hi. Phir milte hain!", safeguard: "Tumne jo bataya, woh zaroori hai. Kisi bade ko batao jis par bharosa ho, ya Childline 1098 pe call karo. Kya tum abhi theek ho?",
    other: "Ek second, meri baat atak gayi. Kya tum phir se bata sakte ho?" },
};
function fallbackReply(state, item) {
  const lang = state.ctx.lang;
  const kind = state.lastMove?.kind;
  if (item && !CLOSING_MOVES.has(kind)) return promptFor(item, lang);
  const lines = FALLBACK[lang === "english" ? "english" : "hinglish"];
  return lines[kind] ?? lines.other;
}

/** The draft up to (not including) its first question, then the item's own question. Exported for tests. */
export function repairDrift(draft, item, lang) {
  const sentences = String(draft).match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const lead = [];
  for (const x of sentences) {
    if (/[?？]/.test(x)) break;
    lead.push(x);
  }
  return `${lead.join("").trim()} ${promptFor(item, lang)}`.trim();
}

/** Sentences of `text` that do not state `item`'s key (what is left of a teaching turn after a leak survived). */
const withoutLeaks = (text, item) => (String(text).match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => !revealsAnswer(x, item)).join("").trim();

/**
 * Text-mode teacher reply from the SAME compiled instructions, guarded on the bytes: an answer leak before
 * rung 4 (on the active item, or — on a teaching turn — on the item that comes next), a posing turn that
 * does not pose the item (drift), or an over-long turn gets one rewrite; a leak or drift that survives is
 * replaced by the question itself (content), or the leaking sentences are dropped, never shipped. A model
 * failure falls back (fallbackReply) instead of throwing.
 */
async function textReply({ instructions, state, kit, childText, trace, history = state.recent.slice(0, -1) }) {
  const item = state.lastMove?.itemId ? findItem(state, kit, state.lastMove.itemId) : null;
  const ahead = !item && TEACHING_MOVES.has(state.lastMove?.kind) ? upcomingItem(state, kit) : null;
  const lang = state.ctx.lang;
  // A diagnostic's options are content read aloud, so they do not count against the turn length.
  const max = REPLY_MAX_WORDS[state.ctx.ageBand] + (item?.diagnostic ? words(item.options.map((o) => o.text).join(" ")) : 0);
  const guardable = item && state.hintLevel < 4 && state.pendingWhy !== item.id;
  const mustPose = guardable && state.hintLevel === 0 && POSING_MOVES.has(state.lastMove.kind);
  const mustHandBack = !CLOSING_MOVES.has(state.lastMove.kind);
  const whyProbe = !!item && state.pendingWhy === item.id;
  // A comparison across kinds of quantity (45,000 fans vs 4,500 km) in the teacher's OWN words; the kit's posed
  // question is verified content and is not judged here.
  const own = (t) => (item ? String(t).split(promptFor(item, lang)).join(" ") : String(t));
  const problems = (t) => [
    (guardable && revealsAnswer(t, item) || ahead && revealsAnswer(t, ahead)) && "leak",
    mixedUnitComparison(own(t)) && "units",
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
  const ask = (msgs) => chat(DEPLOY.reply, msgs, { maxTokens: 220, effort: "none", timeoutMs: 6000, trace }).then((r) => r.text.trim());
  let reply;
  // The content filter blocking the reply call (the child's words are in it) is a safety signal, not an
  // outage: the caller fails CLOSED to the safeguarding protocol (turn(): `filtered`).
  const blocked = () => ({ reply: fallbackReply(state, item), filtered: true, guard: { caught: ["content_filter"], rewritten: false, replaced: true } });
  try {
    reply = await ask(messages);
  } catch (e) {
    if (isContentFilter(e)) { console.warn("[lesson] reply blocked by the content filter"); return blocked(); }
    console.warn("[lesson] reply unavailable, falling back:", e.message);
    return { reply: fallbackReply(state, item), guard: { caught: ["unavailable"], rewritten: false, replaced: true } };
  }
  let found = problems(reply);
  const guard = { caught: found, rewritten: false, replaced: false, ...(found.length ? { firstDraft: reply } : {}) };
  // Drift (a posing turn that asked some other question) is repaired without a model call when it is the
  // only problem besides the hand-back the posed question supplies: what the draft said BEFORE its first
  // question (the acknowledgement), then the verified question itself — what the rewrite produced in 9/9
  // measured drift rewrites (5 the question alone, 4 acknowledgement + question; evals/cascade-latency.mjs,
  // 2026-10-02), at ~1 s less. Every guard runs again on the result; anything left goes to the rewrite.
  if (found.includes("drift") && found.every((p) => p === "drift" || p === "flat")) {
    const repaired = repairDrift(reply, item, lang);
    if (!problems(repaired).length) {
      reply = repaired;
      found = [];
      guard.repaired = true;
    }
  }
  if (found.length) {
    const why = [found.includes("leak") && (ahead
      ? "it states the answer to the practice question that comes next — explain with different numbers or a different example, and do not answer that question"
      : "it gives away the key answer — the hint ladder has not reached rung 4"),
      found.includes("drift") && `it must ask exactly this question and no other: "${promptFor(item, lang)}"`,
      found.includes("nowhy") && "it must ask how they knew or why — about the question they just answered, not a new problem; the reason is theirs to give",
      found.includes("flat") && !found.includes("nowhy") && "it never hands the floor back — end with one question for the child about the same thing (and do not answer it yourself)",
      found.includes("script") && (lang === "hindi" ? "write it in Roman or Devanagari only" : "write it in Roman script only — no Devanagari or any other script"),
      found.includes("long") && `it is too long — at most ${TURN_WORDS[state.ctx.ageBand]} words`,
      found.includes("units") && "it asks which is bigger between two different kinds of quantity — compare like with like (two counts, or two lengths in one unit)"].filter(Boolean).join("; and ");
    try {
      reply = await ask([...messages, { role: "assistant", content: reply }, { role: "system", content: `Rewrite that turn: ${why}. Same move, same language, one idea, end by handing the floor back.` }]);
      guard.rewritten = true;
      found = problems(reply);
    } catch (e) {
      if (isContentFilter(e)) { console.warn("[lesson] rewrite blocked by the content filter"); return blocked(); }
      console.warn("[lesson] rewrite unavailable, guarding the draft:", e.message); // the draft's problems stand
    }
    guard.afterRewrite = found;
    if (found.includes("leak") && ahead) {
      reply = withoutLeaks(reply, ahead) || fallbackReply(state, null);
      guard.replaced = true;
    } else if (found.includes("leak") || found.includes("drift")) {
      reply = promptFor(item, lang);
      guard.replaced = true;
    } else {
      if (found.includes("units")) { reply = withoutMixedUnits(reply) || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("script")) reply = reply.replace(OFF_SCRIPT[lang] ?? OFF_SCRIPT.english, "").replace(/\s{2,}/g, " ").trim();
      if (found.includes("long")) reply = trimToWords(reply, max);
    }
  }
  return { reply, guard };
}

/**
 * Warm-up retrieval items for the session's openers (rule 18; COMPREHENSION-ENGINE.md §3.5.7): the delayed checks
 * the ledger says are due, snapshotted into the lesson state with their kit facts. Each one is a C31 callback that
 * clears its skill's delayed_check trigger (director/state.js activate).
 * @param {string[]} skillIds openers, most urgent first
 */
async function warmupItemsFor(skillIds) {
  const out = [];
  for (const skillId of skillIds.slice(0, LIMITS.warmupMax)) {
    const st = { skillId };
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

/** A weave_queue row → the reducer's entry (comprehension/weave.js). */
const weaveEntryOf = (r) => ({ childId: r.child_id, skillId: r.skill_id, kind: r.kind, anchorAt: new Date(r.anchor_at).toISOString(),
  earliestAt: new Date(r.earliest_at).toISOString(), dueAt: new Date(r.due_at).toISOString(), topicsSince: r.topics_since,
  hostCandidates: r.host_candidates ?? [], host: r.host ?? undefined, status: r.status });

/**
 * Forge / engine seams the Director would call (no-ops: server/forge/** is another workstream's). A woven sub-step
 * needs a host item that carries the earlier skill as a NECESSARY sub-step (kit isomorph or
 * ModuleRequest.want.subSkill); until one exists the entry stays hosted and expires into a C31 callback.
 */
export const forgeSeam = { wovenSubStep: (_hosted) => undefined };

// ───────────────────────────── POST /api/lesson/start ─────────────────────────────

/**
 * The compiled instructions carry the answer key ("key, for checking only"), so they reach the client only
 * where the client must apply them: the voice lane, whose session.update goes over the browser's data
 * channel. The text lane's reply is generated here, so its client never receives them.
 * Accepted risk until a server sideband owns session.update: context/inbox/ws1-client.json
 * (voice-instructions-client-visible).
 */
export const clientInstructions = (mode, instructions) => (laneOf(mode) === "voice" ? { instructions } : {});
/**
 * The lesson's lane. "cascade" (the default voice lane: STT → Director → streamed TTS) is a text lane to the
 * server — the Director writes and stores every reply — but its child turns are SPOKEN: they carry an ASR
 * confidence that is stored and gates classify, exactly as on the realtime lane. Only "text" means typed.
 */
const LANES = new Set(["voice", "text", "cascade"]);
const laneOf = (mode) => (LANES.has(mode) ? mode : "voice");

/**
 * A turn's lane rules from the lesson's mode: who writes the reply (text lanes: the Director, here), and
 * whether the child's words came without ASR (typed). `body.typed` marks a typed or tapped turn on any lane.
 * Exported for tests.
 */
export function turnLane(mode, body) {
  const lane = laneOf(mode);
  return { lane, textLane: lane !== "voice", typed: !!body.typed || lane === "text" };
}

/** The stored child row: a spoken turn keeps its ASR confidence (asr_conf), a typed one has none. Exported for tests. */
export function childTurnRow({ childText, chipId, asrConfidence, typed, extra = {} }) {
  return {
    speaker: "child", text: childText || (chipId ? `[tap ${chipId}]` : "[no speech]"),
    asrConf: typed ? null : (typeof asrConfidence === "number" ? asrConfidence : null),
    meta: { typed, ...(chipId ? { chipId } : {}), ...extra },
  };
}

/** @type {(req: any, res: any, body: import("../../shared/contracts").LessonStartRequest) => Promise<void>} */
async function start(req, res, body) {
  const t0 = performance.now();
  const trace = [];
  const { guardian, child } = await requireChild(req, need(body, "childId").childId);
  const [core, memory] = await Promise.all([
    hasConsent(guardian.id, child.id, "core_tutoring"), hasConsent(guardian.id, child.id, "memory"),
  ]);
  if (!core) throw forbidden("core_tutoring consent is required before a lesson");
  const mode = body.mode === "text" || body.mode === "cascade" ? body.mode : "voice";
  const topic = body.topicId ? getTopic(body.topicId) : await nextTopicFor(child);
  if (!topic) throw bad(body.topicId ? `unknown topic ${body.topicId}` : "no topic available for this class");
  const kit = await getKit(topic.id, { trace });
  if (!kit) throw new HttpError(503, "no teaching content is available for this topic yet");
  // Every later request of this lesson reads back exactly this kit (kitFor).
  const now = Date.now();
  const [, live, weaveRows] = await Promise.all([pinKit(kit), loadLive(child),
    q("select * from weave_queue where child_id = $1 and status in ('queued','hosted')", [child.id]).catch(() => [])]);
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
  const warmupItems = await warmupItemsFor(checks.openers);
  const skillIds = [...new Set([...kit.skills.map((s) => s.id), ...warmupItems.map((w) => w.skillId)])];
  const [history, brief] = await Promise.all([loadRecentOutcomes(child.id, kit.skills.map((s) => s.id)), buildChildBrief(child, { memory })]);
  // The Director's skill snapshot and misconceptions come from the ledger (the legacy fold is gone).
  const skills = Object.fromEntries(skillIds.filter((id) => ledger.skills[id]).map((id) => [id, { skillId: id, ...snapshotFromKt(ledger.skills[id], now) }]));
  const activeMisconceptionIds = misconceptionView(ledger.mis).slice(0, 5).map((m) => m.id);
  const teacher = teacherFor(child);
  const seqIds = topicSequence(topic.classLevel, topic.subject);
  const nextTopic = getTopic(seqIds[seqIds.indexOf(topic.id) + 1]);
  const lessonId = randomUUID();
  const state0 = initLessonState({
    topicId: topic.id, kit, skills, history, warmupItems, activeMisconceptionIds, now,
    seed: Math.floor(Math.random() * 2 ** 32),
    openers: warmupItems.map((w) => w.skillId), comp: skillsMapFor(live.state, kit, skillIds, now),
    ctx: {
      sessionId: lessonId, classLevel: child.class_level, schoolMedium: child.school_medium ?? undefined,
      firstName: child.first_name, teacherName: teacher.name, teacherId: teacher.id, protege: teacher.protege,
      ageBand: brief.ageBand, lang: child.language_pref, interests: brief.interests,
      firstMeeting: brief.relationshipStage.startsWith("first_meeting"), hasCallback: brief.memoryCallbacks.length > 0,
      topicTitle: topic.title, nextTitle: nextTopic?.title,
    },
  });
  const first = step(state0, { event: "start", kit, now });
  const { r, instructions } = instructionsAfter({ ...first, state: { ...first.state, brief, mode, kitVerified: kit.verified, kitHash: kit.hash } }, kit, now);
  const state = r.state;

  let teacherOpening, teacherOpeningSeq, rows = [];
  if (mode !== "voice") {
    teacherOpening = (await textReply({ instructions, state, kit, childText: "", trace })).reply;
    rows = stageTurns(state, [{ speaker: "teacher", text: teacherOpening, meta: { move: r.move.kind } }]);
    teacherOpeningSeq = rows[0].seq;
  }
  // The lesson and its opening turn land together, or not at all.
  const [created] = await tx([
    { text: "insert into lesson(id, child_id, topic_id, kind, state) values ($1,$2,$3,'live',$4) returning id", params: [lessonId, child.id, topic.id, state] },
    ...(rows.length ? [turnInsertStmt(lessonId, rows)] : []),
    // the weave queue after this topic was planned (topicsSince, hosted, expired-as-callback): only the open entries
    ...(canWrite(child, "kt") && weaveRows.length ? weaveStmts(child, plannedQ) : []),
  ]);
  if (created.length !== 1) throw new Error("lesson insert did not land");
  if (mode === "cascade" && teacherOpeningSeq) {
    prewarm({ lessonId, seq: teacherOpeningSeq, text: teacherOpening, tokenHash: sessionTokenHash(req), guardianId: guardian.id, style: styleForChild(child, undefined, state.ctx?.teacherId) });
  }
  console.info(`[lesson] start ${lessonId} topic=${topic.id} kit=${kit.verified ? "verified" : "mini"} ${Math.round(performance.now() - t0)}ms`);
  /** @type {import("../../shared/contracts").LessonStartResponse} */
  const out = {
    lessonId, topic: { id: topic.id, title: topic.title, chapter: topic.chapter.title },
    ...clientInstructions(mode, instructions), teacher: { id: teacher.id, name: teacher.name, voice: teacher.voice }, moduleCommands: r.moduleCommands, ui: r.ui,
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
  const session = realtimeSession({ instructions: instructionsFor(lesson.state, kit, "voice"), voice: teacherForLesson(child, lesson.state?.ctx?.teacherId).voice });
  const secret = await mintRealtimeSecret(session);
  /** @type {import("../../shared/contracts").RealtimeTokenResponse} */
  // The secret was minted WITH the instructions; the client gets the session back without them (it needs
  // only audio.input, to restore turn detection after push-to-talk) so the key is not in this response.
  const { instructions: _minted, ...clientSession } = session;
  const out = { token: secret.value, expiresAt: secret.expires_at, base: endpoint(), session: clientSession };
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
  // Phase marks (ms since the request arrived) ride in debug.timings beside the model calls: evals/cascade-latency.mjs.
  const mark = (name) => trace.push({ kind: `@${name}`, ms: Math.round(performance.now() - t0) });
  const { lesson, guardian, child, core } = await loadTurnContext(req, need(body, "lessonId").lessonId);
  mark("ctx");
  if (lesson.ended_at) throw new HttpError(409, "lesson has ended");
  const childText = String(body.childText || "").slice(0, 2000).trim();
  // Consent is checked per turn, like start and token: once core_tutoring is withdrawn the child's words are
  // not stored, classified or sent to a model. The safety predicate still reads them (on this server only),
  // and a disclosure still leaves an incident row — without the transcript.
  if (!core) {
    const safety = scanSafety(childText);
    if (safety.distress) {
      await q("insert into incident(child_id, lesson_id, kind, severity, detail) values ($1,$2,'safeguarding','high',$3) returning id",
        [child.id, lesson.id, { source: "predicate", family: safety.kind, consentWithdrawn: true }]);
    }
    throw forbidden("core_tutoring consent withdrawn");
  }
  const prev = lesson.state;
  const state = structuredClone(prev);
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

  // The teacher's last turn as heard (voice lane only: in the text lane the server wrote and stored every
  // teacher line, and an echo of it stored each one twice), then the child's turn.
  const activeItem = findItem(state, kit, state.activeItemId);
  const teacherText = textLane ? "" : String(body.teacherText || "").slice(0, 2000);
  // The client heard the teacher voice lastMove (contracts.ts TurnRequest.teacherText): until step() plans a
  // new move, the instructions frame it as already said.
  if (teacherText) state.moveVoiced = true;
  const heard = teacherText || state.recent.findLast((t) => t.who === "teacher")?.text;
  const leaked = !!teacherText && !!activeItem && state.hintLevel < 4 && state.pendingWhy !== activeItem.id && revealsAnswer(teacherText, activeItem);
  // A voice turn can state the key of the question that comes NEXT (an explain turn, a re-teach): that item's
  // answer is then worth nothing. The text lane's reply is guarded before it is sent, and checked below.
  const spoils = teacherText ? spoiledBy(teacherText, state, kit, activeItem) : null;
  if (spoils) state.spoiled = [...(state.spoiled ?? []), spoils];
  const turnRows = [];
  if (teacherText) {
    turnRows.push({ speaker: "teacher", text: teacherText,
      meta: { interrupted: !!body.teacherInterrupted, ...(leaked ? { answerLeak: true } : {}), ...(spoils ? { spoils } : {}),
        // the realtime model wrote this turn itself: a mixed-unit comparison is flagged for review (it cannot be unsaid)
        ...(mixedUnitComparison(teacherText) ? { unitMix: true } : {}) } });
  }
  const extra = dropped ? { droppedEvents: dropped } : {};
  turnRows.push(moduleOnly
    ? { speaker: "system", text: `[activity: ${activitySummary(moduleEvents, dropped)}]`, meta: { module: true, ...extra } }
    : childTurnRow({ childText, chipId: body.chipId, asrConfidence: body.asrConfidence, typed, extra }));
  const staged = stageTurns(state, turnRows);

  // Classify against the active item's key (never free grading). A module answer on the active item's own
  // module is machine truth; a module-only turn has nothing else to classify.
  const target = targetFor(state, kit, activeItem);
  const moduleAnswer = moduleEvents
    .filter((e) => e?.type === "answer" && state.module && e.moduleId === state.module.id && state.module.itemId === state.activeItemId).at(-1)?.data ?? null;
  const machineAnswer = typeof moduleAnswer?.correct === "boolean" && target.mode === "item";
  const clsArgs = { target, childText, heard, asrConfidence: body.asrConfidence, typed, chipId: body.chipId, moduleAnswer, classLevel: child.class_level, trace };
  const classified = !(moduleOnly && !machineAnswer);
  const answer = normAnswer(childText);
  const tapped = body.chipId?.startsWith("opt:") ? activeItem?.options?.[Number(body.chipId.slice(4))]?.text : body.chipId?.split(":")[1];
  const said = childText || (moduleOnly ? `(no words; in the activity: ${activitySummary(moduleEvents, 0)})` : `(tapped: ${tapped ?? "nothing"})`);
  // Last turn's held why / teach-back events, with their blind verdict if it is in (never waited for).
  const carried = carriedFrom(state);
  const planCtx = { kit, child, lesson, activeItem, moduleOnly, moduleEvents, chipId: body.chipId, answer, leaked, live: liveP, carried,
    childText, typed, asrConfidence: body.asrConfidence, bargeIn: !!body.teacherInterrupted };
  // A module-only turn stored no child row, so the whole recent transcript is history.
  const historyOf = (next) => (moduleOnly ? next.recent : next.recent.slice(0, -1));

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
  const specs = textLane && fast && !fast.result
    ? speculate(state, target, fast.flags, { ...planCtx, now }, { said, historyOf }, fast.lowAsr ? { outcomes: ["no_evidence"], source: "asr" } : {})
    : [];
  const cls = classified ? await classify(clsArgs) : null;
  mark("classified");
  // This utterance's voice tie-breakers (features.js signalsFrom: capped booleans) reach the plan only if they are
  // already in when the classification is: the turn never waits on them (CE8: zero evidence weight, tie-break and
  // pacing only). A speculative reply was planned without them, so a non-empty signal set can only miss it.
  if (voiceNow?.reliable && Object.keys(voiceNow.signals ?? {}).length) planCtx.voice = { signals: voiceNow.signals, z: voiceNow.z };

  // Evidence → learner model → Director step → compile, all staged as statements for the turn's one transaction.
  let plan = await planTurn(state, cls, { ...planCtx, now });
  let { evidence, writes, skillChanges, incident, r, instructions, skipped } = plan;
  mark("planned");
  let next = r.state;
  let teacherReply, teacherReplySeq, guard, speculation, prewarmed = false;
  if (textLane && !r.hold) {
    const key = replyKey(next, kit, r, instructions, said, historyOf(next));
    const hit = await pickSpeculation(specs, key);
    speculation = specs.length ? { tried: specs.length, hit: !!hit, ...(hit ? {} : { differs: await missReason(specs, key) }) } : undefined;
    if (hit) trace.push(...hit.trace.map((t) => ({ ...t, speculative: true })));
    let filtered;
    ({ reply: teacherReply, guard, filtered } = hit
      ? hit.result
      : await textReply({ instructions, state: next, kit, childText: said, trace, history: historyOf(next) }));
    // The content filter blocked the reply call that carried the child's words: fail CLOSED. The turn is
    // re-planned as a disclosure (safeguard move, incident row) and the fixed helpline line is sent, with no
    // further model call on the same words.
    if (filtered && (childText || body.chipId)) {
      const blockedCls = { ...(cls ?? { outcome: "no_evidence", confidence: 1 }), source: "content_filter",
        flags: { ...(cls?.flags ?? fast?.flags ?? {}), distress: true, distressKind: cls?.flags?.distressKind ?? "content_filter" } };
      plan = await planTurn(state, blockedCls, { ...planCtx, now });
      ({ evidence, writes, skillChanges, incident, r, instructions, skipped } = plan);
      next = r.state;
      teacherReply = fallbackReply(next, null);
      guard = { ...guard, caught: [...new Set([...(guard?.caught ?? []), "content_filter"])], replaced: true };
    }
    const replyItem = next.lastMove?.itemId ? findItem(next, kit, next.lastMove.itemId) : null;
    const replySpoils = spoiledBy(teacherReply, next, kit, replyItem);
    if (replySpoils) next.spoiled = [...(next.spoiled ?? []), replySpoils];
    const [row] = stageTurns(next, [{ speaker: "teacher", text: teacherReply,
      meta: { move: r.move.kind, ...(guard.caught.length ? { guard: guard.caught } : {}), ...(replySpoils ? { spoils: replySpoils } : {}) } }]);
    staged.push(row);
    teacherReplySeq = row.seq;
    mark("replied");
    // Cascade: the guarded reply starts speaking now, while the transaction below runs (server/voice/prewarm.js);
    // a turn that is not stored drops it.
    if (state.mode === "cascade") {
      prewarmed = prewarm({ lessonId: lesson.id, seq: teacherReplySeq, text: teacherReply, tokenHash: sessionTokenHash(req), guardianId: guardian.id, style: styleForChild(child, undefined, state.ctx?.teacherId) });
    }
  } else if (specs.length) {
    speculation = { tried: specs.length, hit: false };
  }

  // One transaction: the state check first (`and ended_at is null`: a turn still in flight when the lesson
  // ends must not rewrite it; the turn number: a concurrent or replayed turn loses), then every row this
  // turn produced. A loser, a failure or a 409 leaves nothing behind, so a retry cannot double the evidence.
  let seqs = [];
  try {
    ({ seqs } = await runTurnTx(child, [
      guardStmt("update lesson set state = $2 where id = $1 and ended_at is null and (state->>'turn')::int = $3 returning id", [lesson.id, next, prev.turn]),
      // Text lane: the child cut off the latest stored teacher line; mark that row rather than storing it again.
      ...(textLane && body.teacherInterrupted ? [{ text: `update turn set meta = meta || '{"interrupted": true}'::jsonb
           where id = (select id from turn where lesson_id = $1 and speaker = 'teacher' order by seq desc limit 1) returning id`, params: [lesson.id] }] : []),
      turnInsertStmt(lesson.id, staged),
      ...writes,
    ]));
  } catch (e) {
    if (prewarmed) dropPrewarm(lesson.id, teacherReplySeq);
    // A disclosure is recorded even when its turn is not (without the turn it came from).
    if (incident) {
      await q("insert into incident(child_id, lesson_id, kind, severity, detail) values ($1,$2,'safeguarding','high',$3) returning id",
        [child.id, lesson.id, { ...incident, turnUnsaved: true }]).catch((err) => console.error("[lesson] incident write failed:", err.message));
    }
    if (e?.code !== GUARD_FAILED) throw e;
    const ended = (await one("select ended_at from lesson where id = $1", [lesson.id]))?.ended_at;
    throw new HttpError(409, ended ? "lesson has ended" : "another turn for this lesson landed first; retry");
  }
  mark("stored");
  // The online fold is the cache only if our inserts got the next seqs (no interleaved writer); else replay next turn.
  const learner = plan.learner;
  if (canWrite(child, "kt")) commitLive(child, learner.before.maxSeq, learner.after, seqs);
  else evictLive(child.id);
  for (const x of carried) forgetGrade(x.event.id);
  launchGrades(next);

  // Voice lane: what must be heard now rather than on the child's next turn (contracts.ts TurnResponse).
  const speakNow = textLane ? undefined
    : r.move.kind === "safeguard" && !prev.safeguard ? "interrupt"
      : moduleOnly && !r.hold ? "when_free" : undefined;
  const voice = await voiceP;
  const ms = Math.round(performance.now() - t0);
  console.info(`[lesson] turn ${lesson.id} #${next.turn} ${r.move.kind}${r.hold ? " (hold)" : ""} cls=${cls ? `${cls.outcome}/${cls.source}` : "module"}${speculation ? ` spec=${speculation.hit ? "hit" : "miss"}/${speculation.tried}` : ""} ${ms}ms`);
  /** @type {import("../../shared/contracts").TurnResponse} */
  const out = {
    ...clientInstructions(state.mode, instructions), move: r.move, moduleCommands: r.moduleCommands, ui: r.ui,
    ...(teacherReply ? { teacherReply, teacherReplySeq } : {}), ...(speakNow ? { speakNow } : {}), ...(r.end ? { end: true } : {}),
    // Pace knobs from the vibe persona (wait before a nudge, end-of-speech silence): session config, never the prompt.
    ...(next.vibe ? { pace: { waitNudgeSec: next.vibe.waitNudgeSec, endpointSilenceMs: next.vibe.endpointSilenceMs } } : {}),
  };
  if (debugFor(req)) {
    const item = r.item;
    out.debug = {
      phase: next.phase, turn: next.turn, teachIdx: next.teachIdx, hintLevel: next.hintLevel, unclear: next.unclear, moduleOnly, hold: !!r.hold,
      classification: cls ? { outcome: cls.outcome, misconceptionId: cls.misconceptionId, voiced: cls.voiced, confidence: cls.confidence, source: cls.source, flags: cls.flags } : null,
      evidence, kt: plan.events.map((e) => ({ id: e.id, cls: e.cls, outcome: e.outcome, skillIds: e.skillIds, grader: e.grader, ...(e.teach ? { teach: true } : {}),
        ...(e.shapeId ? { shapeId: e.shapeId } : {}), ...(typeof e.spanOk === "boolean" ? { spanOk: e.spanOk } : {}), ...(e.misconceptionId ? { misconceptionId: e.misconceptionId } : {}) })),
      probe: next.pendingProbe ?? null, vibe: next.vibe ?? null, held: (next.kt?.deferred ?? []).map((d) => d.event.id), carried: carried.map((x) => ({ id: x.event.id, graded: !!x.results?.length })),
      skills: skillChanges, flagged: next.flagged, guard, spoiled: next.spoiled, ...(skipped ? { skipped } : {}),
      ...(speculation ? { speculation } : {}), ...(prewarmed ? { ttsPrewarmed: true } : {}),
      item: item ? { id: item.id, kind: item.kind, prompt_en: item.prompt_en, prompt_hi: item.prompt_hi, answer: item.answer, acceptable: item.acceptable, ...(item.options ? { options: item.options.map((o) => o.text) } : {}) } : null,
      kitVerified: kit.verified, ms, timings: trace,
      ...(voice ? { voice: { reliable: voice.reliable, signals: voice.signals, z: voice.z } } : {}),
    };
  }
  send(res, 200, out);
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
async function planTurn(base, cls, c) {
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

  // 2. the Director step on beliefs that include this answer (voice: capped tie-breakers only, CE8)
  const stepIn = { kit, cls: cls ?? undefined, chipId: c.chipId, answer: c.answer, now, comp: state.comp, voice: c.voice?.signals, voiceZ: c.voice?.z,
    text: c.childText, bargeIn: c.bargeIn };
  const stepped = moduleOnly
    ? step(state, { ...stepIn, event: "module", moduleEvents: c.moduleEvents })
    : step(state, { ...stepIn, event: "turn" });
  const { r, instructions, skipped } = instructionsAfter(stepped, kit, now);
  const next = r.state;
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
function gradeRequestFor(ev, { kit, activeItem, state, childText }) {
  const ideas = ev.cls === "probe.teachback" ? kit.expectations ?? []
    : (activeItem?.expectations ?? kit.expectations ?? []).length ? (activeItem?.expectations ?? kit.expectations) : [whyKey(kit, ev.target) ?? activeItem?.answer].filter(Boolean);
  const heard = state.recent.findLast((t) => t.who === "teacher")?.text ?? "";
  return { childText: String(childText ?? "").slice(0, 1200), targets: ideas.slice(0, 4).map((t, i) => ({ id: `${ev.target}:e${i + 1}`, textEn: String(t) })),
    echo: [kit.title ?? "", getTopic(state.topicId)?.title ?? "", heard].filter(Boolean), lang: state.ctx?.lang === "english" ? "en" : "hi-en" };
}

/** The held events of the previous turn, as they fold now: the blind verdict if it is in, else the classifier's. */
function carriedFrom(state) {
  return (state.kt?.deferred ?? []).map((d) => finalEvent(d.event, settledGrade(d.event.id)));
}

/** Start the blind grading of this turn's held events (after the commit; never awaited by the turn). */
function launchGrades(next) {
  for (const d of next.kt?.deferred ?? []) if (d.grade) gradeLater(d.event, d.grade);
}

/**
 * Run the turn's statements: the child's advisory lock and the legal-mode guard go FIRST whenever a learner layer
 * is written (the writer's contract, writer.commit; the M0 ratchet takes the same lock), then the given order.
 * Returns the seq each staged kt_evidence insert got, in staging order.
 */
async function runTurnTx(child, stmts) {
  const learner = stmts.some((x) => x.layer && x.layer !== "session");
  const all = learner ? [lockStmt(child.id), modeGuardStmt(child.id, child.legal_mode), ...stmts] : stmts;
  const out = await tx(all.map(({ ktEvidence: _k, rows: _r, layer: _l, ...x }) => x));
  const res = learner ? out.slice(2) : out;
  const seqs = stmts.map((x, i) => (x.ktEvidence ? res[i]?.[0]?.seq ?? null : undefined)).filter((x) => x !== undefined);
  return { res, seqs };
}

/**
 * Everything textReply() reads, as one string: two plans with the same key get the same reply (the same
 * prompt, history and guards), so a speculative reply with the real plan's key IS the real reply.
 */
function replyKey(next, kit, r, instructions, said, history) {
  return JSON.stringify([instructions, said, history, next.lastMove, next.hintLevel, next.pendingWhy, next.ctx?.lang,
    next.ctx?.ageBand, next.spoiled ?? [], upcomingItem(next, kit)?.id ?? null, !!r.hold]);
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
const SPEC_OUTCOMES = { item: ["incorrect", "no_evidence", "correct", "partial"], why: ["correct", "incorrect", "partial"], teachback: ["partial", "correct"], none: ["no_evidence"] };
const specFanout = () => {
  const n = Number(process.env.TAXILA_SPECULATE ?? 3);
  return Number.isFinite(n) ? Math.max(0, Math.min(4, Math.floor(n))) : 3;
};

function speculate(state, target, flags, planCtx, { said, historyOf }, { outcomes: only, source = "speculative" } = {}) {
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
          const r = textReply({ instructions: plan.instructions, state: next, kit: planCtx.kit, childText: said, trace, history });
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
async function pickSpeculation(specs, key) {
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
function spoiledBy(teacherText, state, kit, activeItem) {
  const ahead = upcomingItem(state, kit);
  if (!ahead || ahead.id === activeItem?.id || state.spoiled?.includes(ahead.id)) return null;
  return revealsAnswer(teacherText, ahead) ? ahead.id : null;
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
  const already = (row) => send(res, 200, { summary: row?.summary ?? null, parentNote: row?.parent_note ?? null, alreadyEnded: true });
  if (lesson.ended_at) return already(lesson);
  // Claim the lesson BEFORE the slow summary: of two overlapping ends (a double tap, a retry on timeout) only
  // one gets the row back; the other writes nothing (sessions were once counted twice, memories duplicated).
  // The claim also closes the lesson to turns, so the facts below are final.
  const claimed = await one(`update lesson set ended_at = now(), state = jsonb_set(state, '{phase}', '"done"')
    where id = $1 and ended_at is null returning state`, [lesson.id]);
  if (!claimed) return already(await one("select summary, parent_note from lesson where id = $1", [lesson.id]));
  const state = claimed.state;
  // The last why / teach-back of the lesson is still held (its verdict lands "on the next turn", and there is none):
  // wait for the blind grader while the summary is written, then fold and store it like a turn would.
  const heldP = flushHeld(child, lesson, state).catch((e) => console.warn("[lesson] end: held evidence not stored:", e.message));
  const [turns, evidence, memoryOk, profileOk, kit] = await Promise.all([
    q("select id, seq, speaker, text from turn where lesson_id = $1 order by seq", [lesson.id]),
    q("select skill_id, item_id, probe, outcome, misconception_id, hints_used from evidence where lesson_id = $1 order by at", [lesson.id]),
    hasConsent(guardian.id, child.id, "memory"), hasConsent(guardian.id, child.id, "learning_profile"),
    state.kitHash ? pinnedKit(lesson.topic_id, state.kitHash) : getKit(lesson.topic_id, { generate: false }),
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

  // The writer's view of this child: its mode plus the memory consent (P3, personal details).
  const writerChild = { ...child, consent: { ...(child.consent ?? {}), P3: !!memoryOk } };
  const saved = [];
  for (const m of memories.slice(0, 3)) {
    const t = citedTurn(m, childTurns);
    if (!t || SENSITIVE.test(m.text) || hasAbilityLabel(m.text) || words(m.text) > 14 || !MEMORY_KINDS.includes(m.kind)) continue;
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
  const results = await tx(writes);
  if (results.some((rows) => rows.length !== 1)) throw new Error("lesson end: a write did not land");
  await heldP;
  const relAt = canWrite(child, "kt") ? 1 : -1;
  send(res, 200, { summary, parentNote, memoriesSaved: writes.filter((w) => /insert into memory/.test(w.text)).length, sessions: relAt > 0 ? results[relAt][0].sessions : null, ...(debugFor(req) ? { debug: { facts, timings: trace } } : {}) });
}

/**
 * Fold and store the lesson's still-held events (lesson end). Waits up to END_GRADE_WAIT_MS for their blind verdicts;
 * without one an event lands with the classifier's outcome and spanOk:false (K only, E6).
 */
const END_GRADE_WAIT_MS = 6000;
async function flushHeld(child, lesson, state) {
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

export const routes = {
  "POST /api/lesson/start": start,
  "POST /api/realtime/token": realtimeToken,
  "POST /api/lesson/turn": turn,
  "POST /api/lesson/end": end,
};

const KEY_PARTS = ["instructions", "said", "history", "lastMove", "hintLevel", "pendingWhy", "lang", "ageBand", "spoiled", "upcoming", "hold"];
/** Debug only: which reply input differed for each speculative plan ("unavailable": its reply failed). */
async function missReason(specs, key) {
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

/** Internals for tests (the turn's planning and speculation, which need no database or model). */
export const __test = { planTurn, replyKey, speculate, specFanout, textReply };
