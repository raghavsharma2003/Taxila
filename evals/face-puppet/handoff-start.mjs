// Round 7 face-prewarm-for-first-sound: from the home to the lesson, when is her face up, against her first sound?
// The Kaksha home (production build with dev routes, /api/* for the home mocked, the live puppet forced on) settles with
// its live stage; then the harness navigates in-page (history + popstate: the SPA's own router, no reload) to the REAL
// lesson runtime on /dev/desk?live=1 (scripted Director + clock link, no models), standing in for Start → the lesson
// (the real start needs Azure and the database: the needs-live list). t0 = that navigation, on the page clock.
// Per run: t0 → the lesson's face first PAINTED (its poster decoded, or live), t0 → its face LIVE (data-phase live),
// t0 → her first sound (the Desk's floor first reads "speaking"), whether the home's stage was adopted, and long tasks
// from t0 to 3 s after her first sound. Headless Chromium, software GL (SwiftShader), CDP CPU throttle.
// Arms, interleaved: handoff (default: the home's worker stage is handed to the lesson), nohand (?handoff=0: the lesson
// builds its own stage at her first audio, the pre-change path), off (?puppet=0: her still on both screens).
//   node evals/face-puppet/handoff-start.mjs [--n 8] [--cpu 6] [--dist <dir>] [--out <file.json>]
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", "8"));
const CPU = Number(arg("--cpu", "6"));
const OUT = arg("--out", null);
let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-r7-face-handoff-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_DEV_ROUTES: "1" } });
}
const PORT = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 150)); }

const kid = { id: "c-kabir", first_name: "Kabir", class_level: 6, board: "cbse", language_pref: "english", teacher_id: "asha", teacher_name: null, avatar: "rocket", interests: ["Football"] };
const TEACHER = { id: "asha", name: "Asha", characterName: "Asha", pronouns: { subject: "she", object: "her", possessive: "her" } };
const plan = { state: "start", homeState: "default", plan: { openLesson: null }, topic: null, resume: null, today: null, capRemaining: 20, teacher: TEACHER, surfaces: { map: true }, source: { dayPlan: null } };
const q = (a, p) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]) : null; };
const sum = (a) => ({ n: a.filter((x) => x != null).length, p50: q(a, 0.5), p90: q(a, 0.9), max: q(a, 1) });

async function one(browser, arm) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, serviceWorkers: "block" });
  await ctx.addInitScript((k) => { localStorage.setItem(`taxila.child.${k}.prefs`, JSON.stringify({ hello: true })); }, kid.id);
  await ctx.route("**/api/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (body, s = 200) => route.fulfill({ status: s, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/face/config") return json({ puppet2d: true, visemes: true, rev: "r8", look: "r8" });
    if (p === "/api/me") return json({ guardian: { id: "g1", email: "p@example.test", name: "P" }, children: [kid] });
    if (p === "/api/child/plan") return json(plan);
    if (p === "/api/tutors/greeting") return json({ error: "none" }, 404);
    return route.continue();
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  const flags = arm === "off" ? "puppet=0" : `puppet=1&rigworker=1&handoff=${arm === "handoff" ? 1 : 0}`;
  await page.goto(`${BASE}/c/${kid.id}?${flags}&facerig=1`, { waitUntil: "domcontentloaded" });
  // the home settles: her live stage revealed (or, puppet off, her still painted)
  await page.waitForFunction((off) => off ? !!document.querySelector('[data-face="puppet2d"] img')?.complete : window.__puppet?.isRevealed === true, arm === "off", { timeout: 60_000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(async ({ flags }) => {
    const w = window;
    const homeStage = w.__puppet ?? null;
    const homeOffThread = homeStage?.offThread ?? null;
    for (const h of document.querySelectorAll("[data-face]")) h.setAttribute("data-was-home", "1");
    const long = [];
    let lo = null;
    try { lo = new PerformanceObserver((l) => { for (const e of l.getEntries()) long.push([e.startTime, e.duration]); }); lo.observe({ type: "longtask" }); } catch { /* none */ }
    const m = { painted: null, live: null, speaking: null };
    const t0 = performance.now();
    history.pushState({}, "", `/dev/desk?live=1&band=b3&face=live&facerig=1&${flags}`);
    dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    await new Promise((done) => {
      const tick = () => {
        const now = performance.now() - t0;
        const host = [...document.querySelectorAll("[data-face]")].find((h) => !h.hasAttribute("data-was-home"));
        if (host && m.painted == null) {
          const img = host.querySelector("img");
          if (host.getAttribute("data-phase") === "live" || (img && img.complete && img.naturalWidth > 0)) m.painted = now;
        }
        if (host && m.live == null && host.getAttribute("data-phase") === "live") m.live = now;
        if (m.speaking == null && document.querySelector('[data-floor="speaking"]')) m.speaking = now;
        if ((m.speaking != null && now > m.speaking + 3000) || now > 45_000) done(); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    lo?.disconnect();
    const end = t0 + (m.speaking ?? 0) + 3000;
    const lt = long.filter(([s]) => s >= t0 && s <= end);
    const host = [...document.querySelectorAll("[data-face]")].find((h) => !h.hasAttribute("data-was-home"));
    return { ...m, adopted: !!homeStage && w.__puppet === homeStage, homeOffThread, phase: host?.getAttribute("data-phase") ?? null,
      longN: lt.length, longTotal: Math.round(lt.reduce((a, [, d]) => a + d, 0)), longMax: Math.round(lt.reduce((a, [, d]) => Math.max(a, d), 0)) };
  }, { flags });
  await ctx.close();
  return r;
}

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ARMS = ["handoff", "nohand", "off"];
const runs = Object.fromEntries(ARMS.map((a) => [a, []]));
try {
  for (let i = 0; i < N; i++) for (let j = 0; j < ARMS.length; j++) {
    const a = ARMS[(i + j) % ARMS.length];
    const r = await one(browser, a);
    runs[a].push(r);
    console.log(JSON.stringify({ i, arm: a, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "number" ? Math.round(v) : v])) }));
  }
} finally {
  await browser.close();
  srv.kill();
}
const arm = (rs) => ({
  painted: sum(rs.map((r) => r.painted)), live: sum(rs.map((r) => r.live)), firstSound: sum(rs.map((r) => r.speaking)),
  liveMinusSound: sum(rs.map((r) => (r.live != null && r.speaking != null ? r.live - r.speaking : null))),
  longTotal: sum(rs.map((r) => r.longTotal)), longMax: sum(rs.map((r) => r.longMax)),
  adopted: rs.filter((r) => r.adopted).length, homeOffThread: rs.filter((r) => r.homeOffThread).length, phases: [...new Set(rs.map((r) => r.phase))],
});
const result = { at: new Date().toISOString(), n: N, cpu: CPU, gl: "swiftshader", arms: Object.fromEntries(ARMS.map((a) => [a, arm(runs[a])])), runs };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result.arms, null, 1));
