// W2-B, Desk level (owner priority 4: anything drawn appears INSIDE its stage area, sized to fit, never overflowing):
//   1. the Studio stage's `whiteboard` renderer draws a real template script inside the StudioStage box at 360 x 800
//      and 1280 x 800: every drawn word and stroke lies inside the box, nothing scrolls; it starts on the line's audio
//      anchor (markLineAudioStart's event) and, with no anchor, on its own after the grace;
//   2. the frame's explainer@1 engine (the explain rung) fills the module tray, and every drawn word lies inside the frame.
// Drives the REAL child route (Vite dev server: ChildShell, LessonScreen, useDesk, Desk, WorkTray, StudioStage / ModuleHost
// and the sandboxed frame) with the API mocked by page.route. Runs in `npm test` when Chromium is installed;
// WHITEBOARD_BROWSER=0 skips it. W2B_SHOTS=<dir> also writes screenshots.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, mkdirSync } from "fs";
import { expand } from "../server/forge/explainer/templates.js";

const ROOT = new URL("..", import.meta.url).pathname;
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.WHITEBOARD_BROWSER === "0" ? "WHITEBOARD_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
const KID = { id: "kid-wb", first_name: "Kabir", class_level: 6, language_pref: "hinglish", teacher_id: "arjun" };
const SHOTS = process.env.W2B_SHOTS;

let vite, browser, base;
before(async () => {
  if (SKIP) return;
  const { createServer } = await import("vite");
  vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "error", server: { port: 0, strictPort: false, host: "127.0.0.1", hmr: false } });
  await vite.listen();
  base = vite.resolvedUrls.local[0].replace(/\/$/, "");
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});
after(async () => {
  await browser?.close();
  await vite?.close();
});

async function lessonWith(viewport, { ui, moduleCommands = [] }, { reducedMotion = "no-preference" } = {}) {
  const mobile = viewport.width < 600;
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile, reducedMotion });
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: "L-wb", topic: { id: "c5-maths-ch02-t01", title: "Fractions", chapter: "Fractions" },
      teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands, ui, teacherOpening: "Dekho.", teacherOpeningSeq: 1 });
    if (p === "/api/lesson/turn") return json(200, { move: { kind: "explain", shape: "x" }, moduleCommands: [], ui, teacherReply: "Hmm.", teacherReplySeq: 2 });
    if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${base}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="lesson"]', { timeout: 30_000 });
  return page;
}

const studioUi = (script) => ({ status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "studio",
  studioSlot: { slotId: "slot1", intentId: "i1", state: "revealed", artifact: { kind: "whiteboard", script } } });

/** Every drawn element of the board, against the box (CSS px). */
const measure = (sel) => (s) => {
  const box = document.querySelector(s.box)?.getBoundingClientRect();
  const els = [...document.querySelectorAll(`${s.box} svg path, ${s.box} svg text`)].map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, t: e.textContent }; });
  return { box: box && { x: box.x, y: box.y, w: box.width, h: box.height }, els, t: Number(document.querySelector(`${s.box} svg`)?.getAttribute("data-wb-t") ?? -1) };
};
void measure;

test("the whiteboard renderer draws a template script inside the Studio box (360 x 800, 1280 x 800); nothing outside it", { skip: SKIP, timeout: 180_000 }, async () => {
  const fails = [];
  for (const [vp, call] of [[{ width: 360, height: 800 }, { template: "cycle@1", stages: ["evaporation", "condensation", "rain", "collection"], centre: "water cycle" }],
    [{ width: 1280, height: 800 }, { template: "compare@1", left: { title: "natural forest", items: ["many plant kinds", "many birds"] }, right: { title: "plantation", items: ["one tree kind", "few birds"] } }],
    [{ width: 360, height: 800 }, { template: "column-op@1", a: 4587, b: 2675, op: "add" }]]) {
    const x = expand(call, { lessonId: "L-wb", scriptId: "s-" + call.template });
    assert.ok(x.ok, call.template);
    // reduced motion: every op appears complete at its startMs, so the final board is reached on the script's own clock
    const page = await lessonWith(vp, { ui: studioUi(x.script) }, { reducedMotion: "reduce" });
    try {
      await page.waitForSelector('[data-testid="studio-box"] svg', { timeout: 30_000 });
      await page.waitForFunction((end) => Number(document.querySelector('[data-testid="studio-box"] svg')?.getAttribute("data-wb-t")) >= end, x.script.durationMs, { timeout: x.script.durationMs + 8000 });
      const m = await page.evaluate(() => {
        const box = document.querySelector('[data-testid="studio-box"]').getBoundingClientRect();
        const els = [...document.querySelectorAll('[data-testid="studio-box"] svg path, [data-testid="studio-box"] svg text')].map((e) => {
          const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, t: e.textContent || e.tagName };
        });
        const tray = document.querySelector('[data-testid="tray"]');
        return { box: { x: box.x, y: box.y, w: box.width, h: box.height }, els, scroll: tray ? tray.scrollHeight - tray.clientHeight : 0, words: els.filter((e) => e.t !== "path").length };
      });
      const tag = `${vp.width}x${vp.height} ${call.template}`;
      if (m.words < 3) fails.push(`${tag}: only ${m.words} words drawn`);
      for (const e of m.els) {
        if (e.w === 0 && e.h === 0) continue;
        if (e.x < m.box.x - 1 || e.y < m.box.y - 1 || e.x + e.w > m.box.x + m.box.w + 1 || e.y + e.h > m.box.y + m.box.h + 1) fails.push(`${tag}: "${e.t}" outside the box ${JSON.stringify(e)} vs ${JSON.stringify(m.box)}`);
      }
      if (m.scroll > 1) fails.push(`${tag}: the tray scrolls`);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/studio-${call.template.replace("@", "-")}-${vp.width}.png` });
    } finally { await page.close(); }
  }
  assert.deepEqual(fails, []);
});

test("the drawing starts on her line's audio anchor, and on its own after the grace when no anchor comes", { skip: SKIP, timeout: 120_000 }, async () => {
  const x = expand({ template: "flow@1", steps: ["sunlight", "leaf", "food"] }, { lessonId: "L-wb", scriptId: "s-anchor" });
  const page = await lessonWith({ width: 360, height: 800 }, { ui: studioUi(x.script) });
  try {
    await page.waitForSelector('[data-testid="studio-box"] svg', { timeout: 30_000 });
    // no anchor yet: within the grace nothing is drawn (the clock reads -1 until it starts)
    const before = await page.$eval('[data-testid="studio-box"] svg', (s) => Number(s.getAttribute("data-wb-t")));
    assert.ok(before <= 0, `drew before any anchor: t=${before}`);
    // the grace (1.2 s) passes: it starts on its own
    await page.waitForFunction(() => Number(document.querySelector('[data-testid="studio-box"] svg')?.getAttribute("data-wb-t")) > 200, null, { timeout: 5000 });
  } finally { await page.close(); }
  const page2 = await lessonWith({ width: 360, height: 800 }, { ui: studioUi({ ...x.script, scriptId: "s-anchor-2" }) });
  try {
    await page2.waitForSelector('[data-testid="studio-box"] svg', { timeout: 30_000 });
    // the line's first audio sample: the drawing's clock is measured from it
    const sent = await page2.evaluate(() => { const at = performance.now(); window.dispatchEvent(new CustomEvent("taxila:line-audio-start", { detail: { lessonId: "L-wb", at } })); return at; });
    await page2.waitForTimeout(400);
    const t = await page2.$eval('[data-testid="studio-box"] svg', (s) => Number(s.getAttribute("data-wb-t")));
    assert.ok(t >= 250 && t <= 1200, `clock follows the anchor (t=${t} ms, ~400 expected)`);
    void sent;
  } finally { await page2.close(); }
});

test("explainer@1 (the explain rung) fills the module tray; every drawn word is inside the frame", { skip: SKIP, timeout: 120_000 }, async () => {
  const x = expand({ template: "fraction-parts@1", whole: "circle", parts: 4, shade: 3 }, { lessonId: "L-wb", scriptId: "s-frac" });
  const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "module" };
  const page = await lessonWith({ width: 360, height: 800 }, { ui, moduleCommands: [{ op: "mount", moduleId: "m1", engine: "explainer@1", params: { script: x.script, template: "fraction-parts@1", mode: "play", delayMs: 0 } }] }, { reducedMotion: "reduce" });
  try {
    const iframe = await page.waitForSelector('[data-testid="tray"][data-kind="module"] iframe[data-engine="explainer@1"]', { timeout: 30_000 });
    const frame = await iframe.contentFrame();
    await frame.waitForSelector('[data-testid="explainer"] svg', { timeout: 30_000 });
    await frame.waitForFunction((end) => Number(document.querySelector("svg")?.getAttribute("data-wb-t")) >= end, x.script.durationMs, { timeout: x.script.durationMs + 8000 });
    const [box, tray] = await Promise.all([iframe.boundingBox(), page.$eval('[data-testid="tray"] .dk-tray-body', (e) => { const r = e.getBoundingClientRect(); return { height: r.height, width: r.width }; })]);
    assert.ok(Math.abs(box.height - tray.height) <= 2, `iframe ${box.height} vs tray ${tray.height}`);
    const out = await frame.evaluate(() => [...document.querySelectorAll("svg text, svg path")].filter((e) => {
      const r = e.getBoundingClientRect();
      return (r.width || r.height) && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || document.documentElement.scrollHeight > innerHeight + 1);
    }).map((e) => e.textContent || e.tagName));
    assert.deepEqual(out, []);
    const words = await frame.$$eval("svg text", (ts) => ts.map((t) => t.textContent));
    assert.ok(words.includes("3") && words.includes("4"), `the fraction is written: ${words}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/explainer-fraction-360.png` });
  } finally { await page.close(); }
});
