// The re-levelled overlay merged into the kits (temp dir) and served through the F0-patched queue, over every class 4-7
// topic. These are code invariants on `ge`; the rater-measured too-easy rates are in REPORT.md (served-new).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { loadF0Sandbox } from "../lib/f0-sandbox.mjs";
import { mergeKit } from "../../../data/kits-relevel/merge.mjs";
import { revealsAnswer } from "../../../server/director/items.js";

let sb;
before(async () => { sb = await loadF0Sandbox({ mergedKits: true }); });
after(() => sb?.cleanup());
const SUBJECTS = { 4: ["maths", "evs", "english", "hindi"], 5: ["maths", "evs", "english", "hindi"], 6: ["maths", "science", "sst", "english", "hindi"], 7: ["maths", "science", "sst", "english", "hindi"] };
const topics = () => [4, 5, 6, 7].flatMap((c) => SUBJECTS[c].flatMap((s) => sb.curriculum.topicSequence(c, s).map((id) => ({ c, topic: sb.curriculum.getTopic(id) }))));

test("all 385 class 4-7 topics have an overlay entry", () => {
  const ts = topics();
  assert.equal(ts.length, 385);
  const dir = new URL("../../../data/kits-relevel/", import.meta.url);
  const ids = new Set(readdirSync(dir).filter((f) => /^c\d-[a-z]+\.json$/.test(f)).flatMap((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8")).topics.map((t) => t.topicId)));
  for (const { topic } of ts) assert.ok(ids.has(topic.id), topic.id);
});

test("merged kits: items 1-2 are never ge <= C-2, the diagnostic is never first or second, every topic loads", () => {
  let n = 0;
  for (const { c, topic } of topics()) {
    const kit = sb.kits.kitFromFile(topic);
    assert.ok(kit, `${topic.id} failed to load`);
    const q = sb.items.buildPracticeQueue(kit);
    for (const id of q.slice(0, 2)) {
      assert.ok(!id.startsWith("diag:"), `${topic.id}: diagnostic at ${q.indexOf(id) + 1}`);
      const it = kit.items.find((i) => i.id === id);
      assert.ok(sb.items.itemGE(it, c) > c - 2, `${topic.id}: ${id} ge ${sb.items.itemGE(it, c)}`);
      n++;
    }
  }
  assert.equal(n, 770);
});

test("harder path: an end-of-class item (ge >= C-0.75) in >= 380/385 topics; the harder chip from item 1 never goes down", () => {
  let strict = 0, above = 0;
  const gaps = [];
  for (const { c, topic } of topics()) {
    const kit = sb.kits.kitFromFile(topic);
    const q = sb.items.buildPracticeQueue(kit);
    const s = { itemsDone: [], skipped: [], skills: {}, seed: 1, ctx: {}, queue: q, activeItemId: q[0] };
    const h = sb.items.harderThan(s, kit);
    const g0 = sb.items.itemGE(kit.items.find((i) => i.id === q[0]), c);
    assert.ok(!h || sb.items.itemGE(h, c) > g0, `${topic.id}: harder chip went down`);
    if (h) above++;
    if (kit.items.some((i) => i.kind !== "teachback" && sb.items.itemGE(i, c) >= c - 0.75)) strict++; else gaps.push(topic.id);
  }
  console.log(`# harder path: end-of-class item in ${strict}/385 topics (gaps: ${gaps.join(", ")}); harder chip strictly above item 1 in ${above}/385`);
  assert.ok(strict >= 380, `end-of-class item in only ${strict}/385`);
});

test("the dice opener and the two class-4 copies are dropped; the dice diagnostic is rewritten; ge survives normalizeKit", () => {
  const k4 = sb.kits.kitFromFile(sb.curriculum.getTopic("c4-maths-ch01-t01"));
  assert.ok(!k4.items.some((i) => i.id === "c4-maths-ch01-t01-i01"));
  const d = k4.misconceptions.find((m) => m.id === "c4-maths-ch01-t01-m-visible-only").diagnostic;
  assert.ok(!/dice/i.test(d.prompt_en), d.prompt_en);
  assert.ok(k4.items.some((i) => typeof i.ge === "number"));
  const k6 = sb.kits.kitFromFile(sb.curriculum.getTopic("c6-maths-ch09-t01"));
  assert.ok(!k6.items.some((i) => i.id === "c6-maths-ch09-t01-i01" || i.id === "c6-maths-ch09-t01-i12"));
});

test("hint fixes: no rung 1-3 hint states the key (leak predicate on the bytes)", () => {
  const dir = new URL("../../../data/kits-relevel/", import.meta.url);
  let fixes = 0;
  for (const f of readdirSync(dir).filter((x) => /^c\d-[a-z]+\.json$/.test(x))) {
    const ov = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    const kit = JSON.parse(readFileSync(new URL(`../../../data/kits/${f}`, import.meta.url), "utf8"));
    const { kit: merged } = mergeKit(kit, ov);
    for (const t of merged.topics) for (const it of t.items) if (it.hintsFixed) {
      fixes++;
      it.hints.slice(0, 3).forEach((h, r) => assert.equal(revealsAnswer(h, it), false, `${it.id} rung ${r + 1}: ${h}`));
    }
  }
  assert.ok(fixes >= 45, `only ${fixes} hint fixes applied`);
});

test("replay: a new class 4, 5, 6 and 7 child's first 10 questions (F0 topic start + queue) are all ge > C-2", async () => {
  globalThis.__rs6Rows = [];
  for (const c of [4, 5, 6, 7]) {
    const t = await sb.nextTopic.nextTopicFor({ id: `kid${c}`, class_level: c }, { date: "2026-10-04" });
    const order = sb.curriculum.topicSequence(c, t.subject);
    const asked = [];
    for (let i = order.indexOf(t.id); asked.length < 10 && i < order.length; i++) {
      const kit = sb.kits.kitFromFile(sb.curriculum.getTopic(order[i]));
      for (const id of sb.items.buildPracticeQueue(kit).slice(0, 5)) {
        if (asked.length >= 10 || id.startsWith("diag:")) continue;
        asked.push({ id, ge: sb.items.itemGE(kit.items.find((x) => x.id === id), c) });
      }
    }
    assert.equal(asked.length, 10);
    for (const a of asked) assert.ok(a.ge > c - 2, `class ${c}: ${a.id} ge ${a.ge}`);
  }
});
