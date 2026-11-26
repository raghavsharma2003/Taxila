// d38 builders A and A2 (to-brain 055 C1, as main ruled in RULING-A2 A(i)): where the cap (the question heard four times) would tell while
// a wording of the open part is unsaid, the FIRST unsaid wording is the turn, once a question, as help ending on an invitation
// (joints.yourTurn), never on the question; the answer (or the step) is told with its reason at the child's next miss or give-up, whatever
// is still unsaid. Driven walks with step() and
// brain/say.js textReply, the reply stubbed and held for each walk's whole length: at a card (c4-maths-ch05-t01's second card) and at an
// asked step (its worked problem's first step). The question is heard four times first by the child's own "phir se bolo" (honoured, counted).
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { initLessonState, step } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { findItem } = await import("../server/director/items.js");
const { textReply, replyDeps } = await import("../server/brain/say.js");
const { holdReplyStub } = await import("./_reply-hold.mjs");
const { atQuestionOf, endsOnYourTurn } = await import("../server/director/question-run.js");
const { scriptFor } = await import("../server/director/script.js");
const { D38A_PREDICATES } = await import("../evals/hybrid-side-by-side/d38a-predicates.mjs");
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const LINES = { again: ["phir se bolo", { outcome: "no_evidence", request: { type: "repeat" } }], wrong: ["7", { outcome: "incorrect" }],
  give: ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }] };

let gate = Promise.resolve();
async function holdStub() {
  const before = gate; let release; gate = new Promise((res) => { release = res; });
  await before;
  // (the stub held through tests/_reply-hold.mjs, counted across files: a walk's end never puts the real model back under another file's walk)
  const free = holdReplyStub();
  return () => { free(); release(); };
}
async function walk(TOPIC, which, skip, seq) {
  const free = await holdStub();
  try {
    const kit = kitFromFile(getTopic(TOPIC));
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "d38-055c1", lessonKey: "d38-055c1", teacher: "director" };
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

describe("C1 at a card (c4-maths-ch05-t01, its second card): four hearings, then misses", async () => {
  const w = await walk("c4-maths-ch05-t01", "card", 1, ["again", "again", "again", "wrong", "wrong"]);
  const [posed, a1, a2, a3, m1, m2] = w.her;
  test("the question is heard four times: the card and three answers to \"phir se bolo\"", () => {
    for (const t of [posed, a1, a2, a3]) assert.equal(atQuestionOf(w.script, t.text), w.P, t.text);
  });
  test("the first miss at the cap, a wording unsaid: that wording (C1), ending on an invitation, never the question, never the key", () => {
    assert.ok(endsOnYourTurn(w.script, m1.text), m1.text); assert.notEqual(atQuestionOf(w.script, m1.text), w.P, m1.text);
    assert.ok(m1.seams.some((x) => x.right === "help"), m1.text); assert.ok(!m1.seams.some((x) => x.right === "key") && !m1.lm.gave && !m1.heardCap, m1.text);
  });
  test("one C1 turn a question (ruling A(i)): the next miss is the cap, the key with its reason, though a wording is still unsaid", () => {
    assert.ok(m2.heardCap && m2.lm.gave, m2.text); assert.ok(/kyunki/.test(m2.text), m2.text);
  });
  test("the two d38a checks read 0 on the walk", () => readsZero(w));
  test("(what she says, for the notes)", () => { for (const t of w.her) console.log(`[055c1 card] ${t.text}`); });
});

describe("C1 at an asked step (c4-maths-ch05-t01's worked problem, step 1): four hearings, then give-ups", async () => {
  const w = await walk("c4-maths-ch05-t01", "step", 0, ["again", "again", "again", "give", "give"]);
  const [posed, a1, a2, a3, g1, g2] = w.her;
  test("the step's question is heard four times", () => { for (const t of [posed, a1, a2, a3]) assert.equal(atQuestionOf(w.script, t.text), w.P, t.text); });
  test("the first give-up at the cap, one of the step's wordings unsaid: that wording (C1), ending on an invitation; the step is not told", () => {
    assert.ok(endsOnYourTurn(w.script, g1.text), g1.text); assert.notEqual(atQuestionOf(w.script, g1.text), w.P, g1.text);
    assert.ok(!g1.stepAnswer?.told && !g1.heardCap, g1.text);
  });
  test("one C1 turn a step (ruling A(i)): the next give-up tells the step (the cap)", () => {
    assert.ok(g2.heardCap && g2.seams.some((x) => x.right === "workedStep"), g2.text);
  });
  test("the two d38a checks read 0 on the walk", () => readsZero(w));
  test("(what she says, for the notes)", () => { for (const t of w.her) console.log(`[055c1 step] ${t.text}`); });
});
