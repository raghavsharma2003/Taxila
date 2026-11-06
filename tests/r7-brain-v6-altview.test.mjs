// v6 × Studio S3′ (main on integration 11: the second view's flag never reached Brain, preselectWhiteboard returns a string):
// a picture asked while the live card's board is already up. Through Studio's REAL seam: the preselected row names the second
// view's bars; Brain reads it (altViewOfRow, or Studio's preselectedAltView when present) and her line says it is the same
// numbers in the new view, keeping the card.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as seam from "../server/studio/seam.js";
import { altViewOfRow } from "../server/brain/propose.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { initLessonState } from "../server/director/state.js";
import { CTX } from "./fixtures/kit.mjs";

test("altViewOfRow: a row of bars is the second view, with its shaded fractions; any other row is not", () => {
  assert.deepEqual(altViewOfRow("on screen now: board · bar1 6 equal parts, 1 shaded = 1/6 · bar2 3 equal parts, 1 shaded = 1/3"), { view: "parts", labels: ["1/6", "1/3"] });
  assert.deepEqual(altViewOfRow("bar1 3 equal parts, ? (asked)"), { view: "parts", labels: [] });
  assert.equal(altViewOfRow("on screen now: board · line 0 to 1 in 6 gaps"), null);
  // (Studio, director9: an asked bar reads "S shaded = ?"; a bar card's second view is a number line, hinted "line")
  assert.deepEqual(altViewOfRow("bar1 6 equal parts, 1 shaded = 1/6 · bar2 4 equal parts, 3 shaded = ?"), { view: "parts", labels: ["1/6"] });
  assert.deepEqual(altViewOfRow("line 0 to 1 · gaps 8 equal gaps in each whole · each 1/8 · marks 1/8", "line"), { view: "line", labels: ["1/8"], gaps: 8 });
  assert.equal(altViewOfRow(null), null);
});

test("cross-seam: picture asked with the card's board up → Studio's row names the bars → her line names the same numbers on the new view, card kept", async () => {
  const T = "c5-maths-ch02-t02", kit = kitFromFile(getTopic(T)), L = `v6alt-${Date.now()}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
  const ref = { template: "fraction-line@1", params: { den: 6, from: 0, to: 1, marks: [{ num: 1, label: "1/6" }, { num: 2, label: "1/3" }] } };
  const card = "Rahul ko ek bar ka 1/6 milta hai, Sana ko doosre bar ka 1/3. Kise bada tukda milta hai?";
  let n = 0;
  const ask = (text, more = {}) => ({ intent: { intentId: `${L}:wb:${++n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
    scriptBeat: { scriptId: "s", beatId: "worked", kind: "worked" }, ...more }, line: { lessonId: L, teacherReplySeq: n, text }, mode: "fresh", kit: { topicId: T, content: [] } });
  const a1 = ask("");
  seam.studioSeam.preselectWhiteboard(a1);
  const up = seam.studioSeam.requestIntent({ ...a1, line: { ...a1.line, text: card } });
  assert.equal(up?.state, "revealed", "the card's board is up");
  const a2 = ask("", { request: { kind: "picture" } });
  const row = seam.studioSeam.preselectWhiteboard(a2);
  const alt = (typeof seam.studioSeam.preselectedAltView === "function" ? seam.studioSeam.preselectedAltView(L) : null) ?? altViewOfRow(row);
  assert.ok(alt, `the second view is known to Brain (row: ${String(row).slice(0, 160)})`);
  const state = { ...initLessonState({ topicId: T, kit, ctx: { ...CTX, classLevel: 5, lang: "hinglish" }, seed: 7, now: 0 }), mode: "text",
    lastMove: { kind: "reteach", request: "visual", visual: "diagram", altView: alt, scriptBeat: { scriptId: "s", skillId: "x", beatId: "worked", kind: "worked", board: ref } } };
  try {
    replyDeps.chat = async () => ({ text: `Theek hai, chalo isi sawaal par wapas aate hain. ${card}` });
    const out = await textReply({ instructions: "x", state, kit, childText: "picture dikhao", history: [], ui: { ask: { itemId: "x", text: card } }, module: null });
    assert.match(out.reply, /^Dekho, yahi 1\/6 aur 1\/3 ab patti par\./, out.reply);
    assert.ok(out.reply.endsWith(card), "the card stays, last");
  } finally { replyDeps.chat = chat; }
});

import * as BF from "../server/stagecraft/board-first.js";
import { whiteboardAskOf } from "../server/brain/propose.js";

test("replay director9 c5-t02 offtopic T26 ('drawing karke samjhao' with e3's line board up): the ask is proposed on the practice move, Studio picks the second view, her line names it", async () => {
  // 1. arbitration: the card re-posed is a `practice` move; the child's picture ask is still proposed (it was declined)
  const wb = whiteboardAskOf({ beat: { id: "b", type: "practice" }, lane: "text", late: false, strained: false, move: { kind: "practice", request: "visual", visual: "diagram" }, requested: true });
  assert.equal(wb.proposals.length, 1, `declined: ${wb.declined}`);
  // 2. the board on screen at T25 (the row's own ref), then the picture ask at T27 with it as the page on screen
  const T = "c5-maths-ch02-t02", kit = kitFromFile(getTopic(T)), L = `d9t26-${Date.now()}`;
  const ref = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, marks: [{ num: 1, label: "1/8" }, { num: 2, label: "1/4" }] } };
  const card = "Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?";
  const ask = (n, more = {}) => ({ intent: { intentId: `${L}:wb:${n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
    scriptBeat: { scriptId: "s", beatId: "e3", kind: "explain" }, ...more }, line: { lessonId: L, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } });
  const up = BF.preselect(ask(25), { kit });
  assert.ok(up?.script, "T25's board is drawn");
  const pic = BF.preselect(ask(27, { request: { kind: "picture" } }), { kit, avoid: up.script });
  assert.equal(pic?.altView, "parts", `the second view is picked (template ${pic?.template})`);
  const alt = altViewOfRow(pic.row);
  assert.deepEqual(alt?.labels, ["1/8", "1/4"], String(pic.row).slice(0, 200));
  // 3. her line: the same numbers on the new view, the card kept
  const state = { ...initLessonState({ topicId: T, kit, ctx: { ...CTX, classLevel: 5, lang: "hinglish" }, seed: 7, now: 0 }), mode: "text",
    lastMove: { kind: "practice", request: "visual", visual: "diagram", altView: alt, scriptBeat: { scriptId: "s", skillId: "x", beatId: "e3", kind: "explain", board: ref } } };
  try {
    replyDeps.chat = async () => ({ text: `Riya, ek 0 se 1 tak seedhi line banao. ${card}` });
    const out = await textReply({ instructions: "x", state, kit, childText: "drawing karke samjhao", history: [], ui: { ask: { itemId: "x", text: card } }, module: null });
    assert.match(out.reply, /^Dekho, yahi 1\/8 aur 1\/4 ab patti par\./, out.reply);
    assert.doesNotMatch(out.reply, /line banao/, "never tells the child to draw it");
    assert.ok(out.reply.endsWith(card));
  } finally { replyDeps.chat = chat; }
});

test("a bar card's second view is a number line: her line says it ('0 se 1 ki sankhya rekha, 8 barabar gaps, nishaan 1/8 par')", async () => {
  const T = "c5-maths-ch02-t02", kit = kitFromFile(getTopic(T));
  const card = "Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?";
  const state = { ...initLessonState({ topicId: T, kit, ctx: { ...CTX, classLevel: 5, lang: "hinglish" }, seed: 7, now: 0 }), mode: "text",
    lastMove: { kind: "reteach", request: "visual", visual: "diagram", altView: altViewOfRow("line 0 to 1 · gaps 8 equal gaps in each whole · each 1/8 · marks 1/8", "line"),
      scriptBeat: { scriptId: "s", skillId: "x", beatId: "e2", kind: "explain", board: { template: "fraction-parts@1", params: { parts: 8, shade: 1, whole: "bar" } } } } };
  try {
    replyDeps.chat = async () => ({ text: `Theek hai. ${card}` });
    const out = await textReply({ instructions: "x", state, kit, childText: "picture dikhao", history: [], ui: { ask: { itemId: "x", text: card } }, module: null });
    assert.match(out.reply, /^Dekho, yahi 0 se 1 ki sankhya rekha par, 8 barabar gaps, nishaan 1\/8 par\./, out.reply);
  } finally { replyDeps.chat = chat; }
});
