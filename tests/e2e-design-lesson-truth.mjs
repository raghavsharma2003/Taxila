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
// Checks, asserted unless --no-assert (or only the SERVER tier with --server-only). Two tiers, reported apart:
//
//   SERVER (this workstream's routes; must pass):
//   V-LT1   every /api/child/plan and /api/child/map request the screens make answers 200 (never 404)
//   V-LT2s  the plan's state is the spec's: Kabir (never had a lesson) "first"; Riya (a lesson finished today with
//           graded turns) "done" with today's DidCards (her own answers, ticks only where the key verified)
//   V-LT3s  the Sky map has a non-empty chapter structure, exactly one "your class is here" chapter, a chapter seal
//           where every skill is got it / secure, and the learned skill in the got_it shape
//   V-LT4   the plan's teacher record is the child's teacher (Arjun, "he") — one source for every surface
//   V-LT5s  the plan is enforced: POST /api/lesson/start for Riya (done today) is 409 "done"
//
//   CLIENT (V2 §6.3.3, §6.3.7, §13.2 V-EN-1 / V-LAYOUT-2 / V-ID-1, §11 targets; the child UI's, open-lt-client-wiring):
//   V-LT2c  the home renders the server's state: Kabir shows "Your first lesson"; Riya shows "Done for today" and a
//           DidCard with her own answer — never the old board alone, never a 404 fallback (data-plan-state if exposed)
//   V-LT3c  the Sky view shows "Your class is here" and a seal, and has no dead zone (V-LAYOUT-2: no element taller
//           than 48 px with no visible content)
//   V-EN-1  English chrome: no Devanagari and no Hinglish chrome word outside [data-speech] on home and map
//   V-TGT   every visible button / link / tab is ≥ 48 px (Older) or ≥ 64 px (Young) in both dimensions
//   V-ID-1  the home carries data-teacher-id="arjun" for Kabir
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
const SERVER_ONLY = process.argv.includes("--server-only");
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
// a chapter Kabir has fully got (the LAST maths chapter, so today's topic and "here" stay where they are) → a seal
const { topicSequence } = await import(path.join(HERE, "server/content/curriculum.js"));
const seq = topicSequence(8, kTopic.subject);
const lastCh = getTopic(seq.at(-1)).chapter.id;
const sealSkills = seq.filter((id) => getTopic(id).chapter.id === lastCh).flatMap((id) => { try { return kitFromFile(getTopic(id)).skills.map((x) => x.id); } catch { return []; } });
for (const id of sealSkills) {
  await q(`insert into skill_state (child_id, skill_id, p_known, status, attempts, correct_unaided) values ($1, $2, 0.85, 'learned_today', 3, 3)
    on conflict (child_id, skill_id) do nothing`, [kabir.id, id]);
}

// ── shoot ──
const { chromium } = await import("playwright");
const browser = await chromium.launch();
const results = { tag: TAG, root: ROOT, statuses: [], checks: {}, shots: [] };
const fail = [];
const TIER = (id) => (/^V-LT(1|2s|3s|4|5s)$/.test(id) ? "server" : "client");
const check = (id, ok, detail) => {
  results.checks[id] = results.checks[id] === false ? false : !!ok;
  if (!ok) fail.push({ id, tier: TIER(id), detail: String(detail).slice(0, 400) });
};
const HINGLISH_CHROME = /(?<![\p{L}])(ghar|ruko|bolo|bas|bhejo|phir|shuru|chalo|paath|abhyaas|pakka|baari|agla|kyun|aata|bagiya|aasmaan|aaj|humne|banaya|abhi\s+nahi|aa\s+gaya|ho\s+gaya|suno|dekho|yahan)(?![\p{L}])/iu;
/** Visible text outside [data-speech] (what she says), per V-EN-1. */
const chromeText = (page) => page.evaluate(() => {
  const out = [];
  const walk = (n) => {
    if (n.nodeType === 3) { if (n.textContent.trim()) out.push(n.textContent.trim()); return; }
    if (n.nodeType !== 1) return;
    const el = /** @type {Element} */ (n);
    if (el.closest("[data-speech]") || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    for (const c of el.childNodes) walk(c);
  };
  walk(document.body);
  for (const el of document.querySelectorAll("[aria-label]")) if (!el.closest("[data-speech]")) out.push(el.getAttribute("aria-label"));
  return out;
});
const smallTargets = (page, min) => page.evaluate((min) => [...document.querySelectorAll("button, a[href], [role=button], [role=tab], input")]
  .filter((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden"; })
  .map((el) => ({ el, r: el.getBoundingClientRect() }))
  .filter(({ r }) => Math.min(r.width, r.height) < min)
  .map(({ el, r }) => `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`), min);
const deadZones = (page) => page.evaluate(() => [...document.querySelectorAll("main *")]
  .filter((el) => { const r = el.getBoundingClientRect(); return r.height > 48 && r.width > 48 && getComputedStyle(el).visibility !== "hidden"; })
  .filter((el) => !el.closest("svg") && !el.innerText?.trim() && !el.querySelector("img, svg, canvas, video, picture") && !["IMG", "CANVAS", "VIDEO", "PICTURE"].includes(el.tagName)
    && !getComputedStyle(el).backgroundImage.includes("url("))
  .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} ${Math.round(el.getBoundingClientRect().height)}px`).slice(0, 4));
const riyaAnswer = did[0]?.answer;
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
    const where = `${w} ${scheme}`;
    const en = async (screen) => {
      const bad = (await chromeText(page)).filter((t) => /[\u0900-\u097F]/.test(t) || HINGLISH_CHROME.test(t));
      check("V-EN-1", bad.length === 0, `${screen} ${where}: ${JSON.stringify(bad.slice(0, 5))}`);
    };
    // Kabir: first day
    await page.goto(`${BASE}/c/${kabir.id}`);
    await settle();
    const kState = await page.locator("[data-plan-state]").first().getAttribute("data-plan-state").catch(() => null);
    const kText = await page.locator("main").innerText().catch(() => "");
    check("V-LT2c", (kState ?? "first") === "first" && /Your first lesson/i.test(kText), `Kabir ${where}: data-plan-state=${kState}, "Your first lesson" ${/Your first lesson/i.test(kText) ? "shown" : "absent"}`);
    check("V-ID-1", (await page.locator('[data-teacher-id="arjun"]').count()) > 0, `Kabir home ${where}: no data-teacher-id="arjun"`);
    const kSmall = await smallTargets(page, 48);
    check("V-TGT", kSmall.length === 0, `Kabir home ${where}: ${kSmall.slice(0, 4).join("; ")}`);
    await en("Kabir home");
    await shot("home-kabir-first");
    // Riya: a lesson finished today, fresh storage (no local marker) → the done home with today's DidCard
    await page.goto(`${BASE}/c/${riya.id}`);
    await settle();
    const rState = await page.locator("[data-plan-state]").first().getAttribute("data-plan-state").catch(() => null);
    const rText = await page.locator("main").innerText().catch(() => "");
    const didShown = riyaAnswer != null && rText.includes(riyaAnswer);
    check("V-LT2c", (rState ?? "done") === "done" && /Done for today/i.test(rText) && didShown,
      `Riya ${where}: data-plan-state=${rState}, "Done for today" ${/Done for today/i.test(rText) ? "shown" : "absent"}, DidCard "${riyaAnswer}" ${didShown ? "shown" : "absent"}`);
    const rSmall = await smallTargets(page, 64);
    check("V-TGT", rSmall.length === 0, `Riya home (Young, 64 px) ${where}: ${rSmall.slice(0, 4).join("; ")}`);
    await en("Riya home");
    await shot("home-riya-done");
    // Kabir's Sky map, then its list
    await page.goto(`${BASE}/c/${kabir.id}/map`);
    await settle();
    const sky = await page.locator("main").innerText().catch(() => "");
    const seal = await page.locator("[data-sealed=true], [data-seal]").count();
    const dead = await deadZones(page);
    check("V-LT3c", /Your class is here/i.test(sky) && seal > 0 && dead.length === 0,
      `Sky ${where}: "Your class is here" ${/Your class is here/i.test(sky) ? "shown" : "absent"}, seals ${seal}, dead zones ${JSON.stringify(dead)}`);
    await en("Sky");
    await shot("map-kabir-sky");
    const listTab = page.locator("[role=tab]").nth(1);
    if (await listTab.count()) { await listTab.click(); await page.waitForTimeout(300); }
    const text = await page.locator("main").innerText().catch(() => "");
    check("V-LT3c", text.includes(learned.title), `List ${where}: does not name "${learned.title}"`);
    await en("Sky list");
    await shot("map-kabir-list");
    await page.goto(`${BASE}/c/${riya.id}/map`);
    await settle();
    await en("Garden");
    await shot("map-riya-garden");
    await ctx.close();
  }
}
await browser.close();
check("V-LT1", results.statuses.length > 0 && results.statuses.every((s) => s.status === 200), JSON.stringify(results.statuses.filter((s) => s.status !== 200).slice(0, 4)));
const get = (p) => fetch(BASE + p, { headers: { cookie } }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const plan = (await get(`/api/child/plan?childId=${kabir.id}`)).body;
const rPlan = (await get(`/api/child/plan?childId=${riya.id}`)).body;
check("V-LT2s", plan?.state === "first", `Kabir plan state ${plan?.state}`);
const cards = rPlan?.today?.summary?.cards ?? [];
check("V-LT2s", rPlan?.state === "done" && cards.length > 0 && cards.some((c) => c.answer === riyaAnswer && c.tick) && cards.every((c) => !c.tick || c.answer),
  `Riya plan state ${rPlan?.state}, cards ${JSON.stringify(cards.map((c) => [c.answer, c.tick]))}`);
check("V-LT4", plan?.teacher?.name === "Arjun" && plan.teacher.pronouns?.subject === "he", JSON.stringify(plan?.teacher ?? null));
const map = (await get(`/api/child/map?childId=${kabir.id}`)).body;
const chapters = (map?.subjects ?? []).flatMap((x) => x.chapters);
const learnedRow = (map?.skills ?? []).find((x) => x.skillId === learned.id);
check("V-LT3s", map?.mode === "sky" && chapters.length > 0 && chapters.every((c) => c.title && c.topics.length > 0)
  && chapters.filter((c) => c.here).length === 1 && chapters.some((c) => c.sealed && c.id === lastCh) && learnedRow?.state === "got_it",
  `map mode ${map?.mode}, chapters ${chapters.length}, here ${chapters.filter((c) => c.here).length}, sealed ${chapters.filter((c) => c.sealed).map((c) => c.id)}, learned ${learnedRow?.state}`);
const refused = await fetch(`${BASE}/api/lesson/start`, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ childId: riya.id, mode: "voice" }) })
  .then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
check("V-LT5s", refused.status === 409 && refused.body?.state === "done", `start for a child done today → ${refused.status} ${JSON.stringify(refused.body)}`);
results.plan = plan ? { state: plan.state, topic: plan.topic?.shortTitle, teacher: plan.teacher?.name } : null;
results.failures = fail;

// ── clean up ──
await api("DELETE", "/api/children", { childId: kabir.id, password }).catch(() => {});
await api("DELETE", "/api/children", { childId: riya.id, password }).catch(() => {});
await q("delete from guardian where email = $1", [`lt-e2e+${RUN}@test.invalid`]).catch(() => {});
srv.kill();
fs.writeFileSync(path.join(OUT, `checks-${TAG}.json`), JSON.stringify(results, null, 1));
const tiers = { server: fail.filter((f) => f.tier === "server"), client: fail.filter((f) => f.tier === "client") };
console.log(JSON.stringify({ tag: TAG, checks: results.checks, statuses: [...new Set(results.statuses.map((s) => `${s.path} ${s.status}`))], shots: results.shots.length,
  failing: { server: [...new Set(tiers.server.map((f) => f.id))], client: [...new Set(tiers.client.map((f) => f.id))] } }, null, 1));
const blocking = SERVER_ONLY ? tiers.server : fail;
if (ASSERT && blocking.length) {
  console.error("FAIL\n" + blocking.slice(0, 30).map((f) => `[${f.tier}] ${f.id}: ${f.detail}`).join("\n"));
  if (process.env.LT_DEBUG) console.error(srvLog.slice(-3000));
  process.exit(1);
}
process.exit(0);
