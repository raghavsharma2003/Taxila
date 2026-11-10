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

// ---- CD-02, CD-03, CD-04: passages are stored once, carried by the loader, and nothing is dropped by the budget ----
import { normalizeKit, passagesPresentable } from "../server/content/kits.js";

const normalizedAll = () => rawKits().map((t) => ({ raw: t, kit: normalizeKit(t, { topicId: t.topicId, verified: true }) }));

test("CD-04: no item is dropped by the prompt budget in any kit", () => {
  const dropped = normalizedAll().filter(({ kit }) => kit.lint.itemsDropped).map(({ raw, kit }) => `${raw.topicId}:${kit.lint.itemsDropped}`);
  assert.deepEqual(dropped, []);
});

test("CD-03: a passage is stored once per topic or group, never as a topic-level string, and every reference resolves", () => {
  let refs = 0;
  for (const { raw } of normalizedAll()) {
    assert.equal(raw.passage, undefined, `${raw.topicId} still has the old single passage string`);
    const ids = new Set((raw.passages ?? []).map((p) => p.id));
    assert.equal(ids.size, (raw.passages ?? []).length, `${raw.topicId}: duplicate passage ids`);
    assert.equal(new Set((raw.passages ?? []).map((p) => p.text)).size, ids.size, `${raw.topicId}: the same text stored twice`);
    for (const it of raw.items) if (it.passageId) { refs++; assert.ok(ids.has(it.passageId), `${it.id} -> ${it.passageId}`); }
    for (const p of raw.passages ?? []) {
      assert.ok(raw.items.some((it) => it.passageId === p.id), `${p.id} has no item`);
      assert.ok(!/ \/ |\(original/.test(p.text), `${p.id}: poem lines use a line break; no authoring header in the text`);
    }
  }
  assert.ok(refs > 400, `items that depend on a passage: ${refs}`);
});

test("CD-02: classes 5-9 no longer carry the passage inside the prompt: both prompts are the short question", () => {
  const repeats = [];
  for (const { raw } of normalizedAll()) {
    if (!/^c[5-9]-/.test(raw.topicId)) continue;
    for (const it of raw.items) if (it.passageId) {
      const p = raw.passages.find((x) => x.id === it.passageId);
      if (it.prompt_en.includes(p.text.slice(0, 40)) || it.prompt_hi.includes(p.text.slice(0, 40))) repeats.push(it.id);
    }
  }
  assert.deepEqual(repeats, []);
  assert.equal(findItem("c8-english-ch10-t01-i01").prompt_en.includes("grandmother"), false, "the story is not in the English question");
  assert.equal(findItem("c7-english-ch01-t01-rl-g2").prompt_hi.includes("Farah ne poochha"), false, "nor in the Hinglish copy of it");
  assert.equal(findItem("c5-hindi-ch07-t01-i01").prompt_hi.includes("मेरा बचपन"), false, "nor in a Hindi question");
});

test("CD-03: the loader carries passages; an item that needs one is held out until the lesson can show it", () => {
  const t = rawKits().find((x) => x.topicId === "c3-english-ch09-t01");
  const was = process.env.TAXILA_PASSAGES;
  try {
    delete process.env.TAXILA_PASSAGES;
    assert.equal(passagesPresentable(), false);
    const k = normalizeKit(t, { topicId: t.topicId, verified: true });
    assert.equal(k.passages.length, 1);
    assert.match(k.passages[0].text, /Pihu had a wish/);
    assert.ok(k.heldItems.length > 0 && k.heldItems.every((i) => i.passageId === k.passages[0].id));
    assert.ok(k.items.every((i) => !i.passageId), "nothing askable depends on the story");
    assert.ok(k.items.some((i) => i.id === "c3-english-ch09-t01-i05"), "a grammar item that does not need the story is still askable");
    assert.ok(!k.items.some((i) => i.id === "c3-english-ch09-t01-i01"), "'What was Pihu's first wish?' needs the story");
    assert.equal(k.items.length + k.heldItems.length, t.items.length);
    process.env.TAXILA_PASSAGES = "on";
    const on = normalizeKit(t, { topicId: t.topicId, verified: true });
    assert.equal(on.items.length, t.items.length);
    assert.equal(on.heldItems, undefined);
  } finally { was === undefined ? delete process.env.TAXILA_PASSAGES : (process.env.TAXILA_PASSAGES = was); }
});

test("CD-03: every kit still loads with something askable while passages are held", () => {
  for (const { raw, kit } of normalizedAll()) {
    assert.ok(kit, raw.topicId);
    assert.ok(kit.items.filter((i) => i.kind !== "teachback").length >= 1, `${raw.topicId} has nothing askable`);
  }
});

// ---- CD-13, CD-14: placement duplicates are retired (never deleted); close variants share a pairId ----
import { loadBank } from "../server/placement/bank.js";
import { nextItem } from "../server/placement/cat.js";

const placementWithFile = () => readdirSync(placementDir).filter((f) => /^c\d+-/.test(f))
  .flatMap((f) => JSON.parse(readFileSync(new URL(f, placementDir), "utf8")).items.map((it) => ({ it, f })));

test("CD-13/14: one of each exact-duplicate pair and the class-3 sum anchored at class 8 are retired, and still on file", () => {
  const retired = placementWithFile().filter(({ it }) => it.retired).map(({ it }) => it.id).sort();
  assert.deepEqual(retired, ["pl-c3-maths-m01", "pl-c4-evs-e09", "pl-c5-maths-l02", "pl-c5-maths-l05", "pl-c5-maths-l07", "pl-c8-maths-e10", "pl-c8-maths-l10"]);
  const bank = new Set(loadBank().map((i) => i.id));
  for (const id of retired) assert.ok(!bank.has(id), id);
  const key = (it) => `${it.class}|${it.prompt_en.replace(/\W+/g, " ").toLowerCase()}|${it.answer}`;
  const live = loadBank();
  for (const [a, b] of [["pl-c5-maths-m10", "pl-c5-maths-l02"], ["pl-c5-maths-m12", "pl-c5-maths-l07"], ["pl-c5-maths-m11", "pl-c5-maths-l05"], ["pl-c3-maths-e05", "pl-c3-maths-m01"], ["pl-c8-maths-m01", "pl-c8-maths-e10"], ["pl-c4-evs-m02", "pl-c4-evs-e09"]]) {
    assert.ok(live.some((i) => i.id === a), `${a} stays in the bank`);
    assert.ok(!live.some((i) => i.id === b), `${b} is out`);
  }
  assert.equal(new Set(live.map(key)).size, live.length, "no two live items are the same question");
});

test("CD-13: each close-variant pair shares a pairId, and a round never asks both", () => {
  const byPair = Map.groupBy(placementWithFile().filter(({ it }) => it.pairId), ({ it }) => it.pairId);
  assert.equal(byPair.size, 4);
  for (const [pid, rows] of byPair) assert.equal(rows.length, 2, pid);
  for (const [pid, rows] of byPair) {
    const [first, second] = rows.map(({ it, f }) => ({ ...it, class: Number(/^c(\d+)/.exec(f)[1]), subject: f.replace(/^c\d+-|\.json$/g, "") }));
    const pool = loadBank().filter((i) => i.subject === first.subject && i.class === first.class);
    const asked = [{ item: pool.find((i) => i.id === first.id), y: 1 }];
    for (let k = 0; k < 40; k++) {
      const next = nextItem({ classLevel: first.class, pool, asked, rnd: () => (k % 10) / 10 });
      if (!next) break;
      assert.notEqual(next.id, second.id, `${pid}: the variant came up after its pair`);
      asked.push({ item: next, y: k % 2 });
    }
  }
});

test("CD-13: with only a pair's other variant left in the pool, nextItem stops rather than ask it", () => {
  const mk = (id) => ({ id, ge: 3.5, band: "mid", pairId: "pair-x", format: "numeric", subject: "maths", class: 4, answer: "1", prompt_en: id, prompt_hi: id, strand: "maths:core" });
  const a = mk("a"), b = mk("b");
  const next = nextItem({ classLevel: 4, pool: [a, b], asked: [{ item: a, y: 1 }], rnd: () => 0 });
  assert.equal(next, null);
});

// ---- CD-19: the mini-kit generator is gone; every curriculum topic has a kit in its file ----
import { getKit } from "../server/content/index.js";

test("CD-19: every curriculum topic loads from its kit file, and getKit never generates", async () => {
  assert.equal(ALL_TOPICS.length, 830);
  for (const id of ALL_TOPICS) {
    const kit = await getKit(id);
    assert.ok(kit, `${id} has no kit file`);
    assert.equal(kit.verified, true);
    assert.equal(kit.topicId, id);
  }
  assert.equal(await getKit("c1-maths-nope"), null);
  assert.equal(await getKit("c4-maths-ch05-t01", { generate: true }).then((k) => k.topicId), "c4-maths-ch05-t01");
  assert.ok(!readdirSync(new URL("../server/content/", import.meta.url)).includes("minikit.js"));
});
