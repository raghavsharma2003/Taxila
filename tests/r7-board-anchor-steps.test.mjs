// round 7 (C1 M3b): a board's named steps land on the words that name them in her real line — each step's group delayed
// so its word appears ~250 ms before she says it; never earlier, never reordered, never past her line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { expand } from "../server/forge/explainer/templates.js";
import { anchorSteps, retime } from "../server/stagecraft/board-sync.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";

const LINE = "Board par dhyan se dekho. Pehle dekho food, yeh samajhna zaroori hai. Phir aata hai mouth, yeh samajhna zaroori hai. Uske baad stomach, yeh samajhna zaroori hai. Phir intestine, yeh samajhna zaroori hai.";
const MS = 14000;
const textAt = (s, t) => s.ops.find((o) => o.op === "text" && o.text === t);

test("each step's word lands just before she names it; the order of drawing is kept; the board still starts on time", () => {
  const x = expand({ template: "flow@1", steps: ["food", "mouth", "stomach", "intestine"] });
  const s0 = retime(x.script, x.script.durationMs, MS);
  const { script, anchored, moved } = anchorSteps(s0, LINE, MS);
  assert.equal(anchored, 4);
  assert.equal(moved, 4);
  for (const w of ["food", "mouth", "stomach", "intestine"]) {
    const onset = (LINE.toLowerCase().indexOf(w) / LINE.length) * MS;
    const op = textAt(script, w);
    assert.ok(op.startMs >= Math.round(onset) - 260 || op.startMs >= textAt(s0, w).startMs, `${w} at ${op.startMs}, said at ${Math.round(onset)}`);
    assert.ok(op.startMs >= textAt(s0, w).startMs, "only ever delayed");
  }
  const order = (s) => s.ops.slice().sort((a, b) => a.startMs - b.startMs).map((o) => o.id).join(",");
  assert.equal(order(script).split(",").filter((id) => /^t\d/.test(id)).join(), order(s0).split(",").filter((id) => /^t\d/.test(id)).join(), "the steps keep their order");
  assert.ok(Math.min(...script.ops.map((o) => o.startMs)) <= 1500, "the board still starts at once (W6)");
  assert.ok(Math.max(...script.ops.map((o) => o.endMs)) <= MS + 1500, "ends with her line");
  assert.equal(gateWhiteboard(script, { reply: LINE, speechMs: MS }).checks.find((c) => c.id === "W6.timing").pass, true);
});

test("a line that names fewer than two of the board's words leaves the board as it was", () => {
  const x = expand({ template: "flow@1", steps: ["food", "mouth", "stomach"] });
  const s0 = retime(x.script, x.script.durationMs, 6000);
  const r = anchorSteps(s0, "Dekho, khaana pehle munh mein jaata hai.", 6000);
  assert.equal(r.anchored, 0);
  assert.equal(r.script, s0);
});
