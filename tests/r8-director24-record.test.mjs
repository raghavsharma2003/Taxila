// dc-r8-director24 item 1, the seams record: each part's kind is what it is — the hook is no verdict, a check-in is no aside, a miss
// verdict is recorded only where a miss word is said, the closing key turn's verdict is no point, the Hindi switch is in the record.
import { test } from "node:test";
import assert from "node:assert/strict";
import { seamPass } from "../server/brain/seams.js";

const kit = { topicId: "t", __joints: { beforeRemediation: [{ hi: "Ise ek alag tareeke se dekhte hain." }] } };
const run = (list, info = {}) => seamPass(list, { kit, state: { ctx: { lessonKey: "L" } }, lang: "hinglish", info });
const kinds = (r) => r.seams.map((s) => s.right);

test("a miss is recorded only where a miss word is said (K2's fact sentence is no miss verdict)", () => {
  assert.deepEqual(kinds(run([{ part: "close", text: "Do tukde barabar hon tabhi har ek aadha hota." }, { part: "aside", text: "Yahan tak theek hai?" }], { miss: true })), ["verdict", "checkin"]);
  assert.equal(kinds(run([{ part: "close", text: "Nahi, yeh jawab nahi hai." }, { part: "body", text: "Ek roti socho." }], { miss: true, remediation: true }))[0], "missVerdict");
});

test("the greet's simpler is the hook; a check-in is a check-in; the closing key turn's verdict is a verdict", () => {
  assert.deepEqual(kinds(run([{ part: "close", text: "Fraction matlab barabar hisse." }, { part: "closed", text: "Ek roti socho." }], { greet: true })), ["hook", "hook"]);
  assert.deepEqual(kinds(run([{ part: "body", text: "73 cm sahi nahi hai. Iska jawab hai 72 cm, kyunki taar poora kinaara banati hai." }, { part: "aside", text: "Yahan tak theek hai?" }], { authoredEnd: true })), ["missVerdict", "key", "checkin"]);
});

test("the Hindi switch is in the record", () => {
  const r = run([{ part: "body", text: "Haan, Hindi mein samjhaati hoon. Ek roti socho." }], { hindiSwitch: "Haan, Hindi mein samjhaati hoon." });
  // (dc-r8-director25 item 8: with who wrote the form)
  assert.deepEqual(r.seams[0], { left: "start", right: "hindiSwitch", joint: "hindiSwitch", form: "Haan, Hindi mein samjhaati hoon.", by: "authored" });
});

// dc-r8-director25 L2 item 5 (moves the expectation above: the closing key turn's key was folded into its miss verdict): a caption, the
// wrap's parts, greetSimpler and the key are recorded as what they are; the joints said do not change.
test("L2 item 5: a key is its own part, never folded into the miss verdict; a give-up's key is a key", () => {
  assert.deepEqual(kinds(run([{ part: "close", text: "Abhi yeh sahi nahi hai. Is sawaal ka jawab 15 m hai, kyunki 60 ÷ 4 = 15." }, { part: "aside", text: "Yeh hissa saaf hua?" }], { miss: true })), ["missVerdict", "key", "checkin"]);
  assert.deepEqual(kinds(run([{ part: "close", text: "Is sawaal ka jawab 1/2 hai, kyunki rangin tukda 2 mein se 1 hai." }, { part: "aside", text: "Yahan tak theek hai?" }], { miss: true })), ["key", "checkin"]);
  assert.deepEqual(kinds(run([{ part: "simpler", text: "Iska jawab hai 11, kyunki 12 gap ke beech 11 marks hote hain." }, { part: "aside", text: "Ab tak samajh aaya?" }])), ["key", "checkin"]);
  // (the record splits; the line does not: the same words, the same joint into a return to an earlier card)
  const kit2 = { topicId: "t", __joints: { backTo: [{ hi: "Chalo, pichhle sawaal par wapas chalte hain." }] } };
  const r = seamPass([{ part: "close", text: "Nahi, yeh theek nahi hai. Is sawaal ka jawab 2 hai, kyunki do." }, { part: "card", text: "Pizza ka ek chhota tukda lo." }], { kit: kit2, state: { ctx: { lessonKey: "L" } }, lang: "hinglish", info: { miss: true, returnCard: true } });
  assert.deepEqual(kinds(r), ["missVerdict", "key", "returnCard"]);
  assert.equal(r.seams.at(-1).joint, "backTo");
  assert.equal(r.list.length, 3);
});

test("L2 item 5: a caption, greetSimpler and the wrap's parts are recorded as what they are", () => {
  assert.deepEqual(kinds(run([{ part: "body", text: "Yahan do ek jaise gol hain, ek 4 barabar hisson mein." }, { part: "aside", text: "Yahan tak saaf hai?" }], { caption: "Yahan do ek jaise gol hain, ek 4 barabar hisson mein." })), ["caption", "checkin"]);
  assert.deepEqual(kinds(run([{ part: "alt", text: "Dekho, wahi poora ab gol." }, { part: "card", text: "Kitne tukde?" }])), ["caption", "card"]);
  assert.deepEqual(kinds(run([{ part: "close", text: "Aaj hum fractions seekhenge." }, { part: "closed", text: "Socho, ek roti." }], { greet: true, greetSimpler: "Aaj hum fractions seekhenge." })), ["greetSimpler", "hook"]);
  assert.deepEqual(kinds(run([{ part: "body", text: "Achha, theek hai.", kind: "wrapAck" }, { part: "body", text: "Aaj tumne 1/4 lagaya.", kind: "didSentence" }, { part: "body", text: "Aaj ke liye itna hi.", kind: "goodbye" }])), ["wrapAck", "didSentence", "goodbye"]);
  // (after an aside reply a caption takes the joint a point takes)
  const kit3 = { topicId: "t", __joints: { afterAside: [{ hi: "Ab wapas kaam par." }] } };
  const r = seamPass([{ part: "aside", text: "Oh, batting." }, { part: "body", text: "Dekho, wahi poora ab gol." }], { kit: kit3, state: { ctx: { lessonKey: "L" } }, lang: "hinglish", info: { asideAck: true, caption: "Dekho, wahi poora ab gol." } });
  assert.deepEqual(kinds(r), ["asideReply", "caption"]);
  assert.equal(r.seams[1].joint, "afterAside");
});

// (dc-r8-director24 P: a part is said once — gated partOnce reads the e3 point said again with nothing asked, and a card before its point)
test("P: partOnce flags a point said again with nothing asked, and a card posed with its point never said", async () => {
  const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  assert.ok(!PENDING.has("partOnce"));
  const script = { skills: [{ skillId: "s1", explain: [{ id: "e3", point: { hi: "Ab 0 se 1 tak ki ek number line lo. Zero se jitna door, utna bada." }, ask: { prompt: { hi: "Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?" } } }] }] };
  const ctx = { script, o: {}, prevRead: "no_evidence" };
  const pt = { who: "teacher", text: "Ab 0 se 1 tak ki ek number line lo. Zero se jitna door, utna bada." };
  assert.equal(PREDICATES.partOnce("L", pt, 1, ctx), null);
  assert.match(PREDICATES.partOnce("L", pt, 3, { ...ctx, prevRead: "correct" }) ?? "", /e3 point said again/);
  // (dc-r8-director25 H4: a request no longer excuses a point said again — help says the part's other wordings; only "say it again" does)
  assert.match(PREDICATES.partOnce("L", pt, 5, { ...ctx, prevRead: "no_evidence · another" }) ?? "", /e3 point said again/);
  assert.equal(PREDICATES.partOnce("L", pt, 7, { ...ctx, prevRead: "no_evidence · repeat" }), null);
  const ctx2 = { script, o: {}, prevRead: "correct" };
  assert.match(PREDICATES.partOnce("L", { who: "teacher", card: "Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?", text: "Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?" }, 1, ctx2) ?? "", /card posed with its point never said/);
});
