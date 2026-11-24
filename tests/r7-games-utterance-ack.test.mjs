// r7 Games, studio-game-utterance-double-turn: talking to a game is a game act, never an answer to the hidden card.
// The mounted play stage registers a synchronous sink (src/play/core/voiceSink.ts). The PLAY_HEARD listener writes the
// sink's ack into the event detail. The lesson runtime reads it right after dispatchEvent and sends TurnRequest.gameAct.
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setVoiceSink, probeVoice, gameActOf } from "../src/play/core/voiceSink.ts";
import { parseVoice, pressesFor } from "../src/play/core/voice.ts";
import { PLAY_HEARD } from "../src/play/core/box.ts";

// a stage's sink as PlayStage builds it: grammar → controls on screen → press at a turn point
function stageSink(controls, { atTurnPoint = true } = {}) {
  const presses = [];
  const sink = (text) => {
    const intent = parseVoice(text);
    const pr = intent ? pressesFor(intent, controls) : null;
    const took = !!pr && atTurnPoint;
    if (took) presses.push(...pr);
    return intent ? { verb: intent.verb, pressed: took, text } : null;
  };
  return { sink, presses };
}
const FRACTION_KEYS = ["k1", "k2", "k3", "k4", "kslash", "name"].map((id) => ({ id }));

describe("r7 games: the synchronous voice ack", () => {
  let off = () => {};
  beforeEach(() => off());

  it("no stage mounted: nothing is a game act", () => {
    assert.equal(probeVoice("1/3"), null);
  });

  it("'1/3' with a fraction pad on screen is pressed and acked", () => {
    const s = stageSink(FRACTION_KEYS);
    off = setVoiceSink(s.sink);
    assert.deepEqual(probeVoice("1/3"), { verb: "fraction", pressed: true, text: "1/3" });
    assert.deepEqual(s.presses, ["k1", "kslash", "k3", "name"]);
  });

  it("a command the stage cannot take now (finger mid-drag) is still a game act, unpressed", () => {
    const s = stageSink(FRACTION_KEYS, { atTurnPoint: false });
    off = setVoiceSink(s.sink);
    assert.deepEqual(probeVoice("1/3"), { verb: "fraction", pressed: false, text: "1/3" });
    assert.deepEqual(s.presses, []);
  });

  it("a sentence, a feeling or 'bas' is never a game act", () => {
    off = setVoiceSink(stageSink(FRACTION_KEYS).sink);
    for (const t of ["mujhe samajh nahi aaya ye kya hai", "bas", "mujhe dar lag raha hai", "  "]) assert.equal(probeVoice(t), null, t);
  });

  it("a throwing sink never breaks the lesson", () => {
    off = setVoiceSink(() => { throw new Error("boom"); });
    assert.equal(probeVoice("teen"), null);
  });

  it("an older stage's cleanup does not clear a newer stage's sink", () => {
    const offA = setVoiceSink(stageSink(FRACTION_KEYS).sink);
    off = setVoiceSink(() => ({ verb: "done", pressed: true, text: "ho gaya" }));
    offA();
    assert.equal(probeVoice("ho gaya")?.verb, "done");
  });

  it("the event round trip: the listener acks on the detail, the dispatcher reads it after dispatchEvent", () => {
    const s = stageSink([{ id: "done" }]);
    off = setVoiceSink(s.sink);
    const bus = new EventTarget();
    // PlayStudioRenderer's listener
    bus.addEventListener(PLAY_HEARD, (e) => { const d = e.detail; const act = probeVoice(d.text); if (act) d.gameAct = act; });
    // runtime.ts
    const detail = { text: "ho gaya" };
    bus.dispatchEvent(new CustomEvent(PLAY_HEARD, { detail }));
    assert.deepEqual(gameActOf(detail), { verb: "done", pressed: true, text: "ho gaya" });
    const plain = { text: "mujhe ek aur example chahiye" };
    bus.dispatchEvent(new CustomEvent(PLAY_HEARD, { detail: plain }));
    assert.equal(gameActOf(plain), null);
  });

  it("gameActOf ignores malformed details", () => {
    for (const d of [null, {}, { gameAct: 1 }, { gameAct: { verb: 3, pressed: true } }, { gameAct: { verb: "done" } }]) assert.equal(gameActOf(d), null);
  });
});
