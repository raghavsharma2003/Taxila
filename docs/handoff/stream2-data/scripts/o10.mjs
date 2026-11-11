import { getKit } from "/home/user/Taxila/server/content/index.js";
import { gateCtxFor, codeBoard } from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { claimsCalls } from "/home/user/Taxila/server/stagecraft/claims-board.js";
const text = process.argv[2]; const kit = await getKit("c7-maths-ch08-t01", { generate: false });
for (const mode of ["fresh","continue"]) { const ask = { intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: { topicId: "c7-maths-ch08-t01" }, mode };
console.log(mode, JSON.stringify(claimsCalls(text)), codeBoard(ask, { kit, lessonId: "L" }, gateCtxFor(ask, { kit }))?.template ?? "none"); }
