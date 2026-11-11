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

// Main's order 1 (G3 b and c): every authored part she starts is said whole. On director20's rows it flags a hook cut by a code filter
// (c5-t01 stuck 2), the reply layer's repair that swapped the point for one of its sentences (c5-t02 steering 30, fault 5's second
// fault) and a card whose words code turned into Hindi ones (c4 stuck 66)
test("order 1: authoredWhole flags director20's cut, swapped and repaired authored parts", () => {
  const flags = checkRun(RUN).filter((x) => x.predicate === "authoredWhole").map((x) => `${x.lesson} ${x.row}`);
  for (const row of ["stuck-c5-ch02-t01 2", "steering-c5-ch02-t02 30", "stuck-c4-ch05-t01 66"]) assert.ok(flags.includes(row), `${row} in ${flags.join(", ")}`);
});

test("order 1: authoredWhole allows a frame and a shared sentence, and flags a cut or a swapped word", async () => {
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const script = { skills: [{ explain: [{ id: "e1", point: { hi: "Yeh rahi line. Is par 2 barabar gaps hain." }, ask: { prompt: { hi: "Dono ko jodo. Kitna hua?" } } }],
    workedExample: { problem: { hi: "Barfi ke 3 tukde kiye. Kitna hua?" } } }] };
  const said = (text) => lessonFlags({ rows: [{ who: "teacher", text }], script }).filter((x) => x.predicate === "authoredWhole").map((x) => x.why);
  assert.deepEqual(said("Phir se dekho: Dono ko jodo. Kitna hua?"), []);
  assert.deepEqual(said("Achha. Yeh rahi line. Is par 2 barabar gaps hain. Yahan tak theek hai?"), []);
  // ("Kitna hua?" is the card's and the problem's: said alone it starts neither)
  assert.deepEqual(said("Kitna hua?"), []);
  assert.equal(said("Is par 2 barabar gaps hain.").length, 1, "the point cut to its second sentence");
  assert.equal(said("Yeh rahi rekha. Is par 2 barabar gaps hain.").length, 1, "a word swapped inside the point");
});

// P1 (dc-r8-director20): every park is kept. On director20's rows: c5-t02 stuck 34 (a park said with a card, never returned to),
// c5-t01 stuck 34 (a park alone, never returned to), c5-t02 steering 26 (her question after the AI line, ignored)
test("P1: the promise predicates flag director20's broken parks and the ignored AI-line question", () => {
  const flags = checkRun(RUN).map((x) => `${x.lesson} ${x.row} ${x.predicate}`);
  for (const f of ["stuck-c5-ch02-t02 34 parkReturned", "stuck-c5-ch02-t01 34 parkReturned", "stuck-c5-ch02-t01 34 parkGoesOn", "steering-c5-ch02-t02 26 aiAskAnswered"])
    assert.ok(flags.includes(f), `${f} in ${flags.filter((x) => /park|return|aiAsk/.test(x)).join(", ")}`);
});

test("P1: a return is a turn of its own, after a park; a close may lead it", async () => {
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const script = { joints: { asidePark: [{ hi: "{aside} ki baat bhi hogi, bas yeh kaam khatam ho jaaye." }], asideReturn: [{ hi: "{aside} wali baat batao na?" }] } };
  const T = (text, extra = {}) => ({ who: "teacher", text, ...extra }), C = (text) => ({ who: "child", text, read: "no_evidence" });
  const of = (rows) => lessonFlags({ rows, script }).filter((x) => /park|return/i.test(x.predicate)).map((x) => `${x.row} ${x.predicate}`);
  assert.deepEqual(of([T("Cricket ki baat bhi hogi, bas yeh kaam khatam ho jaaye. Kitna hua?", { card: "Kitna hua?" }), C("3"),
    T("Haan, sahi hai. Cricket wali baat batao na?", { returnSaid: true, pageParts: [{ part: "close" }] })]), []);
  assert.deepEqual(of([T("Cricket ki baat bhi hogi, bas yeh kaam khatam ho jaaye."), C("haan")]), ["0 parkGoesOn"]);
  assert.deepEqual(of([C("x"), T("Cricket wali baat batao na?", { returnSaid: true, pageParts: [{ part: "body" }] })]), ["1 returnNoPark", "1 returnAlone"]);
});
