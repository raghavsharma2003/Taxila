// round 7 (C1 studio-board-richness, maps decision dc-r7-maps-no-outline): places pinned at their TRUE latitude/longitude
// on a labelled degree grid with a compass, and nothing that could be read as a boundary. Every pin comes from the sourced
// gazetteer; every name sits clear of every mark; the grid's degree labels are an axis (W4), not claims.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { placesCall, placeNamed } from "../server/forge/explainer/places.js";
import { expand } from "../server/forge/explainer/templates.js";
import { explainerFor } from "../server/forge/explainer/lesson.js";
import { retime } from "../server/stagecraft/board-sync.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";

const gaz = JSON.parse(readFileSync(new URL("../data/geo/india-places.json", import.meta.url), "utf8"));

test("the gazetteer: every place has its source record and lies in the subcontinent's frame", () => {
  assert.ok(gaz.places.length >= 50);
  for (const p of gaz.places) {
    assert.match(p.source, /^(naturalearth:ne_10m_populated_places:\d+|wikidata:Q\d+:P625)$/, p.id);
    assert.ok(p.lat > 5 && p.lat < 38 && p.lon > 66 && p.lon < 98, `${p.id} ${p.lat},${p.lon}`);
  }
  // a few well-known positions, to 0.3°
  for (const [n, lat, lon] of [["Delhi", 28.6, 77.2], ["Mumbai", 19.0, 72.8], ["Chennai", 13.1, 80.3], ["Kolkata", 22.6, 88.4]]) {
    const p = placeNamed(n);
    assert.ok(Math.abs(p.lat - lat) < 0.3 && Math.abs(p.lon - lon) < 0.3, `${n} at ${p.lat},${p.lon}`);
  }
  assert.equal(placeNamed("Bombay").id, "mumbai", "an old name is the same place");
});

test("the picker: ≥ 3 named places in the kit's order and words; a maths word problem gets no map", () => {
  const c = placesCall({ topicId: "c6-sst-ch01-t01", expectations: ["Find Bombay, then Delhi and Kolkata; the Tropic of Cancer passes between them."] });
  assert.deepEqual(c.places, ["Bombay", "Delhi", "Kolkata"]);
  assert.equal(c.tropic, true);
  assert.equal(placesCall({ topicId: "c2-maths-ch09-t02", expectations: ["Delhi to Shimla and Chennai: how far?"] }), null);
  assert.equal(placesCall({ topicId: "c6-sst-ch01-t01", expectations: ["Delhi and Mumbai only."] }), null);
});

const ops = (x, op) => x.script.ops.filter((o) => o.op === op);

test("no outline, coastline or region shape anywhere: frame, ticks, crosses, compass, named lines, pins and names only", () => {
  const x = expand({ template: "places@1", places: ["New Delhi", "Ujjain", "Mumbai", "Kolkata", "Jaipur"], tropic: true, meridian: true });
  assert.ok(x.ok, x.errors?.join(","));
  const kinds = new Set(x.script.ops.map((o) => o.op));
  for (const k of kinds) assert.ok(["rect", "line", "text", "arrow", "circle", "label"].includes(k), `op ${k}`);
  assert.equal(ops(x, "rect").length, 1, "one frame");
  for (const l of ops(x, "line")) assert.ok(l.from[0] === l.to[0] || l.from[1] === l.to[1], "every line runs along a meridian or a parallel");
  assert.ok(x.script.ops.some((o) => o.id === "tropic") && x.script.ops.some((o) => o.id === "meridian"));
});

test("true position: pins keep the gazetteer's coordinates on one scale (a degree north is as long as a degree east)", () => {
  const x = expand({ template: "places@1", places: ["Delhi", "Mumbai", "Chennai", "Kolkata"] });
  assert.ok(x.ok);
  const pin = Object.fromEntries(ops(x, "label").map((l) => [l.text, l.to]));
  const [d, m, c] = ["Delhi", "Mumbai", "Chennai"].map((n) => ({ g: placeNamed(n), p: pin[n] }));
  const kx = (c.p[0] - m.p[0]) / (c.g.lon - m.g.lon), ky = (m.p[1] - d.p[1]) / (d.g.lat - m.g.lat);
  assert.ok(Math.abs(kx - ky) < 0.01 * kx, `east ${kx} vs north ${ky} units per degree`);
  assert.ok(pin.Delhi[1] < pin.Mumbai[1] && pin.Mumbai[0] < pin.Kolkata[0], "north is up, east is right");
});

for (const id of ["c6-sst-ch01-t01", "c5-evs-ch02-t01", "c6-sst-ch06-t01", "c7-sst-ch03-t01"]) {
  test(`${id}: the explain rung draws the places board and it passes every W gate`, () => {
    const kit = kitFromFile(getTopic(id));
    const ex = explainerFor({ lessonId: "L", kit, band: "B3" });
    assert.equal(ex?.template, "places@1");
    const f = ex.facts.onScreen;
    const names = Object.keys(f).filter((q) => /^place\d/.test(q)).map((q) => f[q]);
    assert.ok(names.length >= 3);
    const line = `Map par dekho: ${names.join(", ")}. Sabse upar ${f.northmost} hai.`;
    const g = gateWhiteboard(retime(ex.params.script, ex.params.script.durationMs, 8000), { reply: line, kit, speechMs: 8000 });
    assert.equal(g.pass, true, JSON.stringify(g.checks.filter((q) => !q.pass)));
  });
}

test("W4: an evenly spaced degree axis is allowed; one uneven degree breaks it, and every degree is checked again", () => {
  const x = expand({ template: "places@1", places: ["Delhi", "Mumbai", "Chennai", "Kolkata"] });
  const w4 = (script) => gateWhiteboard(retime(script, script.durationMs, 8000), { reply: "Map par dekho: Delhi, Mumbai, Chennai, Kolkata.", speechMs: 8000 }).checks.find((c) => c.id === "W4.numbers_from_truth");
  assert.equal(w4(x.script).pass, true);
  const lat = x.script.ops.findIndex((o) => o.op === "text" && /°N$/.test(o.text));
  const bent = { ...x.script, ops: x.script.ops.map((o, i) => (i === lat ? { ...o, text: `${Number(o.text.slice(0, -2)) + 2}°N` } : o)) };
  const r = w4(bent);
  assert.equal(r.pass, false, "an uneven set is not an axis");
  assert.ok(r.detail.invented.length >= 3, JSON.stringify(r.detail));
});
