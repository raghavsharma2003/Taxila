// Round 8 · stambh/tally LAYOUT in a real browser (main's condition: the same kind of overlap / cut-off check as
// tests/studio-v2-layout.test.mjs, on this game's own screens). The forge3 QA harness (server/forge3/qa) mounts the
// served level on the play stage (PlayStage, play mode, the whole screen) at 360 x 640 and 1366 x 768, and drives it through
// four states with the level's own acts: the first screen, mid-play (half the scene kept / a digit written), a tally-four
// answer played out, and the end (solved). Each state is measured on the page (measure.js: DOM and canvas text runs,
// targets) and judged by the forge checks (Q1 legible, Q2 nothing cut by the box, Q3 no two text runs on each other and none
// covered, Q4 targets at the floor, Q6 no error); the canvas's own audit adds: every text run inside the world, no label
// ellipsised, and the two tally buttons at least 64 px for the 6-9 band (class 4). The redraw-window test covers that each
// timed beat lands while the stage still draws. Runs where Chromium is installed; FORGE3_BROWSER=0 skips it.
// TALLY_SHOTS=<dir> also writes a screenshot of every state at both sizes.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { coverage, currentLevel, entryKey, seedOf } from "../server/play/levels.js";
import { tallyLogic } from "../src/play/families/stambh/tally.logic.ts";

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

describe("stambh/tally layout: no overlap or cut-off at 360 x 640 and 1366 x 768 (first screen, mid-play, tally-four, end)", { skip: SKIP, timeout: 240_000 }, () => {
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
  /** mount the level at a size, run `acts` through the law (the same controller the child's taps reach), then measure */
  async function state(level, size, acts, art = "kagaz") {
    const page = judge.page;
    await page.setViewportSize({ width: size.w, height: size.h });
    await page.evaluate((jb) => window.__forge3.show(jb), { play: { level, art, lang: "hinglish", classLevel: 4, debug: true }, artifact: null, tray: { w: size.w, h: size.h }, id: `t${++n}` });
    await page.waitForTimeout(300);
    await page.clock.runFor(600);
    await page.waitForFunction(() => !!window.__play?.dispatch, null, { timeout: 10_000 });
    for (const a of acts) await page.evaluate((x) => window.__play.dispatch(x), a);
    await page.clock.runFor(2200);
    await page.waitForTimeout(80);
    const m = await page.evaluate(measureStage);
    const events = await page.evaluate(() => window.__forge3.events.slice());
    const audit = await page.evaluate(() => { const a = window.__play.audit; return { box: a.box, clipped: a.clipped, texts: a.texts.map((t) => ({ ...t })), targets: a.targets.map((t) => ({ ...t })) }; });
    const st = await page.evaluate(() => window.__play.state());
    return { m, events, audit, st };
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
  async function shoot(goal, phase, size) {
    if (!SHOTS) return;
    mkdirSync(SHOTS, { recursive: true });
    await judge.page.screenshot({ path: join(SHOTS, `${goal}-${phase}-${size.vp}.png`) });
  }

  for (const goal of ["keep", "read"]) for (const size of SIZES) {
    it(`${goal} at ${size.vp}`, async () => {
      const level = servedLevel(goal), sol = tallyLogic.solve(level), mal = tallyLogic.malActs(level, "tally-four");
      const marks = sol.filter((a) => a.kind === "mark");
      const phases = {
        initial: [],
        mid: goal === "keep" ? marks.slice(0, Math.ceil(marks.length / 2)) : [{ kind: "total", row: 0, n: Number(String(level.params.counts[0])[0]) }],
        mal,
        end: sol,
      };
      const bad = [];
      for (const [phase, acts] of Object.entries(phases)) {
        const r = await state(level, size, acts);
        await shoot(goal, phase, size);
        for (const f of faults(r)) bad.push(`${phase}: ${f}`);
        if (phase === "mal") assert.equal(r.st.mal, "tally-four", "the mal state is the one played out");
        if (phase === "end") assert.equal(r.st.done, true);
        if (goal === "keep" && phase !== "end" && phase !== "mal") {
          const btns = r.audit.targets.filter((t) => t.id === "btn-stand" || t.id === "btn-across");
          assert.equal(btns.length, 2, `${phase}: both tally buttons on screen`);
          for (const b of btns) assert.ok(Math.min(b.w, b.h) >= 64, `${phase}: ${b.id} ${b.w}x${b.h} under 64 px`);
        }
      }
      assert.deepEqual(bad, [], `layout faults:\n${bad.join("\n")}`);
    });
  }
});
