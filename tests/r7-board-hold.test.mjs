// round 7 (C1 studio-board-timing): her first clause may wait for a board milliseconds away. The seam's planning ack
// says how long the wait is when a passing code board bounds it (etaMs); the client holds her FIRST sample by that much,
// never more than BOARD_HOLD_MAX_MS, and not at all when nothing bounds it or the board already rides the response.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import * as seam from "../server/studio/seam.js";
import { boardHoldMs, BOARD_HOLD_MAX_MS } from "../src/studio/boardHold.ts";

const C4 = "c4-maths-ch05-t01";
const kitOf = (id) => kitFromFile(getTopic(id));
const askFor = (id, line) => {
  const kit = kitOf(C4);
  return { intent: { intentId: id, lessonId: id.split(":wb:")[0], kind: "whiteboard", beat: "explain", need: "explain", style: { band: "B3" } },
    line: { lessonId: id.split(":wb:")[0], text: line }, mode: "fresh", kit: { topicId: C4, content: [kit.expectations[2]] } };
};
const GOOD = "Board par dekho: ek roti 4 equal parts mein kati hai. Ek part ko kya kehte hain?";
const NONE = "Kal hum mausam ke baare mein baat karenge.";   // nothing on a fractions board: no board comes

describe("boardHoldMs (the client's rule)", () => {
  it("holds for a planning board a few ms away, never past the cap, never for a drawn or unbounded board", () => {
    assert.equal(boardHoldMs({ slotId: "s", state: "planning", etaMs: 180 }), 180);
    assert.equal(boardHoldMs({ slotId: "s", state: "building", etaMs: BOARD_HOLD_MAX_MS }), BOARD_HOLD_MAX_MS);
    assert.equal(boardHoldMs({ slotId: "s", state: "planning", etaMs: BOARD_HOLD_MAX_MS + 1 }), 0, "too far: she speaks");
    assert.equal(boardHoldMs({ slotId: "s", state: "planning" }), 0, "nothing bounds the wait");
    assert.equal(boardHoldMs({ slotId: "s", state: "planning", etaMs: 0 }), 0);
    assert.equal(boardHoldMs({ slotId: "s", state: "revealed", etaMs: 100 }), 0);
    assert.equal(boardHoldMs({ slotId: "s", state: "planning", etaMs: 100, artifact: { kind: "whiteboard", script: /** @type {any} */ ({}) } }), 0);
    assert.equal(boardHoldMs(null), 0);
  });
});

describe("seam: the planning ack carries etaMs only when a passing code board bounds the wait", () => {
  let prevSync;
  before(() => {
    prevSync = process.env.TAXILA_BOARD_SYNC_MS;
    process.env.TAXILA_BOARD_SYNC_MS = "400";
    seam._setDeps({ planWhiteboard: async () => ({ ok: false, why: "planner_error", usd: 0 }), q: async () => [], writeEvidence: async () => ({ written: true }) });
  });
  after(() => { if (prevSync === undefined) delete process.env.TAXILA_BOARD_SYNC_MS; else process.env.TAXILA_BOARD_SYNC_MS = prevSync; });
  const open = (id) => seam.studioSeam.prefetch({ lessonId: id, purpose: "practice", kit: kitOf(C4), topicId: C4, child: { id: `child-${id}`, class_level: 4, language_pref: "hinglish" } });

  it("a line the kit's code board passes: planning, etaMs within the sync deadline, and the board lands by then", async () => {
    const id = "hold-1"; open(id);
    const ack = seam.studioSeam.requestIntent(askFor(`${id}:wb:3`, GOOD));
    assert.equal(ack.state, "planning");
    assert.ok(Number.isFinite(ack.etaMs) && ack.etaMs > 0 && ack.etaMs <= 400, `etaMs ${ack.etaMs}`);
    assert.equal(JSON.parse(JSON.stringify(ack)).etaMs, ack.etaMs, "on the wire");
    const t0 = Date.now();
    const shown = await ack.ready;
    assert.equal(shown?.state, "revealed");
    assert.ok(Date.now() - t0 <= ack.etaMs + 250, "landed by its eta");
  });

  it("a line no code board passes: no etaMs (she never waits on a board that may not come)", async () => {
    const id = "hold-2"; open(id);
    const ack = seam.studioSeam.requestIntent(askFor(`${id}:wb:3`, NONE));
    assert.equal(ack.etaMs, undefined);
    assert.equal(await ack.ready, null, "and indeed no board came");
  });
});
