// round 7 (C1 studio-board-timing): the board for the lesson's NEXT whiteboard ask is picked ahead (Brain's beat lookahead
// calls studioSeam.prewarmWhiteboard after the turn), so the next turn's preselect finds it ready. It is served only to the
// ask it was picked for (same signature), never as a page already shown, and her real line still re-gates it.
import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import * as BF from "../server/stagecraft/board-first.js";
import * as seam from "../server/studio/seam.js";

const C4 = "c4-maths-ch05-t01";
const kitOf = (id) => kitFromFile(getTopic(id));
const askFor = (id, { need = "explain", beat = "explain", itemIds } = {}) => {
  const kit = kitOf(C4);
  return { intent: { intentId: id, lessonId: id.split(":wb:")[0], kind: "whiteboard", beat, need, ...(itemIds ? { itemIds } : {}), style: { band: "B3" } },
    line: { lessonId: id.split(":wb:")[0], text: "" }, mode: "fresh", kit: { topicId: C4, content: [kit.expectations[2]] } };
};
const GOOD = "Board par dekho: ek roti 4 equal parts mein kati hai. Ek part ko kya kehte hain?";

describe("board-first lookahead (prewarm)", () => {
  beforeEach(() => BF._resetPrewarm());

  it("a board picked ahead is the next turn's pick, at once (the same pick, counted as a hit)", () => {
    const kit = kitOf(C4);
    const ask = askFor("pw-1:wb:5");
    const ahead = BF.prewarm(ask, { kit });
    assert.ok(ahead?.row, "picked ahead");
    assert.equal(BF.prewarm(ask, { kit }), null, "never twice for one ask");
    assert.equal(BF.preselect(ask, { kit }), ahead);
    assert.deepEqual(BF.prewarmStats(), { made: 1, hit: 1, used: 0, stale: 0 });
  });

  it("the next turn took another move: the pick ahead is dropped and a fresh one made for the real ask", () => {
    const kit = kitOf(C4);
    const ahead = BF.prewarm(askFor("pw-2:wb:5"), { kit });
    assert.ok(ahead);
    const real = askFor("pw-2:wb:5", { need: "contrast_misconception", beat: "contrast" });
    const p = BF.preselect(real, { kit });
    assert.notEqual(p, ahead);
    assert.equal(BF.prewarmStats().stale, 1);
    // and takePreselected never shows a board picked ahead for another ask
    BF.prewarm(askFor("pw-3:wb:5"), { kit });
    assert.equal(BF.takePreselected(askFor("pw-3:wb:5", { itemIds: ["other-item"] }), {}), null);
    assert.equal(BF.prewarmStats().stale, 2);
  });

  it("a page shown since it was picked ahead is never served again", () => {
    const kit = kitOf(C4);
    const ask = askFor("pw-4:wb:5");
    const ahead = BF.prewarm(ask, { kit });
    assert.ok(ahead);
    const p = BF.preselect(ask, { kit, avoid: ahead.script });
    assert.notEqual(p, ahead);
    assert.equal(BF.prewarmStats().hit, 0);
  });
});

describe("seam: prewarmWhiteboard (the lookahead's entry point)", () => {
  before(() => { seam._setDeps({ planWhiteboard: async () => ({ ok: false, usd: 0 }), q: async () => [], writeEvidence: async () => ({ written: true }) }); });
  beforeEach(() => BF._resetPrewarm());
  const open = (id) => seam.studioSeam.prefetch({ lessonId: id, purpose: "practice", kit: kitOf(C4), topicId: C4, child: { id: `child-${id}`, class_level: 4, language_pref: "hinglish" } });

  it("the next turn's board is ready before it asks, and her real line shows it as before", () => {
    const id = "pw-s1"; open(id);
    const next = askFor(`${id}:wb:6`);
    assert.equal(seam.studioSeam.prewarmWhiteboard(next), true);
    assert.ok(BF.isBoardFirstRow(seam.studioSeam.preselectWhiteboard(next)));
    assert.equal(BF.prewarmStats().hit, 1);
    const ack = seam.studioSeam.requestIntent({ ...next, line: { ...next.line, text: GOOD } });
    assert.equal(ack.state, "revealed");
    assert.equal(BF.prewarmStats().used, 1);
    assert.ok(seam.wbTimingStats().boardFirst.prewarm, "counted on GET /api/studio/timing");
  });

  it("nothing is picked ahead in a safeguarded lesson, for a continued board, or without a lesson", () => {
    const id = "pw-s2"; open(id);
    seam.studioSeam.onSafety(id);
    assert.equal(seam.studioSeam.prewarmWhiteboard(askFor(`${id}:wb:6`)), false);
    const id3 = "pw-s3"; open(id3);
    assert.equal(seam.studioSeam.prewarmWhiteboard({ ...askFor(`${id3}:wb:6`), mode: "continue" }), false);
    assert.equal(seam.studioSeam.prewarmWhiteboard(askFor("no-such-lesson:wb:2")), false);
    assert.equal(BF.prewarmStats().made, 0);
  });
});
