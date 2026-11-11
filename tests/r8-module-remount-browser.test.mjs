// A module mounted twice (Studio, 2026-11-11): React StrictMode on the dev server runs the host's effect twice, and a turn
// can re-send the very mount command the board already shows. Either way the tray must keep showing the module: a second
// mount with the same engine, params and goal is idempotent (the live frame stays; no spare is adopted, no frame dropped).
// Drives the REAL child route (tests/support/app-server.mjs: dist/, or the dev server when dist/ is stale) with the API
// mocked by page.route. Runs in `npm test` when Chromium is installed; MODULE_REMOUNT_BROWSER=0 skips it.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "fs";
import { expand } from "../server/forge/explainer/templates.js";

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.MODULE_REMOUNT_BROWSER === "0" ? "MODULE_REMOUNT_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
const KID = { id: "kid-remount", first_name: "Kabir", class_level: 6, language_pref: "hinglish", teacher_id: "arjun" };

let app, browser, base;
before(async () => {
  if (SKIP) return;
  const { appServer } = await import("./support/app-server.mjs");
  app = await appServer();
  base = app.url;
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await app?.close(); });

async function lessonWith({ ui, moduleCommands = [], turn = null }) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: "L-rm", topic: { id: "c5-maths-ch02-t01", title: "Fractions", chapter: "Fractions" },
      teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands, ui, teacherOpening: "Dekho.", teacherOpeningSeq: 1 });
    if (p === "/api/lesson/turn") return json(200, { move: { kind: "explain", shape: "x" }, moduleCommands: turn?.moduleCommands ?? [], ui: turn?.ui ?? ui, teacherReply: "Hmm.", teacherReplySeq: 2 });
    if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${base}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="lesson"]', { timeout: 30_000 });
  return { page, ctx };
}
async function typeTurn(page, text) {
  const input = await page.waitForSelector("input.dk-input, textarea.dk-input", { timeout: 8000 }).catch(() => null);
  if (!input) { const type = await page.$('[data-testid="type"]'); if (type) await type.click(); }
  await page.fill("input.dk-input, textarea.dk-input", text);
  await page.keyboard.press("Enter");
}
const TRAY_FRAME = '[data-testid="tray"][data-kind="module"] iframe[data-engine="explainer@1"]';
/** The tray's module frame paints its board (its explainer svg holds a drawn shape). */
async function paints(page) {
  const iframe = await page.waitForSelector(TRAY_FRAME, { timeout: 30_000 });
  const frame = await iframe.contentFrame();
  await frame.waitForSelector('[data-testid="explainer"] svg rect, [data-testid="explainer"] svg path', { timeout: 15_000, state: "attached" });
  return iframe;
}

test("a mount command re-sent unchanged keeps the module on screen: the same frame stays, no spare is adopted, nothing is dropped", { skip: SKIP, timeout: 180_000 }, async () => {
  const x = expand({ template: "fraction-parts@1", whole: "circle", parts: 4, shade: 3 }, { lessonId: "L-rm", scriptId: "s-rm" });
  const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "module" };
  const mount = [{ op: "mount", moduleId: "m1", engine: "explainer@1", params: { script: x.script, template: "fraction-parts@1", mode: "play", delayMs: 0 } }];
  const { page, ctx } = await lessonWith({ ui, moduleCommands: mount, turn: { ui, moduleCommands: mount } });
  try {
    const first = await paints(page);
    const firstSrc = await first.getAttribute("src");
    // a spare is booted once the page is idle; wait for it so the re-sent mount COULD adopt it (the failing path)
    await page.waitForSelector('iframe[data-spare-frame="1"]', { state: "attached", timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await typeTurn(page, "ok");
    await page.waitForTimeout(1500);
    const again = await paints(page);
    assert.equal(await page.$$eval(TRAY_FRAME, (fs) => fs.length), 1, "one module frame in the tray");
    assert.equal(await again.getAttribute("src"), firstSrc, "the same frame document stays (no remount, no spare adopted)");
    assert.equal(await page.$$eval('[data-testid="tray"] [data-status="dead"], [data-testid="tray"] [data-notice]', (n) => n.length), 0, "no dead or slow notice");
  } finally { await ctx.close(); }
});
