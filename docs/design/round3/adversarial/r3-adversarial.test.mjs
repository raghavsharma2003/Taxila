// Round 3 adversarial review (child safety + correctness) of the integrated tree, 2026-10-09. Every test here FAILS on the
// reviewed tree (HEAD 40d61b3 + the integrator's working tree) and states the behaviour the floor needs. Kept OUT of tests/
// on purpose (npm test runs tests/ in one process and other agents gate on it), like round 2's review:
//   node --test docs/design/round3/adversarial/r3-adversarial.test.mjs
// No network, no DB, no model: models are never called (classifyFast / the reply model is replaced through replyDeps), the
// play server runs on its coverage file with class defaults, the relational seam runs on its test hooks.
import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";

import { hasPlay } from "../../../../server/play/levels.js";
import { startSession } from "../../../../server/play/start.js";
import { gradeActs, lessonEvidence } from "../../../../server/play/grade.js";
import { logicFor } from "../../../../src/play/families/index.ts";
import { buildLive } from "../../../../server/forge3/live.js";
import { parseVoice } from "../../../../src/play/core/voice.ts";
import { __test as lessonRoute } from "../../../../server/routes/lesson.js";
import { initLessonState, step } from "../../../../server/director/state.js";
import { findItem } from "../../../../server/director/items.js";
import { classifyFast, targetFor } from "../../../../server/director/classify.js";
import { newLearnerState } from "../../../../server/comprehension/fuse.js";
import { relationalSeam, __relTest } from "../../../../server/relational/seam.js";
import { callbackCandidates } from "../../../../server/relational/memory.js";
import { SHAPES } from "../../../../server/relational/policy.js";
import { signalsOf } from "../../../../server/relational/signals.js";
import { unsafeChildPhrase } from "../../../../server/conversation/screen.js";
import { requestFromNote } from "../../../../server/conversation/policy.js";
import { textReply, replyDeps, checkInProblems } from "../../../../server/brain/say.js";
import { chat } from "../../../../server/azure.js";
import { pilotCode } from "../../../../src/voicesig/pilotRecorder.ts";
import { kit, CTX, BRIEF, cls } from "../../../../tests/fixtures/kit.mjs";

const K = kit();
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const req = (rq) => ({ ...cls("no_evidence"), source: "request", request: rq });
function toPractice(ctx = CTX) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, cls("no_evidence"));
  return r;
}

describe("round3 adversarial: BLOCKING", () => {
  afterEach(() => { replyDeps.chat = chat; __relTest.reset(); });

  // ── B1. Play is admitted by TOPIC, and its evidence is written on a skill the game never exercised ─────────────────────
  // server/play/tools/build-coverage.mjs:126-128 gives every coverage entry ALL of its topic's kit skills (skillIds) and
  // skillId = skillIds[0] (no RULE sets `skill`); server/play/levels.js:33 hasPlay / :24 entryFor admit on that list;
  // server/play/start.js:37 takes the lesson's skill whenever it is in the list; src/play/core/replay.ts:51 writes every
  // evidence row on level.skillId; server/brain/turn.js:1033 folds it (skillOk only checks "in the kit"). This is the
  // rejected rj-r3g-topic-tag-admission again (dukaan@1 in a subtraction moment), against GRAMMAR.md §1/§144 "admit by skill".
  test("B1a: a game is admitted only for a skill its act exercises (not every skill of the topic)", () => {
    const wrong = [
      ["c4-maths-ch07-t01-s1", "Add 3- and 4-digit numbers with regrouping ← todo-jodo/bundles/subtract (take b away from a)"],
      ["c5-maths-ch04-t01-s1", "Add 5-digit numbers with regrouping ← todo-jodo/bundles/subtract"],
      ["c4-maths-ch10-t02-s1", "Read counts from a data table ← nishana/compare (a number line)"],
      ["c7-maths-ch15-t01-s1", "Turn word phrases into expressions ← taraazu/equation/solve"],
      ["c6-science-ch01-t02-s1", "Record observations in a table ← kyun-lab golu"],
    ];
    const admitted = wrong.filter(([sk]) => hasPlay(sk));
    assert.deepEqual(admitted.map(([, why]) => why), [], "games admitted for skills they do not exercise");
  });
  test("B1b: a solved SUBTRACTION level is evidence on the subtraction skill, never on the addition skill", async () => {
    const child = { id: "00000000-0000-0000-0000-0000000000cc", class_level: 4, language_pref: "hinglish" };
    const r = await startSession(child, { topicId: "c4-maths-ch07-t01" });
    assert.equal(`${r.level.family}/${r.level.mode}`, "todo-jodo/bundles");
    const logic = logicFor(r.level.family, r.level.mode);
    const acts = logic.solve(r.level).map((act, i) => ({ seq: i + 1, t: i * 1000, act, via: "touch" }));
    const g = gradeActs(r.level, acts);
    assert.equal(g.grade.verdict, "solved");
    const rows = lessonEvidence(g.grade, r.level);
    assert.ok(rows.length > 0);
    assert.deepEqual([...new Set(rows.map((e) => e.skillId))], ["c4-maths-ch07-t01-s2"],
      `${r.level.params.a} − ${r.level.params.b} was credited to ${rows.map((e) => e.skillId).join(", ")} (s1 = "Add 3- and 4-digit numbers with regrouping")`);
  });
  test("B1c: in a lesson on the ADDITION skill, 'game khelna hai' is not answered with the subtraction game", async () => {
    const live = await buildLive({ ask: "game", lessonId: "11111111-1111-1111-1111-111111111111", child: { id: "00000000-0000-0000-0000-0000000000cc", class_level: 4, language_pref: "hinglish" },
      skillId: "c4-maths-ch07-t01-s1", topicId: "c4-maths-ch07-t01" }, { q: undefined });
    assert.ok(!live || live.artifact.play.mode !== "bundles",
      `served ${live?.artifact.play.family}/${live?.artifact.play.mode} with skillId ${live?.artifact.play.skillId}: its evidence lands on the addition skill`);
  });

  // ── B2. A game command (voice OR typed) is ALSO graded as the answer to the folded card question ─────────────────────
  // src/lesson/runtime.ts:611 (play patch 05) dispatches every committed utterance (typed included: only chips are skipped) to
  // the play piece AND sends it as an ordinary turn, with nothing that says it was a game act. After the game ask the card
  // item stays active (server/director/state.js:815: the visual request keeps the item and spends a rung), the Desk folds its
  // card in play mode (src/child/lesson/Desk.tsx playMode), and the turn grades the words against that card: an exact key
  // credits the item and the Director moves on mid-game; a bare digit is a wrong answer IN CODE (round 3 truth's number
  // floor, classify.js:674), the card's hint follows on a card the child cannot see.
  const CHILD = { id: "00000000-0000-0000-0000-0000000000bb", legal_mode: "M1", class_level: 4 };
  const LESSON = { id: "11111111-1111-1111-1111-111111111111", started_at: new Date(0).toISOString() };
  async function gameCommandTurn(said) {
    const g = turn(toPractice({ ...CTX, classLevel: 4, sessionId: LESSON.id }), req({ type: "visual", kind: "game", whole: true }));
    assert.equal(g.move.visual, "game", "precondition: the child asked for a game (the Studio slot shows the play piece)");
    assert.ok(parseVoice(said), `precondition: "${said}" is a play command the piece on screen acts on`);
    const s = { ...g.state, brief: BRIEF, mode: "text", seq: 9 };
    const item = findItem(s, K, s.activeItemId);
    const f = classifyFast({ target: targetFor(s, K, item), childText: said, heard: "Chalo game khelte hain! Roti ka ek hissa rango.", lang: "hinglish", classLevel: 4 });
    // f.result: decided in bytes; else the round-3 number floor's code verdict (classify.js:674, the 429 path) for a bare digit
    const c = f.result ?? (f.bareWrongNumber ? { outcome: "incorrect", confidence: 1, source: "number", flags: f.flags } : null);
    const p = await lessonRoute.planTurn(structuredClone(s), c, { kit: K, child: CHILD, lesson: LESSON, activeItem: item, moduleOnly: false, moduleEvents: [], playTokens: [],
      answer: said, childText: said, leaked: false, live: Promise.resolve({ state: newLearnerState({ childId: CHILD.id, classLevel: 4 }), maxSeq: 0 }), carried: [], now: 200_000 });
    return { item, p };
  }
  test("B2a: '1/3' said to the game (shade a third) is not credited as the card's answer and does not move the lesson on", async () => {
    const { item, p } = await gameCommandTurn("1/3");
    const onCard = p.evidence.filter((e) => e.itemId === item.id);
    assert.deepEqual(onCard.map((e) => e.outcome), [], `the game command graded the card item ${item.id} (key ${item.answer})`);
    assert.equal(p.r.state.activeItemId, item.id, `the Director moved on (${p.r.move.kind}) while the child is in the game`);
  });
  test("B2b: '3' typed or said on the game's pad is never a WRONG answer to the card question", async () => {
    const { item, p } = await gameCommandTurn("3");
    const wrong = p.evidence.filter((e) => e.itemId === item.id && e.outcome !== "correct");
    assert.deepEqual(wrong.map((e) => e.outcome), [], `"3" (a game act) became ${wrong.map((e) => e.outcome)} on ${item.id}; next move ${p.r.move.kind}`);
  });

  // ── B3. "Forget that" is promised, but only THIS lesson's memory rows are deleted ──────────────────────────────────────
  // server/relational/policy.js:53 forget_ok ("agree plainly that she will not keep it") and :49 ("she lets go of anything
  // they ask her to"); server/relational/writers.js:154 memoryForgetStmt deletes `source_turn in (this lesson's turns)` only
  // (seam.js:269). The memory she called back in this lesson's opener (W:mem, written by an EARLIER lesson) survives, stays
  // on the parent page and can open the next lesson again (seam.js memoryRecord reads the 3 newest rows).
  test("B3: after a callback to an earlier lesson's memory, 'please forget that' deletes that memory row", () => {
    const child = { id: "00000000-0000-0000-0000-0000000000c9", legal_mode: "M1", teacher_id: "asha" };
    const PREV = "00000000-0000-0000-0000-00000000aa01", NOW = "00000000-0000-0000-0000-00000000aa02";
    const snapshot = { agentId: "asha", childId: child.id, legalMode: "M1", stage: "first_sessions", classLevel: 5, lang: "hinglish", sessions: 2,
      callbacks: callbackCandidates({ allow: { learning: true, memory: true }, memories: [{ id: 42, kind: "win", text: "won the class drawing prize", lessonId: PREV }] }),
      keeps: "memory_keeps_learning_and_likes", allow: { learning: true, memory: true } };
    __relTest.reset(); __relTest.setTablesReady(true); __relTest.stash(child.id, snapshot);
    const base = { lessonId: NOW, childId: child.id, cls: { outcome: "no_evidence", flags: {} }, lane: "cascade", safety: false };
    const opener = relationalSeam.decide({ ...base, turn: 1, move: "hook", childText: "haan didi ready" });
    assert.equal(opener?.callbackId, "W:mem:42", "precondition: she opens with the earlier lesson's memory");
    const ask = relationalSeam.decide({ ...base, turn: 2, move: "explain", childText: "please forget that" });
    assert.equal(ask?.moveOverlay?.shapeId, "forget_ok", "precondition: she agrees she will not keep it");
    const stmts = relationalSeam.onLessonEnd(child, { lessonId: NOW, childId: child.id, endedBy: "client", turns: 6 });
    const deletes = stmts.filter((s) => /delete from memory/i.test(s.text));
    const covers42 = deletes.some((s) => !/source_turn in/i.test(s.text) || (s.params ?? []).map(String).includes("42"));
    assert.ok(covers42, `she promised; the only delete is ${deletes.map((s) => `${s.text.slice(0, 90)} ${JSON.stringify(s.params)}`).join(" | ") || "none"}`);
  });
});

describe("round3 adversarial: NON-BLOCKING", () => {
  afterEach(() => { replyDeps.chat = chat; __relTest.reset(); });

  // N1. server/brain/say.js:130/134 (integration fix 4): CHECKIN_GOODBYE lists "aaj ke liye … yahin" and "yahin rok(te|
  // dete) hain", which is how a Hinglish check-in names the STOP OPTION itself. Every such check-in is flagged "wrap",
  // costs a rewrite call on the stop path (maxed quotas, +1-2 s), and ships as the fixed line (the R3 say-back is lost).
  test("N1: a Hinglish stop check-in that offers 'aaj ke liye yahin rok dete hain' among the three choices ships as drafted", async () => {
    const draft = "Achha Riya, tum rukna chahti ho. Aage chalein, thoda break lein, ya aaj ke liye yahin rok dete hain?";
    assert.deepEqual(checkInProblems(draft, { kind: "stop", lang: "hinglish" }), []);
    const s = turn(toPractice(), req({ type: "stop", whole: true, src: "note", fromNote: true }));
    let calls = 0;
    replyDeps.chat = async () => { calls++; return { text: draft }; };
    const out = await textReply({ instructions: "x", state: s.state, kit: K, childText: "bas, aaj ke liye itna hi", history: [], ui: s.ui, module: s.state.module });
    assert.equal(calls, 1, `rewritten: guard=${JSON.stringify(out.guard)}`);
    assert.equal(out.reply, draft);
  });

  // N2. server/relational/memory.js:60 renders a memory row's text (model-written at lesson end from the child's words,
  // routes/lesson.js SENSITIVE only) into "OPEN THIS TURN WITH what you remember of them" (compile.js, last section) with no
  // code screen: round 2's law (conversation/screen.js unsafeChildPhrase: model-lifted child words never enter her
  // instructions unscreened) is not applied to the new callback path. Memories are also extracted from a lesson that ended
  // in safeguarding, and nothing reads snapshot.lastEnd.
  test("N2: a companion / romance / fear memory never becomes an opener callback", () => {
    const texts = ["loves the teacher and wants to be her best friend forever", "wants to marry the teacher when older", "is scared of an uncle at home"];
    const c = callbackCandidates({ allow: { learning: true, memory: true }, memories: texts.map((text, i) => ({ id: i + 1, kind: "win", text, lessonId: "L0" })) });
    assert.deepEqual(c.map((x) => x.fragment), [], "callbacks that would open a lesson");
    assert.ok(texts.slice(0, 2).every(unsafeChildPhrase), "precondition: the existing screen already refuses the first two");
  });

  // N3. server/director/state.js:897 (round 3 uptakeShare): a share from the child's life is kept in s.later and brought back
  // "in one warm line" later (shapes.js returnParked share). A SAD share (the relational lexicon reads share_sad) is kept the
  // same way: "mera dog kal mar gaya" is promised back and returned right after the next right answer, beside the
  // relational overlay's one-gentle-line rule for it.
  test("N3: a sad share (share_sad) is not kept for a 'come back to it later' promise", () => {
    const said = "didi mera dog kal mar gaya";
    assert.ok(signalsOf(said, { harm: false }).some((x) => x.kind === "share_sad"), "precondition: the relational lexicon reads it as sad");
    const s = turn(toPractice(), req(requestFromNote({ intent: "personal_share", also: [], topic: "mera dog kal mar gaya", inBounds: true })), { text: said });
    assert.deepEqual((s.state.later ?? []).filter((e) => e.share).map((e) => e.topic), [], `kept: shape "${s.move.shape.slice(0, 160)}"`);
  });

  // N4. src/voicesig/pilotRecorder.ts:23-28 + lessonFeatures.ts:98: child audio is recorded on any device whose URL once
  // carried ?vspilot=Pnn-Sn; the code persists in localStorage with no expiry (the comment says "for the session"), nothing
  // checks the signed V3 consent or the child it was signed for, so on a shared coordinator device the next child's lessons
  // are recorded under the previous child's code until someone opens ?vspilot=0 (PILOT-PROTOCOL §4 step 5).
  test("N4: a pilot code left on the device from an earlier session does not start a recording on a lesson opened without it", () => {
    const m = new Map();
    const store = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
    assert.equal(pilotCode({ search: "?vspilot=P07-S1" }, store), "P07-S1", "precondition: the coordinator's link");
    // a later lesson on the same device, opened without the code (another session, possibly another child)
    assert.equal(pilotCode({ search: "" }, store), null);
  });
});
