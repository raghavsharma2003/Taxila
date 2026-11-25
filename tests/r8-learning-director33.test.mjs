// Learning 022 Part 1 (dc-r8-director33; docs/patches/to-learning/022-director33-answer-boards-named-wrong-answers-checker.md): the
// checker's d34 rules. 1 a card posed over a "?" carries an answer board; 2 a step's count of gaps / parts is said over a board that draws
// it (the step's resultBoard, else the worked board); 3 a fraction comparison is computed (C lines); 4 whyAltAsHelp needs wrongIfMis;
// 5 a given that changes inside one problem (G lines); 6 one name on more than two cards (N lines); 7 joints.easierWords. Each on small
// inline fragments and on the real script it was found in (the six live ones and the three staged ones).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boardDrawsQ, qBoardCards, stepCountHits, fractionComparisons, comparisonLines, markedNoWrong, givenChangeLines, nameLines,
  d34JointErrors, d34Errors, d34ReportLines, D34_READY, isD34, D34_JOINTS, beatsOf } from "../scripts/lesson-scripts/check.mjs";

const HI = (hi, en = "x") => ({ hi, en });
// (to-brain 052 D: c4-maths-ch01-t02 live, b3c7e81fd: seven live, two staged)
// (director35 clause 53, release 61: c4-maths-ch01-t02 staged again)
// (director36, 2026-11-25: c6-maths-ch07-t03 live after two passing runs, clause 71)
const LIVE = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01", "c6-maths-ch07-t01", "c6-maths-ch07-t03"];
const STAGED = ["c4-maths-ch01-t02", "c4-maths-ch06-t01"];
const load = (d, t) => JSON.parse(readFileSync(new URL(`../data/${d}/${t}.json`, import.meta.url), "utf8"));
const S = Object.fromEntries([...LIVE.map((t) => [t, load("lesson-scripts", t)]), ...STAGED.map((t) => [t, load("lesson-scripts-staged", t)])]);
// d34: the scripts were fixed after director33; the fault cases read the FROZEN scripts as judged (J), the d34 cases read data/ (S).
const FROZEN = "../tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director33/scripts";
const J = Object.fromEntries([...LIVE, ...STAGED].map((t) => [t, JSON.parse(readFileSync(new URL(`${FROZEN}/${t}.json`, import.meta.url), "utf8"))]));
const ats = (xs) => xs.map((x) => x.at);
/** A one-skill fragment; `card` overrides the first explain card, `skill` the skill, `top` the script. */
const frag = ({ card = {}, skill = {}, top = {} } = {}) => ({
  topicId: "t-frag", terms: [], joints: {},
  skills: [{ skillId: "t-frag-s1", explain: [
    { id: "e1", point: HI("Yeh roti 2 barabar tukdon mein kati hai."), board: { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "circle" } },
      ask: { prompt: HI("Rangin tukda roti ka kaunsa fraction hai?"), key: "1/2", accept: ["aadha"], ...card } },
  ], ...skill }],
  ...top,
});
const Q_BOARD = { template: "compare@1", params: { left: { title: "1 metre", items: ["100 cm"] }, right: { title: "Aadha metre", items: ["?"] } } };
const A_BOARD = { template: "compare@1", params: { left: { title: "1 metre", items: ["100 cm"] }, right: { title: "Aadha metre", items: ["50 cm"] } } };

// ---- 1 a "?" posing board carries an answer board
test("022 rule 1: a board draws \"?\" as it is drawn: an item, an asked mark, an unrolled total left out; a plain board does not", () => {
  assert.equal(boardDrawsQ(Q_BOARD), true);
  assert.equal(boardDrawsQ(A_BOARD), false);
  assert.equal(boardDrawsQ({ template: "fraction-line@1", params: { den: 10, to: 2, mark: 14 } }), true); // (the asked mark is ringed "?")
  assert.equal(boardDrawsQ({ template: "unrolled@1", params: { sides: [4, 8], unit: "cm" } }), true); // (total defaults to "?")
  assert.equal(boardDrawsQ({ template: "fraction-line@1", params: { den: 2, from: 0, to: 1 } }), false);
});

test("022 rule 1: a card posed over a \"?\" with no answerBoard is a hit; with one it is not; an asked step needs its resultBoard", () => {
  assert.deepEqual(ats(qBoardCards(frag({ card: { board: Q_BOARD } }))), ["t-frag-s1/e1"]);
  assert.deepEqual(qBoardCards(frag({ card: { board: Q_BOARD, answerBoard: A_BOARD } })), []);
  assert.deepEqual(qBoardCards(frag()), []);
  const step = (x) => frag({ skill: { workedExample: { problem: HI("p"), givens: [], board: Q_BOARD, steps: [{ ask: { prompt: HI("Kitna?"), key: "50" }, told: HI("50 cm."), ...x }] } } });
  assert.deepEqual(ats(qBoardCards(step({}))), ["t-frag-s1/workedExample.steps[0].ask"]);
  assert.deepEqual(qBoardCards(step({ resultBoard: A_BOARD })), []);
});

test("022 rule 1, real scripts: c4-maths-ch06-t01's eight judged cards (and its s3 asked step), c6-maths-ch07-t03's three, none live", () => {
  const c4 = ats(qBoardCards(J["c4-maths-ch06-t01"])).map((x) => x.replace("c4-maths-ch06-t01-", ""));
  for (const x of ["s2/e2", "s2/c2", "s2/remediation[0].then", "s3/e3", "s3/c1", "s3/c2", "s3/c3", "s3/remediation[0].then"]) assert.ok(c4.includes(x), x);
  assert.deepEqual(c4.filter((x) => !/^s2\/(?:e2|c2|remediation\[0\]\.then)$|^s3\/(?:e3|c1|c2|c3|remediation\[0\]\.then)$/.test(x)), ["s3/workedExample.steps[0].ask"]);
  assert.deepEqual(ats(qBoardCards(J["c6-maths-ch07-t03"])).map((x) => x.replace("c6-maths-ch07-t03-", "")).sort(), ["s1/c2", "s2/c2", "s2/e2"]);
  for (const t of [...LIVE, "c4-maths-ch01-t02"]) assert.deepEqual(qBoardCards(J[t]), [], t);
});

// ---- 2 a step's count over the board it is said over
const LINE = (den, to = 1) => ({ template: "fraction-line@1", params: { den, from: 0, to } });
const worked = (board, steps) => frag({ skill: { workedExample: { problem: HI("p"), givens: [], board, steps } } });
const ROAD = { told: HI("3 khambe raaste ko 4 barabar gaps mein kaatte hain."), ask: { prompt: HI("Kitne gaps?"), key: "4", right: HI("Haan, 4 gap: dono siron par bhi ek-ek gap hai.") } };

test("022 rule 2: \"4 gap\" over a line cut in 2 is a hit; over a line cut in 4, or with a resultBoard that draws 4, it is not", () => {
  const h = stepCountHits(worked(LINE(2), [ROAD]));
  assert.deepEqual(h.map((x) => `${x.field} ${x.n}`), ["told 4", "ask.right 4"]);
  assert.match(h[0].why, /"4 barabar gaps" but the board draws 2/);
  assert.deepEqual(stepCountHits(worked(LINE(4), [ROAD])), []);
  assert.deepEqual(stepCountHits(worked(LINE(2), [{ ...ROAD, resultBoard: LINE(4) }])), []);
  assert.equal(stepCountHits(worked(LINE(2), [{ ...ROAD, resultBoard: LINE(3) }]))[0].boardAt, "resultBoard");
});

test("022 rule 2: gaps over an uncut line are a hit; a part of what is drawn (\"3 gap 1 ke aage\" of 8) and a named mark are not", () => {
  assert.match(stepCountHits(worked(LINE(1), [{ told: HI("Har gap ke ant par ek mark aata hai.") }]))[0].why, /over an uncut board/);
  assert.deepEqual(stepCountHits(worked(LINE(4, 2), [{ told: HI("Pehle 4 gap 1 tak, baaki 3 gap 1 ke aage.") }])), []);
  assert.deepEqual(stepCountHits(worked(LINE(2), [{ told: HI("Tehni 5 ke nishaan se 12 ke nishaan tak hai.") }])), []);
  assert.deepEqual(stepCountHits(worked({ template: "compare@1", params: { left: { title: "a", items: ["1"] }, right: { title: "b", items: ["2"] } } }, [ROAD])), [], "a board whose parts are not counted is not judged");
});

test("022 rule 2: a resultBoard is a board like any other: it is gated (beatsOf lists it under the step's told and confirmation)", () => {
  const k = worked(LINE(2), [{ ...ROAD, resultBoard: LINE(4) }]).skills[0];
  const b = beatsOf({ checks: [], remediation: [], ...k, workedExample: { ...k.workedExample, givens: [] } }, 2).find((x) => x.id === "we.step1.result");
  assert.deepEqual(b.board, LINE(4));
  assert.match(b.line, /4 barabar gaps/);
});

test("022 rule 2, real script: c5-maths-ch02-t01 s1's \"4 gap\" over den 2 and s2's gaps over den 1", () => {
  const h = stepCountHits(J["c5-maths-ch02-t01"]).filter((x) => !x.field.includes("(en)")).map((x) => `${x.at.replace("c5-maths-ch02-t01-", "")} ${x.field}`);
  assert.deepEqual(h, ["s1/workedExample.steps[0] told", "s1/workedExample.steps[0] ask.right", "s2/workedExample.steps[0] told", "s2/workedExample.steps[0] ask.right", "s2/workedExample.steps[1] told"]);
});

// ---- 3 fraction comparisons computed
const cmp = (hi) => fractionComparisons(frag({ card: { why: HI(hi) } })).map((c) => `${c.a} ${c.rel} ${c.b} ${c.value}`);
test("022 rule 3: \"jitna nahi\" is less than; se kam / chhota, se zyada / bada, ke barabar, barabar nahi, tulya and = are computed", () => {
  assert.deepEqual(cmp("Pattiyon par 2/4 ka rang 1/3 ke rang jitna nahi hai."), ["2/4 < 1/3 false"]);
  assert.deepEqual(cmp("Pattiyon par 1/4 ka rang 1/3 ke rang jitna nahi hai."), ["1/4 < 1/3 true"]);
  assert.deepEqual(cmp("1/6 wala hissa 1/3 wale se chhota hai."), ["1/6 < 1/3 true"]);
  assert.deepEqual(cmp("1/4 ka hissa 1/12 se bada hai."), ["1/4 > 1/12 true"]);
  assert.deepEqual(cmp("1/12 ka hissa 1/4 se bada hai."), ["1/12 > 1/4 false"]);
  assert.deepEqual(cmp("4/6, jo 2/3 ke barabar hai."), ["4/6 = 2/3 true"]);
  assert.deepEqual(cmp("2/3 bana, jo 1/2 ke barabar nahi."), ["2/3 != 1/2 true"]);
  assert.deepEqual(cmp("Isliye 1/3 aur 2/6 tulya hain."), ["1/3 = 2/6 true"]);
  assert.deepEqual(cmp("Toh 1/2 = 2/4 = 4/8."), ["1/2 = 2/4 true", "2/4 = 4/8 true"]);
  assert.deepEqual(cmp("Toh 1/2 = 2/5."), ["1/2 = 2/5 false"]);
  assert.deepEqual(cmp("1/3 se chhota hissa 1/4 hai."), ["1/4 < 1/3 true"]);
});

test("022 rule 3: not a comparison of two named fractions: a share between two, one fraction twice, \"jitni jagah\", a reported belief", () => {
  assert.deepEqual(cmp("Hissa 1/3 se chhota par 1/6 se bada chahiye."), []);
  assert.deepEqual(cmp("Jo fraction 1/4 ke upar aur neeche 1 jodkar bana, woh 1/4 ke barabar nahi."), []);
  assert.deepEqual(cmp("Har 1/3 jitni jagah mein do 1/6."), []);
  assert.deepEqual(cmp("Gin kar 1/3 nahi keh sakte; chhota 1/3 se chhota."), []);
  assert.deepEqual(cmp("Bahut bachche sochte hain ki 1/4, 1/3 se bada hai."), ["1/4 > 1/3 reported"]);
});

test("022 rule 3, real script: c6-maths-ch07-t03 s2 e3's point is false (C line), and the nine have no other false comparison", () => {
  const c = comparisonLines(J["c6-maths-ch07-t03"]);
  assert.ok(c.includes("C c6-maths-ch07-t03-s2/explain[2].point [2/4 < 1/3: FALSE]: Pattiyon par 2/4 ka rang 1/3 ke rang jitna nahi hai, toh yahan bhinn badal gaya."), c.join("\n"));
  const all = Object.values(J).flatMap((s) => fractionComparisons(s).filter((x) => x.value === false).map((x) => x.at));
  assert.deepEqual(all, ["c6-maths-ch07-t03-s2/explain[2].point", "c6-maths-ch07-t03-s2/explain[2].simpler"]);
  assert.ok(Object.values(J).flatMap(comparisonLines).length >= 60, "every comparison is listed");
});

// ---- 4 whyAltAsHelp needs wrongIfMis
test("022 rule 4: a marked card with no wrongIfMis is a hit; with one (string or list), or unmarked, it is not", () => {
  const w = HI("Tumne saare tukde gine.");
  assert.deepEqual(ats(markedNoWrong(frag({ card: { whyAlt: w, whyAltAsHelp: true } }))), ["t-frag-s1/e1"]);
  assert.deepEqual(markedNoWrong(frag({ card: { whyAlt: w, whyAltAsHelp: true, wrongIfMis: "2/1" } })), []);
  assert.deepEqual(markedNoWrong(frag({ card: { whyAlt: w, whyAltAsHelp: true, wrongIfMis: ["2/1", "do"] } })), []);
  assert.deepEqual(markedNoWrong(frag({ card: { whyAlt: w } })), []);
});

test("022 rule 4, real scripts: the cards director33 named", () => {
  const h = (t) => ats(markedNoWrong(J[t])).map((x) => x.replace(`${t}-`, ""));
  for (const x of ["s1/e1", "s1/e2", "s1/e3", "s2/e1"]) assert.ok(h("c5-maths-ch02-t03").includes(x), `c5-t03 ${x}`);
  assert.ok(h("c6-maths-ch07-t01").includes("s1/e1"));
  assert.ok(h("c4-maths-ch01-t02").includes("s1/e1"));
  assert.ok(h("c4-maths-ch05-t01").length >= 3);
  assert.ok(h("c4-maths-ch06-t01").length >= 1);
});

// ---- 5 a given that changes inside one problem
test("022 rule 5: a named thing with another number in the next part is a G line; the same number, or another thing, is not", () => {
  const two = (a, b) => givenChangeLines(frag({ skill: { explain: [{ id: "e3", point: HI(a) }], workedExample: { problem: HI(b), givens: [], board: LINE(2), steps: [] } } }));
  assert.match(two("Golu ka scale toot gaya, ab woh 4 se shuru hota hai.", "Golu ka toota scale 3 ke nishaan se shuru hota hai.")[0], /^G t-frag-s1\/e3\.point → t-frag-s1\/workedExample\.problem \(consecutive parts\): "Golu ka scale" 4 then 3/);
  assert.deepEqual(two("Golu ka scale toot gaya, ab woh 3 se shuru hota hai.", "Golu ka toota scale 3 ke nishaan se shuru hota hai."), []);
  assert.deepEqual(two("Golu ki pencil 8 cm hai.", "Golu ka toota scale 3 ke nishaan se shuru hota hai."), []);
});

test("022 rule 5, real script: c4-maths-ch06-t01's Golu scale, 4 in the s1 e3 point and 3 in the s1 worked problem", () => {
  const g = givenChangeLines(J["c4-maths-ch06-t01"]);
  assert.ok(g.some((x) => x.startsWith("G c4-maths-ch06-t01-s1/e3.point → c4-maths-ch06-t01-s1/workedExample.problem (consecutive parts): \"Golu ka scale\" 4 then 3")), g.join("\n"));
});

// ---- 6 one name, one person
test("022 rule 6: a name on three cards of one skill is an N line; on two it is not; a common word in capitals is no name", () => {
  const cards = (n, name) => frag({ skill: { checks: Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, prompt: HI(`${name} ne ${i + 2} roti khayi. Kitni?`), key: String(i + 2) })) } });
  assert.match(nameLines(cards(3, "Pinku"))[0], /^N t-frag-s1: "Pinku" on 3 cards of one skill/);
  assert.deepEqual(nameLines(cards(2, "Pinku")), []);
  assert.match(nameLines(cards(3, "{friend}"))[0], /"\{friend\}" on 3 cards/);
  const common = cards(3, "Line");
  common.skills[0].explain[0].point = HI("Yeh line 2 barabar tukdon mein kati hai.");
  assert.deepEqual(nameLines(common), [], "\"line\" is written in lower case elsewhere: a word, not a name");
});

test("022 rule 6, real script: c4-maths-ch01-t02 skill 3's {friend} on three cards", () => {
  assert.ok(nameLines(J["c4-maths-ch01-t02"]).some((x) => x.startsWith("N c4-maths-ch01-t02-s3: \"{friend}\" on 3 cards of one skill")));
});

// ---- 7 joints.easierWords
const EW = [HI("Aasaan shabdon mein kehti hoon.", "Let me say it in easier words."), HI("Chalo, seedhi baat mein bolti hoon.", "Let me put it simply."), HI("Ab aur aasaan tarah se.", "Now in an easier way.")];
test("022 rule 7: three forms of 8 words or fewer, no \"Hindi\", no question, no digit; required only when on", () => {
  assert.deepEqual(D34_JOINTS, ["easierWords"]);
  const j = (f) => d34JointErrors(frag({ top: { joints: { easierWords: f } } }));
  assert.deepEqual(j(EW), []);
  assert.deepEqual(d34JointErrors(frag()), []);
  assert.match(d34JointErrors(frag(), { required: true })[0], /^joints\.easierWords: 3 forms/);
  assert.match(j(EW.slice(0, 2))[0], /3 forms \(got 2\)/);
  assert.ok(j([EW[0], EW[1], HI("Hindi mein samjhaati hoon.", "In easier words.")]).some((x) => /easierWords\[2\]: says "Hindi"/.test(x)));
  assert.ok(j([EW[0], EW[1], HI("हिंदी में बोलती हूँ.", "In easier words.")]).some((x) => /says "Hindi"/.test(x)));
  assert.ok(j([EW[0], EW[1], HI("Aasaan shabdon mein bolun?", "Easier?")]).some((x) => /asks nothing/.test(x)));
  assert.ok(j([EW[0], EW[1], HI("Aasaan shabdon mein 2 baatein.", "Two easy things.")]).some((x) => /a digit/.test(x)));
  assert.ok(j([EW[0], EW[1], HI("Main ise aur bhi zyada aasaan shabdon mein kehti hoon.", "Easier.")]).some((x) => /\d+ words > 8/.test(x)));
});

// ---- the gate: off D34_READY nothing new is an error; on it (or --d34), 1-4 and 7 are errors and 5, 6 are lines
// d34: D34_READY was empty (2026-11-23); it now holds the nine scripts, so the frozen ones are judged by it without force
test("022: D34_READY is the nine scripts; a script off it carries no d34 error; on it, rules 1-4 and 7 are errors", () => {
  assert.deepEqual([...D34_READY].sort(), [...LIVE, ...STAGED].sort());
  assert.equal(isD34(frag()), false);
  assert.deepEqual(d34Errors({ ...J["c4-maths-ch06-t01"], topicId: "t-off" }), [], "off the list, the frozen faults are no error");
  for (const s of Object.values(J)) assert.equal(isD34(s), true, s.topicId);
  const e = (t) => d34Errors(J[t]);
  assert.ok(e("c4-maths-ch06-t01").some((x) => /^c4-maths-ch06-t01-s2\/e2: posed over a board that draws "\?".*Learning 022 rule 1/.test(x)));
  assert.ok(e("c5-maths-ch02-t01").some((x) => /^c5-maths-ch02-t01-s1\/workedExample\.steps\[0\]\.ask\.right: "4 gap".*Learning 022 rule 2/.test(x)));
  assert.ok(e("c6-maths-ch07-t03").some((x) => /^c6-maths-ch07-t03-s2\/explain\[2\]\.point: .*2\/4 < 1\/3, which is false \(Learning 022 rule 3\)/.test(x)));
  assert.ok(e("c5-maths-ch02-t03").some((x) => /^c5-maths-ch02-t03-s1\/e1: marked whyAltAsHelp with no wrongIfMis.*rule 4/.test(x)));
  for (const t of Object.keys(J)) assert.ok(e(t).some((x) => x.startsWith("joints.easierWords: 3 forms")), t);
  assert.ok(!e("c4-maths-ch06-t01").some((x) => /^G |Golu/.test(x)), "rule 5 is a line, never an error");
  assert.ok(d34ReportLines(J["c4-maths-ch06-t01"]).some((x) => x.startsWith("G ")));
});

// ---- d34: the nine scripts AS THEY STAND (data/), fixed after director33
test("d34: each of the nine scripts passes with --d34 forced (no rule 1, 2, 3, 4 or 7 error)", () => {
  for (const t of [...LIVE, ...STAGED]) assert.deepEqual(d34Errors(S[t], { force: true }), [], t);
});

test("d34: each fault director33 named is gone from today's scripts", () => {
  const at = (t, xs) => ats(xs).map((x) => x.replace(`${t}-`, ""));
  // rule 1: c4-maths-ch06-t01's "?" cards and c6-maths-ch07-t03's three now carry answer boards
  assert.deepEqual(qBoardCards(S["c4-maths-ch06-t01"]), []);
  assert.deepEqual(qBoardCards(S["c6-maths-ch07-t03"]), []);
  // rule 2: c5-maths-ch02-t01's "4 gap" over den 2 (s1) and gaps over den 1 (s2)
  assert.deepEqual(stepCountHits(S["c5-maths-ch02-t01"]), []);
  // rule 3: c6-maths-ch07-t03 s2 e3's false "2/4 < 1/3"; no false comparison in any of the nine
  assert.deepEqual(Object.values(S).flatMap((s) => fractionComparisons(s).filter((x) => x.value === false).map((x) => x.at)), []);
  // rule 4: the marked cards with no named wrong answer
  for (const t of ["c5-maths-ch02-t03", "c6-maths-ch07-t01", "c4-maths-ch01-t02", "c4-maths-ch05-t01", "c4-maths-ch06-t01"]) assert.deepEqual(at(t, markedNoWrong(S[t])), [], t);
  // rule 5: Golu's scale, 4 then 3
  assert.ok(!givenChangeLines(S["c4-maths-ch06-t01"]).some((x) => /Golu/.test(x)));
  // rule 6: {friend} on three cards of skill 3
  assert.ok(!nameLines(S["c4-maths-ch01-t02"]).some((x) => x.startsWith("N c4-maths-ch01-t02-s3: \"{friend}\" on 3 cards of one skill")));
});
