// Main's 036 item 3: c4 steady 96 of director24 — her right answer to the s3 e1 card, and the live turn that posed the e2 card with
// e2's point never said. The fixture holds her line and the live row; the state is rebuilt from the run's script copy (the lesson walked
// by step() to the e1 card), her line goes through turn.js planTurn and textReply as production's turn does, and partOnce reads the
// result: today the turn says the verdict, its why and e2's point, holds the card, and the next turn poses it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { setScriptForTest } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { planTurn } from "../server/brain/turn.js";
import { newLearnerState } from "../server/comprehension/fuse.js";
import { findItem } from "../server/director/items.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const FX = JSON.parse(readFileSync(new URL("./fixtures/c4-steady-96.json", import.meta.url), "utf8"));
const SCRIPT = JSON.parse(readFileSync(new URL(`./fixtures/eval-results/hybrid-side-by-side/results/${FX.run}/scripts/${FX.topic}.json`, import.meta.url), "utf8"));
const cls = (o) => ({ outcome: o, confidence: 0.9, flags: {} });
const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: 4 };
const LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };
const brief = { firstName: "Riya", classLevel: 4, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
  vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };

test("c4 steady 96: after her right answer to e1, e2's point is said before its card (partOnce reads 0 on the turn and the next)", async () => {
  const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
  setScriptForTest(FX.topic, SCRIPT);
  try {
    const K = kitFromFile(getTopic(FX.topic));
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: K.title ?? K.topicId, classLevel: 4, sessionId: LESSON.id, lessonKey: "c4-steady-96", teacher: "director" };
    let r = step(initLessonState({ topicId: FX.topic, kit: K, ctx, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 80 && r.state.activeItemId !== FX.at; i++)
      r = step(r.state, { event: "turn", kit: K, cls: cls(r.state.activeItemId ? "correct" : "no_evidence"), text: r.state.activeItemId ? "x" : "haan", now: (r.state.turn + 1) * 20_000 });
    assert.equal(r.state.activeItemId, FX.at);
    // (the live row is the fault: e2's card with its point never said)
    const pctx = () => ({ script: SCRIPT, o: { ptSaid: new Set(["c4-maths-ch05-t01-s3:e1"]), cardSeen: new Set(["c4-maths-ch05-t01-s3:e1"]) }, prevRead: FX.read, prevChild: FX.child });
    assert.match(PREDICATES.partOnce("L", { who: "teacher", ...FX.live }, 96, pctx()) ?? "", /e2 card posed with its point never said/);

    const turn = async (s, c, text, said) => {
      const s0 = { ...s, brief, kitVerified: K.verified, kitHash: K.hash, mode: "text", recent: [{ who: "child", text }] };
      const p = await planTurn(s0, c, { kit: K, child: CHILD, lesson: LESSON, activeItem: s0.activeItemId ? findItem(s0, K, s0.activeItemId) : null, moduleOnly: false, moduleEvents: [],
        answer: text, childText: text, leaked: false, live: Promise.resolve({ state: newLearnerState({ childId: CHILD.id, classLevel: 4 }), maxSeq: 0 }), carried: [], now: (s.turn + 1) * 20_000 });
      const st = { ...p.r.state, brief, mode: "text", recent: [] };
      replyDeps.chat = async () => ({ text: said });
      const out = await textReply({ instructions: instructionsFor(st, K), state: st, kit: K, childText: text, history: [], ui: p.r.ui, module: null });
      return { st: p.r.state, out };
    };
    const a = await turn(r.state, cls(FX.read), FX.child, FX.verdict);
    const e2 = SCRIPT.skills.find((k) => k.skillId === "c4-maths-ch05-t01-s3").explain.find((b) => b.id === "e2");
    assert.ok(a.out.reply.includes(e2.point.hi.split(/(?<=[.!?])\s+/)[0]), a.out.reply);
    assert.doesNotMatch(a.out.reply, /bada tukda kaunsa fraction/);
    const c1 = pctx();
    assert.equal(PREDICATES.partOnce("L", { who: "teacher", text: a.out.reply, card: null }, 96, c1), null);
    // (her "haan" at the check-in: the card, said once, after its point)
    const b = await turn(a.st, cls("no_evidence"), "haan", "Achha.");
    assert.match(b.out.reply, /bada tukda kaunsa fraction/);
    assert.equal(PREDICATES.partOnce("L", { who: "teacher", text: b.out.reply, card: e2.ask.prompt.hi }, 98, { ...c1, prevRead: "no_evidence", prevChild: "haan" }), null);
  } finally {
    replyDeps.chat = chat; setScriptForTest();
    if (KEEP === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP;
  }
});
