// Round 4 stream 5 (journey audit #12): STEPS, TAPS and TIME from the landing page to her first sound, scripted, on a
// production build served against the stream's Neon TEST branch (real sign-up, consent, child, controls, PIN). A fresh
// parent account every run. Works on the 9-step set-up and the 5-step cut alike: each screen is recognised by its path
// and answered the way a parent would (class 4, CBSE, Hindi and English mix, "Riya", PIN 2580, the 2-s hold held).
//   steps  distinct set-up screens shown ("/start/*" paths) before the child's first screen
//   taps   every click / press the script makes, field typing excluded (counted separately as fields)
//   time   ms from the landing page's first paint to her first sound (the first audio played on /c/*/hello)
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r4-asha-setup-journey.mjs --dist <dir> --label before|after [--out file.json] [--shots dir] [--hello]
// --hello (after the count): walk her Hello cards too (Got it, a picture, what she likes, "say hi" Skip) to the lesson,
// a shot of each, and the path the last card lands on. --sayhi: say hi (Chromium's fake microphone) instead of Skip.
import http from "http";
import fs from "fs";
import { spawn } from "child_process";
import { chromium } from "playwright";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const DIST = arg("--dist"), LABEL = arg("--label", "run"), OUT = arg("--out"), SHOTS = arg("--shots"), HELLO = process.argv.includes("--hello");
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const port = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const srv = spawn(process.execPath, ["--env-file=.env.local", "--env-file=tests/prod/prod-routing.env", "--import", "./tests/prod/r4-timeline/preload.mjs", "server/serve.mjs"],
  { cwd: ROOT, env: { ...process.env, PORT: String(port), TAXILA_DIST: DIST, NODE_USE_ENV_PROXY: "1", NODE_EXTRA_CA_CERTS: "/root/.ccr/ca-bundle.crt", ACCESS_LOG: "off" }, stdio: "ignore" });
const BASE = `http://127.0.0.1:${port}`;
for (let i = 0; i < 150; i++) { try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 200)); }

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const rows = [];
try {
  for (const v of [{ w: 360, h: 800, name: "phone" }, { w: 1366, h: 768, name: "laptop" }]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.w < 720 ? 2 : 1, hasTouch: v.w < 720, permissions: ["microphone"] });
    await ctx.addInitScript(() => {
      window.__firstSound = null;
      const mark = () => { if (window.__firstSound === null && /^\/c\//.test(location.pathname)) window.__firstSound = performance.now(); };
      const oStart = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { mark(); return oStart.apply(this, a); };
      const oPlay = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function (...a) { mark(); return oPlay.apply(this, a); };
    });
    const page = await ctx.newPage();
    if (process.argv.includes("--debug")) {
      page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text().slice(0, 200)); });
      page.on("pageerror", (e) => console.error("pageerror:", String(e).slice(0, 200)));
      page.on("requestfinished", async (r) => { if (r.url().includes("/api/")) { const res = await r.response(); console.error("api", r.method(), new URL(r.url()).pathname, res?.status(), Math.round(r.timing().responseEnd)); } });
      page.on("framenavigated", (f) => { if (f === page.mainFrame()) console.error("nav", new URL(f.url()).pathname); });
      page.on("requestfailed", (r) => console.error("failed", r.method(), r.url(), r.failure()?.errorText));
    }
    let taps = 0, fields = 0;
    const steps = [];
    const tap = async (loc) => { await loc.first().click({ timeout: 8000 }); taps++; await page.waitForTimeout(500); };
    // a tile is a radio (TileGroup), a key a button: either role, by its exact name
    const btn = (name) => page.getByRole("button", { name, exact: true }).or(page.getByRole("radio", { name, exact: true }));
    const fill = async (loc, value) => { await loc.first().fill(value); fields++; };
    const email = `setup-${LABEL}-${v.name}-${Date.now()}@taxila.test`;
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    const t0 = await page.evaluate(() => performance.now());
    await tap(page.getByRole("link", { name: "Start free set-up" }).or(page.getByRole("button", { name: "Start free set-up" })));
    for (let guard = 0; guard < 40; guard++) {
      await page.waitForTimeout(900);
      const path = new URL(page.url()).pathname;
      if (path.startsWith("/c/")) break;
      if (!steps.includes(path)) steps.push(path);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/${LABEL}-${v.name}-${String(steps.length).padStart(2, "0")}-${path.replace(/\W+/g, "_")}.png` }).catch(() => {});
      if (path === "/start/class") {
        await tap(btn("Class 4")); await tap(btn("CBSE"));
        if (await btn("Hindi and English mix").count()) await tap(btn("Hindi and English mix"));
        await tap(btn("Continue"));
      } else if (path === "/start/meet") {
        await tap(btn("Hindi and English mix")); await tap(btn("Continue"));
      } else if (path === "/start/promises") {
        const hold = page.getByRole("button", { name: /Hold to continue/ }).first();
        const b = await hold.boundingBox();
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(2300); await page.mouse.up(); taps++;
      } else if (path === "/start/phone") {
        await fill(page.getByLabel("Your name"), "Setup Parent");
        await fill(page.getByLabel("Email"), email);
        await fill(page.getByLabel("Password", { exact: true }), `pw-${Date.now()}-Ab9`);
        await tap(btn("Create account"));
      } else if (path === "/start/consent") {
        await tap(btn("Yes, remember")); await tap(btn("Yes")); await tap(btn("Only in the app")); await tap(btn("Agree and continue"));
      } else if (path === "/start/child") {
        await fill(page.getByLabel(/first name/i), "Riya");
        if (await btn("Casual").count()) await tap(btn("Casual"));
        if (await page.getByRole("button", { name: "Give the phone to Riya" }).count() === 0 && await btn("Continue").count()) { await tap(btn("Continue")); continue; }
        // the cut: name + PIN on one screen (the pad appears once GET /api/parent/pin answers)
        await page.getByRole("button", { name: "0", exact: true }).waitFor({ timeout: 20000 });
        for (const d of "2580") await tap(btn(d));
        await tap(btn("Next"));
        for (const d of "2580") await tap(btn(d));
        await tap(btn("OK"));
        await tap(page.getByRole("button", { name: "Give the phone to Riya" }));
        // one submit writes the child, the controls and the PIN (~1.7 s on the TEST branch): wait for the hand-over
        await page.waitForURL(/\/c\//, { timeout: 30000 });
      } else if (path === "/start/controls") {
        for (const d of "2580") await tap(btn(d));
        await tap(btn("Next"));
        for (const d of "2580") await tap(btn(d));
        await tap(btn("OK"));
        // an evening run: the 9-step set-up's default hours (07:00-20:30 before patch 09) would refuse the lesson; keep the defaults
        await tap(btn("Looks good"));
      } else if (path === "/start/check") {
        await tap(page.locator("[data-testid=check-sound], #check-sound")); await tap(page.locator("[data-testid=check-next], #check-next"));
      } else if (path === "/start/handover") {
        await tap(page.locator("[data-testid=handover-now]"));
      } else {
        throw new Error(`unknown set-up screen ${path}`);
      }
    }
    // the child's first screen: Hello plays her greeting on the hand-over tap; on a cold load it needs "Tap to hear"
    for (let i = 0; i < 20; i++) {
      if (await page.evaluate(() => window.__firstSound !== null)) break;
      const hear = page.locator("[data-testid=hello-hear]");
      if (i === 4 && await hear.count() && !(await hear.isDisabled().catch(() => true))) await tap(hear);
      await page.waitForTimeout(500);
    }
    const first = await page.evaluate(() => window.__firstSound);
    const row = { label: LABEL, view: v.name, steps: steps.length, screens: steps, taps, fields, msToFirstSound: first === null ? null : Math.round(first - t0) };
    console.log(JSON.stringify(row));
    rows.push(row);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${LABEL}-${v.name}-99-hello.png` }).catch(() => {});
    if (HELLO) {
      const card = () => page.locator("[data-testid=hello]").getAttribute("data-card");
      const shot = async (n) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${LABEL}-${v.name}-hello-${n}.png` }).catch(() => {}); };
      for (let i = 0; i < 30 && await card() === "greet"; i++) await page.waitForTimeout(500);
      const cards = [];
      for (let guard = 0; guard < 8; guard++) {
        if (!page.url().includes("/hello")) break;
        const c = await card().catch(() => null);
        if (!c) break;
        cards.push(c); await shot(`${cards.length}-${c}`);
        if (c === "greet") await page.locator("[data-testid=hello-hear], [data-testid=hello-next]").first().click();
        else if (c === "ai") await page.locator("[data-testid=hello-gotit]").click();
        else if (c === "picture") { await page.locator(".avatar-btn").first().click(); await page.locator("[data-testid=hello-thatsme]").click(); }
        else if (c === "likes") await page.locator("[data-testid=hello-right]").click();
        else if (c === "change") { await page.locator(".itile").first().click(); await page.locator("[data-testid=hello-done]").click(); }
        else if (c === "hi" && process.argv.includes("--sayhi")) { await page.locator("[data-testid=hello-sayhi]").click(); await page.waitForTimeout(400); await shot(`${cards.length}-hi-said`); await page.waitForURL(/lesson/, { timeout: 10000 }).catch(() => {}); }
        else if (c === "hi") await page.locator("[data-testid=hello-skip]").click();
        await page.waitForTimeout(1200);
      }
      row.helloCards = cards;
      row.afterHello = new URL(page.url()).pathname.replace(/\/c\/[^/]+/, "/c/:id");
      console.log(JSON.stringify({ view: v.name, helloCards: cards, afterHello: row.afterHello }));
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), method: "tests/prod/r4-asha-setup-journey.mjs: production build + the stream's Neon TEST branch, headless Chromium, scripted parent", rows }, null, 1));
