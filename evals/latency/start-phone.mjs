// Round 5, stream 3 (latency): TAP START -> HER FIRST SOUND on a phone profile, on the page clock.
// A packaged production build (server/serve.mjs, NODE_ENV=production, production model routing from
// tests/prod/prod-routing.env) against the Neon TEST branch and real Azure; Playwright Chromium at the owner's phone
// geometry (393x876, touch, DPR 2.75) with the CPU throttled 4x (CDP) and a 4G-like link (RTT, bandwidth: --rtt).
// Per run: the child's home is open and settled; the harness taps Start; t0 = the tap's pointerdown on the page clock;
// her first sound = the first AudioBufferSourceNode.start the page makes (+ its scheduled lead). The page's /api timeline
// (start, stt-token, studio/viewport, tts-stream, ...) is kept per run, relative to the tap.
//   node evals/latency/start-phone.mjs [--n 30] [--root DIR] [--cold] [--rtt 60] [--cpu 4] [--out file.json] [--label x]
//   --root DIR   serve another tree (a base worktree with its own dist/: the "before" arm)
//   --cold       a fresh server process per run (the first start after a deploy / scale-up)
// Not a child, not India: a US container to Azure + Neon; label numbers accordingly.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

const REPO = new URL("../..", import.meta.url).pathname;
const argv = process.argv;
const arg = (k, d) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : d; };
const N = Number(arg("--n", 30)), ROOT = path.resolve(arg("--root", REPO)) + "/", COLD = argv.includes("--cold");
const RTT = Number(arg("--rtt", 60)), CPU = Number(arg("--cpu", 4)), OUT = arg("--out"), LABEL = arg("--label", "");
const envOf = (f) => Object.fromEntries(fs.readFileSync(f, "utf8").split("\n").map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^"(.*)"$/, "$1")]));
const local = envOf(REPO + ".env.local"), routing = envOf(REPO + "tests/prod/prod-routing.env");
const TEST = local.CONDUCTOR_TEST_DATABASE_URL || local.TEST_DATABASE_URL;
if (!TEST) throw new Error("no TEST database url");
Object.assign(process.env, local, { DATABASE_URL: TEST, TAXILA_DB: "test" });
const PORT = 8700 + Math.floor(Math.random() * 200), BASE = `http://127.0.0.1:${PORT}`;
const serverEnv = { ...process.env, ...routing, DATABASE_URL: TEST, TAXILA_DB: "test", NODE_ENV: "production", PORT: String(PORT), TAXILA_TRACE: "off" };

let server = null;
async function up() {
  // --server-node-args "--cpu-prof ..." --server-entry file: profile the server (an entry that exits cleanly on SIGTERM)
  const nodeArgs = arg("--server-node-args", "").split(" ").filter(Boolean);
  server = spawn(process.execPath, [...nodeArgs, arg("--server-entry", ROOT + "server/serve.mjs")], { env: serverEnv, cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
  for (let i = 0; i < 120; i++) { try { if ((await fetch(`${BASE}/api/health`)).ok) return; } catch { /* booting */ } await new Promise((r) => setTimeout(r, 250)); }
  throw new Error("server did not come up");
}
const down = async () => { if (server) { server.kill(); await new Promise((r) => setTimeout(r, 400)); server = null; } };

const { q, one } = await import(REPO + "server/db.js");
const { hashPassword } = await import(REPO + "server/auth.js");
const RUN = randomUUID().slice(0, 8);
const g = (await one("insert into guardian (email, pw_hash, name) values ($1, $2, 'r5 phone') returning id", [`r5-phone+${RUN}@test.invalid`, hashPassword("pw-" + RUN)])).id;
const tok = randomUUID() + randomUUID();
await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(tok).digest("hex"), g]);
for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [g, p]);

const INIT = () => {
  if (window.top !== window) return;
  const T = () => performance.now();
  const R = (window.__r5 = { audio: [], net: [], tap: null });
  const oStart = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when = 0, ...rest) {
    try { const lead = Math.max(0, (when || 0) - this.context.currentTime); R.audio.push({ t: T() + lead * 1000, dur: this.buffer?.duration ?? null }); } catch { /* */ }
    return oStart.call(this, when, ...rest);
  };
  const of = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    const rec = /\/api\//.test(url) ? { path: url.replace(location.origin, "").split("?")[0], t0: T(), method: init?.method || "GET" } : null;
    if (rec) R.net.push(rec);
    try {
      const res = await of.apply(this, arguments);
      if (rec) { rec.t1 = T(); rec.status = res.status; }
      // the server's own stage marks for the start (debug timings: a local, non-hosted server returns them)
      if (rec && rec.path === "/api/lesson/start") res.clone().json().then((j) => { rec.marks = (j.debug?.timings ?? []).filter((x) => String(x.kind).startsWith("@") || x.deployment).map((x) => `${x.deployment ?? x.kind.slice(1)}@${x.ms}`).join(" "); }).catch(() => {});
      return res;
    }
    catch (e) { if (rec) { rec.t1 = T(); rec.err = String(e?.message ?? e).slice(0, 80); } throw e; }
  };
  window.addEventListener("pointerdown", () => { if (R.tap == null) R.tap = T(); }, true);
};

const pct = (a, p) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]) : null; };
const { chromium } = await import("playwright");
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const rows = [];
try {
  if (!COLD) await up();
  for (let i = 0; i < N; i++) {
    if (COLD) { await down(); await up(); }
    const kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id, avatar) values ($1, $2, 4, 'hinglish', 'asha', 'tiger-cub') returning id", [g, ["Riya", "Aarav", "Meera", "Kabir"][i % 4]])).id;
    await q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')
      on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 45`, [kid]);
    const ctx = await browser.newContext({ viewport: { width: 393, height: 876 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true,
      userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36" });
    await ctx.addCookies([{ name: "tx_session", value: tok, url: BASE }]);
    await ctx.addInitScript(INIT);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await cdp.send("Network.enable");
    // per-request network phases (CDP): queued until the connection was free, then sent, then the headers came
    const netT = new Map();
    cdp.on("Network.requestWillBeSent", (e) => { if (/\/api\//.test(e.request.url)) netT.set(e.requestId, { path: new URL(e.request.url).pathname, sentAt: e.timestamp * 1000, conn: null }); });
    cdp.on("Network.responseReceived", (e) => {
      const r = netT.get(e.requestId); const tm = e.response.timing;
      if (r && tm) Object.assign(r, { queuedMs: Math.round(tm.requestTime * 1000 - r.sentAt), stalledMs: Math.round(tm.sendStart), headersMs: Math.round(tm.receiveHeadersEnd - tm.sendEnd), conn: e.response.connectionId, proto: e.response.protocol });
    });
    // --down / --up in kbps (default a 4G-like 9 Mbps / 3 Mbps; Chrome's "Slow 3G" is --rtt 400 --down 400 --up 400)
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: RTT, downloadThroughput: Number(arg("--down", 9000)) * 1000 / 8, uploadThroughput: Number(arg("--up", 3000)) * 1000 / 8 });
    cdp.on("Network.loadingFinished", (e) => { const r = netT.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
    let row = { i, kid };
    try {
      await page.goto(`${BASE}/c/${kid}${arg("--query", "") ? `?${arg("--query")}` : ""}`, { waitUntil: "commit", timeout: 120_000 });
      // a first-time child lands on the hello screen (the AI disclosure): its "Got it" opens the first lesson, so that tap
      // is this child's Start (Hello.tsx nav /lesson/new); a returning child taps the home's Start
      const start = page.locator('[data-testid="start-lesson"]').or(page.getByRole("button", { name: /got it/i })).first();
      await start.waitFor({ state: "visible", timeout: 120_000 });
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(800);
      await page.evaluate(() => { window.__r5.net.length = 0; window.__r5.audio.length = 0; window.__r5.tap = null; });
      row.url = page.url().replace(BASE, "");
      const PROFILE = arg("--profile", null);
      if (PROFILE) { await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 500 }); await cdp.send("Profiler.start"); }
      await start.tap();
      const t = await page.waitForFunction(() => window.__r5.audio.length > 0 && window.__r5.tap != null ? { tap: window.__r5.tap, first: window.__r5.audio[0].t } : null, null, { timeout: 30_000, polling: 50 }).then((h) => h.jsonValue()).catch(() => null);
      const R = await page.evaluate(() => window.__r5);
      if (arg("--profile", null)) { const { profile } = await cdp.send("Profiler.stop"); fs.writeFileSync(`${arg("--profile")}-${i}.cpuprofile`, JSON.stringify(profile)); }
      const tap = R.tap ?? t?.tap;
      row.firstSoundMs = t ? Math.round(t.first - t.tap) : null;
      row.net = R.net.map((n) => ({ path: n.path, m: n.method, at: Math.round(n.t0 - tap), ms: n.t1 != null ? Math.round(n.t1 - n.t0) : null, status: n.status ?? n.err ?? null }));
      const st = row.net.find((n) => n.path === "/api/lesson/start");
      row.startPostAt = st?.at ?? null; row.startMs = st?.ms ?? null;
      row.startMarks = R.net.find((n) => n.path === "/api/lesson/start")?.marks ?? null;
      // the opening's audio: bytes on the wire and the full transfer (the stream ends after her last word)
      await page.waitForTimeout(Number(arg("--settle", 0)));
      row.cdp = [...netT.values()].filter((r) => r.queuedMs != null).map((r) => ({ path: r.path, queued: r.queuedMs + r.stalledMs, server: r.headersMs, conn: r.conn, proto: r.proto, bytes: r.bytes ?? null }));
      row.ttsBytes = row.cdp.filter((c) => /tts-stream|turn-audio/.test(c.path)).reduce((a, c) => a + (c.bytes ?? 0), 0) || null;
      const cs = row.cdp.find((r) => r.path === "/api/lesson/start");
      row.startQueuedMs = cs?.queued ?? null;
      const tts = row.net.find((n) => /tts-stream|turn-audio/.test(n.path));
      row.ttsAt = tts?.at ?? null; row.ttsHeadersMs = tts?.ms ?? null;
      if (row.firstSoundMs == null) row.shot = await page.screenshot({ path: path.join(REPO, `node_modules/.r5-start-fail-${i}.png`) }).then(() => `node_modules/.r5-start-fail-${i}.png`).catch(() => null);
    } catch (e) {
      row.error = String(e?.message ?? e).slice(0, 200); row.url = page.url().replace(BASE, "");
      await page.screenshot({ path: path.join(REPO, `node_modules/.r5-start-fail-${i}.png`) }).catch(() => {});
    }
    rows.push(row);
    console.log(`[${i}] ${row.url ?? ""} first sound ${row.firstSoundMs ?? "—"} ms | start POST at +${row.startPostAt} took ${row.startMs} | tts at +${row.ttsAt} (${row.ttsHeadersMs}) ${row.error ?? ""}\n     server: ${row.startMarks ?? "-"}\n     cdp: ${(row.cdp ?? []).map((c) => `${c.path.replace("/api/", "")} q${c.queued} s${c.server} c${c.conn} ${c.proto}`).join(" | ")}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  await down();
  await q("delete from guardian where id = $1", [g]).catch(() => {});
}
const ok = rows.filter((r) => r.firstSoundMs != null);
const summary = { label: LABEL, root: ROOT === REPO ? "working tree" : ROOT, cold: COLD, rtt: RTT, cpu: CPU, n: rows.length, ok: ok.length, at: new Date().toISOString(),
  firstSound: { p50: pct(ok.map((r) => r.firstSoundMs), 0.5), p90: pct(ok.map((r) => r.firstSoundMs), 0.9) },
  startPostAt: { p50: pct(ok.map((r) => r.startPostAt), 0.5) }, startMs: { p50: pct(ok.map((r) => r.startMs), 0.5), p90: pct(ok.map((r) => r.startMs), 0.9) },
  ttsAt: { p50: pct(ok.map((r) => r.ttsAt), 0.5) } };
console.log(JSON.stringify(summary, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ summary, rows }, null, 1));
process.exit(0);
