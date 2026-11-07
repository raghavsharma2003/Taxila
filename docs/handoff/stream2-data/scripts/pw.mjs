import fs from "node:fs";
import * as plan from "/home/user/Taxila/server/studio/plan.js";
const kit = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
const line = "Kabir, number line par perimeter ko walking distance samjho: 0 se 160 metres tak. Rectangle ka boundary distance kitna hai?";
const ops = [{ id: "nl", op: "numwork", at: [60, 200], layout: "number_line", range: [0, 160], rows: [["0", "160"]], t: [0, 2500] }, { id: "t", op: "text", at: [300, 120], text: "boundary distance", size: "m", t: [2600, 3400] }];
plan._setChat(async () => ({ json: { ops }, usage: {} }));
const ask = { intent: { intentId: "L:wb:16", lessonId: "L", kind: "whiteboard", beat: "explain", style: { band: "B3" }, request: { kind: "number_line" } }, requested: true, line: { lessonId: "L", text: line }, mode: "fresh", kit: { topicId: kit.topicId, content: [] } };
const r = await plan.planWhiteboard(ask, { kit, budgetMs: 9000 });
console.log(r.ok, r.why, (r.gate?.checks ?? []).filter((c) => !c.pass).map((c) => c.id + JSON.stringify(c.detail).slice(0, 80)).join(" | "));
