// The forge3 visual-QA service (round 3, stream forge): POST /judge renders one Studio artifact in the real Desk tray +
// StudioStage at the judged sizes (360 x 800 and 412 x 915 phones, 1366 x 768 laptop) and returns the verdicts; GET
// /healthz. Like the Studio gate (infra/studio-qa), it runs in the UNTRUSTED environment (no secrets, egress denied, no
// child data: the request is an artifact — a board script, a Studio v2 spec, a play level — and nothing else), because it
// executes renderers on content that came from a model or a generator. One shared Chromium (recycled every 200 judgements),
// one warm judge page per concurrency slot, a bounded queue; a full queue answers 503 and the caller treats that as "not
// judged" (the piece does not show; the certified rung does).
//
//   FORGE3_QA_LOCAL=1 FORGE3_QA_HARNESS=<built harness dir> node server/forge3/qa-service.mjs
// The image (server/forge3/infra/Dockerfile) builds the harness with server/forge3/qa/vite.config.mjs at image build time.
import http from "node:http";
import { serveHarness, openJudge, launchLocal } from "./qa/render.js";
import { QA_VERSION } from "./qa/checks.js";
import { DESK_VIEWPORTS, PLAY_VIEWPORTS } from "./qa/viewports.js";

const PORT = Number(process.env.PORT) || 8080;
const CONC = Math.max(1, Number(process.env.FORGE3_QA_CONCURRENCY) || 2);
const QUEUE_MAX = Number(process.env.FORGE3_QA_QUEUE) || 32;
const RECYCLE = 200;
const MAX_BODY = 600_000;
const TOKEN = process.env.FORGE3_QA_TOKEN || "";
const KINDS = new Set(["whiteboard", "stagecraft", "skeleton", "image", "frame", "play"]);

let browser = null, harness = null, used = 0;
const free = [];
const waiters = [];
const stats = { judged: 0, passed: 0, rejected: 0, startedAt: new Date().toISOString() };

async function judgeSlot() {
  if (free.length) return free.pop();
  if (!harness) harness = await serveHarness(process.env.FORGE3_QA_HARNESS);
  if (!browser || used >= RECYCLE) {
    const old = browser; browser = await launchLocal(); used = 0;
    if (old) old.close().catch(() => {});
  }
  return openJudge({ browser, base: harness.base });
}
let active = 0;
const acquire = () => (active < CONC ? (active++, Promise.resolve()) : new Promise((r) => waiters.push(r)));
const release = () => { const w = waiters.shift(); if (w) w(); else active--; };

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
  if (req.method === "GET" && req.url === "/healthz") return send(res, 200, { ok: true, version: QA_VERSION, active, queued: waiters.length, ...stats });
  if (req.method !== "POST" || req.url !== "/judge") return send(res, 404, { error: "not found" });
  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) return send(res, 401, { error: "unauthorized" });
  if (waiters.length >= QUEUE_MAX) { stats.rejected++; return send(res, 503, { error: "busy" }); }
  let job;
  try { job = await readJson(req); } catch (e) { return send(res, e.status ?? 400, { error: e.message }); }
  if (!job?.artifact || !KINDS.has(job.artifact.kind)) return send(res, 400, { error: "artifact with a known kind required" });
  await acquire();
  let slot = null;
  try {
    slot = await judgeSlot();
    used++;
    const r = await slot.judge(job.artifact, { viewports: job.mode === "play" ? PLAY_VIEWPORTS : DESK_VIEWPORTS, young: job.young === true, lang: job.lang ?? "en" });
    stats.judged++; if (r.piece.pass) stats.passed++;
    send(res, 200, { v: QA_VERSION, pass: r.piece.pass, byViewport: r.piece.byViewport, fails: r.piece.fails,
      views: r.views.map((v) => ({ vp: v.vp, pass: v.verdict.pass, fails: v.verdict.fails, stats: v.verdict.stats, ms: v.ms })) });
  } catch (e) {
    send(res, 500, { pass: false, unavailable: true, error: String(e?.message ?? e).slice(0, 160) });
    slot?.close().catch(() => {}); slot = null;
  } finally {
    if (slot) free.push(slot);
    release();
  }
});

if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, () => console.log(`[forge3-qa] ${QA_VERSION} on :${PORT} (concurrency ${CONC})`));
  const stop = async () => { server.close(); await browser?.close().catch(() => {}); harness?.server.close(); process.exit(0); };
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
}
