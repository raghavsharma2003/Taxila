// d38 RULING-A9 R1: replyPointCardNext's list of what may stand before the held card gains `aiLine` — her AI line said again, the short form
// with no question back (offtopic c4-maths-ch01-t02 52 to 54 of builder Q's matrix: her reply's point turn; the child's "aapko virat pasand
// hai?" again; "Main AI hoon, meri koi pasand nahi hoti." and the point's card). The one reading it changes; made rows, each side.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const seams = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
const T = (o) => ({ who: "teacher", text: "Ek do teen.", ...o });
const C = (text = "haan") => ({ who: "child", text });
const POINT = "Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, aur hum 2/3 par aa gaye.";
const reply = "Oho, batting! Isi mein tumhe maza aata hai.";
const rp = T({ text: `${reply} ${POINT} Yahan tak theek hai?`, beat: "s2:explain:e1", seams: seams("aiReply", "point", "checkin"), pageParts: [{ part: "body", from: reply.length + 1, beat: "e1" }] });
const card = (o = {}) => T({ beat: "s2:explain:e1", seams: seams("card"), pageParts: [{ part: "card", from: 0, beat: "e1" }], check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e1" }, ...o });
const run = (...after) => { const rows = [rp, ...after.flatMap((x) => [C("aapko virat pasand hai?"), x])]; return PREDICATES.replyPointCardNext({ rows }, rp, 0, {}); };

test("R1: her AI line said again, then the held card, in the turn after her reply's point turn — passes", () => {
  assert.equal(run(card({ text: "Main AI hoon, meri koi pasand nahi hoti. Ek do teen?", seams: seams("aiLine", "card") })), null);
});
test("R1, the other side: the AI line WITH its question back before the card in the same turn flags; the AI line and some OTHER card flags", () => {
  assert.match(String(run(card({ seams: seams("aiQuestion", "card") }))), /aiQuestion before its card/);
  assert.match(String(run(card({ seams: seams("aiLine", "card"), beat: "s2:explain:e2", pageParts: [{ part: "card", from: 0, beat: "e2" }], check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e2" } }))), /does not carry its card/);
});
