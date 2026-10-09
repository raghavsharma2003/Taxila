// Supplement: (1) Arjun's face as a real phone with a working GPU gets it (?face=B: the 3D head; headless Chromium's
// SwiftShader is on the KNOWN_BAD_GPU list, so the main capture showed tier D, the 2D plate); (2) the pause sheet, the
// end confirm and the end-of-lesson summary via Pause → End (deterministic); (3) a parent lesson card after that lesson.
// Account: tests/prod/lib.mjs withTestAccount (w0 flow), deleted in its finally.
import { mkdirSync, writeFileSync } from "node:fs";
import { withTestAccount, ok, warn, done, BASE } from "/home/user/Taxila/tests/prod/lib.mjs";
const ROOT = process.env.AUDIT_OUT;
const SHOTS = ROOT + "shots/";
mkdirSync(SHOTS, { recursive: true });
const SIZES = [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1366, height: 768 }];
const L = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("/home/user/Taxila/node_modules/playwright/index.mjs");
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
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
async function shoot(page, name, sizes = SIZES, settle = 700) {
  const orig = page.viewportSize();
  for (const s of sizes) { await page.setViewportSize(s); await page.waitForTimeout(settle); await page.screenshot({ path: `${SHOTS}${name}__${s.width}x${s.height}.png` }); }
  if (orig) await page.setViewportSize(orig);
  L("shot", name);
}
const vis = (l) => l.isVisible().catch(() => false);
const PIN = "2468";

await withTestAccount(async ({ api, child, password }) => {
  try {
    const { child: dev } = await api("POST", "/api/children", { firstName: "Dev", classLevel: 7, languagePref: "hinglish", interests: ["space"] });
    await api("POST", "/api/consent", { childId: dev.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: dev.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    await api("POST", "/api/parent/pin", { pin: PIN, password });
    const ctx = await routed(await browser.newContext({ viewport: SIZES[0] }));
    const c = api.cookie(); const i = c.indexOf("=");
    await ctx.addCookies([{ name: c.slice(0, i), value: c.slice(i + 1), url: BASE }]);
    const page = await ctx.newPage();
    for (const k of [child, dev]) {
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      await page.evaluate((cid) => localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })), k.id);
    }
    const webgl = await page.evaluate(() => { try { const c = document.createElement("canvas"); const g = c.getContext("webgl2"); return g ? (g.getParameter(g.RENDERER) || "webgl2") : "none"; } catch (e) { return "err"; } });
    L("webgl2:", webgl);
    // (1) Arjun at tier B
    await page.goto(`${BASE}/c/${dev.id}/teacher?face=B`, { waitUntil: "networkidle" });
    await page.waitForTimeout(6000);
    await shoot(page, "child-b3-teacher-faceB");
    await page.goto(`${BASE}/c/${dev.id}?face=B`, { waitUntil: "networkidle" });
    await page.waitForTimeout(6000);
    await shoot(page, "child-b3-home-faceB");
    // (2) a lesson at tier B, then Pause → End → Summary
    await page.goto(`${BASE}/c/${dev.id}/lesson/new?mode=text&face=B`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
    await page.waitForTimeout(9000);
    await shoot(page, "lesson-b3-faceB-start");
    const input = page.locator('[data-testid="child-input"]');
    if (await vis(input)) { await input.fill("haan, ready"); await page.locator('[data-testid="send"]').click().catch(() => {}); await page.waitForTimeout(9000); }
    await shoot(page, "lesson-b3-faceB-turn2");
    await page.locator('[data-testid="pause"]').click().catch(() => {});
    await page.waitForTimeout(1200);
    await shoot(page, "lesson-pause-sheet");
    await page.locator('[data-testid="pause-end"]').click().catch(() => {});
    await page.waitForTimeout(1200);
    await shoot(page, "lesson-end-confirm");
    await page.locator('[data-testid="end-end"]').click().catch(() => {});
    const sum = await page.waitForSelector('[data-testid="summary"], [data-testid="summary-show"]', { timeout: 60_000 }).catch(() => null);
    ok(!!sum, "the end-of-lesson summary appears after Pause → End");
    await page.waitForTimeout(4000);
    await shoot(page, "lesson-summary");
    // (3) the young summary: Riya-like class 5 is older; the w0 child is class 5. A class 4 sibling for the Young summary
    const { child: kid } = await api("POST", "/api/children", { firstName: "Tara", classLevel: 4, languagePref: "hinglish", interests: ["drawing"] });
    await api("POST", "/api/consent", { childId: kid.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: kid.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    await page.evaluate((cid) => localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })), kid.id);
    await page.goto(`${BASE}/c/${kid.id}/lesson/new`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
    await page.waitForTimeout(9000);
    const notNow = page.locator("button", { hasText: /^\s*Not now\s*$/ }).first();
    if (await vis(notNow)) { await notNow.click(); await page.waitForTimeout(6000); }
    await shoot(page, "lesson-b2-voice-start");
    const tile = page.locator('[data-testid="choices"] button').first();
    if (await vis(tile)) { await shoot(page, "lesson-b2-tiles"); await tile.click().catch(() => {}); await page.waitForTimeout(8000); await shoot(page, "lesson-b2-after-tile"); }
    await page.locator('[data-testid="pause"]').click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="pause-end"]').click().catch(() => {});
    await page.waitForTimeout(1000);
    await shoot(page, "lesson-b2-end-confirm");
    await page.locator('[data-testid="end-end"]').click().catch(() => {});
    const sum2 = await page.waitForSelector('[data-testid="summary"]', { timeout: 60_000 }).catch(() => null);
    ok(!!sum2, "the Young summary appears");
    await page.waitForTimeout(3000);
    await shoot(page, "lesson-b2-summary");
    await ctx.close();
  } finally {
    await api("POST", "/api/parent/unlock", { pin: PIN }).catch((e) => warn(`unlock: ${e.message}`));
  }
}, { tag: "r4audit3" });
await browser.close();
done();
