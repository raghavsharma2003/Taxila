// Round 7 F, learning-parent-teaching-page: "How {T} teaches {child}" lines from brain_trace's closed codes through a
// fixed lexicon (server/reports/teaching.js). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { APPROACH, ASKED, MAX_LINES, whyLines } from "../server/reports/teaching.js";
import { FAMILIES } from "../server/brain/reasons.js";
import { bannedHits, lockedHits } from "../server/reports/lexicon.js";

const x = { name: "Riya", T: "Asha" };
const row = (move, reasons = [], mis = null) => ({ move, reasons, misconception_id: mis });

test("a lesson's lines: the child's requests first, then the moves, fixed priority, ≤ 4", () => {
  const rows = [row("explain", ["request.slower"]), row("reteach", ["move.reteach"], "m1"), row("reteach"), row("hint"), row("worked_example"),
    row("teachback"), row("practice", ["request.visual"]), row("explain", ["request.slower"])];
  const lines = whyLines(rows, x);
  assert.equal(lines.length, MAX_LINES);
  assert.deepEqual(lines.map((l) => l.code), ["request.slower", "request.visual", "move.reteach", "move.worked_example"]);
  assert.equal(lines[0].text, "Riya asked for a slower pace (twice), and Asha did that.");
  assert.equal(lines[2].text, "Asha explained an idea a second way twice, after an answer that fitted a common mix-up.");
});

test("nothing to say → no lines; unknown codes and moves are ignored", () => {
  assert.deepEqual(whyLines([row("explain"), row("practice", ["request.nonsense", "turn.late"])], x), []);
});

test("every request it words is a real closed code, and every line passes the report lexicon (no trait, label or mastery word)", () => {
  for (const t of Object.keys(ASKED)) assert.ok(FAMILIES.request.includes(t), `request.${t} is not in reasons.js`);
  const all = [...APPROACH];
  for (const t of Object.keys(ASKED)) all.push(...whyLines([row("explain", [`request.${t}`]), row("explain", [`request.${t}`])], x).map((l) => l.text));
  for (const m of ["reteach", "worked_example", "hint", "teachback", "show_module", "retrieval", "break"]) {
    for (const k of [1, 3]) all.push(...whyLines(Array.from({ length: k }, () => row(m, [], m === "reteach" ? "m1" : null)), x).map((l) => l.text));
  }
  for (const s of all) {
    assert.deepEqual(bannedHits(s), [], s);
    assert.deepEqual(lockedHits(s), [], s);
  }
});
