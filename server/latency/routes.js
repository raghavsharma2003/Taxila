// POST /api/lesson/turn-prefetch (round 2, stream latency): the device's stable partial transcript, sent the moment the
// child has gone quiet and the transcription deltas stopped changing, BEFORE the final transcript exists. The server starts
// the turn's perceive stage on it (classify ∥ the UNDERSTAND note ∥ the speculative replies; server/latency/perceive.js) and
// warms the speech socket. Nothing is stored, graded, committed or spoken here: the /turn that follows adopts the work only
// when its inputs are byte-identical (perceive.js rule 1), else it runs its own.
//
// The same gates as the turn, in the same order (loadTurnContext: auth, the child's guardian, core_tutoring consent): with
// consent withdrawn the words never reach a model. An ended lesson, a typed lane, an empty text, or a rate-limited lesson
// is a 204 and nothing runs. Always fire-and-forget for the client: any failure is a 204, never an error the child sees.
import { loadTurnContext, planTurn, replyKey, speculate, carriedFrom, earlierExchanges } from "../brain/turn.js";
import { textReply, scrubbed } from "../brain/say.js";
import { kitFor, stageTurns, childTurnRow, turnLane } from "../brain/rows.js";
import { classify, classifyFast, targetFor } from "../director/classify.js";
import { noteModuleEvents, moduleAnswerOf } from "../director/modules.js";
import { findItem, promptFor, norm as normAnswer } from "../director/items.js";
import { understand } from "../conversation/understand.js";
import { conv2Mode } from "../conversation/flags.js";
import { loadLive } from "../learner/live.js";
import { perceive, fingerprint, putPrefetch, allowPrefetch } from "./perceive.js";
import { ackOf } from "./ack.js";
import { scanSafety } from "../director/safety.js";

/** SHADOW ack bookkeeping: the lesson turn of the last would-be ack (no-consecutive rule). */
const lastAck = new Map();
/** The longest a wantAck prefetch holds its response for classify (ms). */
export const ACK_WAIT_MS = 3000;

/** TAXILA_TURN_PREFETCH=off turns the route into a no-op (204). Default on. */
export const prefetchOn = (env = process.env) => !/^(off|0|false|no)$/i.test(String(env.TAXILA_TURN_PREFETCH ?? ""));

export const PERCEIVE_DEPS = Object.freeze({ classifyFast, classify, understand, speculate, planTurn, replyKey, textReply, conv2Mode });

const none = (res, why) => { res.statusCode = 204; res.setHeader("x-prefetch", why); res.setHeader("cache-control", "no-store"); res.end(); };

/**
 * Build the turn's perceive inputs for a plain spoken child turn (no chip, no module events, no help, not late, not a lane
 * resume) exactly as server/brain/turn.js lessonTurn builds them, from the same stored state.
 * Exported for the tests (tests/latency-prefetch.test.mjs) and the parity check.
 */
export function prefetchInputs({ lesson, child, kit, text, bargeIn = false, trace = [] }) {
  const state = structuredClone(lesson.state);
  delete state.supersede;
  noteModuleEvents(state, []);
  const activeItem = findItem(state, kit, state.activeItemId);
  const heardRaw = state.recent.findLast((t) => t.who === "teacher")?.text;
  const heard = heardRaw ? scrubbed(heardRaw) : heardRaw;
  stageTurns(state, [childTurnRow({ childText: text, typed: false })]);
  const target = targetFor(state, kit, activeItem);
  const moduleAnswer = moduleAnswerOf(state, []);
  const clsArgs = { target, childText: text, heard, lang: state.ctx?.lang, asrConfidence: undefined, typed: false, chipId: undefined, moduleAnswer, classLevel: child.class_level, trace };
  const planCtx = { kit, child, lesson, activeItem, moduleOnly: false, moduleEvents: [], chipId: undefined, answer: normAnswer(text), leaked: false,
    live: null, carried: carriedFrom(state), childText: text, typed: false, asrConfidence: undefined, bargeIn };
  const noteArgs = { cls: child.class_level, topicTitle: state.ctx?.topicTitle, phase: state.phase, teacherLast: heard ?? "",
    ask: target.mode === "item" && activeItem ? promptFor(activeItem, state.ctx?.lang) : null, key: target.mode === "item" ? target.key ?? null : null,
    earlier: earlierExchanges(state.recent, 2), said: text };
  return { state, activeItem, target, clsArgs, planCtx, noteArgs, said: text, historyOf: (next) => next.recent.slice(0, -1) };
}

async function turnPrefetch(req, res, body) {
  if (!prefetchOn()) return none(res, "off");
  const text = String(body?.text ?? "").slice(0, 2000).trim();
  if (!text) return none(res, "empty");
  const { lesson, child, core } = await loadTurnContext(req, body?.lessonId);
  if (!core) return none(res, "consent");
  if (lesson.ended_at) return none(res, "ended");
  const { textLane, typed } = turnLane(lesson.state?.mode, {});
  if (!textLane || typed) return none(res, "lane");
  if (!allowPrefetch(lesson.id)) return none(res, "rate");
  const kit = await kitFor(lesson.topic_id, lesson.state);
  const trace = [];
  const bargeIn = !!body?.teacherInterrupted;
  const x = prefetchInputs({ lesson, child, kit, text, bargeIn, trace });
  const live = loadLive(child);
  live.catch(() => {});
  x.planCtx.live = live;
  const P = perceive(PERCEIVE_DEPS, { ...x, classified: true, textLane, late: false, help: null, childText: text });
  putPrefetch(lesson.id, { fp: fingerprint({ lessonId: lesson.id, state: lesson.state, clsArgs: x.clsArgs, bargeIn }), P, trace, text: text.length });
  // the reply will need the speech socket within ~1-2 s: open it now if this replica has none (no-op when warm or not DragonHD)
  import("../voice/azureTtsWs.js").then((m) => m.prewarmDhdWs?.()).catch(() => {});
  // SHADOW ack (server/latency/ack.js): with { wantAck: true } the response waits for classify (its model distress read) and
  // says whether a verdict-neutral echo of the child's answer would have been spoken, and when. Nothing is played.
  let ack;
  if (body?.wantAck === true) {
    const t0 = performance.now();
    const cls = await Promise.race([P.clsP.catch(() => null), new Promise((r) => setTimeout(() => r(null), ACK_WAIT_MS))]);
    const turn = (lesson.state?.turn ?? 0) + 1;
    const vocab = x.activeItem ? [x.activeItem.answer, ...(x.activeItem.acceptable ?? [])].filter((v) => v != null).map(String) : [];
    const a = ackOf({ text, cls, predicateDistress: scanSafety(text).distress, safeguardOpen: !!lesson.state?.safeguard, turn,
      lastAckTurn: lastAck.get(lesson.id) ?? null, names: [child.first_name].filter(Boolean), vocab });
    if (a.token) { lastAck.set(lesson.id, turn); if (lastAck.size > 5000) lastAck.delete(lastAck.keys().next().value); }
    ack = { ...a, waitedMs: Math.round(performance.now() - t0), shadow: true };
  }
  res.statusCode = 202;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify({ prefetched: true, ...(ack ? { ack } : {}) }));
}

export const routes = {
  "POST /api/lesson/turn-prefetch": async (req, res, body) => {
    try { await turnPrefetch(req, res, body); }
    catch (e) { if (!res.headersSent) none(res, e?.status === 401 || e?.status === 403 ? "auth" : "error"); }
  },
};
