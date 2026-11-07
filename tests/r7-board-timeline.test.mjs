// round 7 (C1 studio-board-richness): a true-scale timeline from the kit's own dated chains ("label (year)"), drawn across
// (≤ 4 events, labels alternating above/below) or down (5-6 events, one row each), every label spread clear of the next and
// joined to its year's tick by a leader line; picked by the explain rung before the library's model-written flow.
import { test } from "node:test";
import assert from "node:assert/strict";
import { eventsIn, timelineCall } from "../server/forge/explainer/timeline.js";
import { expand } from "../server/forge/explainer/templates.js";
import { explainerFor } from "../server/forge/explainer/lesson.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";
import { opGeometry, textBox } from "../shared/whiteboard.js";

test("events are the kit's own 'label (year)' words: arrows, semicolons and day-month dates; never BCE, never a sentence", () => {
  assert.deepEqual(eventsIn("Brihadeeswara completed (1010) → Mahmud raids Somnath (1025–26) → First Battle of Tarain (1191)"),
    [{ year: 1010, label: "Brihadeeswara completed" }, { year: 1025, label: "Mahmud raids Somnath" }, { year: 1191, label: "First Battle of Tarain" }]);
  assert.deepEqual(eventsIn("Make a word timeline: Assembly meets (9 December 1946); Constitution adopted (26 November 1949)").map((e) => e.year), [1946, 1949]);
  assert.deepEqual(eventsIn("Harappan cities (2500 BCE) → Buddha (500 BCE)"), []);
  assert.deepEqual(eventsIn("the period when many people across the subcontinent began to resist (1857)"), [], "a clause, not a label");
  assert.equal(timelineCall({ expectations: ["Two events only: A (1900) → B (1910)."] }), null, "fewer than 3 is no timeline");
});

const kitOf = (id) => kitFromFile(getTopic(id));
const boxesOf = (script) => script.ops.filter((o) => o.op === "text").map((o) => ({ o, b: textBox(o.text, o.size, o.at, o.align ?? "middle") }));
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

for (const [id, layout] of [["c8-sst-ch09-t01", "across"], ["c7-sst-ch16-t01", "down"]]) {
  test(`${id}: the explain rung draws its timeline ${layout}, true to scale, no label touching another, and it passes the W gates`, () => {
    const kit = kitOf(id);
    const call = timelineCall(kit);
    assert.ok(call && call.events.length >= 3);
    const ex = explainerFor({ lessonId: "L", kit, band: "B3" });
    assert.equal(ex?.template, "timeline@1");
    const s = ex.params.script;
    const ticks = s.ops.filter((o) => o.op === "line" && o.weight === 3);
    assert.equal(ticks.length, call.events.length, "one tick per event");
    // true scale: the ticks' positions along the axis are proportional to the years
    const pos = ticks.map((t) => (layout === "across" ? (t.from[0] + t.to[0]) / 2 : (t.from[1] + t.to[1]) / 2));
    const yrs = call.events.map((e) => e.year);
    const k = (pos.at(-1) - pos[0]) / (yrs.at(-1) - yrs[0]);
    yrs.forEach((yr, i) => assert.ok(Math.abs(pos[0] + (yr - yrs[0]) * k - pos[i]) < 1, `tick ${yr} at its true place`));
    const texts = boxesOf(s);
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) assert.ok(!overlaps(texts[i].b, texts[j].b), `"${texts[i].o.text}" × "${texts[j].o.text}"`);
    const line = call.events.map((e) => `${e.year} mein ${e.label}`).join(", ") + ".";
    const g = gateWhiteboard(s, { reply: line, speechMs: 9000 });
    assert.equal(g.pass, true, JSON.stringify(g.checks.filter((c) => !c.pass)));
    assert.equal(ex.facts.onScreen.event1, `${yrs[0]} ${call.events[0].label}`, "each event is a fact her line is written from");
  });
}

test("a timeline too crowded or too wide fails the template (the ladder steps down), never a squeezed board", () => {
  const long = ["A very long label one", "A very long label two", "A very long label tri", "A very long label for", "A very long label fiv", "A very long label six"];
  const r = expand({ template: "timeline@1", events: long.map((label, i) => ({ year: 1900 + i, label })) });
  if (r.ok) for (const o of r.script.ops) if (o.op === "text") assert.ok(opGeometry(o).box.x >= 0);
  assert.equal(expand({ template: "timeline@1", events: [{ year: 1900, label: "A" }, { year: 1900, label: "B" }, { year: 1901, label: "C" }] }).ok, false, "a year twice");
});
