// dc-r8-director25 harness (docs/patches/to-brain/039, "The harness"): three flags the run raised that the judges found false, each checked
// on its own recorded row. c4 offtopic 26: a view was drawn and its authored caption is true (contradictionsV6 by the picture check, which
// did not know the strips view). c5-t01 stuck 78: an imagined smaller case ("1 mark ho toh 2 gaps") was read as a count of the board.
// c5-t02 steady 100: "1/4 aur 2/8 ek hi jagah hain", the card's authored simpler, was a false key because the move's simpler was not
// among the text a stated answer may come from.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pictureMismatch, imaginedOut, falseAnswerNumbers, answerGiven } from "../evals/hybrid-side-by-side/checks.mjs";
import { screenContradictions, screenFacts } from "../server/brain/say.js";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-16-director25");
const rowOf = (f, i) => JSON.parse(readFileSync(join(RUN, f), "utf8")).director[i];
const scriptOf = (topic) => JSON.parse(readFileSync(join(RUN, "scripts", `${topic}.json`), "utf8"));

test("c4 offtopic 26: a caption over the strips view it drew is no picture mismatch", () => {
  const r = rowOf("offtopic-c4-ch05-t01.json", 26);
  assert.equal(r.gate.contradictionsV6, 1, "the run flagged it");
  assert.equal(r.held.picture.view, "strips");
  assert.deepEqual(pictureMismatch(r.text, r.boardRef, r.held.picture.view), []);
});

test("c5-t01 stuck 78: an imagined smaller case is not checked against the board", () => {
  const r = rowOf("stuck-c5-ch02-t01.json", 78);
  assert.equal(r.gate.contradictionsV6, 1, "the run flagged it");
  const facts = screenFacts({ studioSlot: { artifact: { kind: "whiteboard", screen: r.screen } } }, { scriptBeat: { board: r.boardRef } });
  assert.ok(screenContradictions(r.text, facts).length > 0, "her whole line still reads as a contradiction (the check is unchanged)");
  assert.deepEqual(screenContradictions(imaginedOut(r.text), facts), []);
  // (a count stated of the board itself is still checked: "10 marks ke 11 gaps" stays)
  assert.match(imaginedOut(r.text), /10 marks ke 11 gaps/);
});

test("c5-t02 steady 100: the card's authored simpler is text a stated answer may come from", () => {
  const r = rowOf("steady-c5-ch02-t02.json", 100), child = rowOf("steady-c5-ch02-t02.json", 99).text;
  assert.equal(r.gate.falseKeys, 1, "the run flagged it");
  assert.deepEqual(r.gate.statedFalse, ["2/8"]);
  const s = scriptOf("c5-maths-ch02-t02");
  const e4 = s.skills[2].explain[3];
  const keys = new Set((s.skills ?? []).flatMap((sk) => [...(sk.explain ?? []).map((b) => b.ask), sk.workedExample?.yourStep, ...(sk.checks ?? []), ...(sk.remediation ?? []).map((m) => m.then)])
    .filter(Boolean).flatMap((a) => [a.key, ...(a.accept ?? [])]).map((k) => String(k).trim().toLowerCase()));
  // (the simpler said on that row is the card's point's simpler — the move's simpler)
  const simpler = e4.simpler.hi;
  assert.ok(r.text.includes("1/4 aur 2/8 ek hi jagah hain"));
  assert.ok(simpler.includes("1/4 aur 2/8 ek hi jagah hain"), "the sentence is authored");
  const before = falseAnswerNumbers(r.text, { keys, given: answerGiven({ card: r.card, text: child, move: {} }) });
  assert.deepEqual(before, ["2/8"], "without the move's simpler, as the run counted");
  assert.deepEqual(falseAnswerNumbers(r.text, { keys, given: answerGiven({ card: r.card, text: child, move: { simpler } }) }), []);
});
