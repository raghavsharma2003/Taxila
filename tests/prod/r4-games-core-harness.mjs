#!/usr/bin/env node
// Round 4 · G1 games core: the Antariksh measurement harness (shots, audit, fps, cold load, reduced motion, context loss,
// voice duck). It drives the play DEV HARNESS build (src/play/dev, the same PlayStage / engine / law code the lesson
// mounts) in headless Chromium. Every frame-rate number from here is a PROXY (SwiftShader software GL on a shared
// container, `engine=3d` forces the engine past the software-GPU tier rule): label it so.
//
//   PLAY_OUT=<dir> PLAY_PUBLIC=public npx vite build --config src/play/dev/vite.play.config.mjs
//   node tests/prod/r4-games-core-harness.mjs <mode> --dir <PLAY_OUT> [--out <dir>]
//     modes: shots | audit | fps | load | checks | video | all
//
// shots/audit: every Antariksh skill (coverage.json nishana entries) × 3 themes × 360x800 / 412x915 / 1366x768 × class
// bands 4 and 7: the world box, the label audit (min px by kind, clipped, out-of-box), control sizes, overflow, page errors.
import http from "node:http";
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const mode = argv[0] ?? "audit";
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const DIR = arg("dir", "/tmp/play-devbuild");
const OUT = arg("out", join(ROOT, "docs/design/round4/build/games-core"));
const ONLY = arg("only", null);
const VIEWPORTS = [{ w: 360, h: 800, tag: "360" }, { w: 412, h: 915, tag: "412" }, { w: 1366, h: 768, tag: "1366" }];
const THEMES = ["neela-nebula", "laal-grah", "hara-toofan"];
const WRAP = { "neela-nebula": "mine-sweep", "laal-grah": "beacon-rescue", "hara-toofan": "comet-catch" };
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml" };

/** a static server for the dev build, with optional bandwidth / latency shaping done by CDP (load mode) */
function serve(dir) {
  return new Promise((res) => {
    const srv = http.createServer((req, r) => {
      const u = new URL(req.url, "http://x");
      let p = join(dir, decodeURIComponent(u.pathname));
      if (u.pathname === "/" || !existsSync(p) || statSync(p).isDirectory()) p = join(dir, "src/play/dev/index.html");
      const ext = extname(p), raw = readFileSync(p);
      const ae = String(req.headers["accept-encoding"] ?? "");
      const comp = /br/.test(ae) && [".js", ".css", ".html", ".json", ".svg"].includes(ext);
      r.writeHead(200, { "content-type": TYPES[ext] ?? "application/octet-stream", "cache-control": "no-store", ...(comp ? { "content-encoding": "br" } : {}) });
      r.end(comp ? brotliCompressSync(raw) : raw);
    });
    srv.listen(0, "127.0.0.1", () => res({ srv, url: `http://127.0.0.1:${srv.address().port}` }));
  });
}

export function nishanaSkills() {
  const cov = JSON.parse(readFileSync(join(ROOT, "data/play/coverage.json"), "utf8"));
  const out = [];
  for (const e of cov.entries.filter((x) => x.family === "nishana")) for (const sk of e.skillIds) out.push({ skillId: sk, topicId: e.topicId, mode: e.mode, goal: e.goal, grammar: e.grammar, classLevel: e.classLevel });
  return out;
}
const qs = (s, o = {}) => new URLSearchParams({ family: "nishana", mode: s.mode, goal: s.goal, grammar: JSON.stringify(s.grammar), topic: s.topicId, skill: s.skillId, class: String(o.cls ?? s.classLevel), lang: o.lang ?? "hinglish", fade: String(o.fade ?? 1), seed: String(o.seed ?? 3), engine: o.engine ?? "3d", theme: o.theme ?? "neela-nebula", wrapper: WRAP[o.theme ?? "neela-nebula"], ...(o.verb ? { verb: o.verb } : {}), ...(o.reduced ? { reduced: "1" } : {}) }).toString();

async function launch() {
  const { chromium } = await import("playwright");
  return chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
}
async function open(browser, base, vp, query, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: o.dsf ?? 2, hasTouch: vp.w < 900, isMobile: vp.w < 900, ...(o.reduced ? { reducedMotion: "reduce" } : {}) });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  await page.goto(`${base}/?${query}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__play && document.querySelector("[data-render]")?.getAttribute("data-render") !== "wait", null, { timeout: 15000 });
  await page.waitForTimeout(o.settle ?? 900);
  return { ctx, page, errors };
}

/** the DOM + label audit of the play stage as it stands */
async function auditPage(page, young) {
  return page.evaluate((young) => {
    const root = document.querySelector("[data-testid=play-stage]"), world = document.querySelector("[data-testid=play-world]");
    const wr = world.getBoundingClientRect();
    const a = window.__play.audit;
    const labels = a.texts.map((t) => ({ s: t.s, px: t.px }));
    const numeralFloor = 18, textFloor = young ? 16 : 14;
    const lbl = [...document.querySelectorAll(".c3-label")].filter((e) => e.style.display !== "none" && e.textContent.trim());
    const tooSmall = lbl.filter((e) => { const px = parseFloat(getComputedStyle(e).fontSize); const floor = e.dataset.kind === "numeral" ? numeralFloor : e.lang === "hi" ? 16 : textFloor; return px + 0.01 < floor; }).map((e) => `${e.textContent}@${getComputedStyle(e).fontSize}`);
    const btns = [...document.querySelectorAll("[data-testid^=play-ctl-], [data-testid=play-music]")].map((b) => { const r = b.getBoundingClientRect(); return { id: b.dataset.testid, w: Math.round(r.width), h: Math.round(r.height), clipped: b.scrollWidth > b.clientWidth + 1 }; });
    const smallBtn = btns.filter((b) => b.w < 44 || b.h < 44 || b.clipped);
    const texts = [...root.querySelectorAll(".pl-goal, .pl-caption, .pl-btn, .pl-readout b")].filter((e) => e.textContent.trim()).map((e) => parseFloat(getComputedStyle(e).fontSize));
    const minChrome = texts.length ? Math.min(...texts) : null;
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
    return { world: { w: Math.round(wr.width), h: Math.round(wr.height) }, render: root.dataset.render, engine: root.dataset.engine ?? null, labels: labels.length, minLabelPx: labels.length ? Math.min(...labels.map((l) => l.px)) : null, tooSmall, clipped: a.clipped, buttons: btns.length, smallBtn, minChromePx: minChrome, overflowX, why: window.__play.why, tier: window.__play.tier };
  }, young);
}

/** play one level to a chosen screen: "aim" (fresh), "miss" (the level's own first mal-rule, or an off shot), "hit", "gates" (compare/round after landing) */
async function driveTo(page, state) {
  return page.evaluate(async (state) => {
    const P = window.__play, lv = P.level, p = lv.params;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const solve = P.solve();
    const press = async (id) => { P.press(id); await wait(60); };
    // steer by dispatching nothing: set the reticle through the engine's tap path is not exposed; use the law's own acts
    // through the controls the child presses: we aim by nudging is slow, so the harness drives the engine's fire with an
    // aim set through a synthetic tap at the value's projected x
    const tapAt = async (value) => {
      const st = P.stage3d; if (!st) return false;
      for (let k = 0; k < 60 && ![...document.querySelectorAll(".c3-label[data-id=tick0]")].some((e) => e.style.display !== "none"); k++) await wait(50);
      const core = st.core, LW = null; void LW;
      const canvas = document.querySelector(".c3-canvas"), r = canvas.getBoundingClientRect();
      const u = (value - p.lo) / (p.hi - p.lo);
      // project the line ends from the tick labels' anchors: the engine exposes lineU via a tap; compute x from label rects
      const a = core.project({ x: -1, y: 0.7, z: -6 }); void a;
      const ev = (type, x) => canvas.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: r.left + x, clientY: r.top + r.height * 0.6, bubbles: true, isPrimary: true, pointerType: "touch" }));
      const ticks = [...document.querySelectorAll(".c3-label[data-id^=tick]")].map((e) => ({ j: Number(e.dataset.id.slice(4)), b: e.getBoundingClientRect() }));
      const first = ticks.find((t) => t.j === 0), last = ticks.reduce((m, t) => (t.j > (m?.j ?? -1) ? t : m), null);
      const cx = (t) => t.b.left + t.b.width / 2 - r.left;
      const x = first && last && last.j > 0 ? cx(first) + u * (cx(last) - cx(first)) : r.width * (0.1 + 0.8 * u);
      ev("pointerdown", x); ev("pointerup", x);
      await wait(120);
      return true;
    };
    if (state === "aim") return { ok: true };
    const values = p.values.map((v) => v.num / v.den);
    if (state === "miss") {
      const mal = P.mal().find((m) => { const a = P.malActs(m); return a && a.length; });
      const acts = mal ? P.malActs(mal) : null;
      const place = acts ? acts.filter((a) => a.kind === "place") : values.map((v, i) => ({ kind: "place", which: i, x: Math.min(p.hi, v + (p.hi - p.lo) * 0.18) }));
      for (const a of place) { await tapAt(a.x); await press("commit"); await wait(1900); }
      await wait(300);
      return { ok: true, mal: mal ?? null };
    }
    for (let i = 0; i < values.length; i++) { await tapAt(values[i]); await press("commit"); await wait(1900); }
    await wait(300);
    if (state === "gates") return { ok: true };
    // compare / round: fly into the right gate (steer onto it with a tap, then commit), as the child does
    const order = solve.find((a) => a.kind === "order" || a.kind === "round");
    if (order) { const target = order.kind === "round" ? order.to : values[order.first]; await tapAt(target); await press("commit"); await wait(1200); }
    return { ok: true };
  }, state);
}

async function shotsAndAudit(base, opts = {}) {
  const browser = await launch();
  const skills = nishanaSkills().filter((s) => !ONLY || s.skillId.includes(ONLY));
  const rows = [];
  mkdirSync(join(OUT, "shots"), { recursive: true });
  for (const s of skills) for (const theme of THEMES) for (const vp of VIEWPORTS) for (const cls of [4, 7]) {
    const lang = cls === 4 ? (theme === "laal-grah" ? "hi" : "hinglish") : (theme === "hara-toofan" ? "en" : "hinglish");
    const { ctx, page, errors } = await open(browser, base, vp, qs(s, { theme, cls, lang }));
    const row = { skillId: s.skillId, goal: s.goal, theme, vp: vp.tag, cls, lang, screens: {} };
    for (const state of opts.states ?? ["aim", "miss", "hit"]) {
      if (state !== "aim") { await page.reload(); await page.waitForFunction(() => window.__play && document.querySelector("[data-render]")?.getAttribute("data-render") !== "wait", null, { timeout: 15000 }); await page.waitForTimeout(700); await driveTo(page, state); }
      const a = await auditPage(page, cls <= 5);
      row.screens[state] = a;
      const want = opts.shots && cls === 7 && (opts.allShots || s.skillId === skills.find((x) => x.goal === s.goal)?.skillId);
      if (want) await page.screenshot({ path: join(OUT, "shots", `${s.goal}-${s.skillId.replace(/^c(\d)-maths-/, "c$1-")}-${theme}-${vp.tag}-${state}.jpg`), type: "jpeg", quality: 72 });
    }
    row.errors = errors.filter((e) => !/favicon|Failed to load resource/.test(e));
    const pass = Object.values(row.screens).every((a) => a.render === "3d" && !a.tooSmall.length && a.clipped === 0 && !a.smallBtn.length && !a.overflowX && (a.minChromePx ?? 99) >= (cls <= 5 ? 16 : 14)) && !row.errors.length;
    row.pass = pass;
    rows.push(row);
    process.stdout.write(`${pass ? "ok  " : "FAIL"} ${s.skillId} ${theme} ${vp.tag} c${cls} ${pass ? "" : JSON.stringify(Object.fromEntries(Object.entries(row.screens).map(([k, a]) => [k, { r: a.render, small: a.tooSmall, clip: a.clipped, btn: a.smallBtn, ov: a.overflowX, chrome: a.minChromePx }]))) + (row.errors.length ? " errors=" + JSON.stringify(row.errors) : "")}\n`);
    await ctx.close();
  }
  await browser.close();
  return rows;
}

async function fps(base, o = {}) {
  const browser = await launch();
  const s = nishanaSkills().find((x) => x.goal === "place");
  const out = [];
  for (const vp of o.vps ?? [VIEWPORTS[0]]) for (const run of [1, 2, 3]) {
    const { ctx, page } = await open(browser, base, vp, qs(s, { theme: "neela-nebula" }), { dsf: o.dsf ?? 2 });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.evaluate(() => window.__play.perf(true));
    // the child steering the whole time (a drag every frame is the heaviest normal state)
    const canvas = await page.$(".c3-canvas"), box = await canvas.boundingBox();
    const t0 = Date.now();
    let x = box.x + box.width * 0.3, dir = 1;
    await page.mouse.move(x, box.y + box.height * 0.6); await page.mouse.down();
    while (Date.now() - t0 < (o.ms ?? 12000)) { x += dir * 6; if (x > box.x + box.width * 0.75 || x < box.x + box.width * 0.25) dir = -dir; await page.mouse.move(x, box.y + box.height * 0.6); await page.waitForTimeout(30); }
    await page.mouse.up();
    const perf = await page.evaluate(() => window.__play.perf());
    const load = Number(readFileSync("/proc/loadavg", "utf8").split(" ")[0]);
    out.push({ vp: vp.tag, run, ...perf, loadavg: load, throttle: 4, proxy: "SwiftShader (software GL), headless Chromium, shared container" });
    process.stdout.write(`fps ${vp.tag} run ${run}: ${perf.fps} (p95 ${perf.p95} ms) work p50 ${perf.workP50} ms dpr ${perf.dpr} steps ${JSON.stringify(perf.dprSteps)} draws ${perf.draws} tris ${perf.tris} load ${load}\n`);
    await ctx.close();
  }
  await browser.close();
  return out;
}

async function coldLoad(base) {
  const browser = await launch();
  const s = nishanaSkills().find((x) => x.goal === "place");
  const profiles = [{ tag: "10Mbps/60ms", down: 10e6 / 8, lat: 60 }, { tag: "3Mbps/150ms", down: 3e6 / 8, lat: 150 }, { tag: "1.2Mbps/300ms", down: 1.2e6 / 8, lat: 300 }];
  const out = [];
  for (const pr of profiles) for (const run of [1, 2, 3]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable"); await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, downloadThroughput: pr.down, uploadThroughput: pr.down / 4, latency: pr.lat });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const t0 = Date.now();
    await page.goto(`${base}/?${qs(s)}`, { waitUntil: "commit" });
    await page.waitForFunction(() => window.__play?.stage3d && window.__play.stage3d.perf().drawn > 0, null, { timeout: 60000 });
    const ms = Date.now() - t0;
    const bytes = await page.evaluate(() => performance.getEntriesByType("resource").reduce((a, r) => a + (r.transferSize || 0), 0) + (performance.getEntriesByType("navigation")[0]?.transferSize ?? 0));
    out.push({ profile: pr.tag, run, firstFrame3dMs: ms, bytes });
    process.stdout.write(`load ${pr.tag} run ${run}: first 3D frame ${ms} ms, ${Math.round(bytes / 1024)} KB\n`);
    await ctx.close();
  }
  await browser.close();
  return out;
}

/** behaviour checks: reduced motion, context loss → board twin with the same acts, the voice duck, scan wording */
async function checks(base) {
  const browser = await launch();
  const s = nishanaSkills().find((x) => x.goal === "place");
  const res = {};
  // reduced motion: no particles live after a hit; the consequence still shows
  { const { ctx, page } = await open(browser, base, VIEWPORTS[0], qs(s), { reduced: true });
    await driveTo(page, "miss");
    res.reduced = await page.evaluate(() => ({ particles: window.__play.stage3d.perf().particles, gapShown: [...document.querySelectorAll(".c3-label")].some((e) => e.style.display !== "none" && /farak|off/.test(e.textContent)) }));
    await ctx.close(); }
  // context loss after one act: the 2D board twin takes over with the same controller and acts
  { const { ctx, page } = await open(browser, base, VIEWPORTS[0], qs(s));
    await driveTo(page, "miss");
    const before = await page.evaluate(() => window.__play.acts().length);
    await page.evaluate(() => window.__play.loseContext());
    await page.waitForFunction(() => document.querySelector("[data-render]")?.getAttribute("data-render") === "2d", null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    res.contextLoss = await page.evaluate((before) => ({ render: document.querySelector("[data-render]").getAttribute("data-render"), actsBefore: before, actsAfter: window.__play.acts().length, canvas2d: !!document.querySelector(".pl-canvas"), blank: !document.querySelector(".pl-canvas") && !document.querySelector(".c3-canvas") }), before);
    await ctx.close(); }
  // voice duck: music gain under her voice reaches < 5% of the bed within 120 ms
  { const { ctx, page } = await open(browser, base, VIEWPORTS[0], qs(s, { cls: 7 }) + "&sound=1");
    await page.click("[data-testid=play-world]", { position: { x: 30, y: 30 } }).catch(() => {});
    res.duck = await page.evaluate(async () => {
      const P = window.__play, st = P.stage3d; st.bus.musicAllowed = true; st.bus.unlock(); st.bus.music("calm");
      await new Promise((r) => setTimeout(r, 1500));
      const before = P.musicGain(); P.speaking(true); const t0 = performance.now();
      await new Promise((r) => setTimeout(r, 120));
      const at120 = P.musicGain(); P.speaking(false);
      return { before: +before.toFixed(4), at120: +at120.toFixed(4), ratio: before ? +(at120 / before).toFixed(3) : null, ms: Math.round(performance.now() - t0) };
    });
    await ctx.close(); }
  // scan wording (O-G4 parent switch): the commit button reads "Scan karo", never "Daago"
  { const { ctx, page } = await open(browser, base, VIEWPORTS[0], qs(s, { verb: "scan" }));
    res.scan = await page.evaluate(() => document.querySelector("[data-testid=play-ctl-commit]")?.textContent);
    await ctx.close(); }
  // class 4-5: music off by default; class 7: on
  for (const cls of [4, 7]) { const { ctx, page } = await open(browser, base, VIEWPORTS[0], qs(s, { cls }));
    res[`music_c${cls}`] = await page.evaluate(() => document.querySelector("[data-testid=play-music]")?.getAttribute("aria-pressed"));
    await ctx.close(); }
  await browser.close();
  return res;
}

async function video(base) {
  const browser = await launch();
  const s = nishanaSkills().find((x) => x.goal === "place");
  mkdirSync(join(OUT, "video"), { recursive: true });
  const made = [];
  for (const theme of THEMES) for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, recordVideo: { dir: join(OUT, "video"), size: { width: vp.w, height: vp.h } } });
    const page = await ctx.newPage();
    await page.goto(`${base}/?${qs(s, { theme, cls: 7 })}`);
    await page.waitForFunction(() => window.__play?.stage3d, null, { timeout: 15000 });
    await page.waitForTimeout(800);
    await driveTo(page, "miss");
    await page.waitForTimeout(400);
    await driveTo(page, "hit").catch(() => {});
    await page.waitForTimeout(1200);
    const v = page.video(); await ctx.close();
    const path = await v.path();
    const dest = join(OUT, "video", `antariksh-${theme}-${vp.tag}.webm`);
    writeFileSync(dest, readFileSync(path));
    try { (await import("node:fs")).unlinkSync(path); } catch { /* keep */ }
    made.push(dest.replace(ROOT + "/", ""));
    process.stdout.write(`video ${dest}\n`);
  }
  await browser.close();
  return made;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { srv, url } = await serve(DIR);
  const results = {};
  try {
    if (mode === "audit" || mode === "all") results.audit = await shotsAndAudit(url, { shots: false });
    if (mode === "shots" || mode === "all") results.shots = await shotsAndAudit(url, { shots: true, states: ["aim", "miss", "hit"] });
    if (mode === "fps" || mode === "all") results.fps = await fps(url, { vps: VIEWPORTS });
    if (mode === "load" || mode === "all") results.load = await coldLoad(url);
    if (mode === "checks" || mode === "all") results.checks = await checks(url);
    if (mode === "video" || mode === "all") results.video = await video(url);
  } finally { srv.close(); }
  mkdirSync(join(OUT, "results"), { recursive: true });
  const file = join(OUT, "results", `${mode}${ONLY ? "-" + ONLY : ""}.json`);
  writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), mode, ...results }, null, 1));
  console.log("wrote", file);
  if (results.audit) { const f = results.audit.filter((r) => !r.pass); console.log(`audit: ${results.audit.length - f.length}/${results.audit.length} pass`); }
  if (results.checks) console.log(JSON.stringify(results.checks));
}
