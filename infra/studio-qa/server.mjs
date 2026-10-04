// The studio-qa service (LIVE-STUDIO D7, S2): POST /gate runs server/studio/qa/gate.js on one build and returns the
// report; GET /healthz. One shared Chromium (recycled every 50 gates), one fresh context per gate, a bounded queue.
// It holds no secrets and no child data: the request is a fragment + kit params + a strings table. Auth: an optional
// bearer token (STUDIO_QA_TOKEN) on top of internal-only ingress.
import http from "node:http";
import { chromium } from "playwright";
import { runGate, GATE_VERSION } from "../../server/studio/qa/gate.js";

const PORT = Number(process.env.PORT) || 8080;
const CONC = Number(process.env.STUDIO_QA_CONCURRENCY) || 2;
const QUEUE_MAX = Number(process.env.STUDIO_QA_QUEUE) || 24;
const RECYCLE = 50;
const MAX_BODY = 400_000;
const TOKEN = process.env.STUDIO_QA_TOKEN || "";

let browser = null, used = 0, active = 0;
const queue = [];
const stats = { gates: 0, passed: 0, rejected: 0, startedAt: new Date().toISOString() };

async function getBrowser() {
  if (browser && used >= RECYCLE && active === 0) { await browser.close().catch(() => {}); browser = null; }
  if (!browser) { browser = await chromium.launch(); used = 0; }
  used++;
  return browser;
}
const acquire = () => (active < CONC ? (active++, Promise.resolve()) : new Promise((r) => queue.push(r)));
const release = () => { const w = queue.shift(); if (w) w(); else active--; };

function readJson(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on("data", (c) => { n += c.length; if (n > MAX_BODY) { reject(Object.assign(new Error("too large"), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(Object.assign(new Error("bad json"), { status: 400 })); } });
    req.on("error", reject);
  });
}
const send = (res, status, body) => { res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };

export const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/healthz") return send(res, 200, { ok: true, version: GATE_VERSION, active, queued: queue.length, ...stats });
  if (req.method !== "POST" || req.url !== "/gate") return send(res, 404, { error: "not found" });
  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) return send(res, 401, { error: "unauthorized" });
  if (queue.length >= QUEUE_MAX) { stats.rejected++; return send(res, 503, { error: "busy" }); }
  let job;
  try { job = await readJson(req); } catch (e) { return send(res, e.status ?? 400, { error: e.message }); }
  if (!job || typeof job.fragment !== "string" || typeof job.archetypeId !== "string") return send(res, 400, { error: "archetypeId and fragment required" });
  await acquire();
  try {
    const r = await runGate(await getBrowser(), { archetypeId: job.archetypeId, fragment: job.fragment, params: job.params, strings: job.strings,
      band: job.band, lang: job.lang, seed: job.seed, fixed: job.fixed === true, perf: job.perf !== false });
    stats.gates++; if (r.pass) stats.passed++;
    send(res, 200, { ...r, html: undefined, version: GATE_VERSION });
  } catch (e) {
    send(res, 500, { pass: false, unavailable: true, checks: [{ id: "harness_completed", pass: false, detail: String(e?.message ?? e).slice(0, 160) }] });
  } finally { release(); }
});

if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, () => console.log(`[studio-qa] ${GATE_VERSION} on :${PORT} (concurrency ${CONC})`));
  const stop = async () => { server.close(); await browser?.close().catch(() => {}); process.exit(0); };
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
}
