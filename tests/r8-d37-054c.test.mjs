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

const { pickHelp, addSaid, KEY_AFTER_MISSES } = await import("../server/director/help.js");
const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
/** The flags of one predicate over made rows (a fresh ctx per lesson, as lessonFlags builds it). */
const flagsOf = (rows, name, script) => { const ctx = { script, o: {} }; return rows.map((r, i) => (r.who === "teacher" && PREDICATES[name]({ rows }, r, i, ctx) ? i : null)).filter((x) => x != null); };
const T = (text, part, column, seams = []) => ({ who: "teacher", text, cell: { part, column }, seams: seams.map((right) => ({ right })) });
const C = (text) => ({ who: "child", text });

describe("C3: at the cap, the named wrong answer's unsaid reason first — the miss verdict, the reason, the question; the cap on the turn after", () => {
  const script = scriptOf("c6-maths-ch07-t01");
  const part = "c6-maths-ch07-t01-s1:check:c2";
  const whyAlt = script.skills[0].checks[1].whyAlt.hi;
  const named = { outcome: "misconception", wrongListed: true };
  test("the cap at the named answer with its reason unsaid: the reason, the card kept, no key", () => {
    const d = pickHelp({ script, part, request: "hint", said: [], misses: KEY_AFTER_MISSES, last: named });
    assert.equal(d.card, "keep"); assert.equal(d.key, null); assert.ok(d.capReason);
    assert.equal(nk(d.rung.text), nk(whyAlt));
  });
  test("once a card: with the reason said, the cap is the key", () => {
    const said = addSaid([], whyAlt, 3);
    const d = pickHelp({ script, part, request: "hint", said, misses: KEY_AFTER_MISSES, last: named });
    assert.equal(d.card, "close"); assert.ok(d.key);
  });
  test("another answer (not the named one) at the cap: the key, as built", () => {
    const d = pickHelp({ script, part, request: "hint", said: [], misses: KEY_AFTER_MISSES, last: { outcome: "incorrect", wrongListed: false } });
    assert.equal(d.card, "close");
  });
  test("questionFiveTimes re-pinned: a fifth hearing passes only on the turn whose body is the named reason said for the first time at the card", () => {
    const card = "Jo hissa lamba nikla, woh doosre se kitne cm lamba hai?";
    const q = script.skills[0].checks[1].prompt.hi;
    const lead = [T(q, "c6-maths-ch07-t01-s1:e3:card", "right", ["card"]), C("7"), T(`Nahi. ${q}`, part, "wrong", ["missVerdict", "card"]), C("8"), T(`Nahi. ${q}`, part, "wrong", ["missVerdict", "card"]), C("9"), T(`Nahi. ${q}`, part, "wrong", ["missVerdict", "card"]), C("das")];
    const ok = [...lead, T(`Nahi, das theek nahi. ${whyAlt} ${q}`, part, "misconception", ["missVerdict", "help", "card"])];
    const was = PREDICATES.questionFiveTimes; void card;
    assert.ok(was);
    const n0 = flagsOf(ok, "questionFiveTimes", script);
    const bare = [...lead, T(`Nahi, das theek nahi. ${q}`, part, "misconception", ["missVerdict", "card"])];
    const n1 = flagsOf(bare, "questionFiveTimes", script);
    // (the same fifth hearing without the reason, or with the reason already said before, is flagged as before)
    const again = [...lead.slice(0, 2), T(`Nahi. ${whyAlt} ${q}`, part, "wrong", ["missVerdict", "help", "card"]), ...lead.slice(3), T(`Nahi, das theek nahi. ${whyAlt} ${q}`, part, "misconception", ["missVerdict", "help", "card"])];
    const n2 = flagsOf(again, "questionFiveTimes", script);
    assert.ok(n1.includes(8), `bare: ${n1}`);
    assert.ok(!n0.includes(8), `with the reason: ${n0}`);
    assert.ok(n2.includes(8), `reason said before: ${n2}`);
  });
  test("capBeforeOwnReason (gated) trips on a key at the named answer with its reason never said, not where it was said", () => {
    assert.ok(!PENDING.has("capBeforeOwnReason"));
    const key = "Yeh jawab sahi nahi hai. Is sawaal ka jawab 5 cm hai, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Yahan tak theek hai?";
    assert.deepEqual(flagsOf([C("10"), T(key, part, "misconception", ["missVerdict", "key", "checkin"])], "capBeforeOwnReason", script), [1]);
    assert.deepEqual(flagsOf([T(`Nahi. ${whyAlt}`, part, "misconception", ["missVerdict", "help"]), C("10"), T(key, part, "misconception", ["missVerdict", "key", "checkin"])], "capBeforeOwnReason", script), []);
    assert.deepEqual(flagsOf([C("7"), T(key, part, "wrong", ["missVerdict", "key", "checkin"])], "capBeforeOwnReason", script), []);
  });
});
