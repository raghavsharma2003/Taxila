// d37 builder H (RULING-H, main's ruling after the second whole read): items 15 and 16.
//   15. Every reply to a child's try-first is "Haan, pehle tum try karo." and nothing after it; the gated check `tryFirstNotAlone` reads it.
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { D37H_PREDICATES, isTryFirst, goAheadOf } = await import("../evals/hybrid-side-by-side/d37h-predicates.mjs");
const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");

const T = (text, extra = {}) => ({ who: "teacher", text, seams: [], ...extra });
const C = (text) => ({ who: "child", text });
const flagsOf = (rows) => rows.map((r, i) => D37H_PREDICATES.tryFirstNotAlone({ rows }, r, i)).map((x, i) => (x ? i : -1)).filter((i) => i >= 0);

describe("item 15: tryFirstNotAlone (made rows, both sides)", () => {
  test("it is registered and gated", () => { assert.ok(PREDICATES.tryFirstNotAlone); assert.ok(!PENDING.has("tryFirstNotAlone")); });
  test("its own list of try-firsts reads the matrix's three lines and their like, and not an answer or a yes", () => {
    for (const t of ["mujhe khud try karne do", "ruko, main khud karti hoon", "pehle main try karun?", "let me try", "main khud karunga", "khud try karungi"]) assert.ok(isTryFirst(t), t);
    for (const t of ["haan", "12", "pata nahi", "try nahi karna", "main thak gayi hoon"]) assert.ok(!isTryFirst(t), t);
  });
  test("the go-ahead alone passes; the go-ahead with a short ask, an invitation or the question flags (g/dry2 rows' shapes)", () => {
    const Q = T("Bat ek metre se kitne centimetre chhota hai?");
    assert.deepEqual(flagsOf([Q, C("mujhe khud try karne do"), T("Haan, pehle tum try karo.")]), []);
    assert.deepEqual(flagsOf([Q, C("ruko, main khud karti hoon"), T("Haan, pehle tum try karo. Ab phir se socho, jawab kya hoga?")]), [2]);
    assert.deepEqual(flagsOf([Q, C("pehle main try karun?"), T("Haan, pehle tum try karo. Ab tumhara jawab sunti hoon.")]), [2]);
    assert.deepEqual(flagsOf([Q, C("pehle main try karun?"), T("Haan, pehle tum try karo. Chalo, ab tumhari baari.")]), [2]);
    assert.deepEqual(flagsOf([Q, C("pehle main try karun?"), T("Haan, pehle tum try karo — Bat ek metre se kitne centimetre chhota hai?")]), [2]);
  });
  test("a reply to a try-first with no go-ahead flags; a safety turn is not read; a go-ahead after any other line is not read", () => {
    assert.deepEqual(flagsOf([T("Q?"), C("mujhe khud try karne do"), T("Koi baat nahi, isko aise dekho: 12 ka aadha 6.")]), [2]);
    assert.deepEqual(flagsOf([T("Q?"), C("mujhe khud try karne do"), T("Main yahin hoon.", { move: "safeguard" })]), []);
    assert.deepEqual(flagsOf([T("Q?"), C("haan"), T("Haan, pehle tum try karo. Ab phir se socho, jawab kya hoga?")]), []);
  });
  test("goAheadOf splits the go-ahead from what follows", () => {
    assert.deepEqual(goAheadOf("Haan, pehle tum try karo."), { goAhead: "Haan, pehle tum try karo", rest: "" });
    assert.equal(goAheadOf("Haan, pehle tum try karo. Ab tum batao.").rest, "Ab tum batao.");
    assert.equal(goAheadOf("Achha, chalo."), null);
  });
});

// Item 15 with item 18a (main: the wait after a go-ahead), walked with step() and brain/say.js textReply (the reply stubbed: every line of
// these turns is the script's or code's): card, try-first, the go-ahead alone, then "haan" four times — wait one the short ask, wait two the
// reask, wait three help, wait four the cap. The walk's rows are read by the gated wait checks and tryFirstNotAlone (none flags).
const { initLessonState, step } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { findItem } = await import("../server/director/items.js");
const { textReply, replyDeps } = await import("../server/brain/say.js");
const { atQuestionOf, reaskOf, endsOnShortAsk } = await import("../server/director/question-run.js");
const { fillFriend } = await import("../server/director/friend.js");
const { scriptFor } = await import("../server/director/script.js");
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const LINES = { try: ["mujhe khud try karne do", { outcome: "no_evidence", request: { type: "selftry" } }], haan: ["haan", { outcome: "no_evidence" }] };

async function walkTo(TOPIC, skip) {
  const chat0 = replyDeps.chat, stream0 = replyDeps.chatStream;
  replyDeps.chat = async () => ({ text: "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?" }); replyDeps.chatStream = replyDeps.chat;
  const kit = kitFromFile(getTopic(TOPIC));
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
    interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "d37-054h", lessonKey: "d37-054h", teacher: "director" };
  let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const rows = [];
  const say = async (text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
  const row = (t) => { const lm = r.state.lastMove ?? {}; rows.push({ who: "teacher", text: norm(t.reply), cell: lm.cell ?? null, seams: t.guard?.seams ?? [], move: lm.kind,
    ...(lm.heardCap ? { heardCap: lm.heardCap } : {}), ...(lm.stepReply ? { stepAnswer: { told: lm.stepReply.told ?? null } } : {}) }); };
  { const t = await say(""); r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }]; row(t); }
  const turn = async (text, cls) => {
    const s = r.state;
    rows.push({ who: "child", text });
    r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
    const t = await say(text);
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }]; row(t);
    return { text: norm(t.reply), lm: r.state.lastMove ?? {}, seams: (t.guard?.seams ?? []).map((x) => x.right) };
  };
  for (let i = 0; i < 300; i++) {
    const s = r.state;
    const isStep = !!(s.lastMove?.stepAsk?.prompt && !s.lastMove.splitClose);
    if (String(s.lastUi?.ask?.itemId ?? "").startsWith("script:") && !isStep) { if (skip-- <= 0) break; }
    const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    await turn(it ? String(it.answer) : "haan", { outcome: it ? "correct" : "no_evidence" });
  }
  const script = scriptFor(kit).script;
  const P = atQuestionOf(script, r.state.lastUi?.ask?.text);
  const play = async (seq) => { const out = []; for (const k of seq) out.push(await turn(...LINES[k])); return out; };
  return { P, script, play, rows, done: () => { replyDeps.chat = chat0; replyDeps.chatStream = stream0; } };
}
for (const [TOPIC, skip] of [["c4-maths-ch05-t01", 1], ["c6-maths-ch07-t01", 2]]) describe(`item 15 + 18a at ${TOPIC}'s card: try-first, the go-ahead alone, then haan four times`, async () => {
  const w = await walkTo(TOPIC, skip);
  const turns = await w.play(["try", "haan", "haan", "haan", "haan"]);
  w.done();
  const reask = norm(fillFriend(reaskOf(w.script, w.P), "Riya"));
  test("the try-first is the go-ahead alone, no wait turn", () => { assert.equal(turns[0].text, "Haan, pehle tum try karo."); assert.equal(turns[0].lm.waitN, undefined); });
  test("wait one is the haan after it: a short ask or the invitation, never the question in full", () => {
    assert.equal(turns[1].lm.waitN, 1);
    assert.ok(endsOnShortAsk(w.script, turns[1].text) || turns[1].seams.at(-1) === "yourTurn", turns[1].text);
    assert.notEqual(atQuestionOf(w.script, turns[1].text), w.P, turns[1].text);
  });
  test("wait two the reask, wait three help ending on the question, wait four the cap (the key)", () => {
    assert.equal(turns[2].lm.waitN, 2); assert.ok(turns[2].text.endsWith(reask), turns[2].text);
    assert.equal(turns[3].lm.waitN, 3); assert.ok(turns[3].seams.includes("help"), turns[3].seams.join(">")); assert.equal(atQuestionOf(w.script, turns[3].text), w.P, turns[3].text);
    assert.equal(turns[4].lm.waitN, 4); assert.ok(turns[4].lm.heardCap && turns[4].lm.gave, turns[4].text);
  });
  test("the gated wait checks and tryFirstNotAlone read 0 on the walk's rows", () => {
    const ctx = { script: w.script };
    for (const k of ["waitNoQuestion", "waitSecondNotReask", "waitFourNotTold", "tryFirstNotAlone", "cardWholeAfterTryOrYes"]) {
      const got = w.rows.map((r, i) => (r.who === "teacher" ? PREDICATES[k]({ rows: w.rows }, r, i, ctx) : null)).filter(Boolean);
      assert.deepEqual(got, [], k);
    }
  });
  test("(what she says, for the notes)", () => { for (const t of turns) console.log(`[054h ${TOPIC}] waitN=${t.lm.waitN ?? "-"} | ${t.text}`); });
});

describe("item 18a: an acknowledgement straight after the go-ahead is wait one (offtopic c4-ch01-t02 42 in h/m15: \"hmm, achha\" got the step told)", async () => {
  const w = await walkTo("c4-maths-ch05-t01", 1);
  const LINES0 = { ...LINES };
  LINES.ack = ["hmm, achha", { outcome: "no_evidence" }];
  const turns = await w.play(["try", "ack", "haan"]);
  w.done();
  Object.assign(LINES, LINES0);
  test("the go-ahead alone; then wait one (the short ask), never the question in full, the key or help; recorded as said; then wait two", () => {
    assert.equal(turns[0].text, "Haan, pehle tum try karo.");
    assert.equal(turns[1].lm.waitN, 1); assert.ok(endsOnShortAsk(w.script, turns[1].text) || turns[1].seams.at(-1) === "yourTurn", turns[1].text);
    assert.ok(!turns[1].lm.gave && !turns[1].seams.includes("help"), turns[1].text);
    assert.equal(turns[1].lm.cell?.column, "other");
    assert.equal(w.rows.filter((r) => r.who === "child").at(-2).text, "hmm, achha");
    assert.equal(turns[2].lm.waitN, 2);
  });
  test("a line that answers after the go-ahead is graded, not a wait turn", async () => {
    const w2 = await walkTo("c4-maths-ch05-t01", 1);
    LINES.wrong = ["haan ji, 2", { outcome: "incorrect" }];
    const t2 = await w2.play(["try", "wrong"]);
    w2.done();
    assert.equal(t2[1].lm.waitN, undefined); assert.equal(t2[1].lm.cell?.column, "wrong"); assert.ok(!endsOnShortAsk(w2.script, t2[1].text), t2[1].text);
  });
});

// Item 16: a miss verdict naming the child's answer is never word for word her turn before's miss verdict (g/dry2 stuck c5-ch02-t01 40 and
// 42: "12 sahi nahi hai." twice, the child having said 12 twice) — there the plain miss form takes its place.
describe("item 16: the same miss sentence two turns running", async () => {
  const { notRightLead, FRAMES } = await import("../server/brain/say.js");
  const st = (texts) => ({ recent: texts.map((text) => ({ who: "teacher", text })), lastMove: { scriptBeat: { kind: "remediation" }, rendered: ["x"] } });
  test("with every echo form's words said lately, the naming verdict her turn before said is not said again: the plain miss form", () => {
    const her = ["12 se baat nahi bani. Ribbon par gaps aur chalk ke marks dono gino.", "Yeh theek nahi hai, phir dekho.", "12 sahi nahi hai. Do deewaron ke beech rassi socho."];
    const v = notRightLead("12", "hinglish", st(her));
    assert.notEqual(v, "12 sahi nahi hai.");
    assert.ok(FRAMES.notRight.hinglish.includes(v), v);
  });
  test("where it differs from her turn before's verdict, the verdict still names the answer (as built)", () => {
    assert.equal(notRightLead("12", "hinglish", st(["12 se baat nahi bani. Ribbon par gaps.", "Yeh theek nahi hai, phir dekho."])), "12 sahi nahi hai.");
    assert.match(notRightLead("12", "hinglish", st(["Kitne gaps hain?"])), /12/);
  });
});
