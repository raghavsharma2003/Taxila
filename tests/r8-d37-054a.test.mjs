// to-brain 054 A, builder A of round d37 (docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md, main's rulings: A(i) design D1,
// A(ii) design II-B, A(iii) as written): a turn holds one new thing. The walk's rules pinned in units; the four predicates of A.5 pinned on
// made rows, one that trips each and one that does not.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { _replyApartForTest as replyApart, REPLY_APART_JOINTS } from "../server/director/state.js";
import { applySeams, SEAM_TABLE } from "../server/brain/seams.js";
import { initLessonState, step } from "../server/director/state.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { findItem } from "../server/director/items.js";
import { dryReading } from "../evals/hybrid-side-by-side/dry-reader.mjs";

/** The walk alone (state.js step, no reply): each child line read as the dry matrix reads it — code's reader, else the dry stub. → the
 *  step results, one a line. */
function walkLines(topicId, lines) {
  const kit = kitFromFile(getTopic(topicId));
  const ctx = { firstName: "Riya", teacherName: "Asha", lang: "hinglish", interests: ["cricket"], classLevel: Number(/^c(\d)/.exec(topicId)[1]), sessionId: "s-054a", teacher: "director" };
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

const KIT = { topicId: "t-test", __joints: {
  afterAside: [{ hi: "Theek hai, ab phir se dhyaan idhar lagate hain.", en: "Okay, back to our work." }],
  afterPark: [{ hi: "Abhi apne kaam par wapas chalte hain.", en: "Now back to our work." }],
  afterAiLine: [{ hi: "Ab apni padhai par lautte hain.", en: "Now back to learning." }],
} };
const CARD = { itemId: "script:t-s1:ask:e2", text: "0 se theek 1 tak aise kitne gap chalne honge?" };
/** A walk's turn as step() hands it on: her reply (asideAck) or a park, a new point and its card. */
function turnOf({ lm = {}, later = [], turn = 9 } = {}) {
  const lastMove = { kind: "explain", itemId: CARD.itemId, skillId: "t-s1", point: "Ab 1/3 wale 3 gap chalkar dekho: wahan 3/3 = 1.", scriptBeat: { skillId: "t-s1", beatId: "e2", kind: "explain" }, ...lm };
  const state = { turn, ctx: { lang: "hinglish" }, later, posedAt: { [CARD.itemId]: turn }, activeItemId: CARD.itemId, lastMove, lastUi: { status: "your_turn", ask: CARD } };
  return { state, move: lastMove, ui: { status: "your_turn", ask: CARD }, moduleCommands: [], end: false };
}
const INPUT = { event: "turn", kit: KIT, text: "batting", cls: { asideReply: true } };

describe("A(i), design D1: her reply to a side-topic is its own turn, ending on its joint as a go-on line", () => {
  test("an aside's reply with a new point and its card: the reply alone, noFit aside, the afterAside joint its statement end; point and card held whole", () => {
    const out = replyApart({ turn: 8, lastMove: { kind: "repair" } }, INPUT, turnOf({ lm: { asideAck: true } }));
    const m = out.state.lastMove;
    assert.equal(m.noFit, "aside"); assert.equal(m.replyApart, "afterAside"); assert.equal(m.vpcGoOn, "Theek hai, ab phir se dhyaan idhar lagate hain.");
    assert.ok(m.splitClose && m.asideAck && !m.point);
    assert.equal(out.ui.ask, undefined);
    const h = out.state.splitHold;
    assert.equal(h.move.point, "Ab 1/3 wale 3 gap chalkar dekho: wahan 3/3 = 1."); assert.equal(h.ui.ask.text, CARD.text);
    assert.ok(!h.move.asideAck && !h.move.noFit && !h.teach);
    // (the card is held, not posed: the next turn poses it fresh)
    assert.equal(out.state.posedAt[CARD.itemId], undefined);
    assert.equal(out.state.activeItemId, undefined);
  });
  test("a park said on this turn takes afterPark; her reply after the AI line takes afterAiLine", () => {
    const park = replyApart({ turn: 8, lastMove: { kind: "repair" } }, { ...INPUT, cls: {} }, turnOf({ later: [{ id: 1, at: 9, share: true, topic: "cricket" }] }));
    assert.equal(park.state.lastMove.replyApart, "afterPark"); assert.equal(park.state.lastMove.vpcGoOn, "Abhi apne kaam par wapas chalte hain.");
    const ai = replyApart({ turn: 8, lastMove: { kind: "repair", tasteAsked: { topic: "Virat" } } }, INPUT, turnOf({ lm: { asideAck: true, heldSaid: ["Yeh do pattiyan ek jaisi hain."] } }));
    assert.equal(ai.state.lastMove.replyApart, "afterAiLine");
    assert.deepEqual(ai.state.splitHold.move.heldSaid, ["Yeh do pattiyan ek jaisi hain."]);
    assert.deepEqual(REPLY_APART_JOINTS, ["afterAside", "afterPark", "afterAiLine"]);
  });
  test("not this rule's: the turn after the go-on line (whatever the child says), no new point, a worked example, a remediation, distress, no joint form", () => {
    const same = (prev, input, t) => { const o = replyApart(prev, input, t); return o === t && !o.state.splitHold; };
    assert.ok(same({ turn: 8, lastMove: { kind: "repair", noFit: "aside", vpcGoOn: "x" } }, INPUT, turnOf({ lm: { asideAck: true } })));
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: { asideAck: true, point: undefined } })));
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: { asideAck: true, kind: "worked_example" } })));
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: { asideAck: true, scriptBeat: { kind: "remediation" } } })));
    assert.ok(same({ turn: 8, lastMove: {} }, { ...INPUT, cls: { asideReply: true, flags: { distress: true } } }, turnOf({ lm: { asideAck: true } })));
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: {} })));
    assert.ok(same({ turn: 8, lastMove: {} }, { ...INPUT, kit: { topicId: "t", __joints: {} } }, turnOf({ lm: { asideAck: true } })));
    // (her AI line itself ends on its question: the teaching waits behind it as built)
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: { asideAck: true, tasteAsked: { topic: "Virat" } } })));
  });
  test("the seam pass ends the reply's turn on its joint — the table's go-on seam, one form, said once", () => {
    for (const [a, j] of [["asideReply", "afterAside"], ["aiReply", "afterAiLine"], ["park", "afterPark"]]) assert.ok(SEAM_TABLE.some((r) => r[0] === a && r[1] === "goOn" && r[2] === j), a);
    const list = [{ part: "aside", text: "Oho, batting! Isi mein tumhe maza aata hai." }, { part: "aside", text: "Theek hai, ab phir se dhyaan idhar lagate hain." }];
    const r = applySeams(list.map((p) => p.text).join(" "), list, { kit: KIT, state: { turn: 9 }, lang: "hinglish", info: { asideAck: true, goOnAfterReply: true } });
    assert.equal(r.reply, "Oho, batting! Isi mein tumhe maza aata hai. Theek hai, ab phir se dhyaan idhar lagate hain.");
    assert.deepEqual(r.seams.map((x) => [x.left, x.right, x.joint]), [["start", "asideReply", null], ["asideReply", "goOn", "afterAside"]]);
    assert.ok(r.jointsUsed.includes("afterAside"));
    // (without the walk's mark nothing is added: a reply that leads into the lesson is joined as before)
    const r0 = applySeams(list[0].text, [list[0]], { kit: KIT, state: { turn: 9 }, lang: "hinglish", info: { asideAck: true } });
    assert.equal(r0.reply, "Oho, batting! Isi mein tumhe maza aata hai.");
  });
});

describe("A(ii), design II-B: after two requests at the greeting, the start line, the hook and the whole point end on the check-in; the card next", () => {
  test("c5-t02 (director36 stuck 4, 60 words): two give-ups at the greeting — the first teaching turn holds no card, its card is held", () => {
    const [, t2] = walkLines("c5-maths-ch02-t02", ["pata nahi", "pata nahi"]);
    const m = t2.state.lastMove;
    assert.ok(m.point && m.hookSaid && m.startApart, "the hook and the whole point");
    assert.equal(m.noFit, "point"); assert.equal(m.helpJoint?.kind, "startAnyway");
    assert.equal(t2.ui.ask, undefined);
    assert.equal(t2.state.splitHold?.ui?.ask?.itemId, "script:c5-maths-ch02-t02-s1:ask:e1");
  });
  test("a yes at its check-in gets the card alone; a ready child (a yes at the greeting) gets the hook, the point and the card as before", () => {
    const [, , t3] = walkLines("c5-maths-ch02-t02", ["pata nahi", "pata nahi", "haan"]);
    assert.equal(t3.ui.ask?.itemId, "script:c5-maths-ch02-t02-s1:ask:e1");
    assert.ok(!t3.state.lastMove.point);
    const [r1] = walkLines("c5-maths-ch02-t02", ["haan"]);
    assert.ok(r1.state.lastMove.point && r1.ui.ask?.itemId && !r1.state.lastMove.noFit);
  });
});

describe("A(iii): a right worked close and the next card over 70 words: the close whole, the go-on line, the card the next turn", () => {
  // (the steady child's lines of the dry matrix, c5-t03: director36 steady 20 said the close and c1's card in 73 words)
  const LINES = ["haan, samajh aaya", "1", "1", "pata nahi", "paanch hisse", "6 hisson mein", "6 gap chalne honge", "aath hisse", "picture dikhao", "chaar", "achha"];
  test("c5-t03: the own step answered right — the close with its why ends on the go-on statement; whatever the child says, the card comes", () => {
    const rs = walkLines("c5-maths-ch02-t03", LINES);
    const close = rs[9].state.lastMove;
    assert.equal(close.noFit, "close"); assert.ok(close.splitClose && close.vpcGoOn && !/\?\s*$/.test(close.vpcGoOn), close.vpcGoOn);
    assert.ok(close.workedDone?.why, "the close keeps its why: P5's short close is not taken");
    assert.equal(rs[9].ui.ask, undefined);
    assert.equal(rs[10].ui.ask?.itemId, "script:c5-maths-ch02-t03-s1:c1");
  });
});

describe("A.5: the four predicates, gated, each on a made row that trips it and one that does not", async () => {
  const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const seams = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
  const T = (o) => ({ who: "teacher", text: "Ek do teen.", ...o });
  const goOn = T({ noFit: "aside", noFitGoOn: true, seams: seams("asideReply", "goOn") });
  test("all four are registered and gated", () => {
    for (const k of ["replyIntoPoint", "asideGoOnNext", "startIntoCard", "closeCardLong"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); }
  });
  test("replyIntoPoint: a park, a point and its card trips it; the reply alone on its go-on line, or the turn straight after one, does not", () => {
    assert.ok(PREDICATES.replyIntoPoint({ rows: [] }, T({ seams: seams("park", "point", "card") }), 0, {}));
    assert.ok(PREDICATES.replyIntoPoint({ rows: [] }, T({ seams: seams("aiReply", "point", "card") }), 0, {}));
    assert.equal(PREDICATES.replyIntoPoint({ rows: [] }, goOn, 0, {}), null);
    assert.equal(PREDICATES.replyIntoPoint({ rows: [] }, T({ seams: seams("asideReply", "card") }), 0, {}), null);
    assert.equal(PREDICATES.replyIntoPoint({ rows: [] }, T({ seams: seams("park", "point", "card") }), 2, { prevT: goOn }), null);
  });
  test("asideGoOnNext: after the go-on line, a turn that is not the point and its card trips it; the point and card, a stop or the AI line do not", () => {
    assert.ok(PREDICATES.asideGoOnNext({ rows: [] }, T({ seams: seams("help", "checkin") }), 2, { prevT: goOn }));
    assert.equal(PREDICATES.asideGoOnNext({ rows: [] }, T({ seams: seams("point", "card") }), 2, { prevT: goOn }), null);
    assert.equal(PREDICATES.asideGoOnNext({ rows: [] }, T({ move: "wrap", seams: seams("covered") }), 2, { prevT: goOn }), null);
    assert.equal(PREDICATES.asideGoOnNext({ rows: [] }, T({ seams: seams("aiQuestion") }), 2, { prevT: goOn }), null);
    assert.equal(PREDICATES.asideGoOnNext({ rows: [] }, T({ seams: seams("help", "checkin") }), 2, { prevT: T({ seams: seams("point", "card") }) }), null);
  });
  test("startIntoCard: the start line, hook, point and card trips it; the start line, hook and point on its check-in does not", () => {
    const st = (...k) => { const s = seams(...k); s[0] = { ...s[0], joint: "startAnyway" }; return s; };
    assert.ok(PREDICATES.startIntoCard({ rows: [] }, T({ seams: st("startAnyway", "hook", "point", "card") })));
    assert.equal(PREDICATES.startIntoCard({ rows: [] }, T({ seams: st("startAnyway", "hook", "point", "checkin") })), null);
  });
  test("closeCardLong: a worked close and its card over 70 words trips it; at 70 or as two turns it does not", () => {
    const sm = [{ left: "start", right: "verdict", joint: null }, { left: "verdict", right: "card", joint: "afterWorked" }];
    assert.ok(PREDICATES.closeCardLong({ rows: [] }, T({ seams: sm, text: Array(71).fill("shabd").join(" ") })));
    assert.equal(PREDICATES.closeCardLong({ rows: [] }, T({ seams: sm, text: Array(70).fill("shabd").join(" ") })), null);
    assert.equal(PREDICATES.closeCardLong({ rows: [] }, T({ seams: [{ left: "start", right: "verdict" }, { left: "verdict", right: "aside" }], text: Array(80).fill("shabd").join(" ") })), null);
  });
  test("keyOnce no longer reads the invitation's \"jawab do.\" as a key", () => {
    assert.equal(PREDICATES.keyOnce({ rows: [] }, T({ text: "Board wala sawaal abhi baaki hai, uska jawab do." }), 2, { prevT: T({ text: "Pehle is sawaal ka jawab do." }) }), null);
    assert.ok(PREDICATES.keyOnce({ rows: [] }, T({ text: "Is sawaal ka jawab 4 hai." }), 2, { prevT: T({ text: "Iska jawab 4 hai." }) }));
  });
});

describe("main's ruling on the after-walk's six rows: a picture at a key's check-in, and a card asked on a no-picture turn", async () => {
  const { pickHelp } = await import("../server/director/help.js");
  const { heldOf } = await import("../server/brain/propose.js");
  const { readFileSync } = await import("node:fs");
  const sc = JSON.parse(readFileSync(new URL("../data/lesson-scripts-staged/c4-maths-ch01-t02.json", import.meta.url), "utf8"));
  test("a picture with nothing left at a keyed card: the no-other-drawing line, then the go-on line — the lesson goes on; never a key or a wording", () => {
    const d = pickHelp({ script: sc, part: "c4-maths-ch01-t02-s1:e1:card", keyed: true, request: "picture", said: [] });
    assert.equal(d.card, "goOn"); assert.equal(d.key, null); assert.equal(d.rung, null);
    assert.equal(d.joint?.kind, "noPicture"); assert.equal(d.then?.kind, "afterKeyGoOn"); assert.ok(d.pictureSpent);
    // (at a live card, the same request is A3's — the line, a wording, the card kept)
    const live = pickHelp({ script: sc, part: "c4-maths-ch01-t02-s1:e1:card", keyed: false, request: "picture", said: [] });
    assert.equal(live.card, "keep");
  });
  test("the seam pass records the line and the go-on line as two joints, each its own kind", () => {
    const list = [{ part: "close", text: "Iski aur koi tasveer mere paas nahi hai." }, { part: "close", text: "Chalo, ab agli baat dekhte hain." }, { part: "body", text: "Do baar moda kaagaz hamara tester hai." }];
    const r = applySeams(list.map((p) => p.text).join(" "), list, { kit: { topicId: "t", __joints: {} }, state: { turn: 9 }, lang: "hinglish",
      info: { helpJoint: { kind: "afterKeyGoOn", form: "Chalo, ab agli baat dekhte hain.", by: "authored", spent: { form: "Iski aur koi tasveer mere paas nahi hai.", by: "authored", kind: "noPicture" } } } });
    assert.deepEqual(r.seams.slice(0, 2).map((x) => [x.left, x.right, x.joint]), [["start", "noPicture", "noPicture"], ["noPicture", "afterKeyGoOn", "afterKeyGoOn"]]);
    assert.ok(SEAM_TABLE.some((x) => x[0] === "noPicture" && x[1] === "afterKeyGoOn"));
  });
  test("a no-picture turn keeps the board up under the line and the help, and puts the card's own board up at the card's first word", () => {
    const up = { board: { template: "number-line-scale@1", params: { from: 2, to: 12, view: "jumps" } }, unit: "t-s1:rem:x" };
    const own = { template: "number-line-scale@1", params: { from: 2, to: 12 } };
    const list = [{ part: "aside", text: "Iski aur koi drawing mere paas nahi hai." }, { part: "simpler", text: "Ungli 6 par rakho." }, { part: "card", text: "Chabi kitni lambi hai?" }];
    const line = list.map((p) => p.text).join(" ");
    const h = heldOf({ move: { keepBoard: true, cardBeat: { skillId: "t-s1", beatId: "then:x", kind: "then", board: own } }, list, line, kit: {}, up });
    assert.deepEqual(h.board, up.board);
    assert.deepEqual(h.switchTo?.board, own); assert.equal(h.switchTo?.atChar, line.indexOf("Chabi"));
    // (the card's own board already up: no page change)
    const h2 = heldOf({ move: { keepBoard: true, cardBeat: { skillId: "t-s1", beatId: "then:x", kind: "then", board: up.board } }, list, line, kit: {}, up });
    assert.equal(h2.switchTo, undefined);
  });
});
