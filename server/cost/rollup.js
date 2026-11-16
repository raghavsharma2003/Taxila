// Round 7, stream G (platform-cost-ledger): a lesson's cost from its flight-recorder spend events (sid = the lesson id;
// server/trace/context.js), into lesson.cost (migration 040). Calls made outside the lesson's requests (the worker,
// nightly jobs) carry no lesson sid and are not attributed here; scripts/cost.mjs --day counts them.
import { PRICE_BOOK_VERSION, usdChat, usdStt } from "./prices.js";

export const SPEND_KINDS = ["model.call", "speech.tts", "stt.session", "d5.session", "image.call"];
const METER = { "model.call": "chat", "speech.tts": "tts", "stt.session": "stt", "d5.session": "s2s", "image.call": "image" };
const r8 = (x) => Math.round(x * 1e8) / 1e8;

/**
 * PURE. rows = [{ kind, src, data }] (trace_event); minutes = the lesson's length (null when unknown).
 * A model.call recorded before the ledger (no data.usd) is priced from its tokens; an event with no usd and nothing to
 * price it from counts in `unpriced`.
 * @param {{ kind: string, data: any }[]} rows @param {{ minutes?: number|null, now?: () => string }} [o]
 */
export function lessonCost(rows, { minutes = null, now = () => new Date().toISOString() } = {}) {
  const meters = { chat: { usd: 0, calls: 0 }, tts: { usd: 0, chars: 0 }, stt: { usd: 0, sec: 0 }, s2s: { usd: 0, sec: 0 }, image: { usd: 0, n: 0 } };
  const lanes = {};
  let unpriced = 0;
  for (const { kind, src, data: d = {} } of rows ?? []) {
    const m = METER[kind];
    if (!m) continue;
    // the client's own d5.session is its view of the socket, not spend: only the server's relay meter counts (PLAT-46)
    if (kind === "d5.session" && src === "client") continue;
    // a refused or failed call is not spend: an image or speech call that answered non-2xx (PLAT-47)
    if (d.status != null && /^\d+$/.test(String(d.status)) && !(+d.status >= 200 && +d.status < 300)) continue;
    let usd = Number.isFinite(d.usd) ? d.usd : null;
    if (usd == null && kind === "model.call" && d.tokens) usd = usdChat(d.deployment, d.tokens);
    // STT runs browser ↔ Azure (D4 WebRTC): the CLIENT reports the session's seconds through the trace batch, so its
    // spend is always priced here from { model, sec } (capped at 4 h), never from a usd the client sent
    let sec = d.sec || 0;
    if (kind === "stt.session") { sec = Math.min(Math.max(0, Number(d.sec) || 0), 4 * 3600); usd = usdStt(d.model, sec); }
    if (usd == null) { unpriced++; continue; }
    const t = meters[m];
    t.usd += usd;
    if (m === "chat") t.calls++;
    else if (m === "tts") t.chars += d.chars || 0;
    else if (m === "image") t.n += d.n || 1;
    else t.sec += sec;
    const lane = kind === "model.call" ? d.lane || "-" : m;
    lanes[lane] = (lanes[lane] || 0) + usd;
  }
  for (const t of Object.values(meters)) { t.usd = r8(t.usd); if ("sec" in t) t.sec = Math.round(t.sec * 10) / 10; }
  for (const k of Object.keys(lanes)) lanes[k] = r8(lanes[k]);
  const usd = r8(Object.values(meters).reduce((s, t) => s + t.usd, 0));
  const mins = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 10) / 10 : null;
  return { v: 1, priceBook: PRICE_BOOK_VERSION, usd, minutes: mins, usdPerMin: mins ? r8(usd / mins) : null, meters, lanes, unpriced, at: now() };
}

/**
 * Roll one lesson up and store it in lesson.cost. `q` = server/db.js q (injected so scripts and tests choose the database).
 * Returns the cost object; `write: false` computes only.
 * @param {(text: string, params?: any[]) => Promise<any[]>} q @param {string} lessonId @param {{ write?: boolean }} [o]
 */
export async function rollupLesson(q, lessonId, { write = true } = {}) {
  const [l] = await q("select started_at, ended_at from lesson where id = $1", [lessonId]);
  if (!l) throw new Error(`no lesson ${lessonId}`);
  const rows = await q("select kind, src, data from trace_event where sid = $1 and kind = any($2)", [lessonId, SPEND_KINDS]);
  const end = l.ended_at ? Date.parse(l.ended_at) : null;
  const cost = lessonCost(rows, { minutes: end ? (end - Date.parse(l.started_at)) / 60_000 : null });
  if (write) await q("update lesson set cost = $2 where id = $1", [lessonId, JSON.stringify(cost)]);
  return cost;
}
