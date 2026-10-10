// Round 4 · stream 2 (content), items 3 and 6: a board slot never ends empty while her line points at the screen, when her
// line itself says what is there. The claims board (server/stagecraft/claims-board.js) draws exactly her screen claims and
// is gated against her line like every other board. Lines verbatim from the owner-5 baseline (local production build,
// 2026-10-10), where these slots failed. No browser, no model.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { codeBoard, gateCtxFor } from "../server/stagecraft/board-sync.js";
import { claimsCalls, shadedIn } from "../server/stagecraft/claims-board.js";
import { claimsNotDrawn } from "../server/studio/qa/semantics.js";
import { certifyForTray } from "../server/forge3/tray-gate.js";

const ask = (text) => ({ intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: null, mode: "fresh" });
const board = (text) => { const a = ask(text); return codeBoard(a, { lessonId: "L" }, gateCtxFor(a, {})); };

describe("r4 content: the claims board", () => {
  it("reads parts, shaded counts and groups from her line; nothing from a line that claims nothing", () => {
    assert.deepEqual(claimsCalls("Screen par 5 barabar parts dekhiye; 3 shaded hain."), [{ template: "fraction-parts@1", parts: 5, shade: 3, whole: "circle" }]);
    assert.equal(shadedIn("4 mein se 3 rangeen hain", 4), 3);
    assert.equal(claimsCalls("Look at the screen: 15 dots in 3 equal groups, with 5 dots in each. How many dots are in one group?")[0].each, 5);
    assert.deepEqual(claimsCalls("Achha, aage badhte hain."), []);
    assert.deepEqual(claimsCalls("Agar 4 hisse hon, toh?"), [], "a supposing clause claims nothing about the screen");
  });
  for (const line of [
    "Screen par 5 barabar parts dekhiye; 3 shaded hain. Agar har part ko 2 tukdon mein baantein, shaded tukde kitne honge?",
    "Meher, look at the screen: 15 dots in 3 equal groups, with 5 dots in each. How many dots are in one group?",
    "Board par dekho: 3 groups, har group mein 4 laddoo. Kitne laddoo hain?",
  ]) it(`a board that draws her claims passes the gate and is legible at 360: "${line.slice(0, 48)}…"`, () => {
    const r = board(line);
    assert.ok(r?.ok, "a board is drawn");
    assert.deepEqual(claimsNotDrawn(line, r.script.ops), []);
    assert.ok(certifyForTray({ kind: "whiteboard", script: r.script }, { vp: "p360" }).ok);
    // a question in her line is never answered on the board (W9 inside the gate; the result is "?")
    if (/kitne|how many/i.test(line)) assert.ok(!r.script.ops.some((o) => o.op === "numwork" && JSON.stringify(o.rows).includes('"12"')), "no total drawn for a question");
  });
});
