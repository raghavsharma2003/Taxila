// to-brain 054 A, main's second ruling on cause A (round d37, after the as-heard read): five fixes, each pinned here — the walk's turn on the
// offline walk (state.js step, no reply) and, where the ruling names one, the predicate on made rows.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step, _replyApartForTest as replyApart } from "../server/director/state.js";
import { applySeams } from "../server/brain/seams.js";
import { D37A_PREDICATES as P } from "../evals/hybrid-side-by-side/d37a-predicates.mjs";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { findItem } from "../server/director/items.js";
import { dryReading } from "../evals/hybrid-side-by-side/dry-reader.mjs";

const live = (t) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${t}.json`, import.meta.url), "utf8"));
/** The walk alone (state.js step, no reply): each child line read as the dry matrix reads it — code's reader, else the dry stub. */
function walkLines(topicId, lines) {
  const kit = kitFromFile(getTopic(topicId));
  const ctx = { firstName: "Riya", teacherName: "Asha", lang: "hinglish", interests: ["cricket"], classLevel: Number(/^c(\d)/.exec(topicId)[1]), sessionId: "s-054a2", teacher: "director" };
  let s = step(initLessonState({ topicId, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 }).state;
  const out = [];
  for (const text of lines) {
    const item = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    const target = targetFor(s, kit, item);
    const fast = classifyFast({ target, childText: text, lang: "hinglish", classLevel: ctx.classLevel, typed: true });
    const r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: fast.result ?? dryReading(target), now: out.length + 1 });
    out.push(r); s = r.state;
  }
  return out;
}

describe("fix 1: a request made in reply to a go-on turn is honoured", () => {
  // (the steady child of the dry matrix, c5-maths-ch02-t01, up to row 37: a park at the bridge's check-in, its go-on line, "Hindi mein bolo")
  const LINES = ["haan, samajh aaya", "3", "6 kilometre", "pata nahi", "one sixth", "1 upon 3", "eight", "1/8", "picture dikhao", "between 0 and 1/5 hai na",
    "1/10 wala", "chaar gap", "dhai sau metre", "pehle main try karun?", "1 upon 11", "1/12", "pehle mark par", "kal maine cricket khela, sixer maara", "Hindi mein bolo"];
  test("Hindi after her reply's go-on line: the held point, and the card asked in its own Hindi form, after the easier-words line", () => {
    const rs = walkLines("c5-maths-ch02-t01", LINES);
    const go = rs.at(-2).state.lastMove, t = rs.at(-1);
    assert.equal(go.noFit, "aside"); assert.ok(go.replyApart);
    const m = t.state.lastMove;
    assert.ok(m.point, "the held point is said");
    const script = live("c5-maths-ch02-t01");
    const form = String(m.hindiForm ?? "");
    assert.ok(form && t.ui.ask.text === form, "the card's Hindi form is the turn's question");
    assert.equal(m.request, "language"); assert.ok(m.noLangAck, "no switch line before a first telling (T1)");
    assert.ok(script.joints.easierWords.some((f) => f.hi === m.sayFirst?.[0]), "the easier-words line leads");
    assert.equal(m.help?.request, "hindi"); assert.ok(m.help.hindiForm);
    assert.equal(t.state.ctx.lang, "hindi");
    // (the walk keeps the card's own text: the form is this turn's words for it)
    assert.notEqual(t.state.lastUi.ask.text, form);
  });
  test("hindiNoFormNoLine reads the turn after a go-on line like any other: no exemption", async () => {
    const { PREDICATES } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    const script = live("c5-maths-ch02-t01");
    const goOn = { who: "teacher", text: "Cricket ki baat bhi hogi. Abhi apne kaam par wapas chalte hain.", noFit: "aside", noFitGoOn: true };
    const child = { who: "child", text: "Hindi mein bolo", intent: "hindi" };
    const bare = { who: "teacher", text: "Is baar line 3 barabar gaps mein kati hai. 0 se 5 gap chalo. Kis fraction par pahunchoge?", seams: [{ right: "point" }, { right: "card" }] };
    const rows = [goOn, child, bare];
    assert.ok(PREDICATES.hindiNoFormNoLine({ rows }, bare, 2, { script, o: {}, prevT: goOn }));
    const ew = { ...bare, text: `${script.joints.easierWords[1].hi} ${bare.text}` };
    assert.equal(PREDICATES.hindiNoFormNoLine({ rows: [goOn, child, ew] }, ew, 2, { script, o: {}, prevT: goOn }), null);
  });
});

const KIT = { topicId: "t-test", __joints: {
  afterAside: [{ hi: "Theek hai, ab phir se dhyaan idhar lagate hain.", en: "Okay, back to our work." }],
  afterPark: [{ hi: "Abhi apne kaam par wapas chalte hain.", en: "Now back to our work." }],
  afterAiLine: [{ hi: "Ab apni padhai par lautte hain.", en: "Now back to learning." }],
  afterWorked: [{ hi: "Ab ek sawaal tum akele karo.", en: "Now one on your own." }],
} };
const CARD = { itemId: "script:t-s1:ask:e2", text: "0 se theek 1 tak aise kitne gap chalne honge?" };
function turnOf({ lm = {}, later = [], turn = 9 } = {}) {
  const lastMove = { kind: "explain", itemId: CARD.itemId, skillId: "t-s1", point: "Ab 1/3 wale 3 gap chalkar dekho: wahan 3/3 = 1.", scriptBeat: { skillId: "t-s1", beatId: "e2", kind: "explain" }, ...lm };
  const state = { turn, ctx: { lang: "hinglish" }, later, posedAt: { [CARD.itemId]: turn }, activeItemId: CARD.itemId, lastMove, lastUi: { status: "your_turn", ask: CARD } };
  return { state, move: lastMove, ui: { status: "your_turn", ask: CARD }, moduleCommands: [], end: false };
}
const INPUT = { event: "turn", kit: KIT, text: "mujhe cricket pasand hai", cls: { asideReply: true } };

describe("fix 2: a side-topic at a check-in is the same rule", () => {
  test("her said-again line at a bridge's check-in ends on its joint as a go-on line; the point and card are held", () => {
    const out = replyApart({ turn: 8, lastMove: { kind: "repair", splitClose: true, bridgeSaid: "Ab aage." } }, INPUT, turnOf({ lm: { asideAgain: { topic: "cricket", returned: true } } }));
    const m = out.state.lastMove;
    assert.equal(m.noFit, "aside"); assert.equal(m.replyApart, "afterAside"); assert.deepEqual(m.asideAgain, { topic: "cricket", returned: true });
    assert.ok(!m.point); assert.equal(out.state.splitHold.move.point, "Ab 1/3 wale 3 gap chalkar dekho: wahan 3/3 = 1.");
    assert.ok(!out.state.splitHold.move.asideAgain);
    assert.equal(out.state.goOnTurn, 9);
  });
  test("the seam pass ends the said-again line on afterAside", () => {
    const state = { turn: 9, ctx: { lang: "hinglish" }, lastMove: { replyApart: "afterAside", vpcGoOn: "x", noFit: "aside" } };
    const r = applySeams("Achha, wahi cricket!", [{ part: "aside", text: "Achha, wahi cricket!" }], { kit: KIT, state, lang: "hinglish", info: { goOnAfterReply: true } });
    assert.deepEqual(r.seams.map((x) => [x.right, x.joint]), [["aside", null], ["goOn", "afterAside"]]);
  });
  test("replyIntoPoint flags her said-again line run into a new point and its card after a check-in; the turn after a go-on line is fix 3's", () => {
    const row = { who: "teacher", text: "Arre haan, cricket! Achha, ab padhai. Pehle 3/4 ke har hisse. Upar kaunsa number aayega?", seams: [{ right: "aside" }, { right: "point", joint: "afterAside" }, { right: "card" }] };
    const checkin = { who: "teacher", text: "Ab tak samajh aaya?", seams: [{ right: "verdict" }, { right: "bridge" }, { right: "checkin" }] };
    assert.ok(P.replyIntoPoint({}, row, 2, { prevT: checkin }));
    // (third ruling item 3: the said-again turn after a go-on line is excused only with no after joint)
    const bare = { ...row, seams: [{ right: "aside" }, { right: "point", left: "replyAgain", joint: null }, { right: "card" }] };
    assert.equal(P.replyIntoPoint({}, bare, 2, { prevT: { who: "teacher", noFit: "aside", noFitGoOn: true } }), null);
    assert.ok(P.replyIntoPoint({}, row, 2, { prevT: { who: "teacher", noFit: "aside", noFitGoOn: true } }));
    assert.equal(P.replyIntoPoint({}, { ...row, seams: [{ right: "aside" }, { right: "goOn", joint: "afterAside" }] }, 2, { prevT: checkin }), null);
  });
});

describe("fix 3: after a go-on turn the next turn teaches; 'back to work' is never said twice running", () => {
  const GO = { turn: 8, goOnTurn: 8, lastMove: { kind: "repair", noFit: "aside", vpcGoOn: "Abhi apne kaam par wapas chalte hain.", replyApart: "afterPark" } };
  test("the side-topic said again after the go-on line: her said-again line, the held point and card, no second go-on joint", async () => {
    const { _afterGoOnForTest: afterGoOn } = await import("../server/director/state.js");
    const out = afterGoOn(GO, INPUT, turnOf({ lm: { asideAgain: { topic: "cricket" } } }));
    assert.ok(out.state.lastMove.noReplyJoint && out.state.lastMove.point && !out.state.splitHold);
    assert.equal(out.ui.ask.text, CARD.text);
    // (replyApart never splits it into a second go-on turn)
    const t = turnOf({ lm: { asideAgain: { topic: "cricket" } } });
    assert.equal(replyApart(GO, INPUT, t), t);
    // (nor the turn after her AI line said straight after a go-on line)
    const ai = { turn: 9, goOnTurn: 8, lastMove: { kind: "repair", tasteAsked: { topic: "Virat" } } };
    const t2 = turnOf({ turn: 10, lm: { asideAck: true } });
    assert.equal(replyApart(ai, INPUT, t2), t2);
  });
  test("over 70 words with her line, the point ends on its check-in and the card is the next turn", async () => {
    const { _afterGoOnForTest: afterGoOn } = await import("../server/director/state.js");
    const long = "Ek do teen char paanch chhe saat aath nau das. ".repeat(6).trim();
    const out = afterGoOn(GO, INPUT, turnOf({ lm: { asideAgain: { topic: "cricket" }, point: long } }));
    assert.equal(out.state.lastMove.noFit, "point"); assert.ok(out.state.lastMove.noReplyJoint);
    assert.equal(out.state.splitHold.ui.ask.text, CARD.text); assert.ok(out.state.splitHold.teach);
  });
  test("her AI line straight after the go-on line drops only its question back: the held point and card follow (tasteNoAsk)", async () => {
    const { _afterGoOnForTest: afterGoOn } = await import("../server/director/state.js");
    const out = afterGoOn(GO, { ...INPUT, text: "aapko virat pasand hai?" }, turnOf({ lm: { tasteAsked: { topic: "Virat", n: 1 } } }));
    assert.ok(out.state.lastMove.tasteNoAsk && out.state.lastMove.noReplyJoint && out.state.lastMove.point);
    // (not after a turn that was not a go-on line)
    const t = turnOf({ lm: { tasteAsked: { topic: "Virat", n: 1 } } });
    assert.equal(afterGoOn({ turn: 8, lastMove: { kind: "explain" } }, INPUT, t), t);
  });
  test("the seam pass: after her reply said again the seam is replyAgain, which the table gives no joint", () => {
    const state = { turn: 9, ctx: { lang: "hinglish" }, lastMove: { noReplyJoint: true } };
    const list = [{ part: "aside", text: "Cricket wali baat maine likh li hai." }, { part: "body", text: "Ab 1/3 wale 3 gap chalkar dekho." }, { part: "card", text: CARD.text }];
    const r = applySeams(list.map((p) => p.text).join(" "), list, { kit: KIT, state, lang: "hinglish", info: { noReplyJoint: true } });
    const s1 = r.seams.find((x) => x.right === "point");
    assert.equal(s1?.left, "replyAgain"); assert.equal(s1.joint, null);
    const r0 = applySeams(list.map((p) => p.text).join(" "), list, { kit: KIT, state: { ...state, lastMove: {} }, lang: "hinglish", info: {} });
    assert.equal(r0.seams.find((x) => x.right === "point")?.joint, "afterAside");
  });
  test("goOnNoTeach and goOnJointTwice: made rows that trip each, and ones that do not", () => {
    const go = (j) => ({ who: "teacher", text: "x", noFit: "aside", noFitGoOn: true, seams: [{ right: "park" }, { right: "goOn", joint: j }] });
    const teach = { who: "teacher", text: "y", seams: [{ right: "aside" }, { right: "point", left: "replyAgain", joint: null }, { right: "card" }] };
    const ai = { who: "teacher", text: "Main AI teacher hoon. Tumhe kya pasand hai?", seams: [{ right: "aiQuestion" }] };
    const c = { who: "child", text: "k" };
    const at = (rows) => P.goOnNoTeach({ rows }, rows.at(-1), rows.length - 1);
    assert.ok(at([go("afterPark"), c, go("afterAside")]));
    // (a go-on, the AI line, a go-on: the shape main's third ruling names)
    assert.ok(at([go("afterAside"), c, ai, c, go("afterAiLine")]));
    assert.equal(at([go("afterAside"), c, teach, c, go("afterAiLine")]), null);
    assert.equal(at([go("afterAside"), c, teach]), null);
    assert.equal(at([c, go("afterAiLine")]), null);
    const joint = { who: "teacher", text: "z", seams: [{ right: "aside" }, { right: "point", joint: "afterAside" }, { right: "card" }] };
    assert.ok(P.goOnJointTwice({}, joint, 3, { prevT: go("afterPark") }));
    assert.equal(P.goOnJointTwice({}, teach, 3, { prevT: go("afterPark") }), null);
    assert.equal(P.goOnJointTwice({}, joint, 3, { prevT: teach }), null);
    // (the after-key go-on line into an aside's return, then her reply to its answer going back to the card)
    const toReturn = { who: "teacher", text: "r", seams: [{ right: "afterKeyGoOn", joint: "afterKeyGoOn" }, { right: "return" }] };
    assert.equal(P.goOnJointTwice({}, joint, 3, { prevT: toReturn }), null);
  });
});

describe("fix 4: a worked close split from its card keeps the own-turn joint", () => {
  test("the card held apart from the close opens on afterWorked — the seam closeApart > card, in the table", async () => {
    const { SEAM_TABLE } = await import("../server/brain/seams.js");
    assert.ok(SEAM_TABLE.some(([a, b, j]) => a === "closeApart" && b === "card" && j === "afterWorked"));
    const state = { turn: 9, ctx: { lang: "hinglish" }, lastMove: { afterWorkedLead: true } };
    const list = [{ part: "card", text: CARD.text }];
    const r = applySeams(CARD.text, list, { kit: KIT, state, lang: "hinglish", info: { afterWorkedLead: true } });
    assert.deepEqual(r.seams.map((x) => [x.left, x.right, x.joint]), [["closeApart", "card", "afterWorked"]]);
    assert.equal(r.list[0].text, "Ab ek sawaal tum akele karo.");
    const r0 = applySeams(CARD.text, list, { kit: KIT, state: { ...state, lastMove: {} }, lang: "hinglish", info: {} });
    assert.deepEqual(r0.seams.map((x) => [x.left, x.right, x.joint]), [["start", "card", null]]);
  });
});

describe("fix 5 (evals only): the rule-based child hears a question in any of its authored forms", () => {
  test("a step asked in its reask, its Hindi form, the short ask or the invitation is asked; a check-in or another question is not", async () => {
    const { askedIn, questionForms } = await import("../evals/hybrid-side-by-side/asked-forms.mjs");
    const script = live("c6-maths-ch07-t01");
    const ask = script.skills[0].workedExample.steps[0].ask;
    const P0 = ask.prompt.hi;
    assert.ok(questionForms(script, P0).includes(ask.reask.hi) && questionForms(script, P0).includes(ask.hindi.hi));
    // (dry steering c6-ch07-t01 34: the step asked in its reask after a park)
    assert.ok(askedIn(script, ask.reask.hi, P0));
    assert.ok(askedIn(script, `Har hissa 6 cm ka hai. ${ask.hindi.hi}`, P0));
    assert.ok(askedIn(script, "Ab phir se socho, jawab kya hoga?", P0));
    assert.ok(askedIn(script, `Theek hai. ${script.joints.yourTurn[0].hi}`, P0));
    assert.equal(askedIn(script, "Yahan tak theek hai?", P0), false);
    assert.equal(askedIn(script, "Cricket ki baat bhi hogi. Pehle is sawaal ka jawab do.", P0), false);
    // (a step's help wording is written on the step beside its ask)
    const st = script.skills.flatMap((k) => k.workedExample?.steps ?? []).find((x) => x.ask?.prompt && x.simpler);
    if (st) assert.ok(askedIn(script, st.simpler.hi ?? st.simpler, st.ask.prompt.hi));
  });
});

describe("main's third ruling: the checks restored", () => {
  test("item 1: the skip after a go-on row — six predicates after noFit vpc or close; after her reply's go-on line only three", async () => {
    const { goOnSkipOf } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    for (const nf of ["vpc", "close"]) assert.deepEqual([...goOnSkipOf({ noFit: nf, noFitGoOn: true })].sort(), ["clarifyCard", "giveUpAnswered", "orderStays", "pictureCaption", "requestAnswered", "requestHelped"]);
    assert.deepEqual([...goOnSkipOf({ noFit: "aside", noFitGoOn: true })].sort(), ["clarifyCard", "giveUpAnswered", "orderStays"]);
    assert.equal(goOnSkipOf({ noFit: "card", noFitGoOn: true }), null);
    assert.equal(goOnSkipOf({ noFit: "point" }), null);
    assert.equal(goOnSkipOf(null), null);
  });
});

test("third ruling item 2: orderDisplaced holds a displaced part over one go-on turn only", async () => {
  const { PREDICATES } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const go = { who: "teacher", text: "Ab wapas kaam par.", noFit: "aside", noFitGoOn: true, seams: [] };
  const mk = (prevPrevT) => { const ctx = { o: { pend: { beat: "e2", sk: "s1", row: 4, by: "the AI line" }, said: new Set() }, prevPrevT, script: null }; return PREDICATES.orderDisplaced({ rows: [] }, go, 6, ctx); };
  assert.equal(mk({ who: "teacher", text: "Main AI teacher hoon." }), null);
  assert.ok(mk({ ...go }));
});

test("third ruling item 3: replyIntoPoint reads a first seam aside; the said-again exemption holds only with no after joint and within 70 words; asideGoOnNext reads the turn after the AI line said after a go-on", () => {
  const go = { who: "teacher", text: "Ab wapas kaam par.", noFit: "aside", noFitGoOn: true, seams: [{ right: "park" }, { right: "goOn", joint: "afterPark" }] };
  const checkin = { who: "teacher", text: "Ab tak samajh aaya?", seams: [{ right: "verdict" }, { right: "bridge" }, { right: "checkin" }] };
  const w = (n) => Array.from({ length: n }, (_, k) => `shabd${k}`).join(" ");
  const again = (n, joint = null) => ({ who: "teacher", text: `${w(n)}?`, seams: [{ right: "aside" }, { right: "point", joint }, { right: "card" }] });
  assert.ok(P.replyIntoPoint({}, again(40), 2, { prevT: checkin }));
  // (an aside seam inside a turn, not its first, is not her reply's)
  assert.equal(P.replyIntoPoint({}, { ...again(40), seams: [{ right: "verdict" }, { right: "aside" }, { right: "point" }, { right: "card" }] }, 2, { prevT: checkin }), null);
  assert.equal(P.replyIntoPoint({}, again(60), 2, { prevT: go }), null);
  assert.ok(P.replyIntoPoint({}, again(60, "afterAside"), 2, { prevT: go }));
  assert.ok(P.replyIntoPoint({}, again(72), 2, { prevT: go }));
  assert.equal(P.asideGoOnNext({}, again(60), 2, { prevT: go }), null);
  assert.ok(P.asideGoOnNext({}, again(60, "afterAside"), 2, { prevT: go }));
  const ai = { who: "teacher", text: "Main AI teacher hoon. Tumhe kya pasand hai?", seams: [{ right: "aiQuestion" }] };
  const goAgain = { who: "teacher", text: "Wah! Ab phir se kaam par.", noFit: "aside", noFitGoOn: true, seams: [{ right: "aiReply" }, { right: "goOn", joint: "afterAiLine" }] };
  assert.ok(P.asideGoOnNext({}, goAgain, 4, { prevT: ai, prevPrevT: go }));
  assert.equal(P.asideGoOnNext({}, goAgain, 4, { prevT: ai, prevPrevT: checkin }), null);
});

test("third ruling item 5: closeCardLong fires on a worked close and a card over 70 words whether or not afterWorked is said", () => {
  const w = Array.from({ length: 72 }, (_, k) => `shabd${k}`).join(" ");
  const row = { who: "teacher", text: w, seams: [{ right: "verdict" }, { right: "card" }], pageParts: [{ part: "close", beat: "worked" }, { part: "card", beat: "c1" }] };
  assert.ok(P.closeCardLong({}, row));
  assert.ok(P.closeCardLong({}, { ...row, pageParts: [], seams: [{ right: "verdict" }, { right: "card", joint: "afterWorked" }] }));
  assert.equal(P.closeCardLong({}, { ...row, pageParts: [{ part: "close", beat: "c2" }, { part: "card", beat: "c3" }] }), null);
  assert.equal(P.closeCardLong({}, { ...row, text: "chhota" }), null);
});
