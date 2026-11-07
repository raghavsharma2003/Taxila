// round 7 (C1 item 6, M2): the code templates children get now MOVE, and every motion ends on the explained state (the
// place the still board drew it: expand() checks each template's claims on the settled board). The arithmetic text pick
// reads an operation's own operands, and what a moving board shows (W8/W10/W13/W15) is judged where it ends.
import { test } from "node:test";
import assert from "node:assert/strict";
import { expand, _claimsBroken } from "../server/forge/explainer/templates.js";
import { codePick } from "../server/forge/explainer/pick.js";
import { settledScript, isMotionOp } from "../shared/whiteboard.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";
import { retime } from "../server/stagecraft/board-sync.js";

const motions = (x) => x.script.ops.filter(isMotionOp).map((o) => o.op);
const end = (x, id) => settledScript(x.script).ops.find((o) => o.id === id);
const near = (p, q) => Math.abs(p[0] - q[0]) <= 1 && Math.abs(p[1] - q[1]) <= 1;

test("angle: the second arm is drawn along the first and TURNS open by the angle, ending at it", () => {
  const x = expand({ template: "angle@1", angles: [{ deg: 60 }] });
  assert.ok(x.ok, x.errors?.join(","));
  assert.deepEqual(motions(x), ["rotate"]);
  const arm = x.script.ops.find((o) => o.id === "r0"), base = x.script.ops.find((o) => o.id === "h0");
  assert.deepEqual(arm.to, base.to, "starts along the base");
  const a = end(x, "r0"), ang = Math.atan2(a.from[1] - a.to[1], a.to[0] - a.from[0]) * 180 / Math.PI;
  assert.ok(Math.abs(ang - 60) < 0.5, `ends at ${ang}°`);
});

test("symmetry: the mirror half is the first half folded over the line; the dot's image jumps across", () => {
  const x = expand({ template: "symmetry@1" });
  assert.ok(x.ok, x.errors?.join(","));
  assert.ok(motions(x).includes("scale"));
  assert.deepEqual(end(x, "R").points, [[200, 52], [250, 92], [282, 150], [250, 212], [200, 252]]);
  const d = expand({ template: "symmetry@1", dot: 3 });
  assert.ok(near(end(d, "img").c, [275, 150]), "3 squares on the other side");
});

test("column addition: a column that makes ten sends its 1 up to the next column (subtraction is unchanged)", () => {
  const x = expand({ template: "column-op@1", a: 478, b: 356 });
  assert.ok(x.ok, x.errors?.join(","));
  const carries = x.script.ops.filter((o) => o.op === "text" && o.text === "1" && o.size === "s");
  assert.equal(carries.length, 2, "8+6 and 7+5+1 both carry");
  for (const c of carries) assert.equal(end(x, c.id).at[1], 55, "it ends over its column");
  assert.ok(!expand({ template: "column-op@1", a: 500, b: 256, op: "sub" }).script.ops.some(isMotionOp));
});

test("equal groups: a heap shared out group by group; each dot ends in its group, and W8/W10 judge the shared board", () => {
  const x = expand({ template: "equal-groups@1", groups: 3, each: 4 });
  assert.ok(x.ok, x.errors?.join(","));
  assert.equal(x.script.ops.filter((o) => o.op === "move").length, 12);
  const line = "Board par dekho: 3 groups, har group mein 4 laddoo.";
  const g = gateWhiteboard(retime(x.script, x.script.durationMs, 9000), { reply: line, speechMs: 9000 });
  assert.equal(g.checks.find((c) => c.id === "W10.screen_claims_drawn").pass, true, JSON.stringify(g.checks.filter((c) => !c.pass)));
  assert.equal(g.checks.find((c) => c.id === "W8.counts_match_line").pass, true);
});

test("place value: each digit rises into its place box; adding: the second group slides over and joins the first", () => {
  const p = expand({ template: "place-value@1", value: 3456 });
  assert.ok(p.ok, p.errors?.join(","));
  assert.equal(p.script.ops.filter((o) => o.op === "move").length, 4);
  const c = expand({ template: "combine-count@1", a: 7, b: 6 });
  assert.ok(c.ok, c.errors?.join(","));
  assert.ok(near(end(c, "b0").c, [40 + 2 * 30, 70 + 30]), "the 8th dot fills the second row");
  assert.ok(c.script.ops.some((o) => o.op === "erase" && o.target === "plus"));
});

test("fills sweep in (area rows, fraction columns and rows, chart bars); a flow and a cycle are toured by a token", () => {
  for (const [call, kind] of [[{ template: "area-grid@1", w: 5, h: 3 }, "sweep"], [{ template: "fraction-of@1", a: 1, b: 2, c: 3, d: 4 }, "sweep"],
    [{ template: "bar-chart@1", bars: [{ label: "A", value: 3 }, { label: "B", value: 5 }] }, "sweep"],
    [{ template: "flow@1", steps: ["food", "mouth", "stomach"] }, "follow"], [{ template: "cycle@1", stages: ["egg", "larva", "pupa", "adult"] }, "follow"]]) {
    const x = expand(call);
    assert.ok(x.ok, `${call.template}: ${x.errors?.join(",")}`);
    assert.ok(motions(x).includes(kind), call.template);
  }
});

test("a motion that does not end on its claimed state fails the check (the template would step down the ladder)", () => {
  const x = expand({ template: "angle@1", angles: [{ deg: 60 }] });
  assert.deepEqual(_claimsBroken(x.script, [{ id: "r0", to: [0, 0] }]), ["r0"]);
  assert.deepEqual(_claimsBroken(x.script, [{ id: "nope", c: [1, 1] }]), ["nope"]);
  assert.deepEqual(_claimsBroken(x.script, []), []);
});

test("the text pick reads an operation's own operands, never the line's first two numbers", () => {
  const k = { topicId: "c4-maths-ch01-t01" };
  const pick = (t) => codePick({ kit: k, text: t });
  assert.deepEqual(pick("4 + 3 = ?"), { template: "combine-count@1", a: 4, b: 3, op: "add" });
  assert.deepEqual(pick("Riya has 4 apples and gets 3 more. How many in all?"), { template: "combine-count@1", a: 4, b: 3, op: "add" });
  assert.deepEqual(pick("add 245 and 378"), { template: "column-op@1", a: 245, b: 378, op: "add" });
  assert.deepEqual(pick("2 kg 50 g = 2,000 + 50 = 2,050 g").a, 2000, "a thousands comma is one number");
  assert.equal(pick("3 + 4 × 2 = 11"), null, "order of operations is not two groups");
  assert.equal(pick("9 + 9 + 1 = 19"), null);
  assert.equal(pick("3a + 5a = 8a"), null);
  assert.equal(pick("perimeter = 2 × (length + breadth): 2 lengths and 2 breadths")?.template === "combine-count@1", false);
  assert.equal(pick("if it is odd, multiply by 3 and add 1; it loops 4, 2, 1"), null);
  assert.equal(pick("A number with more digits is bigger: every 4-digit number beats every 3-digit number"), null);
  assert.deepEqual(pick("48 ÷ 6 = 8 because 6 × 8 = 48"), { template: "equal-groups@1", groups: 6, each: 8 });
  assert.deepEqual(pick("3 × (−2) means three jumps of 2 to the left"), { template: "number-line-hop@1", start: 0, hops: [-2, -2, -2] });
  assert.equal(pick("Friendly numbers make adding easier: 38 + 2 + 25 = 40 + 25; to add 9, add 10 and take away 1")?.template === "bar-chart@1", false, "words are no bar labels");
});

test("W9: a board that writes a withheld digit in its own box never writes the number that contains it (main: 10,500 under '?')", async () => {
  const { regate, gateCtxFor } = await import("../server/stagecraft/board-sync.js");
  const { gateWhiteboard: gate } = await import("../server/studio/qa/whiteboard.js");
  const x = expand({ template: "place-value@1", value: 10500 });
  assert.ok(x.ok, x.errors?.join(","));
  const kit = { expectations: ["Places: TTh, Th, H, T, O. In 10,500 the digits are 1, 0, 5, 0, 0: the 5 is in the hundreds place."] };
  const ctx = { reply: "Dekho, yeh number 10,500 ke boxes hain.", kit, speechMs: 9000, withhold: { values: ["5"] } };
  const s = retime(x.script, x.script.durationMs, 9000);
  const raw = gate(s, ctx);
  assert.ok(raw.checks.find((c) => c.id === "W9.no_reveal").detail.some((d) => /10,500 = answer 5/.test(d)), "the whole number is a reveal of its digit");
  const r = regate(s, { intent: { intentId: "pv" }, line: { lessonId: "L", text: ctx.reply } }, ctx);
  const texts = (r.ok ? r.script : r.gate.script).ops.filter((o) => o.op === "text").map((o) => o.text);
  assert.ok(!texts.some((t) => /5/.test(t)), `no 5 anywhere: ${texts.join(" | ")}`);
  // a board that never splits a number into digits is unchanged: "15 cm" beside an answer of 5 is no reveal
  const plain = expand({ template: "measured@1", shape: "rect", w: 15, h: 8, unit: "cm" });
  assert.ok(!gate(retime(plain.script, plain.script.durationMs, 6000), { reply: "15 cm aur 8 cm.", speechMs: 6000, withhold: { values: ["5"] } })
    .checks.find((c) => c.id === "W9.no_reveal").detail.length);
});

test("W9: a hidden 0 or 1 in a place-value box is masked too (main, M3), while a number line's bare 0 stays an origin", async () => {
  const { regate } = await import("../server/stagecraft/board-sync.js");
  const x = expand({ template: "place-value@1", value: 10500 });
  const kit = { expectations: ["Places: TTh, Th, H, T, O. In 10,500 the digits are 1, 0, 5, 0, 0: the 1 is in the ten thousands place."] };
  const ctx = { reply: "Dekho, yeh number 10,500 ke boxes hain.", kit, speechMs: 9000, withhold: { values: ["1"] } };
  const s = retime(x.script, x.script.durationMs, 9000);
  const r = regate(s, { intent: { intentId: "pv1" }, line: { lessonId: "L", text: ctx.reply } }, ctx);
  const cells = (r.ok ? r.script : r.gate.script).ops.filter((o) => o.op === "text" && /^[\d?]$/.test(o.text)).map((o) => o.text);
  assert.equal(cells[0], "?", `the ten-thousands box: ${cells.join(" ")}`);
  assert.ok(!(r.ok ? r.script : r.gate.script).ops.some((o) => o.op === "text" && /10,500/.test(o.text)), "nor the number that contains it");
  // a number line's bare 0 (its origin, in no box) is still not a reveal of a withheld 0
  const hop = expand({ template: "number-line-hop@1", start: 0, hops: [3] });
  const g = gateWhiteboard(retime(hop.script, hop.script.durationMs, 6000), { reply: "0 se 3 ka jump.", speechMs: 6000, withhold: { values: ["0"] } });
  const zeroTexts = new Set(hop.script.ops.filter((o) => o.op === "text" && o.text === "0").map((o) => o.id));
  assert.ok(!g.checks.find((c) => c.id === "W9.no_reveal").detail.some((d) => zeroTexts.has(d.split(":")[0])));
});

test("the decimal zoom: the unit that holds the value lifts off, stretches into the lower line and lands on it; decimal operands are no integer sum", () => {
  const x = expand({ template: "number-line-zoom@1", value: 0.47 });
  assert.ok(x.ok, x.errors?.join(","));
  assert.deepEqual(motions(x), ["move", "scale", "move"]);
  const z = end(x, "z"), bottom = x.script.ops.find((o) => o.id === "bottom");
  assert.ok(Math.abs(z.from[1] - bottom.at[1]) < 1 && Math.abs(z.to[0] - z.from[0] - (bottom.w - 24)) < 2, "the stretched unit is the lower line");
  assert.ok(x.script.ops.some((o) => o.op === "text" && o.text === "0.47"));
  assert.equal(expand({ template: "number-line-zoom@1", value: 3 }).ok, false, "a whole number has nothing to zoom into");
  const k = { topicId: "c7-maths-ch03-t04", expectations: ["decimals"] };
  assert.equal(codePick({ kit: k, text: "2.85 + 2.50 = 5.35" })?.template === "combine-count@1", false, "no 85 + 2");
  assert.deepEqual(codePick({ kit: { topicId: "c7-maths-ch03-t03", expectations: ["tenths"] }, text: "Between which two tenths does 0.47 lie on a number line?" }), { template: "number-line-zoom@1", value: 0.47 });
});
