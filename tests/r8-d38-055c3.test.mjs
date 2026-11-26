// d38 builder A2 (to-brain 055 C3 and C4): no fifth hearing on her own, in any form. Help asked for after four hearings (a clarify) ends on
// the invitation, not the question; the wait's second turn, whose re-ask would be the fifth hearing, is what wait three is — at four
// hearings the cap (the told step); with three it is the re-ask as built; the child's own "phir se bolo" is honoured at the fifth. Driven walks with step() and
// brain/say.js textReply, the reply stubbed and held for each walk's whole length: at a card (c4-maths-ch05-t01's second card) and at an
// asked step (its worked problem's first step). The question is heard four times first by the child's own "phir se bolo" (honoured, counted).
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { initLessonState, step } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { findItem } = await import("../server/director/items.js");
const { textReply, replyDeps } = await import("../server/brain/say.js");
const { atQuestionOf, endsOnYourTurn } = await import("../server/director/question-run.js");
const { scriptFor } = await import("../server/director/script.js");
const { D38A_PREDICATES } = await import("../evals/hybrid-side-by-side/d38a-predicates.mjs");
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const LINES = { again: ["phir se bolo", { outcome: "no_evidence", request: { type: "repeat" } }], wrong: ["7", { outcome: "incorrect" }],
  give: ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }],
  clarify: ["samajh nahi aaya", { outcome: "no_evidence", request: { type: "clarify" } }], haan: ["haan", { outcome: "no_evidence" }] };

let gate = Promise.resolve();
async function holdStub() {
  const before = gate; let release; gate = new Promise((res) => { release = res; });
  await before;
  const chat0 = replyDeps.chat, stream0 = replyDeps.chatStream;
  replyDeps.chat = async () => ({ text: "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?" }); replyDeps.chatStream = replyDeps.chat;
  return () => { replyDeps.chat = chat0; replyDeps.chatStream = stream0; release(); };
}
async function walk(TOPIC, which, skip, seq) {
  const free = await holdStub();
  try {
    const kit = kitFromFile(getTopic(TOPIC));
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "d38-055c3", lessonKey: "d38-055c3", teacher: "director" };
    let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    const rows = [];
    const say = async (text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
    const row = (t) => { const lm = r.state.lastMove ?? {}; rows.push({ who: "teacher", text: norm(t.reply), cell: lm.cell ?? null, seams: t.guard?.seams ?? [], move: lm.kind, lm,
      ...(lm.heardCap ? { heardCap: lm.heardCap } : {}), ...(lm.stepReply ? { stepAnswer: { told: lm.stepReply.told ?? null } } : {}) }); };
    { const t = await say(""); r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }]; row(t); }
    const turn = async (text, cls) => {
      const s = r.state; rows.push({ who: "child", text });
      r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
      const t = await say(text); r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }]; row(t);
    };
    let sk = skip;
    for (let i = 0; i < 300; i++) {
      const s = r.state; const isStep = !!(s.lastMove?.stepAsk?.prompt && !s.lastMove.splitClose);
      const isCard = String(s.lastUi?.ask?.itemId ?? "").startsWith("script:") && !isStep;
      if ((which === "card" && isCard) || (which === "step" && isStep)) { if (sk-- <= 0) break; }
      const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      await turn(it ? String(it.answer) : "haan", { outcome: it ? "correct" : "no_evidence" });
    }
    const n0 = rows.length - 1, script = scriptFor(kit).script, P = atQuestionOf(script, rows[n0].text);
    for (const k of seq) await turn(...LINES[k]);
    return { rows, n0, script, P, her: rows.slice(n0).filter((x) => x.who === "teacher") };
  } finally { free(); }
}
const readsZero = (w) => { for (const k of ["keyWithWordingUnsaid", "questionFifthOnHerOwn"]) assert.deepEqual(w.rows.map((r, i) => D38A_PREDICATES[k]({ rows: w.rows }, r, i, { script: w.script })).filter(Boolean), [], k); };

const flagsOf = (w, k) => w.rows.map((r, i) => D38A_PREDICATES[k]({ rows: w.rows }, r, i, { script: w.script })).filter(Boolean);

describe("C3 at a card (c4-maths-ch05-t01, its second card): a clarify after four hearings", async () => {
  const w = await walk("c4-maths-ch05-t01", "card", 1, ["again", "again", "again", "clarify"]);
  const [posed, a1, a2, a3, h] = w.her;
  test("the question is heard four times", () => { for (const t of [posed, a1, a2, a3]) assert.equal(atQuestionOf(w.script, t.text), w.P, t.text); });
  test("the help ends on the invitation, not the question: no fifth hearing on her own", () => {
    assert.ok(h.seams.some((x) => x.right === "help"), h.text); assert.ok(endsOnYourTurn(w.script, h.text), h.text); assert.notEqual(atQuestionOf(w.script, h.text), w.P, h.text);
    assert.deepEqual(flagsOf(w, "questionFifthOnHerOwn"), []);
  });
  test("(what she says, for the notes)", () => { for (const t of w.her) console.log(`[055c3 card] ${t.text}`); });
});

describe("C3 and C4 at an asked step: the wait at four hearings is the cap's ladder — C1's turn, then the told step", async () => {
  const w = await walk("c4-maths-ch05-t01", "step", 0, ["again", "again", "again", "haan", "haan", "haan"]);
  const [, , , a3, w1, w2, w3t] = w.her;
  // (re-pinned by d38 RULING-A8 Q2 and main's ruling on its stop: was "wait two, whose re-ask would be the fifth hearing, tells the step (the
  // cap)". At four hearings the wait's ladder is two turns: where no C1 turn was given and a wording is unsaid, C1's turn (that wording as
  // help, ending on an invitation); at the next bare yes the told step. Never told with no help offered at that question)
  test("wait one says no question (here the invitation: her two turns before were at it); wait two, whose re-ask would be the fifth hearing, is C1's turn; the next bare yes gets the told step (the cap)", () => {
    assert.equal(atQuestionOf(w.script, a3.text), w.P, a3.text);
    assert.ok(endsOnYourTurn(w.script, w1.text), w1.text);
    assert.ok(w2.seams.some((x) => x.right === "help") && endsOnYourTurn(w.script, w2.text) && !w2.stepAnswer?.told, w2.text); assert.notEqual(atQuestionOf(w.script, w2.text), w.P, w2.text);
    assert.ok(w3t.heardCap && w3t.stepAnswer?.told, w3t.text); assert.notEqual(atQuestionOf(w.script, w3t.text), w.P, w3t.text);
    assert.deepEqual(flagsOf(w, "questionFifthOnHerOwn"), []); assert.deepEqual(flagsOf(w, "keyWithWordingUnsaid"), []);
  });
  const w3 = await walk("c4-maths-ch05-t01", "step", 0, ["again", "again", "haan", "haan"]);
  test("with three hearings, wait two is as built (help ending on the question, the fourth hearing — its re-ask was just heard: RULING-B3), the step not told", () => {
    const [, , , x1, x2] = w3.her;
    assert.ok(endsOnYourTurn(w3.script, x1.text), x1.text);
    assert.equal(atQuestionOf(w3.script, x2.text), w3.P, x2.text); assert.ok(!x2.heardCap && !x2.stepAnswer?.told, x2.text);
  });
  const w4 = await walk("c4-maths-ch05-t01", "step", 0, ["again", "again", "again", "again"]);
  test("the child's own \"phir se bolo\" at the fifth is honoured: the question, and no flag", () => {
    assert.equal(atQuestionOf(w4.script, w4.her[4].text), w4.P, w4.her[4].text);
    assert.deepEqual(flagsOf(w4, "questionFifthOnHerOwn"), []);
  });
  test("(what she says, for the notes)", () => { for (const t of [...w.her, ...w3.her]) console.log(`[055c3 step] ${t.text}`); });
});
