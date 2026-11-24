// d35 follow-up 4: an aside at the closing question (graded as a card since 052 B2) goes the way an aside at a card goes — the park line,
// then the question (its reask after the question was said), or 052 B4's pointed invitation on the third turn running at it; the board
// stays up. And the wrap held for an aside's return opens on her reply to the child's answer to it. Dry steady c5-ch02-t03 (d35 m1) rows 79
// to 82 (a free line, the board cleared, then drawn again under a miss verdict) and 86 ("Virat" unheard at the wrap).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat, chatStream } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { dryReading } from "../evals/hybrid-side-by-side/dry-reader.mjs";

const T = "c5-maths-ch02-t03";
const script = JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${T}.json`, import.meta.url), "utf8"));
const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
const BRIEF = { firstName: "Riya", classLevel: 5, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
  vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();

/** The lesson walked with right answers to the closing question, then `says` — each turn read as the dry harness reads it (code, else the dry
 *  stub; a reply where her aside question is due is about the aside) and said by textReply with a stubbed model. */
async function walk(says) {
  replyDeps.chat = async () => ({ text: STUB }); replyDeps.chatStream = replyDeps.chat;
  try {
    const K = kitFromFile(getTopic(T));
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "x" }, ageBand: "10-15", lang: "hinglish", interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: T, classLevel: 5, sessionId: "s", lessonKey: "d35-fu-4", teacher: "director" };
    let r = step(initLessonState({ topicId: T, kit: K, ctx, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let n = 0; n < 400 && r.state.phase !== "teachback"; n++) {
      const s0 = { ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] };
      const item = s0.activeItemId ? findItem(s0, K, s0.activeItemId) : null;
      const t = item ? String(item.answer) : "haan";
      const c = classifyFast({ target: targetFor(s0, K, item), childText: t, lang: "hinglish", typed: true }).result ?? { outcome: "no_evidence", confidence: 1, flags: {} };
      r = step(s0, { event: "turn", kit: K, cls: c, text: t, now: (s0.turn + 1) * 20_000 });
    }
    const sayNow = async (said) => {
      const state = { ...r.state, brief: BRIEF, mode: "text", lastVerdict: null, lastGraded: null };
      const out = await textReply({ instructions: instructionsFor(state, K), state, kit: K, childText: said, history: (state.recent ?? []).slice(-6), ui: r.ui, module: null });
      r.state = { ...r.state, returnAsked: out.guard?.asideEnd && out.guard?.returnSaid && r.state.lastMove?.returned?.topic ? { topic: r.state.lastMove.returned.topic } : undefined,
        ...(out.guard?.asideEnd && !r.ui?.ask ? { asideReplyDue: true } : {}) };
      return out.reply;
    };
    let text = await sayNow("");
    const turns = [{ said: null, text, lm: r.state.lastMove }];
    for (const t of says) {
      const s0 = { ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text }] };
      const tg = targetFor(s0, K, s0.activeItemId ? findItem(s0, K, s0.activeItemId) : null);
      let c = classifyFast({ target: tg, childText: t, lang: "hinglish", classLevel: 5, typed: true }).result ?? dryReading(tg);
      if (s0.asideReplyDue && !/\d/.test(t)) c = { ...c, outcome: "no_evidence", confidence: 1, asideReply: true };
      r = step(s0, { event: "turn", kit: K, cls: c, text: t, now: (s0.turn + 1) * 20_000 });
      text = await sayNow(t);
      turns.push({ said: t, text, lm: r.state.lastMove });
    }
    return turns;
  } finally { replyDeps.chat = chat; replyDeps.chatStream = chatStream; }
}
const parkForms = (topic) => script.joints.asidePark.map((f) => f.hi.replace(/\{(?:topic|aside)\}/g, topic)).map((x) => norm(x.charAt(0).toUpperCase() + x.slice(1)));
const prompt = norm(script.teachback.prompt.hi), reask = norm(script.teachback.reask.hi);

test("an aside at the closing question: the park line, then the question (its reask after the question was said), over its board; no verdict", async () => {
  const [q0, a] = await walk(["kal maine cricket khela, sixer maara"]);
  assert.ok(q0.text.endsWith(prompt), "the closing question was said");
  assert.equal(a.lm.kind, "teachback"); assert.equal(a.lm.endAside, true); assert.deepEqual(a.lm.renderedKinds, ["closingQuestion"]);
  assert.deepEqual(a.lm.scriptBeat?.board, script.teachback.board, "the board stays up"); assert.equal(a.lm.clear, undefined);
  assert.ok(parkForms("cricket").some((f) => a.text.startsWith(f)), a.text);
  assert.ok(a.text.endsWith(reask), a.text);
  assert.ok(!a.text.includes(STUB) && !/sahi nahi|jawab nahi/i.test(a.text), a.text);
});
test("the third turn running at the closing question that parks an aside ends on the pointed invitation", async () => {
  const t = await walk(["kal maine cricket khela, sixer maara", "maine dobara check kiya", "kal maine football khela"]);
  const last = t.at(-1);
  assert.deepEqual(last.lm.renderedKinds, ["answerFirst"]);
  assert.ok(parkForms("football").some((f) => last.text.startsWith(f)), last.text);
  assert.ok(!last.text.includes(prompt) && !last.text.includes(reask) && !last.text.includes(STUB), last.text);
});
test("the wrap held for an aside's return opens on her reply to the child's answer to it", async () => {
  const t = await walk(["kal maine cricket khela, sixer maara", "8/12", "Virat"]);
  const w = t.at(-1);
  assert.equal(w.lm.kind, "wrap"); assert.equal(w.lm.returnReply?.said, "Virat");
  assert.match(w.text, /^[^.!?]*Virat/, w.text);
});
