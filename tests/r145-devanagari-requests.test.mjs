// census 14.5 (F1, topic not followed; 7 of 15 production lessons): the request patterns were Roman-only, so a child's
// Devanagari ASR line asking for another topic, a picture or a break read as nothing; a "play" word inside an answer read
// as a game request; and "बायाँ" (left) read as a goodbye. A Devanagari line that reads as nothing is now read again in
// Roman letters (the safety layer's devaToRoman), the request patterns are unchanged, and a game must be ASKED for.
// Measured over 4,698 sim-lab child lines (851 Devanagari): 8 readings moved, all listed in context/inbox/r145-4a.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { requestOf, switchSubjectOf, romanLine } from "../server/director/requests.js";

const type = (t) => requestOf(t)?.type ?? null;

test("Devanagari asks for another topic, a switch, a picture, a break, slower, another way, an example are read", () => {
  assert.equal(type("कुछ और पढ़ते हैं"), "change_topic");
  assert.equal(type("कुछ और सीखते हैं"), "change_topic");
  assert.equal(type("दूसरा टॉपिक"), "change_topic");
  assert.equal(type("विषय बदलो"), "change_topic");
  assert.equal(type("मुझे फोटोसिंथेसिस पढ़ना है"), "switch");
  assert.ok(switchSubjectOf("मुझे फोटोसिंथेसिस पढ़ना है"));
  assert.equal(type("पिक्चर दिखाओ न"), "visual");
  assert.equal(type("थोड़ा ब्रेक लेना है"), "break");
  assert.equal(type("धीरे बोलो"), "slower");
  assert.equal(type("दूसरे तरीके से समझाओ"), "another");
  assert.equal(type("उदाहरण दो"), "example");
  // the Roman form of the same ask, which also failed ("padh" + "te")
  assert.equal(type("kuch aur padhte hain"), "change_topic");
});

test("a game must be asked for; 'play' inside an answer is not a request (both scripts)", () => {
  for (const t of ["गेम खेले थोड़ी देर?", "game khelein?", "sorting game karte hain?", "गेम", "let's play a game"]) assert.equal(requestOf(t)?.kind, "game", t);
  for (const t of ["बच्चे खेल रहे थे", "bacche khel rahe the", "khel ka maidan bada hai", "pata nahi... yeh tiles ka game mujhe samajh nahi aa raha"]) assert.notEqual(requestOf(t)?.kind, "game", t);
});

test("'बायाँ' (left) is not a goodbye; 'बाय बाय' is", () => {
  assert.equal(type("दूसरा? क्योंकि वो बायाँ और ऊपर है न"), null);
  assert.equal(type("बाय बाय"), "goodbye");
});

test("'video games' is not an animation ask; a bare 'bana' (make, cook) is not a drawing ask", () => {
  assert.equal(type("video games! Minecraft best hai, aapne khela?"), null);
  assert.equal(type("main ek line banaunga... ya dot bana sakte hain?"), null);
  assert.equal(type("diagram bana do"), "visual");
});

test("romanLine maps loanwords and the schwa rule the patterns expect", () => {
  assert.equal(romanLine("पत्तों के बारे में बताओ"), "patton ke bare mein batao");
  assert.equal(romanLine("पिक्चर दिखाओ"), "picture dikhao");
});
