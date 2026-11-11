// Round 8 · stambh/tally LAYOUT in a real browser (main's condition: the same kind of overlap / cut-off check as
// tests/studio-v2-layout.test.mjs, on this game's own screens). The forge3 QA harness (server/forge3/qa) mounts the
// served level on the play stage (PlayStage, play mode, the whole screen) at 360 x 640 and 1366 x 768, and drives it through
// its states with the level's own acts and real taps on the canvas: the first screen, mid-play (half the scene kept and the
// next row picked / a digit written), tally-four played out (keep: both forms, "counted" and "five"; read: the first check
// and a later one), the repair path (keep: the scene kept again), and the end (first try; read also after a retry). The
// LARGEST cases the generator serves (a keep scene of 28 things with a row of 14; a read row of 49) are driven to the pad
// open at both sizes (judges, round 1). Each state is measured on the page (measure.js: DOM and canvas text runs, targets)
// and judged by the forge checks (Q1 legible, Q2 nothing cut by the box, Q3 no two text runs on each other and none
// covered, Q4 targets at the floor, Q6 no error); the canvas's own audit adds: every text run inside the world, no label
// ellipsised, and the two tally buttons at least 64 px for the 6-9 band (class 4). The end line replaces the instruction.
// Runs where Chromium is installed; FORGE3_BROWSER=0 skips it. TALLY_SHOTS=<dir> also writes a screenshot of every state.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";
import { tallyLogic, tallyFourActs, READ_MAX, KEEP_ROW_MAX, KEEP_SCENE_MAX } from "../src/play/families/stambh/tally.logic.ts";

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const haveChromium = existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.FORGE3_BROWSER === "0" ? "FORGE3_BROWSER=0" : !haveChromium ? "no Chromium" : false;
const SIZES = [{ vp: "360x640", w: 360, h: 640 }, { vp: "1366x768", w: 1366, h: 768 }];
const SHOTS = process.env.TALLY_SHOTS || null;

/** the densest level a child is served for each goal (fade 3), as the play server serves it */
function servedLevel(goal) {
  const e = coverage().entries.find((x) => x.family === "stambh" && x.mode === "tally" && x.goal === goal);
  const key = entryKey(e);
  return currentLevel({ childId: "lay-1", key, skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade: 3, lang: "hinglish", childArt: null, lastArt: null,
    mis: {}, pL: undefined, n: 0, seed: seedOf("lay-1", key, 0), door: "garam", recent: [], hist: null }, e);
}
/** the largest case the generator serves for a goal: read READ_MAX strokes; keep KEEP_SCENE_MAX things over three rows,
 *  one of them KEEP_ROW_MAX (the served fade-3 level with its givens replaced, re-validated by the law) */
function largestLevel(goal) {
  const lv = servedLevel(goal);
  if (goal === "read") return tallyLogic.validate({ ...lv, levelId: `${lv.levelId}-largest`, params: { ...lv.params, counts: [READ_MAX] } });
  // (14, 9, 5: no row with as many loose lines as bundles, evening ruling 1)
  const counts = [KEEP_ROW_MAX, 9, KEEP_SCENE_MAX - KEEP_ROW_MAX - 9], seq = [];
  // the things pass round-robin while each kind has some left
  const left = [...counts];
  while (seq.length < KEEP_SCENE_MAX) for (let r = 0; r < 3; r++) if (left[r] > 0) { seq.push(r); left[r]--; }
  return tallyLogic.validate({ ...lv, levelId: `${lv.levelId}-largest`, params: { ...lv.params, ctx: "traffic", cats: ["car", "bus", "auto"], counts, seq } });
}

describe("stambh/tally layout: no overlap or cut-off at 360 x 640 and 1366 x 768 (every state, the largest cases)", { skip: SKIP, timeout: 600_000 }, () => {
  let browser, served, judge, measureStage, judgeView;
  before(async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ||= browsersDir;
    process.env.FORGE3_QA_LOCAL = "1";
    const R = await import("../server/forge3/qa/render.js");
    ({ measureStage } = await import("../server/forge3/qa/measure.js"));
    ({ judgeView } = await import("../server/forge3/qa/checks.js"));
    const out = await R.buildHarness(join(tmpdir(), `tally-layout-${process.pid}`));
    served = await R.serveHarness(out);
    browser = await R.launchLocal();
    judge = await R.openJudge({ browser, base: served.base });
  });
  after(async () => { await judge?.close(); await browser?.close(); served?.server.close(); });

  let n = 0;
  /** mount the level at a size, run its steps (an act through the law, the same controller the child's taps reach; a tap
   *  on a canvas target; a press of a DOM control), then measure */
  async function state(level, size, steps, art = "kagaz") {
    const page = judge.page;
    await page.setViewportSize({ width: size.w, height: size.h });
    await page.evaluate((jb) => window.__forge3.show(jb), { play: { level, art, lang: "hinglish", classLevel: 4, debug: true }, artifact: null, tray: { w: size.w, h: size.h }, id: `t${++n}` });
    await page.waitForTimeout(300);
    await page.clock.runFor(600);
    await page.waitForFunction(() => !!window.__play?.dispatch, null, { timeout: 10_000 });
    // the art's faces are on the page before anything is measured: a label laid out in a wider fallback is ellipsised on
    // one runner and not another (PR #130, 2026-11-11). The stage repaints itself when a face arrives (stage.ts, loadingdone).
    const faces = await page.evaluate(() => Promise.all(['"Atkinson Hyperlegible Next"', '"Bricolage Grotesque"', '"Geist Mono"']
      .flatMap((f) => [400, 700].map((w) => document.fonts.load(`${w} 16px ${f}`).then((l) => l.length, () => 0)))).then(async (n) => { await document.fonts.ready; return n; }));
    assert.ok(faces.every((k) => k > 0), `the art's faces load (${faces})`);
    await page.clock.runFor(100);
    for (const s of steps) {
      if (s.tap) {
        await page.clock.runFor(700);
        await page.waitForTimeout(40);
        const box = await page.evaluate((id) => { const t = window.__play.audit.targets.find((x) => x.id === id); const r = document.querySelector("[data-testid=play-world] canvas").getBoundingClientRect(); return t ? { x: r.x + t.x + t.w / 2, y: r.y + t.y + t.h / 2 } : null; }, s.tap);
        assert.ok(box, `target ${s.tap} on screen`);
        await page.mouse.click(box.x, box.y);
      } else if (s.press) assert.ok(await page.evaluate((id) => window.__play.press(id), s.press), `control ${s.press}`);
      else await page.evaluate((x) => window.__play.dispatch(x), s);
    }
    await page.clock.runFor(2400);
    await page.waitForTimeout(80);
    const m = await page.evaluate(measureStage);
    const events = await page.evaluate(() => window.__forge3.events.slice());
    const audit = await page.evaluate(() => { const a = window.__play.audit; return { box: a.box, clipped: a.clipped, texts: a.texts.map((t) => ({ ...t })), targets: a.targets.map((t) => ({ ...t })) }; });
    const st = await page.evaluate(() => window.__play.state());
    const goalLine = await page.evaluate(() => document.querySelector("[data-testid=play-goal]")?.textContent ?? "");
    const controls = await page.evaluate(() => window.__play.controls());
    return { m, events, audit, st, goalLine, controls };
  }
  function faults(r) {
    const v = judgeView(r.m, { young: true, events: r.events, artifactKind: "playlevel" });
    const out = v.hard.filter((c) => !c.pass && ["Q1.legible", "Q2.whole", "Q3.apart", "Q4.touchable", "Q6.clean"].includes(c.id)).map((c) => `${c.id}: ${c.detail}`);
    const { box } = r.audit;
    for (const t of r.audit.texts) {
      const x0 = t.align === "left" ? t.x : t.align === "right" ? t.x - t.w : t.x - t.w / 2;
      if (x0 < -0.5 || x0 + t.w > box.w + 0.5 || t.y - t.px / 2 < -0.5 || t.y + t.px / 2 > box.h + 0.5) out.push(`canvas text cut by the world: "${t.s}" at ${Math.round(x0)},${Math.round(t.y)} in ${box.w}x${box.h}`);
    }
    if (r.audit.clipped) out.push(`${r.audit.clipped} canvas labels ellipsised`);
    return out;
  }
  async function shoot(name, size) {
    if (!SHOTS) return;
    mkdirSync(SHOTS, { recursive: true });
    await judge.page.screenshot({ path: join(SHOTS, `${name}-${size.vp}.png`) });
  }
  const totalsOf = (acts) => acts.filter((a) => a.kind !== "mark");
  const checkOf = [{ kind: "check" }];

  for (const goal of ["keep", "read"]) for (const size of SIZES) {
    it(`${goal} at ${size.vp}`, async () => {
      const level = servedLevel(goal), p = level.params, sol = tallyLogic.solve(level), mal = tallyLogic.malActs(level, "tally-four");
      const marks = sol.filter((a) => a.kind === "mark"), half = marks.slice(0, Math.ceil(marks.length / 2));
      const phases = goal === "keep" ? {
        initial: [],
        // half the scene kept, and the row of the thing passing now picked (a real tap): the picked row is outlined
        mid: [...half, { tap: `row-${p.seq[half.length]}` }],
        mal,
        "mal-five": tallyFourActs(p, "five"),
        // the repair path once the strip has folded away: keep the scene again (the strip comes back, the rows clear)
        again: [...mal, { press: "again" }],
        end: sol,
      } : {
        initial: [],
        mid: [{ kind: "total", row: 0, n: Number(String(p.counts[0])[0]) }],
        mal,
        // a later check, still off: the count over each bundle again, her number and the way to go (no ticks, no hops)
        retry: [...mal, { kind: "total", row: 0, n: p.counts[0] - 2 }, ...checkOf],
        end: sol,
        "end-retry": [...mal, ...totalsOf(sol)],
      };
      const bad = [];
      for (const [phase, steps] of Object.entries(phases)) {
        const r = await state(level, size, steps);
        await shoot(`${goal}-${phase}`, size);
        for (const f of faults(r)) bad.push(`${phase}: ${f}`);
        if (phase === "mal") { assert.equal(r.st.mal, "tally-four", "the mal state is the one played out"); assert.equal(r.st.sign, "counted"); }
        if (phase === "mal-five") {
          assert.equal(r.st.mal, "tally-four"); assert.equal(r.st.sign, "five");
          // round 2, ruling 1: the line points only at keeping the tally again; Jaancho waits until something changes
          assert.match(r.goalLine, /^Tally phir se rakho$/, r.goalLine);
          assert.ok(r.controls.some((c) => c.id === "done" && c.disabled), "Jaancho waits");
        }
        if (phase.startsWith("end")) {
          assert.equal(r.st.done, true);
          assert.equal(r.st.checks, phase === "end" ? 1 : 2);
          assert.match(r.goalLine, /\d/, "the end line says what she did, in digits");
          assert.doesNotMatch(r.goalLine, /tally rakho|row chhuo|kitne dikhati/i, "the instruction is gone at the end");
        }
        if (goal === "keep" && ["initial", "mid", "again"].includes(phase)) {
          const btns = r.audit.targets.filter((t) => t.id === "btn-stand" || t.id === "btn-across");
          assert.equal(btns.length, 2, `${phase}: both tally buttons on screen`);
          for (const b of btns) assert.ok(Math.min(b.w, b.h) >= 64, `${phase}: ${b.id} ${b.w}x${b.h} under 64 px`);
          assert.match(r.goalLine, /row chhuo/, `${phase}: the instruction says what she taps`);
        }
        if (goal === "keep" && phase === "mal") assert.ok(r.controls.some((c) => c.id === "again" && !c.disabled), "the repair path is on screen after a miss");
        if (phase === "again") assert.equal(r.st.at, 0);
      }
      assert.deepEqual(bad, [], `layout faults:\n${bad.join("\n")}`);
    });
  }

  for (const goal of ["keep", "read"]) for (const size of SIZES) {
    it(`the largest ${goal} case at ${size.vp}, pad open`, async () => {
      const level = largestLevel(goal);
      assert.ok(level, "the largest case is a level the law accepts");
      const sol = tallyLogic.solve(level), marks = sol.filter((a) => a.kind === "mark");
      // keep: the whole scene kept, the biggest row's total cell tapped and a digit written; read: a digit written
      const steps = goal === "keep" ? [...marks, { tap: "tot-0" }, { kind: "total", row: 0, n: 1 }] : [{ kind: "total", row: 0, n: 4 }];
      const r = await state(level, size, steps);
      await shoot(`${goal}-largest`, size);
      assert.ok(r.controls.some((c) => c.id === "k1"), "the pad is open");
      assert.deepEqual(faults(r), [], `largest ${goal} at ${size.vp}`);
    });
  }
});
