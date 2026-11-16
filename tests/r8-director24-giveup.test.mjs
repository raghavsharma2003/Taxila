// dc-r8-director24 H3 (main's 035): a give-up on a card gets the card's own hint — its authored ask.simpler, the give_up cell's first
// line — never its beat's simpler, a hint for the point (c5-t01 stuck 6; c4 steering 32 is the same row as director23).
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { setScriptForTest } from "../server/director/script.js";

describe("r8-director24-giveup", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; process.env.TAXILA_R7_SCRIPT = "on"; setScriptForTest(); });
  afterEach(() => { setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  test("c5-t01 stuck 6: 'pata nahi' on the e1 card says the card's own simpler, then the card", () => {
    const T = "c5-maths-ch02-t01", K = kitFromFile(getTopic(T));
    const sc = JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${T}.json`, import.meta.url), "utf8"));
    const e1 = sc.skills[0].explain[0];
    const cls = (o) => ({ outcome: o, confidence: 0.9, flags: {} });
    let r = step(initLessonState({ topicId: T, kit: K, ctx: { firstName: "Riya", lang: "hinglish", classLevel: 5, ageBand: "10-15", lessonKey: "g6" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 10 && !r.state.activeItemId; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "theek hai", now: (r.state.turn + 1) * 20_000 });
    assert.equal(r.state.activeItemId, `script:${sc.skills[0].skillId}:ask:${e1.id}`);
    const r2 = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: `${e1.point.hi} ${r.ui.ask.text}` }] }, { event: "turn", kit: K, cls: cls("no_evidence"), text: "pata nahi", now: (r.state.turn + 1) * 20_000 });
    assert.equal(r2.state.lastMove.cell?.column, "give_up");
    assert.equal(r2.state.lastMove.simpler, e1.ask.simpler.hi);
    assert.notEqual(r2.state.lastMove.simpler, e1.simpler.hi);
    assert.equal(r2.ui?.ask?.itemId, r.state.activeItemId);
  });
});
