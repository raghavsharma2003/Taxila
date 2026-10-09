// Play: voice as a game verb (src/play/core/voice.ts; DESIGN.md §5). A closed code grammar: short commands in Hinglish,
// Hindi and English become the same control presses a finger makes; anything else (a sentence, a feeling, "bas") is not
// an act and stays a plain turn. Pure.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseVoice, pressesFor, MAX_COMMAND_TOKENS } from "../src/play/core/voice.ts";

describe("play voice: the closed command grammar", () => {
  const cases = [
    ["teen se todo", { verb: "split", n: 3 }],
    ["do se todo", { verb: "split", n: 2 }],
    ["split by 7", { verb: "split", n: 7 }],
    ["teen mein kaat do", { verb: "cut", n: 3 }],
    ["cut into 4", { verb: "cut", n: 4 }],
    ["ho gaya", { verb: "done" }],
    ["हो गया", { verb: "done" }],
    ["phir se", { verb: "undo" }],
    ["yahan", { verb: "here" }],
    ["yahan please", { verb: "here" }],
    ["chalao", { verb: "run" }],
    ["bag kholo", null],                          // "bag" is not in the grammar: a turn, not a guess
    ["kholo", { verb: "open" }],
    ["B zyada", { verb: "choose", which: "B" }],
    ["A zyada", { verb: "choose", which: "A" }],
    ["barabar", { verb: "choose", which: "same" }],
    ["alag", { verb: "choose", which: "different" }],
    ["3/4", { verb: "fraction", n: 3, d: 4 }],
    ["3 by 4", { verb: "fraction", n: 3, d: 4 }],
    ["teen chauthai", { verb: "fraction", n: 3, d: 4 }],
    ["aadha", { verb: "fraction", n: 1, d: 2 }],
    ["do tihai", { verb: "fraction", n: 2, d: 3 }],
    ["12", { verb: "number", n: 12 }],
    ["baarah", { verb: "number", n: 12 }],
    ["upar", { verb: "up" }],
    ["neeche", { verb: "down" }],
    ["koi farak nahi", { verb: "none" }],
    ["pata nahi chal sakta", { verb: "canttell" }],
  ];
  for (const [text, want] of cases) it(`"${text}"`, () => assert.deepEqual(parseVoice(text), want));

  it("the lesson's own words are never game acts (stop check-in, help, feelings)", () => {
    for (const t of ["bas", "bas ho gaya", "stop", "ruko", "help", "madad karo", "mujhe dar lag raha hai", "dard ho raha hai", "nahi", "mat karo"]) assert.equal(parseVoice(t), null, t);
  });
  it("a sentence is not a command, however many grammar words it holds", () => {
    assert.equal(parseVoice("main soch rahi hoon ki teen se todna chahiye"), null);
    assert.equal(parseVoice(Array(MAX_COMMAND_TOKENS + 1).fill("yahan").join(" ")), null);
    assert.equal(parseVoice(""), null);
    assert.equal(parseVoice("   "), null);
    assert.equal(parseVoice("teen do"), null, "two numbers without a fraction word are ambiguous");
  });
});

describe("play voice: intents press the controls on screen", () => {
  const atoms = ["k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "k9", "k0", "kdel", "split", "undo", "done"].map((id) => ({ id }));
  it("a split types the divisor on the pad then splits", () => assert.deepEqual(pressesFor({ verb: "split", n: 12 }, atoms), ["k1", "k2", "split"]));
  it("a bare number is typed and sent with the screen's primary (split / name / go)", () => {
    assert.deepEqual(pressesFor({ verb: "number", n: 6 }, atoms), ["k6", "split"]);
    assert.deepEqual(pressesFor({ verb: "number", n: 6 }, [...atoms.filter((c) => c.id !== "split"), { id: "name" }]), ["k6", "name"]);
  });
  it("choices map to whichever family's choice is on screen", () => {
    assert.deepEqual(pressesFor({ verb: "choose", which: "B" }, [{ id: "predict-A" }, { id: "predict-same" }, { id: "predict-B" }]), ["predict-B"]);
    assert.deepEqual(pressesFor({ verb: "choose", which: "A" }, [{ id: "choose-0" }, { id: "choose-1" }]), ["choose-0"]);
    assert.deepEqual(pressesFor({ verb: "choose", which: "same" }, [{ id: "order-0" }, { id: "order-1" }, { id: "order-same" }]), ["order-same"]);
  });
  it("rounding up / down picks the higher / lower landmark", () => {
    const c = [{ id: "round-3000" }, { id: "round-4000" }, { id: "undo" }];
    assert.deepEqual(pressesFor({ verb: "up" }, c), ["round-4000"]);
    assert.deepEqual(pressesFor({ verb: "down" }, c), ["round-3000"]);
  });
  it("an intent with no control here does nothing (it stays a turn)", () => {
    assert.equal(pressesFor({ verb: "run" }, atoms), null);
    assert.equal(pressesFor({ verb: "here" }, [{ id: "commit", disabled: true }]), null);
  });
});
