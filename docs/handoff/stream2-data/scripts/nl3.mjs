import fs from "node:fs";
import * as boardSync from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { textsOf } from "/home/user/Taxila/server/studio/request.js";
const kit = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
const line = "Kabir, number line par perimeter ko walking distance samjho: 0 se 160 metres tak. Rectangle ka boundary distance kitna hai?";
const ask = { intent: { intentId: "L:wb:16", lessonId: "L", kind: "whiteboard", beat: "explain", style: { band: "B3" }, request: { kind: "number_line" } }, requested: true, line: { lessonId: "L", text: line }, mode: "fresh", kit: { topicId: kit.topicId, content: [] } };
const r = await boardSync.plan(ask, { kit, planWhiteboard: async () => ({ ok: false, usd: 0 }) });
console.log(r.ok, r.source, r.template, r.script ? [...textsOf(r.script)].join(" | ") : "", (r.gate?.checks ?? []).filter((c) => !c.pass).map((c) => c.id).join(","));
