// Round 7 face-stills-and-character-record: the parent corner's teacher badge (TeacherBadge in src/parent/Shell.tsx) on a
// production build with every /api/* mocked.  node evals/face-puppet/parent-shots.mjs <distDir> <out.png> [look]
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const ROOT = new URL("../..", import.meta.url).pathname;
const [dist, out, look = "r8"] = process.argv.slice(2);
const PORT = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 150)); }
const kid = { id: "c-kabir", first_name: "Kabir", class_level: 6, board: "cbse", language_pref: "english", teacher_id: "asha", teacher_name: null };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.route("**/api/**", (route) => {
  const p = new URL(route.request().url()).pathname;
  const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  if (p === "/api/face/config") return json({ puppet2d: true, look, ...(look === "lamp2" ? { cohort: "owner" } : {}) });
  if (p === "/api/me") return json({ guardian: { id: "g1", email: "parent@example.test", name: "Parent" }, children: [kid] });
  const gate = { hasPin: true, unlocked: false, unlockedUntil: null, lockedUntil: null };
  if (p === "/api/parent/pin") return json(gate);
  if (p === "/api/parent/unlock") return json({ ...gate, unlocked: true, unlockedUntil: new Date(Date.now() + 6e5).toISOString() });
  if (p === "/api/parent/lock") return json(gate);
  return json({ error: "unmocked" }, 404);
});
await page.goto(`http://127.0.0.1:${PORT}/parent`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const pin = page.locator("input[type=password]").first();
if (await pin.count()) { await pin.fill("1234"); await pin.press("Enter"); }
else { for (const d of "1234") await page.locator(".pin-key", { hasText: new RegExp(`^${d}$`) }).first().click({ timeout: 3000 }); await page.locator(".pin-key", { hasText: /^OK$/ }).first().click({ timeout: 3000 }); }
await page.waitForTimeout(3000);
console.log((await page.evaluate(() => document.body.innerText)).slice(0, 300).replace(/\n/g, " / "));
const badge = await page.$(".pa-teacher");
console.log("badge:", !!badge, await page.evaluate(() => document.querySelector(".pa-teacher img")?.getAttribute("src") ?? document.querySelector(".pa-teacher-disc")?.textContent ?? null));
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 412, height: 260 } });
await b.close(); srv.kill();
