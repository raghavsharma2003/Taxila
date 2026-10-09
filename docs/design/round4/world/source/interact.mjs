// Drive the prototype like a child: the lesson (a wrong answer, then a right one), the game (break 72), the map sheet.
// Shots of each state + a webm and a frame strip of the lesson's motion.
import { browser, page, measure, URL0 } from "./shoot.mjs";
import { mkdirSync, renameSync, readdirSync } from "node:fs";
const OUT = process.env.OUT || new URL("./shots/flow", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const which = process.argv[2] || "all";
const vp = { id: process.argv[3] || "360x800", w: +(process.argv[3] || "360x800").split("x")[0], h: +(process.argv[3] || "360x800").split("x")[1], dpr: (process.argv[3] || "360").startsWith("1366") ? 1 : 2 };
const b = await browser();
const errs = [];
async function shot(p, name) { await p.screenshot({ path: `${OUT}/${name}-${vp.id}.png` }); const m = await p.evaluate(measure); const bad = [...m.overflowX, ...m.small, ...m.targets]; console.log(name, bad.length ? JSON.stringify(m) : "ok"); }

if (which === "all" || which === "lesson") {
  const p = await page(b, vp); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL0 + "#lesson"); await p.waitForTimeout(3500);
  await shot(p, "lesson-a-teaching");
  // wait for the hand-over
  await p.waitForFunction(() => document.querySelector("#lMic")?.classList.contains("yt"), null, { timeout: 40000 });
  await p.waitForTimeout(700); await shot(p, "lesson-b-yourturn");
  await p.click("#lKb"); await p.fill("#lIn", "6 x 6"); await p.waitForTimeout(300); await shot(p, "lesson-c-typing");
  await p.click("#lSend"); await p.waitForTimeout(600); await shot(p, "lesson-d-thinking");
  await p.waitForTimeout(1500); await shot(p, "lesson-e-lookagain");
  await p.waitForFunction(() => document.querySelector("#lMic")?.classList.contains("yt"), null, { timeout: 20000 });
  await p.click("#lMic"); await p.waitForTimeout(1200); await shot(p, "lesson-f-listening");
  await p.waitForTimeout(3600); await shot(p, "lesson-g-right");
  await p.waitForFunction(() => document.querySelector("#lDock .after"), null, { timeout: 25000 });
  await p.waitForTimeout(600); await shot(p, "lesson-h-next");
  await p.context().close();
}
if (which === "all" || which === "game") {
  const p = await page(b, vp); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL0 + "#game"); await p.waitForTimeout(3200);
  await shot(p, "game-a-start");
  const chisel = async (d) => { await p.click(`#gChisel button[data-d="${d}"]`); await p.waitForTimeout(900); };
  await chisel(5); await p.waitForTimeout(200); await shot(p, "game-b-remainder");
  await chisel(8); await shot(p, "game-c-split");
  // the selected block is now 9 (whole); split it, then 8 → 2 × 4 → 2 × 2
  await chisel(3);
  await p.evaluate(() => { const s = TX.Screens.game; const n = s.nodes.find((x) => x.v === 8 && x.state === "whole"); s.select(n); });
  await chisel(2);
  await p.click("#gDone"); await p.waitForTimeout(500); await shot(p, "game-d-stillhumming");
  await p.evaluate(() => { const s = TX.Screens.game; const n = s.nodes.find((x) => x.v === 4 && x.state === "whole"); s.select(n); });
  await chisel(2); await p.waitForTimeout(300); await shot(p, "game-e-allprime");
  await p.click("#gDone"); await p.waitForTimeout(1200); await shot(p, "game-f-fusing");
  await p.waitForTimeout(1800); await shot(p, "game-g-finale");
  await p.context().close();
}
if (which === "all" || which === "map") {
  const p = await page(b, vp); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL0 + "#map&lit"); await p.waitForTimeout(3600); await shot(p, "map-a-sheet");
  await p.evaluate(() => TX.Screens.map.open(8)); await p.waitForTimeout(1200); await shot(p, "map-b-ch8-thread");
  await p.evaluate(() => TX.Screens.map.mode("list")); await p.waitForTimeout(500); await shot(p, "map-c-list");
  await p.context().close();
}
if (which === "all" || which === "parent") {
  const p = await page(b, vp); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL0 + "#parent"); await p.waitForTimeout(2500);
  await p.click('.lang button[data-l="hi"]'); await p.waitForTimeout(800); await shot(p, "parent-hindi");
  await p.context().close();
}
if (which === "reduced") {
  const p = await page(b, vp, { reduced: true }); p.on("pageerror", (e) => errs.push(e.message));
  for (const s of ["hello", "home", "game", "map"]) { await p.goto("about:blank"); await p.goto(URL0 + "#" + s); await p.waitForTimeout(1500); await shot(p, "reduced-" + s); }
  await p.context().close();
}
if (which === "video") {
  const vdir = OUT + "/video"; mkdirSync(vdir, { recursive: true });
  const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, recordVideo: { dir: vdir, size: { width: vp.w, height: vp.h } } });
  const p = await ctx.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (await import("./shoot.mjs")).fontRouteExport || ((r) => r.continue()));
  await p.goto(URL0 + "#home"); await p.waitForTimeout(2600);
  await p.click("#kBegin");
  const t0 = Date.now(); let k = 0;
  const frames = OUT + "/frames"; mkdirSync(frames, { recursive: true });
  const answers = ["6 x 6", "2 x 2 x 3 x 3"]; let ai = 0, ytSince = 0;
  while (Date.now() - t0 < 44000) { await p.screenshot({ path: `${frames}/f${String(k++).padStart(3, "0")}.png` }); await p.waitForTimeout(300);
    const yt = await p.evaluate(() => document.querySelector("#lMic")?.classList.contains("yt"));
    if (yt && ai < answers.length) { if (!ytSince) ytSince = Date.now(); if (Date.now() - ytSince > 1400) { await p.click("#lKb"); await p.fill("#lIn", answers[ai++]); await p.waitForTimeout(500); await p.click("#lSend"); ytSince = 0; } } else if (!yt) ytSince = 0; }
  await ctx.close();
  const f = readdirSync(vdir).find((x) => x.endsWith(".webm")); if (f) renameSync(`${vdir}/${f}`, `${OUT}/lesson-motion-${vp.id}.webm`);
}
console.log("page errors:", errs.length ? errs : "none");
await b.close();
