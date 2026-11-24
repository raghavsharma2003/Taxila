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

describe("A2: a told step's result board is drawn when its line is said", () => {
  test("heldOf: a told step's line that carries its resultBoard pages there from its first word; the card is on its own board", async () => {
    const { heldOf } = await import("../server/brain/propose.js");
    const posing = { template: "angle@1", params: { angles: [{ deg: 60, name: "P" }, { deg: 90, name: "Q", len: "short" }, { deg: 130, name: "R", len: "short" }] } };
    const result = { template: "angle@1", params: { angles: [{ deg: 60, name: "P" }, { deg: 90, name: "Q", len: "short" }], tester: true } };
    const sb = { scriptId: "c4-maths-ch01-t02", skillId: "c4-maths-ch01-t02-s2", beatId: "worked", kind: "worked", board: posing };
    // (dry steady c4-ch01-t02 row 66: step 1's verdict, step 2's told line, the child's own step)
    const list = [{ part: "body", kind: "stepConfirm", text: "Haan, kam: P ki bhujayein lambi hain, par uska khulna right angle se kam hai." },
      { part: "body", kind: "workedStep", text: "Q par tester rakho: tester bilkul fit hota hai, toh Q right angle ke barabar hai.", board: result },
      { part: "card", text: "Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?" }];
    const line = list.map((p) => p.text).join(" ");
    const h = heldOf({ move: { kind: "worked_example", scriptBeat: sb, cardBeat: sb }, list, line, kit: null, up: { board: posing, unit: "c4-maths-ch01-t02-s2:worked" } });
    assert.deepEqual(h.board, posing, "the page before it is whatever was up");
    assert.equal(h.switches?.length, 2);
    assert.deepEqual(h.switches[0].board, result);
    assert.equal(h.switches[0].atChar, line.indexOf("Q par tester"));
    assert.deepEqual(h.switches[1].board, posing, "the card on its own board");
    const plain = heldOf({ move: { kind: "worked_example", scriptBeat: sb, cardBeat: sb }, list: list.map(({ board: _b, ...p }) => p), line, kit: null, up: { board: posing, unit: "c4-maths-ch01-t02-s2:worked" } });
    assert.ok(!plain.switches && !plain.switchTo, "without the mark: one page, as before");
  });
});

describe("A3: the boards asked of Studio start at the close's own board", () => {
  // (staged c6-ch07-t03 s2: e2's answer board, then e3's point and card — two 12-part pairs of bars)
  const answer = { template: "fraction-bars@1", params: { bars: [{ parts: 5, shade: 2, label: "2/5" }] } };
  const e2card = { template: "fraction-bars@1", params: { bars: [{ parts: 5, shade: 0, label: "" }] } };
  const point = { template: "fraction-bars@1", params: { bars: [{ parts: 12, shade: 4, label: "1/3" }, { parts: 12, shade: 6, label: "2/4" }] } };
  const card = { template: "fraction-bars@1", params: { bars: [{ parts: 12, shade: 8, label: "2/3" }, { parts: 12, shade: 0, label: "" }] } };
  test("switchesFit: the close's board drawn fresh, the point's and the card's do not fit one turn; the point's and the card's alone do", async () => {
    const { switchesFit } = await import("../server/director/state.js");
    assert.equal(switchesFit([answer, point, card], { freshFirst: true }), false);
    assert.equal(switchesFit([null, point, card]), true);
    // (what the walk asked before: the board up — e2's card, held still — then the point's and the card's; it fits, so the turn was not split,
    // and Studio, drawing the answer board fresh first, drew one page)
    assert.equal(switchesFit([e2card, point, card]), true);
  });
});

describe("B1: a remediation listed whole is said in one turn with its card", () => {
  test("remWholeListed reads the checker's REM_WHOLE (not a copy)", async () => {
    const { remWholeListed } = await import("../server/director/state.js");
    const { REM_WHOLE } = await import("../scripts/lesson-scripts/check.mjs");
    assert.ok(REM_WHOLE.length > 0);
    for (const w of REM_WHOLE) assert.ok(remWholeListed(w.topicId, w.skillId, w.targets), w.targets);
    assert.equal(remWholeListed("c5-maths-ch02-t02", "c5-maths-ch02-t02-s1", "c5-maths-ch02-t02-m-bigger-denominator"), false);
  });
  test("unitTurn: a listed remediation and its card share the turn up to 65 words of the two; an unlisted one keeps 60 with its margin", async () => {
    const { unitTurn, REM_WHOLE_CAP, REM_CARD_CAP } = await import("../server/director/state.js");
    assert.equal(REM_WHOLE_CAP, 65);
    const out = (targets, skillId) => ({ state: { ctx: {} }, ui: { ask: { itemId: `script:${skillId}:then:${targets}` } },
      move: { kind: "reteach", skillId, scriptBeat: { kind: "remediation", skillId, beatId: `rem:${targets}` }, rendered: ["Ek badi chocolate aur do chhoti toffee socho."] } });
    const input = { kit: { topicId: "c5-maths-ch02-t02" }, text: "3/10" };
    assert.deepEqual(unitTurn(out("c5-maths-ch02-t02-m-tops-only", "c5-maths-ch02-t02-s2"), input), { margin: 0, cap: REM_WHOLE_CAP });
    const u = unitTurn(out("c5-maths-ch02-t02-m-bigger-denominator", "c5-maths-ch02-t02-s1"), input);
    assert.equal(u.cap, REM_CARD_CAP); assert.ok(u.margin > 0);
  });
});
