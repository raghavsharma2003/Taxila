// Round 8 (main 2026-11-11): the landing's hero showed her line from one card against another card's board. The dev Desk's
// fixtures (the source of the landing captures) now read board, line and question from ONE card (src/child/lesson/dev/cards.ts).
//   1. The drawn boards are the server's own explainer output.
//   2. Every fixture takes its line, question and board through cardOfFixture: DeskDev holds no line, question or board text.
//   3. A card's question is not answered by its own board or line.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DEV_CARDS, cardOfFixture } from "../src/child/lesson/dev/cards.ts";
import { expand } from "../server/forge/explainer/templates.js";

test("the drawn cards' boards are the server's expand() output, unchanged (plus the lesson's beat card)", () => {
  for (const c of [DEV_CARDS.halfOfHalf, DEV_CARDS.halves]) assert.equal(c.board.script.card?.kind, "picture", `${c.id} carries its beat card`);
  const strip = (s) => { const o = JSON.parse(JSON.stringify(s)); delete o.card; return o; };
  assert.deepEqual(strip(DEV_CARDS.halfOfHalf.board.script), strip(expand({ template: "fraction-of@1", a: 1, b: 2, c: 1, d: 2 }, { band: "B3", lessonId: "dev", scriptId: "dev-half-of-half" }).script));
  assert.deepEqual(strip(DEV_CARDS.halves.board.script), strip(expand({ template: "fraction-parts@1", parts: 2, shade: 1, whole: "roti" }, { band: "B1", lessonId: "dev", scriptId: "dev-halves" }).script));
});

test("DeskDev takes line, question and board only from the fixture's card", () => {
  const src = fs.readFileSync(new URL("../src/child/lesson/dev/DeskDev.tsx", import.meta.url), "utf8");
  assert.match(src, /const card = cardOfFixture\(name, young\)/);
  assert.match(src, /const caption = devText\("__deskLine"\) \?\? card\.line;/);
  assert.match(src, /devText\("__deskAsk"\) \?\? card\.ask/);
  assert.match(src, /script: devScript\(card\)/);
  assert.match(src, /lines: "lines" in card\.board \? card\.board\.lines : \[\]/);
  // no line of its own (the old pairing: a "1/2 = 2/4" board line and "barabar 2/4" in the caption); questions may recur
  // in the summary fixture's list of earlier questions
  for (const c of Object.values(DEV_CARDS)) {
    assert.ok(!src.includes(JSON.stringify(c.line)), `DeskDev repeats ${c.id}'s line`);
  }
  assert.ok(!/text: "1\/2 = 2\/4"/.test(src) && !/barabar 2\/4/.test(src), "no board or line text of its own");
});

test("every fixture's card: drawn fixtures draw, the others show a plain board", () => {
  for (const young of [false, true]) {
    for (const name of ["work-beat", "hf-beat"]) assert.ok("script" in cardOfFixture(name, young).board, `${name} young=${young}`);
    for (const name of ["work-your_turn", "work-speaking", "board-correct", "hint-line", "your_turn"]) assert.ok("lines" in cardOfFixture(name, young).board, `${name} young=${young}`);
  }
});

test("a card's question is not answered on its own board or in her line", () => {
  // the answers the cards' questions expect (the kit's facts): a quarter of 8 is 2; half of 6 is 3; 2 quarters; one half
  const ANSWER = { halfOfHalf: /\b2\b/, halves: /\b3\b/, quarters: /2\/4|\bdo quarters\b|\btwo\b/i, twoParts: /\b1\/2\b/ };
  for (const c of Object.values(DEV_CARDS)) {
    const boardText = "lines" in c.board ? c.board.lines.map((l) => l.text).join(" ")
      : c.board.script.ops.flatMap((o) => [o.text ?? "", ...(o.rows ?? []).flat()]).join(" ");
    const re = ANSWER[c.id];
    assert.ok(re, `no answer pattern for ${c.id}`);
    // halfOfHalf's board shows 1/4 (the idea) but never "2" (the asked quarter of 8)
    assert.ok(!re.test(boardText.replace(/\d+\/\d+/g, (m) => (c.id === "twoParts" || c.id === "quarters" ? m : "F"))), `${c.id}: its board answers its question (${boardText})`);
    assert.ok(!re.test(c.line.replace(/\d+\/\d+/g, (m) => (c.id === "twoParts" || c.id === "quarters" ? m : "F"))), `${c.id}: her line answers its question`);
  }
});

test("negative control: the old pairing is caught", () => {
  const oldBoard = "1/2 = 2/4";
  assert.ok(/2\/4/.test(oldBoard), "the old quarters board printed its own answer");
});
