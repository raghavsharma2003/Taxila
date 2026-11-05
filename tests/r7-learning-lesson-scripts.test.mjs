// Round 7 F (dc-r7-teaching-scripts): every authored lesson script in data/lesson-scripts/ passes the one-command check
// (scripts/lesson-scripts/check.mjs): structure against its kit, Studio's whiteboard gate on every board (W6 timing is left
// to the turn-time gate on her real line), and Brain's runtime validator. Keys were blind-solved by a separate Claude
// agent (ms-r7-pilot-scripts-blind); the c5 pilot stays on the fraction number line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { allTopics, checkTopic, leaks, scriptOf } from "../scripts/lesson-scripts/check.mjs";

test("the three pilot scripts are present", () => {
  for (const t of ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c6-maths-ch06-t01"]) assert.ok(allTopics().includes(t), t);
});

for (const t of allTopics()) {
  test(`${t}: structure, Studio's whiteboard gate and Brain's validator all pass`, async () => {
    const r = await checkTopic(t);
    assert.deepEqual({ structure: r.structure, boards: r.boards, runtime: r.runtime }, { structure: [], boards: [], runtime: [] });
  });
}

test("the c5 pilot draws every board on the fraction number line, and its checks ask, never show", () => {
  const s = scriptOf("c5-maths-ch02-t01");
  for (const k of s.skills) {
    for (const b of [...k.explain.map((e) => e.board), k.workedExample.board, ...k.remediation.map((r) => r.board)]) if (b) assert.equal(b.template, "fraction-line@1");
    for (const c of k.checks) if (c.board) assert.ok(c.board.params.mark !== undefined || c.board.params.target, `${k.skillId}/${c.id}`);
  }
});

test("a key printed in its own prompt is caught; a two-way choice and yes/no are not leaks", () => {
  assert.equal(leaks("What is 3 + 4? Hint: 7", "7"), true);
  assert.equal(leaks("Which is closer to 0: 1/3 or 1/10?", "1/10"), false);
  assert.equal(leaks("Is Kabir right? Say no or yes.", "No"), false);
  assert.equal(leaks("What fraction is the first mark after 0 on a line cut into 3?", "1/3"), false);
});
