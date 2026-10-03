// Playwright visual checks for the lesson-truth workstream (PRODUCT-DESIGN-V2 §6.3.3 child home, §3.8 / §6.3.7
// Garden and Sky; audit #9: GET /api/child/plan and /api/child/map returned 404, so the home had no primary action
// after a lesson and the map was an empty navy rectangle). Standalone, not part of `npm test`:
//
//   NODE_USE_ENV_PROXY=1 PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/e2e-design-lesson-truth.mjs \
//     [--root <tree whose server/ to run; default this one>] [--tag after] [--dist <built SPA>] [--no-assert]
//
// It builds the SPA (vite build → a temp dir) unless --dist is given, runs `server/serve.mjs` of --root on a spare
// port against the Neon TEST branch (CONDUCTOR_TEST_DATABASE_URL; it refuses the production endpoint), seeds a
// guardian with two children through the API (Kabir, class 8, first day; Riya, class 3, a lesson finished today
// with graded turns), and shoots home + map at 360x640 and 1280x800, light and dark, into
// docs/design/build/lesson-truth/<screen>-<w>-<scheme>-<tag>.png. Run with --root at a pre-change tree and
// --tag before --no-assert for the before shots.
//
// Checks (V-LT*), asserted unless --no-assert:
//   V-LT1  every /api/child/plan and /api/child/map request the screens make answers 200 (never 404)
//   V-LT2  the home's state comes from the server: Kabir (first day) shows the start-lesson action; Riya (a lesson
//          finished today, fresh browser storage so no local marker) shows the done home
//   V-LT3  the Sky map is not empty: its list view names a skill the server marked learned
//   V-LT4  the plan's teacher record is the child's teacher (Arjun, "he") — one source for every surface
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn, execFileSync } from "child_process";
import { randomUUID } from "crypto";

const HERE = new URL("..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = path.resolve(arg("--root", HERE));
const TAG = arg("--tag", "after");
const ASSERT = !process.argv.includes("--no-assert");
const OUT = path.join(HERE, "docs/design/build/lesson-truth");
fs.mkdirSync(OUT, { recursive: true });
const env = {};
for (const line of fs.readFileSync(path.join(HERE, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || env.CONDUCTOR_TEST_DATABASE_URL;
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
if (!TEST) { console.log("skip: CONDUCTOR_TEST_DATABASE_URL not set"); process.exit(0); }
if (hostOf(TEST) === hostOf(env.DATABASE_URL)) { console.error("refusing: the test URL is the production endpoint"); process.exit(1); }

let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-lt-dist-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: HERE, stdio: "ignore" });
}
const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], {
  env: { ...process.env, ...env, DATABASE_URL: TEST, PORT: String(PORT), TAXILA_DIST: dist, NODE_USE_ENV_PROXY: "1" }, stdio: ["ignore", "pipe", "pipe"],
});
let srvLog = "";
srv.stdout.on("data", (d) => { srvLog += d; }); srv.stderr.on("data", (d) => { srvLog += d; });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`${BASE}/api/health`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 200)); }

// ── seed through the API (and one ended lesson row through the test database) ──
let cookie = "";
const api = async (method, p, body) => {
  const r = await fetch(BASE + p, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const set = r.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${p} ${r.status} ${JSON.stringify(j)}`);
  return j;
};
const RUN = randomUUID().slice(0, 8);
const password = `pw-${RUN}-x9`;
await api("POST", "/api/auth/signup", { email: `lt-e2e+${RUN}@test.invalid`, password, name: "LT e2e", isGuardianAdult: true });
const { child: kabir } = await api("POST", "/api/children", { firstName: "Kabir", classLevel: 8, languagePref: "hinglish", interests: ["Cricket", "Space"] });
const { child: riya } = await api("POST", "/api/children", { firstName: "Riya", classLevel: 3, languagePref: "hinglish", interests: ["Drawing"] });
for (const c of [kabir, riya]) await api("POST", "/api/consent", { childId: c.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
process.env.DATABASE_URL = TEST;
const { q, one } = await import(path.join(HERE, "server/db.js"));
const { nextTopicFor } = await import(path.join(HERE, "server/content/next-topic.js"));
const { kitFromFile } = await import(path.join(HERE, "server/content/kits.js"));
const { getTopic } = await import(path.join(HERE, "server/content/curriculum.js"));
const rTopic = await nextTopicFor({ id: riya.id, class_level: 3 });
const rKit = kitFromFile(getTopic(rTopic.id));
const did = rKit.items.filter((i) => i.kind === "practice").slice(0, 2).map((it, k) => ({ kind: "item", itemId: it.id, ask: it.prompt_hi, answer: String(it.answer),
  verdict: "correct", withHelp: k === 1, verified: true, seq: 4 + 2 * k, turn: 2 + k }));
await one("insert into lesson (child_id, topic_id, state, ended_at, started_at) values ($1, $2, $3, now(), now() - interval '14 minutes') returning id",
  [riya.id, rTopic.id, { minutes: 14, did, phase: "done", ctx: { nextTitle: "Next time" } }]);
const kTopic = await nextTopicFor({ id: kabir.id, class_level: 8 });
const learned = kitFromFile(getTopic(kTopic.id)).skills[0];
await q("insert into skill_state (child_id, skill_id, p_known, status, attempts, correct_unaided) values ($1, $2, 0.82, 'learned_today', 3, 2)", [kabir.id, learned.id]);

// ── shoot ──
const { chromium } = await import("playwright");
const browser = await chromium.launch();
const results = { tag: TAG, root: ROOT, statuses: [], checks: {}, shots: [] };
const fail = [];
const check = (id, ok, detail) => { results.checks[id] = results.checks[id] === false ? false : !!ok; if (!ok) fail.push(`${id}: ${detail}`); };
const [ck, cv] = cookie.split("=");
for (const [w, h] of [[360, 640], [1280, 800]]) {
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, colorScheme: scheme, hasTouch: w < 500 });
    await ctx.addCookies([{ name: ck, value: cv, url: BASE }]);
    const page = await ctx.newPage();
    page.on("response", (r) => { const u = new URL(r.url()); if (u.pathname.startsWith("/api/child/")) results.statuses.push({ path: u.pathname, status: r.status(), w, scheme }); });
    const shot = async (name) => {
      const f = path.join(OUT, `${name}-${w}-${scheme}-${TAG}.png`);
      await page.screenshot({ path: f, fullPage: false });
      results.shots.push(path.relative(HERE, f));
    };
    const settle = async () => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(600); };
    // Kabir: first day → the start action
    await page.goto(`${BASE}/c/${kabir.id}`);
    await settle();
    const kHome = await page.locator("[data-testid=home]").getAttribute("data-home").catch(() => null);
    check("V-LT2", kHome === "default" && (await page.locator("[data-testid=start-lesson]").count()) > 0, `Kabir home=${kHome}`);
    await shot("home-kabir-first");
    // Riya: a lesson finished today, fresh storage (no local marker) → done from the server
    await page.goto(`${BASE}/c/${riya.id}`);
    await settle();
    const rHome = await page.locator("[data-testid=home]").getAttribute("data-home").catch(() => null);
    check("V-LT2", rHome === "done", `Riya home=${rHome} (a lesson finished today)`);
    await shot("home-riya-done");
    // Kabir's Sky map, then its list
    await page.goto(`${BASE}/c/${kabir.id}/map`);
    await settle();
    await shot("map-kabir-sky");
    const listTab = page.locator("[role=tab]").nth(1);
    if (await listTab.count()) { await listTab.click(); await page.waitForTimeout(300); }
    const text = await page.locator("main").innerText().catch(() => "");
    check("V-LT3", text.includes(learned.title), `the list view does not name "${learned.title}"`);
    await shot("map-kabir-list");
    await page.goto(`${BASE}/c/${riya.id}/map`);
    await settle();
    await shot("map-riya-garden");
    await ctx.close();
  }
}
await browser.close();
check("V-LT1", results.statuses.length > 0 && results.statuses.every((s) => s.status === 200), JSON.stringify(results.statuses.filter((s) => s.status !== 200).slice(0, 4)));
const plan = await fetch(`${BASE}/api/child/plan?childId=${kabir.id}`, { headers: { cookie } }).then((r) => (r.ok ? r.json() : null));
check("V-LT4", plan?.teacher?.name === "Arjun" && plan.teacher.pronouns?.subject === "he", JSON.stringify(plan?.teacher ?? null));
results.plan = plan ? { state: plan.state, topic: plan.topic?.shortTitle, teacher: plan.teacher?.name } : null;

// ── clean up ──
await api("DELETE", "/api/children", { childId: kabir.id, password }).catch(() => {});
await api("DELETE", "/api/children", { childId: riya.id, password }).catch(() => {});
await q("delete from guardian where email = $1", [`lt-e2e+${RUN}@test.invalid`]).catch(() => {});
srv.kill();
fs.writeFileSync(path.join(OUT, `checks-${TAG}.json`), JSON.stringify(results, null, 1));
console.log(JSON.stringify({ tag: TAG, checks: results.checks, statuses: [...new Set(results.statuses.map((s) => `${s.path} ${s.status}`))], shots: results.shots.length }, null, 1));
if (ASSERT && fail.length) { console.error("FAIL\n" + fail.join("\n")); if (process.env.LT_DEBUG) console.error(srvLog.slice(-3000)); process.exit(1); }
process.exit(0);
