// H1 (director4, dc-r7-script-walk-v2): the reactive scripted child (evals/child-sim/reactive.mjs). Deterministic per seed;
// over seeds every persona reaches a right answer, a wrong answer (from the kit misconception when there is one) and every
// scheduled event within MIN_TURNS turns, and never leaves before MIN_TURNS.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EVENTS, MIN_TURNS, PERSONAS, createReactiveChild, nearMiss, rightForms, wrongAnswer } from "../evals/child-sim/reactive.mjs";

const kit = JSON.parse(readFileSync(new URL("../data/kits/c5-maths.json", import.meta.url), "utf8")).topics.find((t) => t.topicId === "c5-maths-ch02-t02");
const misItem = kit.items.find((i) => i.targetsMisconception);

/** A lesson of 26 turns: a keyed card on most turns, a v2 ask on some, plain telling on the rest. */
function runLesson(persona, seed) {
  const c = createReactiveChild({ persona, seed, kit });
  const out = [];
  for (let turn = 0; turn < 26; turn++) {
    const kind = turn % 4;
    const input = kind === 0 ? { turn, teacher: "Dekho, yeh 1/8 hai." }
      : kind === 1 ? { turn, teacher: "Batao?", card: { itemId: misItem.id, key: misItem.answer, accept: misItem.acceptable } }
        : kind === 2 ? { turn, teacher: "Kaunsa bada hai, 1/4 ya 1/8?", ask: { key: "1/4", accept: ["ek bata chaar"], targets: kit.misconceptions[0].id, wrongIfMis: "1/8" }, beat: { skillId: "s1", beatId: "e1" } }
          : { turn, teacher: "Kitne hisse?", card: { itemId: "x", key: "3" } };
    const r = c.reply(input);
    out.push(r);
    if (r.kind === "leave") break;
  }
  return out;
}

test("deterministic: the same seed is the same child", () => {
  assert.deepEqual(runLesson("steady", 11).map((r) => r.text), runLesson("steady", 11).map((r) => r.text));
  assert.notDeepEqual(runLesson("steady", 11).map((r) => r.text), runLesson("steady", 12).map((r) => r.text));
});

for (const persona of PERSONAS) {
  test(`${persona}: over seeds it answers right, answers wrong from the misconception, and plays every event; stays ≥ ${MIN_TURNS} turns`, () => {
    const seen = { right: 0, wrong: 0, wrongFromMis: 0 };
    const events = new Set();
    for (let seed = 1; seed <= 20; seed++) {
      const run = runLesson(persona, seed);
      const leftAt = run.findIndex((r) => r.kind === "leave");
      assert.ok(leftAt === -1 || leftAt >= MIN_TURNS, `${persona}/${seed} left at ${leftAt}`);
      for (const r of run.slice(0, MIN_TURNS)) {
        if (r.kind === "right") seen.right++;
        if (r.kind === "wrong") { seen.wrong++; if (r.wrongFrom) seen.wrongFromMis++; }
        if (r.event) events.add(r.event);
      }
      for (const ev of EVENTS) assert.ok(run.slice(0, MIN_TURNS).some((r) => r.event === ev), `${persona}/${seed}: no ${ev} in ${MIN_TURNS} turns`);
    }
    assert.ok(seen.right > 0 && seen.wrong > 0 && seen.wrongFromMis > 0, JSON.stringify(seen));
    assert.deepEqual([...events].sort(), [...EVENTS].sort());
  });
}

test("right answers come in Hinglish forms; wrong ones are plausible", () => {
  assert.deepEqual(rightForms("3").slice(0, 2), ["3", "teen"]);
  assert.ok(rightForms("1/4").includes("ek bata chaar"));
  assert.ok(rightForms("15 cm").includes("15 cm hai na"));
  const rng = () => 0.3;
  assert.equal(nearMiss("3/5", rng), "5/3");
  assert.match(nearMiss("40", rng), /^\d+$/);
  assert.equal(nearMiss("yes", rng), "no");
  // a v2 ask's own wrongIfMis wins; a kit item's misconception is named as the source
  assert.deepEqual(wrongAnswer({ ask: { key: "1/4", wrongIfMis: "1/8", targets: "m1" } }, kit, rng), { text: "1/8", from: "m1" });
  assert.equal(wrongAnswer({ card: { itemId: misItem.id, key: misItem.answer } }, kit, rng).from, misItem.targetsMisconception);
});

test("the stuck child answers right less often than the steady one (over 40 seeds)", () => {
  const rate = (p) => { let r = 0, n = 0; for (let s = 1; s <= 40; s++) for (const x of runLesson(p, s)) if (x.kind === "right" || x.kind === "wrong") { n++; if (x.kind === "right") r++; } return r / n; };
  assert.ok(rate("stuck") < rate("steady") - 0.15, `stuck ${rate("stuck")} vs steady ${rate("steady")}`);
});
