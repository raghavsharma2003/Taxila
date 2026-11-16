// Round 7 face-home-daily-greeting: the Kaksha home with App patch 004 (production build, /api/* mocked, the live
// puppet forced on). Before any tap she is silent; the first tap plays today's clip (mocked to the English Hello clip,
// which has a viseme sidecar), her mouth moves with it, then she glances at Start; a reload the same day stays silent.
//   node evals/face-puppet/greeting-shots.mjs <distDir> <outDir>
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const ROOT = new URL("../..", import.meta.url).pathname;
const [dist, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const PORT = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 150)); }
const kid = { id: "c-kabir", first_name: "Kabir", class_level: 6, board: "cbse", language_pref: "english", teacher_id: "asha", teacher_name: null, avatar: "rocket", interests: ["Football"] };
const TEACHER = { id: "asha", name: "Asha", characterName: "Asha", pronouns: { subject: "she", object: "her", possessive: "her" } };
const plan = { state: "start", homeState: "default", plan: { openLesson: null }, topic: null, resume: null, today: null, capRemaining: 20, teacher: TEACHER, surfaces: { map: true }, source: { dayPlan: null } };
let greetCalls = 0;
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
await ctx.addInitScript((k) => { if (!sessionStorage.getItem("__s")) { sessionStorage.setItem("__s", "1"); localStorage.setItem(`taxila.child.${k}.prefs`, JSON.stringify({ hello: true })); } }, kid.id);
await ctx.addInitScript(() => {
  window.__g = { gaze: [], played: 0 };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) { window.__g.played++; return play.apply(this, a); };
});
await ctx.route("**/api/**", (route) => {
  const p = new URL(route.request().url()).pathname;
  const json = (body, s = 200) => route.fulfill({ status: s, contentType: "application/json", body: JSON.stringify(body) });
  if (p === "/api/face/config") return json({ puppet2d: true, look: "r8" });
  if (p === "/api/me") return json({ guardian: { id: "g1", email: "p@example.test", name: "P" }, children: [kid] });
  if (p === "/api/child/plan") return json(plan);
  if (p === "/api/tutors/greeting") { greetCalls++; return json({ day: "2026-11-04", part: "morning", lang: "english", id: "en-m1", text: "Good morning.", clip: "/audio/hello-en.mp3", glance: "start" }); }
  return json({ error: "unmocked" }, 404);
});
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${PORT}/c/${kid.id}?puppet=1&facerig=1`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
const before = await page.evaluate(() => window.__g.played);
await page.screenshot({ path: `${out}/0-before-tap.png` });
await page.mouse.click(10, 860); // a tap on the page background (audio unlock)
const shots = [];
for (let i = 0; i < 6; i++) { await page.waitForTimeout(450); const p = `${out}/1-speaking-${i}.png`; await (await page.$(".kx-home-face")).screenshot({ path: p }); shots.push(p); }
await page.waitForFunction(() => document.querySelector("audio, video") === null && window.__g.played > 0, null, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(9000); // the clip is ~9 s; then the glance
const playedAfterTap = await page.evaluate(() => window.__g.played);
const log = await page.evaluate(() => (window.__puppet?.log ?? []).map((e) => e.type));
const behaviour = await page.evaluate(() => window.__puppet?.driver?.behaviour?.lookLog?.slice?.(-3) ?? null);
await (await page.$(".kx-home-face")).screenshot({ path: `${out}/2-after-glance.png` });
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.mouse.click(10, 860);
await page.waitForTimeout(1500);
const playedAfterReload = await page.evaluate(() => window.__g.played);
const res = { greetCalls, playedBeforeTap: before, playedAfterTap, playedAfterReloadAndTap: playedAfterReload, stageEvents: [...new Set(log)], behaviour };
fs.writeFileSync(`${out}/result.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
await b.close(); srv.kill();
