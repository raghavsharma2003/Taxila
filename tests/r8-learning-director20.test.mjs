// Round 7 F, director20 (dc-r8-director20): her authored replies around an aside; greetSimpler; a card's `ask`; the backTo
// joint; a switch's en is the same line in English. Pure: check.mjs over the pilots and the aside-replies file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asideReplyErrors, greetErrors, jointErrors, structureErrors, kitTopic } from "../scripts/lesson-scripts/check.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];

test("R1: the aside-replies file holds every kind, slots right, nothing asked in a reply, a sad set", () => {
  const d = read("data/lesson-aside-replies.json");
  assert.deepEqual(asideReplyErrors(d), []);
  const bad = structuredClone(d);
  bad.kinds.food.replies[0] = { hi: "Momos mujhe bhi pasand hain, tumhe kaunse pasand hain?", en: "I like momos too, which do you like?" };
  const e = asideReplyErrors(bad);
  assert.ok(e.some((x) => /kinds\.food\.replies\[0\]: exactly one \{word\}/.test(x)) && e.some((x) => /kinds\.food\.replies\[0\]: asks nothing/.test(x)));
  assert.ok(d.sad.replies.every((f) => !/\{/.test(f.hi + f.en)));
});

test("R2 and S1: every pilot has a greetSimpler and five joint kinds; a switch's en says Hindi", () => {
  for (const id of PILOTS) {
    const s = read(`data/lesson-scripts/${id}.json`);
    assert.deepEqual([...greetErrors(s), ...jointErrors(s)], [], id);
    assert.equal(s.joints.backTo.length, 3);
    assert.ok(s.joints.hindiSwitch.every((f) => /hindi/i.test(f.en) && !/english/i.test(f.en)), id);
  }
  const s = read("data/lesson-scripts/c4-maths-ch05-t01.json");
  s.greetSimpler = { hi: "Aaj kya seekhenge?", en: "What will we learn today?" };
  assert.ok(greetErrors(s).some((x) => /one plain sentence, no question/.test(x)));
});

test("S1: a card's ask is its question alone", () => {
  const s = read("data/lesson-scripts-staged/c7-maths-ch02-t01.json");
  const c = s.skills[2].checks.find((x) => x.id === "c1");
  assert.match(c.ask.hi, /A ya B\?$/);
  c.ask = { hi: "Kahani A ya B. Batao.", en: "Story A or B. Tell me." };
  assert.ok(structureErrors(s, kitTopic(s.topicId)).some((x) => /checks\[0\]\.ask: the card's question alone/.test(x) || /\.ask: the card's question alone/.test(x)));
});

test("W1: one term per idea per form; a point may gloss a new term, a card may not mix", async () => {
  const { oneTermErrors } = await import("../scripts/lesson-scripts/check.mjs");
  for (const id of PILOTS) assert.deepEqual(oneTermErrors(read(`data/lesson-scripts/${id}.json`)), [], id);
  const s = read("data/lesson-scripts-staged/c6-maths-ch02-t03.json");
  assert.deepEqual(oneTermErrors(s), []);
  // (its own mixed prompt: the staged card's wording changes with the reader pass)
  s.skills[2].checks[1].prompt.hi = "Ab D ko kis bindu se jodoge, ya kis point se?";
  assert.ok(oneTermErrors(s).some((x) => /checks\[1\]\.prompt: "point" and "bindu" in one form/.test(x)));
  const t = read("data/lesson-scripts-staged/c6-maths-ch02-t01.json");
  assert.deepEqual(oneTermErrors(t), [], "a point's gloss 'line yaani rekha' introduces the term");
});

test("main on R1: no feeling of her own; a people/other return assumes no activity; closings vary across kinds", () => {
  const d = read("data/lesson-aside-replies.json");
  const a = structuredClone(d); a.sad.replies[0] = { hi: "Oh... yeh sunke mujhe bura laga.", en: "Oh... I'm sorry to hear that." };
  assert.ok(asideReplyErrors(a).some((x) => /sad\.replies\[0\]: claims a feeling of her own/.test(x)));
  const b = structuredClone(d); b.kinds.people.returns[1] = { hi: "{aside} ke saath pichhli baar kya khela?", en: "What did you play with {aside} last time?" };
  assert.ok(asideReplyErrors(b).some((x) => /kinds\.people\.returns\[1\]: assumes an activity/.test(x)));
  const closings = new Set(Object.values(d.kinds).map((v) => v.replies[0].hi.replace("{word}", "").trim()));
  assert.ok(closings.size >= 4, "the first reply differs across kinds");
  assert.ok(d.rules.some((r) => /'other'/.test(r)), "selection falls to other");
});

test("W1: a term is glossed once per script", async () => {
  const { oneTermErrors } = await import("../scripts/lesson-scripts/check.mjs");
  const s = read("data/lesson-scripts-staged/c6-maths-ch02-t01.json");
  s.skills[1].explain[0].point.hi = "Yahan bhi line yaani rekha dono taraf chalti hai. " + s.skills[1].explain[0].point.hi;
  assert.ok(oneTermErrors(s).some((x) => /glossed again/.test(x)));
});

test("reader pass rules: one question once per script; crossing cards on a crossing board; a mark is named by its key", async () => {
  const { repeatErrors, crossingBoardErrors, markGroundErrors, figureOf } = await import("../scripts/lesson-scripts/check.mjs");
  const card = (id, hi, key, extra = {}) => ({ id, prompt: { hi, en: hi }, key, ...extra });
  const s = { skills: [{ skillId: "t-s1", explain: [{ id: "e1", point: { hi: "p" }, ask: card("e1", "3/4 = ?/8, upar kya aayega?", "6") }], workedExample: null,
    checks: [card("c1", "Ab 3/4 = ?/8 batao.", "6"), card("c2", "Upar aur neeche ka jod 140° hai. Baayein kitna?", "110°")],
    remediation: [{ targets: "x", say: { hi: "s" }, then: card("t", "Jod 140° hai, toh baayein?", "110°") }] }] };
  const r = repeatErrors(s);
  assert.ok(r.some((x) => /t-s1\/c1: asks the same as t-s1\/e1/.test(x)) && r.some((x) => /remediation\[0\]\.then: reuses t-s1\/c2's exact numbers/.test(x)));
  const x = { skills: [{ skillId: "t-s1", explain: [{ id: "e1", point: { hi: "Is crossing par bagal wala kona dekho." }, ask: { ...card("e1", "Bagal wala kona kitna?", "130°"), board: { template: "angle@1", params: { angles: [{ deg: 50 }] } } } }], checks: [], remediation: [] }] };
  assert.ok(crossingBoardErrors(x).some((m) => /e1: speaks of crossing lines over angle@1/.test(m)));
  x.skills[0].explain[0].ask.board = { template: "lines@1", params: { kind: "cross", deg: 50, angles: [{ at: 1, value: 50 }, { at: 2, value: "?" }] } };
  assert.deepEqual(crossingBoardErrors(x), []);
  assert.equal(figureOf({ template: "lines@1", params: { kind: "cross", deg: 50, angles: [{ at: 2, value: 130 }] } }), figureOf(x.skills[0].explain[0].ask.board), "a labelled answer is the same crossing");
  const m = { skills: [{ skillId: "t-s1", explain: [], checks: [card("c1", "Kaunsa bada, A ya B?", "angle B", { answerBoard: { template: "angle@1", params: { angles: [{ deg: 35, name: "angle A" }, { deg: 110, name: "angle B" }], mark: { index: 0, show: "deg" } } } })], remediation: [] }] };
  assert.ok(markGroundErrors(m).some((e) => /c1\.answerBoard\.mark: not named by the card's key/.test(e)));
  m.skills[0].checks[0].answerBoard.params.mark = { index: 1, show: "bigger" };
  assert.deepEqual(markGroundErrors(m), []);
});

test("reader pass batch 3: a key heard in its own spoken prompt; a key said earlier; a card repeating a kit ladder item", async () => {
  const { spokenKeyErrors, earlierKeyErrors, ladderRepeatErrors } = await import("../scripts/lesson-scripts/check.mjs");
  const card = (id, hi, key, extra = {}) => ({ id, prompt: { hi, en: hi }, key, ...extra });
  const sk = (checks, more = {}) => ({ skills: [{ skillId: "t-s1", explain: [], workedExample: null, checks, remediation: [], ...more }] });
  // her voice says 60,040 as "sixty thousand forty": a read-in-words card speaks its key
  assert.ok(spokenKeyErrors(sk([card("c1", "Chart mein 60,040 hai. Ise words mein kaise padhenge?", "sixty thousand forty")])).some((x) => /c1: its key "sixty thousand forty" is heard/.test(x)));
  // a place card hears its value inside the number; a choice card names its options
  assert.ok(spokenKeyErrors(sk([card("c1", "7382 mein 7 ki value kitni hai?", "7000")])).length > 0);
  assert.deepEqual(spokenKeyErrors(sk([card("c1", "Kaunsa bada hai, 987 ya 1012?", "1,012")])), []);
  // "three hundred" inside "three hundred sixty" is another number
  assert.deepEqual(spokenKeyErrors(sk([card("c1", "360° − 60° kitna hai?", "300°")])), []);
  // an earlier skill's worked example says 4 × 7 = 28 before a later card asks 4 × 7
  const two = { skills: [
    { skillId: "t-s1", explain: [], checks: [], remediation: [], workedExample: { problem: { hi: "8 × 7? Jo fact pata hai, 4 × 7 = 28, uski madad lo." }, steps: [], yourStep: card("y", "Ab 28 ka double?", "56") } },
    { skillId: "t-s2", explain: [], workedExample: null, remediation: [], checks: [card("c1", "4 × 6 = 24 hai. Agla fact 4 × 7 kitna hoga?", "28")] }] };
  assert.ok(earlierKeyErrors(two).some((x) => /t-s2\/c1: its key 28 is already said, with its prompt's 4, 7/.test(x)));
  // in a skill: a then-card whose key a check's why already worked out; a value with another unit is another quantity
  const s = sk([card("c1", "Red 4 bundle, Blue 2 bundle 3 line. Kitne zyada?", "7", { why: { hi: "red 20, blue 2 bundle 3 line = 13, toh 7" } }),
    card("c2", "Wire ₹15 per metre, 20 m. Kitna kharch?", "₹300"), card("c3", "Perimeter 70 cm, lambai 20 cm. Chaudai?", "15 cm")],
    { remediation: [{ targets: "x", say: { hi: "s" }, then: card("t", "Tally mein 2 bundle aur 3 line. Kul kitne?", "13") }] });
  const e = earlierKeyErrors(s);
  assert.ok(e.some((x) => /remediation\[0\]\.then: its key 13 is already said in c1/.test(x)), e.join("\n"));
  assert.ok(!e.some((x) => /c3: its key 15/.test(x)), "₹15 is not 15 cm");
  // the kit ladder
  const kit = { topicId: "t", items: [{ id: "t-i08", prompt_en: "What is 1/4 of 20 marbles?", answer: "5" }] };
  assert.ok(ladderRepeatErrors(sk([card("c1", "In 20 kanchon ka 1/4 kitna hai?", "5")]), kit).some((x) => /repeats kit ladder item i08/.test(x)));
  assert.deepEqual(ladderRepeatErrors(sk([card("c1", "In 28 kanchon ka 1/4 kitna hai?", "7")]), kit), []);
});

test("reader pass batch 4 and pilots: a say that gives its then-card's key; one question frame twice; yes/no keys all one answer", async () => {
  const { thenSayErrors, frameRepeatErrors, yesNoSpreadErrors } = await import("../scripts/lesson-scripts/check.mjs");
  const card = (id, en, key, extra = {}) => ({ id, prompt: { hi: en, en }, key, ...extra });
  const sk = (more) => ({ skills: [{ skillId: "t-s1", explain: [], workedExample: null, checks: [], remediation: [], ...more }] });
  // the say works the then-card's own 4-piece bar and says "do chauthaai": refused; another instance on the same object: fine
  const bad = sk({ remediation: [{ targets: "x", say: { en: "A bar of 4 equal pieces, 2 eaten: that is two quarters." }, then: card("t", "A bar has 4 equal pieces and 2 are eaten. Is that 2/4?", "Yes") }] });
  assert.ok(thenSayErrors(bad).some((x) => /acts out its then-card's own case/.test(x)));
  const ok = sk({ remediation: [{ targets: "x", say: { en: "A bar of 4 equal pieces, 2 eaten: that is two quarters." }, then: card("t", "A bar has 6 equal pieces and 5 are eaten. Is that 5/6?", "Yes") }] });
  assert.deepEqual(thenSayErrors(ok), []);
  const word = sk({ remediation: [{ targets: "x", say: { en: "A tilted square's corner is still a right angle." }, then: card("t", "What kind of angle is the tilted book's corner?", "right angle") }] });
  assert.ok(thenSayErrors(word).some((x) => /states "right angle"/.test(x)));
  // ray KL then ray GH, both "how many endpoints?": one question
  const fr = sk({ checks: [card("c1", "How many endpoints does ray KL have?", "one"), card("c2", "How many endpoints does ray GH have?", "one")] });
  assert.ok(frameRepeatErrors(fr).some((x) => /c2: asks t-s1\/c1's question again/.test(x)));
  // all "No"
  const yn = sk({ checks: [card("c1", "Is 1/3 bigger?", "No"), card("c2", "Is the big piece a third?", "No"), card("c3", "Are these quarters?", "No")] });
  const y = yesNoSpreadErrors(yn);
  assert.ok(y.some((x) => /all 3 yes\/no cards are keyed "no"/.test(x)) && y.some((x) => /c3: the third yes\/no card in a row/.test(x)));
  yn.skills[0].checks[1].key = "Yes";
  assert.deepEqual(yesNoSpreadErrors(yn), []);
});

test("(g) a place-value card's key is solved from its number (batch 3's wrong key: '5281 ka 1' keyed 10)", async () => {
  const { placeValueKeyErrors } = await import("../scripts/lesson-scripts/check.mjs");
  const sk = (c) => ({ skills: [{ skillId: "t-s1", explain: [], workedExample: null, checks: [{ id: "c1", ...c }], remediation: [] }] });
  const bad = placeValueKeyErrors(sk({ prompt: { hi: "Ab 5281 ka 1 dekho. Woh kis jagah par hai, aur uski value kitni hai?", en: "Now look at the 1 of 5281. What is it worth?" }, key: "10", wrongIfMis: "1" }));
  assert.ok(bad.some((x) => /key 10 is not the value of the 1 in 5281/.test(x)) && bad.some((x) => /wrongIfMis 1 is a right value/.test(x)));
  assert.deepEqual(placeValueKeyErrors(sk({ prompt: { hi: "Board par daayein wale number ka 2 dekho. Uski value kitni hai?", en: "Look at the 2 in the number on the right. What is it worth?" }, key: "20", wrongIfMis: "2",
    board: { template: "compare@1", params: { left: { title: "5281", items: ["x"] }, right: { title: "8125", items: ["y"] } } } })), []);
});

test("pilots' third read: a say names only what its then-card's board shows; a Yes card states a positive claim", async () => {
  const { sayBoardNumberErrors, negatedClaimErrors } = await import("../scripts/lesson-scripts/check.mjs");
  const sk = (more) => ({ skills: [{ skillId: "t-s1", explain: [], workedExample: null, checks: [], remediation: [], ...more }] });
  const rem = (say) => sk({ remediation: [{ targets: "x", say: { en: say }, then: { prompt: { en: "A field is 19 m by 8 m. How far round?" }, key: "54 m",
    board: { template: "measured@1", params: { shape: "rectangle", l: 19, b: 8, unit: "m" } } } }] });
  assert.ok(sayBoardNumberErrors(rem("This garden is 13 m by 7 m: add them and double.")).some((x) => /names 13/.test(x)));
  assert.deepEqual(sayBoardNumberErrors(rem("Add the length and the breadth, then double: every side is walked once.")), []);
  const yes = (en) => sk({ checks: [{ id: "c1", prompt: { en, hi: en }, key: "Yes" }] });
  assert.ok(negatedClaimErrors(yes("{friend} says the small piece is not half. Is that right?")).length === 1);
  assert.deepEqual(negatedClaimErrors(yes("{friend} says the bigger piece is more than half. Is that right, haan ya nahi?")), []);
});

test("batch 5: (e2) a card that asks its own skill's ladder item; (f2) one word answer through a skill", async () => {
  const { frameRepeatErrors, wordKeySpreadErrors } = await import("../scripts/lesson-scripts/check.mjs");
  const card = (id, en, key) => ({ id, prompt: { hi: en, en }, key });
  const s = { skills: [{ skillId: "t-s1", explain: [], workedExample: null, remediation: [], ladder: [{ itemId: "c6-maths-ch02-t03-i03" }],
    checks: [card("c1", "A narrow angle sits on a protractor. The two scales show 40 and 140. Which is the angle?", "40°")] }] };
  const kit = { items: [{ id: "c6-maths-ch02-t03-i03", prompt_en: "An angle looks narrow. Where its arm crosses the protractor, the two scales show 40 and 140. Which is right?", answer: "40°, because a narrow angle is small", acceptable: ["40"] }] };
  assert.ok(frameRepeatErrors(s, kit).some((x) => /c1: asks its ladder item i03's question/.test(x)));
  s.skills[0].checks[0].key = "140°";
  assert.ok(!frameRepeatErrors(s, kit).some((x) => /ladder item/.test(x)), "another answer is another question");
  const w = { skills: [{ skillId: "t-s1", explain: [], workedExample: null, remediation: [],
    checks: [card("c1", "Which is more, 2/3 or 4/6?", "same"), card("c2", "Which is more, 1/2 or 3/6?", "barabar"), card("c3", "Which is more, 3/4 or 6/8?", "Same")] }] };
  const f = wordKeySpreadErrors(w);
  assert.ok(f.some((x) => /c3: the third card in a row keyed "same"/.test(x)) && f.some((x) => /all 3 of its choice cards are keyed "same"/.test(x)));
  w.skills[0].checks[1].key = "more";
  assert.deepEqual(wordKeySpreadErrors(w), []);
});

test("(h) main 17:45: no two authored units share a whole sentence, and a simpler never repeats one of what it simplifies", async () => {
  const { sharedSentenceErrors } = await import("../scripts/lesson-scripts/check.mjs");
  const s = { greetSimpler: { hi: "Aaj hum bhinn dekhenge.", en: "Today we look at fractions." }, skills: [{ skillId: "x-s1",
    explain: [{ id: "e1", point: { hi: "Meena aur Raju ke cake ek jaise hain. Meena ne 5/8 khaya.", en: "Two cakes. Meena ate 5/8." },
      simpler: { hi: "Meena aur Raju ke cake ek jaise hain. Dekho kisne kam khaya.", en: "Same cakes. Who ate less?" },
      ask: { prompt: { hi: "{friend} kehta hai 5/8 bada hai. Kya woh sahi hai?", en: "{friend} says 5/8 is bigger. Is that right?" } } }],
    checks: [{ id: "c1", prompt: { hi: "Rahul kehta hai 3/8 bada hai. Kya woh sahi hai?", en: "Rahul says 3/8 is bigger. Is that right?" } }],
    remediation: [{ say: { hi: "Socho, dono mein se ek-ek hissa hata do.", en: "Take one part from each." }, then: { prompt: { hi: "Kaunsa bada, 7/8 ya 9/10?", en: "Which is bigger?" } } }],
    workedExample: { problem: { hi: "Ek patti ke 8 hisse. Socho, dono mein se ek-ek hissa hata do.", en: "A strip in 8 parts." } } }] };
  const e = sharedSentenceErrors(s);
  assert.ok(e.some((x) => /e1\.simpler: a simpler repeats a sentence of what it simplifies with .*e1\.point/.test(x)), e.join("\n"));
  assert.ok(e.some((x) => /workedExample\.problem: two units share a whole sentence with .*remediation\[0\]\.say/.test(x)), e.join("\n"));
  assert.ok(!e.some((x) => /sahi hai|Is that right/.test(x)), "a short question tag closing two cards is allowed");
  assert.equal(e.length, 2, e.join("\n"));
  for (const t of ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"])
    assert.deepEqual(sharedSentenceErrors(read(`data/lesson-scripts/${t}.json`)), [], t);
});
