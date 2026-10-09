#!/usr/bin/env node
// The play stream's shot, floor and frame-rate harness (bars P-O1, P-O2, P-O3; DESIGN.md §10). Playwright with the
// preinstalled Chromium, headless, software raster. EVERY number it prints is a local/headless proxy, never a phone.
//
//   node docs/design/round3/play/harness/shots.mjs --play <url of the built play dev harness> [--before <url of the built
//        studio-v2 gallery>] [--out docs/design/round3/play/shots] [--shots] [--fps] [--before-after]
//
// Build the two pages first (scratch output; neither is part of the app):
//   PLAY_OUT=<dir> npx vite build --config src/play/dev/vite.play.config.mjs     (serve <dir>; --play <base>/src/play/dev/index.html)
//   PLAY_OUT=<dir> npx vite build --config src/play/dev/vite.before.config.mjs   (serve <dir>; --before <base>/src/studio-v2/gallery/index.html)
//
// Instrumentation is the SAME for both pages: every canvas fillText is recorded with its rendered CSS px (font px × the
// context's transform scale ÷ devicePixelRatio, drawn at alpha > 0.4), and a requestAnimationFrame counter records the
// frame intervals. The play page additionally exposes its own audit (texts and touch targets drawn per frame).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const arg = (k, d = null) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);
const PLAY = arg("play"), BEFORE = arg("before"), OUT = resolve(arg("out", "docs/design/round3/play/shots"));
const DO_SHOTS = flag("shots"), DO_FPS = flag("fps"), DO_BA = flag("before-after");
/** --all-arts: every mode × viewport × art direction (JPEG to keep the folder small); default: one rotating art per cell (PNG) */
const ALL_ARTS = flag("all-arts");
const ONLY = arg("only");
if (!PLAY) { console.error("--play <url> required"); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const INSTRUMENT = `(() => {
  window.__txt = []; window.__frames = [];
  const orig = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (t, x, y, mw) {
    try {
      const m = /(\\d+(?:\\.\\d+)?)px/.exec(this.font), tr = this.getTransform(), dpr = window.devicePixelRatio || 1;
      if (m && String(t).trim() && this.globalAlpha > 0.4 && this.canvas.isConnected) { window.__txt.push(+(+m[1] * Math.hypot(tr.a, tr.b) / dpr).toFixed(2)); if (window.__txt.length > 6000) window.__txt.splice(0, 3000); }
    } catch {}
    return orig.call(this, t, x, y, mw);
  };
  let last = 0; const tick = (t) => { if (last) window.__frames.push(t - last); last = t; if (window.__frames.length > 20000) window.__frames.splice(0, 10000); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
})();`;

const VIEWPORTS = [{ id: "p360", w: 360, h: 800, dpr: 1 }, { id: "p412", w: 412, h: 915, dpr: 1 }, { id: "l1366", w: 1366, h: 768, dpr: 1 }];
const ARTS = ["kagaz", "chalk", "blueprint", "raat"];
/** the matrix: every family and mode; a mid-play state after `steps` of the level's own solution (or custom acts) */
const MODES = [
  { id: "atoms", q: "family=todo-jodo&mode=atoms&goal=atoms&class=6&fade=2&seed=3", steps: 2 },
  { id: "atoms-hcf", q: "family=todo-jodo&mode=atoms&goal=hcf&class=7&fade=2&seed=5", steps: 3 },
  { id: "strips-compare", q: "family=todo-jodo&mode=strips&goal=compare&class=5&fade=2&seed=4", steps: 2 },
  { id: "strips-add", q: "family=todo-jodo&mode=strips&goal=add&class=6&fade=2&seed=4", steps: 3 },
  { id: "bundles", q: "family=todo-jodo&mode=bundles&goal=subtract&class=4&fade=2&seed=4", steps: 2 },
  { id: "balance", q: "family=taraazu&mode=equation&goal=solve&class=7&fade=2&seed=4", steps: 1 },
  { id: "equality", q: "family=taraazu&mode=equality&goal=fill&class=4&fade=2&seed=4", steps: 0 },
  { id: "line-place", q: "family=nishana&mode=place&goal=place&class=6&fade=2&seed=4&grammar=%7B%22forms%22%3A%5B%22fraction%22%5D%7D", custom: "miss" },
  { id: "line-compare", q: "family=nishana&mode=compare&goal=compare&class=6&fade=2&seed=4&grammar=%7B%22forms%22%3A%5B%22integer%22%5D%7D", steps: 2 },
  { id: "lab-predict", q: "family=kyun-lab&mode=fair-test&goal=predict&class=6&seed=4&topic=c6-science-ch10-t02", steps: 2 },
  { id: "lab-golu", q: "family=kyun-lab&mode=fair-test&goal=golu&class=7&seed=4&topic=c7-science-ch08-t01", steps: 0 },
  { id: "line-round", q: "family=nishana&mode=place&goal=round&class=4&fade=2&seed=4&grammar=%7B%22to%22%3A%5B1000%5D%7D", steps: 2 },
  { id: "lab-magnet", q: "family=kyun-lab&mode=fair-test&goal=predict&class=6&seed=4&topic=c6-science-ch04-t01", steps: 2 },
  { id: "lab-ice", q: "family=kyun-lab&mode=fair-test&goal=predict&class=7&seed=5&topic=c7-science-ch07-t01", steps: 2 },
  { id: "lab-leaf", q: "family=kyun-lab&mode=fair-test&goal=fair&class=7&seed=4&topic=c7-science-ch10-t01", steps: 0 },
  { id: "lab-mould", q: "family=kyun-lab&mode=fair-test&goal=predict&class=5&seed=4&topic=c5-evs-ch03-t01", steps: 2 },
];
const famOf = (q) => /family=([a-z-]+)/.exec(q)[1];
const young = (q) => Number(/class=(\d)/.exec(q)?.[1] ?? 6) <= 5;

const pct = (a, q) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

async function shotOne(browser, m, vp, art) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr, hasTouch: vp.w < 600 });
  await ctx.addInitScript(INSTRUMENT);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (c) => { if (c.type() === "error" || (c.type() === "warning" && /\[play\]/.test(c.text()))) errors.push(c.text().slice(0, 200)); });
  await page.goto(`${PLAY}?${m.q}&art=${art}`);
  await page.waitForFunction(() => !!window.__play, null, { timeout: 15000 });
  await page.waitForTimeout(700);
  if (m.custom === "miss") {
    await page.evaluate(() => { const v = window.__play.level.params.values[0]; window.__play.dispatch({ kind: "place", which: 0, x: v.num / v.den + 0.18 }); window.__play.dispatch({ kind: "commit" }); });
  } else if (m.steps) {
    const sol = await page.evaluate(() => window.__play.solve());
    for (const a of sol.slice(0, m.steps)) { await page.evaluate((x) => window.__play.dispatch(x), a); await page.waitForTimeout(380); }
  }
  // a lab's run animates for ~2.2 s (the race to the faster set-up): the settled frame is the result
  await page.waitForTimeout(m.id.startsWith("lab") ? 2900 : 1300);
  // the floors are judged on the settled frame (a 250 ms spring-in scales text on the way; that frame is not the layout)
  await page.evaluate(() => { window.__txt = []; window.__play.invalidate(); });
  await page.waitForTimeout(150);
  const file = `${m.id}-${vp.id}-${art}.${ALL_ARTS ? "jpg" : "png"}`;
  await page.screenshot({ path: join(OUT, file), ...(ALL_ARTS ? { type: "jpeg", quality: 82 } : {}) });
  const a = await page.evaluate((y) => {
    const au = window.__play.audit, floor = y ? 16 : 14;
    const box = au.box, texts = au.texts.map((t) => t.px), targets = au.targets.map((t) => Math.min(t.w, t.h));
    const left = (t) => (t.align === "left" || t.align === "start" ? t.x : t.align === "right" || t.align === "end" ? t.x - t.w : t.x - t.w / 2);
    const out = au.texts.filter((t) => left(t) < -2 || left(t) + t.w > box.w + 2).length;
    // DOM chrome: visible text and buttons inside the play root
    const root = document.querySelector("[data-testid=play-stage]");
    const els = [...root.querySelectorAll("*")].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length);
    const domText = els.map((e) => parseFloat(getComputedStyle(e).fontSize));
    const btns = [...root.querySelectorAll("button")].filter((b) => b.getClientRects().length).map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); });
    const clipped = [...root.querySelectorAll("button")].filter((b) => b.scrollWidth > b.clientWidth + 2).length;
    return { floor, box, clipped: au.clipped ?? 0, canvasTextMin: texts.length ? Math.min(...texts) : null, canvasTexts: texts.length, targetMin: targets.length ? Math.min(...targets) : null, targets: targets.length,
      textOutOfBox: out, domTextMin: domText.length ? Math.min(...domText) : null, buttonMin: btns.length ? Math.min(...btns) : null, buttons: btns.length, buttonsClipped: clipped,
      hOverflow: document.scrollingElement.scrollWidth > innerWidth + 1, drawnTextMinInstr: window.__txt.length ? Math.min(...window.__txt) : null };
  }, young(m.q));
  await ctx.close();
  const pass = (a.canvasTextMin === null || a.canvasTextMin >= a.floor - 0.01) && (a.drawnTextMinInstr === null || a.drawnTextMinInstr >= a.floor - 0.01) && (a.domTextMin === null || a.domTextMin >= 14) &&
    (a.targetMin === null || a.targetMin >= 44) && (a.buttonMin === null || a.buttonMin >= 44) && !a.hOverflow && a.textOutOfBox === 0 && a.clipped === 0 && a.buttonsClipped === 0 && errors.length === 0;
  return { mode: m.id, family: famOf(m.q), vp: vp.id, art, file, pass, errors, ...a };
}

async function fpsPlay(browser, m, art, { throttle = 4, secs = 6, w = 412, h = 915, dpr = 2 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: false });
  await ctx.addInitScript(INSTRUMENT);
  const page = await ctx.newPage();
  await page.goto(`${PLAY}?${m.q}&art=${art}`);
  await page.waitForFunction(() => !!window.__play, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  const world = await page.locator("[data-testid=play-world]").boundingBox();
  const sol = await page.evaluate(() => window.__play.solve());
  await page.evaluate(() => { window.__frames = []; window.__play.perf(true); });
  // a finger held on the world and moving (the stage redraws every frame while a pointer is active) + the level's own
  // acts every 700 ms (their animations): a steady worst-case redraw, not an idle page
  const cx = world.x + world.width / 2, cy = world.y + world.height * 0.6;
  await page.mouse.move(cx, cy); await page.mouse.down();
  const t0 = Date.now(); let k = 0, nextAct = 700;
  while (Date.now() - t0 < secs * 1000) {
    const t = (Date.now() - t0) / 1000;
    await page.mouse.move(cx + Math.cos(t * 3) * world.width * 0.3, cy + Math.sin(t * 3) * 40);
    if (Date.now() - t0 > nextAct && k < sol.length) { await page.evaluate((a) => window.__play.dispatch(a), sol[k++]); nextAct += 700; }
  }
  await page.mouse.up();
  const r = await page.evaluate(() => ({ frames: window.__frames.slice(5), perf: window.__play.perf() }));
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await ctx.close();
  const f = r.frames, tot = f.reduce((a, b) => a + b, 0);
  return { mode: m.id, art, throttle, n: f.length, fps: +(1000 * f.length / tot).toFixed(1), p50: +pct(f, 0.5).toFixed(1), p95: +pct(f, 0.95).toFixed(1), over33: +(100 * f.filter((x) => x > 33.4).length / f.length).toFixed(1), drawn: r.perf.drawn, dpr: r.perf.dpr, dprSteps: r.perf.dprSteps };
}

/** BEFORE: a shipped studio-v2 engine at the production tray box (181 × 113 CSS px inside a 360 × 800 page). */
async function beforeOne(browser, engine, { throttle = 4, secs = 6, box = { w: 181, h: 113 }, page: pg = { w: 360, h: 800 }, dpr = 2, shot = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: pg.w, height: pg.h }, deviceScaleFactor: dpr });
  await ctx.addInitScript(INSTRUMENT);
  await ctx.addInitScript(`document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = ".solo-slot.sv2-slot, .solo-slot { position:absolute !important; inset:auto !important; left:${(pg.w - box.w) / 2}px !important; top:${Math.round(pg.h * 0.5)}px !important; width:${box.w}px !important; height:${box.h}px !important; }"; document.head.appendChild(s); });`);
  const page = await ctx.newPage();
  const errors = []; page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  await page.goto(`${BEFORE}?engine=${encodeURIComponent(engine)}&sound=off&audio=0`);
  await page.waitForTimeout(2500);
  const slot = await page.locator(".solo-slot").boundingBox();
  if (shot) await page.screenshot({ path: join(OUT, shot) });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.evaluate(() => { window.__frames = []; window.__txt = []; });
  const cx = slot.x + slot.width / 2, cy = slot.y + slot.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down();
  const t0 = Date.now();
  while (Date.now() - t0 < secs * 1000) { const t = (Date.now() - t0) / 1000; await page.mouse.move(cx + Math.cos(t * 3) * slot.width * 0.3, cy + Math.sin(t * 3) * slot.height * 0.3); }
  await page.mouse.up();
  const r = await page.evaluate(() => ({ frames: window.__frames.slice(5), txt: window.__txt.slice() }));
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await ctx.close();
  const f = r.frames, tot = f.reduce((a, b) => a + b, 0);
  return { engine, box: { w: Math.round(slot.width), h: Math.round(slot.height) }, area: Math.round(slot.width * slot.height), fps: +(1000 * f.length / tot).toFixed(1), p95: +pct(f, 0.95).toFixed(1), n: f.length,
    textMin: r.txt.length ? Math.min(...r.txt) : null, textP10: pct(r.txt, 0.1), textP50: pct(r.txt, 0.5), texts: r.txt.length, errors };
}
async function afterOne(browser, m, art, { throttle = 4, secs = 6, dpr = 2 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: dpr, hasTouch: false });
  await ctx.addInitScript(INSTRUMENT);
  const page = await ctx.newPage();
  await page.goto(`${PLAY}?${m.q}&art=${art}`);
  await page.waitForFunction(() => !!window.__play, null, { timeout: 15000 });
  await page.waitForTimeout(800);
  const world = await page.locator("[data-testid=play-world]").boundingBox();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.evaluate(() => { window.__frames = []; window.__txt = []; });
  const cx = world.x + world.width / 2, cy = world.y + world.height * 0.6;
  await page.mouse.move(cx, cy); await page.mouse.down();
  const t0 = Date.now();
  while (Date.now() - t0 < secs * 1000) { const t = (Date.now() - t0) / 1000; await page.mouse.move(cx + Math.cos(t * 3) * world.width * 0.3, cy + Math.sin(t * 3) * 40); }
  await page.mouse.up();
  const r = await page.evaluate(() => ({ frames: window.__frames.slice(5), txt: window.__txt.slice(), targets: window.__play.audit.targets.map((t) => Math.min(t.w, t.h)) }));
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await ctx.close();
  const f = r.frames, tot = f.reduce((a, b) => a + b, 0);
  return { mode: m.id, art, box: { w: Math.round(world.width), h: Math.round(world.height) }, area: Math.round(world.width * world.height), fps: +(1000 * f.length / tot).toFixed(1), p95: +pct(f, 0.95).toFixed(1), n: f.length,
    textMin: r.txt.length ? Math.min(...r.txt) : null, textP10: pct(r.txt, 0.1), textP50: pct(r.txt, 0.5), texts: r.txt.length, targetMin: r.targets.length ? Math.min(...r.targets) : null };
}

const browser = await chromium.launch();
const report = { at: new Date().toISOString(), method: "Playwright headless Chromium (software raster), this sandbox; dev harness pages built from the working tree; NOT a phone", play: PLAY, before: BEFORE };
try {
  if (DO_SHOTS) {
    report.shots = [];
    for (const [mi, m] of MODES.entries()) for (const [vi, vp] of VIEWPORTS.entries()) for (const art of ALL_ARTS ? ARTS : [ARTS[(mi + vi) % ARTS.length]]) {
      if (ONLY && !m.id.startsWith(ONLY)) continue;
      const r = await shotOne(browser, m, vp, art);
      report.shots.push(r);
      console.log(`${r.pass ? "PASS" : "FAIL"} ${r.file} text≥${r.canvasTextMin}/${r.drawnTextMinInstr} dom≥${r.domTextMin} target≥${r.targetMin} btn≥${r.buttonMin} out=${r.textOutOfBox} clipBtn=${r.buttonsClipped} clipText=${r.clipped} err=${r.errors.length}`);
    }
    const arts = {}; for (const s of report.shots) (arts[s.family] ??= new Set()).add(s.art);
    report.artsPerFamily = Object.fromEntries(Object.entries(arts).map(([k, v]) => [k, [...v]]));
    report.shotsPass = `${report.shots.filter((s) => s.pass).length}/${report.shots.length}`;
  }
  if (DO_FPS) {
    // the host is shared (other agents: load average logged); each mode is measured REPS times and the median run reported
    const REPS = Number(arg("reps", 1));
    const { loadavg } = await import("node:os");
    report.fps = []; report.loadavg = { before: loadavg() };
    for (const [mi, m] of MODES.entries()) {
      if (ONLY && !m.id.startsWith(ONLY)) continue;
      const runs = [];
      for (let k = 0; k < REPS; k++) runs.push(await fpsPlay(browser, m, ARTS[mi % ARTS.length]));
      runs.sort((a, b) => a.fps - b.fps);
      const r = { ...runs[Math.floor(runs.length / 2)], runs: runs.map((x) => x.fps) };
      report.fps.push(r);
      console.log(`fps ${m.id} ${r.art}: median ${r.fps} of ${JSON.stringify(r.runs)} (p95 ${r.p95} ms, >33ms ${r.over33}%, n=${r.n}, drawn=${r.drawn}, dpr ${r.dpr} ${JSON.stringify(r.dprSteps)}) load ${loadavg()[0].toFixed(1)}`);
    }
    report.loadavg.after = loadavg();
    report.fpsMin = Math.min(...report.fps.map((r) => r.fps));
  }
  if (DO_BA && BEFORE) {
    const PAIRS = [["slice-at@1", "strips-compare"], ["vault-heist@1", "bundles"], ["balance-beam@1", "balance"], ["catch-on-line@1", "line-place"], ["shadow-play@1", "lab-predict"]];
    report.beforeAfter = [];
    for (const [i, [eng, mode]] of PAIRS.entries()) {
      const b = await beforeOne(browser, eng, { shot: `before-${eng.replace("@1", "")}-p360.png` });
      const a = await afterOne(browser, MODES.find((x) => x.id === mode), ARTS[i % ARTS.length]);
      report.beforeAfter.push({ before: b, after: a });
      console.log(`before ${eng} box ${b.box.w}x${b.box.h} text min ${b.textMin} p50 ${b.textP50} fps ${b.fps} | after ${mode} box ${a.box.w}x${a.box.h} text min ${a.textMin} p50 ${a.textP50} target ${a.targetMin} fps ${a.fps}`);
    }
  }
} finally { await browser.close(); }
const RF = arg("report", "report.json");
writeFileSync(join(OUT, RF), JSON.stringify(report, null, 1));
console.log("wrote", join(OUT, RF));
