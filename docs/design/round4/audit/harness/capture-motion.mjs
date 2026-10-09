// Motion capture: one recorded 412x915 session (webm) on taxila.dev. Home → Map → Home (a transition), Start → the lesson
// (entry), the teacher speaking, a typed answer and what follows (feedback), Pause → End → the summary.
// Account: tests/prod/lib.mjs withTestAccount (w0 flow), deleted in its finally.
import { mkdirSync, renameSync, existsSync } from "node:fs";
import { withTestAccount, ok, warn, done, BASE } from "/home/user/Taxila/tests/prod/lib.mjs";
const OUT = process.env.AUDIT_OUT + "motion/";
mkdirSync(OUT + "frames", { recursive: true });
mkdirSync(OUT + "raw4", { recursive: true });
const L = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("/home/user/Taxila/node_modules/playwright/index.mjs");
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
async function routed(ctx) {
  await ctx.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    if (!/^https?:/.test(url)) return route.continue();
    try {
      const h = { ...(await req.allHeaders()) }; delete h.host; for (const k of Object.keys(h)) if (k.startsWith(":")) delete h[k]; delete h["content-length"];
      const res = await fetch(url, { method: req.method(), headers: h, body: ["GET", "HEAD"].includes(req.method()) ? undefined : req.postDataBuffer(), redirect: "manual" });
      const headers = {};
      res.headers.forEach((v, k) => { if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) headers[k] = v; });
      const sc = res.headers.getSetCookie?.() ?? [];
      if (sc.length) headers["set-cookie"] = sc.join("\n");
      return route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) });
    } catch { return route.abort("failed").catch(() => {}); }
  });
  return ctx;
}
async function burst(page, name, n, every) {
  for (let i = 0; i < n; i++) { await page.screenshot({ path: `${OUT}frames/${name}-${String(i).padStart(2, "0")}.png` }).catch(() => {}); await page.waitForTimeout(every); }
}
const vis = (l) => l.isVisible().catch(() => false);
let videoPath = null;
await withTestAccount(async ({ api, child }) => {
  const ctx = await routed(await browser.newContext({ viewport: { width: 412, height: 915 }, recordVideo: { dir: OUT + "raw4/", size: { width: 412, height: 915 } } }));
  const c = api.cookie(); const i = c.indexOf("=");
  await ctx.addCookies([{ name: c.slice(0, i), value: c.slice(i + 1), url: BASE }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate((cid) => localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })), child.id);
    await page.goto(`${BASE}/c/${child.id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    L("home");
    await page.locator("a.cs-nav-item", { hasText: /^\s*Map\s*$/ }).first().click();
    await burst(page, "v-transition-home-to-map", 10, 60);
    await page.waitForTimeout(2000);
    await page.locator("a.cs-nav-item", { hasText: /^\s*Today\s*$/ }).first().click();
    await burst(page, "v-transition-map-to-home", 10, 60);
    await page.waitForTimeout(2000);
    L("start");
    await page.locator('[data-testid="start-lesson"]').first().click();
    await burst(page, "v-transition-home-to-lesson", 16, 80);
    await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
    const notNow = page.locator("button", { hasText: /^\s*Not now\s*$/ }).first();
    for (let k = 0; k < 20 && !(await vis(notNow)); k++) await page.waitForTimeout(500);
    if (await vis(notNow)) await notNow.click();
    L("lesson up; teacher speaking");
    await burst(page, "v-teacher-speaking", 20, 100);
    await page.waitForTimeout(4000);
    const turns = [];
    page.on("response", async (r) => { if (r.url().endsWith("/api/lesson/turn")) { const j = await r.json().catch(() => null); if (j) turns.push(j); } });
    const say = async (text) => {
      const n = turns.length;
      const input = page.locator('[data-testid="child-input"]');
      if (!(await vis(input))) await page.locator('[data-testid="type"]').click({ timeout: 5000 }).catch(() => {});
      if (await vis(page.locator('[data-testid="number-pad"]'))) {
        for (const d of String(text).replace(/\D/g, "").slice(0, 6) || "7") await page.locator('[data-testid="number-pad"] .dk-key', { hasText: new RegExp(`^${d}$`) }).first().click({ timeout: 5000 }).catch(() => {});
        await page.locator('[data-testid="pad-send"], [data-testid="number-pad"] .dk-key--send').first().click({ timeout: 5000 }).catch(() => {});
      } else {
        await input.fill(text, { timeout: 8000 }).catch(() => {});
        await page.locator('[data-testid="send"]').click({ timeout: 5000 }).catch(() => {});
      }
      await burst(page, `v-after-answer-${n + 1}`, 14, 100);
      for (let k = 0; k < 60 && turns.length <= n; k++) await page.waitForTimeout(500);
      await page.waitForTimeout(5000);
      return turns.at(-1);
    };
    const t1 = await say("haan, ready hoon");
    L("turn1", t1?.move?.kind, t1?.ui?.ask?.itemId ?? "-");
    const t2 = await say("12");
    L("turn2", t2?.move?.kind, t2?.ui?.verdict ?? "-");
    const t3 = await say("pata nahi");
    L("turn3", t3?.move?.kind, t3?.ui?.verdict ?? "-");
    await page.locator('[data-testid="pause"]').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.locator('[data-testid="pause-end"]').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.locator('[data-testid="end-end"]').click({ timeout: 5000 }).catch(() => {});
    const s = await page.waitForSelector('[data-testid="summary"]', { timeout: 60_000 }).catch(() => null);
    ok(!!s, "summary reached in the recorded session");
    await burst(page, "v-summary", 6, 150);
    await page.waitForTimeout(2000);
    videoPath = await page.video()?.path();
  } catch (e) { warn(`motion: ${e.message}`); videoPath = await page.video()?.path().catch(() => null); }
  finally { await ctx.close(); }
}, { tag: "r4audit4", child: { classLevel: 6 } });
await browser.close();
if (videoPath && existsSync(videoPath)) { renameSync(videoPath, OUT + "lesson-session-412x915.webm"); L("video", OUT + "lesson-session-412x915.webm"); }
done();
