// POST /api/lesson/turn-prefetch (round 2, stream latency): the device's stable partial transcript, sent the moment the
// child has gone quiet and the transcription deltas stopped changing, BEFORE the final transcript exists. The server starts
// the turn's perceive stage on it (classify ∥ the UNDERSTAND note ∥ the speculative replies; server/latency/perceive.js) and
// warms the speech socket. Nothing is stored, graded, committed or spoken here: the /turn that follows adopts the work only
// when its inputs are byte-identical (perceive.js rule 1), else it runs its own.
//
// The same gates as the turn, in the same order (loadTurnContext: auth, the child's guardian, core_tutoring consent): with
// consent withdrawn the words never reach a model. An ended lesson, a typed lane, an empty text, or a rate-limited lesson
// is a 204 and nothing runs. Always fire-and-forget for the client: any failure is a 204, never an error the child sees.
import { loadTurnContext, specPlan, replyKey, speculate, carriedFrom, earlierExchanges, NOTE_WAIT_MS } from "../brain/turn.js";
import { textReply, scrubbed } from "../brain/say.js";
import { kitFor, stageTurns, childTurnRow, turnLane } from "../brain/rows.js";
import { classify, classifyFast, targetFor } from "../director/classify.js";
import { noteModuleEvents, moduleAnswerOf } from "../director/modules.js";
import { findItem, promptFor, norm as normAnswer } from "../director/items.js";
import { understand } from "../conversation/understand.js";
import { conv2Mode, p5Flag } from "../conversation/flags.js";
import { applyNote, withAnswerMods } from "../conversation/policy.js";
import { loadLive } from "../learner/live.js";
import { perceive, fingerprint, putPrefetch, allowPrefetch, exactSpecOn } from "./perceive.js";
import { ackOf, ackPlanOf, answerTokenOf, ackPhraseOf, ACK_FLOOR_MS, ACK_AT_MS } from "./ack.js";
import { scanSafety } from "../director/safety.js";
// round 3 (relational-human): the perception bus (the turn and the prefetch say "classify is running on these words") and
// the played acknowledgement (POST /api/lesson/turn-ack below)
import { publishPerception, awaitPerception, perceptionsFor } from "./bus.js";
import { ackAudio, pcmMs } from "./ackAudio.js";
import { preludeTokenOk } from "../voice/expressive/prelude.js";
import { styleForChild } from "../routes/voice.js";
import { PCM_RATE } from "../voice/speech.js";

/** SHADOW ack bookkeeping: the lesson turn of the last would-be ack (no-consecutive rule). */
const lastAck = new Map();
/** The longest a wantAck prefetch holds its response for classify (ms). */
export const ACK_WAIT_MS = 3000;

/** TAXILA_TURN_PREFETCH=off turns the route into a no-op (204). Default on. */
export const prefetchOn = (env = process.env) => !/^(off|0|false|no)$/i.test(String(env.TAXILA_TURN_PREFETCH ?? ""));

// r4-latency: specPlan (the speculative plan with the Studio row the real turn adds) and the turn's own classify transforms
// (the note, the answer's own words), so an EXACT reply started here has the key the turn will compute (perceive.js rule 5)
export const PERCEIVE_DEPS = Object.freeze({ classifyFast, classify, understand, speculate, planTurn: specPlan, replyKey, textReply, conv2Mode,
  applyNote, withAnswerMods, steerOn: () => p5Flag("STEER"), noteWaitMs: NOTE_WAIT_MS });

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
  const P = perceive(PERCEIVE_DEPS, { ...x, classified: true, textLane, late: false, help: null, childText: text, exact: exactSpecOn() });
  putPrefetch(lesson.id, { fp: fingerprint({ lessonId: lesson.id, state: lesson.state, clsArgs: x.clsArgs, bargeIn }), P, trace, text: text.length });
  // round 3: the ack route waits on THIS classify (no model call of its own)
  publishPerception(lesson.id, { text, clsP: P.clsP, source: "prefetch", turn: (lesson.state?.turn ?? 0) + 1, specs: P.specs });
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

// ───────────────────────────── POST /api/lesson/turn-ack (round 3, relational-human) ─────────────────────────────
//
// The acknowledgement a teacher gives while she thinks: the child's own answer said back ("chhe faces…"), verdict-neutral,
// played by the device BEFORE the reply is ready (src/latency/ack.ts AckClient). The device asks once it has the child's
// words (the prefetch's stable partial, or the final transcript); this route
//   1. applies the turn's own gates (loadTurnContext: auth, the child's guardian, core_tutoring consent), a cascade lesson
//      that is not ended, the safety predicate on the words (a hit: nothing is synthesised);
//   2. starts the clip at once from the words alone (ackAudio.js: same words → same bytes, right or wrong);
//   3. waits for a perception of EXACTLY these words on the bus (the prefetch's or the turn's classify: never one of its
//      own), then for that classify (its model distress read whenever the floor asks for one), then for ACK_FLOOR_MS from
//      the perception's start (no timing verdict leak);
//   4. decides with ackPlanOf (graded answer, closed-class token, no safety / safeguard / duplex partial-safety, not
//      leaving, the window governor) and answers 200 { ack: { phrase, pcm (base64 s16le mono 24 kHz), ... } } or 204.
// Always fire-and-forget for the device: any failure is a 204, never an error the child sees. TAXILA_ACK=off → 204 off;
// TAXILA_ACK=shadow → the decision without audio (measurement).
export const ackMode = (env = process.env) => {
  const v = String(env.TAXILA_ACK ?? "").toLowerCase();
  return /^(off|0|false|no)$/.test(v) ? "off" : v === "shadow" ? "shadow" : "on";
};
/** How long the route waits for a perception of the words to appear (the turn is sent ~0-0.9 s after the prefetch). */
export const ACK_PERCEPTION_WAIT_MS = 2000;
/** How long it waits for that classify (the model call's p90 is ~0.9 s; its 7 s timeout is the turn's business). */
export const ACK_CLS_WAIT_MS = 3000;
/** How long it waits for the clip once the ack is decided (it was started speculatively, before classify). */
export const ACK_AUDIO_WAIT_MS = 1500;
const ACKS_PER_MIN = 30;
/** lessonId → the turns that got an ack (the governor's history) */
const ackHistory = new Map();
const ackRate = new Map();
function allowAck(lessonId, nowMs = Date.now()) {
  const k = String(lessonId);
  const ts = (ackRate.get(k) ?? []).filter((t) => nowMs - t < 60_000);
  if (ts.length >= ACKS_PER_MIN) { ackRate.set(k, ts); return false; }
  ts.push(nowMs);
  ackRate.set(k, ts);
  if (ackRate.size > 5000) ackRate.delete(ackRate.keys().next().value);
  return true;
}
const sleepMs = (ms) => new Promise((r) => { const t = setTimeout(r, Math.max(0, ms)); t.unref?.(); });

/** The words of the item on the table the phrase may borrow ONE word from (prompt, key, accepted answers). */
function itemWordsOf(item, lang) {
  if (!item) return [];
  return [item.prompt_en, item.prompt_hi, lang === "hindi" ? item.prompt_hi : null, item.answer, ...(item.acceptable ?? [])].filter((v) => v != null).map(String);
}

/**
 * The ack decision for words on a gated lesson (the route's core, injectable for the tests). Resolves
 * { none: reason } | { ack: { kind, token, phrase, decidedMs, source, turn, shadow? }, pcm?: Buffer }.
 * @param {{ awaitPerception: typeof awaitPerception, perceptionsFor: typeof perceptionsFor, ackAudio: typeof ackAudio,
 *   styleOf: (child: any, state: any) => any, now?: () => number, sleep?: (ms: number) => Promise<void>,
 *   history?: Map<string, number[]> }} d
 * @param {{ lessonId: string, text: string, state: any, child: any, item: any, mode: "on" | "shadow" }} x
 */
export async function ackDecision(d, x) {
  const now = d.now ?? Date.now;
  const sleep = d.sleep ?? sleepMs;
  const hist0 = d.history ?? ackHistory;
  const t0 = now();
  const { lessonId, text, state, child, item, mode } = x;
  // the predicate first: words that trip the safety scan are never synthesised, let alone echoed
  if (scanSafety(text).distress) return { none: "safety" };
  const itemWords = itemWordsOf(item, state?.ctx?.lang);
  // the closed class the echo may come from: the item's key and accepted answers, whole and word by word, and the words of
  // its own prompt (kit content, never a child-only word): "edge" for "An edge", "कोना" from the Hindi prompt
  const vocab = item ? [...new Set([item.answer, ...(item.acceptable ?? []), ...itemWords.flatMap((w) => String(w).split(/[^\p{L}\p{M}\p{N}/.]+/u))]
    .filter((v) => v != null && String(v).trim().length >= 2).map(String))] : [];
  const names = [child?.first_name].filter(Boolean);
  const token = answerTokenOf(text);
  if (!token) return { none: "no_token" };
  if (!preludeTokenOk(token, { names, vocab })) return { none: "token_screen" };
  const phrase = ackPhraseOf(text, token, itemWords);
  // the clip starts now, from the words alone (same words → same bytes, whatever the verdict)
  const style = mode === "on" ? d.styleOf(child, state) : null;
  const audioP = style ? d.ackAudio(phrase, style) : Promise.resolve(null);
  const turn = (state?.turn ?? 0) + 1;
  const per = await d.awaitPerception(lessonId, text, ACK_PERCEPTION_WAIT_MS, turn);
  if (!per) return { none: "no_perception" };
  const at = d.ackAtMs !== undefined ? d.ackAtMs : ACK_AT_MS;
  let cls;
  if (at != null) {
    // the FIXED instant: decided exactly at per.at + at, whatever the verdict; classify not settled by then → no ack
    let settled = false;
    const c = Promise.resolve(per.clsP).then((v) => { settled = true; return v; }, () => { settled = true; return null; });
    await sleep(Math.max(0, per.at + at - now()));
    if (!settled) return { none: "late" };
    cls = await c;
  } else {
    cls = await Promise.race([Promise.resolve(per.clsP).catch(() => null), sleep(Math.max(0, ACK_CLS_WAIT_MS - (now() - per.at))).then(() => null)]);
    // the floor: never sooner than ACK_FLOOR_MS after the perception started (a bytes-decided right answer is instant)
    const wait = per.at + ACK_FLOOR_MS - now();
    if (wait > 0) await sleep(wait);
  }
  // a turn's own perception of the same words carries the duplex sticky partial-safety bit (TurnRequest.duplex)
  const same = d.perceptionsFor(lessonId, text, Date.now(), turn);
  const pendingSafety = same.some((e) => e.pendingSafety) || !!per.pendingSafety;
  const filtered = () => !!per.filtered || d.perceptionsFor(lessonId, text, Date.now(), turn).some((e) => e.filtered);
  if (filtered()) return { none: "filtered" };
  const hist = hist0.get(String(lessonId)) ?? [];
  const plan = ackPlanOf({ text, cls, predicateDistress: false, safeguardOpen: !!state?.safeguard, pendingSafety, turn, history: hist, names, vocab, itemWords });
  if (!plan.phrase) return { none: plan.none ?? "refused" };
  if (!hist.includes(turn)) { hist0.set(String(lessonId), [...hist, turn].slice(-12)); if (hist0.size > 5000) hist0.delete(hist0.keys().next().value); }
  const ack = { kind: plan.kind, token: plan.token, phrase: plan.phrase, decidedMs: Math.round(now() - t0), source: per.source, turn };
  if (mode === "shadow") return { ack: { ...ack, shadow: true } };
  const pcm = await Promise.race([Promise.resolve(audioP).catch(() => null), sleep(ACK_AUDIO_WAIT_MS).then(() => null)]);
  if (!pcm) return { none: "no_audio" };
  if (filtered()) return { none: "filtered" };
  return { ack, pcm };
}

const ACK_DEPS = Object.freeze({
  awaitPerception, perceptionsFor, ackAudio,
  styleOf: (child, state) => styleForChild(child, undefined, state?.ctx?.teacherId, state?.ctx?.teacherName, { laneSwitched: !!state?.laneSwitch }),
});

async function turnAck(req, res, body) {
  const t0 = performance.now();
  const mode = ackMode();
  if (mode === "off") return none(res, "off");
  const text = String(body?.text ?? "").slice(0, 2000).trim();
  if (!text) return none(res, "empty");
  const { lesson, child, core } = await loadTurnContext(req, body?.lessonId);
  if (!core) return none(res, "consent");
  if (lesson.ended_at) return none(res, "ended");
  if (lesson.state?.mode !== "cascade") return none(res, "lane");
  if (!allowAck(lesson.id)) return none(res, "rate");
  const kit = await kitFor(lesson.topic_id, lesson.state).catch(() => null);
  const item = kit ? findItem(lesson.state, kit, lesson.state?.activeItemId) : null;
  const r = await ackDecision(ACK_DEPS, { lessonId: lesson.id, text, state: lesson.state, child, item, mode });
  if (r.none) return none(res, r.none);
  if (!r.pcm) return json(res, 200, { ack: r.ack });
  json(res, 200, { ack: { ...r.ack, rate: PCM_RATE, ms: pcmMs(r.pcm), pcm: r.pcm.toString("base64"), readyMs: Math.round(performance.now() - t0) } });
}

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(obj));
}

/** Tests only. */
export const __ack = { clear: () => { ackHistory.clear(); ackRate.clear(); }, history: ackHistory };

export const routes = {
  "POST /api/lesson/turn-prefetch": async (req, res, body) => {
    try { await turnPrefetch(req, res, body); }
    catch (e) { if (!res.headersSent) none(res, e?.status === 401 || e?.status === 403 ? "auth" : "error"); }
  },
  "POST /api/lesson/turn-ack": async (req, res, body) => {
    try { await turnAck(req, res, body); }
    catch (e) { if (!res.headersSent) none(res, e?.status === 401 || e?.status === 403 ? "auth" : "error"); }
  },
};
