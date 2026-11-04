// round 7 (C1 studio-whiteboard-motion-ops): the board can MOVE what it drew. A `move` op slides an earlier op by `by`
// (board units) over [startMs, endMs], optionally hopping `arc` high (a number-line jump); a fraction split is its parts
// moving apart. The final box stays on the board, reduced motion lands it at once, and the W gates judge the board as it
// ENDS too (W19.settled).
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeScript, moveShift, settledScript, opGeometry } from "../shared/whiteboard.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";

const base = (ops) => ({ v: 1, scriptId: "s", line: { lessonId: "L" }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs: 2200, ops });
const halves = [
  { id: "a", op: "sector", c: [200, 150], r: 80, fromDeg: 0, toDeg: 180, fill: "accent", startMs: 0, endMs: 600 },
  { id: "b", op: "sector", c: [200, 150], r: 80, fromDeg: 180, toDeg: 360, fill: "good", startMs: 0, endMs: 600 },
  { id: "t", op: "text", at: [200, 270], text: "1/2 + 1/2", size: "m", startMs: 700, endMs: 1000 },
];
const LINE = "Ek roti ko do barabar hisson mein todo: 1/2 aur 1/2.";

test("a move is a valid op: it targets an earlier op, its shift keeps the target on the board, and it draws nothing itself", () => {
  const r = normalizeScript(base([...halves, { id: "m", op: "move", target: "a", by: [30, 0], startMs: 1100, endMs: 1800 }]), { strict: true });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(opGeometry(r.script.ops.find((o) => o.id === "m")).paths, []);
  // off the board: clamped (strict refuses it)
  assert.equal(normalizeScript(base([...halves, { id: "m", op: "move", target: "a", by: [300, 0], startMs: 1100, endMs: 1800 }]), { strict: true }).ok, false);
  // a target that is not drawn earlier in this script: refused
  assert.equal(normalizeScript(base([...halves, { id: "m", op: "move", target: "zz", by: [30, 0], startMs: 1100, endMs: 1800 }]), { strict: true }).ok, false);
});

test("the shift eases in, the arc hops and lands, reduced motion lands at once", () => {
  const ops = normalizeScript(base([halves[0], { id: "j", op: "move", target: "a", by: [120, 0], arc: 50, startMs: 1000, endMs: 2000 }])).script.ops;
  assert.deepEqual(moveShift(ops, "a", 900), [0, 0], "before it starts");
  const [mx, my] = moveShift(ops, "a", 1500);
  assert.equal(mx, 60); assert.ok(my <= -49, "mid-jump it is up in the air");
  assert.deepEqual(moveShift(ops, "a", 2100), [120, 0], "landed");
  assert.deepEqual(moveShift(ops, "a", 1100, true), [120, 0], "reduced motion: at its end as soon as it starts");
  assert.deepEqual(settledScript({ ops }).ops.map((o) => o.c), [[320, 150]]);
});

test("the gate: a fraction split passes, and a board is judged where it ends (W19.settled)", () => {
  const split = gateWhiteboard(base([...halves, { id: "ma", op: "move", target: "a", by: [30, 0], startMs: 1100, endMs: 1800 }, { id: "mb", op: "move", target: "b", by: [-30, 0], startMs: 1100, endMs: 1800 }]), { reply: LINE, speechMs: 3000 });
  assert.equal(split.pass, true, JSON.stringify(split.checks.filter((c) => !c.pass)));
  assert.equal(split.checks.find((c) => c.id === "W19.settled")?.pass, true);
  // the same words slid out from under their part onto the other half's place: judged where they land
  const still = gateWhiteboard(base(halves), { reply: LINE, speechMs: 3000 });
  assert.equal(still.checks.some((c) => c.id === "W19.settled"), false, "a still board has no settled check");
});

test("withSplit: a whole cut into equal sectors splits outward after it is drawn; a whole with a word inside stays still", async () => {
  const { withSplit } = await import("../server/stagecraft/board-sync.js");
  const s = withSplit(base(halves));
  const moves = s.ops.filter((o) => o.op === "move");
  assert.deepEqual(moves.map((m) => m.target), ["a", "b"]);
  assert.ok(moves[0].by[0] > 0 && moves[1].by[0] < 0, "each half slides away from the other");
  assert.ok(moves.every((m) => m.startMs >= 600), "after the parts are drawn");
  assert.ok(s.durationMs >= Math.max(...moves.map((m) => m.endMs)));
  assert.equal(normalizeScript(s, { strict: true }).ok, true);
  const worded = base([...halves.slice(0, 2), { id: "w", op: "text", at: [200, 140], text: "1/2", size: "m", startMs: 700, endMs: 900 }]);
  assert.equal(withSplit(worded), worded);
  assert.equal(withSplit(s), s, "never twice");
});

test("the day-4 board that moves: the fraction-parts board for 'fractions' is preselected SPLITTING (its answer masked as before)", async () => {
  const { initLessonState, step } = await import("../server/director/state.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const cur = await import("../server/content/curriculum.js");
  const { CTX, cls } = await import("./fixtures/kit.mjs");
  const { whiteboardIntentOf } = await import("../server/brain/propose.js");
  const bf = await import("../server/stagecraft/board-first.js");
  const kit = kitFromFile(cur.getTopic("c5-maths-ch02-t02"));
  let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  for (let i = 0; i < 4 && !["explain", "worked_example", "reteach"].includes(r.move.kind); i++) r = step(r.state, { event: "turn", kit, cls: cls("no_evidence"), text: "haan", now: 20000 * (i + 1) });
  const ask = whiteboardIntentOf({ lessonId: "r7-split", turn: r.state.turn, beat: { id: "b", type: "explain" }, next: r.state, kit, item: null, line: { text: "" } });
  const p = bf.preselect(ask, { kit });
  assert.ok(p, "a board is preselected");
  assert.ok(p.script.ops.filter((o) => o.op === "move").length >= 2, "and it moves");
});
