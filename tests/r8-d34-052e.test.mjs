// to-brain 052, the engine builder's parts (docs/patches/to-brain/052-d34-merged-tree-one-count-ladder-after-own-reason.md): each rule pinned
// on the walk's pieces, with script copies under tests/fixtures/scripts-052e/ (taken from data/lesson-scripts/ on 2026-11-24).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const fixture = (t) => JSON.parse(readFileSync(join(ROOT, "tests/fixtures/scripts-052e", `${t}.json`), "utf8"));

describe("A1: the ladder after the card's own reason", () => {
  const named = { outcome: "misconception", misconceptionId: "c5-maths-ch02-t03-m-one-part-only", wrongListed: true };
  const other = { outcome: "incorrect", misconceptionId: null, wrongListed: false };
  const part = "c5-maths-ch02-t03-s2:check:c3";
  // (dry steady c5-ch02-t03 row 50: c1's own hint, written like c3's, was said before c3 was asked)
  const c1Hint = "Nahi, 1 theek nahi. Pehle dekho ki 1/3 ka neeche wala number kis number se guna hokar 12 banta hai. Phir upar wale number ko bhi usi se guna karo.";
  test("the named wrong answer first: the own reason; the next miss: the card's simpler; the miss after: the key", async () => {
    const { pickHelp, addSaid } = await import("../server/director/help.js");
    const script = fixture("c5-maths-ch02-t03");
    let said = addSaid([], c1Hint, 50);
    const d1 = pickHelp({ script, part, request: "hint", said, last: named });
    assert.equal(d1.rung?.field, "whyAltHelp", "the own reason first");
    said = addSaid(said, d1.rung.text, 56);
    const d2 = pickHelp({ script, part, request: "hint", said, last: named });
    assert.equal(d2.rung?.field, "simpler", "the card's simpler — another card's hint written the same way is not it");
    said = addSaid(said, d2.rung.text, 58);
    const d3 = pickHelp({ script, part, request: "hint", said, last: other });
    assert.ok(d3.key && d3.card === "close", "then the key");
  });
  test("a miss that is not the named answer first: the simpler; then the named answer: the own reason; then the key", async () => {
    const { pickHelp, addSaid } = await import("../server/director/help.js");
    const script = fixture("c5-maths-ch02-t03");
    const d1 = pickHelp({ script, part, request: "hint", said: [], last: other });
    assert.equal(d1.rung?.field, "simpler");
    let said = addSaid([], d1.rung.text, 1);
    const d2 = pickHelp({ script, part, request: "hint", said, last: named });
    assert.equal(d2.rung?.field, "whyAltHelp");
    said = addSaid(said, d2.rung.text, 3);
    const d3 = pickHelp({ script, part, request: "hint", said, last: named });
    assert.ok(d3.key, "the key");
  });
  test("a request after the named answer keeps 049 B3's order: the simpler first", async () => {
    const { pickHelp } = await import("../server/director/help.js");
    const d = pickHelp({ script: fixture("c5-maths-ch02-t03"), part, request: "clarify", said: [], last: named });
    assert.equal(d.rung?.field, "simpler");
  });
});
