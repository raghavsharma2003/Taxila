#!/usr/bin/env node
// Post-deploy live checks (r7 App, main 2026-11-08): the checks that need a real deploy, run without the owner.
//
//   node scripts/live-checks.mjs <base-url> [--only pairing,placement,email,timing] [--keep]
//     env TAXILA_OPS_KEY   optional: the operator key (x-taxila-ops). With it the email-code check reads the code the
//                          server hands a @taxila.test account; without it that check is MANUAL (a real inbox).
//     env LIVE_TIMING_S    the card-timing check's budget for reaching a paged turn (default 240 s)
//     env LIVE_SHOTS       a folder: screenshots of the corner check
//
// Test accounts only: one fresh @taxila.test guardian with two children (Riya, and Kabir as the sibling a paired device
// must never see), created here and deleted in a `finally` (DELETE /api/account), pass or fail. Never the owner's
// cohort, never a real child. Prints a pass / fail / manual table and exits 1 on any FAIL.
//
//   1 pairing    code (parent) → /pair?code= on a second, empty browser context → the device sees only Riya (no guardian
//                email and no "Kabir" in ANY /api response body) → a parent route answers 403 scope.child_device →
//                unpair from the parent → the device's next request is 401 and the app lands on /pair?unpaired=1
//   2 placement  POST /api/placement/onboarding { parentView } and { childPicks } → GET /api/placement/note has lines →
//                the parent corner (PIN typed on the pad) shows "Where Riya begins"
//   3 email      POST /api/auth/code (ops key → testCode) → POST /api/auth/code/verify on a fresh client → /api/me is that
//                guardian; the real inbox stays MANUAL
//   4 timing     a lesson in the browser (typed turns) until a paged board turns a page: the Desk's page clock (QA log,
//                localStorage tx.qa=1) and the question card's switch land within ±300 ms of the board player's own page
//                turn (its erase, read from the board's DOM). Best effort: no paged turn within the budget → MANUAL
import { chromium } from "playwright";

const args = process.argv.slice(2);
const BASE = String(args.find((a) => /^https?:\/\//.test(a)) ?? "").replace(/\/+$/, "");
if (!BASE) { console.error("usage: node scripts/live-checks.mjs <base-url> [--only pairing,placement,email,timing]"); process.exit(2); }
const ONLY = (() => { const i = args.indexOf("--only"); return i >= 0 ? String(args[i + 1] ?? "").split(",").filter(Boolean) : null; })();
const want = (k) => !ONLY || ONLY.includes(k);
const OPS = process.env.TAXILA_OPS_KEY || "";
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);
const PIN = "4826";

// ───────────────────────────── results ─────────────────────────────
const rows = [];
const record = (check, step, status, note = "") => { rows.push({ check, step, status, note }); console.log(`${status.padEnd(6)} ${check} · ${step}${note ? ` · ${note}` : ""}`); };
const pass = (c, s, n) => record(c, s, "PASS", n);
const fail = (c, s, n) => record(c, s, "FAIL", n);
const manual = (c, s, n) => record(c, s, "MANUAL", n);
const expectTrue = (c, s, cond, n = "") => { (cond ? pass : fail)(c, s, n); return !!cond; };

// ───────────────────────────── a cookie-jar API client (every cookie, not just the first) ─────────────────────────────
function client(base = BASE) {
  const jar = new Map();
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  async function api(method, path, body, headers = {}) {
    const res = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(jar.size ? { cookie: cookie() } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); const k = kv.slice(0, i).trim(), v = kv.slice(i + 1); if (/max-age=0/i.test(c) || v === "") jar.delete(k); else jar.set(k, v); }
    const text = await res.text();
    let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
    return { status: res.status, json, text };
  }
  api.jar = jar;
  return api;
}
const must = async (p, what, ok = [200, 201]) => { const r = await p; if (!ok.includes(r.status)) throw new Error(`${what} → ${r.status} ${r.text.slice(0, 200)}`); return r.json ?? {}; };

async function browser() {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const proxy = !isLocal && process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  return chromium.launch({ ...(proxy ? { proxy } : {}), args: ["--autoplay-policy=no-user-gesture-required"] });
}
async function contextWith(b, api, viewport = { width: 360, height: 800 }) {
  const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport });
  if (api) await ctx.addCookies([...api.jar].map(([name, value]) => ({ name, value, url: BASE })));
  return ctx;
}

// ───────────────────────────── the test account ─────────────────────────────
const parent = client();
const st = Date.now(), rnd = Math.random().toString(36).slice(2, 8);
const email = `live-${st}${rnd}@taxila.test`, password = `live-pw-${st}-${rnd}`;
let riya = null, kabir = null, signedUp = false;

async function setUp() {
  await must(parent("POST", "/api/auth/signup", { email, password, name: "Live Check", isGuardianAdult: true }), "signup");
  signedUp = true;
  riya = (await must(parent("POST", "/api/children", { firstName: "Riya", classLevel: 5, languagePref: "hinglish", interests: ["cricket"] }), "child Riya")).child;
  kabir = (await must(parent("POST", "/api/children", { firstName: "Kabir", classLevel: 7, languagePref: "hinglish", interests: ["space"] }), "child Kabir")).child;
  for (const c of [riya, kabir]) {
    await must(parent("POST", "/api/consent", { childId: c.id, grants: { core_tutoring: true, learning_profile: true, memory: true } }), "consent");
    await must(parent("POST", "/api/parent/controls", { childId: c.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 }), "controls");
  }
  await must(parent("POST", "/api/parent/pin", { pin: PIN, password }), "parent PIN");
}
async function cleanUp() {
  if (!signedUp) return;
  await parent("POST", "/api/parent/unlock", { pin: PIN }).catch(() => null);
  const r = await parent("DELETE", "/api/account", { password, confirm: true });
  if (r.status === 200 || r.status === 204) console.log(`cleanup: ${email} deleted`);
  else fail("cleanup", "delete the test account", `${r.status} ${r.text.slice(0, 120)} (${email})`);
}

// ───────────────────────────── 1 pairing ─────────────────────────────
async function checkPairing(b) {
  const C = "pairing";
  const code = await parent("POST", "/api/pair/code", { childId: riya.id });
  if (code.status === 404) return fail(C, "routes", "POST /api/pair/code is 404: Platform's pairing routes are not deployed");
  if (!expectTrue(C, "parent makes a code", code.status === 200 && /^[23456789A-HJ-NP-Z]{6}$/.test(code.json?.code ?? ""), `${code.status} ${code.json?.code ?? ""}`)) return;
  const dctx = await contextWith(b, null); // the child's own device: an empty browser
  const page = await dctx.newPage();
  const bodies = [];
  page.on("response", async (r) => { if (new URL(r.url()).pathname.startsWith("/api/")) bodies.push({ url: r.url(), status: r.status(), body: await r.text().catch(() => "") }); });
  try {
    await page.goto(`${BASE}/pair?code=${code.json.code}`, { waitUntil: "networkidle" });
    await page.waitForURL(/\/c\/[^/]+/, { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const at = new URL(page.url()).pathname;
    expectTrue(C, "redeem opens the child's app", at === `/c/${riya.id}` || at.startsWith(`/c/${riya.id}/`), at);
    const cookies = await dctx.cookies(BASE);
    expectTrue(C, "device holds tx_child + tx_paired", cookies.some((c) => c.name === "tx_child") && cookies.some((c) => c.name === "tx_paired" && c.value === riya.id));
    const leaks = bodies.filter((x) => x.body.includes(email) || /\bKabir\b/.test(x.body) || x.body.includes(kabir.id));
    expectTrue(C, "no guardian email or sibling in any device response", !leaks.length, leaks.length ? leaks.map((x) => new URL(x.url).pathname).join(", ") : `${bodies.length} responses read`);
    const screenText = await page.evaluate(() => document.body.innerText);
    expectTrue(C, "the device screen never shows the sibling or the parent's email", !/Kabir/.test(screenText) && !screenText.includes(email));
    const refused = await page.evaluate(async () => { const r = await fetch("/api/parent/pin", { credentials: "same-origin" }); return { s: r.status, b: await r.text() }; });
    expectTrue(C, "a parent route is refused (403 scope.child_device)", refused.s === 403 && /scope\.child_device/.test(refused.b), `${refused.s}`);
    await page.goto(`${BASE}/parent`, { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
    expectTrue(C, "/parent on the device asks for the grown-up", await page.locator('[data-testid="parent-only"]').count() > 0);
    // unpair from the parent
    const devs = await parent("GET", `/api/pair/devices?childId=${encodeURIComponent(riya.id)}`);
    const dev = devs.json?.devices?.[0];
    if (!expectTrue(C, "the parent lists the device", devs.status === 200 && !!dev, `${devs.status} ${devs.json?.devices?.length ?? 0} device(s)`)) return;
    const un = await parent("DELETE", `/api/pair/devices?id=${encodeURIComponent(dev.id)}`, { id: dev.id });
    expectTrue(C, "unpair", un.status === 200, `${un.status}`);
    const after = await page.evaluate(async (cid) => (await fetch(`/api/child/plan?childId=${cid}`, { credentials: "same-origin" })).status, riya.id);
    expectTrue(C, "the device's next request is 401", after === 401, `${after}`);
    await page.goto(`${BASE}/c/${riya.id}`, { waitUntil: "networkidle" });
    await page.waitForURL(/\/pair\?unpaired=1/, { timeout: 10_000 }).catch(() => {});
    expectTrue(C, "the device lands on /pair?unpaired=1", /\/pair\?unpaired=1/.test(page.url()) && await page.locator('[data-testid="pair-unpaired"]').count() > 0, new URL(page.url()).pathname + new URL(page.url()).search);
  } finally { await dctx.close(); }
}

// ───────────────────────────── 2 placement ─────────────────────────────
async function checkPlacement(b) {
  const C = "placement";
  const a = await parent("POST", "/api/placement/onboarding", { childId: riya.id, parentView: { maths: "hard" } });
  if (a.status === 404) return fail(C, "routes", "POST /api/placement/onboarding is 404");
  expectTrue(C, "set-up POST (parentView)", a.status === 200, `${a.status}`);
  const c = await parent("POST", "/api/placement/onboarding", { childId: riya.id, childPicks: { maths: "tricky", evs: "okay" } });
  expectTrue(C, "Hello POST (childPicks)", c.status === 200, `${c.status}`);
  const n = await parent("GET", `/api/placement/note?childId=${encodeURIComponent(riya.id)}`);
  const lines = n.json?.note?.lines?.en ?? [];
  expectTrue(C, "GET /api/placement/note has lines", n.status === 200 && lines.length > 0, `${n.status} ${lines.length} line(s)`);
  const ctx = await contextWith(b, parent);
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/parent/progress?c=${riya.id}`, { waitUntil: "networkidle" }); await page.waitForTimeout(800);
    for (const d of PIN) { await page.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await page.waitForTimeout(80); }
    await page.getByRole("button", { name: "OK", exact: true }).click().catch(() => {});
    await page.waitForTimeout(2500);
    const txt = await page.evaluate(() => document.body.innerText);
    if (process.env.LIVE_SHOTS) await page.screenshot({ path: `${process.env.LIVE_SHOTS}/placement-corner.png`, fullPage: true });
    expectTrue(C, "the corner shows \"Where Riya begins\"", /Where Riya begins/.test(txt), /Where Riya begins/.test(txt) ? "" : `page: ${txt.replace(/\s+/g, " ").slice(0, 120)}`);
    expectTrue(C, "no level word to the parent", !/\b(behind|on track|ahead)\b/i.test(txt));
  } finally { await ctx.close(); }
}

// ───────────────────────────── 3 email code ─────────────────────────────
async function checkEmail() {
  const C = "email";
  if (!OPS) {
    const r = await parent("POST", "/api/auth/code", { channel: "email", email });
    if (r.status === 404) return fail(C, "routes", "POST /api/auth/code is 404: to-platform/002 (signin routes) not registered");
    expectTrue(C, "POST /api/auth/code answers", r.status === 200 || r.status === 503, `${r.status}${r.status === 503 ? " (ACS not configured on this deploy)" : ""}`);
    return manual(C, "a real code arrives and signs in", "no TAXILA_OPS_KEY: send a code to a real inbox at /signin and sign in with it");
  }
  const fresh = client();
  const r = await fresh("POST", "/api/auth/code", { channel: "email", email }, { "x-taxila-ops": OPS });
  if (r.status === 404) return fail(C, "routes", "POST /api/auth/code is 404: to-platform/002 not registered");
  if (!expectTrue(C, "the code is made (test account)", r.status === 200 && /^\d{6}$/.test(r.json?.testCode ?? ""), `${r.status}`)) return;
  const bad = await fresh("POST", "/api/auth/code/verify", { email, code: r.json.testCode === "000000" ? "111111" : "000000" });
  expectTrue(C, "a wrong code is refused (code.bad)", bad.status === 400 && bad.json?.code === "code.bad", `${bad.status}`);
  const v = await fresh("POST", "/api/auth/code/verify", { email, code: r.json.testCode });
  expectTrue(C, "the code signs in", v.status === 200, `${v.status}`);
  const me = await fresh("GET", "/api/me");
  expectTrue(C, "/api/me is that guardian", me.status === 200 && me.json?.guardian?.email === email, `${me.status}`);
  const again = await fresh("POST", "/api/auth/code/verify", { email, code: r.json.testCode });
  expectTrue(C, "a used code does not work twice", again.status === 400, `${again.status}`);
  manual(C, "the email itself arrives (ACS, a real inbox)", "send one to a real address at /signin");
}

// ───────────────────────────── 4 card timing against the real voice ─────────────────────────────
async function checkTiming(b) {
  const C = "timing";
  const ctx = await contextWith(b, parent, { width: 412, height: 915 });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("tx.qa", "1"); } catch { /* */ }
    // the board player's own page turn: its erased page stops rendering at the switch + 200 ms (the erase's fade)
    const log = (window.__txPlayerLog = []), cards = (window.__txCardLog = []);
    let last = 0;
    new MutationObserver(() => {
      const svg = [...document.querySelectorAll("svg[data-wb-t]")].sort((a, c) => c.childElementCount - a.childElementCount)[0];
      if (svg) { const n = svg.childElementCount; if (n < last - 1) log.push({ t: performance.now() - 200, wbT: Number(svg.getAttribute("data-wb-t")), from: last, to: n }); last = n; }
      const ask = document.querySelector('[data-testid="ask"]')?.textContent ?? "";
      if (ask && ask !== cards.at(-1)?.text) cards.push({ t: performance.now(), text: ask });
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["data-wb-t"] });
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/c/${riya.id}/lesson/new?topic=c5-maths-ch02-t01`, { waitUntil: "networkidle" });
    const budgetMs = Number(process.env.LIVE_TIMING_S || 240) * 1000;
    const deadline = Date.now() + budgetMs;
    let turns = 0;
    while (Date.now() < deadline && turns < 10) {
      const paged = await page.evaluate(() => (window.__txPageLog ?? []).length);
      if (paged) break;
      // her turn: type an honest short answer (never an attempt to game the key)
      const input = page.locator('[data-testid="child-input"]');
      if (!(await input.count())) { await page.locator('[data-testid="type"]').click({ timeout: 2000 }).catch(() => {}); await page.locator('[data-testid="pad-words"]').click({ timeout: 1000 }).catch(() => {}); }
      if (await input.count() && await input.isEnabled().catch(() => false)) {
        await input.fill(turns % 2 ? "haan, samajh aaya" : "pata nahi, phir se samjhao").catch(() => {});
        await page.locator('[data-testid="send"]').click({ timeout: 2000 }).catch(() => {});
        turns++;
      }
      await page.waitForTimeout(6000);
    }
    await page.waitForTimeout(8000);
    const { desk, player, cards } = await page.evaluate(() => ({ desk: window.__txPageLog ?? [], player: window.__txPlayerLog ?? [], cards: window.__txCardLog ?? [] }));
    if (!desk.length) return manual(C, "card timing on a paged turn", `no paged board in ${turns} typed turns (${Math.round(budgetMs / 1000)} s): check one by hand`);
    const deltas = desk.map((d) => { const p = player.reduce((best, x) => (Math.abs(x.t - d.t) < Math.abs((best?.t ?? Infinity) - d.t) ? x : best), null); return p ? Math.round(d.t - p.t) : null; }).filter((x) => x !== null);
    expectTrue(C, "the Desk's page clock lands on the player's page turn (±300 ms)", deltas.length > 0 && deltas.every((d) => Math.abs(d) <= 300), `deltas ${JSON.stringify(deltas)} ms over ${desk.length} turn(s)`);
    const lastTurns = desk.filter((d) => d.page === d.last);
    const sw = lastTurns.map((d) => { const c = cards.find((x) => x.t >= d.t - 600 && x.t <= d.t + 600); return c ? Math.round(c.t - d.t) : null; }).filter((x) => x !== null);
    if (sw.length) expectTrue(C, "a new card switches at its last page (±300 ms)", sw.every((d) => Math.abs(d) <= 300), `deltas ${JSON.stringify(sw)} ms`);
    else manual(C, "a new card switches at its last page", "no paged turn brought a new card in this run");
  } finally { await ctx.close(); }
}

// ───────────────────────────── run ─────────────────────────────
const b = await browser();
try {
  await setUp();
  if (want("pairing")) await checkPairing(b).catch((e) => fail("pairing", "threw", e.message));
  if (want("placement")) await checkPlacement(b).catch((e) => fail("placement", "threw", e.message));
  if (want("email")) await checkEmail().catch((e) => fail("email", "threw", e.message));
  if (want("timing")) await checkTiming(b).catch((e) => fail("timing", "threw", e.message));
} catch (e) {
  fail("setup", "test account", e.message);
} finally {
  await cleanUp().catch((e) => fail("cleanup", "threw", e.message));
  await b.close();
}
const w = Math.max(...rows.map((r) => `${r.check} · ${r.step}`.length), 20);
console.log(`\n${"check".padEnd(w)}  result  note\n${"─".repeat(w)}  ──────  ────`);
for (const r of rows) console.log(`${`${r.check} · ${r.step}`.padEnd(w)}  ${r.status.padEnd(6)}  ${r.note}`);
const fails = rows.filter((r) => r.status === "FAIL").length;
console.log(`\n${rows.filter((r) => r.status === "PASS").length} pass · ${fails} fail · ${rows.filter((r) => r.status === "MANUAL").length} manual  (${BASE})`);
process.exit(fails ? 1 : 0);
