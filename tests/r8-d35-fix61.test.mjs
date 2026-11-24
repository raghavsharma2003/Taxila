// Release 61 (director35's one walk fault, three judges and a fourth): to-brain 053 A1's "the hint owns a board" read the card's own posing
// board as the hint's (ownHintOf's `r0.board ?? part.board`), so every card with a board "owned" one. Heard in director35: stuck c6-ch06-t01 18,
// stuck c4-ch06-t01 18, steering c5-ch02-t03 16 (`hintBoard`, the board up kept, nothing new drawn), steering c6-ch07-t01 16 (the picture of
// the turn before taken down, the card's posing board drawn again). A hint owns a board only when the script writes one on the hint itself,
// different from the card's posing board and from the board up, and not the card's answer board. No hint in the nine scripts has one.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pickHelp, addSaid, ownHintOf, helpPart } from "../server/director/help.js";
import { D35A_PREDICATES } from "../evals/hybrid-side-by-side/d35a-predicates.mjs";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-24-director34");
const scriptOf = (t) => JSON.parse(readFileSync(join(RUN, "scripts", `${t}.json`), "utf8"));
const rowsOf = (persona, t) => JSON.parse(readFileSync(join(RUN, `${persona}-${t.replace("-maths-", "-")}.json`), "utf8")).director;
const saidTo = (rows, i) => rows.slice(0, i).reduce((s, r, n) => (r.who === "teacher" ? addSaid(s, r.text, n) : s), []);
const partAt = (rows, i) => String(rows[i].cell.part).replace(/(:worked:step\d+):ask$/, "$1");
const OTHER = { template: "number-line-scale@1", params: { from: 0, to: 20, step: 2, marks: [{ value: 4, label: "4" }] } };

describe("the hint's board at a picture request (release 61)", () => {
  test("(a) a card whose hint has no board of its own: the no-other-drawing line in its first form, then the hint in words — never hintBoard", () => {
    const rows = rowsOf("stuck", "c4-maths-ch06-t01"), script = scriptOf("c4-maths-ch06-t01");
    const part = partAt(rows, 18), said = saidTo(rows, 18);
    const d = pickHelp({ script, part, request: "picture", said, boardUp: helpPart(script, part).board });
    assert.ok(!d.hintBoard);
    assert.equal(d.pictureLine?.text, script.joints.noPicture[0].hi);
    assert.equal(d.rung.path, ownHintOf(script, helpPart(script, part), said).path);
    assert.equal(d.card, "keep"); assert.equal(d.key, null);
    // (a board to say the hint over is not a board it owns)
    const own = ownHintOf(script, helpPart(script, part), said);
    assert.ok(own.board?.template); assert.equal(own.owns, null);
  });
  test("(a) the same at an asked worked step whose easier wording has no board of its own (stuck c6-ch06-t01 18)", () => {
    const rows = rowsOf("stuck", "c6-maths-ch06-t01"), script = scriptOf("c6-maths-ch06-t01");
    const part = partAt(rows, 18);
    const p = helpPart(script, part);
    assert.equal(p.kind, "worked_step");
    const d = pickHelp({ script, part, request: "picture", said: saidTo(rows, 18) });
    assert.ok(!d.hintBoard);
    assert.ok(d.pictureLine?.text);
  });
  test("(b) a card whose hint has its own, different board: hintBoard — that board, the hint its caption, no line", () => {
    const rows = rowsOf("stuck", "c4-maths-ch06-t01"), script = structuredClone(scriptOf("c4-maths-ch06-t01"));
    const e3 = script.skills[0].explain.find((b) => b.id === "e3");
    e3.ask.simpler = { ...e3.ask.simpler, board: OTHER };
    const part = partAt(rows, 18), said = saidTo(rows, 18);
    const d = pickHelp({ script, part, request: "picture", said });
    assert.equal(d.hintBoard, true);
    assert.equal(d.pictureLine, undefined);
    assert.deepEqual(d.rung.board, OTHER);
    assert.deepEqual(ownHintOf(script, helpPart(script, part), said).owns, OTHER);
    // (that board already up when the request comes: nothing new to draw — A3)
    const up = pickHelp({ script, part, request: "picture", said, boardUp: { template: OTHER.template, params: { marks: OTHER.params.marks, step: 2, to: 20, from: 0 } } });
    assert.ok(!up.hintBoard); assert.ok(up.pictureLine?.text);
    // (the hint's own board written as the card's posing board: no board of its own)
    const s2 = structuredClone(scriptOf("c4-maths-ch06-t01"));
    const e3b = s2.skills[0].explain.find((b) => b.id === "e3");
    e3b.ask.simpler = { ...e3b.ask.simpler, board: structuredClone(helpPart(s2, part).board) };
    assert.ok(!pickHelp({ script: s2, part, request: "picture", said }).hintBoard);
    // (the hint's own board is the card's answer board: never drawn)
    const s3 = structuredClone(script);
    s3.skills[0].explain.find((b) => b.id === "e3").ask.answerBoard = structuredClone(OTHER);
    assert.ok(!pickHelp({ script: s3, part, request: "picture", said }).hintBoard);
  });
});

describe("the predicates (release 61)", () => {
  test("hintBoardNothingNew is gated", () => {
    assert.ok(PREDICATES.hintBoardNothingNew); assert.ok(!PENDING.has("hintBoardNothingNew"));
  });
  const script = scriptOf("c4-maths-ch06-t01");
  const rows = rowsOf("stuck", "c4-maths-ch06-t01");
  const part = rows[18].cell.part;
  const posing = helpPart(script, partAt(rows, 18)).board;
  const prevT = { who: "teacher", screen: { kind: "whiteboard", boardRef: { template: "fraction-bars@1", params: { bars: [] } } } };
  const row = (picture, board, drawn = "held") => ({ who: "teacher", text: "x", cell: { part, column: "picture", picture }, held: { drawn }, screen: { kind: "whiteboard", boardRef: board } });
  const N = (r) => D35A_PREDICATES.hintBoardNothingNew({ rows: [prevT, r] }, r, 1, { prevT, script });
  test("hintBoardNothingNew: kept, the board up, the card's posing board → flagged; a new board → not; another picture kind → not", () => {
    assert.ok(N(row("hintBoard", prevT.screen.boardRef, "kept")));
    assert.ok(N(row("hintBoard", { template: "fraction-bars@1", params: { bars: [] } })));
    assert.ok(N(row("hintBoard", structuredClone(posing))));
    assert.equal(N(row("hintBoard", OTHER)), null);
    assert.equal(N(row("view", prevT.screen.boardRef, "kept")), null);
  });
  test("hintBoardNotDrawn: the line said with a hint said over the card's board → not flagged; with a hint that owns a board → flagged", () => {
    const line = { who: "teacher", text: script.joints.noPicture[0].hi, cell: { part, column: "picture", picture: "hint" } };
    const L = { rows: [...rows.slice(0, 18), line] };
    const ctx = (s) => ({ prevT: rows.slice(0, 18).reverse().find((x) => x.who === "teacher"), script: s });
    assert.equal(D35A_PREDICATES.hintBoardNotDrawn(L, line, 18, ctx(script)), null);
    const s = structuredClone(script);
    const e3 = s.skills[0].explain.find((b) => b.id === "e3");
    e3.ask.simpler = { ...e3.ask.simpler, board: OTHER };
    assert.ok(D35A_PREDICATES.hintBoardNotDrawn(L, line, 18, ctx(s)));
  });
});
