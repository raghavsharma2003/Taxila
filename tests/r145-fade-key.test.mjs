// census 14.5 (sim lab p55 t5: "5" to the faded step "7 − 2 = ___" earned no evidence). A faded line that ends at its gap,
// on a step that goes on after the answer ("Write it: 7 − 2 = 5. 5 kites are still flying."), keyed the whole rest
// ("5. 5 kites are still flying"), so a bare right number missed the code grader. A number then a sentence is the number;
// a key that is then already in view (the steps before show it) is no gap at all, so that kit keeps the whole worked example.
import { test } from "node:test";
import assert from "node:assert/strict";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { blankOf, fadeItem } from "../server/director/fading.js";
import { classifyFast, targetFor } from "../server/director/classify.js";

const kitOf = (id) => kitFromFile(getTopic(id));
test("a number then a sentence after the gap: the number is the key", () => {
  assert.equal(blankOf("Write it: 7 − 2 = 5. 5 kites are still flying.", "Write it: 7 − 2 = ___."), "5");
  // an abbreviation key is no number: left as it was
  assert.equal(blankOf("Point it down, e.g. 'the door faces east'.", "Point it ___."), "down, e.g. 'the door faces east'");
});
test("the kits' faded steps grade a bare right number in code", () => {
  for (const [id, key] of [["c1-maths-ch06-t02", "3"], ["c5-maths-ch09-t01", "5"]]) {
    const K = kitOf(id); const f = fadeItem(K, {});
    assert.equal(f?.answer, key, id);
    const r = classifyFast({ target: targetFor({ fadeItem: f }, K, f), childText: key, typed: true });
    assert.equal(r.result?.outcome, "correct", id);
  }
  // a key already shown in the steps before it ("6, 5" then "= 5"): no gap, the whole worked example instead
  assert.equal(fadeItem(kitOf("c1-maths-ch05-t02"), {}), null);
});
