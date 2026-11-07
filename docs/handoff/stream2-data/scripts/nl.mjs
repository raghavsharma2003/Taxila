import { numberLineBoard } from "/home/user/Taxila/server/studio/request.js";
import { gateWhiteboard } from "/home/user/Taxila/server/studio/qa/whiteboard.js";
import { regate } from "/home/user/Taxila/server/stagecraft/board-sync.js";
import fs from "node:fs";
const kit = JSON.parse(fs.readFileSync("data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch06-t01");
for (const line of ["Kabir, number line dekho: 0 se 50, phir 30, phir 50, phir 30. Rectangle ke chaar sides ka total kitna hoga?",
  "Kabir, number line par 0 se 50 tak length aur phir 30 tak breadth mark karo"]) {
  const nums = (line.match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) ?? []).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  const sc = numberLineBoard({ kind: "number_line", said: nums }, { spanMs: 5000 });
  if (!sc) { console.log("no board", nums); continue; }
  const g = gateWhiteboard(sc, { reply: line, kit, speechMs: 6000, extraNumbers: nums });
  console.log(nums, "ops", sc.ops.length, "fail:", g.checks.filter((c) => !c.pass).map((c) => c.id + " " + JSON.stringify(c.detail)).join(" | "));
}
