// d38 builder S, main's RULING-A6 on tests/r8-main-034 (E1, E2): two checks' readings, on made rows, both sides.
//   E2  orderRemediation knows a remediation's sayAlt: say, then sayAlt, then simpler — the ladder as built — reads 0; its simpler said
//       after a plain no with nothing of it said before still flags.
//   E1  requestHelped passes a THIRD request at the check-in after a told answer answered by the meet-it-again line, where her two turns
//       before were each help answering a request at that check-in, each ending on a check-in; a first or second request answered with
//       no help still flags, and so does a third at a check-in that followed no told answer.
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");

const T = (o) => ({ who: "teacher", beat: "s1:explain:e1", ...o });
const C = (text, o = {}) => ({ who: "child", text, ...o });
const CARD = T({ text: "Teen barabar tukdon mein se ek rangin hai. Rangin bhaag kitna hai?", pageParts: [{ part: "card", beat: "e1", from: 0 }], check: { itemId: "script:t-s1:ask:e1" } });
const of = (rows, script, name) => lessonFlags({ rows, script }).filter((x) => x.predicate === name);

describe("E2: orderRemediation reads a remediation's sayAlt as its own", () => {
  const SAY = "Ek rassi ke teen alag lambai ke tukde socho, woh barabar nahi hain.";
  const ALT = "Ek seb ko teen tukdon mein kaato, ek bada aur do chhote tukde.";
  const SIMPLER = "Pehle dekho ki saare tukde ek hi size ke hain ya nahi.";
  const script = { topicId: "t", joints: {}, skills: [{ skillId: "t-s1",
    explain: [{ id: "e1", point: { hi: "Ek circle ke teen barabar tukde hote hain yahan par." }, ask: { prompt: { hi: "Rangin bhaag kitna hai?" } } }],
    remediation: [{ targets: "t-m-unequal", say: { hi: SAY }, sayAlt: { hi: ALT }, simpler: { hi: SIMPLER } }] }] };
  test("say, then sayAlt at a no, then simpler at the next no: read 0", () => {
    const rows = [CARD, C("1/2", { read: "misconception · t-m-unequal" }), T({ text: `${SAY} Yahan tak theek hai?` }),
      C("nahi", { read: "no_evidence" }), T({ text: `${ALT} Ab tak samajh aaya?` }), C("nahi", { read: "no_evidence" }), T({ text: `${SIMPLER} Yahan tak theek hai?` })];
    assert.deepEqual(of(rows, script, "orderRemediation"), []);
  });
  test("the simpler at a plain no with nothing of the remediation said before: flags", () => {
    const rows = [CARD, C("nahi", { read: "no_evidence" }), T({ text: `${SIMPLER} Yahan tak theek hai?` })];
    const f = of(rows, script, "orderRemediation");
    assert.equal(f.length, 1); assert.equal(f[0].row, 2); assert.match(f[0].why, /not its misconception/);
  });
  test("the sayAlt at a plain no with nothing of the remediation said before: flags (it is the remediation's own wording now)", () => {
    const rows = [CARD, C("nahi", { read: "no_evidence" }), T({ text: `${ALT} Yahan tak theek hai?` })];
    assert.equal(of(rows, script, "orderRemediation").length, 1);
  });
});

describe("E1: requestHelped at the third request of a told answer's check-in", () => {
  const SIMPLER = "Circle wahi hai, uske tukde bhi utne hi hain.";
  const ALT = "Ek circle ko teen dost barabar baantein, har dost ko ek tukda mile.";
  const script = { topicId: "t", joints: {}, skills: [{ skillId: "t-s1",
    explain: [{ id: "e1", point: { hi: "Is circle ke teen barabar tukde hain, ek mein rang." }, pointAlt: { hi: ALT }, simpler: { hi: SIMPLER },
      ask: { prompt: { hi: "Rangin bhaag kitna hai?" } } }] }] };
  const KEY = T({ text: "Nahi. Iska sahi jawab hai 1/3. Yahan tak theek hai?", seams: [{ right: "key" }] });
  const HELP1 = T({ text: `${SIMPLER} Ab tak samajh aaya?`, seams: [{ right: "help" }], pageParts: [{ part: "simpler", beat: "e1", from: 0 }] });
  const HELP2 = T({ text: `${ALT} Yahan tak theek hai?`, seams: [{ right: "help" }], pageParts: [{ part: "simpler", beat: "e1", from: 0 }] });
  const GO = T({ text: "Koi baat nahi, yeh hum aage phir dekhenge. Waise, cricket mein tumne kabhi kuch barabar baanta hai?", seams: [{ right: "afterKeyGoOn", joint: "afterKeyGoOn" }] });
  const ASK = (t) => C(t, { intent: "clarify", read: "no_evidence · another" });
  const flagsAt = (rows) => of(rows, script, "requestHelped").map((x) => x.row);
  test("the third request, after help to each of the two before it at that check-in: the meet-it-again line and on, read 0", () => {
    const rows = [CARD, C("1/2", { intent: "miss", read: "misconception" }), KEY, ASK("samajh nahi aaya"), HELP1, ASK("phir bhi samajh nahi aaya"), HELP2, ASK("nahi samjha")];
    assert.deepEqual(flagsAt([...rows, GO]), []);
    // (the same third request answered by a line that is not the meet-it-again line still flags)
    assert.deepEqual(flagsAt([...rows, T({ text: "Chalo, agla sawaal dekhte hain.", seams: [] })]), [8]);
  });
  test("a give-up and a plain no are requests too (the check's own lists)", () => {
    const rows = [CARD, C("1/2", { intent: "miss", read: "misconception" }), KEY, C("pata nahi", { intent: "give_up" }), HELP1, C("nahi", { intent: "clarify" }), HELP2, ASK("samajh nahi aaya"), GO];
    assert.deepEqual(flagsAt(rows), []);
  });
  test("a first request answered with no help: flags", () => {
    assert.deepEqual(flagsAt([CARD, C("1/2", { intent: "miss", read: "misconception" }), KEY, ASK("samajh nahi aaya"), GO]), [4]);
  });
  test("a second request answered with no help: flags", () => {
    assert.deepEqual(flagsAt([CARD, C("1/2", { intent: "miss", read: "misconception" }), KEY, ASK("samajh nahi aaya"), HELP1, ASK("phir bhi samajh nahi aaya"), GO]), [6]);
  });
  test("a third request where one turn before was not help (no help seam): flags", () => {
    const NOHELP = T({ text: "Chalo, board dekho. Yahan tak theek hai?", seams: [] });
    const f = flagsAt([CARD, C("1/2", { intent: "miss", read: "misconception" }), KEY, ASK("samajh nahi aaya"), HELP1, ASK("phir bhi samajh nahi aaya"), NOHELP, ASK("nahi samjha"), GO]);
    assert.ok(f.includes(8), `flags ${f}`);
  });
  test("a third request at a check-in that followed no told answer: flags", () => {
    const NOKEY = T({ text: "Nahi, phir se socho. Yahan tak theek hai?", seams: [] });
    const f = flagsAt([CARD, C("1/2", { intent: "miss", read: "misconception" }), NOKEY, ASK("samajh nahi aaya"), HELP1, ASK("phir bhi samajh nahi aaya"), HELP2, ASK("nahi samjha"), GO]);
    assert.ok(f.includes(8), `flags ${f}`);
  });
});
