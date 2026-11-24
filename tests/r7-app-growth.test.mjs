// r7 stream E "Then and now" (main 2026-11-08): what became pakka, next to where it started. No new server work: the map's
// secureSince (046), the Notebook's lessons and the made-for list. One entry per skill, newest pakka first, never a count.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const G = await import("../src/child/growth.ts");
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const T = (s) => Date.parse(s);
const skills = [
  { skillId: "a-s1", title: "Fractional units and equal shares", topicId: "t01", state: "secure", secureSince: "2026-11-06T10:00:00Z" },
  { skillId: "b-s1", title: "Equivalent fractions", label: "Equal fractions", topicId: "t03", state: "secure", secureSince: "2026-11-05T10:00:00Z" },
  { skillId: "c-s1", title: "Angles", topicId: "t09", state: "secure", secureSince: null },
  { skillId: "d-s1", title: "Summaries", topicId: "t20", state: "got_it", secureSince: "2026-11-06T10:00:00Z" },
];
const pages = [
  { lessonId: "l3", topicId: "t01", at: T("2026-11-07T10:00:00Z"), topic: "Fractional units again" },
  { lessonId: "l1", topicId: "t01", at: T("2026-11-03T10:00:00Z"), topic: "Fractional units", boards: 1, hint: true },
  { lessonId: "l0", topicId: "t01", at: T("2026-11-02T10:00:00Z"), topic: "Fractional units" },
  { lessonId: "l2", topicId: "t03", at: T("2026-11-04T10:00:00Z"), topic: "Equivalent fractions" },
];
const made = [
  { id: "m1", title: "Fraction pizza", topicId: "t01", at: "2026-11-05T10:05:00Z" },
  { id: "m2", title: "Halves and quarters", topicId: "t01", at: "2026-11-04T10:09:00Z" },
  { id: "m3", title: "After it was pakka", topicId: "t01", at: "2026-11-07T10:00:00Z" },
  { id: "m4", title: "Earlier still", topicId: "t01", at: "2026-11-01T10:00:00Z" },
];

test("only skills that became pakka at a known time, newest first; the child's own label when there is one", () => {
  const e = G.growthEntries(skills, pages, made);
  assert.deepEqual(e.map((x) => x.skillId), ["a-s1", "b-s1"]);
  assert.equal(e[1].title, "Equal fractions");
});

test("then is the FIRST lesson on the topic before it became pakka; a later lesson is never 'then'", () => {
  const [a, b] = G.growthEntries(skills, pages, made);
  assert.equal(a.then.lessonId, "l0");
  assert.equal(b.then.lessonId, "l2");
  const none = G.growthEntries([skills[0]], [pages[0]], []);
  assert.equal(none[0].then, null);
});

test("what helped: made-for pieces on the topic built before it became pakka, the earliest two", () => {
  const [a] = G.growthEntries(skills, pages, made);
  assert.deepEqual(a.helped.map((m) => m.id), ["m4", "m2"]);
  assert.ok(!a.helped.some((m) => m.id === "m3"), "a piece made after it was pakka did not help it");
});

test("never more than a short page; a day the child recognises", () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ skillId: `s${i}`, title: `S${i}`, topicId: "t", state: "secure", secureSince: new Date(T("2026-10-01T00:00:00Z") + i * 864e5).toISOString() }));
  assert.equal(G.growthEntries(many, [], []).length, G.GROWTH_MAX);
  assert.equal(G.dayOf(T("2026-11-06T10:00:00Z")), "6 Nov");
});

test("the Notebook carries it as 'Then and now', with the first board replayable and no counts or scores in its words", async () => {
  const nb = read("src/child/screens/Notebook.tsx");
  assert.match(nb, /\["lessons", "growth", "made", "jar"\]/);
  assert.match(nb, /<BoardPage cid=\{cid\} page=\{thenPage\} young=\{young\} kx noContinue \/>/);
  const { R7 } = await import("../src/copy/en.ts");
  for (const [k, v] of Object.entries(R7).filter(([k]) => k.startsWith("growth.") || k === "nb.growth")) {
    assert.doesNotMatch(v, /\d|score|streak|points|level|wrong|!/i, k);
  }
});
