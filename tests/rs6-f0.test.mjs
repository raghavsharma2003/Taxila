// Copied from evals/content-level-v2/tests/ at Day 0 integration (rs6 patches/README.md "Tests"), so npm test gates it.
// F0 selection patch (docs/design/reset/prework/rs6/patches/01-content-f0.patch), applied to a temp copy of
// server/director/items.js and server/content/next-topic.js only. Run: node --test evals/content-level-v2/tests/
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { loadF0Sandbox } from "../evals/content-level-v2/lib/f0-sandbox.mjs";

let sb, I, N;
before(async () => { sb = await loadF0Sandbox(); I = sb.items; N = sb.nextTopic; });
after(() => sb?.cleanup());

const S0 = () => ({ itemsDone: [], skipped: [], skills: {}, seed: 1, ctx: {} });
const H = ["a nudge", "a pointer", "fill ___", "the answer"];
const item = (id, skillId, difficulty, prompt_en, extra = {}) => ({ id, skillId, kind: "practice", difficulty, prompt_en, prompt_hi: prompt_en, answer: "x", acceptable: [], hints: H, ...extra });
/** A dice-shaped class-4 kit: the easiest rung is a dice question, the diagnostic is a dice picture. */
function diceKit({ withGE = false, many = false } = {}) {
  const items = [
    item("t-i01", "t-s1", 1, "A dice is a cube. How many flat faces does it have?"),
    item("t-i02", "t-s1", 2, "Run your finger along a box where two faces meet. Is that line a face, an edge or a corner?"),
    item("t-i03", "t-s2", 2, "How many corners does a cube have?"),
    item("t-i04", "t-s2", 3, "A cuboid box is 3 cm long. How many edges does a cuboid have in all?"),
    item("t-i05", "t-s2", 4, "Nine edges of a drawn cube are visible. How many are hidden from view?"),
    item("t-i06", "t-s3", 3, "How many faces and corners does a square pyramid have?"),
    item("t-i07", "t-s3", 5, "A tent is a triangular prism. Count its faces, edges and corners and check faces plus corners minus edges."),
  ];
  if (many) for (let k = 0; k < 10; k++) items.push(item(`t-x${k}`, "t-s1", 1 + (k % 2), `Warm-up count number ${k} of sticks in a bundle of pencils ${k}`));
  if (withGE) { items.push(item("t-rl-o1", "t-s1", 3, "A photo of a closed parcel shows top, front and right faces. How many faces are hidden?", { ge: 3.3 })); items.push(item("t-rl-h1", "t-s3", 4, "A museum roof is a square pyramid. Give its faces and corners together.", { ge: 3.8 })); }
  return {
    topicId: "c4-maths-ch01-t01", skills: [{ id: "t-s1", title: "a" }, { id: "t-s2", title: "b" }, { id: "t-s3", title: "c" }], items,
    misconceptions: [{ id: "t-m1", belief: "counts only visible faces", signs: [], remediation: { representation: "box", moveShape: "x" },
      diagnostic: { prompt_en: "Look at a picture of a dice. You can see 3 faces. How many faces does the dice have in all?", prompt_hi: "dice", options: [{ text: "6", correct: true, misconceptionId: null }, { text: "3", correct: false, misconceptionId: "t-m1" }] } }],
  };
}

test("F0: the dice rung (difficulty 1, ge proxy C-2) is never item 1 or 2 for an on-track child", () => {
  const kit = diceKit();
  const q = I.buildPracticeQueue(kit);
  assert.notEqual(q[0], "t-i01"); assert.notEqual(q[1], "t-i01");
  for (const id of q.slice(0, 2)) assert.ok(I.itemGE(kit.items.find((i) => i.id === id), 4) > 2, `${id} is ge <= C-2`);
});

test("F0: the diagnostic is third or later and never on item 1's motif", () => {
  const kit = diceKit();
  const q = I.buildPracticeQueue(kit);
  const at = q.indexOf("diag:t-m1");
  assert.ok(at >= 2, `diagnostic at index ${at}`);
  const first = kit.items.find((i) => i.id === q[0]);
  if (at === 2) assert.equal(I.sameMotif(I.diagnosticItem(kit, kit.misconceptions[0]), first), false);
});

test("F0: a weak child may open on the gentlest rung", () => {
  const q = I.buildPracticeQueue(diceKit(), { weak: true, theta: 1.5 });
  assert.equal(q[0], "t-i01");
});

test("F0: the cap keeps every skill and the hardest item, dropping the easiest first", () => {
  const kit = diceKit({ many: true });
  const q = I.buildPracticeQueue(kit);
  assert.ok(q.length <= I.QUEUE_MAX);
  for (const sk of ["t-s1", "t-s2", "t-s3"]) assert.ok(q.some((id) => kit.items.find((i) => i.id === id)?.skillId === sk), `skill ${sk} missing`);
  assert.ok(q.includes("t-i07"), "the hardest item was cut");
  const kept = q.filter((id) => id.startsWith("t-x")).length;
  assert.ok(kept < 10, "warm-up items should be the ones dropped");
});

test("F0: measured ge beats the proxy for items 1-2, and the opener floor holds (ge >= C-1)", () => {
  const kit = diceKit({ withGE: true });
  const q = I.buildPracticeQueue(kit);
  assert.deepEqual(new Set(q.slice(0, 2)), new Set(["t-rl-o1", "t-rl-h1"]));
});

test("F0 off (TAXILA_CONTENT_F0=off): the legacy order is unchanged (dice first, diagnostic second)", () => {
  process.env.TAXILA_CONTENT_F0 = "off";
  try { const q = I.buildPracticeQueue(diceKit()); assert.equal(q[0], "t-i01"); assert.equal(q[1], "diag:t-m1"); }
  finally { delete process.env.TAXILA_CONTENT_F0; }
});

test("harder one: next step up in ge, reaching past the queue; easier one: gentlest by ge", () => {
  const kit = diceKit({ withGE: true });
  const s = { ...S0(), queue: I.buildPracticeQueue(kit), activeItemId: "t-i03" };
  const h = I.selectNext(s, kit, { harder: true });
  assert.ok(I.itemGE(h, 4) > I.itemGE(kit.items.find((i) => i.id === "t-i03"), 4));
  const s2 = { ...S0(), queue: kit.items.map((i) => i.id), activeItemId: null };
  assert.equal(I.selectNext(s2, kit, { easier: true }).id, "t-i01");
  const top = { ...S0(), itemsDone: kit.items.filter((i) => i.id !== "t-i07").map((i) => i.id), activeItemId: "t-i05" };
  assert.equal(I.harderThan(top, kit)?.id, "t-i07");
});

test("fast-forward: two fast unaided rights skip the warm-up rungs; three in a row skip the skill; test-out needs 3 on-grade", () => {
  const kit = diceKit({ many: true });
  const skips = I.fastForwardSkips(S0(), kit, [{ itemId: "t-i02", correct: true, unaided: true, ms: 6000 }, { itemId: "t-x1", correct: true, unaided: true, ms: 5000 }]);
  assert.ok(skips.includes("t-i01") && skips.includes("t-x0"));
  assert.ok(!skips.includes("t-i02"));
  const slow = I.fastForwardSkips(S0(), kit, [{ itemId: "t-i02", correct: true, unaided: true, ms: 60000 }, { itemId: "t-x1", correct: true, unaided: true, ms: 5000 }]);
  assert.equal(slow.length, 0);
  const three = I.fastForwardSkips(S0(), kit, ["t-i03", "t-i04", "t-i05"].map((itemId) => ({ itemId, correct: true, unaided: true, ms: 90000 })));
  assert.equal(three.length, 0, "t-s2 has nothing left after these three");
  const k2 = diceKit({ withGE: true });
  // on grade = ge >= C-0.5 = 3.5: t-rl-h1 3.8, t-i07 4.0 (proxy), t-i05 3.5 (proxy); t-rl-o1 3.3 is not
  assert.equal(I.testedOut(k2, [{ itemId: "t-rl-o1", correct: true }, { itemId: "t-rl-h1", correct: true }, { itemId: "t-i07", correct: true }]), false);
  assert.equal(I.testedOut(k2, [{ itemId: "t-rl-h1", correct: true }, { itemId: "t-i07", correct: true }, { itemId: "t-i05", correct: true }]), true);
  assert.equal(I.testedOut(k2, [{ itemId: "t-rl-h1", correct: true }, { itemId: "t-i07", correct: true }, { itemId: "t-i05", correct: true, unaided: false }]), false);
});

test("next-topic: start where the school is (chapter, placement GE, calendar), wrap to earlier topics", () => {
  const order = ["a1", "a2", "b1", "c1", "c2", "d1"];
  const ch = { a1: 1, a2: 1, b1: 2, c1: 3, c2: 3, d1: 4 };
  const topicOf = (id) => ({ chapter: { number: ch[id] } });
  assert.equal(N.schoolStartIndex(order, topicOf, { classLevel: 4, chapter: 3 }), 3);
  assert.equal(N.schoolStartIndex(order, topicOf, { classLevel: 4, startGE: 3.15 }), 2); // ch 2
  assert.equal(N.schoolStartIndex(order, topicOf, { classLevel: 4, startGE: 1.0 }), 0); // below the class: chapter 1
  assert.equal(N.schoolStartIndex(order, topicOf, { classLevel: 4, date: "2026-04-05" }), 0);
  assert.ok(N.schoolStartIndex(order, topicOf, { classLevel: 4, date: "2026-10-04" }) >= 2);
  const status = { c1: "learned", c2: "learned", d1: "learned" };
  assert.equal(N.pickTopic(order, (id) => status[id] ?? "unseen", () => [], { start: 3 }), "a1", "wraps to the earliest not-done topic");
  assert.equal(N.pickTopic(order, () => "unseen", () => [], { start: 2 }), "b1");
  assert.equal(N.pickTopic(order, () => "unseen", () => []), "a1", "start 0 is the pre-F0 behaviour");
});

test("next-topic: a new class-4 child on 4 Oct does not start at ch01-t01 (the dice topic)", async () => {
  globalThis.__rs6Rows = [];
  const t = await N.nextTopicFor({ id: "kid", class_level: 4 }, { date: "2026-10-04" });
  assert.ok(t && t.id !== "c4-maths-ch01-t01" && t.chapter.number >= 5, `started at ${t?.id}`);
  const t2 = await N.nextTopicFor({ id: "kid", class_level: 4, school_chapter: { maths: 2 } }, { date: "2026-10-04" });
  assert.equal(t2.chapter.number, 2);
  process.env.TAXILA_CONTENT_F0 = "off";
  try { assert.equal((await N.nextTopicFor({ id: "kid", class_level: 4 }, { date: "2026-10-04" })).id, "c4-maths-ch01-t01"); }
  finally { delete process.env.TAXILA_CONTENT_F0; }
});

test("real kits, patch alone (no overlay): the c4 dice topic no longer opens with the dice", () => {
  const topic = sb.curriculum.getTopic("c4-maths-ch01-t01");
  const kit = sb.kits.kitFromFile(topic);
  const q = I.buildPracticeQueue(kit);
  assert.notEqual(q[0], "c4-maths-ch01-t01-i01"); assert.notEqual(q[1], "c4-maths-ch01-t01-i01");
  assert.ok(q.indexOf("diag:c4-maths-ch01-t01-m-visible-only") >= 2);
});
