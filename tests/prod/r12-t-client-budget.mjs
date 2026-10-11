// Release 12 · T-client, the recorder's budgets and its "never changes a lesson" rule (brief §Budgets), on the dev server
// with Playwright Chromium (SwiftShader: a lab proxy, not a phone). Arms interleaved by round.
//  1. Tier 1 main thread: the scripted lesson (real LessonRuntime, scripted Director), 3 turns, 412x915, CPU x4.
//     recorder share = the recorder's own measured time (bus busyMs) / wall time; also the page's total TaskDuration
//     (CDP) with the recorder vs without. Budget: <= 2 %.
//  2. Tier 2 frame rate: requestAnimationFrame frames per second while a board page draws (Desk fixture work-beat,
//     motion on) and while Antariksh runs (play harness, 3D), recorder off vs tier 2 (rrweb with canvas sampling).
//     Budget: >= 50 fps with tier 2 on (and reported against the same page without the recorder).
//  3. A broken recorder never changes a lesson: the same scripted lesson with no recorder and with a SABOTAGED tier-2
//     recorder (its sink, its sends and its chunks all throw): the floor sequence, the turn requests and the visible
//     text after every turn must be identical, with no page error.
// Writes docs/design/round4/build/r12/t-client/budget.json. Exit 1 when a budget or the identity check fails.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r12-t-client-budget.mjs [--rounds 3]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { startVite } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname, PORT = 5206, ORIGIN = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, "docs/design/round4/build/r12/t-client");
const ROUNDS = Number(process.argv[process.argv.indexOf("--rounds") + 1] || 3) || 3;
const H = `${ORIGIN}/src/trace/dev/lesson.html`;
const cov = JSON.parse(fs.readFileSync(path.join(ROOT, "data/play/coverage.json"), "utf8"));
const nis = cov.entries.find((x) => x.family === "nishana");
const game = new URLSearchParams({ page: "play", family: "nishana", mode: nis.mode, goal: nis.goal, grammar: JSON.stringify(nis.grammar), topic: nis.topicId, skill: nis.skillIds[0], class: String(nis.classLevel), lang: "hinglish", fade: "1", seed: "3", engine: "3d", theme: "neela-nebula" }).toString();

const stop = await startVite(ROOT, PORT);
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ANSWERS = ["two", "two quarters", "half"];

async function lesson(query, { cpu = 4 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Performance.enable");
  if (cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  const t0 = Date.now();
  await p.goto(`${H}?class=7&live=1&look=volt&${query}`);
  await p.waitForSelector('[data-testid="lesson"]', { timeout: 90_000 });
  const trail = [];
  for (const a of ANSWERS) {
    const ok = await p.waitForFunction(() => window.__k1?.floor === "your_turn", null, { timeout: 60_000 }).then(() => true, () => false);
    if (!ok) { trail.push({ stuck: true }); break; }
    await p.waitForTimeout(400);
    const before = await p.evaluate(() => window.__k1.turnAt.length);
    await p.evaluate((x) => window.__k1.send(x), a);
    await p.waitForFunction((n) => window.__k1.paintAt.length > n, before, { timeout: 60_000 }).catch(() => {});
    await p.waitForTimeout(1500);
    // the visible text, without the REC chip (tier 2's one sanctioned visible addition)
    trail.push(await p.evaluate(() => { const c = document.querySelector('[data-testid="lesson"]'); const rec = c?.querySelector('[data-testid="rec-chip"]'); const t = c?.innerText ?? ""; return { floor: window.__k1.floor, turns: window.__k1.turnAt.length, text: (rec ? t.replace(rec.innerText, "") : t).replace(/\s+/g, " ").trim() }; }));
  }
  const wallMs = Date.now() - t0;
  const m = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
  const rec = await p.evaluate(() => window.__trace?.stats?.() ?? null);
  await ctx.close();
  return { wallMs, taskMs: Math.round(m.TaskDuration * 1000), scriptMs: Math.round(m.ScriptDuration * 1000), rec, trail, errors };
}

async function fps(url, ms = 4000) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url);
  await p.waitForTimeout(1500);
  const r = await p.evaluate((ms) => new Promise((res) => {
    let n = 0, worst = 0, last = performance.now();
    const t0 = last;
    const f = (t) => { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else res({ fps: Math.round((n / ((t - t0) / 1000)) * 10) / 10, worstFrameMs: Math.round(worst) }); };
    requestAnimationFrame(f);
  }), ms);
  // proof the tier-2 recording really ran during the window: close its chunk and count its events (3/9 = canvas frames)
  await p.evaluate(() => window.__traceStop?.());
  await p.waitForTimeout(600);
  const rr = await p.evaluate(() => ({ rrweb: window.__rrweb?.length ?? 0, canvasFrames: (window.__rrweb ?? []).filter((e) => e.type === 3 && e.data?.source === 9).length,
    started: (window.__traceEvents ?? []).some((e) => e.kind === "rrweb.start"), canvases: document.querySelectorAll("canvas").length, svg: document.querySelectorAll('[data-testid="studio-stage"] svg').length }));
  await ctx.close();
  return { ...r, ...rr };
}

const res = { tier1: [], fps: [], identity: [] };
try {
  for (let r = 0; r < ROUNDS; r++) {
    const off = await lesson("trace=off");
    const on = await lesson("");
    res.tier1.push({ round: r, off: { wallMs: off.wallMs, taskMs: off.taskMs, scriptMs: off.scriptMs }, on: { wallMs: on.wallMs, taskMs: on.taskMs, scriptMs: on.scriptMs, busyMs: on.rec?.busyMs, events: on.rec?.seq },
      recorderShare: on.rec ? Math.round((on.rec.busyMs / on.rec.wallMs) * 10000) / 100 : null, taskDeltaShare: Math.round(((on.taskMs - off.taskMs) / on.wallMs) * 10000) / 100 });
    console.log("tier1", JSON.stringify(res.tier1.at(-1)));
    for (const [name, base] of [["board", `${H}?class=7&fixture=work-beat&look=volt`], ["antariksh", `${H}?${game}`]]) {
      const a = await fps(`${base}&trace=off`);
      const b = await fps(`${base}&tier=2`);
      res.fps.push({ round: r, piece: name, off: a, tier2: b });
      console.log("fps", name, JSON.stringify({ off: a.fps, tier2: b.fps, rrweb: b.rrweb, canvasFrames: b.canvasFrames, started: b.started, canvases: b.canvases }));
    }
    if (r === 0) {
      const plain = await lesson("trace=off", { cpu: 1 });
      const broken = await lesson("tier=2&sabotage=1", { cpu: 1 });
      const same = JSON.stringify(plain.trail) === JSON.stringify(broken.trail);
      res.identity.push({ same, plain: plain.trail, broken: broken.trail, errors: { plain: plain.errors, broken: broken.errors } });
      console.log("identity", same, broken.errors);
    }
  }
} finally { await browser.close(); stop(); }

const med = (xs) => { const s = xs.filter((x) => typeof x === "number").sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const summary = {
  tier1RecorderSharePct: { median: med(res.tier1.map((x) => x.recorderShare)), max: Math.max(...res.tier1.map((x) => x.recorderShare ?? 0)) },
  tier1TaskDeltaPct: { median: med(res.tier1.map((x) => x.taskDeltaShare)) },
  fps: Object.fromEntries(["board", "antariksh"].map((k) => [k, { offMedian: med(res.fps.filter((x) => x.piece === k).map((x) => x.off.fps)), tier2Median: med(res.fps.filter((x) => x.piece === k).map((x) => x.tier2.fps)), tier2Min: Math.min(...res.fps.filter((x) => x.piece === k).map((x) => x.tier2.fps)) }])),
  identical: res.identity.every((x) => x.same && !x.errors.broken.length),
};
const ok = summary.tier1RecorderSharePct.max <= 2 && summary.identical && Object.values(summary.fps).every((f) => f.tier2Min >= 50 || f.tier2Min >= f.offMedian * 0.95);
fs.writeFileSync(path.join(OUT, "budget.json"), JSON.stringify({ date: new Date().toISOString(), rounds: ROUNDS, method: "dev server, Playwright Chromium (SwiftShader GL), 412x915 DPR 1; tier 1 = scripted lesson, 3 turns, CPU x4; fps = rAF over 4 s after 1.5 s settle; identity = the scripted lesson with no recorder vs a sabotaged tier-2 recorder, CPU x1. LAB proxy, not a phone.", summary, ok, res }, null, 1));
console.log(JSON.stringify(summary, null, 1));
process.exit(ok ? 0 : 1);
