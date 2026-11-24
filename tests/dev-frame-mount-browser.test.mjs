// The DEV server can mount an engine in the sandboxed module frame (main 2026-11-11, from Games: since the theme work, no
// module tray rendered under APP_SERVER=dev). The frame's document has an opaque origin, so every module script it loads
// is a CORS request with Origin: null, which vite.config.ts devFrameCors answers only for paths in FRAME_GRAPH. The board's
// palette began importing src/theme/palette.ts, which was not on that list, so the frame's import graph was refused and
// nothing mounted. The browser suites run on the built app (dist/), which has no CORS step, so none of them saw it.
//
// This suite forces the dev server and mounts one engine (explainer@1, the board in the frame): it must draw, and no
// module request may be refused. The FRAME_GRAPH check below also fails fast, without a browser, when a file the frame
// imports sits outside the allowed paths.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { expand } from "../server/forge/explainer/templates.js";

const ROOT = new URL("..", import.meta.url).pathname;
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.WHITEBOARD_BROWSER === "0" ? "WHITEBOARD_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
const KID = { id: "kid-devframe", first_name: "Kabir", class_level: 6, language_pref: "hinglish", teacher_id: "arjun" };

// ── static: every source file the board's frame code imports is inside FRAME_GRAPH ───────────────────────────────────
test("every source file the module frame's board imports is on vite.config.ts's FRAME_GRAPH (the dev server's CORS list)", () => {
  const cfg = readFileSync(path.join(ROOT, "vite.config.ts"), "utf8");
  const src = /const FRAME_GRAPH = (\/.*\/);/.exec(cfg)?.[1];
  assert.ok(src, "FRAME_GRAPH found");
  const re = new RegExp(src.slice(1, src.lastIndexOf("/")));
  // walk the relative imports from the frame's entry points (src/modules/**), following .ts/.tsx/.js files
  const seen = new Set(), out = [];
  const visit = (abs) => {
    if (seen.has(abs) || !existsSync(abs)) return; seen.add(abs);
    const rel = "/" + path.relative(ROOT, abs).split(path.sep).join("/");
    if (!re.test(rel)) out.push(rel);
    if (rel.includes("node_modules")) return;
    const text = readFileSync(abs, "utf8");
    for (const m of text.matchAll(/(?:^|\n)\s*(import|export)\s+(type\s)?[^"'`]*?from\s+["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g)) {
      if (m[2]) continue;   // (`import type` / `export type` is erased by the transform: never requested)
      const spec = m[3] ?? m[4]; const next = path.resolve(path.dirname(abs), spec);
      for (const cand of [next, next + ".ts", next + ".tsx", next + ".js", path.join(next, "index.ts")]) if (existsSync(cand) && !cand.endsWith(".css")) { visit(cand); break; }
    }
  };
  const entries = ["src/modules/frame/bootstrap.tsx"].map((f) => path.join(ROOT, f));
  for (const e of entries) assert.ok(existsSync(e), `frame entry ${e}`), visit(e);
  assert.ok(seen.size > 5, `walked the frame's graph (${seen.size} files)`);
  assert.deepEqual(out.filter((f) => !f.endsWith(".css")), [], "a file the frame loads is not on FRAME_GRAPH: the dev server will refuse it (Origin: null)");
});

// ── browser: one engine mounts and draws in the frame on the dev server ───────────────────────────────────────────────
let app, browser, base;
before(async () => {
  if (SKIP) return;
  process.env.APP_SERVER = "dev";
  const { appServer } = await import("./support/app-server.mjs");
  app = await appServer();
  base = app.url;
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await app?.close(); });

test("on the DEV server an engine mounts in the sandboxed frame and draws; no module request is refused by CORS", { skip: SKIP, timeout: 180_000 }, async () => {
  assert.equal(app.kind, "dev");
  const x = expand({ template: "fraction-parts@1", whole: "circle", parts: 4, shade: 3 }, { lessonId: "L-dev", scriptId: "s-dev" });
  const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "module" };
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const refused = [];
  page.on("console", (m) => { const t = m.text(); if (/blocked by CORS|Access-Control-Allow-Origin|Failed to fetch dynamically imported module/.test(t)) refused.push(t.slice(0, 240)); });
  page.on("requestfailed", (r) => { if (/\/src\/|\/shared\//.test(r.url())) refused.push(`${r.failure()?.errorText ?? "failed"}: ${r.url().replace(base, "")}`); });
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: "L-dev", topic: { id: "c5-maths-ch02-t01", title: "Fractions", chapter: "Fractions" },
      teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, ui, teacherOpening: "Dekho.", teacherOpeningSeq: 1,
      moduleCommands: [{ op: "mount", moduleId: "m1", engine: "explainer@1", params: { script: x.script, template: "fraction-parts@1", mode: "play", delayMs: 0 } }] });
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  try {
    await page.goto(`${base}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="lesson"]', { timeout: 90_000 });
    // (React StrictMode on the dev server mounts the module twice: find whichever frame ends up drawing)
    const end = Date.now() + 90_000;
    let drew = false;
    while (!drew && Date.now() < end) {
      const iframe = await page.waitForSelector('[data-testid="tray"][data-kind="module"] iframe[data-engine="explainer@1"]', { timeout: Math.max(1000, end - Date.now()) }).catch(() => null);
      const frame = iframe ? await iframe.contentFrame().catch(() => null) : null;
      if (frame && !frame.isDetached()) drew = await frame.waitForSelector('[data-testid="explainer"] svg', { timeout: 5000, state: "attached" }).then(() => true).catch(() => false);
      if (!drew && refused.length) break;
    }
    assert.deepEqual(refused, [], "a module request was refused on the dev server (vite.config.ts FRAME_GRAPH)");
    assert.ok(drew, "the explainer drew its board in the frame on the dev server");
  } finally { await ctx.close(); }
});
