// r7 audit, parent corner words: LEARN-14 (the Notes drawer read results with its own sets, so a second-try answer was
// "partly" there and "right" on the skill sheet), LEARN-15 (a right answer after asking for help read "Right, on their
// own"), LEARN-17 (Teaching told the parent "You thought …"). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { drawerResult } from "../server/routes/parent.js";
import { engineRow } from "../server/reports/truth.js";

const row = (cls, outcome, o = {}) => ({ id: "L:3:0", seq: 1, session_id: "L", occurred_at: "2026-11-01T10:00:00Z", skill_ids: ["s"], cls, outcome, grader: "code", ...o });

test("LEARN-14: the drawer and the skill sheet read the same answer the same way", () => {
  assert.deepEqual(drawerResult(row("item.open", 1)), { result: "right", help: "none" }, "C1, a second try with no hint");
  assert.equal(engineRow(row("item.open", 1)).result, "right");
  assert.deepEqual(drawerResult(row("item.open", 2)), { result: "right", help: "hint" }, "C2, one hint");
  assert.deepEqual(drawerResult(row("item.open", 0, { pre_attempt_help: true })), { result: "right", help: "asked_first" });
  assert.deepEqual(drawerResult(row("item.open", 4)), { result: "not_yet", help: "hint" });
  assert.deepEqual(drawerResult(row("item.open", 5)), { result: "not_sure", help: "none" }, "IDK");
  assert.deepEqual(drawerResult(row("teach", -1, { teach: true })), { result: "taught", help: "none" });
});

test("LEARN-15: a right answer with help sends the hinted result word to the skill sheet", () => {
  const src = readFileSync(new URL("../server/routes/parent.js", import.meta.url), "utf8");
  assert.match(src, /result: r\.result === "right" && r\.hintsUsed > 0 \? "right_hint" : r\.result/);
  assert.equal(engineRow(row("item.open", 0, { pre_attempt_help: true })).hintsUsed, 1);
});

test("LEARN-17: Home and Teaching word a Made-for reason the same way", async () => {
  const { becauseForParent } = await import("../src/parent/copy.ts");
  assert.equal(becauseForParent("You thought 3/4 was smaller than 1/2", "Riya"), "Riya thought 3/4 was smaller than 1/2");
  for (const f of ["Teaching.tsx", "Home.tsx"]) {
    assert.match(readFileSync(new URL(`../src/parent/${f}`, import.meta.url), "utf8"), /becauseForParent\(/, f);
  }
});
