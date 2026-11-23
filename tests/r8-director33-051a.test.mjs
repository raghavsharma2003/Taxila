// to-brain 051 C1 to C3 (docs/patches/to-brain/051-director33-screen-stays-answer-boards-named-miss-cap.md, dc-r8-director33): each new or
// changed predicate pinned on the director33 rows the order lists (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director33;
// rows are 0-based indexes into a lesson's `director`), replayed with that run's own script snapshot, and each rule pinned on the walk.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PENDING, PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director33");
const cache = new Map();
const lesson = (persona, t) => {
  const k = `${persona}|${t}`;
  if (!cache.has(k)) {
    const j = JSON.parse(readFileSync(join(RUN, `${persona}-${t}.json`), "utf8"));
    cache.set(k, { rows: j.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${t.replace(/^c(\d)-/, "c$1-maths-")}.json`), "utf8")) });
  }
  return cache.get(k);
};
const flagged = (persona, t, name) => [...new Set(lessonFlags(lesson(persona, t)).filter((f) => f.predicate === name).map((f) => f.row))].sort((a, b) => a - b);

describe("C3: the own reason only after its named wrong answer", () => {
  test("ownReasonFits: a card that names no wrong answer never fits", async () => {
    const { ownReasonFits } = await import("../server/director/help.js");
    for (const outcome of ["incorrect", "partial", "misconception"]) assert.equal(ownReasonFits({ whyAltAsHelp: true }, { outcome }), false, outcome);
    assert.equal(ownReasonFits({ whyAltAsHelp: true, targets: "m-x" }, { outcome: "misconception", misconceptionId: "m-x" }), false, "a mix-up named, no answer named");
    assert.equal(ownReasonFits({ whyAltAsHelp: true, wrongIfMis: "7" }, { outcome: "incorrect", wrongListed: true }), true);
    assert.equal(ownReasonFits({ whyAltAsHelp: true, wrongIfMis: "7" }, { outcome: "incorrect", wrongListed: false }), false);
  });
  test("whyAltNoMiss is gated and reads director33's rows (a card naming no wrong answer, any miss)", () => {
    assert.ok(PREDICATES.whyAltNoMiss); assert.ok(!PENDING.has("whyAltNoMiss"));
    const want = { "steady|c5-ch02-t03": [10], "offtopic|c5-ch02-t03": [6, 14, 44], "steering|c5-ch02-t03": [16, 24, 48], "stuck|c4-ch05-t01": [66],
      "offtopic|c4-ch05-t01": [52, 60], "steady|c6-ch07-t01": [6], "steady|c4-ch01-t02": [8], "steering|c4-ch01-t02": [10], "offtopic|c4-ch06-t01": [44] };
    for (const [k, rows] of Object.entries(want)) { const [p, t] = k.split("|"); assert.deepEqual(flagged(p, t, "whyAltNoMiss"), rows, k); }
  });
});
