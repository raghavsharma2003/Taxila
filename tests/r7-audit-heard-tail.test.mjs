// r7 audit TEACHER-02: the labeller and the understand note read the END of her last line (her question is its last
// sentence); a long line used to be cut to its first 500 / 400 characters, dropping the question.
import { test } from "node:test";
import assert from "node:assert/strict";
import { heardTail } from "../server/director/classify.js";

test("a long teacher line keeps its last question", () => {
  const line = `${"Dekho, yeh ek lambi baat hai jismein bahut saare shabd hain. ".repeat(12)}Toh batao, kitne equal groups bane?`;
  assert.ok(line.length > 500);
  const t = heardTail(line);
  assert.ok(t.length <= 500, `length ${t.length}`);
  assert.match(t, /kitne equal groups bane\?$/);
});

test("a short line is unchanged (spaces folded)", () => {
  assert.equal(heardTail("Kitne  groups hain?"), "Kitne groups hain?");
  assert.equal(heardTail(null), "");
});
