import { test } from "node:test";
import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { classifyFast, targetFor } from "/home/user/Taxila/server/director/classify.js";
import { __test as lessonRoute } from "/home/user/Taxila/server/routes/lesson.js";
import { newLearnerState } from "/home/user/Taxila/server/comprehension/fuse.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { CTX, BRIEF } from "/home/user/Taxila/tests/fixtures/kit.mjs";
test("probe", async () => {
  const K = kitFromFile(getTopic("c4-maths-ch05-t01"));
  const CHILD = { id: "00000000-0000-0000-0000-0000000000bb", legal_mode: "M1", class_level: 4 };
  const LESSON = { id: "11111111-1111-1111-1111-111111111111", started_at: new Date(0).toISOString() };
  let s = initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 4, lang: "hinglish", sessionId: LESSON.id }, seed: 7, now: 0 });
  s.brief = BRIEF;
  let r = step(s, { event: "start", kit: K, now: 0 });
  const said0 = "haan ready hoon";
  const plan0 = async (st, said, now) => {
    const f = classifyFast({ target: targetFor(st, K, null), childText: said, heard: "", lang: "hinglish", classLevel: 4 });
    const c = f.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: f.flags };
    return lessonRoute.planTurn(structuredClone(st), c, { kit: K, child: CHILD, lesson: LESSON, activeItem: null, moduleOnly: false, moduleEvents: [], playTokens: [],
      answer: said, childText: said, leaked: false, live: Promise.resolve({ state: newLearnerState({ childId: CHILD.id, classLevel: 4 }), maxSeq: 0 }), carried: [], now });
  };
  let p = await plan0(r.state, said0, 20_000);
  console.log("turn1", p.r.move.kind);
  const st = { ...p.r.state, recent: [...(p.r.state.recent ?? []), { who: "child", text: said0 }, { who: "teacher", text: "Golu, socho ek roti do logon mein barabar baantni ho; tum kaise baantoge?" }, { who: "child", text: "haan" }] };
  const p2 = await plan0(st, "haan", 40_000);
  console.log("turn2", p2.r.move.kind, "must:", p2.r.move.must);
  const ins = JSON.stringify(p2.instructions);
  console.log("instructions has THIS TURN FIRST:", ins.includes("THIS TURN FIRST"), "| has 'only said okay':", ins.includes("only said okay"));
});
