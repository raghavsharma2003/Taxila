// Round 3 · forge: the visual-QA gate in a real browser (server/forge3/qa). Builds the harness page from this tree, renders
// artifacts in the real Desk tray + StudioStage at the judged sizes, and checks that the verdicts catch what the taxila.dev
// audit saw and pass what is fine; and that the stage's device check swaps an unusable Studio v2 world for its board twin.
// Runs in `npm test` when Chromium is installed; FORGE3_BROWSER=0 skips it. ~15 s.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TIGHT_PHONE, DESK_VIEWPORTS } from "../server/forge3/qa/viewports.js";

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const haveChromium = existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.FORGE3_BROWSER === "0" ? "FORGE3_BROWSER=0" : !haveChromium ? "no Chromium" : false;
const PROD = JSON.parse(readFileSync(new URL("./fixtures/round3-forge/prod-boards-2026-10-09.json", import.meta.url), "utf8"));

describe("round3 forge: visual QA in the browser", { skip: SKIP, timeout: 240_000 }, () => {
  let browser, served, judge;
  before(async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ||= browsersDir;
    process.env.FORGE3_QA_LOCAL = "1";
    const { buildHarness, serveHarness, openJudge, launchLocal } = await import("../server/forge3/qa/render.js");
    const out = await buildHarness(join(tmpdir(), `forge3-qa-test-${process.pid}`));
    served = await serveHarness(out);
    browser = await launchLocal();
    judge = await openJudge({ browser, base: served.base });
  });
  after(async () => { await judge?.close(); await browser?.close(); served?.server.close(); });

  it("a corner board is framed (bigger than the whole board would be) and every view of a clean board passes", async () => {
    const s = PROD.find((x) => x.case === "whiteboard").script;
    const r = await judge.judge({ kind: "whiteboard", stage: { w: s.board.w, h: s.board.h }, script: s }, { viewports: DESK_VIEWPORTS });
    const p360 = r.views.find((v) => v.vp === "p360");
    assert.ok(p360.verdict.stats.minPx >= 14, `framed text at 360: ${p360.verdict.stats.minPx} px (unframed: 13.3 px)`);
    assert.equal(r.piece.pass, true, JSON.stringify(r.piece.fails));
  });
  it("the taxila.dev number-line board (11 px words at 360 before) is laid out for the phone box and passes at every size", async () => {
    const s = PROD.find((x) => x.case === "picture").script;
    const r = await judge.judge({ kind: "whiteboard", stage: { w: s.board.w, h: s.board.h }, script: s }, { viewports: DESK_VIEWPORTS });
    assert.equal(r.piece.pass, true, JSON.stringify(r.piece));
    assert.ok(r.views.find((v) => v.vp === "p360").verdict.stats.minPx >= 14);
  });
  it("text under the floor still fails Q1 at a phone when no clean layout exists (a dense 800-unit grid of words)", async () => {
    const ops = [];
    // six 125-unit words 130 units apart: any shrink of the geometry makes them collide, so no clean layout exists
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) ops.push({ id: `w${r}${c}`, op: "text", at: [75 + c * 130, 90 + r * 110], text: "seventeen", size: "m", startMs: 0, endMs: 200 });
    const s = { v: 1, scriptId: "dense", line: { lessonId: "L-dense" }, anchor: "line_audio_start", board: { w: 800, h: 500, ground: "chalk" }, mode: "fresh", durationMs: 600, ops };
    const r = await judge.judge({ kind: "whiteboard", stage: { w: 800, h: 500 }, script: s }, { viewports: DESK_VIEWPORTS });
    assert.equal(r.piece.byViewport.l1366, true);
    assert.ok(r.views.find((v) => v.vp === "p360").verdict.fails.includes("Q1.legible"), JSON.stringify(r.piece));
  });
  it("a Studio v2 world in the tight phone tray becomes its board twin (legible), never the unusable game", async () => {
    const topic = JSON.parse(readFileSync(new URL("../data/studio-catalogue/topics/c4-maths-ch05-t01.json", import.meta.url), "utf8"));
    const art = { kind: "stagecraft", stage: { w: 1000, h: 625 }, stagecraft: { rung: "library", archetype: topic.game.archetype, spec: topic.game.spec,
      boardTwin: { board: { title: "Equal parts", lines: ["1 whole = 4 equal parts", "one part = 1/4"] } } } };
    const r = await judge.judge(art, { viewports: [TIGHT_PHONE], settleMs: 1500 });
    const legible = await judge.page.evaluate(() => document.querySelector('[data-testid="studio-stage"]')?.getAttribute("data-legible"));
    assert.equal(legible, "twin");
    assert.equal(r.views[0].metrics.kind, "whiteboard");
    assert.equal(r.views[0].verdict.pass, true, JSON.stringify(r.views[0].verdict.fails));
  });
});
