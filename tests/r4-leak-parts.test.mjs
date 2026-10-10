// round 4 (stream 4A; r4-latency's blind rewrite review, runs/rewrite-judge on claude/r4-latency, 2026-10-10): answer
// give-aways the leak guard (director/items.js revealsAnswer) missed. (a) A key that names its counted parts: "pyramid mein
// chaar triangles aur ek square hota hai … kitne faces?" (key "5 faces: 1 square and 4 triangles"). (b) A key the question
// names as an option, said as a definition with the question's own describing words: "tumne corner kaha, cube ka woh point
// jahan teen edges milti hain" before "face, edge ya corner?". The drafts are the review's real lines.
import { test } from "node:test";
import assert from "node:assert/strict";
import { revealsAnswer } from "../server/director/items.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const K = kitFromFile(getTopic("c4-maths-ch01-t01"));
const item = (id) => K.items.find((i) => i.id === id);
const PYRAMID = item("c4-maths-ch01-t01-i10");   // "How many faces?" key "5 faces: 1 square and 4 triangles"
const CORNER = item("c4-maths-ch01-t01-rl-o1");   // "… Is that point a face, an edge or a corner?" key "corner"

test("the review's give-aways are leaks now", () => {
  assert.ok(PYRAMID && CORNER, "items exist");
  // D15 (NEEDED, long): the counted parts before the count
  assert.equal(revealsAnswer("Tumne directions se ginne ki koshish ki, par pyramid mein chaar triangles aur ek square hota hai. Ek kaagaz ka pyramid hai: neeche square, aur side mein triangles jo upar ek point pe milte hain. Iske kitne faces hain?", PYRAMID), true);
  assert.equal(revealsAnswer("Pyramid has 4 triangles and 1 square. How many faces does it have?", PYRAMID), true, "English, numerals");
  // D22 (NEEDED, long): the key said as the question's own description
  assert.equal(revealsAnswer("Tumne “corner” kaha—cube ka woh point, jahan teen edges milti hain. Cube shape ke stage prop par teen edges ek point par milti hain. Woh point face, edge ya corner hai?", CORNER), true);
  // D10: confirming the previous answer states the NEXT question's answer
  assert.equal(revealsAnswer("Aarav, tumne ek corner par milti teen edges sahi gin li. Cube shape ke stage prop par teen edges ek point par milti hain. Woh point face, edge ya corner hai?", CORNER), true);
});

test("not leaks: the question alone, one part only, facts that are not the key's parts, a blank, a one-letter key", () => {
  // D2 (the review's other NEEDED long rewrite was length, not a give-away): no key word outside the question
  assert.equal(revealsAnswer("Tum ek edge gin rahe ho; ab usi point par milti teen edges ko ek saath count karo. Cube shape ke stage prop par teen edges ek point par milti hain. Woh point face, edge ya corner hai?", CORNER), false);
  assert.equal(revealsAnswer("Ek kaagaz ka pyramid hai: neeche square, aur side mein triangles jo upar ek point pe milte hain. Iske kitne faces hain?", PYRAMID), false, "the question as written");
  assert.equal(revealsAnswer("Neeche ek square hai. Side wale triangles gino. Iske kitne faces hain?", PYRAMID), false, "one part stated, the child counts the rest");
  const all = new Map(); for (const f of ["c3-maths-ch05-t01", "c4-maths-ch08-t01", "c6-science-ch02-t02"]) for (const i of kitFromFile(getTopic(f)).items) all.set(i.id, i);
  assert.equal(revealsAnswer("It is 2 squares long but 1 square wide.", all.get("c3-maths-ch05-t01-i11")), false, "a key head with no count names facts, not parts");
  assert.equal(revealsAnswer("Salt weighs ___ g; compare that with the puffed rice.", all.get("c4-maths-ch08-t01-i04")), false, "a blank is a prompt");
  assert.equal(revealsAnswer("Look for a cluster of similarly thin roots.", all.get("c6-science-ch02-t02-rl-h2")), false, "the article 'a' is not the key 'A'");
});
