// Adversarial review of the ship5 integration (2026-10-06): a whiteboard the gate REFUSED against her line is drawn
// anyway. server/stagecraft/board-sync.js plan() step 3 gates the caller's template rung against her real line
// (templateBoard → regate, W0-W9) and, when it fails, falls through to "nothing on time" (source "none"); server/studio/
// seam.js requestIntent then calls showFallbackOrFail(), which draws that same `fallbackScript` (only re-timed, never
// gated). In the local battery 2026-10-06 the server logged "whiteboard not drawn <W-check> (template board shown)" 52
// times (W4 ×36, W9.no_reveal ×9, W8.counts_match_line ×2, ...), and w2f caught one on the client: "dot x15" drawn for a
// line that says 3. Here: her line says three boxes, the template draws five; the gate refuses it, the child sees it.
import { test } from "node:test";
import assert from "node:assert/strict";
process.env.TAXILA_BOARD_SYNC_MS = "300";
const seam = await import("../server/studio/seam.js");
const { templateBoard, gateCtxFor } = await import("../server/stagecraft/board-sync.js");
const { studioSeam, _setDeps } = seam;

test("ship5 review: a template board that fails the gate against her line is never drawn", async () => {
  const id = "rv-wb-1";
  studioSeam.prefetch({ lessonId: id, purpose: "practice" });
  _setDeps({ planWhiteboard: async () => ({ ok: false, usd: 0, why: "planner_error" }), q: async () => [] });
  const five = { v: 1, scriptId: "t", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 640, h: 400, ground: "chalk" }, mode: "fresh", durationMs: 3000,
    ops: [0, 1, 2, 3, 4].map((i) => ({ id: `r${i}`, op: "rect", at: [20 + i * 120, 160], w: 100, h: 60, startMs: 200 + i * 400, endMs: 500 + i * 400 })) };
  const line = "Dekho, teen boxes ek line mein. Teen boxes hain.";
  const intent = { intentId: `${id}:wb:5`, lessonId: id, kind: "whiteboard", skillId: "s", need: "explain", beat: "explain", neededAtMs: 0, priority: "on_cue", style: { band: "B3", lang: "hinglish", motion: "lively" } };
  const ask = { intent, line: { lessonId: id, text: line }, mode: "fresh", kit: { topicId: "x", content: [] }, fallback: { script: five } };
  // the board-sync gate's own verdict on this template against her line
  const gated = templateBoard(ask, five, gateCtxFor(ask, {}));
  assert.equal(gated, null, "precondition: the gate refuses five boxes for a line that says three");
  const ack = studioSeam.requestIntent(ask);
  assert.equal(ack?.state, "planning");
  await new Promise((r) => setTimeout(r, 1200));
  const s = seam.slotSnapshot(id, intent.intentId);
  assert.notEqual(s?.artifact?.kind, "whiteboard",
    `the refused template reached the child as a board (${s?.artifact?.script?.ops?.length ?? "?"} shapes for a line that says three)`);
});
