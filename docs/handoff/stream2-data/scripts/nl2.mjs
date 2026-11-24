import * as boardSync from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { requestOf } from "/home/user/Taxila/server/director/requests.js";
import fs from "node:fs";
const kit = JSON.parse(fs.readFileSync("data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
const req = { kind: "number_line" };
for (const [i, line] of ["Kabir, number line dekho: 0 se 50, phir 30, phir 50, phir 30. Rectangle ke chaar sides ka total kitna hoga?",
  "Kabir, number line par 0 se 50 tak length aur phir 30 tak breadth mark karo"].entries()) {
  const ask = { intent: { intentId: "L:wb:" + i, lessonId: "L", kind: "whiteboard", beat: "explain", style: { band: "B3" }, request: req }, requested: true,
    line: { lessonId: "L", text: line }, mode: "fresh", kit: { topicId: kit.topicId, content: [] } };
  const r = await boardSync.plan(ask, { kit, planWhiteboard: async () => ({ ok: false, usd: 0 }) });
  console.log(i, r.ok, r.source, r.template ?? "", r.why ?? "", (r.gate?.checks ?? []).filter((c) => !c.pass).map((c) => c.id).join(","));
}
