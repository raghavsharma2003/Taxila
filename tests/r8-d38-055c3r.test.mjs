// d38 builder A3 (main's ruling A3 item 2 of d38, to-brain 055 C3 at a return): where her turn after a side-topic would be the fifth counted
// hearing of the open question, it is her reply and its back-to-work joint as built, then what the cap gives on a miss at that moment.
// Built here: the told answer (a card) and the told step (an asked step), where C1's turn was already given at that question; and, by main's
// ruling A4, C1's own turn at a return where it was not: her reply, its joint, the first unsaid wording as help and the question's re-ask —
// never an invitation (the gated inviteAfterPark). Driven walks with step() and brain/say.js
// textReply, the reply stubbed and held for each walk's whole length, at c4-maths-ch05-t01's second card and its worked problem's first
// step. The question is heard four times first by the child's own "phir se bolo" (honoured, counted); her reply follows the AI line.
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
const LINES = { again: ["phir se bolo", { outcome: "no_evidence", request: { type: "repeat" } }],
  give: ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }],
  ai: ["aapko virat pasand hai?", { outcome: "no_evidence" }],
  // (her question back after the AI line is answered: the route's reader marks it so — brain/turn.js planTurn, asideReplyDue)
  reply: ["chauka", { outcome: "no_evidence", confidence: 1, asideReply: true }] };

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
    // (d38 RULING-A11 W3, re-pinned: was "aiReply>verdict:afterAiLine" — the yes-or-no key recorded as a verdict at a return, with the
    // verdict's joint (22c8af1ab). A told answer is a key on every path, with the seam-table pair and joint the circle card's same turn takes:
    // reply > key, which the table joins with none)
    assert.deepEqual(seamOf(ret).slice(0, 2), ["start>aiReply", "aiReply>key"], ret.text);
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

describe("main's ruling A4: C1 at a return — her reply, its joint, the first unsaid wording as help and the question's re-ask; once a question", async () => {
  const reaskOf = (w) => { const o = w.P.split(/\.|\[|\]/).filter(Boolean).reduce((x, k) => x?.[/^\d+$/.test(k) ? Number(k) : k], w.script); return norm(o?.reask?.hi ?? o?.reask); };
  const w = await walk("c4-maths-ch05-t01", "step", 0, ["again", "again", "again", "ai", "reply", "give"]);
  const [, , , , ai, ret, told] = w.her;
  test("the return: reply, afterAiLine, help, then the step's re-ask — never an invitation; no hearing check flags it", () => {
    assert.equal(atQuestionOf(w.script, ai.text), null, ai.text);
    assert.deepEqual(seamOf(ret), ["start>aiReply", "aiReply>help:afterAiLine", "help>help", "help>stepAsk"], ret.text);
    assert.ok(!endsOnYourTurn(w.script, ret.text), ret.text); assert.equal(atQuestionOf(w.script, ret.text), w.P, ret.text);
    assert.ok(ret.text.endsWith(reaskOf(w)), ret.text);
    assert.deepEqual(flagsOf(w, "questionFifthOnHerOwn"), []);
  });
  test("after it a give-up gets the told step with its reason (C1 was that turn) — no sixth hearing", () => {
    assert.ok(told.stepAnswer?.told && told.heardCap === w.P, told.text); assert.notEqual(atQuestionOf(w.script, told.text), w.P, told.text);
    assert.deepEqual(flagsOf(w, "keyWithWordingUnsaid"), []);
  });
  const w2 = await walk("c4-maths-ch05-t01", "step", 0, ["again", "again", "again", "ai", "reply", "ai"]);
  test("a further side-topic at that question (the AI question asked again, whose honest line goes on into the step): her line and the told step — never a sixth hearing on her own", () => {
    const last = w2.her.at(-1), before = w2.her.at(-2);
    // (d38 RULING-A8 Q3, re-pinned: was "aiLine>workedStep:afterAiLine" — its joint. Her turn before, the return turn, said its back-to-work
    // joint, so the told step says none: never "back to work" twice running, the gated goOnJointTwice. Where her turn before said no go-on
    // joint the told step's joint is said: the two walks above, after C1's turn on a give-up)
    assert.ok(seamOf(before).includes("aiReply>help:afterAiLine"), before.text);
    assert.deepEqual(seamOf(last).slice(0, 2), ["start>aiLine", "replyAgain>workedStep"], last.text);
    assert.ok(!last.seams.some((x) => x.joint), last.text);
    assert.ok(last.stepAnswer?.told, last.text);
    assert.deepEqual(flagsOf(w2, "questionFifthOnHerOwn"), []); assert.deepEqual(flagsOf(w2, "keyWithWordingUnsaid"), []);
  });
  const wc = await walk("c4-maths-ch05-t01", "card", 1, ["again", "again", "again", "ai", "reply", "give"]);
  test("at a card: reply, joint, the card's first unsaid wording, the card's re-ask; then the key at the give-up", () => {
    const [, , , , , r1, k1] = wc.her;
    assert.deepEqual(seamOf(r1).slice(0, 2), ["start>aiReply", "aiReply>help:afterAiLine"], r1.text);
    assert.ok(r1.text.endsWith(reaskOf(wc)), r1.text); assert.ok(!endsOnYourTurn(wc.script, r1.text), r1.text);
    assert.equal(k1.lm.help?.card, "close", k1.text); assert.notEqual(atQuestionOf(wc.script, k1.text), wc.P, k1.text);
    assert.deepEqual(flagsOf(wc, "questionFifthOnHerOwn"), []); assert.deepEqual(flagsOf(wc, "keyWithWordingUnsaid"), []);
  });
  test("(what she says, for the notes)", () => { for (const t of [...w.her, ...wc.her]) console.log(`[055c3r A4] ${t.text}`); });
});
