// C1 compile step 2, shadow mode: each turn is compared with its compiled cell (part, column, help); nothing in the walk reads it yet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shadowLesson, columnOf, partOf } from "../evals/hybrid-side-by-side/shadow-compile.mjs";

const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c4-maths-ch05-t01.json", import.meta.url), "utf8"));
const e1 = script.skills[0].explain[0];

test("shadow: the column and the part a turn read", () => {
  assert.equal(columnOf({ text: "samajh nahi aaya", read: "no_evidence · another" }), "clarify");
  assert.equal(columnOf({ text: "pata nahi, aap batao", read: "no_evidence" }), "give_up");
  assert.equal(columnOf({ text: "Hindi mein bolo", read: "no_evidence · language" }), "hindi");
  assert.equal(columnOf({ text: "2/3", read: "correct" }), "right");
  const checkin = { who: "teacher", text: `${e1.point.hi} Yeh hissa saaf hua?`, beat: "s1:explain:e1", card: null };
  assert.deepEqual(partOf(checkin, script), { id: "c4-maths-ch05-t01-s1:e1:checkin", kind: "checkin" });
  const key = { who: "teacher", text: "Is sawaal ka sahi jawab: nahi, kyunki x. Yahan tak theek hai?", beat: "s1:explain:e1", card: null };
  assert.equal(partOf(key, script).spent, true, "a key's turn is the card, its help spent");
});

test("shadow: a clarify at a point's check-in equals its cell when the simpler is said, and differs when it is not", () => {
  const rows = (reply) => [
    { who: "teacher", text: "Namaste.", move: "greet" }, { who: "child", text: "haan", read: "no_evidence" },
    { who: "teacher", text: `${e1.point.hi} Yeh hissa saaf hua?`, beat: "s1:explain:e1", card: null },
    { who: "child", text: "samajh nahi aaya", read: "no_evidence · another" },
    { who: "teacher", text: reply, beat: "s1:explain:e1" },
  ];
  const [a] = shadowLesson({ rows: rows(`${e1.simpler.hi} Yahan tak theek hai?`), script });
  assert.equal(a.address, "c4-maths-ch05-t01-s1:e1:checkin/clarify/fresh");
  assert.equal(a.verdict, "equal");
  const [b] = shadowLesson({ rows: rows(`${e1.ask.prompt.hi}`), script });
  assert.equal(b.verdict, "differ");
});
