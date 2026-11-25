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
    assert.equal(P.replyIntoPoint({}, row, 2, { prevT: { who: "teacher", noFit: "aside", noFitGoOn: true } }), null);
    assert.equal(P.replyIntoPoint({}, { ...row, seams: [{ right: "aside" }, { right: "goOn", joint: "afterAside" }] }, 2, { prevT: checkin }), null);
  });
});
