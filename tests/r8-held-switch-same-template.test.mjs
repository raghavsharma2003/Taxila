// d29 join: Studio's heldBoard joins two different boards of the same template as a switch, and three boards in one turn,
// each later page from its part's first character; the same board twice is one page. The board up is passed as the seam
// passes it (keepRef + keepPage: the page last drawn for it), so it is held still until the first switch.
// What a join may NOT do is cross the whiteboard script's op cap (LIMITS.maxOps): every drawn op of an outgoing page costs an
// erase op, so an op-heavy board up (an equal-groups board of 32+ marbles) can leave no room for two more pages. That cap is
// the whiteboard contract's (shared/whiteboard.js), not Studio's to raise: the last test pins that a join never crosses it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { heldBoard } from "../server/stagecraft/board-first.js";
import { LIMITS } from "../shared/whiteboard.js";

const style = { band: "B3", lang: "hinglish" };
const eg38 = { template: "equal-groups@1", params: { groups: 3, each: 8 } };
const eg1010 = { template: "equal-groups@1", params: { sizes: [10, 10] } };
const eg7 = { template: "equal-groups@1", params: { sizes: [7, 3, 3, 3], equalTo: { groups: 4, each: 4 } } };
const fp = { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "bar" } };
const fb = { template: "fraction-bars@1", params: { bars: [{ parts: 2, shade: 1, label: "1/2" }, { parts: 4, shade: 0, label: "?" }] } };

/** the board up as the seam hands it over: its ref and the page last drawn for it */
function up(board) {
  const r = heldBoard({ intent: { kind: "whiteboard", held: { board, unit: "up" }, style }, line: { text: "a b" } }, {});
  return { keepRef: r.lastRef, keepPage: r.lastPage };
}
function turn(boards, ats, text, o = {}) {
  const sws = boards.slice(1).map((b, k) => ({ board: b, unit: `u${k + 1}`, atChar: ats[k] }));
  const held = { board: boards[0], unit: "u0", ...(sws.length ? { switchTo: sws.at(-1) } : {}), ...(sws.length > 1 ? { switches: sws } : {}) };
  return heldBoard({ intent: { kind: "whiteboard", held, style }, line: { text } }, o);
}

test("(a) equal-groups → equal-groups with different params: two screens, the second from the switch's character", () => {
  const text = `${"a ".repeat(60)}${"b ".repeat(60)}`;
  const r = turn([eg38, eg1010], [120], text, up(eg38));
  assert.ok(r?.ok);
  assert.deepEqual(r.screens.map((s) => [s.from, s.template]), [[0, "equal-groups@1"], [120, "equal-groups@1"]]);
  assert.equal(r.script.switches.length, 1);
  assert.ok(r.script.switches[0].atMs > 0);
  assert.ok(r.script.ops.length <= LIMITS.maxOps);
});

test("(b) three boards: three screens in order, each later page from its part's first character", () => {
  const text = ["a", "b", "c"].map((c) => `${c} `.repeat(50)).join("");
  const r = turn([eg38, fp, fb], [100, 200], text, up(eg38));
  assert.ok(r?.ok);
  assert.deepEqual(r.screens.map((s) => [s.from, s.template]), [[0, "equal-groups@1"], [100, "fraction-parts@1"], [200, "fraction-bars@1"]]);
  assert.equal(r.script.switches.length, 2);
  assert.ok(r.script.switches[0].atMs < r.script.switches[1].atMs);
  // (with nothing up, the same three join too)
  const r2 = turn([eg1010, fp, fb], [100, 200], text);
  assert.deepEqual(r2.screens.map((s) => s.from), [0, 100, 200]);
});

test("(c) the same board twice is one screen: no switch", () => {
  const text = `${"a ".repeat(60)}${"b ".repeat(60)}`;
  const r = turn([eg1010, { ...eg1010, params: { ...eg1010.params } }], [120], text, up(eg1010));
  assert.ok(r?.ok);
  assert.equal(r.screens.length, 1);
  assert.ok(!r.script.switches?.length);
});

test("a join never crosses the whiteboard op cap: an op-heavy board up and two more pages stay one page", () => {
  const text = ["a", "b", "c"].map((c) => `${c} `.repeat(50)).join("");
  const r = turn([eg7, fp, fb], [100, 200], text, up(eg7));
  assert.ok(r?.ok);
  assert.ok(r.script.ops.length <= LIMITS.maxOps);
  assert.equal(r.screens.length, 1);
});
