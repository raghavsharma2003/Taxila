// to-brain 054 A, main's fourth ruling on cause A (round d37, after the second as-heard read): two items, each pinned here — the walk's turn on
// the offline walk (state.js step, no reply), the seam pass on made parts, and the predicate on made rows.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { D29_PREDICATES } from "../evals/hybrid-side-by-side/d29-predicates.mjs";
import { D37A_PREDICATES as P } from "../evals/hybrid-side-by-side/d37a-predicates.mjs";

const live = (t) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${t}.json`, import.meta.url), "utf8"));
describe("item 1: a Hindi request after a go-on turn — the point first, then the switch line and the card's Hindi form", () => {
  // (main's fifth ruling item 2: the Hindi-after-a-go-on path is gone with the go-on turn — nothing reaches it. Its walk and seam pins are
  // removed; a Hindi request at the check-in of her reply's point turn is pinned in r8-d37-054a's D2 tests)
  // (main's sixth ruling item 5: switchFirst is back to its a23e5c45d reading — the fourth ruling's item 1 was withdrawn with the go-on turn:
  // a switch line in a point's first telling is flagged wherever it stands)
  test("switchFirst (a23e5c45d's reading): the switch line in a point's first telling is flagged — after the point before the Hindi form too", () => {
    const script = live("c5-maths-ch02-t01");
    const card = script.skills.find((k) => k.skillId === "c5-maths-ch02-t01-s2").explain.find((b) => b.id === "e1").ask;
    const hf = String(card.hindi?.hi ?? card.hindi);
    const asWritten = String(card.prompt?.hi ?? card.prompt);
    assert.ok(hf && asWritten && hf !== asWritten);
    const point = "Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, ek, do, aur hum 2/3 par aa gaye.";
    const sw = "Achha, ab Hindi mein bolti hoon.";
    const row = (parts) => {
      let text = "", from = {}; const seams = []; let left = "start";
      for (const [k, t] of parts) { from[k] = text ? text.length + 1 : 0; text = text ? `${text} ${t}` : t;
        seams.push({ left, right: k, joint: k === "hindiSwitch" ? "hindiSwitch" : null, ...(k === "hindiSwitch" ? { form: t } : {}) }); left = k; }
      return { who: "teacher", text, seams, check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e1" },
        pageParts: [{ part: "body", beat: "e1", from: from.point }, { part: "card", beat: "e1", from: from.card }].sort((a, b) => a.from - b.from) };
    };
    const at = (r) => D29_PREDICATES.switchFirst({ rows: [r] }, r, 0, { o: { teacherTexts: [] }, script });
    assert.ok(at(row([["point", point], ["hindiSwitch", sw], ["card", hf]])), "point, switch line, the card's Hindi form: no longer excused");
    assert.ok(at(row([["hindiSwitch", sw], ["point", point], ["card", hf]])), "the switch line before the point");
    assert.ok(at(row([["point", point], ["hindiSwitch", sw], ["card", asWritten]])), "the switch line with the card as written after it");
    // (and the switch line after the point with something else between it and the Hindi form)
    const mid = row([["point", point], ["hindiSwitch", sw], ["point2", "Dhyan se dekho."], ["card", hf]]);
    assert.ok(at(mid), "the switch line not straight before the card");
  });
});

describe("item 2: a child who asks about her own taste gets the AI line whole, always", () => {
  // (main's fifth ruling item 1: her reply to the child's answer takes the D2 shape. The go-on walk pins are removed with the go-on turn)
  test("the AI line stays alone and whole, its question back with it; her reply to the child's answer is D2 — reply, afterAiLine, the point, its check-in; the card next", async () => {
    const { _replyPointForTest: replyPoint, _afterReplyPointForTest: afterReplyPoint } = await import("../server/director/state.js");
    const { applySeams } = await import("../server/brain/seams.js");
    const KIT = { topicId: "t-test", __joints: { afterAiLine: [{ hi: "Ab apni padhai par lautte hain.", en: "Now back to learning." }] } };
    const CARD = { itemId: "script:t-s1:ask:e2", text: "0 se theek 1 tak aise kitne gap chalne honge?" };
    const turnOf = ({ lm = {}, turn = 9 } = {}) => {
      const lastMove = { kind: "explain", itemId: CARD.itemId, skillId: "t-s1", point: "Yeh do pattiyan bilkul ek jaisi hain.", scriptBeat: { skillId: "t-s1", beatId: "e2", kind: "explain" }, ...lm };
      const state = { turn, ctx: { lang: "hinglish" }, later: [], posedAt: { [CARD.itemId]: turn }, activeItemId: CARD.itemId, lastMove, lastUi: { status: "your_turn", ask: CARD } };
      return { state, move: lastMove, ui: { status: "your_turn", ask: CARD }, moduleCommands: [], end: false };
    };
    // (the AI line itself, after her reply's point turn or anywhere: neither rule touches it)
    const ask = { event: "turn", kit: KIT, text: "aapko virat pasand hai?", cls: {} };
    const t0 = turnOf({ lm: { tasteAsked: { topic: "Virat", n: 1 }, asideAck: true } });
    assert.equal(replyPoint({ turn: 8, lastMove: { kind: "explain" } }, ask, t0), t0);
    assert.equal(afterReplyPoint({ turn: 8, lastMove: { kind: "explain", replyPoint: "afterAside", noFit: "point" } }, ask, t0), t0);
    // (her reply to the child's answer, with a new point: the D2 turn)
    const AI = { turn: 9, lastMove: { kind: "repair", tasteAsked: { topic: "Virat" } } };
    const rep = replyPoint(AI, { event: "turn", kit: KIT, text: "chauka", cls: { asideReply: true } }, turnOf({ turn: 10, lm: { asideAck: true } }));
    assert.equal(rep.state.lastMove.replyPoint, "afterAiLine"); assert.equal(rep.state.lastMove.noFit, "point");
    assert.ok(rep.state.lastMove.point); assert.equal(rep.ui.ask, undefined); assert.equal(rep.state.splitHold.ui.ask.text, CARD.text);
    // (the seam pass joins her reply and the point with afterAiLine, inside the turn)
    const list = [{ part: "aside", text: "Wah, chauka!", kind: "aiReply" }, { part: "body", text: "Yeh do pattiyan bilkul ek jaisi hain." }, { part: "aside", text: "Yahan tak theek hai?" }];
    const r = applySeams(list.map((p) => p.text).join(" "), list, { kit: KIT, state: { turn: 10, ctx: { lang: "hinglish" }, lastMove: {} }, lang: "hinglish", info: {} });
    assert.deepEqual(r.seams.slice(0, 2).map((x) => [x.left, x.right, x.joint]), [["start", "aiReply", null], ["aiReply", "point", "afterAiLine"]]);
    assert.ok(r.reply.startsWith("Wah, chauka! Ab apni padhai par lautte hain. Yeh do"), r.reply);
  });
  const go = (j = "afterAside") => ({ who: "teacher", text: "Oho, Rohit! Theek hai, ab phir se dhyaan idhar lagate hain.", noFit: "aside", noFitGoOn: true, seams: [{ right: "asideReply" }, { right: "goOn", joint: j }] });
  const aiQ = { who: "teacher", text: "Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein kya achha lagta hai?", seams: [{ left: "start", right: "aiQuestion" }] };
  const c = { who: "child", text: "chauka" };
  const reply = { who: "teacher", text: "Wah, chauka! Ab 1/3 wale 3 gap chalkar dekho. 0 se theek 1 tak aise kitne gap chalne honge?",
    seams: [{ left: "start", right: "aiReply" }, { left: "replyAgain", right: "point", joint: null }, { left: "point", right: "card" }] };
  test("replyIntoPoint: a turn that opens on the AI line and carries a new point and card is never allowed (seam aiLine)", () => {
    const aiInto = { who: "teacher", text: "Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Ab 1/3 wale 3 gap chalkar dekho. Kitne gap?",
      seams: [{ left: "start", right: "aiLine" }, { left: "replyAgain", right: "point", joint: null }, { left: "point", right: "card" }] };
    assert.ok(P.replyIntoPoint({}, aiInto, 2, { prevT: go() }), "after a go-on turn too");
    assert.ok(P.replyIntoPoint({}, aiInto, 2, { prevT: { who: "teacher", seams: [{ right: "checkin" }] } }));
    // (the AI line on its own, or with the point alone on its check-in, is not this)
    assert.equal(P.replyIntoPoint({}, aiQ, 2, { prevT: go() }), null);
    assert.equal(P.replyIntoPoint({}, { ...aiInto, seams: [{ right: "aiLine" }, { right: "point" }, { right: "checkin" }] }, 2, { prevT: go() }), null);
  });
  // (main's fifth ruling item 2: replyIntoPoint reads strictly — the exemption after a go-on and the AI line is gone with the go-on turn)
  test("replyIntoPoint: her reply to the answer, after a go-on and the AI line, run into a new point and card, is flagged — no exemption", () => {
    assert.ok(P.replyIntoPoint({}, reply, 4, { prevT: aiQ, prevPrevT: go() }));
    const joint = { ...reply, seams: [{ right: "aiReply" }, { right: "point", joint: "afterAiLine" }, { right: "card" }] };
    assert.ok(P.replyIntoPoint({}, joint, 4, { prevT: aiQ, prevPrevT: go() }));
    const long = { ...reply, text: `${reply.text} ${"ek do teen chaar paanch ".repeat(12)}` };
    assert.ok(P.replyIntoPoint({}, long, 4, { prevT: aiQ, prevPrevT: go() }));
    // (with no go-on turn before the AI line, it is a reply run into a point as before)
    assert.ok(P.replyIntoPoint({}, reply, 4, { prevT: aiQ, prevPrevT: { who: "teacher", seams: [{ right: "checkin" }] } }));
  });
  test("goOnNoTeach: three turns running with no teaching part — a go-on, the AI line, a go-on — and its kin; not when the third teaches", () => {
    const at = (rows) => P.goOnNoTeach({ rows }, rows.at(-1), rows.length - 1);
    assert.ok(at([go(), c, aiQ, c, go("afterAiLine")]));
    const plain = { who: "teacher", text: "Achha, chauka!", seams: [{ right: "aiReply" }] };
    assert.ok(at([go(), c, aiQ, c, plain]), "three turns running, the third not a go-on");
    assert.equal(at([go(), c, aiQ, c, reply]), null);
    assert.equal(at([go(), c, aiQ]), null, "two turns are not three");
    assert.equal(at([aiQ, c, go("afterAiLine")]), null, "the go-on turn after the AI line at a check-in (A(i))");
    assert.equal(at([go(), c, aiQ, c, { ...plain, move: { kind: "wrap" } }]), null, "a wrap is no lesson turn");
  });
});
