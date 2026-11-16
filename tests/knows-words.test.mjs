// knows-words.js: the parent's "why" lines from the because records. Every record kind knows.js writes has words in
// Hinglish and English, at least two shapes each, and no internal id reaches the text.
import test from "node:test";
import assert from "node:assert/strict";
import { becauseLine, becauseLines } from "../server/director/knows-words.js";

const S = "c9-test-ch01-t01-s1", T = "c8-test-ch02-t01", M = "c9-test-ch01-t01-m-x", CARD = `script:${S}:c1`;
const RECORDS = [
  { choice: "compress", on: S, fact: { kind: "learned_delayed_check", skillId: S } },
  { choice: "compress_fallback", on: S, fact: { kind: "missed_compress_check", skillId: S, cardId: CARD } },
  { choice: "firstCard", on: "i02", fact: { kind: "closed_badly", itemId: "i02", skillId: S } },
  { choice: "firstCard", on: "i02", fact: { kind: "first_week", itemId: "i02", skillId: S } },
  { choice: "opener", on: "i02", fact: { kind: "gap", days: 9, itemId: "i02", skillId: S } },
  { choice: "opener", on: "i02", fact: { kind: "gap", days: null, itemId: "i02", skillId: S } },
  { choice: "ladderOrder", on: S, fact: { kind: "closed_badly", skillId: S, order: [] } },
  { choice: "checkOrder", on: S, fact: { kind: "open_mixup", misconceptionId: M, skillId: S } },
  { choice: "allKnown", on: T, fact: { kind: "all_learned_delayed_check", skillIds: [S] } },
  { choice: "remedy", on: CARD, fact: { kind: "classified_mixup", misconceptionId: M } },
  { choice: "prereqCheck", on: T, fact: { kind: "wheel_spin", skillId: S, prereqTopicId: T } },
  { choice: "revision", on: T, fact: { kind: "test_soon", insteadOf: "x" } },
  { choice: "revision", on: T, fact: { kind: "first_week", insteadOf: "x" } },
  { choice: "hookSlot", on: S, fact: { kind: "interest", interest: "trains", slotInterest: "vehicles", via: "near" } },
  { choice: "hookSlot", on: S, fact: { kind: "interest", interest: "cricket", slotInterest: "cricket", via: "exact" } },
  { choice: "topic", on: T, fact: { kind: "scripted", insteadOf: "x" } },
  { choice: "practiceOrder", on: T, fact: { kind: "weak", theta: 3.5, weak: true, order: [] } },
  { choice: "practiceOrder", on: T, fact: { kind: "theta", theta: 5.2, weak: false, order: [] } },
  { choice: "practiceDiag", on: "diag:x", fact: { kind: "open_mixup", misconceptionId: M } },
  { choice: "practiceFast", on: "i09", fact: { kind: "fast_unaided", skillId: S } },
  { choice: "practiceEasier", on: "i02", fact: { kind: "two_misses", skillId: S } },
  { choice: "practiceEasier", on: "i02", fact: { kind: "asked", skillId: S } },
];
const ctx = (lang, seed) => ({ lang, seed, name: "Riya", skills: { [S]: { hi: "bhinn ki pehchaan", en: "naming fractions" } }, topics: { [T]: "Halves and quarters" },
  mixups: { [M]: { hi: "bada neeche wala number, bada tukda", en: "a bigger bottom number means a bigger piece" } } });
const BLAME = /\b(fail|failed|wrong|weak|mistake|careless|struggl|disorder|dyscalc|deficit)|galat|kamzor|fail/i;
const ID = /script:|c\d-[a-z]+-ch\d|-s\d\b|-m-|-i\d\d|undefined|null|NaN/;

test("every record kind has words in both languages, two or more shapes, and no id in the text", () => {
  for (const rec of RECORDS) for (const lang of ["hinglish", "english"]) {
    const shapes = new Set(Array.from({ length: 40 }, (_, k) => becauseLine(rec, ctx(lang, k))));
    assert.ok(shapes.size >= 2, `${rec.choice}:${rec.fact.kind} ${lang}: ${shapes.size} shape(s)`);
    for (const t of shapes) { assert.ok(t && t.length > 20, `${rec.choice} ${lang}`); assert.doesNotMatch(t, ID, t); assert.doesNotMatch(t, BLAME, t); assert.match(t, /[.!]$/, t); }
  }
});

test("with no titles given, the words stay generic (never an id)", () => {
  for (const rec of RECORDS) for (const lang of ["hinglish", "english"]) {
    const t = becauseLine(rec, { lang, seed: 3 });
    assert.doesNotMatch(t, ID, t);
  }
});

test("the parent's language decides the words; the same seed gives the same line", () => {
  const rec = RECORDS[0];
  assert.match(becauseLine(rec, ctx("english", 1)), /naming fractions/);
  assert.match(becauseLine(rec, ctx("hinglish", 1)), /bhinn ki pehchaan/);
  assert.equal(becauseLine(rec, ctx("hinglish", 7)), becauseLine(rec, ctx("hinglish", 7)));
});

test("lines: one per record, a mix-up said once across cards, unknown records dropped", () => {
  const r = RECORDS.find((x) => x.choice === "remedy");
  const two = [r, { ...r, on: `script:${S}:c2` }, { choice: "nope", on: "x", fact: { kind: "x" } }, RECORDS[0]];
  assert.equal(becauseLines(two, ctx("english", 1)).length, 2);
  assert.deepEqual(becauseLines([], ctx("english", 1)), []);
});
