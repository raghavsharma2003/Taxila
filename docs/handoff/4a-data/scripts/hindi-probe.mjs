import { agentTurn, eventOf } from "/home/user/Taxila/server/agent/agent.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import fs from "node:fs";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
const topics = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/c1-maths.json","utf8")).topics;
const t = topics.find((x) => /long|short|tall/i.test(JSON.stringify(x.skills ?? x).slice(0,2000))) ?? topics[0];
const kit = kitFromFile(getTopic(t.topicId));
for (let i = 0; i < 3; i++) {
  const state = { turn: 1, phase: "teach", ctx: { firstName: "Meera", classLevel: 1, lang: "hindi", teacherName: "Asha" }, itemsDone: [], skipped: [] };
  const out = await agentTurn({ state, kit, event: eventOf({ kind: "start" }), lessonId: "probe" });
  console.log(t.topicId, "|", out.say, "|", out.ms, "ms");
}
