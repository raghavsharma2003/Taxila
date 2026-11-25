// to-brain 054 A, builder A of round d37 (docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md, main's rulings: A(i) design D1,
// A(ii) design II-B, A(iii) as written): a turn holds one new thing. The walk's rules pinned in units; the four predicates of A.5 pinned on
// made rows, one that trips each and one that does not.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { _replyApartForTest as replyApart, REPLY_APART_JOINTS } from "../server/director/state.js";
import { applySeams, SEAM_TABLE } from "../server/brain/seams.js";

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
