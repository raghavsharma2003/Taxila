// d34 wrap reply (release 58's paid run: every steady lesson's reply to the wrap's question — "thoda mushkil tha", "sawaal achhe the" — was
// read `incorrect` and its turn recorded column "wrong"; steady-c4-ch01-t02 rows 112 to 116). The wrap's second turn being due, the reply
// is the wrap's own: never graded against a card or the closing question, no evidence, no blind grade. The closing question's own answers
// are still graded (to-brain 052 B2). The classifier's model is a stubbed fetch that labels any graded reply wrong (other_wrong; a teach-back
// reading with nothing covered), so a reply that reaches a grader is read `incorrect` here as the real model read it.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { setScriptForTest } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { planTurn } from "../server/brain/turn.js";
import { classify, targetFor } from "../server/director/classify.js";
import { newLearnerState } from "../server/comprehension/fuse.js";
import { findItem } from "../server/director/items.js";

const TOPIC = "c5-maths-ch02-t02";
const SCRIPT = JSON.parse(readFileSync(new URL(`./fixtures/scripts-052e/${TOPIC}.json`, import.meta.url), "utf8"));
const CHILD = { id: "00000000-0000-0000-0000-00000000d34a", legal_mode: "M1", class_level: 5 };
const LESSON = { id: "11111111-1111-1111-1111-11111111d34a", started_at: new Date(0).toISOString() };
const brief = { firstName: "Riya", classLevel: 5, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
  vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
const GRADED = new Set(["correct", "incorrect", "partial", "misconception"]);

describe("d34: the reply to the wrap's question is the wrap's, never graded", () => {
  let realFetch, env0, calls;
  before(() => {
    realFetch = globalThis.fetch; env0 = { ...process.env }; calls = [];
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    delete process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_L2;
    setScriptForTest(TOPIC, SCRIPT);
    // (the stubbed model: whatever it is asked, nothing listed — a graded reply is other_wrong, a teach-back reading covers nothing)
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(init.body);
      const name = body.response_format?.json_schema?.name ?? "";
      calls.push(name);
      const out = name === "classify_teachback" ? { covered: [], misconceptions: ["none"], confidence: 0.9 }
        : name.startsWith("classify_") && name !== "classify_none" ? { match: "other_wrong", confidence: 0.9 } : { distress: false };
      const flags = { off_topic: false, distress: false, asks_for_answer: false, wants_to_stop: false };
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...flags, ...out }) }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200 });
    };
  });
  after(() => {
    globalThis.fetch = realFetch; setScriptForTest(undefined);
    for (const k of Object.keys(process.env)) if (!(k in env0)) delete process.env[k];
    Object.assign(process.env, env0);
  });

  const K = () => kitFromFile(getTopic(TOPIC));
  /** The walk to the closing question: every card answered right (step alone, no classifier). */
  const toClosing = (kit) => {
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: kit.title ?? kit.topicId, classLevel: 5, sessionId: LESSON.id, lessonKey: "d34-wrap-reply", teacher: "director" };
    let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    for (let i = 0; i < 300 && !(r.state.phase === "teachback" && r.state.teachbackAsked); i++) {
      const it = r.state.activeItemId ? findItem(r.state, kit, r.state.activeItemId) : null;
      r = step(r.state, { event: "turn", kit, cls: { outcome: it ? "correct" : "no_evidence", confidence: 0.9, flags: {} }, text: it ? String(it.answer) : "haan", now: (r.state.turn + 1) * 20_000 });
    }
    assert.ok(r.state.phase === "teachback" && r.state.teachbackAsked && r.state.teachbackGrade?.key, "the walk reached the closing question");
    return r.state;
  };
  /** One turn as production reads it: targetFor → classify (the stubbed model) → planTurn. */
  const turn = async (s, kit, text) => {
    const s0 = { ...s, brief, kitVerified: kit.verified, kitHash: kit.hash, mode: "text", recent: [...(s.recent ?? []), { who: "child", text }] };
    const activeItem = s0.activeItemId ? findItem(s0, kit, s0.activeItemId) : null;
    const target = targetFor(s0, kit, activeItem);
    const n0 = calls.length;
    const cls = await classify({ target, childText: text, lang: "hinglish", classLevel: 5, typed: true });
    const p = await planTurn(s0, cls, { kit, child: CHILD, lesson: LESSON, activeItem, moduleOnly: false, moduleEvents: [], answer: text, childText: text, leaked: false,
      live: Promise.resolve({ state: newLearnerState({ childId: CHILD.id, classLevel: 5 }), maxSeq: 0 }), carried: [], now: (s.turn + 1) * 20_000 });
    // (her line, as the walk wrote it, is what she said: the help picker reads it from the recent turns, as a lesson's are kept)
    const line = [...(p.r.state.lastMove?.rendered ?? []), p.r.state.lastMove?.wrapAsk].filter(Boolean).join(" ");
    const st = { ...p.r.state, recent: [...s0.recent, ...(line ? [{ who: "teacher", text: line }] : [])].slice(-12) };
    return { target, raw: cls, p, st, labelCalls: calls.slice(n0).filter((x) => x.startsWith("classify_")) };
  };
  const notGraded = (w, what) => {
    assert.equal(w.target.mode, "none", `${what}: no grader for the wrap's reply`);
    assert.ok(!w.labelCalls.some((x) => x !== "classify_none"), `${what}: no grading call (${w.labelCalls})`);
    assert.equal(w.p.cls.outcome, "no_evidence", what);
    assert.deepEqual(w.p.evidence, [], `${what}: no evidence row`);
    assert.deepEqual(w.p.events, [], `${what}: no learner event`);
    assert.deepEqual(w.st.kt?.deferred ?? [], [], `${what}: nothing held for a blind grade`);
    assert.ok(!(w.st.did ?? []).some((d) => d.kind === "teachback" && /mushkil|achhe/.test(d.answer)), `${what}: no teach-back record of it`);
    assert.notEqual(w.st.lastMove?.cell?.column, "wrong", `${what}: the record's column`);
    assert.ok(!["wrong", "right", "misconception"].includes(w.st.lastMove?.cell?.column), `${what}: ${JSON.stringify(w.st.lastMove?.cell)}`);
    assert.equal(w.st.lastMove?.kind, "wrap", what);
    assert.equal(w.st.lastMove?.wrapPart, 2, `${what}: the wrap's second turn`);
  };

  test("the closing question answered right: graded by its key; the wrap's reply 'thoda mushkil tha' is not graded and writes nothing", async () => {
    const kit = K();
    const s = toClosing(kit);
    const a = await turn(s, kit, String(s.teachbackGrade.key));
    assert.equal(a.target.mode, "item", "the closing question goes through the cards' grader (052 B2)");
    assert.equal(a.p.cls.outcome, "correct");
    assert.ok(a.p.evidence.length > 0 && a.p.evidence.every((e) => e.probe === "P1" && e.outcome === "correct"), "the closing answer is evidence");
    assert.ok(a.st.wrapTwo, "the wrap's first turn asked its question");
    notGraded(await turn(a.st, kit, "thoda mushkil tha"), "after a right answer");
    notGraded(await turn(a.st, kit, "sawaal achhe the"), "after a right answer (a liking)");
  });

  test("the closing question keyed after misses: the misses are graded; the wrap's reply is not graded and writes nothing", async () => {
    const kit = K();
    let s = toClosing(kit);
    let misses = 0;
    for (let i = 0; i < 6 && !s.teachbackKeyed; i++) {
      const m = await turn(s, kit, "mujhe lagta hai 99/100");
      assert.equal(m.target.mode, "item");
      assert.ok(GRADED.has(m.p.cls.outcome) && m.p.cls.outcome !== "correct", `a miss is graded: ${m.p.cls.outcome}`);
      assert.ok(m.p.evidence.length > 0 && m.p.evidence.every((e) => e.outcome !== "correct"), "a miss is evidence");
      misses += 1; s = m.st;
    }
    assert.ok(s.teachbackKeyed && misses >= 2, `keyed after ${misses} misses`);
    const ack = await turn(s, kit, "achha theek hai");
    assert.equal(ack.p.cls.outcome, "no_evidence", "the reply after the key is never graded (director23 R2)");
    assert.ok(ack.st.wrapTwo, "the wrap's first turn asked its question");
    notGraded(await turn(ack.st, kit, "thoda mushkil tha"), "after the key");
  });

  test("targetFor: the wrap's second turn due, nothing is graded in any phase — and the closing question open still is", () => {
    const kit = { items: [], expectations: ["e"], misconceptions: [{ id: "m", belief: "b" }] };
    const g = { key: "8/12", accept: [] };
    assert.equal(targetFor({ phase: "teachback", teachbackAsked: true, teachbackGrade: g }, kit, null).mode, "item");
    for (const s of [{ phase: "teachback", teachbackAsked: true, teachbackGrade: g, teachbackPassed: true }, { phase: "teachback", teachbackAsked: true }, { phase: "practice", hintLevel: 0 }]) {
      const t = targetFor({ ...s, wrapTwo: { ack: null } }, kit, { id: "x", answer: "1", misconceptions: [], expectations: [] });
      assert.equal(t.mode, "none"); assert.deepEqual(t.misconceptions, [], "no belief read from it either");
    }
  });
});
