// dc-r8-director26 (docs/patches/to-brain/040): each predicate rewritten or added for director26 is run over the director26 rows the
// judges named for it and must read non-zero there before it is trusted to read 0 on the dry matrix. director26's own check read 0 on
// every one of the B1 rows (helpBoard compared a remediation's help with the card board help.js borrowed for it, and could not read a
// two-page row's boards). A row number is its 0-based index in `director`, as the judges count.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUNS = { d26: "2026-11-17-director26", d25: "2026-11-16-director25" };
const FILE = { c4: "c4-ch05-t01", "c5-t01": "c5-ch02-t01", "c5-t02": "c5-ch02-t02", c6: "c6-ch06-t01" };
const lessonOf = (run, topic, child) => {
  const dir = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results", RUNS[run]);
  const j = JSON.parse(readFileSync(join(dir, `${child}-${FILE[topic]}.json`), "utf8"));
  const snap = join(dir, "scripts", `${j.topicId}.json`);
  const script = JSON.parse(readFileSync(existsSync(snap) ? snap : join(ROOT, "data/lesson-scripts", `${j.topicId}.json`), "utf8"));
  return { rows: j.director, script };
};
const cache = new Map();
export const flagsOf = (run, topic, child) => { const k = `${run}|${topic}|${child}`; if (!cache.has(k)) cache.set(k, lessonFlags(lessonOf(run, topic, child))); return cache.get(k); };
/** Every named row must carry a flag of the predicate. Rows are [topic, child, row] (director26) or ["d25", topic, child, row]. */
function readsOn(predicate, rows) {
  assert.ok(PREDICATES[predicate], `${predicate} exists`);
  assert.ok(!PENDING.has(predicate), `${predicate} is gated`);
  const norm = (x) => (x[0] === "d25" ? x : ["d26", ...x]);
  const missed = rows.map(norm).filter(([run, topic, child, row]) => !flagsOf(run, topic, child).some((f) => f.predicate === predicate && f.row === row));
  assert.deepEqual(missed.map((x) => x.join(" ")), [], `${predicate} reads 0 on rows it is written for`);
}

test("B1 helpBoard: a remediation's help said over another card's board (the six director26 rows), and director25's rows", () => {
  readsOn("helpBoard", [["c4", "steering", 12], ["c6", "steady", 48], ["c6", "stuck", 58], ["c6", "steering", 8], ["c5-t02", "steady", 82], ["c5-t02", "steering", 12],
    ["d25", "c4", "steady", 124], ["d25", "c4", "stuck", 30]]);
});

test("B2 stopAuthored: the stop turn is the authored line, never the model's menu", () => {
  readsOn("stopAuthored", [["c4", "stuck", 68], ["c5-t01", "stuck", 74], ["c6", "stuck", 72], ["c6", "steering", 50]]);
});

test("N1 requestAnswered: a give-up or a clarify never gets nothing (no part recorded, the hook, a point's spent wordings)", () => {
  readsOn("requestAnswered", [["c5-t01", "steady", 128], ["c5-t02", "stuck", 28], ["c5-t02", "steering", 4], ["c6", "steady", 4], ["c6", "stuck", 4], ["c6", "offtopic", 4], ["c6", "steering", 4]]);
});
test("N1 teachingParts: a teaching turn has parts (c5-t02 steering 4, the model's draft cut by the length guard)", () => {
  readsOn("teachingParts", [["c5-t02", "steering", 4]]);
});

test("J1 goOnAfterKey: the go-on line only after a key (a worked step whose ladder is empty goes on with no promise)", () => {
  readsOn("goOnAfterKey", [["c5-t02", "stuck", 58], ["c5-t02", "stuck", 64], ["c5-t01", "stuck", 44], ["c6", "stuck", 44]]);
});
test("J1 goOnStacked: no go-on line where the back-to joint follows", () => {
  readsOn("goOnStacked", [["c5-t01", "stuck", 30], ["c5-t01", "steering", 18], ["c5-t02", "stuck", 46], ["c6", "stuck", 30], ["c6", "steering", 18]]);
});
test("J1 beforeWorked: a verdict into a worked problem takes the beforeWorked joint", () => {
  readsOn("beforeWorked", [["c6", "steady", 16], ["c6", "steady", 58], ["c6", "steady", 86], ["c6", "stuck", 34], ["c6", "offtopic", 42], ["c6", "steering", 40],
    ["c5-t02", "steady", 20], ["c5-t02", "steady", 72], ["c5-t02", "steady", 132], ["c5-t02", "steering", 42]]);
});
