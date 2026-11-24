// round 7 (C1 studio-board-richness): a table whose cells are COMPUTED from what the kit names ("the 7 times table",
// "y = 3x + 5" in a linear-pattern lesson), never a unit ("h = 20 m") or a proof step ("p = 2k") read as a rule; and on a
// phone the stage keeps every piece clear of the teacher's PiP (D7 stage-first, the box contract's pipZone).
import { test } from "node:test";
import assert from "node:assert/strict";
import { tableCall } from "../server/forge/explainer/table.js";
import { expand } from "../server/forge/explainer/templates.js";
import { explainerFor } from "../server/forge/explainer/lesson.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";
import { readPipZone, intoStage } from "../src/studio/pipZone.ts";

test("cells are computed: a times table and a linear rule's values; units, proof steps and 'a table FOR x' are not rules", () => {
  const t7 = tableCall({ items: [{ hints: ["Say the 7 times table."] }] });
  assert.deepEqual(t7.rows.slice(0, 3), [["1", "7"], ["2", "14"], ["3", "21"]]);
  assert.equal(t7.rows.length, 10);
  const lin = tableCall({ expectations: ["Linear patterns: the rule y = 3x + 5 gives the next term."] });
  assert.equal(lin.rule, "y = 3x + 5");
  assert.deepEqual(lin.rows, [["0", "5"], ["1", "8"], ["2", "11"], ["3", "14"], ["4", "17"]]);
  assert.equal(tableCall({ expectations: ["Convert: h = 20 m and 1 m = 100 cm."] }), null, "a unit is not a rule");
  assert.equal(tableCall({ expectations: ["Suppose p = 2k, then p² = 4k²."] }), null, "a proof step is not a rule");
  assert.equal(tableCall({ items: [{ prompt_hi: "x + y = 4 ke liye x = 0, 1, 2 ki table banao." }] }), null, "a table FOR x, not the table of 2");
});

test("c9 linear patterns: the explain rung draws the computed table and it passes every W gate", () => {
  const kit = kitFromFile(getTopic("c9-maths-ch02-t02"));
  const ex = explainerFor({ lessonId: "L", kit, band: "B3" });
  assert.equal(ex?.template, "table@1");
  assert.equal(ex.facts.onScreen.rule, "y = 3x + 5");
  assert.equal(ex.facts.onScreen.row2, "1 | 8");
  const g = gateWhiteboard(ex.params.script, { reply: "y = 3x + 5: x 0 par y 5, 1 par 8, 2 par 11, 3 par 14, 4 par 17.", speechMs: 8000 });
  assert.equal(g.pass, true, JSON.stringify(g.checks.filter((c) => !c.pass)));
  assert.equal(expand({ template: "table@1", head: ["x"], rows: [["1"]] }).ok, false, "one column is no table");
  assert.equal(expand({ template: "table@1", head: ["x", "y"], rows: [["1", "a very long cell"]] }).ok, false, "a cell too long fails, never squeezed");
});

test("the PiP zone is read LIVE from App's slot: its box while it shows, nothing when it is 'none' or absent", () => {
  const slot = (zone, vars = {}) => ({ getAttribute: (n) => (n === "data-pip-zone" ? zone : null), style: { getPropertyValue: (n) => vars[n] ?? "" } });
  const on = slot("bottom-right", { "--pip-zone-w": "103px", "--pip-zone-h": "103px", "--pip-zone-right": "8px", "--pip-zone-bottom": "8px" });
  assert.deepEqual(readPipZone(on, { w: 396, h: 623 }), { x: 396 - 8 - 103, y: 623 - 8 - 103, w: 103, h: 103 });
  assert.equal(readPipZone(slot("none"), { w: 396, h: 623 }), null, "her face holds the stage / a wide screen / keyboard up");
  assert.equal(readPipZone(null, { w: 396, h: 623 }), null, "no slot element: nothing reserved");
  assert.equal(readPipZone(slot("bottom-right", { "--pip-zone-w": "103px" }), { w: 396, h: 623 }), null, "a half-written zone is ignored");
  // into the stage's own coordinates (the stage sits 4 px right and 10 px down inside the slot)
  assert.deepEqual(intoStage({ x: 285, y: 512, w: 103, h: 103 }, { left: 8, top: 52 }, { left: 12, top: 62 }), { x: 281, y: 502, w: 103, h: 103 });
});
