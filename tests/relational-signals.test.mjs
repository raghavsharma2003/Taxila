// RELATIONAL-OS R1 (BUILD-PLAN W2-I #2): bilingual relational signal predicates (Roman + Devanagari) with negation,
// quotation and third-party exclusions, each measured against negative controls: the conversation-v2 battery (357 class
// 4-7 child utterances, gold intents) is the corpus — a goodbye or a stop must never fire on a lesson turn, and the
// boundary kinds must stay quiet on every non-relational intent.
import { test } from "node:test";
import assert from "node:assert/strict";
import { signalsOf, stopKind, wordCount } from "../server/relational/signals.js";
import { CASES } from "../evals/conversation-v2/cases.mjs";

const kinds = (t) => signalsOf(t).map((s) => s.kind + (s.thirdParty ? "*" : "")).sort();
const fill = (t) => t.replace(/\{key\}/g, "12").replace(/\{wrong\}/g, "15").replace(/\{partial\}/g, "3");

test("each kind fires in English, Roman Hinglish and Devanagari", () => {
  const cases = [
    ["warmth_offer", ["you are my best friend", "Didi aap toh mummy se bhi achhi ho", "आप तो मम्मी से भी अच्छी हो"]],
    ["permanence_ask", ["promise you will never leave me", "Aap kabhi mujhe chhod ke toh nahi jaogi na?", "हमेशा मेरे साथ रहोगी?"]],
    ["secret_ask", ["don't tell my mom ok", "mummy ko mat batana", "मम्मी को मत बताना"]],
    ["contact_ask", ["what's your whatsapp number", "aapka number do na", "आपका नंबर दो"]],
    ["romance", ["will you be my girlfriend?", "aap bahut cute ho", "तुम बहुत सुंदर हो"]],
    ["night_ask", ["can we talk at night when everyone is asleep", "aaj raat ko jab sab so jayein tab baat karein", "आज रात को बात करें"]],
    ["goodbye", ["bye, papa aa gaye", "mummy bula rahi hai", "अलविदा"]],
    ["end_request", ["end the lesson", "lesson khatam karo", "बस, अब खत्म करो"]],
    ["goodbye_distress", ["please don't go", "abhi mat jao na", "मत जाओ"]],
    ["loneliness", ["nobody talks to me at home", "koi mujhse baat nahi karta", "मुझसे कोई बात नहीं करता"]],
    ["identity_q", ["are you a real person?", "tum robot ho kya?", "क्या आप रोबोट हो?"]],
    ["self_label", ["i am so stupid", "main bahut buddhu hoon", "मैं बुद्धू हूं"]],
    ["share_sad", ["my dog died yesterday", "mera tota mar gaya", "मेरी दादी बीमार हैं"]],
  ];
  for (const [kind, texts] of cases) for (const t of texts) assert.ok(kinds(t).some((k) => k.replace("*", "") === kind), `${kind}: ${t} → ${kinds(t)}`);
});

test("negation, quotation and hypothetical frames switch the child's own offers off", () => {
  assert.deepEqual(kinds("I don't love maths"), []);
  assert.deepEqual(kinds("my friend said i love you to her"), []);
  assert.deepEqual(kinds('she wrote "you are my best friend" on the card'), []);
  assert.deepEqual(kinds("what if i said i love you"), []);
  assert.deepEqual(kinds("main tumhari dost nahi"), []);
});

test("a THIRD PARTY asking for a photo, contact or secrecy is the F6 branch (thirdParty), never a boundary moment", () => {
  assert.ok(kinds("Ek online bhaiya hain game wale, bolte hain photo bhejo aur kisi ko mat batana").includes("contact_ask*"));
  assert.ok(kinds("a man on insta asked for my photo").includes("contact_ask*"));
  assert.ok(kinds("ek uncle ne mera number maanga").includes("contact_ask*"));
  assert.ok(!kinds("aapka number do na").includes("contact_ask*"), "asking HER is a plain contact ask");
});

test("stop protocol reading: leaving vs a stop phrase vs a break", () => {
  assert.equal(stopKind("bye, mummy bula rahi hai"), "leaving");
  assert.equal(stopKind("i have to go, my tuition is starting"), "leaving");
  assert.equal(stopKind("I want to end the lesson"), "end_request");
  assert.equal(stopKind("bas"), "end_request");
  assert.equal(stopKind("ek line mein bata do bas"), null, "a trailing 'bas' is 'just', not a stop");
  assert.equal(stopKind("I need to go to the toilet"), null);
  assert.equal(stopKind("paani peeke aata hoon"), null);
  assert.equal(stopKind("we need to go back to question 2"), null);
  assert.equal(stopKind("bas, mummy bula rahi hai, bye"), "leaving", "leaving wins over a bare stop");
});

test("negative controls (conversation-v2 battery, n=357): no goodbye/stop on any lesson intent; boundary kinds quiet off-intent", () => {
  const RELEASE_KINDS = new Set(["goodbye", "end_request", "goodbye_distress"]);
  const BOUNDARY_KINDS = new Set(["warmth_offer", "permanence_ask", "secret_ask", "contact_ask", "night_ask", "loneliness"]);
  const RELATIONAL_INTENTS = new Set(["end_request", "leaving", "distress", "out_of_bounds", "personal_share", "joke", "identity", "small_talk", "diversion", "frustration", "boredom", "multi_intent", "break_request"]);
  let neutral = 0, releaseFalse = [], boundaryFalse = [], anyFalse = 0;
  const recall = { end_request: [0, 0], leaving: [0, 0], identity: [0, 0], joke: [0, 0] };
  for (const c of CASES) {
    const ks = new Set(signalsOf(fill(c.text)).map((s) => s.kind));
    if (c.intent === "end_request") { recall.end_request[1]++; if (ks.has("end_request")) recall.end_request[0]++; }
    if (c.intent === "leaving") { recall.leaving[1]++; if (ks.has("goodbye")) recall.leaving[0]++; }
    if (c.intent === "identity") { recall.identity[1]++; if (ks.has("identity_q")) recall.identity[0]++; }
    if (c.intent === "joke") { recall.joke[1]++; if (ks.has("joke")) recall.joke[0]++; }
    if (RELATIONAL_INTENTS.has(c.intent)) continue;
    neutral++;
    if ([...ks].some((k) => RELEASE_KINDS.has(k))) releaseFalse.push(c.text);
    if ([...ks].some((k) => BOUNDARY_KINDS.has(k))) boundaryFalse.push(c.text);
    if ([...ks].some((k) => !["reason_given", "asked_harder", "contest"].includes(k))) anyFalse++;
  }
  assert.deepEqual(releaseFalse, [], "a lesson turn never reads as a goodbye or a stop");
  assert.deepEqual(boundaryFalse, [], "no boundary move on a lesson turn");
  assert.ok(anyFalse / neutral <= 0.02, `neutral-turn relational triggers ${anyFalse}/${neutral}`);
  assert.deepEqual(recall.end_request, [12, 12]);
  assert.deepEqual(recall.leaving, [5, 5]);
  assert.ok(recall.identity[0] >= 6 && recall.joke[0] >= 7, JSON.stringify(recall));
});

test("word count works for Roman and Devanagari (the withdrawal yardstick)", () => {
  assert.equal(wordCount("upar neeche aage peeche"), 4);
  assert.equal(wordCount("मुझे नहीं पता"), 3);
  assert.equal(wordCount(""), 0);
});
