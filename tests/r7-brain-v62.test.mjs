// dc-r7-script-walk-v6-2 (main's director10 judgement): turn limits T1-T3, runtime H1-H5, Studio seams G3/G5. The replays walk the
// run's own rows through turn.js planTurn (tests/fixtures/replay.mjs) with the run's own v2.3 scripts.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { revealOnVerdict, whiteboardIntentOf, boardItemOf } from "../server/brain/propose.js";
import { findItem } from "../server/director/items.js";
import * as seam from "../server/studio/seam.js";
import { requestOf } from "../server/director/requests.js";

// Scoped to this file's describe, as tests/fixtures/kit-path.mjs asks.
describe("r7-brain-v62.test.mjs", () => {
  const RUN = "2026-11-07-director10";
  const runScript = (T) => runScriptOf(RUN, T);
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  /** The run's row `upto` replayed: her line from the run's own text as the model's draft. */
  const at = async (persona, T, upto, draft = null, state = null) => {
    setScriptForTest(T, runScript(T));
    const { kit, rows, last } = await replay(RUN, persona, T, upto);
    replyDeps.chat = async () => ({ text: draft ?? rows[upto - 1].text });
    const st = state ? state(last.state) : last.state;
    const out = await textReply({ instructions: instructionsFor(st, kit), state: st, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    return { out, last, rows };
  };

  test("H1 replay director10 c4 stuck T23: a wrong answer's hint is the authored simpler, never her hint", async () => {
    const { out, rows } = await at("stuck", "c4-maths-ch05-t01", 23);
    assert.match(out.reply, /^2\/1 sahi nahi hai\. /, out.reply);
    assert.doesNotMatch(out.reply, /Tumne 2 ko upar rakha/, "her hint goes");
    assert.ok(out.reply.includes("Circle ke 3 barabar hisse hain"), out.reply);
    assert.ok(!rows[22].text.includes("Circle ke 3 barabar hisse hain"), "(the run said hers)");
  });

  test("H5 (director10 c5-t01 steering T47): the last right answer said again is no answer only on the same card", async () => {
    const { repeatOfLastRight } = await import("../server/brain/turn.js");
    const state = { lastVerdict: "correct", lastAnswerSaid: "1/3", lastGraded: { itemId: "script:s1:c1", key: "1/3" } };
    assert.equal(repeatOfLastRight(state, { id: "script:s1:c1" }, "1/3"), true, "the same card: a repeat");
    assert.equal(repeatOfLastRight(state, { id: "script:s1:c2" }, "1/3"), false, "a new card: '1/3' is its answer (its listed wrong one), graded");
    assert.equal(repeatOfLastRight({ ...state, lastVerdict: "not_yet" }, { id: "script:s1:c1" }, "1/3"), false);
  });

  test("H5 replay director10 c5-t02 steering T19: a consolation ('Koi baat nahi, …') is no verdict and never replaces code's", async () => {
    const { out } = await at("steering", "c5-maths-ch02-t02", 19);
    assert.match(out.reply, /^1\/8 sahi nahi hai\./, out.reply);
  });

  test("T1/T2 replay director10 c5-t01 steady T37: one close, and a why said in her last turn is not said again", async () => {
    const { out, rows } = await at("steady", "c5-maths-ch02-t01", 37);
    assert.ok(rows[34].text.includes("kyunki raasta 4 barabar gaps mein bata hai") && rows[36].text.includes("kyunki raasta 4 barabar gaps mein bata hai"), "(the run said the why on T35 and again on T37)");
    assert.doesNotMatch(out.reply, /raasta 4 barabar gaps mein bata hai/, out.reply);
    assert.match(out.reply, /Toh poora jawab: pehla khamba ghar se 1\/4 km door hai\./, out.reply);
  });

  test("H4 replays director10 c4: no doubled sentence after Hindi words, no 'Now try.', no 'Bilkul, no sahi hai'", async () => {
    const a = (await at("steady", "c4-maths-ch05-t01", 41)).out.reply;
    assert.equal((a.match(/Ab in dono numbers se bhinn likho\./g) ?? []).length, 1, a);
    const b = (await at("offtopic", "c4-maths-ch05-t01", 33)).out.reply;
    assert.doesNotMatch(b, /Now try/, b);
    const c = (await at("offtopic", "c4-maths-ch05-t01", 23)).out.reply;
    assert.match(c, /^Bilkul, sahi hai/, c);
  });

  test("H3: code's probe acknowledgement says they told how they thought only when they did", async () => {
    const T = "c4-maths-ch05-t01";
    setScriptForTest(T, runScript(T));
    const { kit, last } = await replay(RUN, "steady", T, 9);
    const st = { ...last.state, lastMove: { ...last.state.lastMove, probeAck: true } };
    const card = last.p.r.ui.ask?.text ?? "";
    const sayTo = async (childText) => { replyDeps.chat = async () => ({ text: card }); return textReply({ instructions: instructionsFor(st, kit), state: st, kit, childText, history: [], ui: last.p.r.ui, module: null }); };
    const noReason = await sayTo("woh toh ho gaya na");
    assert.doesNotMatch(noReason.reply, /tumhari soch|tareeka bataya|kaise socha/, noReason.reply);
    const reason = await sayTo("maine pehle tukde gine, phir upar likha");
    assert.match(reason.reply, /tumhari soch|tareeka bataya|kaise socha/, reason.reply);
  });

  test("G3: a right answer's verdict segment on the answered card's board carries the key (reveal: true, answers[0] the key)", () => {
    const board = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, mark: 1 } };
    const next = { lastVerdict: "correct", lastGraded: { key: "1/8 km", accept: ["1/8"] }, lastMove: { closeBeat: { beatId: "then:x", board } } };
    const bp = { boardRef: board, scriptBeat: { scriptId: "s", beatId: "then:x", kind: "check" } };
    assert.deepEqual(revealOnVerdict(bp, next).scriptBeat, { scriptId: "s", beatId: "then:x", kind: "check", reveal: true, answers: ["1/8 km", "1/8"] });
    assert.deepEqual(revealOnVerdict({ ...bp, scriptBeat: { ...bp.scriptBeat, answers: ["1/8", "1/8 km"] } }, next).scriptBeat.answers, ["1/8 km", "1/8"], "the key first");
    assert.equal(revealOnVerdict(bp, { ...next, lastVerdict: "not_yet" }), bp, "never on a wrong answer");
    assert.equal(revealOnVerdict({ ...bp, boardRef: { template: "fraction-line@1", params: { den: 2 } } }, next).scriptBeat.reveal, undefined, "only on the answered card's board");
  });

  test("G5: 'screen par dikhao (na)' is a picture request", () => {
    for (const t of ["screen par dikhao", "screen par dikhao na", "screen pe dikhao na", "board par dikha do", "स्क्रीन पर दिखाओ ना", "whiteboard mein dikhao", "slate pe dikhaiye"]) assert.equal(requestOf(t)?.type, "visual", t);
    for (const t of ["screen par 1/4 hai", "dikhao na", "screen par dekho", "screen par toh sab dikh raha hai"]) assert.equal(requestOf(t), null, t);
  });

  test("T3 replay director10 c6 steady: a turn ends after the bridge; the new skill's point and card come on the next turn", async () => {
    const T = "c6-maths-ch06-t01";
    setScriptForTest(T, runScript(T));
    const bridged = [];
    await replay(RUN, "steady", T, 83, { onPlan: (p) => { if (p.state.lastMove?.bridgeSaid) bridged.push(p); } });
    assert.ok(bridged.length >= 1, "the replay crosses a skill boundary");
    for (const p of bridged) {
      assert.equal(p.state.lastMove.splitClose, true, `T${p.row}: the bridge turn is its own turn`);
      assert.equal(p.state.activeItemId, undefined, `T${p.row}: no card live on the bridge turn`);
      assert.ok(p.state.splitHold?.move, `T${p.row}: the new skill's beat is held for the next turn`);
    }
  });

  test("Learning (director10 item 1) replay c5-t01 steering T13: 'samajh nahi aaya' straight after a remediation's say gets that remediation's own simpler", async () => {
    const T = "c5-maths-ch02-t01";
    const sc = runScript(T);
    const rem = sc.skills[0].remediation.find((r) => r.targets.endsWith("m-not-numbers"));
    rem.simpler = { hi: "Ghar se dukaan tak ki sadak ko barabar tukdon mein socho. Har tukda ek hissa hai.", en: "Think of the road as equal pieces. Each piece is one part." };
    setScriptForTest(T, sc);
    const { plans, last } = await replay(RUN, "steering", T, 13);
    assert.equal(plans.at(-2).state.lastMove?.scriptBeat?.beatId, "rem:c5-maths-ch02-t01-m-not-numbers", "T11 was the remediation");
    assert.equal(last.child, "samajh nahi aaya");
    assert.equal(last.state.lastMove?.simpler, rem.simpler.hi, JSON.stringify({ kind: last.p.r.move.kind, beat: last.state.lastMove?.scriptBeat?.beatId }));
  });

  test("T7 replay director10 c4 offtopic (main: 'a practice turn that parks the Virat aside drew nothing'): the card's line on its own board pages", async () => {
    // (in the director10 tree Studio's W8 refused the take — its cutByLines read the roti's own authored centre cut as "a round
    // whole cut by lines" — and the run fell back to the preselect; Studio's G2 (integration 13) skips that check on a card's own
    // authored board, so the take now draws)
    const T = "c4-maths-ch05-t01";
    setScriptForTest(T, runScript(T));
    const { kit, rows, last } = await replay(RUN, "offtopic", T, 7);
    assert.equal(last.child, "aapko virat pasand hai?");
    assert.equal(last.p.r.move.kind, "practice");
    assert.equal(last.state.activeItemId, "script:c4-maths-ch05-t01-s1:ask:e1");
    const take = (text) => {
      const L = `d10t7-${Math.random()}`;
      seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: kit.topicId, child: { id: `c-${L}`, class_level: 4, language_pref: "hinglish" } });
      const a = whiteboardIntentOf({ lessonId: L, turn: last.state.turn, beat: { id: "visual", type: "explain" }, next: last.state, kit, item: boardItemOf(last.state, kit, findItem), line: { text } });
      seam.studioSeam.preselectWhiteboard({ ...a, line: { ...a.line, text: "" } });
      return { a, ack: seam.studioSeam.requestIntent(a) };
    };
    const run = take(rows[6].text);
    // Brain's side: one unpaged intent on the live card's own board (2 parts, 1 shaded)
    assert.deepEqual(run.a.intent.boardRef, { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "roti" } });
    assert.equal(run.a.intent.segments, undefined, "one page: nothing for a page plan to drop");
    assert.equal(run.ack?.state, "revealed", "the run's line (park + card) draws the card's board");
    assert.equal(take("Is roti mein 1 tukda rangin hai aur 1 bina rang ka. Kya isliye rangin hissa 1/1 hai, haan ya nahi?").ack?.state, "revealed");
  });

  test("T46 replay director10 steady c4 (Studio): a worked answer that closes another card than the one just answered pages onto the worked board", async () => {
    const T = "c4-maths-ch05-t01";
    setScriptForTest(T, runScript(T));
    const { kit, rows, last } = await replay(RUN, "steady", T, 47);
    assert.equal(last.state.lastMove?.closeBeat?.beatId, "then:c4-maths-ch05-t01-m-part-part", "the card answered last turn: the 3/4 chocolate bar");
    assert.equal(last.state.lastMove?.closedBeat?.beatId, "worked", "the close said now: the worked barfi 2/3");
    replyDeps.chat = async () => ({ text: rows[46].text });
    const out = await textReply({ instructions: "x", state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    assert.match(out.guard.parts.closed ?? "", /^Toh poora jawab: barfi ka 2\/3/, JSON.stringify(out.guard.parts));
    assert.doesNotMatch(out.guard.parts.prev ?? "", /barfi/);
    const a = whiteboardIntentOf({ lessonId: "d10t46", turn: last.state.turn, beat: { id: "visual", type: "explain" }, next: last.state, kit, item: boardItemOf(last.state, kit, findItem), line: { text: out.reply, parts: out.guard.parts } });
    const at = out.reply.indexOf("Toh poora jawab");
    const pages = [{ atChar: 0, boardRef: a.intent.boardRef, scriptBeat: a.intent.scriptBeat }, ...(a.intent.segments ?? [])];
    const onBarfi = pages.filter((p) => p.atChar <= at).at(-1);
    assert.equal(onBarfi.scriptBeat?.beatId, "worked", JSON.stringify(pages.map((p) => [p.atChar, p.scriptBeat?.beatId])));
    assert.deepEqual(onBarfi.boardRef.params, { rows: 1, cols: 3, shade: 2, labels: false, hideResult: true }, "the barfi's 3 parts, 2 eaten — never the 3/4 grid");
    // App 3b: only the new card's page (the last one) is the open card's board
    assert.deepEqual(pages.map((p) => p.ofCard ?? a.intent.ofCard), [...pages.slice(0, -1).map(() => false), true], JSON.stringify(pages.map((p) => [p.atChar, p.ofCard])));
    assert.equal(a.intent.ofCard, false, "the first page (the answered card's board) is not the open card's");
  });
});
