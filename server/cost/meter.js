// Round 7, stream G (platform-cost-ledger): the spend events for meters that are not chat tokens. One call at the place
// the spend happens; each records a flight-recorder event carrying its own usd (server/cost/prices.js), and
// server/cost/rollup.js sums a lesson's events into lesson.cost. Never throws, never awaits (like every recorder).
//   speech.tts    { engine, chars, usd }   (server/azure.js tts() records this itself; Azure Speech voices call ttsSpent)
//   stt.session   { model, sec, usd }      one per closed STT socket / session
//   d5.session    { sec, usd }             one per closed D5 speech-to-speech relay (sid = the lesson, when the caller names it)
//   image.call    { deployment, n, usd }   one per generated image request
import { record } from "../trace/writer.js";
import { usdImage, usdS2s, usdStt, usdTts } from "./prices.js";

const safe = (f) => (...a) => { try { f(...a); } catch { /* a meter never breaks the lesson */ } };
const num = (x) => (Number.isFinite(+x) && +x > 0 ? +x : 0);

export const ttsSpent = safe(({ engine, chars, ms, status } = {}) => record("speech.tts", { engine: String(engine ?? ""), chars: num(chars), usd: usdTts(engine, num(chars)), ...(ms != null ? { ms } : {}), ...(status != null ? { status } : {}) }));
export const sttSession = safe(({ model, sec } = {}) => record("stt.session", { model: String(model ?? ""), sec: +num(sec).toFixed(1), usd: usdStt(model, num(sec)) }));
/**
 * The D5 relay runs outside any request's trace store, so the lesson, child and guardian come from the caller (PLAT-35:
 * with none the event landed under sid "server" and the lesson's rollup never saw it). The call site passes them (voice).
 */
export const d5Session = safe(({ sec, reason, lessonId, childId, guardianId } = {}) => record("d5.session",
  { sec: +num(sec).toFixed(1), usd: usdS2s(num(sec)), ...(reason ? { reason: String(reason).slice(0, 40) } : {}) },
  { ...(lessonId ? { sid: String(lessonId) } : {}), ...(childId ? { cid: childId } : {}), ...(guardianId ? { gid: guardianId } : {}) }));
export const imageCall = safe(({ deployment, n = 1, status } = {}) => record("image.call", { deployment: String(deployment ?? ""), n: num(n), usd: usdImage(deployment, num(n)), ...(status != null ? { status } : {}) }));
