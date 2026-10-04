// W2 seam commit, Desk level (owner priority 4): a Studio piece's stage box sits INSIDE the Work tray, keeps its aspect,
// and nothing scrolls or overflows, from a 360 x 800 phone through a desktop. Drives the REAL child route
// (/c/:cid/lesson/new?mode=text on the Vite dev server: ChildShell, LessonScreen, useDesk, Desk, WorkTray, StudioStage)
// with the API mocked by page.route: the Director's start response carries ui.tray "studio" and a studioSlot holding a
// whiteboard artifact. No renderer is registered yet (W2-B fills the whiteboard one), so the box is the empty ground:
// this pins the box, not the drawing. Runs in `npm test` when Chromium is installed; STUDIO_BROWSER=0 skips it.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.STUDIO_BROWSER === "0" ? "STUDIO_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
const KID = { id: "kid-studio", first_name: "Kabir", class_level: 5, language_pref: "hinglish", teacher_id: "arjun" };

let vite, browser, base;
before(async () => {
  if (SKIP) return;
  const { createServer } = await import("vite");
  vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "error", server: { port: 0, strictPort: false, host: "127.0.0.1", hmr: false } });
  await vite.listen();
  base = vite.resolvedUrls.local[0].replace(/\/$/, "");
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await vite?.close();
});

const script = (w, h) => ({ v: 1, scriptId: "s1", line: { lessonId: "L-st" }, anchor: "line_audio_start", board: { w, h, ground: "chalk" }, mode: "fresh",
  durationMs: 2000, ops: [{ id: "a", op: "circle", c: [w / 2, h / 2], r: Math.min(w, h) / 4, startMs: 0, endMs: 600 }] });

async function lessonWith(viewport, board) {
  const mobile = viewport.width < 600;
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
  const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "studio",
    studioSlot: { slotId: "slot1", intentId: "i1", state: "revealed", artifact: { kind: "whiteboard", script: script(board.w, board.h) } },
    ask: { text: "Which is bigger, 1/2 or 1/4?", itemId: "i1" } };
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: "L-st", topic: { id: "c5-maths-ch02-t01", title: "Fractions", chapter: "Fractions" },
      teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui,
      teacherOpening: "Dekho.", teacherOpeningSeq: 1 });
    if (p === "/api/lesson/turn") return json(200, { move: { kind: "explain", shape: "x" }, moduleCommands: [], ui, teacherReply: "Hmm.", teacherReplySeq: 2 });
    if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${base}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="lesson"]', { timeout: 30_000 });
  return page;
}

const VIEWPORTS = [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }, { width: 1920, height: 1080 }];
const BOARDS = [{ w: 400, h: 300 }, { w: 300, h: 400 }, { w: 1600, h: 900 }];

test("the Studio stage box sits inside the Work tray, keeps its aspect, and nothing overflows (360 x 800 → 1920 x 1080)", { skip: SKIP, timeout: 300_000 }, async () => {
  const fails = [];
  for (const vp of VIEWPORTS) for (const board of BOARDS) {
    const page = await lessonWith(vp, board);
    try {
      await page.waitForSelector('[data-testid="tray"][data-kind="studio"] [data-testid="studio-box"]', { timeout: 30_000 });
      await page.waitForFunction(() => { const b = document.querySelector('[data-testid="studio-box"]'); return !!b && b.getBoundingClientRect().width > 0; }, null, { timeout: 10_000 });
      await page.waitForTimeout(250);   // the Desk settles its zones
      const m = await page.evaluate(() => {
        const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
        const tray = document.querySelector('[data-testid="tray"]');
        return { tray: r('[data-testid="tray"] .dk-tray-body'), box: r('[data-testid="studio-box"]'),
          trayScroll: tray ? { sh: tray.scrollHeight, ch: tray.clientHeight, sw: tray.scrollWidth, cw: tray.clientWidth } : null,
          page: { sw: document.documentElement.scrollWidth, iw: innerWidth } };
      });
      const tag = `${vp.width}x${vp.height} board ${board.w}x${board.h}`;
      const { tray, box } = m;
      if (!tray || !box) { fails.push(`${tag}: no tray/box`); continue; }
      if (box.w < 100 || box.h < 75) fails.push(`${tag}: box too small ${box.w}x${box.h}`);
      if (box.x < tray.x - 0.5 || box.y < tray.y - 0.5 || box.x + box.w > tray.x + tray.w + 0.5 || box.y + box.h > tray.y + tray.h + 0.5) fails.push(`${tag}: box outside tray ${JSON.stringify(m)}`);
      if (Math.abs(box.w / box.h - board.w / board.h) > 2 / Math.min(box.w, box.h)) fails.push(`${tag}: aspect ${box.w}x${box.h}`);
      if (m.trayScroll && (m.trayScroll.sh > m.trayScroll.ch + 1 || m.trayScroll.sw > m.trayScroll.cw + 1)) fails.push(`${tag}: tray scrolls ${JSON.stringify(m.trayScroll)}`);
      if (m.page.sw > m.page.iw + 1) fails.push(`${tag}: horizontal page scroll ${m.page.sw} > ${m.page.iw}`);
    } finally { await page.close(); }
  }
  assert.deepEqual(fails, []);
});
