// r7 (Games → Brain patch): TurnRequest.gameAct. A command the play piece took is the game's act: no evidence for the card,
// on both lanes (the rewrite now happens before the agent lane computes its verdict). Safety is never touched.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asPlayAct, gameActOf } from "../server/brain/turn.js";

const CORRECT = { outcome: "correct", confidence: 0.95, source: "code", flags: {} };
const base = { state: { playOn: false }, childText: "1/3", chipId: undefined, moduleOnly: false };

describe("r7 brain: gameAct is never a card answer", () => {
  it("an acked game act becomes play_act / no_evidence even when the server thinks no piece is up", () => {
    const c = asPlayAct(CORRECT, { ...base, gameAct: { consumed: true, game: "todo-jodo/strips", act: "fraction" } });
    assert.equal(c.outcome, "no_evidence");
    assert.equal(c.source, "play_act");
    assert.equal(c.request.type, "play_act");
  });
  it("older clients: a piece up plus the grammar still counts", () => {
    assert.equal(asPlayAct(CORRECT, { ...base, state: { playOn: true }, gameAct: null }).source, "play_act");
  });
  it("no ack and no piece: an ordinary answer", () => {
    assert.equal(asPlayAct(CORRECT, { ...base, gameAct: null }), CORRECT);
  });
  it("distress, help, a request, a chip, a module or predicate verdict are never rewritten", () => {
    const act = { consumed: true, act: "number" };
    for (const cls of [{ ...CORRECT, flags: { distress: true } }, { ...CORRECT, help: "hint" }, { ...CORRECT, request: { type: "slower" } },
      { ...CORRECT, source: "module" }, { ...CORRECT, source: "predicate" }]) assert.equal(asPlayAct(cls, { ...base, gameAct: act }), cls);
    assert.equal(asPlayAct(CORRECT, { ...base, chipId: "c1", gameAct: act }), CORRECT);
    assert.equal(asPlayAct(CORRECT, { ...base, moduleOnly: true, gameAct: act }), CORRECT);
  });
  it("gameActOf validates the request body", () => {
    assert.deepEqual(gameActOf({ gameAct: { consumed: true, game: "kon/zone", act: "done:held" } }), { consumed: true, game: "kon/zone", act: "done:held" });
    for (const b of [{}, { gameAct: "x" }, { gameAct: { consumed: false, act: "done" } }, { gameAct: { act: "done" } }, null]) assert.equal(gameActOf(b), null);
  });
});
