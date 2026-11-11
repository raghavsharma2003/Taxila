// dc-r8-director20 R1: what she says around a child's aside is Learning's (data/lesson-aside-replies.json); brain/asideReplies.js picks
// the kind from the aside's words, fills {aside} in her voice and {word} with a word the child said, and applies the data's four rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asideKindOf, isSadAside, asideReturnLine, asideReplyLine, asideInHerVoice, asideReplyForms } from "../server/brain/asideReplies.js";
import { asideReplyErrors } from "../scripts/lesson-scripts/check.mjs";

const DATA = JSON.parse(readFileSync(new URL("../data/lesson-aside-replies.json", import.meta.url), "utf8"));

test("R1: the library passes Learning's own validator", () => {
  assert.deepEqual(asideReplyErrors(DATA), []);
});

test("R1: the kind by a whole match word, else 'other' (never the first kind in the file)", () => {
  assert.equal(asideKindOf("kal maine cricket khela, sixer maara"), "sport");
  assert.equal(asideKindOf("mera bhai aaya"), "people");
  assert.equal(asideKindOf("Doraemon dekha"), "show");
  assert.equal(asideKindOf("Virat"), "other");
  assert.equal(asideKindOf("trophy mili"), "other");
});

test("R1 rule 3: sad by whole words, not when negated, not the other side's loss, not a shot in a game", () => {
  assert.equal(isSadAside("mera kutta bimaar hai"), true);
  assert.equal(isSadAside("usne mujhe maara"), true);
  assert.equal(isSadAside("chot nahi lagi"), false);
  assert.equal(isSadAside("dusri team haar gayi"), false);
  assert.equal(isSadAside("Roblox khela"), false);
  assert.equal(isSadAside("jab Virat chauka maarta hai, woh"), false);
  assert.equal(isSadAside("kal maine cricket khela, sixer maara"), false);
  assert.equal(asideReturnLine("mera kutta", { said: "mera kutta bimaar hai" }), null, "no return question on a sad aside");
  assert.equal(asideReplyLine({ said: "haan, woh ro raha tha", topic: "kutta", words: ["kutta"] }).form, "sad");
});

test("R1: a return question of the aside's kind, {aside} in her voice, rotated", () => {
  const q = [0, 1, 2].map((n) => asideReturnLine("cricket", { n }));
  assert.equal(new Set(q).size, 3);
  for (const x of q) { assert.match(x, /cricket/i); assert.match(x, /\?$/); }
  assert.match(asideReturnLine("mera bhai", { n: 0 }), /tumhar[ae] bhai/i);
  assert.equal(asideInHerVoice("mera bhai", " ke saath"), "tumhare bhai");
  assert.equal(asideInHerVoice("Maggi", " mein"), "Maggi");
});

test("R1 rules 1 and 4: {word} is a word the child said and no yes, no or time word; asked back, a plain form", () => {
  const r = asideReplyLine({ said: "batting sabse achhi lagti hai", topic: "cricket", words: ["batting"] });
  assert.equal(r.form, "word"); assert.match(r.line, /batting/i); assert.doesNotMatch(r.line, /\{|\?/);
  assert.equal(asideReplyLine({ said: "haan", topic: "cricket", words: ["haan"] }).form, "plain");
  assert.equal(asideReplyLine({ said: "kal", topic: "cricket", words: ["kal"] }).form, "plain");
  assert.equal(asideReplyLine({ said: "aapko kaun pasand hai?", topic: "cricket", words: ["kaun"] }).form, "plain");
  // (a word not in what they said is never put in the slot)
  assert.equal(asideReplyLine({ said: "pata nahi", topic: "cricket", words: ["cricket"] }).form, "plain");
  const F = asideReplyForms();
  assert.ok(F.word.length >= 18 && F.plain.length >= 12 && F.sad.length >= 3);
});
