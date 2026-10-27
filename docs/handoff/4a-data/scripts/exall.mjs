// Director replay across every kit that has a worked example: "ek example se samjhao" at the lesson's start → does the
// move's content carry the kit's worked example, and is the move marked shown (stuck)?
import fs from "node:fs";
import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { requestOf } from "/home/user/Taxila/server/director/requests.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const NE = cls("no_evidence"); const q = requestOf("samajh nahi aaya, ek example se samjhao");
let n = 0, kitEx = 0, shown = 0, err = 0;
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) {
  const raw = JSON.parse(fs.readFileSync(`/home/user/Taxila/data/kits/${f}`, "utf8")); const list = Array.isArray(raw) ? raw : raw.topics ?? Object.values(raw.kits ?? raw);
  for (const k0 of list) { if (!k0?.topicId || !k0.workedExample) continue;
    try { const K = kitFromFile(getTopic(k0.topicId)); if (!K?.workedExample) continue; n++;
      let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: Number(K.topicId.match(/^c(\d)/)[1]) }, seed: 2, now: 0 }), { event: "start", kit: K, now: 0 });
      r = step(r.state, { event: "turn", kit: K, cls: { ...NE, source: "request", request: q }, text: "x", now: 20000 });
      if ((r.state.lastContent ?? []).join(" ").includes(K.workedExample.problem)) kitEx++;
      if (r.move.stuck) shown++;
    } catch { err++; } } }
console.log({ kits: n, kitExampleInContent: kitEx, shown, err });
