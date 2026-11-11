// dc-r7-script-walk-v6-1 P1 (main's director9 judgement, with Studio): the two drawing/data failures replayed through the real turn
// path. The recorded child turns are read by classifyFast and planned by turn.js's planTurn (tests/fixtures/replay.mjs), her line
// is assembled by textReply, the intent is built by whiteboardIntentOf from her line's parts, and Studio's seam pages it
// (prefetch → preselectWhiteboard → requestIntent), as production's turn does. The walked scripts are the run's own copies.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { whiteboardIntentOf, boardItemOf, altViewOfRow, segmentsAt } from "../server/brain/propose.js";
import { findItem } from "../server/director/items.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import * as seam from "../server/studio/seam.js";

// integration 12 (main): the hooks below set TAXILA_R7_SCRIPT and clear the script cache; at top level they wrapped EVERY
// test in a single-process run (--experimental-test-isolation=none) and turned kit-path suites to script mode (32 failures).
// Scoped to this file's describe, as tests/fixtures/kit-path.mjs asks.
describe("r7-brain-v61-replay.test.mjs", () => {

  const RUN = "2026-11-06-director9";
  const runScript = (T) => runScriptOf(RUN, T);
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  const lessonOf = (kit, tag) => {
    const L = `${tag}-${Date.now()}`;
    seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: kit.topicId, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
    return L;
  };
  const intentAt = (L, plan, kit, text, parts = null) => whiteboardIntentOf({ lessonId: L, turn: plan.state.turn, beat: { id: "visual", type: "explain" }, next: plan.state, kit,
    item: boardItemOf(plan.state, kit, findItem), line: { text, ...(parts ? { parts } : {}) } });
  /** As turn.js: Studio preselects on the empty line, then requestIntent takes it on her real line. */
  const show = (a) => { const row = seam.studioSeam.preselectWhiteboard({ ...a, line: { ...a.line, text: "" } }); return { row, ack: seam.studioSeam.requestIntent(a) }; };

  test("P1 replay director9 c5-t01 steady T21 (confirm-reveal): 'Bilkul — pehla hissa 1/8 km' pages onto the then-card's board with 1/8 revealed", async () => {
    const T = "c5-maths-ch02-t01";
    setScriptForTest(T, runScript(T));
    const { kit, rows, plans, last } = await replay(RUN, "steady", T, 21);
    assert.equal(last.child, "ek bata aath km");
    // (the run's move was a closing repair; under main's split policy B the closures ride with the next beat in one turn)
    assert.ok(["repair", "explain"].includes(last.p.r.move.kind), last.p.r.move.kind);
    assert.equal(last.state.lastMove?.closeBeat?.beatId ?? last.state.lastMove?.scriptBeat?.beatId, "then:c5-maths-ch02-t01-m-not-numbers");
    const L = lessonOf(kit, "d9t21");
    // T19: the then-card's board is up, its asked mark "?"
    const t19 = show(intentAt(L, plans.at(-2), kit, rows[18].text)).ack;
    assert.equal(t19?.state, "revealed");
    assert.deepEqual(t19.artifact.screens?.[0]?.counts?.marks ?? t19.artifact.screen?.counts?.marks, [{ at: "mark 1", label: "?" }]);
    // T21: her line (the model's draft is the verdict alone; code adds the closed card's close and the hold)
    replyDeps.chat = async () => ({ text: "Bilkul, Riya: pehla hissa 1/8 km hai." });
    const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    // (R7: the right answer's reason is the card's authored why, said by code)
    // (v6.6 V1: the verdict is code's frame, never her words, with the authored why)
    assert.match(out.reply, /^(?:Haan, sahi hai|Bilkul sahi|Haan, bilkul theek|Sahi jawab), kyunki sadak 8 barabar hisson mein hai/, out.reply);
    const a21 = intentAt(L, last, kit, out.reply, out.guard?.parts);
    // the dropping side (Brain): a 3-word tail ("Ab agla hissa.") was its own page back on the answered card's board; Studio could
    // not draw that page in its time (W6.timing), the paged turn failed and the revealed verdict page never reached the screen
    const v = show(a21).ack;
    assert.equal(v?.state, "revealed", "the turn pages (it was 'planning': the ladder, nothing drawn beside her verdict)");
    assert.deepEqual(v.artifact.screens[0].counts.marks, [{ at: "mark 1", label: "1/8" }], "the verdict's page shows what she confirms");
    assert.ok(v.artifact.script.ops.some((o) => o.op === "text" && o.text === "1/8"));
  });

  test("P1: a page whose own words are a bare transition is no page (the board before it stays up)", () => {
    const card = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, mark: 1 } }, e1 = { template: "fraction-line@1", params: { den: 2, from: 0, to: 1, marks: [{ num: 1, label: "1/2" }] } };
    const plan = [{ part: "close", boardRef: card, scriptBeat: { beatId: "then" } }, { part: "closed", boardRef: e1, scriptBeat: { beatId: "e1" } }, { part: "body", boardRef: card, scriptBeat: { beatId: "then" } }];
    const line = "Bilkul, Riya: pehla hissa 1/8 km hai. Aur pehle wale sawaal ka jawab isi line par tha, kyunki 1/3 pehla gap hai. Ab agla hissa.";
    const parts = { prev: "Bilkul, Riya: pehla hissa 1/8 km hai.", closed: "Aur pehle wale sawaal ka jawab isi line par tha, kyunki 1/3 pehla gap hai." };
    const sg = segmentsAt(plan, line, null, parts);
    assert.deepEqual(sg.map((g) => g.scriptBeat.beatId), ["then", "e1"], JSON.stringify(sg));
    // a real body with its own words keeps its page
    const long = line.replace("Ab agla hissa.", "Ab is line par doosra nishaan dekho, woh kahan hai?");
    assert.deepEqual(segmentsAt(plan, long, null, parts).map((g) => g.scriptBeat.beatId), ["then", "e1", "then"]);
  });

  test("P1 replay director9 c5-t02 stuck T18 (picture): 'drawing karke samjhao' over the e2 bar draws its second view — the same whole round (director12 S4) — and her line names it", async () => {
    const T = "c5-maths-ch02-t02";
    setScriptForTest(T, runScript(T));
    const { kit, rows, plans, last } = await replay(RUN, "stuck", T, 19);
    assert.equal(last.child, "drawing karke samjhao");
    assert.equal(last.p.r.move.request, "visual");
    assert.deepEqual(last.state.lastMove?.scriptBeat?.board, { template: "fraction-parts@1", params: { parts: 8, shade: 1, whole: "bar" } });
    const L = lessonOf(kit, "d9t18");
    const t17 = show(intentAt(L, plans.at(-2), kit, rows[16].text)).ack;
    assert.equal(t17?.state, "revealed", "e2's bar is up");
    // T19: the preselect (as turn.js: the row, then Studio's hint) → her line → the take
    const a = intentAt(L, last, kit, "");
    assert.ok(a.intent.request, "a picture ask is a request to Studio");
    const row = seam.studioSeam.preselectWhiteboard(a);
    const hint = typeof seam.studioSeam.preselectedAltView === "function" ? seam.studioSeam.preselectedAltView(L) : null;
    const alt = altViewOfRow(row, hint) ?? hint;
    assert.deepEqual(alt, { view: "round", labels: ["1/8"], parts: 8, shaded: 1 }, `the second view (row: ${String(row).slice(0, 160)})`);
    const st = { ...last.state, lastMove: { ...last.state.lastMove, altView: alt } };
    replyDeps.chat = async () => ({ text: `Screen par ek bar hai, 8 barabar hisson mein bata hua, 1 hissa rangin. ${rows[16].text}` });
    const out = await textReply({ instructions: instructionsFor(st, kit), state: st, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    assert.match(out.reply, /^Dekho, wahi poora ab gol, 8 barabar hisse, 1 rangin \(1\/8\)\./, out.reply);
    assert.doesNotMatch(out.reply, /Screen par ek bar hai/, "her words about the old drawing go");
    const v = seam.studioSeam.requestIntent({ ...a, line: { ...a.line, text: out.reply, ...(out.guard?.parts ? { parts: out.guard.parts } : {}) } });
    assert.equal(v?.state, "revealed");
    assert.equal(v.artifact.altView, "round", "something new is drawn (it was the same bar again)");
    const scr = v.artifact.screens?.[0] ?? v.artifact.screen;
    assert.equal(scr.template, "fraction-parts@1");
    assert.deepEqual(scr.counts, { parts: 8, shaded: 1 });
  });

  test("director10 offtopic c4 T9 (unpaged): the bare code verdict 'Nahi, yeh jawab nahi hai.' is no first page of its own; the turn pages", async () => {
    const R10 = "2026-11-07-director10", T = "c4-maths-ch05-t01";
    setScriptForTest(T, runScriptOf(R10, T));
    const { kit, last } = await replay(R10, "offtopic", T, 9);
    assert.equal(last.child, "Yes");
    assert.equal(last.p.r.move.kind, "reteach", "the run's own move");
    replyDeps.chat = async () => ({ text: "Nahi, yeh jawab nahi hai." });
    const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    assert.match(out.reply, /^Nahi, yeh jawab nahi hai\. /, out.reply);
    const L = lessonOf(kit, "d10t9");
    const a = intentAt(L, last, kit, out.reply, out.guard?.parts);
    // (the run paged it as e1's board for the 5-word verdict, then the remediation's, then the then-card's: the first page failed)
    assert.equal(a.intent.scriptBeat?.beatId, "rem:c4-maths-ch05-t01-m-part-part", "the verdict is said over the remediation's board");
    const v = show(a).ack;
    assert.equal(v?.state, "revealed", "the turn pages (the run: 'planning', nothing drawn beside her line)");
  });

  test("a first page of a bare verdict (under FIRST_PAGE_MIN_WORDS, no card) joins the next page", () => {
    const a = { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "roti" } }, b = { template: "fraction-parts@1", params: { parts: 4, shade: 1, whole: "circle" } };
    const plan = [{ part: "close", boardRef: a, scriptBeat: { beatId: "e1" } }, { part: "body", boardRef: b, scriptBeat: { beatId: "rem" } }];
    const line = "Nahi, yeh jawab nahi hai. Poori roti ke 4 barabar tukde neeche aate hain, aur khaya hua 1 rangin tukda upar.";
    assert.deepEqual(segmentsAt(plan, line, null, { prev: "Nahi, yeh jawab nahi hai." }).map((g) => [g.atChar, g.scriptBeat.beatId]), [[0, "rem"]]);
    const long = line.replace("Nahi, yeh jawab nahi hai.", "Bilkul, Riya: pehla hissa 1/8 km hai, kyunki sadak 8 hisson mein hai.");
    assert.deepEqual(segmentsAt(plan, long, null, { prev: "Bilkul, Riya: pehla hissa 1/8 km hai, kyunki sadak 8 hisson mein hai." }).map((g) => g.scriptBeat.beatId), ["e1", "rem"], "a verdict with content keeps the answered card's board");
  });

});

test("Studio director12 S4 (patch 015): a count-key card's smaller case and a bar card's circle are read from Studio's row by their hint", () => {
  assert.deepEqual(altViewOfRow("board · wholes 1 equal bars · bar1 4 equal parts, 1 shaded = 1/4", "example"), { view: "example", labels: ["1/4"], parts: 4 });
  assert.deepEqual(altViewOfRow("board · equal parts 4, 3 · whole circle · parts 4 · shaded 3", "round"), { view: "round", labels: [], parts: 4, shaded: 3 });
  assert.deepEqual(altViewOfRow("board · whole bar · parts 3 · shaded 1 · fraction 1/3", "parts"), { view: "parts", labels: ["1/3"], parts: 3, shaded: 1 });
});
