// to-brain 054 A, builder A of round d37 (docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md, main's rulings: A(i) design D2
// since the fifth ruling (D1's go-on turn was heard as dead), A(ii) design II-B, A(iii) as written): a turn holds one new thing. The walk's rules pinned in units; the four predicates of A.5 pinned on
// made rows, one that trips each and one that does not.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { applySeams, SEAM_TABLE } from "../server/brain/seams.js";
import { initLessonState, step, _replyPointForTest as replyPoint } from "../server/director/state.js";
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

describe("A(i), design D2 (main's fifth ruling item 1): her reply, its joint, the point whole and the point's check-in; the card the next turn", () => {
  test("an aside's reply with a new point and its card: the point ends on its check-in (noFit point), the card held whole for the next turn", () => {
    const out = replyPoint({ turn: 8, lastMove: { kind: "repair" } }, INPUT, turnOf({ lm: { asideAck: true } }));
    const m = out.state.lastMove;
    assert.equal(m.noFit, "point"); assert.equal(m.replyPoint, "afterAside");
    assert.ok(m.asideAck && m.point === "Ab 1/3 wale 3 gap chalkar dekho: wahan 3/3 = 1.", "the reply and the point whole");
    assert.ok(!m.vpcGoOn && !m.splitClose, "no go-on line");
    assert.equal(out.ui.ask, undefined);
    const h = out.state.splitHold;
    assert.ok(h.teach); assert.equal(h.ui.ask.text, CARD.text); assert.ok(!h.move.point && !h.move.asideAck);
    // (the card is held, not posed: the next turn poses it fresh)
    assert.equal(out.state.posedAt[CARD.itemId], undefined);
  });
  test("a park said on this turn is afterPark's; her reply after the AI line is afterAiLine's; a point held behind the AI line is said here once", () => {
    const park = replyPoint({ turn: 8, lastMove: { kind: "repair" } }, { ...INPUT, cls: {} }, turnOf({ later: [{ id: 1, at: 9, share: true, topic: "cricket" }] }));
    assert.equal(park.state.lastMove.replyPoint, "afterPark"); assert.equal(park.state.lastMove.noFit, "point");
    const held = turnOf({ lm: { asideAck: true, point: undefined, heldSaid: ["Yeh do pattiyan ek jaisi hain."], sayFirst: ["Yeh do pattiyan ek jaisi hain."] } });
    held.state.bodyUnsaid = ["Yeh do pattiyan ek jaisi hain."];
    const ai = replyPoint({ turn: 8, lastMove: { kind: "repair", tasteAsked: { topic: "Virat" } } }, INPUT, held);
    assert.equal(ai.state.lastMove.replyPoint, "afterAiLine");
    assert.deepEqual(ai.state.lastMove.sayFirst, ["Yeh do pattiyan ek jaisi hain."]); assert.equal(ai.state.lastMove.point, undefined);
    assert.equal(ai.state.bodyUnsaid, undefined); assert.equal(ai.state.splitHold.ui.ask.text, CARD.text);
  });
  test("not this rule's: no reply, no new point, a worked example, a remediation, distress, her AI line itself, a return asked", () => {
    const same = (prev, input, t) => { const o = replyPoint(prev, input, t); return o === t && !o.state.splitHold; };
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: {} })));
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: { asideAck: true, point: undefined } })));
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: { asideAck: true, kind: "worked_example" } })));
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: { asideAck: true, scriptBeat: { kind: "remediation" } } })));
    assert.ok(same({ turn: 8, lastMove: {} }, { ...INPUT, cls: { asideReply: true, flags: { distress: true } } }, turnOf({ lm: { asideAck: true } })));
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: { asideAck: true, tasteAsked: { topic: "Virat" } } })));
    assert.ok(same({ turn: 8, lastMove: {} }, INPUT, turnOf({ lm: { asideAck: true, returned: { topic: "cricket" } } })));
  });
  // (the steady child's lines of the dry matrix, c5-t01: director36 steady 36 said the park, its joint, the s2 point and its card in 73 words)
  const LINES = ["haan, samajh aaya", "3", "6 kilometre", "pata nahi", "one sixth", "1 upon 3", "eight", "1/8", "picture dikhao", "between 0 and 1/5 hai na", "1/10 wala", "chaar gap", "dhai sau metre", "pehle main try karun?", "1 upon 11", "1/12", "pehle mark par", "kal maine cricket khela, sixer maara"];
  const CARD2 = "script:c5-maths-ch02-t01-s2:ask:e1";
  test("c5-t01: a side-topic at the bridge's check-in — the park, the point whole, its check-in; the card held", () => {
    const t = walkLines("c5-maths-ch02-t01", LINES).at(-1);
    const m = t.state.lastMove;
    assert.equal(m.replyPoint, "afterPark"); assert.equal(m.noFit, "point"); assert.ok(m.point);
    assert.equal(t.ui.ask, undefined); assert.equal(t.state.splitHold?.ui?.ask?.itemId, CARD2);
  });
  test("each answer to that check-in, routed as A(ii): a yes or silence the card alone; a give-up or Hindi help on the point and the card; a clarify help, then the card", () => {
    for (const yes of ["haan", ""]) {
      const t = walkLines("c5-maths-ch02-t01", [...LINES, yes]).at(-1);
      assert.equal(t.ui.ask?.itemId, CARD2, yes); assert.ok(!t.state.lastMove.point && !t.state.lastMove.help, yes);
    }
    for (const req of ["pata nahi", "hindi mein batao"]) {
      const t = walkLines("c5-maths-ch02-t01", [...LINES, req]).at(-1);
      assert.equal(t.state.lastMove.help?.rung, "pointAlt", req); assert.equal(t.ui.ask?.itemId, CARD2, req);
    }
    const [c1, c2] = walkLines("c5-maths-ch02-t01", [...LINES, "samajh nahi aaya", "haan"]).slice(-2);
    assert.equal(c1.state.lastMove.help?.rung, "pointAlt"); assert.equal(c2.ui.ask?.itemId, CARD2);
  });
  test("a side-topic at that check-in: her line to it and the card — no new point, no return, and no second back-to-work joint", () => {
    const t = walkLines("c5-maths-ch02-t01", [...LINES, "mujhe cricket pasand hai"]).at(-1);
    const m = t.state.lastMove;
    assert.ok(m.asideAgain && m.noReplyJoint && !m.point && !m.returned && !m.replyPoint);
    assert.equal(t.ui.ask?.itemId, CARD2);
  });
  test("the seam pass: her reply, its joint and the point, as director36 joined them; on the turn after, her line to the side-topic takes none (replyAgain)", () => {
    const list = [{ part: "aside", text: "Oho, batting! Isi mein tumhe maza aata hai." }, { part: "body", text: "Ab 1/3 wale 3 gap chalkar dekho." }, { part: "aside", text: "Yahan tak theek hai?" }];
    const r = applySeams(list.map((p) => p.text).join(" "), list, { kit: KIT, state: { turn: 9, ctx: { lang: "hinglish" }, lastMove: {} }, lang: "hinglish", info: { asideAck: true } });
    assert.equal(r.seams.find((x) => x.right === "point")?.joint, "afterAside");
    assert.ok(r.reply.includes("Theek hai, ab phir se dhyaan idhar lagate hain. Ab 1/3"), r.reply);
    const next = [{ part: "aside", text: "Cricket wali baat maine likh li hai." }, { part: "card", text: CARD.text }];
    const r2 = applySeams(next.map((p) => p.text).join(" "), next, { kit: KIT, state: { turn: 11, ctx: { lang: "hinglish" }, lastMove: { noReplyJoint: true } }, lang: "hinglish", info: { asideAck: true, noReplyJoint: true } });
    const c = r2.seams.find((x) => x.right === "card");
    assert.equal(c?.left, "replyAgain"); assert.equal(c.joint, null); assert.ok(!r2.jointsUsed.includes("afterAside"));
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
