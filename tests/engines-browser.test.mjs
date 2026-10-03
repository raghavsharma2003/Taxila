// Real-browser proof of every v1 engine: mount it in the real sandboxed frame (modules.html through Vite,
// opaque-origin iframe, the host.tsx handshake), drive it to goal_met by tapping like a child, and check the
// event stream (interactions → answer{correct} → goal_met, in order, no errors). Each run also checks the
// touch rules at a 360 px wide viewport: every button ≥ the band's hit size and no horizontal overflow.
// Runs in `npm test` when Chromium is installed (PLAYWRIGHT_BROWSERS_PATH); ENGINES_BROWSER=0 skips it.
// ENGINES_PROD=1 runs the same scenarios against the production build in dist/ (run `npx vite build` first),
// served with server/serve.mjs's frame headers (HTTP sandbox + frame-ancestors, CORS on hashed assets) and
// the build's strict meta CSP — the configuration a phone actually gets.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "fs";
import { SCENARIOS } from "./fixtures/engine-scenarios.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.ENGINES_BROWSER === "0" ? "ENGINES_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;

let server, browser, page, base;
const consoleErrors = [];
async function prodServer() {
  const http = await import("http");
  const { createReadStream, statSync } = await import("fs");
  const { extname, join, normalize } = await import("path");
  const dist = join(ROOT, "dist") + "/";
  const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
  const srv = http.createServer((req, res) => {
    const path = decodeURIComponent((req.url || "/").split("?")[0]);
    const file = path === "/tests/fixtures/engine-harness.html" ? join(ROOT, path) : normalize(join(dist, path));
    let ok = false;
    try { ok = statSync(file).isFile(); } catch { /* 404 */ }
    if (!ok) { res.writeHead(404); return res.end(); }
    const headers = { "content-type": TYPES[extname(file)] || "application/octet-stream" };
    if (path.startsWith("/assets/")) headers["access-control-allow-origin"] = "*";
    if (path === "/modules.html") headers["content-security-policy"] = "sandbox allow-scripts; frame-ancestors 'self'";
    res.writeHead(200, headers);
    createReadStream(file).pipe(res);
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  return { close: () => new Promise((r) => srv.close(r)), url: `http://127.0.0.1:${srv.address().port}/` };
}
before(async () => {
  if (SKIP) return;
  if (process.env.ENGINES_PROD === "1") {
    server = await prodServer();
    base = server.url;
  } else {
    const { createServer } = await import("vite");
    server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0, strictPort: false, hmr: false } });
    await server.listen();
    base = server.resolvedUrls.local[0];
  }
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 360, height: 900 } });
  page.on("pageerror", (e) => console.error("harness pageerror", e));
  // Errors from inside the frame (engine crashes, CSP violations) surface as console errors.
  // The dev server's HMR websocket is refused by the frame CSP on purpose (vite.config.ts): not an engine error.
  const devNoise = /favicon|Connecting to 'ws:\/\/(localhost|127\.0\.0\.1)[^']*' violates|\[vite\]/;
  page.on("console", (m) => { if (m.type() === "error" && !devNoise.test(m.text())) consoleErrors.push(m.text()); });
  await page.goto(`${base}tests/fixtures/engine-harness.html`);
});
after(async () => {
  await browser?.close();
  await server?.close();
});

/** Wait until the recorded event stream satisfies pred (or time out with the stream in the message). */
async function waitEvents(pred, ms = 8000) {
  const t0 = Date.now();
  let evs = [];
  while (Date.now() - t0 < ms) {
    evs = await page.evaluate(() => window.events);
    if (pred(evs)) return evs;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`timed out; events: ${JSON.stringify(evs).slice(0, 1500)}`);
}

/** Touch/layout audit inside the frame: buttons below the hit size and horizontal overflow at 360 px. */
async function audit(frame, hit) {
  return frame.evaluate((hit) => {
    const small = [...document.querySelectorAll("button, [role=button]")]
      .filter((b) => b.offsetParent !== null && !b.closest("[data-exempt-hit]"))
      .map((b) => ({ b, r: b.getBoundingClientRect() }))
      .filter(({ r }) => r.width + 0.5 < hit || r.height + 0.5 < hit)
      .map(({ b, r }) => `${b.className}:${b.textContent?.trim().slice(0, 12)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    const el = document.scrollingElement;
    return { small, overflowX: el.scrollWidth - el.clientWidth };
  }, hit);
}

for (const sc of SCENARIOS) {
  test(`browser: ${sc.name}`, { skip: SKIP }, async () => {
    consoleErrors.length = 0;
    if (sc.reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
    else await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(([e, p, o]) => window.mount(e, p, o), [sc.engine, sc.params, { lang: sc.lang ?? "english", ageBand: sc.ageBand ?? "10-15", goal: sc.goal }]);
    const handle = await page.waitForSelector("iframe");
    const frame = await handle.contentFrame();
    await frame.waitForSelector(`.ek[data-engine]`, { timeout: 15_000 });
    const hit = (sc.ageBand ?? "10-15") === "6-9" ? 64 : 48;
    const a = await audit(frame, hit);
    assert.deepEqual(a.small, [], `targets below ${hit}px`);
    assert.ok(a.overflowX <= 0, `horizontal overflow ${a.overflowX}px at 360px`);
    if (sc.expectText) assert.match(await frame.locator(".ek").innerText(), sc.expectText);
    await sc.drive(frame, { page, waitEvents });
    const evs = await waitEvents((es) => es.some((e) => e.type === "goal_met"));
    const types = evs.map((e) => e.type);
    assert.ok(!types.includes("error"), `error events: ${JSON.stringify(evs.filter((e) => e.type === "error"))}`);
    if (!sc.allowIssues) assert.ok(!evs.some((e) => e.name === "params_adjusted"), `params adjusted: ${JSON.stringify(evs.filter((e) => e.name === "params_adjusted"))}`);
    const gi = types.indexOf("goal_met");
    if (!sc.commitOnly) assert.ok(evs.slice(0, gi).some((e) => e.type === "interaction"), "interactions stream before the goal");
    for (const n of sc.expectInteractions ?? []) assert.ok(evs.some((e) => e.type === "interaction" && e.name === n), `interaction ${n} seen`);
    if (sc.expectAnswer !== false) {
      const answers = evs.filter((e) => e.type === "answer");
      assert.ok(answers.length >= 1, "an answer was committed");
      const last = answers.at(-1);
      assert.equal(last.correct, true, "the last answer is right");
      assert.ok(types.indexOf("answer") < gi, "answer precedes goal_met");
      if (sc.expectWrongFirst) assert.equal(answers[0].correct, false, "the scripted wrong answer was graded wrong");
      sc.checkAnswer?.(last.value, answers);
    }
    assert.equal(evs.filter((e) => e.type === "goal_met").length, 1, "goal_met fires exactly once");
    if (sc.goal) assert.equal(evs.find((e) => e.type === "goal_met").goal, sc.goal);
    if (sc.expectStuck) assert.ok(types.includes("stuck"), "stuck fired on the scripted wrong path");
    if (sc.after) await sc.after(frame, { page, waitEvents });
    assert.deepEqual(consoleErrors, [], "no console errors (engine crash, CSP violation) in the frame");
  });
}
