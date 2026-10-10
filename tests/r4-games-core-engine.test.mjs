// Antariksh (E1) in a real browser, through the same PlayStage the lesson mounts (the play dev harness page on a Vite dev
// server). Runtime half of the economy lint and the engine's contract (CORE-API):
//   - every Nishana goal (place / compare / round) renders in 3D and is solved by the child's real inputs: taps on the
//     world to aim, the commit control to fire, flying into a gate to compare / round;
//   - every progress write names a cause that exists in this level (an act's seq, a law moment, or the level start);
//   - a mal-rule shot decloaks the target at the truth and draws the gap (never a verdict word);
//   - voice: "yahan" presses the same commit a finger does (via "voice");
//   - doors are drawn in the world (no DOM doors) and the warp re-levels the same world;
//   - a lost WebGL context falls to the 2D board twin with the same acts (never blank).
// SwiftShader software GL: correctness only, no frame-rate claim here.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.ENGINES_BROWSER === "0" ? "ENGINES_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;

const GOALS = {
  place: { topic: "c5-maths-ch02-t01", skill: "c5-maths-ch02-t01-s2", mode: "place", goal: "place", grammar: { forms: ["fraction"], ranges: [[0, 1], [0, 2]] }, mal: ["count-marks", "whole-number-bias", "all-less-than-one"] },
  compare: { topic: "c6-maths-ch10-t02", skill: "c6-maths-ch10-t02-s2", mode: "compare", goal: "compare", grammar: { forms: ["integer"] }, mal: ["neg-magnitude"] },
  round: { topic: "c4-maths-ch04-t03", skill: "c4-maths-ch04-t03-s2", mode: "place", goal: "round", grammar: { to: [100, 1000] }, mal: ["round-truncate", "round-chain", "round-last-digit"] },
};
const url = (g, extra = "") => `${base}src/play/dev/index.html?family=nishana&mode=${g.mode}&goal=${g.goal}&topic=${g.topic}&skill=${g.skill}&class=6&engine=3d&fade=1&seed=5&grammar=${encodeURIComponent(JSON.stringify(g.grammar))}${extra}`;

let server, browser, base;
before(async () => {
  if (SKIP) return;
  const { createServer } = await import("vite");
  server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0, strictPort: false, hmr: false } });
  await server.listen();
  base = server.resolvedUrls.local[0];
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
});
after(async () => { await browser?.close(); await server?.close(); });

async function open(g, extra = "") {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  await page.goto(url(g, extra));
  await page.waitForFunction(() => window.__play && document.querySelector("[data-render]")?.getAttribute("data-render") !== "wait", null, { timeout: 30000 });
  await page.waitForFunction(() => !window.__play.stage3d || window.__play.stage3d.perf().drawn > 2, null, { timeout: 30000 });
  await page.waitForTimeout(300);
  return { page, errors };
}
/** the child's inputs only: a tap on the world at a value (the engine aims there), then a press of a control */
const PLAY = `(async () => {
  const P = window.__play, p = P.level.params, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const canvas = document.querySelector(".c3-canvas"), r = canvas.getBoundingClientRect();
  const cx = (e) => { const b = e.getBoundingClientRect(); return b.left + b.width / 2 - r.left; };
  window.__tapAt = async (value) => {
    for (let k = 0; k < 60 && ![...document.querySelectorAll(".c3-label[data-id=tick0]")].some((e) => e.style.display !== "none"); k++) await wait(50);
    const ticks = [...document.querySelectorAll(".c3-label[data-id^=tick]")].filter((e) => e.style.display !== "none").map((e) => ({ j: Number(e.dataset.id.slice(4)), e }));
    const nMaj = Math.round((p.hi - p.lo) / p.major), first = ticks.find((t) => t.j === 0), last = ticks.find((t) => t.j === nMaj);
    const u = (value - p.lo) / (p.hi - p.lo), x = cx(first.e) + u * (cx(last.e) - cx(first.e));
    for (const type of ["pointerdown", "pointerup"]) canvas.dispatchEvent(new PointerEvent(type, { pointerId: 9, clientX: r.left + x, clientY: r.top + r.height * 0.6, bubbles: true, isPrimary: true, pointerType: "touch" }));
    await wait(80);
  };
  window.__fire = async (value) => { await window.__tapAt(value); P.press("commit"); await wait(1900); };
})()`;

describe("Antariksh engine in the browser (round 4 G1)", { skip: SKIP }, () => {
  for (const [name, g] of Object.entries(GOALS)) {
    it(`${name}: solved with taps and the commit control; every progress write is traced to an act, a moment or the level start`, async () => {
      const { page, errors } = await open(g);
      assert.equal(await page.getAttribute("[data-render]", "data-render"), "3d");
      await page.evaluate(PLAY);
      const out = await page.evaluate(async () => {
        const P = window.__play, lv = P.level, sol = P.solve(), wait = (ms) => new Promise((r) => setTimeout(r, ms));
        for (const a of sol) if (a.kind === "place") await window.__fire(a.x);
        // compare / round: fly into the right gate (steer onto it with a tap, then commit)
        const end = sol.find((a) => a.kind === "order" || a.kind === "round");
        if (end) {
          const p = lv.params, target = end.kind === "round" ? end.to : p.values[end.first].num / p.values[end.first].den;
          await window.__tapAt(target); P.press("commit"); await wait(900);
        }
        return { solved: P.facts().done === "yes", acts: P.acts().map((a) => a.seq), trace: P.progress(), dom: !!document.querySelector(".pl-doors") };
      });
      assert.ok(out.solved, `${name}: not solved`);
      const seqs = new Set(out.acts);
      for (const t of out.trace) {
        const m = /^(act|moment|level):([^@]+)(?:@(\d+))?$/.exec(t.cause);
        assert.ok(m, `bad cause ${t.cause}`);
        if (m[1] === "act") assert.ok(seqs.has(Number(m[2])), `${t.key} caused by act ${m[2]} that does not exist`);
        if (m[1] === "moment") assert.ok(seqs.has(Number(m[3])), `${t.key} caused by a moment at seq ${m[3]} that does not exist`);
        if (m[1] === "level") assert.equal(m[2], "start");
      }
      assert.ok(out.trace.length >= 2);
      assert.deepEqual(errors, []);
      await page.close();
    });
  }

  it("a mal-rule shot decloaks the target at the truth and draws the gap; the evidence is the first commit's", async () => {
    const { page } = await open(GOALS.place);
    await page.evaluate(PLAY);
    const out = await page.evaluate(async () => {
      const P = window.__play;
      const mal = P.mal().map((m) => P.malActs(m)).find((a) => a && a.length);
      for (const a of mal) if (a.kind === "place") await window.__fire(a.x);
      const shown = [...document.querySelectorAll(".c3-label")].filter((e) => e.style.display !== "none").map((e) => e.textContent);
      // re-fire at the truth: the target clears; the law's first decisive moment stays the evidence
      const sol = P.solve(); for (const a of sol) if (a.kind === "place") await window.__fire(a.x);
      return { shown, done: P.facts().done, commits: P.acts().filter((a) => a.act.kind === "commit").length };
    });
    assert.ok(out.shown.some((t) => /farak/.test(t)), `no gap label in ${JSON.stringify(out.shown)}`);
    assert.ok(!out.shown.some((t) => /\b(galat|wrong|sahi|correct)\b/i.test(t)));
    assert.equal(out.done, "yes"); assert.equal(out.commits, 2);
    await page.close();
  });

  it("voice: 'yahan' presses the commit a finger presses, tagged via voice", async () => {
    const { page } = await open(GOALS.place);
    await page.evaluate(PLAY);
    const out = await page.evaluate(async () => { const r = window.__play.say("yahan"); await new Promise((x) => setTimeout(x, 1900)); return { r, vias: window.__play.acts().map((a) => a.via) }; });
    assert.deepEqual(out.r.pressed, ["commit"]);
    assert.ok(out.vias.includes("voice"));
    await page.close();
  });

  it("doors are warp gates in the world; flying into one re-levels the same 3D world", async () => {
    const { page } = await open(GOALS.place);
    await page.evaluate(PLAY);
    const out = await page.evaluate(async () => {
      const P = window.__play, wait = (ms) => new Promise((r) => setTimeout(r, ms)), id0 = P.level.levelId;
      for (const a of P.solve()) if (a.kind === "place") await window.__fire(a.x);
      await wait(400);
      const domDoors = !!document.querySelector(".pl-doors"), gate = [...document.querySelectorAll(".c3-label[data-id^=gate]")].filter((e) => e.style.display !== "none").map((e) => e.textContent);
      P.press("commit"); await wait(2600);
      return { domDoors, gate, render: document.querySelector("[data-render]").dataset.render, changed: window.__play.level.levelId !== id0, canvases: document.querySelectorAll(".c3-canvas").length };
    });
    assert.equal(out.domDoors, false);
    assert.ok(out.gate.length >= 1 && out.gate.length <= 2, JSON.stringify(out.gate));
    assert.equal(out.render, "3d"); assert.ok(out.changed); assert.equal(out.canvases, 1);
    await page.close();
  });

  it("a lost WebGL context falls to the 2D board twin with the same acts (never a blank stage)", async () => {
    const { page } = await open(GOALS.place);
    await page.evaluate(PLAY);
    const out = await page.evaluate(async () => {
      const P = window.__play, mal = P.mal().map((m) => P.malActs(m)).find((a) => a && a.length);
      for (const a of mal) if (a.kind === "place") await window.__fire(a.x);
      const before = P.acts().length; P.loseContext();
      await new Promise((r) => setTimeout(r, 1200));
      return { before, after: window.__play.acts().length, render: document.querySelector("[data-render]").dataset.render, c2d: !!document.querySelector(".pl-canvas"), c3d: !!document.querySelector(".c3-canvas") };
    });
    assert.equal(out.render, "2d"); assert.ok(out.c2d); assert.equal(out.c3d, false);
    assert.ok(out.before >= 2); assert.equal(out.after, out.before);
    await page.close();
  });
});
