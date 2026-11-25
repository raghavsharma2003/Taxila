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
  test("switchFirst: allowed — point, switch line, Hindi-form card; still flagged — the switch line before the point, or with no Hindi form after it", () => {
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
    assert.equal(at(row([["point", point], ["hindiSwitch", sw], ["card", hf]])), null, "point, switch line, the card's Hindi form");
    assert.ok(at(row([["hindiSwitch", sw], ["point", point], ["card", hf]])), "the switch line before the point");
    assert.ok(at(row([["point", point], ["hindiSwitch", sw], ["card", asWritten]])), "the switch line with the card as written after it");
    // (and the switch line after the point with something else between it and the Hindi form)
    const mid = row([["point", point], ["hindiSwitch", sw], ["point2", "Dhyan se dekho."], ["card", hf]]);
    assert.ok(at(mid), "the switch line not straight before the card");
  });
});

describe("item 2: a child who asks about her own taste gets the AI line whole, always", () => {
  // (main's fifth ruling item 1: her reply to the child's answer takes the D2 shape — pinned in r8-d37-054a, afterAiLine. The go-on walk pins are
  // removed with the go-on turn)
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
  test("replyIntoPoint: her reply to the answer, after a go-on and the AI line, is excused only as shaped (no after joint, within 70 words)", () => {
    assert.equal(P.replyIntoPoint({}, reply, 4, { prevT: aiQ, prevPrevT: go() }), null);
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
