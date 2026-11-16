// Round 7 F, for E App's "What helped?" (app-debrief-made-later): the child.reflect event, its idem key (first tap per
// lesson wins), the Conductor fold (a count, never a claim) and the lean it may give a later comparable choice.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../server/conductor/state.js";
import { recordingView } from "../server/conductor/view.js";
import { decide } from "../server/conductor/decide.js";
import { SOURCE_OF, idemKeyFor, validateEvent } from "../server/conductor/events.js";
import { helpedLean, parseChoice } from "../server/learner/reflect.js";

const CHILD = "11111111-2222-4333-8444-555555555555";
const live = (value) => ({ value, asOf: "x", src: "t", stale: false });
const view = () => recordingView({ "kt.dueCount": live(0), "usage.usedMin": live(0), "cal.days": live({}) });

test("choices: a made-for piece by id, or one of four words; anything else is refused at the route and at ingest", () => {
  assert.deepEqual(parseChoice("made:abc-123"), { kind: "made", id: "abc-123" });
  assert.deepEqual(parseChoice("board"), { kind: "board" });
  for (const bad of ["", "made:", "made:a b", "it was fun", "BOARD", null, 3]) assert.equal(parseChoice(bad), null, String(bad));
  assert.doesNotThrow(() => validateEvent({ type: "child.reflect", lessonId: "L1", choice: "made:abc-123" }));
  assert.throws(() => validateEvent({ type: "child.reflect", lessonId: "L1", choice: "the drawing helped a lot" }));
  assert.throws(() => validateEvent({ type: "child.reflect", lessonId: "L1", choice: "self", note: "x" }));
  assert.equal(idemKeyFor({ type: "child.reflect", lessonId: "L1", choice: "self" }), idemKeyFor({ type: "child.reflect", lessonId: "L1", choice: "board" }));
  assert.equal(SOURCE_OF("child.reflect"), "device");
});

test("the fold counts kinds and keeps the last five lessons, without made-for ids", () => {
  const now = new Date("2026-11-05T10:00:00+05:30");
  let s = initialState({ childId: CHILD, classLevel: 7, now, consent: { core_tutoring: true } });
  const taps = [["L1", "made:p1"], ["L2", "board"], ["L3", "made:p2"], ["L4", "unsure"], ["L5", "self"], ["L6", "made:p3"]];
  for (const [lessonId, choice] of taps) s = decide(s, { type: "child.reflect", lessonId, choice }, { now, view: view() }).state;
  assert.deepEqual(s.adapt.helped.n, { made: 3, board: 1, unsure: 1, self: 1 });
  assert.deepEqual(s.adapt.helped.recent.map((r) => r.lessonId), ["L2", "L3", "L4", "L5", "L6"]);
  assert.ok(!JSON.stringify(s.adapt.helped).includes("p1"));
  assert.equal(helpedLean(s.adapt.helped), "made");
});

test("the lean needs two of the same (not 'unsure') and no tie", () => {
  const h = (...kinds) => ({ recent: kinds.map((kind, i) => ({ lessonId: `L${i}`, kind })) });
  assert.equal(helpedLean(h("board")), null);
  assert.equal(helpedLean(h("unsure", "unsure", "unsure")), null);
  assert.equal(helpedLean(h("board", "self", "board", "self")), null);
  assert.equal(helpedLean(h("board", "self", "board")), "board");
  assert.equal(helpedLean(undefined), null);
});
