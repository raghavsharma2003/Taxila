// Round 4 · stream 2 (content), items 3 and 6: a board slot never ends empty while her line points at the screen, when her
// line itself says what is there. The claims board (server/stagecraft/claims-board.js) draws exactly her screen claims and
// is gated against her line like every other board. Lines verbatim from the owner-5 baseline (local production build,
// 2026-10-10), where these slots failed. No browser, no model.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { codeBoard, gateCtxFor } from "../server/stagecraft/board-sync.js";
import { claimsCalls, shadedIn } from "../server/stagecraft/claims-board.js";
import { claimsNotDrawn, screenClaims } from "../server/studio/qa/semantics.js";
import { certifyForTray } from "../server/forge3/tray-gate.js";

const ask = (text) => ({ intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: null, mode: "fresh" });
const board = (text) => { const a = ask(text); return codeBoard(a, { lessonId: "L" }, gateCtxFor(a, {})); };

describe("r4 content: the claims board", () => {
  it("reads parts, shaded counts and groups from her line; nothing from a line that claims nothing", () => {
    assert.deepEqual(claimsCalls("Screen par 5 barabar parts dekhiye; 3 shaded hain."), [{ template: "fraction-parts@1", parts: 5, shade: 3, whole: "circle" }]);
    assert.equal(shadedIn("4 mein se 3 rangeen hain", 4), 3);
    assert.equal(claimsCalls("Look at the screen: 15 dots in 3 equal groups, with 5 dots in each. How many dots are in one group?")[0].each, 5);
    assert.deepEqual(claimsCalls("Achha, aage badhte hain."), []);
    assert.deepEqual(claimsCalls("Agar 4 hisse hon, toh?"), [], "a supposing clause claims nothing about the screen");
    // "5 columns aur 3 rows" is one grid claim, not "3 parts" and "3 groups of 15"
    assert.deepEqual(screenClaims("Board par rectangle 5 columns aur 3 rows mein hai: total 15 parts.").grids, [{ rows: 3, cols: 5 }]);
    assert.deepEqual(screenClaims("Board par rectangle 5 columns aur 3 rows mein hai: total 15 parts.").groups, []);
    assert.deepEqual(claimsCalls("Board par rectangle 5 columns aur 3 rows: marked parts giniye, kitne hain?"), [], "shaded named without a count: nothing drawn");
    assert.equal(shadedIn("15 equal parts, unmein 6 marked", 15), 6);
  });
  for (const line of [
    "Screen par 5 barabar parts dekhiye; 3 shaded hain. Agar har part ko 2 tukdon mein baantein, shaded tukde kitne honge?",
    "Meher, look at the screen: 15 dots in 3 equal groups, with 5 dots in each. How many dots are in one group?",
    "Board par dekho: 3 groups, har group mein 4 laddoo. Kitne laddoo hain?",
    // the grid lines (local production run of this branch, 2026-10-10: slots failed while she pointed at the rectangle)
    "Aarav, rectangle ko 5 columns aur 3 rows mein dekhiye; 6 shaded boxes count karke bataiye: total boxes kitne hain?",
    "Screen par rectangle dekhiye: 15 equal parts, unmein 6 marked. Marked fraction ko simplest form mein kaise likhenge?",
    // owner-5 on this branch (2026-10-10): a flow she lists over the screen, the step she asks for kept open
    "Ishaan, is screen par animation nahi chalegi. Flow mein dekhiye: Observe, Ask, Predict, Test, phir Conclude. Pehla step kya hai?",
    "Board par steps dekho: Observe, Predict, Test. Predict ke baad kya aata hai?",
  ]) it(`a board that draws her claims passes the gate and is legible at 360: "${line.slice(0, 48)}…"`, () => {
    const r = board(line);
    assert.ok(r?.ok, "a board is drawn");
    assert.deepEqual(claimsNotDrawn(line, r.script.ops), []);
    assert.ok(certifyForTray({ kind: "whiteboard", script: r.script }, { vp: "p360" }).ok);
    // a question in her line is never answered on the board (W9 inside the gate; the result is "?")
    if (/kitne|how many/i.test(line)) assert.ok(!r.script.ops.some((o) => o.op === "numwork" && JSON.stringify(o.rows).includes('"12"')), "no total drawn for a question");
    if (/Pehla step/.test(line)) assert.ok(!r.script.ops.some((o) => o.op === "text" && o.text === "Observe"), "the first step she asks for is '?'");
    if (/ke baad/.test(line)) assert.ok(!r.script.ops.some((o) => o.op === "text" && o.text === "Test"), "the step after Predict is '?'");
    if (/columns|15 equal/.test(line)) assert.equal(r.script.ops.filter((o) => o.op === "rect" && o.fill === "accent").length, 6, "her 6 shaded cells");
  });
});

describe("r4 content: claims boards on the owner-5 lines of this branch's local production run (2026-10-10)", () => {
  it("a fraction of a fraction on a grid ('3/5 wale hisson mein 2 rows mark') is the area model, its count hidden", () => {
    const line = "Screen par rectangle dekhiye: 5 columns aur 3 rows hain; 3/5 wale hisson mein 2 rows mark hain. Marked chhote parts kitne dikh rahe hain?";
    const r = board(line);
    assert.ok(r?.ok, "a board is drawn");
    assert.equal(r.template, "fraction-of@1");
    assert.deepEqual(claimsNotDrawn(line, r.script.ops), []);
    assert.ok(!JSON.stringify(r.script.ops).includes('"6"'), "the 6 she asks for is not written");
  });
  it("three more lines of the 52-board battery: 'ek part shade hai', a shaded block of the grid, an order to shade", () => {
    const one = board("Aarav, board par teen barabar parts dekho; ek part shade hai. Kitne parts shade hue?");
    assert.ok(one?.ok); assert.equal(one.script.ops.filter((o) => o.op === "sector" && o.fill === "accent").length, 1);
    const blk = board("Aarav, screen ke rectangle mein 3 columns aur 5 rows dekhiye; shaded hissa 2 columns aur 3 rows cover karta hai. Marked boxes kitne?");
    assert.ok(blk?.ok); assert.equal(blk.script.ops.filter((o) => o.op === "rect" && o.fill === "accent").length, 6);
    const order = board("Aarav, board par 3 columns aur 5 rows banaiye: kul 15 boxes. Unmein 6 shade kijiye. Aap marked boxes ki sankhya boliye.");
    assert.ok(order?.ok); assert.equal(order.script.ops.filter((o) => o.op === "rect" && o.fill === "accent").length, 0, "she tells the child to shade: nothing shaded for her");
  });
  it("the 51-board battery's last two: '5 slices mein 2 liye', and 15 boxes with 6 shaded where she asks the child to write it", () => {
    const taken = board("Aarav, fraction mein upar wala number liye gaye parts, neeche wala total equal parts batata hai. 5 slices mein 2 liye—fraction kya hoga?");
    assert.ok(taken?.ok); assert.equal(taken.script.ops.filter((o) => o.op === "sector" && o.fill === "accent").length, 2);
    const grid = board("Aarav, screen par 15 equal boxes hain; 6 shaded boxes ko count kijiye. Fraction mein upar shaded, neeche total—likhiye.");
    assert.ok(grid?.ok); assert.equal(grid.script.ops.filter((o) => o.op === "rect" && o.fill === "accent").length, 6);
    assert.ok(!grid.script.ops.some((o) => o.op === "numwork"), "she asks the child to write the fraction: it is not written");
    for (const r of [taken, grid]) assert.ok(certifyForTray({ kind: "whiteboard", script: r.script }, { vp: "p360" }).ok, "legible at the 360 phone");
  });
  it("a code board for her CONTINUE line is drawn fresh (it replaces the board; the old words are not under it)", () => {
    const line = "Ishaan, screen par animation move nahi hogi; flow dekhiye: Observe, Ask, Predict, Test, phir Conclude. Ismein pehla step kya hai?";
    const a = { ...ask(line), mode: "continue" };
    const prior = [{ id: "p1", op: "text", at: [200, 150], text: "Observation se question", size: "m" }, { id: "p2", op: "text", at: [105, 60], text: "Predict karo", size: "m" }];
    const r = codeBoard(a, { lessonId: "L" }, gateCtxFor(a, { prior }));
    assert.ok(r?.ok, "drawn");
    assert.equal(r.script.mode, "fresh");
  });
});

describe("r4 content: a board refused only for writing the answer keeps its picture with '?'", async () => {
  const { regate, retime, maskReveals } = await import("../server/stagecraft/board-sync.js");
  const { expand } = await import("../server/forge/explainer/templates.js");
  it("a stacked fraction that is the answer keeps its bottom and writes its top '?'", () => {
    const script = { ops: [{ id: "frac", op: "numwork", layout: "fraction", at: [200, 200], rows: [["1"], ["3"]] }] };
    assert.deepEqual(maskReveals(script, ["frac: 1/3 = answer 1/3"]).ops[0].rows, [["?"], ["3"]]);
    assert.equal(maskReveals(script, ["frac: 2/3 = answer 2/3"]), null, "a different fraction is not touched");
  });
  it("masks the revealing number and passes the full gate; anything else still refuses", () => {
    const a = ask("Board par dekho: 3 groups, har group mein 4 laddoo. Kitne laddoo hain?");
    const ctx = { ...gateCtxFor(a, {}), withhold: { values: ["12"], words: [], phrases: [] } };
    const x = expand({ template: "equal-groups@1", groups: 3, each: 4 });
    const script = retime(x.script, x.script.durationMs, ctx.speechMs);
    assert.ok(JSON.stringify(script.ops).includes('"12"'), "the template writes the total");
    const r = regate(script, a, ctx);
    assert.ok(r.ok, JSON.stringify(r.gate?.checks?.filter((c) => !c.pass)));
    assert.deepEqual(r.script.ops.find((o) => o.id === "eq").rows[0], ["3", "×", "4", "=", "?"]);
    assert.equal(maskReveals({ ops: [{ id: "x", op: "line", from: [0, 0], to: [1, 1] }] }, ["x: 5 = answer 5"]), null, "nothing to mask → no change");
  });
});
