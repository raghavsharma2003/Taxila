// W1-B #3/#4, Desk level: the engine frame fills the Work tray, and a failing module leaves no empty tray.
// Live-content audit 3 measured a 150 px iframe inside a 404 px tray on production (the number line's Check at y = 223,
// out of view): tests/engines-browser.test.mjs mounts the frame directly at 360 x 900, so it never saw the Desk's
// tray. This drives the REAL child route (/c/:cid/lesson/new?mode=text on the Vite dev server: ChildShell,
// LessonScreen, useDesk, Desk, WorkTray, ModuleHost, the sandboxed frame) at 360 x 800 with the API mocked by
// page.route (the Director's start response carries the mount command and ui.tray "module"), and measures:
//   - the iframe's height equals the tray body's height (±2 px), and every engine control lies inside the iframe;
//   - an unknown engine (the frame posts `error`) takes the module off the tray at once: no visible empty box.
// Runs in `npm test` when Chromium is installed (PLAYWRIGHT_BROWSERS_PATH); ENGINES_BROWSER=0 skips it.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.ENGINES_BROWSER === "0" ? "ENGINES_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
const KID = { id: "kid-geo", first_name: "Kabir", class_level: 6, language_pref: "hinglish", teacher_id: "arjun" };

let vite, browser, base;
before(async () => {
  if (SKIP) return;
  const { createServer } = await import("vite");
  vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "error", server: { port: 0, strictPort: false, host: "127.0.0.1", hmr: false } });
  await vite.listen();
  base = vite.resolvedUrls.local[0].replace(/\/$/, "");
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
});
after(async () => {
  await browser?.close();
  await vite?.close();
});

/** The child route with a Director whose opening mounts `mount` and puts it in the tray. */
async function lessonWith(mount) {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const ui = { status: "your_turn", phase: "teach", handover: "answer", answerForm: "words", tray: "module", ask: { text: "Where does 3/4 go on the line?", itemId: "i1" } };
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: "L-geo", topic: { id: "c5-maths-ch02-t01", title: "Fractions on a line", chapter: "Fractions" },
      teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [mount], ui,
      teacherOpening: "Line dekho.", teacherOpeningSeq: 1 });
    if (p === "/api/lesson/turn") return json(200, { move: { kind: "probe", shape: "x" }, moduleCommands: [], ui, teacherReply: "Hmm.", teacherReplySeq: 2 });
    if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
    if (p.startsWith("/api/tts")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${base}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="lesson"]', { timeout: 30_000 });
  return page;
}

test("the engine frame fills the Work tray at 360 x 800; every control is inside the frame", { skip: SKIP, timeout: 120_000 }, async () => {
  const page = await lessonWith({ op: "mount", moduleId: "m9", engine: "number-line@1", params: { mode: "place", target: "3/4", topicId: "c5-maths-ch02-t01", lang: "english" } });
  try {
    const iframe = await page.waitForSelector('[data-testid="tray"][data-kind="module"] iframe[data-engine="number-line@1"]', { timeout: 30_000 });
    const frame = await iframe.contentFrame();
    await frame.waitForSelector("button", { timeout: 30_000 });
    await page.waitForTimeout(300);   // the Desk settles its zones
    const [box, tray] = await Promise.all([iframe.boundingBox(), page.$eval('[data-testid="tray"] .dk-tray-body', (e) => { const r = e.getBoundingClientRect(); return { y: r.y, height: r.height }; })]);
    assert.ok(box.height > 150, `the frame is not the 150 px default (${box.height})`);
    assert.ok(Math.abs(box.height - tray.height) <= 2, `iframe ${box.height} px vs tray ${tray.height} px`);
    const inner = await frame.evaluate(() => ({ h: innerHeight, w: innerWidth, out: [...document.querySelectorAll("button, input")].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && (r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.top < -1 || r.left < -1);
    }).map((e) => e.textContent?.trim() || e.getAttribute("aria-label")) }));
    assert.deepEqual(inner.out, [], `controls outside the ${inner.w} x ${inner.h} frame`);
  } finally { await page.close(); }
});

test("an unknown engine leaves no visible empty tray", { skip: SKIP, timeout: 120_000 }, async () => {
  const page = await lessonWith({ op: "mount", moduleId: "m10", engine: "nope@1", params: {} });
  try {
    await page.waitForSelector('[data-testid="lesson"]', { timeout: 30_000 });
    // the frame boots, says ready, gets init, and posts `error: unknown engine nope@1`
    await page.waitForFunction(() => {
      const t = document.querySelector('[data-testid="tray"][data-kind="module"]');
      if (!t) return true;
      const m = t.querySelector(".dk-module");
      return !!m && getComputedStyle(m).display === "none";
    }, null, { timeout: 30_000 });
    await page.waitForTimeout(500);
    const visibleEmpty = await page.evaluate(() => {
      const t = document.querySelector('[data-testid="tray"][data-kind="module"]');
      if (!t) return null;
      const m = t.querySelector(".dk-module");
      return !m || getComputedStyle(m).display !== "none" ? "module tray showing" : "module tray kept (hidden frame)";
    });
    assert.ok(visibleEmpty === null || visibleEmpty === "module tray kept (hidden frame)", String(visibleEmpty));
  } finally { await page.close(); }
});
