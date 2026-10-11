// Release 12.1 proof (main's ask, 2026-10-11): a TIER-2 lesson recorded through a PACKAGED production build against the
// TEST branch, then `scripts/trace.mjs --session <child-prefix>` and `--replay <child-prefix> --at …` produce the merged
// timeline and a PNG of what the screen showed. Real Azure (one lesson start); the rrweb chunks go to the private "trace"
// container (or, without the storage key, TAXILA_TRACE_BLOB_DIR); the account is deleted at the end through DELETE /api/account (rows and blobs cascade).
//   npx vite build && node --env-file=.env.local docs/design/round4/build/r12/t-server/replay-proof.mjs
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../../../../", import.meta.url));
const OUT = fileURLToPath(new URL("./", import.meta.url));
const TEST = process.env.TEST_DATABASE_URL || process.env.CONDUCTOR_TEST_DATABASE_URL;
if (!TEST) throw new Error("TEST_DATABASE_URL not set");
process.env.DATABASE_URL = TEST; // the server and every script below get DATABASE_URL = TEST explicitly
const RUN = randomUUID().slice(0, 8);
const EMAIL = `r12-replay-proof+${RUN}@taxila.test`, PW = `pw-${RUN}-proof`;
const PORT = 8600 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;
const routing = Object.fromEntries(fs.readFileSync(`${ROOT}tests/prod/prod-routing.env`, "utf8").split("\n")
  .filter((l) => /^[A-Z_0-9]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const env = { ...process.env, ...routing, DATABASE_URL: TEST, TAXILA_DB: "test", NODE_ENV: "production", PORT: String(PORT),
  TAXILA_TRACE_FULL_FOR: EMAIL, TAXILA_TRACE: "on",
  // this container has no storage key: the blobs go to a local directory (server/trace/blob.js TAXILA_TRACE_BLOB_DIR);
  // with AZURE_STORAGE_ACCOUNT / _KEY set and this unset, the same run uses the private "trace" container
  ...(process.env.AZURE_STORAGE_KEY ? {} : { TAXILA_TRACE_BLOB_DIR: fs.mkdtempSync(`${ROOT}node_modules/.trace-blobs-`) }) };
const hhmmss = (t) => new Date(t).toISOString().slice(11, 19);

const { q, one } = await import(`${ROOT}server/db.js`);
const { hashPassword } = await import(`${ROOT}server/auth.js`);
const server = spawn(process.execPath, [`${ROOT}server/serve.mjs`], { env, stdio: ["ignore", "ignore", "inherit"] });
let gid = null;
const log = [];
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${BASE}/api/health`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 500)); }
  // the account: guardian, session, consents, one child (as the DB tests make it)
  gid = (await one("insert into guardian (email, pw_hash, name) values ($1, $2, 'r12 proof') returning id", [EMAIL, hashPassword(PW)])).id;
  const tok = randomUUID() + randomUUID();
  await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(tok).digest("hex"), gid]);
  for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [gid, p]);
  const kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Riya', 4, 'hinglish', 'asha') returning id", [gid])).id;
  await q(`insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')
    on conflict (child_id) do update set hours_start = '00:00', hours_end = '23:59', daily_minutes = 45`, [kid]);
  const me = await (await fetch(`${BASE}/api/me`, { headers: { cookie: `tx_session=${tok}` } })).json();
  log.push(`GET /api/me trace = ${JSON.stringify(me.trace)}`);
  if (me.trace?.tier !== 2) throw new Error("the proof account is not tier 2");

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await ctx.addCookies([{ name: "tx_session", value: tok, url: BASE }]);
  const page = await ctx.newPage();
  const blobs = [];
  page.on("response", (r) => { if (r.url().includes("/api/trace/blob")) blobs.push(r.status()); });
  await page.goto(`${BASE}/c/${kid}/lesson/new`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(8000);
  // the lesson opens behind the audio gate (a browser needs a tap before it may play sound): the child taps it
  await page.getByRole("button", { name: /tap to hear/i }).click({ timeout: 20_000 });
  log.push(`tapped "Tap to hear" at ${new Date().toISOString()}`);
  await page.waitForTimeout(30_000); // the lesson starts (real model call) and her first line is on screen
  const shotAt = Date.now();
  await page.screenshot({ path: `${OUT}proof-screen.png` });
  log.push(`screenshot at ${new Date(shotAt).toISOString()} (${page.url().replace(BASE, "")})`);
  await page.waitForTimeout(12_000); // the next rrweb chunk (every 10 s) carries that moment
  await page.goto("about:blank"); // pagehide: the last chunk goes as a beacon
  await page.waitForTimeout(3000);
  await browser.close();
  log.push(`POST /api/trace/blob statuses: ${JSON.stringify(blobs)}`);

  const prefix = kid.slice(0, 8);
  const run = (args) => spawnSync(process.execPath, [`${ROOT}scripts/trace.mjs`, ...args], { env, encoding: "utf8", timeout: 240_000 });
  await new Promise((r) => setTimeout(r, 2500)); // the server's writer flushes every second
  const sess = run(["--session", prefix]);
  fs.writeFileSync(`${OUT}proof-session.txt`, sess.stdout + (sess.stderr ? `\n[stderr]\n${sess.stderr}` : ""));
  const rep = run(["--replay", prefix, "--at", hhmmss(shotAt), "--out", `${OUT}proof-replay`]);
  log.push(`trace.mjs --replay ${prefix} --at ${hhmmss(shotAt)} → exit ${rep.status}\n${rep.stdout}${rep.stderr}`);
  const pngs = fs.existsSync(`${OUT}proof-replay`) ? fs.readdirSync(`${OUT}proof-replay`).filter((f) => f.endsWith(".png")) : [];
  log.push(`replay PNGs: ${JSON.stringify(pngs)}`);

  // erase: the account through the parent corner's DELETE (trace rows and blobs cascade)
  const g0 = gid;
  const del = await fetch(`${BASE}/api/account`, { method: "DELETE", headers: { cookie: `tx_session=${tok}`, "content-type": "application/json" }, body: JSON.stringify({ password: PW, confirm: true }) });
  log.push(`DELETE /api/account ${del.status}`);
  if (del.status === 200) gid = null;
  await new Promise((r) => setTimeout(r, 2500));
  const left = await q("select count(*)::int as n from trace_event where cid = $1 or gid = $2", [kid, g0]);
  log.push(`trace rows of the child left after the erasure: ${left[0].n}`);
} finally {
  if (gid) await q("delete from guardian where id = $1", [gid]).catch(() => {});
  server.kill();
  fs.writeFileSync(`${OUT}proof-log.txt`, log.join("\n") + "\n");
  console.log(log.join("\n"));
  process.exit(0);
}
