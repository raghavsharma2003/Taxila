// round 5 (14.4, main; open-r143-affirm-on-no-answer): her reply never opens by agreeing with an answer that was not right or
// not given, and never with a bare Yes before a right answer that said No (sim lab p30 @f444f064 #6). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { affirmOpenerFix as fix } from "../server/brain/say.js";

test("(a) a not-yet / partly-right answer or an empty turn: the leading affirmation goes, the rest and the name stay", () => {
  assert.deepEqual(fix("Haan! Chalo dekhte hain, aadha kya hota hai?", { empty: true }), { text: "Chalo dekhte hain, aadha kya hota hai?", fix: "strip" });
  assert.equal(fix("Bilkul sahi! Aadha matlab do barabar hisse.", { verdict: "not_yet", answer: "teen" }).text, "Aadha matlab do barabar hisse.");
  assert.equal(fix("Pihu, haan, ek baar aur socho.", { verdict: "partial", name: "Pihu" }).text, "Pihu, ek baar aur socho.", "a tap graded partly");
  assert.equal(fix("हाँ, सही, फिर से सोचो।", { verdict: "not_yet" }).text, "फिर से सोचो।");
});

test("ungraded / unverified turns and a right answer keep their opener", () => {
  assert.equal(fix("Haan, chalo aage badhte hain.", { verdict: "unverified", answer: "pata nahi" }).fix, null);
  assert.equal(fix("Haan, chalo aage badhte hain.", { verdict: null, answer: "kya?" }).fix, null);
  assert.equal(fix("Haan, ek tukda aadha hai.", { verdict: "correct", answer: "aadha" }).fix, null);
  assert.equal(fix("Shabash!", { verdict: "not_yet" }).text, "Shabash!", "nothing would be left: the reply stands (the praise guard owns it)");
  // a word that only starts like one is not an affirmation (sim lab f444f064 OOS p45 #13: "Right-align karke dekhiye")
  assert.equal(fix("Right-align karke dekhiye: 1.6666 mein se 1 ghatao.", { verdict: "not_yet" }).fix, null);
});

test("(b) a right answer that said No: a bare Yes / Haan opener agrees with the child instead", () => {
  assert.equal(fix("Yes, Pihu—earthworm has no legs.", { verdict: "correct", answer: "No — insects have six legs; an earthworm has none", name: "Pihu", lang: "english" }).text,
    "Right, Pihu—earthworm has no legs.");
  assert.equal(fix("Haan, kenchua kida nahi hai.", { verdict: "correct", answer: "nahi, kide ke chhe pair hote hain" }).text, "Sahi, kenchua kida nahi hai.");
  assert.equal(fix("हाँ, केंचुआ कीड़ा नहीं है।", { verdict: "correct", answer: "नहीं" }).text, "सही, केंचुआ कीड़ा नहीं है।");
  assert.equal(fix("Sahi, nahi ka matlab yahi hai.", { verdict: "correct", answer: "nahi" }).fix, null, "an opener that already agrees with their No stays");
});
