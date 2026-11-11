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
  s.skills[2].checks[1].prompt.hi = s.skills[2].checks[1].prompt.hi.replace("kis bindu se", "kis point se");
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
