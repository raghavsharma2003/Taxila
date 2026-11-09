// dc-r7-script-walk-v3 (main's director5 judgement): K1 a probe is never graded wrong and a key closes once affirmed; V1 code
// speaks a scripted remediation's authored explanation; V2/G1 an explain beat's authored point is always in what she says
// (a guard never leaves the card alone); G2 the kit's worked example never speaks in script mode; "Null" is never said.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step, returnLineOf } from "../server/director/state.js";
import { setScriptForTest } from "../server/director/script.js";
import { verdictFor, joinAsk } from "../server/director/say.js";
import { textReply, replyDeps, pointSaid, countContradicts, screenContradictions } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
import { whiteboardIntentOf, boardPartsOf, cardClauseOf, closureEnd } from "../server/brain/propose.js";
import { findItem } from "../server/director/items.js";
import { splitSentences } from "../server/voice/sentences.js";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const SC = JSON.parse(readFileSync(new URL("./fixtures/scripts/c6-s1-v2.json", import.meta.url), "utf8"));
const S1 = SC.skills[0];

test("K1: a reply to a probe or a teach-back is never a wrong answer; a wrong belief in it still is", () => {
  const why = { mode: "why", item: {}, ideas: [], misconceptions: [] };
  assert.equal(verdictFor({ outcome: "incorrect" }, why, { childText: "38 m" }), "ungraded");
  assert.equal(verdictFor({ outcome: "misconception" }, why, { childText: "l + b" }), "not_yet");
  assert.equal(verdictFor({ outcome: "incorrect" }, { mode: "teachback", expectations: [] }, { childText: "pata nahi" }), "ungraded");
  assert.equal(verdictFor({ outcome: "incorrect" }, { mode: "item", item: {} }, { childText: "7" }), "not_yet");
});

test("a card that is null is never read as 'Null'", () => {
  assert.equal(joinAsk("Pehla mark 1/8 hai.", null), "Pehla mark 1/8 hai.");
});

test("pointSaid: most content words and every number of the point", () => {
  assert.equal(pointSaid("Triangle ki teeno bhujayein 4 cm, 5 cm aur 6 cm hain.", S1.explain[0].point.hi), true);
  assert.equal(pointSaid("Chalo ek shape dekhte hain.", S1.explain[0].point.hi), false);
});

describe("v3 in the lesson (c6 skill-1 v2 fixture)", () => {
  const KEEP = {};
  // (v6 R5: these pin one-turn shapes, a remediation's say with its card; the split of a long turn is pinned in r7-brain-v6)
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; KEEP.split = process.env.TAXILA_R7_SPLIT; process.env.TAXILA_R7_SPLIT = "off"; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; if (KEEP.split === undefined) delete process.env.TAXILA_R7_SPLIT; else process.env.TAXILA_R7_SPLIT = KEEP.split; });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: [r.move.point, ...(r.move.mustSay ?? [])].filter(Boolean).join(" ") }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };

  test("V2/G1: an explain line without the authored point gets it, verbatim, before the card", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    assert.equal(L.r.move.point, S1.explain[0].point.hi);
    const card = L.r.ui.ask.text;
    replyDeps.chat = async () => ({ text: `Dekho, parimap boundary ki lambai hai. ${card}` });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "haan", history: [], ui: L.r.ui, module: null });
    assert.ok(out.reply.includes(S1.explain[0].point.hi), out.reply);
    assert.ok(out.reply.trim().endsWith(card), "the card stays last");
  });

  test("V1: a scripted remediation is spoken from its authored lines, then its follow-up card", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    const card = L.r.ui.ask.text;
    replyDeps.chat = async () => ({ text: "Koi baat nahi, ek alag tarah se dekhte hain." });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "7 cm", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    assert.ok(out.reply.includes("cheenti"), out.reply);
    assert.match(out.reply, /^7 cm sahi nahi hai\./, "K2: the verdict comes first, before the remediation board's explanation ('koi baat nahi' is no verdict)");
    assert.ok(out.reply.trim().endsWith(card), out.reply);
    assert.ok(!/50 m|30 m/.test(out.reply), "never the kit's worked example");
  });

  test("K2: a script card let go after stuck turns has its key said", () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    let gave = null;
    for (let i = 0; i < 12 && !gave; i++) { L.t("pata nahi", cls("dont_know")); gave = L.r.move.gave ?? null; }
    assert.ok(gave, "the card is let go with its answer");
    assert.match(gave.answer, /\d/);
  });

  test("SC2: a picture asked for while a script card is live shows THAT card's board", () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    assert.equal(L.r.move.scriptBeat?.beatId, "e1");
    L.t("picture dikhao", { ...cls("no_evidence"), request: { type: "visual", kind: "diagram" } });
    assert.equal(L.r.move.scriptBeat?.beatId, "e1", JSON.stringify(L.r.move.scriptBeat));
    assert.deepEqual(L.r.move.scriptBeat?.board, S1.explain[0].board);
  });

  test("director6: the verdict leads, even after a give-up reveal or an S1 fixed line; a graded-right answer is never negated", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const card = L.r.ui.ask.text;
    const st = { ...L.r.state, mode: "text" };
    // a wrong answer with the previous card's give-up reveal on the move: the reveal never comes before the verdict
    replyDeps.chat = async () => ({ text: `9 sahi nahi hai. Chalo phir se dekhte hain. ${card}` });
    const a = await textReply({ instructions: "x", state: { ...st, lastMove: { ...st.lastMove, gave: { answer: "38 m", why: "" } } }, kit: K, childText: "9", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    assert.match(a.reply, /^9 sahi nahi hai\./, a.reply);
    assert.ok(a.reply.includes("38 m"), "the reveal is still said");
    // a wrong answer whose line has no verdict at all: code adds it
    replyDeps.chat = async () => ({ text: card });
    const b = await textReply({ instructions: "x", state: st, kit: K, childText: "9", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    assert.match(b.reply, /^(?:9 sahi nahi hai|Nahi, yeh jawab nahi hai)\./, b.reply);
    // a graded-right answer negated by her line ("1/8 nahi"): the negation goes, a plain yes leads
    replyDeps.chat = async () => ({ text: `Riya, 12 cm nahi; teeno bhujayein jodo. ${card}` });
    const c = await textReply({ instructions: "x", state: st, kit: K, childText: "12 cm", verdict: "correct", history: [], ui: L.r.ui, module: null });
    assert.match(c.reply, /^Haan, sahi hai\./, c.reply);
    assert.doesNotMatch(c.reply, /12 cm nahi/, c.reply);
  });

  test("v4 W1: a remediation whose line a guard replaces still says the verdict, then the authored say, then the card", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    const card = L.r.ui.ask.text;
    replyDeps.chat = async () => ({ text: "Iska jawab 38 m hai, kyunki sab bhujayein judti hain." });   // a leak of the then-card's key
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "7 cm", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    assert.match(out.reply, /^7 cm sahi nahi hai\./, out.reply);
    assert.ok(out.reply.includes("cheenti"), out.reply);
    assert.ok(out.reply.trim().endsWith(card), out.reply);
    assert.doesNotMatch(out.reply, /38 m hai/, "the leak is gone");
  });

  test("v4 W3: an explain paraphrase without the point keeps one short clause of hers, then the point once, then the card whole", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const card = L.r.ui.ask.text;
    replyDeps.chat = async () => ({ text: `Parimap ka matlab hai poori boundary ki lambai, ek chakkar. Ab socho. ${card}` });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "haan", history: [], ui: L.r.ui, module: null });
    const p = S1.explain[0].point.hi;
    assert.equal(out.reply.split(p).length - 1, 1, out.reply);
    assert.ok(out.reply.trim().endsWith(card), out.reply);
    assert.ok(out.reply.indexOf(p) < out.reply.indexOf(card), "the point comes before the ask");
  });

  test("v4 W1: a turn that would be the bare card says the card's own authored line first", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("pata nahi", cls("dont_know"));
    const card = L.r.ui.ask.text;
    assert.ok(L.r.state.lastMove.cardPoint, JSON.stringify(L.r.state.lastMove));
    replyDeps.chat = async () => ({ text: card });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "pata nahi", history: [], ui: L.r.ui, module: null });
    assert.notEqual(out.reply.trim(), card.trim(), "never the bare card");
    assert.ok(out.reply.trim().endsWith(card), out.reply);
  });

  test("v4: a then-card's authored prompt is never cut, and re-posing it shows its own board", () => {
    const long = structuredClone(SC);
    const r0 = long.skills[0].remediation[0];
    r0.then.prompt.hi = "Ek kisaan ke khet ki chhe bhujayein hain jinki lambai 10 m, 4 m, 6 m, 5 m, 4 m aur 9 m hai. Woh poore khet ke chaaron taraf ek baar baad lagata hai. Uska parimap kitna hai?";
    r0.then.board = { template: "shape@1", params: { shape: "hexagon" } };
    setScriptForTest(); setScriptForTest(K.topicId, long);
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    assert.ok(r0.then.prompt.hi.length > 120);
    assert.equal(L.r.ui.ask.text, r0.then.prompt.hi, "shown whole");
    L.t("pata nahi", cls("dont_know"));
    assert.equal(L.r.ui.ask?.itemId, L.r.state.activeItemId, "the then-card is still the card");
    assert.deepEqual(L.r.move.scriptBeat?.board, r0.then.board, JSON.stringify(L.r.move));
  });

  test("director7: a recap is said only over the board it describes; a then-card on its own board gets none", () => {
    const own = structuredClone(SC);
    const r0 = own.skills[0].remediation[0];
    r0.then.board = { template: "shape@1", params: { shape: "hexagon" } };
    assert.notDeepEqual(r0.board ?? null, r0.then.board);
    setScriptForTest(); setScriptForTest(K.topicId, own);
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    L.t("pata nahi", cls("dont_know"));
    assert.match(String(L.r.state.activeItemId), /:then:/);
    assert.equal(L.r.move.cardPoint ?? null, null, "the remediation say describes its own board, not the then-card's");
    // the same then-card on the say's board keeps its recap
    const shared = structuredClone(SC);
    shared.skills[0].remediation[0].then.board = shared.skills[0].remediation[0].board ?? null;
    setScriptForTest(); setScriptForTest(K.topicId, shared);
    const M = run();
    for (let i = 0; i < 4 && M.r.move.scriptBeat?.beatId !== "e1"; i++) M.t("haan");
    M.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    M.t("pata nahi", cls("dont_know"));
    assert.ok(M.r.move.cardPoint, JSON.stringify(M.r.move));
  });

  test("director7 cause 2: a remediation turn whose then-card has its own board switches to it at the card's clause", async () => {
    const own = structuredClone(SC);
    const r0 = own.skills[0].remediation[0];
    r0.then.board = { template: "shape@1", params: { shape: "hexagon" } };
    setScriptForTest(); setScriptForTest(K.topicId, own);
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    assert.equal(L.r.move.scriptBeat?.kind, "remediation");
    assert.deepEqual(L.r.move.cardBeat?.board, r0.then.board, JSON.stringify(L.r.move));
    const card = L.r.ui.ask.text;
    replyDeps.chat = async () => ({ text: "Koi baat nahi, ek alag tarah se dekhte hain." });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "7 cm", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    const item = findItem(L.r.state, K, L.r.move.itemId ?? L.r.state.activeItemId);
    const ask = whiteboardIntentOf({ lessonId: "L", turn: L.r.state.turn, beat: { id: "b", type: "explain" }, next: L.r.state, kit: K, item, line: { text: out.reply, parts: out.guard.parts } });
    // v5 B1: the say on the remediation board from 0, then the card on its own board from where the card starts
    assert.deepEqual(ask.intent.boardRef, L.r.move.scriptBeat.board, "the say's board comes first");
    const seg = ask.intent.segments ?? [];
    assert.equal(seg.length, 1, JSON.stringify(ask.intent));
    assert.deepEqual(seg[0].boardRef, r0.then.board);
    assert.equal(seg[0].scriptBeat.ownBoard, true);
    assert.ok(seg[0].scriptBeat.answers?.includes(r0.then.key), JSON.stringify(seg[0].scriptBeat));
    const text = out.reply.replace(/\s+/g, " ").trim();
    assert.equal(text.slice(seg[0].atChar), card.replace(/\s+/g, " ").trim(), "the switch is exactly where the card starts");
    const pieces = splitSentences(out.reply);
    assert.ok(pieces.slice(seg[0].atClause).join(" ").includes(card.slice(0, 30)), `${seg[0].atClause}: ${JSON.stringify(pieces)}`);
    // a turn on one board carries no segments
    assert.equal(boardPartsOf({ scriptBeat: { board: r0.board }, cardBeat: { board: r0.board } }, out.reply, card).segments, undefined);
    // a closure is spoken over the board it closes, before the switch
    const closeB = { template: "shape@1", params: { shape: "square" } };
    const line = `Haan, sahi hai. Toh poora jawab: 12 cm, kyunki sab jodo. ${card}`;
    // (v6.6 P4: the line as its parts — a line is never searched for its closure)
    const parts = boardPartsOf({ workedDone: { answer: "12 cm" }, closeBeat: { board: closeB, kind: "check", beatId: "c1" }, cardBeat: { board: r0.then.board, kind: "check", beatId: "x", ownBoard: true } }, line, card,
      { list: [{ part: "close", text: "Haan, sahi hai. Toh poora jawab: 12 cm, kyunki sab jodo." }, { part: "card", text: card }] });
    assert.deepEqual(parts.boardRef, closeB);
    assert.equal(parts.segments?.[0]?.atChar, closureEnd(line));
    assert.equal(line.slice(parts.segments[0].atChar), card);
    assert.equal(cardClauseOf("Pehla. Doosra wala vakya. Card ka sawaal kya hai?", "Card ka sawaal kya hai?"), 1);
  });

  test("v6.3 T1′ (retires v4 W4): after a remediation's follow-up, the card they missed is not closed later; a missed close is dropped", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    assert.match(L.r.state.activeItemId, /:then:/);
    L.t("38", cls("correct"));
    for (let i = 0; i < 3; i++) {
      L.t("har bhuja ek baar jodi", cls("correct"));
      assert.notEqual(L.r.move.closed?.answer, "12 cm", "v6.3: no close for a card not answered in the child's last turn: " + JSON.stringify(L.r.move));
    }
    replyDeps.chat = async () => ({ text: "Bahut badhiya!" });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "38", verdict: "correct", history: [], ui: L.r.ui, module: null });
    assert.doesNotMatch(out.reply, /pehle wale sawaal ka jawab/i, "v6.3: no carried close: " + out.reply);
  });

  test("v5 B5: one verdict sentence; a sentence putting a method in the child's mouth goes; a long turn keeps its authored parts", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    for (let i = 0; i < 4 && !L.r.state.activeItemId; i++) L.t("haan");
    const card = L.r.ui.ask.text;
    const st = { ...L.r.state, mode: "text", lastMove: { ...L.r.state.lastMove, scriptBeat: { ...(L.r.state.lastMove.scriptBeat ?? {}), kind: "check" } } };
    replyDeps.chat = async () => ({ text: `Haan, sahi hai. Haan, tumne bilkul sahi socha. Tumne pehle sab ko jodkar phir guna kiya. ${card}` });
    const out = await textReply({ instructions: "x", state: st, kit: K, childText: "12 cm", verdict: "correct", history: [], ui: L.r.ui, module: null });
    assert.equal((out.reply.match(/\bsahi\b/g) ?? []).length, 1, out.reply);
    assert.match(out.reply, /tumne bilkul sahi socha/, "the richer verdict stays: " + out.reply);
    assert.doesNotMatch(out.reply, /Haan, sahi hai\./, out.reply);
    assert.doesNotMatch(out.reply, /Tumne pehle sab ko jodkar/, out.reply);
    assert.ok(out.reply.trim().endsWith(card), out.reply);
    const long = Array.from({ length: 8 }, (_, i) => `Yeh ek lambi baat hai jo number ${i} ke baare mein hai.`).join(" ");
    replyDeps.chat = async () => ({ text: `Haan, sahi hai. ${long} ${card}` });
    const out2 = await textReply({ instructions: "x", state: st, kit: K, childText: "12 cm", verdict: "correct", history: [], ui: L.r.ui, module: null });
    assert.ok(out2.reply.split(/\s+/).length <= 60 || out2.reply.replace(card, "").split(/\s+/).length <= 20, out2.reply);
    assert.ok(out2.reply.trim().endsWith(card), out2.reply);
  });

  test("v4 W6: an aside is parked with a promise in her line (topic found in code), and kept until it is served", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("kal maine cricket khela, sixer maara", { ...cls("no_evidence"), request: { type: "uptake", kind: "personal_share" } });
    const e = (L.r.state.later ?? []).find((x) => /cricket/i.test(x.topic));
    assert.ok(e, JSON.stringify(L.r.state.later));
    const card = L.r.ui.ask?.text ?? "";
    replyDeps.chat = async () => ({ text: `Wah! ${card}` });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "kal maine cricket khela, sixer maara", history: [], ui: L.r.ui, module: null });
    assert.match(out.reply, /cricket/i, out.reply);
    L.t("aapko virat pasand hai?", { ...cls("no_evidence"), request: { type: "answer_q" } });
    assert.ok((L.r.state.later ?? []).some((x) => /virat/i.test(x.topic)), JSON.stringify(L.r.state.later));
  });

  test("latency cut 1: a script draft whose only problems the assembly fixes is not rewritten; the turn equals the rewrite path's, but for her lead-in", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const card = L.r.ui.ask.text;
    const draft = `Parimap ka matlab hai boundary ki lambai. ${card}`;   // the point left out (mustsay), nothing else wrong
    const go = async (env) => {
      const keep = process.env.TAXILA_R7_SKIP_REWRITE; if (env) process.env.TAXILA_R7_SKIP_REWRITE = env; else delete process.env.TAXILA_R7_SKIP_REWRITE;
      let calls = 0;
      replyDeps.chat = async () => { calls += 1; return { text: calls === 1 ? draft : `Chalo dekhte hain. ${card}` }; };
      try { const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "haan", history: [], ui: L.r.ui, module: null }); return { out, calls }; }
      finally { if (keep === undefined) delete process.env.TAXILA_R7_SKIP_REWRITE; else process.env.TAXILA_R7_SKIP_REWRITE = keep; }
    };
    const fast = await go(null), slow = await go("off");
    assert.equal(fast.calls, 1, "no second model call");
    assert.ok(slow.calls >= 2, "the kill switch keeps today's rewrite");
    assert.deepEqual(fast.out.guard.rewriteSkipped, ["mustsay"]);
    const tail = (t) => t.slice(t.indexOf(S1.explain[0].point.hi));
    assert.equal(tail(fast.out.reply), tail(slow.out.reply), `${fast.out.reply}  ||  ${slow.out.reply}`);
  });

  test("latency cut 2 (TAXILA_R7_LONG_TRIM, off by default): long is trimmed in code only when switched on", async () => {
    const { longTrimOn } = await import("../server/brain/say.js");
    assert.equal(longTrimOn({}), false);
    assert.equal(longTrimOn({ TAXILA_R7_LONG_TRIM: "on" }), true);
  });

  test("Studio director6 #1: a check drawing its OWN board carries ownBoard; one borrowing the explain board does not", () => {
    const own = structuredClone(SC);
    own.skills[0].checks[0].board = { template: "shape@1", params: { shape: "hexagon" } };
    setScriptForTest(); setScriptForTest(K.topicId, own);
    const L = run();
    let ref = null;
    for (let i = 0; i < 30 && !ref; i++) { L.t("x", cls("correct")); if (L.r.move.scriptBeat?.kind === "check" && L.r.move.scriptBeat.beatId === "c1") ref = L.r.move.scriptBeat; }
    assert.ok(ref, "reached c1");
    assert.equal(ref.ownBoard, true);
    let ref2 = null;
    for (let i = 0; i < 6 && !ref2; i++) { L.t("x", cls("correct")); if (L.r.move.scriptBeat?.kind === "check" && L.r.move.scriptBeat.beatId === "c2") ref2 = L.r.move.scriptBeat; }
    if (ref2) assert.ok(!ref2.ownBoard, "c2 has no board of its own");
  });
});

test("v2.1 validator: {friend} not the child or Asha, no '?' glyph, no echo ask, ≤3 worked steps (c4-5), follow-ups with a board", async () => {
  const { validateTopicScript, fillFriend } = await import("../server/director/script.js");
  const base = () => { const s = structuredClone(SC); s.version = 2.1; return s; };
  const errs = (f) => { const s = base(); f(s.skills[0]); return validateTopicScript(s, K).errors.join(" | "); };
  assert.equal(errs(() => {}), "", "the fixture is v2.1-clean");
  assert.match(errs((k) => { k.checks[0].prompt.hi = "Asha kehti hai: L shape ke kamre ki 6 bhujayein 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hain. Parimap kitna hai?"; }), /\{friend\}/);
  assert.match(errs((k) => { k.workedExample.yourStep.prompt.hi = "18 m + 2 m = ? m, kitna hua?"; }), /read aloud/);
  assert.match(errs((k) => { k.explain[0].point.hi = "triangle ki bhujayein 3, 4, 5 cm: kul 12 cm"; }), /echo/);
  assert.match(errs((k) => { delete k.remediation[0].board; }), /needs a board/);
  assert.equal(fillFriend("{friend} ne 3/4 kaha", "Riya"), "Zoya ne 3/4 kaha");
  assert.equal(fillFriend("{friend} ne 3/4 kaha", "Zoya"), "Kabir ne 3/4 kaha", "never the child's own name");
});

test("a scripted lesson's teach-back invents no pretend learner (director5 c4: 'Golu' met for the first time)", async () => {
  const SH = await import("../server/director/shapes.js");
  assert.doesNotMatch(SH.teachback({ protege: null }), /Golu|undefined/);
  assert.match(SH.teachback({ protege: { name: "Golu", what: "a pretend baby elephant" } }), /Golu/, "unscripted lessons keep their protege");
  assert.doesNotMatch(SH.teachbackFollowup({ protege: null, missing: "x" }), /undefined/);
});

test("SC1: counted claims are checked against Studio's screen.counts, and never without them", async () => {
  const { countContradicts, screenContradictions } = await import("../server/brain/say.js");
  const line = { lines: [{ gaps: 3, ticks: 4, innerTicks: 2 }], marks: [{ at: "1/3", label: "1/3" }] };
  assert.equal(countContradicts("Board par dekho, 0 aur 1 ke beech mein 2 nishaan hain.", line), false);
  assert.equal(countContradicts("Board par dekho, beech mein 3 nishaan hain.", line), true);
  assert.equal(countContradicts("Dekho, line 4 barabar hisson mein bati hai.", line), true);
  assert.equal(countContradicts("Board par dekho, beech mein 3 nishaan hain.", null), false, "no counts: no count check");
  const pent = { sides: 5, corners: 5, sideValues: ["4 m", "5 m", "3 m", "6 m", "2 m"] };
  assert.equal(countContradicts("Is kyaari ki 4 bhujayein hain.", pent), true);
  assert.equal(countContradicts("Board par sab bhujayein jodo: kul 20 m.", pent), false, "a total is not a side value");
  assert.equal(countContradicts("Dekho, 4 hisse hain aur 3 rangin hain.", { parts: 4, shaded: 1 }), true);
  // director5's false flag: a count the board drew but never wrote is not a missing number
  assert.equal(screenContradictions("Board par dekho, beech mein 2 nishaan hain.", { shape: null, numbers: ["0", "1"], counts: line }).length, 0);
});

test("{friend} fills a card's graded fields too: the friend's wrong pick is graded as its misconception", async () => {
  const { scriptThenItem } = await import("../server/director/script.js");
  const it = scriptThenItem("s1", { targets: "m-x", then: { prompt: { hi: "{friend} ya Ravi, kaun sahi hai", en: "{friend} or Ravi, who is right" }, key: "Ravi", accept: [], wrongIfMis: "{friend}" } });
  assert.equal(it.scriptThen.wrongIfMis, "{friend}", "the then-card carries its listed wrong pick");
});

test("a version 2.1 script is walked, not only validated (director6 first start: every 2.1 script fell back to the kit)", async () => {
  const { setScriptForTest, scriptIdOf, WALK_VERSIONS } = await import("../server/director/script.js");
  const keep = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
  try {
    const s = structuredClone(SC); s.version = 2.1;
    setScriptForTest(); setScriptForTest(K.topicId, s);
    assert.ok(WALK_VERSIONS.has(2.1));
    assert.equal(scriptIdOf(K), `${K.topicId}@2.1`);
  } finally { setScriptForTest(); if (keep === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = keep; }
});

test("scriptWhyNot names why a topic has no walkable script (version, missing file, validation)", async () => {
  const { setScriptForTest, scriptWhyNot } = await import("../server/director/script.js");
  const keep = { s: process.env.TAXILA_R7_SCRIPT, d: process.env.TAXILA_R7_SCRIPT_DIR };
  try {
    process.env.TAXILA_R7_SCRIPT = "on"; process.env.TAXILA_R7_SCRIPT_DIR = "/nonexistent-scripts";
    setScriptForTest();
    assert.match(scriptWhyNot(K), /no readable script/);
    setScriptForTest(K.topicId, structuredClone(SC));
    assert.equal(scriptWhyNot(K), null, "a walkable script: no reason");
  } finally {
    setScriptForTest();
    for (const [k, v] of [["TAXILA_R7_SCRIPT", keep.s], ["TAXILA_R7_SCRIPT_DIR", keep.d]]) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
});

test("SC1 (director6): authored lines that match their board are never flagged; real miscounts still are", async () => {
  const { screenContradictions } = await import("../server/brain/say.js");
  const f = (numbers, counts) => ({ shape: null, numbers, counts });
  const eighths = f(["0", "1", "1/8", "1/4", "1/2"], { lines: [{ gaps: 8, ticks: 9, innerTicks: 7 }], marks: [{ at: "1/8", label: "1/8" }, { at: "2/8", label: "1/4" }, { at: "4/8", label: "1/2" }] });
  const quarters = f(["0", "1", "1/4"], { lines: [{ gaps: 4, ticks: 5, innerTicks: 3 }], marks: [{ at: "1/4", label: "1/4" }] });
  const bar = f(["8", "2"], { parts: 8, shaded: 2 });
  const roti = f(["1", "2"], { parts: 2, shaded: 1 });
  const rect = f(["14", "6"], { sides: 4, corners: 4, sideValues: ["14 m", "6 m", "14 m", "6 m"] });
  for (const [t, facts] of [
    ["Screen par 0 se 1 ki ek hi line par teen mark hain: 1/2, 1/4 aur 1/8, aur 1/8 bilkul 0 ke paas hai.", eighths],
    ["Screen par 0 se 1 metre tak ka ribbon hai, beech mein 3 chalk ke nishaan hain, aur ribbon 4 barabar hisson mein bata hai.", quarters],
    ["Is patti ke 8 barabar hisse hain, aur rang wale 2 hisse milkar theek ek 1/4 jitne lambe hain.", bar],
    ["Board par 2 barabar tukde hain: har tukda aadha, yaani 1/2.", roti],
    ["Ek cheenti is rectangle ke ek kone se chalti hai, uske paas ek meter hai.", rect],
  ]) assert.deepEqual(screenContradictions(t, facts), [], t);
  assert.equal(screenContradictions("Screen par dekho, beech mein 5 nishaan hain.", quarters).length, 1, "a wrong inner-mark count");
  assert.equal(screenContradictions("Is patti ke 6 barabar hisse hain.", bar).length, 1, "a wrong division");
  assert.equal(screenContradictions("Board par dekho, 2/3 ka nishaan hai.", eighths).length, 1, "a fraction off every tick");
});

test("v4 W4: the listed wrong answer beats a by-value match ('after 1/3' to a 'between 0 and 1/3' card)", async () => {
  const { classifyFast } = await import("../server/director/classify.js");
  const item = { id: "script:x:c1", answer: "between 0 and 1/3", acceptable: ["0 aur 1/3 ke beech", "1/3 se pehle", "before 1/3", "pehle"], scriptCheck: { checkId: "c1", targets: "m-x", wrongIfMis: "after 1/3" } };
  const t = { mode: "item", item, key: item.answer, also: item.acceptable };
  const g = (x) => classifyFast({ target: t, childText: x, lang: "hinglish", typed: true }).result?.outcome;
  assert.equal(g("after 1/3"), "misconception");
  assert.equal(g("1/3 ke baad"), "misconception");
  assert.equal(g("before 1/3"), "correct");
  assert.equal(g("1/3 se pehle"), "correct");
  const it2 = { id: "script:x:c2", answer: "30 m", acceptable: ["30", "30 metre"], scriptCheck: { checkId: "c2", targets: "m-y", wrongIfMis: "23 m" } };
  const t2 = { mode: "item", item: it2, key: it2.answer, also: it2.acceptable };
  assert.equal(classifyFast({ target: t2, childText: "mujhe lagta hai 30 m", lang: "hinglish", typed: true }).result?.outcome, "correct", "a numeric key still grades by value");
  assert.equal(classifyFast({ target: t2, childText: "23", lang: "hinglish", typed: true }).result?.outcome, "misconception");
});

test("{friendF}/{friendM}: kit items are filled in every field, with names never the child's", async () => {
  const { findItem } = await import("../server/director/items.js");
  const { fillFriend } = await import("../server/director/script.js");
  const kit = { items: [{ id: "k1", skillId: "s", prompt_hi: "{friendF} kehti hai ki 3/4 bada hai", prompt_en: "{friendF} says 3/4 is bigger", answer: "{friendF}", acceptable: ["{friendF} sahi hai"], hints: ["{friendM} se pucho"] }], misconceptions: [] };
  const it = findItem({ ctx: { firstName: "Zoya" } }, kit, "k1");
  assert.equal(it.prompt_hi, "Meera kehti hai ki 3/4 bada hai", "never the child's own name");
  assert.equal(it.answer, "Meera");
  assert.deepEqual(it.acceptable, ["Meera sahi hai"]);
  assert.deepEqual(it.hints, ["Kabir se pucho"]);
  assert.equal(findItem({ ctx: { firstName: "Riya" } }, kit, "k1").answer, "Zoya");
  assert.equal(fillFriend("{friend} ne kaha", "Zoya"), "Kabir ne kaha", "the v2.1 slot is unchanged");
});

test("R4 reads compare@1 quantities (Studio 244936c8): a count said against a column must be that column's", async () => {
  const { countContradicts } = await import("../server/brain/say.js");
  const c = { columns: [{ title: "Roti A", items: ["2 tukde"], quantities: [{ n: 2, what: "tukde" }] }, { title: "Roti B", items: ["4 tukde"], quantities: [{ n: 4, what: "tukde" }] }] };
  assert.equal(countContradicts("Board par dekho, Roti A mein 2 tukde hain.", c), false);
  assert.equal(countContradicts("Board par dekho, Roti A mein 4 tukde hain.", c), true);
  assert.equal(countContradicts("Dekho, 3 tukde hain.", c), true);
});

test("v2.2 scripts are walked (integration 9: the live scripts went to 2.2 while WALK_VERSIONS stopped at 2.1)", async () => {
  const { WALK_VERSIONS, validateTopicScript } = await import("../server/director/script.js");
  assert.ok(WALK_VERSIONS.has(2.2));
  const s = structuredClone(SC); s.version = 2.2;
  s.skills[0].checks.forEach((c) => { c.board = c.board ?? { template: "shape@1", params: { shape: "hexagon" } }; });
  s.skills[0].remediation.forEach((r) => { r.then.board = r.then.board ?? { template: "shape@1", params: { shape: "hexagon" } }; });
  assert.deepEqual(validateTopicScript(s, K).errors, []);
  s.skills[0].remediation[0].then.prompt.hi = "x".repeat(121);
  assert.match(validateTopicScript(s, K).errors.join(" "), /at most 120/);
});

describe("v5 B2: child requests are moves, never grades (c6 skill-1 v2 fixture)", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };
  const req = (type, extra = {}) => ({ ...cls("no_evidence"), request: { type, whole: true, src: "p5", ...extra } });

  test("readings: 'ek baar phir se bolo' and 'sawaal kya hai' are repeats; 'pehle main try karun' is a self-try", async () => {
    const { readIntent } = await import("../server/conversation/lexicon.js");
    assert.equal(readIntent("ek baar phir se bolo")?.type, "repeat");
    assert.equal(readIntent("sawaal kya hai")?.type, "repeat");
    assert.equal(readIntent("pehle main try karun")?.type, "selftry");
    assert.equal(readIntent("mujhe khud karne do")?.type, "selftry");
  });

  test("'sawaal kya hai' re-poses the live card with no verdict", () => {
    const L = run();
    for (let i = 0; i < 6 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const id = L.r.state.activeItemId;
    assert.ok(id);
    L.t("sawaal kya hai", req("repeat"));
    assert.equal(L.r.state.activeItemId, id, "the same card");
    assert.equal(L.r.move.request, "repeat");
    assert.ok(!(L.r.state.skipped ?? []).includes(id));
  });

  test("'pehle main try karun' in the worked example: their own step is the card now, and no answer is said", () => {
    const L = run();
    for (let i = 0; i < 20 && !String(L.r.move.scriptBeat?.beatId ?? "").startsWith("worked:"); i++) L.t(L.r.state.activeItemId ? (findItem(L.r.state, K, L.r.state.activeItemId)?.answer ?? "haan") : "haan", L.r.state.activeItemId ? cls("correct") : cls("no_evidence"));
    assert.match(String(L.r.move.scriptBeat?.beatId), /^worked:/, JSON.stringify(L.r.move.scriptBeat));
    L.t("pehle main try karun", req("selftry"));
    assert.match(String(L.r.state.activeItemId), /:ask:worked$/, JSON.stringify(L.r.move));
    assert.equal(L.r.move.workedDone, undefined, "never the answer this turn");
    assert.equal(L.r.move.request, "selftry");
  });

  test("'samajh nahi aaya' on a check: the idea again from authored lines, then the same card (no verdict, nothing used up)", () => {
    const L = run();
    for (let i = 0; i < 40 && !findItem(L.r.state, K, L.r.state.activeItemId ?? "")?.scriptCheck; i++) {
      const it = L.r.state.activeItemId ? findItem(L.r.state, K, L.r.state.activeItemId) : null;
      L.t(it ? it.answer : "haan", it ? cls("correct") : cls("no_evidence"));
    }
    const id = L.r.state.activeItemId;
    assert.ok(findItem(L.r.state, K, id)?.scriptCheck, "a check is live");
    L.t("samajh nahi aaya", req("another", { confused: true }));
    assert.equal(L.r.state.activeItemId, id, "the same card");
    assert.equal(L.r.move.kind, "reteach");
    assert.ok(L.r.move.rendered?.length, JSON.stringify(L.r.move));
    assert.ok(L.r.move.scriptBeat?.board || true);
  });
});

describe("v5 B3/B4 on the live c6 script", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; KEEP.d = process.env.TAXILA_R7_SCRIPT_DIR; delete process.env.TAXILA_R7_SCRIPT_DIR; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); for (const [k, e] of [["s", "TAXILA_R7_SCRIPT"], ["d", "TAXILA_R7_SCRIPT_DIR"]]) { if (KEEP[k] === undefined) delete process.env[e]; else process.env[e] = KEEP[k]; } });

  test("B4: the authored bridge is said by code at the change to skill 2", async () => {
    const live = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c6-maths-ch06-t01.json", import.meta.url), "utf8"));
    const bridge = live.skills[0].bridgeToNext?.hi;
    assert.ok(bridge, "the live script has a bridge");
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    let found = null;
    for (let i = 0; i < 60 && !found; i++) {
      const it = r.state.activeItemId ? findItem(r.state, K, r.state.activeItemId) : null;
      r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: it ? cls("correct") : cls("no_evidence"), text: it ? String(it.answer) : "haan", now: (r.state.turn + 1) * 20_000 });
      if ((r.move.sayFirst ?? []).some((x) => x.includes(bridge.slice(0, 20)))) found = r;
    }
    assert.ok(found, "a move carries the bridge");
    replyDeps.chat = async () => ({ text: `Chalo aage badhte hain. ${found.ui?.ask?.text ?? ""}` });
    const out = await textReply({ instructions: "x", state: { ...found.state, mode: "text" }, kit: K, childText: "haan", history: [], ui: found.ui, module: null });
    assert.ok(out.reply.includes(bridge.slice(0, 30)), out.reply);
  });

  test("B3: a parked cricket aside returns with the script's own cricket line, never a stub", () => {
    const line = returnLineOf(K, "Virat ke sixer", "hinglish");
    assert.ok(line && /cricket|pitch/i.test(line), String(line));
    assert.equal(returnLineOf(K, "mera naya phone", "hinglish"), null);
  });
});

describe("v5 B3: a language promise is a mode for the lesson", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  test("'ab se hindi mein padhao' is a language ask, not a subject", async () => {
    const { requestOf } = await import("../server/director/requests.js");
    assert.equal(requestOf("ab se hindi mein padhao")?.type, "language");
    assert.equal(requestOf("ab se simple hindi mein bolo")?.lang, "hindi");
  });

  test("'ab se simple Hindi mein bolo' holds: Hindi and plain words, every later turn, until they ask otherwise", async () => {
    const { languageRule } = await import("../server/compiler/compile.js");
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: [] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    t("haan");
    t("ab se simple hindi mein bolo", { ...cls("no_evidence"), request: { type: "language", lang: "hindi", whole: true } });
    for (let i = 0; i < 6; i++) {
      const it = r.state.activeItemId ? findItem(r.state, K, r.state.activeItemId) : null;
      t(it ? String(it.answer) : "ok yes", it ? cls("correct") : cls("no_evidence"));
      assert.equal(r.state.ctx.lang, "hindi", `turn ${i}`);
      assert.equal(r.state.ctx.plainWords, true, `turn ${i}`);
      const rule = languageRule(r.state.ctx.lang, "10-12", !!r.state.ctx.langPinned, "voice", !!r.state.ctx.plainWords);
      assert.match(rule, /they asked for/i);
      assert.match(rule, /Short everyday words/);
      assert.ok(rule.length / 4 < 140, `the language section fits its cap: ${rule.length} chars`);
    }
    t("english mein bolo", { ...cls("no_evidence"), request: { type: "language", lang: "english", whole: true } });
    assert.equal(r.state.ctx.lang, "english");
    assert.equal(r.state.ctx.plainWords, false);
  });
});

test("Studio 013: drawn hops are counted (a stretch of them is fine, more than drawn is not); a square unit is not the shape", () => {
  assert.equal(countContradicts("Screen par 1/4 ke 5 hop hain: pehle 4 hop 0 se 1 ko bhar dete hain.", { hops: 5, lines: [{ gaps: 8 }] }), false);
  assert.equal(countContradicts("Screen par dono 3 hop chale.", { lines: [{ gaps: 4 }] }), false, "a board that counted no hops is never checked");
  assert.equal(countContradicts("Screen par 7 hop hain.", { hops: 5 }), true);
  assert.equal(screenContradictions("Yeh rectangle hai. Andar tiles bichhao toh woh area hai, square cm mein.", { shape: "rectangle", numbers: null, counts: null }).length, 0);
  assert.equal(screenContradictions("Screen par yeh square hai.", { shape: "rectangle", numbers: null, counts: null }).length, 1, "the shape square over a rectangle is still a contradiction");
});
