// round 7 A4 brain-teach-every-skill (PIPELINE §A Brain item 2): a per-skill arc. Every skill is explained, then shown with a
// worked example built from ITS OWN verified kit item (the kit's anchor numbers, never invented ones), then practised as a
// block before the next skill is taught; after every skill, mixed practice. The hook has kinds (never one interest template).
// Kill switch: TAXILA_R7_SKILL_ARC=off. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, skillWorkedExample, hookKindFor } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const short = (id) => String(id ?? "").split("-").pop();
function run(seed = 2, n = 30) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed, now: 0 }), { event: "start", kit: K, now: 0 });
  const moves = [{ kind: r.move.kind, skill: r.move.skillId, item: r.move.itemId, content: r.state.lastContent }];
  for (let i = 0; i < n && !r.end; i++) {
    r = step(r.state, { event: "turn", kit: K, cls: r.move.itemId ? cls("correct") : cls("no_evidence"), text: "x", now: (r.state.turn + 1) * 20_000 });
    moves.push({ kind: r.move.kind, skill: r.move.skillId, item: r.move.itemId, content: r.state.lastContent, shape: r.move.shape });
  }
  return moves;
}

test("every skill is explained, then shown with a worked example from its own verified item, which is never posed", () => {
  assert.ok(K.skills.length >= 3);
  for (const seed of [1, 2, 3]) {
    const m = run(seed);
    for (const sk of K.skills.slice(1)) {
      const at = m.findIndex((x) => x.kind === "explain" && x.skill === sk.id);
      assert.ok(at > 0, `seed ${seed}: ${short(sk.id)} explained`);
      const we = m[at + 1];
      assert.equal(we.kind, "worked_example", `seed ${seed}: ${short(sk.id)} worked example right after its explain`);
      const src = K.items.find((i) => i.skillId === sk.id && we.content.some((l) => l === `worked example: ${i.prompt_en || i.prompt_hi}`));
      assert.ok(src, `seed ${seed}: ${short(sk.id)}'s worked example is one of its own kit items`);
      assert.ok(we.content.includes(`its answer: ${src.answer}`), "with that item's verified key");
      assert.ok(!m.some((x) => x.item === src.id), `seed ${seed}: the shown item ${src.id} is never posed as a question`);
    }
  }
});

test("a skill's practice stays together until the next skill is taught (no hopping between skills)", () => {
  const m = run(2);
  const firstExplain = (sk) => m.findIndex((x) => x.kind === "explain" && x.skill === sk.id);
  for (let k = 1; k < K.skills.length - 1; k++) {
    const a = firstExplain(K.skills[k]), b = firstExplain(K.skills[k + 1]);
    const between = m.slice(a + 1, b).filter((x) => x.item && !String(x.item).startsWith("diag:"));
    assert.ok(between.length >= 1, `${short(K.skills[k].id)} is practised before ${short(K.skills[k + 1].id)} is taught`);
    for (const x of between) assert.equal(x.skill, K.skills[k].id, `only ${short(K.skills[k].id)} items between its explain and the next skill's`);
  }
});

test("kill switch: TAXILA_R7_SKILL_ARC=off is the classic flow (one explain turn, no worked example, for skills 2..n)", () => {
  process.env.TAXILA_R7_SKILL_ARC = "off";
  try {
    const m = run(2);
    const at = m.findIndex((x) => x.kind === "explain" && x.skill === K.skills[1].id);
    assert.ok(at > 0);
    assert.notEqual(m[at + 1].kind, "worked_example");
  } finally { delete process.env.TAXILA_R7_SKILL_ARC; }
});

test("a skill with no item that has two statement steps gets no worked example (never one made up)", () => {
  const bare = { ...K, items: K.items.map((i) => ({ ...i, hints: [] })) };
  assert.equal(skillWorkedExample({ itemsDone: [], skipped: [] }, bare, K.skills[1].id, null), null);
});

test("the hook has kinds: the kit's own problem as a puzzle on alternate lessons (classes 4-9); the prediction otherwise", () => {
  const s = (seed, classLevel) => ({ seed, ctx: { classLevel } });
  assert.equal(hookKindFor(s(2, 6), K), "puzzle");
  assert.equal(hookKindFor(s(3, 6), K), "predict");
  assert.equal(hookKindFor(s(2, 3), K), "predict", "classes 1-3 keep the everyday prediction");
  assert.equal(hookKindFor(s(2, 6), { ...K, workedExample: undefined }), "predict");
  const m = run(2);
  const hook = m.find((x) => x.kind === "hook");
  assert.match(hook.shape, /the problem in LESSON NOW as a quick puzzle/);
  assert.ok(hook.content.some((l) => l.includes(K.workedExample.problem)), "the puzzle is the kit's worked problem, its own numbers");
});
