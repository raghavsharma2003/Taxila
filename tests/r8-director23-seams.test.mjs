// dc-r8-director23 S: one seam pass over the assembled turn decides every joint from a table keyed by the two neighbouring kinds, writes
// the turn's seams, and the seam predicates read that list and nothing else.
import { test } from "node:test";
import assert from "node:assert/strict";
import { seamPass, seamJoint, seamStart, SEAM_TABLE } from "../server/brain/seams.js";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const joints = {
  backTo: [{ hi: "Chalo, ab pichhle sawaal par wapas chalte hain." }, { hi: "Achha, ab pehle wale sawaal ko phir se dekhte hain." }, { hi: "Chalo, pehle wale sawaal ki taraf wapas aate hain." }],
  afterAside: [{ hi: "Ab wapas apni padhai par aate hain." }, { hi: "Achha, ab wahin se shuru karte hain jahan ruke the." }, { hi: "Theek hai, ab phir se apne kaam par lagte hain." }],
  beforeRemediation: [{ hi: "Ise ek alag tareeke se dekhte hain." }, { hi: "Ab isi baat ko doosri tarah samajhte hain." }, { hi: "Ek naye tareeke se socho." }],
  afterAiLine: [{ hi: "Ab seekhne par wapas aate hain." }], afterTryFirst: [{ hi: "Yeh raha sawaal." }],
};
const kit = { topicId: "t", __joints: joints };
const st = (key = "L1", jointN = {}) => ({ ctx: { lessonKey: key }, jointN });
const run = (list, info = {}, state = st()) => seamPass(list, { kit, state, lang: "hinglish", info });
const text = (r) => r.list.map((p) => p.text).join(" ");

test("the table: a point and its own card, a verdict and its own why take none; the named seams take their joint", () => {
  assert.equal(seamJoint("point", "card"), null);
  assert.equal(seamJoint("verdict", "point"), null);
  assert.equal(seamJoint("missVerdict", "remediation"), "beforeRemediation");
  assert.equal(seamJoint("verdict", "returnCard"), "backTo");
  assert.equal(seamJoint("asideReply", "point"), "afterAside");
  assert.equal(seamJoint("aiLine", "card"), "afterAiLine");
  assert.ok(SEAM_TABLE.length > 10);
});

test("a return to an earlier card after a then-card's verdict, in the same turn, gets backTo (director23's commonest missing joint)", () => {
  const r = run([{ part: "close", text: "Haan, sahi hai, kyunki 7 nahi mila." }, { part: "card", text: "16 kanche 4 group mein bate. Kya Rani sahi hai?" }], { returnCard: true });
  assert.equal(r.seams[1].joint, "backTo");
  assert.match(text(r), /sahi hai, kyunki 7 nahi mila\. (?:Chalo|Achha), .*sawaal.*\. 16 kanche/);
});

test("no joint survives an earlier pass: a joint between a point and its own card is removed, and none is put there", () => {
  const r = run([{ part: "body", text: "Ek lambi barfi ke 5 barabar tukde kiye. Ab wapas apni padhai par aate hain." }, { part: "card", text: "Barfi ka kitna bhaag khaya gaya?" }]);
  assert.equal(text(r), "Ek lambi barfi ke 5 barabar tukde kiye. Barfi ka kitna bhaag khaya gaya?");
  assert.ok(r.seams.every((s) => !s.joint));
});

test("her aside reply into the lesson gets the after-aside joint straight after it; after her AI line, afterAiLine", () => {
  const r = run([{ part: "aside", text: "Achha, toh tumhe batting sabse achha lagta hai." }, { part: "body", text: "Ek tukda rangin hai." }, { part: "card", text: "Toh rangin tukda 1/2 hai ya 1/1?" }], { replyLine: "Achha, toh tumhe batting sabse achha lagta hai." });
  assert.equal(r.seams[1].joint, "afterAside");
  // (a filler opening two neighbouring parts is said once: "Achha, toh … Achha, ab …")
  assert.doesNotMatch(text(r), /lagta hai\. Achha,/);
  const ai = run([{ part: "aside", text: "Main AI hoon, meri koi pasand nahi hoti." }, { part: "body", text: "Pehla kadam dekho." }]);
  assert.equal(ai.seams[1].joint, "afterAiLine");
});

test("a check-in is no aside reply: it takes no joint", () => {
  const r = run([{ part: "close", text: "Nahi, yeh jawab nahi hai." }, { part: "aside", text: "Yahan tak theek hai?" }], { miss: true });
  assert.ok(r.seams.every((s) => !s.joint));
});

test("forms rotate from a seed of the lesson: two lessons do not all open on the same form", () => {
  const firsts = new Set(["a", "b", "c", "d", "e", "f"].map((k) => run([{ part: "close", text: "Nahi." }, { part: "body", text: "Ek roti socho." }], { miss: true, remediation: true }, st(k)).said.beforeRemediation));
  assert.ok(firsts.size > 1);
  assert.notEqual(seamStart("a", "backTo"), seamStart("b", "backTo"));
  // (and by the count said so far in one lesson)
  const one = (n) => run([{ part: "close", text: "Nahi." }, { part: "body", text: "Ek roti socho." }], { miss: true, remediation: true }, st("a", { beforeRemediation: n })).said.beforeRemediation;
  assert.notEqual(one(0), one(1));
});

test("the seam predicates read the seams list and are gated", () => {
  for (const k of ["seamJoints", "backToJoint", "missRemediationJoint"]) assert.ok(!PENDING.has(k), k);
  const ctx = { script: { joints }, o: {}, prevT: {} };
  const row = (seams, t = "x") => ({ who: "teacher", text: t, seams });
  assert.match(PREDICATES.seamJoints("L", row([{ left: "verdict", right: "returnCard", joint: null }]), 1, ctx), /takes backTo/);
  assert.match(PREDICATES.seamJoints("L", row([{ left: "point", right: "card", joint: "afterAside", form: "x" }]), 1, ctx), /takes none/);
  assert.equal(PREDICATES.seamJoints("L", row([{ left: "verdict", right: "returnCard", joint: "backTo", form: "Chalo." }], "Sahi. Chalo. Card?"), 1, ctx), null);
  assert.match(PREDICATES.backToJoint("L", row([{ left: "verdict", right: "returnCard", joint: null }])), /no joint/);
  assert.match(PREDICATES.backToJoint("L", row([{ left: "point", right: "card", joint: "backTo" }])), /no return/);
  assert.match(PREDICATES.missRemediationJoint("L", row([{ left: "missVerdict", right: "remediation", joint: null }])), /no joint/);
});
