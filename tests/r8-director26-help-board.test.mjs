// dc-r8-director26 B1 (docs/patches/to-brain/040): a help wording's board is the one the help function returned, on every path. A
// remediation's help is said over the remediation's own board; with none of its own it keeps the board that is up; it never borrows a
// card's. The page builder (brain/propose.js heldOf) takes a help turn's board from the help decision (move.help.board) and throws in a
// test or a dry run where a help page's board is not that one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickHelp, helpPart } from "../server/director/help.js";
import { heldOf, helpBoardPredicate } from "../server/brain/propose.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { scriptFor, setScriptForTest } from "../server/director/script.js";
import { readFileSync } from "node:fs";
import { replay } from "./fixtures/replay.mjs";

const T = "c4-maths-ch05-t01";
const clone = (x) => structuredClone(x);
const scriptOf = () => clone(scriptFor(kitFromFile(getTopic(T))).script);

test("pickHelp: a remediation with no board of its own returns board null (the board up stays), never its card's", () => {
  const s = scriptOf();
  const sk = s.skills[0];
  const i = sk.remediation.findIndex((r) => sk.checks.some((c) => c.targets === r.targets && c.board));
  assert.ok(i >= 0, "a remediation whose mix-up a check card targets");
  delete sk.remediation[i].board;
  for (const f of ["sayAlt", "simpler"]) if (sk.remediation[i][f] && typeof sk.remediation[i][f] === "object") delete sk.remediation[i][f].board;
  const part = `${sk.skillId}:rem:${i}`;
  assert.equal(helpPart(s, part).board, null, "no borrowed board");
  const d = pickHelp({ script: s, part, request: "give_up", said: [] });
  assert.equal(d.rung.field, "sayAlt");
  assert.equal(d.board, null, "the decision keeps the board up");
  assert.equal(d.rung.board, null);
});

test("pickHelp: a remediation with a board of its own (Learning 015) returns that board", () => {
  const s = scriptOf();
  const sk = s.skills[0];
  const own = { template: "fraction-bars@1", params: { bars: [{ parts: 5, shade: 2, label: "" }] } };
  sk.remediation[1].board = own;
  // (a wording with no board of its own is said over its remediation's)
  for (const f of ["sayAlt", "simpler"]) if (sk.remediation[1][f] && typeof sk.remediation[1][f] === "object") delete sk.remediation[1][f].board;
  const d = pickHelp({ script: s, part: `${sk.skillId}:rem:1`, request: "clarify", said: [] });
  assert.deepEqual(d.board, own);
});

test("director26 c4 steering 12, walked live: the give-up on rem:1 is said over the remediation's own board, or the board up — never s1 c2's", async () => {
  // (d29 final: the pilot as director28 ran it — main's shorter beforeRemediation forms now let the remediation and its card share a turn, so
  // the replay of director26's row 12 finds the then-card live; the rule held here is the board of help on a remediation)
  const sc = JSON.parse(readFileSync(new URL(`./fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28/scripts/${T}.json`, import.meta.url), "utf8"));
  delete sc.recordedRun; setScriptForTest(T, sc);
  let kit, plans;
  try { ({ kit, plans } = await replay("2026-11-17-director26", "steering", T, 13)); } finally { setScriptForTest(); }
  const last = plans.at(-1);
  const move = last.p.r.state.lastMove;
  assert.equal(move.help?.part, "c4-maths-ch05-t01-s1:rem:1", "the help is on the remediation");
  const sk = scriptFor(kit).script.skills[0];
  const rem = sk.remediation[1];
  const c2 = sk.checks.find((c) => c.targets === rem.targets);
  const rungB = rem[move.help.rung]?.board ?? null;
  assert.deepEqual(move.help.board ?? null, rungB ?? rem.board ?? null, "the move carries the decision's board (the wording's, else the remediation's)");
  // (the board up: the then-card's, as row 10 ended)
  const up = { board: rem.then.board, unit: `${sk.skillId}:rem:${rem.targets}` };
  const ask = last.p.r.ui?.ask?.text ?? "";
  const list = [{ part: "simpler", text: move.simpler }, ...(ask ? [{ part: "card", text: ask }] : [])];
  const line = list.map((p) => p.text).join(" ");
  const h = heldOf({ move, list, line, kit, up });
  const wantB = rungB ?? rem.board ?? up.board;
  assert.deepEqual(h.switchTo && 0 >= h.switchTo.atChar ? h.switchTo.board : h.board, wantB, "her first words are over the wording's or remediation's board, or the board up");
  assert.notDeepEqual(h.board, c2.board, "never the check card's board");
});

test("the page builder throws where a help page's board is not the one help returned", () => {
  const want = { template: "fraction-bars@1", params: { bars: [{ parts: 4, shade: 2, label: "" }] } };
  const other = { template: "fraction-parts@1", params: { parts: 12, shade: 0, whole: "bar" } };
  const move = { kind: "reteach", help: { part: "x:rem:1", request: "give_up", card: "wait", board: null } };
  const offs = [{ part: "simpler", start: 0, text: "Ek paratha socho." }];
  assert.throws(() => helpBoardPredicate({ board: other, unit: "u" }, move, offs, { up: { board: want, unit: "u2" }, text: "Ek paratha socho." }), /B1/);
  assert.doesNotThrow(() => helpBoardPredicate({ board: want, unit: "u2" }, move, offs, { up: { board: want, unit: "u2" } }));
  const own = { ...move, help: { ...move.help, board: want } };
  assert.throws(() => helpBoardPredicate({ board: other, unit: "u" }, own, offs, { up: { board: other } }), /B1/);
  // (a switch: the simpler said after the switch is over the switch's board)
  assert.doesNotThrow(() => helpBoardPredicate({ board: other, unit: "u", switchTo: { board: want, atChar: 0 } }, own, offs, {}));
});

test("partOffBeat means a part said over a board that is not its beat's (not a beat name that differs on the same figure)", async () => {
  const { drawnContradictions } = await import("../evals/hybrid-side-by-side/drawn-pages.mjs");
  const A = { template: "measured@1", params: { shape: "rect", unit: "m", w: 12, h: 5 } }, B = { template: "measured@1", params: { shape: "rect", unit: "m", w: 40, h: 25 } };
  const text = "Ek dhaage se rectangle ka poora kinaara banao, phir dhaage ko beech se mod do. Cheenti kitne metre chali?";
  const row = (pageBoard, boards) => ({ who: "teacher", text, screen: { kind: "whiteboard", boardRef: pageBoard, pages: [{ from: 0, board: pageBoard, beat: "c1" }] },
    pageParts: [{ part: "simpler", from: 0, beat: "rem:x", boards }] });
  assert.equal(drawnContradictions(row(B, [A]), null, null).partOffBeat, 1, "a remediation's wording over a card's board");
  assert.equal(drawnContradictions(row(A, [A]), null, null).partOffBeat, 0, "its own board under another beat's name is no fault");
  assert.equal(drawnContradictions(row(B, []), null, null).partOffBeat, 0, "no board recorded for the part (the board up): nothing to check");
});
