// to-brain 054 C, keys, reasons and help as said (round d37; docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md section C and
// main's rulings on C3, C5, C6). Walked with step() and brain/say.js textReply (the reply model stubbed: every line of these turns is the
// script's or code's), the child's played lines read by the real code read (classify.js classifyFast against the open item's target), on the
// live scripts; and help.js's pickHelp / keyLine on the scripts themselves.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { initLessonState, step } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { findItem } = await import("../server/director/items.js");
const { textReply, replyDeps } = await import("../server/brain/say.js");
const { classifyFast, targetFor } = await import("../server/director/classify.js");
const { normSentence } = await import("../server/director/help.js");

const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const nk = (t) => normSentence(t);
export const scriptOf = (topic) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${topic}.json`, import.meta.url), "utf8"));

/** A lesson walked until `at(state)` holds, every question before answered right; then `play(lines)` says each line, read for real. */
export async function walkUntil(TOPIC, at) {
  const chat0 = replyDeps.chat, stream0 = replyDeps.chatStream;
  replyDeps.chat = async () => ({ text: STUB }); replyDeps.chatStream = replyDeps.chat;
  const kit = kitFromFile(getTopic(TOPIC));
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
    interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "d37-054c", lessonKey: "d37-054c", teacher: "director" };
  let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const say = async (text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
  r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: (await say("")).reply }];
  const realRead = (s, text) => { const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null; return classifyFast({ target: targetFor(s, kit, it), childText: text, lang: s.ctx?.lang, classLevel: 4, typed: true }).result ?? null; };
  const turn = async (text, cls) => {
    const s = r.state;
    r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
    const t = await say(text);
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }];
    return { text: norm(t.reply), lm: r.state.lastMove ?? {}, seams: (t.guard?.seams ?? []).map((x) => x.right), state: r.state, ui: r.ui };
  };
  let found = false;
  for (let i = 0; i < 300; i++) {
    if (at(r.state)) { found = true; break; }
    const it = r.state.activeItemId ? findItem(r.state, kit, r.state.activeItemId) : null;
    await turn(it ? String(it.answer) : "haan", { outcome: it ? "correct" : "no_evidence" });
  }
  const LINES = { give: ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }], clarify: ["samajh nahi aaya", { outcome: "no_evidence", request: { type: "clarify" } }] };
  const play = async (seq) => { const out = []; for (const k of seq) { if (LINES[k]) out.push(await turn(...LINES[k])); else { const c = realRead(r.state, k); out.push(await turn(k, c ?? { outcome: "incorrect" })); } } return out; };
  const done = () => { replyDeps.chat = chat0; replyDeps.chatStream = stream0; };
  return { found, play, done, kit, now: () => r.state };
}
const atOwnStep = (s) => /:ask:worked$/.test(String(s.lastUi?.ask?.itemId ?? "")) && !s.lastMove?.stepAsk?.prompt;

describe("C1: an own step's key after misses is the step's own key with its why, no worked close after it", async () => {
  for (const [TOPIC, wrong] of [["c6-maths-ch07-t01", "1/6"], ["c6-maths-ch06-t01", "7 m"]]) {
    const w = await walkUntil(TOPIC, atOwnStep);
    const turns = await w.play([wrong, wrong, wrong, wrong, wrong, wrong]);
    w.done();
    const ys = scriptOf(TOPIC).skills[0].workedExample;
    test(`${TOPIC}: the key turn says yourStep.why, not the worked example's answer, and no "Toh poora jawab"`, () => {
      assert.ok(w.found);
      const k = turns.findIndex((t) => t.seams.includes("key"));
      assert.ok(k >= 0, turns.map((t) => t.text).join(" | "));
      const T = nk(turns[k].text);
      assert.ok(T.includes(nk(ys.yourStep.why.hi)) || T.includes(nk(ys.yourStep.why.hi).slice(-30)), turns[k].text);
      assert.ok(!T.includes(nk(ys.answer.hi)), turns[k].text);
      assert.ok(!/toh poora jawab/i.test(turns[k].text), turns[k].text);
    });
  }
});
