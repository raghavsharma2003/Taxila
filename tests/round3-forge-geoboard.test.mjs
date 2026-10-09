// Round 3 · forge, patch 06: the geoboard never invents an area task in a perimeter ask (taxila.dev 2026-10-09,
// c6-maths-ch06-t01 Perimeter: { numbers: [3, 50, 30], ask: "perimeter" } showed "Shade a shape with area = 3").
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalize } from "../src/modules/frame/engines/geoboard.logic.ts";

describe("round3 forge: geoboard perimeter asks", () => {
  it("the prod params build no area target and report an error (the tray takes the engine off; the item goes on by voice)", () => {
    const c = normalize({ topicId: "c6-maths-ch06-t01", numbers: [3, 50, 30], ask: "perimeter" });
    assert.equal(c.area, null);
    assert.ok(c.error, "a build with no target is an error, never 'area = 3'");
  });
  it("an area build from a number still works, and a measure of a given rectangle still asks for its perimeter", () => {
    assert.equal(normalize({ numbers: [6] }).area, 6);
    const m = normalize({ mode: "measure", shape: "rect:4x3", ask: "perimeter" });
    assert.equal(m.mode, "measure"); assert.equal(m.ask, "perimeter"); assert.equal(m.error, null);
  });
});
