// JRN-01 (journey audit 2026-11-09, routed to voice by main): when her speech cannot be fetched (every speech route 503),
// her words still reach the screen as text within a couple of seconds and the lesson moves on: the caption steps through
// her line (the floor never reaches "speaking", which used to hide it), and the live region announces her line instead of
// keeping "Asha is thinking". Drives the real app (dist/) in Chromium with mocked APIs, like the other *-browser suites.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "fs";

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
const KID = { id: "kid-jrn01", first_name: "Kabir", class_level: 5, language_pref: "hinglish", teacher_id: "asha" };
const LESSON = "aaaaaaaa-1111-4222-8333-4444444444a1";
const OPENING = "Chalo, aaj angles dekhte hain. Ready ho?";
const REPLY = "Bahut badhiya. Ek angle do lines se banta hai.";

let app, browser;
before(async () => {
  if (SKIP) return;
  const { appServer } = await import("./support/app-server.mjs");
  app = await appServer();
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await app?.close(); });

test("JRN-01: speech fails (503) → her words show as text within seconds, the turn ends, no stale 'is thinking'", { skip: SKIP, timeout: 240_000 }, async () => {
  const page = await (await browser.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true })).newPage();
  const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words" };
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (s, b) => route.fulfill({ status: s, contentType: "application/json", body: JSON.stringify(b) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "G" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: LESSON, topic: { id: "c5-maths-ch05-t01", title: "Angles", chapter: "Angles" },
      teacher: { id: "asha", name: "Asha", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui, teacherOpening: OPENING, teacherOpeningSeq: 1 });
    if (p === "/api/lesson/turn" || p === "/api/lesson/turn-audio") return json(200, { move: { kind: "explain", shape: "x" }, moduleCommands: [], ui, teacherReply: REPLY, teacherReplySeq: 2 });
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${app.url}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="lesson"]', { timeout: 120_000 });
  const captions = () => page.evaluate(() => [...document.querySelectorAll('[data-testid="caption"]')].map((e) => e.textContent).join(" "));
  const live = () => page.evaluate(() => document.querySelector('[data-testid="spoken"]')?.textContent ?? "");
  // the opening: its first sentence is on screen within a few seconds of the failed speech
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="caption"]')].some((e) => /aaj angles/.test(e.textContent)), null, { timeout: 15_000 });
  // a typed answer: her reply shows and is announced within a few seconds; nothing says she is still thinking
  await page.fill('[data-testid="child-input"]', "yes");
  await page.press('[data-testid="child-input"]', "Enter");
  const t0 = Date.now();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="caption"]')].some((e) => /do lines se|Bahut badhiya/.test(e.textContent)), null, { timeout: 5_000 });
  assert.ok(Date.now() - t0 < 5_000);
  await page.waitForFunction((r) => (document.querySelector('[data-testid="spoken"]')?.textContent ?? "") === r, REPLY, { timeout: 5_000 });
  assert.doesNotMatch(await live(), /is thinking/);
  assert.equal(await page.evaluate(() => document.querySelector("[data-floor]")?.getAttribute("data-floor")), "your_turn", "the lesson moved on: the child's turn");
  assert.match(await captions(), /do lines se|Bahut badhiya/);
  await page.close();
});
