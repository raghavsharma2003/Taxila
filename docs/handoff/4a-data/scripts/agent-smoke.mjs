import { initLessonState } from "/home/user/Taxila/server/director/state.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { agentTurn, eventOf, applyAgentTurn } from "/home/user/Taxila/server/agent/agent.js";
const kit = kitFromFile(getTopic(process.argv[2] ?? "c4-maths-ch05-t01"));
const ctx = { firstName: "Riya", classLevel: 4, lang: "hinglish", address: "tum", teacherName: "Asha", interests: ["cricket"], topicTitle: kit.title, ageBand: "6-9" };
let state = initLessonState({ topicId: kit.topicId, kit, ctx, seed: 3, now: 0 });
for (const dep of (process.argv[3] ?? "taxila-gpt61-sol").split(",")) {
  process.env.TAXILA_TEACHER_DEPLOY = dep;
  try {
    const out = await agentTurn({ state, kit, event: eventOf({ kind: "start" }), lessonId: "L", lane: "voice" });
    console.log(dep, out.ms + "ms", JSON.stringify({ say: out.say, intent: out.intent, item: out.item?.id, board: out.board?.shown, plan: out.plan.slice(0, 160), notes: out.notes, usd: out.usage.usd }));
  } catch (e) { console.log(dep, "ERROR", String(e.message).slice(0, 200)); }
}
