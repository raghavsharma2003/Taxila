// The whiteboard's line anchor (src/modules/whiteboard/clock.ts; W2-F fixer 2026-10-05, w2f-late-script-fast-forward):
// a script that reaches the board after her line started is drawn on HER clock (the anchor that fired for exactly that
// teacher reply, at any age), so what she already said appears at once and the rest follows her voice; a loose match
// (no reply seq) still needs to be recent, and with no anchor at all the board starts on its own after the grace.
import test from "node:test";
import assert from "node:assert/strict";
import { markLineAudioStart, awaitLineAnchor } from "../src/modules/whiteboard/clock.ts";

test("a late script uses the exact anchor of its line however old, and reports how late it was", () => {
  const t0 = performance.now();
  markLineAudioStart({ lessonId: "L1", teacherReplySeq: 7 }, t0 - 4000);
  let got = null;
  awaitLineAnchor({ lessonId: "L1", teacherReplySeq: 7 }, (at, timing) => { got = { at, timing }; }, { since: t0 });
  assert.ok(got, "fired at once");
  assert.equal(got.at, t0 - 4000);
  assert.equal(got.timing.source, "exact");
  assert.equal(got.timing.lateMs, 4000);
});

test("another reply's anchor, or a loose stale one, is not taken; the grace starts the board on its own clock", async () => {
  const t0 = performance.now();
  markLineAudioStart({ lessonId: "L2", teacherReplySeq: 3 }, t0 - 4000);
  let got = null;
  const cancel = awaitLineAnchor({ lessonId: "L2", teacherReplySeq: 4 }, (at, timing) => { got = { at, timing }; }, { since: t0, graceMs: 30 });
  assert.equal(got, null, "seq 3 is not seq 4's line");
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(got?.timing.source, "grace");
  cancel();
  let loose = null;
  awaitLineAnchor({ lessonId: "L2" }, (at, timing) => { loose = timing; }, { since: t0, graceMs: 10_000 })();
  assert.equal(loose, null, "a 4 s old anchor without a seq to match is too old");
});
