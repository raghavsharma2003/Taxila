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
import { pipZoneFor } from "../src/studio/pipZone.ts";

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

test("the PiP zone: inside the slot on a phone (portrait or turned), none on a desk (even a short tray)", () => {
  assert.equal(pipZoneFor({ w: 396, h: 623 }, { w: 412, h: 915 }), 103 + 8);
  assert.equal(pipZoneFor({ w: 344, h: 508 }, { w: 360, h: 800 }), 89 + 8);
  assert.equal(pipZoneFor({ w: 760, h: 300 }, { w: 800, h: 360 }), 84 + 8, "a phone turned on its side");
  assert.equal(pipZoneFor({ w: 850, h: 656 }, { w: 1280, h: 800 }), 0, "the wide grid: her tile is beside the slot");
  assert.equal(pipZoneFor({ w: 752, h: 408 }, { w: 1366, h: 768 }), 0, "a desk's short tray has no PiP in it");
  assert.equal(pipZoneFor({ w: 396, h: 623 }, null), 0, "no window (server): nothing reserved");
});
