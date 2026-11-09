// dc-r7-script-walk-v6-1 R7/R8 (main's director9 judgement): no model-written teaching in script mode; "samajh nahi aaya" /
// "pata nahi" get the authored `simpler` (format 2.3). Replays go through the real turn path (tests/fixtures/replay.mjs).
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps, RULE_SAID } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest, scriptWorkedStepSmaller, SCRIPT_VERSIONS } from "../server/director/script.js";
import { initLessonState, step, notYes } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
import { altViewOfRow } from "../server/brain/propose.js";

// integration 12 (main): the hooks below set TAXILA_R7_SCRIPT and clear the script cache; at top level they wrapped EVERY
// test in a single-process run (--experimental-test-isolation=none) and turned kit-path suites to script mode (32 failures).
// Scoped to this file's describe, as tests/fixtures/kit-path.mjs asks.
describe("r7-brain-v61.test.mjs", () => {

  const RUN = "2026-11-06-director9";
  const runScript = (T) => runScriptOf(RUN, T);
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const sayAt = async (kit, plan, draft, state = plan.state) => { replyDeps.chat = async () => ({ text: draft }); return textReply({ instructions: instructionsFor(state, kit), state, kit, childText: plan.child, history: [], ui: plan.p.r.ui, module: null }); };

  const T1 = "c5-maths-ch02-t01";
  const T27_DRAFT = "10 barabar gaps mein, chhota denominator wala fraction pehle aata hai, aur bada denominator wala chhota gap hota hai. Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?";

  // (director9's offtopic c5-t01 rows were replayed here; since v6.2 that lesson takes another path from T11 — the then-card's own
  // simpler after "mujhe nahi pata" — so the same cases are walked on the run's script instead)
  const toE1 = () => { const L = walkOf(T1); for (let i = 0; i < 8 && !/:ask:e1$/.test(String(L.r.state.activeItemId ?? "")); i++) L.t("haan"); return L; };
  const sayL = (L, draft, childText = "samajh nahi aaya") => { replyDeps.chat = async () => ({ text: draft }); return textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: L.K, childText, history: [], ui: L.r.ui, module: null }); };

  test("R7 (director9 c5-t01 offtopic T27): 'samajh nahi aaya' on an explain beat never gets her own 'smaller' lines (the misconception as a rule), only authored words", async () => {
    setScriptForTest(T1, runScript(T1));
    const L = toE1();
    L.t("samajh nahi aaya", { ...cls("no_evidence"), flags: { dontKnow: true } });
    assert.equal(L.r.state.lastMove?.smaller, true, JSON.stringify({ kind: L.r.move.kind, beat: L.r.move.scriptBeat?.beatId }));
    const out = await sayL(L, T27_DRAFT);
    assert.doesNotMatch(out.reply, /chhota denominator wala fraction pehle aata hai/, out.reply);
    assert.equal(out.guard.smaller, "point");
    assert.ok(out.reply.startsWith(L.r.state.lastMove.point.split(/(?<=\.)\s/)[0]), out.reply);
  });

  test("R7/R8 (format 2.3): an explain beat's authored simpler is what 'samajh nahi aaya' gets", async () => {
    const sc = runScript(T1);
    const simplerOf = (id) => ({ hi: `Ek roti ko barabar tukdon mein kaato, ${id} wala tukda dekho. Jitne zyada tukde, utna chhota har tukda.`, en: `Cut a roti into equal pieces and look at piece ${id}. More pieces, smaller each.` });
    for (const b of sc.skills[0].explain) b.simpler = simplerOf(b.id);
    setScriptForTest(T1, { ...sc, version: 2.3 });
    const L = toE1();
    L.t("samajh nahi aaya", { ...cls("no_evidence"), flags: { dontKnow: true } });
    const beat = L.r.state.lastMove?.scriptBeat?.beatId;
    assert.equal(L.r.state.lastMove?.smaller, true, `smaller on ${beat}`);
    assert.equal(L.r.state.lastMove?.simpler, simplerOf(beat).hi);
    const out = await sayL(L, T27_DRAFT);
    assert.ok(out.reply.startsWith(simplerOf(beat).hi), out.reply);
    assert.equal(out.guard.smaller, "authored");
    assert.ok(SCRIPT_VERSIONS.includes(2.3));
  });

  test("R8 (format 2.3): 'pata nahi' on a live scripted card gets the card's authored simpler, never a model hint", async () => {
    const sc = runScript(T1);
    const ask = sc.skills[0].explain.find((b) => b.id === "e1").ask;
    ask.simpler = { hi: "Line ke 0 aur 1 ke beech gaps gino, marks nahi.", en: "Count the gaps between 0 and 1, not the marks." };
    setScriptForTest(T1, { ...sc, version: 2.3 });
    const { kit, last } = await replay(RUN, "steady", T1, 11);
    assert.equal(last.child, "pata nahi");
    assert.equal(last.p.r.move.kind, "hint");
    assert.equal(last.state.lastMove?.simpler, ask.simpler.hi);
    const out = await sayAt(kit, last, "Riya, 1/3 ka matlab hai 3 barabar hisse, aur pehla hissa 1/3 hota hai. Ab batao.");
    assert.match(out.reply, /^Line ke 0 aur 1 ke beech gaps gino, marks nahi\./, out.reply);
    assert.doesNotMatch(out.reply, /1\/3 ka matlab/);
  });

  test("R7: a right answer's reason is the card's authored why; her own reason goes", async () => {
    setScriptForTest(T1, runScript(T1));
    const { kit, last } = await replay(RUN, "steady", T1, 21);
    const out = await sayAt(kit, last, "Haan, sahi hai, kyunki chhote denominator ka gap bada hota hai aur 1/8 sabse pehle aata hai. Taiyaar ho?");
    assert.match(out.reply, /^Haan, sahi hai, kyunki sadak 8 barabar hisson mein hai/, out.reply);
    assert.doesNotMatch(out.reply, /chhote denominator/);
    assert.equal(out.guard.rightWhy, "authored");
  });

  test("R7: a sentence of hers that states the live card's listed wrong answer as true goes; a rule of hers in a scripted turn goes", async () => {
    setScriptForTest(T1, runScript(T1));
    const L = toE1(); // e1's card is live (wrongIfMis "near 3")
    const card = L.r.ui.ask.text;
    const out = await sayL(L, `Socho, 1/3 near 3 hai. Sadak ke hisse hamesha barabar hote hain. ${card}`, "haan");
    assert.doesNotMatch(out.reply, /1\/3 near 3 hai/, out.reply);
    assert.doesNotMatch(out.reply, /hamesha barabar hote hain/, out.reply);
    assert.ok(out.reply.endsWith(card.trim()), "the card stays");
    assert.ok(RULE_SAID.test("Cheenti har kinaare se do baar guzarti hai.") && !RULE_SAID.test("Chalo, ek baar aur dekhte hain."));
  });

  test("R7 (format 2.3): a worked step said smaller is its authored simpler when there is one", () => {
    assert.equal(scriptWorkedStepSmaller({ do: { hi: "8 aur 3 jodo", en: "add 8 and 3" }, result: "11", simpler: { hi: "Pehle 8 lo, phir 3 aage gino", en: "Take 8, count 3 on" } }), "Pehle 8 lo, phir 3 aage gino.");
    assert.equal(scriptWorkedStepSmaller({ do: { hi: "8 aur 3 jodo", en: "add 8 and 3" }, result: "11" }), "Bas yeh ek kadam: 8 aur 3 jodo, aur milta hai 11.");
  });

  const T6 = "c6-maths-ch06-t01";
  test("R8 replay director9 c6 steering T21: 'pehle main try karun?' never lets the live card go with its answer", async () => {
    setScriptForTest(T6, runScript(T6));
    const { last } = await replay(RUN, "steering", T6, 21);
    assert.equal(last.child, "pehle main try karun?");
    assert.equal(last.state.lastMove?.gave, undefined, JSON.stringify(last.state.lastMove?.gave));
    assert.ok(last.state.activeItemId, "a card is live");
  });

  test("R8 replay director9 c4 stuck T23: the third 'kis cheez ka jawab dun?' re-poses the card, never its answer", async () => {
    const T4 = "c4-maths-ch05-t01";
    setScriptForTest(T4, runScript(T4));
    const { plans } = await replay(RUN, "stuck", T4, 23);
    const asks = plans.filter((p) => /kis cheez|sawaal kya hai|phir se bolo/.test(p.child));
    assert.ok(asks.length >= 3);
    for (const p of asks) assert.equal(p.state.lastMove?.gave, undefined, `T${p.row}: ${JSON.stringify(p.state.lastMove?.gave)}`);
  });

  test("R8 (director9 c6 stuck T23): a probe answered is acknowledged on the old board; the next beat's opening is never the acknowledgement", async () => {
    setScriptForTest(T6, runScript(T6));
    const { kit, last } = await replay(RUN, "stuck", T6, 23);
    const st = { ...last.state, lastMove: { ...last.state.lastMove, probeAck: true } };
    const card = last.p.r.ui.ask?.text ?? "";
    const out = await sayAt(kit, { ...last, child: "mujhe laga aisa hi hoga" }, `Is aayat ke kinaare par ek baar dhaaga lagana hai. ${card}`, st);
    assert.ok(out.guard.probeAck);
    assert.ok(out.guard.parts?.prev, JSON.stringify(out.guard.parts));
    assert.doesNotMatch(out.guard.parts.prev, /dhaaga/, "e3's line is not the acknowledgement");
    assert.doesNotMatch(out.guard.parts.prev, /[?？]/, "no question in the acknowledgement's slot");
  });

  const walkOf = (T) => {
    const K = kitFromFile(getTopic(T));
    let r = step(initLessonState({ topicId: T, kit: K, ctx: { ...CTX, classLevel: 5, lang: "hinglish" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); return r; };
    return { K, t, get r() { return r; } };
  };

  test("R9: a worked example's steps end on at most one check-in; 'nahi' to it is the same step again, smaller", async () => {
    setScriptForTest(T1, runScript(T1));
    const L = walkOf(T1);
    const answer = () => { const id = L.r.state.activeItemId; const it = id && L.r.state.scriptCard?.id === id ? L.r.state.scriptCard : null; return it ? String(it.answer) : "haan"; };
    for (let i = 0; i < 40 && !/^worked:step/.test(String(L.r.move.scriptBeat?.beatId ?? "")); i++) L.t(answer(), L.r.state.activeItemId ? cls("correct") : cls("no_evidence"));
    assert.match(String(L.r.move.scriptBeat?.beatId), /^worked:step1$/, "the worked example's first step");
    assert.equal(L.r.move.checkinOk, true, "the first step of the beat may check in");
    const step1 = L.r.move.rendered?.[0];
    L.t("nahi");
    assert.equal(L.r.move.scriptBeat?.beatId, "worked:step1", "a 'nahi' to the check-in is acted on: the same step");
    assert.equal(L.r.move.smaller, true);
    assert.notEqual(L.r.move.rendered?.[0], step1, "said smaller");
    assert.ok(!L.r.move.checkinOk, "the beat's one check-in is spent");
    L.t("haan");
    assert.ok(!L.r.move.checkinOk, "no second check-in in the same worked example");
    // her tail on a step with no check-in left is a statement
    const out = await (async () => { replyDeps.chat = async () => ({ text: "Chalo." }); return textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: L.K, childText: "haan", history: [], ui: L.r.ui, module: null }); })();
    if (!L.r.state.activeItemId) assert.doesNotMatch(out.reply, /[?？]\s*$/, out.reply);
    assert.ok(notYes("nahi samjha") && notYes("no") && !notYes("haan") && !notYes("haan, samajh aaya"));
  });

  test("R10 replay director9 c5-t01 offtopic T7: 'kal maine cricket khela, sixer maara' (no request read) is parked, her analogy goes, it is returned to", async () => {
    setScriptForTest(T1, runScript(T1));
    const { kit, rows, plans } = await replay(RUN, "offtopic", T1, 9);
    const p7 = plans.find((p) => p.row === 7);
    assert.deepEqual((p7.state.later ?? []).map((l) => l.topic), ["cricket"], "parked");
    const out = await sayAt(kit, p7, rows[6].text); // the run's own line: "Sixer ke baad ball boundary ke paar—wah, cricket mein fractions bhi …"
    assert.doesNotMatch(out.reply, /cricket mein fractions/, out.reply);
    assert.match(out.reply, /cricket/i, "a promise about it");
    // (v6.3 H2′ retires "the next turn": it is returned to once the card it was promised after is closed, never while it is live)
    const e = (p7.state.later ?? []).find((l) => l.topic === "cricket");
    assert.ok(e.onItem, "the promised card is recorded: " + JSON.stringify(e));
    const { plans: all } = await replay(RUN, "offtopic", T1, 1e9);
    const r = all.find((p) => p.state.lastMove?.returned?.topic === "cricket");
    assert.ok(r, "returned to");
    assert.notEqual(r.state.activeItemId, e.onItem, "after the promised card is closed");
    // (v6.4 H2″: her line answers their words, which the move carries)
    assert.match(r.state.lastMove.returned.said ?? "", /cricket/i, "their words carried");
  });

  test("R10: in the Hindi mode a scripted card is shown and read in Hindi words", async () => {
    setScriptForTest(T1, runScript(T1));
    const L = walkOf(T1);
    for (let i = 0; i < 4 && !L.r.state.activeItemId; i++) L.t("haan");
    const lang = { ...cls("no_evidence"), request: { type: "language", lang: "hindi" } };
    L.t("Hindi mein bolo", lang);
    assert.equal(L.r.state.ctx.lang, "hindi");
    L.t("haan");
    const card = L.r.ui?.ask?.text ?? "";
    assert.ok(card, "a card is up");
    assert.doesNotMatch(card, /\b(?:fraction|equal|parts?)\b/i, card);
    // (a word of the card's own key or accept forms stays: "isi line par" is how they answer it)
    const { inHindiWords } = await import("../server/brain/register.js");
    assert.equal(inHindiWords("Kitne equal parts hain? isi line par", { keep: ["on this line", "isi line par"] }), "Kitne barabar hisse hain? isi line par");
  });

  test("R11: a worked step is labelled as its own step; a card let go with no new card is 'this question'; a not-right verdict is code's; no stray Devanagari", async () => {
    setScriptForTest(T1, runScript(T1));
    const L = walkOf(T1);
    const answer = () => { const id = L.r.state.activeItemId; const it = id && L.r.state.scriptCard?.id === id ? L.r.state.scriptCard : null; return it ? String(it.answer) : "haan"; };
    for (let i = 0; i < 40 && L.r.move.scriptBeat?.beatId !== "worked:step2"; i++) L.t(answer(), L.r.state.activeItemId ? cls("correct") : cls("no_evidence"));
    assert.equal(L.r.move.scriptBeat?.beatId, "worked:step2");
    replyDeps.chat = async () => ({ text: "Pehla kadam dekho. हिंदी में: 3 और 1 जोड़ो।" });
    const out = await textReply({ instructions: "x", state: { ...L.r.state, mode: "text" }, kit: L.K, childText: "haan", history: [], ui: L.r.ui, module: null });
    assert.match(out.reply, /^Ab doosra kadam\./, out.reply);
    assert.doesNotMatch(out.reply, /\p{Script=Devanagari}/u);
    // a card let go with no next card: "Is sawaal ka jawab … hai"
    const st = { ...L.r.state, mode: "text", lastMove: { ...L.r.state.lastMove, gave: { answer: "30 cm", why: "" } } };
    replyDeps.chat = async () => ({ text: "Chalo." });
    const g = await textReply({ instructions: "x", state: st, kit: L.K, childText: "pehle main try karun?", history: [], ui: { status: "your_turn" }, module: null });
    assert.match(g.reply, /Is sawaal ka jawab 30 cm hai/, g.reply);
    assert.doesNotMatch(g.reply, /Pichhle sawaal/);
  });

  test("Studio wholes@1: a compare card's two wholes, read off the row and named by code from the card's columns", async () => {
    const alt = altViewOfRow("on screen now: board · whole1 3 unequal parts · whole2 3 equal parts", "wholes");
    assert.deepEqual(alt, { view: "wholes", labels: [], wholes: [{ parts: 3, equal: false }, { parts: 3, equal: true }] });
    const T4 = "c4-maths-ch05-t01";
    setScriptForTest(T4, runScript(T4));
    const L = walkOf(T4);
    const board = { template: "compare@1", params: { left: { title: "Cake A", items: ["3 tukde"] }, right: { title: "Cake B", items: ["3 tukde"] } } };
    const card = "Kis cake ka har tukda 1/3 hai?";
    const st = { ...L.r.state, mode: "text", lastMove: { kind: "reteach", request: "visual", visual: "diagram", altView: alt, scriptBeat: { scriptId: "s", skillId: "x", beatId: "c1", kind: "check", board } } };
    replyDeps.chat = async () => ({ text: `Theek hai. ${card}` });
    const out = await textReply({ instructions: "x", state: st, kit: L.K, childText: "picture dikhao", history: [], ui: { ask: { itemId: "x", text: card } }, module: null });
    assert.match(out.reply, /^Dekho: Cake A ke 3 alag-alag tukde; Cake B ke 3 barabar tukde\./, out.reply);
  });

  test("split policy B (main): closures never split a turn on their own; only authored teaching plus its card over the cap is split", async () => {
    const { splitLong } = await import("../server/director/state.js");
    const s = { ctx: {}, lastMove: null };
    const out = { state: s, move: { kind: "explain", itemId: "x", point: "Ek chhota point.", closed: { answer: "30 m", why: "bahut lamba kaaran ".repeat(12) }, gave: { answer: "5", why: "aur ek lamba kaaran ".repeat(10) } }, ui: { ask: { text: "Kitna?" } } };
    const r = splitLong(out, { event: "turn" });
    assert.equal(r.move.splitClose, undefined, "no closing split");
    assert.equal(r.move.kind, "explain");
  });

  test("v2.3 answerBoard (director9 item 4): a card answered right shows its authored answer-state board over its close, never while live", async () => {
    const sc = runScript(T1);
    const e1 = sc.skills[0].explain.find((b) => b.id === "e1");
    const ab = { template: "fraction-line@1", params: { den: 3, from: 0, to: 1, marks: [{ num: 1, label: "1/3" }] } };
    e1.ask.answerBoard = ab;
    setScriptForTest(T1, { ...sc, version: 2.3 });
    const L = walkOf(T1);
    for (let i = 0; i < 8 && L.r.state.activeItemId !== `script:${sc.skills[0].skillId}:ask:e1`; i++) L.t("haan");
    assert.equal(L.r.state.activeItemId, `script:${sc.skills[0].skillId}:ask:e1`, "e1's card is live");
    assert.notDeepEqual(L.r.move.scriptBeat?.board, ab, "not while live");
    L.t(String(e1.ask.key), cls("correct"));
    assert.deepEqual(L.r.move.closeBeat?.board, ab, JSON.stringify(L.r.move.closeBeat));
    assert.equal(L.r.move.closeBeat?.answerBoard, true);
  });

});
