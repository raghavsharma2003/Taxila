// Learning's 2.4 fields wired by Brain: phraseReplies (her reply to the child's answer to return[i] is phraseReplies[i], the child's own
// phrase in her voice) and the version list. (The teach-back, wrap, whyAlt, reask and joints are gated by the dry matrix's predicates.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { phraseOf, asideReplyLine, asideReplyForms } from "../server/brain/asideReplies.js";
import { SCRIPT_VERSIONS } from "../server/director/script.js";

test("2.4 is a script version", () => {
  assert.ok(SCRIPT_VERSIONS.includes(2.4));
});

test("{phrase}: up to three of her words, first person turned to second, a postposition at its end dropped", () => {
  assert.equal(phraseOf("mera bhai"), "tumhara bhai");
  assert.equal(phraseOf("humari team ke saath"), "tumhari team");
  assert.equal(phraseOf("mummy ke saath"), "mummy");
  assert.equal(phraseOf("Mujhe Doraemon sabse achha lagta hai"), "Doraemon");
  for (const x of ["haan", "pata nahi", "kuch nahi", "sab", "aapko kaun pasand hai?", "pichhli baar humari team jeet gayi thi"]) assert.equal(phraseOf(x), null, x);
});

test("phraseReplies[i] answers returns[i]: the return her line asked picks the reply", () => {
  const asked = "Achha. Cricket mein tumhe kya karna sabse achha lagta hai?";
  const r = asideReplyLine({ said: "catch pakadna", topic: "cricket", asked });
  assert.equal(r.form, "phrase");
  assert.match(r.line, /catch pakadna/);
  // (no return of hers in the line: the {word} or plain forms, as before)
  assert.notEqual(asideReplyLine({ said: "catch pakadna", topic: "cricket", asked: "" }).form, "phrase");
  // (a question back to her: never a phrase)
  assert.notEqual(asideReplyLine({ said: "aapko kaun pasand hai?", topic: "cricket", asked }).form, "phrase");
  assert.ok(asideReplyForms().phrase.length > 0);
});

// (main's 026: the key turn shows the teach-back's answerBoard — a unit of its own — never its question board; with none, cleared)
test("026: a wrap that says the teach-back's key holds its answerBoard; a plain wrap draws nothing new", async () => {
  const { heldOf } = await import("../server/brain/propose.js");
  const board = { template: "fraction-parts@1", params: { parts: 9, shade: 4 } };
  const up = { unit: "end:teachback", board: { template: "fraction-parts@1", params: { parts: 9, shade: 4, hideResult: true } } };
  const h = heldOf({ move: { kind: "wrap", scriptBeat: { skillId: "end", beatId: "teachback:answer", kind: "teachback", board } }, kit: null, up });
  assert.equal(h?.unit, "end:teachback:answer");
  assert.deepEqual(h?.board, board);
  const plain = heldOf({ move: { kind: "wrap" }, kit: null, up });
  assert.equal(plain?.unit, "end:teachback");
});
