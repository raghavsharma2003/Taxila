// Round 7 (stream B Voice ↔ F Learning, migration 038 child.name_spoken): she says the child's name the way the parent
// spelled it, on every lane (everything spoken goes through speakable(); every lane's style is styleForChild). Audio only:
// captions and stored turns keep first_name.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sayChildName, speakable } from "../server/voice/spoken.js";
import { styleForChild } from "../server/routes/voice.js";
import { ttsInput } from "../server/voice/speech.js";

const N = { written: "Aarav", spoken: "Aa-rav" };

test("name: whole word, any case, Latin and Devanagari; never inside another word; nothing to do without a spelling", () => {
  assert.equal(sayChildName("Shabash Aarav! aarav, Aaravji.", N), "Shabash Aa-rav! Aa-rav, Aaravji.");
  assert.equal(sayChildName("आरव ठीक", { written: "आरव", spoken: "आ-रव" }), "आ-रव ठीक");
  assert.equal(sayChildName("Aarav", null), "Aarav");
  assert.equal(sayChildName("Aarav", { written: "Aarav", spoken: "Aarav" }), "Aarav");
  assert.equal(sayChildName("A.B", { written: "A.B", spoken: "Ay Bee" }), "Ay Bee", "regex characters in a name are literal");
  assert.equal(speakable("Aarav, 3 aur 4?", { sayName: N }), "Aa-rav, three aur four?");
});

test("name: styleForChild carries the spelling into the spoken cell; ttsInput says it; a child without one is unchanged", () => {
  const child = { id: "c1", first_name: "Aarav", name_spoken: "Aa-rav", class_level: 5, language_pref: "hinglish" };
  const style = styleForChild(child);
  assert.deepEqual(style.spoken.sayName, N);
  assert.match(ttsInput("Bahut accha, Aarav.", style), /Aa-rav/);
  const plain = styleForChild({ ...child, name_spoken: null });
  assert.equal(plain.spoken.sayName, undefined);
  assert.match(ttsInput("Bahut accha, Aarav.", plain), /Aarav/);
});
