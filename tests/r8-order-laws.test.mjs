// dc-r8-director21 O (main, 21:05): the order of a lesson is a law, checked on every live and dry row. Each law is a predicate that
// fails on director21's rows (tests/fixtures/eval-results/director21: the run's rows, trimmed to what the predicates read, with its
// script snapshots) — the rows its judges named — before the walk's fix for it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRun } from "../evals/hybrid-side-by-side/check-run.mjs";

const RUN = new URL("./fixtures/eval-results/director21", import.meta.url).pathname;
const FLAGS = checkRun(RUN);
const rowsOf = (p) => FLAGS.filter((x) => x.predicate === p).map((x) => `${x.lesson} ${x.row}`);
const has = (p, rows) => { const got = rowsOf(p); for (const r of rows) assert.ok(got.includes(r), `${p}: ${r} in ${got.join(", ")}`); };

test("O1 orderParts: a step before the worked problem, a card before its point", () => {
  has("orderParts", ["offtopic-c4-ch05-t01 36", "steering-c4-ch05-t01 36", "offtopic-c6-ch06-t01 16", "steady-c5-ch02-t01 20"]);
});

test("O2 orderDisplaced: the part a return took the place of is not said on the next turn", () => {
  has("orderDisplaced", ["offtopic-c4-ch05-t01 36", "steering-c4-ch05-t01 36", "offtopic-c6-ch06-t01 16"]);
});

test("O3 orderRemediation: a remediation as help after a give-up, a clarify or a plain miss", () => {
  has("orderRemediation", ["stuck-c4-ch05-t01 8", "steady-c5-ch02-t02 8", "stuck-c5-ch02-t02 16"]);
  // (its own simpler on a give-up of the remediation is the cell's, not help taken from elsewhere)
  assert.ok(!rowsOf("orderRemediation").includes("offtopic-c5-ch02-t01 10"));
});

test("O4 orderStays: a picture request that moves the lesson on", () => {
  has("orderStays", ["stuck-c4-ch05-t01 18", "offtopic-c4-ch05-t01 26", "offtopic-c5-ch02-t02 28"]);
  // (a remediation and its then-card are one unit)
  assert.ok(!rowsOf("orderStays").includes("steering-c5-ch02-t01 14"));
});

test("O5 orderNoUnit: the teach-back and the wrap over the last unit's board, naming a figure", () => {
  has("orderNoUnit", ["steady-c6-ch06-t01 114", "steady-c6-ch06-t01 118", "steady-c6-ch06-t01 120", "steady-c4-ch05-t01 128", "steady-c5-ch02-t01 144"]);
});

test("O6 orderFirstMiss: the key on a card's first miss", () => {
  has("orderFirstMiss", ["steady-c4-ch05-t01 62", "offtopic-c4-ch05-t01 62", "offtopic-c5-ch02-t02 26", "steering-c5-ch02-t02 32"]);
});

test("O7 orderAnswerFirst: the AI line held behind her teaching", () => {
  has("orderAnswerFirst", ["offtopic-c5-ch02-t02 22", "steady-c5-ch02-t02 46", "steady-c6-ch06-t01 42", "stuck-c4-ch05-t01 42"]);
  assert.ok(!rowsOf("orderAnswerFirst").includes("offtopic-c4-ch05-t01 6"));
});
