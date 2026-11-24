// Milestone 3/4 keeper (round 7, M3 + M4 hardening; docs/design/round7/M3.md): one script, two runners.
//   aca  the ACA job `m3-keeper`, cron "17 */3 * * *" UTC, inline in a stock node:22-slim image
//        (`node --input-type=module -e <this file>`), as scripts/region/latency-job.mjs is;
//   vm   taxila-m3-vm (centralindia), /opt/m3/keeper-job.mjs from a systemd timer at :47 past 01, 04, ... UTC
//        (90 minutes after the ACA runs), installed by `scripts/m3.mjs apply --only runner` over Run Command.
// It keeps three Cost Management services above $1 every UTC day by spending a capped amount that the APIs report:
//   models   Azure OpenAI chat tokens (Foundry Models)          spend = returned usage tokens x price
//   tts      Azure Speech neural TTS over REST (Foundry Tools)   spend = characters synthesised x price
//   storage  Blob "List Blobs" calls (Storage, list class)      spend = successful operations x price
//
// The ledger: the blob ledger/YYYY-MM-DD.json in the m3-ledger container (Shared Key, raw REST). A run creates it if
// absent, takes a 60 s blob LEASE (renewed every 20 s while it spends), reads it under the lease, and writes it only
// with the lease id: two runners never spend at once (the loser of the lease does nothing; the next slot tops up).
// Each batch's worst case is written BEFORE the batch (pendingUsd), so a crash or a lost write makes a later run spend
// less, never twice; the next lease holder adopts a dead run's pending as orphanUsd (still counted).
// The first run of a UTC day spends each lane to its target; later runs top up only what is missing. No batch starts
// in the last 20 minutes of a UTC day (its usage would bill on the next day) or after M3_UNTIL.
//
// Closed loop: the latest m3-verify report (report/YYYY-MM-DD.json, today or the 2 days before) gives each lane's
// service spend on the last closed day. Under $1.20 → today's target is raised by target/actual, capped at $2.50 (and
// that day's cap becomes target + $0.15), recorded in the ledger's `targets` with why. A day's raise never drops.
//
// Without the shared ledger: a corrupt ledger → nothing is spent (M3-ALERT ledger-corrupt). Unreachable (network,
// 5xx) or refused (401/403) → the ACA runner spends nothing (M3-ALERT); the VM runner, in its last slot of the day only
// (22:47), spends each lane to target against its LOCAL mirror of the last shared ledger it saw (M3_LOCAL_DIR), keeps
// that spend in a local offline ledger, and folds it into the shared ledger (offlineUsd) once it can reach it again.
// See runMode for why that cannot double-spend except in a one-sided partition.
//
// Lines: `M3 {json}` per lane, `M3-RUN-OK` after a clean run, `M3-RAISE`, `M3-FALLBACK`, and `M3-ALERT {json}` on a
// 401/403 (naming the lane), a missing deployment, an unreadable or corrupt ledger, or the local fallback. Alerts also go
// into the run's ledger entry, so the verifier re-raises the VM's (its journal is not in Log Analytics).
// Exit 1 when a lane ends short after its fallbacks, so the ACA job's retry (replicaRetryLimit 2) tops it up.
//
// SELF-CONTAINED: fetch + node:crypto + node:fs only, no repo imports. The pure section mirrors infra/m3/plan.js and
// tests/m3-plan.test.mjs checks it does (this file only runs its main with M3_ROLE=keeper).
// Never prints a key, a SAS or a URL with credentials: logs carry lane, host, status codes and numbers.
//
// env: M3_ROLE=keeper, M3_RUNNER (aca | vm), M3_UNTIL (YYYY-MM-DD; after it nothing is spent), M3_SINCE (the first day
// the closed loop may read), M3_STORAGE_ACCOUNT, M3_STORAGE_KEY, M3_CONTAINER (m3-ledger), M3_{MODELS,TTS,STORAGE}_{TARGET,CAP}
// (USD), M3_RAISE_FLOOR (1.20), M3_RAISE_MAX (2.50), M3_RAISE_HEADROOM (0.15), M3_AOAI_{ENDPOINT,KEY,DEPLOYMENT,PRICE_IN,PRICE_CACHED,PRICE_OUT},
// M3_AOAI_FALLBACK_* and M3_AOAI_FALLBACK2_* (same names; endpoint and key default to the primary's), M3_AOAI_MAX_TOKENS
// (6000), M3_AOAI_CONCURRENCY (6), M3_SPEECH_{REGION,KEY}, M3_SPEECH_FALLBACK_{REGION,KEY}, M3_TTS_PRICE_PER_MCHARS (15),
// M3_TTS_VOICE_HI, M3_TTS_VOICE_EN, M3_TTS_CONCURRENCY (4), M3_STORAGE_OP_USD (0.000005), M3_STORAGE_CONCURRENCY (48),
// M3_STORAGE_BATCH (5000), M3_LANES (models,tts,storage), M3_BACKOFF_MS (5000), M3_RUN_MAX_MIN (150), M3_LEASE_SEC (60),
// M3_LEASE_RENEW_MS (20000), M3_DAY_GUARD_MIN (20), M3_LOCAL_DIR (vm: /var/lib/m3), M3_LOCAL_FALLBACK_HOUR (22).
import { createHmac, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

// ───────────────────────────── pure (mirrors infra/m3/plan.js) ─────────────────────────────

const r4 = (x) => Math.round(x * 1e4) / 1e4;
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
export function laneSpent(ledger, id) {
  const l = ledger?.lanes?.[id];
  if (!l) return 0;
  return r4(Math.max(0, num(l.usd)) + Math.max(0, num(l.pendingUsd)) + Math.max(0, num(l.blindUsd)) + Math.max(0, num(l.orphanUsd))
    + Math.max(0, num(l.offlineUsd)) + Math.max(0, num(l.seenUsd)));
}

export function mergeBlind(ledger, blind) {
  const out = JSON.parse(JSON.stringify(ledger || { v: 1, lanes: {}, runs: [] }));
  out.lanes ||= {};
  for (const [id, l] of Object.entries(blind?.lanes || {})) (out.lanes[id] ||= { usd: 0, pendingUsd: 0 }).blindUsd = r4(num(l.usd) + num(l.pendingUsd));
  return out;
}

export function adoptOrphans(ledger) {
  const out = JSON.parse(JSON.stringify(ledger || { v: 2, lanes: {}, runs: [] }));
  out.lanes ||= {};
  for (const l of Object.values(out.lanes)) {
    const p = Math.max(0, num(l.pendingUsd));
    if (p > 0) { l.orphanUsd = r4(Math.max(0, num(l.orphanUsd)) + p); l.pendingUsd = 0; }
  }
  return out;
}

export function offlineSpent(off, id) {
  const l = off?.lanes?.[id];
  return l ? r4(Math.max(0, num(l.usd)) + Math.max(0, num(l.pendingUsd)) + Math.max(0, num(l.orphanUsd))) : 0;
}

export function foldOffline(ledger, off) {
  const out = JSON.parse(JSON.stringify(ledger || { v: 2, lanes: {}, runs: [] }));
  out.lanes ||= {};
  for (const id of Object.keys(off?.lanes || {})) {
    const v = offlineSpent(off, id);
    if (v > 0) (out.lanes[id] ||= { usd: 0, pendingUsd: 0 }).offlineUsd = r4(Math.max(num(out.lanes[id].offlineUsd), v));
  }
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

export function runMode(state, { runner = "aca", hour = 0, fallbackHour = 22 } = {}) {
  if (state === "ok" || state === "absent") return "topup";
  if (state === "held") return "wait";
  if ((state === "unreachable" || state === "auth") && runner === "vm" && hour >= fallbackHour) return "local";
  return "skip";
}

export function laneTargets({ base, report = null, prev = null, since = null, floorUsd = 1.2, maxUsd = 2.5, headroomUsd = 0.15, service = { models: "models", tts: "tools", storage: "storage" } }) {
  const out = {};
  const day = (report?.days || []).find((d) => d.date === report.lastClosed) || null;
  const usable = !!day && (!since || day.date >= since);
  for (const [id, b] of Object.entries(base || {})) {
    let target = num(b.targetUsd), cap = num(b.capUsd), raise = null;
    const actual = usable && service[id] ? Math.max(0, num(day.portfolio?.[service[id]])) : null;
    if (actual != null && actual < floorUsd) {
      const to = Math.min(maxUsd, Math.max(target, actual > 0 ? (target * target) / actual : maxUsd));
      raise = { from: target, to: Math.round(to * 100) / 100, actual, day: day.date, report: report.date || null,
        why: `${service[id]} billed $${actual} on ${day.date}, under $${floorUsd}: target x ${(target / Math.max(actual, 1e-9)).toFixed(2)}, capped at $${maxUsd}` };
      target = raise.to;
      cap = Math.max(cap, Math.round((target + headroomUsd) * 100) / 100);
    }
    const p = prev?.[id];
    if (p && num(p.target) > target) { target = num(p.target); cap = Math.max(cap, num(p.cap)); raise = p.raise || raise; }
    out[id] = { target, cap, ...(raise ? { raise } : {}) };
  }
  return out;
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

export const minutesToMidnight = (d) => (86_400_000 - (new Date(d).getTime() % 86_400_000)) / 60_000;

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
const addDays = (d, k) => new Date(Date.parse(`${d}T00:00:00Z`) + k * 86_400_000).toISOString().slice(0, 10);
const LANE_IDS = () => String(E.M3_LANES || "models,tts,storage").split(",").map((s) => s.trim()).filter(Boolean);

function blob(method, name, { body = null, headers = {}, query = {} } = {}) {
  const path = `/${CONTAINER}${name ? "/" + name : ""}`;
  const buf = body == null ? null : Buffer.from(body);
  const h = { "x-ms-date": new Date().toUTCString(), "x-ms-version": XV, ...headers };
  const sts = sharedKeyStringToSign({ method, account: SA, path, query, headers: { ...h, ...(buf ? { "content-length": String(buf.length) } : {}) } });
  h.authorization = `SharedKey ${SA}:${createHmac("sha256", Buffer.from(E.M3_STORAGE_KEY || "", "base64")).update(sts, "utf8").digest("base64")}`;
  const qs = new URLSearchParams(query).toString();
  return fetch(`https://${SA}.blob.core.windows.net${path}${qs ? "?" + qs : ""}`, { method, headers: h, body: buf, signal: AbortSignal.timeout(30_000) });
}
/** What a failed storage status means for the ledger: refused (401/403: a key or a firewall) or out of reach. */
export const failState = (status) => (status === 401 || status === 403 ? "auth" : "unreachable");
/** → { state: ok|absent|corrupt|unreachable|auth, json, etag, status, err }. `date` (when given) must match the blob's. */
async function readJson(name, date) {
  try {
    const r = await blob("GET", name);
    const text = await r.text();
    if (r.status === 404) return { state: "absent", status: 404 };
    if (!r.ok) return { state: failState(r.status), status: r.status, err: `http ${r.status}` };
    let json;
    try { json = JSON.parse(text); } catch { return { state: "corrupt", status: r.status, err: "unparseable" }; }
    if (!json || typeof json !== "object" || (date && json.date !== date)) return { state: "corrupt", status: r.status, err: "not this day's ledger" };
    return { state: "ok", json, etag: r.headers.get("etag"), status: r.status };
  } catch (e) { return { state: "unreachable", status: 0, err: scrub(e.message) }; }
}
/** Conditional write: If-Match the etag we hold, or If-None-Match * to create; with the lease id when we hold one. */
async function writeJson(name, obj, { etag = null, create = false, lease = null } = {}) {
  try {
    const r = await blob("PUT", name, { body: JSON.stringify(obj), headers: { "content-type": "application/json", "x-ms-blob-type": "BlockBlob",
      ...(etag ? { "if-match": etag } : create ? { "if-none-match": "*" } : {}), ...(lease ? { "x-ms-lease-id": lease } : {}) } });
    await r.arrayBuffer().catch(() => {});
    return { ok: r.ok, etag: r.headers.get("etag"), status: r.status };
  } catch (e) { return { ok: false, status: 0, err: scrub(e.message) }; }
}
/** Lease Blob: acquire (→ the lease id), renew, release. 409 on acquire = another runner holds it. */
async function leaseOp(name, action, { id = null, duration = null, proposed = null } = {}) {
  try {
    const r = await blob("PUT", name, { query: { comp: "lease" }, headers: { "x-ms-lease-action": action, ...(id ? { "x-ms-lease-id": id } : {}),
      ...(duration ? { "x-ms-lease-duration": String(duration) } : {}), ...(proposed ? { "x-ms-proposed-lease-id": proposed } : {}) } });
    await r.arrayBuffer().catch(() => {});
    return { ok: r.ok, status: r.status, id: r.headers.get("x-ms-lease-id") || id };
  } catch (e) { return { ok: false, status: 0, err: scrub(e.message) }; }
}

/**
 * Open a day's shared ledger: create it if absent (a lease needs a blob), take its lease, then read it UNDER the lease,
 * so every write-ahead another runner made before we got the lease is in what we read. Folds the v1 keeper's blind
 * blob in. → { state: ok, ledger, leaseId, etag, name } or { state: held|corrupt|unreachable|auth, status, err }.
 */
async function openShared(date) {
  const name = `ledger/${date}.json`;
  const c = await writeJson(name, { v: 2, date, lanes: {}, targets: {}, runs: [] }, { create: true });
  if (!c.ok && c.status !== 409 && c.status !== 412) return { state: c.status ? failState(c.status) : "unreachable", status: c.status, err: c.err || `create: http ${c.status}` };
  const l = await leaseOp(name, "acquire", { duration: n("M3_LEASE_SEC", 60), proposed: randomUUID() });
  if (!l.ok) return { state: l.status === 409 ? "held" : l.status ? failState(l.status) : "unreachable", status: l.status, err: l.err || `lease: http ${l.status}` };
  const m = await readJson(name, date), b = await readJson(`ledger/${date}.blind.json`, date);
  const bad = m.state !== "ok" ? m : b.state !== "ok" && b.state !== "absent" ? b : null;
  if (bad) {
    await leaseOp(name, "release", { id: l.id });
    return { state: bad.state === "absent" ? "unreachable" : bad.state, status: bad.status, err: bad.err || "the ledger vanished under the lease" };
  }
  return { state: "ok", name, leaseId: l.id, etag: m.etag, ledger: mergeBlind(m.json, b.state === "ok" ? b.json : null) };
}
/** A held lease: renewed in the background while the run spends; save() writes with the lease id; close() releases it. */
function holdShared(o, ctx) {
  let etag = o.etag, fails = 0;
  const timer = setInterval(async () => {
    const r = await leaseOp(o.name, "renew", { id: o.leaseId });
    if (r.ok) fails = 0; else if (++fails >= 2) ctx.leaseLost = true;   // no new batch; what is in flight was written ahead
  }, n("M3_LEASE_RENEW_MS", 20_000));
  timer.unref?.();
  return {
    async save(ledger) {
      if (ctx.leaseLost) return false;
      const out = JSON.parse(JSON.stringify(ledger));
      for (const l of Object.values(out.lanes || {})) delete l.blindUsd;   // the v1 blind blob stays the only source of those
      const w = await writeJson(o.name, out, { etag, lease: o.leaseId });
      if (w.ok) { etag = w.etag; await writeLocal(`mirror-${ledger.date}.json`, ledger); }
      else {
        console.log(`M3-LEDGER ${JSON.stringify({ write: o.name, status: w.status, err: w.err })}`);
        if (w.status === 401 || w.status === 403) ctx.alert({ reason: "auth-failed", lane: "ledger", status: w.status });
      }
      return w.ok;
    },
    async close() { clearInterval(timer); await leaseOp(o.name, "release", { id: o.leaseId }); },
  };
}

// the VM runner's local store (M3_LOCAL_DIR): mirror-D.json = the shared ledger as last read or written; offline-D.json
// = what the local fallback spent. Atomic writes (tmp + rename). Without M3_LOCAL_DIR both are no-ops.
const localDir = () => E.M3_LOCAL_DIR || "";
async function readLocal(file) {
  if (!localDir()) return null;
  try { return JSON.parse(await readFile(`${localDir()}/${file}`, "utf8")); } catch { return null; }
}
async function writeLocal(file, obj) {
  if (!localDir()) return false;
  try {
    await mkdir(localDir(), { recursive: true });
    const p = `${localDir()}/${file}`;
    await writeFile(`${p}.tmp`, JSON.stringify(obj));
    await rename(`${p}.tmp`, p);
    return true;
  } catch (e) { console.log(`M3-LOCAL ${JSON.stringify({ write: file, err: scrub(e.message) })}`); return false; }
}

/** Run `k` tasks with at most `c` in flight. */
async function pool(k, c, fn) {
  let next = 0;
  const out = [];
  await Promise.all(Array.from({ length: Math.max(0, Math.min(c, k)) }, async () => { while (next < k) { const i = next++; out[i] = await fn(i); } }));
  return out;
}

// models: one chat call, retried on 429 / 5xx up to 3 times (a failed call reports no usage and bills nothing).
// 401/403 (auth) and 404 (the deployment is gone) are not retried: the lane moves to its next endpoint at once.
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
      if (status === 401 || status === 403) return { ok: false, auth: true, status, err: `http ${status} ${code}`.trim() };
      if (status === 404) return { ok: false, gone: true, status, err: `http ${status} ${code}`.trim() };
      if (!(status === 429 || status >= 500) || attempt >= 3) return { ok: false, status, err: `http ${status} ${code}`.trim() };
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
      if (r.status === 401 || r.status === 403) return { ok: false, auth: true, status: r.status, err: `http ${r.status}` };
      if (!(r.status === 429 || r.status >= 500) || attempt >= 3) return { ok: false, status: r.status, err: `http ${r.status}` };
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
    if (r.ok) return { ok: true, usd: ep.opUsd, units: { ops: 1 } };
    return { ok: false, status: r.status, err: `http ${r.status}`, ...(r.status === 401 || r.status === 403 ? { auth: true } : {}) };
  } catch (e) { return { ok: false, err: scrub(e.message) }; }
}

const avgChars = PARAGRAPHS.reduce((s, p) => s + charsOf(p.text), 0) / PARAGRAPHS.length;
const maxChars = Math.max(...PARAGRAPHS.map((p) => charsOf(p.text)));
function lanes() {
  const priceOf = (pre) => ({ in: n(`${pre}_PRICE_IN`, NaN), cached: n(`${pre}_PRICE_CACHED`, NaN), out: n(`${pre}_PRICE_OUT`, NaN) });
  const aoai = [{ name: "primary", endpoint: E.M3_AOAI_ENDPOINT, key: E.M3_AOAI_KEY, deployment: E.M3_AOAI_DEPLOYMENT, price: priceOf("M3_AOAI") }];
  for (const [name, pre] of [["fallback", "M3_AOAI_FALLBACK"], ["fallback2", "M3_AOAI_FALLBACK2"]]) {
    if (E[`${pre}_DEPLOYMENT`]) aoai.push({ name, endpoint: E[`${pre}_ENDPOINT`] || E.M3_AOAI_ENDPOINT, key: E[`${pre}_KEY`] || E.M3_AOAI_KEY, deployment: E[`${pre}_DEPLOYMENT`], price: priceOf(pre) });
  }
  const ttsPrice = n("M3_TTS_PRICE_PER_MCHARS", 15);
  const speech = [{ name: "primary", region: E.M3_SPEECH_REGION, key: E.M3_SPEECH_KEY, pricePerMChars: ttsPrice }];
  if (E.M3_SPEECH_FALLBACK_REGION && E.M3_SPEECH_FALLBACK_KEY) speech.push({ name: "fallback", region: E.M3_SPEECH_FALLBACK_REGION, key: E.M3_SPEECH_FALLBACK_KEY, pricePerMChars: ttsPrice });
  const opUsd = n("M3_STORAGE_OP_USD", 0.000005);
  const chatMax = (ep) => (PROMPT_BOUND * ep.price.in + MAXTOK * ep.price.out) / 1e6;
  // the expected cost of one more call on THIS endpoint: its own average so far (prices differ 17x between models)
  const perEp = (ep, L, d) => (num(L.viaCalls?.[ep.name]) > 0 && num(L.via?.[ep.name]) > 0 ? L.via[ep.name] / L.viaCalls[ep.name] : d);
  return {
    models: { endpoints: aoai, ready: (ep) => !!(ep.endpoint && ep.key && ep.deployment) && [ep.price.in, ep.price.cached, ep.price.out].every((x) => x >= 0),
      unitUsd: (ep, L) => perEp(ep, L, chatMax(ep) / 2), maxUnitUsd: chatMax, batch: () => n("M3_AOAI_CONCURRENCY", 6),
      conc: () => n("M3_AOAI_CONCURRENCY", 6), once: chatOnce },
    tts: { endpoints: speech, ready: (ep) => !!(ep.region && ep.key) && ep.pricePerMChars > 0,
      unitUsd: (ep) => (avgChars * ep.pricePerMChars) / 1e6, maxUnitUsd: (ep) => (maxChars * ep.pricePerMChars) / 1e6, batch: () => n("M3_TTS_CONCURRENCY", 4) * 2,
      conc: () => n("M3_TTS_CONCURRENCY", 4), once: ttsOnce },
    storage: { endpoints: [{ name: "primary", opUsd, conc: n("M3_STORAGE_CONCURRENCY", 48) }, { name: "slow", opUsd, conc: 4 }], ready: () => !!(SA && E.M3_STORAGE_KEY) && opUsd > 0,
      unitUsd: (ep) => ep.opUsd, maxUnitUsd: (ep) => ep.opUsd, batch: () => n("M3_STORAGE_BATCH", 5000), conc: (ep) => ep.conc, once: (ep) => listOnce(ep) },
  };
}

async function runLane(ctx, id, spec) {
  const t = ctx.targets[id] || {};
  const target = num(t.target), cap = num(t.cap);
  const L = (ctx.ledger.lanes[id] ||= { usd: 0, pendingUsd: 0, calls: 0, units: {}, via: {}, viaCalls: {} });
  L.units ||= {}; L.via ||= {}; L.viaCalls ||= {}; L.calls = num(L.calls); L.pendingUsd = num(L.pendingUsd);
  const before = laneSpent(ctx.ledger, id);
  let err = null, which = 0, fails = 0;
  if (!(target > 0 && cap >= target)) err = `bad target/cap ${target}/${cap}`;
  const eps = spec.endpoints.filter((ep) => spec.ready(ep));
  if (!err && !eps.length) err = "not configured";
  const setupErr = !!err;
  const next = (why) => { which++; fails = 0; if (which < eps.length) console.log(`M3-FALLBACK ${JSON.stringify({ lane: id, to: eps[which].name, after: why, runner: ctx.runner })}`); };
  // `err` keeps the last failure for the M3 line; a stop condition breaks out, a failed batch counts towards the fallback
  while (!setupErr && which < eps.length) {
    const stop = ctx.stopReason();
    if (stop) { err = stop; break; }
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
    L.viaCalls[ep.name] = num(L.viaCalls[ep.name]) + good.length;
    if (!(await ctx.save())) { err = "ledger write failed after a batch (its worst case stays counted)"; break; }
    const hard = res.find((x) => !x.ok && (x.auth || x.gone));
    if (hard) {   // a refused key or a deleted deployment does not heal in 3 batches: say so now, move on now
      err = hard.err;
      ctx.alert({ reason: hard.auth ? "auth-failed" : "deployment-missing", lane: id, endpoint: ep.name, status: hard.status });
      next(err);
    } else if (good.length < k / 2 || !(got > 0)) {
      err = res.find((x) => !x.ok)?.err || (got > 0 ? "batch failed" : "calls reported no billable usage");
      if (++fails >= 3) next(err);
      else await sleep(2 * BACKOFF * fails);
    } else { fails = 0; err = null; }
  }
  const after = laneSpent(ctx.ledger, id);
  const ok = target > 0 && after >= target - 1e-9;
  ctx.laneResult[id] = ok ? { ok, after } : { ok, after, err: err || "short" };
  console.log("M3 " + JSON.stringify({ lane: id, date: ctx.date, runner: ctx.runner, mode: ctx.mode, before, after, spent: r4(after - before), target, cap,
    calls: L.calls, units: L.units, via: L.via, ok, ...(ok ? {} : { err: err || "short" }) }));
  return ok;
}

/** The base targets and caps from the env (the closed loop raises them per day). */
const baseTargets = () => Object.fromEntries(LANE_IDS().map((id) => [id, { targetUsd: n(`M3_${id.toUpperCase()}_TARGET`, NaN), capUsd: n(`M3_${id.toUpperCase()}_CAP`, NaN) }]));
/** The newest verifier report of today or the 2 days before (null if none reads). */
async function latestReport(date) {
  for (let k = 0; k <= 2; k++) {
    const d = addDays(date, -k), r = await readJson(`report/${d}.json`, d);
    if (r.state === "ok") return r.json;
  }
  return null;
}

/** Spend every lane under ctx.save; record the run in ctx.ledger.runs. */
async function spendLanes(ctx, run) {
  ctx.ledger.runs ||= [];
  ctx.ledger.runs.push(run);
  const spec = lanes();
  let allOk = true;
  try {
    for (const id of LANE_IDS().filter((s) => spec[s])) {
      allOk = (await runLane(ctx, id, spec[id]).catch((e) => { console.log(`M3 ${JSON.stringify({ lane: id, ok: false, err: scrub(e.message) })}`); ctx.laneResult[id] = { ok: false, err: scrub(e.message) }; return false; })) && allOk;
    }
  } finally {
    run.end = ctx.clock().toISOString(); run.ok = allOk; run.lanes = ctx.laneResult;
    if (ctx.alerts.length) run.alerts = ctx.alerts;
    await ctx.save();
  }
  return allOk;
}

/**
 * VM only: fold the local fallback's spend of the 2 days before into those days' shared ledgers (under their lease),
 * so the verifier and the other runner count it. Best effort: retried by every later run until it lands.
 */
async function foldPast(date, ctx) {
  for (const d of [addDays(date, -1), addDays(date, -2)]) {
    const off = await readLocal(`offline-${d}.json`);
    if (!off || LANE_IDS().every((id) => offlineSpent(off, id) <= num(off.folded?.[id]))) continue;
    const o = await openShared(d);
    if (o.state !== "ok") { console.log(`M3-FOLD ${JSON.stringify({ date: d, state: o.state, note: "kept for the next run" })}`); continue; }
    const h = holdShared(o, ctx);
    const ledger = foldOffline(o.ledger, off);
    ledger.runs ||= [];
    ledger.runs.push({ id: `${ctx.runner}:fold:${ctx.clock().toISOString()}`, runner: ctx.runner, mode: "fold", at: ctx.clock().toISOString() });
    const ok = await h.save(ledger);
    await h.close();
    if (ok) {
      off.folded = Object.fromEntries(LANE_IDS().map((id) => [id, offlineSpent(off, id)]));
      await writeLocal(`offline-${d}.json`, off);
      console.log(`M3-FOLD ${JSON.stringify({ date: d, folded: off.folded })}`);
    }
  }
}

export async function main(now = new Date()) {
  const date = now.toISOString().slice(0, 10), until = E.M3_UNTIL || "", runner = E.M3_RUNNER || "aca";
  if (!until || date > until) { console.log(`M3-UNTIL-PASSED ${JSON.stringify({ date, until: until || null, runner, action: "nothing spent" })}`); return 0; }
  const guardMin = n("M3_DAY_GUARD_MIN", 20), t0 = Date.now();
  const clock = () => new Date(now.getTime() + (Date.now() - t0));
  if (minutesToMidnight(now) < guardMin) {
    console.log(`M3 ${JSON.stringify({ lane: "*", date, runner, ok: true, note: `day-end guard: no batch in the last ${guardMin} minutes of a UTC day; the next day's first run spends` })}`);
    return 0;
  }
  const alerts = [];
  const ctx = { date, until, runner, mode: null, ledger: null, targets: {}, leaseLost: false, laneResult: {}, alerts, clock, save: null,
    deadline: t0 + n("M3_RUN_MAX_MIN", 150) * 60_000,
    alert: (a) => { const x = { ...a, runner, date }; alerts.push(x); console.log(`M3-ALERT ${JSON.stringify(x)}`); },
    stopReason: () => {
      const t = clock();
      if (ctx.leaseLost) return "lease lost (its holder's write-ahead stays counted)";
      if (t.toISOString().slice(0, 10) !== date) return "the UTC day ended";
      if (minutesToMidnight(t) < guardMin) return `day-end guard (${guardMin} min)`;
      if (Date.now() > ctx.deadline) return "run time limit (M3_RUN_MAX_MIN)";
      return null;
    } };
  if (runner === "vm") await foldPast(date, ctx).catch((e) => console.log(`M3-FOLD ${JSON.stringify({ err: scrub(e.message) })}`));
  const o = await openShared(date);
  const mode = ctx.mode = runMode(o.state, { runner, hour: now.getUTCHours(), fallbackHour: n("M3_LOCAL_FALLBACK_HOUR", 22) });
  if (o.state === "auth") ctx.alert({ reason: "auth-failed", lane: "ledger", status: o.status });
  if (mode === "wait") {
    console.log(`M3 ${JSON.stringify({ lane: "*", date, runner, mode, ok: true, note: "another runner holds the day's ledger lease and is spending; nothing to do" })}`);
    return 0;
  }
  if (mode === "skip") {
    ctx.alert({ reason: o.state === "corrupt" ? "ledger-corrupt" : "ledger-unreadable", state: o.state, status: o.status, err: o.err, action: "nothing spent without the shared ledger" });
    return 1;
  }
  const run = { id: `${runner}:${now.toISOString()}`, runner, mode, at: now.toISOString(), replica: E.CONTAINER_APP_REPLICA_NAME || null };
  if (mode === "local") {
    if (!localDir()) { ctx.alert({ reason: "ledger-unreadable", state: o.state, action: "no M3_LOCAL_DIR: nothing spent" }); return 1; }
    const mirror = await readLocal(`mirror-${date}.json`);
    const off = adoptOrphans((await readLocal(`offline-${date}.json`)) || { v: 2, date, local: true, lanes: {}, runs: [] });
    for (const id of LANE_IDS()) (off.lanes[id] ||= { usd: 0, pendingUsd: 0, calls: 0, units: {}, via: {}, viaCalls: {} }).seenUsd = laneSpent(mirror, id);
    ctx.ledger = off;
    ctx.targets = off.targets = laneTargets({ base: baseTargets(), prev: { ...(mirror?.targets || {}), ...(off.targets || {}) } });
    ctx.alert({ reason: "ledger-unreachable", state: o.state, status: o.status, err: o.err,
      action: `vm local fallback: each lane to target against the last shared ledger this VM saw (${mirror ? `at ${mirror.runs?.at(-1)?.at || "?"}` : "none today"})` });
    ctx.save = () => writeLocal(`offline-${date}.json`, ctx.ledger);
    const ok = await spendLanes(ctx, run);
    return ok ? 0 : 1;
  }
  // topup, under the lease
  let ledger = adoptOrphans(o.ledger);
  ledger.v = 2;
  if (runner === "vm") { const off = await readLocal(`offline-${date}.json`); if (off) ledger = foldOffline(ledger, off); }
  const report = await latestReport(date);
  ledger.targets = laneTargets({ base: baseTargets(), report, prev: ledger.targets, since: E.M3_SINCE || null,
    floorUsd: n("M3_RAISE_FLOOR", 1.2), maxUsd: n("M3_RAISE_MAX", 2.5), headroomUsd: n("M3_RAISE_HEADROOM", 0.15) });
  ctx.ledger = ledger; ctx.targets = ledger.targets;
  for (const [id, t] of Object.entries(ctx.targets)) if (t.raise) console.log(`M3-RAISE ${JSON.stringify({ lane: id, ...t.raise, target: t.target, cap: t.cap })}`);
  const h = holdShared(o, ctx);
  ctx.save = () => h.save(ctx.ledger);
  let ok = false;
  try { ok = await spendLanes(ctx, run); } finally { await h.close(); }
  if (ok) console.log("M3-RUN-OK");
  return ok ? 0 : 1;
}

if (process.env.M3_ROLE === "keeper") {
  const code = await main().catch((e) => { console.log(`M3 ${JSON.stringify({ lane: "*", ok: false, err: scrub(e.message) })}`); return 1; });
  process.exit(code);
}
