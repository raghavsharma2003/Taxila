// to-brain 054 A, main's fifth ruling on cause A (round d37, after the paid pair run: A(i) is design D2): the predicates it names, each on
// made rows — one that trips it and one that does not. replyCheckin and asideCheckin relaxed (item 3), replyIntoPoint strict and
// endsOnQuestion without noFit "aside" (item 2), goOnNoTeach widened (item 2), replyPointCardNext new and gated (item 4).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const seams = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
const T = (o) => ({ who: "teacher", text: "Ek do teen.", ...o });
const C = (text = "haan") => ({ who: "child", text });
const POINT = "Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, aur hum 2/3 par aa gaye.";
/** Her reply's turn: a reply line (seam `kind`), then — when `point` — a point (a body page part) and her check-in. */
function replyTurn(kind, point = POINT, extra = {}) {
  const reply = "Oho, batting! Isi mein tumhe maza aata hai.";
  const text = point ? `${reply} ${point} Yahan tak theek hai?` : `${reply} Yahan tak theek hai?`;
  return T({ text, beat: "s2:explain:e1", seams: point ? seams(kind, "point", "checkin") : seams(kind, "checkin"),
    pageParts: point ? [{ part: "body", from: reply.length + 1, beat: "e1" }] : [], ...extra });
}

describe("item 3: replyCheckin and asideCheckin allow a check-in after a reply only when a new point stands between", () => {
  test("replyCheckin: a reply and its check-in, or a reply and a point said before, trips it; a reply, a new point and its check-in does not", () => {
    const rp = replyTurn("asideReply");
    assert.equal(PREDICATES.replyCheckin({ rows: [rp] }, rp, 0, {}), null);
    const ai = replyTurn("aiReply");
    assert.equal(PREDICATES.replyCheckin({ rows: [ai] }, ai, 0, {}), null);
    const bare = replyTurn("asideReply", null);
    assert.ok(PREDICATES.replyCheckin({ rows: [bare] }, bare, 0, {}));
    // (the same point told before: not new — a check-in after it checks what was already checked)
    const before = T({ text: `${POINT} Yahan tak theek hai?`, seams: seams("point", "checkin") });
    assert.ok(PREDICATES.replyCheckin({ rows: [before, C(), rp] }, rp, 2, {}));
    // (a reply and a help line, then a check-in: no new point, still flagged)
    const help = T({ text: "Oho! Socho phir se. Yahan tak theek hai?", seams: seams("asideReply", "help", "checkin") });
    assert.ok(PREDICATES.replyCheckin({ rows: [help] }, help, 0, {}));
  });
  test("asideCheckin: a park, a return or a reply straight into a check-in trips it; a park, a new point and its check-in does not", () => {
    for (const k of ["park", "return", "asideReply", "aiReply"]) {
      const bare = replyTurn(k, null);
      assert.ok(PREDICATES.asideCheckin({ rows: [bare] }, bare, 0, {}), k);
      const rp = replyTurn(k);
      assert.equal(PREDICATES.asideCheckin({ rows: [rp] }, rp, 0, {}), null, k);
    }
  });
});

describe("item 2: what goes with the go-on turn", () => {
  const goOn = T({ noFit: "aside", noFitGoOn: true, seams: seams("asideReply", "goOn") });
  test("replyIntoPoint reads strictly: a reply seam, a new point and its card in one turn is flagged, after a go-on turn or the AI line too", () => {
    const row = T({ text: "Cricket wali baat. Ab 1/3 wale 3 gap. Kitne gap?", seams: seams("aside", "point", "card") });
    assert.ok(PREDICATES.replyIntoPoint({ rows: [] }, row, 2, { prevT: goOn }), "the said-again exemption is gone");
    const ai = T({ seams: seams("aiQuestion") });
    const rep = T({ text: "Wah, chauka! Ab 1/3 wale 3 gap. Kitne gap?", seams: seams("aiReply", "point", "card") });
    assert.ok(PREDICATES.replyIntoPoint({ rows: [] }, rep, 4, { prevT: ai, prevPrevT: goOn }), "the reply-after-go-on-and-AI-line exemption is gone");
    // (D2's turn — a reply, a point and its check-in — and a reply into a card with no new point are not this rule's)
    assert.equal(PREDICATES.replyIntoPoint({ rows: [] }, replyTurn("park"), 0, {}), null);
    assert.equal(PREDICATES.replyIntoPoint({ rows: [] }, T({ seams: seams("park", "card") }), 0, {}), null);
  });
  test("endsOnQuestion no longer accepts noFit \"aside\": her reply's go-on line is flagged; a right verdict's go-on line is not", () => {
    const end = (r) => PREDICATES.endsOnQuestion({ rows: [r, C()] }, r, 0, {});
    assert.ok(end(T({ text: "Oho, batting! Theek hai, ab phir se dhyaan idhar lagate hain.", move: "repair", noFit: "aside", noFitGoOn: true })));
    assert.equal(end(T({ text: "Bilkul sahi. Chalo, aage badhte hain.", move: "repair", noFit: "vpc" })), null);
  });
  test("goOnNoTeach reads ANY three of her turns running with no teaching part; two, or a third that teaches, do not", () => {
    const quiet = (s) => T({ seams: seams(s) });
    const rows = [quiet("tryFirst"), C(), quiet("aiQuestion"), C(), quiet("return")];
    assert.ok(PREDICATES.goOnNoTeach({ rows }, rows[4], 4, {}));
    assert.equal(PREDICATES.goOnNoTeach({ rows: rows.slice(2) }, rows[4], 2, {}), null);
    const taught = [quiet("tryFirst"), C(), quiet("aiQuestion"), C(), T({ seams: seams("aiReply", "card") })];
    assert.equal(PREDICATES.goOnNoTeach({ rows: taught }, taught[4], 4, {}), null);
    // (a stop between is no stall)
    const stop = [quiet("tryFirst"), C(), T({ move: "break", seams: seams("break") }), C(), quiet("aiQuestion"), C(), quiet("return")];
    assert.equal(PREDICATES.goOnNoTeach({ rows: stop }, stop[6], 6, {}), null);
  });
  test("asideGoOnNext, goOnNoTeach and goOnJointTwice stay gated", () => {
    for (const k of ["asideGoOnNext", "goOnNoTeach", "goOnJointTwice", "replyIntoPoint", "replyCheckin", "asideCheckin", "endsOnQuestion"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); }
  });
});

describe("item 4: replyPointCardNext, gated — after her reply's point turn the next turn that teaches says that point's card and no new point", () => {
  const rp = replyTurn("park");
  const card = (o = {}) => T({ beat: "s2:explain:e1", seams: seams("card"), pageParts: [{ part: "card", from: 0, beat: "e1" }], check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e1" }, ...o });
  const run = (...after) => { const rows = [rp, ...after.flatMap((x) => [C(), x])]; return PREDICATES.replyPointCardNext({ rows }, rp, 0, {}); };
  test("registered and gated", () => { assert.ok(PREDICATES.replyPointCardNext); assert.ok(!PENDING.has("replyPointCardNext")); });
  test("its card next, or after a turn that teaches nothing, or after help on the point alone: not flagged", () => {
    assert.equal(run(card()), null);
    assert.equal(run(T({ seams: seams("aiQuestion") }), card({ seams: seams("aiReply", "card") })), null);
    assert.equal(run(T({ seams: seams("help", "help", "checkin") }), card({ seams: seams("help", "card") })), null);
    assert.equal(run(card({ seams: seams("aside", "card") })), null);
  });
  test("a new point, or another card, as the next teaching turn: flagged; a stop or a safety turn first: not", () => {
    assert.ok(run(T({ beat: "s2:explain:e2", seams: seams("aside", "point", "card"), pageParts: [{ part: "body", from: 0, beat: "e2" }, { part: "card", from: 9, beat: "e2" }], check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e2" } })));
    assert.ok(run(card({ beat: "s2:explain:e2", pageParts: [{ part: "card", from: 0, beat: "e2" }], check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e2" } })));
    assert.equal(run(T({ move: "safeguard", seams: seams("safeguard") }), T({ seams: seams("point", "card") })), null);
    assert.equal(run(T({ move: "wrap", seams: seams("covered") })), null);
  });
  test("not read after a turn that is no reply's point turn: a bare point and its check-in, or a point said before", () => {
    const plain = T({ text: `${POINT} Yahan tak theek hai?`, beat: "s2:explain:e1", seams: seams("point", "checkin"), pageParts: [{ part: "body", from: 0, beat: "e1" }] });
    const rows = [plain, C(), T({ seams: seams("point", "card") })];
    assert.equal(PREDICATES.replyPointCardNext({ rows }, plain, 0, {}), null);
    const again = [plain, C(), rp, C(), T({ seams: seams("point", "card") })];
    assert.equal(PREDICATES.replyPointCardNext({ rows: again }, rp, 2, {}), null);
  });
});
