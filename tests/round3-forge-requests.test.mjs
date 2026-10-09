// Patch 08 (docs/design/round3/forge/patches/08-simulation-ask-is-interactive.diff): a simulation ask is read as an
// interactive visual request in code (round 3 forge acceptance: "simulation dikhao" was a plain worked example on 2 of 5 runs).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { requestOf } from "../server/director/requests.js";

describe("round3 forge: the simulation ask", () => {
  it("simulation / simulate asks are interactive visual requests", () => {
    for (const t of ["simulation dikhao", "simulation dikhao na", "simulate karo", "show me a simulation", "can we do a simulation please"]) {
      const r = requestOf(t);
      assert.equal(r?.type, "visual", t);
      assert.equal(r?.kind, "animation", t);
    }
  });
  it("the existing asks are unchanged", () => {
    assert.equal(requestOf("game khelna hai")?.kind, "game");
    assert.equal(requestOf("animation dikhao na")?.kind, "animation");
    assert.equal(requestOf("show me a diagram")?.kind, "diagram");
  });
});
