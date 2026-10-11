// Release 12 · T-client, the replay END TO END on TEST (main's ask after release 12 went live): a tier-2 lesson records
// through the REAL API into the Neon TEST branch, and `scripts/trace.mjs --replay <pid> --at hh:mm:ss` (T-server's CLI,
// which spawns scripts/trace-replay.mjs) rebuilds the PNG from what was stored: the rrweb.chunk rows in trace_event and
// each chunk's blob by data.blob.ref. The replay is compared with the screenshot Playwright took at that second.
//   - API: server/index.js in-process on :8790 (the vite dev proxy's target), DATABASE_URL = CONDUCTOR_TEST_DATABASE_URL
//     (refuses when that is the production host), TAXILA_TRACE_FULL_FOR = this run's own guardian, so the account is
//     tier 2 by the server's word (the harness does not force the tier: &real=1).
//   - Blobs: the one stubbed transport. No storage credentials in this container, so _setTraceBlobDeps writes each PUT to
//     a temp directory at its blob path, and the replay reads it with TAXILA_TRACE_BLOB_DIR. The Azure GET in
//     scripts/trace-replay.mjs (readTraceBlob, the same SharedKey signer the PUT uses) is NOT exercised here.
//   - Page: the recorder harness on the scripted lesson (real LessonRuntime, scripted Director), cookie tx_session.
// Writes docs/design/round4/build/r12/t-client/replay-e2e.json and the pair; deletes its guardian (trace rows cascade).
// Also main's flag check: after "Flag this moment" the note field shows, keeps focus and stays open; the note lands on TEST.
// Exit 1 when the replay is missing or differs by more than 4 tiles (the gate of r12-t-client-replay.mjs), or the flag fails.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_USE_ENV_PROXY=1 node tests/prod/r12-t-client-replay-e2e.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { chromium } from "playwright";
import { startVite } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname, PORT = 5208, ORIGIN = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, "docs/design/round4/build/r12/t-client");
const envFile = path.join(ROOT, ".env.local");
const fromEnvFile = (name) => (fs.existsSync(envFile) ? (fs.readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = fromEnvFile("DATABASE_URL");
if (!TEST) { console.error("CONDUCTOR_TEST_DATABASE_URL not set"); process.exit(2); }
const TEST_ENV = (process.env.TAXILA_DB || fromEnvFile("TAXILA_DB")) === "test"; // this container's DATABASE_URL is itself the TEST branch
if (!TEST_ENV && PROD && hostOf(TEST) === hostOf(PROD)) { console.error("CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION endpoint: refusing"); process.exit(2); }
process.env.DATABASE_URL = TEST;
process.env.TAXILA_DB = "test";
process.env.CONDUCTOR_TEST_DATABASE_URL = TEST;
const OWNER = `r12-tclient+${randomUUID().slice(0, 8)}@test.invalid`;
process.env.TAXILA_TRACE_FULL_FOR = OWNER;
process.env.TAXILA_TRACE = "on";
// POST /api/trace/blob answers 503 unless storage looks configured; these placeholders are never used to sign anything
// (the transport is stubbed below) and are not credentials
process.env.AZURE_STORAGE_ACCOUNT ||= "r12stubaccount";
process.env.AZURE_STORAGE_KEY ||= Buffer.from("r12-stub-not-a-key").toString("base64");
const BLOBS = fs.mkdtempSync(path.join(os.tmpdir(), "r12-trace-blobs-"));

const { q, one } = await import("../../server/db.js");
const { _setTraceBlobDeps } = await import("../../server/trace/blob.js");
const puts = [];
_setTraceBlobDeps({
  put: async (p, buf) => { const f = path.join(BLOBS, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); puts.push({ path: p, bytes: buf.length }); },
  del: async (p) => { fs.rmSync(path.join(BLOBS, p), { force: true }); },
});
const { handle } = await import("../../server/index.js");
const server = http.createServer(handle);
await new Promise((r, j) => { server.once("error", j); server.listen(8790, "127.0.0.1", r); });

const { hashPassword } = await import("../../server/auth.js");
const g = (await one("insert into guardian (email, pw_hash, name) values ($1, $2, 'r12 t-client') returning id", [OWNER, hashPassword("pw-12345678")])).id;
const tok = randomUUID() + randomUUID();
await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(tok).digest("hex"), g]);

const stopVite = await startVite(ROOT, PORT);
const browser = await chromium.launch();
let out = { ok: false }, pid = null, flag = null;
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await ctx.addCookies([{ name: "tx_session", value: tok, url: ORIGIN }]);
  const p = await ctx.newPage();
  await p.goto(`${ORIGIN}/src/trace/dev/lesson.html?class=7&live=1&look=volt&motion=reduced&real=1`);
  // the REC chip appears only once the server's batch response has said tier 2
  await p.waitForSelector('[data-testid="rec-chip"]', { timeout: 60_000 });
  await p.waitForFunction(() => window.__k1?.floor === "your_turn", null, { timeout: 60_000 });
  await p.evaluate(() => window.__k1.send("two"));
  await p.waitForFunction(() => window.__k1?.floor !== "your_turn", null, { timeout: 10_000 }).catch(() => {});
  await p.waitForFunction(() => window.__k1?.floor === "your_turn", null, { timeout: 30_000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const t = await p.evaluate(() => Date.now());
  const shot = path.join(OUT, "shot-e2e.png");
  await p.screenshot({ path: shot });
  pid = await p.evaluate(() => window.__traceEvents.find((e) => e.pid)?.pid);
  const sids = await p.evaluate(() => [...new Set(window.__traceEvents.map((e) => e.sid))]);
  // main's report: after "Flag this moment" the note field did not appear in time, and the menu may close first.
  // The field must be there, focused, and still there a moment later; the note must reach TEST as flag.note.
  await p.click('[data-testid="more"]');
  await p.click('[data-testid="flag-moment"]');
  const noteNow = await p.waitForSelector('[data-testid="flag-note"]', { timeout: 1000 }).then(() => true, () => false);
  await p.waitForTimeout(800);
  flag = { noteShown: noteNow, noteStillOpen: await p.isVisible('[data-testid="flag-note"]'), noteFocused: await p.evaluate(() => document.activeElement?.getAttribute("data-testid") === "flag-note") };
  if (flag.noteStillOpen) { await p.keyboard.type("r12 e2e flag note", { delay: 5 }); await p.click('[data-testid="flag-save"]'); }
  flag.menuClosedAfterSave = !(await p.isVisible('[data-testid="flag-note"]'));
  await p.waitForTimeout(1000);
  await p.evaluate(() => window.__traceStop()); // the last chunk goes up now, and its rrweb.chunk event with the next batch
  await p.waitForTimeout(4500);
  await ctx.close();

  const stored = await q("select sid, kind, tier, data from trace_event where pid = $1 and kind like 'rrweb.%' order by t, seq", [pid]);
  const flagRows = await q("select kind, tier, data from trace_event where pid = $1 and kind like 'flag.%' order by t, seq", [pid]);
  flag.stored = flagRows.map((x) => ({ kind: x.kind, tier: x.tier, n: x.data?.n, note: x.data?.note ?? null, floor: x.data?.floor ?? null }));
  const at = new Date(t).toISOString().slice(11, 23); // hh:mm:ss.mmm, UTC
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "r12-replay-out-"));
  const r = spawnSync(process.execPath, ["scripts/trace.mjs", "--replay", pid, "--at", at, "--out", dir], { cwd: ROOT, encoding: "utf8", env: { ...process.env, TAXILA_TRACE_BLOB_DIR: BLOBS } });
  const png = fs.readdirSync(dir).find((f) => f.endsWith(".png"));
  let cmp = null;
  if (png) {
    const rep = path.join(OUT, "replay-e2e.png");
    fs.copyFileSync(path.join(dir, png), rep);
    cmp = JSON.parse(execFileSync("python3", ["-c", `
import sys, json
from PIL import Image, ImageChops
a = Image.open(sys.argv[1]).convert("RGB"); b = Image.open(sys.argv[2]).convert("RGB")
if a.size != b.size: b = b.resize(a.size)
d = ImageChops.difference(a, b).convert("L")
px = list(d.getdata()); n = len(px)
W, H = d.size; T = 32; bad = []
for ty in range(0, H, T):
    for tx in range(0, W, T):
        t = d.crop((tx, ty, min(W, tx + T), min(H, ty + T))); tp = list(t.getdata())
        if sum(1 for v in tp if v > 32) / len(tp) > 0.10: bad.append([tx, ty])
s = Image.new("RGB", (a.width * 2 + 12, a.height), (255, 0, 160)); s.paste(a, (0, 0)); s.paste(b, (a.width + 12, 0)); s.save(sys.argv[3])
print(json.dumps({"size": list(a.size), "differingPx": round(sum(1 for v in px if v > 32) / n * 100, 3), "differentTiles": len(bad), "tiles": bad[:12]}))
`, shot, rep, path.join(OUT, "pair-e2e.png")], { encoding: "utf8" }));
  }
  out = {
    date: new Date().toISOString(),
    method: "scripted lesson (real LessonRuntime, scripted Director) on the vite dev server; the REAL API in-process on the Neon TEST branch; tier 2 by TAXILA_TRACE_FULL_FOR; blob transport stubbed to a temp dir (no storage credentials); replay = `node scripts/trace.mjs --replay <pid> --at <hh:mm:ss.mmm UTC> --out <dir>` with TAXILA_TRACE_BLOB_DIR; Playwright Chromium 412x915 DPR 1, reduced motion. Adult-run lab harness: no child.",
    command: `TAXILA_DB=test TAXILA_TRACE_BLOB_DIR=<dir> node scripts/trace.mjs --replay ${pid} --at ${at} --out <dir>`,
    sessions: sids.length, blobsPut: puts.length, blobBytes: puts.reduce((n, x) => n + x.bytes, 0),
    stored: { chunks: stored.filter((x) => x.kind === "rrweb.chunk").length, withRef: stored.filter((x) => x.data?.blob?.ref).length, tier2: stored.every((x) => x.tier === 2), kinds: [...new Set(stored.map((x) => x.kind))] },
    replayLog: (r.stderr || "").split("\n").filter((l) => l.startsWith("[replay]")),
    replayExit: r.status, replayPrinted: (r.stdout || "").trim().split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return l; } }),
    screenshot: path.relative(ROOT, shot), replay: png ? "docs/design/round4/build/r12/t-client/replay-e2e.png" : null, pair: png ? "docs/design/round4/build/r12/t-client/pair-e2e.png" : null,
    ...cmp,
    flag,
  };
  if (r.status !== 0) console.error(r.stderr);
  out.flagOk = flag.noteShown && flag.noteStillOpen && flag.noteFocused && flag.menuClosedAfterSave && flag.stored.some((x) => x.kind === "flag.owner") && flag.stored.some((x) => x.kind === "flag.note" && x.note === "r12 e2e flag note");
  out.ok = r.status === 0 && !!png && out.stored.withRef > 0 && cmp.differentTiles <= 4 && out.flagOk;
} finally {
  await browser.close();
  stopVite();
  await q("delete from guardian where id = $1", [g]).catch(() => {});
  // rows the server kept without a guardian (none expected: the session cookie is on every request) go too
  if (pid) await q("delete from trace_event where pid = $1", [pid]).catch(() => {});
  server.close();
  fs.rmSync(BLOBS, { recursive: true, force: true });
}
fs.writeFileSync(path.join(OUT, "replay-e2e.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
process.exit(out.ok ? 0 : 1);
