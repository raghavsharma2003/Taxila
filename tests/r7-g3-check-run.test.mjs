// dc-r8-director20 G3: the dry predicates read a live run's rows (evals/hybrid-side-by-side/check-run.mjs), and fault 5's predicate
// fails on director20's recorded rows — the rows the run had while the dry matrix read 0 (main's test for G3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRun } from "../evals/hybrid-side-by-side/check-run.mjs";

// (the five lessons it reads, with the run's script snapshot, copied from evals/hybrid-side-by-side/results/2026-11-11-director20)
const RUN = new URL("./fixtures/eval-results/director20", import.meta.url).pathname;

test("G3: giveUpNoKey flags director20's fault-5 rows (c4 stuck 12, c5-t01 stuck 12, c5-t02 steering 30)", () => {
  const flags = checkRun(RUN).filter((x) => x.predicate === "giveUpNoKey").map((x) => `${x.lesson} ${x.row}`);
  for (const row of ["stuck-c4-ch05-t01 12", "stuck-c5-ch02-t01 12", "steering-c5-ch02-t02 30"]) assert.ok(flags.includes(row), `${row} in ${flags.join(", ")}`);
  // ("hindi mein batao na" is a request, not a give-up)
  assert.ok(!flags.includes("stuck-c5-ch02-t02 8") && !flags.includes("stuck-c6-ch06-t01 8"));
});
