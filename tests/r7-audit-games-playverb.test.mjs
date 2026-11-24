// Audit PLAT-15, the games side: the parent's play wording switch (O-G4). server/play/dress.js withVerb reads
// child_controls.play_verb (migration 042, platform's) on the play routes; the parent's Controls write it through
// POST /api/parent/controls { playVerb }. These checks hold the validation and the read rule to one definition. No DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mergeControls } from "../server/routes/parent.js";
import { verbFor } from "../server/play/dress.js";

const base = { dailyMinutes: 30, hoursStart: "16:00", hoursEnd: "19:00", captionsAlways: false, comfortMode: false, address: null, reportChannel: "app", playVerb: "fire" };

test("parent controls: playVerb takes fire or scan and nothing else; leaving it out keeps the current value", () => {
  assert.equal(mergeControls(base, { playVerb: "scan" }).playVerb, "scan");
  assert.equal(mergeControls(base, { playVerb: "fire" }).playVerb, "fire");
  assert.equal(mergeControls({ ...base, playVerb: "scan" }, { comfortMode: true }).playVerb, "scan");
  for (const bad of ["shoot", "", null, 1]) assert.throws(() => mergeControls(base, { playVerb: bad }), /fire or scan/);
});

test("the play routes read the parent's choice, else the operator default; the setting reaches the screen and the API", () => {
  assert.equal(verbFor({ play_verb: "scan" }, {}), "scan");
  assert.equal(verbFor({ play_verb: null }, { TAXILA_PLAY_VERB: "scan" }), "scan");
  assert.equal(verbFor(null, {}), "fire");
  const parent = readFileSync(new URL("../server/routes/parent.js", import.meta.url), "utf8");
  assert.match(parent, /update child_controls set play_verb = \$2 where child_id = \$1/);
  const screen = readFileSync(new URL("../src/parent/Controls.tsx", import.meta.url), "utf8");
  assert.match(screen, /Words in the 3D games/);
});
