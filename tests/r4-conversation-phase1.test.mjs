// Round 4, stream 4A, phase 1 (battery 2026-10-10, local, n = 354): the code changes for the weakest intents. Pure: no model,
// no network. The battery lines quoted here are the BATTERY's (evals/conversation-v2/cases.mjs); none is from the held-out set.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readIntent, alsoQuestion } from "../server/conversation/lexicon.js";
import { requestOf } from "../server/director/requests.js";
import { classifyFast, hedgeCore, correctedTail, targetFor } from "../server/director/classify.js";
import { MUST_NOTE } from "../server/director/shapes.js";
import { compileWithReport } from "../server/compiler/compile.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { kit, CTX, cls, BRIEF } from "./fixtures/kit.mjs";

const K = kit();
const fresh = () => initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 });
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const NE = cls("no_evidence");
function toPractice() {
  let r = step(fresh(), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, NE);
  return r;
}
function said(r, text) {
  const target = targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId));
  const fast = classifyFast({ target, childText: text, typed: true });
  return fast.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: fast.flags, request: fast.request };
}
const withBrief = (r) => ({ ...r.state, brief: BRIEF, mode: "text" });

test("must-notes are notes, never lines", () => {
  for (const [k, v] of Object.entries(MUST_NOTE)) {
    assert.doesNotMatch(v, /["“”]/, k);
    assert.doesNotMatch(v, /\b(?:I|I'm|let's|we'll)\b/, k);
    assert.ok(v.length <= 200, k);
  }
});

test("'I know this, move on' forms are read (skip_ahead 1/7); acknowledgements and the check-in's continue are not", () => {
  for (const t of ["this is easy can we move on", "fast forward karo yaar", "jaldi karo na", "ye toh school mein ho gaya aage", "skip the explanation i get it", "ye mujhe aata hai aage chalo", "we did this in school"]) {
    assert.equal(readIntent(t)?.type, "know", t);
  }
  for (const t of ["samajh gaya", "easy", "haan", "ok"]) assert.notEqual(readIntent(t)?.type, "know", t);
  assert.equal(requestOf("aage chalo")?.type, "continue");
});

test("'I know this' with a question on the table: a different (harder) question, never the same one, and no teaching", () => {
  const r = toPractice();
  const before = r.move.itemId;
  const n = turn(r, said(r, "ye mujhe aata hai aage chalo"), { text: "ye mujhe aata hai aage chalo" });
  assert.equal(n.move.request, "know");
  assert.notEqual(n.move.itemId, before, "never the same question again");
  assert.match(n.move.must ?? "", /no explanation/);
  assert.match(instructionsFor(withBrief(n), K, "text"), /THIS TURN FIRST \(a note, not words to say\): no explanation/);
});

test("a grown-up speaking about the child in the third person is read as an adult (adult_voice); a sibling is not", () => {
  assert.equal(readIntent("beta ko thoda dheere padhao, wo naya hai")?.type, "adult");
  assert.equal(readIntent("my son needs more practice")?.type, "adult");
  assert.notEqual(readIntent("bhai ko bhi padhao")?.type, "adult");
});

test("a hedged exact answer is graded as that answer; a spoken self-correction is graded on its final words", () => {
  assert.equal(hedgeCore("shayad 1/3 before, 2/3 after? pakka nahi pata"), "1/3 before, 2/3 after");
  assert.equal(hedgeCore("fan"), null);
  assert.equal(correctedTail("the arrows show a line extending in both directions 8 cm measures only the drawing no sorry segment"), "segment");
  const t = { mode: "item", key: "Line segment", also: ["a line segment", "segment"], misconceptions: [], item: { prompt_en: "x" } };
  assert.equal(classifyFast({ target: t, childText: "the arrows show a line 8 cm measures only the drawing no sorry segment", typed: true }).result?.outcome, "correct");
  assert.equal(classifyFast({ target: t, childText: "segment no sorry line", typed: true }).result?.outcome ?? null, null, "a wrong final answer is never credited in code");
  const h = { mode: "item", key: "1/3 is before the middle and 2/3 is after", also: ["1/3 before, 2/3 after"], misconceptions: [], item: { prompt_en: "x" } };
  const r = classifyFast({ target: h, childText: "shayad 1/3 before, 2/3 after? pakka nahi pata", typed: true }).result;
  assert.equal(r?.outcome, "correct");
  assert.equal(r?.flags.dontKnow, false);
});

test("a question tacked onto an answer is parked and kept for later (multi_intent 'yes also why is the sky blue')", () => {
  assert.equal(alsoQuestion("yes also why is the sky blue"), "why is the sky blue");
  assert.equal(alsoQuestion("1/2 and 2/4"), null);
  const r = toPractice();
  const n = turn(r, cls("incorrect"), { text: "yes also why is the sky blue" });
  assert.ok((n.state.later ?? []).some((e) => /sky/.test(e.topic)), JSON.stringify(n.state.later));
});

test("frustration, slower and thinking aloud carry their must-do into the LAST section (position is mechanism)", () => {
  const r = toPractice();
  for (const [text, re] of [["mujhse nahi hoga ye", /smaller step/], ["ruko, soch raha hoon", /go-on/]]) {
    const n = turn(r, said(r, text), { text });
    assert.match(n.move.must ?? "", re, text);
    const out = instructionsFor(withBrief(n), K, "text");
    const at = out.indexOf("THIS TURN FIRST"), check = out.indexOf("ONE MORE CHECK");
    assert.ok(at > 0 && at < check, `${text}: the note sits right before the last check`);
  }
});

test("the must-note never rides on a safeguard and is shed (never a budget throw) when the last section is full", () => {
  const r = toPractice();
  const distress = cls("no_evidence", { flags: { distress: true, distressKind: "abuse" } });
  const n = turn(r, distress, { text: "mujhse nahi hoga, sab mujhe maarte hain" });
  assert.equal(n.move.kind, "safeguard");
  assert.equal(n.move.must, undefined);
  const f = turn(r, said(r, "mujhse nahi hoga ye"), { text: "mujhse nahi hoga ye" });
  const input = { character: { name: "Asha", addressedAs: "Asha didi", notes: [], protege: { name: "Golu" } }, brief: BRIEF, lessonState: withBrief(f),
    topic: { title: "Fractions", classLevel: 4, subject: "maths" }, language: "hinglish", lane: "text", item: findItem(f.state, K, f.move.itemId) };
  const without = compileWithReport({ ...input, move: { ...f.move, must: undefined } });
  const lastTokens = without.sections.find((x) => x.id === "last").tokens;
  const shed = compileWithReport({ ...input, move: f.move }, { caps: { last: lastTokens } });
  assert.doesNotMatch(shed.text, /THIS TURN FIRST/);
  assert.match(compileWithReport({ ...input, move: f.move }).text, /THIS TURN FIRST/);
});
