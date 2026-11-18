// d31 046 follow-up (the main loop's read of the d31 dry runs: four faults from Brain 046's re-ask rotation, Q5 and Q3). Each new predicate
// pinned on the rows the read named, from the d31 dry lessons copied into tests/fixtures/d31-046-followup.json (only the rows needed, at their
// own indexes; the scripts cut to the cards those rows ask), and each rule pinned on small inline fragments. Nothing here pins a sentence of
// today's script: the fixture carries the scripts the run walked.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const FX = JSON.parse(readFileSync(join(ROOT, "tests/fixtures/d31-046-followup.json"), "utf8"));
/** A fixture lesson as rows at their own indexes (rows the read did not need are a silent child line) and its script. */
const lesson = (name) => {
  const L = FX.lessons[name];
  const n = Math.max(...Object.keys(L.rows).map(Number)) + 1;
  return { rows: Array.from({ length: n }, (_, i) => L.rows[i] ?? { who: "child", text: "" }), script: FX.scripts[L.topicId] };
};
const flagged = (name, pred) => new Set(lessonFlags(lesson(name)).filter((f) => f.predicate === pred).map((f) => f.row));

describe("1: a re-ask is always a question a child can answer from what she just heard", () => {
  test("reaskWhole is gated and reads the nine re-asks on the card's last clause alone", () => {
    assert.ok(!PENDING.has("reaskWhole"));
    for (const [name, row] of [["steady-c6-ch07-t01", 6], ["steady-c5-ch02-t03", 10], ["steady-c5-ch02-t03", 84], ["steady-c6-ch06-t01", 90], ["offtopic-c5-ch02-t01", 22],
      ["offtopic-c5-ch02-t01", 62], ["stuck-c5-ch02-t01", 40], ["steady-c5-ch02-t02", 8], ["steady-c4-ch05-t01", 16]])
      assert.ok(flagged(name, "reaskWhole").has(row), `${name} ${row}`);
  });
  test("reaskWhole reads no re-ask on the card's reask, its whole question or the short ask", () => {
    const { rows, script } = lesson("steady-c6-ch07-t01");
    // (row 4 ends on the card's reask)
    assert.ok(!flagged("steady-c6-ch07-t01", "reaskWhole").has(4));
    const at = (text) => lessonFlags({ rows: [...rows.slice(0, 6), { ...rows[6], text }], script }).filter((f) => f.predicate === "reaskWhole" && f.row === 6);
    const help = "Nahi, yeh theek nahi hai. Socho chaar dost yeh roti barabar baant-te hain.";
    assert.deepEqual(at(`${help} ${rows[6].card}`), [], "the whole card");
    assert.deepEqual(at(`${help} Ab phir se socho, jawab kya hoga?`), [], "the short ask");
    assert.equal(at(`${help} ${rows[6].card.split(/(?<=[.?!])\s+/).at(-1)}`).length, 1, "the last clause alone");
  });
  test("the rotation's forms are the reask and the whole card — the walk never builds the last clause alone", () => {
    const src = readFileSync(join(ROOT, "server/brain/say.js"), "utf8");
    assert.match(src, /\["reask", reask\], \["short", shortT\], \["whole", whole\], \["clause", clause\]/);
    // (the clause is only a one-sentence card's with no reask)
    assert.match(src, /const clause = cs\.length < 2 && !reask && /);
  });
});
