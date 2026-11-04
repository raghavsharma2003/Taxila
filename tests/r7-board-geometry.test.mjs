// round 7 (C1 studio-board-richness, geometry by constraint): a shape the kit states with its measures is drawn TO SCALE
// (measured@1): a rectangle's sides in the kit's ratio, a triangle built from its three sides (an impossible one refused),
// a circle with its radius; every measure written outside the shape so no label meets a line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { measuredCall } from "../server/forge/explainer/geometry.js";
import { expand } from "../server/forge/explainer/templates.js";
import { explainerFor } from "../server/forge/explainer/lesson.js";
import { retime } from "../server/stagecraft/board-sync.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";

test("the kit's stated shapes are read with their measures; units must agree", () => {
  assert.deepEqual(measuredCall({ expectations: ["A rectangle 8 cm by 5 cm has perimeter 26 cm."] }), { template: "measured@1", from: "lesson", shape: "rect", w: 8, h: 5, unit: "cm", name: true, trace: true }, "a perimeter lesson's rectangle is named and walked round");
  assert.deepEqual(measuredCall({ expectations: ["The triangle has sides 3 cm, 4 cm and 5 cm."] }), { template: "measured@1", from: "lesson", shape: "triangle", sides: [3, 4, 5], unit: "cm", name: true });
  assert.deepEqual(measuredCall({ expectations: ["A circle has radius 7 cm."] }), { template: "measured@1", from: "lesson", shape: "circle", r: 7, unit: "cm", name: true });
  assert.equal(measuredCall({ expectations: ["A rectangle 8 cm by 5 m."] }), null, "mixed units: not drawn to a wrong scale");
});

test("to scale: a rectangle's sides keep the kit's ratio, a triangle's sides keep theirs; an impossible triangle is refused", () => {
  const r = expand({ template: "measured@1", shape: "rect", w: 8, h: 5, unit: "cm" }).script.ops.find((o) => o.op === "rect");
  assert.ok(Math.abs(r.w / r.h - 8 / 5) < 0.01, `${r.w} / ${r.h}`);
  const t = expand({ template: "measured@1", shape: "triangle", sides: [3, 4, 5], unit: "cm" }).script.ops.find((o) => o.op === "polygon").points;
  const len = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const ls = [len(t[0], t[1]), len(t[1], t[2]), len(t[0], t[2])].sort((a, b) => a - b);
  assert.ok(Math.abs(ls[0] / ls[2] - 3 / 5) < 0.01 && Math.abs(ls[1] / ls[2] - 4 / 5) < 0.01, JSON.stringify(ls));
  assert.equal(expand({ template: "measured@1", shape: "triangle", sides: [2, 3, 9], unit: "cm" }).ok, false, "2 + 3 < 9");
});

test("c5 perimeter: the explain rung draws the kit's rectangle to scale and it passes every W gate", () => {
  const kit = kitFromFile(getTopic("c5-maths-ch11-t02"));
  const ex = explainerFor({ lessonId: "L", kit, band: "B3" });
  assert.equal(ex?.template, "measured@1");
  const said = Object.values(ex.facts.onScreen).join(", ");
  const g = gateWhiteboard(retime(ex.params.script, ex.params.script.durationMs, 6000), { reply: `Dekho, ${said}.`, speechMs: 6000 });
  assert.equal(g.pass, true, JSON.stringify(g.checks.filter((c) => !c.pass)));
});
