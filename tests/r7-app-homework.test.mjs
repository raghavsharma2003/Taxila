// r7 stream E homework lane (agreed with F Learning, 2026-11-04; contracts: A Brain 007): Ask?homework=1 matches the
// question, asks "Is this from <topic>?" only for a topic-level match, and starts with purpose "homework".
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("homeworkMatch posts the child's words, returns the match, and gives up quietly (error or > 1.5 s)", async () => {
  const real = globalThis.fetch;
  try {
    const { homeworkMatch } = await import("../src/child/api.ts");
    let seen = null;
    globalThis.fetch = async (url, init) => { seen = { url: String(url), body: JSON.parse(init.body) }; return json({ match: { rung: "topic", topicId: "c6-maths-ch07-t01", subject: "maths", chapter: 7, topicTitle: "Fractions" } }); };
    const m = await homeworkMatch("c1", "what is 1/2 of 10");
    assert.equal(m.topicId, "c6-maths-ch07-t01");
    assert.equal(seen.url, "/api/homework/match");
    assert.deepEqual(seen.body, { childId: "c1", text: "what is 1/2 of 10" });
    globalThis.fetch = async () => json({ error: "empty" }, 400);
    assert.equal(await homeworkMatch("c1", "x"), null);
    // a slow match: aborted at the deadline, and the lesson starts with no topic
    globalThis.fetch = (url, init) => new Promise((_, rej) => init.signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));
    const t0 = Date.now();
    assert.equal(await homeworkMatch("c1", "x", 60), null);
    assert.ok(Date.now() - t0 < 1000);
  } finally {
    globalThis.fetch = real;
  }
});

test("the chip is asked only for a match that names a topic (kit_item, topic)", async () => {
  const { homeworkAsks } = await import("../src/child/api.ts");
  assert.equal(homeworkAsks(null), false);
  assert.equal(homeworkAsks({ rung: "subject", topicId: null, subject: "maths", chapter: null, topicTitle: null }), false);
  assert.equal(homeworkAsks({ rung: "topic", topicId: "t", subject: "maths", chapter: 7, topicTitle: "Fractions" }), true);
  assert.equal(homeworkAsks({ rung: "kit_item", topicId: "t", subject: "maths", chapter: 7, topicTitle: "Fractions", itemId: "i1" }), true);
  assert.equal(homeworkAsks({ rung: "topic", topicId: null, subject: "maths", chapter: 7, topicTitle: null }), false);
});

test("Ask: Yes sends the topic (and the matched kit item); Not this sends matchTopicId null; the start's purpose is homework", () => {
  const a = read("src/child/screens/Ask.tsx");
  assert.match(a, /yes \? \{ text: confirm\.text, topicId: m\.topicId, homework: m\.itemId \? \{ matchItemId: m\.itemId \} : \{\} \}/);
  assert.match(a, /: \{ text: confirm\.text, homework: \{ matchTopicId: null \} \}/);
  assert.match(a, /testid="homework-yes"/);
  assert.match(a, /testid="homework-not-this"/);
  const l = read("src/child/lesson/LessonScreen.tsx");
  assert.match(l, /withPurpose\(bridge\.deps, homework \? "homework" : purposeOf\(variant\)/);
  assert.match(l, /\.\.\.\(extra \?\? \{\}\) \}\)/);
});
