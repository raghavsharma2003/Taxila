// d38 builder A (to-brain 055, the cap). Step 1: the two gated checks, written before the fix — keyWithWordingUnsaid (C1) and
// questionFifthOnHerOwn (C3), d38a-predicates.mjs — on made rows (both sides) and on the frozen director37 rows they were written for.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { D38A_PREDICATES, wordingsOf, questionOfTurn } = await import("../evals/hybrid-side-by-side/d38a-predicates.mjs");
const { PREDICATES, PENDING, lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");

const RUN = new URL("./fixtures/eval-results/hybrid-side-by-side/results/2026-11-25-director37/", import.meta.url);
const load = (lesson) => { const j = JSON.parse(readFileSync(new URL(`${lesson}.json`, RUN), "utf8")); return { rows: j.director, script: JSON.parse(readFileSync(new URL(`scripts/${j.topicId}.json`, RUN), "utf8")) }; };
const flagsOf = (rows, script, k) => rows.map((r, i) => D38A_PREDICATES[k]({ rows }, r, i, { script })).map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
const T = (text, extra = {}) => ({ who: "teacher", text, seams: [], ...extra });
const C = (text) => ({ who: "child", text });

// A made script: one card with its own simpler and its point's two wordings; a remediation whose follow-up card has a simpler; an asked
// worked step with a Hindi form.
const SCRIPT = { skills: [{ skillId: "t-s1",
  explain: [{ id: "e1", point: "Point one.", pointAlt: { hi: "Point ki doosri baat." }, simpler: { hi: "Point ki aasaan baat." },
    ask: { prompt: { hi: "Do aur do kitne hote hain?" }, reask: { hi: "Toh do jama do kya hua?" }, simpler: { hi: "Ungliyon par gino." }, key: "4" } }],
  workedExample: { problemAlt: { hi: "Sawaal doosri tarah." }, simpler: { hi: "Sawaal aasaan tarah." },
    steps: [{ ask: { prompt: { hi: "Pehle kya karoge, jodoge ya ghataoge?" }, reask: { hi: "Jodoge ya ghataoge, batao?" }, hindi: { hi: "Pehle jodna hai ya ghatana, batao?" } }, simpler: { hi: "Kadam ki aasaan baat." } }] },
  remediation: [{ say: { hi: "Galti ki baat." }, sayAlt: { hi: "Galti ki doosri baat." }, simpler: { hi: "Galti ki aasaan baat." },
    then: { prompt: { hi: "Teen aur ek kitne hote hain?" }, reask: { hi: "Teen jama ek kya hua?" }, simpler: { hi: "Teen se aage ek gino." }, key: "4" } }] }] };
const KEY = { seams: [{ right: "missVerdict" }, { right: "key" }, { right: "checkin" }] };

describe("d38a: the checks are registered and gated", () => {
  test("both in PREDICATES, neither pending", () => { for (const k of ["keyWithWordingUnsaid", "questionFifthOnHerOwn"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); } });
  test("their own lists: the wordings of a card, a follow-up card, an asked step; the question a turn ends on", () => {
    assert.deepEqual(wordingsOf(SCRIPT, "t-s1:e1:card"), ["skills[0].explain[0].ask.simpler", "skills[0].explain[0].pointAlt", "skills[0].explain[0].simpler"]);
    assert.deepEqual(wordingsOf(SCRIPT, "t-s1:rem:0:then"), ["skills[0].remediation[0].then.simpler", "skills[0].remediation[0].sayAlt", "skills[0].remediation[0].simpler"]);
    assert.deepEqual(wordingsOf(SCRIPT, "t-s1:worked:step1:ask"), ["skills[0].workedExample.steps[0].simpler", "skills[0].workedExample.problemAlt", "skills[0].workedExample.simpler"]);
    assert.equal(wordingsOf(SCRIPT, "t:teachback"), null);
    assert.equal(questionOfTurn(SCRIPT, "Achha. Toh do jama do kya hua?"), ".skills[0].explain[0].ask");
    assert.equal(questionOfTurn(SCRIPT, "Ab phir se socho, jawab kya hoga?"), null);
    assert.equal(questionOfTurn(SCRIPT, "Chalo, ab tumhari baari."), null);
  });
});

describe("keyWithWordingUnsaid (C1), made rows", () => {
  const card = "t-s1:rem:0:then";
  const lead = [T("Galti ki baat. Teen aur ek kitne hote hain?", { cell: { part: card } }), C("5"), T("Nahi. Teen se aage ek gino. Teen jama ek kya hua?", { cell: { part: card } }), C("5"),
    T("Nahi. Galti ki doosri baat. Teen aur ek kitne hote hain?", { cell: { part: card } }), C("5")];
  test("a told answer with the remediation's simpler never said flags", () => {
    assert.deepEqual(flagsOf([...lead, T("Nahi. Teen jama ek chaar. Yahan tak theek hai?", { cell: { part: card }, ...KEY })], SCRIPT, "keyWithWordingUnsaid"), [6]);
  });
  test("the same told answer once every wording was said passes; help in its place is no told answer", () => {
    const all = [...lead.slice(0, 5), T("Galti ki aasaan baat. Chalo, ab tumhari baari.", { cell: { part: card } }), C("5")];
    assert.deepEqual(flagsOf([...all, T("Nahi. Teen jama ek chaar. Yahan tak theek hai?", { cell: { part: card }, ...KEY })], SCRIPT, "keyWithWordingUnsaid"), []);
    assert.deepEqual(flagsOf([...lead, T("Galti ki aasaan baat. Chalo, ab tumhari baari.", { cell: { part: card } })], SCRIPT, "keyWithWordingUnsaid"), []);
  });
  test("a wording one of whose sentences has only three words in four in a said sentence is still unsaid", () => {
    assert.deepEqual(flagsOf([...lead.slice(0, 4), T("Nahi. Galti ki doosri baaten. Teen aur ek kitne hote hain?", { cell: { part: card } }), C("5"),
      T("Nahi. Teen jama ek chaar.", { cell: { part: card }, ...KEY })], SCRIPT, "keyWithWordingUnsaid"), [6]);
  });
  test("a told step is read only at the cap: after its question's fourth hearing, not after one miss", () => {
    const sp = "t-s1:worked:step1:ask", told = (extra = {}) => T("Kuch aur hai. Pehle jodenge.", { cell: { part: sp }, stepAnswer: { told: true }, ...extra });
    const Q = (t) => T(t, { cell: { part: sp } });
    assert.deepEqual(flagsOf([Q("Pehle kya karoge, jodoge ya ghataoge?"), C("ghataunga"), told()], SCRIPT, "keyWithWordingUnsaid"), []);
    const four = [Q("Pehle kya karoge, jodoge ya ghataoge?"), C("pata nahi"), Q("Kadam ki aasaan baat. Jodoge ya ghataoge, batao?"), C("pata nahi"),
      Q("Sawaal doosri tarah. Pehle kya karoge, jodoge ya ghataoge?"), C("pata nahi"), Q("Jodoge ya ghataoge, batao?"), C("pata nahi")];
    assert.deepEqual(flagsOf([...four, told()], SCRIPT, "keyWithWordingUnsaid"), [8]);
    const allSaid = [...four.slice(0, 6), Q("Sawaal aasaan tarah. Jodoge ya ghataoge, batao?"), C("pata nahi")];
    assert.deepEqual(flagsOf([...allSaid, told()], SCRIPT, "keyWithWordingUnsaid"), []);
  });
});

describe("keyWithWordingUnsaid read to main's ruling (RULING-A2 A(i), B, C), made rows", () => {
  const card = "t-s1:e1:card", Q = "Do aur do kitne hote hain?", R = "Toh do jama do kya hua?";
  const at = (t) => T(t, { cell: { part: card } });
  const four = [at(Q), C("5"), at(`Nahi. ${R}`), C("5"), at(`Nahi. ${Q}`), C("phir se bolo"), at(Q), C("5")];
  const told = at("Nahi. Do jama do chaar. Yahan tak theek hai?"); Object.assign(told, KEY);
  test("A(i): a told answer after a C1 turn at that question (after the fourth hearing, a wording, ending on the invitation) passes", () => {
    assert.deepEqual(flagsOf([...four, at("Nahi. Ungliyon par gino. Chalo, ab tumhari baari."), C("5"), told], SCRIPT, "keyWithWordingUnsaid"), []);
  });
  test("A(i), the other side: the same told answer with no C1 turn, or with the wording said before the fourth hearing, flags", () => {
    assert.deepEqual(flagsOf([...four, told], SCRIPT, "keyWithWordingUnsaid"), [8]);
    const early = [at(Q), C("5"), at("Nahi. Ungliyon par gino. Chalo, ab tumhari baari."), C("5"), at(`Nahi. ${R}`), C("5"), at(`Nahi. ${Q}`), C("5"), at(R), C("5")];
    assert.deepEqual(flagsOf([...early, told], SCRIPT, "keyWithWordingUnsaid"), [10]);
  });
  const allBut = [at(Q), C("5"), at(`Nahi. Ungliyon par gino. ${R}`), C("5"), at(`Nahi. Point ki doosri baat. ${Q}`), C("5")];
  test("B: a wording one sentence of which she said in near-same words (eight in ten of its words, in order) is not unsaid", () => {
    assert.deepEqual(flagsOf([...allBut, at(`Nahi. Point ki sabse aasaan baat. ${R}`), C("5"), told], SCRIPT, "keyWithWordingUnsaid"), []);
  });
  test("B, the other side: its words out of order, or fewer than eight in ten, are not near: the wording is unsaid", () => {
    assert.deepEqual(flagsOf([...allBut, at(`Nahi. Baat aasaan point ki. ${R}`), C("5"), told], SCRIPT, "keyWithWordingUnsaid"), [8]);
    assert.deepEqual(flagsOf([...allBut, at(`Nahi. Point ki aasaani. ${R}`), C("5"), told], SCRIPT, "keyWithWordingUnsaid"), [8]);
  });
  const wait = [at(Q), C("haan"), at("Ab phir se socho, jawab kya hoga?"), C("haan"), at(R), C("haan"), at(`Ungliyon par gino. ${Q}`), C("haan")];
  test("C: the told answer that is the wait's last turn (bare yes since the question, her turn before answering a bare yes) passes", () => {
    assert.deepEqual(flagsOf([...wait, told], SCRIPT, "keyWithWordingUnsaid"), []);
    assert.deepEqual(flagsOf([...wait.slice(0, 7), C(""), told], SCRIPT, "keyWithWordingUnsaid"), []);
  });
  test("C, the other side: a miss since the question, or her turn before answering a give-up, is no wait: it flags", () => {
    assert.deepEqual(flagsOf([...wait.slice(0, 7), C("6"), told], SCRIPT, "keyWithWordingUnsaid"), [8]);
    assert.deepEqual(flagsOf([at(Q), C("pata nahi"), at(`Ungliyon par gino. ${Q}`), C("haan"), told], SCRIPT, "keyWithWordingUnsaid"), [4]);
  });
});

describe("yourTurnNotThird read to main's ruling A(ii) (RULING-A2): the go-ahead alone answering a try-first is no turn at the question", () => {
  const S2 = { ...SCRIPT, joints: { yourTurn: [{ hi: "Chalo, ab tumhari baari." }] } };
  const Q = "Do aur do kitne hote hain?", R = "Toh do jama do kya hua?", INV = "Nahi. Ungliyon par gino. Chalo, ab tumhari baari.";
  const card = (t) => T(t, { cell: { part: "t-s1:e1:card", column: "wrong" }, seams: [{ right: "missVerdict" }, { right: "help" }, { right: "yourTurn" }] });
  test("the invitation after her two turns at the question with the go-ahead alone between passes", () => {
    const rows = [T(Q), C("5"), T(`Nahi. ${R}`), C("pehle main try karun?"), T("Haan, pehle tum try karo."), C("7"), card(INV)];
    assert.deepEqual(rows.map((r, i) => PREDICATES.yourTurnNotThird({ rows }, r, i, { script: S2 })).map((x, i) => (x ? i : -1)).filter((i) => i >= 0), []);
  });
  test("the other side: a go-ahead with more said after it, or one that answers no try-first, still counts as her turn", () => {
    for (const rows of [[T(Q), C("5"), T(`Nahi. ${R}`), C("pehle main try karun?"), T("Haan, pehle tum try karo. Ab phir se socho."), C("7"), card(INV)],
      [T(Q), C("5"), T(`Nahi. ${R}`), C("haan"), T("Haan, pehle tum try karo."), C("7"), card(INV)], [T("Pehle ek baat."), C("haan"), T(Q), C("pehle main try karun?"), T("Haan, pehle tum try karo."), C("7"), card(INV)]]) {
      assert.deepEqual(rows.map((r, i) => PREDICATES.yourTurnNotThird({ rows }, r, i, { script: S2 })).map((x, i) => (x ? i : -1)).filter((i) => i >= 0), [6]);
    }
  });
});

describe("questionFiveTimes tightened by name to C3 (d35a): every column counts but the child's own request", () => {
  const Q = "Do aur do kitne hote hain?", R = "Toh do jama do kya hua?", P = "t-s1:e1:card";
  const at = (t, column) => T(t, { cell: { part: P, column } });
  const four = [at(Q, "right"), C("5"), at(`Nahi. ${R}`, "wrong"), C("6"), at(`Nahi. ${Q}`, "wrong"), C("7"), at(R, "wrong")];
  const fl = (rows) => rows.map((r, i) => PREDICATES.questionFiveTimes({ rows }, r, i, { script: SCRIPT, o: {} })).map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
  test("a fifth hearing after her reply to a side-topic, after a bare yes, after a clarify flags (was: passed by its column)", () => {
    assert.deepEqual(fl([...four, C("chauka"), at(`Achha, toh tumhe chauka pasand hai! ${Q}`, "aside_reply")]), [8]);
    assert.deepEqual(fl([...four, C("haan"), at(Q, "yes")]), [8]);
    assert.deepEqual(fl([...four, C("samajh nahi aaya"), at(`Ungliyon par gino. ${Q}`, "clarify")]), [8]);
  });
  test("the child's own request for the question is honoured: \"phir se bolo\" passes, whatever the column", () => {
    assert.deepEqual(fl([...four, C("phir se bolo"), at(Q, "repeat")]), []);
  });
});

describe("questionFifthOnHerOwn (C3), made rows", () => {
  const Q = "Do aur do kitne hote hain?", R = "Toh do jama do kya hua?";
  const four = [T(Q), C("5"), T(`Nahi. Ungliyon par gino. ${R}`), C("aapko cricket pasand hai?"), T(`Main AI hoon. Ab wapas aate hain. ${Q}`), C("6"), T(`Nahi. Point ki doosri baat. ${R}`), C("pata nahi")];
  test("a fifth hearing after a give-up, after a reply to a side-topic, after a yes flags", () => {
    assert.deepEqual(flagsOf([...four, T(`Point ki aasaan baat. ${Q}`)], SCRIPT, "questionFifthOnHerOwn"), [8]);
    assert.deepEqual(flagsOf([...four.slice(0, 7), C("virat"), T(`Achha, batane ke liye shukriya. ${Q}`)], SCRIPT, "questionFifthOnHerOwn"), [8]);
    assert.deepEqual(flagsOf([...four.slice(0, 7), C("haan"), T(R)], SCRIPT, "questionFifthOnHerOwn"), [8]);
  });
  test("the short ask, the invitation, help ending on the invitation in its place pass", () => {
    for (const t of ["Ab phir se socho, jawab kya hoga?", "Chalo, ab tumhari baari.", "Point ki aasaan baat. Ab tum batao."]) assert.deepEqual(flagsOf([...four, T(t)], SCRIPT, "questionFifthOnHerOwn"), [], t);
  });
  test("the child's own request for the question is honoured and counts: \"phir se bolo\" at the fifth, then a sixth on her own flags", () => {
    assert.deepEqual(flagsOf([...four, T(`Point ki aasaan baat. Chalo, ab tumhari baari.`), C("phir se bolo"), T(Q)], SCRIPT, "questionFifthOnHerOwn"), []);
    assert.deepEqual(flagsOf([...four.slice(0, 7), C("phir se bolo"), T(Q), C("7"), T(`Nahi. ${R}`)], SCRIPT, "questionFifthOnHerOwn"), [10]);
  });
  test("a Hindi request is the child's own only where the question has a Hindi form", () => {
    const S = "Pehle kya karoge, jodoge ya ghataoge?", SR = "Jodoge ya ghataoge, batao?", SH = "Pehle jodna hai ya ghatana, batao?";
    const st4 = [T(S), C("pata nahi"), T(`Kadam ki aasaan baat. ${SR}`), C("pata nahi"), T(`Sawaal doosri tarah. ${S}`), C("virat"), T(`Achha. ${SR}`)];
    assert.deepEqual(flagsOf([...st4, C("hindi mein samjhao"), T(`Haan, Hindi mein. ${SH}`)], SCRIPT, "questionFifthOnHerOwn"), []);
    assert.deepEqual(flagsOf([...four, T(`Haan, Hindi mein. ${Q}`)].map((r, i) => (i === 7 ? C("hindi mein batao") : r)), SCRIPT, "questionFifthOnHerOwn"), [8]);
  });
});

describe("the frozen director37 rows (to-brain 055: the rows the order names)", () => {
  const got = (k) => { const out = []; for (const l of ["offtopic-c4-ch01-t02", "steering-c6-ch06-t01", "steering-c5-ch02-t01", "steering-c5-ch02-t02", "steering-c6-ch07-t03", "stuck-c6-ch07-t03"]) { const { rows, script } = load(l); for (const i of flagsOf(rows, script, k)) out.push(`${l} ${i}`); } return out; };
  test("keyWithWordingUnsaid: the order's rows and steering c5-ch02-t02 22 (the same fault, not named), less the two c6-ch07-t03 rows ruling B reads as said (remediation[0].simpler's second sentence near its say): three rows", () => {
    assert.deepEqual(got("keyWithWordingUnsaid"), ["steering-c6-ch06-t01 22", "steering-c5-ch02-t01 22", "steering-c5-ch02-t02 22"]);
  });
  test("questionFifthOnHerOwn: offtopic c4-ch01-t02 34 (the fifth, after her reply) and 42 (the seventh); 36 (Hindi) and 44 (\"phir se bolo\") are the child's own", () => {
    assert.deepEqual(got("questionFifthOnHerOwn"), ["offtopic-c4-ch01-t02 34", "offtopic-c4-ch01-t02 42"]);
  });
  test("read through lessonFlags as check-run reads them: the same rows", () => {
    const { rows, script } = load("offtopic-c4-ch01-t02");
    assert.deepEqual(lessonFlags({ rows, script }).filter((x) => x.predicate === "questionFifthOnHerOwn").map((x) => x.row), [34, 42]);
  });
});

describe("main's ruling A4 (d38): C1's one turn at a return passes questionFifthOnHerOwn and questionFiveTimes, and nothing else new", () => {
  const Q = "Do aur do kitne hote hain?", R = "Toh do jama do kya hua?", P = "t-s1:e1:card";
  const at = (t, extra = {}) => T(t, { cell: { part: P }, ...extra });
  const RET = [{ left: "start", right: "aiReply" }, { left: "aiReply", right: "help" }, { left: "help", right: "card" }];
  const ret = (t) => at(t, { cell: { part: P, column: "aside_reply" }, seams: RET });
  // (four hearings: the card, its reask after help, the card again, the reask after help — two of the card's three wordings said)
  const four = [at(Q), C("5"), at(`Nahi. Ungliyon par gino. ${R}`), C("6"), at(`Nahi. ${Q}`), C("7"), at(`Nahi. Point ki doosri baat. ${R}`), C("aapko cricket pasand hai?"),
    at("Main AI hoon, meri koi pasand nahi hoti. Tum kiske saath dekhte ho?"), C("papa ke saath")];
  const both = (rows) => ({ fifth: flagsOf(rows, SCRIPT, "questionFifthOnHerOwn"),
    five: rows.map((r, i) => PREDICATES.questionFiveTimes({ rows }, r, i, { script: SCRIPT, o: {} })).map((x, i) => (x ? i : -1)).filter((i) => i >= 0) });
  test("her reply, help in a wording not said before, the question, at the fifth hearing, the first such turn: passes both", () => {
    assert.deepEqual(both([...four, ret(`Achha, batane ke liye shukriya. Ab wapas aate hain. Point ki aasaan baat. ${R}`)]), { fifth: [], five: [] });
  });
  test("a fifth hearing after a side-topic with NO new help still flags (a wording said before; no help at all)", () => {
    assert.deepEqual(both([...four, ret(`Achha, batane ke liye shukriya. Point ki doosri baat. ${R}`)]), { fifth: [10], five: [10] });
    assert.deepEqual(both([...four, ret(`Achha, batane ke liye shukriya. Ab wapas aate hain. ${R}`)]), { fifth: [10], five: [10] });
  });
  test("a turn that does not open on her reply to a side-topic flags, help or not", () => {
    assert.deepEqual(both([...four.slice(0, 7), C("pata nahi"), at(`Point ki aasaan baat. ${Q}`, { seams: [{ left: "start", right: "help" }, { left: "help", right: "card" }] })]), { fifth: [8], five: [8] });
  });
  test("a second such turn at the question flags", () => {
    const rows = [at(Q), C("5"), at(`Nahi. ${R}`), C("aapko cricket pasand hai?"), at("Main AI hoon. Tum kiske saath dekhte ho?"), C("papa ke saath"),
      ret(`Achha. Point ki doosri baat. ${Q}`), C("6"), at(`Nahi. ${R}`), C("virat"), ret(`Achha, shukriya. Point ki aasaan baat. ${Q}`)];
    assert.deepEqual(both(rows), { fifth: [10], five: [10] });
  });
  test("a sixth hearing flags, its shape whatever it is (the fifth here the child's own \"phir se bolo\")", () => {
    const rows = [...four.slice(0, 7), C("phir se bolo"), at(Q), C("aapko cricket pasand hai?"), at("Main AI hoon. Tum kiske saath dekhte ho?"), C("papa ke saath"),
      ret(`Achha, batane ke liye shukriya. Point ki aasaan baat. ${R}`)];
    assert.deepEqual(both(rows), { fifth: [12], five: [12] });
  });
});

describe("keyWithWordingUnsaid after C1's turn at a return (main's ruling A4: it is that question's C1 turn, RULING-A2 A(i))", () => {
  const Q = "Do aur do kitne hote hain?", R = "Toh do jama do kya hua?", P = "t-s1:e1:card";
  const at = (t, extra = {}) => T(t, { cell: { part: P }, ...extra });
  const RET = [{ left: "start", right: "aiReply" }, { left: "aiReply", right: "help" }, { left: "help", right: "card" }];
  const four = [at(Q), C("5"), at(`Nahi. ${R}`), C("6"), at(`Nahi. ${Q}`), C("7"), at(`Nahi. ${R}`), C("aapko cricket pasand hai?"), at("Main AI hoon. Tum kiske saath dekhte ho?"), C("papa ke saath")];
  const told = at("Nahi. Do jama do chaar. Yahan tak theek hai?", KEY);
  test("the told answer after it passes, a wording still unsaid", () => {
    assert.deepEqual(flagsOf([...four, at(`Achha. Point ki aasaan baat. ${R}`, { seams: RET }), C("8"), told], SCRIPT, "keyWithWordingUnsaid"), []);
  });
  test("after the same turn with no new wording (not C1's), the told answer still flags", () => {
    assert.deepEqual(flagsOf([...four, at(`Achha. ${R}`, { seams: RET }), C("8"), told], SCRIPT, "keyWithWordingUnsaid"), [12]);
  });
});

describe("keyAfterFive read to main's ruling A3 item 3 (d38): C1's one turn at the fifth miss passes; the key is demanded at the miss after it", () => {
  const S2 = { ...SCRIPT, joints: { yourTurn: [{ hi: "Chalo, ab tumhari baari." }] } };
  const Q = "Do aur do kitne hote hain?", R = "Toh do jama do kya hua?", P = "t-s1:e1:card";
  const at = (t, seams = []) => T(t, { cell: { part: P }, seams });
  const W = (x) => ({ who: "child", text: x, read: "incorrect" });
  const HELP_INV = [{ right: "missVerdict" }, { right: "help" }, { right: "yourTurn" }];
  // (four misses met, two wordings said: the card's simpler and the point's other wording)
  const four = [at(Q), W("5"), at(`Nahi. Ungliyon par gino. ${R}`), W("6"), at(`Nahi. ${Q}`), W("7"), at(`Nahi. Point ki doosri baat. ${R}`), W("8"), at(`Nahi. ${Q}`), W("9")];
  const fl = (rows) => rows.map((r, i) => PREDICATES.keyAfterFive({ rows }, r, i, { script: S2, o: {} })).map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
  test("the fifth miss: help in the unsaid wording ending on the invitation, the first at that question, passes", () => {
    assert.deepEqual(fl([...four, at("Nahi. Point ki aasaan baat. Chalo, ab tumhari baari.", HELP_INV)]), []);
  });
  test("the miss after it with no key flags; with the key it passes", () => {
    const c1 = at("Nahi. Point ki aasaan baat. Chalo, ab tumhari baari.", HELP_INV);
    assert.deepEqual(fl([...four, c1, W("3"), at(`Nahi. ${Q}`)]), [12]);
    assert.deepEqual(fl([...four, c1, W("3"), at("Nahi. Iska sahi jawab 4 hai.")]), []);
  });
  test("the fifth miss met with a wording said before, or ending on the question, flags", () => {
    assert.deepEqual(fl([...four, at("Nahi. Point ki doosri baat. Chalo, ab tumhari baari.", HELP_INV)]), [10]);
    assert.deepEqual(fl([...four, at(`Nahi. Point ki aasaan baat. ${Q}`, [{ right: "missVerdict" }, { right: "help" }, { right: "card" }])]), [10]);
  });
});
