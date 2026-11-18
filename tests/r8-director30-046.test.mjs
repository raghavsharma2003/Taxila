// Brain 046 (docs/patches/to-brain/046-director30-cues-hindi-reasks.md, dc-r8-director30): each new or changed predicate pinned on the
// director30 rows the order lists (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director30; rows are 0-based indexes
// into a lesson's `director`), and each rule pinned from the order's sentences on small inline fragments. Learning 019 rewrites the pilot
// scripts and adds fields at the same time: nothing here pins a sentence of today's script.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director30");
const TOPIC = { c4: "c4-maths-ch05-t01", c5t01: "c5-maths-ch02-t01", c5t02: "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const FILE = { c4: "c4-ch05-t01", c5t01: "c5-ch02-t01", c5t02: "c5-ch02-t02", c6: "c6-ch06-t01" };
const cache = new Map();
const lesson = (persona, t) => {
  const k = `${persona}|${t}`;
  if (!cache.has(k)) {
    const j = JSON.parse(readFileSync(join(RUN, `${persona}-${FILE[t]}.json`), "utf8"));
    cache.set(k, { rows: j.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${TOPIC[t]}.json`), "utf8")) });
  }
  return cache.get(k);
};
const flagged = (persona, t, name) => new Set(lessonFlags(lesson(persona, t)).filter((f) => f.predicate === name).map((f) => f.row));

describe("Q1: a worked step is told only on its cue", () => {
  test("stepToldEarly reads the step told after a yes or an aside (c5-t01 stuck 22; c5-t02 stuck 22, offtopic 18; c6 stuck 22, offtopic 18)", () => {
    for (const [p, t, row] of [["stuck", "c5t01", 22], ["stuck", "c5t02", 22], ["offtopic", "c5t02", 18], ["stuck", "c6", 22], ["offtopic", "c6", 18]])
      assert.ok(flagged(p, t, "stepToldEarly").has(row), `${p} ${t} ${row}`);
  });
  test("stepToldEarly reads no step told after a wrong answer to it, nor at a second request with its simpler said", () => {
    const { rows, script } = lesson("stuck", "c5t01");
    // (row 22 told after "haan": the same row after a wrong answer, and after a second give-up, is the step's cue)
    for (const [intent, read, text] of [["miss", "incorrect", "1 km"], ["give_up", "no_evidence", "mujhe nahi pata"]]) {
      const rs = structuredClone(rows.slice(0, 23));
      rs[21] = { ...rs[21], intent, read, text };
      assert.ok(!lessonFlags({ rows: rs, script }).some((f) => f.predicate === "stepToldEarly" && f.row === 22), intent);
    }
  });
});
