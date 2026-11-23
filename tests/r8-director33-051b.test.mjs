// to-brain 051 C4 to C6 (docs/patches/to-brain/051-director33-screen-stays-answer-boards-named-miss-cap.md, dc-r8-director33), Brain B's half:
// each new predicate pinned on the director33 rows the order lists (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director33;
// rows are 0-based indexes into a lesson's `director`), replayed with that run's own script snapshot, and each rule pinned on the walk.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PENDING, PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { atQuestionOf, runOfTwo, endsOnShortAsk } from "../server/director/question-run.js";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director33");
const TOPIC = { c4: "c4-maths-ch05-t01", c5t01: "c5-maths-ch02-t01", c5t02: "c5-maths-ch02-t02", c5t03: "c5-maths-ch02-t03", c6: "c6-maths-ch06-t01",
  c4ch01: "c4-maths-ch01-t02", c6ch07: "c6-maths-ch07-t01", c4ch06: "c4-maths-ch06-t01", c6ch07t03: "c6-maths-ch07-t03" };
const cache = new Map();
const lesson = (persona, t) => {
  const k = `${persona}|${t}`;
  if (!cache.has(k)) {
    const j = JSON.parse(readFileSync(join(RUN, `${persona}-${TOPIC[t].replace(/^c(\d)-maths-/, "c$1-")}.json`), "utf8"));
    cache.set(k, { rows: j.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${TOPIC[t]}.json`), "utf8")) });
  }
  return cache.get(k);
};
const flagged = (persona, t, name) => new Set(lessonFlags(lesson(persona, t)).filter((f) => f.predicate === name).map((f) => f.row));
const reads = (name, want) => {
  const miss = want.filter(([p, t, n]) => !flagged(p, t, name).has(n)).map((x) => x.join(" "));
  assert.deepEqual(miss, []);
};

describe("C4: the cap counts what the child hears", () => {
  test("the new predicates are gated", () => {
    for (const k of ["questionThreeRunning", "yourTurnNotThird", "inviteAfterPark", "inviteNoHelp", "shortAskNoAnswer", "hindiNoFormNoLine"]) {
      assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k);
    }
  });
  test("questionThreeRunning, widened, reads the rows of C4's Heard", () => {
    reads("questionThreeRunning", [
      // (the short ask)
      ["stuck", "c6", 66], ["steady", "c4ch01", 8], ["offtopic", "c5t01", 28], ["stuck", "c5t01", 38], ["stuck", "c5t01", 50], ["offtopic", "c5t03", 28],
      // (the Hindi form)
      ["offtopic", "c4", 34], ["steering", "c4", 10], ["stuck", "c5t03", 8], ["stuck", "c4ch06", 8],
      // (a picture turn; an aside reply back to a card that asks by an imperative)
      ["stuck", "c4", 18], ["stuck", "c4ch06", 18], ["stuck", "c5t02", 48],
      // (plain misses, with a request to hear the question among them)
      ["offtopic", "c4ch06", 44], ["stuck", "c4ch06", 42], ["stuck", "c6ch07t03", 74]]);
  });
  test("inviteAfterPark reads c5-t02 offtopic 18, c6 offtopic 18, c4-ch01 offtopic 14", () => {
    reads("inviteAfterPark", [["offtopic", "c5t02", 18], ["offtopic", "c6", 18], ["offtopic", "c4ch01", 14]]);
  });
  test("inviteNoHelp reads c4-ch01 steady 30", () => reads("inviteNoHelp", [["steady", "c4ch01", 30]]));
  test("shortAskNoAnswer reads c5-t01 offtopic 24", () => reads("shortAskNoAnswer", [["offtopic", "c5t01", 24]]));

  test("a turn is at a question by its imperative last sentence, a short ask, a Hindi form; an invitation is at none", () => {
    const { script } = lesson("stuck", "c5t02");
    const t = lesson("stuck", "c5t02").rows[44].text;
    assert.ok(atQuestionOf(script, t), "an aside reply back to a card that asks by an imperative");
    assert.equal(atQuestionOf(script, "Kuch bhi. Ab phir se socho, jawab kya hoga?"), "?short");
    assert.ok(endsOnShortAsk(script, "Toh ab batao, kya aayega?"));
    assert.equal(atQuestionOf(script, "Haan. Ab tum batao."), null);
    const p = atQuestionOf(script, t);
    assert.equal(runOfTwo(script, [t, "Socho. Ab phir se socho, jawab kya hoga?"], p), p);
    assert.equal(runOfTwo(script, [t, "Socho. Ab phir se socho, jawab kya hoga?"], "elsewhere"), null);
  });
});

describe("C6: the return, the wrap, the record, the harness", () => {
  test("returnAsksAgain, widened, reads c5-t01 steady 40, c5-t03 steering 50, c6-ch07-t01 offtopic 68", () => {
    reads("returnAsksAgain", [["steady", "c5t01", 40], ["steering", "c5t03", 50], ["offtopic", "c6ch07", 68]]);
    assert.ok(!PENDING.has("returnAsksAgain"));
  });
  test("the return in code's told forms does not ask when after an aside that said when", async () => {
    const { returnQuestion } = await import("../server/brain/say.js");
    for (const n of [0, 1, 2, 3]) {
      const q = returnQuestion("cricket", "hinglish", { turn: 9, later: [], recent: [], jointN: { asideReturn: n } }, { said: "kal maine cricket khela, sixer maara" });
      assert.ok(!/kab ki baat/i.test(q), q);
    }
  });
  test("the return does not ask what they like in it after they answered her question what they like best", async () => {
    const { returnQuestion } = await import("../server/brain/say.js");
    const q = returnQuestion("cricket", "hinglish", { turn: 30, tasteAsked: { topic: "virat", turn: 12, n: 1 }, later: [], recent: [] }, { said: "kal maine cricket khela, sixer maara" });
    assert.ok(!/pasand|achha lag/i.test(q), q);
  });
  test("falseKeys: a share named with its group is a true share (c6-ch07-t01 steady 82)", async () => {
    const { falseAnswerNumbers } = await import("../evals/hybrid-side-by-side/checks.mjs");
    assert.deepEqual(falseAnswerNumbers("Haan, sahi hai: yaani 2 hisse: 3 mein 2/3, 5 mein 2/5, 4 mein 2/4.", { keys: new Set(["2/3"]) }), []);
    assert.deepEqual(falseAnswerNumbers("Toh jawab 2/5 hai.", { keys: new Set(["2/3"]) }), ["2/5"]);
  });
  test("pictureMismatch knows the scale view (c6-ch07-t01 steering 16)", async () => {
    const { pictureMismatch } = await import("../evals/hybrid-side-by-side/checks.mjs");
    const r = lesson("steering", "c6ch07").rows[16];
    assert.deepEqual(pictureMismatch(r.text, r.screen.boardRef, r.screen.altView), []);
  });
  test("the scripted child's hedge \"pata nahi, shayad wahi\" is a give-up", async () => {
    const { intentOf } = await import("../evals/child-sim/reactive.mjs");
    assert.equal(intentOf({ kind: "wrong", text: "pata nahi, shayad wahi" }), "give_up");
    assert.equal(intentOf({ kind: "wrong", text: "3/4" }), "miss");
  });
});
