// round 7 (C1 studio-board-richness): a labelled diagram for a kit that is ABOUT a thing's parts (label-pick.js), each
// label the kit's own word on a leader line to the part it names, and every anchor ON a drawn part (the old plant sketch
// pointed "fruit" at a leaf: no fruit was drawn).
import { test } from "node:test";
import assert from "node:assert/strict";
import { labelCall } from "../server/forge/explainer/label-pick.js";
import { expand } from "../server/forge/explainer/templates.js";
import { explainerFor } from "../server/forge/explainer/lesson.js";
import { retime } from "../server/stagecraft/board-sync.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";
import { opGeometry } from "../shared/whiteboard.js";

test("a kit about a plant's parts gets the plant; a kit that only mentions leaves and soil does not", () => {
  const plant = labelCall({ expectations: ["A plant has roots, a stem, leaves, flowers and fruits."] });
  assert.equal(plant.sketch, "plant");
  assert.deepEqual(plant.labels.map((l) => l.text), ["root", "stem", "leaf", "flower", "fruit"]);
  assert.equal(labelCall({ expectations: ["Kinds of waste: flowers, leaves and soil can be composted at home."] }), null, "no stem, no root: not a plant diagram");
  const flower = labelCall({ expectations: ["In a flower the petals attract insects; stamens and the pistil are the reproductive parts."] });
  assert.equal(flower.sketch, "flower");
  assert.deepEqual(flower.labels.map((l) => l.anchor), ["petal", "stamen", "pistil"]);
});

test("c3 'Parts of a plant': the explain rung draws the labelled plant, every label's anchor sits on a drawn part, the gates pass", () => {
  const kit = kitFromFile(getTopic("c3-evs-ch04-t01"));
  const ex = explainerFor({ lessonId: "L", kit, band: "B3" });
  assert.equal(ex?.template, "label@1");
  const call = labelCall(kit);
  const x = expand(call, { band: "B3" });
  assert.ok(x.ok, x.errors?.join(","));
  // every leader line ends on a drawn op of the sketch (its box, a few units of slack)
  const sketch = x.script.ops.filter((o) => /^k\d+$/.test(o.id));
  const boxes = sketch.map((o) => opGeometry(o).box);
  // a label op carries its own leader, from the word to `to` (its anchor)
  const labels = x.script.ops.filter((o) => o.op === "label");
  assert.equal(labels.length, call.labels.length);
  for (const l of labels) {
    assert.ok(Array.isArray(l.to), `${l.text} has a leader`);
    const on = boxes.some((b) => l.to[0] >= b.x - 4 && l.to[0] <= b.x + b.w + 4 && l.to[1] >= b.y - 4 && l.to[1] <= b.y + b.h + 4);
    assert.ok(on, `"${l.text}" points at ${JSON.stringify(l.to)}, on a drawn part`);
  }
  const fruitAt = [176, 160];
  const fruit = sketch.find((o) => o.op === "circle" && Math.hypot(o.c[0] - fruitAt[0], o.c[1] - fruitAt[1]) <= o.r);
  assert.ok(fruit, "the fruit's anchor is inside the drawn fruit");
  const line = "Dekho is plant ko: " + call.labels.map((l) => l.text).join(", ") + ".";
  const g = gateWhiteboard(retime(x.script, x.script.durationMs, 7000), { reply: line, speechMs: 7000 });
  assert.equal(g.pass, true, JSON.stringify(g.checks.filter((c) => !c.pass)));
});
