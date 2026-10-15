// r5 QA pass 13, D41 (14.4): after a safeguard a Hinglish child said "Can we do the lesson now?" and was offered "Show me a
// picture / Tell it as a story / Play a game / Lesson par wapas" (English with one Hinglish), and her reply switched to English.
// The ways-in chips are the child's words, so they go through chipLabels(lang) like the stop / check-in chips; a label said
// aloud reads as the request its id names; and an English line from a Hinglish child does not switch the teacher's language
// (only a language request does: compile.js PINNED). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, chipLabels } from "../server/director/state.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { findItem } from "../server/director/items.js";
import { requestOf } from "../server/director/requests.js";
import { languageRule } from "../server/compiler/compile.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
function said(r, text) {
  const target = targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId));
  const fast = classifyFast({ target, childText: text, typed: true });
  return fast.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: { ...fast.flags, wantsToStop: !!fast.request }, request: fast.request };
}
function waysIn(lang) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, lang }, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, NE);
  return turn(r, said(r, "can we talk about something else"));
}

test("the ways-in chips are in the child's language (english / hinglish / hindi); the ids are unchanged", () => {
  const want = {
    english: ["Show me a picture", "Tell it as a story", "Play a game", "Back to the lesson"],
    hinglish: ["Picture dikhao", "Kahani mein batao", "Game khelte hain", "Lesson par wapas"],
    hindi: ["तस्वीर दिखाओ", "कहानी में बताओ", "गेम खेलते हैं", "पाठ पर वापस"],
  };
  for (const [lang, labels] of Object.entries(want)) {
    const s = waysIn(lang);
    assert.deepEqual(s.ui.chips.map((c) => c.id), ["req:visual", "req:story", "req:game", "stop:continue"], lang);
    assert.deepEqual(s.ui.chips.map((c) => c.label), labels, lang);
    // a chip tapped is the request its id names, whatever the label's language
    assert.match(turn(s, said(s, labels[1]), { chipId: "req:story" }).move.shape, /story/, lang);
    assert.equal(turn(s, NE, { chipId: "req:visual" }).move.request, "visual", lang);
  }
});

test("every chip-label language carries the ways-in labels", () => {
  for (const lang of ["english", "hinglish", "hindi"]) for (const k of ["visual", "story", "game", "back"]) assert.ok(chipLabels(lang)[k], `${lang}.${k}`);
});

test("a ways-in label said aloud reads as its request in every language; a question about a story is not a story request", () => {
  for (const lang of ["english", "hinglish", "hindi"]) {
    const l = chipLabels(lang);
    assert.equal(requestOf(l.visual)?.type, "visual", l.visual);
    assert.equal(requestOf(l.story)?.type, "story", l.story);
    assert.equal(requestOf(l.game)?.kind, "game", l.game);
  }
  for (const t of ["कहानी सुनाओ", "कहानी की तरह समझाओ"]) assert.equal(requestOf(t)?.type, "story", t);
  for (const t of ["इस कहानी में राजा कौन है", "कहानी", "कहानी में क्या हुआ बताओ"]) assert.notEqual(requestOf(t)?.type, "story", t);
});

test("the Hinglish language rule keeps Hinglish through an English line; a language the child ASKED for still holds", () => {
  const sys = (lang, pinned) => languageRule(lang, "10-15", pinned);
  const hinglish = sys("hinglish", false);
  assert.match(hinglish, /English line/);
  assert.match(hinglish, /keep Hinglish/);
  assert.doesNotMatch(hinglish, /switch to English[^.]*follow them/);
  assert.match(sys("english", true), /they asked for simple English/);
});
