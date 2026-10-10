// Round 3 · forge: the whiteboard gate's meaning checks (wb-gate@3, server/studio/qa/semantics.js), on the boards taxila.dev
// actually drew in the 2026-10-09 audit (tests/fixtures/round3-forge/prod-boards-2026-10-09.json: her line + the script),
// plus constructed cases. The prod cases are the defects the owner saw: a board that does not show what she says is on it.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { screenClaims, claimsNotDrawn, placeholderBoard, nextStepRevealed, fractionsDisagree, longAnswerWritten, drawnCounts, boardOffLine } from "../server/studio/qa/semantics.js";
import { gateWhiteboard, withheldValues, WB_GATE_VERSION } from "../server/studio/qa/whiteboard.js";

const PROD = JSON.parse(readFileSync(new URL("./fixtures/round3-forge/prod-boards-2026-10-09.json", import.meta.url), "utf8"));
const byCase = (c) => PROD.filter((x) => x.case === c);

describe("round3 forge: screen claims", () => {
  it("reads what her line says is on the screen, and nothing from a supposing clause", () => {
    assert.deepEqual(screenClaims("Screen par number line dekhiye: 0 se 1 ke beech 5 equal gaps hain").gaps, [5]);
    assert.deepEqual(screenClaims("Kabir, screen par roti ke 5 equal parts hain; 3 shaded hain").parts, [5]);
    assert.deepEqual(screenClaims("Meher, look at the screen: 3 equal groups, each holding 5 dots.").groups, [{ n: 3, each: 5 }]);
    assert.deepEqual(screenClaims("On the board, 2 equal boxes. What would one box be if there were 3 equal parts?").parts, [2]);
    assert.deepEqual(screenClaims("5 equal parts mein baanto"), { parts: [], gaps: [], groups: [], grids: [] }, "no screen word: not a claim about the drawing");
  });
  it("counts what a script draws: equal families, number-line gaps from ticks, groups and what they hold", () => {
    const ops = [{ id: "l", op: "line", from: [40, 150], to: [360, 150] },
      ...[40, 104, 168, 232, 296, 360].map((x, i) => ({ id: `t${i}`, op: "line", from: [x, 140], to: [x, 160] }))];
    assert.equal(drawnCounts(ops).lines.find((l) => l.id === "l").gaps, 5);
    const groups = [0, 1, 2].flatMap((g) => [{ id: `e${g}`, op: "ellipse", c: [80 + g * 120, 120], rx: 50, ry: 70 },
      ...[0, 1, 2, 3, 4].map((k) => ({ id: `d${g}${k}`, op: "circle", c: [70 + g * 120 + (k % 2) * 20, 90 + Math.floor(k / 2) * 22], r: 7 }))]);
    assert.deepEqual(drawnCounts(groups).groups.map((x) => x.held), [5, 5, 5]);
  });
});

describe("round3 forge: the taxila.dev boards of 2026-10-09", () => {
  it("W10 refuses '5 equal gaps' over a line with no ticks (picture ask, c5-maths-ch02-t01)", () => {
    const b = byCase("picture")[0];
    assert.match(claimsNotDrawn(b.line, b.script.ops)[0], /5 gaps said/);
  });
  it("W10 refuses '3 equal groups, each holding 5 dots' over 3 groups of 3 (diagram ask, c6-maths-ch07-t01)", () => {
    const b = byCase("diagram")[0];
    assert.match(claimsNotDrawn(b.line, b.script.ops)[0], /3 groups of 5 said, drawn 3\+3\+3/);
  });
  it("W10 + W11 refuse 'roti ke 5 equal parts' over the words 'fraction of fraction multiply' (whiteboard ask, c7-maths-ch08-t01)", () => {
    const b = byCase("whiteboard").find((x) => /5 equal parts/.test(x.line)) ?? byCase("whiteboard")[0];
    assert.match(placeholderBoard(b.script.ops)[0], /only generic words/);
  });
  it("W12 refuses a flow chart that answers her 'Observe ke baad kaunsa step aata hai?' (animation ask, c6-science-ch01-t01)", () => {
    const b = byCase("animation").find((x) => /ke baad/.test(x.line));
    assert.ok(b, "fixture has the line");
    assert.match(nextStepRevealed(b.line, b.script.ops)[0], /Observe → Ask a testable/);
    // the same board under "scientist sabse pehle kya karte hain?" (taxila.dev, the acceptance run): the first box answers it
    assert.match(nextStepRevealed("Aap batayiye, scientist sabse pehle kya karte hain?", b.script.ops)[0], /first step/);
    assert.deepEqual(nextStepRevealed("Theek hai, ab aage chalein.", b.script.ops), []);
  });
  it("W13 refuses a board labelled one-half / one-quarter under '1/3 ka ek part dikhaiye' (game ask, c4-maths-ch05-t01)", () => {
    const b = byCase("game")[0];
    assert.match(fractionsDisagree(b.line, b.script.ops)[0], /1\/2, 1\/4; her line names 1\/3/);
  });
  it("the full gate (wb-gate@3) refuses those boards against their real lines", () => {
    assert.equal(WB_GATE_VERSION, "wb-gate@3");
    for (const c of ["picture", "diagram", "game"]) {
      const b = byCase(c)[0];
      const g = gateWhiteboard(b.script, { reply: b.line });
      assert.equal(g.pass, false, `${c}: ${JSON.stringify(g.checks.filter((x) => !x.pass).map((x) => x.id))}`);
      assert.ok(g.checks.some((x) => !x.pass && /^W1[0-3]/.test(x.id)), `${c} fails on a meaning check`);
    }
  });
  it("boards that do show what she says still pass the meaning checks (draw: the water-cycle labels)", () => {
    const b = byCase("draw")[0];
    assert.deepEqual([...claimsNotDrawn(b.line, b.script.ops), ...placeholderBoard(b.script.ops), ...nextStepRevealed(b.line, b.script.ops), ...fractionsDisagree(b.line, b.script.ops)], []);
  });
});

describe("round3 forge: the other meaning checks", () => {
  it("W11 refuses a medium word ('Screen') and passes a labelled picture", () => {
    assert.match(placeholderBoard([{ id: "a", op: "text", at: [100, 40], text: "Screen" }, { id: "b", op: "text", at: [100, 90], text: "One lakh" }])[0], /medium word/);
    assert.deepEqual(placeholderBoard([{ id: "c", op: "circle", c: [100, 100], r: 60 }, { id: "l", op: "label", at: [200, 60], text: "whole", to: [150, 90] }]), []);
  });
  it("W9+ withholds a current item's long word answer when the board writes it and her line does not", () => {
    const kit = { items: [{ id: "i1", prompt_en: "Write 1,07,040 in words", answer: "one lakh seven thousand forty" }] };
    const w = withheldValues(kit, { itemId: "i1", line: "Is number ko words mein likhiye" });
    assert.deepEqual(w.phrases, ["one lakh seven thousand forty"]);
    const ops = [{ id: "a", op: "text", at: [100, 40], text: "One lakh" }, { id: "b", op: "text", at: [100, 80], text: "Seven thousand" }, { id: "c", op: "text", at: [100, 120], text: "Forty" }];
    assert.equal(longAnswerWritten(w.phrases, ops, "Is number ko words mein likhiye").length, 1);
    assert.equal(longAnswerWritten(w.phrases, ops, "One lakh, seven thousand, forty: ab jodiye").length, 0, "she said it: the board repeats her");
  });
  it("W14 is advisory: an off-line board is reported, never refused", () => {
    const ops = [{ id: "a", op: "text", at: [100, 40], text: "Equator" }, { id: "b", op: "text", at: [100, 90], text: "latitude" }];
    assert.equal(boardOffLine("If 1 cm means 10 km, what does 3 cm mean?", ops).length, 1);
    const g = gateWhiteboard({ v: 1, scriptId: "s", line: { lessonId: "L" }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs: 3000,
      ops: ops.map((o, i) => ({ ...o, size: "m", startMs: 400 + i * 600, endMs: 900 + i * 600 })) }, { reply: "If 1 cm means 10 km, what does 3 cm mean?", extraWords: ["equator", "latitude"] });
    assert.ok(g.advisories.some((a) => a.id === "W14.about_her_line"));
    assert.ok(!g.checks.some((c) => c.id.startsWith("W14")), "W14 is not a check");
  });
});
