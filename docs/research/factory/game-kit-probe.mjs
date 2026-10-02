// M-K0: framework-familiarity probe for the Forge builder model (game-kit-frameworks.md §2.3).
//
//   node docs/research/factory/game-kit-probe.mjs --work <dir-with-node_modules> [--n 3] [--model taxila-codex]
//
// For each (framework, task, sample) it asks the builder deployment for ONE single-file ES module written
// against a pinned framework version, bundles it with esbuild against the REAL installed package, runs it in
// headless Chromium at 360x640 (DPR 2) and checks, in order:
//   build  : esbuild resolves every import against the installed version (API names that do not exist fail here
//            only when they are named imports; most API errors surface at boot)
//   boot   : no pageerror / console.error within 4 s
//   render : the screenshot is not a flat colour (PNG size > 6 kB at 720x1280)
//   func   : task A — tapping the reported "yes" button calls reportAnswer("yes"), then "no" → reportAnswer("no")
//            task B — holding a touch on the right half moves the player to the flag → reportWin() within 6 s,
//                     and the player is resting on the ground (not fallen off-screen) before input
// Costs real Azure tokens: n x 8 frameworks x 2 tasks calls. Results JSON is written next to this file.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";
import http from "http";

const ROOT = new URL("../../..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const WORK = path.resolve(arg("work", "."));
const N = Number(arg("n", 3));
const MODEL = arg("model", process.env.DEPLOY_CODEX || "taxila-codex");
const ONLY = arg("only", "");
const { chromium } = await import(path.join(WORK, "node_modules/playwright/index.mjs"));

const FW = {
  canvas2d: { name: "no framework: the browser Canvas 2D API only", imp: "(no imports)" },
  phaser4: { name: "Phaser 4.2.1 (npm package `phaser`, released 2026; WebGL renderer)", imp: "import Phaser from 'phaser'  (or import * as Phaser from 'phaser')" },
  phaser3: { name: "Phaser 3.90 (npm package `phaser`)", imp: "import Phaser from 'phaser'", alias: "phaser=phaser3" },
  pixi8: { name: "PixiJS v8.22 (npm package `pixi.js`)", imp: "import { ... } from 'pixi.js'" },
  kaplay: { name: "KAPLAY 3001.0.19 (npm package `kaplay`, the Kaboom.js successor)", imp: "import kaplay from 'kaplay'" },
  excalibur: { name: "Excalibur 0.32 (npm package `excalibur`)", imp: "import { ... } from 'excalibur'" },
  littlejs: { name: "LittleJS 1.23 (npm package `littlejsengine`)", imp: "import * as LJS from 'littlejsengine'" },
  three: { name: "three.js r186 (npm package `three`), using an OrthographicCamera for a 2D view", imp: "import * as THREE from 'three'" },
};
const TASKS = {
  A: [
    "Build a tiny quiz screen for a 9-year-old on a 360x640 CSS-pixel portrait phone (the canvas must be exactly 360x640 CSS px at the top-left of the page, no scaling, no scrolling).",
    "Show the question text `Is 3/4 bigger than 1/2?` near the top, and two large tappable buttons labelled `yes` and `no` (each at least 120x64 CSS px, clearly separated).",
    "A gently bouncing coloured ball moves around behind the buttons the whole time (it is decoration, it must not block taps).",
    "When a button is tapped (pointer/touch), call the global function `window.reportAnswer(label)` with `'yes'` or `'no'`, and briefly flash the button.",
    "Also set `window.__buttons = [{label:'yes', x, y}, {label:'no', x, y}]` where x,y are the CSS-pixel page coordinates of each button's CENTRE.",
  ],
  B: [
    "Build a tiny one-screen platformer for a 360x640 CSS-pixel portrait phone (the canvas must be exactly 360x640 CSS px at the top-left of the page, no scaling, no scrolling).",
    "A ground platform spans the bottom of the screen. A player square (about 32x32) starts at the left, falls under gravity and comes to rest ON the ground.",
    "While the player holds a touch/pointer down anywhere on the RIGHT half of the screen the player walks right at a steady speed; on the left half it walks left; releasing stops it.",
    "A flag stands near the right edge. When the player touches the flag, call the global `window.reportWin()` exactly once.",
    "Expose `window.__player = () => ({x, y})` returning the player's centre in CSS-pixel page coordinates (y grows downward).",
  ],
};
const SYSTEM = [
  "You write browser game code. Output exactly one ```js fenced block containing ONE complete ES module and nothing else.",
  "It is bundled with esbuild and loaded by an HTML page with <body> already present; the module must create its own canvas or let the framework create it.",
  "No external assets, no network, no fonts to download: draw shapes or generate textures in code.",
].join(" ");
const prompt = (fw, task) => [`Framework: ${FW[fw].name}. Import style: ${FW[fw].imp}.`, ...TASKS[task]].join("\n");

async function generate(fw, task) {
  const t0 = performance.now();
  const base = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
  const res = await fetch(base + "/responses", {
    method: "POST",
    headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, instructions: SYSTEM, input: prompt(fw, task), max_output_tokens: 16000, reasoning: { effort: "medium" } }),
  });
  const j = await res.json();
  if (!res.ok) return { err: `HTTP ${res.status} ${String(j?.error?.message || "").slice(0, 200)}`, ms: performance.now() - t0 };
  const text = (j.output || []).filter((o) => o.type === "message").flatMap((o) => o.content || []).map((c) => c.text || "").join("\n");
  const code = (text.match(/```(?:js|javascript)?\n([\s\S]*?)```/) || [, text])[1];
  return { code, ms: Math.round(performance.now() - t0), usage: j.usage };
}

const OUT = path.join(WORK, "probe-out"); mkdirSync(OUT, { recursive: true });
function build(fw, id, code) {
  const src = path.join(OUT, `${id}.src.js`), dst = path.join(OUT, `${id}.js`);
  writeFileSync(src, code);
  const args = [src, "--bundle", "--format=esm", "--outfile=" + dst, "--log-level=error", "--conditions=production", "--define:process.env.NODE_ENV=\"production\""];
  if (FW[fw].alias) args.push(`--alias:${FW[fw].alias}`);
  try { execFileSync(path.join(WORK, "node_modules/.bin/esbuild"), args, { cwd: WORK, stdio: "pipe" }); return { ok: true }; }
  catch (e) { return { ok: false, msg: String(e.stderr || e.message).split("\n").slice(0, 4).join(" ").slice(0, 300) }; }
}

const server = http.createServer((q, s) => {
  const f = path.join(OUT, q.url.split("?")[0]);
  try { const b = readFileSync(f); s.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : "text/html" }); s.end(b); }
  catch { s.writeHead(404); s.end(); }
}).listen(0);
const PORT = await new Promise((r) => server.on("listening", () => r(server.address().port)));
const browser = await chromium.launch({ executablePath: process.env.PWX, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });

async function run(id, task) {
  writeFileSync(path.join(OUT, `${id}.html`), `<!doctype html><meta charset=utf-8><meta name=viewport content="width=360"><style>html,body{margin:0;padding:0}</style><script>window.__log=[];window.reportAnswer=v=>__log.push(['answer',v]);window.reportWin=()=>__log.push(['win']);</script><body><script type=module src="${id}.js"></script></body>`);
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
  const r = { boot: false, render: false, func: false, notes: [] };
  try {
    await page.goto(`http://localhost:${PORT}/${id}.html`); await page.waitForTimeout(4000);
    r.boot = errs.length === 0; if (!r.boot) r.notes.push(errs[0].slice(0, 240));
    const png = await page.screenshot(); r.render = png.length > 6000; r.png = png.length;
    if (task === "A") {
      const btn = await page.evaluate(() => window.__buttons || null);
      if (!Array.isArray(btn)) r.notes.push("no __buttons");
      else {
        for (const label of ["yes", "no"]) { const b = btn.find((x) => x.label === label); if (b) { await page.touchscreen.tap(b.x, b.y); await page.waitForTimeout(400); } }
        const log = await page.evaluate(() => window.__log);
        r.func = JSON.stringify(log) === JSON.stringify([["answer", "yes"], ["answer", "no"]]);
        if (!r.func) r.notes.push("log=" + JSON.stringify(log).slice(0, 120));
      }
    } else {
      const p0 = await page.evaluate(() => (window.__player ? window.__player() : null));
      if (!p0) r.notes.push("no __player");
      else {
        const grounded = p0.y > 400 && p0.y < 640;
        // hold a touch on the right half via CDP touch events (pointerdown held)
        const cdp = await ctx.newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 300, y: 320 }] });
        for (let i = 0; i < 30; i++) { await page.waitForTimeout(200); await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 300 + (i % 2), y: 320 }] }); const l = await page.evaluate(() => window.__log); if (l.some((e) => e[0] === "win")) break; }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        const log = await page.evaluate(() => window.__log); const p1 = await page.evaluate(() => window.__player());
        r.func = grounded && log.filter((e) => e[0] === "win").length === 1;
        if (!r.func) r.notes.push(`grounded=${grounded} p0=${JSON.stringify(p0)} p1=${JSON.stringify(p1)} log=${JSON.stringify(log).slice(0, 80)}`);
      }
    }
  } catch (e) { r.notes.push("harness: " + String(e.message).slice(0, 160)); }
  r.lateErrors = errs.length; await ctx.close(); return r;
}

const jobs = [];
for (const fw of Object.keys(FW)) for (const task of Object.keys(TASKS)) for (let s = 0; s < N; s++) if (!ONLY || ONLY.split(",").includes(fw)) jobs.push({ fw, task, s, id: `${fw}-${task}-${s}` });
const results = [];
async function worker() {
  while (jobs.length) {
    const j = jobs.shift();
    const g = await generate(j.fw, j.task);
    const rec = { ...j, genMs: g.ms, outTok: g.usage?.output_tokens, reasoningTok: g.usage?.output_tokens_details?.reasoning_tokens, inTok: g.usage?.input_tokens };
    if (g.err) { rec.genErr = g.err; results.push(rec); console.log(j.id, "GEN_ERR", g.err); continue; }
    rec.lines = g.code.split("\n").length;
    const b = build(j.fw, j.id, g.code); rec.build = b.ok; if (!b.ok) rec.buildMsg = b.msg;
    if (b.ok) Object.assign(rec, await run(j.id, j.task));
    results.push(rec);
    console.log(j.id, `build=${rec.build} boot=${rec.boot} render=${rec.render} func=${rec.func}`, (rec.notes || []).join(" | ").slice(0, 160), rec.buildMsg || "");
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
await browser.close(); server.close();

const table = {};
for (const r of results) {
  const k = `${r.fw}/${r.task}`; table[k] ??= { n: 0, build: 0, boot: 0, render: 0, func: 0 };
  const t = table[k]; t.n++; t.build += !!r.build; t.boot += !!(r.build && r.boot); t.render += !!(r.build && r.render); t.func += !!(r.build && r.func);
}
console.table(table);
const stamp = new Date().toISOString().slice(0, 10);
writeFileSync(new URL(`./game-kit-probe-${stamp}${ONLY ? "-" + ONLY.replace(/,/g, "_") : ""}.json`, import.meta.url), JSON.stringify({ model: MODEL, n: N, date: stamp, method: "see header of game-kit-probe.mjs", table, results }, null, 1));
