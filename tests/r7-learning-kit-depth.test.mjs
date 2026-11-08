// Round 7 F class 8-9 kit depth (main 2026-11-08): scripts/kits/kit-gaps.mjs `newItems` — new practice items so every
// skill has a ≥ 3-rung ladder. Lint (shape, ids, coverage), the blind packet (prompt only, never the answer) and apply
// (appended, idempotent). Pure: a synthetic kit topic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lint, blind, apply, wrongArithmetic, kitTopic } from "../scripts/kits/kit-gaps.mjs";

const T = "c8-maths-ch99-t01";
const kit = {
  topicId: T,
  skills: [{ id: `${T}-s1`, title: "A", prereqSkillIds: [] }, { id: `${T}-s2`, title: "B", prereqSkillIds: [] }],
  workedExample: { problem: "w", steps: ["a", "b"], fadedVersion: [], skillId: `${T}-s1` },
  misconceptions: [{ id: `${T}-m-old`, belief: "b", signs: ["x", "y"], diagnostic: { prompt_en: "p", prompt_hi: "p", options: [] }, remediation: { representation: "r", moveShape: "m" } }],
  items: [
    ...[1, 2, 3].map((n) => ({ id: `${T}-i0${n}`, skillId: `${T}-s1`, kind: "practice", prompt_en: `s1 q${n}`, targetsMisconception: `${T}-m-old` })),
    { id: `${T}-i04`, skillId: `${T}-s2`, kind: "practice", prompt_en: "s2 q1", targetsMisconception: `${T}-m-old` },
  ],
};
const example = { skillId: `${T}-s2`, problem: "new problem", givens: ["g"], find: "f", steps: [{ do: "add → total", result: "2 + 3 = 5" }, { do: "check", result: "5" }], answer: "5", why: "parts → whole", source: "ch99 — adding parts" };
const item = (n, over = {}) => ({ id: `${T}-i${String(n).padStart(2, "0")}`, skillId: `${T}-s2`, kind: "practice", difficulty: 2, prompt_en: `new s2 q${n}`,
  prompt_hi: `naya sawaal ${n}`, answer: String(n), acceptable: [], hints: ["pump", "hint", "prompt", "assertion"], source: "ch99 — practice", ...over });
const add = (items) => ({ topicId: T, workedExampleSkill: `${T}-s1`, skillExamples: [example], newMisconceptions: [], newItems: items });

test("newItems: a skill below 3 items after the additions is refused; two new rungs make it clean", () => {
  assert.ok(lint(add([item(5)]), kit).some((e) => /s2: 2 items after the additions, want ≥ 3/.test(e)));
  assert.deepEqual(lint(add([item(5), item(6)]), kit), []);
});

test("newItems: ids, skill, kind, difficulty, both prompts, 4 hints, no copied prompt, never pre-verified", () => {
  const errs = (over) => lint(add([item(5, over), item(6)]), kit);
  assert.ok(errs({ id: "x-i05" }).some((e) => /id must start/.test(e)));
  assert.ok(errs({ id: `${T}-i01` }).some((e) => /duplicates a kit id/.test(e)));
  assert.ok(errs({ skillId: "nope" }).some((e) => /skillId/.test(e)));
  assert.ok(errs({ kind: "quiz" }).some((e) => /kind quiz/.test(e)));
  assert.ok(errs({ difficulty: 7 }).some((e) => /difficulty/.test(e)));
  assert.ok(errs({ prompt_hi: "" }).some((e) => /prompt_hi/.test(e)));
  assert.ok(errs({ hints: ["a", "b", "c"] }).some((e) => /4 hints/.test(e)));
  assert.ok(errs({ prompt_en: "S1 Q1" }).some((e) => /copies a kit prompt/.test(e)));
  assert.ok(errs({ verified: { solverAnswer: "5", agrees: true } }).some((e) => /never authored/.test(e)));
  assert.ok(errs({ answer: "2 + 2 = 5" }).some((e) => /2 \+ 2 = 5/.test(e)), "exact arithmetic in the answer");
});

test("blind packet carries each new item's prompt but never its answer; apply appends and is idempotent", () => {
  const a = add([item(5), item(6)]);
  const { questions, keys } = blind([a]);
  const q = questions.find((x) => x.id === `${T}-i05/item`);
  assert.deepEqual(q, { id: `${T}-i05/item`, kind: "answer", prompt: "new s2 q5" });
  assert.equal(keys.find((x) => x.id === `${T}-i05/item`).key, "5");
  const once = apply(a, kit), twice = apply(a, once);
  assert.equal(once.items.length, kit.items.length + 2);
  assert.equal(twice.items.length, once.items.length);
});

test("arithmetic lint reads Indian digit grouping (lakh commas) as one number, and still catches a wrong sum", () => {
  assert.deepEqual(wrongArithmetic("3500 × 100 = 3,50,000"), []);
  assert.deepEqual(wrongArithmetic("2,50,000 + 50,000 = 3,00,000"), []);
  assert.deepEqual(wrongArithmetic("12 × 1,000 = 12,000"), []);
  assert.equal(wrongArithmetic("3500 × 100 = 3,50,001").length, 1);
  assert.deepEqual(wrongArithmetic("9 × 6 = 54, 9 × 7 = 63"), [], "a list of facts is still judged clause by clause");
});

// ───────────── the c8 maths depth pilot, applied (2026-11-08) ─────────────
const PILOT = ["c8-maths-ch05-t01", "c8-maths-ch11-t01", "c8-maths-ch01-t03", "c8-maths-ch03-t01", "c8-maths-ch04-t01",
  "c8-maths-ch05-t02", "c8-maths-ch06-t02", "c8-maths-ch06-t03", "c8-maths-ch09-t02", "c8-maths-ch10-t01"];

const C8 = JSON.parse(readFileSync(new URL("../data/kits/c8-maths.json", import.meta.url), "utf8")).topics.map((t) => t.topicId);

test("c8 maths (pilot + chapter batches A-C): every skill has a worked example, a ≥ 3-item ladder and a misconception; every item blind-verified", () => {
  assert.ok(PILOT.every((id) => C8.includes(id)));
  for (const id of C8) {
    const k = kitTopic(id);
    const ex = new Set([k.workedExample.skillId, ...(k.skillExamples ?? []).map((x) => x.skillId)]);
    const mis = new Set([...k.items.filter((i) => i.targetsMisconception).map((i) => i.skillId), ...k.misconceptions.map((m) => m.skillId).filter(Boolean)]);
    for (const s of k.skills) {
      assert.ok(ex.has(s.id), `${s.id}: worked example`);
      assert.ok(k.items.filter((i) => i.skillId === s.id).length >= 3, `${s.id}: ladder`);
      assert.ok(mis.has(s.id), `${s.id}: misconception`);
    }
    assert.ok(k.items.every((i) => i.verified?.agrees === true), `${id}: every item verified`);
  }
});

test("c8 pilot scope (NCERT chapter only): no Cantor set; the rectangle converse needs bisecting diagonals; ch11 s1 has its own misconception", () => {
  const fr = kitTopic("c8-maths-ch11-t01"), qd = kitTopic("c8-maths-ch04-t01");
  assert.doesNotMatch(JSON.stringify(fr), /middle third|cantor/i, "the chapter builds the carpet, gasket and Koch snowflake only");
  const s3 = qd.skillExamples.find((e) => e.skillId === "c8-maths-ch04-t01-s3");
  assert.match(s3.problem, /KO = OM and LO = ON/, "the chapter's test: equal diagonals that bisect each other");
  assert.doesNotMatch(JSON.stringify(s3.steps), /parallelogram/i, "t01 does not lean on t03's parallelogram facts");
  assert.ok(fr.misconceptions.some((m) => m.skillId === "c8-maths-ch11-t01-s1"), "a misconception about following the rule");
  assert.equal(fr.items.find((i) => i.id === "c8-maths-ch11-t01-i14").targetsMisconception, "c8-maths-ch11-t01-m-one-piece");
});

test("c9 maths (Ganita Manjari, batches D-F): every skill has a worked example, a ≥ 3-item ladder and a misconception; every item blind-verified", () => {
  const C9 = JSON.parse(readFileSync(new URL("../data/kits/c9-maths.json", import.meta.url), "utf8")).topics.map((t) => t.topicId);
  assert.equal(C9.length, 41);
  for (const id of C9) {
    const k = kitTopic(id);
    const ex = new Set([k.workedExample.skillId, ...(k.skillExamples ?? []).map((x) => x.skillId)]);
    const mis = new Set([...k.items.filter((i) => i.targetsMisconception).map((i) => i.skillId), ...k.misconceptions.map((m) => m.skillId).filter(Boolean)]);
    for (const s of k.skills) {
      assert.ok(ex.has(s.id), `${s.id}: worked example`);
      assert.ok(k.items.filter((i) => i.skillId === s.id).length >= 3, `${s.id}: ladder`);
      assert.ok(mis.has(s.id), `${s.id}: misconception`);
    }
    assert.ok(k.items.every((i) => i.verified?.agrees === true), `${id}: every item verified`);
  }
});

test("scoped adds (language skills only): coverage is judged for the scoped skills; skipped literature skills are not demanded", () => {
  const scoped = { topicId: T, scope: [`${T}-s2`], skillExamples: [example], newMisconceptions: [], newItems: [item(5), item(6)] };
  assert.deepEqual(lint(scoped, kit), [], "s1 (outside the scope) is not asked for");
  assert.ok(lint({ ...scoped, newItems: [item(5)] }, kit).some((e) => /s2: 2 items/.test(e)), "the scoped skill still needs its ladder");
  assert.ok(lint({ ...scoped, scope: [`${T}-s2`, "nope"] }, kit).some((e) => /scope nope/.test(e)));
  assert.ok(lint({ ...scoped, skillExamples: [example, { ...example, skillId: `${T}-s1` }] }, kit).some((e) => /outside the add's scope/.test(e)));
  assert.ok(lint({ ...scoped, newItems: [item(5), item(6, { source: "" })] }, kit).some((e) => /i06: no source/.test(e)), "a scoped add names its source");
  assert.equal(apply(scoped, kit).workedExample.skillId, kit.workedExample.skillId, "no workedExampleSkill → the kit's worked example keeps its own label");
});

test("c8/c9 English and Hindi language-skill depth (scoped): every item blind-verified; every added example cites its source; no literature skill gains a guessed worked-example label", () => {
  for (const f of ["c8-english", "c9-english", "c8-hindi", "c9-hindi"]) {
    const k = JSON.parse(readFileSync(new URL(`../data/kits/${f}.json`, import.meta.url), "utf8"));
    for (const t of k.topics) {
      assert.ok(t.items.every((i) => i.verified?.agrees === true), `${t.topicId}: every item verified`);
      for (const x of t.skillExamples ?? []) assert.ok(String(x.source ?? "").trim(), `${x.skillId}: example source`);
      assert.ok(!("scope" in t), `${t.topicId}: scope is an add's field, never the kit's`);
    }
  }
});
