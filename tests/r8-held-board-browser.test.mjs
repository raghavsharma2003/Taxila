// dc-r7-held-board (main's v6.8): the picture's split board on the REAL child route at 360 × 640 portrait — both panels readable
// (their words no smaller than the same held board's words drawn alone), no word clipped by the stage box, no tap target on the
// board. Drives /c/:cid/lesson/new?mode=text with the API mocked (as tests/studio-stage-geometry.test.mjs) and the whiteboard
// player drawing the artifact Studio's held-board path builds. STUDIO_BROWSER=0 or no Chromium skips it.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "fs";
import * as BF from "../server/stagecraft/board-first.js";

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.STUDIO_BROWSER === "0" ? "STUDIO_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
const KID = { id: "kid-held", first_name: "Riya", class_level: 4, language_pref: "hinglish", teacher_id: "arjun" };

let app, browser, base;
before(async () => {
  if (SKIP) return;
  app = await (await import("./support/app-server.mjs")).appServer();
  base = app.url;
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await app?.close(); });

/** The board's words as drawn at a viewport: the stage box, every <text>'s box and font px, and anything tappable inside it. */
async function drawnAt(viewport, script) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "studio",
    studioSlot: { slotId: "slot1", intentId: "i1", state: "revealed", artifact: { kind: "whiteboard", stage: { w: script.board.w, h: script.board.h }, script } },
    ask: { text: "Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?", itemId: "i1" } };
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: "L-held", topic: { id: "c4-maths-ch05-t01", title: "Fractions", chapter: "Fractions" },
      teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui, teacherOpening: "Dekho.", teacherOpeningSeq: 1 });
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${base}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="studio-box"] svg text', { timeout: 30_000 });
  await page.waitForTimeout(script.durationMs + 1200);   // the drawing done: every word on the board
  const m = await page.evaluate(() => {
    const r = (e) => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, w: x.width, h: x.height }; };
    const box = document.querySelector('[data-testid="studio-box"]');
    const texts = [...box.querySelectorAll("svg text")].filter((t) => (t.textContent ?? "").trim() && getComputedStyle(t).opacity !== "0")
      .map((t) => ({ text: t.textContent, b: r(t), px: t.getBoundingClientRect().height }));
    const taps = [...box.querySelectorAll("button, a, [role=button], input")].map((e) => r(e));
    return { box: r(box), texts, taps };
  });
  await page.close();
  return m;
}

test("the held board's picture split at 360 × 640 portrait: every word inside the stage box, both panels' words as large as the held board's words drawn alone, nothing tappable under 44 px", { skip: SKIP, timeout: 240_000 }, async () => {
  const PIZZA = { template: "wholes@1", params: { wholes: [{ parts: 3, equal: false, title: "Pizza" }] } };
  const RECT = { template: "measured@1", params: { shape: "rect", unit: "cm", w: 14, h: 9 } };
  for (const [ref, answers] of [[PIZZA, ["No"]], [RECT, ["46 cm"]]]) {
    const ask = (request) => ({ intent: { intentId: `hb:${ref.template}:${!!request}`, lessonId: "hb", kind: "whiteboard", style: { band: "B3" }, boardRef: ref, scriptBeat: { kind: "check", ownBoard: true, answers },
      held: { board: ref, unit: "u" }, ...(request ? { request } : {}) }, line: { text: "" }, mode: "fresh" });
    const alone = BF.heldBoard(ask(null), {}), split = BF.heldBoard(ask({ kind: "picture" }), {});
    assert.ok(alone?.script && split?.split, ref.template);
    const a = await drawnAt({ width: 360, height: 640 }, alone.script);
    const s = await drawnAt({ width: 360, height: 640 }, split.script);
    assert.ok(s.texts.length > a.texts.length, `${ref.template}: the view's words are drawn too (${a.texts.length} → ${s.texts.length})`);
    for (const t of s.texts) {
      const inside = t.b.x >= s.box.x - 1 && t.b.y >= s.box.y - 1 && t.b.x + t.b.w <= s.box.x + s.box.w + 1 && t.b.y + t.b.h <= s.box.y + s.box.h + 1;
      assert.ok(inside, `${ref.template}: "${t.text}" clipped (${JSON.stringify(t.b)} vs box ${JSON.stringify(s.box)})`);
    }
    const minPx = (m) => Math.min(...m.texts.map((t) => t.px));
    assert.ok(minPx(s) >= minPx(a) - 0.5, `${ref.template}: split words ${minPx(s).toFixed(1)} px vs alone ${minPx(a).toFixed(1)} px`);
    for (const b of s.taps) assert.ok(b.w >= 44 && b.h >= 44, `${ref.template}: a tap target ${b.w}×${b.h} on the board`);
  }
});
