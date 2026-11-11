// Round 7 face-prerendered-clip-visemes: does the Hello face SEAL on her bilabials (m / p / b) with the sidecar, vs the
// meter-only path? The real Hello screen (production build with App patch 003, every /api/* mocked), the live puppet
// forced on (?puppet=1&facerig=1), the greeting clip played through the page's own player. Per frame: the clip's time
// and the rig's rendered lip gap (stage.mouthProbe().gap). Per bilabial event in the sidecar: the smallest gap within
// ±60 ms. Arms: sidecar served vs sidecar blocked (404, the meter path).
//   node evals/face-puppet/clip-seals.mjs <distDir> [lang=en] [--out file.json]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const ROOT = new URL("../..", import.meta.url).pathname;
const [dist, lang = "en"] = process.argv.slice(2);
const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;
const LANG = { en: "english", hi: "hindi", hinglish: "hinglish" }[lang];
const side = JSON.parse(fs.readFileSync(path.join(ROOT, `public/audio/hello-${lang}.visemes.json`), "utf8"));
const PORT = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 150)); }
const kid = { id: "c-kabir", first_name: "Kabir", class_level: 6, board: "cbse", language_pref: LANG, teacher_id: "asha", teacher_name: null, avatar: "rocket", interests: ["Football"] };
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });

async function arm(withSidecar) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  await page.route("**/api/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (b, s = 200) => route.fulfill({ status: s, contentType: "application/json", body: JSON.stringify(b) });
    if (p === "/api/face/config") return json({ puppet2d: true, look: "r8" });
    if (p === "/api/me") return json({ guardian: { id: "g1", email: "p@example.test", name: "P" }, children: [kid] });
    if (p === "/api/child/teacher") return json({ teacher: { id: "asha", name: "Asha" } });
    return json({ error: "unmocked" }, 404);
  });
  if (!withSidecar) await page.route("**/*.visemes.json", (r) => r.fulfill({ status: 404, body: "" }));
  await page.addInitScript(() => {
    const w = window;
    w.__seal = { rows: [], clip: null };
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...a) { w.__seal.clip = this; return play.apply(this, a); };
    const loop = () => {
      const c = w.__seal.clip, s = w.__puppet;
      if (c && s && !c.paused) { const m = s.mouthProbe(); if (m) w.__seal.rows.push([c.currentTime * 1000, m.gap, m.lip]); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  await page.goto(`http://127.0.0.1:${PORT}/c/${kid.id}/hello?puppet=1&facerig=1`, { waitUntil: "domcontentloaded" });
  // the greeting card plays the clip by itself; if not, tap the play control
  await page.waitForTimeout(3000);
  const started = await page.evaluate(() => !!window.__seal.clip);
  if (!started) await page.getByRole("button", { name: /hear|play|listen/i }).first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForFunction(() => window.__seal.clip && window.__seal.clip.ended, null, { timeout: 40000 }).catch(() => {});
  const rows = await page.evaluate(() => window.__seal.rows);
  await ctx.close();
  const seals = side.visemes.filter((v) => v.id === 21).map((v) => {
    const near = rows.filter(([t]) => Math.abs(t - v.ms) <= 60).map(([, g]) => g);
    return near.length ? Math.min(...near) : null;
  }).filter((g) => g !== null);
  const open = rows.map(([, g]) => g).sort((a, b) => a - b);
  const p75 = open[Math.floor(open.length * 0.75)] ?? 0;
  const closed = (g) => g <= Math.max(0.5, p75 * 0.15);
  return { sidecar: withSidecar, frames: rows.length, lip: [...new Set(rows.map((r) => r[2]))], openP75: +p75.toFixed(2), bilabials: seals.length, sealed: seals.filter(closed).length, sealRate: seals.length ? +(seals.filter(closed).length / seals.length).toFixed(2) : null };
}
const res = { lang, date: new Date().toISOString(), arms: [await arm(false), await arm(true)] };
console.log(JSON.stringify(res, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
await browser.close(); srv.kill();
