// round 5 (14.2; owner-5 visual battery): she never draws in words. On the spoken lane a line of art is read aloud, and
// the em / en dash forms slipped past the guard (ASCII hyphens only): "0 —|—|—|—|— 1".
import { test } from "node:test";
import assert from "node:assert/strict";
import { leaksStage, stripStage } from "../server/director/say.js";

test("em / en dash art is caught and stripped", () => {
  for (const t of ["Number line dekho: 0 —|—|—|—|— 1. Ab batao?", "0 –|–|–|– 1", "|—|—|—|", "Yeh dekho ——— yahan", "0 — — — — 1 tak", "A —> B", "B <— A", "0 -|-|-|- 1"]) {
    assert.ok(leaksStage(t), t);
    assert.doesNotMatch(stripStage(t), /[—–]\s*\||\|\s*[—–]|[—–]{2,}|[—–]>|<[—–]/u, `${t} → ${stripStage(t)}`);
  }
  assert.equal(stripStage("Number line dekho: 0 —|—|—|—|— 1. Ab batao?").includes("|"), false);
});

test("one dash in a sentence is prose and stays", () => {
  for (const t of ["Great — ab batao?", "Riya, cultural fest mein alag songs bajenge—alag sur, par ek programme.", "Haan, “Ghoomar Groove” catchy hai—yeh unity ka example hai.",
    "3 – 1 = 2, sahi!", "Pehle socho — phir likho — phir batao."]) {
    assert.equal(leaksStage(t), false, t);
    assert.equal(stripStage(t), t, t);
  }
});
