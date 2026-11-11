// r7 stream E (main 2026-11-08, App 3b): Brain's `ofCard` (shared/contracts.ts BoardSegment, tests/r7-brain-v62.test.mjs
// T46) must reach the client's script so the question card can wait while the board is not its own. Until Studio applies
// to-studio/002 (applied) the flag was stripped by normalizeScript: this test checks the change is in the tree and
// runs the whole chain on Brain's exact intent shape.
import { test } from "node:test";
import assert from "node:assert/strict";

const { normalizeScript } = await import("../shared/whiteboard.js");
const { boardOnTray } = await import("../src/child/lesson/boardPage.ts");
const C = await import("../src/child/lesson/cardTiming.ts");

// Brain's T46 shape: a worked close on its own board (not the card's), then the new card on the card's board, last
const ref = (shape) => ({ template: "measured@1", params: { shape, unit: "cm", w: 6, h: 4 } });
const intent = { boardRef: ref("triangle"), scriptBeat: { kind: "explain" }, ofCard: false,
  segments: [{ atChar: 40, atClause: 2, boardRef: ref("rect"), scriptBeat: { kind: "check" }, ofCard: true }] };
const line = "Haan, sahi hai: teeno bhujayein jodi. Ab is aayat ka parimap batao, kitna hoga?";
const raw = { v: 1, scriptId: "t46:pg", line: { lessonId: "L", teacherReplySeq: 46 }, board: { w: 400, h: 300 }, durationMs: 9000, ofCard: intent.ofCard,
  ops: [{ id: "a.s", op: "rect", at: [20, 20], w: 80, h: 60, startMs: 0, endMs: 600 }, { id: "b.s", op: "rect", at: [200, 20], w: 120, h: 80, startMs: 3400, endMs: 4200 }],
  switches: [{ clause: 2, atMs: 3400, ofCard: intent.segments[0].ofCard }] };

const keeps = (() => { const n = normalizeScript(raw, { strict: false }); return typeof n.script?.ofCard === "boolean" && typeof n.script?.switches?.[0]?.ofCard === "boolean"; })();

test("Studio's ofCard change is in the tree: normalizeScript keeps ofCard on the script and on a switch", () => {
  assert.ok(keeps, "normalizeScript strips ofCard (to-studio/002 is not in the tree)");
});

test("the App reader on the script the patch produces: page 0 the close (not the card's), page 1 the card's own board", () => {
  const script = keeps ? normalizeScript(raw, { strict: false }).script : raw;
  const b = boardOnTray({ artifact: { kind: "whiteboard", script } });
  assert.deepEqual([0, 1].map((p) => C.pageOfCard(b, p)), [false, true]);
  // the open card waits on the close's page and is itself again on the last page
  const wait = (p) => C.cardWaiting({ hasAsk: true, hasAnswer: false, ofCard: C.pageOfCard(b, p), handedOver: false });
  assert.deepEqual([wait(0), wait(1)], [true, false]);
});

test("once applied: Brain's intent → segmentsOf pages → the script's flags (absent stays absent)", { skip: keeps ? false : "to-studio/002 not applied yet" }, async () => {
  const { segmentsOf } = await import("../server/stagecraft/board-first.js");
  const pages = segmentsOf({ intent, line: { text: line } });
  assert.deepEqual(pages.map((g) => g.ofCard), [false, true]);
  const none = segmentsOf({ intent: { ...intent, ofCard: undefined, segments: [{ ...intent.segments[0], ofCard: undefined }] }, line: { text: line } });
  assert.deepEqual(none.map((g) => "ofCard" in g), [false, false]);
  const n = normalizeScript({ ...raw, ofCard: undefined, switches: [{ clause: 2, atMs: 3400 }] }, { strict: false });
  assert.equal("ofCard" in n.script, false);
  assert.equal("ofCard" in n.script.switches[0], false);
});
