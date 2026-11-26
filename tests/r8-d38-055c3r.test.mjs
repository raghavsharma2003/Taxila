// d38 builder A3 (main's ruling A3 item 2 of d38, to-brain 055 C3 at a return): where her turn after a side-topic would be the fifth counted
// hearing of the open question, it is her reply and its back-to-work joint as built, then what the cap gives on a miss at that moment.
// Built here: the told answer (a card) and the told step (an asked step), where C1's turn was already given at that question. NOT built
// (a clash, for main): C1's help ending on an invitation at a return — the gated inviteAfterPark and yourTurnNotThird flag that turn; the
// return is as built there, and the last describe pins that (so the clash stays visible). Driven walks with step() and brain/say.js
// textReply, the reply stubbed and held for each walk's whole length, at c4-maths-ch05-t01's second card and its worked problem's first
// step. The question is heard four times first by the child's own "phir se bolo" (honoured, counted); her reply follows the AI line.
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
const LINES = { again: ["phir se bolo", { outcome: "no_evidence", request: { type: "repeat" } }],
  give: ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }],
  ai: ["aapko virat pasand hai?", { outcome: "no_evidence" }],
  // (her question back after the AI line is answered: the route's reader marks it so — brain/turn.js planTurn, asideReplyDue)
  reply: ["chauka", { outcome: "no_evidence", confidence: 1, asideReply: true }] };

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
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "d38-055c3r", lessonKey: "d38-055c3r", teacher: "director" };
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
const flagsOf = (w, k) => w.rows.map((r, i) => D38A_PREDICATES[k]({ rows: w.rows }, r, i, { script: w.script })).filter(Boolean);
const seamOf = (t) => t.seams.map((s) => `${s.left}>${s.right}${s.joint ? `:${s.joint}` : ""}`);
const SEQ_C1_FIRST = ["again", "again", "again", "give", "ai", "reply"];

describe("C3 at a return, a card (c4-maths-ch05-t01, its second card): C1 given, then her reply after the AI line at four hearings", async () => {
  const w = await walk("c4-maths-ch05-t01", "card", 1, SEQ_C1_FIRST);
  const [posed, a1, a2, a3, c1, ai, ret] = w.her;
  test("the question is heard four times; the give-up gets C1 (help ending on the invitation)", () => {
    for (const t of [posed, a1, a2, a3]) assert.equal(atQuestionOf(w.script, t.text), w.P, t.text);
    assert.ok(endsOnYourTurn(w.script, c1.text), c1.text); assert.ok(c1.seams.some((x) => x.right === "help"), c1.text);
  });
  test("the AI line asks back and says no question of the lesson", () => { assert.equal(atQuestionOf(w.script, ai.text), null, ai.text); });
  test("the return: her reply, its back-to-work joint, then the told answer with its reason (the key) — never the question", () => {
    assert.deepEqual(seamOf(ret).slice(0, 2), ["start>aiReply", "aiReply>verdict:afterAiLine"], ret.text);
    assert.equal(ret.cell?.column, "aside_reply", ret.text);
    assert.equal(ret.lm.help?.card, "close", ret.text); assert.equal(ret.heardCap, w.P, ret.text);
    assert.notEqual(atQuestionOf(w.script, ret.text), w.P, ret.text);
    assert.deepEqual(flagsOf(w, "questionFifthOnHerOwn"), []); assert.deepEqual(flagsOf(w, "keyWithWordingUnsaid"), []);
  });
  test("(what she says, for the notes)", () => { for (const t of w.her) console.log(`[055c3r card] ${t.text}`); });
});

describe("C3 at a return, an asked step: C1 given, then her reply after the AI line at four hearings", async () => {
  const w = await walk("c4-maths-ch05-t01", "step", 0, SEQ_C1_FIRST);
  const [posed, a1, a2, a3, c1, ai, ret] = w.her;
  test("four hearings; C1 at the give-up; the AI line", () => {
    for (const t of [posed, a1, a2, a3]) assert.equal(atQuestionOf(w.script, t.text), w.P, t.text);
    assert.ok(endsOnYourTurn(w.script, c1.text), c1.text); assert.equal(atQuestionOf(w.script, ai.text), null, ai.text);
  });
  test("the return: her reply, its back-to-work joint, then the told step with its reason — never the step's question", () => {
    assert.deepEqual(seamOf(ret).slice(0, 2), ["start>aiReply", "aiReply>workedStep:afterAiLine"], ret.text);
    assert.equal(ret.cell?.column, "aside_reply", ret.text);
    assert.ok(ret.stepAnswer?.told && ret.heardCap === w.P, ret.text);
    assert.notEqual(atQuestionOf(w.script, ret.text), w.P, ret.text);
    assert.deepEqual(flagsOf(w, "questionFifthOnHerOwn"), []); assert.deepEqual(flagsOf(w, "keyWithWordingUnsaid"), []);
  });
  test("(what she says, for the notes)", () => { for (const t of w.her) console.log(`[055c3r step] ${t.text}`); });
});

describe("NOT built (the clash): at a return where C1 is the cap's turn, the return is as built — the fifth hearing", async () => {
  const w = await walk("c4-maths-ch05-t01", "step", 0, ["again", "again", "again", "ai", "reply"]);
  const ret = w.her.at(-1);
  test("her reply, its joint and the step's question: questionFifthOnHerOwn flags it (main to rule)", () => {
    assert.deepEqual(seamOf(ret), ["start>aiReply", "aiReply>stepAsk:afterAiLine"], ret.text);
    assert.equal(atQuestionOf(w.script, ret.text), w.P, ret.text);
    assert.equal(flagsOf(w, "questionFifthOnHerOwn").length, 1);
  });
});
