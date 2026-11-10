// Whole-project audit 2026-11-09, area content-data: each test fails on the tree as audited (docs/design/round7/audit/content-data.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { getTopic, topicSequence } from "../server/content/curriculum.js";
import { kitFromFile } from "../server/content/kits.js";
import { askableSkillIds, decidingStates, pickTopic, topicStatus } from "../server/content/next-topic.js";
import { gradePlacement } from "../server/placement/grade.js";

const kitsDir = new URL("../data/kits/", import.meta.url);
const placementDir = new URL("../data/placement/", import.meta.url);
const rawKits = () => readdirSync(kitsDir).filter((f) => /^c\d+-[a-z]+\.json$/.test(f)).flatMap((f) => JSON.parse(readFileSync(new URL(f, kitsDir), "utf8")).topics);
const findItem = (id) => { for (const t of rawKits()) for (const it of t.items) if (it.id === id) return it; throw new Error(id); };
const placement = () => readdirSync(placementDir).filter((f) => f.endsWith(".json") && f !== "index.json")
  .flatMap((f) => JSON.parse(readFileSync(new URL(f, placementDir), "utf8")).items ?? []);

const ALL_TOPICS = ["maths", "science", "evs", "english", "hindi", "sst"].flatMap((subj) => [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((c) => topicSequence(c, subj)));
const masteredRows = (kit) => kit.skills.map((s) => ({ skillId: s.id, status: "mastered", pKnown: 0.95, attempts: 4 }));

test("CD-01: every kit topic can reach 'mastered' once its askable skills are mastered", () => {
  assert.equal(ALL_TOPICS.length, 830);
  const stuck = [];
  for (const id of ALL_TOPICS) {
    const kit = kitFromFile(getTopic(id));
    assert.ok(kit, `kit for ${id}`);
    const askable = askableSkillIds(kit);
    const rows = masteredRows(kit).filter((r) => askable.has(r.skillId));
    const d = decidingStates(rows, askable);
    if (topicStatus(d.states, d.count) !== "mastered") stuck.push(id);
  }
  assert.deepEqual(stuck, []);
});

test("CD-01: a skill with nothing to ask does not hold a topic back (class 5 Hindi ch05 -> ch06)", () => {
  const id = "c5-hindi-ch05-t01";
  const kit = kitFromFile(getTopic(id));
  const askable = askableSkillIds(kit);
  assert.ok(askable.size < kit.skills.length, "this topic has a skill with no item");
  const d = decidingStates(masteredRows(kit).filter((r) => askable.has(r.skillId)), askable);
  const order = topicSequence(5, "hindi");
  const statusOf = (t) => (t === id ? topicStatus(d.states, d.count) : "unseen");
  const picked = pickTopic(order, statusOf, () => []);
  assert.notEqual(picked, id);
  assert.ok(picked && order.includes(picked), "a later topic is picked");
});

test("CD-05: the Hindi prompt asks the same question as the English (later), not first", () => {
  const it = findItem("c1-maths-ch03-t03-i11");
  assert.match(it.prompt_en, /later/);
  assert.doesNotMatch(it.prompt_hi, /Pehle 3 aayega/);
  assert.match(it.prompt_hi, /Baad mein/);
});

test("CD-06: 'an art club' is accepted", () => {
  const it = findItem("c6-english-ch01-t01-rl-h3");
  assert.ok(it.acceptable.some((a) => /\ban\b/.test(a)));
});

test("CD-07: placement 3:25 forms are credited, a wrong time is not", () => {
  const it = placement().find((i) => i.id === "pl-c4-maths-m11");
  for (const a of ["3:25 pm", "3:25 p.m.", "3:25", "3.25", "3:25 PM"]) assert.equal(gradePlacement(it, a), true, a);
  for (const a of ["3:35 pm", "2:25 pm", "3:25 am"]) assert.notEqual(gradePlacement(it, a), true, a);
});

test("CD-09: no kit item or diagnostic the teacher says still names Asha or Riya", () => {
  const NAME = /(?<![A-Za-z])(Riya|Asha)(?![A-Za-z])/;
  const bad = [];
  for (const t of rawKits()) {
    for (const it of t.items) if (NAME.test(JSON.stringify([it.prompt_en, it.prompt_hi, it.answer, it.acceptable, it.hints]))) bad.push(it.id);
    for (const m of t.misconceptions) if (NAME.test(JSON.stringify(m.diagnostic ?? ""))) bad.push(m.id);
  }
  assert.deepEqual(bad, []);
});

test("CD-10: three accepted forms that were wrong are gone", () => {
  assert.ok(!findItem("c3-hindi-ch04-t01-i13").acceptable.includes("चिड़िया"));
  assert.ok(!findItem("c3-hindi-ch09-t01-i08").acceptable.includes("तीन शब्द"));
  const a = findItem("c8-hindi-ch05-t01-i08").acceptable;
  assert.ok(!a.includes("abhi") && !a.includes("अभी"));
});

test("CD-11: the nine corrected lines are corrected", () => {
  const all = JSON.stringify(rawKits()) + JSON.stringify(placement());
  for (const bad of ["ek patli 3 (tin)", "kho-kho match, Kabir held the rope", "Kho-kho match ke dauraan Kabir", "kaun ki aawaaz", "Event B)—and kaunsa", "theory bada hokar", "Usse aur kya chahiye", "ko marne ke liye", "chauṛa", "ek baar baad lagane"]) {
    assert.ok(!all.includes(bad), bad);
  }
});

test("CD-12: the Ashoka diagnostic names both rulers in the question", () => {
  const m = rawKits().flatMap((t) => t.misconceptions).find((x) => x.id === "c7-sst-ch05-t01-m2");
  assert.match(m.diagnostic.prompt_en, /Chandragupta/);
  assert.match(m.diagnostic.prompt_en, /Ashoka/);
});

test("CD-22: the curriculum validator passes", async () => {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, ["data/curriculum/validate.mjs"], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
