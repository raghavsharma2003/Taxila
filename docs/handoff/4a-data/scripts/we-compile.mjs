import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { requestOf } from "/home/user/Taxila/server/director/requests.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { instructionsFor } from "/home/user/Taxila/server/compiler/instructions.js";
import { CTX, BRIEF, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const NE = cls("no_evidence");
const say = (r, text) => { const q = requestOf(text); const c = q ? { ...NE, source: "request", request: q } : /pata nahi/.test(text) ? { ...NE, flags: { ...NE.flags, dontKnow: true } } : NE; return step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); };
for (const script of [["samajh nahi aaya, ek example se samjhao", "pata nahi", "pata nahi", "pata nahi"], ["haan", "haan", "pata nahi", "pata nahi"]]) for (const mode of ["text", "voice"]) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed: 2, now: 0 }), { event: "start", kit: K, now: 0 });
  r.state.mode = mode; r.state.brief = { ...BRIEF, classLevel: 6, ageBand: "10-15" };
  for (const t of script) { r = say(r, t); r.state.mode = mode; r.state.brief = { ...BRIEF, classLevel: 6, ageBand: "10-15" }; r.state.brief = { ...BRIEF, classLevel: 6, ageBand: "10-15" };
    const ins = instructionsFor(r.state, K, mode);
    const has = ins.includes("Rani runs");
    console.log(mode, JSON.stringify(t), "→", r.move.kind, "| kit example in prompt:", has, "| 'own numbers' in prompt:", /own numbers/.test(ins), "| interest example:", /example from their interest/.test(ins));
  }
}
{
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed: 2, now: 0 }), { event: "start", kit: K, now: 0 });
  for (const t of ["samajh nahi aaya, ek example se samjhao", "pata nahi", "pata nahi"]) r = say(r, t);
  r.state.mode = "text"; r.state.brief = { ...BRIEF, classLevel: 6, ageBand: "10-15" };
  const ins = instructionsFor(r.state, K, "text");
  console.log("=====");
  const i0 = ins.indexOf("LESSON NOW"); console.log(ins.slice(i0, i0 + 1500)); console.log("content:", JSON.stringify(r.state.lastContent));
}
