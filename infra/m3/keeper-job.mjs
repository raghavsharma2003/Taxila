// Milestone 3 keeper (round 7, M3; docs/design/round7/M3.md): the in-job script of the ACA job `m3-keeper`, cron
// "17 3,15 * * *" UTC, run inline in a stock node:22-slim image (`node --input-type=module -e <this file>`), as
// scripts/region/latency-job.mjs is. It keeps three Cost Management services above $1 every UTC day by spending a capped
// amount that the APIs themselves report:
//   models   Azure OpenAI chat tokens (Foundry Models)      spend = returned usage tokens x price
//   tts      Azure Speech neural TTS over REST (Foundry Tools)  spend = characters synthesised x price
//   storage  Blob "List Blobs" calls (Storage, list class)  spend = successful operations x price
// Today's ledger is the blob m3/ledger/YYYY-MM-DD.json in the storage account (Shared Key, raw REST). The run is
// idempotent: the 15:17 run only tops up what the 03:17 run left. Each batch's worst case is written to the ledger
// BEFORE it runs (pendingUsd), so a crash or a lost write can make a later run spend less, never twice. If the ledger
// cannot be read, the am run spends each lane's target once (recorded in m3/ledger/YYYY-MM-DD.blind.json when it can)
// and exits 0 so no retry repeats it; the pm run skips and exits 1.
// Prints one `M3 {json}` line per lane and `M3-RUN-OK` at the end of a clean run; `M3-ALERT {json}` on a broken ledger.
// Exit 1 when a lane ends short after its fallback, so the job's retry (replicaRetryLimit 2) tops it up.
//
// SELF-CONTAINED: fetch + node:crypto only, no repo imports. The pure section mirrors infra/m3/plan.js and
// tests/m3-plan.test.mjs checks it does (this file only runs its main with M3_ROLE=keeper).
// Never prints a key, a SAS or a URL with credentials: logs carry lane, host, status codes and numbers.
//
// env: M3_ROLE=keeper, M3_UNTIL (YYYY-MM-DD; after it the job does nothing), M3_STORAGE_ACCOUNT, M3_STORAGE_KEY,
// M3_CONTAINER (m3-ledger), M3_{MODELS,TTS,STORAGE}_{TARGET,CAP} (USD), M3_AOAI_{ENDPOINT,KEY,DEPLOYMENT,PRICE_IN,PRICE_CACHED,
// PRICE_OUT}, M3_AOAI_FALLBACK_{ENDPOINT,KEY,DEPLOYMENT,PRICE_IN,PRICE_CACHED,PRICE_OUT} (optional; endpoint and key
// default to the primary's), M3_AOAI_MAX_TOKENS (6000), M3_AOAI_CONCURRENCY (6), M3_SPEECH_{REGION,KEY},
// M3_SPEECH_FALLBACK_{REGION,KEY}, M3_TTS_PRICE_PER_MCHARS (15), M3_TTS_VOICE_HI, M3_TTS_VOICE_EN, M3_TTS_CONCURRENCY (4),
// M3_STORAGE_OP_USD (0.000005), M3_STORAGE_CONCURRENCY (48), M3_STORAGE_BATCH (5000), M3_LANES (models,tts,storage),
// M3_BACKOFF_MS (5000), M3_RUN_MAX_MIN (150: no new batch after this many minutes; the job's replicaTimeout is 180).
import { createHmac } from "node:crypto";

// ───────────────────────────── pure (mirrors infra/m3/plan.js) ─────────────────────────────

const r4 = (x) => Math.round(x * 1e4) / 1e4;
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
export function laneSpent(ledger, id) {
  const l = ledger?.lanes?.[id];
  if (!l) return 0;
  return r4(Math.max(0, num(l.usd)) + Math.max(0, num(l.pendingUsd)) + Math.max(0, num(l.blindUsd)));
}
export function mergeBlind(ledger, blind) {
  const out = JSON.parse(JSON.stringify(ledger || { v: 1, lanes: {}, runs: [] }));
  out.lanes ||= {};
  for (const [id, l] of Object.entries(blind?.lanes || {})) (out.lanes[id] ||= { usd: 0, pendingUsd: 0 }).blindUsd = r4(num(l.usd) + num(l.pendingUsd));
  return out;
}
export function unitsToBuy(ledger, lane, { date, until }) {
  if (!date || !until || date > until) return 0;
  if (!(lane.unitUsd > 0)) return 0;
  const spent = laneSpent(ledger, lane.id);
  if (spent >= lane.targetUsd - 1e-9) return 0;
  const want = Math.ceil((lane.targetUsd - spent) / lane.unitUsd - 1e-9);
  const room = Math.floor((lane.capUsd - spent) / (lane.maxUnitUsd ?? lane.unitUsd) + 1e-9);
  return Math.max(0, Math.min(want, room));
}
export const slotOf = (d) => (new Date(d).getUTCHours() < 12 ? "am" : "pm");
export function runMode(state, slot) {
  if (state === "ok" || state === "absent") return "topup";
  return slot === "am" ? "blind" : "skip";
}
export function chatUsd(u, p) {
  const cached = Math.max(0, num(u?.cached));
  return Math.round(((Math.max(0, num(u?.in) - cached) * p.in + cached * p.cached + Math.max(0, num(u?.out)) * p.out) / 1e6) * 1e8) / 1e8;
}
export function sharedKeyStringToSign({ method, account, path, query = {}, headers = {} }) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()]));
  const len = h["content-length"] && h["content-length"] !== "0" ? h["content-length"] : "";
  const std = [method.toUpperCase(), h["content-encoding"] || "", h["content-language"] || "", len, h["content-md5"] || "", h["content-type"] || "",
    h.date || "", h["if-modified-since"] || "", h["if-match"] || "", h["if-none-match"] || "", h["if-unmodified-since"] || "", h.range || ""];
  const xms = Object.keys(h).filter((k) => k.startsWith("x-ms-")).sort().map((k) => `${k}:${h[k]}\n`).join("");
  const q = Object.keys(query).map((k) => [k.toLowerCase(), String(query[k])]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `\n${k}:${v}`).join("");
  return `${std.join("\n")}\n${xms}/${account}${path}${q}`;
}

/** Fixed, harmless prompts (rotated by day); the output is discarded. */
export const SYSTEM = "You write calm, plain descriptive prose for a general reader. No lists, no headings, no dialogue.";
export const PROMPTS = Object.freeze([
  "Describe an ordinary day at a small railway station in the hills, from the first train before dawn to the last one at night, in about 3,000 words.",
  "Describe a village library during the monsoon, from opening time to closing time, in about 3,000 words.",
  "Describe a vegetable market in a small town from dawn until noon, in about 3,000 words.",
  "Describe one quiet night at a lighthouse on a calm coast, hour by hour, in about 3,000 words.",
]);
/** Fixed TTS paragraphs, Hindi and English, rotated by day and request. Billed characters >= the text's length. */
export const PARAGRAPHS = Object.freeze([
  { lang: "en-IN", text: "The monsoon reached the village on a Tuesday. By evening the lanes were full of small streams, and the children walked to the library with their slippers in their hands. The librarian, who had kept the same register for thirty years, wrote each name slowly and handed out books wrapped in newspaper so the pages would stay dry. On the long table near the window someone had left a jar of tamarind sweets and a note that said one each, please. Outside, the rain kept a steady rhythm on the tin roof. Inside, there was only the sound of pages turning, a ceiling fan that clicked once on every turn, and a sparrow that had decided the top shelf was the best place to wait for the clouds to pass. When the lights flickered, nobody looked up. Everyone knew the way home, rain or no rain." },
  { lang: "hi-IN", text: "सुबह होते ही सब्ज़ी मंडी में चहल-पहल शुरू हो जाती है। टोकरियों में ताज़े टमाटर, हरी मिर्च, भिंडी और पालक सजाए जाते हैं। एक बूढ़ी अम्मा हर रोज़ एक ही कोने में बैठती हैं और सबसे पहले अपने ग्राहकों को मुस्कान देती हैं, फिर तराज़ू उठाती हैं। पास की चाय की दुकान से अदरक की ख़ुशबू आती है, और साइकिल पर दूध वाले भैया घंटी बजाते हुए निकल जाते हैं। धूप चढ़ने के साथ भीड़ बढ़ती है, मोल-भाव की आवाज़ें तेज़ होती हैं, और बच्चे अपने माता-पिता का हाथ पकड़कर रंग-बिरंगे फलों को देखते रहते हैं। दोपहर तक मंडी धीरे-धीरे शांत हो जाती है, ख़ाली टोकरियाँ एक के ऊपर एक रख दी जाती हैं, और अगले दिन फिर वही रौनक लौट आती है।" },
  { lang: "en-IN", text: "The last train of the day leaves the hill station a little after nine. The stationmaster walks the length of the platform with a lantern, although the lamps have been electric for years, because his father did the same and the habit stayed. A tea seller packs away his glasses one by one and wipes the counter twice. Two porters sit on a bench and talk about the weather in the plains, which neither of them has visited this year. The signal turns green, the guard waves a flag, and the carriages begin to move so slowly that a dog trots beside them for a while before giving up. Then the platform is quiet. Mist comes down from the pines, the clock above the booking window ticks towards ten, and the whole station seems to settle in for the night." },
  { lang: "hi-IN", text: "नदी के किनारे एक छोटी-सी नाव बँधी रहती है। सुबह-सुबह मल्लाह काका उसे खोलते हैं और गाँव के लोगों को उस पार ले जाते हैं। कोई बाज़ार जाता है, कोई स्कूल, और कोई बस अपने रिश्तेदारों से मिलने। नाव धीरे-धीरे पानी पर सरकती है, चप्पू की आवाज़ के साथ लहरें किनारे तक पहुँचती हैं। बरसात के दिनों में नदी चौड़ी हो जाती है और काका और भी सावधानी से नाव चलाते हैं। शाम को जब सूरज ढलता है, तो पानी सुनहरा दिखने लगता है, पक्षी पेड़ों की ओर लौटते हैं, और आख़िरी सवारी उतारकर काका नाव को फिर से उसी पेड़ से बाँध देते हैं।" },
]);
export const dayIndex = (date) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
export const charsOf = (s) => [...s].length;
const xml = (s) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
/** Error text without anything that could be a credential (query strings, long base64/hex runs). */
export const scrub = (s) => String(s ?? "").replace(/\?[^\s"']*/g, "?…").replace(/[A-Za-z0-9+/=_-]{32,}/g, "…").slice(0, 160);

// ───────────────────────────── io ─────────────────────────────

const E = process.env;
const n = (k, d) => (E[k] !== undefined && E[k] !== "" && Number.isFinite(Number(E[k])) ? Number(E[k]) : d);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BACKOFF = n("M3_BACKOFF_MS", 5000);
const SA = E.M3_STORAGE_ACCOUNT, CONTAINER = E.M3_CONTAINER || "m3-ledger", XV = "2023-11-03";

function blob(method, name, { body = null, headers = {}, query = {} } = {}) {
  const path = `/${CONTAINER}${name ? "/" + name : ""}`;
  const buf = body == null ? null : Buffer.from(body);
  const h = { "x-ms-date": new Date().toUTCString(), "x-ms-version": XV, ...headers };
  const sts = sharedKeyStringToSign({ method, account: SA, path, query, headers: { ...h, ...(buf ? { "content-length": String(buf.length) } : {}) } });
  h.authorization = `SharedKey ${SA}:${createHmac("sha256", Buffer.from(E.M3_STORAGE_KEY || "", "base64")).update(sts, "utf8").digest("base64")}`;
  const qs = new URLSearchParams(query).toString();
  return fetch(`https://${SA}.blob.core.windows.net${path}${qs ? "?" + qs : ""}`, { method, headers: h, body: buf, signal: AbortSignal.timeout(30_000) });
}
/** → { state: ok|absent|broken, json, etag, err } */
async function readJson(name, date) {
  try {
    const r = await blob("GET", name);
    const text = await r.text();
    if (r.status === 404) return { state: "absent" };
    if (!r.ok) return { state: "broken", err: `http ${r.status}` };
    let json;
    try { json = JSON.parse(text); } catch { return { state: "broken", err: "unparseable" }; }
    if (!json || typeof json !== "object" || json.date !== date) return { state: "broken", err: "not today's ledger" };
    return { state: "ok", json, etag: r.headers.get("etag") };
  } catch (e) { return { state: "broken", err: scrub(e.message) }; }
}
/** Conditional write: If-Match the etag we hold, or If-None-Match * to create. → { ok, etag, status } */
async function writeJson(name, obj, { etag = null, create = false } = {}) {
  try {
    const r = await blob("PUT", name, { body: JSON.stringify(obj), headers: { "content-type": "application/json", "x-ms-blob-type": "BlockBlob",
      ...(etag ? { "if-match": etag } : create ? { "if-none-match": "*" } : {}) } });
    await r.arrayBuffer().catch(() => {});
    return { ok: r.ok, etag: r.headers.get("etag"), status: r.status };
  } catch (e) { return { ok: false, status: 0, err: scrub(e.message) }; }
}

/** Run `k` tasks with at most `c` in flight. */
async function pool(k, c, fn) {
  let next = 0;
  const out = [];
  await Promise.all(Array.from({ length: Math.max(0, Math.min(c, k)) }, async () => { while (next < k) { const i = next++; out[i] = await fn(i); } }));
  return out;
}

// models: one chat call, retried on 429 / 5xx up to 3 times (a failed call reports no usage and bills nothing)
const MAXTOK = n("M3_AOAI_MAX_TOKENS", 6000), PROMPT_BOUND = 300;
async function chatOnce(ep, date, i) {
  for (let attempt = 0; ; attempt++) {
    let status = 0, code = "";
    try {
      const r = await fetch(`${ep.endpoint.replace(/\/+$/, "")}/chat/completions`, { method: "POST", headers: { "api-key": ep.key, "content-type": "application/json" },
        body: JSON.stringify({ model: ep.deployment, max_completion_tokens: MAXTOK,
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: PROMPTS[(dayIndex(date) + i) % PROMPTS.length] }] }),
        signal: AbortSignal.timeout(240_000) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const u = j.usage || {};
        const t = { in: num(u.prompt_tokens), cached: num(u.prompt_tokens_details?.cached_tokens), out: num(u.completion_tokens) };
        return { ok: true, usd: chatUsd(t, ep.price), units: t };
      }
      status = r.status; code = String(j?.error?.code || "");
      if (!(status === 429 || status >= 500) || attempt >= 3) return { ok: false, err: `http ${status} ${code}`.trim() };
      const ra = Number(r.headers.get("retry-after-ms")) || Number(r.headers.get("retry-after")) * 1000 || BACKOFF * (attempt + 1);
      await sleep(Math.min(60_000, ra));
    } catch (e) {
      if (attempt >= 3) return { ok: false, err: scrub(e.message) };
      await sleep(BACKOFF * (attempt + 1));
    }
  }
}
// tts: one synthesis; the audio is read and discarded
async function ttsOnce(ep, date, i) {
  const p = PARAGRAPHS[(dayIndex(date) + i) % PARAGRAPHS.length];
  const voice = p.lang === "hi-IN" ? E.M3_TTS_VOICE_HI || "hi-IN-SwaraNeural" : E.M3_TTS_VOICE_EN || "en-IN-NeerjaNeural";
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${p.lang}"><voice name="${voice}">${xml(p.text)}</voice></speak>`;
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(`https://${ep.region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
        headers: { "Ocp-Apim-Subscription-Key": ep.key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3", "User-Agent": "taxila-m3" },
        body: ssml, signal: AbortSignal.timeout(120_000) });
      const audio = await r.arrayBuffer().catch(() => new ArrayBuffer(0));
      if (r.ok && audio.byteLength > 0) { const chars = charsOf(p.text); return { ok: true, usd: (chars * ep.pricePerMChars) / 1e6, units: { chars, requests: 1 } }; }
      if (!(r.status === 429 || r.status >= 500) || attempt >= 3) return { ok: false, err: `http ${r.status}` };
      await sleep(Math.min(60_000, Number(r.headers.get("retry-after")) * 1000 || BACKOFF * (attempt + 1)));
    } catch (e) {
      if (attempt >= 3) return { ok: false, err: scrub(e.message) };
      await sleep(BACKOFF * (attempt + 1));
    }
  }
}
// storage: one List Blobs call on an empty prefix (billed in the "List and create container" class)
const LISTQ = { comp: "list", maxresults: "1", prefix: "ops/none/", restype: "container" };
async function listOnce(ep) {
  try {
    const r = await blob("GET", "", { query: LISTQ });
    await r.arrayBuffer().catch(() => {});
    return r.ok ? { ok: true, usd: ep.opUsd, units: { ops: 1 } } : { ok: false, err: `http ${r.status}` };
  } catch (e) { return { ok: false, err: scrub(e.message) }; }
}

const avgChars = PARAGRAPHS.reduce((s, p) => s + charsOf(p.text), 0) / PARAGRAPHS.length;
const maxChars = Math.max(...PARAGRAPHS.map((p) => charsOf(p.text)));
function lanes() {
  const priceOf = (pre) => ({ in: n(`${pre}_PRICE_IN`, NaN), cached: n(`${pre}_PRICE_CACHED`, NaN), out: n(`${pre}_PRICE_OUT`, NaN) });
  const aoai = [{ name: "primary", endpoint: E.M3_AOAI_ENDPOINT, key: E.M3_AOAI_KEY, deployment: E.M3_AOAI_DEPLOYMENT, price: priceOf("M3_AOAI") }];
  if (E.M3_AOAI_FALLBACK_DEPLOYMENT) aoai.push({ name: "fallback", endpoint: E.M3_AOAI_FALLBACK_ENDPOINT || E.M3_AOAI_ENDPOINT, key: E.M3_AOAI_FALLBACK_KEY || E.M3_AOAI_KEY,
    deployment: E.M3_AOAI_FALLBACK_DEPLOYMENT, price: priceOf("M3_AOAI_FALLBACK") });
  const ttsPrice = n("M3_TTS_PRICE_PER_MCHARS", 15);
  const speech = [{ name: "primary", region: E.M3_SPEECH_REGION, key: E.M3_SPEECH_KEY, pricePerMChars: ttsPrice }];
  if (E.M3_SPEECH_FALLBACK_REGION && E.M3_SPEECH_FALLBACK_KEY) speech.push({ name: "fallback", region: E.M3_SPEECH_FALLBACK_REGION, key: E.M3_SPEECH_FALLBACK_KEY, pricePerMChars: ttsPrice });
  const opUsd = n("M3_STORAGE_OP_USD", 0.000005);
  const chatMax = (ep) => (PROMPT_BOUND * ep.price.in + MAXTOK * ep.price.out) / 1e6;
  return {
    models: { endpoints: aoai, ready: (ep) => !!(ep.endpoint && ep.key && ep.deployment) && [ep.price.in, ep.price.cached, ep.price.out].every((x) => x >= 0),
      unitUsd: (ep, L) => (L.calls > 0 && L.usd > 0 ? L.usd / L.calls : chatMax(ep) / 2), maxUnitUsd: chatMax, batch: () => n("M3_AOAI_CONCURRENCY", 6),
      conc: () => n("M3_AOAI_CONCURRENCY", 6), once: chatOnce },
    tts: { endpoints: speech, ready: (ep) => !!(ep.region && ep.key) && ep.pricePerMChars > 0,
      unitUsd: (ep) => (avgChars * ep.pricePerMChars) / 1e6, maxUnitUsd: (ep) => (maxChars * ep.pricePerMChars) / 1e6, batch: () => n("M3_TTS_CONCURRENCY", 4) * 2,
      conc: () => n("M3_TTS_CONCURRENCY", 4), once: ttsOnce },
    storage: { endpoints: [{ name: "primary", opUsd, conc: n("M3_STORAGE_CONCURRENCY", 48) }, { name: "slow", opUsd, conc: 4 }], ready: () => !!(SA && E.M3_STORAGE_KEY) && opUsd > 0,
      unitUsd: (ep) => ep.opUsd, maxUnitUsd: (ep) => ep.opUsd, batch: () => n("M3_STORAGE_BATCH", 5000), conc: (ep) => ep.conc, once: (ep) => listOnce(ep) },
  };
}

async function runLane(ctx, id, spec) {
  const target = n(`M3_${id.toUpperCase()}_TARGET`, NaN), cap = n(`M3_${id.toUpperCase()}_CAP`, NaN);
  const L = (ctx.ledger.lanes[id] ||= { usd: 0, pendingUsd: 0, calls: 0, units: {}, via: {} });
  L.units ||= {}; L.via ||= {}; L.calls = num(L.calls);
  const before = laneSpent(ctx.ledger, id);
  let err = null, which = 0, fails = 0;
  if (!(target > 0 && cap >= target)) err = `bad target/cap ${target}/${cap}`;
  const eps = spec.endpoints.filter((ep) => spec.ready(ep));
  if (!err && !eps.length) err = "not configured";
  const setupErr = !!err;
  // `err` keeps the last failure for the M3 line; fatal conditions break out, a failed batch counts towards the fallback
  while (!setupErr && which < eps.length) {
    if (Date.now() > ctx.deadline) { err = "run time limit (M3_RUN_MAX_MIN)"; break; }
    const ep = eps[which];
    const want = unitsToBuy(ctx.ledger, { id, targetUsd: target, capUsd: cap, unitUsd: spec.unitUsd(ep, L), maxUnitUsd: spec.maxUnitUsd(ep) }, ctx);
    if (want === 0) break;
    const k = Math.min(want, spec.batch(ep));
    L.pendingUsd = r4(k * spec.maxUnitUsd(ep) + 1e-4);
    if (!(await ctx.save())) { L.pendingUsd = 0; err = "ledger write failed before a batch"; break; }
    const res = await pool(k, spec.conc(ep), (i) => spec.once(ep, ctx.date, L.calls + i));
    const good = res.filter((x) => x.ok);
    const got = good.reduce((s, x) => s + x.usd, 0);
    L.pendingUsd = 0;
    L.usd = r4(num(L.usd) + got + 1e-9);
    L.calls += good.length;
    for (const x of good) for (const [u, v] of Object.entries(x.units)) L.units[u] = num(L.units[u]) + v;
    L.via[ep.name] = r4(num(L.via[ep.name]) + got);
    if (!(await ctx.save())) { err = "ledger write failed after a batch (its worst case stays counted)"; break; }
    if (good.length < k / 2 || !(got > 0)) {
      err = res.find((x) => !x.ok)?.err || (got > 0 ? "batch failed" : "calls reported no billable usage");
      if (++fails >= 3) { which++; fails = 0; if (which < eps.length) console.log(`M3-FALLBACK ${JSON.stringify({ lane: id, to: eps[which].name, after: err })}`); }
      else await sleep(2 * BACKOFF * fails);
    } else { fails = 0; err = null; }
  }
  const after = laneSpent(ctx.ledger, id);
  const ok = target > 0 && after >= target - 1e-9;
  console.log("M3 " + JSON.stringify({ lane: id, date: ctx.date, slot: ctx.slot, mode: ctx.mode, before, after, spent: r4(after - before), target, cap,
    calls: L.calls, units: L.units, via: L.via, ok, ...(ok ? {} : { err: err || "short" }) }));
  return ok;
}

export async function main(now = new Date()) {
  const date = now.toISOString().slice(0, 10), slot = slotOf(now), until = E.M3_UNTIL || "";
  if (!until || date > until) { console.log(`M3-UNTIL-PASSED ${JSON.stringify({ date, until: until || null, action: "nothing spent" })}`); return 0; }
  const name = `ledger/${date}.json`, blindName = `ledger/${date}.blind.json`;
  const [m, b] = [await readJson(name, date), await readJson(blindName, date)];
  const state = m.state === "broken" || b.state === "broken" ? "broken" : m.state;
  const mode = runMode(state, slot);
  const run = { slot, mode, at: now.toISOString(), replica: E.CONTAINER_APP_REPLICA_NAME || null };
  if (mode === "skip") {
    console.log(`M3-ALERT ${JSON.stringify({ reason: "ledger-unreadable", date, slot, action: "pm run skipped: it cannot know what the am run spent", err: m.err || b.err })}`);
    return 1;
  }
  // stop starting batches well inside the job's replicaTimeout (10800 s): a killed run loses its final write
  const ctx = { date, until, slot, mode, ledger: null, save: null, deadline: Date.now() + n("M3_RUN_MAX_MIN", 150) * 60_000 };
  if (mode === "topup") {
    ctx.ledger = mergeBlind(m.state === "ok" ? m.json : { v: 1, date, lanes: {}, runs: [] }, b.state === "ok" ? b.json : null);
    let etag = m.state === "ok" ? m.etag : null;
    ctx.save = async () => {
      const out = JSON.parse(JSON.stringify(ctx.ledger));
      for (const l of Object.values(out.lanes)) delete l.blindUsd;   // the blind blob stays the only source of those
      const w = await writeJson(name, out, etag ? { etag } : { create: true });   // 412: another run holds the ledger → stop
      if (w.ok) etag = w.etag;
      else console.log(`M3-LEDGER ${JSON.stringify({ write: name, status: w.status, err: w.err })}`);
      return w.ok;
    };
  } else {
    // blind (am, ledger unreadable): claim the day's one blind spend first; an existing claim means it already ran
    ctx.ledger = { v: 1, date, lanes: {}, runs: [], blind: true };
    console.log(`M3-ALERT ${JSON.stringify({ reason: "ledger-unreadable", date, slot, action: "am run spends each lane's target once without the ledger", err: m.err || b.err })}`);
    const claim = await writeJson(blindName, ctx.ledger, { create: true });
    if (claim.status === 409 || claim.status === 412) { console.log(`M3 ${JSON.stringify({ lane: "*", date, slot, mode, ok: true, note: "blind spend already claimed today; nothing spent" })}`); return 0; }
    let etag = claim.ok ? claim.etag : null;
    ctx.save = async () => { if (etag) { const w = await writeJson(blindName, ctx.ledger, { etag }); if (w.ok) etag = w.etag; } return true; };
  }
  ctx.ledger.runs ||= [];
  ctx.ledger.runs.push(run);
  const spec = lanes();
  const want = String(E.M3_LANES || "models,tts,storage").split(",").map((s) => s.trim()).filter((s) => spec[s]);
  let allOk = true;
  for (const id of want) allOk = (await runLane(ctx, id, spec[id]).catch((e) => { console.log(`M3 ${JSON.stringify({ lane: id, ok: false, err: scrub(e.message) })}`); return false; })) && allOk;
  run.end = new Date().toISOString(); run.ok = allOk;
  await ctx.save();
  if (mode === "blind") return 0;   // never retried: a retry could not see what this run spent
  if (allOk) console.log("M3-RUN-OK");
  return allOk ? 0 : 1;
}

if (process.env.M3_ROLE === "keeper") {
  const code = await main().catch((e) => { console.log(`M3 ${JSON.stringify({ lane: "*", ok: false, err: scrub(e.message) })}`); return 1; });
  process.exit(code);
}
