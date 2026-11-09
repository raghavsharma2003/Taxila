// dc-r7-script-walk-v6 (main's director8 hand judgement, three of four judges): R1 segment assembly (everything about the card
// just answered is one segment on THAT card's board; a close's why is only the card's own authored why; a worked close is said
// once; a bridge with no board points at nothing), R2 false keys (a number she says that nothing authored carries never ships),
// R3 requests as moves, R4 real returns and register, R5 render hygiene.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step, scriptWhyOf, splitLong } from "../server/director/state.js";
import { setScriptForTest, scriptCheckItem } from "../server/director/script.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
import { boardPartsOf, segmentsAt } from "../server/brain/propose.js";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const SC = JSON.parse(readFileSync(new URL("./fixtures/scripts/c6-s1-v2.json", import.meta.url), "utf8"));
const S1 = SC.skills[0];
const B = (n) => ({ template: "measured@1", params: { shape: "rect", unit: "cm", w: n, h: 2 } });
const ref = (beatId, n) => ({ scriptId: "x@2.1", skillId: "s1", beatId, kind: "check", board: B(n) });

describe("R1: segments from the assembled parts", () => {
  test("a graded-right verdict with its reason is one segment on the answered card's board; the beat starts after it", () => {
    const line = "Haan, sahi hai, kyunki chaaron bhujayein judi: 22 cm. Ab ek naya shape dekhte hain. Iska parimap kitna hai?";
    const move = { closeBeat: ref("c1", 9), scriptBeat: ref("c2", 5), cardBeat: ref("c2", 5) };
    const out = boardPartsOf(move, line, "Iska parimap kitna hai?", { prev: "Haan, sahi hai, kyunki chaaron bhujayein judi: 22 cm.", verdict: "Haan, sahi hai, kyunki chaaron bhujayein judi: 22 cm." });
    assert.deepEqual(out.boardRef, B(9), "the verdict and its reason are said over the card they answered");
    assert.equal(out.segments.length, 1);
    assert.equal(out.segments[0].atChar, line.indexOf("Ab ek naya"));
    assert.deepEqual(out.segments[0].boardRef, B(5));
  });

  test("a missed card's close is its own segment on its own board, never inside the verdict's", () => {
    const v = "Bilkul, 22 cm sahi hai.";
    const c = "Aur pehle wale sawaal ka jawab 20 cm tha.";
    const line = `${v} ${c} Ek triangle ki bhujayein 7 m, 9 m aur 12 m hain. Kitni lambi baad lagegi?`;
    const move = { closeBeat: ref("e3", 9), closed: { answer: "20 cm" }, closedBeat: ref("then:x", 6), scriptBeat: { ...ref("worked", 7), kind: "worked" } };
    const out = boardPartsOf(move, line, null, { prev: v, verdict: v, closed: c });
    assert.deepEqual(out.boardRef, B(9));
    assert.deepEqual(out.segments.map((x) => [x.atChar, x.boardRef.params.w]), [[line.indexOf("Aur pehle"), 6], [line.indexOf("Ek triangle"), 7]]);
  });

  test("a bridge with no board of its own is not a part (it stays on the board before it); with one it is its own segment", () => {
    const v = "Haan, sahi hai.", br = "Ab tak humne bhujaon se parimap nikala.";
    const line = `${v} ${br} Rectangle mein lambai do baar aati hai.`;
    const move = { closeBeat: ref("c2", 9), sayFirst: [br], scriptBeat: { ...ref("e1", 4), kind: "explain" } };
    const none = boardPartsOf(move, line, null, { prev: v, bridge: br });
    assert.deepEqual(none.segments.map((x) => [x.atChar, x.boardRef.params.w]), [[line.indexOf("Rectangle"), 4]]);
    const own = boardPartsOf({ ...move, bridgeBeat: { ...ref("bridge", 3), kind: "bridge" } }, line, null, { prev: v, bridge: br });
    // (director10: a bare 3-word verdict is no first page of its own; it is said over the bridge's board)
    assert.deepEqual(own.boardRef, B(3));
    assert.deepEqual(own.segments.map((x) => [x.atChar, x.boardRef.params.w]), [[line.indexOf("Rectangle"), 4]]);
  });

  test("without parts (Studio re-placing a line it replaced) the closure sentences place it as before", () => {
    const plan = [{ part: "close", boardRef: B(9), scriptBeat: {} }, { part: "body", boardRef: B(4), scriptBeat: {} }];
    // (a body of its own words: a bare 3-word tail is no page since v6.1 P1)
    const line = "Pichhle sawaal ka jawab 30 m tha. Ab naya sawaal: is shape ka parimap kitna hai?";
    assert.deepEqual(segmentsAt(plan, line, null).map((x) => x.atChar), [0, line.indexOf("Ab naya")]);
  });

  test("a close's why is only the card's own authored why: never the remediation's or the point's last sentence", () => {
    setScriptForTest(); setScriptForTest(K.topicId, SC);
    try {
      const c = scriptCheckItem(S1.skillId, S1.checks[0]);
      assert.equal(scriptWhyOf(K, c, "hinglish"), null, "no authored why: none is borrowed");
      const withWhy = scriptCheckItem(S1.skillId, { ...S1.checks[0], why: { hi: "kyunki har bhuja ek baar judti hai", en: "each side is added once" } });
      assert.equal(scriptWhyOf(K, withWhy, "hinglish"), "har bhuja ek baar judti hai");
      assert.equal(scriptWhyOf(K, withWhy, "english"), "each side is added once");
    } finally { setScriptForTest(); }
  });
});

describe("R1/R2/R5 in the lesson (c6 skill-1 v2 fixture)", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: [r.move.point, ...(r.move.mustSay ?? [])].filter(Boolean).join(" ") }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };
  const toCard = (L) => { for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan"); return L; };
  const say = (L, draft, extra = {}) => { replyDeps.chat = async () => ({ text: draft }); return textReply({ instructions: "x", state: { ...L.r.state, mode: "text", ...(extra.state ?? {}) }, kit: K, childText: extra.childText ?? "haan", verdict: extra.verdict, history: [], ui: L.r.ui, module: null }); };

  test("R5: a yes/no key is said as the right answer named, never '<nahi> tha' ('there was no answer')", async () => {
    const L = toCard(run());
    const out = await say(L, "Chalo aage badhte hain.", { state: { lastMove: { ...L.r.state.lastMove, gave: { answer: "nahi", why: "" } } } });
    // (v6.5 F1, main on director13: the card just given up is "is sawaal", the next card after it or not)
    assert.match(out.reply, /Is sawaal ka sahi jawab: nahi\./, out.reply);
    assert.doesNotMatch(out.reply, /jawab nahi tha/);
  });

  test("R1: a worked answer and the same card's close are said once", async () => {
    const L = toCard(run());
    const lm = { ...L.r.state.lastMove, workedDone: { answer: "28 m", why: "teeno bhujayein judi" }, closed: { answer: "28 m", why: "teeno bhujayein judi" } };
    const out = await say(L, "Bahut badhiya.", { state: { lastMove: lm } });
    assert.equal(out.reply.match(/28 m/g)?.length, 1, out.reply);
    assert.doesNotMatch(out.reply, /pehle wale sawaal/);
  });

  test("R1: everything about the card just answered comes first and is recorded as the first part", async () => {
    const L = toCard(run());
    const card = L.r.ui.ask.text;
    const out = await say(L, `Haan, sahi hai. ${card}`, { childText: "15 cm", verdict: "correct", state: { lastMove: { ...L.r.state.lastMove, closed: { answer: "12 cm" } } } });
    assert.ok(out.guard.parts?.prev && out.reply.startsWith(out.guard.parts.prev), JSON.stringify(out.guard.parts));
    assert.ok(out.reply.indexOf(out.guard.parts.closed) === out.guard.parts.prev.length + 1, out.reply);
  });

  test("R2: a verdict lead stating a number nothing authored carries (the worked answer, early) is replaced by code's verdict", async () => {
    const L = toCard(run());
    const card = L.r.ui.ask.text;
    const out = await say(L, `Yahan "7 cm" galat hai: isliye parimap 99 cm hai. ${card}`, { childText: "7 cm", verdict: "not_yet" });
    assert.doesNotMatch(out.reply, /99/, out.reply);
    assert.match(out.reply, /7 cm/, "code's verdict names their answer");
    assert.ok(out.guard.falseNumbers?.includes("99"));
  });

  test("R2: a sentence of hers with a stray number goes; a working shown from the card's numbers stays", async () => {
    const L = toCard(run());
    const card = L.r.ui.ask.text;
    const nums = (card.match(/\d+/g) ?? []).map(Number);
    const sum = `${nums[0]} + ${nums[1]} = ${nums[0] + nums[1]}.`;
    const out = await say(L, `Theek hai. Toh jawab 77 cm hoga. ${sum} ${card}`, { childText: "pata nahi" });
    assert.doesNotMatch(out.reply, /77 cm/, out.reply);
    assert.deepEqual(out.guard.falseNumbers, ["77"], "the shown working is not a stray number");
  });
});

import { readIntent } from "../server/conversation/lexicon.js";
import { missingPieces } from "../server/brain/say.js";
import { scriptWorkedStepSmaller, scriptWorkedStepLine } from "../server/director/script.js";
import { boardWords } from "../server/brain/board-words.js";

describe("R3: requests as moves", () => {
  test("'kya poochha, phir se bolo na' is a repeat (never a miss, never a give-up)", () => {
    for (const t of ["kya poochha, phir se bolo na", "phir se bolo na didi", "sawaal kya tha?", "ek baar phir se bolo"]) assert.equal(readIntent(t)?.type, "repeat", t);
    assert.equal(readIntent("3/4 hai, phir se bolo"), null, "an answer with it is still an answer");
  });

  test("a repeated miss on an adding card names exactly what the total left out", () => {
    const card = "Ek L-shape kamre ki 6 bhujayein hain: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?";
    assert.deepEqual(missingPieces(card, "23 m", "30 m"), [7]);
    assert.equal(missingPieces(card, "19 m", "30 m"), null, "8 + 3 or 4 + 7: not known which, so nothing is named");
    assert.deepEqual(missingPieces(card, "22 m", "30 m"), [8], "a unique piece is named");
    assert.equal(missingPieces(card, "35 m", "30 m"), null, "more than the key: not a left-out piece");
    assert.equal(missingPieces("Ek cake ke 4 tukde, 3 khaye.", "1/4", "3/4"), null, "not an adding card");
  });

  test("a worked step said smaller: the step and its result alone, fewer words; never the same words", () => {
    const st = S1.workedExample.steps[0];
    const small = scriptWorkedStepSmaller(st, "hinglish"), same = scriptWorkedStepLine(st, "hinglish");
    assert.notEqual(small, same);
    assert.ok(small.includes(String(st.result)), small);
    assert.doesNotMatch(small, /Dekho/, "v6.1: never 'Dekho' (it made the story read as the board)");
    assert.ok(small.split(/\s+/).length < same.split(/\s+/).length, "smaller: fewer words than the step");
  });

  test("the board's own words: what the params draw, never the card's key", () => {
    assert.equal(boardWords({ template: "fraction-parts@1", params: { parts: 4, shade: 1, whole: "circle" } }), "Screen par ek circle hai, 4 barabar hisson mein bata hua, 1 hissa rangin.");
    assert.equal(boardWords({ template: "compare@1", params: { left: { title: "Cake A" }, right: { title: "Cake B" } } }), "Screen par do khaane hain: Cake A aur Cake B.");
    assert.match(boardWords({ template: "fraction-line@1", params: { den: 6, from: 0, to: 1, marks: [{ num: 1, label: "1/6" }] } }, "english"), /from 0 to 1, cut into 6 equal gaps, with 1\/6 marked/);
    assert.equal(boardWords({ template: "measured@1", params: { shape: "rect", unit: "cm", w: 9, h: 2 } }, "hinglish", "22 cm"), "Screen par ek rectangle hai, 9 cm lamba aur 2 cm chauda.");
    assert.equal(boardWords({ template: "equal-groups@1", params: { groups: 3, each: 5 } }, "hinglish", "5"), "Screen par barabar group hain.", "the key is never said");
    assert.equal(boardWords({ auto: true }), null);
  });
});

describe("R3 in the lesson (c6 skill-1 v2 fixture)", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence"), said = null) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: said ?? [r.move.point, ...(r.move.mustSay ?? [])].filter(Boolean).join(" ") }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };
  const say = (L, draft, extra = {}) => { replyDeps.chat = async () => ({ text: draft }); return textReply({ instructions: "x", state: { ...L.r.state, mode: "text", ...(extra.state ?? {}) }, kit: K, childText: extra.childText ?? "haan", verdict: extra.verdict, history: [], ui: L.r.ui, module: null }); };

  test("'pata nahi' on an explain beat: the same beat, smaller, and never her last turn's words again", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const prevLine = `Dekho, parimap boundary ki poori lambai hai. ${S1.explain[0].point.hi} ${L.r.ui.ask.text}`;
    L.t("pata nahi", { ...cls("no_evidence"), flags: { dontKnow: true } }, prevLine);
    assert.equal(L.r.move.scriptBeat?.beatId, "e1", "the same beat");
    assert.equal(L.r.move.smaller, true);
    const out = await say(L, `Dekho, parimap boundary ki poori lambai hai. Ek ek bhuja ko gino. ${L.r.ui.ask.text}`, { childText: "pata nahi" });
    assert.doesNotMatch(out.reply, /parimap boundary ki poori lambai hai/, "her last turn's sentence is not said again: " + out.reply);
    assert.ok(!out.reply.includes(S1.explain[0].point.hi) || S1.explain[0].point.hi.split(/[.!?]/).filter(Boolean).length === 1, "not the whole point again");
  });

  test("'samajh nahi aaya' on a worked step: that step again smaller, never the next step", () => {
    const L = run();
    for (let i = 0; i < 30 && !/^worked:step1$/.test(L.r.move.scriptBeat?.beatId ?? ""); i++) {
      const c = L.r.state.activeItemId ? { ...cls("correct") } : cls("no_evidence");
      L.t(L.r.state.activeItemId ? (findKey(L) ?? "haan") : "haan", c);
    }
    assert.equal(L.r.move.scriptBeat?.beatId, "worked:step1", JSON.stringify(L.r.move.scriptBeat));
    L.t("samajh nahi aaya");
    assert.equal(L.r.move.scriptBeat?.beatId, "worked:step1", "the same step, not step 2");
    assert.equal(L.r.move.smaller, true);
    L.t("haan");
    assert.notEqual(L.r.move.scriptBeat?.beatId, "worked:step1", "then it goes on");
  });

  test("a probe answered gets one line that takes it up before the next beat", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const out = await say(L, `${L.r.ui.ask.text}`, { childText: "maine jod ke dekha", state: { lastMove: { ...L.r.state.lastMove, probeAck: true } } });
    assert.ok(out.guard.probeAck, JSON.stringify(out.guard));
    assert.match(out.reply, /^(?:Achha|Theek)/, out.reply);
  });

  test("a picture they asked for is described from the board sent; her words about another drawing go", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const board = { template: "measured@1", params: { shape: "triangle", unit: "cm", sides: [4, 5, 6] } };
    const lm = { ...L.r.state.lastMove, request: "visual", scriptBeat: { ...L.r.state.lastMove.scriptBeat, board } };
    const out = await say(L, `Screen par pizza dekho, 8 slice hain. Kitne slice bache? ${L.r.ui.ask.text}`, { childText: "picture dikhao", state: { lastMove: lm } });
    assert.doesNotMatch(out.reply, /pizza|slice/, out.reply);
    assert.ok(out.reply.includes("Screen par ek triangle hai, bhujayein 4 cm, 5 cm aur 6 cm."), out.reply);
  });
});
function findKey(L) { const id = L.r.state.activeItemId; if (!id) return null; const it = L.r.state.scriptCard; return it?.id === id ? it.answer : null; }

import { asideReturnLine } from "../server/director/state.js";
import { inHindiWords } from "../server/brain/register.js";

describe("R4: real returns and a register that changes", () => {
  test("v6.3 H2′ (retires the canned facts): a return line is built from their own words, said back to them; a question is named as theirs", () => {
    assert.equal(asideReturnLine("kal maine cricket khela, sixer maara", "cricket"), "kal tumne cricket khela, sixer maara: yeh sunke bahut achha laga.");
    assert.equal(asideReturnLine("mujhe cricket pasand hai", "cricket"), "tumhe cricket pasand hai: yeh sunke bahut achha laga.");
    assert.match(asideReturnLine("aapko virat pasand hai?", "Virat"), /^tumne mujhse Virat ke baare mein poocha tha/);
    assert.equal(asideReturnLine("maine 3 sixer maare", "cricket"), null, "no digits (said over whatever board is up)");
    assert.equal(asideReturnLine("", "cricket"), null);
    for (const x of ["kal maine cricket khela", "aapko virat pasand hai?"]) assert.doesNotMatch(asideReturnLine(x, "cricket"), /over mein chhe ball|cover drive|gyarah khiladi/);
  });

  test("Hindi asked for: her English words become Hindi; the card and the must-say words stay", () => {
    const card = "Cake ka kitna hissa khaya, fraction mein batao.";
    const out = inHindiWords(`Pizza ke 4 equal parts hain, total 4 pieces. ${card}`, { card });
    assert.equal(out, `Pizza ke 4 barabar hisse hain, kul 4 tukde. ${card}`);
    assert.equal(inHindiWords("Yeh fraction hai.", { keep: ["fraction"] }), "Yeh fraction hai.");
    assert.equal(inHindiWords("Perimeter nikalo."), "Parimap nikalo.");
  });
});

describe("R4 in the lesson (c6 skill-1 v2 fixture)", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: [r.move.point, ...(r.move.mustSay ?? [])].filter(Boolean).join(" ") }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };
  const say = (L, draft, extra = {}) => { replyDeps.chat = async () => ({ text: draft }); return textReply({ instructions: "x", state: { ...L.r.state, mode: "text", ...(extra.state ?? {}) }, kit: K, childText: extra.childText ?? "haan", verdict: extra.verdict, history: [], ui: L.r.ui, module: null }); };

  test("an aside parked while a card is live is returned to at the promised point — once that card is resolved — with a real line (v6.2 H2)", () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const card = L.r.state.activeItemId;
    L.t("aapko virat pasand hai?", { ...cls("no_evidence"), request: { type: "answer_q" } });
    assert.ok((L.r.state.later ?? []).some((e) => /virat/i.test(e.topic) && !e.servedAt), JSON.stringify(L.r.state.later));
    L.t("haan");
    if (L.r.state.activeItemId === card) assert.equal(L.r.move.returned, undefined, "never while the card it was parked on is live");
    for (let i = 0; i < 4 && !L.r.move.returned; i++) L.t(String(L.r.state.scriptCard?.answer ?? "haan"), cls("correct"));
    assert.match(L.r.move.returned?.topic ?? "", /virat/i, JSON.stringify(L.r.move));
    // (v6.4 H2″: no code line; the move carries their words for her one line)
    assert.match(L.r.move.returned?.said ?? "", /virat pasand/i);
  });

  test("a return of hers that is an analogy or puts words in their mouth goes; the real line is said", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const lm = { ...L.r.state.lastMove, returned: { topic: "Virat", share: true, said: "aapko virat pasand hai?" } };
    const out = await say(L, `Virat ke baare mein tumne kaha tha ki tumhe woh pasand hain. Virat mujhe bhi bahut pasand hain, unki batting kamaal ki hai. Virat ka cover drive boundary ke poore round jaisa hai. ${L.r.ui.ask.text}`, { state: { lastMove: lm } });
    assert.doesNotMatch(out.reply, /tumne kaha|jaisa hai/, out.reply);
    assert.match(out.reply, /Virat mujhe bhi bahut pasand hain/, out.reply);
  });

  test("after 'hindi mein batao' her later turns are visibly in Hindi words", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const out = await say(L, `Har side ko jodo, total perimeter milega. ${L.r.ui.ask.text}`, { state: { ctx: { ...L.r.state.ctx, lang: "hindi", langPinned: true } } });
    assert.match(out.reply, /bhuja|parimap|kul/i, out.reply);
    assert.doesNotMatch(out.reply.replace(L.r.ui.ask.text, ""), /\bside\b|\btotal\b|\bperimeter\b/i, out.reply);
  });
});

describe("R5: a turn too long for one is split, never cut", () => {
  const KEEP = {};
  // (the closing split is opt-in since v6.1, main's split policy B: these tests pin the opt-in path)
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; KEEP.c = process.env.TAXILA_R7_SPLIT_CLOSE; delete process.env.TAXILA_R7_SCRIPT; process.env.TAXILA_R7_SPLIT_CLOSE = "on"; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s;
    if (KEEP.c === undefined) delete process.env.TAXILA_R7_SPLIT_CLOSE; else process.env.TAXILA_R7_SPLIT_CLOSE = KEEP.c; });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };

  test("closures now (no card live, ending on 'shall we go on?'); the beat and its card whole on the next turn", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    // the e1 card's turn with a long close of an earlier card on it: over the cap together
    const long = "har bhuja ek ek baar judti hai aur koi bhuja chhootti nahi isliye poori boundary ki lambai milti hai jo parimap kehlati hai";
    const out0 = { ...L.r, state: structuredClone(L.r.state), move: { ...L.r.move, closed: { answer: "12 cm", why: long }, closeBeat: { scriptId: "x", beatId: "c0", kind: "check", board: { template: "measured@1", params: { shape: "rect", unit: "cm", w: 4, h: 2 } } } } };
    const split = splitLong(out0, { event: "turn", kit: K });
    assert.equal(split.move.splitClose, true, "a close + new teaching over the cap is split");
    assert.equal(split.ui.ask, undefined, "no card is live on the closing half");
    assert.equal(split.state.activeItemId, undefined);
    assert.equal(split.move.closed?.answer, "12 cm", "the closures ride on it");
    replyDeps.chat = async () => ({ text: "Bahut badhiya!" });
    const out = await textReply({ instructions: "x", state: { ...split.state, mode: "text" }, kit: K, childText: "haan", history: [], ui: split.ui, module: null });
    assert.match(out.reply, /pehle wale sawaal ka jawab 12 cm tha/, out.reply);
    assert.match(out.reply, /(?:Ab aage chalte hain|Chalo, ab aage|Ab agla hissa)\.$/, "closures end on a statement, never a question: " + out.reply);
    const held = split.state.splitHold;
    const r2 = step({ ...split.state, recent: [] }, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: 9e6 });
    assert.equal(r2.move.kind, held.move.kind, "the held beat comes next, unchanged");
    assert.deepEqual(r2.ui, held.ui);
    assert.equal(r2.state.activeItemId, held.activeItemId);
    assert.equal(r2.move.closed, undefined, "the closures are not said twice");
    assert.equal(r2.state.splitHold, undefined);
    // (a short close beside the same teaching is one turn)
    const short = splitLong({ ...L.r, state: structuredClone(L.r.state), move: { ...L.r.move, closed: { answer: "12 cm" } } }, { event: "turn", kit: K });
    assert.notEqual(short.move.splitClose, true);
  });

  test("a remediation's long say and its card: the say now ending on a check-in, the card on its own board next; 'samajh nahi aaya' keeps the card live", async () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    assert.equal(L.r.move.kind, "reteach");
    assert.equal(L.r.move.splitTeach, true, "a long remediation say with its card is split");
    assert.equal(L.r.ui.ask, undefined);
    replyDeps.chat = async () => ({ text: "Chalo." });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: K, childText: "7 cm", verdict: "not_yet", history: [], ui: L.r.ui, module: null });
    assert.match(out.reply, /\?$/, out.reply);
    const held = L.r.state.splitHold;
    L.t("haan");
    assert.equal(L.r.ui.ask?.itemId, held.ui.ask.itemId, "the card next, on its own board");
    assert.equal(L.r.move.scriptBeat?.beatId, held.move.scriptBeat?.beatId);
    assert.match(L.r.state.activeItemId ?? "", /:then:/);
    // (and "samajh nahi aaya" to the check-in: the card stays live and the walk answers it)
    const L2 = run();
    for (let i = 0; i < 4 && L2.r.move.scriptBeat?.beatId !== "e1"; i++) L2.t("haan");
    L2.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    L2.t("samajh nahi aaya");
    assert.match(L2.r.state.activeItemId ?? "", /:then:/, "the follow-up card is live again");
    assert.equal(L2.r.state.splitHold, undefined);
  });

  test("a picture asked over 'shall we go on?' is answered as a picture with the card live, never by the held beat (director9 c5-t02)", () => {
    const L = run();
    for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan");
    const long = "har bhuja ek ek baar judti hai aur koi bhuja chhootti nahi isliye poori boundary ki lambai milti hai jo parimap kehlati hai";
    const split = splitLong({ ...L.r, state: structuredClone(L.r.state), move: { ...L.r.move, closed: { answer: "12 cm", why: long } } }, { event: "turn", kit: K });
    assert.equal(split.move.splitClose, true);
    const r = step({ ...split.state, recent: [] }, { event: "turn", kit: K, cls: { ...cls("no_evidence"), request: { type: "visual", kind: "picture", whole: true } }, text: "picture dikhao", now: 9e6 });
    assert.equal(r.move.request, "visual", JSON.stringify(r.move).slice(0, 200));
    assert.equal(r.state.splitHold, undefined);
    assert.equal(r.state.activeItemId, split.state.splitHold.activeItemId, "the card is live again");
  });

  test("a stop said over the closing half lets the held half go", () => {
    const s0 = { splitHold: { move: { kind: "explain" }, ui: { ask: { itemId: "x" } }, activeItemId: "x" } };
    const L = run();
    const st = { ...L.r.state, ...s0 };
    const r = step(st, { event: "turn", kit: K, cls: { ...cls("no_evidence"), flags: { distress: true } }, text: "x", now: 1e6 });
    assert.equal(r.state.splitHold, undefined);
    assert.notEqual(r.move, s0.splitHold.move);
  });
});

import { notRightLead } from "../server/brain/say.js";

describe("R5: render hygiene", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const run = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { t, get r() { return r; } };
  };
  const toCard = () => { const L = run(); for (let i = 0; i < 4 && L.r.move.scriptBeat?.beatId !== "e1"; i++) L.t("haan"); return L; };
  const say = (L, draft, extra = {}) => { replyDeps.chat = async () => ({ text: draft }); return textReply({ instructions: "x", state: { ...L.r.state, mode: "text", ...(extra.state ?? {}) }, kit: K, childText: extra.childText ?? "haan", verdict: extra.verdict, history: [], ui: L.r.ui, module: null }); };

  test("their English phrase is never echoed in the not-right line; a number or one word is", () => {
    assert.equal(notRightLead("they are equal"), "Nahi, yeh jawab nahi hai.");
    assert.equal(notRightLead("23 m"), "23 m sahi nahi hai.");
    assert.equal(notRightLead("Yes"), "Nahi, yeh jawab nahi hai.", "director9: a word of theirs is never said back");
  });

  test("one verdict sentence: a second 'Haan, …' loses its verdict words; a bare restatement goes; (v6.3 R7) a reason of hers goes too", async () => {
    const L = toCard();
    const card = L.r.ui.ask.text;
    const out = await say(L, `Haan, sahi hai. Haan, 15 cm. ${card}`, { childText: "15 cm", verdict: "correct", state: { lastGraded: { key: "15 cm", accept: [], prompt: "" } } });
    assert.equal(out.reply.match(/\bHaan\b/g)?.length, 1, out.reply);
    // (on a practice card her own lines are the body; an explain beat says its authored point instead)
    const practice = { ...L.r.state.lastMove, kind: "practice", point: undefined, mustSay: [] };
    const out2 = await say(L, `Haan, sahi hai. Haan, 15 cm sahi hai—har bhuja ek hi baar gini gayi. ${card}`, { childText: "15 cm", verdict: "correct", state: { lastMove: practice, lastGraded: { key: "15 cm", accept: [], prompt: "" } } });
    assert.equal(out2.reply.match(/\bHaan\b/g)?.length, 1, out2.reply);
    // (v6.3 R7, main on director11 c4 steady T48: on a scripted card her own reason is model-written teaching; the why is only the
    // card's authored one, and this card has none)
    assert.doesNotMatch(out2.reply, /ek hi baar gini gayi/, out2.reply);
    assert.ok(out2.reply.includes(card), out2.reply);
  });

  test("a sentence is said once, and the card is the one question", async () => {
    const L = toCard();
    const card = L.r.ui.ask.text;
    const out = await say(L, `Yeh triangle hai. Yeh triangle hai. Tumhari pehli choice kya hai? ${card}`);
    assert.equal(out.reply.match(/Yeh triangle hai/g)?.length ?? 0, out.reply.includes("Yeh triangle hai") ? 1 : 0, out.reply);
    assert.equal(out.reply.match(/[?？]/g)?.length, (card.match(/[?？]/g) ?? []).length, out.reply);
  });
});

describe("R2: an invented draft is replaced, not repaired", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  test("no rewrite call; none of the draft's sentences ship; the verdict is code's", async () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 4 && r.move.scriptBeat?.beatId !== "e1"; i++) r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: (r.state.turn + 1) * 20_000 });
    let calls = 0;
    replyDeps.chat = async () => { calls++; return { text: `Galat, kyunki 4 aur 5 aur 6 aur 913 ka jod. ${r.ui.ask.text}` }; };
    const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText: "7 cm", verdict: "not_yet", history: [], ui: r.ui, module: null });
    assert.equal(calls, 1, "the draft only: no rewrite");
    assert.doesNotMatch(out.reply, /913/, out.reply);
    assert.match(out.reply, /^7 cm sahi nahi hai\./, out.reply);
  });
});

describe("v6 (c5-t01 judge, Studio's alternate view)", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const toCard = () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 4 && r.move.scriptBeat?.beatId !== "e1"; i++) r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: (r.state.turn + 1) * 20_000 });
    return r;
  };
  const say = (r, draft, extra = {}) => { replyDeps.chat = async () => ({ text: draft }); return textReply({ instructions: "x", state: { ...r.state, mode: "text", ...(extra.state ?? {}) }, kit: K, childText: extra.childText ?? "haan", verdict: extra.verdict, history: [], ui: r.ui, module: null }); };

  test("no reason sentence contradicts code's verdict (steady T65: 'Haan, sahi hai. 4/6 nahi… mila diya')", async () => {
    const r = toCard();
    const practice = { ...r.state.lastMove, kind: "practice", point: undefined, mustSay: [] };
    const out = await say(r, `Haan, sahi hai. 15 cm nahi—tumne bhujayein aur kone mila diye. ${r.ui.ask.text}`, { childText: "15 cm", verdict: "correct", state: { lastMove: practice, lastGraded: { key: "15 cm", accept: [], prompt: "" } } });
    assert.doesNotMatch(out.reply, /15 cm nahi|mila diye/, out.reply);
    assert.match(out.reply, /^Haan, sahi hai\./);
    const out2 = await say(r, `7 cm sahi nahi hai. Haan, bilkul theek socha. ${r.ui.ask.text}`, { childText: "7 cm", verdict: "not_yet", state: { lastMove: practice } });
    assert.doesNotMatch(out2.reply, /bilkul theek/, out2.reply);
  });

  test("a picture ask is always acknowledged and keeps the card; on Studio's alternate view she names the new view of the same numbers (v6.5 P3: and says no card over it)", async () => {
    const r = toCard();
    const card = r.ui.ask.text;
    const none = await say(r, `Theek hai, chalo isi sawaal par wapas aate hain. ${card}`, { childText: "drawing karke samjhao", state: { lastMove: { ...r.state.lastMove, request: "visual", visual: "diagram", scriptBeat: { ...r.state.lastMove.scriptBeat, board: { auto: true } } } } });
    assert.match(none.reply, /^Chalo, ise picture mein dekhte hain\./, none.reply);
    assert.ok(none.reply.endsWith(card), "the card stays");
    const board = { template: "fraction-line@1", params: { den: 6, from: 0, to: 1, marks: [{ num: 1, label: "1/6" }, { num: 2, label: "1/3" }] } };
    const alt = await say(r, `Theek hai. ${card}`, { childText: "picture dikhao", state: { lastMove: { ...r.state.lastMove, request: "visual", visual: "diagram", altView: { view: "parts" }, scriptBeat: { ...r.state.lastMove.scriptBeat, board } } } });
    assert.match(alt.reply, /Dekho, yahi 1\/6 aur 1\/3 ab patti par\./, alt.reply);
    // (v6.5 P3: the second view is its own page: no card over it; it stays live for the next turn)
    assert.ok(!alt.reply.includes(card), alt.reply);
  });
});

describe("v6 after director9: the split covers what it missed", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  test("a repair move carrying closures over the cap is split (stuck c6 T65, 128 words; opt-in since v6.1 policy B)", (t) => {
    const was = process.env.TAXILA_R7_SPLIT_CLOSE; process.env.TAXILA_R7_SPLIT_CLOSE = "on";
    t.after(() => { if (was === undefined) delete process.env.TAXILA_R7_SPLIT_CLOSE; else process.env.TAXILA_R7_SPLIT_CLOSE = was; });
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 4 && r.move.scriptBeat?.beatId !== "e1"; i++) r = step({ ...r.state, recent: [] }, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: (r.state.turn + 1) * 20_000 });
    const long = "har bhuja ek ek baar judti hai aur koi bhuja chhootti nahi isliye poori boundary ki lambai milti hai jo parimap kehlati hai";
    const out = splitLong({ ...r, state: structuredClone(r.state), move: { ...r.move, kind: "repair", closed: { answer: "12 cm", why: long } } }, { event: "turn", kit: K });
    assert.equal(out.move.splitClose, true);
    const again = splitLong(out, { event: "turn", kit: K });
    assert.equal(again.state.splitHold, out.state.splitHold, "the closing half itself is never split again");
  });
});

import { CONTENT_FILTER } from "../server/azure.js";

describe("v6.1: a filtered turn in a script keeps its authored words", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  test("a non-harm filter on her draft: the beat's point and the card (director9 c5-t02 offtopic T7 spoke the card alone)", async () => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 4 && r.move.scriptBeat?.beatId !== "e1"; i++) r = step({ ...r.state, recent: [] }, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: (r.state.turn + 1) * 20_000 });
    replyDeps.chat = async () => { const e = new Error("filtered"); e.code = CONTENT_FILTER; e.filterCats = ["jailbreak"]; throw e; };
    const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText: "kal maine cricket khela", history: [], ui: r.ui, module: null });
    assert.ok(out.reply.includes(S1.explain[0].point.hi), out.reply);
    assert.ok(out.reply.endsWith(r.ui.ask.text), out.reply);
  });
});
