// End-to-end TEXT-MODE check of the client live-lesson runtime in real Chromium (not part of `npm test`:
// it needs the network for Neon + Azure TTS).
//
//   NODE_USE_ENV_PROXY=1 node tests/client-e2e.mjs [--base http://localhost:5173] [--shots <dir>]
//
// Without --base it starts its own API (the dev-api code path: .env.local + server/index.js) and a Vite dev
// server on spare ports, so it never collides with servers other work has running. It drives /dev/lesson:
// create a test family → start a text lesson → two child turns → mount fraction-bars → shade 3/4 → goal_met
// reaches the Director → unknown engine shows "coming soon" → highlight/reveal → end.
// If /api/lesson/* is not implemented yet (404 "no route"), those three routes are mocked IN THIS TEST
// ONLY with a scripted Director; the real auth, consent, TTS and every client file are exercised for real.
import http from "http";
import { readFileSync, mkdirSync } from "fs";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const shots = arg("--shots");
if (shots) mkdirSync(shots, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// ───────────── servers ─────────────
let base = arg("--base");
const stops = [];
if (!base) {
  for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  const { handle } = await import("../server/index.js");
  const api = http.createServer(handle);
  await new Promise((r) => api.listen(0, "127.0.0.1", r));
  const apiPort = api.address().port;
  stops.push(() => api.close());
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: ROOT,
    configFile: ROOT + "vite.config.ts",
    logLevel: "warn",
    server: { port: 0, strictPort: false, proxy: { "/api": `http://127.0.0.1:${apiPort}` } },
  });
  await vite.listen();
  stops.push(() => vite.close());
  base = vite.resolvedUrls.local[0].replace(/\/$/, "");
  console.log(`servers: app ${base}, api :${apiPort}`);
}

// Is the real lesson Director there? A missing route answers 404 "no route ..."; a real one 400/401.
const probe = await fetch(`${base}/api/lesson/start`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
const probeBody = await probe.text();
const mockDirector = probe.status === 404 && probeBody.includes("no route");
console.log(mockDirector ? "lesson routes: not implemented yet → scripted mock Director (test-only)" : `lesson routes: real (probe ${probe.status})`);

// ───────────── browser ─────────────
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({ viewport: { width: 360, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(`${m.location()?.url?.split("/").pop() || "?"}: ${m.text()}`);
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

const director = { turns: [], ends: [], starts: [] };
if (mockDirector) {
  let n = 0;
  await page.route("**/api/lesson/**", async (route) => {
    const url = new URL(route.request().url());
    const body = route.request().postDataJSON() ?? {};
    const json = (b) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) });
    if (url.pathname === "/api/lesson/start") {
      director.starts.push(body);
      return json({
        lessonId: "mock-lesson-1",
        topic: { id: "c4-maths-fractions", title: "Halves and quarters", chapter: "Fractions" },
        instructions: "MOCK INSTRUCTIONS 0",
        teacher: { id: "asha", name: "Asha", voice: "marin" },
        moduleCommands: [],
        ui: { whiteboard: { kind: "text", value: "3/4" } },
        teacherOpening: "Namaste Aarav! Aaj hum fractions dekhenge.",
      });
    }
    if (url.pathname === "/api/lesson/turn") {
      director.turns.push(body);
      n++;
      const goal = body.moduleEvents?.find((e) => e.type === "goal_met");
      const mount = n === 2 && [{ op: "mount", moduleId: "fb-1", engine: "fraction-bars@1", params: { denominators: [4], target: "3/4" }, goal: "shade 3/4" }];
      return json({
        instructions: `MOCK INSTRUCTIONS ${n}`,
        move: { kind: mount ? "show_module" : goal ? "celebrate" : "probe", shape: "mock" },
        moduleCommands: mount || [],
        ui: mount ? { chips: [{ id: "c-ready", label: "Ready" }] } : {},
        teacherReply: goal ? "Teen hisse rang diye: three quarters." : `Turn ${n}: tumne kaha ${body.childText || "kuch nahi"}.`,
      });
    }
    if (url.pathname === "/api/lesson/end") {
      director.ends.push(body);
      return json({ ok: true });
    }
    return route.continue();
  });
}

// Every Director answer the page applied (real or mocked), for diagnosing what it asked the client to do.
const turnResponses = [];
page.on("response", async (r) => {
  if (!r.url().endsWith("/api/lesson/turn") || r.status() !== 200) return;
  const b = await r.json().catch(() => null);
  if (b) turnResponses.push({ move: b.move?.kind, moduleCommands: b.moduleCommands, end: b.end });
});
const ttsResponses = [];
page.on("response", (r) => {
  if (r.url().endsWith("/api/tts")) ttsResponses.push({ status: r.status(), type: r.headers()["content-type"] });
});

const teacherCaptions = () => page.locator('[data-testid="caption"][data-who="teacher"]');
// A real child waits for the teacher to finish; typing over her is a barge-in (it aborts her speech).
const yourTurn = () =>
  page.waitForFunction(() => document.querySelector('[data-testid="status"]')?.getAttribute("data-status") === "your_turn", null, { timeout: 30_000 });
// Before clicking anything: no Director call in flight and the teacher quiet. A Director answer can change
// the whiteboard/chips and shift the layout under a pending click (seen with the real Director: a click
// meant for a dev button landed on a fraction part inside the frame).
const settled = () =>
  page.waitForFunction(
    () =>
      document.querySelector('[data-testid="pending"]')?.getAttribute("data-pending") === "0" &&
      document.querySelector('[data-testid="status"]')?.getAttribute("data-status") === "your_turn",
    null,
    { timeout: 45_000 },
  );
const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });

try {
  await page.goto(`${base}/dev/lesson`);
  await page.getByTestId("create-family").click();
  await page.getByTestId("start").waitFor({ timeout: 20_000 });
  check("test family created (signup + child + consent) and signed in", true);

  await page.getByTestId("mode-text").check();
  await page.getByTestId("start").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="phase"]')?.textContent?.includes("live"), null, { timeout: 30_000 });
  await teacherCaptions().first().waitFor({ timeout: 20_000 });
  const opening = await teacherCaptions().first().textContent();
  check("text lesson started, teacher opening shown", /Namaste|.+/.test(opening ?? ""), opening?.trim());
  await yourTurn();
  check("status reaches 'your turn' after the teacher speaks", true);
  check("opening spoken via /api/tts (audio/mpeg)", ttsResponses[0]?.status === 200 && ttsResponses[0]?.type === "audio/mpeg", JSON.stringify(ttsResponses[0]));
  await shot("1-opening");

  for (const [i, said] of ["teen chauthai matlab teen hisse", "haan samajh gaya"].entries()) {
    await page.getByTestId("child-input").fill(said);
    await page.getByTestId("send").click();
    await page.waitForFunction((k) => document.querySelectorAll('[data-testid="caption"][data-who="teacher"]').length >= k, i + 2, { timeout: 45_000 });
    const reply = await teacherCaptions().nth(i + 1).textContent();
    check(`child turn ${i + 1} → teacher reply shown`, !!reply?.trim(), reply?.trim());
    await yourTurn();
  }
  if (mockDirector) {
    const [t1, t2] = director.turns;
    check("turn 1 request: typed child text + the teacher turn it answered", t1?.childText === "teen chauthai matlab teen hisse" && t1?.typed === true && /Namaste/.test(t1?.teacherText ?? ""), JSON.stringify(t1));
    check("turn 2 request carries turn-1 reply as teacherText", /Turn 1/.test(t2?.teacherText ?? ""), t2?.teacherText);
  }

  // Module: Director-mounted in mock mode, otherwise mounted by the dev button.
  await settled();
  if (!mockDirector) await page.getByTestId("dev-mount").click();
  const iframe = page.locator("iframe[data-engine='fraction-bars@1']").first();
  await iframe.waitFor({ timeout: 15_000 });
  check("iframe is sandboxed allow-scripts only", (await iframe.getAttribute("sandbox")) === "allow-scripts");
  const frame = page.frameLocator("iframe[data-engine='fraction-bars@1']").first();
  await frame.locator(".fb-part").first().waitFor({ timeout: 15_000 });
  check("fraction-bars@1 mounted and rendered inside the frame", (await frame.locator(".fb-part").count()) === 4);
  if (mockDirector) check("Director chips rendered", (await page.getByTestId("chips").locator("button").count()) === 1);
  const fbFrame = page.frames().find((f) => f.url().includes("/modules.html#"));
  const isolation = await fbFrame.evaluate(() => {
    const blocked = (fn) => { try { fn(); return false; } catch { return true; } };
    return { parentDom: blocked(() => window.parent.document.title), cookie: blocked(() => document.cookie), storage: blocked(() => localStorage.length), origin: self.origin };
  });
  check("frame is isolated (no parent DOM, cookies or storage; opaque origin)", isolation.parentDom && isolation.cookie && isolation.storage && isolation.origin === "null", JSON.stringify(isolation));
  const network = await fbFrame.evaluate(() => fetch("/api/health").then(() => "reached", () => "blocked"));
  check("frame has no network (CSP connect-src 'none')", network === "blocked", network);
  await shot("2-module");

  const turnsBefore = director.turns.length;
  await settled();
  for (const k of [0, 1, 2]) await frame.locator(`.fb-part[data-part="${k}"]`).click();
  await page.waitForFunction(() => !!document.querySelector('[data-testid="module-events"] li[data-type="goal_met"]'), null, { timeout: 10_000 });
  check("shading 3 of 4 parts → goal_met event", true, await frame.locator(".fb-label").first().textContent());
  const shadeEvents = await page.locator('[data-testid="module-events"] li[data-type="interaction"]').count();
  check("shade_changed interactions reported", shadeEvents >= 3, `${shadeEvents} interactions`);
  if (mockDirector) {
    await page.waitForTimeout(500); // the milestone call is in flight; let the mock record it
    const milestone = director.turns.slice(turnsBefore).find((t) => t.moduleEvents?.some((e) => e.type === "goal_met"));
    check("goal_met called the Director at once, with the batched shade events", !!milestone && milestone.childText === "" && milestone.moduleEvents.filter((e) => e.name === "shade_changed").length === 3, JSON.stringify(milestone?.moduleEvents?.map((e) => `${e.type}:${e.name}`)));
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="caption"][data-who="teacher"]').length >= 4, null, { timeout: 30_000 });
    check("teacher reacted to the milestone", /three quarters/.test((await teacherCaptions().nth(3).textContent()) ?? ""));
    await yourTurn();
  }

  await settled();
  await page.getByRole("button", { name: "Highlight bar 0" }).click();
  await frame.locator(".fb-outline.is-highlight").waitFor({ timeout: 5_000 });
  check("highlight command reaches the engine", true);
  await page.getByRole("button", { name: "Reveal" }).click();
  await frame.locator(".fb-part.is-ghost").first().waitFor({ timeout: 5_000 });
  check("reveal command reaches the engine (target outlined)", (await frame.locator(".fb-part.is-ghost").count()) === 3);

  // Compare mode: tap the bigger bar (3/4 vs 2/3) → answer(correct) + goal_met.
  await settled();
  await page.getByRole("button", { name: "Mount compare 3/4 vs 2/3" }).click();
  const cmp = page.frameLocator("iframe[data-engine='fraction-bars@1']").last();
  await cmp.locator('.fb-choice[data-bar="0"]').click();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="module-events"] li[data-type="answer"]')].some((li) => li.textContent.includes('"correct":true')), null, { timeout: 10_000 });
  check("compare mode: tapping 3/4 over 2/3 is a correct answer", true);
  await settled();
  await page.getByTestId("dev-mount-unknown").click();
  const unknown = page.frameLocator("iframe[data-engine='number-line@1']");
  await unknown.locator(".frame-card").waitFor({ timeout: 15_000 });
  check("unknown engine → 'coming soon' card", /coming soon/i.test((await unknown.locator(".frame-card").textContent()) ?? ""));
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="module-events"] li[data-type="error"]')].some((li) => li.textContent.includes("unknown engine")), null, { timeout: 5_000 });
  check("unknown engine emits an error event to the runtime", true);
  await shot("3-unknown");

  await settled();
  await page.getByTestId("end").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="phase"]')?.textContent?.includes("ended"), null, { timeout: 15_000 });
  check("lesson ended", true);
  if (mockDirector) check("POST /api/lesson/end called with the lesson id", director.ends[0]?.lessonId === "mock-lesson-1");
  // A reply that arrives while the previous one is still being fetched supersedes it (its request is
  // aborted), so count only that every completed speech request succeeded, for at least the four turns
  // the test waited out (opening, two child turns, the goal milestone).
  check("teacher replies spoken via /api/tts", ttsResponses.length >= 4 && ttsResponses.every((r) => r.status === 200 && r.type === "audio/mpeg"), `${ttsResponses.length} × ${JSON.stringify(ttsResponses[0])}`);
  // Expected: the signed-out /api/me probe (401), and the frame's CSP refusing Vite's HMR socket (dev) and
  // this test's own fetch probe.
  const cspRefusal = (e) => /Content Security Policy/.test(e) && (/'ws:\/\//.test(e) || /\/api\/health/.test(e));
  const expected = (e) => /^me: .*401/.test(e) || cspRefusal(e);
  const relevant = consoleErrors.filter((e) => !expected(e));
  check("no unexpected console errors", relevant.length === 0, relevant.join(" | "));
} catch (err) {
  check("e2e flow", false, String(err?.stack || err));
  console.log("director answers:", JSON.stringify(turnResponses));
  await shot("error");
} finally {
  await browser.close();
  for (const stop of stops.reverse()) await stop();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${mockDirector ? " (lesson routes mocked in-test)" : ""}`);
process.exitCode = failed.length ? 1 : 0;
assert.ok(results.length > 0);
